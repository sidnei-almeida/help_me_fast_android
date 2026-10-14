import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Check, Flag } from 'lucide-react-native';
import { getStagesForGoal, getStageColor, getStageIndex, FASTING_STAGES } from '../data/fastingStages';
import { formatDuration, formatRelativeTime } from '../utils/date';
import { theme } from '../styles/theme';

const SLATE_900 = '#0f172a';
const SLATE_600 = '#475569';
const SLATE_400 = '#94a3b8';
const RAIL = '#E2E8F0';
const GREEN = '#00B894';

type Milestone =
  | { kind: 'stage'; hours: number; title: string; color: string; stageIndex: number }
  | { kind: 'goal'; hours: number };

interface JourneyTimelineProps {
  elapsedSeconds: number;
  goalHours: number;
  startTime: number;
}

/** Vertical timeline of the stages this fast passes through, with the goal marked in place. */
export function JourneyTimeline({ elapsedSeconds, goalHours, startTime }: JourneyTimelineProps) {
  const hoursNow = elapsedSeconds / 3600;
  const currentIndex = getStageIndex(hoursNow);

  const milestones: Milestone[] = getStagesForGoal(goalHours).map((s) => ({
    kind: 'stage' as const,
    hours: s.startHours,
    title: s.title,
    color: getStageColor(s),
    stageIndex: FASTING_STAGES.indexOf(s),
  }));
  // Insert the goal right after the last stage that starts at or before it.
  const goalPos = milestones.filter((m) => m.hours <= goalHours).length;
  milestones.splice(goalPos, 0, { kind: 'goal', hours: goalHours });

  return (
    <View style={styles.card}>
      <Text style={styles.heading}>Your journey</Text>
      {milestones.map((m, i) => {
        const isLast = i === milestones.length - 1;
        const reached = hoursNow >= m.hours;
        const isCurrent = m.kind === 'stage' && m.stageIndex === currentIndex;
        const at = startTime + m.hours * 3600 * 1000;
        const color = m.kind === 'goal' ? GREEN : m.color;

        let meta: string;
        if (isCurrent) meta = 'Now';
        else if (reached) meta = m.kind === 'goal' ? 'Reached' : 'Done';
        else meta = `in ${formatDuration(m.hours * 3600 - elapsedSeconds)}`;

        return (
          <View key={`${m.kind}-${m.hours}`} style={styles.row}>
            <View style={styles.rail}>
              <View style={[styles.lineTop, i === 0 ? styles.lineHidden : reached && { backgroundColor: color }]} />
              <View
                style={[
                  styles.node,
                  reached ? { backgroundColor: color, borderColor: color } : { borderColor: RAIL },
                  isCurrent && styles.nodeCurrent,
                  isCurrent && { borderColor: color + '55' },
                ]}
              >
                {m.kind === 'goal' ? (
                  <Flag size={11} color={reached ? '#FFF' : SLATE_400} strokeWidth={2.5} />
                ) : reached && !isCurrent ? (
                  <Check size={11} color="#FFF" strokeWidth={3} />
                ) : null}
              </View>
              <View
                style={[
                  styles.line,
                  isLast && styles.lineHidden,
                  !isLast && hoursNow >= milestones[i + 1].hours && { backgroundColor: color },
                ]}
              />
            </View>
            <View style={[styles.content, isCurrent && { backgroundColor: color + '12' }]}>
              <View style={styles.contentText}>
                <Text style={[styles.hour, isCurrent && { color }]}>{m.hours}h</Text>
                <Text
                  style={[
                    styles.title,
                    reached && !isCurrent && styles.titleDone,
                    isCurrent && { color, fontWeight: '700' },
                    m.kind === 'goal' && { color: GREEN, fontWeight: '700' },
                  ]}
                  numberOfLines={1}
                >
                  {m.kind === 'goal' ? 'Your goal' : m.title}
                </Text>
              </View>
              <View style={styles.metaWrap}>
                <Text style={[styles.meta, isCurrent && { color, fontWeight: '700' }]}>{meta}</Text>
                {!reached ? <Text style={styles.at}>{formatRelativeTime(at)}</Text> : null}
              </View>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 18,
    paddingHorizontal: 16,
    marginBottom: theme.spacing.md,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 12 },
      android: { elevation: 3 },
    }),
  },
  heading: {
    fontSize: 11,
    fontWeight: '700',
    color: SLATE_400,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
    marginLeft: 4,
  },
  row: { flexDirection: 'row', minHeight: 52 },
  rail: { width: 28, alignItems: 'center' },
  node: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nodeCurrent: { width: 22, height: 22, borderRadius: 11, borderWidth: 6, marginVertical: -1, backgroundColor: '#FFFFFF' },
  lineTop: { height: 14, width: 2, backgroundColor: RAIL },
  line: { flex: 1, width: 2, backgroundColor: RAIL },
  lineHidden: { backgroundColor: 'transparent' },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginLeft: 8,
    marginVertical: 2,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  contentText: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 10 },
  hour: { width: 42, fontSize: 13, fontWeight: '700', color: SLATE_400 },
  title: { flex: 1, fontSize: 14, fontWeight: '600', color: SLATE_900 },
  titleDone: { color: SLATE_600, fontWeight: '500' },
  metaWrap: { alignItems: 'flex-end', marginLeft: 8, flexShrink: 0 },
  meta: { fontSize: 12, fontWeight: '600', color: SLATE_600 },
  at: { fontSize: 11, color: SLATE_400, marginTop: 1 },
});
