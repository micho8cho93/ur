import { boxShadow } from '@/constants/styleEffects';
import { urTheme, urTypography } from '@/constants/urTheme';
import {
  formatTournamentLobbyCountdown,
  getTournamentLobbyCountdownMsRemaining,
} from '@/shared/tournamentLobby';
import type { ChallengeDefinition, UserChallengeProgressRpcResponse } from '@/shared/challenges';
import type { EloRatingProfileRpcResponse } from '@/shared/elo';
import type { ProgressionSnapshot } from '@/shared/progression';
import type { PublicTournamentDetail } from '@/src/tournaments/types';
import React, { useEffect, useMemo, useState } from 'react';
import { Image, Platform, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

const STONE_SLAB_BACKGROUND = require('../../assets/images/ur_bg.png');

type TournamentStartWaitingRoomProps = {
  tournament: PublicTournamentDetail;
  eloProfile: EloRatingProfileRpcResponse | null;
  progression: ProgressionSnapshot | null;
  challengeDefinitions: ChallengeDefinition[];
  challengeProgress: UserChallengeProgressRpcResponse | null;
  isLaunching: boolean;
  errorMessage: string | null;
};

type WaitingRoomCard = {
  key: string;
  eyebrow: string;
  title: string;
  body: string;
  accent: string;
};

const CARD_DURATION_MS = 15_000;

const ROYAL_GAME_OF_UR_FACTS = [
  'The best-known Royal Game of Ur boards were excavated from the Royal Tombs of Ur in southern Iraq.',
  'Rosette spaces are special safe tiles and, in many reconstructed rulesets, they also grant an extra roll.',
  'A Babylonian cuneiform tablet helped modern historians rebuild a playable ruleset for the game.',
  'The game spread far beyond Mesopotamia and survived for centuries in different regional forms.',
] as const;

const MESOPOTAMIA_AND_BABYLONIA_FACTS = [
  'Mesopotamia grew between the Tigris and Euphrates, where cities like Ur became major centers of trade and ritual.',
  'Babylonia rose later in southern Mesopotamia and became famous for scholarship, astronomy, and royal law codes.',
  'Clay tablets from Mesopotamia recorded business, religion, and games in cuneiform writing.',
  'Ur was a Sumerian powerhouse long before Babylon became the political and cultural star of the region.',
] as const;

const nextShuffleState = (value: number): number => {
  let state = value >>> 0;
  state ^= state << 13;
  state ^= state >>> 17;
  state ^= state << 5;
  return state >>> 0;
};

const shuffleCards = (cards: WaitingRoomCard[], seed: number): WaitingRoomCard[] => {
  const shuffled = cards.slice();
  let state = (seed + 1) * 0x9e3779b1;

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    state = nextShuffleState(state);
    const swapIndex = state % (index + 1);
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }

  return shuffled;
};

const buildEloCard = (eloProfile: EloRatingProfileRpcResponse | null): WaitingRoomCard => {
  if (!eloProfile) {
    return {
      key: 'elo-profile',
      eyebrow: 'Your Elo',
      title: 'Ranked rating unavailable',
      body: 'Sign in with Google to track ranked Elo, ladder rank, and rated-game history.',
      accent: '#A7D3FF',
    };
  }

  const rankLabel = typeof eloProfile.rank === 'number' ? `Rank #${eloProfile.rank}` : 'Unranked on the ladder';
  return {
    key: 'elo-profile',
    eyebrow: 'Your Elo',
    title: `${eloProfile.eloRating} Elo`,
    body: `${rankLabel} • ${eloProfile.ratedGames} rated games • ${eloProfile.ratedWins} wins / ${eloProfile.ratedLosses} losses.`,
    accent: '#A7D3FF',
  };
};

