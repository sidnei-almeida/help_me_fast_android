import { Profile } from '../types';
import { calculateTDEE } from './activityMultipliers';

export function calculateBMR(profile: Profile): number {
  const { weight, height, age, gender } = profile;
  const baseBMR = 10 * weight + 6.25 * height - 5 * age;
  return gender === 'male' ? baseBMR + 5 : baseBMR - 161;
}

export function calculateTMB(profile: Profile): number {
  const bmr = calculateBMR(profile);
  return calculateTDEE(bmr, profile.activityLevel);
}
