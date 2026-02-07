/**
 * History (progress) entries: weight + optional photo + note.
 * Persists list in AsyncStorage and photos in documentDirectory/photos/.
 */
import { useState, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';

const STORAGE_KEY = '@app_history';
const PHOTOS_DIR = `${FileSystem.documentDirectory ?? ''}photos/`;

export interface HistoryEntry {
  id: string;
  date: string;
  /** ISO string when the entry was saved; used to order same-day entries (newest first). */
  createdAt?: string;
  weight?: number;
  photoUri?: string;
  note?: string;
}

export interface SaveEntryInput {
  date: string;
  weight?: number;
  photoUri?: string;
  note?: string;
}

function generateId(): string {
  return `entry_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

async function ensurePhotosDir(): Promise<void> {
  const info = await FileSystem.getInfoAsync(PHOTOS_DIR);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(PHOTOS_DIR, { intermediates: true });
  }
}

/** Copy temp photo to permanent path; returns new path or undefined on failure. */
async function persistPhoto(tempUri: string, entryId: string): Promise<string | undefined> {
  try {
    await ensurePhotosDir();
    const ext = tempUri.toLowerCase().includes('.png') ? 'png' : 'jpg';
    const fileName = `photo_${entryId}.${ext}`;
    const destPath = `${PHOTOS_DIR}${fileName}`;
    try {
      await FileSystem.copyAsync({ from: tempUri, to: destPath });
    } catch {
      const base64 = await FileSystem.readAsStringAsync(tempUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      await FileSystem.writeAsStringAsync(destPath, base64, {
        encoding: FileSystem.EncodingType.Base64,
      });
    }
    return destPath;
  } catch {
    return undefined;
  }
}

export function useHistoryStorage() {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const loadEntries = useCallback(async () => {
    setLoading(true);
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      const list: HistoryEntry[] = raw ? JSON.parse(raw) : [];
      list.sort((a, b) => {
        const byDate = new Date(b.date).getTime() - new Date(a.date).getTime();
        if (byDate !== 0) return byDate;
        const aCreated = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bCreated = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return bCreated - aCreated;
      });
      setEntries(list);
    } catch {
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  const saveEntry = useCallback(
    async (input: SaveEntryInput): Promise<{ success: boolean; entry?: HistoryEntry; error?: string }> => {
      try {
        const id = generateId();
        let photoUri: string | undefined = input.photoUri;
        if (input.photoUri && (input.photoUri.startsWith('file:') || input.photoUri.startsWith('content:'))) {
          const persisted = await persistPhoto(input.photoUri, id);
          photoUri = persisted;
        }
        const createdAt = new Date().toISOString();
        const entry: HistoryEntry = {
          id,
          date: input.date,
          createdAt,
          ...(input.weight !== undefined && { weight: input.weight }),
          ...(photoUri && { photoUri }),
          ...(input.note && { note: input.note }),
        };
        const next = [entry, ...entries];
        next.sort((a, b) => {
          const byDate = new Date(b.date).getTime() - new Date(a.date).getTime();
          if (byDate !== 0) return byDate;
          const aCreated = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const bCreated = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return bCreated - aCreated;
        });
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        setEntries(next);
        return { success: true, entry };
      } catch (e) {
        return { success: false, error: (e as Error).message };
      }
    },
    [entries]
  );

  const deleteEntry = useCallback(
    async (id: string): Promise<{ success: boolean; error?: string }> => {
      try {
        const entry = entries.find((e) => e.id === id);
        if (entry?.photoUri) {
          try {
            await FileSystem.deleteAsync(entry.photoUri, { idempotent: true });
          } catch { /* ignore */ }
        }
        const next = entries.filter((e) => e.id !== id);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        setEntries(next);
        return { success: true };
      } catch (e) {
        return { success: false, error: (e as Error).message };
      }
    },
    [entries]
  );

  const initialWeight = entries.length > 0
    ? entries[entries.length - 1]?.weight
    : undefined;
  const currentWeight = entries.length > 0
    ? entries[0]?.weight
    : undefined;

  return {
    entries,
    loading,
    loadEntries,
    saveEntry,
    deleteEntry,
    initialWeight,
    currentWeight,
  };
}
