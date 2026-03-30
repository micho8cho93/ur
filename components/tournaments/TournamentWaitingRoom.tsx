import { Button } from '@/components/ui/Button';
import { boxShadow } from '@/constants/styleEffects';
import { urTheme, urTypography } from '@/constants/urTheme';
import type { TournamentAdvanceFlowPhase } from '@/src/tournaments/useTournamentAdvanceFlow';
import type { PublicTournamentStanding } from '@/src/tournaments/types';
import type { TournamentMatchRewardSummaryPayload } from '@/shared/urMatchProtocol';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Image, Platform, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

const STONE_SLAB_BACKGROUND = require('../../assets/images/ur_bg.png');

type TournamentWaitingRoomProps = {
  visible: boolean;
  phase: TournamentAdvanceFlowPhase;
  tournamentName: string;
  derivedRound: number | null;
  statusText: string;
  subtleStatusText: string | null;
  retryMessage: string | null;
  standings: PublicTournamentStanding[];
  currentStanding: PublicTournamentStanding | null;
  highlightOwnerId: string | null;
  finalPlacement: number | null;
  isChampion: boolean;
  rewardSummary?: TournamentMatchRewardSummaryPayload | null;
  onReturnToMainPage: () => void;
  onLaunchNextMatch?: () => Promise<void> | void;
  children?: React.ReactNode;
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

const buildCards = (
  rewardSummary: TournamentMatchRewardSummaryPayload | null,
  showExitActions: boolean,
  isChampion: boolean,
  finalPlacement: number | null,
): WaitingRoomCard[] => {
  if (showExitActions) {
    return [
      {
        key: 'final-result',
        eyebrow: isChampion ? 'Tournament Won' : 'Tournament Complete',
        title: isChampion ? 'Champion' : 'Final result locked',
        body: isChampion
          ? 'The crown is yours and the final standings are sealed.'
          : typeof finalPlacement === 'number'
            ? `Your tournament run is complete at final place #${finalPlacement}.`
            : 'Your tournament run is complete and the standings are sealed.',
        accent: isChampion ? '#F4D189' : '#A7D3FF',
      },
      ...ROYAL_GAME_OF_UR_FACTS.slice(0, 2).map((fact, index) => ({
        key: `ur-fact-${index}`,
        eyebrow: 'Royal Game of Ur',
        title: 'Archive Note',
        body: fact,
        accent: '#B7DEFF',
      })),
      ...MESOPOTAMIA_AND_BABYLONIA_FACTS.slice(0, 1).map((fact, index) => ({
        key: `mesopotamia-fact-${index}`,
        eyebrow: 'Mesopotamia & Babylonia',
        title: 'World Note',
        body: fact,
        accent: '#F0C965',
      })),
    ];
  }

  const rewardCards = rewardSummary
    ? [
        {
          key: 'elo',
          eyebrow: 'Elo Locked',
          title: `${rewardSummary.eloDelta >= 0 ? '+' : ''}${rewardSummary.eloDelta}`,
          body: `Rating moved from ${rewardSummary.eloOld} to ${rewardSummary.eloNew}.`,
          accent: '#A7D3FF',
        },
        {
          key: 'xp',
          eyebrow: 'XP Locked',
          title: `${rewardSummary.totalXpDelta >= 0 ? '+' : ''}${rewardSummary.totalXpDelta} XP`,
          body: `Total XP now sits at ${rewardSummary.totalXpNew}.`,
          accent: '#F4D189',
        },
        {
          key: 'challenge',
          eyebrow: 'Challenges Locked',
          title:
            rewardSummary.challengeCompletionCount > 0
              ? `${rewardSummary.challengeCompletionCount} challenge${rewardSummary.challengeCompletionCount === 1 ? '' : 's'} completed`
              : 'No new challenges this round',
          body:
            rewardSummary.challengeXpDelta > 0
              ? `Challenge rewards added +${rewardSummary.challengeXpDelta} XP to your record.`
              : 'Your challenge archive is up to date for this match.',
          accent: '#E7B56A',
        },
      ]
    : [
        {
          key: 'reward-sync',
          eyebrow: 'Bracket Sync',
          title: 'Results still settling',
          body: 'The bracket is confirming every finished board before the next pairing opens.',
          accent: '#A7D3FF',
        },
        {
          key: 'progression-sync',
          eyebrow: 'Reward Sync',
          title: 'XP and Elo are locked',
          body: 'Your account rewards are being finalized while the tournament advances.',
          accent: '#F4D189',
        },
        {
          key: 'challenge-sync',
          eyebrow: 'Challenges',
          title: 'Challenge archive syncing',
          body: 'Completed challenge progress will stay attached to this finished match.',
          accent: '#E7B56A',
        },
      ];

  return [
    ...rewardCards,
    ...ROYAL_GAME_OF_UR_FACTS.slice(0, 2).map((fact, index) => ({
      key: `ur-fact-${index}`,
      eyebrow: 'Royal Game of Ur',
      title: 'Archive Note',
      body: fact,
      accent: '#B7DEFF',
    })),
    ...MESOPOTAMIA_AND_BABYLONIA_FACTS.slice(0, 2).map((fact, index) => ({
      key: `mesopotamia-fact-${index}`,
      eyebrow: 'Mesopotamia & Babylonia',
      title: 'World Note',
      body: fact,
      accent: '#F0C965',
    })),
  ];
};

export const TournamentWaitingRoom: React.FC<TournamentWaitingRoomProps> = ({
  visible,
  phase,
  tournamentName,
  derivedRound,
  statusText,
  subtleStatusText,
  retryMessage,
  currentStanding,
  finalPlacement,
  isChampion,
  rewardSummary = null,
  onReturnToMainPage,
  onLaunchNextMatch,
}) => {
  const { width, height } = useWindowDimensions();
  const isCompactViewport = width < 760 || height < 760;
  const isVeryShortViewport = height < 680;
  const isWideViewport = width >= 1180;
  const showExitActions = phase === 'eliminated' || phase === 'finalized';
  const [cardIndex, setCardIndex] = useState(0);
  const [shuffleSeed, setShuffleSeed] = useState(0);
  const launchTriggeredRef = useRef(false);
  const cards = useMemo(
    () => shuffleCards(buildCards(rewardSummary, showExitActions, isChampion, finalPlacement), shuffleSeed),
    [finalPlacement, isChampion, rewardSummary, showExitActions, shuffleSeed],
  );
  const activeCard = cards[cardIndex] ?? cards[0];
  const readinessLabel = showExitActions
    ? 'Complete'
    : phase === 'launching'
      ? 'Launching'
      : phase === 'ready'
        ? 'Ready'
        : phase === 'retrying'
          ? 'Syncing'
          : 'Waiting';
  const subtitle = showExitActions
    ? isChampion
      ? 'Your tournament run is complete. The royal court has sealed the final standings.'
      : 'Your tournament run is complete. Final standings are now sealed and ready to leave behind.'
    : 'You advanced. Stay here while the royal court settles the bracket and opens your next board.';
  const rotationNote = showExitActions
    ? 'Final standings are locked. Return home whenever you are ready.'
    : phase === 'ready' || phase === 'launching'
      ? 'Stay here. The next board opens automatically on the next archive turn.'
      : 'The archive reshuffles every 15 seconds while the bracket finishes the round.';

  useEffect(() => {
    launchTriggeredRef.current = false;

    if (!visible) {
      return;
    }

    setCardIndex(0);
    setShuffleSeed(0);

    if (showExitActions) {
      return;
    }

    const interval = setInterval(() => {
      if ((phase === 'ready' || phase === 'launching') && onLaunchNextMatch && !launchTriggeredRef.current) {
        launchTriggeredRef.current = true;
        void onLaunchNextMatch();
      }

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
  }, [cards.length, onLaunchNextMatch, phase, showExitActions, visible]);

  useEffect(() => {
    if (phase !== 'ready' && phase !== 'launching') {
      launchTriggeredRef.current = false;
    }
  }, [phase]);

  if (!visible) {
    return null;
  }

  return (
    <View testID="tournament-waiting-room" style={styles.screen}>
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
        testID="tournament-waiting-room-scroll"
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          isCompactViewport && styles.scrollContentCompact,
          isWideViewport && styles.scrollContentWide,
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View
          style={[
            styles.heroPanel,
            isCompactViewport && styles.heroPanelCompact,
            isVeryShortViewport && styles.heroPanelVeryShort,
            isWideViewport && styles.heroPanelWide,
          ]}
        >
          <Text style={styles.eyebrow}>
            {showExitActions ? (isChampion ? 'Tournament Won' : 'Tournament Complete') : 'Tournament Waiting Room'}
          </Text>
          <Text style={[styles.title, isCompactViewport && styles.titleCompact, isWideViewport && styles.titleWide]}>
            {tournamentName}
          </Text>
          <Text style={[styles.subtitle, isCompactViewport && styles.subtitleCompact]}>{subtitle}</Text>

          <View style={styles.pillRow}>
            {typeof derivedRound === 'number' ? (
              <View style={styles.pill}>
                <Text style={styles.pillText}>Round {derivedRound}</Text>
              </View>
            ) : null}
            {typeof currentStanding?.rank === 'number' ? (
              <View style={styles.pill}>
                <Text style={styles.pillText}>Rank #{currentStanding.rank}</Text>
              </View>
            ) : null}
            <View
              style={[
                styles.pill,
                phase === 'ready' || phase === 'launching' || showExitActions ? styles.pillReady : null,
              ]}
            >
              <Text
                style={[
                  styles.pillText,
                  phase === 'ready' || phase === 'launching' || showExitActions ? styles.pillReadyText : null,
                ]}
              >
                {readinessLabel}
              </Text>
            </View>
          </View>

          <View style={styles.statusPanel}>
            <Text style={[styles.statusTitle, isCompactViewport && styles.statusTitleCompact]}>{statusText}</Text>
            {subtleStatusText ? (
              <Text style={[styles.statusBody, isCompactViewport && styles.helperTextCompact]}>{subtleStatusText}</Text>
            ) : null}
            {retryMessage ? (
              <Text style={[styles.retryText, isCompactViewport && styles.helperTextCompact]}>{retryMessage}</Text>
            ) : null}
            {phase === 'finalized' && typeof finalPlacement === 'number' ? (
              <Text style={styles.finalPlacementText}>
                {isChampion ? 'Final placement: Champion' : `Final placement: #${finalPlacement}`}
              </Text>
            ) : null}
          </View>

          <View
            style={[
              styles.cardDeckWrap,
              isCompactViewport && styles.cardDeckWrapCompact,
              isWideViewport && styles.cardDeckWrapWide,
            ]}
          >
            <View style={styles.cardShadow} />
            <View style={[styles.cardGhost, styles.cardGhostRear]} />
            <View style={[styles.cardGhost, styles.cardGhostFront]} />
            <View
              style={[
                styles.card,
                isCompactViewport && styles.cardCompact,
                isWideViewport && styles.cardWide,
                { borderColor: `${activeCard.accent}66` },
              ]}
            >
              <Text style={[styles.cardEyebrow, { color: activeCard.accent }]}>{activeCard.eyebrow}</Text>
              <Text style={[styles.cardTitle, isCompactViewport && styles.cardTitleCompact]}>{activeCard.title}</Text>
              <Text style={[styles.cardBody, isCompactViewport && styles.cardBodyCompact]}>{activeCard.body}</Text>
            </View>
          </View>

          <View style={styles.cardIndicatorRow}>
            {cards.map((card, index) => (
              <View
                key={card.key}
                style={[styles.cardIndicator, index === cardIndex ? styles.cardIndicatorActive : null]}
              />
            ))}
          </View>

          <Text style={[styles.rotationNote, isCompactViewport && styles.helperTextCompact]}>{rotationNote}</Text>

          {showExitActions ? (
            <View style={styles.actionRow}>
              <Button title="Return to Home Page" onPress={onReturnToMainPage} />
            </View>
          ) : null}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#070B10',
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
  heroPanelWide: {
    maxWidth: 1040,
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
  titleWide: {
    fontSize: 40,
    lineHeight: 46,
  },
  subtitle: {
    color: 'rgba(239, 226, 202, 0.84)',
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    maxWidth: 720,
  },
  subtitleCompact: {
    fontSize: 14,
    lineHeight: 20,
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
  pillText: {
    ...urTypography.label,
    color: '#D6EAFF',
    fontSize: 10,
  },
  pillReadyText: {
    color: '#F6E2AD',
  },
  statusPanel: {
    width: '100%',
    maxWidth: 720,
    alignItems: 'center',
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
    textAlign: 'center',
  },
  statusTitleCompact: {
    fontSize: 18,
    lineHeight: 24,
  },
  statusBody: {
    color: 'rgba(215, 231, 251, 0.84)',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  retryText: {
    color: '#F0D79A',
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
  },
  helperTextCompact: {
    fontSize: 12,
    lineHeight: 17,
  },
  finalPlacementText: {
    ...urTypography.label,
    color: '#F0C965',
    fontSize: 11,
    marginTop: 2,
  },
  cardDeckWrap: {
    width: '100%',
    maxWidth: 620,
    minHeight: 320,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: urTheme.spacing.xs,
  },
  cardDeckWrapCompact: {
    minHeight: 260,
  },
  cardDeckWrapWide: {
    minHeight: 348,
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
    borderRadius: 28,
    borderWidth: 1.5,
    backgroundColor: 'rgba(11, 16, 24, 0.92)',
    paddingHorizontal: urTheme.spacing.xl,
    paddingVertical: urTheme.spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: urTheme.spacing.sm,
    ...boxShadow({
      color: '#000',
      opacity: 0.32,
      offset: { width: 0, height: 16 },
      blurRadius: 24,
      elevation: 14,
    }),
  },
  cardCompact: {
    minHeight: 224,
    borderRadius: 24,
    paddingHorizontal: urTheme.spacing.lg,
    paddingVertical: urTheme.spacing.lg,
  },
  cardWide: {
    maxWidth: 560,
  },
  cardEyebrow: {
    ...urTypography.label,
    fontSize: 11,
    textAlign: 'center',
  },
  cardTitle: {
    ...urTypography.title,
    color: '#F8ECD6',
    fontSize: 34,
    lineHeight: 40,
    textAlign: 'center',
  },
  cardTitleCompact: {
    fontSize: 30,
    lineHeight: 36,
  },
  cardBody: {
    color: 'rgba(244, 236, 220, 0.86)',
    fontSize: 16,
    lineHeight: 23,
    textAlign: 'center',
  },
  cardBodyCompact: {
    fontSize: 14,
    lineHeight: 20,
  },
  cardIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 10,
  },
  cardIndicator: {
    width: 8,
    height: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(214, 234, 255, 0.22)',
  },
  cardIndicatorActive: {
    width: 22,
    backgroundColor: '#F0C965',
  },
  rotationNote: {
    color: 'rgba(216, 232, 251, 0.72)',
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    maxWidth: 620,
  },
  actionRow: {
    width: '100%',
    maxWidth: 420,
  },
});
