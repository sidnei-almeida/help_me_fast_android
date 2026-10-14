import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { HeartPulse, ChevronRight } from 'lucide-react-native';
import { theme } from '../styles/theme';

const SLATE_900 = '#0f172a';
const SLATE_600 = '#475569';
const BORDER_LIGHT = '#E2E8F0';
const ORANGE = '#E17055';

/** Entry point to the check-in flow ("Is this real hunger?"). */
export function PanicButton({ onPress }: { onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.trigger} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.icon}>
        <HeartPulse size={20} color={ORANGE} strokeWidth={2.2} />
      </View>
      <View style={styles.text}>
        <Text style={styles.title}>Struggling right now?</Text>
        <Text style={styles.sub}>Hungry, craving or feeling off? Check in first</Text>
      </View>
      <ChevronRight size={18} color="#94a3b8" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  trigger: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: BORDER_LIGHT,
    borderRadius: 16,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FFF5EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  text: { flex: 1 },
  title: { fontSize: 15, fontWeight: '700', color: SLATE_900 },
  sub: { fontSize: 12, color: SLATE_600, marginTop: 2 },
});
