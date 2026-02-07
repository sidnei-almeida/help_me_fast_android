/**
 * Activity level multipliers for calculating Total Daily Energy Expenditure (TDEE)
 */
export const ACTIVITY_MULTIPLIERS = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

export function calculateTDEE(bmr: number, activityLevel: keyof typeof ACTIVITY_MULTIPLIERS): number {
  return bmr * ACTIVITY_MULTIPLIERS[activityLevel];
}
