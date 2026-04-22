import { HomeLightButton } from '@/components/home/HomeLightButton';
import { XpRewardBadge } from '@/components/progression/XpRewardBadge';
import { TournamentCard } from '@/components/tournaments/TournamentCard';
import { MobileBackground, useMobileBackground } from '@/components/ui/MobileBackground';
import { SketchButton } from '@/components/ui/SketchButton';
import { AnimatedCurrencyChip } from '@/components/wallet/AnimatedCurrencyChip';
import { MatchEconomyInfoButton } from '@/components/match/MatchEconomyInfoButton';
import { MatchEconomyInfoModal } from '@/components/match/MatchEconomyInfoModal';
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
import { getPublicGameModes, resolveGameModeMatchConfig } from '@/services/gameModes';
import { listOpenOnlineMatches, type OpenOnlineMatch } from '@/services/matchmaking';
import { nakamaService } from '@/services/nakama';
import { buildOpenOnlineMatchEconomyDetails, type MatchEconomyDetails } from '@/shared/matchEconomy';
import { getXpAwardAmount } from '@/shared/progression';
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
import { buildMatchRoutePath } from '@/src/match/buildMatchRoutePath';
import { useTournamentList } from '@/src/tournaments/useTournamentList';
import { useWallet } from '@/src/wallet/useWallet';
import { useGameStore } from '@/store/useGameStore';
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
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const homeWideBackground = require('../../assets/images/bg_online.png');
const homeMobileBackground = require('../../assets/images/bg_online_mobile.png');
const onlineActionCard = require('../../assets/images/home_stat_card.png');
const ONLINE_ACTION_CARD_ASPECT_RATIO = 626 / 732;
const WAGER_MIN = 10;
const WAGER_MAX = 100;
const WAGER_STEP = 10;
const OPEN_MATCH_DURATIONS = [3, 5, 10] as const;
type CreateMatchStage = 'game_mode' | 'wager' | 'match_style' | 'wait_time' | 'ready';
type CreateMatchStyle = 'online' | 'private';
type FeaturedGameMode = Awaited<ReturnType<typeof getPublicGameModes>>['featuredMode'];
type MatchEconomyModalState = {
  title: string;
  details: MatchEconomyDetails;
};

