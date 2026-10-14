import { useMemo } from 'react';
import { useApp } from '../context/AppContext';

export function useMetabolicMotivation(secondsFasted: number, targetHours: number | null) {
  const { state } = useApp();
  const profile = state.profile;

  const fatBurnedInGrams = useMemo(() => {
    if (!profile?.tmb || secondsFasted <= 0) return 0;
    const kcalPerSecond = profile.tmb / 86400;
    const totalKcal = kcalPerSecond * secondsFasted;
    return parseFloat((totalKcal * (1000 / 7700)).toFixed(4));
  }, [profile?.tmb, secondsFasted]);

  const projectedFinalWeightLoss = useMemo(() => {
    if (!profile?.tmb || !targetHours || targetHours <= 0) return 0;
    const targetSeconds = targetHours * 3600;
    const kcalPerSecond = profile.tmb / 86400;
    return parseFloat(((kcalPerSecond * targetSeconds) / 7700).toFixed(3));
  }, [profile?.tmb, targetHours]);

  const caloriesBurned = useMemo(() => {
    if (!profile?.tmb || secondsFasted <= 0) return 0;
    return Math.round((profile.tmb / 86400) * secondsFasted);
  }, [profile?.tmb, secondsFasted]);

  const projectedCalories = useMemo(() => {
    if (!profile?.tmb || !targetHours || targetHours <= 0) return 0;
    return Math.round((profile.tmb / 86400) * targetHours * 3600);
  }, [profile?.tmb, targetHours]);

  return {
    fatBurnedInGrams,
    projectedFinalWeightLoss,
    caloriesBurned,
    projectedCalories,
  };
}
