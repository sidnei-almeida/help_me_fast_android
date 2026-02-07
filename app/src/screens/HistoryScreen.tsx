import React, { useMemo, useState, useEffect, useRef } from 'react';
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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { LineChart } from 'react-native-gifted-charts';
import { Plus } from 'lucide-react-native';
import { useApp } from '../context/AppContext';
import { useHistoryStorage, type HistoryEntry } from '../hooks/useHistoryStorage';
import { formatWeight, WeightUnit } from '../utils/weightConverter';
import { AddHistoryModal } from '../components/AddHistoryModal';
import { theme } from '../styles/theme';

const ORANGE = '#E17055';
const ORANGE_LIGHT = '#FDCB6E';
const GREEN = '#00B894';
const TIMELINE_COLOR = '#E2E8F0';
const CHART_HEIGHT = 200;
const { width: SCREEN_WIDTH } = Dimensions.get('window');

function formatDateShort(iso: string): string {
  const d = new Date(iso);
  const day = d.getDate();
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = months[d.getMonth()];
  return `${day} ${month}`;
}

function formatDateLabel(iso: string): string {
  const d = new Date(iso);
  const day = d.getDate();
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = months[d.getMonth()];
  return `${day} ${month}`;
}

function WeightChart({
  entries,
  weightUnit,
}: {
  entries: HistoryEntry[];
  weightUnit: WeightUnit;
}) {
  const chartData = useMemo(() => {
    const withWeight = entries.filter((e): e is HistoryEntry & { weight: number } => e.weight != null);
    if (withWeight.length === 0) return null;
    const sorted = [...withWeight].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const points = sorted.map((e, i) => ({
      value: e.weight!,
      label: i === 0 || i === sorted.length - 1 ? formatDateShort(e.date) : '',
    }));
    if (points.length === 1) return [points[0], { ...points[0] }];
    return points;
  }, [entries, weightUnit]);

  if (!chartData || chartData.length === 0) {
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
        noOfSections={4}
        maxValue={undefined}
        yAxisColor="transparent"
        yAxisThickness={0}
        xAxisColor="#E2E8F0"
        xAxisLabelWidth={40}
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
}: {
  entry: HistoryEntry;
  isFirst: boolean;
  isLast: boolean;
  weightUnit: WeightUnit;
  animationDelay?: number;
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
      <View style={styles.timelineCard}>
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
      </View>
    </View>
  );
  return animationDelay >= 0 ? (
    <FadeSlideIn delay={animationDelay}>{row}</FadeSlideIn>
  ) : (
    row
  );
}

export function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const { state } = useApp();
  const weightUnit = (state.config?.weightUnit || 'kg') as WeightUnit;
  const {
    entries,
    loading,
    loadEntries,
    saveEntry,
    initialWeight,
    currentWeight,
  } = useHistoryStorage();

  const [modalVisible, setModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

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
    return { success: res.success, error: res.error };
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Progress</Text>
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
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={ORANGE} />
        </View>
      ) : (
        <FlatList
          data={
            entries.length === 0
              ? [{ key: 'chart' }, { key: 'stats' }, { key: 'empty' }]
              : [{ key: 'chart' }, { key: 'stats' }, ...entries.map((e) => ({ ...e, key: e.id }))]
          }
          keyExtractor={(item) => (item as { key?: string; id?: string }).key ?? (item as HistoryEntry).id}
          contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 24 }]}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={ORANGE} />
          }
          renderItem={({ item, index }) => {
            const key = (item as { key?: string }).key;
            if (key === 'chart') {
              return <WeightChart entries={entries} weightUnit={weightUnit} />;
            }
            if (key === 'stats') {
              return (
                <StatsRow
                  startWeight={initialWeight}
                  currentWeight={currentWeight}
                  weightUnit={weightUnit}
                />
              );
            }
            if (key === 'empty') {
              return (
                <View style={styles.empty}>
                  <Text style={styles.emptyText}>No entries yet</Text>
                  <Text style={styles.emptySub}>Tap Add to record weight or a photo</Text>
                </View>
              );
            }
            const entry = item as HistoryEntry;
            const entryIndex = index - 2;
            return (
              <TimelineCard
                entry={entry}
                isFirst={entryIndex === 0}
                isLast={entryIndex === entries.length - 1}
                weightUnit={weightUnit}
                animationDelay={entryIndex * 55}
              />
            );
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