const buildXpCard = (progression: ProgressionSnapshot | null): WaitingRoomCard => {
  if (!progression) {
    return {
      key: 'xp-profile',
      eyebrow: 'Your XP',
      title: 'Progression syncing',
      body: 'Your XP, rank, and next milestone will appear here as soon as progression data loads.',
      accent: '#F4D189',
    };
  }

  const nextRankLabel = progression.nextRank
    ? `${progression.xpNeededForNextRank} XP to ${progression.nextRank}.`
    : 'You are already at the highest rank.';

  return {
    key: 'xp-profile',
    eyebrow: 'Your XP',
    title: `${progression.totalXp} XP`,
    body: `${progression.currentRank} • ${nextRankLabel}`,
    accent: '#F4D189',
  };
};

const buildChallengesCard = (
  challengeDefinitions: ChallengeDefinition[],
  challengeProgress: UserChallengeProgressRpcResponse | null,
): WaitingRoomCard => {
  if (!challengeProgress) {
    return {
      key: 'challenges',
      eyebrow: 'Challenges',
      title: 'Challenge archive syncing',
      body: 'Recent challenge completions are still being pulled into your account snapshot.',
      accent: '#E7B56A',
    };
  }

  const nextIncompleteChallenge = challengeDefinitions.find(
    (definition) => !challengeProgress.challenges[definition.id]?.completed,
  );
  const challengeTotal = challengeDefinitions.length > 0 ? challengeDefinitions.length : challengeProgress.totalCompleted;
  const nextLabel = nextIncompleteChallenge
    ? `Next target: ${nextIncompleteChallenge.name}.`
    : 'Every visible challenge is complete.';

  return {
    key: 'challenges',
    eyebrow: 'Challenges',
    title: `${challengeProgress.totalCompleted}/${challengeTotal} completed`,
    body: `${challengeProgress.stats.totalWins} wins logged across ${challengeProgress.stats.totalGamesPlayed} games. ${nextLabel}`,
    accent: '#E7B56A',
  };
};

const buildCards = (
  eloProfile: EloRatingProfileRpcResponse | null,
  progression: ProgressionSnapshot | null,
  challengeDefinitions: ChallengeDefinition[],
  challengeProgress: UserChallengeProgressRpcResponse | null,
): WaitingRoomCard[] => [
  buildEloCard(eloProfile),
  buildXpCard(progression),
  buildChallengesCard(challengeDefinitions, challengeProgress),
  {
    key: 'elo-explainer',
    eyebrow: 'How Elo Works',
    title: 'Skill shifts by opponent strength',
    body: 'Elo rises more when you beat stronger opponents and falls more when you lose to lower-rated opponents.',
    accent: '#81BEFF',
  },
  {
    key: 'xp-explainer',
    eyebrow: 'How XP Works',
    title: 'Progression is permanent',
    body: 'XP comes from wins and challenges. It never drops, and it unlocks higher court ranks over time.',
    accent: '#F6D697',
  },
  ...ROYAL_GAME_OF_UR_FACTS.map((fact, index) => ({
    key: `ur-fact-${index}`,
    eyebrow: 'Royal Game of Ur',
    title: 'Archive Note',
    body: fact,
    accent: '#B7DEFF',
  })),
  ...MESOPOTAMIA_AND_BABYLONIA_FACTS.map((fact, index) => ({
    key: `mesopotamia-fact-${index}`,
    eyebrow: 'Mesopotamia & Babylonia',
    title: 'World Note',
    body: fact,
    accent: '#F0C965',
  })),
];

