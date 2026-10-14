import { useState, useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { useVault } from './useVault';
import { FastEntry } from '../types';
import { scheduleFastNotifications, cancelFastNotifications } from '../services/notifications';

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
    async (targetHours: number, startTime: number = Date.now()) => {
      dispatch({ type: 'START_FAST', payload: { startTime, targetHours } });
      await saveActiveFast({ isActive: true, startTime, targetHours });
      scheduleFastNotifications(startTime, targetHours);
    },
    [dispatch, saveActiveFast]
  );

  /** Moves the start of the running fast (e.g. "I actually stopped eating at 20:00"). */
  const updateStartTime = useCallback(
    async (startTime: number) => {
      const targetHours = state.currentFast.targetHours;
      if (!state.currentFast.isActive || !targetHours) return;
      dispatch({ type: 'START_FAST', payload: { startTime, targetHours } });
      await saveActiveFast({ isActive: true, startTime, targetHours });
      scheduleFastNotifications(startTime, targetHours);
    },
    [dispatch, saveActiveFast, state.currentFast.isActive, state.currentFast.targetHours]
  );

  const endFast = useCallback(
    async () => {
      if (!state.currentFast.startTime || !state.vaultPath) return;
      const endTime = Date.now();
      const duration = Math.floor((endTime - state.currentFast.startTime) / 1000);
      const weightLoss = calculateWeightLoss(duration, state.profile?.tmb || 0);
      const newEntry: FastEntry = {
        id: `fast-${Date.now()}`,
        startTime: state.currentFast.startTime,
        endTime,
        duration,
        weightLoss,
        ...(state.currentFast.targetHours != null && { targetHours: state.currentFast.targetHours }),
      };
      const history = state.history ?? { fasts: [], progressEntries: [] };
      const updatedHistory = {
        ...history,
        fasts: [...(history.fasts ?? []), newEntry],
      };
      await saveHistory(updatedHistory);
      await saveActiveFast({ isActive: false, startTime: null, targetHours: null });
      cancelFastNotifications();
      dispatch({ type: 'END_FAST' });
      setElapsedSeconds(0);
    },
    [
      dispatch,
      state.currentFast.startTime,
      state.currentFast.targetHours,
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
    const compute = () => Math.max(0, Math.floor((Date.now() - state.currentFast.startTime!) / 1000));
    setElapsedSeconds(compute());
    const interval = setInterval(() => setElapsedSeconds(compute()), 1000);
    return () => clearInterval(interval);
  }, [state.currentFast.isActive, state.currentFast.startTime]);

  const targetHours = state.currentFast.targetHours;
  const targetTotalSeconds = targetHours ? targetHours * 3600 : 0;
  const progress = targetHours ? Math.min(elapsedSeconds / targetTotalSeconds, 1) : 0;
  const remainingSeconds = Math.max(targetTotalSeconds - elapsedSeconds, 0);
  const goalReached = !!targetHours && elapsedSeconds >= targetTotalSeconds;
  const overtimeSeconds = goalReached ? elapsedSeconds - targetTotalSeconds : 0;

  return {
    isActive: state.currentFast.isActive,
    startTime: state.currentFast.startTime,
    elapsedSeconds,
    hours: Math.floor(elapsedSeconds / 3600),
    minutes: Math.floor((elapsedSeconds % 3600) / 60),
    seconds: elapsedSeconds % 60,
    countdownHours: Math.floor(remainingSeconds / 3600),
    countdownMinutes: Math.floor((remainingSeconds % 3600) / 60),
    countdownSeconds: remainingSeconds % 60,
    remainingSeconds,
    goalReached,
    overtimeSeconds,
    weightLoss: calculateWeightLoss(elapsedSeconds, state.profile?.tmb || 0),
    targetHours,
    progress,
    startFast,
    updateStartTime,
    endFast,
  };
}
