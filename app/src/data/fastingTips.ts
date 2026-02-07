// ═══════════════════════════════════════════════════════════════════
// Dynamic Fasting Tips — categorized by phase and topic
// Sources: PubMed, Dr. Jason Fung, Dr. Mindy Pelz, Cole Robinson (Snake Diet)
// ═══════════════════════════════════════════════════════════════════

export type TipCategory =
  | 'electrolytes'
  | 'hydration'
  | 'activity'
  | 'science'
  | 'mental'
  | 'safety'
  | 'breaking'
  | 'motivation'

export interface FastingTip {
  id: string
  text: string
  category: TipCategory
  /** Minimum hours fasted for this tip to be relevant */
  minHours: number
  /** Maximum hours (Infinity = always relevant after minHours) */
  maxHours: number
  /** Optional source/reference */
  source?: string
}

// ─── Electrolytes & Snake Juice ─────────────────────────────────────

const electrolyteTips: FastingTip[] = [
  {
    id: 'elec-01',
    text: 'Electrolytes are non-negotiable during extended fasts. Sodium, potassium, and magnesium prevent cramps, headaches, and fatigue.',
    category: 'electrolytes',
    minHours: 0,
    maxHours: Infinity,
  },
  {
    id: 'elec-02',
    text: 'Snake Juice recipe: 2L water + 1 tsp potassium chloride (NoSalt) + 1/2 tsp Himalayan salt + 1 tsp baking soda + 1/2 tsp magnesium sulfate. Sip throughout the day.',
    category: 'electrolytes',
    minHours: 0,
    maxHours: Infinity,
    source: 'Cole Robinson — Snake Diet',
  },
  {
    id: 'elec-03',
    text: 'Feeling dizzy or lightheaded? That\'s almost always low sodium, not hunger. A pinch of salt under your tongue gives immediate relief.',
    category: 'electrolytes',
    minHours: 4,
    maxHours: Infinity,
  },
  {
    id: 'elec-04',
    text: 'Your kidneys flush sodium faster during fasting because insulin is low. You need 2-3x more sodium than normal — around 2000-3000mg/day.',
    category: 'electrolytes',
    minHours: 8,
    maxHours: Infinity,
    source: 'Dr. Jason Fung — The Complete Guide to Fasting',
  },
  {
    id: 'elec-05',
    text: 'Potassium prevents muscle cramps and heart palpitations during fasting. NoSalt or Nu-Salt (potassium chloride) is the cheapest source — about 1300mg per teaspoon.',
    category: 'electrolytes',
    minHours: 8,
    maxHours: Infinity,
  },
  {
    id: 'elec-06',
    text: 'Magnesium is the "calm" mineral. Low magnesium causes anxiety, insomnia, and muscle twitching during fasts. Take 200-400mg of magnesium citrate or glycinate.',
    category: 'electrolytes',
    minHours: 12,
    maxHours: Infinity,
  },
  {
    id: 'elec-07',
    text: 'The "keto flu" during fasting is NOT inevitable — it\'s electrolyte deficiency. Proper supplementation eliminates headaches, brain fog, and nausea completely.',
    category: 'electrolytes',
    minHours: 16,
    maxHours: Infinity,
  },
  {
    id: 'elec-08',
    text: 'Bone broth is an excellent electrolyte source if you prefer whole foods over supplements. It provides sodium, potassium, magnesium, and collagen with minimal calories.',
    category: 'electrolytes',
    minHours: 0,
    maxHours: Infinity,
  },
  {
    id: 'elec-09',
    text: 'Don\'t chug Snake Juice all at once — sip it throughout the day. Too much potassium at once can cause nausea. Your body absorbs small doses better.',
    category: 'electrolytes',
    minHours: 0,
    maxHours: Infinity,
  },
  {
    id: 'elec-10',
    text: 'For fasts over 48h, electrolytes become critical. Your body\'s reserves deplete. Consistent Snake Juice or electrolyte supplementation is the difference between feeling great and feeling terrible.',
    category: 'electrolytes',
    minHours: 36,
    maxHours: Infinity,
  },
  {
    id: 'elec-11',
    text: 'Baking soda (sodium bicarbonate) in Snake Juice helps maintain pH balance and reduces stomach acid discomfort. Start with 1/2 tsp if you\'re new to it.',
    category: 'electrolytes',
    minHours: 12,
    maxHours: Infinity,
  },
  {
    id: 'elec-12',
    text: 'Epsom salt (magnesium sulfate) in Snake Juice has a mild laxative effect. If that bothers you, swap it for magnesium citrate capsules instead.',
    category: 'electrolytes',
    minHours: 0,
    maxHours: Infinity,
  },
]

