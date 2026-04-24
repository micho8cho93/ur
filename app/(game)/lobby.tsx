import { HomeLightButton } from '@/components/home/HomeLightButton';
import { HomeActionButton } from '@/components/home/HomeActionButton';
import { MobileBackground, useMobileBackground } from '@/components/ui/MobileBackground';
import { SketchButton } from '@/components/ui/SketchButton';
import { AnimatedCurrencyChip } from '@/components/wallet/AnimatedCurrencyChip';
import {
  MIN_WIDE_WEB_BACKGROUND_WIDTH,
  WideScreenBackground,
} from '@/components/ui/WideScreenBackground';
import {
  urPanelColors,
  urTextColors,
  urTextVariants,
  urTheme,
} from '@/constants/urTheme';
import { LobbyMode, useMatchmaking } from '@/hooks/useMatchmaking';
import { PRIVATE_MATCH_OPTIONS } from '@/logic/matchConfigs';
import { getPublicGameModes } from '@/services/gameModes';
import { listOpenOnlineMatches, type OpenOnlineMatch } from '@/services/matchmaking';
import {
  PRIVATE_MATCH_CODE_LENGTH,
  isPrivateMatchCode,
  normalizePrivateMatchCodeInput,
} from '@/shared/privateMatchCode';
import {
  HOME_FREDOKA_FONT_FAMILY,
  HOME_GROBOLD_FONT_FAMILY,
  HOME_SUPERCELL_FONT_FAMILY,
  resolveHomeButtonFontFamily,
  resolveHomeFredokaFontFamily,
  resolveHomeMagicFontFamily,
} from '@/src/home/homeTheme';
import { useTournamentList } from '@/src/tournaments/useTournamentList';
import type { PublicTournamentSummary } from '@/src/tournaments/types';
import { useWallet } from '@/src/wallet/useWallet';
import { useFonts } from 'expo-font';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ImageBackground,
  Platform,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  View,
  ViewStyle,
  type ImageSourcePropType,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const homeWideBackground = require('../../assets/images/bg_online.png');
const homeMobileBackground = require('../../assets/images/bg_online_mobile.png');
const onlineActionCard = require('../../assets/images/card_landscape.png');
const featuredOnlineActionCard = require('../../assets/images/featured_card_landscape.png');
const LANDSCAPE_CARD_ASPECT_RATIO = 1536 / 1024;
const CARD_SIZE_SCALE = 1.2;
const CARD_ART_SCALE = 1.1;
const CARD_VISUAL_SCALE = 1.3 * CARD_SIZE_SCALE;
const LARGE_CARD_ASPECT_RATIO = LANDSCAPE_CARD_ASPECT_RATIO / CARD_VISUAL_SCALE;
const LARGE_DENSE_CARD_ASPECT_RATIO = 1.95 / CARD_VISUAL_SCALE;
const WAGER_MIN = 10;
const WAGER_MAX = 100;
const WAGER_STEP = 10;
const OPEN_MATCH_DURATIONS = [3, 5, 10] as const;
const TRANSPORT_DISABLED_WARNING = 'Nakama transport is disabled';

type CreateMatchStage = 'game_mode' | 'wager' | 'match_style' | 'wait_time' | 'ready';
type CreateMatchStyle = 'online' | 'private';
type FeaturedGameMode = Awaited<ReturnType<typeof getPublicGameModes>>['featuredMode'];

const isTransportDisabledWarning = (message: string | null | undefined) =>
  typeof message === 'string' && message.includes(TRANSPORT_DISABLED_WARNING);

