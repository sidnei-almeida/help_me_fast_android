import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { AppState, AppAction } from '../types';

const initialState: AppState = {
  vaultPath: null,
  config: null,
  profile: null,
  history: null,
  fastGoal: null,
  activeView: 'timer',
  currentFast: {
    startTime: null,
    isActive: false,
    targetHours: null,
  },
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_VAULT_PATH':
      return { ...state, vaultPath: action.payload };
    case 'SET_CONFIG':
      return { ...state, config: action.payload };
    case 'SET_PROFILE':
      return { ...state, profile: action.payload };
    case 'SET_HISTORY':
      return { ...state, history: action.payload };
    case 'SET_FAST_GOAL':
      return { ...state, fastGoal: action.payload };
    case 'SET_ACTIVE_VIEW':
      return { ...state, activeView: action.payload };
    case 'START_FAST':
      return {
        ...state,
        currentFast: {
          startTime: action.payload.startTime,
          targetHours: action.payload.targetHours,
          isActive: true,
        },
      };
    case 'END_FAST':
      return {
        ...state,
        currentFast: {
          startTime: null,
          isActive: false,
          targetHours: null,
        },
      };
    case 'UPDATE_PROFILE':
      return {
        ...state,
        profile: state.profile ? { ...state.profile, ...action.payload } : null,
      };
    case 'RESET_APP':
      return { ...initialState };
    default:
      return state;
  }
}

interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
