import React, { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
  Platform,
  Dimensions,
  Animated,
  Easing,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { LineChart } from 'react-native-gifted-charts';
import { Plus, Check, X } from 'lucide-react-native';
import { useApp } from '../context/AppContext';
import { useVault } from '../hooks/useVault';
import { useHistoryStorage, type HistoryEntry } from '../hooks/useHistoryStorage';
import { formatWeight, kgToLbs, WeightUnit } from '../utils/weightConverter';
import { formatDateShort, formatDateTime, formatDuration, localDayKey } from '../utils/date';
import { FastEntry } from '../types';
import { AddHistoryModal } from '../components/AddHistoryModal';
import { theme } from '../styles/theme';

const ORANGE = '#E17055';
const ORANGE_LIGHT = '#FDCB6E';
const GREEN = '#00B894';
const TIMELINE_COLOR = '#E2E8F0';
const CHART_HEIGHT = 200;
const { width: SCREEN_WIDTH } = Dimensions.get('window');

const formatDateLabel = formatDateShort;

type Tab = 'weight' | 'fasts';

/** Oldest→newest entries that have a weight. */
function weighIns(entries: HistoryEntry[]): (HistoryEntry & { weight: number })[] {
  return entries
    .filter((e): e is HistoryEntry & { weight: number } => e.weight != null)
    .sort((a, b) => {
      const byDate = new Date(a.date).getTime() - new Date(b.date).getTime();
      if (byDate !== 0) return byDate;
      return new Date(a.createdAt ?? 0).getTime() - new Date(b.createdAt ?? 0).getTime();
    });
}

function WeightChart({
  entries,
  weightUnit,
}: {
  entries: HistoryEntry[];
  weightUnit: WeightUnit;
}) {
  const chartData = useMemo(() => {
    const sorted = weighIns(entries);
    if (sorted.length === 0) return null;
    const toUnit = (kg: number) => (weightUnit === 'lbs' ? kgToLbs(kg) : kg);
    const points = sorted.map((e, i) => ({
      value: toUnit(e.weight),
      label: i === 0 || i === sorted.length - 1 ? formatDateShort(e.date) : '',
    }));
    if (points.length === 1) points.push({ ...points[0] });
    return points;
  }, [entries, weightUnit]);

  // Zoom the Y axis around the data so small changes are visible (instead of starting at 0).
  const yScale = useMemo(() => {
    if (!chartData) return null;
    const values = chartData.map((p) => p.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const padding = Math.max(1, (max - min) * 0.2);
    const offset = Math.max(0, Math.floor(min - padding));
    const range = Math.max(4, Math.ceil(max + padding - offset));
    const sections = 4;
    const step = Math.ceil(range / sections);
    return { offset, maxValue: step * sections, step, sections };
  }, [chartData]);

  if (!chartData || chartData.length === 0 || !yScale) {
    return (
      <View style={[styles.chartContainer, styles.chartPlaceholder]}>
        <Text style={styles.chartPlaceholderText}>Add weight entries to see your progress</Text>
      </View>
    );
  }

  return (
    <View style={styles.chartContainer}>
      <LineChart
        data={chartData}
        areaChart
        curved
        thickness={3}
        color={ORANGE}
        startFillColor={ORANGE_LIGHT}
        endFillColor={ORANGE_LIGHT}
        startOpacity={0.5}
        endOpacity={0}
        gradientDirection="vertical"
        hideDataPoints={false}
        dataPointsColor="#FFFFFF"
        dataPointsRadius={6}
        textColor1={theme.colors.text.secondary}
        textFontSize={10}
        width={SCREEN_WIDTH - 48}
        initialSpacing={16}
        endSpacing={16}
        spacing={Math.max(40, (SCREEN_WIDTH - 80) / chartData.length)}
        noOfSections={yScale.sections}
        yAxisOffset={yScale.offset}
        maxValue={yScale.maxValue}
        stepValue={yScale.step}
        yAxisColor="transparent"
        yAxisThickness={0}
        xAxisColor="#E2E8F0"
        rulesType="solid"
        rulesColor="rgba(226,232,240,0.6)"
        height={CHART_HEIGHT}
        yAxisTextStyle={{ color: theme.colors.text.muted, fontSize: 10 }}
      />
    </View>
  );
}

function StatsRow({
  startWeight,
  currentWeight,
  weightUnit,
}: {
  startWeight: number | undefined;
  currentWeight: number | undefined;
  weightUnit: WeightUnit;
}) {
  const lost = startWeight != null && currentWeight != null ? startWeight - currentWeight : undefined;
  return (
    <View style={styles.statsRow}>
      <View style={styles.statCard}>
        <Text style={styles.statLabel}>Start</Text>
        <Text style={styles.statValue}>
          {startWeight != null ? formatWeight(startWeight, weightUnit) : '—'}
        </Text>
        <Text style={styles.statUnit}>{weightUnit}</Text>
      </View>
      <View style={styles.statCard}>
        <Text style={styles.statLabel}>Current</Text>
        <Text style={[styles.statValue, styles.statCurrent]}>
          {currentWeight != null ? formatWeight(currentWeight, weightUnit) : '—'}
        </Text>
        <Text style={styles.statUnit}>{weightUnit}</Text>
      </View>
      <View style={styles.statCard}>
        <Text style={styles.statLabel}>Lost</Text>
        <Text
          style={[
            styles.statValue,
            lost != null && lost > 0 ? styles.statLostPositive : styles.statLost,
          ]}
        >
          {lost != null ? (lost >= 0 ? `−${formatWeight(lost, weightUnit)}` : `+${formatWeight(-lost, weightUnit)}`) : '—'}
        </Text>
        <Text style={styles.statUnit}>{weightUnit}</Text>
      </View>
    </View>
  );
}

function FadeSlideIn({ delay = 0, children }: { delay?: number; children: React.ReactNode }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(14)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 380,
        delay,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 400,
        delay,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }),
    ]).start();
  }, [opacity, translateY, delay]);
  return (
    <Animated.View style={{ opacity, transform: [{ translateY }] }}>
      {children}
    </Animated.View>
  );
}

