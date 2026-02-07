export type WeightUnit = 'kg' | 'lbs';

export function kgToLbs(kg: number): number {
  return kg * 2.20462;
}

export function lbsToKg(lbs: number): number {
  return lbs / 2.20462;
}

export function formatWeight(kg: number, unit: WeightUnit): string {
  if (unit === 'lbs') return kgToLbs(kg).toFixed(1);
  return kg.toFixed(1);
}

export function parseWeight(value: string, unit: WeightUnit): number {
  const num = parseFloat(value);
  if (isNaN(num) || num <= 0) return 0;
  if (unit === 'lbs') return lbsToKg(num);
  return num;
}
