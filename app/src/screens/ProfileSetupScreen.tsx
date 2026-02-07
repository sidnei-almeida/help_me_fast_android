import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Modal,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { LinearGradient } from 'expo-linear-gradient';
import { useApp } from '../context/AppContext';
import { useVault } from '../hooks/useVault';
import { useHistoryStorage } from '../hooks/useHistoryStorage';
import { calculateTMB } from '../utils/calculateTMB';
import { parseWeight, formatWeight, WeightUnit } from '../utils/weightConverter';
import { Profile } from '../types';
import { theme } from '../styles/theme';
import { Camera, Check } from 'lucide-react-native';

const BRAND_GRADIENT = ['#FDCB6E', '#E17055'] as const;
const INPUT_BG = '#F8F9FA';
const INPUT_BG_FOCUS = '#FFFFFF';
const BORDER_ORANGE = '#E17055';
const CARD_ACTIVE_BG = '#FFF5EB';
const SLATE_800 = '#1e293b';
const GRAY_MUTED = '#94a3b8';
const DANGER_SOFT = '#e11d48';

const ACTIVITY_OPTIONS: { value: Profile['activityLevel']; label: string }[] = [
  { value: 'sedentary', label: 'Sedentary' },
  { value: 'light', label: 'Light (1–3 days/week)' },
  { value: 'moderate', label: 'Moderate (3–5 days/week)' },
  { value: 'active', label: 'Active (6–7 days/week)' },
  { value: 'very_active', label: 'Very active' },
];

