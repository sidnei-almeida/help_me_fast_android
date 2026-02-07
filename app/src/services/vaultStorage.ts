/**
 * Serviço de armazenamento do vault — substitui a API Electron no Android.
 * Usa expo-file-system para JSON e imagens; AsyncStorage para último vault.
 */
import * as FileSystem from 'expo-file-system/legacy';
import AsyncStorage from '@react-native-async-storage/async-storage';

const VAULT_KEY = '@help_me_fast_last_vault';
const VAULT_FOLDER_NAME = 'HelpMeFastVault';

export function getDefaultVaultPath(): string {
  return `${FileSystem.documentDirectory}${VAULT_FOLDER_NAME}`;
}

export async function getLastVaultPath(): Promise<string | null> {
  const path = await AsyncStorage.getItem(VAULT_KEY);
  if (!path) return null;
  const exists = await FileSystem.getInfoAsync(path, { type: 'directory' }).then(
    (i) => i.exists
  ).catch(() => false);
  if (!exists) return null;
  const configPath = `${path}/config.json`;
  const configExists = await FileSystem.getInfoAsync(configPath).then(
    (i) => i.exists
  ).catch(() => false);
  return configExists ? path : null;
}

export async function setLastVaultPath(path: string): Promise<void> {
  await AsyncStorage.setItem(VAULT_KEY, path);
}

export async function clearLastVaultPath(): Promise<void> {
  await AsyncStorage.removeItem(VAULT_KEY);
}

