import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Platform } from 'react-native';
import { COMMON_FAST_TYPES } from '../utils/fastTypes';
import { theme } from '../styles/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const H_PADDING = 24;
const GAP = 12;
const COLS = 4;
const CARD_WIDTH = (SCREEN_WIDTH - H_PADDING * 2 - GAP * (COLS - 1)) / COLS;

const ORANGE = '#E17055';
const ORANGE_BG = '#FFF5EB';

interface FastTypeSelectorProps {
  selectedHours: number;
  onSelectHours: (hours: number) => void;
}

const INTERMITTENT = COMMON_FAST_TYPES.filter((t) => t.hours <= 20);
const PROLONGED = COMMON_FAST_TYPES.filter((t) => t.hours > 20);

export function FastTypeSelector({ selectedHours, onSelectHours }: FastTypeSelectorProps) {
  const renderCard = (type: (typeof COMMON_FAST_TYPES)[0]) => {
    const selected = type.hours === selectedHours;
    return (
      <TouchableOpacity
        key={type.id}
        style={[styles.card, selected && styles.cardSelected]}
        onPress={() => onSelectHours(type.hours)}
        activeOpacity={0.85}
      >
        <Text style={[styles.cardHours, selected && styles.cardHoursSelected]}>
          {type.hours}h
        </Text>
        <Text style={[styles.cardLabel, selected && styles.cardLabelSelected]}>
          {type.name}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionLabel}>Intermittent fast</Text>
      <View style={styles.grid}>
        {INTERMITTENT.map(renderCard)}
      </View>
      <Text style={[styles.sectionLabel, styles.sectionLabelSpaced]}>Prolonged</Text>
      <View style={styles.grid}>
        {PROLONGED.map(renderCard)}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%' },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: theme.spacing.xs,
  },
  sectionLabelSpaced: { marginTop: theme.spacing.lg },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GAP,
  },
  card: {
    width: CARD_WIDTH,
    minHeight: 72,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.sm,
    backgroundColor: '#FFFFFF',
    borderRadius: theme.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
      },
      android: { elevation: 2 },
    }),
  },
  cardSelected: {
    borderColor: ORANGE,
    backgroundColor: ORANGE_BG,
  },
  cardHours: {
    fontSize: 22,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  cardHoursSelected: {
    color: ORANGE,
  },
  cardLabel: {
    fontSize: 11,
    color: theme.colors.text.secondary,
    marginTop: 4,
  },
  cardLabelSelected: {
    color: ORANGE,
  },
});
