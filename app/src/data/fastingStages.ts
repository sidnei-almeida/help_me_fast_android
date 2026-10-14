// ═══════════════════════════════════════════════════════════════════
// Fasting stages — what happens in the body hour by hour.
// Single source of truth for the wheel card, the stage card and the
// journey timeline on the Timer screen. Timings are typical ranges for
// a healthy adult; they shift with diet, activity and metabolism.
// ═══════════════════════════════════════════════════════════════════

import { getCurrentPhase } from '../utils/metabolicPhases';

export interface FastingStage {
  id: string;
  /** Hour of the fast at which this stage typically begins. */
  startHours: number;
  title: string;
  /** One-line summary, shown on compact surfaces. */
  summary: string;
  /** What is going on physiologically. */
  happening: string;
  /** What the person may notice. */
  feel: string;
  /** One concrete thing to do right now. */
  focus: string;
}

export const FASTING_STAGES: FastingStage[] = [
  {
    id: 'digesting',
    startHours: 0,
    title: 'Digesting',
    summary: 'Absorbing your last meal.',
    happening:
      'Blood sugar and insulin rise as your last meal is absorbed. Your body uses this incoming energy and stores the surplus as glycogen and fat.',
    feel: 'Satisfied, with normal energy.',
    focus: 'Start hydrating early — a glass of water now makes the next hours easier.',
  },
  {
    id: 'settling',
    startHours: 4,
    title: 'Blood sugar settling',
    summary: 'Insulin returns to baseline.',
    happening:
      'Digestion winds down and insulin drifts back to baseline. Your liver starts releasing stored glycogen to keep blood sugar steady.',
    feel: 'The first hunger cues, often around your usual meal times.',
    focus: 'Water, black coffee or plain tea are all fine and won’t break your fast.',
  },
  {
    id: 'glycogen',
    startHours: 8,
    title: 'Running on glycogen',
    summary: 'Stored sugar is your main fuel.',
    happening:
      'Liver glycogen is now the primary fuel source, and fat cells begin releasing more fatty acids into the bloodstream.',
    feel: 'Hunger in waves. Ghrelin follows your meal schedule, then fades on its own.',
    focus: 'When a wave hits, give it 15–20 minutes. Most pass without you doing anything.',
  },
  {
    id: 'switch',
    startHours: 12,
    title: 'Metabolic switch',
    summary: 'Shifting from sugar to fat.',
    happening:
      'With glycogen running low, your body steadily shifts toward burning fat. The liver starts turning fatty acids into ketones.',
    feel: 'Possibly a brief energy dip before things feel steadier.',
    focus: 'A pinch of salt in water helps if you feel flat or get a headache.',
  },
  {
    id: 'fat-burning',
    startHours: 16,
    title: 'Fat burning',
    summary: 'Fat is now a major fuel.',
    happening:
      'Fat has become a major fuel source and ketone levels are climbing. Insulin is low, which keeps stored fat accessible.',
    feel: 'Many people report steadier focus and quieter hunger from here.',
    focus: 'A light walk now increases fat use without spiking stress hormones.',
  },
  {
    id: 'ketosis',
    startHours: 18,
    title: 'Entering ketosis',
    summary: 'Ketones are fueling your brain.',
    happening:
      'Ketones reach measurable levels and your brain starts using them alongside glucose. Your kidneys excrete more sodium as insulin stays low.',
    feel: 'Lighter and clear-headed — or headachy if electrolytes are low.',
    focus: 'Take electrolytes now: sodium first, then potassium and magnesium.',
  },
  {
    id: 'deep-ketosis',
    startHours: 24,
    title: 'Deep ketosis',
    summary: 'Glycogen depleted, ketones rising.',
    happening:
      'Liver glycogen is largely depleted and ketones keep rising. Cellular recycling (autophagy) is thought to increase, and growth hormone pulses grow larger.',
    feel: 'Hunger is often lower than it was around hour 16.',
    focus: 'Electrolytes are essential from here. Keep intense workouts for after your fast.',
  },
  {
    id: 'growth-hormone',
    startHours: 48,
    title: 'Growth hormone surge',
    summary: 'Your body protects lean mass.',
    happening:
      'Growth hormone can be several times higher than baseline, helping preserve muscle while fat supplies most of your energy. Insulin sensitivity keeps improving.',
    feel: 'Often surprisingly good energy. Sleep may be lighter.',
    focus: 'Magnesium in the evening supports sleep. Avoid heavy training.',
  },
  {
    id: 'renewal',
    startHours: 72,
    title: 'Deep renewal',
    summary: 'Ketones are your primary fuel.',
    happening:
      'Ketones now supply a large share of your brain’s energy. Early research suggests extended fasting may help the immune system recycle old cells.',
    feel: 'Calm and steady, with little hunger.',
    focus: 'Plan your refeed: start small and gentle. Listen closely to how you feel.',
  },
];

export function getStageIndex(hours: number): number {
  let index = 0;
  for (let i = 0; i < FASTING_STAGES.length; i++) {
    if (hours >= FASTING_STAGES[i].startHours) index = i;
  }
  return index;
}

export function getCurrentStage(hours: number): FastingStage {
  return FASTING_STAGES[getStageIndex(hours)];
}

export function getNextStage(hours: number): FastingStage | null {
  return FASTING_STAGES[getStageIndex(hours) + 1] ?? null;
}

/** Brand color of the metabolic phase a stage belongs to. */
export function getStageColor(stage: FastingStage): string {
  return getCurrentPhase(stage.startHours).color;
}

/** Stages worth showing for a given goal: everything up to the goal, plus the one right after it. */
export function getStagesForGoal(goalHours: number): FastingStage[] {
  const upToGoal = FASTING_STAGES.filter((s) => s.startHours <= goalHours);
  const after = FASTING_STAGES.find((s) => s.startHours > goalHours);
  return after ? [...upToGoal, after] : upToGoal;
}