function TimelineCard({
  entry,
  isFirst,
  isLast,
  weightUnit,
  animationDelay = 0,
  onLongPress,
}: {
  entry: HistoryEntry;
  isFirst: boolean;
  isLast: boolean;
  weightUnit: WeightUnit;
  animationDelay?: number;
  onLongPress?: () => void;
}) {
  const photoUri = entry.photoUri?.startsWith('file://')
    ? entry.photoUri
    : entry.photoUri
      ? `file://${entry.photoUri}`
      : undefined;

  const row = (
    <View style={styles.timelineRow}>
      <View style={styles.timelineRail}>
        {!isFirst && <View style={styles.timelineLine} />}
        <View style={styles.timelineBullet} />
        {!isLast && <View style={styles.timelineLine} />}
      </View>
      <TouchableOpacity style={styles.timelineCard} onLongPress={onLongPress} activeOpacity={0.9} delayLongPress={350}>
        {photoUri ? (
          <Image source={{ uri: photoUri }} style={styles.timelinePhoto} resizeMode="cover" />
        ) : null}
        <View style={styles.timelineCardBody}>
          <Text style={styles.timelineDate}>{formatDateLabel(entry.date)}</Text>
          {entry.weight != null && (
            <Text style={styles.timelineWeight}>
              {formatWeight(entry.weight, weightUnit)} {weightUnit}
            </Text>
          )}
          {entry.note ? (
            <Text style={styles.timelineNote} numberOfLines={2}>
              {entry.note}
            </Text>
          ) : null}
        </View>
      </TouchableOpacity>
    </View>
  );
  return animationDelay >= 0 ? (
    <FadeSlideIn delay={animationDelay}>{row}</FadeSlideIn>
  ) : (
    row
  );
}

/** A fast "counts" when it reached its goal (older entries without a goal: 12h+). */
function isCompleted(f: FastEntry): boolean {
  const duration = f.duration ?? 0;
  return duration >= (f.targetHours ?? 12) * 3600;
}