// ─── Hydration ──────────────────────────────────────────────────────

const hydrationTips: FastingTip[] = [
  {
    id: 'hydr-01',
    text: 'Aim for 2-3 liters of water per day while fasting. Your body releases water as glycogen depletes — you need to replace it.',
    category: 'hydration',
    minHours: 0,
    maxHours: Infinity,
  },
  {
    id: 'hydr-02',
    text: 'Black coffee and plain tea are fine during fasting — they don\'t break your fast and can suppress appetite. But they\'re diuretics, so drink extra water.',
    category: 'hydration',
    minHours: 0,
    maxHours: Infinity,
  },
  {
    id: 'hydr-03',
    text: 'Your urine should be light yellow. Clear = overhydrated (flushing electrolytes). Dark yellow = dehydrated. Pale straw color is perfect.',
    category: 'hydration',
    minHours: 4,
    maxHours: Infinity,
  },
  {
    id: 'hydr-04',
    text: 'Sparkling water can help with hunger pangs — the carbonation fills your stomach temporarily and the bubbles trick your brain into feeling "full".',
    category: 'hydration',
    minHours: 8,
    maxHours: Infinity,
  },
  {
    id: 'hydr-05',
    text: 'Apple cider vinegar (1 tbsp in water) can reduce hunger and blood sugar spikes when you eventually eat. It technically has ~3 calories — negligible for fasting purposes.',
    category: 'hydration',
    minHours: 0,
    maxHours: Infinity,
  },
  {
    id: 'hydr-06',
    text: 'Water with a pinch of salt absorbs better than plain water. Your intestines need sodium to transport water into cells — plain water can actually flush electrolytes.',
    category: 'hydration',
    minHours: 0,
    maxHours: Infinity,
  },
]

// ─── Activity & Exercise ────────────────────────────────────────────

const activityTips: FastingTip[] = [
  {
    id: 'act-01',
    text: 'Walking is the best exercise during fasting. 30-60 minutes of Zone 2 cardio (you can hold a conversation) maximizes fat oxidation without cortisol spikes.',
    category: 'activity',
    minHours: 0,
    maxHours: Infinity,
  },
  {
    id: 'act-02',
    text: 'Fasted weight training depletes glycogen faster, accelerating the switch to fat burning. Keep volume moderate — your recovery is slower without food.',
    category: 'activity',
    minHours: 4,
    maxHours: 24,
  },
  {
    id: 'act-03',
    text: 'Avoid high-intensity interval training (HIIT) beyond 24h of fasting. Your glycogen is depleted — HIIT without fuel causes excessive cortisol and muscle breakdown.',
    category: 'activity',
    minHours: 24,
    maxHours: Infinity,
  },
  {
    id: 'act-04',
    text: 'Yoga and stretching during fasting reduce cortisol and enhance the parasympathetic "rest and digest" state. This amplifies autophagy.',
    category: 'activity',
    minHours: 12,
    maxHours: Infinity,
  },
  {
    id: 'act-05',
    text: 'Cold showers during fasting activate brown fat tissue and boost norepinephrine by 200-300%. This enhances fat burning and mental alertness simultaneously.',
    category: 'activity',
    minHours: 0,
    maxHours: Infinity,
    source: 'Scandinavian Journal of Clinical Investigation (2000)',
  },
  {
    id: 'act-06',
    text: 'Standing desk or light movement every hour prevents blood pooling and keeps metabolism active. Sitting for hours can drop your metabolic rate by 50%.',
    category: 'activity',
    minHours: 0,
    maxHours: Infinity,
  },
  {
    id: 'act-07',
    text: 'A 10-minute walk after waking up while fasted synchronizes your circadian rhythm and tells your body "it\'s daytime, burn energy." Sunlight exposure doubles the effect.',
    category: 'activity',
    minHours: 8,
    maxHours: Infinity,
  },
]

