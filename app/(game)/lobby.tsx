import { Button } from '@/components/ui/Button';
import { MobileBackground, useMobileBackground } from '@/components/ui/MobileBackground';
import { MIN_WIDE_WEB_BACKGROUND_WIDTH, WideScreenBackground } from '@/components/ui/WideScreenBackground';
import { boxShadow } from '@/constants/styleEffects';
import { urTheme, urTextures, urTypography } from '@/constants/urTheme';
import { LobbyMode, useMatchmaking } from '@/hooks/useMatchmaking';
import { PRIVATE_MATCH_OPTIONS } from '@/logic/matchConfigs';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo } from 'react';
import { Image, Platform, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

const multiplayerWideBackground = require('../../assets/images/multiplayer_bg.png');
const multiplayerMobileBackground = require('../../assets/images/multiplayer_bg_mobile.png');

export default function Lobby() {
  const { width } = useWindowDimensions();
  const { mode: rawMode } = useLocalSearchParams<{ mode?: string }>();
  const mode: LobbyMode = useMemo(() => (rawMode === 'online' ? 'online' : 'bot'), [rawMode]);
  const router = useRouter();
  const {
    startMatch,
    startPrivateMatch,
    status,
    errorMessage,
    onlineCount,
    activeAction,
    pendingPrivateMode,
  } = useMatchmaking(mode);
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
  const isFindingOpponent = isBusy && activeAction === 'find_opponent';
  const isCreatingPrivateGame = isBusy && activeAction === 'create_private';
  const pendingPrivateOption = PRIVATE_MATCH_OPTIONS.find((option) => option.modeId === pendingPrivateMode) ?? null;

  const buttonTitle = (() => {
    if (status === 'error' && activeAction !== 'create_private') return 'Retry Matchmaking';
    if (isFindingOpponent) return 'Searching...';
    return 'Find Opponent';
  })();

  const statusLabel = (() => {
    if (status === 'connecting' && activeAction === 'find_opponent') {
      return 'Connecting to the royal court...';
    }

    if (status === 'searching' && activeAction === 'find_opponent') {
      return 'Searching for an opponent...';
    }

    return 'Quick-match into a live public game.';
  })();

  const privateStatusLabel = (() => {
    if (isCreatingPrivateGame) {
      return pendingPrivateOption
        ? `Preparing a ${pendingPrivateOption.label.toLowerCase()} private table...`
        : 'Preparing your private table...';
    }

    return 'Choose a ruleset, create a room, and invite a friend.';
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

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <View style={styles.hero}>
          <Text style={styles.pageTitle}>Online Play</Text>
          <Text style={styles.pageSubtitle}>
            Find a live opponent or open a private board for a friend.
          </Text>

          <View style={styles.onlineCountRow}>
            <View style={[styles.onlineDot, onlineCount && onlineCount > 0 ? styles.onlineDotActive : null]} />
            <Text style={styles.onlineCountText}>
              {onlineCount !== null
                ? `${onlineCount} player${onlineCount !== 1 ? 's' : ''} on site`
                : 'Checking who is on site...'}
            </Text>
          </View>

          {errorMessage ? (
            <View style={styles.errorBanner}>
              <Text style={styles.errorBannerText}>{errorMessage}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.cardGrid}>
          <View style={styles.card}>
            <Image source={urTextures.goldInlay} resizeMode="repeat" style={styles.cardTexture} />
            <View style={styles.cardBorder} />

            <Text style={styles.title}>Find Opponent</Text>
            <Text style={styles.subtitle}>
              Jump into public matchmaking and get paired with the next available player.
            </Text>

            <Text style={[styles.statusText, status === 'error' && activeAction !== 'create_private' && styles.statusError]}>
              {statusLabel}
            </Text>

            <Button title={buttonTitle} loading={isFindingOpponent} disabled={isCreatingPrivateGame} onPress={handleStart} />
          </View>

          <View style={styles.card}>
            <Image source={urTextures.goldInlay} resizeMode="repeat" style={styles.cardTexture} />
            <View style={styles.cardBorder} />

            <Text style={styles.title}>Create Private Game</Text>
            <Text style={styles.subtitle}>
              Invite a friend with a private link. Private wins award reduced XP and challenge rewards stay off.
            </Text>

            <Text style={styles.statusText}>{privateStatusLabel}</Text>

            <View style={styles.optionGrid}>
              {PRIVATE_MATCH_OPTIONS.map((option) => (
                <View key={option.modeId} style={styles.optionCell}>
                  <Button
                    title={option.label}
                    variant="outline"
                    loading={isCreatingPrivateGame && pendingPrivateMode === option.modeId}
                    disabled={isBusy && pendingPrivateMode !== option.modeId}
                    onPress={() => {
                      void startPrivateMatch(option.modeId);
                    }}
                  />
                </View>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: urTheme.colors.night,
  },
  scrollView: {
    width: '100%',
  },
  scrollContent: {
    flexGrow: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: urTheme.spacing.md,
    paddingVertical: urTheme.spacing.xl,
  },
  hero: {
    width: '100%',
    maxWidth: 920,
    alignItems: 'center',
    marginBottom: urTheme.spacing.lg,
  },
  pageTitle: {
    ...urTypography.title,
    color: urTheme.colors.parchment,
    fontSize: 38,
    lineHeight: 42,
    textAlign: 'center',
  },
  pageSubtitle: {
    color: 'rgba(238, 223, 197, 0.86)',
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 560,
    marginTop: urTheme.spacing.xs,
    marginBottom: urTheme.spacing.md,
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
  cardGrid: {
    width: '100%',
    maxWidth: 920,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: urTheme.spacing.md,
  },
  card: {
    width: '100%',
    maxWidth: 440,
    minWidth: 280,
    flexGrow: 1,
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
  errorBanner: {
    width: '100%',
    maxWidth: 620,
    marginTop: urTheme.spacing.sm,
    paddingHorizontal: urTheme.spacing.md,
    paddingVertical: urTheme.spacing.sm,
    borderRadius: urTheme.radii.md,
    borderWidth: 1,
    borderColor: 'rgba(246, 170, 162, 0.4)',
    backgroundColor: 'rgba(80, 22, 18, 0.54)',
  },
  errorBannerText: {
    ...urTypography.label,
    color: '#F6AAA2',
    fontSize: 11,
    textAlign: 'center',
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
  optionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: urTheme.spacing.sm,
  },
  optionCell: {
    flexBasis: 150,
    flexGrow: 1,
  },
});
