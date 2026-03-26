import {
  Board,
  BoardImageLayoutFrame,
  BOARD_IMAGE_SOURCE,
  getBoardPiecePixelSize,
} from '@/components/game/Board';
import { AudioSettingsModal } from '@/components/game/AudioSettingsModal';
import { AmbientBackgroundEffects } from '@/components/game/AmbientBackgroundEffects';
import { BoardDropIntro } from '@/components/game/BoardDropIntro';
import { MatchChallengeRewardsPanel } from '@/components/challenges/MatchChallengeRewardsPanel';
import { EloMatchSummaryPanel } from '@/components/elo/EloMatchSummaryPanel';
import { XPDisplay } from '@/components/challenges/XPDisplay';
import { Dice, DiceStageVisual } from '@/components/game/Dice';
import { EdgeScore } from '@/components/game/EdgeScore';
import { GameStageHUD } from '@/components/game/GameStageHUD';
import { MatchDiceRollStage } from '@/components/game/MatchDiceRollStage';
import { MatchMomentIndicator } from '@/components/game/MatchMomentIndicator';
import type { MatchMomentIndicatorCue } from '@/components/game/MatchMomentIndicator';
import { PieceRail, PieceRailFrameMeasurement, ReserveSlotMeasurement } from '@/components/game/PieceRail';
import { ReserveCascadeIntro, ReserveCascadePieceTarget } from '@/components/game/ReserveCascadeIntro';
import { DEFAULT_DICE_ROLL_DURATION_MS } from '@/components/game/slotDiceShared';
import { ProgressionAwardSummary } from '@/components/progression/ProgressionAwardSummary';
import { PlayTutorialCoachModal } from '@/components/tutorial/PlayTutorialCoachModal';
import { Modal } from '@/components/ui/Modal';
import { boxShadow, textShadow } from '@/constants/styleEffects';
import { urTheme, urTypography } from '@/constants/urTheme';
import { hasNakamaConfig, isNakamaEnabled } from '@/config/nakama';
import { useGameLoop } from '@/hooks/useGameLoop';
import { DEFAULT_BOT_DIFFICULTY, isBotDifficulty } from '@/logic/bot/types';
import { BOARD_COLS, BOARD_ROWS } from '@/logic/constants';
import { applyMove as applyEngineMove } from '@/logic/engine';
import {
  getMatchConfig,
  getPracticeModeRewardLabel,
} from '@/logic/matchConfigs';
import type { GameState, MoveAction, PlayerColor } from '@/logic/types';
import { gameAudio } from '@/services/audio';
import { submitCompletedBotMatchResult } from '@/services/botMatchRewards';
import {
  DEFAULT_MATCH_PREFERENCES,
  getMatchPreferences,
  type DiceAnimationSpeed,
  type TurnTimerSeconds,
  updateMatchPreferences,
} from '@/services/matchPreferences';
import { nakamaService } from '@/services/nakama';
import { stripProgressionAwardEnvelope } from '@/services/progression';
import { buildMatchChallengeRewardSummary, type MatchChallengeRewardSummary } from '@/src/challenges/challengeUi';
import { useAuth } from '@/src/auth/useAuth';
import { useChallenges } from '@/src/challenges/useChallenges';
import {
  buildOfflineCompletedMatchSummary,
  createOfflineMatchTelemetry,
  getBotOpponentType,
  recordOfflineHistoryEntries,
  recordOfflineRoll,
} from '@/src/offlineMatch/offlineMatchRewards';
import { useProgression } from '@/src/progression/useProgression';
import { useGameStore } from '@/store/useGameStore';
import { resolveVisibleViewportSize } from '@/src/layout/matchViewport';
import {
  PLAYTHROUGH_TUTORIAL_ID,
  PLAYTHROUGH_TUTORIAL_LESSON_COUNT,
  PLAYTHROUGH_TUTORIAL_SEGMENTS,
  isPlaythroughTutorialId,
} from '@/tutorials/playthroughTutorial';
import type { CompletedBotMatchRewardMode } from '@/shared/challenges';
import { isEloRatingChangeNotificationPayload } from '@/shared/elo';
import { isProgressionAwardNotificationPayload } from '@/shared/progression';
import {
  MatchOpCode,
  MoveRequestPayload,
  RollRequestPayload,
  decodePayload,
  encodePayload,
  isServerErrorPayload,
  isStateSnapshotPayload,
} from '@/shared/urMatchProtocol';
import { MatchData, MatchPresenceEvent, Socket } from '@heroiclabs/nakama-js';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useFonts } from 'expo-font';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useRef } from 'react';
import { Image, Platform, Pressable, Share, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const UR_BG_IMAGE = require('../../assets/images/ur_bg.png');

const MATCH_AMBIENT_EFFECTS = {
  bugEnabled: true,
  dustEnabled: true,
  leafEnabled: true,
  maxVisibleBugs: 1,
  maxVisibleLeaves: 1,
} as const;
const TOP_CHROME_ACCENT = '#C89820';
const TOP_CHROME_BORDER = urTheme.colors.cedar;
const VISUAL_TURN_TIMER_WARNING_THRESHOLD = 0.22;
const MATCH_CUE_FONT_FAMILY = 'CinzelDecorativeBold';
const HOURGLASS_HEIGHT_RATIO = 156 / 100;
const LOCAL_MOVE_HISTORY_RE = /^(light|dark) moved to \d+\. Rosette: (true|false)$/;
const AUTO_ROLL_DELAY_MS = 550;
const BOARD_INTRO_FALLBACK_DELAY_MS = 400;
const SHOULD_BYPASS_CINEMATIC_INTROS = process.env.NODE_ENV === 'test';

type MatchMomentCueKind = 'play' | 'rosette' | 'opponentJoined' | 'opponentForfeit';
type RollButtonLatchPhase = 'idle' | 'awaitingOutcome' | 'awaitingTurnReset';
type TutorialCoachPhase =
  | 'idle'
  | 'lesson_intro'
  | 'lesson_play'
  | 'lesson_result'
  | 'freeplay';

const MATCH_MOMENT_CUES: Record<MatchMomentCueKind, Omit<MatchMomentIndicatorCue, 'id'>> = {
  play: {
    message: 'Play!',
    accent: urTheme.colors.goldBright,
    border: 'rgba(240, 192, 64, 0.86)',
    glow: 'rgba(240, 192, 64, 0.26)',
    background: 'rgba(48, 28, 14, 0.94)',
    durationMs: 1100,
  },
  rosette: {
    message: 'Roll Again!',
    accent: urTheme.colors.goldGlow,
    border: 'rgba(246, 214, 151, 0.88)',
    glow: 'rgba(240, 192, 64, 0.24)',
    background: 'rgba(29, 31, 50, 0.94)',
    durationMs: 1300,
  },
  opponentJoined: {
    message: 'Opponent Joined',
    accent: urTheme.colors.goldBright,
    border: 'rgba(246, 214, 151, 0.86)',
    glow: 'rgba(90, 168, 255, 0.16)',
    background: 'rgba(20, 32, 37, 0.94)',
    durationMs: 1450,
  },
  opponentForfeit: {
    message: 'Opponent Forfeit',
    accent: urTheme.colors.carnelianBright,
    border: 'rgba(232, 98, 46, 0.86)',
    glow: 'rgba(232, 98, 46, 0.2)',
    background: 'rgba(47, 20, 15, 0.94)',
    durationMs: 1500,
  },
};

interface BoardTargetFrame {
  x: number;
  y: number;
  width: number;
  height: number;
}

const isMoveMatch = (left: MoveAction, right: MoveAction) =>
  left.pieceId === right.pieceId && left.fromIndex === right.fromIndex && left.toIndex === right.toIndex;

export function GameRoom() {
  const { id, offline, botDifficulty, tutorial, modeId, privateMatch, privateHost, privateCode } = useLocalSearchParams<{
    id?: string | string[];
    offline?: string | string[];
    botDifficulty?: string | string[];
    tutorial?: string | string[];
    modeId?: string | string[];
    privateMatch?: string | string[];
    privateHost?: string | string[];
    privateCode?: string | string[];
  }>();
  const router = useRouter();
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [webVisualViewportSize, setWebVisualViewportSize] = React.useState<{ width: number; height: number } | null>(null);
  const isMatchStageExternal = Platform.OS === 'ios';
  const [ancientCueFontLoaded, ancientCueFontError] = useFonts({
    [MATCH_CUE_FONT_FAMILY]: require('../../assets/fonts/CinzelDecorative-Bold.ttf'),
  });
  const { user } = useAuth();

  const matchId = useMemo(() => (Array.isArray(id) ? id[0] : id), [id]);
  const offlineParam = useMemo(() => (Array.isArray(offline) ? offline[0] : offline), [offline]);
  const botDifficultyParam = useMemo(
    () => (Array.isArray(botDifficulty) ? botDifficulty[0] : botDifficulty),
    [botDifficulty],
  );
  const tutorialParam = useMemo(() => (Array.isArray(tutorial) ? tutorial[0] : tutorial), [tutorial]);
  const modeIdParam = useMemo(() => (Array.isArray(modeId) ? modeId[0] : modeId), [modeId]);
  const privateMatchParam = useMemo(
    () => (Array.isArray(privateMatch) ? privateMatch[0] : privateMatch),
    [privateMatch],
  );
  const privateHostParam = useMemo(
    () => (Array.isArray(privateHost) ? privateHost[0] : privateHost),
    [privateHost],
  );
  const privateCodeParam = useMemo(
    () => (Array.isArray(privateCode) ? privateCode[0] : privateCode),
    [privateCode],
  );
  const resolvedBotDifficulty = useMemo(
    () => (isBotDifficulty(botDifficultyParam) ? botDifficultyParam : DEFAULT_BOT_DIFFICULTY),
    [botDifficultyParam],
  );
  const resolvedMatchConfig = useMemo(() => getMatchConfig(modeIdParam), [modeIdParam]);
  const tutorialId = useMemo(
    () => (isPlaythroughTutorialId(tutorialParam) ? tutorialParam : null),
    [tutorialParam],
  );
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') {
      return;
    }

    const syncVisualViewport = () => {
      const nextSize = resolveVisibleViewportSize(
        { width, height },
        window.visualViewport
          ? {
            width: window.visualViewport.width,
            height: window.visualViewport.height,
          }
          : {
            width: window.innerWidth,
            height: window.innerHeight,
          },
      );

      setWebVisualViewportSize((current) => {
        if (current && current.width === nextSize.width && current.height === nextSize.height) {
          return current;
        }

        return nextSize;
      });
    };

    syncVisualViewport();

    window.addEventListener('resize', syncVisualViewport);
    window.visualViewport?.addEventListener('resize', syncVisualViewport);
    window.visualViewport?.addEventListener('scroll', syncVisualViewport);

    return () => {
      window.removeEventListener('resize', syncVisualViewport);
      window.visualViewport?.removeEventListener('resize', syncVisualViewport);
      window.visualViewport?.removeEventListener('scroll', syncVisualViewport);
    };
  }, [height, width]);
  const { width: viewportWidth, height: viewportHeight } = useMemo(
    () =>
      resolveVisibleViewportSize(
        { width, height },
        Platform.OS === 'web' ? webVisualViewportSize : null,
      ),
    [height, webVisualViewportSize, width],
  );
  const isOffline = useMemo(
    () =>
      offlineParam === '1' ||
      !isNakamaEnabled() ||
      !hasNakamaConfig() ||
      String(matchId ?? '').startsWith('local-'),
    [matchId, offlineParam],
  );

  const gameState = useGameStore((state) => state.gameState);
  const roll = useGameStore((state) => state.roll);
  const makeMove = useGameStore((state) => state.makeMove);
  const validMoves = useGameStore((state) => state.validMoves);
  const reset = useGameStore((state) => state.reset);
  const userId = useGameStore((state) => state.userId);
  const playerColor = useGameStore((state) => state.playerColor);
  const matchPresences = useGameStore((state) => state.matchPresences);
  const lastProgressionAward = useGameStore((state) => state.lastProgressionAward);
  const lastEloRatingChange = useGameStore((state) => state.lastEloRatingChange);
  const initGame = useGameStore((state) => state.initGame);
  const setMatchId = useGameStore((state) => state.setMatchId);
  const storedMatchId = useGameStore((state) => state.matchId);
  const matchToken = useGameStore((state) => state.matchToken);
  const serverRevision = useGameStore((state) => state.serverRevision);
  const applyServerSnapshot = useGameStore((state) => state.applyServerSnapshot);
  const setGameStateFromServer = useGameStore((state) => state.setGameStateFromServer);
  const setPlayerColor = useGameStore((state) => state.setPlayerColor);
  const setOnlineMode = useGameStore((state) => state.setOnlineMode);
  const setMatchPresences = useGameStore((state) => state.setMatchPresences);
  const updateMatchPresences = useGameStore((state) => state.updateMatchPresences);
  const setLastProgressionAward = useGameStore((state) => state.setLastProgressionAward);
  const setLastEloRatingChange = useGameStore((state) => state.setLastEloRatingChange);
  const setSocketState = useGameStore((state) => state.setSocketState);
  const setRollCommandSender = useGameStore((state) => state.setRollCommandSender);
  const setMoveCommandSender = useGameStore((state) => state.setMoveCommandSender);
  const { progression, refresh: refreshProgression, errorMessage: progressionError } = useProgression();
  const {
    definitions: challengeDefinitions,
    progress: challengeProgress,
    refresh: refreshChallenges,
  } = useChallenges();
  const isPlaythroughTutorialMatch = tutorialId === PLAYTHROUGH_TUTORIAL_ID;
  const effectiveMatchConfig = storedMatchId === matchId ? gameState.matchConfig : resolvedMatchConfig;
  const isPrivateMatch = privateMatchParam === '1';
  const isPrivateMatchHost = privateHostParam === '1';
  const privateMatchCode = privateCodeParam ?? null;
  const pieceCountPerSide = effectiveMatchConfig.pieceCountPerSide;
  const isPracticeModeMatch = effectiveMatchConfig.isPracticeMode;
  const offlineBotRewardMode: CompletedBotMatchRewardMode | undefined =
    isPlaythroughTutorialMatch || !effectiveMatchConfig.allowsChallenges ? 'base_win_only' : undefined;
  const practiceModeRewardLabel = isPracticeModeMatch ? getPracticeModeRewardLabel(effectiveMatchConfig) : null;

  const hasAssignedColor = playerColor === 'light' || playerColor === 'dark';
  const canSyncOfflineBotRewards =
    effectiveMatchConfig.allowsXp && isOffline && isNakamaEnabled() && hasNakamaConfig() && Boolean(user);
  const shouldShowAccountRewards =
    (!isOffline && (effectiveMatchConfig.allowsXp || isPrivateMatch)) || canSyncOfflineBotRewards;
  const shouldShowChallengeRewards =
    shouldShowAccountRewards &&
    effectiveMatchConfig.allowsChallenges &&
    !isPlaythroughTutorialMatch &&
    !isPrivateMatch;
  const isRankedHumanMatch =
    !isOffline &&
    !isPrivateMatch &&
    effectiveMatchConfig.allowsRankedStats &&
    !isPlaythroughTutorialMatch;
  const eloUnchangedReason = isRankedHumanMatch
    ? null
    : isPrivateMatch
      ? 'Private matches do not affect Elo.'
      : isOffline
        ? 'Bot and offline matches do not affect Elo.'
        : !effectiveMatchConfig.allowsRankedStats
          ? 'This mode does not affect Elo.'
          : 'Elo was unchanged for this match.';
  const effectiveMatchToken = storedMatchId === matchId ? matchToken : null;
  const isMyTurn = hasAssignedColor && gameState.currentTurn === playerColor;
  const didPlayerWin =
    gameState.winner !== null && hasAssignedColor ? gameState.winner === playerColor : gameState.winner === 'light';
  const winModalTitle = didPlayerWin ? 'Victory' : 'Defeat';
  const winModalMessage = didPlayerWin ? 'The royal path is yours.' : 'The opponent seized the final lane.';
  const joinedPlayerCount = useMemo(() => {
    if (isOffline) {
      return 0;
    }

    const presenceIds = new Set(matchPresences);
    if (userId) {
      presenceIds.add(userId);
    }

    return presenceIds.size;
  }, [isOffline, matchPresences, userId]);
  const isPrivateMatchReady = !isPrivateMatch || joinedPlayerCount >= 2 || gameState.winner !== null;
  const canRoll = isMyTurn && gameState.phase === 'rolling' && isPrivateMatchReady;
  const privateMatchStatusText = useMemo(() => {
    if (!isPrivateMatch) {
      return null;
    }

    if (!isPrivateMatchReady) {
      return isPrivateMatchHost
        ? 'Waiting for the other player to arrive. The board stays locked until they do.'
        : 'Waiting for the host to arrive. The board unlocks as soon as both of you are here.';
    }

    return isPrivateMatchHost
      ? 'Opponent connected. Your private board is unlocked.'
      : 'Host connected. Your private board is unlocked.';
  }, [isPrivateMatch, isPrivateMatchHost, isPrivateMatchReady]);

  const handleCopyPrivateCode = React.useCallback(async () => {
    if (!privateMatchCode) {
      return;
    }

    try {
      if (Platform.OS === 'web') {
        const clipboard = typeof navigator !== 'undefined' ? navigator.clipboard : undefined;
        if (clipboard?.writeText) {
          await clipboard.writeText(privateMatchCode);
          return;
        }
      }

      await Share.share({
        message: `Royal Game of Ur private game code: ${privateMatchCode}`,
      });
    } catch {
      // Copy/share is best-effort.
    }
  }, [privateMatchCode]);

  const [showWinModal, setShowWinModal] = React.useState(false);
  const [showAudioSettings, setShowAudioSettings] = React.useState(false);
  const [showTopMenu, setShowTopMenu] = React.useState(false);
  const [matchChallengeSummary, setMatchChallengeSummary] = React.useState<MatchChallengeRewardSummary | null>(null);
  const [matchRewardsErrorMessage, setMatchRewardsErrorMessage] = React.useState<string | null>(null);
  const [isRefreshingMatchRewards, setIsRefreshingMatchRewards] = React.useState(false);
  const [rollingVisual, setRollingVisual] = React.useState(false);
  const [rollButtonLatchPhase, setRollButtonLatchPhase] = React.useState<RollButtonLatchPhase>('idle');
  const [showScoreBanner, setShowScoreBanner] = React.useState(false);
  const [musicEnabled, setMusicEnabled] = React.useState(true);
  const [musicVolume, setMusicVolume] = React.useState(1);
  const [sfxEnabled, setSfxEnabled] = React.useState(true);
  const [sfxVolume, setSfxVolume] = React.useState(1);
  const [announcementCuesEnabled, setAnnouncementCuesEnabled] = React.useState(
    DEFAULT_MATCH_PREFERENCES.announcementCuesEnabled,
  );
  const [botTimerEnabled, setBotTimerEnabled] = React.useState(DEFAULT_MATCH_PREFERENCES.timerEnabled);
  const [turnTimerSeconds, setTurnTimerSeconds] = React.useState<TurnTimerSeconds>(
    DEFAULT_MATCH_PREFERENCES.timerDurationSeconds,
  );
  const [diceAnimationEnabled, setDiceAnimationEnabled] = React.useState(DEFAULT_MATCH_PREFERENCES.diceAnimationEnabled);
  const [diceAnimationSpeed, setDiceAnimationSpeed] = React.useState<DiceAnimationSpeed>(
    DEFAULT_MATCH_PREFERENCES.diceAnimationSpeed,
  );
  const [bugAnimationEnabled, setBugAnimationEnabled] = React.useState(DEFAULT_MATCH_PREFERENCES.bugAnimationEnabled);
  const [autoRollEnabled, setAutoRollEnabled] = React.useState(DEFAULT_MATCH_PREFERENCES.autoRollEnabled);
  const [moveHintEnabled, setMoveHintEnabled] = React.useState(DEFAULT_MATCH_PREFERENCES.moveHintEnabled);
  const [boardSlotSize, setBoardSlotSize] = React.useState({ width: 0, height: 0 });
  const [boardTargetFrame, setBoardTargetFrame] = React.useState<BoardTargetFrame | null>(null);
  const [boardDropTargetFrame, setBoardDropTargetFrame] = React.useState<BoardTargetFrame | null>(null);
  const [hasBoardArtLayout, setHasBoardArtLayout] = React.useState(false);
  const [lightReserveSlots, setLightReserveSlots] = React.useState<ReserveSlotMeasurement[]>([]);
  const [darkReserveSlots, setDarkReserveSlots] = React.useState<ReserveSlotMeasurement[]>([]);
  const [frozenReserveCascadeTargets, setFrozenReserveCascadeTargets] = React.useState<ReserveCascadePieceTarget[]>([]);
  const [lightTrayFrame, setLightTrayFrame] = React.useState<PieceRailFrameMeasurement | null>(null);
  const [darkTrayFrame, setDarkTrayFrame] = React.useState<PieceRailFrameMeasurement | null>(null);
  const [showBoardDropIntro, setShowBoardDropIntro] = React.useState(false);
  const [hasPlayedBoardDropIntro, setHasPlayedBoardDropIntro] = React.useState(false);
  const [showReserveCascadeIntro, setShowReserveCascadeIntro] = React.useState(false);
  const [hasPlayedReserveCascadeIntro, setHasPlayedReserveCascadeIntro] = React.useState(false);
  const [mobileContentVerticalShift, setMobileContentVerticalShift] = React.useState(0);
  const [hasResolvedMobileContentShift, setHasResolvedMobileContentShift] = React.useState(false);
  const hasMeasuredReserveTargets = lightReserveSlots.length > 0 || darkReserveSlots.length > 0;
  const shouldSkipReserveCascadeIntro = hasPlayedBoardDropIntro && !hasMeasuredReserveTargets;
  const introsComplete =
    SHOULD_BYPASS_CINEMATIC_INTROS ||
    (hasPlayedBoardDropIntro && (hasPlayedReserveCascadeIntro || shouldSkipReserveCascadeIntro));
  const [turnTimerCycleId, setTurnTimerCycleId] = React.useState(0);
  const [activeMatchCue, setActiveMatchCue] = React.useState<MatchMomentIndicatorCue | null>(null);
  const [mobileScoreRowHeight, setMobileScoreRowHeight] = React.useState(0);
  const [tutorialCoachPhase, setTutorialCoachPhase] = React.useState<TutorialCoachPhase>('idle');
  const [tutorialSegmentIndex, setTutorialSegmentIndex] = React.useState(0);
  const isScriptedTutorialPhase =
    isPlaythroughTutorialMatch &&
    tutorialCoachPhase !== 'idle' &&
    tutorialCoachPhase !== 'freeplay';
  const boardMeasureRef = useRef<View | null>(null);
  const boardImageLayoutRef = useRef<BoardImageLayoutFrame | null>(null);
  const localRollAudioPendingRef = useRef(false);
  const rollButtonRequestRef = useRef<{
    serverRevision: number;
    currentTurn: PlayerColor;
    historyLength: number;
  } | null>(null);
  const rollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoRollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scoreBannerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const turnTimeoutTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const forceMoveAfterRollRef = useRef(false);
  const activeMatchCueRef = useRef<MatchMomentIndicatorCue | null>(null);
  const queuedMatchCuesRef = useRef<MatchMomentIndicatorCue[]>([]);
  const matchCueIdRef = useRef(0);
  const offlineMatchTelemetryRef = useRef(createOfflineMatchTelemetry());
  const submittedOfflineRewardMatchIdsRef = useRef(new Set<string>());
  const lastQueuedMatchCueRef = useRef<{
    kind: MatchMomentCueKind;
    matchId: string | null;
    timestamp: number;
  } | null>(null);
  const suppressMatchCuesUntilInteractionRef = useRef(false);
  const hasShownOpeningCueRef = useRef<string | null>(null);
  const previousStateRef = useRef<{ matchId: string | null; state: GameState }>({
    matchId: matchId ?? null,
    state: gameState,
  });
  const tutorialHydratingStateRef = useRef(false);
  const previousTurnTimerStateRef = useRef<{
    matchId: string | null;
    currentTurn: PlayerColor;
    phase: typeof gameState.phase;
  } | null>(null);
  const previousJoinedPlayerCountRef = useRef(0);

  const tutorialSegment =
    tutorialSegmentIndex < PLAYTHROUGH_TUTORIAL_SEGMENTS.length
      ? PLAYTHROUGH_TUTORIAL_SEGMENTS[tutorialSegmentIndex]
      : null;
  const tutorialCoachVisible =
    tutorialCoachPhase === 'lesson_intro' || tutorialCoachPhase === 'lesson_result';
  const tutorialCoachEyebrow =
    tutorialCoachPhase === 'lesson_intro' && tutorialSegment
      ? `Lesson ${tutorialSegment.lessonNumber} of ${PLAYTHROUGH_TUTORIAL_LESSON_COUNT}`
      : tutorialCoachPhase === 'lesson_result'
        ? 'What this means'
        : undefined;
  const tutorialCoachTitle =
    tutorialCoachPhase === 'lesson_intro' && tutorialSegment
      ? tutorialSegment.title
      : tutorialCoachPhase === 'lesson_result' && tutorialSegment
        ? tutorialSegment.title
        : '';
  const tutorialCoachBody =
    tutorialCoachPhase === 'lesson_intro' && tutorialSegment
      ? tutorialSegment.objective
      : tutorialCoachPhase === 'lesson_result' && tutorialSegment
        ? tutorialSegment.implication
        : '';
  const tutorialCoachActionLabel =
    tutorialCoachPhase === 'lesson_result' && tutorialSegmentIndex === PLAYTHROUGH_TUTORIAL_SEGMENTS.length - 1
      ? 'Play On'
      : 'Continue';
  const tutorialObjectiveBanner =
    tutorialCoachPhase === 'lesson_play' && tutorialSegment
      ? `Lesson ${tutorialSegment.lessonNumber}/${PLAYTHROUGH_TUTORIAL_LESSON_COUNT}: ${tutorialSegment.objective}`
      : null;

  const cueSystemReady = ancientCueFontLoaded || Boolean(ancientCueFontError);
  const cueFontFamily = ancientCueFontLoaded ? MATCH_CUE_FONT_FAMILY : undefined;
  const rollResultFontFamily = ancientCueFontLoaded ? MATCH_CUE_FONT_FAMILY : urTypography.title.fontFamily;
  const isRollButtonPressedIn = rollButtonLatchPhase !== 'idle';
  const diceAnimationDurationMs = useMemo(
    () => Math.max(400, Math.round(DEFAULT_DICE_ROLL_DURATION_MS / diceAnimationSpeed)),
    [diceAnimationSpeed],
  );
  const visualTurnTimerDurationMs = turnTimerSeconds * 1000;

  const clearRollTimer = React.useCallback(() => {
    if (rollTimerRef.current) {
      clearTimeout(rollTimerRef.current);
      rollTimerRef.current = null;
    }
  }, []);

  const handleRollResultShown = React.useCallback(() => {
    clearRollTimer();
    setRollingVisual(false);
  }, [clearRollTimer]);

  const applyTutorialSnapshot = React.useCallback(
    (nextState: GameState) => {
      tutorialHydratingStateRef.current = true;
      setGameStateFromServer(nextState);
    },
    [setGameStateFromServer],
  );

  const triggerTutorialRoll = React.useCallback(
    (value: 0 | 1 | 2 | 3 | 4) => {
      if (!introsComplete || !canRoll || rollingVisual || rollButtonLatchPhase !== 'idle') {
        return;
      }

      rollButtonRequestRef.current = {
        serverRevision,
        currentTurn: gameState.currentTurn,
        historyLength: gameState.history.length,
      };
      setRollButtonLatchPhase('awaitingOutcome');
      localRollAudioPendingRef.current = true;

      if (diceAnimationEnabled) {
        setRollingVisual(true);
        clearRollTimer();
      } else {
        clearRollTimer();
        setRollingVisual(false);
      }

      const rolledState: GameState = {
        ...gameState,
        phase: 'moving',
        rollValue: value,
      };

      void gameAudio.play('roll');
      setGameStateFromServer(rolledState);
    },
    [
      canRoll,
      clearRollTimer,
      diceAnimationEnabled,
      gameState,
      rollButtonLatchPhase,
      rollingVisual,
      serverRevision,
      setGameStateFromServer,
      introsComplete,
    ],
  );

  const handleTutorialMove = React.useCallback(
    (move: MoveAction) => {
      if (tutorialCoachPhase === 'lesson_play' && tutorialSegment) {
        if (!isMoveMatch(move, tutorialSegment.expectedMove)) {
          return;
        }

        setGameStateFromServer(applyEngineMove(gameState, move));
        setTutorialCoachPhase('lesson_result');
      }
    },
    [gameState, setGameStateFromServer, tutorialCoachPhase, tutorialSegment],
  );

  const handleContinueTutorialCoach = React.useCallback(() => {
    if (tutorialCoachPhase === 'lesson_intro') {
      setTutorialCoachPhase('lesson_play');
      return;
    }

    if (tutorialCoachPhase === 'lesson_result') {
      const nextIndex = tutorialSegmentIndex + 1;

      if (nextIndex < PLAYTHROUGH_TUTORIAL_SEGMENTS.length) {
        setTutorialSegmentIndex(nextIndex);
        applyTutorialSnapshot(PLAYTHROUGH_TUTORIAL_SEGMENTS[nextIndex].snapshot);
        setTutorialCoachPhase('lesson_intro');
        return;
      }

      setTutorialCoachPhase('freeplay');
    }
  }, [applyTutorialSnapshot, tutorialCoachPhase, tutorialSegmentIndex]);

  const triggerLocalRoll = React.useCallback(() => {
    if (!introsComplete || !canRoll || rollingVisual || rollButtonLatchPhase !== 'idle') {
      return;
    }

    rollButtonRequestRef.current = {
      serverRevision,
      currentTurn: gameState.currentTurn,
      historyLength: gameState.history.length,
    };
    setRollButtonLatchPhase('awaitingOutcome');
    localRollAudioPendingRef.current = true;

    if (diceAnimationEnabled) {
      setRollingVisual(true);
      clearRollTimer();
    } else {
      clearRollTimer();
      setRollingVisual(false);
    }

    void gameAudio.play('roll');
    roll();
  }, [
    canRoll,
    clearRollTimer,
    diceAnimationEnabled,
    gameState.currentTurn,
    gameState.history.length,
    roll,
    rollButtonLatchPhase,
    rollingVisual,
    serverRevision,
    introsComplete,
  ]);

  const setLiveMatchCue = React.useCallback((cue: MatchMomentIndicatorCue | null) => {
    activeMatchCueRef.current = cue;
    setActiveMatchCue(cue);
  }, []);

  const resumeAnnouncementCuesFromInteraction = React.useCallback(() => {
    suppressMatchCuesUntilInteractionRef.current = false;
  }, []);

  const enqueueMatchCue = React.useCallback(
    (kind: MatchMomentCueKind) => {
      if (!announcementCuesEnabled || !introsComplete || suppressMatchCuesUntilInteractionRef.current) {
        return;
      }

      const now = Date.now();
      const previousCue = lastQueuedMatchCueRef.current;

      if (
        previousCue &&
        previousCue.kind === kind &&
        previousCue.matchId === (matchId ?? null) &&
        now - previousCue.timestamp < 1_600
      ) {
        return;
      }

      lastQueuedMatchCueRef.current = {
        kind,
        matchId: matchId ?? null,
        timestamp: now,
      };

      matchCueIdRef.current += 1;
      const cue: MatchMomentIndicatorCue = {
        id: matchCueIdRef.current,
        ...MATCH_MOMENT_CUES[kind],
      };

      if (!activeMatchCueRef.current) {
        setLiveMatchCue(cue);
        return;
      }

      queuedMatchCuesRef.current.push(cue);
    },
    [announcementCuesEnabled, introsComplete, matchId, setLiveMatchCue],
  );

  const handleMatchCueHidden = React.useCallback(
    (cueId: number) => {
      if (activeMatchCueRef.current?.id !== cueId) {
        return;
      }

      const nextCue = queuedMatchCuesRef.current.shift() ?? null;
      setLiveMatchCue(nextCue);
    },
    [setLiveMatchCue],
  );

  const replaceMatchCue = React.useCallback(
    (kind: MatchMomentCueKind) => {
      if (!announcementCuesEnabled || !introsComplete) {
        return;
      }

      matchCueIdRef.current += 1;
      lastQueuedMatchCueRef.current = {
        kind,
        matchId: matchId ?? null,
        timestamp: Date.now(),
      };
      queuedMatchCuesRef.current = [];
      setLiveMatchCue({
        id: matchCueIdRef.current,
        ...MATCH_MOMENT_CUES[kind],
      });
    },
    [announcementCuesEnabled, introsComplete, matchId, setLiveMatchCue],
  );

  useEffect(() => {
    if (announcementCuesEnabled && introsComplete) {
      return;
    }

    queuedMatchCuesRef.current = [];
    lastQueuedMatchCueRef.current = null;
    setLiveMatchCue(null);
  }, [announcementCuesEnabled, introsComplete, setLiveMatchCue]);

  const syncBoardTargetFrame = React.useCallback(() => {
    const boardImageLayout = boardImageLayoutRef.current;
    const boardNode = boardMeasureRef.current;

    if (!boardImageLayout || !boardNode) {
      return;
    }

    requestAnimationFrame(() => {
      boardNode.measureInWindow((x, y) => {
        const nextFrame = {
          x: x + boardImageLayout.x,
          y: y + boardImageLayout.y,
          width: boardImageLayout.width,
          height: boardImageLayout.height,
        };

        setBoardTargetFrame((previous) =>
          previous &&
            previous.x === nextFrame.x &&
            previous.y === nextFrame.y &&
            previous.width === nextFrame.width &&
            previous.height === nextFrame.height
            ? previous
            : nextFrame,
        );
      });
    });
  }, []);

  const handleLiveBoardImageLayout = React.useCallback(
    (layout: BoardImageLayoutFrame) => {
      boardImageLayoutRef.current = layout;
      setHasBoardArtLayout(true);
      syncBoardTargetFrame();
    },
    [syncBoardTargetFrame],
  );

  const captureBoardDropTargetFrame = React.useCallback(() => {
    const boardNode = boardMeasureRef.current;

    if (!boardNode) {
      return;
    }

    requestAnimationFrame(() => {
      boardNode.measureInWindow((x, y, width, height) => {
        const nextFrame = { x, y, width, height };

        setBoardDropTargetFrame((previous) =>
          previous &&
            previous.x === nextFrame.x &&
            previous.y === nextFrame.y &&
            previous.width === nextFrame.width &&
            previous.height === nextFrame.height
            ? previous
            : nextFrame,
        );
        setShowBoardDropIntro(true);
      });
    });
  }, []);

  const handleLightTrayFrameLayout = React.useCallback((nextFrame: PieceRailFrameMeasurement) => {
    setLightTrayFrame((previous) =>
      previous &&
        previous.x === nextFrame.x &&
        previous.y === nextFrame.y &&
        previous.width === nextFrame.width &&
        previous.height === nextFrame.height
        ? previous
        : nextFrame,
    );
  }, []);

  const handleDarkTrayFrameLayout = React.useCallback((nextFrame: PieceRailFrameMeasurement) => {
    setDarkTrayFrame((previous) =>
      previous &&
        previous.x === nextFrame.x &&
        previous.y === nextFrame.y &&
        previous.width === nextFrame.width &&
        previous.height === nextFrame.height
        ? previous
        : nextFrame,
    );
  }, []);

  useGameLoop(isOffline && !isScriptedTutorialPhase);
  useEffect(() => {
    if (gameState.winner) {
      setShowWinModal(true);
    }
  }, [gameState.winner]);

  useEffect(() => {
    if (
      !showWinModal ||
      !canSyncOfflineBotRewards ||
      !matchId ||
      !hasAssignedColor ||
      !playerColor ||
      gameState.winner === null
    ) {
      return;
    }

    if (submittedOfflineRewardMatchIdsRef.current.has(matchId)) {
      return;
    }

    submittedOfflineRewardMatchIdsRef.current.add(matchId);
    let isMounted = true;

    const submitOfflineMatchRewards = async () => {
      setIsRefreshingMatchRewards(true);
      setMatchRewardsErrorMessage(null);

      try {
        const summary = buildOfflineCompletedMatchSummary({
          matchId,
          playerColor,
          opponentType: getBotOpponentType(resolvedBotDifficulty),
          finalState: gameState,
          telemetry: offlineMatchTelemetryRef.current,
          playerUserId: user?.nakamaUserId ?? user?.id ?? '',
        });
        const submission = await submitCompletedBotMatchResult({
          summary,
          modeId: effectiveMatchConfig.modeId,
          tutorialId,
          rewardMode: offlineBotRewardMode,
        });

        if (!isMounted) {
          return;
        }

        if (submission.progressionAward) {
          setLastProgressionAward(submission.progressionAward);
        }

        if (isPlaythroughTutorialMatch) {
          const progressionResult = await refreshProgression({ silent: true });

          if (!isMounted) {
            return;
          }

          setMatchChallengeSummary(null);

          if (!progressionResult && progressionError) {
            setMatchRewardsErrorMessage(progressionError);
          }

          return;
        }

        const [progressionResult, challengesResult] = await Promise.all([
          refreshProgression({ silent: true }),
          refreshChallenges({ silent: true }),
        ]);

        if (!isMounted) {
          return;
        }

        const nextDefinitions = challengesResult?.definitions ?? challengeDefinitions;
        const nextProgress = challengesResult?.progress ?? challengeProgress;

        setMatchChallengeSummary(buildMatchChallengeRewardSummary(matchId, nextDefinitions, nextProgress));

        if (!progressionResult && progressionError) {
          setMatchRewardsErrorMessage(progressionError);
        }
      } catch (error) {
        if (!isMounted) {
          return;
        }

        submittedOfflineRewardMatchIdsRef.current.delete(matchId);
        setMatchRewardsErrorMessage(
          error instanceof Error ? error.message : 'Unable to submit bot match rewards.',
        );
      } finally {
        if (isMounted) {
          setIsRefreshingMatchRewards(false);
        }
      }
    };

    void submitOfflineMatchRewards();

    return () => {
      isMounted = false;
    };
  }, [
    canSyncOfflineBotRewards,
    challengeDefinitions,
    challengeProgress,
    gameState,
    hasAssignedColor,
    matchId,
    playerColor,
    progressionError,
    refreshChallenges,
    refreshProgression,
    resolvedBotDifficulty,
    setLastProgressionAward,
    showWinModal,
    effectiveMatchConfig.modeId,
    tutorialId,
    offlineBotRewardMode,
    user,
    isPlaythroughTutorialMatch,
  ]);

  useEffect(() => {
    if (!showWinModal) {
      setMatchChallengeSummary(null);
      setMatchRewardsErrorMessage(null);
      setIsRefreshingMatchRewards(false);
      return;
    }

    if (isOffline || !matchId) {
      return;
    }

    let isMounted = true;

    const refreshMatchRewards = async () => {
      setIsRefreshingMatchRewards(true);
      setMatchRewardsErrorMessage(null);

      try {
        const progressionPromise = refreshProgression({ silent: true });
        const challengesPromise = shouldShowChallengeRewards
          ? refreshChallenges({ silent: true })
          : Promise.resolve(null);
        const [progressionResult, challengesResult] = await Promise.all([
          progressionPromise,
          challengesPromise,
        ]);

        if (!isMounted) {
          return;
        }

        if (shouldShowChallengeRewards) {
          const nextDefinitions = challengesResult?.definitions ?? challengeDefinitions;
          const nextProgress = challengesResult?.progress ?? challengeProgress;
          setMatchChallengeSummary(buildMatchChallengeRewardSummary(matchId, nextDefinitions, nextProgress));
        } else {
          setMatchChallengeSummary(null);
        }

        if (!progressionResult && progressionError) {
          setMatchRewardsErrorMessage(progressionError);
        }
      } catch (error) {
        if (!isMounted) {
          return;
        }

        if (shouldShowChallengeRewards) {
          setMatchChallengeSummary(buildMatchChallengeRewardSummary(matchId, challengeDefinitions, challengeProgress));
        } else {
          setMatchChallengeSummary(null);
        }
        setMatchRewardsErrorMessage(error instanceof Error ? error.message : 'Unable to refresh match rewards.');
      } finally {
        if (isMounted) {
          setIsRefreshingMatchRewards(false);
        }
      }
    };

    void refreshMatchRewards();

    return () => {
      isMounted = false;
    };
  }, [
    challengeDefinitions,
    challengeProgress,
    isOffline,
    isPrivateMatch,
    matchId,
    progressionError,
    refreshChallenges,
    refreshProgression,
    shouldShowChallengeRewards,
    showWinModal,
  ]);
  useEffect(() => {
    if (!showAudioSettings && !showWinModal && !tutorialCoachVisible) {
      return;
    }

    setShowTopMenu(false);
  }, [showAudioSettings, showWinModal, tutorialCoachVisible]);
  useEffect(() => {
    boardImageLayoutRef.current = null;
    tutorialHydratingStateRef.current = false;
    localRollAudioPendingRef.current = false;
    rollButtonRequestRef.current = null;
    clearRollTimer();
    if (autoRollTimerRef.current) {
      clearTimeout(autoRollTimerRef.current);
      autoRollTimerRef.current = null;
    }
    setBoardTargetFrame(null);
    setBoardDropTargetFrame(null);
    setHasBoardArtLayout(false);
    setRollingVisual(false);
    setRollButtonLatchPhase('idle');
    setShowBoardDropIntro(false);
    setHasPlayedBoardDropIntro(false);
    setLightReserveSlots([]);
    setDarkReserveSlots([]);
    setFrozenReserveCascadeTargets([]);
    setShowReserveCascadeIntro(false);
    setHasPlayedReserveCascadeIntro(false);
    setMobileContentVerticalShift(0);
    setHasResolvedMobileContentShift(false);
    queuedMatchCuesRef.current = [];
    lastQueuedMatchCueRef.current = null;
    suppressMatchCuesUntilInteractionRef.current = false;
    hasShownOpeningCueRef.current = null;
    matchCueIdRef.current = 0;
    previousJoinedPlayerCountRef.current = 0;
    setTutorialSegmentIndex(0);
    setTutorialCoachPhase('idle');
    setLiveMatchCue(null);
  }, [clearRollTimer, matchId, setLiveMatchCue]);
  useEffect(() => {
    if (rollButtonLatchPhase === 'idle') {
      rollButtonRequestRef.current = null;
      localRollAudioPendingRef.current = false;
      return;
    }

    if (gameState.winner !== null || gameState.phase === 'ended') {
      setRollButtonLatchPhase('idle');
      return;
    }

    if (rollButtonLatchPhase === 'awaitingOutcome') {
      if (gameState.phase === 'moving' && gameState.rollValue !== null) {
        setRollButtonLatchPhase('awaitingTurnReset');
        return;
      }

      const rollRequest = rollButtonRequestRef.current;
      const stateAdvancedSinceRoll =
        rollRequest !== null &&
        (
          serverRevision > rollRequest.serverRevision ||
          gameState.currentTurn !== rollRequest.currentTurn ||
          gameState.history.length > rollRequest.historyLength
        );

      if (stateAdvancedSinceRoll && gameState.phase === 'rolling' && gameState.rollValue === null) {
        setRollButtonLatchPhase('idle');
      }

      return;
    }

    if (gameState.phase === 'rolling' && gameState.rollValue === null) {
      setRollButtonLatchPhase('idle');
    }
  }, [
    gameState.currentTurn,
    gameState.history.length,
    gameState.phase,
    gameState.rollValue,
    gameState.winner,
    rollButtonLatchPhase,
    serverRevision,
  ]);
  useEffect(() => {
    if (diceAnimationEnabled) {
      return;
    }

    clearRollTimer();
    setRollingVisual(false);
  }, [clearRollTimer, diceAnimationEnabled]);
  useEffect(() => {
    if (!cueSystemReady || !matchId || !hasAssignedColor || !introsComplete) {
      return;
    }

    if (hasShownOpeningCueRef.current === matchId) {
      return;
    }

    if (gameState.winner !== null || gameState.phase === 'ended' || gameState.history.length > 0) {
      return;
    }

    hasShownOpeningCueRef.current = matchId;
    enqueueMatchCue('play');
  }, [cueSystemReady, enqueueMatchCue, gameState.history.length, gameState.phase, gameState.winner, hasAssignedColor, introsComplete, matchId]);
  useEffect(() => {
    const previous = previousTurnTimerStateRef.current;
    const nextSnapshot = {
      matchId: matchId ?? null,
      currentTurn: gameState.currentTurn,
      phase: gameState.phase,
    };

    const shouldResetVisualTimer =
      !previous ||
      previous.matchId !== nextSnapshot.matchId ||
      (gameState.phase === 'rolling' &&
        (previous.currentTurn !== gameState.currentTurn || previous.phase !== 'rolling'));

    // This app has no authoritative turn countdown yet, so the HUD timer resets only on turn boundaries.
    if (shouldResetVisualTimer) {
      setTurnTimerCycleId((current) => current + 1);
    }

    previousTurnTimerStateRef.current = nextSnapshot;
  }, [gameState.currentTurn, gameState.phase, matchId]);
  useEffect(() => {
    if (turnTimeoutTimerRef.current) {
      clearTimeout(turnTimeoutTimerRef.current);
      turnTimeoutTimerRef.current = null;
    }

    if (
      !introsComplete ||
      isScriptedTutorialPhase ||
      (isOffline && !botTimerEnabled) ||
      !isPrivateMatchReady ||
      !isMyTurn ||
      gameState.winner !== null ||
      gameState.phase === 'ended'
    ) {
      forceMoveAfterRollRef.current = false;
      return;
    }

    turnTimeoutTimerRef.current = setTimeout(() => {
      const { gameState: liveState, playerColor: localPlayerColor, validMoves: liveValidMoves } = useGameStore.getState();
      const isLocalTurn =
        localPlayerColor !== null &&
        liveState.currentTurn === localPlayerColor &&
        liveState.winner === null &&
        liveState.phase !== 'ended';

      if (!isLocalTurn) {
        forceMoveAfterRollRef.current = false;
        return;
      }

      suppressMatchCuesUntilInteractionRef.current = true;

      if (liveState.phase === 'rolling') {
        forceMoveAfterRollRef.current = true;
        triggerLocalRoll();
        return;
      }

      if (liveState.phase === 'moving' && liveValidMoves.length > 0) {
        forceMoveAfterRollRef.current = false;
        useGameStore.getState().makeMove(liveValidMoves[0]);
      }
    }, visualTurnTimerDurationMs);

    return () => {
      if (turnTimeoutTimerRef.current) {
        clearTimeout(turnTimeoutTimerRef.current);
        turnTimeoutTimerRef.current = null;
      }
    };
  }, [
    botTimerEnabled,
    gameState.phase,
    gameState.winner,
    isPrivateMatchReady,
    isMyTurn,
    isOffline,
    isScriptedTutorialPhase,
    introsComplete,
    triggerLocalRoll,
    turnTimerCycleId,
    visualTurnTimerDurationMs,
  ]);
  useEffect(() => {
    if (autoRollTimerRef.current) {
      clearTimeout(autoRollTimerRef.current);
      autoRollTimerRef.current = null;
    }

    if (
      !introsComplete ||
      !autoRollEnabled ||
      isScriptedTutorialPhase ||
      !canRoll ||
      rollingVisual ||
      rollButtonLatchPhase !== 'idle' ||
      showAudioSettings ||
      showTopMenu ||
      showWinModal
    ) {
      return;
    }

    autoRollTimerRef.current = setTimeout(() => {
      autoRollTimerRef.current = null;
      triggerLocalRoll();
    }, AUTO_ROLL_DELAY_MS);

    return () => {
      if (autoRollTimerRef.current) {
        clearTimeout(autoRollTimerRef.current);
        autoRollTimerRef.current = null;
      }
    };
  }, [
    autoRollEnabled,
    canRoll,
    introsComplete,
    isScriptedTutorialPhase,
    rollButtonLatchPhase,
    rollingVisual,
    showAudioSettings,
    showTopMenu,
    showWinModal,
    triggerLocalRoll,
  ]);
  useEffect(() => {
    if (!forceMoveAfterRollRef.current) {
      return;
    }

    if (!isPrivateMatchReady || !isMyTurn || gameState.winner !== null || gameState.phase === 'ended') {
      forceMoveAfterRollRef.current = false;
      return;
    }

    if (gameState.phase !== 'moving' || validMoves.length === 0) {
      return;
    }

    forceMoveAfterRollRef.current = false;
    makeMove(validMoves[0]);
  }, [gameState.phase, gameState.winner, isMyTurn, isPrivateMatchReady, makeMove, validMoves]);
  useEffect(() => {
    if (!matchId) return;
    if (storedMatchId !== matchId) {
      initGame(matchId, { botDifficulty: resolvedBotDifficulty, matchConfig: resolvedMatchConfig });
    }
    setMatchId(matchId);
  }, [initGame, matchId, resolvedBotDifficulty, resolvedMatchConfig, setMatchId, storedMatchId]);

  useEffect(() => {
    if (!isPlaythroughTutorialMatch || !matchId) {
      return;
    }

    setTutorialSegmentIndex(0);
    applyTutorialSnapshot(PLAYTHROUGH_TUTORIAL_SEGMENTS[0].snapshot);
    setTutorialCoachPhase('lesson_intro');
  }, [applyTutorialSnapshot, isPlaythroughTutorialMatch, matchId]);

  useEffect(() => {
    if (!isPrivateMatch) {
      previousJoinedPlayerCountRef.current = joinedPlayerCount;
      return;
    }

    if (gameState.winner !== null || gameState.phase === 'ended') {
      previousJoinedPlayerCountRef.current = joinedPlayerCount;
      return;
    }

    const previousJoinedPlayerCount = previousJoinedPlayerCountRef.current;

    if (previousJoinedPlayerCount > 0 && previousJoinedPlayerCount < 2 && joinedPlayerCount >= 2) {
      enqueueMatchCue('opponentJoined');
    }

    if (previousJoinedPlayerCount >= 2 && joinedPlayerCount < 2) {
      replaceMatchCue('opponentForfeit');
    }

    previousJoinedPlayerCountRef.current = joinedPlayerCount;
  }, [enqueueMatchCue, gameState.phase, gameState.winner, isPrivateMatch, joinedPlayerCount, replaceMatchCue]);

  const socketRef = useRef<Socket | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!matchId) return;
    if (isOffline) {
      setOnlineMode('offline');
      setMatchPresences([]);
      setPlayerColor('light');
      setSocketState('connected');
      return;
    }

    setOnlineMode('nakama');

    let isMounted = true;

    const handleMatchData = (matchData: MatchData) => {
      if (matchData.match_id !== matchId) return;

      let rawData = '';
      if (typeof matchData.data === 'string') {
        rawData = matchData.data;
      } else if (typeof TextDecoder !== 'undefined') {
        rawData = new TextDecoder().decode(matchData.data);
      } else {
        rawData = String.fromCharCode(...Array.from(matchData.data));
      }

      const payload = decodePayload(rawData);

      if (matchData.op_code === MatchOpCode.STATE_SNAPSHOT) {
        if (!isStateSnapshotPayload(payload)) {
          return;
        }
        const assignedColorFromSnapshot = userId
          ? (payload.assignments[userId] as PlayerColor | undefined)
          : undefined;
        console.info('[Nakama][snapshot]', {
          matchId: payload.matchId,
          revision: payload.revision,
          assignedPlayerColor: assignedColorFromSnapshot ?? null,
          phase: payload.gameState.phase,
          turn: payload.gameState.currentTurn,
          roll: payload.gameState.rollValue,
          lightFinished: payload.gameState.light.finishedCount,
          darkFinished: payload.gameState.dark.finishedCount,
        });
        applyServerSnapshot(payload.gameState, payload.revision, payload.matchId);
        if (userId) {
          const assignedColor = assignedColorFromSnapshot;
          if (assignedColor) {
            setPlayerColor(assignedColor);
          }
        }
        return;
      }

      if (matchData.op_code === MatchOpCode.SERVER_ERROR) {
        if (isServerErrorPayload(payload)) {
          console.warn('[Nakama][server_error]', {
            code: payload.code,
            message: payload.message,
            revision: payload.revision ?? null,
          });
        }
        return;
      }

      if (matchData.op_code === MatchOpCode.PROGRESSION_AWARD) {
        if (!isProgressionAwardNotificationPayload(payload)) {
          return;
        }

        const award = stripProgressionAwardEnvelope(payload);
        console.info('[Nakama][progression_award]', {
          matchId: award.matchId,
          awardedXp: award.awardedXp,
          newTotalXp: award.newTotalXp,
          newRank: award.newRank,
          rankChanged: award.rankChanged,
        });
        setLastProgressionAward(award);
        return;
      }

      if (matchData.op_code === MatchOpCode.ELO_RATING_UPDATE) {
        if (!isEloRatingChangeNotificationPayload(payload)) {
          return;
        }

        console.info('[Nakama][elo_rating_update]', {
          matchId: payload.matchId,
          playerDelta: payload.player.delta,
          playerNewRating: payload.player.newRating,
          opponentDelta: payload.opponent.delta,
          playerRank: payload.player.rank ?? null,
        });
        setLastEloRatingChange(payload);
      }
    };

    const handleMatchPresence = (matchPresence: MatchPresenceEvent) => {
      if (matchPresence.match_id !== matchId) return;
      updateMatchPresences(matchPresence);
    };

    const attachSocketHandlers = (socket: Socket) => {
      socketRef.current = socket;
      socket.onmatchdata = handleMatchData;
      socket.onmatchpresence = handleMatchPresence;
      socket.ondisconnect = () => {
        nakamaService.disconnectSocket(false);
        setSocketState('disconnected');
        if (reconnectTimerRef.current) {
          return;
        }
        reconnectTimerRef.current = setTimeout(() => {
          reconnectTimerRef.current = null;
          void connectAndJoin();
        }, 1500);
      };
    };

    const connectAndJoin = async () => {
      try {
        setSocketState('connecting');
        const socket = await nakamaService.connectSocketWithRetry({
          attempts: 3,
          retryDelayMs: 1_000,
          createStatus: true,
        });
        attachSocketHandlers(socket);
        const match = effectiveMatchToken
          ? await socket.joinMatch(matchId, effectiveMatchToken)
          : await socket.joinMatch(matchId);
        if (!isMounted) return;
        setMatchPresences([
          match.self.user_id,
          ...match.presences.map((presence) => presence.user_id),
        ]);
        setMatchId(match.match_id);
        setSocketState('connected');
      } catch (error) {
        console.error(error);
        setSocketState('error');
      }
    };

    void connectAndJoin();

    return () => {
      isMounted = false;
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
      if (!isOffline && socketRef.current && matchId) {
        void socketRef.current.leaveMatch(matchId).catch(() => { });
      }
      if (socketRef.current) {
        socketRef.current.onmatchdata = () => { };
        socketRef.current.onmatchpresence = () => { };
        socketRef.current.ondisconnect = () => { };
      }
    };
  }, [
    applyServerSnapshot,
    isOffline,
    matchId,
    effectiveMatchToken,
    setMatchId,
    setLastProgressionAward,
    setOnlineMode,
    setPlayerColor,
    setSocketState,
    setMatchPresences,
    updateMatchPresences,
    userId,
  ]);
  useEffect(() => {
    if (!matchId) return;
    if (isOffline) {
      setRollCommandSender(null);
      setMoveCommandSender(null);
      return;
    }

    const sendRoll = async () => {
      const socket = socketRef.current;
      if (!socket) return;
      const payload: RollRequestPayload = { type: 'roll_request' };
      console.info('[Nakama][send]', {
        eventType: payload.type,
        matchId,
        revision: serverRevision,
        payload,
      });
      await socket.sendMatchState(matchId, MatchOpCode.ROLL_REQUEST, encodePayload(payload));
    };

    const sendMove = async (move: { pieceId: string; fromIndex: number; toIndex: number }) => {
      const socket = socketRef.current;
      if (!socket) return;
      const payload: MoveRequestPayload = { type: 'move_request', move };
      console.info('[Nakama][send]', {
        eventType: payload.type,
        matchId,
        revision: serverRevision,
        payload,
      });
      await socket.sendMatchState(matchId, MatchOpCode.MOVE_REQUEST, encodePayload(payload));
    };

    setRollCommandSender(sendRoll);
    setMoveCommandSender(sendMove);

    return () => {
      setRollCommandSender(null);
      setMoveCommandSender(null);
    };
  }, [isOffline, matchId, serverRevision, setMoveCommandSender, setRollCommandSender]);
  useEffect(() => {
    return () => {
      clearRollTimer();
      if (autoRollTimerRef.current) {
        clearTimeout(autoRollTimerRef.current);
        autoRollTimerRef.current = null;
      }
      if (scoreBannerTimerRef.current) {
        clearTimeout(scoreBannerTimerRef.current);
      }
    };
  }, [clearRollTimer]);
  useEffect(() => {
    void gameAudio.start();

    return () => {
      void gameAudio.stopAll();
    };
  }, []);
  useEffect(() => {
    let isMounted = true;

    const loadPreferences = async () => {
      const [audioPreferences, matchPreferences] = await Promise.all([
        gameAudio.getPreferences(),
        getMatchPreferences(),
      ]);

      if (!isMounted) {
        return;
      }

      setMusicEnabled(audioPreferences.musicEnabled);
      setMusicVolume(audioPreferences.musicVolume);
      setSfxEnabled(audioPreferences.sfxEnabled);
      setSfxVolume(audioPreferences.sfxVolume);
      setAnnouncementCuesEnabled(matchPreferences.announcementCuesEnabled);
      setBotTimerEnabled(matchPreferences.timerEnabled);
      setTurnTimerSeconds(matchPreferences.timerDurationSeconds);
      setDiceAnimationEnabled(matchPreferences.diceAnimationEnabled);
      setDiceAnimationSpeed(matchPreferences.diceAnimationSpeed);
      setBugAnimationEnabled(matchPreferences.bugAnimationEnabled);
      setAutoRollEnabled(matchPreferences.autoRollEnabled);
      setMoveHintEnabled(matchPreferences.moveHintEnabled);
    };

    void loadPreferences();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const previousSnapshot = previousStateRef.current;
    if (previousSnapshot.matchId !== (matchId ?? null)) {
      offlineMatchTelemetryRef.current = createOfflineMatchTelemetry();
      previousStateRef.current = { matchId: matchId ?? null, state: gameState };
      return;
    }

    if (tutorialHydratingStateRef.current) {
      tutorialHydratingStateRef.current = false;
      previousStateRef.current = { matchId: matchId ?? null, state: gameState };
      return;
    }

    const previous = previousSnapshot.state;
    const isBotRoll = isOffline && gameState.currentTurn === 'dark';
    const rollValueChanged = previous.rollValue !== gameState.rollValue;
    let shouldSkipResolvedRollAudio = false;
    const newHistoryEntries =
      gameState.history.length > previous.history.length ? gameState.history.slice(previous.history.length) : [];

    if (isOffline) {
      if (rollValueChanged && gameState.rollValue !== null) {
        offlineMatchTelemetryRef.current = recordOfflineRoll(
          offlineMatchTelemetryRef.current,
          previous.currentTurn,
          gameState.rollValue,
        );
      }

      if (newHistoryEntries.length > 0) {
        offlineMatchTelemetryRef.current = recordOfflineHistoryEntries(
          offlineMatchTelemetryRef.current,
          gameState,
          newHistoryEntries,
        );
      }
    }

    if (rollValueChanged && gameState.rollValue !== null) {
      shouldSkipResolvedRollAudio = localRollAudioPendingRef.current;
      localRollAudioPendingRef.current = false;
    }

    if (rollValueChanged && gameState.rollValue !== null && !shouldSkipResolvedRollAudio && !rollingVisual && !isBotRoll) {
      void gameAudio.play('roll');
    }

    if (newHistoryEntries.length > 0) {
      for (const entry of newHistoryEntries) {
        if (entry.includes('captured')) {
          void gameAudio.play('capture');
        } else if (entry.includes('moved to')) {
          void gameAudio.play('move');
        }

        if (!playerColor) {
          continue;
        }

        const moveMatch = entry.match(LOCAL_MOVE_HISTORY_RE);
        if (moveMatch && moveMatch[1] === playerColor && moveMatch[2] === 'true') {
          enqueueMatchCue('rosette');
        }
      }
    }

    if (
      gameState.light.finishedCount > previous.light.finishedCount ||
      gameState.dark.finishedCount > previous.dark.finishedCount
    ) {
      void gameAudio.play('score');

      if (hasAssignedColor) {
        const didIScore =
          playerColor === 'light'
            ? gameState.light.finishedCount > previous.light.finishedCount
            : gameState.dark.finishedCount > previous.dark.finishedCount;

        if (didIScore) {
          setShowScoreBanner(true);
          if (scoreBannerTimerRef.current) {
            clearTimeout(scoreBannerTimerRef.current);
          }
          scoreBannerTimerRef.current = setTimeout(() => {
            setShowScoreBanner(false);
            scoreBannerTimerRef.current = null;
          }, 1500);
        }
      }
    }

    if (!previous.winner && gameState.winner) {
      const resultCue = hasAssignedColor ? (didPlayerWin ? 'win' : 'lose') : 'win';
      void gameAudio.play(resultCue);
    }

    previousStateRef.current = { matchId: matchId ?? null, state: gameState };
  }, [
    didPlayerWin,
    enqueueMatchCue,
    diceAnimationEnabled,
    gameState,
    hasAssignedColor,
    isOffline,
    matchId,
    playerColor,
    rollingVisual,
    validMoves.length,
  ]);

  const handleBoardMove = React.useCallback(
    (move: MoveAction) => {
      resumeAnnouncementCuesFromInteraction();

      if (!isPrivateMatchReady) {
        return;
      }

      if (isScriptedTutorialPhase) {
        handleTutorialMove(move);
        return;
      }

      makeMove(move);
    },
    [handleTutorialMove, isPrivateMatchReady, isScriptedTutorialPhase, makeMove, resumeAnnouncementCuesFromInteraction],
  );

  const handleRoll = React.useCallback(() => {
    resumeAnnouncementCuesFromInteraction();

    if (isScriptedTutorialPhase) {
      if (tutorialCoachPhase === 'lesson_play' && tutorialSegment) {
        triggerTutorialRoll(tutorialSegment.forcedRoll);
      }
      return;
    }

    triggerLocalRoll();
  }, [
    isScriptedTutorialPhase,
    resumeAnnouncementCuesFromInteraction,
    triggerLocalRoll,
    triggerTutorialRoll,
    tutorialCoachPhase,
    tutorialSegment,
  ]);

  const handleToggleMusic = async (enabled: boolean) => {
    setMusicEnabled(enabled);
    await gameAudio.setMusicEnabled(enabled);
  };

  const handleSetMusicVolume = async (volume: number) => {
    setMusicVolume(volume);
    await gameAudio.setMusicVolume(volume);
  };

  const handleToggleSfx = async (enabled: boolean) => {
    setSfxEnabled(enabled);
    await gameAudio.setSfxEnabled(enabled);
  };

  const handleSetSfxVolume = async (volume: number) => {
    setSfxVolume(volume);
    await gameAudio.setSfxVolume(volume);
  };

  const handleToggleAnnouncementCues = async (enabled: boolean) => {
    setAnnouncementCuesEnabled(enabled);
    await updateMatchPreferences({ announcementCuesEnabled: enabled });
  };

  const handleToggleDiceAnimation = async (enabled: boolean) => {
    setDiceAnimationEnabled(enabled);
    await updateMatchPreferences({ diceAnimationEnabled: enabled });
  };

  const handleSetDiceAnimationSpeed = async (speed: DiceAnimationSpeed) => {
    setDiceAnimationSpeed(speed);
    await updateMatchPreferences({ diceAnimationSpeed: speed });
  };

  const handleToggleBugAnimation = async (enabled: boolean) => {
    setBugAnimationEnabled(enabled);
    await updateMatchPreferences({ bugAnimationEnabled: enabled });
  };

  const handleToggleAutoRoll = async (enabled: boolean) => {
    setAutoRollEnabled(enabled);
    await updateMatchPreferences({ autoRollEnabled: enabled });
  };

  const handleToggleMoveHint = async (enabled: boolean) => {
    setMoveHintEnabled(enabled);
    await updateMatchPreferences({ moveHintEnabled: enabled });
  };

  const handleToggleBotTimer = async (enabled: boolean) => {
    forceMoveAfterRollRef.current = false;
    setBotTimerEnabled(enabled);

    if (enabled) {
      setTurnTimerCycleId((current) => current + 1);
    }

    await updateMatchPreferences({ timerEnabled: enabled });
  };

  const handleSetTurnTimerDuration = async (seconds: TurnTimerSeconds) => {
    setTurnTimerSeconds(seconds);
    setTurnTimerCycleId((current) => current + 1);
    await updateMatchPreferences({ timerDurationSeconds: seconds });
  };

  const handleExit = () => {
    setShowTopMenu(false);
    if (!isOffline && socketRef.current && matchId) {
      void socketRef.current.leaveMatch(matchId).catch(() => { });
      nakamaService.disconnectSocket(true);
    }
    setShowWinModal(false);
    reset();
    router.replace('/');
  };

  const lightReserve = gameState.light.pieces.filter((piece) => !piece.isFinished && piece.position === -1).length;
  const darkReserve = gameState.dark.pieces.filter((piece) => !piece.isFinished && piece.position === -1).length;
  const normalizedMatchNumber = matchId ? matchId.replace(/^local-/, '') : null;
  const matchTitle = isPlaythroughTutorialMatch
    ? 'Play Tutorial'
    : isPrivateMatch
      ? 'Private Match'
      : isPracticeModeMatch
        ? effectiveMatchConfig.displayName
        : isOffline
          ? 'Local Match'
          : 'Online Match';

  const viewportHorizontalPadding = 0;
  const stageContentWidth = Math.min(Math.max(viewportWidth - viewportHorizontalPadding * 2, 0), urTheme.layout.stage.maxWidth);
  const useSideColumns = viewportWidth >= 760;
  const isWebLayout = Platform.OS === 'web';
  const isMobileWebLayout = isWebLayout && viewportWidth < 760;
  const isMobileLayout = viewportWidth < 760;
  const useMobileSideReserveRails = viewportWidth < 760;
  const showWebSideDiceVisual = Platform.OS === 'web' && useSideColumns;
  const boardClusterGap = useSideColumns || useMobileSideReserveRails ? urTheme.spacing.xs : urTheme.spacing.sm;
  const sideColumnWidth = useSideColumns
    ? Math.max(88, Math.min(264, Math.floor(stageContentWidth * (viewportWidth < 720 ? 0.2 : 0.24))))
    : 0;
  const mobileReserveColumnWidth = useMobileSideReserveRails
    ? Math.max(52, Math.min(80, Math.round(stageContentWidth * 0.16)))
    : 0;
  const boardWidthLimitByLayout = useSideColumns
    ? Math.max(
      224,
      Math.min(urTheme.layout.boardMax, stageContentWidth - sideColumnWidth * 2 - boardClusterGap * 2),
    )
    : useMobileSideReserveRails
      ? Math.max(
        160,
        Math.min(urTheme.layout.boardMax, stageContentWidth - mobileReserveColumnWidth * 2 - boardClusterGap * 2),
      )
      : Math.max(224, Math.min(urTheme.layout.boardMax, stageContentWidth - 2));

  // Must match Board.tsx base width before boardScale is applied.
  const boardBaseWidth = Math.min(Math.max(viewportWidth - urTheme.spacing.lg, 0), urTheme.layout.boardMax);
  const boardFramePadding = urTheme.spacing.sm;
  const boardInnerPadding = urTheme.spacing.xs;
  const boardGridGap = 0;
  // Keep these ratios in sync with the vertical board art fit in Board.tsx.
  const boardArtInsetTop = 0.024;
  const boardArtInsetBottom = 0.018;
  const boardArtInsetLeft = 0.36;
  const boardArtInsetRight = 0.385;
  const boardOuterPadding = boardFramePadding * 2 + boardInnerPadding * 2;
  const verticalBoardRows = BOARD_COLS;
  const verticalBoardCols = BOARD_ROWS;
  const verticalBoardGapTotal = (verticalBoardRows - 1) * boardGridGap;
  const boardSlotWidth = boardSlotSize.width > 0 ? boardSlotSize.width : boardWidthLimitByLayout;
  const boardSlotHeight = boardSlotSize.height > 0 ? boardSlotSize.height : Math.max(0, viewportHeight * (useSideColumns ? 0.9 : 0.45));
  const boardWidthLimitByHeight = Math.min(
    urTheme.layout.boardMax,
    boardOuterPadding +
    (Math.max(0, boardSlotHeight - boardOuterPadding - verticalBoardGapTotal) * verticalBoardCols) /
    verticalBoardRows,
  );
  const widenedBoardLayoutTarget = Math.min(urTheme.layout.boardMax, boardWidthLimitByLayout * 1.5);
  const targetBoardWidth = Math.max(110, Math.min(widenedBoardLayoutTarget, boardWidthLimitByHeight, boardSlotWidth));
  const mobileBoardScaleBoost = isMobileLayout ? 1.28 : 1;
  const mobileBoardScaleCap = isMobileLayout ? 1.28 : 1.2;
  const baseBoardScale = Math.max(
    0.24,
    Math.min(mobileBoardScaleCap, (targetBoardWidth / Math.max(boardBaseWidth, 1)) * mobileBoardScaleBoost),
  );
  const boardScale = useMobileSideReserveRails ? baseBoardScale * 0.8 : baseBoardScale;
  const reservePiecePixelSize = useMemo(
    () => getBoardPiecePixelSize({ viewportWidth, boardScale, orientation: 'vertical' }),
    [boardScale, viewportWidth],
  );
  const compactSupportUi = viewportWidth <= 1024;
  const scaledReservePiecePixelSize = compactSupportUi
    ? Math.max(12, Math.round(reservePiecePixelSize * (viewportWidth < 760 ? 0.864 : 0.84)))
    : reservePiecePixelSize;
  const stageGap = viewportHeight < 760 ? urTheme.spacing.xs : urTheme.spacing.sm;
  const viewportTopPadding = 0;
  const viewportBottomPadding = Math.max(insets.bottom, urTheme.spacing.xs);
  const topChromeHeight = 36;
  const webTopChromeTopInset = Math.max(insets.top, urTheme.spacing.xs);
  const mobileTopChromeOffset = 0;
  const topChromeTop = isWebLayout && boardTargetFrame
    ? Math.round(
      webTopChromeTopInset +
      Math.max(0, boardTargetFrame.y - webTopChromeTopInset - topChromeHeight) / 2,
    )
    : insets.top + mobileTopChromeOffset;
  const topChromeBottom = topChromeTop + topChromeHeight;
  const scoreOverlayTop = topChromeBottom + urTheme.spacing.xs;
  const useInlineTopChromeLayout = isMobileLayout || isWebLayout;
  const backdropOverscan = Math.ceil(Math.max(viewportWidth, viewportHeight) * 0.025);
  const canvasTopEdgeLift = Math.max(24, Math.min(96, Math.round(viewportHeight * 0.07)));
  const supportColumnBottomInset = Math.max(viewportBottomPadding + Math.round(viewportHeight * 0.02), urTheme.spacing.sm);
  const supportColumnTopInset = Math.max(
    scoreOverlayTop + urTheme.spacing.sm,
    Math.round(viewportHeight * 0.74) - (compactSupportUi ? 188 : 244),
  );
  const measuredScoreRowHeight = Math.max(
    mobileScoreRowHeight,
    isMobileLayout ? Math.round(urTheme.spacing.md + 34) : 56,
  );
  const webDiceVisualTopInset = showWebSideDiceVisual ? scoreOverlayTop + measuredScoreRowHeight : 0;
  const webDiceVisualSlotHeight = showWebSideDiceVisual
    ? Math.max(0, supportColumnTopInset - webDiceVisualTopInset)
    : 0;
  const webRollButtonSize = showWebSideDiceVisual
    ? Math.min(Math.max(Math.round(sideColumnWidth * 0.42), 88), compactSupportUi ? 104 : 112)
    : 0;
  const webHourglassSize = showWebSideDiceVisual
    ? Math.max(44, Math.round(webRollButtonSize / HOURGLASS_HEIGHT_RATIO))
    : 0;
  const webCountdownFontSize = showWebSideDiceVisual
    ? Math.max(34, Math.round(webRollButtonSize * 0.38))
    : 0;
  const webRollResultFontSize = Math.round(webCountdownFontSize * 1.69);
  const mobileWebDiceVisualFrame = useMemo(() => {
    if (useMobileSideReserveRails || !isMobileWebLayout || !boardTargetFrame) {
      return null;
    }

    const width = Math.min(216, Math.max(168, Math.round(boardTargetFrame.width * 0.72)));
    const height = Math.max(84, Math.round(width * 0.42));
    const left = Math.max(urTheme.spacing.xs, Math.round(boardTargetFrame.x - width * 0.18));
    const top = Math.round(boardTargetFrame.y + boardTargetFrame.height * 0.62 - height / 2);

    return {
      height,
      left,
      top,
      width,
    };
  }, [boardTargetFrame, isMobileWebLayout, useMobileSideReserveRails]);
  const showMobileWebDetachedDiceVisual = mobileWebDiceVisualFrame !== null;
  const mobileStatusRowHeight = Math.max(
    mobileScoreRowHeight,
    Math.round(urTheme.spacing.md + 34),
  );
  const mobileBoardVisualOffset = isMobileLayout
    ? useMobileSideReserveRails
      ? 0
      : Math.max(urTheme.spacing.md, Math.round(viewportHeight * 0.024))
    : 0;
  const mobileBoardTopGap = Math.max(2, Math.round(viewportHeight * 0.003));
  const mobileWebBoardLift = useMobileSideReserveRails
    ? Math.max(urTheme.spacing.sm, Math.round(viewportHeight * 0.042))
    : 0;
  const mobileHeaderLift = mobileWebBoardLift;
  const mobileChromeToScoreGap = isMobileLayout
    ? Math.max(4, Math.round(viewportHeight * 0.005))
    : 0;
  const baseMobileScoreOverlayTop = isMobileLayout
    ? topChromeBottom + mobileChromeToScoreGap
    : scoreOverlayTop;
  const baseMobileBoardOffsetTop = isMobileLayout
    ? baseMobileScoreOverlayTop + mobileStatusRowHeight + mobileBoardTopGap - mobileWebBoardLift
    : 0;
  const mobileScoreRowInset = Math.max(urTheme.spacing.xs, Math.round(viewportWidth / 65));
  const mobileDarkScoreNudge = isMobileLayout
    ? Math.max(4, Math.round(viewportWidth * 0.012))
    : 0;
  const mobileSupportOffsetTop = isMobileLayout
    ? Math.max(urTheme.spacing.md, Math.round(viewportHeight * 0.04))
    : 0;
  const mobileLowerClusterShift = isMobileLayout
    ? useMobileSideReserveRails
      ? Math.max(urTheme.spacing.xs, Math.round(viewportHeight * 0.012))
      : Math.max(urTheme.spacing.md, Math.round(viewportHeight * 0.024))
    : 0;
  const mobileTrayDockShift = isMobileLayout
    ? Math.max(insets.bottom, urTheme.spacing.xs)
    : 0;
  const mobileSupportVisualOffset = isMobileLayout ? mobileSupportOffsetTop + mobileTrayDockShift : 0;
  const mobileTrayVisualOffset = isMobileLayout ? mobileSupportOffsetTop + mobileLowerClusterShift : 0;
  const mobileRollResultOffset = isMobileLayout
    ? useMobileSideReserveRails
      ? 0
      : Math.max(0, mobileSupportVisualOffset - urTheme.spacing.sm + mobileLowerClusterShift)
    : 0;
  const mobileBottomDockGap = isMobileLayout
    ? 0
    : 0;
  const mobileWebRollButtonArtSize = useMobileSideReserveRails
    ? Math.min(Math.max(Math.round(stageContentWidth * 0.22), 84), 102)
    : 0;
  const mobileDiceDockWidth = useMobileSideReserveRails
    ? mobileWebRollButtonArtSize
    : Math.min(Math.max(Math.round(stageContentWidth * 0.46), 176), 248);
  const mobileReserveRailTopOffset = useMobileSideReserveRails
    ? Math.max(6, Math.round(mobileReserveColumnWidth * 0.14))
    : 0;
  const mobileWebUnderBoardDiceFrame = useMemo(() => {
    if (!useMobileSideReserveRails || !boardTargetFrame) {
      return null;
    }

    const overlayWidth = mobileWebRollButtonArtSize;
    const boardColumnCenterRatio = 0.4875;
    const boardGridBottom = boardTargetFrame.y + boardTargetFrame.height * (1 - boardArtInsetBottom);
    const bottomBoundary = viewportHeight - viewportBottomPadding;
    const centeredTop = boardGridBottom + Math.max(0, bottomBoundary - boardGridBottom - overlayWidth) / 2;
    const left = Math.max(
      urTheme.spacing.xs,
      Math.min(
        Math.max(urTheme.spacing.xs, viewportWidth - overlayWidth - urTheme.spacing.xs),
        Math.round(boardTargetFrame.x + boardTargetFrame.width * boardColumnCenterRatio - overlayWidth / 2),
      ),
    );
    const top = Math.round(centeredTop);

    return {
      left,
      top,
      width: overlayWidth,
    };
  }, [
    boardArtInsetBottom,
    boardTargetFrame,
    mobileWebRollButtonArtSize,
    useMobileSideReserveRails,
    viewportBottomPadding,
    viewportHeight,
    viewportWidth,
  ]);
  const showMobileWebUnderBoardDiceOverlay = isWebLayout && mobileWebUnderBoardDiceFrame !== null;

  const mobileBoardGapFrame = useMemo(() => {
    if (!isMobileLayout || !useMobileSideReserveRails || isWebLayout || !boardTargetFrame) return null;

    const gridLeft = boardTargetFrame.x + boardTargetFrame.width * boardArtInsetLeft;
    const gridWidth = boardTargetFrame.width * (1 - boardArtInsetLeft - boardArtInsetRight);
    const gridTop = boardTargetFrame.y + boardTargetFrame.height * boardArtInsetTop;
    const gridHeight = boardTargetFrame.height * (1 - boardArtInsetTop - boardArtInsetBottom);
    const cellWidth = gridWidth / verticalBoardCols;
    const rowHeight = gridHeight / verticalBoardRows;

    // Gap rows 4 and 5 (0-indexed) — the narrow passage between the two player sections
    const gapTop = gridTop + 4 * rowHeight;
    const gapHeight = 2 * rowHeight;

    return {
      left: {
        left: Math.round(gridLeft),
        top: Math.round(gapTop),
        width: Math.round(cellWidth),
        height: Math.round(gapHeight),
      },
      right: {
        left: Math.round(gridLeft + 2 * cellWidth),
        top: Math.round(gapTop),
        width: Math.round(cellWidth),
        height: Math.round(gapHeight),
      },
      cellSize: Math.round(cellWidth),
    };
  }, [
    boardArtInsetBottom,
    boardArtInsetLeft,
    boardArtInsetRight,
    boardArtInsetTop,
    boardTargetFrame,
    isMobileLayout,
    isWebLayout,
    useMobileSideReserveRails,
    verticalBoardCols,
    verticalBoardRows,
  ]);
  const showMobileBoardGapDice = !isWebLayout && useMobileSideReserveRails && mobileBoardGapFrame !== null;
  const shouldDetachDiceVisual =
    isMatchStageExternal ||
    showWebSideDiceVisual ||
    showMobileWebDetachedDiceVisual ||
    showMobileBoardGapDice;
  const detachedDiceVisualPlacement = shouldDetachDiceVisual ? 'external' : 'embedded';

  const mobileScoreOverlayTop = baseMobileScoreOverlayTop + mobileContentVerticalShift;
  const mobileBoardOffsetTop = baseMobileBoardOffsetTop + mobileContentVerticalShift;

  const reserveCascadeTargets = useMemo<ReserveCascadePieceTarget[]>(() => {
    const orderedLight = [...lightReserveSlots].sort((a, b) => a.index - b.index);
    const orderedDark = [...darkReserveSlots].sort((a, b) => a.index - b.index);

    return [...orderedLight, ...orderedDark].map((slot, index) => ({
      key: `${slot.color}-${slot.index}`,
      color: slot.color,
      x: slot.x,
      y: slot.y,
      size: slot.size,
      order: index,
    }));
  }, [darkReserveSlots, lightReserveSlots]);

  useEffect(() => {
    if (!isMobileLayout || !useMobileSideReserveRails) {
      setMobileContentVerticalShift((current) => (current === 0 ? current : 0));
      setHasResolvedMobileContentShift(true);
      return;
    }

    if (hasResolvedMobileContentShift || !mobileWebUnderBoardDiceFrame) {
      return;
    }

    setMobileContentVerticalShift(0);
    setHasResolvedMobileContentShift(true);
  }, [
    hasResolvedMobileContentShift,
    isMobileLayout,
    mobileWebUnderBoardDiceFrame,
    useMobileSideReserveRails,
  ]);
  const mobileContentShiftSettled =
    !isMobileLayout ||
    !useMobileSideReserveRails ||
    (() => {
      if (!hasResolvedMobileContentShift || mobileWebUnderBoardDiceFrame === null) {
        return false;
      }

      return true;
    })();
  const isBoardTargetFrameReady =
    boardTargetFrame !== null &&
    boardTargetFrame.width > 0 &&
    boardTargetFrame.height > 0 &&
    boardSlotSize.width > 0 &&
    boardSlotSize.height > 0 &&
    (!isMobileLayout || mobileScoreRowHeight > 0) &&
    mobileContentShiftSettled;

  useEffect(() => {
    syncBoardTargetFrame();
  }, [boardScale, mobileBoardVisualOffset, mobileScoreRowHeight, syncBoardTargetFrame]);

  const shouldHideReservePieces =
    !SHOULD_BYPASS_CINEMATIC_INTROS &&
    !hasPlayedReserveCascadeIntro &&
    hasMeasuredReserveTargets;
  const isTurnTimerEnabled = introsComplete && !isScriptedTutorialPhase && (!isOffline || botTimerEnabled);
  const isVisualTurnTimerRunning =
    isTurnTimerEnabled && isPrivateMatchReady && gameState.phase !== 'ended' && gameState.winner === null;
  const showPersistentDiceVisual = introsComplete && diceAnimationEnabled;
  const showDestinationHighlights = introsComplete && !rollingVisual && gameState.rollValue !== null;
  const displayedValidMoves = showDestinationHighlights && isPrivateMatchReady ? validMoves : [];
  const showMobileRollResult =
    introsComplete &&
    isMobileLayout &&
    !rollingVisual &&
    gameState.rollValue !== null &&
    (!diceAnimationEnabled || gameState.rollValue !== 0);
  const showWebRollResult = introsComplete && showWebSideDiceVisual && !rollingVisual && gameState.rollValue !== null;
  const showMobileWebDetachedDarkScore = useMobileSideReserveRails && darkTrayFrame !== null;
  const mobileWebDetachedDarkScoreFrame = useMemo(() => {
    if (!useMobileSideReserveRails || !darkTrayFrame) {
      return null;
    }

    const overlayWidth = Math.max(54, Math.round(darkTrayFrame.width));
    const left = Math.max(
      urTheme.spacing.xs,
      Math.min(
        Math.max(urTheme.spacing.xs, viewportWidth - overlayWidth - urTheme.spacing.xs),
        Math.round(darkTrayFrame.x + darkTrayFrame.width / 2 - overlayWidth / 2),
      ),
    );

    return {
      left,
      top: mobileScoreOverlayTop - mobileHeaderLift,
      width: overlayWidth,
    };
  }, [darkTrayFrame, mobileHeaderLift, mobileScoreOverlayTop, useMobileSideReserveRails, viewportWidth]);
  const mobileWebTrayRollResultFrame = useMemo(() => {
    if (
      !useMobileSideReserveRails ||
      !lightTrayFrame ||
      !boardTargetFrame ||
      !showMobileRollResult ||
      gameState.rollValue === null
    ) {
      return null;
    }

    const resultWidth = Math.max(44, Math.min(72, Math.round(lightTrayFrame.width * 0.94)));
    const resultHeight = Math.max(36, Math.round(resultWidth * 0.84));
    const gridTop = boardTargetFrame.y + boardTargetFrame.height * boardArtInsetTop;
    const gridHeight = boardTargetFrame.height * (1 - boardArtInsetTop - boardArtInsetBottom);
    const middleColumnSixthTileIndex = 5;
    const tileCenterY = gridTop + ((middleColumnSixthTileIndex + 0.5) * gridHeight) / verticalBoardRows;
    const left = Math.max(
      urTheme.spacing.xs,
      Math.min(
        Math.max(urTheme.spacing.xs, viewportWidth - resultWidth - urTheme.spacing.xs),
        Math.round(lightTrayFrame.x + lightTrayFrame.width / 2 - resultWidth / 2),
      ),
    );

    return {
      height: resultHeight,
      left,
      top: Math.round(tileCenterY - resultHeight / 2),
      width: resultWidth,
    };
  }, [
    boardArtInsetBottom,
    boardArtInsetTop,
    boardTargetFrame,
    gameState.rollValue,
    lightTrayFrame,
    showMobileRollResult,
    useMobileSideReserveRails,
    verticalBoardRows,
    viewportWidth,
  ]);
  useEffect(() => {
    if (useMobileSideReserveRails) {
      return;
    }

    setLightTrayFrame(null);
    setDarkTrayFrame(null);
  }, [useMobileSideReserveRails]);
  useEffect(() => {
    if (hasPlayedBoardDropIntro || showBoardDropIntro || boardDropTargetFrame) return;
    if (!isBoardTargetFrameReady || !boardTargetFrame) return;

    const timer = setTimeout(
      () => {
        captureBoardDropTargetFrame();
      },
      isMobileLayout ? 120 : 0,
    );

    return () => {
      clearTimeout(timer);
    };
  }, [
    boardDropTargetFrame,
    boardTargetFrame,
    captureBoardDropTargetFrame,
    hasPlayedBoardDropIntro,
    isMobileLayout,
    isBoardTargetFrameReady,
    showBoardDropIntro,
  ]);
  useEffect(() => {
    if (hasPlayedBoardDropIntro || showBoardDropIntro || isBoardTargetFrameReady) {
      return;
    }

    if (!hasBoardArtLayout) {
      return;
    }

    const timer = setTimeout(() => {
      setHasPlayedBoardDropIntro(true);
    }, BOARD_INTRO_FALLBACK_DELAY_MS);

    return () => {
      clearTimeout(timer);
    };
  }, [
    hasPlayedBoardDropIntro,
    hasBoardArtLayout,
    isBoardTargetFrameReady,
    showBoardDropIntro,
  ]);
  useEffect(() => {
    if (!hasPlayedBoardDropIntro) return;
    if (hasPlayedReserveCascadeIntro || showReserveCascadeIntro) return;
    if (reserveCascadeTargets.length === 0) return;
    if (lightReserveSlots.length !== lightReserve) return;
    if (darkReserveSlots.length !== darkReserve) return;

    setFrozenReserveCascadeTargets(reserveCascadeTargets.map((target) => ({ ...target })));
    setShowReserveCascadeIntro(true);
  }, [
    darkReserve,
    darkReserveSlots.length,
    hasPlayedBoardDropIntro,
    hasPlayedReserveCascadeIntro,
    lightReserve,
    lightReserveSlots.length,
    reserveCascadeTargets.length,
    showReserveCascadeIntro,
    reserveCascadeTargets,
  ]);

  const liveBoard = (
    <View
      ref={boardMeasureRef}
      collapsable={false}
      onLayout={syncBoardTargetFrame}
      style={[
        styles.liveBoardMeasure,
        isMobileLayout && { transform: [{ translateY: mobileBoardVisualOffset }] },
      ]}
    >
      <View style={[styles.liveBoardWrap, !hasPlayedBoardDropIntro && styles.liveBoardHidden]}>
        <Board
          autoMoveHintEnabled={moveHintEnabled}
          showRailHints
          highlightMode="theatrical"
          validMovesOverride={displayedValidMoves}
          onMakeMoveOverride={handleBoardMove}
          onInteraction={resumeAnnouncementCuesFromInteraction}
          boardScale={boardScale}
          orientation="vertical"
          onBoardImageLayout={handleLiveBoardImageLayout}
        />
      </View>
    </View>
  );

  const boardIntroContent = (
    <Board
      autoMoveHintEnabled={moveHintEnabled}
      showRailHints
      highlightMode="theatrical"
      validMovesOverride={displayedValidMoves}
      boardScale={boardScale}
      orientation="vertical"
      allowInteraction={false}
    />
  );

  return (
    <View
      style={[
        styles.screen,
        isWebLayout
          ? {
            height: viewportHeight,
            maxHeight: viewportHeight,
          }
          : null,
      ]}
    >
      <Stack.Screen options={{ headerShown: false }} />

      <View pointerEvents="none" style={styles.backdropLayer}>
        <Image
          source={UR_BG_IMAGE}
          resizeMode="cover"
          style={[
            styles.backdropImage,
            {
              left: -backdropOverscan - insets.left,
              width: viewportWidth + backdropOverscan * 2 + insets.left + insets.right,
              top: -backdropOverscan - canvasTopEdgeLift - insets.top,
              height: viewportHeight + backdropOverscan * 2 + canvasTopEdgeLift + insets.top + insets.bottom,
            },
          ]}
        />
      </View>

      <AmbientBackgroundEffects
        width={viewportWidth}
        height={viewportHeight}
        centerSafeZone={boardTargetFrame}
        bugEnabled={bugAnimationEnabled}
        dustEnabled={MATCH_AMBIENT_EFFECTS.dustEnabled}
        leafEnabled={MATCH_AMBIENT_EFFECTS.leafEnabled}
        maxVisibleBugs={MATCH_AMBIENT_EFFECTS.maxVisibleBugs}
        maxVisibleLeaves={MATCH_AMBIENT_EFFECTS.maxVisibleLeaves}
        style={styles.ambientLayer}
      />

      {introsComplete && isMatchStageExternal && diceAnimationEnabled ? (
        <MatchDiceRollStage
          boardFrame={boardTargetFrame}
          canRoll={introsComplete && canRoll}
          compact={compactSupportUi}
          durationMs={diceAnimationDurationMs}
          onResultShown={handleRollResultShown}
          rollValue={gameState.rollValue}
          rolling={rollingVisual}
          viewportHeight={viewportHeight}
          viewportWidth={viewportWidth}
          visible={showPersistentDiceVisual}
        />
      ) : null}
      {introsComplete && showMobileWebDetachedDiceVisual && mobileWebDiceVisualFrame ? (
        <View
          pointerEvents="none"
          style={[
            styles.mobileWebDiceVisualOverlay,
            {
              left: mobileWebDiceVisualFrame.left,
              top: mobileWebDiceVisualFrame.top,
              width: mobileWebDiceVisualFrame.width,
              height: mobileWebDiceVisualFrame.height,
            },
          ]}
        >
          <DiceStageVisual
            animationDurationMs={diceAnimationDurationMs}
            value={gameState.rollValue}
            rolling={rollingVisual}
            canRoll={introsComplete && canRoll}
            compact
            onResultShown={handleRollResultShown}
            visible={showPersistentDiceVisual}
          />
        </View>
      ) : null}
      {useMobileSideReserveRails && showMobileWebUnderBoardDiceOverlay && mobileWebUnderBoardDiceFrame ? (
        <View
          style={[
            styles.mobileWebUnderBoardDiceOverlay,
            {
              left: mobileWebUnderBoardDiceFrame.left,
              top: mobileWebUnderBoardDiceFrame.top,
              width: mobileWebUnderBoardDiceFrame.width,
            },
          ]}
        >
          <View style={styles.mobileDiceRow}>
            <View style={styles.mobileDiceWrap}>
              <Dice
                animationDurationMs={diceAnimationDurationMs}
                value={gameState.rollValue}
                rolling={rollingVisual}
                onRoll={handleRoll}
                onResultShown={handleRollResultShown}
                canRoll={introsComplete && canRoll}
                pressedIn={introsComplete ? isRollButtonPressedIn : false}
                mode="stage"
                compact={compactSupportUi}
                showNumericResult={false}
                showStatusCopy={introsComplete}
                showVisual={false}
                visualPlacement={detachedDiceVisualPlacement}
                artSize={mobileWebRollButtonArtSize}
              />
            </View>
          </View>
        </View>
      ) : null}
      {showMobileWebDetachedDarkScore && mobileWebDetachedDarkScoreFrame ? (
        <View
          pointerEvents="none"
          style={[
            styles.mobileWebTrayAlignedOverlay,
            {
              left: mobileWebDetachedDarkScoreFrame.left,
              top: mobileWebDetachedDarkScoreFrame.top,
              width: mobileWebDetachedDarkScoreFrame.width,
            },
          ]}
        >
          <EdgeScore
            side="dark"
            score={gameState.dark.finishedCount}
            maxScore={pieceCountPerSide}
            active={introsComplete && !isMyTurn}
            align="right"
          />
        </View>
      ) : null}
      {mobileWebTrayRollResultFrame ? (
        <View
          pointerEvents="none"
          style={[
            styles.mobileWebTrayAlignedOverlay,
            {
              left: mobileWebTrayRollResultFrame.left,
              top: mobileWebTrayRollResultFrame.top,
              width: mobileWebTrayRollResultFrame.width,
              height: mobileWebTrayRollResultFrame.height,
            },
          ]}
        >
          <Text
            numberOfLines={1}
            style={[
              styles.mobileWebFloatingRollResultValue,
              {
                fontFamily: rollResultFontFamily,
                fontSize: Math.max(28, Math.round(mobileWebTrayRollResultFrame.height * 0.84)),
                lineHeight: Math.max(30, Math.round(mobileWebTrayRollResultFrame.height * 0.88)),
              },
            ]}
          >
            {gameState.rollValue}
          </Text>
        </View>
      ) : null}

      {showMobileBoardGapDice && mobileBoardGapFrame ? (
        <View
          pointerEvents="none"
          style={[
            styles.mobileBoardGapOverlay,
            {
              left: mobileBoardGapFrame.left.left,
              top: mobileBoardGapFrame.left.top,
              width: mobileBoardGapFrame.left.width,
              height: mobileBoardGapFrame.left.height,
            },
          ]}
        >
          <DiceStageVisual
            animationDurationMs={diceAnimationDurationMs}
            value={gameState.rollValue}
            rolling={rollingVisual}
            canRoll={introsComplete && canRoll}
            compact
            onResultShown={handleRollResultShown}
            visible={showPersistentDiceVisual}
          />
        </View>
      ) : null}
      {showMobileBoardGapDice && mobileBoardGapFrame ? (
        <View
          style={[
            styles.mobileBoardGapOverlay,
            {
              left: mobileBoardGapFrame.right.left,
              top: mobileBoardGapFrame.right.top,
              width: mobileBoardGapFrame.right.width,
              height: mobileBoardGapFrame.right.height,
            },
          ]}
        >
          <Dice
            animationDurationMs={diceAnimationDurationMs}
            value={gameState.rollValue}
            rolling={rollingVisual}
            onRoll={handleRoll}
            onResultShown={handleRollResultShown}
            canRoll={introsComplete && canRoll}
            pressedIn={introsComplete ? isRollButtonPressedIn : false}
            mode="stage"
            compact
            showNumericResult={false}
            showStatusCopy={false}
            showVisual={false}
            visualPlacement="external"
            artSize={mobileBoardGapFrame.cellSize}
          />
        </View>
      ) : null}

      <View style={[styles.topChrome, useInlineTopChromeLayout && styles.topChromeMobile, { top: topChromeTop - mobileHeaderLift }]}>
        <View style={[styles.topChromeLeft, useInlineTopChromeLayout && styles.topChromeLeftMobile]}>
          <Pressable
            onPress={handleExit}
            accessibilityRole="button"
            accessibilityLabel="Exit game"
            style={({ pressed }) => [
              styles.topChromeIconButton,
              isWebLayout && styles.topChromeIconButtonWeb,
              isMobileLayout && styles.topChromeIconButtonMobile,
              pressed && styles.headerHelpButtonPressed,
            ]}
          >
            <MaterialIcons
              name="arrow-back"
              size={20}
              color={isMobileLayout || isWebLayout ? urTheme.colors.ivory : TOP_CHROME_ACCENT}
            />
          </Pressable>
          <View style={[styles.topChromeTitleStack, useInlineTopChromeLayout && styles.topChromeTitleStackMobile]}>
            <Text
              numberOfLines={1}
              style={[
                styles.topChromeTitle,
                (isMobileLayout || isWebLayout) && styles.topChromeTitleMobile,
                useInlineTopChromeLayout && styles.topChromeTitleInlineMobile,
              ]}
            >
              {matchTitle}
            </Text>
          </View>
        </View>

        <View style={[styles.topChromeRight, isMobileLayout && styles.topChromeRightMobile]}>
          <Pressable
            onPress={() => {
              resumeAnnouncementCuesFromInteraction();
              setShowTopMenu((current) => !current);
            }}
            accessibilityRole="button"
            accessibilityLabel="Open match menu"
            style={({ pressed }) => [
              styles.topChromeIconButton,
              isWebLayout && styles.topChromeIconButtonWeb,
              isMobileLayout && styles.headerHelpButtonMobile,
              pressed && styles.headerHelpButtonPressed,
            ]}
          >
            <MaterialIcons
              name="more-vert"
              size={20}
              color={isMobileLayout || isWebLayout ? urTheme.colors.ivory : TOP_CHROME_ACCENT}
            />
          </Pressable>

          {showTopMenu && (
            <View style={styles.topMenu}>
              {normalizedMatchNumber ? (
                <View style={[styles.topMenuItem, styles.topMenuInfoItem]}>
                  <MaterialIcons name="info-outline" size={18} color={TOP_CHROME_ACCENT} />
                  <View style={styles.topMenuInfoCopy}>
                    <Text style={styles.topMenuInfoLabel}>Game Number</Text>
                    <Text numberOfLines={1} style={styles.topMenuInfoValue}>
                      #{normalizedMatchNumber}
                    </Text>
                  </View>
                </View>
              ) : null}
              {isPrivateMatchHost && privateMatchCode ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Copy private game code"
                  onPress={() => {
                    resumeAnnouncementCuesFromInteraction();
                    void handleCopyPrivateCode();
                    setShowTopMenu(false);
                  }}
                  style={({ pressed }) => [styles.topMenuItem, pressed && styles.topMenuItemPressed]}
                >
                  <MaterialIcons name="content-copy" size={18} color={TOP_CHROME_ACCENT} />
                  <Text style={styles.topMenuLabel}>Copy Code</Text>
                </Pressable>
              ) : null}
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Open audio settings"
                onPress={() => {
                  resumeAnnouncementCuesFromInteraction();
                  setShowTopMenu(false);
                  setShowAudioSettings(true);
                }}
                style={({ pressed }) => [styles.topMenuItem, pressed && styles.topMenuItemPressed]}
              >
                <MaterialIcons name="settings" size={18} color={TOP_CHROME_ACCENT} />
                <Text style={styles.topMenuLabel}>Settings</Text>
              </Pressable>
            </View>
          )}
        </View>
      </View>

      {showTopMenu && <Pressable style={styles.topMenuScrim} onPress={() => setShowTopMenu(false)} />}

      <View
        style={[
          styles.stageViewport,
          {
            paddingHorizontal: viewportHorizontalPadding,
            paddingTop: viewportTopPadding,
            paddingBottom: viewportBottomPadding,
          },
        ]}
      >
        <View style={[styles.stageWrap, { gap: stageGap }]}>
          {isPrivateMatch ? (
            <View pointerEvents="none" style={[styles.privateStatusBanner, isPrivateMatchReady ? styles.privateStatusBannerReady : null]}>
              <Text style={styles.privateStatusEyebrow}>
                {isPrivateMatchHost ? 'Private Match Code' : 'Joined Private Match'}
              </Text>
              {privateMatchCode ? <Text style={styles.privateStatusCode}>{privateMatchCode}</Text> : null}
              {privateMatchStatusText ? <Text style={styles.privateStatusText}>{privateMatchStatusText}</Text> : null}
            </View>
          ) : null}
          {tutorialObjectiveBanner ? (
            <View pointerEvents="none" style={styles.tutorialObjectiveBanner}>
              <Text style={styles.tutorialObjectiveText}>{tutorialObjectiveBanner}</Text>
            </View>
          ) : null}
          <View
            pointerEvents="none"
            style={[
              styles.scoreRow,
              styles.scoreRowOverlay,
              isMobileLayout && isTurnTimerEnabled && styles.mobileScoreRow,
              { top: mobileScoreOverlayTop - mobileHeaderLift },
              isMobileLayout && styles.scoreRowOverlayMobile,
              isMobileLayout && { left: mobileScoreRowInset, right: mobileScoreRowInset },
            ]}
            onLayout={(event) => {
              const nextHeight = Math.round(event.nativeEvent.layout.height);
              setMobileScoreRowHeight((current) => (current === nextHeight ? current : nextHeight));
            }}
          >
            <EdgeScore
              side="light"
              score={gameState.light.finishedCount}
              maxScore={pieceCountPerSide}
              active={introsComplete && isMyTurn}
            />
            {isMobileLayout && isTurnTimerEnabled ? (
              <View style={styles.scoreTimerSlot}>
                <GameStageHUD
                  isMyTurn={isMyTurn}
                  canRoll={canRoll}
                  phase={gameState.phase}
                  compact
                  layout="inline"
                  timerDurationMs={visualTurnTimerDurationMs}
                  timerIsRunning={isVisualTurnTimerRunning}
                  timerKey={turnTimerCycleId}
                  timerWarningThreshold={VISUAL_TURN_TIMER_WARNING_THRESHOLD}
                  timerSize={30}
                />
              </View>
            ) : null}
            {showMobileWebDetachedDarkScore ? (
              <EdgeScore
                side="dark"
                score={gameState.dark.finishedCount}
                maxScore={pieceCountPerSide}
                active={introsComplete && !isMyTurn}
                align="right"
                style={[
                  isMobileLayout && isTurnTimerEnabled ? { marginRight: mobileDarkScoreNudge } : undefined,
                  styles.mobileDetachedScoreGhost,
                ]}
              />
            ) : (
              <EdgeScore
                side="dark"
                score={gameState.dark.finishedCount}
                maxScore={pieceCountPerSide}
                active={introsComplete && !isMyTurn}
                align="right"
                style={isMobileLayout && isTurnTimerEnabled ? { marginRight: mobileDarkScoreNudge } : undefined}
              />
            )}
          </View>

          {useSideColumns ? (
            <View style={[styles.boardClusterWide, { gap: boardClusterGap }]}>
              <View
                style={[
                  styles.sideColumn,
                  showWebSideDiceVisual && styles.webDiceSideColumn,
                  {
                    width: sideColumnWidth,
                    paddingTop: showWebSideDiceVisual ? webDiceVisualTopInset : supportColumnTopInset,
                    paddingBottom: supportColumnBottomInset,
                  },
                ]}
              >
                {showWebSideDiceVisual ? (
                  <View pointerEvents="none" style={[styles.webDiceVisualSlot, styles.webRollResultSlot, { height: webDiceVisualSlotHeight }]}>
                    <Text
                      style={[
                        styles.webRollResultValue,
                        {
                          fontFamily: rollResultFontFamily,
                          fontSize: webRollResultFontSize,
                          lineHeight: webRollButtonSize,
                        },
                        !showWebRollResult && styles.webRollResultValueMuted,
                      ]}
                    >
                      {showWebRollResult ? String(gameState.rollValue) : ''}
                    </Text>
                  </View>
                ) : null}
                <PieceRail
                  label="Light Reserve"
                  color="light"
                  tokenVariant="light"
                  piecePixelSize={scaledReservePiecePixelSize}
                  reserveCount={lightReserve}
                  totalCount={pieceCountPerSide}
                  active={introsComplete && isMyTurn}
                  hideReservePieces={shouldHideReservePieces}
                  onReserveSlotsLayout={setLightReserveSlots}
                />
                {!showWebSideDiceVisual && isTurnTimerEnabled ? (
                  <GameStageHUD
                    isMyTurn={isMyTurn}
                    canRoll={canRoll}
                    phase={gameState.phase}
                    compact={compactSupportUi}
                    timerDurationMs={visualTurnTimerDurationMs}
                    timerIsRunning={isVisualTurnTimerRunning}
                    timerKey={turnTimerCycleId}
                    timerWarningThreshold={VISUAL_TURN_TIMER_WARNING_THRESHOLD}
                  />
                ) : null}
                {showWebSideDiceVisual && isTurnTimerEnabled ? (
                  <View style={[styles.webUnderTrayControl, { minHeight: webRollButtonSize }]}>
                    <GameStageHUD
                      isMyTurn={isMyTurn}
                      canRoll={canRoll}
                      phase={gameState.phase}
                      compact
                      layout="inline"
                      timerDurationMs={visualTurnTimerDurationMs}
                      timerIsRunning={isVisualTurnTimerRunning}
                      timerKey={turnTimerCycleId}
                      timerWarningThreshold={VISUAL_TURN_TIMER_WARNING_THRESHOLD}
                      timerSize={webHourglassSize}
                      countdownFontSize={webCountdownFontSize}
                      countdownLineHeight={webRollButtonSize}
                    />
                  </View>
                ) : null}
              </View>

              <View style={styles.boardCenterColumn}>
                <View
                  style={styles.boardViewport}
                  onLayout={(event) => {
                    const { width: slotWidth, height: slotHeight } = event.nativeEvent.layout;
                    setBoardSlotSize((prev) =>
                      prev.width === slotWidth && prev.height === slotHeight
                        ? prev
                        : { width: slotWidth, height: slotHeight },
                    );
                  }}
                >
                  <View style={styles.boardCard}>
                    {liveBoard}
                  </View>
                </View>
              </View>

              <View
                style={[
                  styles.sideColumn,
                  showWebSideDiceVisual && styles.webDiceSideColumn,
                  {
                    width: sideColumnWidth,
                    paddingTop: showWebSideDiceVisual ? webDiceVisualTopInset : supportColumnTopInset,
                    paddingBottom: supportColumnBottomInset,
                  },
                ]}
              >
                {showWebSideDiceVisual ? (
                  <View pointerEvents="none" style={[styles.webDiceVisualSlot, { height: webDiceVisualSlotHeight }]}>
                    <DiceStageVisual
                      animationDurationMs={diceAnimationDurationMs}
                      value={gameState.rollValue}
                      rolling={rollingVisual}
                      canRoll={introsComplete && canRoll}
                      compact={compactSupportUi || webDiceVisualSlotHeight < 140}
                      onResultShown={handleRollResultShown}
                      visible={showPersistentDiceVisual}
                    />
                  </View>
                ) : null}
                <PieceRail
                  label="Dark Reserve"
                  color="dark"
                  tokenVariant="dark"
                  piecePixelSize={scaledReservePiecePixelSize}
                  reserveCount={darkReserve}
                  totalCount={pieceCountPerSide}
                  active={introsComplete && !isMyTurn}
                  hideReservePieces={shouldHideReservePieces}
                  onReserveSlotsLayout={setDarkReserveSlots}
                />
                {showWebSideDiceVisual ? (
                  <View style={[styles.webUnderTrayControl, { minHeight: webRollButtonSize }]}>
                    <View style={styles.webUnderTrayButtonWrap}>
                      <Dice
                        animationDurationMs={diceAnimationDurationMs}
                        value={gameState.rollValue}
                        rolling={rollingVisual}
                        onRoll={handleRoll}
                        onResultShown={handleRollResultShown}
                        canRoll={introsComplete && canRoll}
                        pressedIn={introsComplete ? isRollButtonPressedIn : false}
                        mode="stage"
                        compact={compactSupportUi}
                        showNumericResult={false}
                        showStatusCopy={introsComplete}
                        showVisual={false}
                        visualPlacement={detachedDiceVisualPlacement}
                        artSize={webRollButtonSize}
                      />
                    </View>
                  </View>
                ) : (
                  <Dice
                    animationDurationMs={diceAnimationDurationMs}
                    value={gameState.rollValue}
                    rolling={rollingVisual}
                    onRoll={handleRoll}
                    onResultShown={handleRollResultShown}
                    canRoll={introsComplete && canRoll}
                    pressedIn={introsComplete ? isRollButtonPressedIn : false}
                    mode="stage"
                    compact={compactSupportUi}
                    showStatusCopy={introsComplete}
                    showVisual={showPersistentDiceVisual}
                    visualPlacement={detachedDiceVisualPlacement}
                  />
                )}
              </View>
            </View>
          ) : (
            <View
              style={[
                styles.boardClusterMobile,
                {
                  gap: useMobileSideReserveRails ? urTheme.spacing.xs : urTheme.spacing.sm,
                  paddingTop: mobileBoardOffsetTop,
                },
              ]}
            >
              <View
                style={[
                  styles.mobileBoardStageRow,
                  useMobileSideReserveRails && { gap: boardClusterGap },
                ]}
              >
                {useMobileSideReserveRails ? (
                  <View
                    style={[
                      styles.mobileReserveSideColumn,
                      { width: mobileReserveColumnWidth, paddingTop: mobileReserveRailTopOffset },
                    ]}
                  >
                    <PieceRail
                      label="Light Reserve"
                      color="light"
                      tokenVariant="light"
                      orientation="vertical"
                      piecePixelSize={scaledReservePiecePixelSize}
                      reserveCount={lightReserve}
                      totalCount={pieceCountPerSide}
                      active={introsComplete && isMyTurn}
                      hideReservePieces={shouldHideReservePieces}
                      onReserveSlotsLayout={setLightReserveSlots}
                      onRailFrameLayout={handleLightTrayFrameLayout}
                    />
                  </View>
                ) : null}

                <View style={styles.boardCenterColumn}>
                  <View
                    style={[styles.boardViewport]}
                    onLayout={(event) => {
                      const { width: slotWidth, height: slotHeight } = event.nativeEvent.layout;
                      setBoardSlotSize((prev) =>
                        prev.width === slotWidth && prev.height === slotHeight
                          ? prev
                          : { width: slotWidth, height: slotHeight },
                      );
                    }}
                  >
                    <View style={styles.boardCard}>
                      {liveBoard}
                    </View>
                  </View>
                </View>

                {useMobileSideReserveRails ? (
                  <View
                    style={[
                      styles.mobileReserveSideColumn,
                      { width: mobileReserveColumnWidth, paddingTop: mobileReserveRailTopOffset },
                    ]}
                  >
                    <PieceRail
                      label="Dark Reserve"
                      color="dark"
                      tokenVariant="dark"
                      orientation="vertical"
                      piecePixelSize={scaledReservePiecePixelSize}
                      reserveCount={darkReserve}
                      totalCount={pieceCountPerSide}
                      active={introsComplete && !isMyTurn}
                      hideReservePieces={shouldHideReservePieces}
                      onReserveSlotsLayout={setDarkReserveSlots}
                      onRailFrameLayout={handleDarkTrayFrameLayout}
                    />
                  </View>
                ) : null}
              </View>

              {useMobileSideReserveRails && !showMobileWebUnderBoardDiceOverlay && !showMobileBoardGapDice ? (
                <View style={[styles.mobileBottomDiceDock, styles.mobileBottomDiceDockUnderBoard]}>
                  <View style={styles.mobileDiceRow}>
                    <View style={[styles.mobileDiceWrap, { width: mobileDiceDockWidth }]}>
                      <Dice
                        animationDurationMs={diceAnimationDurationMs}
                        value={gameState.rollValue}
                        rolling={rollingVisual}
                        onRoll={handleRoll}
                        onResultShown={handleRollResultShown}
                        canRoll={introsComplete && canRoll}
                        pressedIn={introsComplete ? isRollButtonPressedIn : false}
                        mode="stage"
                        compact={compactSupportUi}
                        showNumericResult={false}
                        showStatusCopy={introsComplete}
                        showVisual={showPersistentDiceVisual && !showMobileWebDetachedDiceVisual}
                        visualPlacement={detachedDiceVisualPlacement}
                        artSize={mobileWebRollButtonArtSize}
                      />
                    </View>
                  </View>
                </View>
              ) : !useMobileSideReserveRails ? (
                <View style={styles.mobileRollResultRow}>
                  {showMobileRollResult ? (
                    <Text
                      numberOfLines={1}
                      style={[
                        styles.mobileRollResultValue,
                        { fontFamily: rollResultFontFamily, transform: [{ translateY: mobileRollResultOffset }] },
                      ]}
                    >
                      {gameState.rollValue}
                    </Text>
                  ) : null}
                </View>
              ) : null}

              {!useMobileSideReserveRails ? (
                <View
                  style={[
                    styles.mobileSupportStack,
                    {
                      transform: [{ translateY: mobileTrayVisualOffset }],
                    },
                  ]}
                >
                  <View style={styles.mobileReserveRow}>
                    <View style={styles.mobileReserveCell}>
                      <PieceRail
                        label="Light Reserve"
                        color="light"
                        tokenVariant="light"
                        piecePixelSize={scaledReservePiecePixelSize}
                        reserveCount={lightReserve}
                        totalCount={pieceCountPerSide}
                        active={introsComplete && isMyTurn}
                        hideReservePieces={shouldHideReservePieces}
                        onReserveSlotsLayout={setLightReserveSlots}
                      />
                    </View>

                    <View style={styles.mobileReserveCell}>
                      <PieceRail
                        label="Dark Reserve"
                        color="dark"
                        tokenVariant="dark"
                        piecePixelSize={scaledReservePiecePixelSize}
                        reserveCount={darkReserve}
                        totalCount={pieceCountPerSide}
                        active={introsComplete && !isMyTurn}
                        hideReservePieces={shouldHideReservePieces}
                        onReserveSlotsLayout={setDarkReserveSlots}
                      />
                    </View>
                  </View>
                </View>
              ) : null}

              {!useMobileSideReserveRails ? (
                <View
                  style={[
                    styles.mobileBottomDiceDock,
                    {
                      paddingBottom: mobileBottomDockGap,
                      transform: [{ translateY: mobileLowerClusterShift }],
                    },
                  ]}
                >
                  <View style={styles.mobileDiceRow}>
                    <View style={[styles.mobileDiceWrap, { width: mobileDiceDockWidth }]}>
                      <Dice
                        animationDurationMs={diceAnimationDurationMs}
                        value={gameState.rollValue}
                        rolling={rollingVisual}
                        onRoll={handleRoll}
                        onResultShown={handleRollResultShown}
                        canRoll={introsComplete && canRoll}
                        pressedIn={introsComplete ? isRollButtonPressedIn : false}
                        mode="stage"
                        compact={compactSupportUi}
                        showNumericResult={false}
                        showStatusCopy={introsComplete}
                        showVisual={showPersistentDiceVisual && !showMobileWebDetachedDiceVisual}
                        visualPlacement={detachedDiceVisualPlacement}
                      />
                    </View>
                  </View>
                </View>
              ) : null}
            </View>
          )}
        </View>
      </View>

      {showBoardDropIntro && boardDropTargetFrame && (
        <BoardDropIntro
          targetFrame={boardDropTargetFrame}
          boardContent={boardIntroContent}
          boardSource={BOARD_IMAGE_SOURCE}
          onImpactLead={() => {
            void gameAudio.play('boardImpact');
          }}
          onComplete={() => {
            setShowBoardDropIntro(false);
            setHasPlayedBoardDropIntro(true);
          }}
        />
      )}

      <ReserveCascadeIntro
        visible={showReserveCascadeIntro}
        pieceTargets={frozenReserveCascadeTargets}
        onPieceLand={(landedCount) => {
          if (landedCount % 2 === 0) return;
          void gameAudio.play('tray');
        }}
        onComplete={() => {
          setShowReserveCascadeIntro(false);
          setHasPlayedReserveCascadeIntro(true);
        }}
      />

      {introsComplete && showScoreBanner && (
        <View pointerEvents="none" style={styles.scoreBannerWrap}>
          <View style={styles.scoreBanner}>
            <Text style={styles.scoreBannerText}>You scored another point!</Text>
          </View>
        </View>
      )}

      {introsComplete ? (
        <MatchMomentIndicator
          cue={activeMatchCue}
          fontFamily={cueFontFamily}
          onHidden={handleMatchCueHidden}
        />
      ) : null}

      <Modal
        visible={showWinModal}
        title={winModalTitle}
        message={winModalMessage}
        actionLabel="Return to Menu"
        onAction={handleExit}
        maxWidth={520}
      >
        {didPlayerWin && isPracticeModeMatch && !isPrivateMatch && canSyncOfflineBotRewards && practiceModeRewardLabel ? (
          <View style={styles.practiceRewardLabel}>
            <Text style={styles.practiceRewardLabelText}>{practiceModeRewardLabel}</Text>
          </View>
        ) : null}
        {didPlayerWin && isPrivateMatch ? (
          <View style={styles.privateRewardLabel}>
            <Text style={styles.privateRewardLabelText}>Private Match: Reduced XP Reward</Text>
          </View>
        ) : null}
        {!isPlaythroughTutorialMatch ? (
          <EloMatchSummaryPanel
            result={isRankedHumanMatch ? lastEloRatingChange : null}
            pending={isRankedHumanMatch && !lastEloRatingChange}
            unchangedReason={!isRankedHumanMatch ? eloUnchangedReason : null}
          />
        ) : null}
        {shouldShowAccountRewards ? (
          <>
            <XPDisplay
              progression={progression}
              isLoading={isRefreshingMatchRewards && !progression}
              errorMessage={progressionError}
              compact
              style={styles.matchRewardsXpDisplay}
            />
            {didPlayerWin ? (
              <ProgressionAwardSummary
                progression={progression}
                award={lastProgressionAward}
                pending={!lastProgressionAward}
              />
            ) : null}
            {shouldShowChallengeRewards ? (
              <MatchChallengeRewardsPanel
                summary={matchChallengeSummary}
                loading={isRefreshingMatchRewards && !matchChallengeSummary}
                errorMessage={matchRewardsErrorMessage}
              />
            ) : null}
          </>
        ) : null}
      </Modal>

      <AudioSettingsModal
        visible={showAudioSettings}
        announcementCuesEnabled={announcementCuesEnabled}
        musicEnabled={musicEnabled}
        musicVolume={musicVolume}
        sfxEnabled={sfxEnabled}
        sfxVolume={sfxVolume}
        diceAnimationEnabled={diceAnimationEnabled}
        diceAnimationSpeed={diceAnimationSpeed}
        bugAnimationEnabled={bugAnimationEnabled}
        autoRollEnabled={autoRollEnabled}
        moveHintEnabled={moveHintEnabled}
        timerEnabled={botTimerEnabled}
        timerDurationSeconds={turnTimerSeconds}
        showTimerToggle={isOffline}
        onClose={() => setShowAudioSettings(false)}
        onToggleAnnouncementCues={(enabled) => {
          void handleToggleAnnouncementCues(enabled);
        }}
        onToggleMusic={(enabled) => {
          void handleToggleMusic(enabled);
        }}
        onSetMusicVolume={(volume) => {
          void handleSetMusicVolume(volume);
        }}
        onToggleSfx={(enabled) => {
          void handleToggleSfx(enabled);
        }}
        onSetSfxVolume={(volume) => {
          void handleSetSfxVolume(volume);
        }}
        onToggleDiceAnimation={(enabled) => {
          void handleToggleDiceAnimation(enabled);
        }}
        onSetDiceAnimationSpeed={(speed) => {
          void handleSetDiceAnimationSpeed(speed);
        }}
        onToggleBugAnimation={(enabled) => {
          void handleToggleBugAnimation(enabled);
        }}
        onToggleAutoRoll={(enabled) => {
          void handleToggleAutoRoll(enabled);
        }}
        onToggleMoveHint={(enabled) => {
          void handleToggleMoveHint(enabled);
        }}
        onSetTimerDuration={(seconds) => {
          void handleSetTurnTimerDuration(seconds);
        }}
        onToggleTimer={(enabled) => {
          void handleToggleBotTimer(enabled);
        }}
      />
      <PlayTutorialCoachModal
        visible={tutorialCoachVisible}
        eyebrow={tutorialCoachEyebrow}
        title={tutorialCoachTitle}
        body={tutorialCoachBody}
        actionLabel={tutorialCoachActionLabel}
        onContinue={handleContinueTutorialCoach}
      />
    </View>
  );
}

