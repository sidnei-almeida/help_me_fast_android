import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Platform,
  Animated,
  Easing,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Waves,
  Utensils,
  TriangleAlert,
  CircleCheck,
  ChevronRight,
  Droplets,
  Coffee,
  Footprints,
  Wind,
  Sparkles,
  Hourglass,
  Brain,
  Soup,
  Flag,
} from 'lucide-react-native';
import { formatDuration } from '../utils/date';
import { theme } from '../styles/theme';

export type CheckInStep = 'ask' | 'craving' | 'hunger' | 'unwell' | 'end';

const BRAND_GRADIENT = ['#FDCB6E', '#E17055'] as const;
const SUCCESS_GRADIENT = ['#00B894', '#00A383'] as const;
const SLATE_900 = '#0f172a';
const SLATE_600 = '#475569';
const SLATE_400 = '#94a3b8';
const BORDER_LIGHT = '#E2E8F0';
const ORANGE = '#E17055';
const GREEN = '#00B894';
const RED = '#E53E3E';

type IconType = typeof Waves;

interface Action {
  icon: IconType;
  title: string;
  detail: string;
}

const CRAVING_ACTIONS: Action[] = [
  { icon: Droplets, title: 'Drink a full glass of water', detail: 'Sparkling works even better — it fills the stomach.' },
  { icon: Footprints, title: 'Walk for 10 minutes', detail: 'Movement and a change of scenery break the loop.' },
  { icon: Wind, title: 'Box breathing, 2 minutes', detail: 'In 4s, hold 4s, out 4s, hold 4s. Lowers stress-driven cravings.' },
  { icon: Sparkles, title: 'Brush your teeth', detail: 'A clear “kitchen closed” signal to your brain.' },
  { icon: Brain, title: 'Switch tasks', detail: 'Pick something absorbing for 20 minutes. Boredom is the trigger.' },
  { icon: Coffee, title: 'Black coffee or plain tea', detail: 'Blunts appetite and gives you a ritual to replace the snack.' },
];

const HUNGER_ACTIONS: Action[] = [
  { icon: Droplets, title: 'Salt water first', detail: '¼ tsp of salt in a glass of water. “Hunger” is often low sodium.' },
  { icon: Coffee, title: 'Something warm', detail: 'Plain tea, black coffee or (on longer fasts) a little broth.' },
  { icon: Hourglass, title: 'Wait 20 minutes', detail: 'Then decide. If it’s still strong and real, it’s fine to eat.' },
];

/** Three craving actions, rotated so repeat visits feel fresh. */
function pickCravingActions(seed: number): Action[] {
  const start = seed % CRAVING_ACTIONS.length;
  return [0, 1, 2].map((i) => CRAVING_ACTIONS[(start + i) % CRAVING_ACTIONS.length]);
}

function refeedAdvice(elapsedSeconds: number): { title: string; text: string } {
  const hours = elapsedSeconds / 3600;
  if (hours < 24) {
    return {
      title: 'Breaking your fast',
      text: 'A balanced meal is perfect: protein, vegetables and healthy fats. Eat slowly and stop when satisfied.',
    };
  }
  if (hours < 48) {
    return {
      title: 'Start light',
      text: 'Begin with something gentle — eggs, soup or avocado — and wait ~30 minutes before a larger meal. Go easy on sugar and refined carbs.',
    };
  }
  if (hours < 72) {
    return {
      title: 'Refeed gently',
      text: 'Start with broth or a small portion of protein and fat. Keep portions small for the first few hours and avoid a big carb-heavy meal.',
    };
  }
  return {
    title: 'Refeed carefully',
    text: 'After 72h+, start with broth and very small portions for the first day. Long fasts carry a risk of refeeding syndrome — if you have any health conditions, get medical guidance.',
  };
}

interface CheckInModalProps {
  visible: boolean;
  initialStep: CheckInStep;
  elapsedSeconds: number;
  targetHours: number | null;
  onClose: () => void;
  onEndFast: () => void;
}

