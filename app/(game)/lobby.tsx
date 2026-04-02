import { HomeActionButton } from '@/components/home/HomeActionButton';
import { XpRewardBadge } from '@/components/progression/XpRewardBadge';
import { TournamentCard } from '@/components/tournaments/TournamentCard';
import { MobileBackground, useMobileBackground } from '@/components/ui/MobileBackground';
import { SketchButton } from '@/components/ui/SketchButton';
import {
  MIN_WIDE_WEB_BACKGROUND_WIDTH,
  WideScreenBackground,
} from '@/components/ui/WideScreenBackground';
import { urTheme } from '@/constants/urTheme';
import { LobbyMode, useMatchmaking } from '@/hooks/useMatchmaking';
import { PRIVATE_MATCH_OPTIONS } from '@/logic/matchConfigs';
import { getXpAwardAmount } from '@/shared/progression';
import {
  PRIVATE_MATCH_CODE_LENGTH,
  isPrivateMatchCode,
  normalizePrivateMatchCodeInput,
} from '@/shared/privateMatchCode';
import {
  HOME_FREDOKA_FONT_FAMILY,
  HOME_SUPERCELL_FONT_FAMILY,
  resolveHomeFredokaFontFamily,
  resolveHomeMagicFontFamily,
} from '@/src/home/homeTheme';
import { useTournamentList } from '@/src/tournaments/useTournamentList';
import { useFonts } from 'expo-font';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ImageBackground,
  Platform,
  ScrollView,
  Share,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  View,
  ViewStyle,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const homeWideBackground = require('../../assets/images/home_bg.png');
const homeMobileBackground = require('../../assets/images/home_bg_mobile.png');
const quickPlayModePanel = require('../../assets/images/quick_play_mode_panel_cropped.png');

type OnlineActionPanelProps = {
  title: string;
  subtitle: string;
  titleFontFamily: string;
  bodyFontFamily: string;
  compact: boolean;
  rewardAmount?: number;
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
};

function OnlineActionPanel({
  title,
  subtitle,
  titleFontFamily,
  bodyFontFamily,
  compact,
  rewardAmount,
  style,
  children,
}: OnlineActionPanelProps) {
  return (
    <ImageBackground
      source={quickPlayModePanel}
      resizeMode="stretch"
      style={[
        styles.modePanel,
        compact ? styles.modePanelCompact : styles.modePanelDesktop,
        style,
      ]}
      imageStyle={styles.modePanelImage}
    >
      {typeof rewardAmount === 'number' ? (
        <XpRewardBadge
          amount={rewardAmount}
          style={[styles.modeRewardBadge, compact && styles.modeRewardBadgeCompact]}
        />
      ) : null}

      <View
        style={[
          styles.modePanelContent,
          compact ? styles.modePanelContentCompact : styles.modePanelContentDesktop,
        ]}
      >
        <Text
          style={[
            styles.modePanelTitle,
            compact ? styles.modePanelTitleCompact : styles.modePanelTitleDesktop,
            { fontFamily: titleFontFamily },
          ]}
        >
          {title}
        </Text>
        <Text
          style={[
            styles.modePanelSubtitle,
            { fontFamily: bodyFontFamily },
          ]}
        >
          {subtitle}
        </Text>

        <View style={styles.modePanelBody}>{children}</View>
      </View>
    </ImageBackground>
  );
}

