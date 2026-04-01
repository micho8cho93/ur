import { Button } from '@/components/ui/Button';
import { boxShadow } from '@/constants/styleEffects';
import { urTheme, urTypography } from '@/constants/urTheme';
import { TOURNAMENT_READY_LAUNCH_COUNTDOWN_SECONDS } from '@/src/match/transitionPresentation';
import type { TournamentAdvanceFlowPhase } from '@/src/tournaments/useTournamentAdvanceFlow';
import type { PublicTournamentStanding } from '@/src/tournaments/types';
import type { TournamentMatchRewardSummaryPayload } from '@/shared/urMatchProtocol';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Image, Platform, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

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

const CARD_DURATION_MS = 8_000;
const CARD_MOVE_TO_BACK_DURATION_MS = 720;

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
  const isDesktopViewport = Platform.OS === 'web' && width >= 920;
  const isTightDesktopViewport = isDesktopViewport && height <= 820;
  const isWideViewport = width >= 1180;
  const useSplitLayout = isWideViewport || isDesktopViewport;
  const showExitActions = phase === 'eliminated' || phase === 'finalized';
  const [cardIndex, setCardIndex] = useState(0);
  const [readyLaunchCountdownSeconds, setReadyLaunchCountdownSeconds] = useState<number | null>(null);
  const [shuffleSeed, setShuffleSeed] = useState(0);
  const [outgoingCard, setOutgoingCard] = useState<WaitingRoomCard | null>(null);
  const [cardTransitionId, setCardTransitionId] = useState(0);
  const launchTriggeredRef = useRef(false);
  const cardMoveToBackProgress = useRef(new Animated.Value(0)).current;
  const cardIndexRef = useRef(0);
  const shuffleSeedRef = useRef(0);
  const cardsRef = useRef<WaitingRoomCard[]>([]);
  const outgoingCardRef = useRef<WaitingRoomCard | null>(null);
  const visibleRef = useRef(visible);
  const phaseRef = useRef(phase);
  const showExitActionsRef = useRef(showExitActions);
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
    : phase === 'ready'
      ? 'Stay here. The next board opens automatically after a short launch countdown.'
      : phase === 'launching'
        ? 'Stay here. The next board is opening now.'
      : 'The archive cycles every 8 seconds while the bracket finishes the round.';
  const readyLaunchStatusTitle =
    readyLaunchCountdownSeconds === null
      ? null
      : readyLaunchCountdownSeconds > 0
        ? `Next round starts in ${readyLaunchCountdownSeconds}s`
        : 'Opening next round...';
  const readyLaunchStatusBody =
    readyLaunchCountdownSeconds === null
      ? null
      : readyLaunchCountdownSeconds > 0
        ? 'Stay seated here. The next board will launch automatically when the countdown finishes.'
        : 'Your next board is opening automatically now.';
  const detailPanel = showExitActions
    ? {
        label: 'Final Bracket',
        title: isChampion ? 'Champion Confirmed' : typeof finalPlacement === 'number' ? `Place #${finalPlacement}` : 'Run Complete',
        body: 'Your rewards and placement are sealed. Return home whenever you are ready.',
      }
    : typeof currentStanding?.rank === 'number'
      ? {
          label: 'Bracket Position',
          title: `Rank #${currentStanding.rank}`,
          body: 'Stay on this screen while the remaining winners report. The court will open your next board automatically.',
        }
      : {
          label: 'Seamless Handoff',
          title: 'Stay On The Board',
          body: 'Once you enter this room, the court carries your session forward automatically. There is nothing to refresh or confirm between rounds.',
        };

  useEffect(() => {
    cardIndexRef.current = cardIndex;
    shuffleSeedRef.current = shuffleSeed;
    cardsRef.current = cards;
    outgoingCardRef.current = outgoingCard;
    visibleRef.current = visible;
    phaseRef.current = phase;
    showExitActionsRef.current = showExitActions;
  }, [cardIndex, cards, outgoingCard, phase, showExitActions, shuffleSeed, visible]);

  const incomingCardAnimatedStyle = useMemo(
    () => ({
      opacity: outgoingCard
        ? cardMoveToBackProgress.interpolate({
            inputRange: [0, 0.6, 1],
            outputRange: [0.8, 0.94, 1],
          })
        : 1,
      transform: outgoingCard
        ? [
            {
              translateY: cardMoveToBackProgress.interpolate({
                inputRange: [0, 1],
                outputRange: [12, 0],
              }),
            },
            {
              scale: cardMoveToBackProgress.interpolate({
                inputRange: [0, 1],
                outputRange: [0.965, 1],
              }),
            },
            {
              rotate: cardMoveToBackProgress.interpolate({
                inputRange: [0, 1],
                outputRange: ['4deg', '0deg'],
              }),
            },
          ]
        : undefined,
    }),
    [cardMoveToBackProgress, outgoingCard],
  );
  const outgoingCardAnimatedStyle = useMemo(
    () => ({
      opacity: cardMoveToBackProgress.interpolate({
        inputRange: [0, 0.7, 1],
        outputRange: [1, 0.94, 0.72],
      }),
      transform: [
        {
          translateX: cardMoveToBackProgress.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 22],
          }),
        },
        {
          translateY: cardMoveToBackProgress.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 30],
          }),
        },
        {
          scale: cardMoveToBackProgress.interpolate({
            inputRange: [0, 1],
            outputRange: [1, 0.93],
          }),
        },
        {
          rotate: cardMoveToBackProgress.interpolate({
            inputRange: [0, 1],
            outputRange: ['0deg', '8deg'],
          }),
        },
      ],
    }),
    [cardMoveToBackProgress],
  );

  const cycleCard = useCallback(() => {
    if (
      !visibleRef.current ||
      showExitActionsRef.current ||
      phaseRef.current === 'ready' ||
      phaseRef.current === 'launching' ||
      outgoingCardRef.current
    ) {
      return;
    }

    const currentCards = cardsRef.current;
    const currentIndex = cardIndexRef.current;

    if (currentCards.length <= 1) {
      return;
    }

    const currentCard = currentCards[currentIndex] ?? currentCards[0];

    if (!currentCard) {
      return;
    }

    const wrapsToNewDeck = currentIndex + 1 >= currentCards.length;
    const nextIndex = wrapsToNewDeck ? 0 : currentIndex + 1;
    const nextCards = wrapsToNewDeck ? shuffleCards(currentCards, shuffleSeedRef.current + 1) : currentCards;

    outgoingCardRef.current = currentCard;
    cardIndexRef.current = nextIndex;
    cardsRef.current = nextCards;
    setOutgoingCard(currentCard);
    setCardTransitionId((current) => current + 1);
    setCardIndex(nextIndex);

    if (wrapsToNewDeck) {
      shuffleSeedRef.current += 1;
      setShuffleSeed((current) => current + 1);
    }

    cardMoveToBackProgress.stopAnimation();
    cardMoveToBackProgress.setValue(0);

    Animated.timing(cardMoveToBackProgress, {
      toValue: 1,
      duration: CARD_MOVE_TO_BACK_DURATION_MS,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      cardMoveToBackProgress.setValue(0);
      outgoingCardRef.current = null;
      setOutgoingCard(null);
    });
  }, [cardMoveToBackProgress]);

  useEffect(() => {
    launchTriggeredRef.current = false;
    setReadyLaunchCountdownSeconds(null);
    setOutgoingCard(null);
    cardMoveToBackProgress.stopAnimation();
    cardMoveToBackProgress.setValue(0);

    if (!visible) {
      return;
    }

    setCardIndex(0);
    setShuffleSeed(0);

    if (showExitActions) {
      return;
    }
  }, [cardMoveToBackProgress, showExitActions, visible]);

  useEffect(() => {
    if (!visible || showExitActions || phase === 'ready' || phase === 'launching') {
      return;
    }

    const interval = setInterval(() => {
      cycleCard();
    }, CARD_DURATION_MS);

    return () => {
      clearInterval(interval);
    };
  }, [cycleCard, phase, showExitActions, visible]);

  useEffect(() => {
    if (Platform.OS !== 'web' || !visible || typeof document === 'undefined') {
      return;
    }

    const htmlStyle = document.documentElement.style;
    const bodyStyle = document.body.style;
    const previousHtmlOverflow = htmlStyle.overflow;
    const previousBodyOverflow = bodyStyle.overflow;
    const previousBodyOverscrollBehavior = bodyStyle.overscrollBehavior;
    const previousBodyTouchAction = bodyStyle.touchAction;

    htmlStyle.overflow = 'hidden';
    bodyStyle.overflow = 'hidden';
    bodyStyle.overscrollBehavior = 'none';
    bodyStyle.touchAction = 'none';

    return () => {
      htmlStyle.overflow = previousHtmlOverflow;
      bodyStyle.overflow = previousBodyOverflow;
      bodyStyle.overscrollBehavior = previousBodyOverscrollBehavior;
      bodyStyle.touchAction = previousBodyTouchAction;
    };
  }, [visible]);

  useEffect(() => {
    if (!visible || showExitActions) {
      setReadyLaunchCountdownSeconds(null);
      return;
    }

    if (phase === 'launching') {
      setReadyLaunchCountdownSeconds(0);
      return;
    }

    if (phase !== 'ready') {
      setReadyLaunchCountdownSeconds(null);
      launchTriggeredRef.current = false;
      return;
    }

    setReadyLaunchCountdownSeconds(TOURNAMENT_READY_LAUNCH_COUNTDOWN_SECONDS);

    const interval = setInterval(() => {
      setReadyLaunchCountdownSeconds((current) => {
        if (current === null) {
          return current;
        }

        if (current <= 1) {
          clearInterval(interval);

          if (onLaunchNextMatch && !launchTriggeredRef.current) {
            launchTriggeredRef.current = true;
            void onLaunchNextMatch();
          }

          return 0;
        }

        return current - 1;
      });
    }, 1_000);

    return () => {
      clearInterval(interval);
    };
  }, [onLaunchNextMatch, phase, showExitActions, visible]);

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
          isVeryShortViewport && styles.scrollContentVeryShort,
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
          <Text style={styles.eyebrow}>
            {showExitActions ? (isChampion ? 'Tournament Won' : 'Tournament Complete') : 'Tournament Waiting Room'}
          </Text>
          <Text
            style={[
              styles.title,
              isCompactViewport && styles.titleCompact,
              isDesktopViewport && styles.titleDesktop,
              isWideViewport && styles.titleWide,
            ]}
          >
            {tournamentName}
          </Text>
          <Text
            style={[
              styles.subtitle,
              isCompactViewport && styles.subtitleCompact,
              isDesktopViewport && styles.subtitleDesktop,
            ]}
          >
            {subtitle}
          </Text>

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

          <View style={[styles.contentGrid, useSplitLayout && styles.contentGridWide]}>
            <View style={[styles.infoColumn, useSplitLayout && styles.infoColumnWide]}>
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

              <View style={styles.transitionPanel}>
                <Text style={styles.transitionLabel}>{detailPanel.label}</Text>
                <Text style={[styles.transitionTitle, isCompactViewport && styles.transitionTitleCompact]}>
                  {detailPanel.title}
                </Text>
                <Text style={[styles.transitionBody, isCompactViewport && styles.helperTextCompact]}>
                  {detailPanel.body}
                </Text>
              </View>

              {readyLaunchStatusTitle ? (
                <View style={styles.launchCountdownPanel}>
                  <Text style={styles.launchCountdownLabel}>Hands-Free Launch</Text>
                  <Text style={[styles.launchCountdownTitle, isCompactViewport && styles.transitionTitleCompact]}>
                    {readyLaunchStatusTitle}
                  </Text>
                  {readyLaunchStatusBody ? (
                    <Text style={[styles.launchCountdownBody, isCompactViewport && styles.helperTextCompact]}>
                      {readyLaunchStatusBody}
                    </Text>
                  ) : null}
                </View>
              ) : null}

              <Text style={[styles.rotationNote, isCompactViewport && styles.helperTextCompact]}>{rotationNote}</Text>
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
              <Animated.View pointerEvents="none" style={[styles.cardLayer, incomingCardAnimatedStyle]}>
                <View
                  style={[
                    styles.card,
                    isCompactViewport && styles.cardCompact,
                    isVeryShortViewport && styles.cardVeryShort,
                    isDesktopViewport && styles.cardDesktop,
                    useSplitLayout && styles.cardWide,
                    { borderColor: `${activeCard.accent}66` },
                  ]}
                >
                  <Text style={[styles.cardEyebrow, { color: activeCard.accent }]}>{activeCard.eyebrow}</Text>
                  <Text style={[styles.cardTitle, isCompactViewport && styles.cardTitleCompact]}>{activeCard.title}</Text>
                  <Text style={[styles.cardBody, isCompactViewport && styles.cardBodyCompact]}>{activeCard.body}</Text>
                </View>
              </Animated.View>
              {outgoingCard ? (
                <Animated.View
                  key={`${outgoingCard.key}-${cardTransitionId}`}
                  pointerEvents="none"
                  style={[styles.cardLayer, styles.cardLayerFront, outgoingCardAnimatedStyle]}
                >
                  <View
                    style={[
                      styles.card,
                      isCompactViewport && styles.cardCompact,
                      isVeryShortViewport && styles.cardVeryShort,
                      isDesktopViewport && styles.cardDesktop,
                      useSplitLayout && styles.cardWide,
                      { borderColor: `${outgoingCard.accent}66` },
                    ]}
                  >
                    <Text style={[styles.cardEyebrow, { color: outgoingCard.accent }]}>{outgoingCard.eyebrow}</Text>
                    <Text style={[styles.cardTitle, isCompactViewport && styles.cardTitleCompact]}>
                      {outgoingCard.title}
                    </Text>
                    <Text style={[styles.cardBody, isCompactViewport && styles.cardBodyCompact]}>{outgoingCard.body}</Text>
                  </View>
                </Animated.View>
              ) : null}
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
    ...StyleSheet.absoluteFillObject,
    zIndex: 60,
    elevation: 60,
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
    paddingHorizontal: urTheme.spacing.sm,
    paddingVertical: urTheme.spacing.sm,
  },
  scrollContentVeryShort: {
    paddingVertical: urTheme.spacing.xs,
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
    gap: urTheme.spacing.xs,
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
    maxWidth: 720,
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
  pillText: {
    ...urTypography.label,
    color: '#D6EAFF',
    fontSize: 10,
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
  retryText: {
    color: '#F0D79A',
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'left',
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
  transitionPanel: {
    width: '100%',
    gap: urTheme.spacing.xs,
    borderRadius: urTheme.radii.lg,
    borderWidth: 1,
    borderColor: 'rgba(130, 182, 255, 0.18)',
    backgroundColor: 'rgba(10, 18, 29, 0.62)',
    paddingHorizontal: urTheme.spacing.md,
    paddingVertical: urTheme.spacing.md,
  },
  transitionLabel: {
    ...urTypography.label,
    color: '#BFDFFF',
    fontSize: 11,
  },
  transitionTitle: {
    ...urTypography.title,
    color: '#F7E9CE',
    fontSize: 30,
    lineHeight: 36,
  },
  transitionTitleCompact: {
    fontSize: 26,
    lineHeight: 32,
  },
  transitionBody: {
    color: 'rgba(215, 231, 251, 0.82)',
    fontSize: 13,
    lineHeight: 19,
  },
  launchCountdownPanel: {
    width: '100%',
    gap: urTheme.spacing.xs,
    borderRadius: urTheme.radii.lg,
    borderWidth: 1,
    borderColor: 'rgba(246, 214, 151, 0.22)',
    backgroundColor: 'rgba(41, 29, 13, 0.5)',
    paddingHorizontal: urTheme.spacing.md,
    paddingVertical: urTheme.spacing.md,
  },
  launchCountdownLabel: {
    ...urTypography.label,
    color: '#F4D189',
    fontSize: 10,
  },
  launchCountdownTitle: {
    ...urTypography.title,
    color: '#F7E9CE',
    fontSize: 24,
    lineHeight: 28,
  },
  launchCountdownBody: {
    color: 'rgba(239, 226, 202, 0.82)',
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
    minHeight: 236,
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
    height: 232,
    transform: [{ rotate: '-5deg' }, { translateY: 14 }],
  },
  cardGhostFront: {
    height: 242,
    transform: [{ rotate: '4deg' }, { translateY: 8 }],
  },
  cardLayer: {
    position: 'absolute',
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardLayerFront: {
    zIndex: 2,
  },
  card: {
    width: '100%',
    maxWidth: 540,
    minHeight: 252,
    borderRadius: 30,
    borderWidth: 1.4,
    backgroundColor: 'rgba(12, 17, 26, 0.94)',
    paddingHorizontal: urTheme.spacing.lg,
    paddingVertical: urTheme.spacing.lg,
    alignItems: 'flex-start',
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
    minHeight: 212,
    borderRadius: 24,
    paddingHorizontal: urTheme.spacing.md,
    paddingVertical: urTheme.spacing.md,
  },
  cardVeryShort: {
    minHeight: 196,
    paddingVertical: urTheme.spacing.sm,
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
    backgroundColor: 'rgba(214, 234, 255, 0.22)',
  },
  cardIndicatorActive: {
    width: 26,
    backgroundColor: '#F0C965',
  },
  rotationNote: {
    color: 'rgba(216, 232, 251, 0.72)',
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'left',
  },
  actionRow: {
    width: '100%',
    maxWidth: 420,
  },
});
