import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  Image,
  ActivityIndicator,
  Alert,
  Platform,
  Animated,
  Easing,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useApp } from '../context/AppContext';
import { theme } from '../styles/theme';
import { parseWeight } from '../utils/weightConverter';
import { Camera } from 'lucide-react-native';

const BRAND_GRADIENT = ['#FDCB6E', '#E17055'] as const;
const INPUT_BG = '#F8F9FA';
const GRAY_MUTED = '#94a3b8';

interface AddHistoryModalProps {
  visible: boolean;
  onClose: () => void;
  onSaved: () => void;
  saveEntry: (entry: { date: string; weight?: number; photoUri?: string; note?: string }) => Promise<{ success: boolean; entry?: unknown; error?: string }>;
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function parseDateInput(value: string): Date | null {
  const match = value.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  const [, y, m, d] = match;
  const date = new Date(parseInt(y!, 10), parseInt(m!, 10) - 1, parseInt(d!, 10));
  return isNaN(date.getTime()) ? null : date;
}

export function AddHistoryModal({ visible, onClose, onSaved, saveEntry }: AddHistoryModalProps) {
  const { state } = useApp();
  const weightUnit = (state.config?.weightUnit || 'kg') as 'kg' | 'lbs';

  const [weight, setWeight] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [dateStr, setDateStr] = useState(todayISO);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const cardScale = useRef(new Animated.Value(0.92)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) setDateStr(todayISO());
  }, [visible]);

  useEffect(() => {
    if (visible) {
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
  }, [visible, overlayOpacity, cardScale, cardOpacity]);

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

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission', 'We need access to your photos.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    const wRaw = weight.trim() ? weight.replace(',', '.') : '';
    const wKg = wRaw ? parseWeight(wRaw, weightUnit) : undefined;
    if (wKg !== undefined && (wKg <= 0 || isNaN(wKg))) {
      Alert.alert('Invalid weight', 'Enter a valid weight.');
      return;
    }
    if (wKg === undefined && !photoUri) {
      Alert.alert('Add data', 'Add at least weight or a photo.');
      return;
    }
    const dateObj = parseDateInput(dateStr);
    if (!dateObj) {
      Alert.alert('Invalid date', 'Use format YYYY-MM-DD (e.g. ' + todayISO() + ')');
      return;
    }
    if (dateObj > new Date()) {
      Alert.alert('Invalid date', 'Date cannot be in the future.');
      return;
    }

    setSaving(true);
    try {
      const res = await saveEntry({
        date: dateObj.toISOString(),
        weight: wKg,
        photoUri: photoUri ?? undefined,
        note: note.trim() || undefined,
      });
      if (res.success) {
        setWeight('');
        setPhotoUri(null);
        setDateStr(todayISO());
        setNote('');
        onSaved();
        runCloseAnimation(onClose);
      } else {
        Alert.alert('Error', res.error ?? 'Failed to save');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    if (!saving) {
      setWeight('');
      setPhotoUri(null);
      setDateStr(todayISO());
      setNote('');
      runCloseAnimation(onClose);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="none">
      <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={handleClose}>
        <Animated.View style={[StyleSheet.absoluteFill, styles.overlay, { opacity: overlayOpacity }]} pointerEvents="none" />
      </TouchableOpacity>
      <Animated.View
        style={[
          styles.cardWrapper,
          {
            opacity: cardOpacity,
            transform: [{ scale: cardScale }],
          },
        ]}
        pointerEvents="box-none"
      >
        <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()} style={styles.card}>
          <Text style={styles.title}>Add progress</Text>

          <Text style={styles.label}>Weight ({weightUnit})</Text>
          <TextInput
            style={styles.weightInput}
            value={weight}
            onChangeText={setWeight}
            placeholder="0.0"
            placeholderTextColor={GRAY_MUTED}
            keyboardType="decimal-pad"
          />

          <Text style={styles.label}>Photo</Text>
          <TouchableOpacity style={styles.photoButton} onPress={pickImage} activeOpacity={0.8}>
            {photoUri ? (
              <Image source={{ uri: photoUri }} style={styles.photoPreview} resizeMode="cover" />
            ) : (
              <View style={styles.photoPlaceholder}>
                <Camera size={32} color={GRAY_MUTED} strokeWidth={2} />
                <Text style={styles.photoPlaceholderText}>Add photo</Text>
              </View>
            )}
          </TouchableOpacity>

          <Text style={styles.label}>Date (YYYY-MM-DD)</Text>
          <TextInput
            style={styles.dateInput}
            value={dateStr}
            onChangeText={setDateStr}
            placeholder={todayISO()}
            placeholderTextColor={GRAY_MUTED}
            maxLength={10}
          />

          <Text style={styles.label}>Note (optional)</Text>
          <TextInput
            style={styles.noteInput}
            value={note}
            onChangeText={setNote}
            placeholder="Optional note"
            placeholderTextColor={GRAY_MUTED}
            multiline
          />

          <View style={styles.actions}>
            <TouchableOpacity style={styles.cancelButton} onPress={handleClose} disabled={saving}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.saveButtonTouchable}
              onPress={handleSave}
              disabled={saving}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={BRAND_GRADIENT}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.saveButtonGradient}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Text style={styles.saveButtonText}>Save</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15,23,42,0.5)',
  },
  cardWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 32,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.12, shadowRadius: 24 },
      android: { elevation: 12 },
    }),
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 24,
    textAlign: 'center',
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  weightInput: {
    height: 56,
    backgroundColor: INPUT_BG,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: 20,
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginBottom: 20,
  },
  photoButton: {
    alignSelf: 'center',
    marginBottom: 20,
  },
  photoPreview: {
    width: 120,
    height: 120,
    borderRadius: 16,
  },
  photoPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 16,
    backgroundColor: INPUT_BG,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
  },
  photoPlaceholderText: {
    fontSize: 14,
    color: GRAY_MUTED,
    marginTop: 8,
  },
  dateInput: {
    height: 48,
    backgroundColor: INPUT_BG,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: 16,
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 20,
  },
  noteInput: {
    minHeight: 64,
    backgroundColor: INPUT_BG,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: theme.colors.text.primary,
    marginBottom: 24,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    height: 52,
    borderRadius: theme.borderRadius.md,
    backgroundColor: INPUT_BG,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.secondary,
  },
  saveButtonTouchable: { flex: 1 },
  saveButtonGradient: {
    height: 52,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
