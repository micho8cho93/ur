import { Button } from '@/components/ui/Button';
import { boxShadow } from '@/constants/styleEffects';
import { urTheme, urTextures, urTypography } from '@/constants/urTheme';
import type { TournamentAdvanceFlowPhase } from '@/src/tournaments/useTournamentAdvanceFlow';
import type { PublicTournamentStanding } from '@/src/tournaments/types';
import type { TournamentMatchRewardSummaryPayload } from '@/shared/urMatchProtocol';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Image, Platform, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

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
  'Archaeologists uncovered one of the best-known Ur boards in the Royal Tombs of Ur.',
  'Rosette tiles are safe spaces and often grant another roll in surviving rule sets.',
  'Cuneiform tablets helped historians reconstruct playable Royal Game of Ur rules.',
  'The game flourished in Mesopotamia about 4,500 years ago and later spread widely.',
] as const;

const MESOPOTAMIA_FACTS = [
  'Ur stood near the Euphrates and was one of the great Sumerian cities of the ancient world.',
  'Mesopotamian scribes recorded trade, law, and ritual on clay tablets in cuneiform.',
  'Temple economies and long-distance trade helped Mesopotamian cities grow into major powers.',
  'Mesopotamia is often called the cradle of cities because of its early urban civilizations.',
] as const;