const formatTournamentCountdown = (remainingMs: number): string => {
  const totalMinutes = Math.max(0, Math.ceil(remainingMs / 60_000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}h ${minutes}m`;
};

const getNextTournamentCountdownLabel = (tournaments: PublicTournamentSummary[], now: number): string | null => {
  const startTimes = tournaments
    .map((tournament) => Date.parse(tournament.startAt))
    .filter((value) => Number.isFinite(value));
  const futureStartTimes = startTimes.filter((value) => value > now);
  const relevantStartTimes = futureStartTimes.length > 0 ? futureStartTimes : startTimes;
  const nextStartMs = relevantStartTimes.reduce<number | null>((soonest, current) => {
    if (soonest === null) {
      return current;
    }

    return Math.min(soonest, current);
  }, null);

  if (nextStartMs === null) {
    return null;
  }

  return `${formatTournamentCountdown(Math.max(0, nextStartMs - now))} until next tournament`;
};

type OnlineActionPanelProps = {
  title: string;
  subtitle: string;
  titleFontFamily: string;
  bodyFontFamily: string;
  compact: boolean;
  flexible?: boolean;
  source?: ImageSourcePropType;
  contentShiftY?: number;
  titleShiftY?: number;
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
};

function OnlineActionPanel({
  title,
  subtitle,
  titleFontFamily,
  bodyFontFamily,
  compact,
  flexible,
  source = onlineActionCard,
  contentShiftY = 0,
  titleShiftY = 0,
  style,
  children,
}: OnlineActionPanelProps) {
  return (
    <View
      style={[
        flexible ? styles.modePanelFlexible : styles.modePanel,
        compact ? styles.modePanelCompact : styles.modePanelDesktop,
        style,
      ]}
    >
      <ImageBackground
        source={source}
        resizeMode="stretch"
        style={styles.modePanelFrame}
        imageStyle={[styles.modePanelImage, styles.modePanelImageScaled]}
      >
        <View
          style={[
            styles.modePanelContent,
            compact ? styles.modePanelContentCompact : styles.modePanelContentDesktop,
            contentShiftY !== 0 ? { transform: [{ translateY: contentShiftY }] } : null,
          ]}
        >
          <Text
            style={[
              styles.modePanelTitle,
              compact ? styles.modePanelTitleCompact : styles.modePanelTitleDesktop,
              titleShiftY !== 0 ? { transform: [{ translateY: titleShiftY }] } : null,
              { fontFamily: titleFontFamily },
            ]}
          >
            {title}
          </Text>
          {subtitle.trim().length > 0 ? (
            <Text
              style={[
                styles.modePanelSubtitle,
                { fontFamily: bodyFontFamily },
              ]}
            >
              {subtitle}
            </Text>
          ) : null}

          <View style={styles.modePanelBody}>{children}</View>
        </View>
      </ImageBackground>
    </View>
  );
}

export default function Lobby() {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { mode: rawMode } = useLocalSearchParams<{ mode?: string }>();
  const mode: LobbyMode = useMemo(() => (rawMode === 'online' ? 'online' : 'bot'), [rawMode]);
  const router = useRouter();
  const { softCurrency, premiumCurrency, refresh: refreshWallet } = useWallet();
  const [confirmJoinRunId, setConfirmJoinRunId] = useState<string | null>(null);
  const [privateCodeInput, setPrivateCodeInput] = useState('');
  const [wager, setWager] = useState(WAGER_MIN);
  const [durationMinutes, setDurationMinutes] = useState<(typeof OPEN_MATCH_DURATIONS)[number]>(5);
  const [createMatchStage, setCreateMatchStage] = useState<CreateMatchStage>('game_mode');
  const [selectedGameMode, setSelectedGameMode] = useState<string | null>(null);
  const [selectedMatchStyle, setSelectedMatchStyle] = useState<CreateMatchStyle | null>(null);
  const [featuredGameMode, setFeaturedGameMode] = useState<FeaturedGameMode | null>(null);
  const [openMatches, setOpenMatches] = useState<OpenOnlineMatch[]>([]);
  const [isLoadingOpenMatches, setIsLoadingOpenMatches] = useState(false);
  const [openMatchesError, setOpenMatchesError] = useState<string | null>(null);
  const [summaryNow, setSummaryNow] = useState(() => Date.now());
  const {
    createOpenMatch,
    refreshCreatedOpenMatch,
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
    createdOpenOnlineMatch,
  } = useMatchmaking(mode);
  const {
    tournaments: openTournaments,
    isLoading: isLoadingFeaturedTournaments,
    errorMessage: tournamentErrorMessage,
  } = useTournamentList();
  const [fontsLoaded] = useFonts({
    [HOME_FREDOKA_FONT_FAMILY]: require('../../assets/fonts/LilitaOne-Regular.ttf'),
    [HOME_GROBOLD_FONT_FAMILY]: require('../../assets/fonts/LilitaOne-Regular.ttf'),
    [HOME_SUPERCELL_FONT_FAMILY]: require('../../assets/fonts/Supercell-Magic-Regular.ttf'),
  });
  const showWideBackground = Platform.OS === 'web' && width >= MIN_WIDE_WEB_BACKGROUND_WIDTH;
  const showMobileBackground = useMobileBackground();
  const shouldEnableScroll = Platform.OS !== 'web' || showMobileBackground;
  const isCompactLayout = width < 820;
  const isShortViewport = height < 1200;
  const isDenseLayout = isCompactLayout || isShortViewport;
  const isDesktopViewport = Platform.OS === 'web' && width >= 920;
  const useTwoColumnGrid = width >= 820;
  const horizontalPadding = isDesktopViewport ? urTheme.spacing.lg : urTheme.spacing.md;
  const topPadding = insets.top + (isDesktopViewport ? 12 : 8);
  const bottomPadding = insets.bottom + (isCompactLayout ? urTheme.spacing.xl : urTheme.spacing.lg);
  const widthCap = isDesktopViewport ? 1080 : isCompactLayout ? 430 : 820;
  const heightCap = isDenseLayout ? Math.round(height * 0.88) : Number.POSITIVE_INFINITY;
  const stageWidth = Math.min(width - horizontalPadding * 2, widthCap, heightCap);
  const titleFontFamily = resolveHomeMagicFontFamily(fontsLoaded);
  const bodyFontFamily = resolveHomeFredokaFontFamily(fontsLoaded);
  const buttonFontFamily = resolveHomeButtonFontFamily(fontsLoaded);
  useEffect(() => {
    if (mode === 'bot') {
      router.replace('/(game)/bot');
    }
  }, [mode, router]);

  useEffect(() => {
    if (mode !== 'online') {
      return undefined;
    }

    let cancelled = false;

    const loadOpenMatches = async (options?: { silent?: boolean }) => {
      if (!options?.silent) {
        setIsLoadingOpenMatches(true);
      }
      try {
        const matches = await listOpenOnlineMatches();
        if (!cancelled) {
          setOpenMatches(matches);
          setOpenMatchesError(null);
        }
      } catch (error) {
        if (!cancelled) {
          setOpenMatchesError(error instanceof Error ? error.message : 'Unable to load online matches.');
        }
      } finally {
        if (!cancelled) {
          setIsLoadingOpenMatches(false);
        }
      }
    };

    void loadOpenMatches();
    const intervalId = setInterval(() => {
      void loadOpenMatches({ silent: true });
      void refreshCreatedOpenMatch().then((match) => {
        if (match?.status === 'expired') {
          void refreshWallet({ silent: true });
        }
      });
    }, 5_000);

    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, [mode, refreshCreatedOpenMatch, refreshWallet]);

  useEffect(() => {
    if (mode !== 'online') {
      return undefined;
    }

    let cancelled = false;

    const loadFeaturedGameMode = async () => {
      try {
        const response = await getPublicGameModes();
        if (!cancelled) {
          setFeaturedGameMode(response.featuredMode);
        }
      } catch {
        if (!cancelled) {
          setFeaturedGameMode(null);
        }
      }
    };

    void loadFeaturedGameMode();

    return () => {
      cancelled = true;
    };
  }, [mode]);

  useEffect(() => {
    const intervalId = setInterval(() => setSummaryNow(Date.now()), 60_000);
    return () => clearInterval(intervalId);
  }, []);

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace('/');
  };

  const resetCreateMatch = () => {
    setCreateMatchStage('game_mode');
    setSelectedGameMode(null);
    setSelectedMatchStyle(null);
    setWager(WAGER_MIN);
    setDurationMinutes(5);
  };

  const handleCreateMatch = async () => {
    if (!selectedGameMode) {
      return;
    }

    if (selectedMatchStyle === 'online') {
      const match = await createOpenMatch(wager, durationMinutes, selectedGameMode);
      if (match) {
        setOpenMatches((current) => {
          const withoutMatch = current.filter((entry) => entry.openMatchId !== match.openMatchId);
          return [match, ...withoutMatch];
        });
        void refreshWallet({ silent: true });
      }
    } else if (selectedMatchStyle === 'private') {
      await startPrivateMatch(selectedGameMode);
    }
  };

  const handleJoinPrivateGame = async () => {
    await joinPrivateMatchByCode(privateCodeInput);
  };

  const isBusy = status === 'connecting' || status === 'searching';
  const isCreatingOpenMatch = isBusy && activeAction === 'create_open';
  const isJoiningOpenMatch = isBusy && activeAction === 'join_open';
  const isCreatingPrivateGame = isBusy && activeAction === 'create_private';
  const isJoiningPrivateGame = isBusy && activeAction === 'join_private';
  const normalizedPrivateCodeInput = normalizePrivateMatchCodeInput(privateCodeInput);
  const canJoinPrivateGame = isPrivateMatchCode(normalizedPrivateCodeInput) && !isBusy;
  const canAffordWager = softCurrency >= wager;
  const featuredGameModeOption = featuredGameMode
    ? {
        modeId: featuredGameMode.id,
        label: featuredGameMode.name,
        description: featuredGameMode.description,
      }
    : null;
  const createMatchModeOptions = featuredGameModeOption
    ? [...PRIVATE_MATCH_OPTIONS, featuredGameModeOption]
    : PRIVATE_MATCH_OPTIONS;
  const resolveMatchModeOption = (modeId: string | null | undefined) =>
    PRIVATE_MATCH_OPTIONS.find((option) => option.modeId === modeId) ??
    (featuredGameModeOption?.modeId === modeId ? featuredGameModeOption : null);
  const pendingPrivateOption = resolveMatchModeOption(pendingPrivateMode);
  const createdPrivateOption = resolveMatchModeOption(createdPrivateMatch?.modeId ?? null);

  if (mode === 'bot') {
    return null;
  }

  const createMatchButtonTitle = (() => {
    if (status === 'error' && activeAction === 'create_open') {
      return 'Retry Create';
    }
    if (isCreatingOpenMatch) {
      return 'Creating...';
    }
    if (isCreatingPrivateGame) {
      return 'Creating...';
    }
    return 'Create Match';
  })();

  const openWaitingLabel = (() => {
    if (status === 'connecting' && activeAction === 'create_open') {
      return 'Opening your wagered table...';
    }
    if (createdOpenOnlineMatch?.status === 'open') {
      return `Waiting for an opponent · ${createdOpenOnlineMatch.wager} coins`;
    }
    return null;
  })();

  const createMatchStatusLabel = (() => {
    if (isCreatingPrivateGame) {
      return pendingPrivateOption
        ? `Preparing a ${pendingPrivateOption.label.toLowerCase()} private table...`
        : 'Preparing your private table...';
    }
    if (openWaitingLabel) {
      return openWaitingLabel;
    }
    if (selectedMatchStyle === 'online' && !canAffordWager) {
      return 'Not enough coins for this wager.';
    }
    return null;
  })();

  const joinStatusLabel = (() => {
    if (isJoiningPrivateGame) {
      return 'Connecting you to that private table...';
    }

    return null;
  })();

  const tournamentsOpenLabel =
    isLoadingFeaturedTournaments && openTournaments.length === 0
      ? 'Checking the tournament archive...'
      : `${openTournaments.length} public tournament${openTournaments.length === 1 ? '' : 's'} open`;
  const nextTournamentCountdownLabel = getNextTournamentCountdownLabel(openTournaments, summaryNow);
  const onlineMatchesOpenLabel =
    isLoadingOpenMatches && openMatches.length === 0
      ? 'Checking live tables...'
      : `${openMatches.length} online match${openMatches.length === 1 ? '' : 'es'} open`;

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.screen}>
        <WideScreenBackground
          source={homeWideBackground}
          visible={showWideBackground}
          overlayColor={urPanelColors.sceneOverlay}
        />
        <MobileBackground
          source={homeMobileBackground}
          visible={showMobileBackground}
          overlayColor={urPanelColors.sceneOverlay}
        />
        <View pointerEvents="none" style={styles.backgroundTint} />

        <ScrollView
          testID="lobby-scroll-view"
          contentContainerStyle={[
            styles.scrollContent,
            {
              flexGrow: 1,
              minHeight: height,
              paddingTop: topPadding,
              paddingBottom: bottomPadding,
              paddingHorizontal: horizontalPadding,
            },
          ]}
          showsVerticalScrollIndicator={false}
          bounces={false}
          scrollEnabled={shouldEnableScroll}
          keyboardShouldPersistTaps="handled"
        >
          <View
            style={[
              styles.topBar,
              (isCompactLayout || isShortViewport) ? styles.topBarCompact : null,
            ]}
          >
            <View
              style={[
                styles.topBarLeft,
                (isCompactLayout || isShortViewport) ? styles.topBarLeftCompact : null,
              ]}
            >
              <SketchButton
                label="Back"
                accessibilityLabel="Back"
                onPress={handleBack}
                iconName="arrow-back"
                iconOnly={isCompactLayout}
                fontFamily={buttonFontFamily}
              />
              <AnimatedCurrencyChip
                value={softCurrency}
                variant="coin"
                isDesktopLayout={isDesktopViewport}
                fontFamily={bodyFontFamily}
              />
              <AnimatedCurrencyChip
                value={premiumCurrency}
                variant="gem"
                isDesktopLayout={isDesktopViewport}
                fontFamily={bodyFontFamily}
              />
            </View>
            <SketchButton
              label="Store"
              accessibilityLabel="Store"
              onPress={() => router.push('/store' as never)}
              iconName="shopping-cart"
              iconOnly={isCompactLayout}
              fontFamily={buttonFontFamily}
            />
          </View>

          <View style={[styles.stage, isDenseLayout && styles.stageDense, { width: stageWidth }]}>

            <View style={[styles.hero, isDenseLayout && styles.heroDense]}>
              <Text
                style={[
                  styles.pageTitle,
                  isCompactLayout ? styles.pageTitleCompact : styles.pageTitleDesktop,
                  { fontFamily: titleFontFamily },
                ]}
              >
                Play Online
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
                <View style={[styles.errorBanner, isDenseLayout && styles.errorBannerDense]}>
                  <Text style={[styles.errorBannerText, { fontFamily: bodyFontFamily }]}>
                    {errorMessage}
                  </Text>
                </View>
              ) : null}
            </View>

            <View style={[styles.sectionGrid, isDenseLayout && styles.sectionGridDense]}>
              <View
                style={[
                  styles.sectionRow,
                  !useTwoColumnGrid && styles.sectionRowCompact,
                  isDenseLayout && styles.sectionRowDense,
                ]}
              >
                <View style={[styles.sectionCell, !useTwoColumnGrid && styles.sectionCellCompact]}>
                  <OnlineActionPanel
                    title="Tournaments"
                    subtitle={tournamentsOpenLabel}
                    titleFontFamily={titleFontFamily}
                    bodyFontFamily={bodyFontFamily}
                    compact={isDenseLayout}
                    source={featuredOnlineActionCard}
                    contentShiftY={isDenseLayout ? 22 : 26}
                    flexible
                  >
                    {tournamentErrorMessage && !isTransportDisabledWarning(tournamentErrorMessage) ? (
                      <Text style={[styles.statusText, { fontFamily: bodyFontFamily }]}>
                        {tournamentErrorMessage}
                      </Text>
                    ) : null}
                    {nextTournamentCountdownLabel ? (
                      <Text style={[styles.statusText, { fontFamily: bodyFontFamily }]}>
                        {nextTournamentCountdownLabel}
                      </Text>
                    ) : null}
                    <HomeActionButton
                      title="See List"
                      tone="gold"
                      accessibilityLabel="See List"
                      fontLoaded={fontsLoaded}
                      size={isCompactLayout ? 'compact' : 'regular'}
                      style={styles.primaryActionButton}
                      onPress={() => router.push('/tournaments' as never)}
                    />
                  </OnlineActionPanel>
                </View>

                <View style={[styles.sectionCell, !useTwoColumnGrid && styles.sectionCellCompact]}>
                  <OnlineActionPanel
                    title="Enter Code"
                    subtitle=""
                    titleFontFamily={titleFontFamily}
                    bodyFontFamily={bodyFontFamily}
                    compact={isDenseLayout}
                    titleShiftY={isDenseLayout ? 20 : 22}
                    flexible
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

                    <HomeLightButton
                      label={isJoiningPrivateGame ? 'Joining...' : 'Join Game'}
                      fontLoaded={fontsLoaded}
                      size={isCompactLayout ? 'compact' : 'regular'}
                      loading={isJoiningPrivateGame}
                      disabled={!canJoinPrivateGame}
                      style={styles.primaryActionButton}
                      onPress={() => void handleJoinPrivateGame()}
                    />
                  </OnlineActionPanel>
                </View>
              </View>

              <View
                style={[
                  styles.sectionRow,
                  !useTwoColumnGrid && styles.sectionRowCompact,
                  isDenseLayout && styles.sectionRowDense,
                ]}
              >
                <View style={[styles.sectionCell, !useTwoColumnGrid && styles.sectionCellCompact]}>
                  <OnlineActionPanel
                    title="Online Matches"
                    subtitle={onlineMatchesOpenLabel}
                    titleFontFamily={titleFontFamily}
                    bodyFontFamily={bodyFontFamily}
                    compact={isDenseLayout}
                    source={featuredOnlineActionCard}
                    contentShiftY={isDenseLayout ? 22 : 26}
                    flexible
                  >
                    {openMatchesError && !isTransportDisabledWarning(openMatchesError) ? (
                      <Text style={[styles.statusText, { fontFamily: bodyFontFamily }]}>
                        {openMatchesError}
                      </Text>
                    ) : null}
                    {isLoadingOpenMatches ? (
                      <Text style={[styles.statusText, { fontFamily: bodyFontFamily }]}>
                        Checking wager tables and live games.
                      </Text>
                    ) : null}
                    <HomeActionButton
                      title="Matches"
                      tone="teal"
                      accessibilityLabel="Matches"
                      fontLoaded={fontsLoaded}
                      size={isCompactLayout ? 'compact' : 'regular'}
                      style={styles.primaryActionButton}
                      onPress={() => router.push('/(game)/spectate' as never)}
                    />
                  </OnlineActionPanel>
                </View>

                <View style={[styles.sectionCell, !useTwoColumnGrid && styles.sectionCellCompact]}>
                  <View style={styles.actionsSection}>
                  <OnlineActionPanel
                      title="Create Match"
                    subtitle={(() => {
                        if (createdOpenOnlineMatch?.status === 'open' || createdPrivateMatch) return '';
                        if (createMatchStage === 'game_mode') return '';
                        return selectedMatchStyle === 'private'
                          ? 'Ready to create your private table.'
                          : 'Ready to go live.';
                      })()}
                      titleFontFamily={titleFontFamily}
                      bodyFontFamily={bodyFontFamily}
                      compact={isDenseLayout}
                      titleShiftY={isDenseLayout ? 20 : 22}
                      flexible
                    >
                      {createdOpenOnlineMatch?.status === 'open' ? (
                        <>
                          <Text style={[styles.statusText, { fontFamily: bodyFontFamily }]}>
                            {openWaitingLabel}
                          </Text>
                        </>
                      ) : createdPrivateMatch ? (
                        <>
                          {createMatchStatusLabel ? (
                            <Text style={[styles.statusText, { fontFamily: bodyFontFamily }]}>
                              {createMatchStatusLabel}
                            </Text>
                          ) : null}
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
                                  createdPrivateMatch.hasGuestJoined ? styles.privatePresenceDotReady : null,
                                ]}
                              />
                              <Text style={[styles.privatePresenceText, { fontFamily: bodyFontFamily }]}>
                                {createdPrivateMatch.hasGuestJoined ? 'Friend has arrived' : 'Waiting for friend'}
                              </Text>
                            </View>
                          </View>
                          <View style={styles.actionRow}>
                            <View style={styles.actionRowCell}>
                              <HomeLightButton
                                label={createdPrivateMatch.hasGuestJoined ? 'Start Game' : 'Waiting'}
                                accessibilityLabel={
                                  createdPrivateMatch.hasGuestJoined
                                    ? 'Start private game'
                                    : 'Waiting for friend to join'
                                }
                                fontLoaded={fontsLoaded}
                                size="compact"
                                disabled={!createdPrivateMatch.hasGuestJoined}
                                style={styles.actionRowButton}
                                onPress={startCreatedPrivateMatch}
                              />
                            </View>
                          </View>
                          <View style={styles.secondaryActionWrap}>
                            <HomeLightButton
                              label="Cancel"
                              accessibilityLabel="Cancel and start over"
                              onPress={() => {
                                clearCreatedPrivateMatch();
                                resetCreateMatch();
                              }}
                              fontLoaded={fontsLoaded}
                              size="compact"
                              style={styles.secondaryActionButton}
                            />
                          </View>
                        </>
                      ) : (
                        <>
                          {createMatchStage === 'game_mode' ? (
                            <View style={styles.optionStack}>
                              {createMatchModeOptions.map((option) => {
                                const isFeaturedMode = featuredGameModeOption?.modeId === option.modeId;

                                return (
                                  <HomeLightButton
                                    key={option.modeId}
                                    label={option.label}
                                    accessibilityLabel={
                                      isFeaturedMode
                                        ? `Play Game Mode of the Month ${option.label}`
                                        : option.label
                                    }
                                    fontLoaded={fontsLoaded}
                                    size="compact"
                                    style={styles.primaryActionButton}
                                    onPress={() => {
                                      setSelectedGameMode(option.modeId);
                                      setCreateMatchStage('wager');
                                    }}
                                  />
                                );
                              })}
                            </View>
                          ) : createMatchStage === 'wager' ? (
                            <>
                              <View style={styles.wagerStepper}>
                                <HomeLightButton
                                  label="-"
                                  accessibilityLabel="Decrease wager"
                                  fontLoaded={fontsLoaded}
                                  size="compact"
                                  disabled={wager <= WAGER_MIN}
                                  style={styles.wagerStepButton}
                                  onPress={() => setWager((current) => Math.max(WAGER_MIN, current - WAGER_STEP))}
                                />
                                <View style={styles.wagerValuePill}>
                                  <Text style={[styles.wagerValue, { fontFamily: titleFontFamily }]}>
                                    {wager}
                                  </Text>
                                  <Text style={[styles.wagerLabel, { fontFamily: bodyFontFamily }]}>
                                    coins
                                  </Text>
                                </View>
                                <HomeLightButton
                                  label="+"
                                  accessibilityLabel="Increase wager"
                                  fontLoaded={fontsLoaded}
                                  size="compact"
                                  disabled={wager >= WAGER_MAX}
                                  style={styles.wagerStepButton}
                                  onPress={() => setWager((current) => Math.min(WAGER_MAX, current + WAGER_STEP))}
                                />
                              </View>
                              <HomeLightButton
                                label="Set"
                                fontLoaded={fontsLoaded}
                                size={isDenseLayout ? 'compact' : 'regular'}
                                style={styles.primaryActionButton}
                                onPress={() => setCreateMatchStage('match_style')}
                              />
                              <HomeLightButton
                                label="Cancel"
                                fontLoaded={fontsLoaded}
                                size="compact"
                                style={styles.cancelStageButton}
                                onPress={resetCreateMatch}
                              />
                            </>
                          ) : createMatchStage === 'match_style' ? (
                            <>
                              <View style={styles.optionGrid}>
                                <View style={styles.optionCell}>
                                  <HomeLightButton
                                    label="Online"
                                    fontLoaded={fontsLoaded}
                                    size={isDenseLayout ? 'compact' : 'regular'}
                                    style={styles.primaryActionButton}
                                    onPress={() => {
                                      setSelectedMatchStyle('online');
                                      setCreateMatchStage('wait_time');
                                    }}
                                  />
                                </View>
                                <View style={styles.optionCell}>
                                  <HomeLightButton
                                    label="Private"
                                    fontLoaded={fontsLoaded}
                                    size={isDenseLayout ? 'compact' : 'regular'}
                                    style={styles.primaryActionButton}
                                    onPress={() => {
                                      setSelectedMatchStyle('private');
                                      setCreateMatchStage('ready');
                                    }}
                                  />
                                </View>
                              </View>
                              <HomeLightButton
                                label="Cancel"
                                fontLoaded={fontsLoaded}
                                size="compact"
                                style={styles.cancelStageButton}
                                onPress={resetCreateMatch}
                              />
                            </>
                          ) : createMatchStage === 'wait_time' ? (
                            <>
                              <View style={styles.waitTimeStage}>
                                <Text style={[styles.waitTimePrompt, { fontFamily: bodyFontFamily }]}>
                                  How long to wait for an opponent?
                                </Text>
                                <View style={styles.durationRow}>
                                  {OPEN_MATCH_DURATIONS.map((option) => {
                                    const selected = durationMinutes === option;
                                    return (
                                      <HomeLightButton
                                        key={option}
                                        label={`${option} min`}
                                        accessibilityLabel={`${option} minute open match`}
                                        fontLoaded={fontsLoaded}
                                        size="compact"
                                        style={[
                                          styles.durationButton,
                                          selected ? styles.durationButtonSelected : null,
                                        ]}
                                        onPress={() => {
                                          setDurationMinutes(option);
                                          setCreateMatchStage('ready');
                                        }}
                                      />
                                    );
                                  })}
                                </View>
                              </View>
                              <HomeLightButton
                                label="Cancel"
                                fontLoaded={fontsLoaded}
                                size="compact"
                                style={styles.cancelStageButton}
                                onPress={resetCreateMatch}
                              />
                            </>
                          ) : (
                            <>
                              {createMatchStatusLabel ? (
                                <Text style={[styles.statusText, { fontFamily: bodyFontFamily }]}>
                                  {createMatchStatusLabel}
                                </Text>
                              ) : null}
                              <HomeLightButton
                                label={createMatchButtonTitle}
                                fontLoaded={fontsLoaded}
                                size={isDenseLayout ? 'compact' : 'regular'}
                                loading={isCreatingOpenMatch || isCreatingPrivateGame}
                                disabled={
                                  isBusy ||
                                  (selectedMatchStyle === 'online' && (!canAffordWager || isJoiningOpenMatch))
                                }
                                style={styles.primaryActionButton}
                                onPress={() => void handleCreateMatch()}
                              />
                              <HomeLightButton
                                label="Cancel"
                                fontLoaded={fontsLoaded}
                                size="compact"
                                style={styles.cancelStageButton}
                                onPress={resetCreateMatch}
                              />
                            </>
                          )}
                        </>
                      )}
                    </OnlineActionPanel>
                  </View>
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
    overflow: 'hidden',
  },
  backgroundTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: urPanelColors.sceneOverlay,
  },
  scrollContent: {
    width: '100%',
    alignItems: 'center',
  },
  stage: {
    width: '100%',
    alignItems: 'center',
    gap: urTheme.spacing.lg,
  },
  stageDense: {
    gap: urTheme.spacing.md,
  },
  topBar: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: urTheme.spacing.sm,
  },
  topBarCompact: {
    gap: 8,
    marginBottom: 6,
  },
  topBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    minWidth: 0,
    minHeight: 42,
  },
  topBarLeftCompact: {
    gap: 8,
  },
  hero: {
    width: '100%',
    alignItems: 'center',
    gap: urTheme.spacing.sm,
  },
  heroDense: {
    gap: 6,
  },
  pageTitle: {
    color: urTextColors.titleOnScene,
    textAlign: 'center',
    ...urTextVariants.displayTitle,
  },
  pageTitleDesktop: {
    fontSize: 30,
    lineHeight: 34,
  },
  pageTitleCompact: {
    fontSize: 30,
    lineHeight: 34,
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
    borderColor: urPanelColors.parchmentBorder,
    backgroundColor: urPanelColors.parchmentSurface,
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
    color: urTextColors.bodyOnPanel,
    fontSize: 14,
    lineHeight: 16,
    textAlign: 'center',
    ...urTextVariants.body,
  },
  errorBanner: {
    width: '100%',
    maxWidth: 760,
    paddingHorizontal: urTheme.spacing.md,
    paddingVertical: urTheme.spacing.sm,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(184, 79, 65, 0.24)',
    backgroundColor: 'rgba(255, 236, 226, 0.82)',
  },
  errorBannerText: {
    color: '#9B4438',
    fontSize: 12,
    lineHeight: 17,
    textAlign: 'center',
  },
  errorBannerDense: {
    paddingHorizontal: urTheme.spacing.sm,
    paddingVertical: 6,
    borderRadius: 16,
  },
  featuredSection: {
    width: '100%',
    gap: urTheme.spacing.md,
  },
  featuredCardPanel: {
    width: '100%',
    aspectRatio: LARGE_CARD_ASPECT_RATIO,
    overflow: 'visible',
    justifyContent: 'center',
    transform: [{ scaleX: CARD_SIZE_SCALE }],
  },
  featuredCardPanelDense: {
    aspectRatio: LARGE_DENSE_CARD_ASPECT_RATIO,
  },
  featuredCardPanelImage: {
    width: '100%',
    height: '100%',
  },
  featuredCardPanelImageScaled: {
    transform: [{ scale: CARD_ART_SCALE }],
  },
  featuredCardContent: {
    alignItems: 'center',
    gap: 10,
  },
  featuredCardContentDesktop: {
    paddingTop: 42,
    paddingBottom: 24,
    paddingHorizontal: 40,
    gap: 8,
  },
  featuredCardContentCompact: {
    paddingTop: 36,
    paddingBottom: 20,
    paddingHorizontal: 32,
    gap: 8,
  },
  featuredStateCard: {
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 28,
    paddingVertical: 24,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: urPanelColors.parchmentBorder,
    backgroundColor: urPanelColors.parchmentSurface,
  },
  featuredStateCardCompact: {
    paddingHorizontal: 22,
    paddingVertical: 18,
    gap: 6,
  },
  featuredStateTitle: {
    color: urTextColors.titleOnPanel,
    fontSize: 24,
    lineHeight: 28,
    textAlign: 'center',
    ...urTextVariants.sectionTitle,
  },
  featuredStateText: {
    maxWidth: 620,
    color: urTextColors.bodyOnPanel,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    ...urTextVariants.body,
  },
  featuredStateAction: {
    width: '100%',
    alignItems: 'center',
    marginTop: 4,
  },
  featuredStateButton: {
    alignSelf: 'center',
  },
  featuredList: {
    width: '100%',
    gap: 14,
  },
  onlineMatchesSection: {
    width: '100%',
    gap: urTheme.spacing.md,
  },
  onlineMatchesList: {
    width: '100%',
    gap: 12,
  },
  onlineMatchCardFrame: {
    width: '100%',
    position: 'relative',
    overflow: 'visible',
  },
  onlineMatchPanel: {
    width: '100%',
    aspectRatio: LARGE_CARD_ASPECT_RATIO,
    overflow: 'visible',
    justifyContent: 'center',
    transform: [{ scaleX: CARD_SIZE_SCALE }],
  },
  onlineMatchPanelDense: {
    aspectRatio: LARGE_DENSE_CARD_ASPECT_RATIO,
  },
  onlineMatchPanelImage: {
    width: '100%',
    height: '100%',
  },
  onlineMatchPanelImageScaled: {
    transform: [{ scale: CARD_ART_SCALE }],
  },
  onlineMatchViewport: {
    position: 'absolute',
    top: '12%',
    right: '11%',
    bottom: '12%',
    left: '11%',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  onlineMatchHeaderActions: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    zIndex: 3,
  },
  onlineMatchHeaderSpacer: {
    width: 1,
    height: 1,
  },
  onlineMatchHeader: {
    width: '100%',
    alignItems: 'center',
    gap: 4,
  },
  onlineMatchTitle: {
    color: urTextColors.titleOnPanel,
    fontSize: 22,
    lineHeight: 25,
    textAlign: 'center',
    ...urTextVariants.cardTitle,
  },
  onlineMatchStatus: {
    color: urTextColors.bodyOnPanel,
    fontSize: 13,
    lineHeight: 17,
    textAlign: 'center',
    ...urTextVariants.body,
  },
  onlineMatchMetaGrid: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  onlineMatchMetaCell: {
    minWidth: 104,
    flexGrow: 1,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: urPanelColors.parchmentBorder,
    backgroundColor: urPanelColors.parchmentSurfaceStrong,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  onlineMatchMetaLabel: {
    color: urTextColors.captionOnPanel,
    fontSize: 10,
    lineHeight: 12,
    textAlign: 'center',
    ...urTextVariants.caption,
    marginBottom: 3,
  },
  onlineMatchMetaValue: {
    color: urTextColors.bodyOnPanel,
    fontSize: 13,
    lineHeight: 16,
    textAlign: 'center',
    ...urTextVariants.body,
  },
  onlineMatchButton: {
    width: '100%',
    maxWidth: 164,
  },
  actionsSection: {
    width: '100%',
    gap: urTheme.spacing.md,
  },
  sectionGrid: {
    width: '100%',
    gap: 32,
  },
  sectionGridDense: {
    gap: 28,
  },
  sectionRowHeader: {
    width: '100%',
    alignItems: 'flex-start',
    marginBottom: urTheme.spacing.sm,
  },
  sectionRowHeaderDense: {
    marginBottom: 6,
  },
  sectionRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'stretch',
    justifyContent: 'space-between',
    gap: 112,
  },
  sectionRowDense: {
    gap: 108,
  },
  sectionRowCompact: {
    flexDirection: 'column',
  },
  sectionCell: {
    flex: 1,
    minWidth: 0,
  },
  sectionCellCompact: {
    flex: 0,
    width: '100%',
  },
  gridSectionTitle: {
    flex: 1,
    color: urTextColors.titleOnScene,
    fontSize: 30,
    lineHeight: 34,
    ...urTextVariants.displayTitle,
  },
  modePanel: {
    width: '100%',
    aspectRatio: LARGE_CARD_ASPECT_RATIO,
    position: 'relative',
    overflow: 'visible',
    justifyContent: 'center',
    transform: [{ scaleX: CARD_SIZE_SCALE }],
  },
  modePanelFlexible: {
    width: '100%',
    aspectRatio: LARGE_CARD_ASPECT_RATIO,
    position: 'relative',
    overflow: 'visible',
    justifyContent: 'center',
    transform: [{ scaleX: CARD_SIZE_SCALE }],
  },
  modePanelDesktop: {
    alignSelf: 'center',
  },
  modePanelCompact: {
    aspectRatio: LARGE_DENSE_CARD_ASPECT_RATIO,
    alignSelf: 'center',
  },
  modePanelFrame: {
    width: '100%',
    height: '100%',
  },
  modePanelImage: {
    width: '100%',
    height: '100%',
  },
  modePanelImageScaled: {
    transform: [{ scale: CARD_ART_SCALE }],
  },
  modePanelContent: {
    flex: 1,
    paddingTop: 28,
    paddingBottom: 14,
    paddingHorizontal: 24,
    alignItems: 'center',
    zIndex: 1,
  },
  modePanelContentDesktop: {
    gap: 6,
  },
  modePanelContentCompact: {
    paddingTop: 26,
    paddingBottom: 12,
    paddingHorizontal: 22,
    gap: 6,
  },
  modePanelTitle: {
    color: urTextColors.titleOnPanel,
    textAlign: 'center',
    maxWidth: '72%',
    ...urTextVariants.cardTitle,
  },
  modePanelTitleDesktop: {
    fontSize: 16,
    lineHeight: 18,
  },
  modePanelTitleCompact: {
    fontSize: 15,
    lineHeight: 17,
  },
  modePanelSubtitle: {
    color: urTextColors.bodyOnPanel,
    maxWidth: '82%',
    fontSize: 11,
    lineHeight: 15,
    textAlign: 'center',
    ...urTextVariants.body,
  },
  modePanelBody: {
    flex: 1,
    width: '100%',
    marginTop: 0,
    gap: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryActionButton: {
    width: '100%',
    maxWidth: 164,
    alignSelf: 'center',
  },
  primaryActionField: {
    width: '100%',
    maxWidth: 176,
    alignSelf: 'center',
  },
  optionActionButton: {
    width: '100%',
  },
  statusText: {
    maxWidth: '94%',
    color: urTextColors.bodyOnPanel,
    fontSize: 11,
    lineHeight: 15,
    textAlign: 'center',
    ...urTextVariants.body,
  },
  wagerStepper: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  wagerStepButton: {
    flex: 1,
  },
  wagerValuePill: {
    minWidth: 72,
    minHeight: 40,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: urPanelColors.parchmentBorder,
    backgroundColor: urPanelColors.parchmentSurfaceStrong,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  wagerValue: {
    color: urTextColors.titleOnPanel,
    fontSize: 18,
    lineHeight: 20,
    textAlign: 'center',
    ...urTextVariants.cardTitle,
  },
  wagerLabel: {
    color: urTextColors.captionOnPanel,
    fontSize: 9,
    lineHeight: 11,
    textAlign: 'center',
    ...urTextVariants.caption,
  },
  durationRow: {
    width: '100%',
    maxWidth: 220,
    flexDirection: 'row',
    justifyContent: 'center',
    alignSelf: 'center',
    gap: 4,
  },
  durationButton: {
    flex: 1,
    minWidth: 0,
  },
  durationButtonSelected: {
    transform: [{ translateY: 1 }],
  },
  waitTimeStage: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  waitTimePrompt: {
    color: urTextColors.bodyOnPanel,
    fontSize: 11,
    lineHeight: 15,
    textAlign: 'center',
    marginTop: 10,
    maxWidth: '90%',
    ...urTextVariants.body,
  },
  privateCodePanel: {
    width: '100%',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: urPanelColors.parchmentBorder,
    backgroundColor: urPanelColors.parchmentSurfaceStrong,
    alignItems: 'center',
    gap: 6,
  },
  privateCodeEyebrow: {
    color: urTextColors.captionOnPanel,
    fontSize: 12,
    lineHeight: 14,
    ...urTextVariants.caption,
    textAlign: 'center',
  },
  privateCodeValue: {
    color: urTextColors.titleOnPanel,
    fontSize: 20,
    lineHeight: 24,
    letterSpacing: 2.2,
    textAlign: 'center',
    ...urTextVariants.sectionTitle,
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
    backgroundColor: 'rgba(184, 134, 11, 0.62)',
  },
  privatePresenceDotReady: {
    backgroundColor: '#5DB11F',
    shadowColor: '#5DB11F',
    shadowOpacity: 0.35,
    shadowRadius: 4,
  },
  privatePresenceText: {
    color: urTextColors.bodyOnPanel,
    fontSize: 13,
    lineHeight: 16,
    textAlign: 'center',
    ...urTextVariants.body,
  },
  actionRow: {
    width: '100%',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
  },
  actionRowCell: {
    width: '100%',
    maxWidth: 170,
  },
  secondaryActionWrap: {
    width: '100%',
    alignItems: 'center',
    marginTop: 0,
    maxWidth: 170,
    alignSelf: 'center',
  },
  secondaryActionButton: {
    width: '100%',
  },
  cancelStageButton: {
    width: '100%',
    maxWidth: 120,
    alignSelf: 'center',
    opacity: 0.72,
  },
  actionRowButton: {
    width: '100%',
  },
  optionStack: {
    width: '100%',
    maxWidth: 164,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  codeInput: {
    width: '100%',
    minHeight: 46,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: urPanelColors.parchmentBorder,
    backgroundColor: urPanelColors.parchmentSurfaceStrong,
    color: urTextColors.titleOnPanel,
    textAlign: 'center',
    fontSize: 18,
    lineHeight: 22,
    letterSpacing: 2.2,
    paddingHorizontal: urTheme.spacing.md,
  },
});