export default function Lobby() {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { mode: rawMode } = useLocalSearchParams<{ mode?: string }>();
  const mode: LobbyMode = useMemo(() => (rawMode === 'online' ? 'online' : 'bot'), [rawMode]);
  const router = useRouter();
  const [confirmJoinRunId, setConfirmJoinRunId] = useState<string | null>(null);
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
  const {
    tournaments: featuredTournaments,
    isLoading: isLoadingFeaturedTournaments,
    errorMessage: tournamentErrorMessage,
    joinTournament,
    launchMatch,
    joiningRunId,
    launchingRunId,
  } = useTournamentList({ featured: true, limit: 12 });
  const [fontsLoaded] = useFonts({
    [HOME_FREDOKA_FONT_FAMILY]: require('../../assets/fonts/Fredoka-VariableFont_wdth,wght.ttf'),
    [HOME_SUPERCELL_FONT_FAMILY]: require('../../assets/fonts/Supercell-Magic-Regular.ttf'),
  });
  const showWideBackground = Platform.OS === 'web' && width >= MIN_WIDE_WEB_BACKGROUND_WIDTH;
  const showMobileBackground = useMobileBackground();
  const isCompactLayout = width < 820;
  const isDesktopViewport = Platform.OS === 'web' && width >= 920;
  const useThreeColumnLayout = Platform.OS === 'web' && width >= 1180;
  const horizontalPadding = isDesktopViewport ? urTheme.spacing.lg : urTheme.spacing.md;
  const topPadding = insets.top + (isDesktopViewport ? 12 : 8);
  const bottomPadding = insets.bottom + (isCompactLayout ? urTheme.spacing.xl : urTheme.spacing.lg);
  const stageWidth = useThreeColumnLayout
    ? Math.min(width - horizontalPadding * 2, 1180)
    : isDesktopViewport
      ? Math.min(width - horizontalPadding * 2, 980)
      : isCompactLayout
        ? Math.min(width - horizontalPadding * 2, 430)
        : Math.min(width - horizontalPadding * 2, 820);
  const titleFontFamily = resolveHomeMagicFontFamily(fontsLoaded);
  const bodyFontFamily = resolveHomeFredokaFontFamily(fontsLoaded);

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
  const pendingPrivateOption =
    PRIVATE_MATCH_OPTIONS.find((option) => option.modeId === pendingPrivateMode) ?? null;
  const createdPrivateOption =
    PRIVATE_MATCH_OPTIONS.find((option) => option.modeId === createdPrivateMatch?.modeId) ?? null;
  const normalizedPrivateCodeInput = normalizePrivateMatchCodeInput(privateCodeInput);
  const canJoinPrivateGame = isPrivateMatchCode(normalizedPrivateCodeInput) && !isBusy;
  const publicWinRewardXp = getXpAwardAmount('pvp_win');
  const privateWinRewardXp = getXpAwardAmount('private_pvp_win');

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

    return null;
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

    return null;
  })();

  const joinStatusLabel = (() => {
    if (isJoiningPrivateGame) {
      return 'Connecting you to that private table...';
    }

    return null;
  })();

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.screen}>
        <WideScreenBackground
          source={homeWideBackground}
          visible={showWideBackground}
          overlayColor="rgba(56, 30, 13, 0.08)"
        />
        <MobileBackground
          source={homeMobileBackground}
          visible={showMobileBackground}
          overlayColor="rgba(56, 30, 13, 0.08)"
        />
        <View style={styles.backgroundTint} />

        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            {
              minHeight: height,
              paddingTop: topPadding,
              paddingBottom: bottomPadding,
              paddingHorizontal: horizontalPadding,
            },
          ]}
          showsVerticalScrollIndicator={false}
          bounces={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.topBar}>
            <SketchButton
              label="Back"
              accessibilityLabel="Back"
              onPress={() => router.back()}
              iconName="arrow-back"
              fontFamily={bodyFontFamily}
            />
          </View>

          <View style={[styles.stage, { width: stageWidth }]}>

            <View style={styles.hero}>
              <Text
                style={[
                  styles.pageTitle,
                  isCompactLayout ? styles.pageTitleCompact : styles.pageTitleDesktop,
                  { fontFamily: titleFontFamily },
                ]}
              >
                Play Online
              </Text>
              <Text style={[styles.pageSubtitle, { fontFamily: bodyFontFamily }]}>
                Match publicly, set up a private room, or jump into a tournament run without leaving the new home-page stage.
              </Text>

              <View style={styles.onlineCountBadge}>
                <View
                  style={[
                    styles.onlineDot,
                    onlineCount && onlineCount > 0 ? styles.onlineDotActive : null,
                  ]}
                />
                <Text style={[styles.onlineCountText, { fontFamily: bodyFontFamily }]}>
                  {onlineCount !== null
                    ? `${onlineCount} player${onlineCount !== 1 ? 's' : ''} on site`
                    : 'Checking who is on site...'}
                </Text>
              </View>

              {errorMessage ? (
                <View style={styles.errorBanner}>
                  <Text style={[styles.errorBannerText, { fontFamily: bodyFontFamily }]}>
                    {errorMessage}
                  </Text>
                </View>
              ) : null}
            </View>

            <View style={styles.featuredSection}>
              <View style={styles.featuredHeader}>
                <Text style={[styles.featuredEyebrow, { fontFamily: bodyFontFamily }]}>
                  Featured Tournaments
                </Text>
                <Text style={[styles.featuredTitle, { fontFamily: titleFontFamily }]}>
                  Open public runs staged like the new quick-play panels
                </Text>
                <Text style={[styles.featuredSubtitle, { fontFamily: bodyFontFamily }]}>
                  Inspect the standings before you commit, then join or launch the next tournament match from the framed tournament panel itself.
                </Text>
                <View style={styles.featuredHeaderAction}>
                  <SketchButton
                    label="See All Tournaments"
                    accessibilityLabel="See all tournaments"
                    onPress={() => router.push('/tournaments' as never)}
                    fontFamily={bodyFontFamily}
                  />
                </View>
              </View>

              {tournamentErrorMessage ? (
                <View style={styles.errorBanner}>
                  <Text style={[styles.errorBannerText, { fontFamily: bodyFontFamily }]}>
                    {tournamentErrorMessage}
                  </Text>
                </View>
              ) : null}

              {isLoadingFeaturedTournaments ? (
                <View style={styles.featuredStateCard}>
                  <Text style={[styles.featuredStateTitle, { fontFamily: titleFontFamily }]}>
                    Loading featured tournaments...
                  </Text>
                  <Text style={[styles.featuredStateText, { fontFamily: bodyFontFamily }]}>
                    Checking the current public runs from the tournament archive.
                  </Text>
                </View>
              ) : featuredTournaments.length === 0 ? (
                <View style={styles.featuredStateCard}>
                  <Text style={[styles.featuredStateTitle, { fontFamily: titleFontFamily }]}>
                    No featured tournaments yet
                  </Text>
                  <Text style={[styles.featuredStateText, { fontFamily: bodyFontFamily }]}>
                    Public tournament runs will appear here as soon as operators open them for play.
                  </Text>
                </View>
              ) : (
                <View style={styles.featuredList}>
                  {featuredTournaments.map((tournament) => (
                    <TournamentCard
                      key={tournament.runId}
                      tournament={tournament}
                      fontLoaded={fontsLoaded}
                      joining={joiningRunId === tournament.runId}
                      launching={launchingRunId === tournament.runId}
                      primaryTitle={confirmJoinRunId === tournament.runId ? 'Confirm' : undefined}
                      onJoin={(selected) => {
                        if (confirmJoinRunId !== selected.runId) {
                          setConfirmJoinRunId(selected.runId);
                          return;
                        }

                        void (async () => {
                          const joinedTournament = await joinTournament(selected.runId);
                          if (!joinedTournament?.membership.isJoined) {
                            return;
                          }

                          setConfirmJoinRunId(null);
                          router.push(
                            {
                              pathname: '/tournaments/[runId]',
                              params: {
                                runId: selected.runId,
                              },
                            } as never,
                          );
                        })();
                      }}
                      onLaunch={(selected) => {
                        setConfirmJoinRunId(null);
                        void launchMatch(selected);
                      }}
                      onViewStandings={(selected) => {
                        setConfirmJoinRunId(null);
                        router.push(
                          {
                            pathname: '/tournaments/[runId]',
                            params: {
                              runId: selected.runId,
                            },
                          } as never,
                        );
                      }}
                    />
                  ))}
                </View>
              )}
            </View>

            <View style={styles.actionsSection}>
              <Text style={[styles.actionsEyebrow, { fontFamily: bodyFontFamily }]}>
                Matchmaking Options
              </Text>
              <Text style={[styles.actionsTitle, { fontFamily: titleFontFamily }]}>
                Choose how you want to enter the court
              </Text>
              <View style={[styles.actionGrid, useThreeColumnLayout && styles.actionGridThreeColumn]}>
                <View
                  style={[
                    styles.actionCell,
                    isCompactLayout && styles.actionCellCompact,
                    useThreeColumnLayout && styles.actionCellThreeColumn,
                  ]}
                >
                  <OnlineActionPanel
                    title="Find Opponent"
                    subtitle="Jump into public matchmaking and get paired with the next available player."
                    titleFontFamily={titleFontFamily}
                    bodyFontFamily={bodyFontFamily}
                    compact={isCompactLayout}
                    rewardAmount={publicWinRewardXp}
                  >
                    {statusLabel ? (
                      <Text style={[styles.statusText, { fontFamily: bodyFontFamily }]}>
                        {statusLabel}
                      </Text>
                    ) : null}

                    <HomeActionButton
                      title={buttonTitle}
                      tone="gold"
                      compact
                      fontLoaded={fontsLoaded}
                      loading={isFindingOpponent}
                      disabled={isCreatingPrivateGame || isJoiningPrivateGame}
                      style={styles.primaryActionButton}
                      onPress={handleStart}
                    />
                  </OnlineActionPanel>
                </View>

                <View
                  style={[
                    styles.actionCell,
                    isCompactLayout && styles.actionCellCompact,
                    useThreeColumnLayout && styles.actionCellThreeColumn,
                  ]}
                >
                  <OnlineActionPanel
                    title="Create Private Game"
                    subtitle={`Make a shareable room code for a friend. Private match wins award +${privateWinRewardXp} XP and count toward permanent challenge progress.`}
                    titleFontFamily={titleFontFamily}
                    bodyFontFamily={bodyFontFamily}
                    compact={isCompactLayout}
                    rewardAmount={privateWinRewardXp}
                  >
                    {privateStatusLabel ? (
                      <Text style={[styles.statusText, { fontFamily: bodyFontFamily }]}>
                        {privateStatusLabel}
                      </Text>
                    ) : null}

                    {createdPrivateMatch ? (
                      <>
                        <View style={styles.privateCodePanel}>
                          <Text style={[styles.privateCodeEyebrow, { fontFamily: bodyFontFamily }]}>
                            {createdPrivateOption
                              ? `${createdPrivateOption.label} Private Code`
                              : 'Private Game Code'}
                          </Text>
                          <Text selectable style={[styles.privateCodeValue, { fontFamily: titleFontFamily }]}>
                            {createdPrivateMatch.code}
                          </Text>
                          <View style={styles.privatePresenceRow}>
                            <View
                              style={[
                                styles.privatePresenceDot,
                                createdPrivateMatch.hasGuestJoined
                                  ? styles.privatePresenceDotReady
                                  : null,
                              ]}
                            />
                            <Text style={[styles.privatePresenceText, { fontFamily: bodyFontFamily }]}>
                              {createdPrivateMatch.hasGuestJoined
                                ? 'Friend has arrived'
                                : 'Waiting for friend'}
                            </Text>
                          </View>
                          {copyFeedback ? (
                            <Text style={[styles.copyFeedbackText, { fontFamily: bodyFontFamily }]}>
                              {copyFeedback}
                            </Text>
                          ) : null}
                        </View>

                        <View style={styles.actionRow}>
                          <View style={styles.actionRowCell}>
                            <SketchButton
                              label="Copy Code"
                              accessibilityLabel="Copy code"
                              onPress={() => void handleCopyPrivateCode()}
                              fontFamily={bodyFontFamily}
                              wide
                              style={styles.sketchWideButton}
                            />
                          </View>
                          <View style={styles.actionRowCell}>
                            <HomeActionButton
                              title="Start Game"
                              tone="gold"
                              compact
                              fontLoaded={fontsLoaded}
                              style={styles.primaryActionButton}
                              onPress={startCreatedPrivateMatch}
                            />
                          </View>
                        </View>

                        <View style={styles.secondaryActionWrap}>
                          <SketchButton
                            label="Pick Another Ruleset"
                            accessibilityLabel="Pick another ruleset"
                            onPress={clearCreatedPrivateMatch}
                            fontFamily={bodyFontFamily}
                            wide
                            style={styles.sketchWideButton}
                          />
                        </View>
                      </>
                    ) : (
                      <View style={styles.optionGrid}>
                        {PRIVATE_MATCH_OPTIONS.map((option) => (
                          <View key={option.modeId} style={styles.optionCell}>
                            <HomeActionButton
                              title={option.label}
                              tone="stone"
                              size="small"
                              compact
                              fontLoaded={fontsLoaded}
                              style={styles.optionActionButton}
                              loading={
                                isCreatingPrivateGame &&
                                pendingPrivateMode === option.modeId
                              }
                              disabled={isBusy && pendingPrivateMode !== option.modeId}
                              onPress={() => {
                                void startPrivateMatch(option.modeId);
                              }}
                            />
                          </View>
                        ))}
                      </View>
                    )}
                  </OnlineActionPanel>
                </View>

                <View
                  style={[
                    styles.actionCell,
                    isCompactLayout && styles.actionCellCompact,
                    useThreeColumnLayout && styles.actionCellThreeColumn,
                  ]}
                >
                  <OnlineActionPanel
                    title="Enter Private Code"
                    subtitle={`Paste the short code your friend sent you to enter their private table and play for the +${privateWinRewardXp} XP private-match reward.`}
                    titleFontFamily={titleFontFamily}
                    bodyFontFamily={bodyFontFamily}
                    compact={isCompactLayout}
                    rewardAmount={privateWinRewardXp}
                  >
                    {joinStatusLabel ? (
                      <Text style={[styles.statusText, { fontFamily: bodyFontFamily }]}>
                        {joinStatusLabel}
                      </Text>
                    ) : null}

                    <TextInput
                      value={privateCodeInput}
                      onChangeText={(value) =>
                        setPrivateCodeInput(normalizePrivateMatchCodeInput(value))
                      }
                      autoCapitalize="characters"
                      autoCorrect={false}
                      maxLength={PRIVATE_MATCH_CODE_LENGTH}
                      placeholder="Enter code"
                      placeholderTextColor="rgba(102, 77, 46, 0.46)"
                      selectionColor="#C48E2B"
                      returnKeyType="go"
                      onSubmitEditing={() => {
                        if (canJoinPrivateGame) {
                          void handleJoinPrivateGame();
                        }
                      }}
                      style={[styles.codeInput, styles.primaryActionField, { fontFamily: bodyFontFamily }]}
                    />

                    <HomeActionButton
                      title={isJoiningPrivateGame ? 'Joining...' : 'Join Game'}
                      tone="gold"
                      compact
                      fontLoaded={fontsLoaded}
                      loading={isJoiningPrivateGame}
                      disabled={!canJoinPrivateGame}
                      style={styles.primaryActionButton}
                      onPress={() => void handleJoinPrivateGame()}
                    />
                  </OnlineActionPanel>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#43250F',
  },
  backgroundTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(56, 30, 13, 0.08)',
  },
  scrollContent: {
    alignItems: 'center',
  },
  stage: {
    width: '100%',
    alignItems: 'center',
    gap: urTheme.spacing.lg,
  },
  topBar: {
    width: '100%',
    alignItems: 'flex-start',
    marginBottom: urTheme.spacing.sm,
  },
  hero: {
    width: '100%',
    alignItems: 'center',
    gap: urTheme.spacing.sm,
  },
  pageTitle: {
    color: '#22160C',
    textAlign: 'center',
    textShadowColor: 'rgba(255, 244, 221, 0.32)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  pageTitleDesktop: {
    fontSize: 36,
    lineHeight: 40,
  },
  pageTitleCompact: {
    fontSize: 29,
    lineHeight: 33,
  },
  pageSubtitle: {
    maxWidth: 680,
    color: 'rgba(34, 22, 12, 0.88)',
    fontSize: 16,
    lineHeight: 22,
    textAlign: 'center',
  },
  onlineCountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 38,
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(114, 82, 35, 0.18)',
    backgroundColor: 'rgba(255, 247, 228, 0.52)',
  },
  onlineDot: {
    width: 9,
    height: 9,
    borderRadius: 999,
    backgroundColor: 'rgba(126, 115, 99, 0.7)',
  },
  onlineDotActive: {
    backgroundColor: '#5DB11F',
    shadowColor: '#5DB11F',
    shadowOpacity: 0.35,
    shadowRadius: 4,
  },
  onlineCountText: {
    color: '#5B3E1B',
    fontSize: 14,
    lineHeight: 16,
    textAlign: 'center',
  },
  errorBanner: {
    width: '100%',
    maxWidth: 760,
    paddingHorizontal: urTheme.spacing.md,
    paddingVertical: urTheme.spacing.sm,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(143, 52, 41, 0.22)',
    backgroundColor: 'rgba(255, 235, 226, 0.76)',
  },
  errorBannerText: {
    color: '#8F3429',
    fontSize: 12,
    lineHeight: 17,
    textAlign: 'center',
  },
  featuredSection: {
    width: '100%',
    gap: urTheme.spacing.md,
  },
  featuredHeader: {
    alignItems: 'center',
    gap: 6,
  },
  featuredEyebrow: {
    color: '#7A571F',
    fontSize: 12,
    lineHeight: 14,
    letterSpacing: 1,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  featuredTitle: {
    color: '#22160C',
    fontSize: 30,
    lineHeight: 34,
    textAlign: 'center',
    maxWidth: 720,
  },
  featuredSubtitle: {
    maxWidth: 820,
    color: 'rgba(58, 37, 17, 0.88)',
    fontSize: 15,
    lineHeight: 21,
    textAlign: 'center',
  },
  featuredHeaderAction: {
    marginTop: 4,
  },
  featuredStateCard: {
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 28,
    paddingVertical: 24,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(126, 93, 42, 0.18)',
    backgroundColor: 'rgba(255, 248, 232, 0.5)',
  },
  featuredStateTitle: {
    color: '#3B2412',
    fontSize: 24,
    lineHeight: 28,
    textAlign: 'center',
  },
  featuredStateText: {
    maxWidth: 620,
    color: 'rgba(73, 48, 26, 0.88)',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  featuredList: {
    width: '100%',
    gap: 14,
  },
  actionsSection: {
    width: '100%',
    alignItems: 'center',
    gap: urTheme.spacing.md,
  },
  actionsEyebrow: {
    color: '#7A571F',
    fontSize: 12,
    lineHeight: 14,
    letterSpacing: 1,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  actionsTitle: {
    color: '#FFF5DE',
    fontSize: 30,
    lineHeight: 34,
    textAlign: 'center',
    maxWidth: 640,
    textShadowColor: 'rgba(72, 31, 10, 0.52)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 2,
  },
  actionGrid: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: urTheme.spacing.md,
  },
  actionGridThreeColumn: {
    justifyContent: 'space-between',
  },
  actionCell: {
    width: '48.8%',
  },
  actionCellCompact: {
    width: '100%',
  },
  actionCellThreeColumn: {
    width: '31.7%',
  },
  modePanel: {
    width: '100%',
    overflow: 'visible',
    justifyContent: 'center',
  },
  modePanelDesktop: {
    minHeight: 430,
  },
  modePanelCompact: {
    minHeight: 460,
  },
  modePanelImage: {
    width: '100%',
    height: '100%',
  },
  modeRewardBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    minWidth: 82,
  },
  modeRewardBadgeCompact: {
    top: 12,
    right: 12,
    transform: [{ scale: 0.9 }],
  },
  modePanelContent: {
    paddingTop: 78,
    paddingBottom: 60,
    paddingHorizontal: 42,
    alignItems: 'center',
  },
  modePanelContentDesktop: {
    gap: 10,
  },
  modePanelContentCompact: {
    paddingTop: 72,
    paddingBottom: 52,
    paddingHorizontal: 34,
    gap: 9,
  },
  modePanelTitle: {
    color: '#4B2E12',
    textAlign: 'center',
    maxWidth: '72%',
  },
  modePanelTitleDesktop: {
    fontSize: 22,
    lineHeight: 25,
  },
  modePanelTitleCompact: {
    fontSize: 19,
    lineHeight: 22,
  },
  modePanelSubtitle: {
    color: '#6B5740',
    fontSize: 14,
    lineHeight: 19,
    textAlign: 'center',
  },
  modePanelBody: {
    width: '100%',
    marginTop: 6,
    gap: 12,
    alignItems: 'center',
  },
  primaryActionButton: {
    width: '100%',
    maxWidth: 216,
    alignSelf: 'center',
  },
  primaryActionField: {
    width: '100%',
    maxWidth: 216,
    alignSelf: 'center',
  },
  optionActionButton: {
    width: '100%',
    maxWidth: 148,
    alignSelf: 'center',
  },
  statusText: {
    color: '#5E4630',
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
  },
  privateCodePanel: {
    width: '100%',
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(126, 93, 42, 0.18)',
    backgroundColor: 'rgba(255, 248, 232, 0.62)',
    alignItems: 'center',
    gap: 8,
  },
  privateCodeEyebrow: {
    color: '#7A571F',
    fontSize: 12,
    lineHeight: 14,
    letterSpacing: 0.9,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  privateCodeValue: {
    color: '#3B2412',
    fontSize: 28,
    lineHeight: 30,
    letterSpacing: 2.2,
    textAlign: 'center',
  },
  privatePresenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  privatePresenceDot: {
    width: 9,
    height: 9,
    borderRadius: 999,
    backgroundColor: 'rgba(196, 142, 43, 0.55)',
  },
  privatePresenceDotReady: {
    backgroundColor: '#5DB11F',
    shadowColor: '#5DB11F',
    shadowOpacity: 0.35,
    shadowRadius: 4,
  },
  privatePresenceText: {
    color: '#5E4630',
    fontSize: 13,
    lineHeight: 16,
    textAlign: 'center',
  },
  copyFeedbackText: {
    color: '#385D2C',
    fontSize: 12,
    lineHeight: 16,
    textAlign: 'center',
  },
  actionRow: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionRowCell: {
    minWidth: 138,
    flexGrow: 1,
    maxWidth: 208,
  },
  secondaryActionWrap: {
    width: '100%',
    alignItems: 'center',
    marginTop: 2,
    maxWidth: 232,
    alignSelf: 'center',
  },
  sketchWideButton: {
    width: '100%',
  },
  optionGrid: {
    width: '100%',
    maxWidth: 270,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
  },
  optionCell: {
    minWidth: 116,
    maxWidth: 130,
    flexGrow: 1,
  },
  codeInput: {
    width: '100%',
    minHeight: 56,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: 'rgba(123, 95, 47, 0.24)',
    backgroundColor: 'rgba(255, 249, 235, 0.72)',
    color: '#4B2E12',
    textAlign: 'center',
    fontSize: 22,
    lineHeight: 26,
    letterSpacing: 2.2,
    paddingHorizontal: urTheme.spacing.md,
  },
});
