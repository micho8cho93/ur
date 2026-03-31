import {
  Board,
  BoardImageLayoutFrame,
  BOARD_IMAGE_SOURCE,
  getBoardPiecePixelSize,
} from '@/components/game/Board';
import { AudioSettingsModal } from '@/components/game/AudioSettingsModal';
import { AmbientBackgroundEffects } from '@/components/game/AmbientBackgroundEffects';
import { BoardDropIntro } from '@/components/game/BoardDropIntro';
import { Dice, DiceStageVisual } from '@/components/game/Dice';
import { EdgeScore } from '@/components/game/EdgeScore';
import { EmojiReactionMenu, type EmojiReactionMenuOption } from '@/components/game/EmojiReactionMenu';
import {
  FloatingEmojiReactions,
  type FloatingEmojiReactionItem,
} from '@/components/game/FloatingEmojiReactions';
import { GameStageHUD } from '@/components/game/GameStageHUD';
import { computeBoardGapControlLayout } from '@/components/game/matchDiceStageLayout';
import { MatchDiceRollStage } from '@/components/game/MatchDiceRollStage';
import { MatchMomentIndicator } from '@/components/game/MatchMomentIndicator';
import type { MatchMomentIndicatorCue } from '@/components/game/MatchMomentIndicator';
import {
  getNoMoveRollValueFromHistoryEntry,
  ROLL_RESULT_HOLD_MS,
} from '@/components/game/rollResultHold';
import { MatchResultSummaryContent } from '@/components/match/MatchResultSummaryContent';
import { PieceRail, PieceRailFrameMeasurement, ReserveSlotMeasurement } from '@/components/game/PieceRail';
import { ReserveCascadeIntro, ReserveCascadePieceTarget } from '@/components/game/ReserveCascadeIntro';
import { DEFAULT_DICE_ROLL_DURATION_MS } from '@/components/game/slotDiceShared';
import { TournamentWaitingRoom } from '@/components/tournaments/TournamentWaitingRoom';
import { PlayTutorialCoachModal } from '@/components/tutorial/PlayTutorialCoachModal';
import { Modal } from '@/components/ui/Modal';
import { boxShadow, textShadow } from '@/constants/styleEffects';
import { urTheme, urTypography } from '@/constants/urTheme';
import { hasNakamaConfig, isNakamaEnabled } from '@/config/nakama';
import { useGameLoop } from '@/hooks/useGameLoop';
import { DEFAULT_BOT_DIFFICULTY, isBotDifficulty } from '@/logic/bot/types';
import { BOARD_COLS, BOARD_ROWS } from '@/logic/constants';
import { applyMove as applyEngineMove, getValidMoves } from '@/logic/engine';
import {
  getMatchConfig,
  getMatchRulesIntro,
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
import { getPublicTournamentStatus } from '@/services/tournaments';
import { buildMatchChallengeRewardSummary, type MatchChallengeRewardSummary } from '@/src/challenges/challengeUi';
import { useAuth } from '@/src/auth/useAuth';
import { useChallenges } from '@/src/challenges/useChallenges';
import { useEloRating } from '@/src/elo/useEloRating';
import { resolveDidPlayerWin, resolveMatchPlayerColor } from '@/src/match/playerOutcome';
import {
  buildOfflineCompletedMatchSummary,
  createOfflineMatchTelemetry,
  getBotOpponentType,
  recordOfflineHistoryEntries,
  recordOfflineRoll,
} from '@/src/offlineMatch/offlineMatchRewards';
import { useProgression } from '@/src/progression/useProgression';
import {
  deriveServerConfirmedTournamentOutcome,
  isServerConfirmedTournamentTerminal,
} from '@/src/tournaments/terminalOutcome';
import { useTournamentAdvanceFlow } from '@/src/tournaments/useTournamentAdvanceFlow';
import {
  getBotScoreTitle,
  getHumanScoreTitle,
  getPlayerColorForUserId,
  getSnapshotScoreTitle,
} from '@/src/match/playerTitles';
import { isTournamentBotUserId } from '@/shared/tournamentBots';
import { getAppendedHistoryEntries } from '@/shared/historyWindow';
import { useGameStore } from '@/store/useGameStore';
import {
  resolveMobileReserveRailTopOffset,
  resolveMobileWebBoardTrayAlignmentCorrection,
  resolveMobileWebHeaderLift,
  resolveMatchStageReserveTrayScale,
  resolveMatchStageSideColumnWidth,
  resolveMatchStageTabletPortraitTuning,
  resolveMatchStageViewportHorizontalPadding,
  resolveMatchStageViewportMode,
} from '@/src/layout/matchStageViewport';
import { resolveVisibleViewportSize } from '@/src/layout/matchViewport';
import {
  PLAYTHROUGH_TUTORIAL_COMPLETION_MODAL,
  PLAYTHROUGH_TUTORIAL_ID,
  PLAYTHROUGH_TUTORIAL_LESSONS,
  PLAYTHROUGH_TUTORIAL_OPENING_MODAL,
  PLAYTHROUGH_TUTORIAL_SCRIPT,
  getPlaythroughTutorialInstruction,
  getPlaythroughTutorialLessonState,
  isPlaythroughTutorialId,
} from '@/tutorials/playthroughTutorial';
import type { TutorialResultModalContent } from '@/tutorials/tutorialTypes';
import type { CompletedBotMatchRewardMode } from '@/shared/challenges';
import { isEloRatingChangeNotificationPayload } from '@/shared/elo';
import { isProgressionAwardNotificationPayload } from '@/shared/progression';
import {
  EmojiReactionBroadcastPayload,
  EmojiReactionKey,
  EmojiReactionRequestPayload,
  MatchOpCode,
  MAX_EMOJI_REACTIONS_PER_MATCH,
  MoveRequestPayload,
  RollRequestPayload,
  TournamentMatchRewardSummaryPayload,
  decodePayload,
  encodePayload,
  isEmojiReactionBroadcastPayload,
  isServerErrorPayload,
  isStateSnapshotPayload,
  isTournamentMatchRewardSummaryPayload,
} from '@/shared/urMatchProtocol';
import { MatchData, MatchPresenceEvent, Socket } from '@heroiclabs/nakama-js';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Asset } from 'expo-asset';
import { useFonts } from 'expo-font';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useRef } from 'react';
import {
  BackHandler,
  Image,
  Platform,
  Pressable,
  Share,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const UR_BG_IMAGE = require('../../assets/images/ur_bg.png');
const MATCH_PRESENTATION_ASSETS = [
  UR_BG_IMAGE,
  BOARD_IMAGE_SOURCE,
  require('../../assets/trays/tray_light.png'),
  require('../../assets/trays/tray_dark.png'),
  require('../../assets/pieces/piece_light.png'),
  require('../../assets/pieces/piece_dark.png'),
  require('../../assets/dice/dice_marked.png'),
  require('../../assets/dice/dice_unmarked.png'),
  require('../../assets/buttons/roll_button.png'),
];

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
const MOBILE_WEB_REEL_BOX_SCALE = 1.55;
const MOBILE_WEB_REEL_DICE_SIZE_SCALE = 1.2;
const MOBILE_WEB_REEL_DICE_IMAGE_SCALE = MOBILE_WEB_REEL_DICE_SIZE_SCALE / MOBILE_WEB_REEL_BOX_SCALE;
const MOBILE_WEB_ROLL_BUTTON_SCALE = 1.2;
const MATCH_CUE_FONT_FAMILY = 'CinzelDecorativeBold';
const HOURGLASS_HEIGHT_RATIO = 156 / 100;
const LOCAL_MOVE_HISTORY_RE = /^(light|dark) moved to \d+\. Rosette: (true|false)$/;
const AUTO_ROLL_DELAY_MS = 550;
const BOARD_INTRO_FALLBACK_DELAY_MS = 400;
const TUTORIAL_PACING_MULTIPLIER = 2;
const TUTORIAL_BOT_ROLL_DELAY_MS = 850 * TUTORIAL_PACING_MULTIPLIER;
const TUTORIAL_BOT_MOVE_DELAY_MS = 1200 * TUTORIAL_PACING_MULTIPLIER;
const TUTORIAL_NO_MOVE_DELAY_MS = 850 * TUTORIAL_PACING_MULTIPLIER;
const ONLINE_MATCH_REWARD_REFRESH_RETRY_MS = 1200;
const MATCH_PRESENTATION_READY_FALLBACK_MS = 1200;
const TOURNAMENT_REWARD_SUMMARY_FALLBACK_MS = 4_000;
const TOURNAMENT_REWARD_MODAL_COUNTDOWN_MS = 20_000;
const TOURNAMENT_EXIT_VALIDATION_TIMEOUT_MS = 5_000;
const MATCH_LEAVE_TIMEOUT_MS = 1_500;
const SHOULD_BYPASS_CINEMATIC_INTROS = process.env.NODE_ENV === 'test';

const measureViewInWindow = (
  view: View | null,
  onMeasured: (x: number, y: number, width: number, height: number) => void,
): void => {
  if (!view) {
    return;
  }

  try {
    view.measureInWindow(onMeasured);
  } catch {
    // Ignore stale-node layout probes during web reflows/unmounts.
  }
};

const isMatchNotFoundSocketError = (error: unknown): boolean => {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const record = error as Record<string, unknown>;
  return record.code === 4 && typeof record.message === 'string' && /match not found/i.test(record.message);
};

const isUnauthorizedNakamaError = (error: unknown): boolean => {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const record = error as Record<string, unknown>;
  if (record.status === 401 || record.statusCode === 401 || record.code === 401) {
    return true;
  }

  return typeof record.message === 'string' && /unauthorized|expired|token/i.test(record.message);
};

const withTimeout = async <T,>(promise: Promise<T>, timeoutMs: number): Promise<T | null> => {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  try {
    return await Promise.race([
      promise,
      new Promise<null>((resolve) => {
        timeoutId = setTimeout(() => resolve(null), timeoutMs);
      }),
    ]);
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
};

type TournamentStatusSnapshot = Awaited<ReturnType<typeof getPublicTournamentStatus>>;

const getSingleEliminationRoundCountFromSnapshot = (
  snapshot: TournamentStatusSnapshot | null | undefined,
): number | null => {
  const sizeCandidates = [snapshot?.tournament?.maxEntrants, snapshot?.tournament?.entrants];

  for (const candidate of sizeCandidates) {
    if (typeof candidate !== 'number' || !Number.isFinite(candidate)) {
      continue;
    }

    const normalized = Math.floor(candidate);
    if (normalized < 2 || (normalized & (normalized - 1)) !== 0) {
      continue;
    }

    return Math.log2(normalized);
  }

  return null;
};

const deriveFinalRoundTournamentTerminalOutcome = (
  snapshot: TournamentStatusSnapshot | null | undefined,
  options: {
    didPlayerWin: boolean;
    initialRound: number | null;
  },
): 'champion' | 'runner_up' | null => {
  const totalRounds = getSingleEliminationRoundCountFromSnapshot(snapshot);
  const currentRound =
    options.initialRound ??
    snapshot?.tournament?.participation?.currentRound ??
    snapshot?.tournament?.currentRound ??
    null;

  if (totalRounds === null || currentRound !== totalRounds) {
    return null;
  }

  return options.didPlayerWin ? 'champion' : 'runner_up';
};

const isTerminalTournamentStatusSnapshot = (
  snapshot: TournamentStatusSnapshot | null | undefined,
  options: {
    didPlayerWin: boolean;
    initialRound: number | null;
  },
): boolean => {
  const lifecycle = snapshot?.tournament?.lifecycle ?? null;
  const participationState = snapshot?.tournament?.participation?.state ?? null;

  return (
    lifecycle === 'finalized' ||
    lifecycle === 'closed' ||
    participationState === 'champion' ||
    participationState === 'runner_up' ||
    participationState === 'eliminated' ||
    deriveFinalRoundTournamentTerminalOutcome(snapshot, options) !== null
  );
};

const deriveTerminalTournamentOutcomeFromSnapshot = (
  snapshot: TournamentStatusSnapshot | null | undefined,
  options: {
    didPlayerWin: boolean;
    initialRound: number | null;
  },
): 'champion' | 'runner_up' | 'eliminated' | null => {
  const lifecycle = snapshot?.tournament?.lifecycle ?? null;
  const participationState = snapshot?.tournament?.participation?.state ?? null;
  const finalPlacement = snapshot?.tournament?.participation?.finalPlacement ?? null;

  if (
    participationState === 'champion' ||
    participationState === 'runner_up' ||
    participationState === 'eliminated'
  ) {
    return participationState;
  }

  if (lifecycle === 'finalized' || lifecycle === 'closed') {
    if (finalPlacement === 1) {
      return 'champion';
    }

    if (finalPlacement === 2) {
      return 'runner_up';
    }
  }

  return deriveFinalRoundTournamentTerminalOutcome(snapshot, options);
};

const isServerConfirmedTournamentStatusSnapshot = (
  snapshot: TournamentStatusSnapshot | null | undefined,
): boolean => isServerConfirmedTournamentTerminal(snapshot?.tournament);

const deriveServerConfirmedTournamentOutcomeFromSnapshot = (
  snapshot: TournamentStatusSnapshot | null | undefined,
): 'champion' | 'runner_up' | 'eliminated' | null =>
  deriveServerConfirmedTournamentOutcome(snapshot?.tournament);

type MatchMomentCueKind = 'play' | 'rosette' | 'opponentJoined' | 'opponentForfeit';
type RollButtonLatchPhase = 'idle' | 'awaitingOutcome' | 'awaitingTurnReset';
type TutorialCoachPhase =
  | 'idle'
  | 'opening'
  | 'interlude'
  | 'lesson_play'
  | 'lesson_result'
  | 'completion'
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

const EMOJI_REACTION_OPTIONS: readonly EmojiReactionMenuOption[] = [
  { key: 'laughing', emoji: '😂', label: 'laughing' },
  { key: 'cool', emoji: '😎', label: 'cool' },
  { key: 'fire', emoji: '🔥', label: 'fire' },
  { key: 'omg', emoji: '😱', label: 'omg' },
  { key: 'skeleton', emoji: '💀', label: 'skeleton' },
] as const;

const EMOJI_BY_KEY: Record<EmojiReactionKey, string> = EMOJI_REACTION_OPTIONS.reduce(
  (entries, option) => ({
    ...entries,
    [option.key]: option.emoji,
  }),
  {} as Record<EmojiReactionKey, string>,
);

interface BoardTargetFrame {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface HeldRollDisplay {
  value: number;
  label: string | null;
}

type QueuedFloatingReaction = FloatingEmojiReactionItem;

const isMoveMatch = (left: MoveAction, right: MoveAction) =>
  left.pieceId === right.pieceId && left.fromIndex === right.fromIndex && left.toIndex === right.toIndex;

export function GameRoom() {
  const {
    id,
    offline,
    botDifficulty,
    tutorial,
    modeId,
    privateMatch,
    privateHost,
    privateCode,
    tournamentRunId,
    tournamentId,
    tournamentName,
    tournamentRound,
  } = useLocalSearchParams<{
    id?: string | string[];
    offline?: string | string[];
    botDifficulty?: string | string[];
    tutorial?: string | string[];
    modeId?: string | string[];
    privateMatch?: string | string[];
    privateHost?: string | string[];
    privateCode?: string | string[];
    tournamentRunId?: string | string[];
    tournamentId?: string | string[];
    tournamentName?: string | string[];
    tournamentRound?: string | string[];
  }>();
  const router = useRouter();
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [webVisualViewportSize, setWebVisualViewportSize] = React.useState<{ width: number; height: number } | null>(null);
  const [arePresentationAssetsReady, setArePresentationAssetsReady] = React.useState(SHOULD_BYPASS_CINEMATIC_INTROS);
  const [haveLoadedMatchPreferences, setHaveLoadedMatchPreferences] = React.useState(SHOULD_BYPASS_CINEMATIC_INTROS);
  const [hasMatchPresentationFallbackElapsed, setHasMatchPresentationFallbackElapsed] = React.useState(false);
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
  const tournamentRunIdParam = useMemo(
    () => (Array.isArray(tournamentRunId) ? tournamentRunId[0] : tournamentRunId),
    [tournamentRunId],
  );
  const tournamentIdParam = useMemo(
    () => (Array.isArray(tournamentId) ? tournamentId[0] : tournamentId),
    [tournamentId],
  );
  const tournamentNameParam = useMemo(
    () => (Array.isArray(tournamentName) ? tournamentName[0] : tournamentName),
    [tournamentName],
  );
  const tournamentRoundParam = useMemo(
    () => (Array.isArray(tournamentRound) ? tournamentRound[0] : tournamentRound),
    [tournamentRound],
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

    if (typeof window.addEventListener === 'function') {
      window.addEventListener('resize', syncVisualViewport);
    }
    if (typeof window.visualViewport?.addEventListener === 'function') {
      window.visualViewport.addEventListener('resize', syncVisualViewport);
      window.visualViewport.addEventListener('scroll', syncVisualViewport);
    }

    return () => {
      if (typeof window.removeEventListener === 'function') {
        window.removeEventListener('resize', syncVisualViewport);
      }
      if (typeof window.visualViewport?.removeEventListener === 'function') {
        window.visualViewport.removeEventListener('resize', syncVisualViewport);
        window.visualViewport.removeEventListener('scroll', syncVisualViewport);
      }
    };
  }, [height, width]);
  useEffect(() => {
    if (SHOULD_BYPASS_CINEMATIC_INTROS) {
      return;
    }

    let isMounted = true;

    const preloadPresentationAssets = async () => {
      try {
        await Asset.loadAsync(MATCH_PRESENTATION_ASSETS);
      } catch {
        // Fall back to the normal render path if preloading fails.
      } finally {
        if (isMounted) {
          setArePresentationAssetsReady(true);
        }
      }
    };

    void preloadPresentationAssets();

    return () => {
      isMounted = false;
    };
  }, []);
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
  const authoritativeServerTimeMs = useGameStore((state) => state.authoritativeServerTimeMs);
  const authoritativeTurnDurationMs = useGameStore((state) => state.authoritativeTurnDurationMs);
  const authoritativeTurnDeadlineMs = useGameStore((state) => state.authoritativeTurnDeadlineMs);
  const authoritativeTurnRemainingMs = useGameStore((state) => state.authoritativeTurnRemainingMs);
  const authoritativeActiveTimedPlayerColor = useGameStore((state) => state.authoritativeActiveTimedPlayerColor);
  const authoritativeActiveTimedPhase = useGameStore((state) => state.authoritativeActiveTimedPhase);
  const authoritativeHistoryCount = useGameStore((state) => state.authoritativeHistoryCount) ?? 0;
  const authoritativePlayers = useGameStore((state) => state.authoritativePlayers);
  const authoritativeMatchEnd = useGameStore((state) => state.authoritativeMatchEnd);
  const authoritativeSnapshotReceivedAtMs = useGameStore((state) => state.authoritativeSnapshotReceivedAtMs);
  const applyServerSnapshot = useGameStore((state) => state.applyServerSnapshot);
  const setGameStateFromServer = useGameStore((state) => state.setGameStateFromServer);
  const setPlayerColor = useGameStore((state) => state.setPlayerColor);
  const setUserId = useGameStore((state) => state.setUserId);
  const setOnlineMode = useGameStore((state) => state.setOnlineMode);
  const setMatchPresences = useGameStore((state) => state.setMatchPresences);
  const updateMatchPresences = useGameStore((state) => state.updateMatchPresences);
  const setLastProgressionAward = useGameStore((state) => state.setLastProgressionAward);
  const setLastProgressionSnapshot = useGameStore((state) => state.setLastProgressionSnapshot);
  const setLastEloRatingChange = useGameStore((state) => state.setLastEloRatingChange);
  const setLastEloRatingProfileSnapshot = useGameStore((state) => state.setLastEloRatingProfileSnapshot);
  const setLastChallengeProgressSnapshot = useGameStore((state) => state.setLastChallengeProgressSnapshot);
  const setSocketState = useGameStore((state) => state.setSocketState);
  const socketState = useGameStore((state) => state.socketState);
  const setRollCommandSender = useGameStore((state) => state.setRollCommandSender);
  const setMoveCommandSender = useGameStore((state) => state.setMoveCommandSender);
  const { progression, refresh: refreshProgression, errorMessage: progressionError } = useProgression();
  const { refresh: refreshElo } = useEloRating();
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
  const isTournamentMatch = Boolean(tournamentRunIdParam && tournamentIdParam);
  const tournamentDisplayName = tournamentNameParam ?? 'Tournament Match';
  const pieceCountPerSide = effectiveMatchConfig.pieceCountPerSide;
  const isPracticeModeMatch = effectiveMatchConfig.isPracticeMode;
  const rulesIntro = useMemo(() => getMatchRulesIntro(effectiveMatchConfig.modeId), [effectiveMatchConfig.modeId]);
  const offlineBotRewardMode: CompletedBotMatchRewardMode | undefined =
    isPlaythroughTutorialMatch ? 'base_win_only' : undefined;
  const authenticatedUserId = userId ?? user?.nakamaUserId ?? user?.id ?? null;
  const effectiveHistoryCount = isOffline
    ? gameState.history.length
    : Math.max(authoritativeHistoryCount, gameState.history.length);
  const humanScoreTitle = useMemo(() => getHumanScoreTitle(user), [user]);
  const resolvedPlayerColor = useMemo(
    () =>
      resolveMatchPlayerColor({
        playerColor,
        authoritativePlayers,
        userId: authenticatedUserId,
      }),
    [authenticatedUserId, authoritativePlayers, playerColor],
  );
  const scoreTitles = useMemo<Record<PlayerColor, string>>(() => {
    if (isOffline) {
      return {
        light: humanScoreTitle,
        dark: getBotScoreTitle(resolvedBotDifficulty),
      };
    }

    return {
      light:
        getSnapshotScoreTitle(authoritativePlayers, 'light') ??
        (resolvedPlayerColor === 'light' ? humanScoreTitle : 'LIGHT'),
      dark:
        getSnapshotScoreTitle(authoritativePlayers, 'dark') ??
        (resolvedPlayerColor === 'dark' ? humanScoreTitle : 'DARK'),
    };
  }, [authoritativePlayers, humanScoreTitle, isOffline, resolvedBotDifficulty, resolvedPlayerColor]);
  const practiceModeRewardLabel = isPracticeModeMatch ? getPracticeModeRewardLabel(effectiveMatchConfig) : null;
  const hasAssignedColor = resolvedPlayerColor === 'light' || resolvedPlayerColor === 'dark';
  const canSyncOfflineBotRewards =
    effectiveMatchConfig.allowsXp && isOffline && isNakamaEnabled() && hasNakamaConfig() && Boolean(user);
  const shouldShowAccountRewards =
    (!isOffline && (effectiveMatchConfig.allowsXp || isPrivateMatch)) || canSyncOfflineBotRewards;
  const shouldShowChallengeRewards =
    shouldShowAccountRewards &&
    effectiveMatchConfig.allowsChallenges &&
    !isPlaythroughTutorialMatch;
  const isRankedHumanMatch =
    !isOffline &&
    (effectiveMatchConfig.allowsRankedStats || isTournamentMatch) &&
    !isPlaythroughTutorialMatch;
  const eloUnchangedReason = isRankedHumanMatch
    ? null
    : isOffline
        ? 'Bot and offline matches do not affect Elo.'
        : !effectiveMatchConfig.allowsRankedStats && !isTournamentMatch
          ? 'This mode does not affect Elo.'
          : 'Elo was unchanged for this match.';
  const effectiveMatchToken = storedMatchId === matchId ? matchToken : null;
  const isMyTurn = hasAssignedColor && gameState.currentTurn === resolvedPlayerColor;
  const didPlayerWin =
    resolveDidPlayerWin({
      winnerColor: gameState.winner,
      resolvedPlayerColor,
      authoritativeMatchEnd,
      userId: authenticatedUserId,
    }) === true;
  const tournamentPlayerUserId = authenticatedUserId;
  const initialTournamentRound = useMemo(() => {
    if (!tournamentRoundParam) {
      return null;
    }

    const parsed = Number(tournamentRoundParam);
    return Number.isFinite(parsed) ? Math.max(1, Math.floor(parsed)) : null;
  }, [tournamentRoundParam]);
  const onlineMatchEnd = isOffline ? null : authoritativeMatchEnd;
  const winModalTitle = didPlayerWin ? 'Victory' : 'Defeat';
  const winModalMessage = useMemo(() => {
    if (hasAssignedColor && onlineMatchEnd?.reason === 'forfeit_inactivity') {
      return didPlayerWin ? 'Opponent forfeited due to inactivity.' : 'You forfeited due to inactivity.';
    }

    return didPlayerWin ? 'The royal path is yours.' : 'The opponent seized the final lane.';
  }, [didPlayerWin, hasAssignedColor, onlineMatchEnd]);
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
  const tournamentBotOpponentColor = useMemo<PlayerColor | null>(() => {
    if (isOffline || !isTournamentMatch || !authoritativePlayers) {
      return null;
    }

    if (
      authoritativePlayers.light.userId !== authenticatedUserId &&
      isTournamentBotUserId(authoritativePlayers.light.userId)
    ) {
      return 'light';
    }

    if (
      authoritativePlayers.dark.userId !== authenticatedUserId &&
      isTournamentBotUserId(authoritativePlayers.dark.userId)
    ) {
      return 'dark';
    }

    return null;
  }, [authoritativePlayers, authenticatedUserId, isOffline, isTournamentMatch]);
  const tournamentBotOpponentTitle = useMemo(() => {
    if (!tournamentBotOpponentColor) {
      return null;
    }

    return (
      getSnapshotScoreTitle(authoritativePlayers, tournamentBotOpponentColor) ??
      scoreTitles[tournamentBotOpponentColor]
    );
  }, [authoritativePlayers, scoreTitles, tournamentBotOpponentColor]);
  const hasTournamentBotOpponent = tournamentBotOpponentColor !== null;
  const hasOpponentJoined =
    !isOffline &&
    (joinedPlayerCount >= 2 || gameState.winner !== null || hasTournamentBotOpponent);
  const isOnlineHumanMatch = !isOffline && !hasTournamentBotOpponent;
  const shouldShowEmojiControls = isOnlineHumanMatch && hasOpponentJoined;
  const requiresOpponentPresence = isPrivateMatch || (isTournamentMatch && !hasTournamentBotOpponent);
  const isOpponentReadyToPlay = !requiresOpponentPresence || hasOpponentJoined;
  const isOnlineInteractionReady = isOffline || socketState === 'connected';
  const canRoll = isMyTurn && gameState.phase === 'rolling' && isOpponentReadyToPlay && isOnlineInteractionReady;
  const isMatchFinished = gameState.winner !== null || gameState.phase === 'ended';
  const shouldFreezeForfeitMotion =
    !isOffline &&
    onlineMatchEnd?.reason === 'forfeit_inactivity' &&
    isMatchFinished;
  const onlineMatchStatusPillText = useMemo(() => {
    if (isOffline) {
      return null;
    }

    if (isPrivateMatch) {
      return privateMatchCode ? `Private Match - ${privateMatchCode}` : 'Private Match';
    }

    const opponentStatus = tournamentBotOpponentTitle
      ? `${tournamentBotOpponentTitle} Ready`
      : hasOpponentJoined
        ? 'Opponent Joined'
        : 'Waiting for Opponent';

    if (isTournamentMatch) {
      return `${tournamentDisplayName} - ${opponentStatus}`;
    }

    return `Online Match - ${opponentStatus}`;
  }, [
    hasOpponentJoined,
    isOffline,
    isPrivateMatch,
    isTournamentMatch,
    privateMatchCode,
    tournamentBotOpponentTitle,
    tournamentDisplayName,
  ]);

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
  const [tournamentRewardSummary, setTournamentRewardSummary] =
    React.useState<TournamentMatchRewardSummaryPayload | null>(null);
  const [tournamentRewardFallbackActive, setTournamentRewardFallbackActive] = React.useState(false);
  const [tournamentTerminalOutcomeOverride, setTournamentTerminalOutcomeOverride] = React.useState<
    'champion' | 'runner_up' | 'eliminated' | null
  >(null);
  const [tournamentAdvanceResolutionState, setTournamentAdvanceResolutionState] = React.useState<
    'idle' | 'checking' | 'waiting' | 'terminal'
  >('idle');
  const [hasEnteredTournamentWaitingRoom, setHasEnteredTournamentWaitingRoom] = React.useState(false);
  const [tournamentWaitingRoomCountdownMs, setTournamentWaitingRoomCountdownMs] = React.useState<number | null>(null);
  const [isValidatingTournamentExit, setIsValidatingTournamentExit] = React.useState(false);
  const [tournamentExitValidationFailed, setTournamentExitValidationFailed] = React.useState(false);
  const [showAudioSettings, setShowAudioSettings] = React.useState(false);
  const [showTopMenu, setShowTopMenu] = React.useState(false);
  const [showMatchStatusInfo, setShowMatchStatusInfo] = React.useState(false);
  const [showEmojiReactionMenu, setShowEmojiReactionMenu] = React.useState(false);
  const [emojiReactionsRemaining, setEmojiReactionsRemaining] = React.useState(MAX_EMOJI_REACTIONS_PER_MATCH);
  const [showRulesIntroModal, setShowRulesIntroModal] = React.useState(Boolean(rulesIntro));
  const [matchChallengeSummary, setMatchChallengeSummary] = React.useState<MatchChallengeRewardSummary | null>(null);
  const [matchRewardsErrorMessage, setMatchRewardsErrorMessage] = React.useState<string | null>(null);
  const [isRefreshingMatchRewards, setIsRefreshingMatchRewards] = React.useState(false);
  const [floatingReactions, setFloatingReactions] = React.useState<QueuedFloatingReaction[]>([]);
  const [rollingVisual, setRollingVisual] = React.useState(false);
  const [rollButtonLatchPhase, setRollButtonLatchPhase] = React.useState<RollButtonLatchPhase>('idle');
  const [heldRollDisplay, setHeldRollDisplay] = React.useState<HeldRollDisplay | null>(null);
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
  const [mobileBoardTrayAlignmentCorrection, setMobileBoardTrayAlignmentCorrection] = React.useState(0);
  const [hasResolvedMobileContentShift, setHasResolvedMobileContentShift] = React.useState(false);
  const hasMeasuredReserveTargets = lightReserveSlots.length > 0 || darkReserveSlots.length > 0;
  const shouldSkipReserveCascadeIntro = hasPlayedBoardDropIntro && !hasMeasuredReserveTargets;
  const introsComplete =
    SHOULD_BYPASS_CINEMATIC_INTROS ||
    (hasPlayedBoardDropIntro && (hasPlayedReserveCascadeIntro || shouldSkipReserveCascadeIntro));
  const [turnTimerCycleId, setTurnTimerCycleId] = React.useState(0);
  const [onlineTimerNowMs, setOnlineTimerNowMs] = React.useState(() => Date.now());
  const [activeMatchCue, setActiveMatchCue] = React.useState<MatchMomentIndicatorCue | null>(null);
  const [mobileScoreRowHeight, setMobileScoreRowHeight] = React.useState(0);
  const [tutorialCoachPhase, setTutorialCoachPhase] = React.useState<TutorialCoachPhase>('idle');
  const [tutorialCoachInterlude, setTutorialCoachInterlude] = React.useState<TutorialResultModalContent | null>(null);
  const [tutorialForcedNoMove, setTutorialForcedNoMove] = React.useState(false);
  const [tutorialPinnedObjectiveBanner, setTutorialPinnedObjectiveBanner] = React.useState<string | null>(null);
  const [tutorialLessonIndex, setTutorialLessonIndex] = React.useState(0);
  const [tutorialScriptStepIndex, setTutorialScriptStepIndex] = React.useState(0);
  const isTournamentRewardSummaryPrimary = Boolean(tournamentRewardSummary) && !tournamentRewardFallbackActive;
  const tournamentOutcome = tournamentRewardSummary?.tournamentOutcome ?? null;
  const shouldTrackTournamentAdvanceFlow =
    showWinModal &&
    isTournamentMatch &&
    ((isTournamentRewardSummaryPrimary &&
      tournamentOutcome === 'advancing' &&
      tournamentRewardSummary?.shouldEnterWaitingRoom === true) ||
      (!isTournamentRewardSummaryPrimary && tournamentRewardFallbackActive));
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
    historyCount: number;
  } | null>(null);
  const rollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const heldRollResultTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingHeldRollDisplayRef = useRef<HeldRollDisplay | null>(null);
  const autoRollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scoreBannerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const turnTimeoutTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tutorialProgressTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
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
  const floatingReactionIdRef = useRef(0);
  const previousStateRef = useRef<{ matchId: string | null; state: GameState; historyCount: number }>({
    matchId: matchId ?? null,
    state: gameState,
    historyCount: effectiveHistoryCount,
  });
  const previousRenderedMatchIdRef = useRef<string | null>(matchId ?? null);
  const tutorialHydratingStateRef = useRef(false);
  const previousTurnTimerStateRef = useRef<{
    matchId: string | null;
    currentTurn: PlayerColor;
    phase: typeof gameState.phase;
  } | null>(null);
  const previousJoinedPlayerCountRef = useRef(0);
  const activeRouteMatchIdRef = useRef<string | null>(matchId ?? null);
  activeRouteMatchIdRef.current = matchId ?? null;

  const appendFloatingReaction = React.useCallback(
    (payload: EmojiReactionBroadcastPayload) => {
      const emoji = EMOJI_BY_KEY[payload.emoji];
      const spawnOffsetX = (Math.random() - 0.5) * 56;
      const driftX = (Math.random() - 0.5) * 48;
      const baseLeft = payload.senderColor === 'light' ? viewportWidth * 0.28 : viewportWidth * 0.68;
      const useCompactBottomLane = viewportWidth < 760;
      const left = Math.max(18, Math.min(viewportWidth - 66, baseLeft + spawnOffsetX));
      const bottom = Math.max(92, Math.round(viewportHeight * (useCompactBottomLane ? 0.17 : 0.14)));

      floatingReactionIdRef.current += 1;
      setFloatingReactions((current) => [
        ...current,
        {
          id: `${payload.createdAtMs}:${floatingReactionIdRef.current}`,
          emoji,
          senderColor: payload.senderColor,
          left,
          bottom,
          driftX,
        },
      ]);
    },
    [viewportHeight, viewportWidth],
  );

  const removeFloatingReaction = React.useCallback((id: string) => {
    setFloatingReactions((current) => current.filter((reaction) => reaction.id !== id));
  }, []);

  const handleToggleEmojiReactionMenu = React.useCallback(() => {
    if (emojiReactionsRemaining <= 0 || !shouldShowEmojiControls || !isOnlineInteractionReady) {
      return;
    }

    setShowEmojiReactionMenu((current) => !current);
  }, [emojiReactionsRemaining, isOnlineInteractionReady, shouldShowEmojiControls]);

  const sendEmojiReaction = React.useCallback(
    async (emoji: EmojiReactionKey) => {
      setShowEmojiReactionMenu(false);

      if (!matchId || !shouldShowEmojiControls || emojiReactionsRemaining <= 0) {
        return;
      }

      const socket = socketRef.current;
      if (!socket) {
        return;
      }

      const payload: EmojiReactionRequestPayload = {
        type: 'emoji_reaction',
        emoji,
      };

      console.info('[Nakama][send]', {
        eventType: payload.type,
        matchId,
        revision: serverRevision,
        payload,
      });

      try {
        await socket.sendMatchState(matchId, MatchOpCode.EMOJI_REACTION, encodePayload(payload));
      } catch (error) {
        suppressReconnectRef.current = isUnauthorizedNakamaError(error);
        console.error('[Nakama][send_failed]', {
          error,
          eventType: payload.type,
          matchId,
          revision: serverRevision,
        });
        socket.ondisconnect({} as Event);
      }
    },
    [emojiReactionsRemaining, matchId, serverRevision, shouldShowEmojiControls],
  );

  const tutorialLesson =
    tutorialLessonIndex < PLAYTHROUGH_TUTORIAL_LESSONS.length
      ? PLAYTHROUGH_TUTORIAL_LESSONS[tutorialLessonIndex]
      : null;
  const tutorialPendingStep =
    tutorialScriptStepIndex < PLAYTHROUGH_TUTORIAL_SCRIPT.length
      ? PLAYTHROUGH_TUTORIAL_SCRIPT[tutorialScriptStepIndex]
      : null;
  const tutorialPendingActionStep =
    tutorialPendingStep?.kind === 'ROLL' || tutorialPendingStep?.kind === 'MOVE'
      ? tutorialPendingStep
      : null;
  const tutorialCoachVisible =
    tutorialCoachPhase === 'opening' ||
    (tutorialCoachPhase === 'interlude' && tutorialCoachInterlude !== null) ||
    tutorialCoachPhase === 'lesson_result' ||
    tutorialCoachPhase === 'completion';
  const tutorialCoachEyebrow =
    tutorialCoachPhase === 'opening'
      ? PLAYTHROUGH_TUTORIAL_OPENING_MODAL.eyebrow
      : tutorialCoachPhase === 'interlude'
        ? tutorialCoachInterlude?.eyebrow
      : tutorialCoachPhase === 'lesson_result'
        ? 'What this means'
        : tutorialCoachPhase === 'completion'
          ? PLAYTHROUGH_TUTORIAL_COMPLETION_MODAL.eyebrow
        : undefined;
  const tutorialCoachTitle =
    tutorialCoachPhase === 'opening'
      ? PLAYTHROUGH_TUTORIAL_OPENING_MODAL.title
      : tutorialCoachPhase === 'interlude'
        ? tutorialCoachInterlude?.title ?? ''
      : tutorialCoachPhase === 'lesson_result' && tutorialLesson
        ? tutorialLesson.title
        : tutorialCoachPhase === 'completion'
          ? PLAYTHROUGH_TUTORIAL_COMPLETION_MODAL.title
        : '';
  const tutorialCoachBody =
    tutorialCoachPhase === 'opening'
      ? PLAYTHROUGH_TUTORIAL_OPENING_MODAL.body
      : tutorialCoachPhase === 'interlude'
        ? tutorialCoachInterlude?.body ?? ''
      : tutorialCoachPhase === 'lesson_result' && tutorialLesson
        ? tutorialLesson.implication
        : tutorialCoachPhase === 'completion'
          ? PLAYTHROUGH_TUTORIAL_COMPLETION_MODAL.body
        : '';
  const tutorialCoachActionLabel =
    tutorialCoachPhase === 'opening'
      ? PLAYTHROUGH_TUTORIAL_OPENING_MODAL.actionLabel
      : tutorialCoachPhase === 'interlude'
        ? tutorialCoachInterlude?.actionLabel ?? 'Continue'
      : tutorialCoachPhase === 'completion'
        ? PLAYTHROUGH_TUTORIAL_COMPLETION_MODAL.actionLabel
      : 'Continue';
  const tutorialObjectiveBanner =
    tutorialCoachPhase === 'lesson_play'
      ? getPlaythroughTutorialInstruction({
        stepId: tutorialPendingStep?.id ?? null,
        turn: gameState.currentTurn,
        phase: gameState.phase,
        rollValue: gameState.rollValue,
        hasMoves: tutorialForcedNoMove ? false : validMoves.length > 0,
      })
      : null;
  const displayedTutorialObjectiveBanner = tutorialObjectiveBanner ?? tutorialPinnedObjectiveBanner;
  useEffect(() => {
    setEmojiReactionsRemaining(MAX_EMOJI_REACTIONS_PER_MATCH);
    setShowEmojiReactionMenu(false);
    setFloatingReactions([]);
  }, [matchId]);

  useEffect(() => {
    if (!shouldShowEmojiControls) {
      setShowEmojiReactionMenu(false);
    }
  }, [shouldShowEmojiControls]);

  useEffect(() => {
    if (tutorialObjectiveBanner) {
      setTutorialPinnedObjectiveBanner((current) =>
        current === tutorialObjectiveBanner ? current : tutorialObjectiveBanner,
      );
      return;
    }

    if (!isPlaythroughTutorialMatch || tutorialCoachPhase === 'idle' || tutorialCoachPhase === 'freeplay') {
      setTutorialPinnedObjectiveBanner(null);
    }
  }, [isPlaythroughTutorialMatch, tutorialCoachPhase, tutorialObjectiveBanner]);
  const tournamentAdvanceFlow = useTournamentAdvanceFlow({
    enabled: shouldTrackTournamentAdvanceFlow,
    runId: tournamentRunIdParam ?? null,
    tournamentId: tournamentIdParam ?? null,
    tournamentName: tournamentDisplayName,
    gameMode: effectiveMatchConfig.modeId,
    didPlayerWin,
    playerUserId: tournamentPlayerUserId,
    finishedMatchId: matchId ?? null,
    initialRound: initialTournamentRound,
  });
  const shouldResolveTournamentAdvanceBeforeModal =
    showWinModal &&
    isTournamentMatch &&
    isTournamentRewardSummaryPrimary &&
    tournamentOutcome === 'advancing' &&
    tournamentRewardSummary?.shouldEnterWaitingRoom === true &&
    !hasEnteredTournamentWaitingRoom;
  const isCheckingTournamentAdvanceResolution =
    shouldResolveTournamentAdvanceBeforeModal &&
    (tournamentAdvanceResolutionState === 'idle' || tournamentAdvanceResolutionState === 'checking');
  const hasTournamentAdvanceResolvedTerminal =
    tournamentAdvanceResolutionState === 'terminal' ||
    (shouldTrackTournamentAdvanceFlow &&
      (tournamentAdvanceFlow.phase === 'eliminated' || tournamentAdvanceFlow.phase === 'finalized'));
  const showTournamentAdvanceResolutionModal =
    shouldResolveTournamentAdvanceBeforeModal && isCheckingTournamentAdvanceResolution;
  const showTournamentWaitingRoom =
    showWinModal &&
    isTournamentMatch &&
    ((isTournamentRewardSummaryPrimary &&
      tournamentOutcome === 'advancing' &&
      tournamentRewardSummary?.shouldEnterWaitingRoom === true &&
      hasEnteredTournamentWaitingRoom &&
      !hasTournamentAdvanceResolvedTerminal) ||
      (!isTournamentRewardSummaryPrimary &&
        tournamentRewardFallbackActive &&
        didPlayerWin &&
        !['eliminated', 'finalized'].includes(tournamentAdvanceFlow.phase)));
  const showTournamentFallbackPendingModal =
    showWinModal &&
    isTournamentMatch &&
    !isTournamentRewardSummaryPrimary &&
    tournamentRewardFallbackActive &&
    !didPlayerWin &&
    !hasTournamentAdvanceResolvedTerminal &&
    !['eliminated', 'finalized'].includes(tournamentAdvanceFlow.phase);
  const isTournamentResultModal =
    showWinModal &&
    isTournamentMatch &&
    ((isTournamentRewardSummaryPrimary &&
      (tournamentOutcome !== 'advancing' || hasTournamentAdvanceResolvedTerminal)) ||
      (!isTournamentRewardSummaryPrimary &&
        tournamentRewardFallbackActive &&
        (tournamentAdvanceFlow.phase === 'eliminated' || tournamentAdvanceFlow.phase === 'finalized')));
  const shouldAutoExitTournamentResultModal = isTournamentResultModal && !didPlayerWin;
  const shouldRenderResultModal =
    showWinModal &&
    (!isTournamentMatch ||
      showTournamentAdvanceResolutionModal ||
      showTournamentFallbackPendingModal ||
      isTournamentResultModal);
  const tournamentResultModalTitle = useMemo(() => {
    if (
      !isTournamentMatch ||
      (!showTournamentAdvanceResolutionModal &&
        !showTournamentFallbackPendingModal &&
        !isTournamentResultModal)
    ) {
      return winModalTitle;
    }

    if (showTournamentAdvanceResolutionModal) {
      return 'Victory';
    }

    if (showTournamentFallbackPendingModal) {
      return winModalTitle;
    }

    if (tournamentTerminalOutcomeOverride === 'eliminated') {
      return 'Tournament Eliminated';
    }

    if (tournamentTerminalOutcomeOverride === 'champion') {
      return 'Tournament Won';
    }

    if (tournamentTerminalOutcomeOverride === 'runner_up') {
      return 'Tournament Complete';
    }

    if (isTournamentRewardSummaryPrimary) {
      if (tournamentOutcome === 'eliminated') {
        return 'Tournament Eliminated';
      }

      if (tournamentOutcome === 'champion') {
        return 'Tournament Won';
      }

      if (tournamentAdvanceFlow.phase === 'eliminated') {
        return 'Tournament Eliminated';
      }

      if (tournamentAdvanceFlow.isChampion) {
        return 'Tournament Won';
      }

      return 'Tournament Complete';
    }

    if (tournamentAdvanceFlow.phase === 'eliminated') {
      return 'Tournament Eliminated';
    }

    if (tournamentAdvanceFlow.isChampion) {
      return 'Tournament Won';
    }

    return 'Tournament Complete';
  }, [
    isTournamentMatch,
    isTournamentResultModal,
    isTournamentRewardSummaryPrimary,
    showTournamentFallbackPendingModal,
    showTournamentAdvanceResolutionModal,
    tournamentAdvanceFlow.isChampion,
    tournamentAdvanceFlow.phase,
    tournamentTerminalOutcomeOverride,
    tournamentOutcome,
    winModalTitle,
  ]);
  const tournamentResultModalMessage = useMemo(() => {
    let baseMessage = winModalMessage;

    if (
      !isTournamentMatch ||
      (!showTournamentAdvanceResolutionModal &&
        !showTournamentFallbackPendingModal &&
        !isTournamentResultModal)
    ) {
      return baseMessage;
    }

    if (showTournamentAdvanceResolutionModal) {
      baseMessage = 'Finalizing your tournament result before deciding whether another round is needed.';
    } else if (showTournamentFallbackPendingModal) {
      baseMessage = tournamentAdvanceFlow.subtleStatusText
        ? `${tournamentAdvanceFlow.statusText} ${tournamentAdvanceFlow.subtleStatusText}`
        : tournamentAdvanceFlow.statusText;
    } else if (tournamentTerminalOutcomeOverride === 'eliminated') {
      baseMessage = onlineMatchEnd?.reason === 'forfeit_inactivity'
        ? 'You forfeited due to inactivity and were eliminated from the tournament.'
        : 'Your tournament run has ended.';
    } else if (tournamentTerminalOutcomeOverride === 'champion') {
      baseMessage = 'You won the tournament and finished as champion.';
    } else if (tournamentTerminalOutcomeOverride === 'runner_up') {
      baseMessage = 'The final is complete. You finished the tournament as runner-up.';
    } else if (isTournamentRewardSummaryPrimary) {
      if (tournamentOutcome === 'eliminated') {
        baseMessage = onlineMatchEnd?.reason === 'forfeit_inactivity'
          ? 'You forfeited due to inactivity and were eliminated from the tournament.'
          : 'Your tournament run has ended.';
      } else if (tournamentOutcome === 'champion') {
        baseMessage = 'You won the tournament and finished as champion.';
      } else if (tournamentOutcome === 'runner_up') {
        baseMessage = 'The final is complete. You finished the tournament as runner-up.';
      } else if (tournamentAdvanceFlow.phase === 'eliminated') {
        baseMessage = onlineMatchEnd?.reason === 'forfeit_inactivity'
          ? 'You forfeited due to inactivity and were eliminated from the tournament.'
          : 'Your tournament run has ended.';
      } else if (tournamentAdvanceFlow.isChampion) {
        baseMessage = 'You won the tournament and finished as champion.';
      } else if (tournamentAdvanceFlow.finalPlacement === 2) {
        baseMessage = 'The final is complete. You finished the tournament as runner-up.';
      } else if (tournamentAdvanceFlow.phase === 'finalized') {
        baseMessage = 'The tournament bracket is complete and your final result is locked in.';
      }
    } else if (tournamentAdvanceFlow.phase === 'eliminated') {
      baseMessage = onlineMatchEnd?.reason === 'forfeit_inactivity'
        ? 'You forfeited due to inactivity and were eliminated from the tournament.'
        : 'Your tournament run has ended.';
    } else if (tournamentAdvanceFlow.isChampion) {
      baseMessage = 'You won the tournament and finished as champion.';
    } else if (tournamentAdvanceFlow.finalPlacement === 2) {
      baseMessage = 'The final is complete. You finished the tournament as runner-up.';
    } else {
      baseMessage = 'The tournament bracket is complete and your final result is locked in.';
    }

    if (isTournamentResultModal && isValidatingTournamentExit) {
      return 'Finalizing tournament result before returning home.';
    }

    if (isTournamentResultModal && tournamentExitValidationFailed) {
      return `${baseMessage} We could not confirm the final standings in time, so you can leave anyway.`;
    }

    return baseMessage;
  }, [
    isTournamentMatch,
    isTournamentResultModal,
    isValidatingTournamentExit,
    isTournamentRewardSummaryPrimary,
    onlineMatchEnd?.reason,
    showTournamentFallbackPendingModal,
    showTournamentAdvanceResolutionModal,
    tournamentExitValidationFailed,
    tournamentAdvanceFlow.finalPlacement,
    tournamentAdvanceFlow.isChampion,
    tournamentAdvanceFlow.phase,
    tournamentAdvanceFlow.statusText,
    tournamentAdvanceFlow.subtleStatusText,
    tournamentTerminalOutcomeOverride,
    tournamentOutcome,
    winModalMessage,
  ]);
  const tournamentCountdownLabel = useMemo(() => {
    if (!shouldAutoExitTournamentResultModal || tournamentWaitingRoomCountdownMs === null) {
      return null;
    }

    const remainingSeconds = Math.max(0, Math.ceil(tournamentWaitingRoomCountdownMs / 1000));
    return `Returning to the home page automatically in ${remainingSeconds}s.`;
  }, [shouldAutoExitTournamentResultModal, tournamentWaitingRoomCountdownMs]);
  const resultModalActionLabel = useMemo(() => {
    if (showTournamentAdvanceResolutionModal) {
      return undefined;
    }

    if (showTournamentFallbackPendingModal) {
      return undefined;
    }

    if (isTournamentResultModal) {
      return tournamentExitValidationFailed ? 'Leave Anyway' : 'Return to Home Page';
    }

    return 'Return to Menu';
  }, [
    isTournamentResultModal,
    showTournamentFallbackPendingModal,
    showTournamentAdvanceResolutionModal,
    tournamentExitValidationFailed,
  ]);
  const canUseTopExit = !isTournamentMatch || isTournamentResultModal;

  const cueSystemReady = ancientCueFontLoaded || Boolean(ancientCueFontError);
  const cueFontFamily = ancientCueFontLoaded ? MATCH_CUE_FONT_FAMILY : undefined;
  const rollResultFontFamily = ancientCueFontLoaded ? MATCH_CUE_FONT_FAMILY : urTypography.title.fontFamily;
  const isRollButtonPressedIn = rollButtonLatchPhase !== 'idle';
  const diceAnimationDurationMs = useMemo(
    () => Math.max(400, Math.round(DEFAULT_DICE_ROLL_DURATION_MS / diceAnimationSpeed)),
    [diceAnimationSpeed],
  );
  const visualTurnTimerDurationMs = turnTimerSeconds * 1000;
  const resolvedAuthoritativeServerTimeMs = useMemo(() => {
    if (
      isOffline ||
      authoritativeServerTimeMs === null ||
      authoritativeSnapshotReceivedAtMs === null
    ) {
      return null;
    }

    return authoritativeServerTimeMs + Math.max(0, onlineTimerNowMs - authoritativeSnapshotReceivedAtMs);
  }, [
    authoritativeServerTimeMs,
    authoritativeSnapshotReceivedAtMs,
    isOffline,
    onlineTimerNowMs,
  ]);
  const onlineTurnTimerDurationMs = !isOffline && authoritativeTurnDeadlineMs !== null
    ? (authoritativeTurnDurationMs ?? 10_000)
    : undefined;
  const onlineTurnTimerRemainingMs = useMemo(() => {
    if (isOffline || onlineTurnTimerDurationMs === undefined) {
      return undefined;
    }

    if (resolvedAuthoritativeServerTimeMs !== null && authoritativeTurnDeadlineMs !== null) {
      return Math.max(0, authoritativeTurnDeadlineMs - resolvedAuthoritativeServerTimeMs);
    }

    if (authoritativeTurnRemainingMs !== null) {
      return Math.max(0, authoritativeTurnRemainingMs);
    }

    return undefined;
  }, [
    authoritativeTurnDeadlineMs,
    authoritativeTurnRemainingMs,
    isOffline,
    onlineTurnTimerDurationMs,
    resolvedAuthoritativeServerTimeMs,
  ]);
  const resolvedTurnTimerDurationMs = isOffline ? visualTurnTimerDurationMs : onlineTurnTimerDurationMs;
  const resolvedTurnTimerRemainingMs = isOffline ? undefined : onlineTurnTimerRemainingMs;
  const resolvedTurnTimerKey = isOffline
    ? turnTimerCycleId
    : `${serverRevision}:${authoritativeTurnDeadlineMs ?? 'idle'}`;

  const clearRollTimer = React.useCallback(() => {
    if (rollTimerRef.current) {
      clearTimeout(rollTimerRef.current);
      rollTimerRef.current = null;
    }
  }, []);

  const clearHeldRollResultTimer = React.useCallback(() => {
    if (heldRollResultTimerRef.current) {
      clearTimeout(heldRollResultTimerRef.current);
      heldRollResultTimerRef.current = null;
    }
  }, []);

  const clearHeldRollResult = React.useCallback(() => {
    clearHeldRollResultTimer();
    pendingHeldRollDisplayRef.current = null;
    setHeldRollDisplay(null);
  }, [clearHeldRollResultTimer]);

  const showHeldRollResult = React.useCallback((display: HeldRollDisplay) => {
    clearHeldRollResultTimer();
    pendingHeldRollDisplayRef.current = null;
    setHeldRollDisplay(display);
    heldRollResultTimerRef.current = setTimeout(() => {
      heldRollResultTimerRef.current = null;
      setHeldRollDisplay((current) =>
        current && current.value === display.value && current.label === display.label ? null : current,
      );
    }, ROLL_RESULT_HOLD_MS);
  }, [clearHeldRollResultTimer]);

  const clearTutorialProgressTimers = React.useCallback(() => {
    tutorialProgressTimersRef.current.forEach((timer) => clearTimeout(timer));
    tutorialProgressTimersRef.current = [];
  }, []);

  const clearScheduledTutorialProgress = React.useCallback((timer: ReturnType<typeof setTimeout>) => {
    clearTimeout(timer);
    tutorialProgressTimersRef.current = tutorialProgressTimersRef.current.filter((candidate) => candidate !== timer);
  }, []);

  const scheduleTutorialProgress = React.useCallback((delayMs: number, callback: () => void) => {
    const timer = setTimeout(() => {
      tutorialProgressTimersRef.current = tutorialProgressTimersRef.current.filter((candidate) => candidate !== timer);
      callback();
    }, delayMs);

    tutorialProgressTimersRef.current.push(timer);
    return timer;
  }, []);

  const scheduleRollVisualFallback = React.useCallback(() => {
    clearRollTimer();
    rollTimerRef.current = setTimeout(() => {
      rollTimerRef.current = null;
      setRollingVisual(false);
    }, diceAnimationDurationMs + 180);
  }, [clearRollTimer, diceAnimationDurationMs]);

  const handleRollResultShown = React.useCallback(() => {
    clearRollTimer();
    const pendingHeldRollDisplay = pendingHeldRollDisplayRef.current;
    if (pendingHeldRollDisplay !== null) {
      showHeldRollResult(pendingHeldRollDisplay);
    }
    setRollingVisual(false);
  }, [clearRollTimer, showHeldRollResult]);

  useEffect(() => {
    if (rollingVisual) {
      return;
    }

    const pendingHeldRollDisplay = pendingHeldRollDisplayRef.current;
    if (pendingHeldRollDisplay !== null) {
      showHeldRollResult(pendingHeldRollDisplay);
    }
  }, [rollingVisual, showHeldRollResult]);

  const applyTutorialSnapshot = React.useCallback(
    (nextState: GameState) => {
      tutorialHydratingStateRef.current = true;
      setGameStateFromServer(nextState);
    },
    [setGameStateFromServer],
  );

  const advanceTutorialScriptStep = React.useCallback(() => {
    setTutorialScriptStepIndex((current) => current + 1);
  }, []);

  const getScriptedTutorialMove = React.useCallback(
    (state: GameState) => {
      if (tutorialPendingStep?.kind !== 'MOVE') {
        return null;
      }

      return getValidMoves(state, state.rollValue ?? 0).find(
        (candidate) =>
          candidate.pieceId === tutorialPendingStep.pieceId &&
          candidate.fromIndex === tutorialPendingStep.fromIndex &&
          candidate.toIndex === tutorialPendingStep.toIndex,
      ) ?? null;
    },
    [tutorialPendingStep],
  );

  const triggerTutorialRoll = React.useCallback(
    (initiatedByLocalPlayer: boolean) => {
      if (tutorialCoachPhase !== 'lesson_play' || tutorialPendingStep?.kind !== 'ROLL') {
        return;
      }

      if (
        !introsComplete ||
        showRulesIntroModal ||
        gameState.phase !== 'rolling' ||
        gameState.currentTurn !== tutorialPendingStep.player ||
        rollingVisual
      ) {
        return;
      }

      clearHeldRollResult();
      const resultModal = tutorialPendingStep.resultModal ?? null;
      const forceNoMoves = tutorialPendingStep.forceNoMoves === true;
      setTutorialForcedNoMove(false);

      if (initiatedByLocalPlayer) {
        if (!canRoll || rollButtonLatchPhase !== 'idle') {
          return;
        }

        rollButtonRequestRef.current = {
          serverRevision,
          currentTurn: gameState.currentTurn,
          historyCount: effectiveHistoryCount,
        };
        setRollButtonLatchPhase('awaitingOutcome');
        localRollAudioPendingRef.current = true;
      } else {
        rollButtonRequestRef.current = null;
        localRollAudioPendingRef.current = false;
      }

      if (diceAnimationEnabled) {
        setRollingVisual(true);
        scheduleRollVisualFallback();
      } else {
        clearRollTimer();
        setRollingVisual(false);
      }

      const rolledState: GameState = {
        ...gameState,
        phase: 'moving',
        rollValue: tutorialPendingStep.value,
      };
      const validMoves = getValidMoves(rolledState, tutorialPendingStep.value);
      const hasNoMoves = forceNoMoves || validMoves.length === 0;

      void gameAudio.play('roll');
      advanceTutorialScriptStep();
      setGameStateFromServer(rolledState);

      if (forceNoMoves) {
        setTutorialForcedNoMove(true);
      }

      if (!hasNoMoves) {
        return;
      }

      scheduleTutorialProgress(TUTORIAL_NO_MOVE_DELAY_MS, () => {
        const skippedState: GameState = {
          ...rolledState,
          currentTurn: rolledState.currentTurn === 'light' ? 'dark' : 'light',
          phase: 'rolling',
          rollValue: null,
          history: [...rolledState.history, `${tutorialPendingStep.player} rolled ${tutorialPendingStep.value} but had no moves.`],
        };

        setTutorialForcedNoMove(false);
        setGameStateFromServer(skippedState);

        if (!resultModal) {
          return;
        }

        setTutorialCoachInterlude(resultModal);

        if ((resultModal.delayMs ?? 0) > 0) {
          scheduleTutorialProgress(resultModal.delayMs ?? 0, () => {
            setTutorialCoachPhase('interlude');
          });
          return;
        }

        setTutorialCoachPhase('interlude');
      });
    },
    [
      canRoll,
      advanceTutorialScriptStep,
      clearRollTimer,
      clearHeldRollResult,
      diceAnimationEnabled,
      effectiveHistoryCount,
      gameState,
      introsComplete,
      rollButtonLatchPhase,
      rollingVisual,
      scheduleRollVisualFallback,
      setTutorialCoachInterlude,
      serverRevision,
      setGameStateFromServer,
      scheduleTutorialProgress,
      showRulesIntroModal,
      tutorialCoachPhase,
      tutorialPendingStep,
    ],
  );

  const handleTutorialMove = React.useCallback(
    (move: MoveAction) => {
      if (tutorialCoachPhase !== 'lesson_play' || tutorialPendingStep?.kind !== 'MOVE') {
        return;
      }

      if (gameState.phase !== 'moving' || gameState.currentTurn !== tutorialPendingStep.player) {
        return;
      }

      const scriptedMove = getScriptedTutorialMove(gameState);
      if (!scriptedMove || !isMoveMatch(move, scriptedMove)) {
        return;
      }

      setGameStateFromServer(applyEngineMove(gameState, scriptedMove));
      advanceTutorialScriptStep();

      if (tutorialLesson && tutorialScriptStepIndex === tutorialLesson.moveStepIndex) {
        setTutorialCoachPhase(
          tutorialLessonIndex === PLAYTHROUGH_TUTORIAL_LESSONS.length - 1
            ? 'completion'
            : 'lesson_result',
        );
      }
    },
    [
      advanceTutorialScriptStep,
      gameState,
      getScriptedTutorialMove,
      setGameStateFromServer,
      tutorialCoachPhase,
      tutorialLesson,
      tutorialLessonIndex,
      tutorialPendingStep,
      tutorialScriptStepIndex,
    ],
  );

  const handleContinueTutorialCoach = React.useCallback(() => {
    if (tutorialCoachPhase === 'opening') {
      setTutorialCoachPhase('lesson_play');
      return;
    }

    if (tutorialCoachPhase === 'interlude') {
      setTutorialCoachInterlude(null);
      setTutorialCoachPhase('lesson_play');
      return;
    }

    if (tutorialCoachPhase === 'lesson_result') {
      const nextIndex = tutorialLessonIndex + 1;

      if (nextIndex < PLAYTHROUGH_TUTORIAL_LESSONS.length) {
        setTutorialLessonIndex(nextIndex);
        setTutorialCoachPhase('lesson_play');
        return;
      }

      clearTutorialProgressTimers();
      setTutorialCoachPhase('freeplay');
      return;
    }

    if (tutorialCoachPhase === 'completion') {
      clearTutorialProgressTimers();
      setTutorialCoachPhase('freeplay');
    }
  }, [clearTutorialProgressTimers, tutorialCoachPhase, tutorialLessonIndex]);

  const triggerLocalRoll = React.useCallback((options?: { autoTriggered?: boolean }) => {
    if (showRulesIntroModal || !introsComplete || !canRoll || rollingVisual || rollButtonLatchPhase !== 'idle') {
      return;
    }

    clearHeldRollResult();
    rollButtonRequestRef.current = {
      serverRevision,
      currentTurn: gameState.currentTurn,
      historyCount: effectiveHistoryCount,
    };
    setRollButtonLatchPhase('awaitingOutcome');
    localRollAudioPendingRef.current = true;

    if (diceAnimationEnabled) {
      setRollingVisual(true);
      scheduleRollVisualFallback();
    } else {
      clearRollTimer();
      setRollingVisual(false);
    }

    void gameAudio.play('roll');
    roll(options);
  }, [
    canRoll,
    clearRollTimer,
    clearHeldRollResult,
    diceAnimationEnabled,
    scheduleRollVisualFallback,
    gameState.currentTurn,
    effectiveHistoryCount,
    roll,
    rollButtonLatchPhase,
    rollingVisual,
    serverRevision,
    showRulesIntroModal,
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
      measureViewInWindow(boardNode, (x, y) => {
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
      measureViewInWindow(boardNode, (x, y, width, height) => {
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

  useGameLoop(isOffline && !isScriptedTutorialPhase && introsComplete && !showRulesIntroModal);
  useEffect(() => {
    if (isOffline || !authenticatedUserId || userId === authenticatedUserId) {
      return;
    }

    setUserId(authenticatedUserId);
  }, [authenticatedUserId, isOffline, setUserId, userId]);

  useEffect(() => {
    if (playerColor || !authenticatedUserId || !authoritativePlayers) {
      return;
    }

    const inferredPlayerColor = getPlayerColorForUserId(authoritativePlayers, authenticatedUserId);
    if (inferredPlayerColor) {
      setPlayerColor(inferredPlayerColor);
    }
  }, [authenticatedUserId, authoritativePlayers, playerColor, setPlayerColor]);

  useEffect(() => {
    setShowRulesIntroModal(Boolean(rulesIntro));
  }, [matchId, rulesIntro]);
  useEffect(() => {
    if (
      !isPlaythroughTutorialMatch ||
      tutorialCoachPhase !== 'lesson_play' ||
      tutorialCoachInterlude !== null ||
      tutorialPendingActionStep?.player !== 'dark' ||
      !introsComplete ||
      showRulesIntroModal ||
      showAudioSettings ||
      showTopMenu ||
      showMatchStatusInfo ||
      showWinModal ||
      gameState.winner !== null ||
      gameState.phase === 'ended'
    ) {
      return;
    }

    if (tutorialPendingActionStep.kind === 'ROLL') {
      if (gameState.phase !== 'rolling' || gameState.currentTurn !== 'dark' || rollingVisual) {
        return;
      }

      const timer = scheduleTutorialProgress(TUTORIAL_BOT_ROLL_DELAY_MS, () => {
        triggerTutorialRoll(false);
      });

      return () => {
        clearScheduledTutorialProgress(timer);
      };
    }

    if (gameState.phase !== 'moving' || gameState.currentTurn !== 'dark') {
      return;
    }

    const scriptedMove = getScriptedTutorialMove(gameState);
    if (!scriptedMove) {
      return;
    }

    const timer = scheduleTutorialProgress(TUTORIAL_BOT_MOVE_DELAY_MS, () => {
      handleTutorialMove(scriptedMove);
    });

    return () => {
      clearScheduledTutorialProgress(timer);
    };
  }, [
    clearScheduledTutorialProgress,
    gameState,
    getScriptedTutorialMove,
    handleTutorialMove,
    introsComplete,
    isPlaythroughTutorialMatch,
    rollingVisual,
    scheduleTutorialProgress,
    showAudioSettings,
    showMatchStatusInfo,
    showRulesIntroModal,
    showTopMenu,
    showWinModal,
    tutorialCoachInterlude,
    triggerTutorialRoll,
    tutorialCoachPhase,
    tutorialPendingActionStep,
  ]);
  useEffect(() => {
    if (gameState.winner && storedMatchId === matchId) {
      setShowWinModal(true);
    }
  }, [gameState.winner, matchId, storedMatchId]);

  useEffect(() => {
    if (previousRenderedMatchIdRef.current === (matchId ?? null)) {
      return;
    }

    previousRenderedMatchIdRef.current = matchId ?? null;
    setShowWinModal(false);
    setTournamentRewardSummary(null);
    setTournamentRewardFallbackActive(false);
    setTournamentTerminalOutcomeOverride(null);
    setTournamentAdvanceResolutionState('idle');
    setHasEnteredTournamentWaitingRoom(false);
    setTournamentWaitingRoomCountdownMs(null);
    setIsValidatingTournamentExit(false);
    setTournamentExitValidationFailed(false);
  }, [matchId]);

  useEffect(() => {
    if (!shouldResolveTournamentAdvanceBeforeModal) {
      setTournamentTerminalOutcomeOverride(null);
      setTournamentAdvanceResolutionState('idle');
      return;
    }

    if (!tournamentRunIdParam) {
      setTournamentTerminalOutcomeOverride(null);
      setTournamentAdvanceResolutionState('waiting');
      setHasEnteredTournamentWaitingRoom(true);
      return;
    }

    let cancelled = false;
    setTournamentAdvanceResolutionState('checking');

    void getPublicTournamentStatus(tournamentRunIdParam)
      .then((snapshot) => {
        if (cancelled) {
          return;
        }

        if (isTerminalTournamentStatusSnapshot(snapshot, { didPlayerWin, initialRound: initialTournamentRound })) {
          setTournamentTerminalOutcomeOverride(
            deriveTerminalTournamentOutcomeFromSnapshot(snapshot, {
              didPlayerWin,
              initialRound: initialTournamentRound,
            }),
          );
          setTournamentAdvanceResolutionState('terminal');
          return;
        }

        setTournamentTerminalOutcomeOverride(null);
        setTournamentAdvanceResolutionState('waiting');
        setHasEnteredTournamentWaitingRoom(true);
      })
      .catch(() => {
        if (cancelled) {
          return;
        }

        setTournamentTerminalOutcomeOverride(null);
        setTournamentAdvanceResolutionState('waiting');
        setHasEnteredTournamentWaitingRoom(true);
      });

    return () => {
      cancelled = true;
    };
  }, [didPlayerWin, initialTournamentRound, shouldResolveTournamentAdvanceBeforeModal, tournamentRunIdParam]);

  useEffect(() => {
    if (!showWinModal || !isTournamentMatch || tournamentRewardSummary || tournamentRewardFallbackActive) {
      return;
    }

    const timer = setTimeout(() => {
      setTournamentRewardFallbackActive(true);
    }, TOURNAMENT_REWARD_SUMMARY_FALLBACK_MS);

    return () => {
      clearTimeout(timer);
    };
  }, [
    isTournamentMatch,
    showWinModal,
    tournamentRewardFallbackActive,
    tournamentRewardSummary,
  ]);

  const leaveCurrentMatch = React.useCallback(async () => {
    if (isOffline || !socketRef.current || !matchId) {
      return;
    }

    suppressReconnectRef.current = true;

    try {
      await withTimeout(socketRef.current.leaveMatch(matchId), MATCH_LEAVE_TIMEOUT_MS);
    } catch {
      // Disconnect below so the server still observes the session closing.
    } finally {
      nakamaService.disconnectSocket(true);
    }
  }, [isOffline, matchId]);

  const exitMatchToHome = React.useCallback(
    async (options?: { refreshTournamentStatus?: boolean }) => {
      if (options?.refreshTournamentStatus && isTournamentMatch && tournamentRunIdParam) {
        await withTimeout(
          getPublicTournamentStatus(tournamentRunIdParam).catch(() => null),
          TOURNAMENT_EXIT_VALIDATION_TIMEOUT_MS,
        );
      }

      setShowTopMenu(false);
      setShowMatchStatusInfo(false);
      await leaveCurrentMatch();
      setShowWinModal(false);
      reset();
      router.replace('/');
    },
    [isTournamentMatch, leaveCurrentMatch, reset, router, tournamentRunIdParam],
  );

  const validateTournamentResultBeforeExit = React.useCallback(async () => {
    if (!tournamentRunIdParam) {
      return false;
    }

    const snapshot = await withTimeout(
      getPublicTournamentStatus(tournamentRunIdParam),
      TOURNAMENT_EXIT_VALIDATION_TIMEOUT_MS,
    );

    if (!snapshot || !isServerConfirmedTournamentStatusSnapshot(snapshot)) {
      return false;
    }

    const nextOutcome = deriveServerConfirmedTournamentOutcomeFromSnapshot(snapshot);

    if (nextOutcome) {
      setTournamentTerminalOutcomeOverride(nextOutcome);
    }

    return true;
  }, [tournamentRunIdParam]);

  const handleTournamentResultExit = React.useCallback(async (options?: { source?: 'manual' | 'auto' }) => {
    if (isValidatingTournamentExit) {
      return;
    }

    if (options?.source === 'auto') {
      let didExit = false;
      setTournamentExitValidationFailed(false);
      setIsValidatingTournamentExit(true);

      try {
        await exitMatchToHome();
        didExit = true;
      } finally {
        if (!didExit) {
          setIsValidatingTournamentExit(false);
        }
      }
      return;
    }

    if (tournamentExitValidationFailed || !tournamentRunIdParam) {
      await exitMatchToHome({ refreshTournamentStatus: true });
      return;
    }

    let shouldExit = false;
    setTournamentExitValidationFailed(false);
    setIsValidatingTournamentExit(true);

    try {
      shouldExit = await validateTournamentResultBeforeExit();
      if (shouldExit) {
        await exitMatchToHome({ refreshTournamentStatus: true });
        return;
      }

      setTournamentExitValidationFailed(true);
    } catch {
      setTournamentExitValidationFailed(true);
    } finally {
      if (!shouldExit) {
        setIsValidatingTournamentExit(false);
      }
    }
  }, [
    exitMatchToHome,
    isValidatingTournamentExit,
    tournamentExitValidationFailed,
    tournamentRunIdParam,
    validateTournamentResultBeforeExit,
  ]);

  const handleExit = React.useCallback(() => {
    if (isTournamentMatch && !isTournamentResultModal) {
      return;
    }

    if (isTournamentMatch && isTournamentResultModal) {
      void handleTournamentResultExit();
      return;
    }

    void exitMatchToHome();
  }, [exitMatchToHome, handleTournamentResultExit, isTournamentMatch, isTournamentResultModal]);

  useEffect(() => {
    if (!shouldAutoExitTournamentResultModal) {
      setTournamentWaitingRoomCountdownMs(null);
      return;
    }

    const startedAt = Date.now();
    setTournamentWaitingRoomCountdownMs(TOURNAMENT_REWARD_MODAL_COUNTDOWN_MS);

    const interval = setInterval(() => {
      const remainingMs = Math.max(0, TOURNAMENT_REWARD_MODAL_COUNTDOWN_MS - (Date.now() - startedAt));
      setTournamentWaitingRoomCountdownMs(remainingMs);

      if (remainingMs <= 0) {
        clearInterval(interval);
        void handleTournamentResultExit({ source: 'auto' });
      }
    }, 250);

    return () => {
      clearInterval(interval);
    };
  }, [handleTournamentResultExit, shouldAutoExitTournamentResultModal]);

  useEffect(() => {
    if (!tournamentRewardSummary) {
      return;
    }

    void Promise.allSettled([
      isRankedHumanMatch ? refreshElo({ silent: true }) : Promise.resolve(null),
      refreshProgression({ silent: true }),
      shouldShowChallengeRewards ? refreshChallenges({ silent: true }) : Promise.resolve(null),
    ]);
  }, [
    isRankedHumanMatch,
    refreshChallenges,
    refreshElo,
    refreshProgression,
    shouldShowChallengeRewards,
    tournamentRewardSummary,
  ]);

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

    if (isTournamentMatch && !tournamentRewardFallbackActive) {
      return;
    }

    if (isOffline || !matchId) {
      return;
    }

    let isMounted = true;
    let followUpRefreshTimer: ReturnType<typeof setTimeout> | null = null;

    const refreshMatchRewards = async (options?: { showLoading?: boolean }) => {
      if (options?.showLoading !== false) {
        setIsRefreshingMatchRewards(true);
      }
      setMatchRewardsErrorMessage(null);

      try {
        const eloPromise = isRankedHumanMatch ? refreshElo({ silent: true }) : Promise.resolve(null);
        const progressionPromise = refreshProgression({ silent: true });
        const challengesPromise = shouldShowChallengeRewards
          ? refreshChallenges({ silent: true })
          : Promise.resolve(null);
        const [, progressionResult, challengesResult] = await Promise.all([
          eloPromise,
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
        if (isMounted && options?.showLoading !== false) {
          setIsRefreshingMatchRewards(false);
        }
      }
    };

    void refreshMatchRewards({ showLoading: true });
    followUpRefreshTimer = setTimeout(() => {
      if (!isMounted) {
        return;
      }

      void refreshMatchRewards({ showLoading: false });
    }, ONLINE_MATCH_REWARD_REFRESH_RETRY_MS);

    return () => {
      isMounted = false;
      if (followUpRefreshTimer) {
        clearTimeout(followUpRefreshTimer);
      }
    };
  }, [
    challengeDefinitions,
    challengeProgress,
    isOffline,
    isRankedHumanMatch,
    isPrivateMatch,
    isTournamentMatch,
    matchId,
    progressionError,
    refreshElo,
    refreshChallenges,
    refreshProgression,
    shouldShowChallengeRewards,
    showWinModal,
    tournamentRewardFallbackActive,
  ]);
  useEffect(() => {
    if (!showAudioSettings && !showRulesIntroModal && !showWinModal && !tutorialCoachVisible) {
      return;
    }

    setShowTopMenu(false);
    setShowMatchStatusInfo(false);
  }, [showAudioSettings, showRulesIntroModal, showWinModal, tutorialCoachVisible]);
  useEffect(() => {
    boardImageLayoutRef.current = null;
    tutorialHydratingStateRef.current = false;
    localRollAudioPendingRef.current = false;
    rollButtonRequestRef.current = null;
    clearRollTimer();
    clearHeldRollResult();
    clearTutorialProgressTimers();
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
    setHasMatchPresentationFallbackElapsed(false);
    queuedMatchCuesRef.current = [];
    lastQueuedMatchCueRef.current = null;
    suppressMatchCuesUntilInteractionRef.current = false;
    hasShownOpeningCueRef.current = null;
    matchCueIdRef.current = 0;
    previousJoinedPlayerCountRef.current = 0;
    setTutorialLessonIndex(0);
    setTutorialScriptStepIndex(0);
    setTutorialCoachInterlude(null);
    setTutorialForcedNoMove(false);
    setTutorialPinnedObjectiveBanner(null);
    setTutorialCoachPhase('idle');
    setLiveMatchCue(null);
  }, [clearHeldRollResult, clearRollTimer, clearTutorialProgressTimers, matchId, setLiveMatchCue]);
  useEffect(() => () => {
    clearHeldRollResult();
    clearRollTimer();
    clearTutorialProgressTimers();
  }, [clearHeldRollResult, clearRollTimer, clearTutorialProgressTimers]);
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
          effectiveHistoryCount > rollRequest.historyCount
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
    effectiveHistoryCount,
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
    if (!rollingVisual) {
      return;
    }

    if (
      rollButtonLatchPhase !== 'idle' ||
      gameState.phase !== 'rolling' ||
      gameState.rollValue !== null
    ) {
      return;
    }

    clearRollTimer();
    setRollingVisual(false);
  }, [clearRollTimer, gameState.phase, gameState.rollValue, rollButtonLatchPhase, rollingVisual]);
  useEffect(() => {
    if (!cueSystemReady || !matchId || !hasAssignedColor || !introsComplete) {
      return;
    }

    if (hasShownOpeningCueRef.current === matchId) {
      return;
    }

    if (gameState.winner !== null || gameState.phase === 'ended' || effectiveHistoryCount > 0) {
      return;
    }

    hasShownOpeningCueRef.current = matchId;
    enqueueMatchCue('play');
  }, [cueSystemReady, effectiveHistoryCount, enqueueMatchCue, gameState.phase, gameState.winner, hasAssignedColor, introsComplete, matchId]);
  useEffect(() => {
    if (!isOffline) {
      return;
    }

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

    if (shouldResetVisualTimer) {
      setTurnTimerCycleId((current) => current + 1);
    }

    previousTurnTimerStateRef.current = nextSnapshot;
  }, [gameState.currentTurn, gameState.phase, isOffline, matchId]);
  useEffect(() => {
    if (
      isOffline ||
      !introsComplete ||
      isScriptedTutorialPhase ||
      authoritativeTurnDeadlineMs === null ||
      authoritativeServerTimeMs === null ||
      authoritativeSnapshotReceivedAtMs === null ||
      gameState.winner !== null ||
      gameState.phase === 'ended'
    ) {
      return;
    }

    setOnlineTimerNowMs(Date.now());
    const intervalId = setInterval(() => {
      setOnlineTimerNowMs(Date.now());
    }, 200);

    return () => {
      clearInterval(intervalId);
    };
  }, [
    authoritativeServerTimeMs,
    authoritativeSnapshotReceivedAtMs,
    authoritativeTurnDeadlineMs,
    gameState.phase,
    gameState.winner,
    introsComplete,
    isOffline,
    isScriptedTutorialPhase,
  ]);
  useEffect(() => {
    if (turnTimeoutTimerRef.current) {
      clearTimeout(turnTimeoutTimerRef.current);
      turnTimeoutTimerRef.current = null;
    }

    if (
      !isOffline ||
      !introsComplete ||
      isScriptedTutorialPhase ||
      !botTimerEnabled ||
      !isOpponentReadyToPlay ||
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
    isOpponentReadyToPlay,
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
      showRulesIntroModal ||
      showAudioSettings ||
      showTopMenu ||
      showMatchStatusInfo ||
      showWinModal
    ) {
      return;
    }

    autoRollTimerRef.current = setTimeout(() => {
      autoRollTimerRef.current = null;
      triggerLocalRoll({ autoTriggered: true });
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
    showRulesIntroModal,
    showAudioSettings,
    showMatchStatusInfo,
    showTopMenu,
    showWinModal,
    triggerLocalRoll,
  ]);
  useEffect(() => {
    if (!forceMoveAfterRollRef.current) {
      return;
    }

    if (!isOffline || !isOpponentReadyToPlay || !isMyTurn || gameState.winner !== null || gameState.phase === 'ended') {
      forceMoveAfterRollRef.current = false;
      return;
    }

    if (gameState.phase !== 'moving' || validMoves.length === 0) {
      return;
    }

    forceMoveAfterRollRef.current = false;
    makeMove(validMoves[0]);
  }, [gameState.phase, gameState.winner, isMyTurn, isOffline, isOpponentReadyToPlay, makeMove, validMoves]);
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

    setTutorialLessonIndex(0);
    setTutorialScriptStepIndex(0);
    setTutorialCoachInterlude(null);
    setTutorialForcedNoMove(false);
    setTutorialPinnedObjectiveBanner(null);
    applyTutorialSnapshot(getPlaythroughTutorialLessonState(0));
    setTutorialCoachPhase('opening');
  }, [applyTutorialSnapshot, isPlaythroughTutorialMatch, matchId]);

  useEffect(() => {
    if (!requiresOpponentPresence) {
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
  }, [enqueueMatchCue, gameState.phase, gameState.winner, joinedPlayerCount, replaceMatchCue, requiresOpponentPresence]);

  const socketRef = useRef<Socket | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const suppressReconnectRef = useRef(false);
  useEffect(() => {
    if (!matchId) return;
    if (isOffline) {
      suppressReconnectRef.current = true;
      setOnlineMode('offline');
      setMatchPresences([]);
      setPlayerColor('light');
      setSocketState('connected');
      return;
    }

    suppressReconnectRef.current = false;
    setOnlineMode('nakama');

    let isMounted = true;

    const handleMatchData = (matchData: MatchData) => {
      if (matchData.match_id !== matchId || matchData.match_id !== activeRouteMatchIdRef.current) return;

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
        const assignedColorFromSnapshot = getPlayerColorForUserId(payload.players, authenticatedUserId);
        console.info('[Nakama][snapshot]', {
          matchId: payload.matchId,
          revision: payload.revision,
          assignedPlayerColor: assignedColorFromSnapshot ?? null,
          lightPlayerTitle: payload.players.light.title ?? null,
          darkPlayerTitle: payload.players.dark.title ?? null,
          phase: payload.gameState.phase,
          turn: payload.gameState.currentTurn,
          roll: payload.gameState.rollValue,
          lightFinished: payload.gameState.light.finishedCount,
          darkFinished: payload.gameState.dark.finishedCount,
        });
        applyServerSnapshot(payload);
        if (authenticatedUserId) {
          const assignedColor = assignedColorFromSnapshot;
          if (assignedColor) {
            setPlayerColor(assignedColor);
          }
        }
        return;
      }

      if (matchData.op_code === MatchOpCode.REACTION_BROADCAST) {
        if (!isEmojiReactionBroadcastPayload(payload)) {
          return;
        }

        console.info('[Nakama][reaction_broadcast]', {
          emoji: payload.emoji,
          senderUserId: payload.senderUserId,
          senderColor: payload.senderColor,
          remainingForSender: payload.remainingForSender,
          createdAtMs: payload.createdAtMs,
        });
        appendFloatingReaction(payload);
        if (payload.senderUserId === authenticatedUserId) {
          setEmojiReactionsRemaining(payload.remainingForSender);
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
          if (/reaction limit reached/i.test(payload.message)) {
            setEmojiReactionsRemaining(0);
            setShowEmojiReactionMenu(false);
          }
        }
        return;
      }

      if (matchData.op_code === MatchOpCode.TOURNAMENT_REWARD_SUMMARY) {
        if (!isTournamentMatchRewardSummaryPayload(payload)) {
          return;
        }

        console.info('[Nakama][tournament_reward_summary]', {
          matchId: payload.matchId,
          outcome: payload.tournamentOutcome,
          didWin: payload.didWin,
          eloDelta: payload.eloDelta,
          totalXpDelta: payload.totalXpDelta,
          challengeCompletionCount: payload.challengeCompletionCount,
          shouldEnterWaitingRoom: payload.shouldEnterWaitingRoom,
        });

        setTournamentRewardSummary(payload);
        setTournamentRewardFallbackActive(false);
        setLastProgressionSnapshot({
          matchId: payload.matchId,
          progression: payload.progression,
        });
        setLastEloRatingProfileSnapshot({
          matchId: payload.matchId,
          profile: payload.eloProfile,
        });
        setLastChallengeProgressSnapshot({
          matchId: payload.matchId,
          progress: payload.challengeProgress,
        });
        setMatchRewardsErrorMessage(null);
        setIsRefreshingMatchRewards(false);

        if (shouldShowChallengeRewards) {
          setMatchChallengeSummary(
            buildMatchChallengeRewardSummary(payload.matchId, challengeDefinitions, payload.challengeProgress),
          );
        } else {
          setMatchChallengeSummary(null);
        }

        if (payload.tournamentOutcome !== 'advancing') {
          setHasEnteredTournamentWaitingRoom(false);
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
      if (matchPresence.match_id !== matchId || matchPresence.match_id !== activeRouteMatchIdRef.current) return;
      updateMatchPresences(matchPresence);
    };

    const disposeSocket = (socket: Socket | null) => {
      if (!socket) {
        return;
      }

      socket.onmatchdata = () => { };
      socket.onmatchpresence = () => { };
      socket.ondisconnect = () => { };

      if (socketRef.current === socket) {
        socketRef.current = null;
      }
    };

    const scheduleReconnect = () => {
      if (
        !isMounted ||
        suppressReconnectRef.current ||
        reconnectTimerRef.current ||
        activeRouteMatchIdRef.current !== matchId
      ) {
        return;
      }
      reconnectTimerRef.current = setTimeout(() => {
        reconnectTimerRef.current = null;
        void connectAndJoin();
      }, 1500);
    };

    const attachSocketHandlers = (socket: Socket) => {
      socketRef.current = socket;
      socket.onmatchdata = handleMatchData;
      socket.onmatchpresence = handleMatchPresence;
      socket.ondisconnect = () => {
        if (activeRouteMatchIdRef.current !== matchId) {
          return;
        }
        socketRef.current = null;
        nakamaService.disconnectSocket(false);
        setSocketState('disconnected');
        scheduleReconnect();
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
        const joinedPresenceUserIds = Array.isArray(match.presences)
          ? match.presences
            .map((presence) => presence?.user_id)
            .filter((presenceUserId): presenceUserId is string => typeof presenceUserId === 'string')
          : [];
        const selfUserId = typeof match.self?.user_id === 'string' ? match.self.user_id : null;

        if (!Array.isArray(match.presences)) {
          console.warn('[Nakama][join]', {
            matchId,
            message: 'Join response omitted presences; continuing with available players.',
          });
        }

        setMatchPresences([
          ...(selfUserId ? [selfUserId] : []),
          ...joinedPresenceUserIds,
        ]);
        setMatchId(match.match_id);
        setSocketState('connected');
      } catch (error) {
        console.error(error);
        suppressReconnectRef.current = isMatchNotFoundSocketError(error) || isUnauthorizedNakamaError(error);
        disposeSocket(socketRef.current);
        nakamaService.disconnectSocket(false);
        setSocketState('error');
      }
    };

    void connectAndJoin();

    return () => {
      isMounted = false;
      suppressReconnectRef.current = true;
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
      if (!isOffline) {
        const currentSocket = socketRef.current;
        disposeSocket(currentSocket);
        nakamaService.disconnectSocket(false);
      }
    };
  }, [
    applyServerSnapshot,
    appendFloatingReaction,
    challengeDefinitions,
    isOffline,
    matchId,
    effectiveMatchToken,
    setMatchId,
    setLastChallengeProgressSnapshot,
    setLastEloRatingChange,
    setLastEloRatingProfileSnapshot,
    setLastProgressionAward,
    setLastProgressionSnapshot,
    setMatchChallengeSummary,
    setOnlineMode,
    setPlayerColor,
    setSocketState,
    setMatchPresences,
    shouldShowChallengeRewards,
    setTournamentRewardFallbackActive,
    setTournamentRewardSummary,
    setMatchRewardsErrorMessage,
    setIsRefreshingMatchRewards,
    setHasEnteredTournamentWaitingRoom,
    updateMatchPresences,
    authenticatedUserId,
    setEmojiReactionsRemaining,
  ]);
  useEffect(() => {
    if (!matchId) return;
    if (isOffline) {
      setRollCommandSender(null);
      setMoveCommandSender(null);
      return;
    }

    const sendRoll = async (options?: { autoTriggered?: boolean }) => {
      const socket = socketRef.current;
      if (!socket) return;
      const payload: RollRequestPayload = options?.autoTriggered
        ? { type: 'roll_request', autoTriggered: true }
        : { type: 'roll_request' };
      console.info('[Nakama][send]', {
        eventType: payload.type,
        matchId,
        revision: serverRevision,
        payload,
      });
      try {
        await socket.sendMatchState(matchId, MatchOpCode.ROLL_REQUEST, encodePayload(payload));
      } catch (error) {
        suppressReconnectRef.current = isUnauthorizedNakamaError(error);
        console.error('[Nakama][send_failed]', {
          error,
          eventType: payload.type,
          matchId,
          revision: serverRevision,
        });
        socket.ondisconnect({} as Event);
      }
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
      try {
        await socket.sendMatchState(matchId, MatchOpCode.MOVE_REQUEST, encodePayload(payload));
      } catch (error) {
        suppressReconnectRef.current = isUnauthorizedNakamaError(error);
        console.error('[Nakama][send_failed]', {
          error,
          eventType: payload.type,
          matchId,
          revision: serverRevision,
        });
        socket.ondisconnect({} as Event);
      }
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
      clearHeldRollResult();
      clearRollTimer();
      if (autoRollTimerRef.current) {
        clearTimeout(autoRollTimerRef.current);
        autoRollTimerRef.current = null;
      }
      if (scoreBannerTimerRef.current) {
        clearTimeout(scoreBannerTimerRef.current);
      }
    };
  }, [clearHeldRollResult, clearRollTimer]);
  useEffect(() => {
    void gameAudio.start();

    return () => {
      void gameAudio.stopAll();
    };
  }, []);
  useEffect(() => {
    let isMounted = true;

    const loadPreferences = async () => {
      try {
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
      } finally {
        if (isMounted) {
          setHaveLoadedMatchPreferences(true);
        }
      }
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
      previousStateRef.current = { matchId: matchId ?? null, state: gameState, historyCount: effectiveHistoryCount };
      return;
    }

    if (tutorialHydratingStateRef.current) {
      tutorialHydratingStateRef.current = false;
      previousStateRef.current = { matchId: matchId ?? null, state: gameState, historyCount: effectiveHistoryCount };
      return;
    }

    const previous = previousSnapshot.state;
    const isBotRoll = isOffline && gameState.currentTurn === 'dark';
    const rollValueChanged = previous.rollValue !== gameState.rollValue;
    let shouldSkipResolvedRollAudio = false;
    const newHistoryEntries = getAppendedHistoryEntries(
      previous.history,
      previousSnapshot.historyCount,
      gameState.history,
      effectiveHistoryCount,
    );

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
          previous,
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
        const noMoveRollValue = getNoMoveRollValueFromHistoryEntry(entry);
        if (noMoveRollValue !== null) {
          const heldDisplay = {
            value: noMoveRollValue,
            label: noMoveRollValue > 0 ? 'No Move' : null,
          } satisfies HeldRollDisplay;

          if (rollingVisual) {
            pendingHeldRollDisplayRef.current = heldDisplay;
          } else {
            showHeldRollResult(heldDisplay);
          }
        }

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

    previousStateRef.current = { matchId: matchId ?? null, state: gameState, historyCount: effectiveHistoryCount };
  }, [
    didPlayerWin,
    enqueueMatchCue,
    effectiveHistoryCount,
    diceAnimationEnabled,
    gameState,
    hasAssignedColor,
    isOffline,
    matchId,
    playerColor,
    rollingVisual,
    showHeldRollResult,
    validMoves.length,
  ]);

  const handleBoardMove = React.useCallback(
    (move: MoveAction) => {
      resumeAnnouncementCuesFromInteraction();

      if (!isOnlineInteractionReady) {
        return;
      }

      if (!isOpponentReadyToPlay) {
        return;
      }

      if (isScriptedTutorialPhase) {
        handleTutorialMove(move);
        return;
      }

      makeMove(move);
    },
    [
      handleTutorialMove,
      isOnlineInteractionReady,
      isOpponentReadyToPlay,
      isScriptedTutorialPhase,
      makeMove,
      resumeAnnouncementCuesFromInteraction,
    ],
  );

  const handleRoll = React.useCallback(() => {
    resumeAnnouncementCuesFromInteraction();

    if (isScriptedTutorialPhase) {
      if (tutorialCoachPhase === 'lesson_play' && tutorialCoachInterlude === null) {
        triggerTutorialRoll(true);
      }
      return;
    }

    triggerLocalRoll();
  }, [
    isScriptedTutorialPhase,
    resumeAnnouncementCuesFromInteraction,
    tutorialCoachInterlude,
    triggerLocalRoll,
    triggerTutorialRoll,
    tutorialCoachPhase,
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

  useEffect(() => {
    if (!isTournamentMatch || isTournamentResultModal) {
      return;
    }

    const subscription = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => {
      subscription.remove();
    };
  }, [isTournamentMatch, isTournamentResultModal]);

  const renderSharedResultSummary = () => (
    <MatchResultSummaryContent
      didPlayerWin={didPlayerWin}
      isPracticeModeMatch={isPracticeModeMatch}
      isPrivateMatch={isPrivateMatch}
      canSyncOfflineBotRewards={canSyncOfflineBotRewards}
      practiceModeRewardLabel={practiceModeRewardLabel}
      isPlaythroughTutorialMatch={isPlaythroughTutorialMatch}
      isRankedHumanMatch={isRankedHumanMatch}
      lastEloRatingChange={lastEloRatingChange}
      eloUnchangedReason={eloUnchangedReason}
      shouldShowAccountRewards={shouldShowAccountRewards}
      progression={progression}
      isRefreshingMatchRewards={isRefreshingMatchRewards}
      progressionError={progressionError}
      lastProgressionAward={lastProgressionAward}
      shouldShowChallengeRewards={shouldShowChallengeRewards}
      matchChallengeSummary={matchChallengeSummary}
      matchRewardsErrorMessage={matchRewardsErrorMessage}
      tournamentRewardSummary={isTournamentRewardSummaryPrimary ? tournamentRewardSummary : null}
      tournamentCountdownLabel={shouldAutoExitTournamentResultModal ? tournamentCountdownLabel : null}
    />
  );

  const lightReserve = gameState.light.pieces.filter((piece) => !piece.isFinished && piece.position === -1).length;
  const darkReserve = gameState.dark.pieces.filter((piece) => !piece.isFinished && piece.position === -1).length;
  const normalizedMatchNumber = matchId ? matchId.replace(/^local-/, '') : null;
  const matchTitle = isPlaythroughTutorialMatch
    ? 'Play Tutorial'
    : isTournamentMatch
      ? 'Tournament Match'
    : isPrivateMatch
      ? 'Private Match'
      : isPracticeModeMatch
        ? effectiveMatchConfig.displayName
        : isOffline
          ? 'Local Match'
          : 'Online Match';

  const matchStageViewportMode = useMemo(
    // Use the stable layout viewport for mode classification so Safari chrome does not
    // knock tablet web sessions out of the tablet-landscape layout path.
    () => resolveMatchStageViewportMode({ width, height }),
    [height, width],
  );
  const isWebLayout = Platform.OS === 'web';
  const isTabletLandscapeWebLayout = isWebLayout && matchStageViewportMode.isTabletLandscape;
  const viewportHorizontalPadding = resolveMatchStageViewportHorizontalPadding({
    isTabletLandscape: isTabletLandscapeWebLayout,
    viewportWidth,
  });
  const stageContentWidth = Math.min(Math.max(viewportWidth - viewportHorizontalPadding * 2, 0), urTheme.layout.stage.maxWidth);
  const tabletPortraitTuning = useMemo(
    () => resolveMatchStageTabletPortraitTuning(matchStageViewportMode.isTabletPortrait),
    [matchStageViewportMode.isTabletPortrait],
  );
  const useSideColumns = matchStageViewportMode.useSideColumns;
  const isMobileLayout = matchStageViewportMode.useMobileLayout;
  const isMobileWebLayout = isWebLayout && isMobileLayout;
  const showMobileWebStatusInfoButton = isMobileWebLayout && Boolean(onlineMatchStatusPillText);
  const showInlineMatchStatusPopover = showMobileWebStatusInfoButton && showMatchStatusInfo;
  const useMobileSideReserveRails = matchStageViewportMode.useMobileSideReserveRails;
  const showWebSideDiceVisual = Platform.OS === 'web' && useSideColumns;
  const reserveTrayScale = resolveMatchStageReserveTrayScale({
    defaultTrayScale: tabletPortraitTuning.trayScale,
    isTabletLandscape: isTabletLandscapeWebLayout,
  });
  const boardClusterGap = useSideColumns || useMobileSideReserveRails ? urTheme.spacing.xs : urTheme.spacing.sm;
  const sideColumnWidth = useSideColumns
    ? resolveMatchStageSideColumnWidth({
      isTabletLandscape: matchStageViewportMode.isTabletLandscape,
      stageContentWidth,
      viewportWidth,
    })
    : 0;
  const mobileReserveColumnWidth = useMobileSideReserveRails
    ? Math.max(
      tabletPortraitTuning.reserveColumnMinWidth,
      Math.min(
        tabletPortraitTuning.reserveColumnMaxWidth,
        Math.round(stageContentWidth * tabletPortraitTuning.reserveColumnWidthRatio),
      ),
    )
    : 0;
  const mobileWebBoardTrayAlignmentBaseLift = isMobileWebLayout && useMobileSideReserveRails
    ? Math.max(8, Math.round(mobileReserveColumnWidth * 0.16))
    : 0;
  const mobileWebBoardTrayAlignmentLift =
    mobileWebBoardTrayAlignmentBaseLift + mobileBoardTrayAlignmentCorrection;
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
  const boardScale = useMobileSideReserveRails
    ? baseBoardScale * tabletPortraitTuning.mobileSideBoardScaleMultiplier
    : baseBoardScale;
  const reservePiecePixelSize = useMemo(
    () => getBoardPiecePixelSize({ viewportWidth, boardScale, orientation: 'vertical' }),
    [boardScale, viewportWidth],
  );
  const compactSupportUi = viewportWidth <= 1024;
  const compactReservePieceScale = viewportWidth < 760 ? 0.864 : tabletPortraitTuning.reservePieceScale;
  const scaledReservePiecePixelSize = compactSupportUi
    ? Math.max(12, Math.round(reservePiecePixelSize * compactReservePieceScale))
    : reservePiecePixelSize;
  const stageGap = viewportHeight < 760 ? urTheme.spacing.xs : urTheme.spacing.sm;
  const viewportTopPadding = 0;
  const viewportBottomPadding = Math.max(insets.bottom, urTheme.spacing.xs);
  const topChromeHeight = isMobileWebLayout ? 30 : 36;
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
  const compactTopChromeIconSize = isMobileWebLayout ? 17 : 20;
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
    ? Math.max(urTheme.spacing.sm, Math.round(viewportHeight * tabletPortraitTuning.boardLiftViewportRatio))
    : 0;
  const mobileHeaderLift = resolveMobileWebHeaderLift({
    boardLift: mobileWebBoardLift,
    isMobileLayout,
    isMobileWebLayout,
  });
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
    ? Math.min(
      Math.max(
        Math.round(stageContentWidth * tabletPortraitTuning.rollButtonWidthRatio),
        tabletPortraitTuning.rollButtonMinSize,
      ),
      tabletPortraitTuning.rollButtonMaxSize,
    )
    : 0;
  const mobileDiceDockWidth = useMobileSideReserveRails
    ? mobileWebRollButtonArtSize
    : Math.min(Math.max(Math.round(stageContentWidth * 0.46), 176), 248);
  const mobileReserveRailTopOffset = resolveMobileReserveRailTopOffset({
    isMobileWebLayout,
    isOnlineMatch: !isOffline,
    reserveColumnWidth: mobileReserveColumnWidth,
    useMobileSideReserveRails,
  });
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
  const mobileBoardGapLayout = useMemo(() => {
    if (!isMobileLayout || !useMobileSideReserveRails || !boardTargetFrame) {
      return null;
    }

    return computeBoardGapControlLayout({
      boardFrame: boardTargetFrame,
    });
  }, [boardTargetFrame, isMobileLayout, useMobileSideReserveRails]);
  const mobileWebTrayColumnControlLayout = useMemo(() => {
    if (
      !isMobileWebLayout ||
      !useMobileSideReserveRails ||
      !mobileBoardGapLayout ||
      !lightTrayFrame ||
      !darkTrayFrame
    ) {
      return null;
    }

    return {
      diceFrame: {
        x: Math.round(lightTrayFrame.x),
        y: mobileBoardGapLayout.diceFrame.y,
        width: Math.round(lightTrayFrame.width),
        height: mobileBoardGapLayout.diceFrame.height,
      },
      rollFrame: {
        x: Math.round(darkTrayFrame.x),
        y: mobileBoardGapLayout.rollFrame.y,
        width: Math.round(darkTrayFrame.width),
        height: mobileBoardGapLayout.rollFrame.height,
      },
    };
  }, [
    darkTrayFrame,
    isMobileWebLayout,
    lightTrayFrame,
    mobileBoardGapLayout,
    useMobileSideReserveRails,
  ]);
  const useMobileWebVerticalDiceReels = mobileWebTrayColumnControlLayout !== null;
  const mobileSideControlLayout = mobileWebTrayColumnControlLayout ?? mobileBoardGapLayout;
  const mobileBoardGapControlMetrics = useMemo(() => {
    if (!mobileSideControlLayout) {
      return null;
    }

    const diceInset = Math.max(
      4,
      Math.round(
        Math.min(mobileSideControlLayout.diceFrame.width, mobileSideControlLayout.diceFrame.height) * 0.08,
      ),
    );

    return {
      diceViewportHeight: Math.round(
        Math.max(
          0,
          (useMobileWebVerticalDiceReels
            ? mobileSideControlLayout.diceFrame.height
            : mobileSideControlLayout.diceFrame.width) -
            diceInset * 2,
        ) *
          tabletPortraitTuning.boardGapControlScale *
          (useMobileWebVerticalDiceReels ? MOBILE_WEB_REEL_BOX_SCALE : 1),
      ),
      diceViewportWidth: Math.round(
        Math.max(
          0,
          (useMobileWebVerticalDiceReels
            ? mobileSideControlLayout.diceFrame.width
            : mobileSideControlLayout.diceFrame.height) -
            diceInset * 2,
        ) *
          tabletPortraitTuning.boardGapControlScale *
          (useMobileWebVerticalDiceReels ? MOBILE_WEB_REEL_BOX_SCALE : 1),
      ),
      diceImageScale: useMobileWebVerticalDiceReels ? MOBILE_WEB_REEL_DICE_IMAGE_SCALE : 1,
      diceOrientation: useMobileWebVerticalDiceReels ? 'vertical' as const : 'horizontal' as const,
      rollArtSize: Math.max(
        44,
        Math.round(
          Math.min(mobileSideControlLayout.rollFrame.width, mobileSideControlLayout.rollFrame.height) *
            0.82 *
            tabletPortraitTuning.boardGapControlScale *
            (useMobileWebVerticalDiceReels ? MOBILE_WEB_ROLL_BUTTON_SCALE : 1),
        ),
      ),
    };
  }, [
    mobileSideControlLayout,
    tabletPortraitTuning.boardGapControlScale,
    useMobileWebVerticalDiceReels,
  ]);
  const showMobileBoardGapDice =
    useMobileSideReserveRails && mobileSideControlLayout !== null && mobileBoardGapControlMetrics !== null;
  const showMobileWebUnderBoardDiceOverlay =
    isWebLayout && mobileWebUnderBoardDiceFrame !== null && !showMobileBoardGapDice;
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
  useEffect(() => {
    if (!isMobileWebLayout || !useMobileSideReserveRails) {
      setMobileBoardTrayAlignmentCorrection((current) => (current === 0 ? current : 0));
      return;
    }

    setMobileBoardTrayAlignmentCorrection((current) => {
      const next = resolveMobileWebBoardTrayAlignmentCorrection({
        boardFrame: boardTargetFrame,
        currentCorrection: current,
        darkTrayFrame,
        lightTrayFrame,
      });

      return current === next ? current : next;
    });
  }, [
    boardTargetFrame,
    darkTrayFrame,
    isMobileWebLayout,
    lightTrayFrame,
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
  const isViewportStable = Platform.OS !== 'web' || webVisualViewportSize !== null;
  const areReserveMeasurementsReady =
    lightReserveSlots.length === lightReserve &&
    darkReserveSlots.length === darkReserve;
  const matchPresentationPrereqsReady =
    isViewportStable &&
    arePresentationAssetsReady &&
    haveLoadedMatchPreferences &&
    hasBoardArtLayout &&
    areReserveMeasurementsReady;
  const fullMatchPresentationReady = matchPresentationPrereqsReady && isBoardTargetFrameReady;
  const shouldForceMatchPresentationReveal =
    hasMatchPresentationFallbackElapsed &&
    isViewportStable &&
    arePresentationAssetsReady &&
    haveLoadedMatchPreferences &&
    hasBoardArtLayout;
  const matchPresentationReady =
    SHOULD_BYPASS_CINEMATIC_INTROS ||
    fullMatchPresentationReady ||
    hasPlayedBoardDropIntro ||
    shouldForceMatchPresentationReveal;

  useEffect(() => {
    if (showMobileWebStatusInfoButton) {
      return;
    }

    setShowMatchStatusInfo(false);
  }, [showMobileWebStatusInfoButton]);

  useEffect(() => {
    syncBoardTargetFrame();
  }, [boardScale, mobileBoardVisualOffset, mobileScoreRowHeight, syncBoardTargetFrame]);
  useEffect(() => {
    if (SHOULD_BYPASS_CINEMATIC_INTROS || matchPresentationReady) {
      return;
    }

    const timer = setTimeout(() => {
      setHasMatchPresentationFallbackElapsed(true);
    }, MATCH_PRESENTATION_READY_FALLBACK_MS);

    return () => {
      clearTimeout(timer);
    };
  }, [matchId, matchPresentationReady]);
  useEffect(() => {
    if (!shouldForceMatchPresentationReveal) {
      return;
    }

    setShowBoardDropIntro(false);
    setShowReserveCascadeIntro(false);
    setFrozenReserveCascadeTargets([]);
    setHasPlayedBoardDropIntro(true);
    setHasPlayedReserveCascadeIntro(true);
  }, [shouldForceMatchPresentationReveal]);

  const shouldHideReservePieces =
    !SHOULD_BYPASS_CINEMATIC_INTROS &&
    !hasPlayedReserveCascadeIntro &&
    hasMeasuredReserveTargets;
  const isTurnTimerEnabled = introsComplete && !isScriptedTutorialPhase && (!isOffline || botTimerEnabled);
  const isVisualTurnTimerRunning =
    isTurnTimerEnabled &&
    isOpponentReadyToPlay &&
    gameState.phase !== 'ended' &&
    gameState.winner === null &&
    (isOffline
      ? true
      : authoritativeTurnDeadlineMs !== null &&
        authoritativeServerTimeMs !== null &&
        authoritativeSnapshotReceivedAtMs !== null &&
        authoritativeActiveTimedPlayerColor === gameState.currentTurn &&
        authoritativeActiveTimedPhase === gameState.phase);
  const showPersistentDiceVisual = introsComplete && diceAnimationEnabled;
  const showDestinationHighlights = introsComplete && !rollingVisual && gameState.rollValue !== null;
  const displayedValidMoves = useMemo(() => {
    if (tutorialForcedNoMove) {
      return [];
    }

    const liveDisplayedMoves = showDestinationHighlights && isOpponentReadyToPlay ? validMoves : [];

    if (
      !isScriptedTutorialPhase ||
      tutorialCoachPhase !== 'lesson_play' ||
      tutorialPendingStep?.kind !== 'MOVE'
    ) {
      return liveDisplayedMoves;
    }

    const scriptedMove = liveDisplayedMoves.find(
      (candidate) =>
        candidate.pieceId === tutorialPendingStep.pieceId &&
        candidate.fromIndex === tutorialPendingStep.fromIndex &&
        candidate.toIndex === tutorialPendingStep.toIndex,
    );

    return scriptedMove ? [scriptedMove] : [];
  }, [
    isOpponentReadyToPlay,
    isScriptedTutorialPhase,
    showDestinationHighlights,
    tutorialCoachPhase,
    tutorialForcedNoMove,
    tutorialPendingStep,
    validMoves,
  ]);
  const displayedRollValue = gameState.rollValue ?? heldRollDisplay?.value ?? null;
  const displayedRollLabel =
    tutorialForcedNoMove && displayedRollValue !== null && displayedRollValue > 0
      ? 'No Move'
      : gameState.rollValue === null
        ? heldRollDisplay?.label ?? null
        : null;
  const displayedRollText = displayedRollLabel ?? (displayedRollValue !== null ? String(displayedRollValue) : null);
  const showMobileRollResult =
    introsComplete &&
    isMobileLayout &&
    !rollingVisual &&
    displayedRollValue !== null;
  const showWebRollResult = introsComplete && showWebSideDiceVisual && !rollingVisual && displayedRollValue !== null;
  const showMobileWebBoardGapRollResult =
    isMobileWebLayout &&
    useMobileWebVerticalDiceReels &&
    showMobileRollResult &&
    displayedRollValue !== null;
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
      displayedRollValue === null
    ) {
      return null;
    }

    const resultWidth =
      displayedRollLabel !== null
        ? Math.max(104, Math.min(148, Math.round(lightTrayFrame.width * 1.36)))
        : Math.max(44, Math.min(72, Math.round(lightTrayFrame.width * 0.94)));
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
    displayedRollValue,
    displayedRollLabel,
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
    if (!fullMatchPresentationReady) return;
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
    fullMatchPresentationReady,
    hasPlayedBoardDropIntro,
    isMobileLayout,
    isBoardTargetFrameReady,
    showBoardDropIntro,
  ]);
  useEffect(() => {
    if (!matchPresentationPrereqsReady || shouldForceMatchPresentationReveal) {
      return;
    }

    if (hasPlayedBoardDropIntro || showBoardDropIntro || isBoardTargetFrameReady) {
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
    isBoardTargetFrameReady,
    matchPresentationPrereqsReady,
    shouldForceMatchPresentationReveal,
    showBoardDropIntro,
  ]);
  useEffect(() => {
    if (!matchPresentationPrereqsReady || shouldForceMatchPresentationReveal) return;
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
    matchPresentationPrereqsReady,
    reserveCascadeTargets.length,
    shouldForceMatchPresentationReveal,
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
      <View
        style={[
          styles.liveBoardWrap,
          !SHOULD_BYPASS_CINEMATIC_INTROS && !hasPlayedBoardDropIntro && styles.liveBoardHidden,
        ]}
      >
        <Board
          autoMoveHintEnabled={moveHintEnabled}
          showRailHints
          highlightMode="theatrical"
          validMovesOverride={displayedValidMoves}
          onMakeMoveOverride={handleBoardMove}
          onInteraction={resumeAnnouncementCuesFromInteraction}
          allowInteraction={isOnlineInteractionReady}
          freezeMotion={shouldFreezeForfeitMotion}
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
      freezeMotion={shouldFreezeForfeitMotion}
    />
  );

  const emojiControlsDisabled =
    emojiReactionsRemaining <= 0 || !shouldShowEmojiControls || !isOnlineInteractionReady;
  const renderEmojiReactionControl = (style?: StyleProp<ViewStyle>, compact = compactSupportUi) => {
    if (!shouldShowEmojiControls) {
      return null;
    }

    return (
      <EmojiReactionMenu
        compact={compact}
        disabled={emojiControlsDisabled}
        menuVisible={showEmojiReactionMenu}
        onSelect={(emoji) => {
          void sendEmojiReaction(emoji);
        }}
        onToggle={handleToggleEmojiReactionMenu}
        options={EMOJI_REACTION_OPTIONS}
        remainingCount={emojiReactionsRemaining}
        style={style}
      />
    );
  };

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

      <View
        pointerEvents={matchPresentationReady ? 'auto' : 'none'}
        style={[styles.presentationLayer, !matchPresentationReady && styles.presentationLayerHidden]}
      >
        {matchPresentationReady ? (
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
        ) : null}

      {floatingReactions.length > 0 ? (
        <FloatingEmojiReactions onComplete={removeFloatingReaction} reactions={floatingReactions} />
      ) : null}

      {introsComplete && isMatchStageExternal && diceAnimationEnabled ? (
        <MatchDiceRollStage
          boardFrame={boardTargetFrame}
          canRoll={introsComplete && canRoll}
          compact={compactSupportUi}
          durationMs={diceAnimationDurationMs}
          onResultShown={handleRollResultShown}
          rollValue={displayedRollValue}
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
            value={displayedRollValue}
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
            <View style={[styles.mobileDiceWrap, styles.rollActionStack]}>
              <Dice
                animationDurationMs={diceAnimationDurationMs}
                value={displayedRollValue}
                resultLabel={displayedRollLabel}
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
              {renderEmojiReactionControl(styles.diceReactionControl, true)}
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
            title={scoreTitles.dark}
            score={gameState.dark.finishedCount}
            maxScore={pieceCountPerSide}
            active={introsComplete && !shouldFreezeForfeitMotion && !isMyTurn}
            align="right"
          />
        </View>
      ) : null}
      {mobileWebTrayRollResultFrame && !showMobileWebBoardGapRollResult ? (
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
                fontSize:
                  displayedRollLabel !== null
                    ? Math.max(18, Math.round(mobileWebTrayRollResultFrame.height * 0.5))
                    : Math.max(28, Math.round(mobileWebTrayRollResultFrame.height * 0.84)),
                lineHeight:
                  displayedRollLabel !== null
                    ? Math.max(22, Math.round(mobileWebTrayRollResultFrame.height * 0.58))
                    : Math.max(30, Math.round(mobileWebTrayRollResultFrame.height * 0.88)),
              },
            ]}
          >
            {displayedRollText}
          </Text>
        </View>
      ) : null}

      {showMobileBoardGapDice && mobileSideControlLayout && mobileBoardGapControlMetrics ? (
        <View
          pointerEvents="none"
          style={[
            styles.mobileBoardGapOverlay,
            {
              left: mobileSideControlLayout.diceFrame.x,
              top: mobileSideControlLayout.diceFrame.y,
              width: mobileSideControlLayout.diceFrame.width,
              height: mobileSideControlLayout.diceFrame.height,
            },
          ]}
        >
          <View
            style={[
              styles.mobileBoardGapDiceWrap,
              useMobileWebVerticalDiceReels && styles.mobileBoardGapDiceWrapVisible,
            ]}
          >
            <View
              style={[
                useMobileWebVerticalDiceReels
                  ? styles.mobileBoardGapDiceViewport
                  : styles.mobileBoardGapDiceRotator,
                {
                  width: mobileBoardGapControlMetrics.diceViewportWidth,
                  height: mobileBoardGapControlMetrics.diceViewportHeight,
                },
              ]}
            >
              <DiceStageVisual
                animationDurationMs={diceAnimationDurationMs}
                value={displayedRollValue}
                rolling={rollingVisual}
                canRoll={introsComplete && canRoll}
                compact
                diceImageScale={mobileBoardGapControlMetrics.diceImageScale}
                fitToContainer
                onResultShown={handleRollResultShown}
                reelOrientation={mobileBoardGapControlMetrics.diceOrientation}
                visible={showPersistentDiceVisual}
              />
            </View>
          </View>
        </View>
      ) : null}
      {showMobileBoardGapDice && mobileSideControlLayout && mobileBoardGapControlMetrics ? (
        <View
          pointerEvents="box-none"
          style={[
            styles.mobileBoardGapOverlay,
            {
              left: mobileSideControlLayout.rollFrame.x,
              top: mobileSideControlLayout.rollFrame.y,
              width: mobileSideControlLayout.rollFrame.width,
              height: mobileSideControlLayout.rollFrame.height,
            },
          ]}
        >
          <View style={styles.rollActionStack}>
            {showMobileWebBoardGapRollResult ? (
              <Text
                numberOfLines={1}
                style={[
                  styles.mobileBoardGapRollResultValue,
                  {
                    fontFamily: rollResultFontFamily,
                    fontSize:
                      displayedRollLabel !== null
                        ? Math.max(16, Math.min(24, Math.round(mobileSideControlLayout.rollFrame.width * 0.34)))
                        : Math.max(
                            24,
                            Math.min(42, Math.round(mobileSideControlLayout.rollFrame.width * 0.72)),
                          ),
                    lineHeight:
                      displayedRollLabel !== null
                        ? Math.max(20, Math.min(28, Math.round(mobileSideControlLayout.rollFrame.width * 0.42)))
                        : Math.max(
                            26,
                            Math.min(46, Math.round(mobileSideControlLayout.rollFrame.width * 0.8)),
                          ),
                  },
                ]}
              >
                {displayedRollText}
              </Text>
            ) : (
              <Dice
                animationDurationMs={diceAnimationDurationMs}
                value={displayedRollValue}
                resultLabel={displayedRollLabel}
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
                artSize={mobileBoardGapControlMetrics.rollArtSize}
              />
            )}
            {renderEmojiReactionControl(styles.diceReactionControl, true)}
          </View>
        </View>
      ) : null}

      <View
        style={[
          styles.topChrome,
          useInlineTopChromeLayout && styles.topChromeMobile,
          isMobileWebLayout && styles.topChromeCompact,
          { top: topChromeTop - mobileHeaderLift },
        ]}
      >
        <View
          style={[
            styles.topChromeLeft,
            useInlineTopChromeLayout && styles.topChromeLeftMobile,
            isMobileWebLayout && styles.topChromeLeftCompact,
          ]}
        >
          {canUseTopExit ? (
            <Pressable
              onPress={handleExit}
              accessibilityRole="button"
              accessibilityLabel="Exit game"
              style={({ pressed }) => [
                styles.topChromeIconButton,
                isWebLayout && styles.topChromeIconButtonWeb,
                isMobileLayout && styles.topChromeIconButtonMobile,
                isMobileWebLayout && styles.topChromeIconButtonCompact,
                pressed && styles.headerHelpButtonPressed,
              ]}
            >
              <MaterialIcons
                name="arrow-back"
                size={compactTopChromeIconSize}
                color={isMobileLayout || isWebLayout ? urTheme.colors.ivory : TOP_CHROME_ACCENT}
              />
            </Pressable>
          ) : (
            <View
              style={[
                styles.topChromeIconButton,
                isMobileWebLayout && styles.topChromeIconButtonCompact,
                styles.topChromeExitSpacer,
              ]}
            />
          )}
          <View style={[styles.topChromeTitleStack, useInlineTopChromeLayout && styles.topChromeTitleStackMobile]}>
            <Text
              numberOfLines={1}
              style={[
                styles.topChromeTitle,
                (isMobileLayout || isWebLayout) && styles.topChromeTitleMobile,
                useInlineTopChromeLayout && styles.topChromeTitleInlineMobile,
                isMobileWebLayout && styles.topChromeTitleCompact,
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
              setShowMatchStatusInfo(false);
              setShowTopMenu((current) => !current);
            }}
            accessibilityRole="button"
            accessibilityLabel="Open match menu"
            style={({ pressed }) => [
              styles.topChromeIconButton,
              isWebLayout && styles.topChromeIconButtonWeb,
              isMobileLayout && styles.headerHelpButtonMobile,
              isMobileWebLayout && styles.topChromeIconButtonCompact,
              pressed && styles.headerHelpButtonPressed,
            ]}
          >
            <MaterialIcons
              name="more-vert"
              size={compactTopChromeIconSize}
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

      {(showTopMenu || showInlineMatchStatusPopover) ? (
        <Pressable
          style={styles.topMenuScrim}
          onPress={() => {
            setShowTopMenu(false);
            setShowMatchStatusInfo(false);
          }}
        />
      ) : null}
      {showInlineMatchStatusPopover ? (
        <View
          testID="mobile-match-status-popover"
          style={[
            styles.mobileMatchStatusPopover,
            isPrivateMatch ? styles.onlineStatusPillPrivate : null,
            isTournamentMatch ? styles.onlineStatusPillTournament : null,
            !isPrivateMatch && hasOpponentJoined ? styles.onlineStatusPillReady : null,
            {
              top: mobileScoreOverlayTop - mobileHeaderLift + measuredScoreRowHeight + urTheme.spacing.xs,
              left: mobileScoreRowInset,
              right: mobileScoreRowInset,
            },
          ]}
        >
          <Text style={styles.mobileMatchStatusPopoverText}>{onlineMatchStatusPillText}</Text>
        </View>
      ) : null}

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
          {onlineMatchStatusPillText && !showMobileWebStatusInfoButton ? (
            <View
              pointerEvents="none"
              testID="online-match-status-pill"
              style={[
                styles.onlineStatusPill,
                isPrivateMatch ? styles.onlineStatusPillPrivate : null,
                isTournamentMatch ? styles.onlineStatusPillTournament : null,
                !isPrivateMatch && hasOpponentJoined ? styles.onlineStatusPillReady : null,
              ]}
            >
              <Text numberOfLines={1} style={styles.onlineStatusPillText}>
                {onlineMatchStatusPillText}
              </Text>
            </View>
          ) : null}
          {displayedTutorialObjectiveBanner ? (
            <View pointerEvents="none" style={styles.tutorialObjectiveBanner}>
              <Text style={styles.tutorialObjectiveText}>{displayedTutorialObjectiveBanner}</Text>
            </View>
          ) : null}
          <View
            pointerEvents={showMobileWebStatusInfoButton ? 'box-none' : 'none'}
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
            <View pointerEvents="none" style={styles.scoreIndicatorSlot}>
              <EdgeScore
                side="light"
                title={scoreTitles.light}
                score={gameState.light.finishedCount}
                maxScore={pieceCountPerSide}
                active={introsComplete && !shouldFreezeForfeitMotion && isMyTurn}
              />
            </View>
            {isMobileLayout && isTurnTimerEnabled ? (
              <View pointerEvents="none" style={styles.scoreTimerSlot}>
                <GameStageHUD
                  isMyTurn={isMyTurn}
                  canRoll={canRoll}
                  phase={gameState.phase}
                  compact
                  layout="inline"
                  timerDurationMs={resolvedTurnTimerDurationMs}
                  timerRemainingMs={resolvedTurnTimerRemainingMs}
                  timerIsRunning={isVisualTurnTimerRunning}
                  timerKey={resolvedTurnTimerKey}
                  timerWarningThreshold={VISUAL_TURN_TIMER_WARNING_THRESHOLD}
                  timerSize={30}
                />
              </View>
            ) : null}
            {showMobileWebStatusInfoButton ? (
              <Pressable
                testID="mobile-match-status-button"
                accessibilityRole="button"
                accessibilityLabel="Show match status"
                onPress={() => {
                  resumeAnnouncementCuesFromInteraction();
                  setShowTopMenu(false);
                  setShowMatchStatusInfo((current) => !current);
                }}
                style={({ pressed }) => [
                  styles.scoreInfoButton,
                  pressed && styles.scoreInfoButtonPressed,
                ]}
              >
                <MaterialIcons name="info-outline" size={15} color={urTheme.colors.ivory} />
              </Pressable>
            ) : null}
            <View pointerEvents="none" style={styles.scoreIndicatorSlot}>
              {showMobileWebDetachedDarkScore ? (
                <EdgeScore
                  side="dark"
                  title={scoreTitles.dark}
                  score={gameState.dark.finishedCount}
                  maxScore={pieceCountPerSide}
                  active={introsComplete && !shouldFreezeForfeitMotion && !isMyTurn}
                  align="right"
                  style={[
                    isMobileLayout && isTurnTimerEnabled ? { marginRight: mobileDarkScoreNudge } : undefined,
                    styles.mobileDetachedScoreGhost,
                  ]}
                />
              ) : (
                <EdgeScore
                  side="dark"
                  title={scoreTitles.dark}
                  score={gameState.dark.finishedCount}
                  maxScore={pieceCountPerSide}
                  active={introsComplete && !shouldFreezeForfeitMotion && !isMyTurn}
                  align="right"
                  style={isMobileLayout && isTurnTimerEnabled ? { marginRight: mobileDarkScoreNudge } : undefined}
                />
              )}
            </View>
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
                          fontSize:
                            displayedRollLabel !== null
                              ? Math.max(22, Math.round(webRollResultFontSize * 0.54))
                              : webRollResultFontSize,
                          lineHeight: webRollButtonSize,
                        },
                        !showWebRollResult && styles.webRollResultValueMuted,
                      ]}
                    >
                      {showWebRollResult ? (displayedRollText ?? '') : ''}
                    </Text>
                  </View>
                ) : null}
                <PieceRail
                  label="Light Reserve"
                  color="light"
                  tokenVariant="light"
                  trayScale={reserveTrayScale}
                  piecePixelSize={scaledReservePiecePixelSize}
                  reserveCount={lightReserve}
                  totalCount={pieceCountPerSide}
                  active={introsComplete && !shouldFreezeForfeitMotion && isMyTurn}
                  hideReservePieces={shouldHideReservePieces}
                  onReserveSlotsLayout={setLightReserveSlots}
                />
                {!showWebSideDiceVisual && isTurnTimerEnabled ? (
                  <GameStageHUD
                    isMyTurn={isMyTurn}
                    canRoll={canRoll}
                    phase={gameState.phase}
                    compact={compactSupportUi}
                    timerDurationMs={resolvedTurnTimerDurationMs}
                    timerRemainingMs={resolvedTurnTimerRemainingMs}
                    timerIsRunning={isVisualTurnTimerRunning}
                    timerKey={resolvedTurnTimerKey}
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
                      timerDurationMs={resolvedTurnTimerDurationMs}
                      timerRemainingMs={resolvedTurnTimerRemainingMs}
                      timerIsRunning={isVisualTurnTimerRunning}
                      timerKey={resolvedTurnTimerKey}
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
                      value={displayedRollValue}
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
                  trayScale={reserveTrayScale}
                  piecePixelSize={scaledReservePiecePixelSize}
                  reserveCount={darkReserve}
                  totalCount={pieceCountPerSide}
                  active={introsComplete && !shouldFreezeForfeitMotion && !isMyTurn}
                  hideReservePieces={shouldHideReservePieces}
                  onReserveSlotsLayout={setDarkReserveSlots}
                />
                {showWebSideDiceVisual ? (
                  <View style={[styles.webUnderTrayControl, { minHeight: webRollButtonSize }]}>
                    <View style={[styles.webUnderTrayButtonWrap, styles.rollActionStack]}>
                      <Dice
                        animationDurationMs={diceAnimationDurationMs}
                        value={displayedRollValue}
                        resultLabel={displayedRollLabel}
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
                      {renderEmojiReactionControl(styles.diceReactionControl)}
                    </View>
                  </View>
                ) : (
                  <View style={styles.rollActionStack}>
                    <Dice
                      animationDurationMs={diceAnimationDurationMs}
                      value={displayedRollValue}
                      resultLabel={displayedRollLabel}
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
                    {renderEmojiReactionControl(styles.diceReactionControl)}
                  </View>
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
                      trayScale={reserveTrayScale}
                      reserveCount={lightReserve}
                      totalCount={pieceCountPerSide}
                      active={introsComplete && !shouldFreezeForfeitMotion && isMyTurn}
                      hideReservePieces={shouldHideReservePieces}
                      onReserveSlotsLayout={setLightReserveSlots}
                      onRailFrameLayout={handleLightTrayFrameLayout}
                    />
                  </View>
                ) : null}

                <View
                  style={[
                    styles.boardCenterColumn,
                    mobileWebBoardTrayAlignmentLift > 0 && {
                      marginTop: -mobileWebBoardTrayAlignmentLift,
                      marginBottom: mobileWebBoardTrayAlignmentLift,
                    },
                  ]}
                >
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
                      trayScale={reserveTrayScale}
                      reserveCount={darkReserve}
                      totalCount={pieceCountPerSide}
                      active={introsComplete && !shouldFreezeForfeitMotion && !isMyTurn}
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
                    <View style={[styles.mobileDiceWrap, styles.rollActionStack, { width: mobileDiceDockWidth }]}>
                      <Dice
                        animationDurationMs={diceAnimationDurationMs}
                        value={displayedRollValue}
                        resultLabel={displayedRollLabel}
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
                      {renderEmojiReactionControl(styles.diceReactionControl, true)}
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
                        {
                          fontFamily: rollResultFontFamily,
                          transform: [{ translateY: mobileRollResultOffset }],
                          ...(displayedRollLabel !== null ? { fontSize: 28, lineHeight: 32 } : {}),
                        },
                      ]}
                    >
                      {displayedRollText}
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
                        active={introsComplete && !shouldFreezeForfeitMotion && isMyTurn}
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
                        active={introsComplete && !shouldFreezeForfeitMotion && !isMyTurn}
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
                    <View style={[styles.mobileDiceWrap, styles.rollActionStack, { width: mobileDiceDockWidth }]}>
                      <Dice
                        animationDurationMs={diceAnimationDurationMs}
                        value={displayedRollValue}
                        resultLabel={displayedRollLabel}
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
                      {renderEmojiReactionControl(styles.diceReactionControl, true)}
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
        visible={showRulesIntroModal && Boolean(rulesIntro)}
        title={rulesIntro?.title ?? ''}
        message={rulesIntro?.message}
        actionLabel="Close"
        onAction={() => setShowRulesIntroModal(false)}
        maxWidth={520}
      />

      <Modal
        visible={shouldRenderResultModal}
        title={isTournamentMatch ? tournamentResultModalTitle : winModalTitle}
        message={isTournamentMatch ? tournamentResultModalMessage : winModalMessage}
        actionLabel={resultModalActionLabel}
        actionLoading={isTournamentResultModal && isValidatingTournamentExit}
        onAction={
          showTournamentAdvanceResolutionModal || showTournamentFallbackPendingModal
            ? undefined
            : handleExit
        }
        maxWidth={520}
      >
        {renderSharedResultSummary()}
      </Modal>

      <TournamentWaitingRoom
        visible={showTournamentWaitingRoom}
        phase={tournamentAdvanceFlow.phase}
        tournamentName={tournamentDisplayName}
        derivedRound={tournamentAdvanceFlow.derivedRound}
        statusText={tournamentAdvanceFlow.statusText}
        subtleStatusText={tournamentAdvanceFlow.subtleStatusText}
        retryMessage={tournamentAdvanceFlow.retryMessage}
        standings={tournamentAdvanceFlow.standings}
        currentStanding={tournamentAdvanceFlow.currentStanding}
        highlightOwnerId={tournamentPlayerUserId}
        finalPlacement={tournamentAdvanceFlow.finalPlacement}
        isChampion={tournamentAdvanceFlow.isChampion}
        rewardSummary={isTournamentRewardSummaryPrimary ? tournamentRewardSummary : null}
        onReturnToMainPage={handleExit}
        onLaunchNextMatch={tournamentAdvanceFlow.launchNextMatch}
      />

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
        showTimerDurationPicker={isOffline}
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
  onlineStatusPill: {
    alignSelf: 'center',
    maxWidth: '100%',
    marginTop: 4,
    marginBottom: urTheme.spacing.xs,
    paddingHorizontal: urTheme.spacing.md,
    paddingVertical: urTheme.spacing.xs,
    borderRadius: urTheme.radii.pill,
    borderWidth: 1,
    borderColor: 'rgba(170, 196, 228, 0.28)',
    backgroundColor: 'rgba(14, 24, 36, 0.82)',
    zIndex: 6,
  },
  onlineStatusPillPrivate: {
    borderColor: 'rgba(217, 164, 65, 0.36)',
    backgroundColor: 'rgba(29, 19, 12, 0.82)',
  },
  onlineStatusPillTournament: {
    borderColor: 'rgba(137, 193, 255, 0.32)',
    backgroundColor: 'rgba(9, 24, 41, 0.84)',
  },
  onlineStatusPillReady: {
    borderColor: 'rgba(126, 177, 255, 0.34)',
    backgroundColor: 'rgba(17, 35, 39, 0.84)',
  },
  onlineStatusPillText: {
    ...urTypography.label,
    color: urTheme.colors.parchment,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 0.4,
    textAlign: 'center',
  },
  mobileMatchStatusPopover: {
    position: 'absolute',
    zIndex: 7,
    paddingHorizontal: urTheme.spacing.md,
    paddingVertical: urTheme.spacing.sm,
    borderRadius: urTheme.radii.md,
    borderWidth: 1,
    borderColor: 'rgba(170, 196, 228, 0.28)',
    backgroundColor: 'rgba(14, 24, 36, 0.94)',
  },
  mobileMatchStatusPopoverText: {
    ...urTypography.label,
    color: urTheme.colors.parchment,
    fontSize: 11,
    lineHeight: 15,
    letterSpacing: 0.35,
    textAlign: 'center',
  },
  backdropLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
    backgroundColor: '#D9C39A',
  },
  presentationLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  presentationLayerHidden: {
    opacity: 0,
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
  mobileBoardGapDiceWrap: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  mobileBoardGapDiceWrapVisible: {
    overflow: 'visible',
  },
  mobileBoardGapDiceRotator: {
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '-90deg' }],
  },
  mobileBoardGapDiceViewport: {
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
  topChromeCompact: {
    gap: urTheme.spacing.xs,
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
  topChromeLeftCompact: {
    gap: 4,
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
  topChromeIconButtonCompact: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.8,
  },
  topChromeExitSpacer: {
    opacity: 0,
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
  topChromeTitleCompact: {
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 0.25,
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
  scoreIndicatorSlot: {
    flexShrink: 0,
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
  scoreInfoButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.4,
    borderColor: 'rgba(248, 225, 184, 0.56)',
    backgroundColor: 'rgba(15, 22, 32, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    ...boxShadow({
      color: '#000',
      opacity: 0.18,
      offset: { width: 0, height: 1 },
      blurRadius: 4,
      elevation: 2,
    }),
  },
  scoreInfoButtonPressed: {
    opacity: 0.82,
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
  tournamentReturnButton: {
    width: '100%',
    marginBottom: urTheme.spacing.sm,
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
  rollActionStack: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: urTheme.spacing.xs,
  },
  diceReactionControl: {
    zIndex: 1,
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
  mobileBoardGapRollResultValue: {
    ...urTypography.title,
    color: urTheme.colors.ivory,
    minWidth: 0,
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