type OnlineActionPanelProps = {
  title: string;
  subtitle: string;
  titleFontFamily: string;
  bodyFontFamily: string;
  compact: boolean;
  rewardAmount?: number;
  flexible?: boolean;
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
  flexible,
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
        source={onlineActionCard}
        resizeMode="stretch"
        style={styles.modePanelFrame}
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

const getOpenMatchRemainingLabel = (match: OpenOnlineMatch, now: number) => {
  const remainingMs = Math.max(0, Date.parse(match.expiresAt) - now);
  const remainingSeconds = Math.ceil(remainingMs / 1000);
  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;

  if (remainingSeconds <= 0) {
    return 'Closing now';
  }

  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

type OnlineMatchCardProps = {
  match: OpenOnlineMatch;
  now: number;
  fontLoaded: boolean;
  titleFontFamily: string;
  bodyFontFamily: string;
  joining: boolean;
  spectating: boolean;
  disabled: boolean;
  onJoin: (match: OpenOnlineMatch) => void;
  onSpectate: (match: OpenOnlineMatch) => void;
  onResume: (match: OpenOnlineMatch) => void;
  onInfoPress: () => void;
};

const OnlineMatchCard: React.FC<OnlineMatchCardProps> = ({
  match,
  now,
  fontLoaded,
  titleFontFamily,
  bodyFontFamily,
  joining,
  spectating,
  disabled,
  onJoin,
  onSpectate,
  onResume,
  onInfoPress,
}) => {
  const isLive = match.status === 'matched';
  const isParticipant = match.isCreator || match.isJoiner;
  const title = isLive ? (isParticipant ? 'Your Match' : 'Live Wager Match') : match.isCreator ? 'Your Open Match' : 'Open Wager Match';
  const statusLabel = isLive ? 'In Progress' : match.isCreator ? 'Waiting for opponent' : 'Ready to join';
  const canJoin = !isParticipant && match.status === 'open' && !disabled;
  const canSpectate = isLive && !isParticipant && !disabled && !spectating;
  const canResume = isLive && isParticipant && !disabled && !spectating;

  return (
    <View style={styles.onlineMatchCardFrame}>
      <View style={styles.onlineMatchCard}>
        <View style={styles.onlineMatchHeader}>
          <Text style={[styles.onlineMatchTitle, { fontFamily: titleFontFamily }]}>{title}</Text>
          <Text style={[styles.onlineMatchStatus, { fontFamily: bodyFontFamily }]}>{statusLabel}</Text>
        </View>

        <View style={styles.onlineMatchMetaGrid}>
          <View style={styles.onlineMatchMetaCell}>
            <Text style={[styles.onlineMatchMetaLabel, { fontFamily: bodyFontFamily }]}>Wager</Text>
            <Text style={[styles.onlineMatchMetaValue, { fontFamily: bodyFontFamily }]}>
              {match.wager} coins
            </Text>
          </View>
          <View style={styles.onlineMatchMetaCell}>
            <Text style={[styles.onlineMatchMetaLabel, { fontFamily: bodyFontFamily }]}>
              {isLive ? 'State' : 'Open'}
            </Text>
            <Text style={[styles.onlineMatchMetaValue, { fontFamily: bodyFontFamily }]}>
              {isLive ? 'Live now' : getOpenMatchRemainingLabel(match, now)}
            </Text>
          </View>
          <View style={styles.onlineMatchMetaCell}>
            <Text style={[styles.onlineMatchMetaLabel, { fontFamily: bodyFontFamily }]}>Entrants</Text>
            <Text style={[styles.onlineMatchMetaValue, { fontFamily: bodyFontFamily }]}>
              {match.entrants}/{match.maxEntrants}
            </Text>
          </View>
        </View>

        <HomeLightButton
          label={
            isLive
              ? isParticipant
                ? spectating
                  ? 'Opening...'
                  : 'Resume'
                : spectating
                  ? 'Opening...'
                  : 'Spectate'
              : match.isCreator
                ? 'Waiting'
                : joining
                  ? 'Joining...'
                  : 'Join Match'
          }
          fontLoaded={fontLoaded}
          size="compact"
          loading={joining || spectating}
          disabled={isLive ? (isParticipant ? !canResume : !canSpectate) : !canJoin || joining}
          style={styles.onlineMatchButton}
          onPress={() => {
            if (isLive) {
              if (isParticipant) {
                onResume(match);
              } else {
                onSpectate(match);
              }
              return;
            }

            onJoin(match);
          }}
        />
      </View>

      <View pointerEvents="box-none" style={styles.onlineMatchHeaderActions}>
        <View style={styles.onlineMatchHeaderSpacer} />
        <MatchEconomyInfoButton
          accessibilityLabel={`Open economy details for ${title}`}
          onPress={onInfoPress}
        />
      </View>
    </View>
  );
};

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
  const [joiningOpenMatchId, setJoiningOpenMatchId] = useState<string | null>(null);
  const [spectatingOpenMatchId, setSpectatingOpenMatchId] = useState<string | null>(null);
  const [openMatchNow, setOpenMatchNow] = useState(() => Date.now());
  const initGame = useGameStore((state) => state.initGame);
  const setNakamaSession = useGameStore((state) => state.setNakamaSession);
  const setUserId = useGameStore((state) => state.setUserId);
  const setMatchToken = useGameStore((state) => state.setMatchToken);
  const setOnlineMode = useGameStore((state) => state.setOnlineMode);
  const setPlayerColor = useGameStore((state) => state.setPlayerColor);
  const setSocketState = useGameStore((state) => state.setSocketState);
  const {
    createOpenMatch,
    joinOpenMatch,
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
    tournaments: featuredTournaments,
    isLoading: isLoadingFeaturedTournaments,
    errorMessage: tournamentErrorMessage,
    joinTournament,
    launchMatch,
    joiningRunId,
    launchingRunId,
  } = useTournamentList({ featured: true, limit: 12 });
  const [fontsLoaded] = useFonts({
    [HOME_FREDOKA_FONT_FAMILY]: require('../../assets/fonts/LilitaOne-Regular.ttf'),
    [HOME_GROBOLD_FONT_FAMILY]: require('../../assets/fonts/LilitaOne-Regular.ttf'),
    [HOME_SUPERCELL_FONT_FAMILY]: require('../../assets/fonts/Supercell-Magic-Regular.ttf'),
  });
  const showWideBackground = Platform.OS === 'web' && width >= MIN_WIDE_WEB_BACKGROUND_WIDTH;
  const showMobileBackground = useMobileBackground();
  const isCompactLayout = width < 820;
  const isDesktopViewport = Platform.OS === 'web' && width >= 920;
  const useThreeColumnLayout = Platform.OS === 'web' && width >= 1180;
  const useFourColumnActionLayout = Platform.OS === 'web' && width >= 1180;
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
  const actionsStageWidth = useThreeColumnLayout
    ? Math.min(stageWidth, useFourColumnActionLayout ? 1180 : 960)
    : isDesktopViewport
      ? Math.min(stageWidth, 720)
      : isCompactLayout
        ? Math.min(stageWidth, 320)
        : Math.min(stageWidth, 680);
  const titleFontFamily = resolveHomeMagicFontFamily(fontsLoaded);
  const bodyFontFamily = resolveHomeFredokaFontFamily(fontsLoaded);
  const buttonFontFamily = resolveHomeButtonFontFamily(fontsLoaded);
  const [economyModal, setEconomyModal] = useState<MatchEconomyModalState | null>(null);
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
      setOpenMatchNow(Date.now());
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
    const intervalId = setInterval(() => setOpenMatchNow(Date.now()), 1_000);
    return () => clearInterval(intervalId);
  }, []);

  if (mode === 'bot') {
    return null;
  }

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

  const handleJoinOpenMatch = async (match: OpenOnlineMatch) => {
    setJoiningOpenMatchId(match.openMatchId);
    try {
      const joined = await joinOpenMatch(match.openMatchId);
      if (joined) {
        setOpenMatches((current) =>
          current.filter((entry) => entry.openMatchId !== match.openMatchId),
        );
        void refreshWallet({ silent: true });
      }
    } finally {
      setJoiningOpenMatchId(null);
    }
  };

  const enterOpenMatch = async (match: OpenOnlineMatch, options?: { spectator?: boolean }) => {
    if (!options?.spectator && !match.isCreator && !match.isJoiner) {
      return;
    }

    if (options?.spectator && (match.isCreator || match.isJoiner)) {
      return;
    }

    setOpenMatchesError(null);
    setSpectatingOpenMatchId(match.openMatchId);
    try {
      const session = await nakamaService.ensureAuthenticatedDevice();
      if (!session.user_id) {
        throw new Error('Authenticated session is missing user ID.');
      }

      setNakamaSession(session);
      setUserId(session.user_id);
      setOnlineMode('nakama');
      setMatchToken(null);
      setPlayerColor(null);
      setSocketState('idle');
      initGame(match.matchId, {
        matchConfig: await resolveGameModeMatchConfig(match.modeId, {
          allowsXp: true,
          allowsChallenges: true,
          allowsCoins: true,
          allowsOnline: true,
          allowsRankedStats: true,
          isPracticeMode: false,
        }),
      });
      router.push(
        buildMatchRoutePath({
          id: match.matchId,
          modeId: match.modeId,
          spectator: options?.spectator ?? false,
        }) as never,
      );
    } catch (error) {
      setOpenMatchesError(
        error instanceof Error ? error.message : options?.spectator ? 'Unable to spectate that match.' : 'Unable to open that match.',
      );
      setSpectatingOpenMatchId(null);
    }
  };

  const handleSpectateOpenMatch = async (match: OpenOnlineMatch) => {
    await enterOpenMatch(match, { spectator: true });
  };

  const handleResumeOpenMatch = async (match: OpenOnlineMatch) => {
    await enterOpenMatch(match);
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
  const publicWinRewardXp = getXpAwardAmount('pvp_win');
  const privateWinRewardXp = getXpAwardAmount('private_pvp_win');

  const canAffordWager = softCurrency >= wager;
  const featuredGameModeOption = featuredGameMode
    ? {
        modeId: featuredGameMode.id,
        label: featuredGameMode.name,
        description: featuredGameMode.description,
      }
    : null;
  const resolveMatchModeOption = (modeId: string | null | undefined) =>
    PRIVATE_MATCH_OPTIONS.find((option) => option.modeId === modeId) ??
    (featuredGameModeOption?.modeId === modeId ? featuredGameModeOption : null);
  const pendingPrivateOption = resolveMatchModeOption(pendingPrivateMode);
  const createdPrivateOption = resolveMatchModeOption(createdPrivateMatch?.modeId ?? null);

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
          <View style={[styles.topBar, isCompactLayout ? styles.topBarCompact : null]}>
            <View style={[styles.topBarLeft, isCompactLayout ? styles.topBarLeftCompact : null]}>
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

            <View style={[styles.featuredSection, { maxWidth: actionsStageWidth }]}>
              {featuredTournaments.length > 0 ? (
                <View style={styles.featuredHeaderAction}>
                  <SketchButton
                    label="See All Tournaments"
                    accessibilityLabel="See all tournaments"
                    onPress={() => router.push('/tournaments' as never)}
                    fontFamily={buttonFontFamily}
                    style={styles.featuredHeaderButton}
                  />
                </View>
              ) : null}

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
                  <View style={styles.featuredStateAction}>
                    <SketchButton
                      label="See All Tournaments"
                      accessibilityLabel="See all tournaments"
                      onPress={() => router.push('/tournaments' as never)}
                      fontFamily={buttonFontFamily}
                      style={styles.featuredStateButton}
                    />
                  </View>
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

            <View style={[styles.onlineMatchesSection, { maxWidth: actionsStageWidth }]}>
              <Text style={[styles.onlineMatchesSectionTitle, { fontFamily: titleFontFamily }]}>
                Online Matches
              </Text>

              {openMatchesError ? (
                <View style={styles.errorBanner}>
                  <Text style={[styles.errorBannerText, { fontFamily: bodyFontFamily }]}>
                    {openMatchesError}
                  </Text>
                </View>
              ) : null}

              {isLoadingOpenMatches && openMatches.length === 0 ? (
                <View style={styles.featuredStateCard}>
                  <Text style={[styles.featuredStateTitle, { fontFamily: titleFontFamily }]}>
                    Loading online matches...
                  </Text>
                  <Text style={[styles.featuredStateText, { fontFamily: bodyFontFamily }]}>
                    Checking wager tables and live games.
                  </Text>
                </View>
              ) : openMatches.length === 0 ? (
                <View style={styles.featuredStateCard}>
                  <Text style={[styles.featuredStateTitle, { fontFamily: titleFontFamily }]}>
                    No online matches
                  </Text>
                  <Text style={[styles.featuredStateText, { fontFamily: bodyFontFamily }]}>
                    Create a wagered match, or check back when a table is live.
                  </Text>
                </View>
              ) : (
                <View style={styles.onlineMatchesList}>
                  {openMatches.map((match) => (
                    <OnlineMatchCard
                      key={match.openMatchId}
                      match={match}
                      now={openMatchNow}
                      fontLoaded={fontsLoaded}
                      titleFontFamily={titleFontFamily}
                      bodyFontFamily={bodyFontFamily}
                      joining={joiningOpenMatchId === match.openMatchId}
                      spectating={spectatingOpenMatchId === match.openMatchId}
                      disabled={isBusy || spectatingOpenMatchId !== null}
                      onJoin={(selected) => {
                        void handleJoinOpenMatch(selected);
                      }}
                      onSpectate={(selected) => {
                        void handleSpectateOpenMatch(selected);
                      }}
                      onResume={(selected) => {
                        void handleResumeOpenMatch(selected);
                      }}
                      onInfoPress={() => {
                        setEconomyModal({
                          title: `${match.status === 'matched' ? 'Live Wager Match' : 'Open Wager Match'} Economy`,
                          details: buildOpenOnlineMatchEconomyDetails(match.wager),
                        });
                      }}
                    />
                  ))}
                </View>
              )}
            </View>

            <View style={[styles.actionsSection, { maxWidth: actionsStageWidth }]}>
              <Text style={[styles.actionsTitle, { fontFamily: titleFontFamily }]}>
                Choose how you want to enter the court
              </Text>
              <View
                style={[
                  styles.actionGrid,
                  useFourColumnActionLayout
                    ? styles.actionGridFourColumn
                    : useThreeColumnLayout && styles.actionGridThreeColumn,
                ]}
              >
                <View
                  style={[
                    styles.actionCell,
                    isCompactLayout && styles.actionCellCompact,
                    useThreeColumnLayout && styles.actionCellThreeColumn,
                  ]}
                >
                  <OnlineActionPanel
                    title="Create Online Match"
                    subtitle={(() => {
                      if (createdOpenOnlineMatch?.status === 'open' || createdPrivateMatch) return '';
                      if (createMatchStage === 'game_mode') return 'Choose your game mode.';
                      if (createMatchStage === 'wager') return 'Set your coin wager.';
                      if (createMatchStage === 'match_style') return 'Online or private match?';
                      if (createMatchStage === 'wait_time') return 'How long to wait for an opponent?';
                      return selectedMatchStyle === 'private' ? 'Ready to create your private table.' : 'Ready to go live.';
                    })()}
                    titleFontFamily={titleFontFamily}
                    bodyFontFamily={bodyFontFamily}
                    compact={isCompactLayout}
                    rewardAmount={selectedMatchStyle === 'private' ? privateWinRewardXp : publicWinRewardXp}
                    flexible
                  >
                    {createdOpenOnlineMatch?.status === 'open' ? (
                      <>
                        <Text style={[styles.statusText, { fontFamily: bodyFontFamily }]}>
                          {openWaitingLabel}
                        </Text>
                        <View style={styles.waitingActionRow}>
                          <HomeLightButton
                            label="Play Bot"
                            accessibilityLabel="Play bot while waiting"
                            fontLoaded={fontsLoaded}
                            size="compact"
                            style={styles.waitingActionButton}
                            onPress={() => router.push('/(game)/bot' as never)}
                          />
                          <HomeLightButton
                            label="Inventory"
                            accessibilityLabel="Go to inventory while waiting"
                            fontLoaded={fontsLoaded}
                            size="compact"
                            style={styles.waitingActionButton}
                            onPress={() => router.push('/inventory' as never)}
                          />
                          <HomeLightButton
                            label="Store"
                            accessibilityLabel="Go to store while waiting"
                            fontLoaded={fontsLoaded}
                            size="compact"
                            style={styles.waitingActionButton}
                            onPress={() => router.push('/store' as never)}
                          />
                        </View>
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
                            onPress={() => { clearCreatedPrivateMatch(); resetCreateMatch(); }}
                            fontLoaded={fontsLoaded}
                            size="compact"
                            style={styles.secondaryActionButton}
                          />
                        </View>
                      </>
                    ) : (
                      <>
                        {createMatchStage === 'game_mode' ? (
                          <View style={styles.optionGrid}>
                            {PRIVATE_MATCH_OPTIONS.map((option) => (
                              <View key={option.modeId} style={styles.optionCell}>
                                <HomeLightButton
                                  label={option.label}
                                  fontLoaded={fontsLoaded}
                                  size={isCompactLayout ? 'compact' : 'regular'}
                                  style={styles.primaryActionButton}
                                  onPress={() => {
                                    setSelectedGameMode(option.modeId);
                                    setCreateMatchStage('wager');
                                  }}
                                />
                                {option.modeId === 'gameMode_finkel_rules' && featuredGameModeOption ? (
                                  <View style={styles.featuredOptionWrap}>
                                    <HomeLightButton
                                      label={featuredGameModeOption.label}
                                      accessibilityLabel={`Play Game Mode of the Month ${featuredGameModeOption.label}`}
                                      fontLoaded={fontsLoaded}
                                      size={isCompactLayout ? 'compact' : 'regular'}
                                      style={styles.primaryActionButton}
                                      onPress={() => {
                                        setSelectedGameMode(featuredGameModeOption.modeId);
                                        setCreateMatchStage('wager');
                                      }}
                                    />
                                  </View>
                                ) : null}
                              </View>
                            ))}
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
                                <Text style={[styles.wagerLabel, { fontFamily: bodyFontFamily }]}>coins</Text>
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
                              size={isCompactLayout ? 'compact' : 'regular'}
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
                                  size={isCompactLayout ? 'compact' : 'regular'}
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
                                  size={isCompactLayout ? 'compact' : 'regular'}
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
                              size={isCompactLayout ? 'compact' : 'regular'}
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

                <View
                  style={[
                    styles.actionCell,
                    isCompactLayout && styles.actionCellCompact,
                    useFourColumnActionLayout
                      ? styles.actionCellFourColumn
                      : useThreeColumnLayout && styles.actionCellThreeColumn,
                  ]}
                >
                  <OnlineActionPanel
                    title="Enter Private Code"
                    subtitle="Paste the short code your friend sent you to enter their private table."
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
            </View>
          </View>
        </ScrollView>
        <MatchEconomyInfoModal
          visible={Boolean(economyModal)}
          title={economyModal?.title ?? 'Match Economy'}
          details={economyModal?.details ?? null}
          onClose={() => setEconomyModal(null)}
        />
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
    backgroundColor: urPanelColors.sceneOverlay,
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: urTheme.spacing.sm,
  },
  topBarCompact: {
    gap: 8,
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
  featuredSection: {
    width: '100%',
    gap: urTheme.spacing.md,
  },
  featuredHeaderAction: {
    alignItems: 'center',
  },
  featuredHeaderButton: {
    alignSelf: 'center',
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
  onlineMatchesSectionTitle: {
    color: urTextColors.titleOnScene,
    fontSize: 30,
    lineHeight: 34,
    textAlign: 'center',
    ...urTextVariants.displayTitle,
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
  onlineMatchCard: {
    width: '100%',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: urPanelColors.parchmentBorder,
    backgroundColor: urPanelColors.parchmentSurface,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
    alignItems: 'center',
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
    alignItems: 'center',
    gap: urTheme.spacing.md,
  },
  actionsTitle: {
    color: urTextColors.titleOnScene,
    fontSize: 30,
    lineHeight: 34,
    textAlign: 'center',
    maxWidth: 640,
    ...urTextVariants.displayTitle,
  },
  actionGrid: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: urTheme.spacing.md,
  },
  actionGridThreeColumn: {
    justifyContent: 'center',
  },
  actionGridFourColumn: {
    justifyContent: 'center',
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
  actionCellFourColumn: {
    width: '23.8%',
  },
  modePanel: {
    width: '100%',
    aspectRatio: ONLINE_ACTION_CARD_ASPECT_RATIO,
    position: 'relative',
    overflow: 'visible',
    justifyContent: 'center',
  },
  modePanelFlexible: {
    width: '100%',
    position: 'relative',
    overflow: 'visible',
    justifyContent: 'center',
  },
  modePanelDesktop: {
    maxWidth: 320,
    minHeight: 420,
    alignSelf: 'center',
  },
  modePanelCompact: {
    maxWidth: 300,
    minHeight: 390,
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
  modeRewardBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    minWidth: 78,
    transform: [{ scale: 0.72 }],
    zIndex: 2,
  },
  modeRewardBadgeCompact: {
    top: 2,
    right: 2,
    minWidth: 78,
    transform: [{ scale: 0.72 }],
  },
  modePanelContent: {
    flex: 1,
    paddingTop: 52,
    paddingBottom: 22,
    paddingHorizontal: 26,
    alignItems: 'center',
    zIndex: 1,
  },
  modePanelContentDesktop: {
    gap: 7,
  },
  modePanelContentCompact: {
    paddingTop: 48,
    paddingBottom: 20,
    paddingHorizontal: 24,
    gap: 7,
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
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 5,
  },
  durationButton: {
    flex: 1,
  },
  durationButtonSelected: {
    transform: [{ translateY: 1 }],
  },
  waitingActionRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  waitingActionButton: {
    flex: 1,
    maxWidth: 82,
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
  optionGrid: {
    width: '100%',
    maxWidth: 164,
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
  },
  optionCell: {
    width: '100%',
  },
  featuredOptionWrap: {
    width: '100%',
    marginTop: 8,
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