export default GameRoom;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#D9C39A',
  },
  matchRewardsXpDisplay: {
    width: '100%',
    marginBottom: urTheme.spacing.sm,
  },
  privateStatusBanner: {
    alignSelf: 'center',
    width: '100%',
    maxWidth: 620,
    marginTop: 4,
    marginBottom: urTheme.spacing.xs,
    paddingHorizontal: urTheme.spacing.md,
    paddingVertical: urTheme.spacing.sm,
    borderRadius: urTheme.radii.md,
    borderWidth: 1,
    borderColor: 'rgba(217, 164, 65, 0.42)',
    backgroundColor: 'rgba(29, 19, 12, 0.82)',
    zIndex: 6,
  },
  privateStatusBannerReady: {
    backgroundColor: 'rgba(17, 35, 39, 0.84)',
    borderColor: 'rgba(126, 177, 255, 0.34)',
  },
  privateStatusEyebrow: {
    ...urTypography.label,
    color: urTheme.colors.goldBright,
    fontSize: 11,
    letterSpacing: 0.8,
    textAlign: 'center',
    marginBottom: urTheme.spacing.xs,
  },
  privateStatusCode: {
    color: urTheme.colors.parchment,
    fontSize: 24,
    lineHeight: 28,
    letterSpacing: 2.1,
    textAlign: 'center',
    marginBottom: urTheme.spacing.xs,
  },
  privateStatusText: {
    color: 'rgba(247, 229, 203, 0.82)',
    fontSize: 11,
    lineHeight: 17,
    textAlign: 'center',
  },
  backdropLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
    backgroundColor: '#D9C39A',
  },
  backdropImage: {
    position: 'absolute',
    opacity: 1,
  },
  ambientLayer: {
    zIndex: 0,
  },
  mobileWebDiceVisualOverlay: {
    position: 'absolute',
    zIndex: 4,
  },
  mobileBoardGapOverlay: {
    position: 'absolute',
    zIndex: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mobileWebUnderBoardDiceOverlay: {
    position: 'absolute',
    zIndex: 5,
  },
  stageViewport: {
    flex: 1,
    paddingHorizontal: urTheme.spacing.md,
    alignItems: 'center',
    zIndex: 2,
    overflow: 'hidden',
  },
  stageWrap: {
    width: '100%',
    maxWidth: urTheme.layout.stage.maxWidth,
    flex: 1,
    minHeight: 0,
  },
  tutorialObjectiveBanner: {
    alignSelf: 'center',
    maxWidth: 620,
    marginTop: 4,
    marginBottom: urTheme.spacing.xs,
    paddingHorizontal: urTheme.spacing.md,
    paddingVertical: urTheme.spacing.xs,
    borderRadius: urTheme.radii.pill,
    backgroundColor: 'rgba(44, 25, 14, 0.84)',
    borderWidth: 1,
    borderColor: 'rgba(246, 214, 151, 0.42)',
    zIndex: 6,
  },
  tutorialObjectiveText: {
    color: '#F7E9CD',
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
  },
  topChrome: {
    position: 'absolute',
    left: urTheme.spacing.xs,
    right: urTheme.spacing.xs,
    zIndex: 7,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: urTheme.spacing.sm,
  },
  topChromeMobile: {
    alignItems: 'center',
  },
  topChromeLeft: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: urTheme.spacing.xs,
  },
  topChromeLeftMobile: {
    alignItems: 'center',
  },
  topChromeTitleStack: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  topChromeTitleStackMobile: {
    alignSelf: 'center',
    justifyContent: 'center',
    gap: 0,
  },
  topChromeRight: {
    position: 'relative',
    alignItems: 'flex-end',
    flexShrink: 0,
  },
  topChromeRightMobile: {
    alignSelf: 'center',
  },
  topChromeIconButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 2.1,
    borderColor: TOP_CHROME_BORDER,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  topChromeIconButtonWeb: {
    borderColor: urTheme.colors.gold,
  },
  topChromeIconButtonMobile: {
    borderWidth: 2.4,
    borderColor: TOP_CHROME_BORDER,
    backgroundColor: 'transparent',
    ...boxShadow({
      color: TOP_CHROME_BORDER,
      opacity: 0.32,
      offset: { width: 0, height: 1 },
      blurRadius: 3,
      elevation: 6,
    }),
  },
  topChromeTitle: {
    ...urTypography.label,
    color: TOP_CHROME_ACCENT,
    fontSize: 13,
    letterSpacing: 0.35,
    ...textShadow({
      color: 'rgba(0, 0, 0, 0.45)',
      offset: { width: 0, height: 1 },
      blurRadius: 2,
    }),
    flexShrink: 1,
  },
  topChromeTitleMobile: {
    color: urTheme.colors.ivory,
  },
  topChromeTitleInlineMobile: {
    lineHeight: 16,
  },
  scoreRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: urTheme.spacing.sm,
    flexShrink: 0,
  },
  mobileScoreRow: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: urTheme.spacing.xs,
  },
  mobileDetachedScoreGhost: {
    opacity: 0,
  },
  scoreRowOverlay: {
    position: 'absolute',
    left: urTheme.spacing.xs,
    right: urTheme.spacing.xs,
    zIndex: 5,
  },
  scoreRowOverlayMobile: {
    left: urTheme.spacing.xs,
    right: urTheme.spacing.xs,
  },
  practiceRewardLabel: {
    marginBottom: urTheme.spacing.sm,
    paddingHorizontal: urTheme.spacing.md,
    paddingVertical: urTheme.spacing.sm,
    borderRadius: urTheme.radii.md,
    borderWidth: 1,
    borderColor: 'rgba(217, 164, 65, 0.44)',
    backgroundColor: 'rgba(13, 15, 18, 0.54)',
  },
  practiceRewardLabelText: {
    ...urTypography.label,
    color: urTheme.colors.parchment,
    fontSize: 11,
    textAlign: 'center',
  },
  privateRewardLabel: {
    marginBottom: urTheme.spacing.sm,
    paddingHorizontal: urTheme.spacing.md,
    paddingVertical: urTheme.spacing.sm,
    borderRadius: urTheme.radii.md,
    borderWidth: 1,
    borderColor: 'rgba(137, 193, 255, 0.34)',
    backgroundColor: 'rgba(10, 25, 42, 0.56)',
  },
  privateRewardLabelText: {
    ...urTypography.label,
    color: 'rgba(216, 232, 251, 0.96)',
    fontSize: 11,
    textAlign: 'center',
  },
  scoreTimerSlot: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boardClusterWide: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'stretch',
    flex: 1,
    minHeight: 0,
  },
  boardClusterMobile: {
    width: '100%',
    flex: 1,
    minHeight: 0,
  },
  mobileBoardStageRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'stretch',
    minHeight: 0,
  },
  sideColumn: {
    justifyContent: 'flex-start',
    gap: urTheme.spacing.md,
    flexShrink: 0,
  },
  webDiceSideColumn: {
    gap: 0,
  },
  boardCenterColumn: {
    flex: 1,
    minWidth: 0,
    minHeight: 0,
  },
  boardViewport: {
    flex: 1,
    minHeight: 0,
    width: '100%',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  mobileReserveSideColumn: {
    alignSelf: 'stretch',
    justifyContent: 'flex-start',
    flexShrink: 0,
    minHeight: 0,
  },
  mobileSupportStack: {
    width: '100%',
    gap: urTheme.spacing.xs,
    flexShrink: 0,
  },
  mobileRollResultRow: {
    width: '100%',
    minHeight: 34,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: urTheme.spacing.xs,
  },
  mobileRollResultValue: {
    color: urTheme.colors.ivory,
    fontSize: 47,
    lineHeight: 51,
    letterSpacing: 0.5,
    textAlign: 'center',
    ...textShadow({
      color: '#050403',
      offset: { width: 0, height: 1 },
      blurRadius: 2,
    }),
  },
  mobileBottomDiceDock: {
    width: '100%',
    marginTop: 'auto',
  },
  mobileBottomDiceDockUnderBoard: {
    marginTop: urTheme.spacing.xs,
  },
  mobileDiceRow: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mobileDiceWrap: {
    maxWidth: '100%',
  },
  mobileWebTrayAlignedOverlay: {
    position: 'absolute',
    zIndex: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mobileWebFloatingRollResultValue: {
    ...urTypography.title,
    color: urTheme.colors.ivory,
    letterSpacing: 0.75,
    textAlign: 'center',
    ...textShadow({
      color: '#120d09',
      offset: { width: 0, height: 1 },
      blurRadius: 2,
    }),
  },
  webDiceVisualSlot: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'stretch',
    flexShrink: 0,
  },
  webRollResultSlot: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  webRollResultValue: {
    color: urTheme.colors.ivory,
    minWidth: 0,
    textAlign: 'center',
    ...textShadow({
      color: '#050403',
      offset: { width: 0, height: 1 },
      blurRadius: 2,
    }),
  },
  webRollResultValueMuted: {
    opacity: 0.58,
  },
  webUnderTrayControl: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: urTheme.spacing.xs,
  },
  webUnderTrayButtonWrap: {
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mobileReserveRow: {
    width: '100%',
    flexDirection: 'row',
    gap: urTheme.spacing.md,
    alignItems: 'flex-end',
  },
  mobileReserveCell: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'flex-end',
  },
  headerHelpButton: {
    minHeight: 34,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: urTheme.radii.pill,
    borderWidth: 2.1,
    borderColor: TOP_CHROME_BORDER,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerHelpButtonMobile: {
    borderWidth: 2.4,
    borderColor: TOP_CHROME_BORDER,
    backgroundColor: 'transparent',
    ...boxShadow({
      color: TOP_CHROME_BORDER,
      opacity: 0.32,
      offset: { width: 0, height: 1 },
      blurRadius: 3,
      elevation: 6,
    }),
  },
  headerHelpButtonPressed: {
    opacity: 0.8,
  },
  topMenuScrim: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 6,
  },
  topMenu: {
    position: 'absolute',
    top: 40,
    right: 0,
    width: 220,
    padding: urTheme.spacing.xs,
    borderRadius: urTheme.radii.md,
    borderWidth: 1.4,
    borderColor: 'rgba(214, 167, 84, 0.74)',
    backgroundColor: 'rgba(44, 24, 13, 0.97)',
    overflow: 'hidden',
    ...boxShadow({
      color: '#000',
      opacity: 0.34,
      offset: { width: 0, height: 10 },
      blurRadius: 16,
      elevation: 10,
    }),
  },
  topMenuItem: {
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
    gap: urTheme.spacing.sm,
    borderRadius: urTheme.radii.sm,
    paddingHorizontal: urTheme.spacing.sm,
    paddingVertical: urTheme.spacing.xs,
  },
  topMenuItemPressed: {
    backgroundColor: 'rgba(217, 164, 65, 0.14)',
  },
  topMenuInfoItem: {
    alignItems: 'flex-start',
    backgroundColor: 'rgba(217, 164, 65, 0.08)',
    marginBottom: urTheme.spacing.xs,
  },
  topMenuInfoCopy: {
    flex: 1,
    minWidth: 0,
  },
  topMenuInfoLabel: {
    ...urTypography.label,
    color: 'rgba(243, 223, 194, 0.72)',
    fontSize: 10,
    letterSpacing: 0.6,
  },
  topMenuInfoValue: {
    ...urTypography.label,
    color: '#F3DFC2',
    fontSize: 11,
    letterSpacing: 0.4,
    marginTop: 2,
  },
  topMenuLabel: {
    ...urTypography.label,
    color: '#F3DFC2',
    fontSize: 11,
    letterSpacing: 0.7,
  },
  boardCard: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginTop: 2,
    marginBottom: 2,
  },
  liveBoardMeasure: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  liveBoardWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  liveBoardHidden: {
    opacity: 0,
  },
  scoreBannerWrap: {
    position: 'absolute',
    top: urTheme.spacing.lg,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 20,
  },
  scoreBanner: {
    borderRadius: urTheme.radii.pill,
    borderWidth: 1,
    borderColor: 'rgba(255, 220, 146, 0.86)',
    backgroundColor: 'rgba(27, 39, 23, 0.93)',
    paddingHorizontal: urTheme.spacing.md,
    paddingVertical: urTheme.spacing.xs,
    ...boxShadow({
      color: urTheme.colors.glow,
      opacity: 0.44,
      blurRadius: 12,
      elevation: 9,
    }),
  },
  scoreBannerText: {
    ...urTypography.label,
    fontSize: 12,
    color: 'rgba(231, 255, 214, 0.97)',
    letterSpacing: 0.4,
  },
});