// ─── Science & Biology ──────────────────────────────────────────────

const scienceTips: FastingTip[] = [
  {
    id: 'sci-01',
    text: 'Autophagy (self-eating) peaks between 18-72h of fasting. Your cells literally recycle damaged components — it\'s like a factory reset for your biology.',
    category: 'science',
    minHours: 16,
    maxHours: Infinity,
    source: 'Yoshinori Ohsumi — Nobel Prize 2016',
  },
  {
    id: 'sci-02',
    text: 'Growth hormone (HGH) increases up to 500% during a 48h fast. This preserves muscle mass while your body burns fat — nature\'s steroid.',
    category: 'science',
    minHours: 24,
    maxHours: Infinity,
    source: 'Intermountain Medical Center (2011)',
  },
  {
    id: 'sci-03',
    text: 'BDNF (Brain-Derived Neurotrophic Factor) increases during fasting. This protein grows new neurons and strengthens existing connections — why fasting sharpens your mind.',
    category: 'science',
    minHours: 12,
    maxHours: Infinity,
    source: 'Dr. Mark Mattson — Johns Hopkins',
  },
  {
    id: 'sci-04',
    text: 'Insulin drops to its lowest point around 18-24h of fasting. Low insulin is the metabolic "switch" that unlocks fat cells for energy.',
    category: 'science',
    minHours: 12,
    maxHours: 30,
  },
  {
    id: 'sci-05',
    text: 'Ketone bodies (BHB) are a cleaner fuel than glucose — they produce fewer free radicals and more ATP per molecule. Your brain actually prefers them.',
    category: 'science',
    minHours: 20,
    maxHours: Infinity,
    source: 'Cahill, G.F. — Fuel Metabolism in Starvation (2006)',
  },
  {
    id: 'sci-06',
    text: 'Ghrelin (the hunger hormone) peaks at your usual meal times, then drops. If you push past the wave, hunger actually decreases. The first 24h is the hardest.',
    category: 'science',
    minHours: 0,
    maxHours: 30,
  },
  {
    id: 'sci-07',
    text: 'Inflammation markers (CRP, IL-6, TNF-alpha) drop significantly after 24h of fasting. This is why many people report joint pain disappearing during extended fasts.',
    category: 'science',
    minHours: 20,
    maxHours: Infinity,
  },
  {
    id: 'sci-08',
    text: 'Stem cell regeneration of the immune system begins around 48-72h. Your body breaks down old white blood cells and generates new ones from stem cells.',
    category: 'science',
    minHours: 48,
    maxHours: Infinity,
    source: 'USC Longevity Institute — Valter Longo (2014)',
  },
  {
    id: 'sci-09',
    text: 'Your metabolic rate does NOT decrease during fasts under 72h. Research shows a slight INCREASE in metabolic rate during the first 48h due to norepinephrine release.',
    category: 'science',
    minHours: 0,
    maxHours: 72,
    source: 'Zauner et al. — American Journal of Clinical Nutrition (2000)',
  },
  {
    id: 'sci-10',
    text: 'mTOR (mammalian target of rapamycin) is suppressed during fasting. This pathway, when chronically activated by constant eating, is linked to cancer growth and accelerated aging.',
    category: 'science',
    minHours: 16,
    maxHours: Infinity,
  },
]

// ─── Mental & Focus ─────────────────────────────────────────────────

