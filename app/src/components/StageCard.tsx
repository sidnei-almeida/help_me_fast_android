import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Activity, Smile, Target } from 'lucide-react-native';
import {
  FASTING_STAGES,
  getStageIndex,
  getNextStage,
  getStageColor,
} from '../data/fastingStages';
import { formatDuration } from '../utils/date';
import { theme } from '../styles/theme';

const SLATE_900 = '#0f172a';
const SLATE_600 = '#475569';
const SLATE_400 = '#94a3b8';

/** Rich card describing the current fasting stage: what's happening, how it feels, what to do. */
export function StageCard({ elapsedSeconds }: { elapsedSeconds: number }) {
  const hours = elapsedSeconds / 3600;
  const index = getStageIndex(hours);
  const stage = FASTING_STAGES[index];
  const next = getNextStage(hours);
  const color = getStageColor(stage);

  const stageStart = stage.startHours * 3600;
  const stageEnd = next ? next.startHours * 3600 : null;
  const stageProgress = stageEnd ? (elapsedSeconds - stageStart) / (stageEnd - stageStart) : 1;

  const details = [
    { icon: Activity, label: 'What’s happening', text: stage.happening },
    { icon: Smile, label: 'You may notice', text: stage.feel },
    { icon: Target, label: 'Focus now', text: stage.focus },
  ];

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={[styles.dot, { backgroundColor: color }]} />
        <Text style={styles.eyebrow}>
          Stage {index + 1} of {FASTING_STAGES.length}
        </Text>
      </View>
      <Text style={[styles.title, { color }]}>{stage.title}</Text>
      <Text style={styles.summary}>{stage.summary}</Text>

      <View style={styles.track}>
        <View style={[styles.fill, { width: `${Math.min(Math.max(stageProgress, 0), 1) * 100}%`, backgroundColor: color }]} />
      </View>
      <Text style={styles.nextText}>
        {next ? (
          <>
            Next: <Text style={styles.nextStrong}>{next.title}</Text> in {formatDuration(next.startHours * 3600 - elapsedSeconds)}
          </>
        ) : (
          `Final stage · ${formatDuration(elapsedSeconds - stageStart)} in`
        )}
      </Text>

      <View style={styles.divider} />

      {details.map(({ icon: Icon, label, text }) => (
        <View key={label} style={styles.detailRow}>
          <View style={[styles.detailIcon, { backgroundColor: color + '1A' }]}>
            <Icon size={16} color={color} strokeWidth={2.2} />
          </View>
          <View style={styles.detailText}>
            <Text style={styles.detailLabel}>{label}</Text>
            <Text style={styles.detailBody}>{text}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: theme.spacing.md,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 12 },
      android: { elevation: 3 },
    }),
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  eyebrow: {
    fontSize: 11,
    fontWeight: '700',
    color: SLATE_400,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  title: { fontFamily: theme.fontFamily.bold, fontSize: 22, fontWeight: '700' },
  summary: { fontSize: 14, color: SLATE_600, marginTop: 2 },
  track: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EDF2F7',
    marginTop: 14,
    overflow: 'hidden',
  },
  fill: { height: '100%', borderRadius: 3 },
  nextText: { fontSize: 12, color: SLATE_600, marginTop: 8 },
  nextStrong: { fontWeight: '700', color: SLATE_900 },
  divider: { height: 1, backgroundColor: '#EDF2F7', marginVertical: 16 },
  detailRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 14 },
  detailIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  detailText: { flex: 1 },
  detailLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: SLATE_400,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 2,
  },
  detailBody: { fontSize: 14, color: SLATE_900, lineHeight: 20 },
});