function computeFastStats(fasts: FastEntry[]) {
  const finished = fasts.filter((f) => f.duration != null);
  const totalSeconds = finished.reduce((sum, f) => sum + (f.duration ?? 0), 0);
  const longest = finished.reduce((max, f) => Math.max(max, f.duration ?? 0), 0);

  // Streak: consecutive local days (ending today or yesterday) with a completed fast ending that day.
  const days = new Set(finished.filter(isCompleted).map((f) => localDayKey(f.endTime ?? f.startTime)));
  let streak = 0;
  const cursor = new Date();
  if (!days.has(localDayKey(cursor))) cursor.setDate(cursor.getDate() - 1);
  while (days.has(localDayKey(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return { count: finished.length, totalSeconds, longest, streak };
}

function FastStatsRow({ fasts }: { fasts: FastEntry[] }) {
  const stats = useMemo(() => computeFastStats(fasts), [fasts]);
  const items = [
    { label: 'Fasts', value: String(stats.count) },
    { label: 'Streak', value: `${stats.streak}d` },
    { label: 'Longest', value: `${Math.floor(stats.longest / 3600)}h` },
    { label: 'Total', value: `${Math.floor(stats.totalSeconds / 3600)}h` },
  ];
  return (
    <View style={styles.statsRow}>
      {items.map((item) => (
        <View key={item.label} style={styles.statCard}>
          <Text style={styles.statLabel}>{item.label}</Text>
          <Text style={styles.statValue}>{item.value}</Text>
        </View>
      ))}
    </View>
  );
}

function FastCard({ fast, onLongPress }: { fast: FastEntry; onLongPress: () => void }) {
  const duration = fast.duration ?? 0;
  const completed = isCompleted(fast);
  const goalSeconds = fast.targetHours ? fast.targetHours * 3600 : null;
  const pct = goalSeconds ? Math.min(duration / goalSeconds, 1) : null;
  return (
    <TouchableOpacity style={styles.fastCard} onLongPress={onLongPress} activeOpacity={0.9} delayLongPress={350}>
      <View style={[styles.fastIcon, { backgroundColor: completed ? '#E6F8F3' : '#FFF5EB' }]}>
        {completed ? <Check size={18} color={GREEN} strokeWidth={3} /> : <X size={18} color={ORANGE} strokeWidth={3} />}
      </View>
      <View style={styles.fastBody}>
        <Text style={styles.fastDuration}>
          {formatDuration(duration)}
          {fast.targetHours ? <Text style={styles.fastGoal}>  / {fast.targetHours}h goal</Text> : null}
        </Text>
        <Text style={styles.fastDate}>
          {formatDateTime(fast.startTime)} → {fast.endTime ? formatDateTime(fast.endTime) : '—'}
        </Text>
        {pct != null ? (
          <View style={styles.fastBar}>
            <View style={[styles.fastBarFill, { width: `${pct * 100}%`, backgroundColor: completed ? GREEN : ORANGE }]} />
          </View>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

export function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const { state } = useApp();
  const { saveProfile, loadProfile, saveHistory } = useVault();
  const weightUnit = (state.config?.weightUnit || 'kg') as WeightUnit;
  const {
    entries,
    loading,
    loadEntries,
    saveEntry,
    deleteEntry,
  } = useHistoryStorage();

  const [tab, setTab] = useState<Tab>('weight');
  const [modalVisible, setModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Entries can be added from other screens (e.g. Profile), so reload whenever the tab gains focus.
  useFocusEffect(
    useCallback(() => {
      loadEntries();
    }, [loadEntries])
  );

  const sortedWeighIns = useMemo(() => weighIns(entries), [entries]);
  const initialWeight = sortedWeighIns[0]?.weight;
  const currentWeight = sortedWeighIns[sortedWeighIns.length - 1]?.weight;

  const fasts = useMemo(
    () => [...(state.history?.fasts ?? [])].sort((a, b) => (b.endTime ?? b.startTime) - (a.endTime ?? a.startTime)),
    [state.history?.fasts]
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadEntries();
    setRefreshing(false);
  };

  const handleSaveEntry = async (input: {
    date: string;
    weight?: number;
    photoUri?: string;
    note?: string;
  }) => {
    const res = await saveEntry(input);
    // Keep the profile weight (and therefore BMR/TDEE estimates) in sync with the latest weigh-in.
    const latest = sortedWeighIns[sortedWeighIns.length - 1];
    const isLatest = !latest || localDayKey(input.date) >= localDayKey(latest.date);
    if (res.success && input.weight && isLatest && state.profile && state.vaultPath) {
      const saved = await saveProfile({ ...state.profile, weight: input.weight });
      if (saved) await loadProfile(state.vaultPath);
    }
    return { success: res.success, error: res.error };
  };

  const confirmDeleteEntry = (entry: HistoryEntry) => {
    Alert.alert('Delete entry?', `${formatDateLabel(entry.date)}${entry.weight != null ? ` — ${formatWeight(entry.weight, weightUnit)} ${weightUnit}` : ''}`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteEntry(entry.id) },
    ]);
  };

  const confirmDeleteFast = (fast: FastEntry) => {
    if (!state.history) return;
    Alert.alert('Delete fast?', `${formatDuration(fast.duration ?? 0)} — ${formatDateTime(fast.startTime)}`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () =>
          saveHistory({ ...state.history!, fasts: state.history!.fasts.filter((f) => f.id !== fast.id) }),
      },
    ]);
  };

  type Row =
    | { key: 'chart' | 'stats' | 'empty' | 'fastStats' | 'fastsEmpty' | 'hint' }
    | { key: string; entry: HistoryEntry; index: number }
    | { key: string; fast: FastEntry };

  const rows: Row[] =
    tab === 'weight'
      ? [
          { key: 'chart' },
          { key: 'stats' },
          ...(entries.length === 0
            ? [{ key: 'empty' } as Row]
            : entries.map((entry, index) => ({ key: entry.id, entry, index }))),
          ...(entries.length > 0 ? [{ key: 'hint' } as Row] : []),
        ]
      : [
          { key: 'fastStats' },
          ...(fasts.length === 0
            ? [{ key: 'fastsEmpty' } as Row]
            : fasts.map((fast) => ({ key: fast.id, fast }))),
          ...(fasts.length > 0 ? [{ key: 'hint' } as Row] : []),
        ];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Progress</Text>
        {tab === 'weight' ? (
          <TouchableOpacity
            style={styles.addButtonTouchable}
            onPress={() => setModalVisible(true)}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={[ORANGE_LIGHT, ORANGE]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.addButtonGradient}
            >
              <Plus size={22} color="#FFF" strokeWidth={2} />
              <Text style={styles.addButtonText}>Add</Text>
            </LinearGradient>
          </TouchableOpacity>
        ) : null}
      </View>

      <View style={styles.segment}>
        {(['weight', 'fasts'] as Tab[]).map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.segmentItem, tab === t && styles.segmentItemActive]}
            onPress={() => setTab(t)}
            activeOpacity={0.8}
          >
            <Text style={[styles.segmentText, tab === t && styles.segmentTextActive]}>
              {t === 'weight' ? 'Weight' : 'Fasts'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading && tab === 'weight' ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={ORANGE} />
        </View>
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(item) => item.key}
          contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 24 }]}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={ORANGE} />
          }
          renderItem={({ item }) => {
            if ('entry' in item) {
              return (
                <TimelineCard
                  entry={item.entry}
                  isFirst={item.index === 0}
                  isLast={item.index === entries.length - 1}
                  weightUnit={weightUnit}
                  animationDelay={Math.min(item.index, 8) * 55}
                  onLongPress={() => confirmDeleteEntry(item.entry)}
                />
              );
            }
            if ('fast' in item) {
              return <FastCard fast={item.fast} onLongPress={() => confirmDeleteFast(item.fast)} />;
            }
            switch (item.key) {
              case 'chart':
                return <WeightChart entries={entries} weightUnit={weightUnit} />;
              case 'stats':
                return (
                  <StatsRow
                    startWeight={initialWeight}
                    currentWeight={currentWeight}
                    weightUnit={weightUnit}
                  />
                );
              case 'fastStats':
                return <FastStatsRow fasts={fasts} />;
              case 'empty':
                return (
                  <View style={styles.empty}>
                    <Text style={styles.emptyText}>No entries yet</Text>
                    <Text style={styles.emptySub}>Tap Add to record weight or a photo</Text>
                  </View>
                );
              case 'fastsEmpty':
                return (
                  <View style={styles.empty}>
                    <Text style={styles.emptyText}>No fasts yet</Text>
                    <Text style={styles.emptySub}>Finished fasts show up here</Text>
                  </View>
                );
              case 'hint':
                return <Text style={styles.hint}>Long-press an item to delete it</Text>;
              default:
                return null;
            }
          }}
        />
      )}

      <AddHistoryModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSaved={() => {}}
        saveEntry={handleSaveEntry}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  addButtonTouchable: {
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4 },
      android: { elevation: 4 },
    }),
  },
  addButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: theme.borderRadius.md,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
  },
  loadingWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  empty: {
    paddingVertical: 48,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text.secondary,
  },
  emptySub: {
    fontSize: 14,
    color: theme.colors.text.muted,
    marginTop: 8,
  },
  hint: {
    fontSize: 12,
    color: theme.colors.text.muted,
    textAlign: 'center',
    marginTop: 4,
  },
  segment: {
    flexDirection: 'row',
    marginHorizontal: 24,
    marginTop: 16,
    padding: 4,
    borderRadius: 12,
    backgroundColor: '#E2E8F0',
  },
  segmentItem: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 9,
    alignItems: 'center',
  },
  segmentItemActive: {
    backgroundColor: '#FFFFFF',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 3 },
      android: { elevation: 2 },
    }),
  },
  segmentText: { fontSize: 14, fontWeight: '600', color: theme.colors.text.secondary },
  segmentTextActive: { color: ORANGE },
  fastCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 },
      android: { elevation: 2 },
    }),
  },
  fastIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  fastBody: { flex: 1 },
  fastDuration: { fontSize: 17, fontWeight: '700', color: theme.colors.text.primary },
  fastGoal: { fontSize: 13, fontWeight: '500', color: theme.colors.text.muted },
  fastDate: { fontSize: 12, color: theme.colors.text.secondary, marginTop: 2 },
  fastBar: {
    height: 4,
    borderRadius: 2,
    backgroundColor: '#EDF2F7',
    marginTop: 8,
    overflow: 'hidden',
  },
  fastBarFill: { height: '100%', borderRadius: 2 },
  chartContainer: {
    marginBottom: 16,
    height: CHART_HEIGHT,
    justifyContent: 'center',
  },
  chartPlaceholder: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 },
      android: { elevation: 2 },
    }),
  },
  chartPlaceholderText: {
    fontSize: 14,
    color: theme.colors.text.muted,
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6 },
      android: { elevation: 2 },
    }),
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  statCurrent: { color: ORANGE },
  statLost: { color: theme.colors.text.secondary },
  statLostPositive: { color: GREEN },
  statUnit: {
    fontSize: 12,
    color: theme.colors.text.muted,
    marginTop: 2,
  },
  timelineRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  timelineRail: {
    width: 24,
    alignItems: 'center',
    marginRight: 14,
  },
  timelineLine: {
    width: 2,
    backgroundColor: TIMELINE_COLOR,
    flex: 1,
    minHeight: 12,
  },
  timelineBullet: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: ORANGE,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 2 },
      android: { elevation: 2 },
    }),
  },
  timelineCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 },
      android: { elevation: 3 },
    }),
  },
  timelinePhoto: {
    width: '100%',
    height: 140,
    backgroundColor: '#F1F5F9',
  },
  timelineCardBody: {
    padding: 14,
  },
  timelineDate: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    marginBottom: 4,
  },
  timelineWeight: {
    fontSize: 20,
    fontWeight: '700',
    color: ORANGE,
  },
  timelineNote: {
    fontSize: 13,
    color: theme.colors.text.muted,
    marginTop: 6,
    lineHeight: 18,
  },
});