export function CheckInModal({
  visible,
  initialStep,
  elapsedSeconds,
  targetHours,
  onClose,
  onEndFast,
}: CheckInModalProps) {
  const [step, setStep] = useState<CheckInStep>(initialStep);
  // Freeze the action rotation when the modal opens so items don't shuffle while reading.
  const [seed, setSeed] = useState(0);
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const cardScale = useRef(new Animated.Value(0.92)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const contentOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!visible) return;
    setStep(initialStep);
    setSeed(Math.floor(Date.now() / 60000));
    overlayOpacity.setValue(0);
    cardScale.setValue(0.92);
    cardOpacity.setValue(0);
    Animated.parallel([
      Animated.timing(overlayOpacity, { toValue: 1, duration: 220, useNativeDriver: true, easing: Easing.out(Easing.cubic) }),
      Animated.timing(cardScale, { toValue: 1, duration: 320, useNativeDriver: true, easing: Easing.out(Easing.cubic) }),
      Animated.timing(cardOpacity, { toValue: 1, duration: 280, useNativeDriver: true, easing: Easing.out(Easing.cubic) }),
    ]).start();
  }, [visible, initialStep, overlayOpacity, cardScale, cardOpacity]);

  const goTo = (next: CheckInStep) => {
    Animated.timing(contentOpacity, { toValue: 0, duration: 120, useNativeDriver: true }).start(() => {
      setStep(next);
      Animated.timing(contentOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }).start();
    });
  };

  const close = (after?: () => void) => {
    Animated.parallel([
      Animated.timing(overlayOpacity, { toValue: 0, duration: 180, useNativeDriver: true, easing: Easing.in(Easing.cubic) }),
      Animated.timing(cardScale, { toValue: 0.96, duration: 200, useNativeDriver: true, easing: Easing.in(Easing.cubic) }),
      Animated.timing(cardOpacity, { toValue: 0, duration: 160, useNativeDriver: true, easing: Easing.in(Easing.cubic) }),
    ]).start(() => {
      onClose();
      after?.();
    });
  };

  const goalSeconds = targetHours ? targetHours * 3600 : 0;
  const remainingSeconds = Math.max(goalSeconds - elapsedSeconds, 0);
  const goalReached = goalSeconds > 0 && elapsedSeconds >= goalSeconds;
  const progressPct = goalSeconds > 0 ? Math.min(Math.round((elapsedSeconds / goalSeconds) * 100), 100) : 0;
  const nearGoal = !goalReached && remainingSeconds > 0 && remainingSeconds <= 2 * 3600;

  const contextLine = goalReached
    ? `${formatDuration(elapsedSeconds)} fasted · goal reached`
    : `${formatDuration(elapsedSeconds)} fasted · ${formatDuration(remainingSeconds)} to go`;

  const renderActions = (actions: Action[], tint: string) => (
    <View style={styles.actionList}>
      {actions.map((a) => {
        const Icon = a.icon;
        return (
          <View key={a.title} style={styles.actionRow}>
            <View style={[styles.actionIcon, { backgroundColor: tint + '1A' }]}>
              <Icon size={18} color={tint} strokeWidth={2.2} />
            </View>
            <View style={styles.actionText}>
              <Text style={styles.actionTitle}>{a.title}</Text>
              <Text style={styles.actionDetail}>{a.detail}</Text>
            </View>
          </View>
        );
      })}
    </View>
  );

  const PrimaryButton = ({
    label,
    onPress,
    gradient = BRAND_GRADIENT,
  }: {
    label: string;
    onPress: () => void;
    gradient?: readonly [string, string];
  }) => (
    <TouchableOpacity style={styles.primaryTouchable} onPress={onPress} activeOpacity={0.85}>
      <LinearGradient colors={gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.primaryButton}>
        <Text style={styles.primaryText}>{label}</Text>
      </LinearGradient>
    </TouchableOpacity>
  );

  const SecondaryButton = ({ label, onPress }: { label: string; onPress: () => void }) => (
    <TouchableOpacity style={styles.secondaryButton} onPress={onPress} activeOpacity={0.7}>
      <Text style={styles.secondaryText}>{label}</Text>
    </TouchableOpacity>
  );

  const renderStep = () => {
    switch (step) {
      case 'ask': {
        const options: { step: CheckInStep; icon: IconType; tint: string; title: string; sub: string }[] = [
          { step: 'craving', icon: Waves, tint: '#3182CE', title: 'A craving or habit', sub: 'Bored, stressed, or it’s just “meal time”' },
          { step: 'hunger', icon: Utensils, tint: ORANGE, title: 'Genuine hunger', sub: 'My stomach is empty, but I feel fine' },
          { step: 'unwell', icon: TriangleAlert, tint: RED, title: 'I don’t feel well', sub: 'Dizzy, weak, shaky or nauseous' },
          { step: 'end', icon: CircleCheck, tint: GREEN, title: 'I’m ready to eat', sub: 'I’ve decided to break my fast' },
        ];
        return (
          <>
            <Text style={styles.eyebrow}>Check-in</Text>
            <Text style={styles.title}>Pause for a moment</Text>
            <Text style={styles.subtitle}>{contextLine}</Text>
            <Text style={styles.question}>What’s going on right now?</Text>
            <View style={styles.optionList}>
              {options.map((o) => {
                const Icon = o.icon;
                return (
                  <TouchableOpacity key={o.step} style={styles.option} onPress={() => goTo(o.step)} activeOpacity={0.75}>
                    <View style={[styles.optionIcon, { backgroundColor: o.tint + '1A' }]}>
                      <Icon size={20} color={o.tint} strokeWidth={2.2} />
                    </View>
                    <View style={styles.optionText}>
                      <Text style={styles.optionTitle}>{o.title}</Text>
                      <Text style={styles.optionSub}>{o.sub}</Text>
                    </View>
                    <ChevronRight size={18} color={SLATE_400} />
                  </TouchableOpacity>
                );
              })}
            </View>
            <SecondaryButton label="Never mind" onPress={() => close()} />
          </>
        );
      }

      case 'craving':
        return (
          <>
            <Text style={[styles.eyebrow, { color: '#3182CE' }]}>Craving</Text>
            <Text style={styles.title}>This wave will pass</Text>
            <Text style={styles.body}>
              Habit hunger is triggered by the clock, boredom or stress — not by your body needing fuel. It usually
              fades within 15–20 minutes. Try one of these:
            </Text>
            {renderActions(pickCravingActions(seed), '#3182CE')}
            {nearGoal ? (
              <View style={styles.callout}>
                <Flag size={16} color={ORANGE} />
                <Text style={styles.calloutText}>Only {formatDuration(remainingSeconds)} left to your {targetHours}h goal.</Text>
              </View>
            ) : null}
            <PrimaryButton label="I’ve got this — keep fasting" onPress={() => close()} />
            <SecondaryButton label="I still want to eat" onPress={() => goTo('end')} />
          </>
        );

      case 'hunger':
        return (
          <>
            <Text style={[styles.eyebrow, { color: ORANGE }]}>Hunger</Text>
            <Text style={styles.title}>Hunger comes in waves</Text>
            <Text style={styles.body}>
              Ghrelin, the hunger hormone, rises around your usual meal times and then falls again — even if you don’t
              eat. Before you decide:
            </Text>
            {renderActions(HUNGER_ACTIONS, ORANGE)}
            {nearGoal ? (
              <View style={styles.callout}>
                <Flag size={16} color={ORANGE} />
                <Text style={styles.calloutText}>Only {formatDuration(remainingSeconds)} left to your {targetHours}h goal.</Text>
              </View>
            ) : null}
            <PrimaryButton label="I’ll ride it out" onPress={() => close()} />
            <SecondaryButton label="I’m ready to eat" onPress={() => goTo('end')} />
          </>
        );

      case 'unwell':
        return (
          <>
            <Text style={[styles.eyebrow, { color: RED }]}>Safety first</Text>
            <Text style={styles.title}>Listen to your body</Text>
            <Text style={styles.body}>
              Lightheadedness, headaches and weakness are most often caused by low sodium. Have ¼ tsp of salt in water and
              sit down for 10 minutes.
            </Text>
            <View style={[styles.callout, styles.calloutDanger]}>
              <TriangleAlert size={16} color={RED} />
              <Text style={[styles.calloutText, { color: '#9B2C2C' }]}>
                End your fast now if you have chest pain, fainting, confusion, persistent vomiting, or symptoms that don’t
                improve.
              </Text>
            </View>
            <PrimaryButton label="End fast now" onPress={() => close(onEndFast)} />
            <SecondaryButton label="I’ll try electrolytes first" onPress={() => close()} />
          </>
        );

      case 'end': {
        const advice = refeedAdvice(elapsedSeconds);
        return (
          <>
            <Text style={[styles.eyebrow, { color: goalReached ? GREEN : ORANGE }]}>
              {goalReached ? 'Goal complete' : 'Ending early'}
            </Text>
            <Text style={styles.title}>{goalReached ? 'Well done! 🎉' : 'End your fast?'}</Text>
            <View style={styles.summaryRow}>
              <View style={styles.summaryCell}>
                <Text style={styles.summaryValue}>{formatDuration(elapsedSeconds)}</Text>
                <Text style={styles.summaryLabel}>Fasted</Text>
              </View>
              {targetHours ? (
                <View style={styles.summaryCell}>
                  <Text style={[styles.summaryValue, { color: goalReached ? GREEN : ORANGE }]}>{progressPct}%</Text>
                  <Text style={styles.summaryLabel}>of {targetHours}h goal</Text>
                </View>
              ) : null}
            </View>
            {!goalReached && targetHours ? (
              <Text style={styles.body}>
                You’re {formatDuration(remainingSeconds)} from your goal. Stopping early is okay — every hour still counts,
                and this fast will be saved to your history.
              </Text>
            ) : null}
            <View style={styles.adviceCard}>
              <View style={styles.adviceHeader}>
                <Soup size={16} color={ORANGE} />
                <Text style={styles.adviceTitle}>{advice.title}</Text>
              </View>
              <Text style={styles.adviceText}>{advice.text}</Text>
            </View>
            <PrimaryButton
              label={goalReached ? 'Finish & save' : 'End fast & save'}
              gradient={goalReached ? SUCCESS_GRADIENT : BRAND_GRADIENT}
              onPress={() => close(onEndFast)}
            />
            <SecondaryButton label="Keep fasting" onPress={() => close()} />
          </>
        );
      }
    }
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={() => close()}>
      <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => close()}>
        <Animated.View style={[StyleSheet.absoluteFill, styles.overlay, { opacity: overlayOpacity }]} pointerEvents="none" />
      </TouchableOpacity>
      <Animated.View
        style={[styles.cardWrapper, { opacity: cardOpacity, transform: [{ scale: cardScale }] }]}
        pointerEvents="box-none"
      >
        <View style={styles.card}>
          <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
            <Animated.View style={{ opacity: contentOpacity }}>{renderStep()}</Animated.View>
          </ScrollView>
        </View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15,23,42,0.55)',
  },
  cardWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    maxHeight: '90%',
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 16,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.15, shadowRadius: 28 },
      android: { elevation: 14 },
    }),
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '700',
    color: SLATE_400,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    textAlign: 'center',
    marginBottom: 6,
  },
  title: {
    fontFamily: theme.fontFamily.bold,
    fontSize: 22,
    fontWeight: '700',
    color: SLATE_900,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 13,
    color: SLATE_600,
    textAlign: 'center',
    marginBottom: 20,
  },
  question: {
    fontSize: 15,
    fontWeight: '600',
    color: SLATE_900,
    marginBottom: 12,
  },
  body: {
    fontSize: 15,
    color: SLATE_600,
    lineHeight: 22,
    marginBottom: 16,
    textAlign: 'center',
  },
  optionList: { gap: 10, marginBottom: 8 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BORDER_LIGHT,
    backgroundColor: '#FFFFFF',
  },
  optionIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  optionText: { flex: 1 },
  optionTitle: { fontSize: 15, fontWeight: '700', color: SLATE_900 },
  optionSub: { fontSize: 12, color: SLATE_600, marginTop: 2 },
  actionList: { gap: 12, marginBottom: 16 },
  actionRow: { flexDirection: 'row', alignItems: 'flex-start' },
  actionIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  actionText: { flex: 1 },
  actionTitle: { fontSize: 14, fontWeight: '700', color: SLATE_900 },
  actionDetail: { fontSize: 13, color: SLATE_600, lineHeight: 18, marginTop: 1 },
  callout: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#FFF5EB',
    marginBottom: 16,
  },
  calloutDanger: { backgroundColor: '#FFF5F5' },
  calloutText: { flex: 1, fontSize: 13, lineHeight: 18, color: '#9C4221', fontWeight: '500' },
  summaryRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
    marginBottom: 16,
  },
  summaryCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
  },
  summaryValue: { fontSize: 22, fontWeight: '800', color: SLATE_900 },
  summaryLabel: { fontSize: 12, color: SLATE_600, marginTop: 2 },
  adviceCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FDE3CF',
    backgroundColor: '#FFFBF7',
    padding: 14,
    marginBottom: 18,
  },
  adviceHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  adviceTitle: { fontSize: 13, fontWeight: '700', color: '#9C4221', textTransform: 'uppercase', letterSpacing: 0.5 },
  adviceText: { fontSize: 14, color: SLATE_600, lineHeight: 20 },
  primaryTouchable: { width: '100%' },
  primaryButton: {
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryText: { fontFamily: theme.fontFamily.bold, fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
  secondaryButton: {
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  secondaryText: { fontSize: 15, fontWeight: '600', color: SLATE_600 },
});