const buildCards = (
  rewardSummary: TournamentMatchRewardSummaryPayload | null,
  rotationCycle: number,
  showExitActions: boolean,
  isChampion: boolean,
  finalPlacement: number | null,
): WaitingRoomCard[] => {
  const urFact = ROYAL_GAME_OF_UR_FACTS[rotationCycle % ROYAL_GAME_OF_UR_FACTS.length];
  const mesopotamiaFact = MESOPOTAMIA_FACTS[rotationCycle % MESOPOTAMIA_FACTS.length];

  if (showExitActions) {
    return [
      {
        key: 'final',
        eyebrow: isChampion ? 'Tournament Won' : 'Tournament Complete',
        title: isChampion ? 'Champion' : 'Result locked',
        body: isChampion
          ? 'You finished first and the tournament is now complete.'
          : typeof finalPlacement === 'number'
            ? `Your final standing of #${finalPlacement} has been recorded.`
            : 'Your final standing has been recorded.',
        accent: isChampion ? '#F0C965' : '#A7D3FF',
      },
      {
        key: 'ur',
        eyebrow: 'Royal Game of Ur',
        title: 'Archive Note',
        body: urFact,
        accent: '#C5E4FF',
      },
      {
        key: 'mesopotamia',
        eyebrow: 'Mesopotamia',
        title: 'World Note',
        body: mesopotamiaFact,
        accent: '#F1C975',
      },
    ];
  }

  if (!rewardSummary) {
    return [
      {
        key: 'elo',
        eyebrow: 'Reward Sync',
        title: 'Elo update locked',
        body: 'Your post-match rating is being confirmed for the next round.',
        accent: '#A7D3FF',
      },
      {
        key: 'xp',
        eyebrow: 'Reward Sync',
        title: 'XP update locked',
        body: 'Your progression total is being reconciled before the next board opens.',
        accent: '#F6D697',
      },
      {
        key: 'challenge',
        eyebrow: 'Reward Sync',
        title: 'Challenge archive syncing',
        body: 'Challenge completions are being finalized while the bracket advances.',
        accent: '#E7B56A',
      },
      {
        key: 'ur',
        eyebrow: 'Royal Game of Ur',
        title: 'Archive Note',
        body: urFact,
        accent: '#C5E4FF',
      },
      {
        key: 'mesopotamia',
        eyebrow: 'Mesopotamia',
        title: 'World Note',
        body: mesopotamiaFact,
        accent: '#F1C975',
      },
    ];
  }

  const eloDeltaLabel = `${rewardSummary.eloDelta >= 0 ? '+' : ''}${rewardSummary.eloDelta}`;
  const xpDeltaLabel = `${rewardSummary.totalXpDelta >= 0 ? '+' : ''}${rewardSummary.totalXpDelta} XP`;
  const challengeTitle =
    rewardSummary.challengeCompletionCount > 0
      ? `${rewardSummary.challengeCompletionCount} challenge${rewardSummary.challengeCompletionCount === 1 ? '' : 's'} completed`
      : 'No new challenges this round';
  const challengeBody =
    rewardSummary.challengeXpDelta > 0
      ? `Challenge rewards added +${rewardSummary.challengeXpDelta} XP to your record.`
      : 'Your challenge archive is up to date for this match.';

  return [
    {
      key: 'elo',
      eyebrow: 'Elo Locked',
      title: eloDeltaLabel,
      body: `Rating moved from ${rewardSummary.eloOld} to ${rewardSummary.eloNew}.`,
      accent: '#A7D3FF',
    },
    {
      key: 'xp',
      eyebrow: 'XP Locked',
      title: xpDeltaLabel,
      body: `Total XP now sits at ${rewardSummary.totalXpNew}.`,
      accent: '#F6D697',
    },
    {
      key: 'challenge',
      eyebrow: 'Challenges Locked',
      title: challengeTitle,
      body: challengeBody,
      accent: '#E7B56A',
    },
    {
      key: 'ur',
      eyebrow: 'Royal Game of Ur',
      title: 'Archive Note',
      body: urFact,
      accent: '#C5E4FF',
    },
    {
      key: 'mesopotamia',
      eyebrow: 'Mesopotamia',
      title: 'World Note',
      body: mesopotamiaFact,
      accent: '#F1C975',
    },
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
  const isMobileWeb = Platform.OS === 'web' && width < 760;
  const showExitActions = phase === 'eliminated' || phase === 'finalized';
  const [cardIndex, setCardIndex] = useState(0);
  const [rotationCycle, setRotationCycle] = useState(0);
  const launchTriggeredRef = useRef(false);
  const cards = useMemo(
    () => buildCards(rewardSummary, rotationCycle, showExitActions, isChampion, finalPlacement),
    [rewardSummary, rotationCycle, showExitActions, isChampion, finalPlacement],
  );
  const activeCard = cards[cardIndex] ?? cards[0];

  useEffect(() => {
    launchTriggeredRef.current = false;

    if (!visible) {
      return;
    }

    setCardIndex(0);
    setRotationCycle(0);

    if (showExitActions) {
      return;
    }

    const interval = setInterval(() => {
      if (phase === 'ready' && onLaunchNextMatch && !launchTriggeredRef.current) {
        launchTriggeredRef.current = true;
        void onLaunchNextMatch();
      }

      setCardIndex((current) => {
        const next = (current + 1) % cards.length;
        if (next === 0) {
          setRotationCycle((cycle) => cycle + 1);
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
    <View testID="tournament-waiting-room" style={styles.backdrop}>
      <Image source={urTextures.woodDark} resizeMode="repeat" style={styles.texture} />
      <Image source={urTextures.goldInlay} resizeMode="repeat" style={styles.inlayTexture} />
      <View style={styles.overlay} />
      <View style={[styles.innerFrame, isCompactViewport && styles.innerFrameCompact]} />

      <ScrollView
        testID="tournament-waiting-room-scroll"
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          isCompactViewport ? styles.scrollContentCompact : styles.scrollContentCentered,
        ]}
        alwaysBounceVertical={false}
        bounces={false}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={[
            styles.chrome,
            isCompactViewport && styles.chromeCompact,
            isVeryShortViewport && styles.chromeVeryShort,
            isMobileWeb && styles.chromeMobileWeb,
          ]}
        >
          <View style={styles.headerBlock}>
            <Text style={styles.eyebrow}>
              {showExitActions ? (isChampion ? 'Tournament Won' : 'Tournament Complete') : 'Tournament Waiting Room'}
            </Text>
            <Text numberOfLines={isCompactViewport ? 3 : 2} style={[styles.title, isCompactViewport && styles.titleCompact]}>
              {tournamentName}
            </Text>
            <Text style={[styles.bodyCopy, isCompactViewport && styles.bodyCopyCompact]}>
              {showExitActions
                ? isChampion
                  ? 'You won the tournament. Final standings are locked and this run is complete.'
                  : 'Your tournament run is over and the final standings are now locked.'
                : 'The next match will start automatically as soon as the bracket is ready.'}
            </Text>
          </View>

          <View style={styles.pillRow}>
            {typeof derivedRound === 'number' ? (
              <View style={styles.infoPill}>
                <Text style={styles.infoPillText}>Round {derivedRound}</Text>
              </View>
            ) : null}
            {typeof currentStanding?.rank === 'number' ? (
              <View style={styles.infoPill}>
                <Text style={styles.infoPillText}>Rank #{currentStanding.rank}</Text>
              </View>
            ) : null}
            {phase === 'ready' || phase === 'launching' ? (
              <View style={[styles.infoPill, styles.matchFoundPill]}>
                <Text style={[styles.infoPillText, styles.matchFoundPillText]}>
                  {phase === 'launching' ? 'Joining match' : 'Match found'}
                </Text>
              </View>
            ) : null}
          </View>

          <View style={styles.statusBlock}>
            <Text style={[styles.statusText, isCompactViewport && styles.statusTextCompact]}>{statusText}</Text>
            {subtleStatusText ? <Text style={[styles.subtleStatusText, isCompactViewport && styles.helperTextCompact]}>{subtleStatusText}</Text> : null}
            {retryMessage ? <Text style={[styles.retryText, isCompactViewport && styles.helperTextCompact]}>{retryMessage}</Text> : null}
            {phase === 'finalized' && typeof finalPlacement === 'number' ? (
              <Text style={styles.finalPlacementText}>
                {isChampion ? 'Final placement: Champion' : `Final placement: #${finalPlacement}`}
              </Text>
            ) : null}
          </View>

          <View style={styles.cardWrap}>
            <View style={[styles.card, isCompactViewport && styles.cardCompact, { borderColor: `${activeCard.accent}4D` }]}>
              <Text style={[styles.cardEyebrow, { color: activeCard.accent }]}>{activeCard.eyebrow}</Text>
              <Text style={[styles.cardTitle, isCompactViewport && styles.cardTitleCompact]}>{activeCard.title}</Text>
              <Text style={[styles.cardBody, isCompactViewport && styles.cardBodyCompact]}>{activeCard.body}</Text>
            </View>
          </View>

          {!showExitActions ? (
            <Text style={[styles.footerCopy, isCompactViewport && styles.helperTextCompact]}>
              Stay here while the rotation advances. If the next board is already ready, launch begins on the next card
              boundary.
            </Text>
          ) : null}

          {showExitActions ? (
            <View style={styles.buttonWrap}>
              <Button title="Return to Home Page" onPress={onReturnToMainPage} />
            </View>
          ) : null}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 20,
    overflow: 'hidden',
    backgroundColor: '#08111C',
  },
  texture: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.16,
  },
  inlayTexture: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.08,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(5, 10, 18, 0.76)',
  },
  innerFrame: {
    position: 'absolute',
    top: 16,
    right: 16,
    bottom: 16,
    left: 16,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(246, 214, 151, 0.16)',
  },
  innerFrameCompact: {
    top: 10,
    right: 10,
    bottom: 10,
    left: 10,
    borderRadius: 20,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  scrollContentCentered: {
    justifyContent: 'center',
  },
  scrollContentCompact: {
    justifyContent: 'flex-start',
  },
  chrome: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: urTheme.spacing.lg,
    paddingVertical: urTheme.spacing.xl,
    gap: urTheme.spacing.md,
  },
  chromeCompact: {
    paddingHorizontal: urTheme.spacing.md,
    paddingVertical: urTheme.spacing.lg,
    gap: urTheme.spacing.sm,
  },
  chromeVeryShort: {
    paddingVertical: urTheme.spacing.md,
  },
  chromeMobileWeb: {
    minHeight: '100%',
  },
  headerBlock: {
    alignItems: 'center',
    gap: urTheme.spacing.xs,
    maxWidth: 720,
  },
  eyebrow: {
    ...urTypography.label,
    color: '#D9ECFF',
    fontSize: 11,
    letterSpacing: 1.1,
  },
  title: {
    ...urTypography.title,
    color: '#F8ECD6',
    fontSize: 32,
    lineHeight: 38,
    textAlign: 'center',
  },
  titleCompact: {
    fontSize: 26,
    lineHeight: 31,
  },
  bodyCopy: {
    color: 'rgba(236, 229, 214, 0.82)',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  bodyCopyCompact: {
    fontSize: 13,
    lineHeight: 18,
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: urTheme.spacing.xs,
  },
  infoPill: {
    borderRadius: urTheme.radii.pill,
    paddingHorizontal: urTheme.spacing.sm,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(163, 205, 255, 0.2)',
    backgroundColor: 'rgba(10, 21, 36, 0.72)',
  },
  infoPillText: {
    ...urTypography.label,
    color: '#DAECFF',
    fontSize: 10,
  },
  matchFoundPill: {
    backgroundColor: 'rgba(181, 128, 38, 0.24)',
    borderColor: 'rgba(246, 214, 151, 0.24)',
  },
  matchFoundPillText: {
    color: '#F9E6BC',
  },
  statusBlock: {
    alignItems: 'center',
    gap: 6,
    maxWidth: 660,
  },
  statusText: {
    ...urTypography.subtitle,
    color: '#F8ECD6',
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '700',
    textAlign: 'center',
  },
  statusTextCompact: {
    fontSize: 17,
    lineHeight: 23,
  },
  subtleStatusText: {
    color: 'rgba(216, 232, 251, 0.82)',
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
  },
  retryText: {
    color: 'rgba(247, 220, 161, 0.9)',
    fontSize: 12,
    lineHeight: 17,
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
  cardWrap: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 1,
  },
  card: {
    width: '100%',
    maxWidth: 560,
    minHeight: 260,
    borderRadius: 28,
    borderWidth: 1.5,
    backgroundColor: 'rgba(9, 16, 26, 0.9)',
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
    minHeight: 200,
    borderRadius: 22,
    paddingHorizontal: urTheme.spacing.lg,
    paddingVertical: urTheme.spacing.lg,
  },
  cardEyebrow: {
    ...urTypography.label,
    fontSize: 11,
    letterSpacing: 1.1,
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
    fontSize: 28,
    lineHeight: 34,
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
  footerCopy: {
    maxWidth: 640,
    color: 'rgba(216, 232, 251, 0.72)',
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
  },
  buttonWrap: {
    width: '100%',
    maxWidth: 420,
    marginTop: urTheme.spacing.sm,
  },
});
