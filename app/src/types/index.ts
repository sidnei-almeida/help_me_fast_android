/**
 * Tipos do Help Me Fast — espelho do projeto Electron.
 */
export interface Config {
  vaultPath: string;
  theme: 'dark' | 'light';
  notifications: boolean;
  dangerZones: Array<{ start: number; end: number }>;
  weightUnit: 'kg' | 'lbs';
}

export interface Profile {
  name?: string;
  avatar?: string;
  weight: number;
  height: number;
  tmb: number;
  age: number;
  gender: 'male' | 'female';
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
}

export interface FastType {
  id: string;
  name: string;
  hours: number;
  isCustom: boolean;
}

export interface FastGoal {
  targetHours: number;
  fastType: FastType | null;
}

export interface FastEntry {
  id: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  weightLoss?: number;
}

export interface ProgressEntry {
  id: string;
  date: string;
  weight?: number;
  photoPath?: string;
  notes?: string;
}

export interface ProgressEntryWithPhoto extends ProgressEntry {
  photoBase64?: string | null;
}

export interface History {
  fasts: FastEntry[];
  progressEntries?: ProgressEntry[];
}

export type ActiveView = 'timer' | 'history' | 'profile';

export interface AppState {
  vaultPath: string | null;
  config: Config | null;
  profile: Profile | null;
  history: History | null;
  fastGoal: FastGoal | null;
  activeView: ActiveView;
  currentFast: {
    startTime: number | null;
    isActive: boolean;
    targetHours: number | null;
  };
}

export type AppAction =
  | { type: 'SET_VAULT_PATH'; payload: string }
  | { type: 'SET_CONFIG'; payload: Config }
  | { type: 'SET_PROFILE'; payload: Profile }
  | { type: 'SET_HISTORY'; payload: History }
  | { type: 'SET_FAST_GOAL'; payload: FastGoal }
  | { type: 'SET_ACTIVE_VIEW'; payload: ActiveView }
  | { type: 'START_FAST'; payload: { startTime: number; targetHours: number } }
  | { type: 'END_FAST' }
  | { type: 'UPDATE_PROFILE'; payload: Partial<Profile> }
  | { type: 'RESET_APP' };
