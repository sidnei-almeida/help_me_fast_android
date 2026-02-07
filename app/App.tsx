import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import * as Font from 'expo-font';
import { AppProvider, useApp } from './src/context/AppContext';
import { useVault } from './src/hooks/useVault';
import { getLastVaultPath } from './src/services/vaultStorage';
import { RootNavigator } from './src/navigation/RootNavigator';
import { LoadingScreen } from './src/components/LoadingScreen';

// Load only the Inter weights we use (direct require avoids loading the full @expo-google-fonts/inter index)
const interFonts = {
  Inter_400Regular: require('@expo-google-fonts/inter/400Regular/Inter_400Regular.ttf'),
  Inter_500Medium: require('@expo-google-fonts/inter/500Medium/Inter_500Medium.ttf'),
  Inter_600SemiBold: require('@expo-google-fonts/inter/600SemiBold/Inter_600SemiBold.ttf'),
  Inter_700Bold: require('@expo-google-fonts/inter/700Bold/Inter_700Bold.ttf'),
  Inter_800ExtraBold: require('@expo-google-fonts/inter/800ExtraBold/Inter_800ExtraBold.ttf'),
};

function AppContent() {
  const { initializeVault } = useVault();
  const [booting, setBooting] = useState(true);
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    Font.loadAsync(interFonts).then(() => setFontsLoaded(true)).catch(() => setFontsLoaded(true));
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadLastVault() {
      try {
        const savedPath = await getLastVaultPath();
        if (!cancelled && savedPath) {
          await initializeVault(savedPath);
        }
      } catch (e) {
        console.warn('App: error loading vault', e);
      } finally {
        if (!cancelled) setBooting(false);
      }
    }

    loadLastVault();
    return () => {
      cancelled = true;
    };
  }, [initializeVault]);

  if (!fontsLoaded || booting) {
    return (
      <>
        <LoadingScreen />
        <StatusBar style="dark" />
      </>
    );
  }

  return (
    <>
      <RootNavigator />
      <StatusBar style="dark" />
    </>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

