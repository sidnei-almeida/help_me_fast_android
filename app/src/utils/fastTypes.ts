import { FastType } from '../types';

export const COMMON_FAST_TYPES: FastType[] = [
  { id: '16-8', name: '16:8 Int.', hours: 16, isCustom: false },
  { id: '18-6', name: '18:6 Int.', hours: 18, isCustom: false },
  { id: '20-4', name: '20:4 Int.', hours: 20, isCustom: false },
  { id: '24h', name: '1 Day', hours: 24, isCustom: false },
  { id: '36h', name: '1.5 Days', hours: 36, isCustom: false },
  { id: '48h', name: '2 Days', hours: 48, isCustom: false },
  { id: '72h', name: '3 Days', hours: 72, isCustom: false },
  { id: '96h', name: '4 Days', hours: 96, isCustom: false },
  { id: '120h', name: '5 Days', hours: 120, isCustom: false },
  { id: '168h', name: '7 Days', hours: 168, isCustom: false },
];

export function createCustomFastType(hours: number): FastType {
  return {
    id: `custom-${hours}h`,
    name: 'Custom',
    hours,
    isCustom: true,
  };
}