export async function readJsonFile<T = unknown>(filePath: string): Promise<{ success: true; data: T } | { success: false; error: string }> {
  try {
    const content = await FileSystem.readAsStringAsync(filePath, {
      encoding: FileSystem.EncodingType.UTF8,
    });
    return { success: true, data: JSON.parse(content) as T };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

export async function writeJsonFile(filePath: string, data: unknown): Promise<{ success: boolean; error?: string }> {
  try {
    const dir = filePath.replace(/\/[^/]+$/, '');
    const dirInfo = await FileSystem.getInfoAsync(dir);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
    }
    await FileSystem.writeAsStringAsync(
      filePath,
      JSON.stringify(data, null, 2),
      { encoding: FileSystem.EncodingType.UTF8 }
    );
    return { success: true };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

export async function fileExists(filePath: string): Promise<boolean> {
  const info = await FileSystem.getInfoAsync(filePath);
  return info.exists;
}

export async function initVault(vaultPath: string): Promise<{ success: boolean; error?: string }> {
  try {
    const dirInfo = await FileSystem.getInfoAsync(vaultPath);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(vaultPath, { intermediates: true });
    }

    const configPath = `${vaultPath}/config.json`;
    const profilePath = `${vaultPath}/profile.json`;
    const historyPath = `${vaultPath}/history.json`;

    const defaultConfig = {
      vaultPath,
      theme: 'light',
      notifications: true,
      dangerZones: [{ start: 18, end: 20 }],
      weightUnit: 'kg',
    };
    const defaultProfile = {
      name: '',
      weight: 0,
      height: 0,
      tmb: 0,
      age: 0,
      gender: 'male',
      activityLevel: 'moderate',
    };
    const defaultHistory = { fasts: [], progressEntries: [] };

    if (!(await fileExists(configPath))) {
      await writeJsonFile(configPath, defaultConfig);
    }
    if (!(await fileExists(profilePath))) {
      await writeJsonFile(profilePath, defaultProfile);
    }
    if (!(await fileExists(historyPath))) {
      await writeJsonFile(historyPath, defaultHistory);
    }

    return { success: true };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

export async function saveAvatar(vaultPath: string, imageDataBase64: string): Promise<{ success: boolean; avatarPath?: string; error?: string }> {
  try {
    const match = imageDataBase64.match(/^data:image\/\w+;base64,(.+)$/);
    if (!match) return { success: false, error: 'Invalid image data' };
    const base64 = match[1];
    const avatarPath = `${vaultPath}/avatar.png`;
    await FileSystem.writeAsStringAsync(avatarPath, base64, {
      encoding: FileSystem.EncodingType.Base64,
    });
    return { success: true, avatarPath: 'avatar.png' };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

export async function loadAvatarAsDataUri(vaultPath: string, relativePath: string): Promise<string | null> {
  try {
    const fullPath = relativePath.startsWith('/') ? relativePath : `${vaultPath}/${relativePath}`;
    const exists = await fileExists(fullPath);
    if (!exists) return null;
    const base64 = await FileSystem.readAsStringAsync(fullPath, {
      encoding: FileSystem.EncodingType.Base64,
    });
    return `data:image/png;base64,${base64}`;
  } catch {
    return null;
  }
}

// ─── History entries (progress entries with optional photo) ───────────

export interface AddEntryInput {
  date: string;
  weight?: number;
  photoBase64?: string;
  notes?: string;
}

export interface ProgressEntryWithPhoto {
  id: string;
  date: string;
  weight?: number;
  photoPath?: string;
  notes?: string;
  photoBase64?: string | null;
}

export async function addHistoryEntry(
  vaultPath: string,
  entry: AddEntryInput
): Promise<{ success: boolean; entry?: { id: string; date: string; weight?: number; photoPath?: string; notes?: string }; error?: string }> {
  try {
    const historyPath = `${vaultPath}/history.json`;
    let history: { fasts: unknown[]; progressEntries: ProgressEntryWithPhoto[] } = { fasts: [], progressEntries: [] };
    try {
      const res = await readJsonFile<typeof history>(historyPath);
      if (res.success) history = res.data;
      if (!history.progressEntries) history.progressEntries = [];
    } catch { /* use default */ }

    const id = `entry_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    let photoPath: string | undefined;
    if (entry.photoBase64) {
      const photosDir = `${vaultPath}/photos`;
      const dirInfo = await FileSystem.getInfoAsync(photosDir);
      if (!dirInfo.exists) await FileSystem.makeDirectoryAsync(photosDir, { intermediates: true });
      const match = entry.photoBase64.match(/^data:image\/(\w+);base64,(.+)$/);
      if (match) {
        const ext = match[1] === 'jpeg' ? 'jpg' : match[1];
        const fileName = `photo_${Date.now()}.${ext}`;
        const fullPath = `${photosDir}/${fileName}`;
        await FileSystem.writeAsStringAsync(fullPath, match[2], { encoding: FileSystem.EncodingType.Base64 });
        photoPath = `photos/${fileName}`;
      }
    }

    const newEntry = {
      id,
      date: entry.date,
      ...(entry.weight !== undefined && { weight: entry.weight }),
      ...(photoPath && { photoPath }),
      ...(entry.notes && { notes: entry.notes }),
    };
    history.progressEntries.push(newEntry);
    history.progressEntries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    await writeJsonFile(historyPath, history);
    return { success: true, entry: newEntry };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

export async function getHistoryEntries(vaultPath: string): Promise<{ success: boolean; entries?: ProgressEntryWithPhoto[]; error?: string }> {
  try {
    const historyPath = `${vaultPath}/history.json`;
    const res = await readJsonFile<{ progressEntries?: ProgressEntryWithPhoto[] }>(historyPath);
    let entries = res.success && res.data.progressEntries ? res.data.progressEntries : [];
    entries = await Promise.all(
      entries.map(async (e) => {
        let photoBase64: string | null = null;
        if (e.photoPath) {
          const fullPath = `${vaultPath}/${e.photoPath}`;
          const exists = await fileExists(fullPath);
          if (exists) {
            const base64 = await FileSystem.readAsStringAsync(fullPath, { encoding: FileSystem.EncodingType.Base64 });
            photoBase64 = `data:image/png;base64,${base64}`;
          }
        }
        return { ...e, photoBase64 };
      })
    );
    entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return { success: true, entries };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

export async function deleteHistoryEntry(vaultPath: string, entryId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const historyPath = `${vaultPath}/history.json`;
    const res = await readJsonFile<{ progressEntries: ProgressEntryWithPhoto[] }>(historyPath);
    if (!res.success || !res.data.progressEntries) return { success: true };
    const entry = res.data.progressEntries.find((e) => e.id === entryId);
    if (entry?.photoPath) {
      const fullPath = `${vaultPath}/${entry.photoPath}`;
      await FileSystem.deleteAsync(fullPath, { idempotent: true });
    }
    const progressEntries = res.data.progressEntries.filter((e) => e.id !== entryId);
    await writeJsonFile(historyPath, { ...res.data, progressEntries });
    return { success: true };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}
