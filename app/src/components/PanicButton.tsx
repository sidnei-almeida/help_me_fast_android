import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Platform, Animated, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useFastingTimer } from '../hooks/useFastingTimer';
import { theme } from '../styles/theme';

const BRAND_GRADIENT = ['#FDCB6E', '#E17055'] as const;
const SLATE_900 = '#0f172a';
const SLATE_600 = '#475569';
const SLATE_700 = '#334155';
const BORDER_LIGHT = '#E2E8F0';

export function PanicButton() {
  const { isActive, endFast } = useFastingTimer();
  const [showModal, setShowModal] = useState(false);
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const cardScale = useRef(new Animated.Value(0.92)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (showModal) {
      overlayOpacity.setValue(0);
      cardScale.setValue(0.92);
      cardOpacity.setValue(0);
      Animated.parallel([
        Animated.timing(overlayOpacity, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
          easing: Easing.out(Easing.cubic),
        }),
        Animated.timing(cardScale, {
          toValue: 1,
          duration: 320,
          useNativeDriver: true,
          easing: Easing.out(Easing.cubic),
        }),
        Animated.timing(cardOpacity, {
          toValue: 1,
          duration: 280,
          useNativeDriver: true,
          easing: Easing.out(Easing.cubic),
        }),
      ]).start();
    }
  }, [showModal, overlayOpacity, cardScale, cardOpacity]);

  const runCloseAnimation = (onDone: () => void) => {
    Animated.parallel([
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
        easing: Easing.in(Easing.cubic),
      }),
      Animated.timing(cardScale, {
        toValue: 0.96,
        duration: 200,
        useNativeDriver: true,
        easing: Easing.in(Easing.cubic),
      }),
      Animated.timing(cardOpacity, {
        toValue: 0,
        duration: 160,
        useNativeDriver: true,
        easing: Easing.in(Easing.cubic),
      }),
    ]).start(() => onDone());
  };

  const handlePanic = () => {
    if (!isActive) return;
    setShowModal(true);
  };

  const handleRealHunger = () => {
    runCloseAnimation(() => {
      setShowModal(false);
      endFast();
    });
  };

  const handleBoredom = () => {
    runCloseAnimation(() => setShowModal(false));
  };

  const handleCloseOverlay = () => {
    runCloseAnimation(() => setShowModal(false));
  };

  if (!isActive) return null;

  return (
    <>
      <TouchableOpacity style={styles.triggerButton} onPress={handlePanic} activeOpacity={0.8}>
        <Text style={styles.triggerButtonText}>I'm hungry / I'll eat</Text>
      </TouchableOpacity>

      <Modal visible={showModal} transparent animationType="none">
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={handleCloseOverlay}>
          <Animated.View style={[StyleSheet.absoluteFill, styles.overlay, { opacity: overlayOpacity }]} pointerEvents="none" />
        </TouchableOpacity>
        <Animated.View
          style={[
            styles.modalCardWrapper,
            {
              opacity: cardOpacity,
              transform: [{ scale: cardScale }],
            },
          ]}
          pointerEvents="box-none"
        >
          <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Pattern break</Text>
              <Text style={styles.modalSubtitle}>
                Is it <Text style={styles.bold}>real hunger</Text> or <Text style={styles.bold}>boredom / habit</Text>?
              </Text>
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.modalOutline}
                  onPress={handleBoredom}
                  activeOpacity={0.8}
                >
                  <Text style={styles.modalOutlineText}>Boredom / Habit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.modalGradientTouchable}
                  onPress={handleRealHunger}
                  activeOpacity={0.85}
                >
                  <LinearGradient
                    colors={BRAND_GRADIENT}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.modalGradient}
                  >
                    <Text style={styles.modalGradientText}>Real hunger</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        </Animated.View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  triggerButton: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    backgroundColor: theme.colors.surface,
    borderWidth: 1.5,
    borderColor: BORDER_LIGHT,
    borderRadius: theme.borderRadius.md,
    width: '100%',
  },
  triggerButtonText: {
    fontSize: theme.fontSize.base,
    color: theme.colors.text.primary,
    textAlign: 'center',
    fontWeight: '500',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15,23,42,0.5)',
  },
  modalCardWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.12,
        shadowRadius: 24,
      },
      android: { elevation: 12 },
    }),
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: SLATE_900,
    marginBottom: 12,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 16,
    color: SLATE_600,
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 24,
  },
  bold: { fontWeight: '700', color: SLATE_900 },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  modalOutline: {
    flex: 1,
    height: 48,
    borderRadius: theme.borderRadius.md,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: BORDER_LIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOutlineText: {
    fontSize: 14,
    fontWeight: '600',
    color: SLATE_700,
  },
  modalGradientTouchable: { flex: 1 },
  modalGradient: {
    height: 48,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalGradientText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
