import { useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { Config, Profile, History } from '../types';
import { calculateTMB } from '../utils/calculateTMB';
import {
  getDefaultVaultPath,
  getLastVaultPath,
  setLastVaultPath,
  clearLastVaultPath,
  readJsonFile,
  writeJsonFile,
  initVault as storageInitVault,
  saveAvatar as storageSaveAvatar,
  loadAvatarAsDataUri,
  addHistoryEntry as storageAddHistoryEntry,
  getHistoryEntries as storageGetHistoryEntries,
  deleteHistoryEntry as storageDeleteHistoryEntry,
} from '../services/vaultStorage';

export function useVault() {
  const { state, dispatch } = useApp();

  const loadConfig = useCallback(
    async (vaultPath: string) => {
      const result = await readJsonFile<Config>(`${vaultPath}/config.json`);
      if (result.success && result.data) {
        dispatch({ type: 'SET_CONFIG', payload: result.data });
      }
    },
    [dispatch]
  );

  const loadProfile = useCallback(
    async (vaultPath: string) => {
      const result = await readJsonFile<Profile>(`${vaultPath}/profile.json`);
      if (!result.success || !result.data) return;
      const profile = result.data;
      if (profile.avatar && !profile.avatar.startsWith('data:')) {
        const dataURI = await loadAvatarAsDataUri(vaultPath, profile.avatar);
        if (dataURI) profile.avatar = dataURI;
        else profile.avatar = undefined;
      }
      dispatch({ type: 'SET_PROFILE', payload: profile });
    },
    [dispatch]
  );

  const loadHistory = useCallback(
    async (vaultPath: string) => {
      const result = await readJsonFile<History>(`${vaultPath}/history.json`);
      if (result.success && result.data) {
        dispatch({ type: 'SET_HISTORY', payload: result.data });
      }
    },
    [dispatch]
  );

  const loadActiveFast = useCallback(
    async (vaultPath: string) => {
      const result = await readJsonFile<{ isActive?: boolean; startTime?: number; targetHours?: number }>(
        `${vaultPath}/active-fast.json`
      );
      if (!result.success || !result.data) return;
      const d = result.data;
      if (d.isActive && d.startTime != null && d.targetHours != null) {
        dispatch({
          type: 'START_FAST',
          payload: { startTime: d.startTime, targetHours: d.targetHours },
        });
      }
    },
    [dispatch]
  );

  const saveActiveFast = useCallback(
    async (data: { isActive: boolean; startTime: number | null; targetHours: number | null }) => {
      if (!state.vaultPath) return;
      await writeJsonFile(`${state.vaultPath}/active-fast.json`, data);
    },
    [state.vaultPath]
  );

  const initializeVault = useCallback(
    async (vaultPath: string) => {
      const initResult = await storageInitVault(vaultPath);
      if (!initResult.success) return false;
      dispatch({ type: 'SET_VAULT_PATH', payload: vaultPath });
      await Promise.all([
        loadConfig(vaultPath),
        loadProfile(vaultPath),
        loadHistory(vaultPath),
        loadActiveFast(vaultPath),
      ]);
      return true;
    },
    [dispatch, loadConfig, loadProfile, loadHistory, loadActiveFast]
  );

  /** No Android: cria vault no diretório padrão do app (sem "escolher pasta"). */
  const createVaultAndContinue = useCallback(async () => {
    const vaultPath = getDefaultVaultPath();
    const success = await initializeVault(vaultPath);
    if (success) {
      await setLastVaultPath(vaultPath);
      return vaultPath;
    }
    return null;
  }, [initializeVault]);

  const saveConfig = useCallback(
    async (config: Config) => {
      if (!state.vaultPath) return false;
      const result = await writeJsonFile(`${state.vaultPath}/config.json`, config);
      if (result.success) dispatch({ type: 'SET_CONFIG', payload: config });
      return result.success;
    },
    [dispatch, state.vaultPath]
  );

  const saveProfile = useCallback(
    async (profile: Profile, vaultPath?: string) => {
      const vault = vaultPath || state.vaultPath;
      if (!vault) return false;
      const profileWithTMB = { ...profile, tmb: profile.tmb || calculateTMB(profile) };
      const result = await writeJsonFile(`${vault}/profile.json`, profileWithTMB);
      return result.success;
    },
    [state.vaultPath]
  );

  const saveHistory = useCallback(
    async (history: History) => {
      if (!state.vaultPath) return false;
      const result = await writeJsonFile(`${state.vaultPath}/history.json`, history);
      if (result.success) dispatch({ type: 'SET_HISTORY', payload: history });
      return result.success;
    },
    [dispatch, state.vaultPath]
  );

  const deleteVault = useCallback(async () => {
    await clearLastVaultPath();
    dispatch({ type: 'RESET_APP' });
  }, [dispatch]);

  const historyAddEntry = useCallback(
    async (entry: { date: string; weight?: number; photoBase64?: string; notes?: string }) => {
      if (!state.vaultPath) return { success: false as const, error: 'No vault' };
      return storageAddHistoryEntry(state.vaultPath, entry);
    },
    [state.vaultPath]
  );

  const historyGetAll = useCallback(async () => {
    if (!state.vaultPath) return { success: true as const, entries: [] };
    return storageGetHistoryEntries(state.vaultPath);
  }, [state.vaultPath]);

  const historyDeleteEntry = useCallback(
    async (entryId: string) => {
      if (!state.vaultPath) return { success: false as const };
      return storageDeleteHistoryEntry(state.vaultPath, entryId);
    },
    [state.vaultPath]
  );

  return {
    vaultPath: state.vaultPath,
    createVaultAndContinue,
    initializeVault,
    loadConfig,
    loadProfile,
    loadHistory,
    loadActiveFast,
    saveConfig,
    saveProfile,
    saveHistory,
    saveActiveFast,
    deleteVault,
    saveAvatarToVault: storageSaveAvatar,
    historyAddEntry,
    historyGetAll,
    historyDeleteEntry,
  };
}
