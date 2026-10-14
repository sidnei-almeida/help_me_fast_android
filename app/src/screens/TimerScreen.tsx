import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Easing,
  Alert,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { LinearGradient } from 'expo-linear-gradient';
import { useApp } from '../context/AppContext';
import { useFastingTimer } from '../hooks/useFastingTimer';
import { useVault } from '../hooks/useVault';
import { useMetabolicMotivation } from '../hooks/useMetabolicMotivation';
import { MetabolicWheel } from '../components/MetabolicWheel';
import { FastTypeSelector } from '../components/FastTypeSelector';
import { PanicButton } from '../components/PanicButton';
import { CheckInModal, CheckInStep } from '../components/CheckInModal';
import { StageCard } from '../components/StageCard';
import { JourneyTimeline } from '../components/JourneyTimeline';
import { formatWeight, WeightUnit } from '../utils/weightConverter';
import { formatClock, formatDuration, formatRelativeTime, pickDateTime } from '../utils/date';
import { getRotatingTip, CATEGORY_META } from '../data/fastingTips';
import { FastGoal } from '../types';
import { COMMON_FAST_TYPES, createCustomFastType } from '../utils/fastTypes';
import { theme } from '../styles/theme';
import { Flame, TrendingDown, Lightbulb, Clock, PartyPopper, RefreshCw } from 'lucide-react-native';

const BRAND_GRADIENT = ['#FDCB6E', '#E17055'] as const;
const SLIDER_MIN = 12;
const SLIDER_MAX = 960; // 30 days
const ORANGE = '#E17055';
const YELLOW = '#FDCB6E';
const GREEN = '#00B894';
/** How far back a fast start can be set when logging it after the fact. */
const MAX_BACKDATE_MS = 30 * 24 * 3600 * 1000;

function FadeInView({ delay = 0, children }: { delay?: number; children: React.ReactNode }) {
  const opacity = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(opacity, {
      toValue: 1,
      duration: 420,
      delay,
      useNativeDriver: true,
      easing: Easing.out(Easing.cubic),
    }).start();
  }, [opacity, delay]);
  return <Animated.View style={{ opacity, width: '100%' }}>{children}</Animated.View>;
}

