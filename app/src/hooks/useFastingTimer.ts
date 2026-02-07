import { useState, useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { useVault } from './useVault';
import { FastEntry } from '../types';

function calculateWeightLoss(seconds: number, tmb: number): number {
  const kcalPerSecond = tmb / 86400;
  const kgPerKcal = 1 / 7700;
  return kcalPerSecond * seconds * kgPerKcal;
}

export function useFastingTimer() {
  const { state, dispatch } = useApp();
  const { saveHistory, saveActiveFast } = useVault();
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const startFast = useCallback(
    async (targetHours: number) => {
      const startTime = Date.now();
      dispatch({ type: 'START_FAST', payload: { startTime, targetHours } });
      await saveActiveFast({ isActive: true, startTime, targetHours });
    },
    [dispatch, saveActiveFast]
  );

  const endFast = useCallback(
    async () => {
      if (!state.currentFast.startTime || !state.vaultPath || !state.history) return;
      const endTime = Date.now();
      const duration = Math.floor((endTime - state.currentFast.startTime) / 1000);
      const weightLoss = calculateWeightLoss(duration, state.profile?.tmb || 0);
      const newEntry: FastEntry = {
        id: `fast-${Date.now()}`,
        startTime: state.currentFast.startTime,
        endTime,
        duration,
        weightLoss,
      };
      const updatedHistory = {
        ...state.history,
        fasts: [...state.history.fasts, newEntry],
      };
      await saveHistory(updatedHistory);
      await saveActiveFast({ isActive: false, startTime: null, targetHours: null });
      dispatch({ type: 'END_FAST' });
      setElapsedSeconds(0);
    },
    [
      dispatch,
      state.currentFast.startTime,
      state.vaultPath,
      state.history,
      state.profile?.tmb,
      saveHistory,
      saveActiveFast,
    ]
  );

  useEffect(() => {
    if (!state.currentFast.isActive || !state.currentFast.startTime) {
      setElapsedSeconds(0);
      return;
    }
    const compute = () => Math.floor((Date.now() - state.currentFast.startTime!) / 1000);
    setElapsedSeconds(compute());
    const interval = setInterval(() => setElapsedSeconds(compute()), 1000);
    return () => clearInterval(interval);
  }, [state.currentFast.isActive, state.currentFast.startTime]);

  const targetHours = state.currentFast.targetHours;
  const targetTotalSeconds = targetHours ? targetHours * 3600 : 0;
  const progress = targetHours ? Math.min(elapsedSeconds / targetTotalSeconds, 1) : 0;
  const remainingSeconds = Math.max(targetTotalSeconds - elapsedSeconds, 0);

  return {
    isActive: state.currentFast.isActive,
    elapsedSeconds,
    hours: Math.floor(elapsedSeconds / 3600),
    minutes: Math.floor((elapsedSeconds % 3600) / 60),
    seconds: elapsedSeconds % 60,
    countdownHours: Math.floor(remainingSeconds / 3600),
    countdownMinutes: Math.floor((remainingSeconds % 3600) / 60),
    countdownSeconds: remainingSeconds % 60,
    remainingSeconds,
    weightLoss: calculateWeightLoss(elapsedSeconds, state.profile?.tmb || 0),
    targetHours,
    progress,
    startFast,
    endFast,
  };
}
