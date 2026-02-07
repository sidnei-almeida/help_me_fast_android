import React from 'react';
import { ProfileSetupScreen } from './ProfileSetupScreen';

/**
 * Profile tab screen — same as ProfileSetupScreen (edit profile + danger zone).
 * Exported as ProfileScreen so navigator/tab registry can resolve "Profile" → ProfileScreen.
 */
export function ProfileScreen() {
  return <ProfileSetupScreen />;
}
