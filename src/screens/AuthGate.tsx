import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { urTheme, urTypography } from '@/constants/urTheme';
import { useAuth } from '@/src/auth/useAuth';

import AuthenticatedHome from './AuthenticatedHome';
import LoginScreen from './LoginScreen';

export default function AuthGate() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.screen}>
        <ActivityIndicator color={urTheme.colors.parchment} size="large" />
        <Text style={styles.message}>Restoring your session...</Text>
      </View>
    );
  }

  if (!user) {
    return <LoginScreen />;
  }

  return <AuthenticatedHome />;
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: urTheme.spacing.sm,
    backgroundColor: urTheme.colors.night,
    paddingHorizontal: urTheme.spacing.lg,
  },
  message: {
    ...urTypography.label,
    color: urTheme.colors.parchment,
    textAlign: 'center',
  },
});