export function ProfileSetupScreen() {
  const { state } = useApp();
  const { saveProfile, saveConfig, loadProfile, deleteVault, saveAvatarToVault } = useVault();
  const { entries: historyEntries, saveEntry: saveHistoryEntry } = useHistoryStorage();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(state.profile?.avatar ?? null);
  const [avatarChanged, setAvatarChanged] = useState(false);
  const avatarChangedRef = useRef(false);
  avatarChangedRef.current = avatarChanged;

  const [weightUnit, setWeightUnit] = useState<WeightUnit>((state.config?.weightUnit || 'kg') as WeightUnit);
  const [form, setForm] = useState({
    name: '',
    weight: '',
    height: '',
    age: '',
    gender: 'male' as 'male' | 'female',
    activityLevel: 'moderate' as Profile['activityLevel'],
  });

  useEffect(() => {
    const p = state.profile;
    const unit = (state.config?.weightUnit || 'kg') as WeightUnit;
    setWeightUnit(unit);
    if (p) {
      setForm({
        name: p.name ?? '',
        weight: p.weight != null && p.weight > 0 ? formatWeight(p.weight, unit) : '',
        height: p.height != null && p.height > 0 ? String(p.height) : '',
        age: p.age != null && p.age > 0 ? String(p.age) : '',
        gender: p.gender ?? 'male',
        activityLevel: p.activityLevel ?? 'moderate',
      });
      if (!avatarChangedRef.current) setAvatarPreview(p.avatar ?? null);
    }
  }, [state.profile, state.config?.weightUnit]);

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
      setAvatarPreview(result.assets[0].uri);
      setAvatarChanged(true);
    }
  };

  const handleSave = async () => {
    const name = form.name.trim();
    const weight = parseWeight(form.weight, weightUnit);
    const height = parseFloat(form.height);
    const age = parseInt(form.age, 10);

    if (!name) {
      setError('Please enter your name');
      return;
    }
    if (!weight || !height || !age || weight <= 0 || height <= 0 || age <= 0) {
      setError('Please enter valid weight, height and age');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const profile: Profile = {
        ...state.profile,
        name,
        weight,
        height,
        age,
        gender: form.gender,
        activityLevel: form.activityLevel,
        tmb: 0,
      };
      profile.tmb = calculateTMB(profile);

      if (avatarChanged && avatarPreview && state.vaultPath) {
        let dataUri = avatarPreview;
        if (avatarPreview.startsWith('file:')) {
          const base64 = await FileSystem.readAsStringAsync(avatarPreview, {
            encoding: FileSystem.EncodingType.Base64,
          });
          dataUri = `data:image/jpeg;base64,${base64}`;
        }
        await saveAvatarToVault(state.vaultPath, dataUri);
        profile.avatar = 'avatar.png';
      } else if (state.profile?.avatar && !avatarChanged) {
        profile.avatar = state.profile.avatar;
      }

      const currentConfig = state.config || {
        vaultPath: state.vaultPath!,
        theme: 'light',
        notifications: true,
        dangerZones: [{ start: 18, end: 20 }],
        weightUnit: 'kg',
      };
      await saveConfig({ ...currentConfig, weightUnit });

      await saveProfile(profile);

      if (historyEntries.length === 0 && weight) {
        await saveHistoryEntry({
          date: new Date().toISOString(),
          weight,
          note: 'Initial weight (profile)',
          photoUri: avatarPreview?.startsWith('file:') ? avatarPreview : undefined,
        });
      }

      await loadProfile(state.vaultPath!);
      setAvatarChanged(false);
    } catch (e) {
      setError('Error saving: ' + (e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = () => {
    setShowDeleteConfirm(false);
    deleteVault();
  };

  const isFocused = (id: string) => focusedField === id;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>Your Profile</Text>

          <TouchableOpacity style={styles.avatarWrap} onPress={pickImage} activeOpacity={0.9}>
            <LinearGradient
              colors={BRAND_GRADIENT}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.avatarGradientRing}
            >
              <View style={styles.avatarInner}>
                {avatarPreview ? (
                  <Image source={{ uri: avatarPreview }} style={styles.avatarImage} resizeMode="cover" />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Camera size={36} color={GRAY_MUTED} strokeWidth={2} />
                    <Text style={styles.avatarPlaceholderText}>Photo</Text>
                  </View>
                )}
              </View>
            </LinearGradient>
          </TouchableOpacity>

          <Text style={styles.label}>Name</Text>
          <View style={[styles.inputWrap, isFocused('name') && styles.inputWrapFocused]}>
            <TextInput
              style={styles.input}
              value={form.name}
              onChangeText={(t) => setForm((f) => ({ ...f, name: t }))}
              placeholder="e.g. Alex"
              placeholderTextColor={GRAY_MUTED}
              onFocus={() => setFocusedField('name')}
              onBlur={() => setFocusedField(null)}
            />
          </View>

          <Text style={styles.label}>Weight</Text>
          <View style={[styles.inputWrap, isFocused('weight') && styles.inputWrapFocused]}>
            <TextInput
              style={[styles.input, styles.inputWithSuffix]}
              value={form.weight}
              onChangeText={(t) => setForm((f) => ({ ...f, weight: t }))}
              placeholder={weightUnit === 'kg' ? '75.5' : '166'}
              placeholderTextColor={GRAY_MUTED}
              keyboardType="decimal-pad"
              onFocus={() => setFocusedField('weight')}
              onBlur={() => setFocusedField(null)}
            />
            <TouchableOpacity
              style={styles.suffixTouch}
              onPress={() => setWeightUnit(weightUnit === 'kg' ? 'lbs' : 'kg')}
              hitSlop={8}
            >
              <Text style={styles.suffixText}>{weightUnit}</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>Height</Text>
          <View style={[styles.inputWrap, isFocused('height') && styles.inputWrapFocused]}>
            <TextInput
              style={[styles.input, styles.inputWithSuffix]}
              value={form.height}
              onChangeText={(t) => setForm((f) => ({ ...f, height: t }))}
              placeholder="175"
              placeholderTextColor={GRAY_MUTED}
              keyboardType="number-pad"
              onFocus={() => setFocusedField('height')}
              onBlur={() => setFocusedField(null)}
            />
            <View style={styles.suffixStatic}>
              <Text style={styles.suffixText}>cm</Text>
            </View>
          </View>

          <Text style={styles.label}>Age</Text>
          <View style={[styles.inputWrap, isFocused('age') && styles.inputWrapFocused]}>
            <TextInput
              style={styles.input}
              value={form.age}
              onChangeText={(t) => setForm((f) => ({ ...f, age: t }))}
              placeholder="30"
              placeholderTextColor={GRAY_MUTED}
              keyboardType="number-pad"
              onFocus={() => setFocusedField('age')}
              onBlur={() => setFocusedField(null)}
            />
          </View>

          <Text style={styles.label}>Gender</Text>
          <View style={styles.genderRow}>
            <TouchableOpacity
              style={[styles.genderCard, form.gender === 'male' && styles.cardActive]}
              onPress={() => setForm((f) => ({ ...f, gender: 'male' }))}
              activeOpacity={0.8}
            >
              <Text style={[styles.genderCardText, form.gender === 'male' && styles.cardActiveText]}>Male</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.genderCard, form.gender === 'female' && styles.cardActive]}
              onPress={() => setForm((f) => ({ ...f, gender: 'female' }))}
              activeOpacity={0.8}
            >
              <Text style={[styles.genderCardText, form.gender === 'female' && styles.cardActiveText]}>Female</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>Activity level</Text>
          {ACTIVITY_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              style={[styles.activityCard, form.activityLevel === opt.value && styles.cardActive]}
              onPress={() => setForm((f) => ({ ...f, activityLevel: opt.value }))}
              activeOpacity={0.8}
            >
              <Text style={[styles.activityCardText, form.activityLevel === opt.value && styles.cardActiveText]}>
                {opt.label}
              </Text>
              {form.activityLevel === opt.value && (
                <View style={styles.checkWrap}>
                  <Check size={18} color={BORDER_ORANGE} strokeWidth={2.5} />
                </View>
              )}
            </TouchableOpacity>
          ))}

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <TouchableOpacity
            style={styles.saveButtonTouchable}
            onPress={handleSave}
            disabled={loading}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={BRAND_GRADIENT}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.saveButtonGradient, loading && styles.saveButtonDisabled]}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" size="small" />
              ) : (
                <Text style={styles.saveButtonText}>Save profile</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <View style={styles.dangerZone}>
            <Text style={styles.dangerDesc}>
              Disconnecting the vault does not delete files on your device.
            </Text>
            <TouchableOpacity onPress={() => setShowDeleteConfirm(true)} hitSlop={12} style={styles.dangerTextButton}>
              <Text style={styles.dangerText}>Disconnect vault</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal visible={showDeleteConfirm} transparent animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowDeleteConfirm(false)}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Disconnect vault?</Text>
            <Text style={styles.modalText}>
              You will return to the welcome screen. Files on your device remain.
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setShowDeleteConfirm(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalConfirm} onPress={handleDisconnect}>
                <Text style={styles.modalConfirmText}>Disconnect</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF' },
  flex: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { padding: 24, paddingBottom: 100 },
  title: {
    fontFamily: theme.fontFamily.bold,
    fontSize: 28,
    fontWeight: '700',
    color: SLATE_800,
    textAlign: 'center',
    marginBottom: 24,
  },
  avatarWrap: { alignSelf: 'center', marginBottom: 28 },
  avatarGradientRing: {
    width: 120,
    height: 120,
    borderRadius: 60,
    padding: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInner: {
    width: '100%',
    height: '100%',
    borderRadius: 57,
    overflow: 'hidden',
    backgroundColor: INPUT_BG,
  },
  avatarImage: { width: '100%', height: '100%' },
  avatarPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarPlaceholderText: { fontSize: 13, color: GRAY_MUTED, marginTop: 6 },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: SLATE_800,
    marginBottom: 8,
  },
  inputWrap: {
    backgroundColor: INPUT_BG,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  inputWrapFocused: {
    backgroundColor: INPUT_BG_FOCUS,
    borderWidth: 1.5,
    borderColor: BORDER_ORANGE,
  },
  input: {
    padding: 0,
    fontSize: 16,
    color: SLATE_800,
    minHeight: 24,
  },
  inputWithSuffix: { paddingRight: 44 },
  suffixTouch: { position: 'absolute', right: 16, top: 0, bottom: 0, justifyContent: 'center' },
  suffixStatic: { position: 'absolute', right: 16, top: 0, bottom: 0, justifyContent: 'center' },
  suffixText: {
    fontSize: 15,
    color: GRAY_MUTED,
    fontWeight: '500',
  },
  genderRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  genderCard: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: INPUT_BG,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardActive: {
    backgroundColor: CARD_ACTIVE_BG,
    borderWidth: 1.5,
    borderColor: BORDER_ORANGE,
  },
  genderCardText: { fontSize: 16, color: GRAY_MUTED, fontWeight: '500' },
  cardActiveText: { color: BORDER_ORANGE, fontWeight: '700' },
  activityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: INPUT_BG,
    marginBottom: 10,
  },
  activityCardText: { fontSize: 15, color: GRAY_MUTED, fontWeight: '500', flex: 1 },
  checkWrap: { marginLeft: 8 },
  error: {
    marginTop: 8,
    marginBottom: 8,
    fontSize: 14,
    color: DANGER_SOFT,
  },
  saveButtonTouchable: { width: '100%', marginTop: 24 },
  saveButtonGradient: {
    width: '100%',
    height: 56,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: BORDER_ORANGE,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  saveButtonDisabled: { opacity: 0.7 },
  saveButtonText: { fontFamily: theme.fontFamily.bold, color: '#FFF', fontSize: 18, fontWeight: '700' },
  dangerZone: {
    marginTop: 40,
    alignItems: 'center',
  },
  dangerDesc: {
    fontSize: 13,
    color: GRAY_MUTED,
    textAlign: 'center',
    marginBottom: 12,
  },
  dangerTextButton: { paddingVertical: 8, paddingHorizontal: 16 },
  dangerText: { fontSize: 15, color: DANGER_SOFT, fontWeight: '600' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 28,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
  },
  modalTitle: { fontSize: 20, fontWeight: '700', color: SLATE_800, marginBottom: 12 },
  modalText: { fontSize: 15, color: GRAY_MUTED, textAlign: 'center', marginBottom: 24, lineHeight: 22 },
  modalButtons: { flexDirection: 'row', gap: 12, width: '100%' },
  modalCancel: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: INPUT_BG,
    alignItems: 'center',
  },
  modalCancelText: { fontSize: 16, fontWeight: '600', color: SLATE_800 },
  modalConfirm: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: DANGER_SOFT,
    alignItems: 'center',
  },
  modalConfirmText: { fontSize: 16, fontWeight: '600', color: '#FFF' },
});
