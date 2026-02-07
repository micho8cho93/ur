import { Button } from '@/components/ui/Button';
import { urTheme, urTextures, urTypography } from '@/constants/urTheme';
import { useMatchmaking } from '@/hooks/useMatchmaking';
import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

export default function Lobby() {
  const { startMatch, status, errorMessage } = useMatchmaking();

  const handleStart = async () => {
    await startMatch();
  };

  const isBusy = status === 'connecting' || status === 'searching';
  const buttonTitle =
    status === 'error' ? 'Retry Matchmaking' : isBusy ? 'Searching...' : 'Start Game';

  const statusLabel = (() => {
    switch (status) {
      case 'connecting':
        return 'Connecting to Nakama...';
      case 'searching':
        return 'Finding an opponent...';
      case 'matched':
        return 'Match found. Entering chamber...';
      case 'error':
        return 'Matchmaking failed. Retry?';
      default:
        return 'Ready to begin.';
    }
  })();

  return (
    <View style={styles.screen}>
      <Image source={urTextures.woodDark} resizeMode="repeat" style={styles.pageTexture} />
      <View style={styles.pageGlow} />
      <View style={styles.pageShade} />

      <View style={styles.card}>
        <Image source={urTextures.goldInlay} resizeMode="repeat" style={styles.cardTexture} />
        <View style={styles.cardBorder} />

        <Text style={styles.title}>Summon Match</Text>
        <Text style={styles.subtitle}>Challenge the ancient strategy engine in a crafted arena.</Text>
        <Text style={[styles.statusText, status === 'error' && styles.statusError]}>
          {errorMessage ?? statusLabel}
        </Text>

        <Button title={buttonTitle} loading={isBusy} onPress={handleStart} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: urTheme.spacing.md,
    backgroundColor: urTheme.colors.night,
  },
  pageTexture: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.28,
  },
  pageGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '42%',
    backgroundColor: 'rgba(90, 132, 177, 0.18)',
  },
  pageShade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '45%',
    backgroundColor: 'rgba(7, 11, 16, 0.24)',
  },
  card: {
    width: '100%',
    maxWidth: 420,
    borderRadius: urTheme.radii.lg,
    borderWidth: 1.4,
    borderColor: 'rgba(217, 164, 65, 0.74)',
    padding: urTheme.spacing.lg,
    overflow: 'hidden',
    backgroundColor: 'rgba(13, 15, 18, 0.64)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.28,
    shadowRadius: 14,
    elevation: 9,
  },
  cardTexture: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.16,
  },
  cardBorder: {
    ...StyleSheet.absoluteFillObject,
    margin: urTheme.spacing.xs,
    borderRadius: urTheme.radii.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 231, 192, 0.25)',
  },
  title: {
    ...urTypography.title,
    color: urTheme.colors.parchment,
    fontSize: 32,
    lineHeight: 38,
    marginBottom: urTheme.spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    color: 'rgba(238, 223, 197, 0.85)',
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: urTheme.spacing.md,
  },
  statusText: {
    ...urTypography.label,
    color: 'rgba(216, 232, 251, 0.9)',
    fontSize: 11,
    marginBottom: urTheme.spacing.md,
    textAlign: 'center',
  },
  statusError: {
    color: '#F6AAA2',
  },
});
