import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Easing,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { LinearGradient } from 'expo-linear-gradient';
import { useApp } from '../context/AppContext';
import { useFastingTimer } from '../hooks/useFastingTimer';
import { useMetabolicMotivation } from '../hooks/useMetabolicMotivation';
import { MetabolicWheel } from '../components/MetabolicWheel';
import { FastTypeSelector } from '../components/FastTypeSelector';
import { PanicButton } from '../components/PanicButton';
import { formatWeight, WeightUnit } from '../utils/weightConverter';
import { getCurrentPhase } from '../utils/metabolicPhases';
import { getRotatingTip, CATEGORY_META } from '../data/fastingTips';
import { FastGoal } from '../types';
import { COMMON_FAST_TYPES, createCustomFastType } from '../utils/fastTypes';
import { theme } from '../styles/theme';
import { Flame, TrendingDown, Activity, Lightbulb } from 'lucide-react-native';

const BRAND_GRADIENT = ['#FDCB6E', '#E17055'] as const;
const SLIDER_MIN = 12;
const SLIDER_MAX = 960; // 30 days
const ORANGE = '#E17055';
const YELLOW = '#FDCB6E';

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
  return <Animated.View style={{ opacity }}>{children}</Animated.View>;
}

export function TimerScreen() {
  const { state, dispatch } = useApp();
  const {
    isActive,
    hours,
    minutes,
    seconds,
    elapsedSeconds,
    countdownHours,
    countdownMinutes,
    countdownSeconds,
    remainingSeconds,
    weightLoss,
    targetHours,
    progress,
    startFast,
    endFast,
  } = useFastingTimer();

  const {
    fatBurnedInGrams,
    currentMessage,
    projectedFinalWeightLoss,
    caloriesBurned,
  } = useMetabolicMotivation(elapsedSeconds, targetHours);

  const [selectedHours, setSelectedHours] = useState<number>(
    state.fastGoal?.targetHours ?? 24
  );

  const formatTime = (h: number, m: number, s: number) =>
    `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;

  const handleStartFast = () => {
    const fastType = COMMON_FAST_TYPES.find((t) => t.hours === selectedHours) ?? createCustomFastType(selectedHours);
    const fastGoal: FastGoal = {
      targetHours: selectedHours,
      fastType,
    };
    dispatch({ type: 'SET_FAST_GOAL', payload: fastGoal });
    startFast(selectedHours);
  };

  const currentPhase = getCurrentPhase(hours + minutes / 60);
  const tip = getRotatingTip(hours + minutes / 60, elapsedSeconds, 2);
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
              ? formatTime(countdownHours, countdownMinutes, countdownSeconds)
              : formatTime(selectedHours, 0, 0)
          }
          idleText={!isActive ? `GOAL: ${selectedHours}h` : undefined}
          isActive={isActive}
        />
      </View>

      {isActive && targetHours ? (
        <>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${Math.min(progress * 100, 100)}%` }]} />
          </View>
          <Text style={styles.progressText}>
            {Math.min(Math.round(progress * 100), 100)}% of {targetHours}h
          </Text>
        </>
      ) : null}

      {isActive ? (
        <>
          {/* Metrics: 2+1 layout — top row Fat + Projected, bottom row Current Phase full width */}
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
                <Text style={styles.statSub}>{caloriesBurned.toLocaleString()} kcal</Text>
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
                    Goal: {formatWeight(projectedFinalWeightLoss, weightUnit)} {weightUnit}
                  </Text>
                ) : null}
              </View>
            </View>
            <View style={styles.statPhaseCard}>
              <View style={styles.statPhaseLeft}>
                <Activity size={22} color={currentPhase.color} />
                <Text style={styles.statPhaseLabel}>Current phase</Text>
              </View>
              <View style={styles.statPhaseRight}>
                <Text style={[styles.statPhaseName, { color: currentPhase.color }]} numberOfLines={1}>
                  {currentPhase.name}
                </Text>
                <Text style={styles.statPhaseSub}>
                  {countdownHours}h {countdownMinutes}m left
                </Text>
              </View>
            </View>
          </FadeInView>

          {tip ? (
            <View style={styles.tipCard}>
              <View style={styles.tipHeader}>
                <Lightbulb size={20} color="#E17055" />
                <Text style={styles.tipLabel}>Tip</Text>
                <View
                  style={[
                    styles.tipBadge,
                    { backgroundColor: CATEGORY_META[tip.category].color + '20' },
                  ]}
                >
                  <Text
                    style={[styles.tipBadgeText, { color: CATEGORY_META[tip.category].color }]}
                  >
                    {CATEGORY_META[tip.category].label}
                  </Text>
                </View>
              </View>
              <Text style={styles.tipText}>{tip.text}</Text>
              {tip.source ? (
                <Text style={styles.tipSource}>{tip.source}</Text>
              ) : null}
            </View>
          ) : null}

          {currentMessage ? (
            <Text style={styles.phaseMessage}>
              {currentMessage.phase} — {currentMessage.message}
            </Text>
          ) : null}

          <View style={styles.footer}>
            <PanicButton />
            <TouchableOpacity style={styles.endButtonTouchable} onPress={endFast} activeOpacity={0.85}>
              <LinearGradient
                colors={BRAND_GRADIENT}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.endButtonGradient}
              >
                <Text style={styles.endButtonText}>End fast</Text>
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
            onPress={handleStartFast}
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
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F6FA' },
  content: {
    paddingHorizontal: 24,
    paddingTop: theme.spacing.lg,
    paddingBottom: 80,
    alignItems: 'center',
  },
  wheelWrapper: {
    marginBottom: theme.spacing.lg,
  },
  progressBar: {
    width: '100%',
    maxWidth: 400,
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
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.lg,
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
  statPhaseCard: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: theme.spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  statPhaseLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  statPhaseLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statPhaseRight: { flex: 1, alignItems: 'flex-end', marginLeft: 12 },
  statPhaseName: {
    fontSize: 20,
    fontWeight: '700',
  },
  statPhaseSub: { fontSize: 12, color: theme.colors.text.muted, marginTop: 2 },
  tipCard: {
    width: '100%',
    maxWidth: 500,
    backgroundColor: theme.colors.surface,
    borderRadius: 20,
    padding: theme.spacing.lg,
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
    gap: 8,
    marginBottom: 12,
  },
  tipLabel: { fontSize: 12, fontWeight: '600', color: '#718096', textTransform: 'uppercase' },
  tipBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  tipBadgeText: { fontSize: 11, fontWeight: '600' },
  tipText: { fontSize: 15, color: theme.colors.text.primary, lineHeight: 24 },
  tipSource: { fontSize: 12, color: '#A0AEC0', fontStyle: 'italic', marginTop: 8 },
  phaseMessage: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    fontStyle: 'italic',
    marginBottom: theme.spacing.lg,
    textAlign: 'center',
  },
  footer: { width: '100%', maxWidth: 400, gap: theme.spacing.md },
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
  idle: { width: '100%', maxWidth: 500, alignItems: 'center', gap: theme.spacing.md },
  sliderSection: {
    width: '100%',
    maxWidth: 400,
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