export function TimerScreen() {
  const { state, dispatch } = useApp();
  const { saveConfig } = useVault();
  const {
    isActive,
    startTime,
    hours,
    minutes,
    elapsedSeconds,
    countdownHours,
    countdownMinutes,
    countdownSeconds,
    goalReached,
    overtimeSeconds,
    weightLoss,
    targetHours,
    progress,
    startFast,
    updateStartTime,
    endFast,
  } = useFastingTimer();

  const {
    fatBurnedInGrams,
    projectedFinalWeightLoss,
    caloriesBurned,
  } = useMetabolicMotivation(elapsedSeconds, targetHours);
  const [checkInStep, setCheckInStep] = useState<CheckInStep | null>(null);
  const [tipOffset, setTipOffset] = useState(0);

  const [selectedHours, setSelectedHours] = useState<number>(
    state.fastGoal?.targetHours ?? state.config?.lastGoalHours ?? 16
  );

  const formatTime = (h: number, m: number, s: number) =>
    `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;

  const handleStartFast = (fastStart?: number) => {
    const fastType = COMMON_FAST_TYPES.find((t) => t.hours === selectedHours) ?? createCustomFastType(selectedHours);
    const fastGoal: FastGoal = {
      targetHours: selectedHours,
      fastType,
    };
    dispatch({ type: 'SET_FAST_GOAL', payload: fastGoal });
    startFast(selectedHours, fastStart);
    if (state.config && state.config.lastGoalHours !== selectedHours) {
      saveConfig({ ...state.config, lastGoalHours: selectedHours });
    }
  };

  /** Start a fast that actually began earlier (forgot to tap Start after the last meal). */
  const handleStartEarlier = async () => {
    const now = new Date();
    const picked = await pickDateTime({
      value: now,
      withTime: true,
      maximumDate: now,
      minimumDate: new Date(now.getTime() - MAX_BACKDATE_MS),
    });
    if (!picked) return;
    if (picked.getTime() > Date.now()) {
      Alert.alert('Invalid time', 'The start time cannot be in the future.');
      return;
    }
    handleStartFast(picked.getTime());
  };

  const handleEditStart = async () => {
    if (!startTime) return;
    const now = new Date();
    const picked = await pickDateTime({
      value: new Date(startTime),
      withTime: true,
      maximumDate: now,
      minimumDate: new Date(now.getTime() - MAX_BACKDATE_MS),
    });
    if (!picked) return;
    if (picked.getTime() > Date.now()) {
      Alert.alert('Invalid time', 'The start time cannot be in the future.');
      return;
    }
    updateStartTime(picked.getTime());
  };

  const handleEndFast = () => setCheckInStep('end');

  const goalAt = startTime && targetHours ? startTime + targetHours * 3600 * 1000 : null;
  // Rotates every 2 minutes on its own; tapping the card skips ahead.
  const tip = getRotatingTip(hours + minutes / 60, elapsedSeconds + tipOffset * 120, 2);
  const weightUnit = (state.config?.weightUnit || 'kg') as WeightUnit;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.wheelWrapper}>
        <MetabolicWheel
          elapsedSeconds={elapsedSeconds}
          goalSeconds={
            (targetHours ?? selectedHours) * 3600
          }
          userPhoto={state.profile?.avatar}
          timerText={
            isActive
              ? goalReached
                ? `+${formatClock(overtimeSeconds)}`
                : formatTime(countdownHours, countdownMinutes, countdownSeconds)
              : formatTime(selectedHours, 0, 0)
          }
          idleText={!isActive ? `GOAL: ${selectedHours}h` : undefined}
          caption={goalReached ? 'over goal' : 'remaining'}
          badgeText={goalReached ? 'Goal reached' : undefined}
          isActive={isActive}
        />
      </View>

      {isActive && targetHours ? (
        <>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${Math.min(progress * 100, 100)}%` },
                goalReached && { backgroundColor: GREEN },
              ]}
            />
          </View>
          <Text style={styles.progressText}>
            {Math.min(Math.round(progress * 100), 100)}% of {targetHours}h · {formatDuration(elapsedSeconds)} fasted
          </Text>
          {startTime ? (
            <TouchableOpacity style={styles.startedRow} onPress={handleEditStart} activeOpacity={0.7}>
              <Clock size={16} color={theme.colors.text.secondary} />
              <Text style={styles.startedText}>
                Started {formatRelativeTime(startTime)}
                {goalAt && !goalReached ? `  ·  Goal ${formatRelativeTime(goalAt)}` : ''}
              </Text>
              <Text style={styles.startedEdit}>Edit</Text>
            </TouchableOpacity>
          ) : null}
          {goalReached ? (
            <View style={styles.goalBanner}>
              <PartyPopper size={22} color={GREEN} />
              <Text style={styles.goalBannerText}>
                You hit your {targetHours}h goal! End the fast whenever you're ready, or keep going.
              </Text>
            </View>
          ) : null}
        </>
      ) : null}

      {isActive ? (
        <>
          {/* Metrics row, then the current stage and the journey to the goal */}
          <FadeInView delay={120}>
            <View style={styles.statsTopRow}>
              <View style={styles.statCard}>
                <View style={styles.statHeader}>
                  <Flame size={20} color="#ED8936" />
                  <Text style={styles.statLabel}>Fat burned</Text>
                </View>
                <Text style={[styles.statValue, styles.statValueSpaced, { color: '#ED8936' }]}>
                  {fatBurnedInGrams.toFixed(2)} <Text style={styles.statUnit}>g</Text>
                </Text>
                <Text style={styles.statSub}>{caloriesBurned.toLocaleString()} kcal used · est.</Text>
              </View>
              <View style={styles.statCard}>
                <View style={styles.statHeader}>
                  <TrendingDown size={20} color="#FF5E62" />
                  <Text style={styles.statLabel}>Projected loss</Text>
                </View>
                <Text style={[styles.statValue, styles.statValueSpaced]}>
                  {formatWeight(weightLoss, weightUnit)}{' '}
                  <Text style={styles.statUnit}>{weightUnit}</Text>
                </Text>
                {targetHours ? (
                  <Text style={styles.statSub}>
                    At goal: {formatWeight(projectedFinalWeightLoss, weightUnit)} {weightUnit}
                  </Text>
                ) : null}
              </View>
            </View>
          </FadeInView>

          <FadeInView delay={200}>
            <StageCard elapsedSeconds={elapsedSeconds} />
            {targetHours && startTime ? (
              <JourneyTimeline elapsedSeconds={elapsedSeconds} goalHours={targetHours} startTime={startTime} />
            ) : null}
          </FadeInView>

          {tip ? (
            <TouchableOpacity
              style={[styles.tipCard, { borderLeftColor: CATEGORY_META[tip.category].color }]}
              onPress={() => setTipOffset((o) => o + 1)}
              activeOpacity={0.85}
            >
              <View style={styles.tipHeader}>
                <Lightbulb size={16} color={CATEGORY_META[tip.category].color} />
                <Text style={[styles.tipLabel, { color: CATEGORY_META[tip.category].color }]}>
                  {CATEGORY_META[tip.category].label}
                </Text>
                <View style={styles.tipNext}>
                  <RefreshCw size={12} color={theme.colors.text.muted} />
                  <Text style={styles.tipNextText}>Next tip</Text>
                </View>
              </View>
              <Text style={styles.tipText}>{tip.text}</Text>
              {tip.source ? <Text style={styles.tipSource}>Source: {tip.source}</Text> : null}
            </TouchableOpacity>
          ) : null}

          <View style={styles.footer}>
            <PanicButton onPress={() => setCheckInStep('ask')} />
            <TouchableOpacity style={styles.endButtonTouchable} onPress={handleEndFast} activeOpacity={0.85}>
              <LinearGradient
                colors={goalReached ? [GREEN, '#00A383'] : BRAND_GRADIENT}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.endButtonGradient}
              >
                <Text style={styles.endButtonText}>{goalReached ? 'Finish fast' : 'End fast'}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </>
      ) : (
        <View style={styles.idle}>
          <FastTypeSelector
            selectedHours={selectedHours}
            onSelectHours={setSelectedHours}
          />
          <View style={styles.sliderSection}>
            <Text style={styles.sliderLabel}>Custom goal: {selectedHours}h</Text>
            <Slider
              style={styles.slider}
              value={selectedHours}
              onValueChange={(v) => setSelectedHours(Math.round(v))}
              minimumValue={SLIDER_MIN}
              maximumValue={SLIDER_MAX}
              step={1}
              minimumTrackTintColor={ORANGE}
              maximumTrackTintColor="#DFE6E9"
              thumbTintColor={YELLOW}
            />
          </View>
          <Text style={styles.confirmText}>
            Ready to start a {selectedHours}h fast?
          </Text>
          <TouchableOpacity
            style={styles.startButtonTouchable}
            onPress={() => handleStartFast()}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={BRAND_GRADIENT}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.startButtonGradient}
            >
              <Text style={styles.startButtonText}>Start fast</Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleStartEarlier} hitSlop={8} activeOpacity={0.7}>
            <Text style={styles.startEarlierText}>Already fasting? Set when you started</Text>
          </TouchableOpacity>
        </View>
      )}

      <CheckInModal
        visible={checkInStep !== null}
        initialStep={checkInStep ?? 'ask'}
        elapsedSeconds={elapsedSeconds}
        targetHours={targetHours}
        onClose={() => setCheckInStep(null)}
        onEndFast={() => endFast()}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F6FA' },
  content: {
    paddingHorizontal: 24,
    paddingTop: theme.spacing.lg,
    paddingBottom: 80,
  },
  wheelWrapper: {
    width: '100%',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  progressBar: {
    width: '100%',
    height: 6,
    backgroundColor: '#DFE6E9',
    borderRadius: theme.borderRadius.md,
    overflow: 'hidden',
    marginBottom: theme.spacing.xs,
  },
  progressFill: {
    height: '100%',
    backgroundColor: theme.colors.gradient.end,
    borderRadius: theme.borderRadius.md,
  },
  progressText: {
    fontSize: 12,
    textAlign: 'center',
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.sm,
  },
  startedRow: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    marginBottom: theme.spacing.lg,
  },
  startedText: { fontSize: 13, color: theme.colors.text.secondary },
  startedEdit: { fontSize: 13, fontWeight: '700', color: ORANGE, marginLeft: 4 },
  goalBanner: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#E6F8F3',
    borderRadius: 16,
    padding: 16,
    marginBottom: theme.spacing.lg,
  },
  goalBannerText: { flex: 1, fontSize: 14, color: '#00785F', lineHeight: 20, fontWeight: '500' },
  startEarlierText: {
    fontSize: 14,
    color: ORANGE,
    fontWeight: '600',
    paddingVertical: 4,
  },
  statsTopRow: {
    width: '100%',
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statValue: { fontSize: 24, fontWeight: '700', color: theme.colors.text.primary },
  statValueSpaced: { lineHeight: 30, marginVertical: 2 },
  statUnit: { fontSize: 16, fontWeight: '400', color: theme.colors.text.secondary },
  statSub: { fontSize: 12, color: theme.colors.text.muted, marginTop: 6, lineHeight: 16 },
  tipCard: {
    width: '100%',
    backgroundColor: theme.colors.surface,
    borderRadius: 20,
    borderLeftWidth: 4,
    padding: 18,
    marginBottom: theme.spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  tipLabel: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, flex: 1 },
  tipNext: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  tipNextText: { fontSize: 11, color: theme.colors.text.muted, fontWeight: '600' },
  tipText: { fontSize: 15, color: theme.colors.text.primary, lineHeight: 23 },
  tipSource: { fontSize: 12, color: '#A0AEC0', fontStyle: 'italic', marginTop: 10 },
  footer: { width: '100%', gap: theme.spacing.md },
  endButtonTouchable: { width: '100%' },
  endButtonGradient: {
    width: '100%',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  endButtonText: { fontFamily: theme.fontFamily.bold, color: '#FFF', fontSize: theme.fontSize.base, fontWeight: '700' },
  idle: { width: '100%', alignItems: 'center', gap: theme.spacing.md },
  sliderSection: {
    width: '100%',
    paddingHorizontal: 4,
  },
  sliderLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: 8,
    textAlign: 'center',
  },
  slider: {
    width: '100%',
    height: 40,
  },
  confirmText: {
    fontSize: theme.fontSize.base,
    color: theme.colors.text.secondary,
    fontWeight: '500',
  },
  startButtonTouchable: { width: '100%' },
  startButtonGradient: {
    width: '100%',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  startButtonText: { fontFamily: theme.fontFamily.bold, color: '#FFF', fontSize: theme.fontSize.base, fontWeight: '700' },
});
