import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  TextInput,
  Alert,
  ScrollView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { useVault } from '../hooks/useVault';
import { theme } from '../styles/theme';
import { X, Camera } from 'lucide-react-native';

const BRAND_GRADIENT = ['#FDCB6E', '#E17055'] as const;
const INPUT_BG = '#F8F9FA';
const SLATE_700 = '#334155';
const GRAY_MUTED = '#94a3b8';

const logoSrc = require('../../assets/logo.png');

const TITLE_GRADIENT_HEIGHT = 52;

export function VaultSetupScreen() {
  const { createVaultAndContinue, saveProfile, loadProfile, saveAvatarToVault } = useVault();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState<string | null>(null);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission', 'We need access to your photos for the avatar.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setAvatar(result.assets[0].uri);
    }
  };

  const removeAvatar = () => setAvatar(null);

  const handleContinue = async () => {
    setLoading(true);
    setError(null);
    try {
      const vaultPath = await createVaultAndContinue();
      if (!vaultPath) {
        setError('Could not create vault. Please try again.');
        setLoading(false);
        return;
      }
      let avatarRelPath: string | undefined;
      if (avatar) {
        let dataUri: string;
        if (avatar.startsWith('data:')) {
          dataUri = avatar;
        } else {
          const base64 = await FileSystem.readAsStringAsync(avatar, {
            encoding: FileSystem.EncodingType.Base64,
          });
          dataUri = `data:image/jpeg;base64,${base64}`;
        }
        const result = await saveAvatarToVault(vaultPath, dataUri);
        if (result.success && result.avatarPath) avatarRelPath = result.avatarPath;
      }
      if (name.trim() || avatarRelPath) {
        await saveProfile(
          {
            weight: 0,
            height: 0,
            tmb: 0,
            age: 0,
            gender: 'male',
            activityLevel: 'moderate',
            ...(name.trim() && { name: name.trim() }),
            ...(avatarRelPath && { avatar: avatarRelPath }),
          },
          vaultPath
        );
      }
      await loadProfile(vaultPath);
    } catch (e) {
      setError('Error initializing: ' + (e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Image source={logoSrc} style={styles.logo} resizeMode="contain" />

        <Text style={styles.welcomeText}>Welcome to</Text>
        <View style={styles.titleGradientWrap}>
          <MaskedView
            maskElement={
              <View style={styles.maskInner}>
                <Text style={styles.maskText}>Help Me Fast!</Text>
              </View>
            }
          >
            <LinearGradient
              colors={BRAND_GRADIENT}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.titleGradient}
            />
          </MaskedView>
        </View>

        <Text style={styles.description}>
          Your data stays on your device. Create your profile to get started.
        </Text>

        <TouchableOpacity style={styles.avatarWrap} onPress={pickImage} activeOpacity={0.9}>
          {avatar ? (
            <>
              <LinearGradient
                colors={BRAND_GRADIENT}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.avatarRingFilled}
              >
                <View style={styles.avatarInner}>
                  <Image source={{ uri: avatar }} style={styles.avatarImage} resizeMode="cover" />
                  <TouchableOpacity style={styles.removeAvatar} onPress={removeAvatar} hitSlop={12}>
                    <X size={18} color="#FFF" />
                  </TouchableOpacity>
                </View>
              </LinearGradient>
            </>
          ) : (
            <View style={styles.avatarRingEmpty}>
              <View style={styles.avatarInnerEmpty}>
                <Camera size={36} color={GRAY_MUTED} strokeWidth={1.5} />
                <Text style={styles.avatarPlaceholderText}>Add Photo</Text>
              </View>
            </View>
          )}
        </TouchableOpacity>

        <Text style={styles.label}>Your name</Text>
        <View style={styles.inputWrap}>
          <TextInput
            style={styles.input}
            placeholder="Enter your name"
            placeholderTextColor={GRAY_MUTED}
            value={name}
            onChangeText={setName}
            maxLength={50}
          />
        </View>

        <TouchableOpacity
          style={styles.buttonTouchable}
          onPress={handleContinue}
          disabled={loading}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={BRAND_GRADIENT}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.buttonGradient, loading && styles.buttonDisabled]}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" size="small" />
            ) : (
              <Text style={styles.buttonText}>Create vault & continue</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>

        {error ? <Text style={styles.error}>{error}</Text> : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF' },
  scroll: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    paddingBottom: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 72,
    height: 72,
    marginBottom: 20,
  },
  welcomeText: {
    fontFamily: theme.fontFamily.medium,
    fontSize: 18,
    color: SLATE_700,
    marginBottom: 4,
    textAlign: 'center',
  },
  titleGradientWrap: {
    height: TITLE_GRADIENT_HEIGHT,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  maskInner: {
    height: TITLE_GRADIENT_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  maskText: {
    fontSize: 40,
    fontWeight: '800',
    textAlign: 'center',
    backgroundColor: 'transparent',
    color: 'white',
  },
  titleGradient: {
    height: TITLE_GRADIENT_HEIGHT,
    width: 280,
  },
  description: {
    fontFamily: theme.fontFamily.regular,
    fontSize: 15,
    color: GRAY_MUTED,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
    paddingHorizontal: 16,
  },
  avatarWrap: { marginBottom: 28 },
  avatarRingEmpty: {
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: '#F8F9FA',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
      },
      android: { elevation: 6 },
    }),
  },
  avatarInnerEmpty: {
    flex: 1,
    width: '100%',
    borderRadius: 61,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarPlaceholderText: {
    fontSize: 14,
    color: GRAY_MUTED,
    marginTop: 8,
    fontWeight: '500',
  },
  avatarRingFilled: {
    width: 130,
    height: 130,
    borderRadius: 65,
    padding: 3,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
      },
      android: { elevation: 6 },
    }),
  },
  avatarInner: {
    width: '100%',
    height: '100%',
    borderRadius: 61,
    overflow: 'hidden',
    backgroundColor: '#FFF',
  },
  avatarImage: { width: '100%', height: '100%' },
  removeAvatar: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: SLATE_700,
    alignSelf: 'stretch',
    marginBottom: 8,
    marginHorizontal: 4,
  },
  inputWrap: {
    width: '100%',
    backgroundColor: INPUT_BG,
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginBottom: 24,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: { elevation: 2 },
    }),
  },
  input: {
    padding: 0,
    fontSize: 16,
    color: SLATE_700,
    minHeight: 24,
  },
  buttonTouchable: { width: '100%' },
  buttonGradient: {
    width: '100%',
    height: 56,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#E17055',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
      },
      android: { elevation: 8, shadowColor: '#E17055' },
    }),
  },
  buttonDisabled: { opacity: 0.7 },
  buttonText: {
    fontFamily: theme.fontFamily.bold,
    color: '#FFF',
    fontSize: 17,
    fontWeight: '700',
  },
  error: {
    marginTop: 16,
    fontSize: 14,
    color: '#e11d48',
    textAlign: 'center',
  },
});
