import { Button } from '@/components/ui/Button';
import { MobileBackground, useMobileBackground } from '@/components/ui/MobileBackground';
import { MIN_WIDE_WEB_BACKGROUND_WIDTH, WideScreenBackground } from '@/components/ui/WideScreenBackground';
import { boxShadow } from '@/constants/styleEffects';
import { urTheme, urTextures, urTypography } from '@/constants/urTheme';
import { LobbyMode, useMatchmaking } from '@/hooks/useMatchmaking';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo } from 'react';
import { Image, Platform, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

const multiplayerWideBackground = require('../../assets/images/multiplayer_bg.png');
const multiplayerMobileBackground = require('../../assets/images/multiplayer_bg_mobile.png');

export default function Lobby() {
  const { width } = useWindowDimensions();
  const { mode: rawMode } = useLocalSearchParams<{ mode?: string }>();
  const mode: LobbyMode = useMemo(() => (rawMode === 'online' ? 'online' : 'bot'), [rawMode]);
  const router = useRouter();
  const { startMatch, status, errorMessage, onlineCount } = useMatchmaking(mode);
  const showWideBackground = Platform.OS === 'web' && width >= MIN_WIDE_WEB_BACKGROUND_WIDTH;
  const showMobileBackground = useMobileBackground();

  useEffect(() => {
    if (mode === 'bot') {
      router.replace('/(game)/bot');
    }
  }, [mode, router]);

  if (mode === 'bot') {
    return null;
  }

  const handleStart = async () => {
    await startMatch();
  };

  const isBusy = status === 'connecting' || status === 'searching';

  const buttonTitle = (() => {
    if (status === 'error') return 'Retry Matchmaking';
    if (isBusy) return 'Searching...';
    return 'Find Opponent';
  })();

  const statusLabel = (() => {
    switch (status) {
      case 'connecting':
        return 'Connecting to server...';
      case 'searching':
        return 'Searching for an opponent...';
      case 'matched':
        return 'Opponent found! Entering match...';
      case 'error':
        return 'Could not find an opponent. Try again?';
      default:
        return 'Ready to find an opponent.';
    }
  })();

  return (
    <View style={styles.screen}>
      <WideScreenBackground
        source={multiplayerWideBackground}
        visible={showWideBackground}
        overlayColor="rgba(7, 10, 16, 0.24)"
      />
      <MobileBackground
        source={multiplayerMobileBackground}
        visible={showMobileBackground}
        overlayColor="rgba(7, 10, 16, 0.24)"
      />
      <Image
        source={urTextures.woodDark}
        resizeMode="repeat"
        style={[styles.pageTexture, showWideBackground && styles.pageTextureWide]}
      />
      <View style={styles.pageGlow} />
      <View style={styles.pageShade} />

      <View style={styles.card}>
        <Image source={urTextures.goldInlay} resizeMode="repeat" style={styles.cardTexture} />
        <View style={styles.cardBorder} />

        <Text style={styles.title}>
          {mode === 'online' ? 'Online Match' : 'Bot Match'}
        </Text>
        <Text style={styles.subtitle}>
          {mode === 'online'
            ? 'Challenge a real opponent from across the world.'
            : 'Challenge the ancient strategy engine in a crafted arena.'}
        </Text>

        {mode === 'online' && (
          <View style={styles.onlineCountRow}>
            <View style={[styles.onlineDot, onlineCount && onlineCount > 0 ? styles.onlineDotActive : null]} />
            <Text style={styles.onlineCountText}>
              {onlineCount !== null
                ? `${onlineCount} player${onlineCount !== 1 ? 's' : ''} online`
                : 'Checking...'}
            </Text>
          </View>
        )}

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
  pageTextureWide: {
    opacity: 0.12,
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
    maxWidth: 440,
    borderRadius: urTheme.radii.lg,
    borderWidth: 1.4,
    borderColor: 'rgba(217, 164, 65, 0.74)',
    padding: urTheme.spacing.lg,
    overflow: 'hidden',
    backgroundColor: 'rgba(13, 15, 18, 0.64)',
    ...boxShadow({
      color: '#000',
      opacity: 0.28,
      offset: { width: 0, height: 10 },
      blurRadius: 14,
      elevation: 9,
    }),
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
    fontSize: 34,
    lineHeight: 40,
    marginBottom: urTheme.spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    color: 'rgba(238, 223, 197, 0.85)',
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: urTheme.spacing.md,
  },
  onlineCountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: urTheme.spacing.sm,
    gap: 8,
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(128, 128, 128, 0.6)',
  },
  onlineDotActive: {
    backgroundColor: '#4ADE80',
    ...boxShadow({
      color: '#4ADE80',
      opacity: 0.6,
      blurRadius: 4,
    }),
  },
  onlineCountText: {
    ...urTypography.label,
    color: 'rgba(216, 232, 251, 0.9)',
    fontSize: 13,
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