const mentalTips: FastingTip[] = [
  {
    id: 'ment-01',
    text: 'The mental clarity you feel after 16-20h isn\'t placebo. Your brain switches from glucose to ketones, which provide a steadier, more efficient energy supply.',
    category: 'mental',
    minHours: 16,
    maxHours: Infinity,
  },
  {
    id: 'ment-02',
    text: 'Hunger comes in waves, not a constant climb. Each wave lasts 15-20 minutes. Distract yourself — walk, drink water with salt, or do deep breathing. It passes.',
    category: 'mental',
    minHours: 0,
    maxHours: 30,
  },
  {
    id: 'ment-03',
    text: 'Keep yourself busy. Boredom is the #1 fast-breaker, not hunger. Plan your fasting days around productive work, not leisure days at home near the kitchen.',
    category: 'mental',
    minHours: 0,
    maxHours: Infinity,
  },
  {
    id: 'ment-04',
    text: 'Coding while fasting? Many developers report peak flow states during fasted work. The combination of ketones + norepinephrine creates natural "Adderall."',
    category: 'mental',
    minHours: 16,
    maxHours: Infinity,
  },
  {
    id: 'ment-05',
    text: 'If you\'re irritable, it\'s likely low sodium, not the fast itself. Try 1/4 tsp of salt in water. The mood shift is dramatic and almost immediate.',
    category: 'mental',
    minHours: 8,
    maxHours: Infinity,
  },
  {
    id: 'ment-06',
    text: 'Sleep can be disrupted during fasting due to elevated cortisol and adrenaline. Take 200mg magnesium glycinate before bed — it\'s the best natural sleep aid during fasts.',
    category: 'mental',
    minHours: 16,
    maxHours: Infinity,
  },
  {
    id: 'ment-07',
    text: 'Meditation during fasting amplifies both practices. Your brain is already in a heightened awareness state from ketones — adding meditation creates deep theta-wave access.',
    category: 'mental',
    minHours: 20,
    maxHours: Infinity,
  },
]

// ─── Safety ─────────────────────────────────────────────────────────

const safetyTips: FastingTip[] = [
  {
    id: 'safe-01',
    text: 'Stop your fast immediately if you experience: persistent vomiting, chest pain, confusion, or fainting. Extended fasting should be respected, not endured through danger signs.',
    category: 'safety',
    minHours: 0,
    maxHours: Infinity,
  },
  {
    id: 'safe-02',
    text: 'If you take medication (especially for diabetes or blood pressure), consult your doctor before fasting over 24h. Fasting dramatically changes how drugs are metabolized.',
    category: 'safety',
    minHours: 0,
    maxHours: Infinity,
  },
  {
    id: 'safe-03',
    text: 'Refeeding syndrome is real for fasts over 72h. Break your fast with bone broth or small amounts of easily digestible food. Do NOT gorge on a huge meal.',
    category: 'safety',
    minHours: 48,
    maxHours: Infinity,
  },
  {
    id: 'safe-04',
    text: 'Heart palpitations during fasting are almost always an electrolyte issue (usually potassium or magnesium). Supplement immediately. If they persist, break the fast.',
    category: 'safety',
    minHours: 16,
    maxHours: Infinity,
  },
  {
    id: 'safe-05',
    text: 'Pregnant or breastfeeding women should NOT do extended fasting. Children and teens should also avoid it. This tool is for healthy adults only.',
    category: 'safety',
    minHours: 0,
    maxHours: Infinity,
  },
  {
    id: 'safe-06',
    text: 'If you have a history of eating disorders, extended fasting may trigger relapse. Use this tool responsibly and consider shorter intermittent fasting (16:8) instead.',
    category: 'safety',
    minHours: 0,
    maxHours: Infinity,
  },
]

// ─── Breaking the Fast ──────────────────────────────────────────────

const breakingTips: FastingTip[] = [
  {
    id: 'brk-01',
    text: 'Break fasts under 24h with anything you want — your digestive system is still primed. For 24-48h, start with soup, eggs, or avocado.',
    category: 'breaking',
    minHours: 20,
    maxHours: Infinity,
  },
  {
    id: 'brk-02',
    text: 'For fasts over 48h: break with bone broth (30 min), then soft foods (eggs, avocado). Wait 1-2 hours before a normal meal. This prevents cramping and nausea.',
    category: 'breaking',
    minHours: 36,
    maxHours: Infinity,
  },
  {
    id: 'brk-03',
    text: 'Avoid high-sugar or high-carb foods when breaking extended fasts. They cause a massive insulin spike on a sensitized system — you\'ll feel terrible and may get diarrhea.',
    category: 'breaking',
    minHours: 24,
    maxHours: Infinity,
  },
  {
    id: 'brk-04',
    text: 'The best first meal after 72h+: bone broth with salt, then 30 min later a small portion of protein (eggs, fish) with healthy fat (olive oil, avocado). Keep it simple.',
    category: 'breaking',
    minHours: 60,
    maxHours: Infinity,
  },
  {
    id: 'brk-05',
    text: 'Your stomach shrinks during fasting — literally. You\'ll feel full much faster than expected. Listen to your body and eat slowly. There\'s no rush.',
    category: 'breaking',
    minHours: 24,
    maxHours: Infinity,
  },
]