export const TournamentStartWaitingRoom: React.FC<TournamentStartWaitingRoomProps> = ({
  tournament,
  eloProfile,
  progression,
  challengeDefinitions,
  challengeProgress,
  isLaunching,
  errorMessage,
}) => {
  const { width, height } = useWindowDimensions();
  const isCompactViewport = width < 760 || height < 760;
  const isVeryShortViewport = height < 680;
  const isDesktopViewport = Platform.OS === 'web' && width >= 920;
  const isTightDesktopViewport = isDesktopViewport && height <= 820;
  const isWideViewport = width >= 1180;
  const useSplitLayout = isWideViewport || isDesktopViewport;
  const [cardIndex, setCardIndex] = useState(0);
  const [shuffleSeed, setShuffleSeed] = useState(0);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const cards = useMemo(
    () =>
      shuffleCards(
        buildCards(eloProfile, progression, challengeDefinitions, challengeProgress),
        shuffleSeed,
      ),
    [challengeDefinitions, challengeProgress, eloProfile, progression, shuffleSeed],
  );
  const activeCard = cards[cardIndex] ?? cards[0];
  const entrantsLabel = `${tournament.entrants}/${tournament.maxEntrants}`;
  const seatsRemaining = Math.max(0, tournament.maxEntrants - tournament.entrants);
  const currentRound = tournament.participation.currentRound ?? tournament.currentRound ?? 1;
  const countdownLabel = useMemo(() => {
    if (tournament.participation.canLaunch || isLaunching) {
      return null;
    }

    const remainingMs = getTournamentLobbyCountdownMsRemaining(tournament.lobbyDeadlineAt ?? null, nowMs);
    return remainingMs === null ? null : formatTournamentLobbyCountdown(remainingMs);
  }, [isLaunching, nowMs, tournament.lobbyDeadlineAt, tournament.participation.canLaunch]);
  const statusCopy = (() => {
    if (isLaunching || (tournament.participation.state === 'in_match' && tournament.participation.activeMatchId)) {
      return {
        title: 'Opening your tournament board.',
        body: 'The field is sealed and your round one match is being resumed now.',
      };
    }

    if (tournament.participation.canLaunch) {
      return {
        title: 'The lobby is full. Opening matches now.',
        body: 'Pairings are locked. Every confirmed player is being sent to round one.',
      };
    }

    if (seatsRemaining > 0) {
      return {
        title: 'Waiting for the lobby to fill.',
        body: `${seatsRemaining} more ${seatsRemaining === 1 ? 'seat' : 'seats'} must be confirmed before the tournament starts.`,
      };
    }

    return {
      title: 'The field is full. Seeding opening matches.',
      body: 'The bracket is being finalized and the opening boards will unlock automatically.',
    };
  })();

  useEffect(() => {
    setCardIndex(0);
    setShuffleSeed(0);

    const interval = setInterval(() => {
      setCardIndex((current) => {
        const next = current + 1;
        if (next >= cards.length) {
          setShuffleSeed((value) => value + 1);
          return 0;
        }

        return next;
      });
    }, CARD_DURATION_MS);

    return () => {
      clearInterval(interval);
    };
  }, [cards.length]);

  useEffect(() => {
    if (!tournament.lobbyDeadlineAt || tournament.participation.canLaunch || isLaunching) {
      return;
    }

    const interval = setInterval(() => {
      setNowMs(Date.now());
    }, 250);

    return () => {
      clearInterval(interval);
    };
  }, [isLaunching, tournament.lobbyDeadlineAt, tournament.participation.canLaunch]);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') {
      return;
    }

    const htmlStyle = document.documentElement.style;
    const bodyStyle = document.body.style;
    const previousHtmlOverflow = htmlStyle.overflow;
    const previousHtmlOverscrollBehavior = htmlStyle.overscrollBehavior;
    const previousHtmlTouchAction = htmlStyle.touchAction;
    const previousBodyOverflow = bodyStyle.overflow;
    const previousBodyOverscrollBehavior = bodyStyle.overscrollBehavior;
    const previousBodyTouchAction = bodyStyle.touchAction;

    htmlStyle.overflow = 'hidden';
    htmlStyle.overscrollBehavior = 'none';
    htmlStyle.touchAction = 'none';
    bodyStyle.overflow = 'hidden';
    bodyStyle.overscrollBehavior = 'none';
    bodyStyle.touchAction = 'none';

    return () => {
      htmlStyle.overflow = previousHtmlOverflow;
      htmlStyle.overscrollBehavior = previousHtmlOverscrollBehavior;
      htmlStyle.touchAction = previousHtmlTouchAction;
      bodyStyle.overflow = previousBodyOverflow;
      bodyStyle.overscrollBehavior = previousBodyOverscrollBehavior;
      bodyStyle.touchAction = previousBodyTouchAction;
    };
  }, []);

  return (
    <View testID="tournament-start-waiting-room" style={styles.screen}>
      <Image
        source={STONE_SLAB_BACKGROUND}
        resizeMode="cover"
        blurRadius={Platform.OS === 'web' ? 8 : 18}
        style={styles.backgroundImage}
      />
      <View pointerEvents="none" style={styles.backdropShade} />
      <View pointerEvents="none" style={styles.backdropGlow} />
      <View pointerEvents="none" style={styles.backdropFrame} />

      <ScrollView
        testID="tournament-start-waiting-room-scroll"
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          isCompactViewport && styles.scrollContentCompact,
          isDesktopViewport && styles.scrollContentDesktop,
          isTightDesktopViewport && styles.scrollContentDesktopTight,
          isWideViewport && styles.scrollContentWide,
          { height },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        bounces={false}
        scrollEnabled={false}
      >
        <View
          style={[
            styles.heroPanel,
            isCompactViewport && styles.heroPanelCompact,
            isVeryShortViewport && styles.heroPanelVeryShort,
            isDesktopViewport && styles.heroPanelDesktop,
            isTightDesktopViewport && styles.heroPanelDesktopTight,
            isWideViewport && styles.heroPanelWide,
          ]}
        >
          <Text style={styles.eyebrow}>Tournament Waiting Room</Text>
          <Text
            style={[
              styles.title,
              isCompactViewport && styles.titleCompact,
              isDesktopViewport && styles.titleDesktop,
              isWideViewport && styles.titleWide,
            ]}
          >
            {tournament.name}
          </Text>
          <Text
            style={[
              styles.subtitle,
              isCompactViewport && styles.subtitleCompact,
              isDesktopViewport && styles.subtitleDesktop,
            ]}
          >
            Your seat is confirmed. Stay here while the royal court fills the bracket and opens the first round.
          </Text>

          <View style={styles.pillRow}>
            <View style={styles.pill}>
              <Text style={styles.pillText}>Lobby {entrantsLabel}</Text>
            </View>
            <View style={styles.pill}>
              <Text style={styles.pillText}>Round {currentRound}</Text>
            </View>
            {countdownLabel ? (
              <View style={[styles.pill, styles.pillCountdown]}>
                <Text style={[styles.pillText, styles.pillCountdownText]}>Wait {countdownLabel}</Text>
              </View>
            ) : null}
            <View style={[styles.pill, tournament.participation.canLaunch || isLaunching ? styles.pillReady : null]}>
              <Text style={[styles.pillText, tournament.participation.canLaunch || isLaunching ? styles.pillReadyText : null]}>
                {isLaunching ? 'Launching' : tournament.participation.canLaunch ? 'Ready' : 'Waiting'}
              </Text>
            </View>
          </View>

          <View style={[styles.contentGrid, useSplitLayout && styles.contentGridWide]}>
            <View style={[styles.infoColumn, useSplitLayout && styles.infoColumnWide]}>
              <View style={styles.statusPanel}>
                <Text style={[styles.statusTitle, isCompactViewport && styles.statusTitleCompact]}>{statusCopy.title}</Text>
                <Text style={[styles.statusBody, isCompactViewport && styles.helperTextCompact]}>{statusCopy.body}</Text>
                {errorMessage ? (
                  <Text style={[styles.errorText, isCompactViewport && styles.helperTextCompact]}>{errorMessage}</Text>
                ) : null}
              </View>

              {countdownLabel ? (
                <View style={styles.countdownPanel}>
                  <Text style={styles.countdownLabel}>Tournament Wait Time</Text>
                  <Text style={[styles.countdownValue, isCompactViewport && styles.countdownValueCompact]}>
                    {countdownLabel}
                  </Text>
                  <Text style={[styles.countdownBody, isCompactViewport && styles.helperTextCompact]}>
                    Seats stay locked while the clock runs. When the wait reaches zero, the bracket fills and your first
                    board opens automatically.
                  </Text>
                </View>
              ) : (
                <View style={styles.countdownPanel}>
                  <Text style={styles.countdownLabel}>Hands-Free Transition</Text>
                  <Text style={[styles.countdownValue, styles.countdownValueReady, isCompactViewport && styles.countdownValueCompact]}>
                    {isLaunching ? 'Opening Board' : 'Stand By'}
                  </Text>
                  <Text style={[styles.countdownBody, isCompactViewport && styles.helperTextCompact]}>
                    Your seat is locked. Stay on this screen and the match will take over as soon as pairings are live.
                  </Text>
                </View>
              )}

              <Text style={[styles.rotationNote, isCompactViewport && styles.helperTextCompact]}>
                Stay seated here. There is nothing to refresh or confirm once your tournament run is in motion.
              </Text>
            </View>

            <View
              style={[
                styles.cardDeckWrap,
                isCompactViewport && styles.cardDeckWrapCompact,
                isDesktopViewport && styles.cardDeckWrapDesktop,
                useSplitLayout && styles.cardDeckWrapWide,
              ]}
            >
              <View style={styles.cardShadow} />
              <View style={[styles.cardGhost, styles.cardGhostRear]} />
              <View style={[styles.cardGhost, styles.cardGhostFront]} />
              <View
                style={[
                  styles.card,
                  isCompactViewport && styles.cardCompact,
                  isDesktopViewport && styles.cardDesktop,
                  useSplitLayout && styles.cardWide,
                  { borderColor: `${activeCard.accent}66` },
                ]}
              >
                <Text style={[styles.cardEyebrow, { color: activeCard.accent }]}>{activeCard.eyebrow}</Text>
                <Text style={[styles.cardTitle, isCompactViewport && styles.cardTitleCompact]}>{activeCard.title}</Text>
                <Text style={[styles.cardBody, isCompactViewport && styles.cardBodyCompact]}>{activeCard.body}</Text>
              </View>
            </View>
          </View>

          <View style={styles.cardIndicatorRow}>
            {cards.map((card, index) => (
              <View
                key={card.key}
                style={[
                  styles.cardIndicator,
                  index === cardIndex ? styles.cardIndicatorActive : null,
                ]}
              />
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#070B10',
    overflow: 'hidden',
  },
  backgroundImage: {
    ...StyleSheet.absoluteFillObject,
    transform: [{ scale: 1.08 }],
    opacity: 0.82,
  },
  backdropShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(7, 11, 17, 0.72)',
  },
  backdropGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '46%',
    backgroundColor: 'rgba(100, 137, 170, 0.18)',
  },
  backdropFrame: {
    position: 'absolute',
    top: 14,
    right: 14,
    bottom: 14,
    left: 14,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: 'rgba(246, 214, 151, 0.14)',
  },
  scrollView: {
    flex: 1,
    overflow: 'hidden',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: urTheme.spacing.md,
    paddingVertical: urTheme.spacing.xl,
  },
  scrollContentCompact: {
    justifyContent: 'flex-start',
  },
  scrollContentDesktop: {
    paddingHorizontal: urTheme.spacing.lg,
    paddingVertical: urTheme.spacing.lg,
  },
  scrollContentDesktopTight: {
    paddingVertical: urTheme.spacing.md,
  },
  scrollContentWide: {
    paddingHorizontal: urTheme.spacing.xl,
  },
  heroPanel: {
    width: '100%',
    maxWidth: 980,
    alignSelf: 'center',
    alignItems: 'center',
    gap: urTheme.spacing.md,
    borderRadius: 32,
    borderWidth: 1.2,
    borderColor: 'rgba(217, 164, 65, 0.62)',
    backgroundColor: 'rgba(9, 13, 20, 0.6)',
    paddingHorizontal: urTheme.spacing.lg,
    paddingVertical: urTheme.spacing.xl,
    ...boxShadow({
      color: '#000',
      opacity: 0.36,
      offset: { width: 0, height: 14 },
      blurRadius: 24,
      elevation: 12,
    }),
  },
  heroPanelCompact: {
    gap: urTheme.spacing.sm,
    paddingHorizontal: urTheme.spacing.md,
    paddingVertical: urTheme.spacing.lg,
  },
  heroPanelVeryShort: {
    paddingVertical: urTheme.spacing.md,
  },
  heroPanelDesktop: {
    maxWidth: 1120,
    gap: urTheme.spacing.sm,
    paddingHorizontal: urTheme.spacing.xl,
    paddingVertical: urTheme.spacing.lg,
  },
  heroPanelDesktopTight: {
    paddingVertical: urTheme.spacing.md + 2,
  },
  heroPanelWide: {
    maxWidth: 1140,
  },
  eyebrow: {
    ...urTypography.label,
    color: '#D5E9FF',
    fontSize: 11,
    textAlign: 'center',
  },
  title: {
    ...urTypography.title,
    color: '#F7E9CE',
    fontSize: 36,
    lineHeight: 42,
    textAlign: 'center',
  },
  titleCompact: {
    fontSize: 30,
    lineHeight: 36,
  },
  titleDesktop: {
    fontSize: 38,
    lineHeight: 44,
  },
  titleWide: {
    fontSize: 40,
    lineHeight: 46,
  },
  subtitle: {
    color: 'rgba(239, 226, 202, 0.84)',
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    maxWidth: 700,
  },
  subtitleCompact: {
    fontSize: 14,
    lineHeight: 20,
  },
  subtitleDesktop: {
    maxWidth: 760,
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: urTheme.spacing.xs,
  },
  pill: {
    borderRadius: urTheme.radii.pill,
    borderWidth: 1,
    borderColor: 'rgba(177, 206, 242, 0.22)',
    backgroundColor: 'rgba(9, 18, 31, 0.72)',
    paddingHorizontal: urTheme.spacing.sm + 2,
    paddingVertical: 6,
  },
  pillReady: {
    backgroundColor: 'rgba(181, 128, 38, 0.24)',
    borderColor: 'rgba(246, 214, 151, 0.3)',
  },
  pillCountdown: {
    backgroundColor: 'rgba(39, 61, 96, 0.5)',
    borderColor: 'rgba(130, 182, 255, 0.32)',
  },
  pillText: {
    ...urTypography.label,
    color: '#D6EAFF',
    fontSize: 10,
  },
  pillCountdownText: {
    color: '#D8EBFF',
  },
  pillReadyText: {
    color: '#F6E2AD',
  },
  contentGrid: {
    width: '100%',
    gap: urTheme.spacing.md,
  },
  contentGridWide: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  infoColumn: {
    width: '100%',
    gap: urTheme.spacing.sm,
  },
  infoColumnWide: {
    flex: 0.88,
    maxWidth: 340,
    justifyContent: 'center',
  },
  statusPanel: {
    width: '100%',
    alignItems: 'flex-start',
    gap: urTheme.spacing.xs,
    borderRadius: urTheme.radii.lg,
    borderWidth: 1,
    borderColor: 'rgba(247, 229, 203, 0.12)',
    backgroundColor: 'rgba(5, 9, 15, 0.46)',
    paddingHorizontal: urTheme.spacing.md,
    paddingVertical: urTheme.spacing.md,
  },
  statusTitle: {
    ...urTypography.subtitle,
    color: '#F8ECD6',
    fontSize: 21,
    lineHeight: 27,
    textAlign: 'left',
  },
  statusTitleCompact: {
    fontSize: 18,
    lineHeight: 24,
  },
  statusBody: {
    color: 'rgba(215, 231, 251, 0.84)',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'left',
  },
  helperTextCompact: {
    fontSize: 12,
    lineHeight: 17,
  },
  errorText: {
    color: '#F6AAA2',
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'left',
  },
  countdownPanel: {
    width: '100%',
    gap: urTheme.spacing.xs,
    borderRadius: urTheme.radii.lg,
    borderWidth: 1,
    borderColor: 'rgba(130, 182, 255, 0.18)',
    backgroundColor: 'rgba(10, 18, 29, 0.62)',
    paddingHorizontal: urTheme.spacing.md,
    paddingVertical: urTheme.spacing.md,
  },
  countdownLabel: {
    ...urTypography.label,
    color: '#BFDFFF',
    fontSize: 11,
  },
  countdownValue: {
    ...urTypography.title,
    color: '#F7E9CE',
    fontSize: 30,
    lineHeight: 36,
  },
  countdownValueCompact: {
    fontSize: 26,
    lineHeight: 32,
  },
  countdownValueReady: {
    color: '#F0D79A',
  },
  countdownBody: {
    color: 'rgba(215, 231, 251, 0.82)',
    fontSize: 13,
    lineHeight: 19,
  },
  cardDeckWrap: {
    width: '100%',
    maxWidth: 640,
    minHeight: 320,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardDeckWrapCompact: {
    minHeight: 260,
  },
  cardDeckWrapDesktop: {
    flex: 1,
    minHeight: 292,
  },
  cardDeckWrapWide: {
    flex: 1,
    minHeight: 320,
  },
  cardShadow: {
    position: 'absolute',
    bottom: 22,
    width: '74%',
    height: 26,
    borderRadius: 999,
    backgroundColor: 'rgba(0, 0, 0, 0.34)',
    transform: [{ scaleX: 1.02 }],
  },
  cardGhost: {
    position: 'absolute',
    width: '92%',
    maxWidth: 560,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(247, 229, 203, 0.08)',
    backgroundColor: 'rgba(8, 13, 22, 0.38)',
  },
  cardGhostRear: {
    height: 242,
    transform: [{ rotate: '-5deg' }, { translateY: 10 }],
  },
  cardGhostFront: {
    height: 252,
    transform: [{ rotate: '4deg' }, { translateY: 4 }],
  },
  card: {
    width: '100%',
    maxWidth: 540,
    minHeight: 268,
    borderRadius: 30,
    borderWidth: 1.4,
    backgroundColor: 'rgba(12, 17, 26, 0.94)',
    paddingHorizontal: urTheme.spacing.lg,
    paddingVertical: urTheme.spacing.lg,
    justifyContent: 'center',
    ...boxShadow({
      color: '#000',
      opacity: 0.34,
      offset: { width: 0, height: 12 },
      blurRadius: 20,
      elevation: 11,
    }),
  },
  cardCompact: {
    minHeight: 224,
    borderRadius: 24,
    paddingHorizontal: urTheme.spacing.md,
    paddingVertical: urTheme.spacing.md,
  },
  cardDesktop: {
    minHeight: 236,
    paddingHorizontal: urTheme.spacing.lg,
    paddingVertical: urTheme.spacing.md + 2,
  },
  cardWide: {
    maxWidth: 560,
  },
  cardEyebrow: {
    ...urTypography.label,
    fontSize: 11,
    marginBottom: urTheme.spacing.sm,
  },
  cardTitle: {
    ...urTypography.title,
    color: '#F7E9CE',
    fontSize: 30,
    lineHeight: 35,
    marginBottom: urTheme.spacing.sm,
  },
  cardTitleCompact: {
    fontSize: 26,
    lineHeight: 31,
  },
  cardBody: {
    color: 'rgba(240, 229, 209, 0.86)',
    fontSize: 15,
    lineHeight: 23,
  },
  cardBodyCompact: {
    fontSize: 14,
    lineHeight: 21,
  },
  cardIndicatorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    maxWidth: 540,
  },
  cardIndicator: {
    width: 8,
    height: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(216, 232, 251, 0.22)',
  },
  cardIndicatorActive: {
    width: 26,
    backgroundColor: '#F0C965',
  },
  rotationNote: {
    color: 'rgba(214, 228, 246, 0.72)',
    fontSize: 12,
    lineHeight: 17,
    textAlign: 'left',
  },
});
