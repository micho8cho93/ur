import { urTheme, urTypography } from '@/constants/urTheme';
import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

export default function OAuthRedirect() {
  return (
    <View style={styles.screen}>
      <ActivityIndicator color={urTheme.colors.parchment} size="large" />
      <Text style={styles.title}>Completing Google sign-in...</Text>
      <Text style={styles.subtitle}>This window should close automatically.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: urTheme.spacing.sm,
    paddingHorizontal: urTheme.spacing.lg,
    backgroundColor: urTheme.colors.night,
  },
  title: {
    ...urTypography.title,
    color: urTheme.colors.ivory,
    fontSize: 28,
    lineHeight: 34,
    textAlign: 'center',
  },
  subtitle: {
    color: urTheme.colors.parchment,
    textAlign: 'center',
    lineHeight: 22,
  },
});
