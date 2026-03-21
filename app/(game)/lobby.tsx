import { Button } from '@/components/ui/Button';
import { MobileBackground, useMobileBackground } from '@/components/ui/MobileBackground';
import { MIN_WIDE_WEB_BACKGROUND_WIDTH, WideScreenBackground } from '@/components/ui/WideScreenBackground';
import { boxShadow } from '@/constants/styleEffects';
import { urTheme, urTextures, urTypography } from '@/constants/urTheme';
import { LobbyMode, useMatchmaking } from '@/hooks/useMatchmaking';
import { PRIVATE_MATCH_OPTIONS } from '@/logic/matchConfigs';
import { PRIVATE_MATCH_CODE_LENGTH, isPrivateMatchCode, normalizePrivateMatchCodeInput } from '@/shared/privateMatchCode';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Image,
  Platform,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';

const multiplayerWideBackground = require('../../assets/images/multiplayer_bg.png');
const multiplayerMobileBackground = require('../../assets/images/multiplayer_bg_mobile.png');

export default function Lobby() {
  const { width } = useWindowDimensions();
  const { mode: rawMode } = useLocalSearchParams<{ mode?: string }>();
  const mode: LobbyMode = useMemo(() => (rawMode === 'online' ? 'online' : 'bot'), [rawMode]);
  const router = useRouter();
  const [privateCodeInput, setPrivateCodeInput] = useState('');
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const {
    startMatch,
    startPrivateMatch,
    startCreatedPrivateMatch,
    joinPrivateMatchByCode,
    clearCreatedPrivateMatch,
    status,
    errorMessage,
    onlineCount,
    activeAction,
    pendingPrivateMode,
    createdPrivateMatch,
  } = useMatchmaking(mode);
  const showWideBackground = Platform.OS === 'web' && width >= MIN_WIDE_WEB_BACKGROUND_WIDTH;
  const showMobileBackground = useMobileBackground();

  useEffect(() => {
    if (mode === 'bot') {
      router.replace('/(game)/bot');
    }
  }, [mode, router]);

  useEffect(() => {
    if (!copyFeedback) {
      return;
    }

    const timer = setTimeout(() => {
      setCopyFeedback(null);
    }, 1_800);

    return () => {
      clearTimeout(timer);
    };
  }, [copyFeedback]);

  if (mode === 'bot') {
    return null;
  }

  const handleStart = async () => {
    await startMatch();
  };

  const handleJoinPrivateGame = async () => {
    await joinPrivateMatchByCode(privateCodeInput);
  };

  const handleCopyPrivateCode = async () => {
    if (!createdPrivateMatch) {
      return;
    }

    const code = createdPrivateMatch.code;

    try {
      if (Platform.OS === 'web') {
        const clipboard = typeof navigator !== 'undefined' ? navigator.clipboard : undefined;
        if (clipboard?.writeText) {
          await clipboard.writeText(code);
          setCopyFeedback('Code copied.');
          return;
        }
      }

      await Share.share({
        message: `Join my Royal Game of Ur private game with code ${code}.`,
      });
      setCopyFeedback('Share sheet opened.');
    } catch {
      setCopyFeedback('Select the code and copy it manually.');
    }
  };

  const isBusy = status === 'connecting' || status === 'searching';
  const isFindingOpponent = isBusy && activeAction === 'find_opponent';
  const isCreatingPrivateGame = isBusy && activeAction === 'create_private';
  const isJoiningPrivateGame = isBusy && activeAction === 'join_private';
  const pendingPrivateOption = PRIVATE_MATCH_OPTIONS.find((option) => option.modeId === pendingPrivateMode) ?? null;
  const createdPrivateOption =
    PRIVATE_MATCH_OPTIONS.find((option) => option.modeId === createdPrivateMatch?.modeId) ?? null;
  const normalizedPrivateCodeInput = normalizePrivateMatchCodeInput(privateCodeInput);
  const canJoinPrivateGame = isPrivateMatchCode(normalizedPrivateCodeInput) && !isBusy;

  const buttonTitle = (() => {
    if (status === 'error' && activeAction !== 'create_private' && activeAction !== 'join_private') {
      return 'Retry Matchmaking';
    }

    if (isFindingOpponent) {
      return 'Searching...';
    }

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
    if (createdPrivateMatch) {
      return createdPrivateMatch.hasGuestJoined
        ? 'Friend connected. Start when you are ready. The board will unlock once both of you are inside.'
        : 'Your code is ready. Share it now, then start the game whenever you want. The board stays locked until your friend arrives.';
    }

    if (isCreatingPrivateGame) {
      return pendingPrivateOption
        ? `Preparing a ${pendingPrivateOption.label.toLowerCase()} private table...`
        : 'Preparing your private table...';
    }

    return 'Choose a ruleset, generate a short code, and invite a friend. Private wins award reduced XP.';
  })();

  const joinStatusLabel = (() => {
    if (isJoiningPrivateGame) {
      return 'Connecting you to that private table...';
    }

    return 'Enter the short code your friend shared with you.';
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
            Match publicly, create a private table with a short code, or join one your friend already opened.
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

            <Text style={[styles.statusText, status === 'error' && activeAction === 'find_opponent' && styles.statusError]}>
              {statusLabel}
            </Text>

            <Button
              title={buttonTitle}
              loading={isFindingOpponent}
              disabled={isCreatingPrivateGame || isJoiningPrivateGame}
              onPress={handleStart}
            />
          </View>

          <View style={styles.card}>
            <Image source={urTextures.goldInlay} resizeMode="repeat" style={styles.cardTexture} />
            <View style={styles.cardBorder} />

            <Text style={styles.title}>Create Private Game</Text>
            <Text style={styles.subtitle}>
              Make a shareable room code for a friend. Private matches award the lowest XP and never count toward challenges.
            </Text>

            <Text style={styles.statusText}>{privateStatusLabel}</Text>

            {createdPrivateMatch ? (
              <>
                <View style={styles.privateCodePanel}>
                  <Text style={styles.privateCodeEyebrow}>
                    {createdPrivateOption ? `${createdPrivateOption.label} Private Code` : 'Private Game Code'}
                  </Text>
                  <Text selectable style={styles.privateCodeValue}>
                    {createdPrivateMatch.code}
                  </Text>
                  <View style={styles.privatePresenceRow}>
                    <View
                      style={[
                        styles.privatePresenceDot,
                        createdPrivateMatch.hasGuestJoined ? styles.privatePresenceDotReady : null,
                      ]}
                    />
                    <Text style={styles.privatePresenceText}>
                      {createdPrivateMatch.hasGuestJoined ? 'Friend has arrived' : 'Waiting for friend'}
                    </Text>
                  </View>
                  {copyFeedback ? <Text style={styles.copyFeedbackText}>{copyFeedback}</Text> : null}
                </View>

                <View style={styles.actionRow}>
                  <Button title="Copy Code" variant="outline" style={styles.actionButton} onPress={() => void handleCopyPrivateCode()} />
                  <Button title="Start Game" style={styles.actionButton} onPress={startCreatedPrivateMatch} />
                </View>

                <Button title="Pick Another Ruleset" variant="outline" onPress={clearCreatedPrivateMatch} />
              </>
            ) : (
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
            )}
          </View>

          <View style={styles.card}>
            <Image source={urTextures.goldInlay} resizeMode="repeat" style={styles.cardTexture} />
            <View style={styles.cardBorder} />

            <Text style={styles.title}>Enter Private Game Code</Text>
            <Text style={styles.subtitle}>
              Paste the short code your friend sent you to enter their private table.
            </Text>

            <Text style={styles.statusText}>{joinStatusLabel}</Text>

            <TextInput
              value={normalizedPrivateCodeInput}
              onChangeText={(value) => setPrivateCodeInput(normalizePrivateMatchCodeInput(value))}
              autoCapitalize="characters"
              autoCorrect={false}
              maxLength={PRIVATE_MATCH_CODE_LENGTH}
              placeholder="Enter code"
              placeholderTextColor="rgba(247, 229, 203, 0.36)"
              selectionColor={urTheme.colors.goldBright}
              style={styles.codeInput}
            />

            <Button
              title={isJoiningPrivateGame ? 'Joining...' : 'Join Private Game'}
              loading={isJoiningPrivateGame}
              disabled={!canJoinPrivateGame}
              onPress={() => void handleJoinPrivateGame()}
            />
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
    maxWidth: 1080,
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
    maxWidth: 640,
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
    maxWidth: 1080,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: urTheme.spacing.md,
  },
  card: {
    width: '100%',
    maxWidth: 340,
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
    fontSize: 30,
    lineHeight: 36,
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
    lineHeight: 18,
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
    flexBasis: 120,
    flexGrow: 1,
  },
  privateCodePanel: {
    marginBottom: urTheme.spacing.md,
    paddingHorizontal: urTheme.spacing.md,
    paddingVertical: urTheme.spacing.md,
    borderRadius: urTheme.radii.md,
    borderWidth: 1,
    borderColor: 'rgba(217, 164, 65, 0.45)',
    backgroundColor: 'rgba(13, 15, 18, 0.52)',
  },
  privateCodeEyebrow: {
    ...urTypography.label,
    color: urTheme.colors.goldBright,
    fontSize: 11,
    textAlign: 'center',
    letterSpacing: 0.8,
    marginBottom: urTheme.spacing.xs,
  },
  privateCodeValue: {
    color: urTheme.colors.parchment,
    fontSize: 30,
    lineHeight: 34,
    letterSpacing: 2.2,
    textAlign: 'center',
    marginBottom: urTheme.spacing.sm,
  },
  privatePresenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  privatePresenceDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(217, 164, 65, 0.5)',
  },
  privatePresenceDotReady: {
    backgroundColor: '#4ADE80',
    ...boxShadow({
      color: '#4ADE80',
      opacity: 0.55,
      blurRadius: 4,
    }),
  },
  privatePresenceText: {
    color: 'rgba(247, 229, 203, 0.82)',
    fontSize: 12,
    textAlign: 'center',
  },
  copyFeedbackText: {
    marginTop: urTheme.spacing.sm,
    color: 'rgba(216, 232, 251, 0.9)',
    fontSize: 11,
    textAlign: 'center',
  },
  actionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: urTheme.spacing.sm,
    marginBottom: urTheme.spacing.sm,
  },
  actionButton: {
    flexGrow: 1,
    minWidth: 120,
  },
  codeInput: {
    minHeight: 54,
    borderRadius: urTheme.radii.pill,
    borderWidth: 1.3,
    borderColor: 'rgba(217, 164, 65, 0.68)',
    backgroundColor: 'rgba(10, 12, 15, 0.68)',
    color: urTheme.colors.parchment,
    textAlign: 'center',
    fontSize: 22,
    letterSpacing: 2.2,
    paddingHorizontal: urTheme.spacing.md,
    marginBottom: urTheme.spacing.md,
  },
});
