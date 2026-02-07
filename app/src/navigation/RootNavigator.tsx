import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { Timer, CalendarDays, Settings } from 'lucide-react-native';
import { useApp } from '../context/AppContext';
import { VaultSetupScreen } from '../screens/VaultSetupScreen';
import { ProfileSetupScreen } from '../screens/ProfileSetupScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { TimerScreen } from '../screens/TimerScreen';
import { HistoryScreen } from '../screens/HistoryScreen';
import { theme } from '../styles/theme';

const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: theme.colors.surface },
        headerTintColor: theme.colors.text.primary,
        tabBarActiveTintColor: theme.colors.accent,
        tabBarInactiveTintColor: theme.colors.text.secondary,
        tabBarStyle: { backgroundColor: theme.colors.surface },
      }}
    >
      <Tab.Screen
        name="Timer"
        component={TimerScreen}
        options={{
          title: 'Timer',
          tabBarLabel: 'Timer',
          tabBarIcon: ({ focused, color, size }) => (
            <Timer size={size ?? 24} color={color} strokeWidth={2} />
          ),
        }}
      />
      <Tab.Screen
        name="History"
        component={HistoryScreen}
        options={{
          title: 'History',
          tabBarLabel: 'History',
          tabBarIcon: ({ focused, color, size }) => (
            <CalendarDays size={size ?? 24} color={color} strokeWidth={2} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: 'Profile',
          tabBarLabel: 'Profile',
          tabBarIcon: ({ focused, color, size }) => (
            <Settings size={size ?? 24} color={color} strokeWidth={2} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

function LoadingScreen() {
  return (
    <View style={styles.loading}>
      <ActivityIndicator size="large" color={theme.colors.gradient.start} />
      <Text style={styles.loadingText}>Loading...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  loadingText: {
    fontSize: theme.fontSize.base,
    color: theme.colors.text.secondary,
  },
});

export function RootNavigator() {
  const { state } = useApp();
  const hasVault = !!state.vaultPath;
  const profileComplete = state.profile && state.profile.weight > 0;

  if (!hasVault) {
    return (
      <NavigationContainer>
        <VaultSetupScreen />
      </NavigationContainer>
    );
  }
  if (!profileComplete) {
    return (
      <NavigationContainer>
        <ProfileSetupScreen />
      </NavigationContainer>
    );
  }
  return (
    <NavigationContainer>
      <MainTabs />
    </NavigationContainer>
  );
}
