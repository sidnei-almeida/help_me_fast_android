export interface MetabolicPhase {
  name: string;
  color: string;
  startHours: number;
  endHours: number;
}

export const METABOLIC_PHASES: MetabolicPhase[] = [
  { name: 'Anabolic', color: '#38B2AC', startHours: 0, endHours: 4 },
  { name: 'Catabolic', color: '#ECC94B', startHours: 4, endHours: 16 },
  { name: 'Fat Burning', color: '#ED8936', startHours: 16, endHours: 24 },
  { name: 'Ketosis', color: '#D53F8C', startHours: 24, endHours: Infinity },
];

export function getCurrentPhase(hours: number): MetabolicPhase {
  return (
    METABOLIC_PHASES.find((p) => hours >= p.startHours && hours < p.endHours) ||
    METABOLIC_PHASES[METABOLIC_PHASES.length - 1]
  );
}

export function getPhaseProgress(hours: number): number {
  const phase = getCurrentPhase(hours);
  if (phase.endHours === Infinity) {
    return Math.min((hours - phase.startHours) / 24, 1);
  }
  const duration = phase.endHours - phase.startHours;
  return Math.min((hours - phase.startHours) / duration, 1);
}

export function isDangerZone(
  _hours: number,
  dangerZones: Array<{ start: number; end: number }>
): boolean {
  const currentHour = new Date().getHours();
  return dangerZones.some((z) => currentHour >= z.start && currentHour < z.end);
}