// ─── Motivation ─────────────────────────────────────────────────────

const motivationTips: FastingTip[] = [
  {
    id: 'mot-01',
    text: 'Every hour you fast is an hour your body heals. You\'re not starving — you\'re giving your cells the rest they\'ve been craving since your last meal.',
    category: 'motivation',
    minHours: 0,
    maxHours: Infinity,
  },
  {
    id: 'mot-02',
    text: 'Humans evolved fasting. For 200,000 years, our ancestors didn\'t eat 3 meals a day plus snacks. Your body is literally designed for this.',
    category: 'motivation',
    minHours: 0,
    maxHours: Infinity,
  },
  {
    id: 'mot-03',
    text: 'The hardest hours are 16-24. If you\'re past that, you\'ve already conquered the peak difficulty. From here, it gets easier as ketones take over.',
    category: 'motivation',
    minHours: 16,
    maxHours: 30,
  },
  {
    id: 'mot-04',
    text: 'You\'re training discipline, not just burning fat. The mental strength you build during fasting transfers to every area of your life — work, relationships, goals.',
    category: 'motivation',
    minHours: 0,
    maxHours: Infinity,
  },
  {
    id: 'mot-05',
    text: 'Most people quit right before the breakthrough. The discomfort you feel now IS the transformation. Embrace it — the other side is mental clarity you\'ve never experienced.',
    category: 'motivation',
    minHours: 12,
    maxHours: 36,
  },
  {
    id: 'mot-06',
    text: 'Each fast you complete increases your fasting "muscle." The first 48h fast is brutally hard. The fifth one feels almost easy. Your body adapts remarkably.',
    category: 'motivation',
    minHours: 36,
    maxHours: Infinity,
  },
  {
    id: 'mot-07',
    text: 'You chose to be here. Nobody forced you to fast. Remember your why — whether it\'s health, mental clarity, weight loss, or self-discipline. Hold that reason close.',
    category: 'motivation',
    minHours: 0,
    maxHours: Infinity,
  },
]

// ═══════════════════════════════════════════════════════════════════
// All tips combined
// ═══════════════════════════════════════════════════════════════════

export const ALL_TIPS: FastingTip[] = [
  ...electrolyteTips,
  ...hydrationTips,
  ...activityTips,
  ...scienceTips,
  ...mentalTips,
  ...safetyTips,
  ...breakingTips,
  ...motivationTips,
]

/**
 * Get tips relevant to the current fasting hour.
 */
export function getRelevantTips(currentHours: number): FastingTip[] {
  return ALL_TIPS.filter(
    tip => currentHours >= tip.minHours && currentHours <= tip.maxHours
  )
}

/**
 * Get a deterministic-but-rotating tip based on elapsed time.
 * Changes every `intervalMinutes` (default: 2 minutes).
 */
export function getRotatingTip(
  currentHours: number,
  elapsedSeconds: number,
  intervalMinutes: number = 2
): FastingTip | null {
  const relevant = getRelevantTips(currentHours)
  if (relevant.length === 0) return null

  const cycleIndex = Math.floor(elapsedSeconds / (intervalMinutes * 60))
  return relevant[cycleIndex % relevant.length]
}

/**
 * Category display metadata
 */
export const CATEGORY_META: Record<TipCategory, { label: string; color: string }> = {
  electrolytes: { label: 'Electrolytes', color: '#ECC94B' },
  hydration:    { label: 'Hydration', color: '#38B2AC' },
  activity:     { label: 'Activity', color: '#ED8936' },
  science:      { label: 'Science', color: '#805AD5' },
  mental:       { label: 'Mental', color: '#3182CE' },
  safety:       { label: 'Safety', color: '#E53E3E' },
  breaking:     { label: 'Refeeding', color: '#DD6B20' },
  motivation:   { label: 'Motivation', color: '#D53F8C' },
}
