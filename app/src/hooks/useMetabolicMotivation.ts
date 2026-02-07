import { useMemo } from 'react';
import { useApp } from '../context/AppContext';

const MOTIVATIONAL_MESSAGES = [
  { hours: 0, message: 'Digestion Phase: Enjoy the energy from your last meal.', phase: 'Anabolic' },
  { hours: 4, message: 'Insulin Normalizing: Your body is preparing for metabolic transition.', phase: 'Catabolic' },
  { hours: 8, message: 'Glycogen in Use: Energy reserves being mobilized.', phase: 'Catabolic' },
  { hours: 12, message: 'Low Insulin: The door to fat burning has opened.', phase: 'Catabolic' },
  { hours: 16, message: 'Peak Focus: BDNF increasing.', phase: 'Fat Burning' },
  { hours: 18, message: 'Autophagy Activated: Cellular cleanup in progress.', phase: 'Fat Burning' },
  { hours: 20, message: 'Intensified Fat Burning: Metabolism optimized.', phase: 'Fat Burning' },
  { hours: 24, message: 'Ketosis Established: Maximum fat burning efficiency.', phase: 'Ketosis' },
  { hours: 36, message: 'Deep Autophagy: Cellular regeneration at peak.', phase: 'Ketosis' },
  { hours: 48, message: 'Elevated Growth Hormone: Accelerated recovery and repair.', phase: 'Ketosis' },
  { hours: 72, message: 'Advanced Fasting State: Metabolic benefits maximized.', phase: 'Ketosis' },
  { hours: 96, message: 'Mental Resilience: Clarity and focus at elevated levels.', phase: 'Ketosis' },
  { hours: 120, message: 'Prolonged Fast: Complete metabolic transformation.', phase: 'Ketosis' },
];

export function useMetabolicMotivation(secondsFasted: number, targetHours: number | null) {
  const { state } = useApp();
  const profile = state.profile;

  const fatBurnedInGrams = useMemo(() => {
    if (!profile?.tmb || secondsFasted <= 0) return 0;
    const kcalPerSecond = profile.tmb / 86400;
    const totalKcal = kcalPerSecond * secondsFasted;
    return parseFloat((totalKcal * (1000 / 7700)).toFixed(4));
  }, [profile?.tmb, secondsFasted]);

  const currentMessage = useMemo(() => {
    const hoursFasted = secondsFasted / 3600;
    let selected = MOTIVATIONAL_MESSAGES[0];
    for (let i = MOTIVATIONAL_MESSAGES.length - 1; i >= 0; i--) {
      if (hoursFasted >= MOTIVATIONAL_MESSAGES[i].hours) {
        selected = MOTIVATIONAL_MESSAGES[i];
        break;
      }
    }
    return selected;
  }, [secondsFasted]);

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
    currentMessage,
    projectedFinalWeightLoss,
    caloriesBurned,
    projectedCalories,
  };
}
