import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { createInitialState, getValidMoves } from '@/logic/engine';
import { getMatchConfig } from '@/logic/matchConfigs';
import type { GameState, MoveAction } from '@/logic/types';
import { CHALLENGE_DEFINITIONS, createDefaultUserChallengeProgressSnapshot } from '@/shared/challenges';
import type { EloRatingProfileRpcResponse } from '@/shared/elo';
import { buildProgressionSnapshot } from '@/shared/progression';
import { MatchOpCode } from '@/shared/urMatchProtocol';

const mockMatchDiceRollStage = jest.fn(({
  rolling,
  rollValue,
  visible,
}: {
  rolling: boolean;
  rollValue?: number | null;
  visible: boolean;
}) => {
  const { Text } = require('react-native');
  return (
    <Text testID="match-dice-stage-playback">
      {`${visible ? 'visible' : 'hidden'}:${rolling ? 'rolling' : 'idle'}:${String(rollValue ?? null)}`}
    </Text>
  );
});
const mockBoard = jest.fn();
const mockGameStageHUD = jest.fn((_props?: unknown) => {
  const { View } = require('react-native');
  return <View testID="mock-stage-hud" />;
});
const mockEdgeScore = jest.fn(({ title }: { title?: string }) => {
  const { Text, View } = require('react-native');
  return (
    <View testID="mock-edge-score">
      <Text>{title ?? 'UNTITLED'}</Text>
    </View>
  );
});
const mockAudioSettingsModal = jest.fn((_props?: unknown) => {
  const { View } = require('react-native');
  return <View testID="mock-audio-settings" />;
});
const mockCinematicXpRewardModal = jest.fn(
  ({
    visible,
    previousTotalXp,
    newTotalXp,
    onComplete,
  }: {
    visible?: boolean;
    previousTotalXp?: number;
    newTotalXp?: number;
    onComplete?: () => void;
  }) => {
    const React = require('react');
    const { useEffect } = React;
    const { Pressable, Text, View } = require('react-native');

    useEffect(() => {
      if (visible && mockAutoCompleteCinematicXpModal) {
        onComplete?.();
      }
    }, [onComplete, visible]);

    if (!visible) {
      return null;
    }

    return (
      <View testID="mock-cinematic-xp-modal">
        <Text>{`XP reveal ${String(previousTotalXp ?? 0)} -> ${String(newTotalXp ?? 0)}`}</Text>
        <Pressable testID="mock-cinematic-xp-complete" onPress={onComplete}>
          <Text>Finish XP Reveal</Text>
        </Pressable>
      </View>
    );
  },
);
const mockModal = jest.fn(
  ({
    visible,
    title,
    message,
    actionLabel,
    actionLoading,
    onAction,
    children,
  }: {
    visible?: boolean;
    title?: string;
    message?: string;
    actionLabel?: string;
    actionLoading?: boolean;
    onAction?: () => void;
    children?: React.ReactNode;
  }) => {
    const { Pressable, Text, View } = require('react-native');
    if (!visible) {
      return null;
    }
    return (
      <View testID="mock-modal">
        {title ? <Text>{title}</Text> : null}
        {message ? <Text>{message}</Text> : null}
        {children}
        {actionLabel ? (
          <Pressable disabled={actionLoading} onPress={actionLoading ? undefined : onAction}>
            <Text>{actionLabel}</Text>
            {actionLoading ? <Text>loading</Text> : null}
          </Pressable>
        ) : null}
      </View>
    );
  },
);

const mockSlotDiceScene = jest.fn(() => {
  const { Text } = require('react-native');
  return <Text testID="mock-inline-dice-scene">inline</Text>;
});
const mockDice = jest.fn(({
  canRoll,
  onRoll,
  resultLabel,
}: {
  canRoll?: boolean;
  onRoll?: () => void;
  resultLabel?: string | null;
}) => {
  const { Pressable, Text, View } = require('react-native');
  return (
    <View testID="dice-roll-scene-host">
      {resultLabel ? <Text testID="mock-dice-result-label">{resultLabel}</Text> : null}
      <Pressable testID="dice-roll-button" disabled={!canRoll} onPress={onRoll}>
        <Text>{canRoll ? 'rollable' : 'locked'}</Text>
      </Pressable>
    </View>
  );
});
const mockDiceStageVisual = jest.fn((_props?: unknown) => {
  const { View } = require('react-native');
  return <View testID="mock-dice-stage-visual" />;
});
const defaultMockPieceRailImplementation = (_props?: unknown) => {
  const { View } = require('react-native');
  return <View testID="mock-piece-rail" />;
};
const mockPieceRail = jest.fn(defaultMockPieceRailImplementation);

const mockMatchMomentIndicator = jest.fn(({ cue }: { cue: { message: string } | null }) => {
  const { Text } = require('react-native');
  return cue ? <Text testID="mock-match-cue">{cue.message}</Text> : null;
});
let mockUseRealBoard = false;
let mockUseRealSlotDiceScene = false;
let mockUseRealMatchMomentIndicator = false;

const mockRouterReplace = jest.fn();
const mockSearchParams = {
  id: 'local-1',
  offline: '1',
} as Record<string, string>;
const mockRoll = jest.fn();
const mockMakeMove = jest.fn();
const mockReset = jest.fn();
const mockInitGame = jest.fn();
const mockSetMatchId = jest.fn();
const mockApplyServerSnapshot = jest.fn();
const mockSetPlayerColor = jest.fn();
const mockSetOnlineMode = jest.fn();
const mockUpdateMatchPresences = jest.fn();
const mockSetMatchPresences = jest.fn();
const mockSetSocketState = jest.fn();
const mockSetRollCommandSender = jest.fn();
const mockSetMoveCommandSender = jest.fn();
const mockSetLastProgressionSnapshot = jest.fn();
const mockSetLastEloRatingProfileSnapshot = jest.fn();
const mockSetLastChallengeProgressSnapshot = jest.fn();
const mockRunScreenTransition = jest.fn(async (request?: { action?: () => void | Promise<void> }) => {
  await request?.action?.();
  return true;
});
const mockGetMatchPreferences = jest.fn();
const mockUpdateMatchPreferences = jest.fn();
const mockConnectSocketWithRetry = jest.fn();
const mockDisconnectSocket = jest.fn();
const mockRefreshElo = jest.fn(() => Promise.resolve(null));
const mockRefreshProgression = jest.fn(() => Promise.resolve(null));
const mockRefreshChallenges = jest.fn(() => Promise.resolve(null));
const mockSubmitCompletedBotMatchResult = jest.fn();
let mockProgression = null as ReturnType<typeof buildProgressionSnapshot> | null;
let mockProgressionErrorMessage: string | null = null;
let mockEloRatingProfile: EloRatingProfileRpcResponse | null = null;
let mockAutoCompleteCinematicXpModal = true;
const mockGetPublicTournamentStatus = jest.fn();
const mockLaunchTournamentMatch = jest.fn();
const mockFinalizeTournamentMatch = jest.fn();
const mockTournamentMatchLauncher = {
  finalizeMatchLaunch: (...args: unknown[]) => mockFinalizeTournamentMatch(...args),
};
let mockChallengeDefinitions = CHALLENGE_DEFINITIONS.slice(0, 0);
let mockChallengeProgress: ReturnType<typeof createDefaultUserChallengeProgressSnapshot> | null = null;
let mockTournamentAdvanceFlowState = {
  phase: 'waiting',
  derivedRound: 2,
  statusText: 'Recording your victory in the standings...',
  subtleStatusText: null as string | null,
  retryMessage: null as string | null,
  standings: [] as unknown[],
  currentStanding: null as unknown,
  finalPlacement: null as number | null,
  isChampion: false,
  launchNextMatch: jest.fn(() => Promise.resolve()),
};
let mockTournamentAdvanceFlowShouldFinalize = false;
let mockTournamentAdvanceFlowDidFinalize = false;
const mockSocketJoinMatch = jest.fn();
const mockSocketLeaveMatch = jest.fn();
const mockSocketSendMatchState = jest.fn();
const mockHasNakamaConfig = jest.fn();
const mockIsNakamaEnabled = jest.fn();
const mockSocket = {
  joinMatch: (...args: unknown[]) => mockSocketJoinMatch(...args),
  leaveMatch: (...args: unknown[]) => mockSocketLeaveMatch(...args),
  sendMatchState: (...args: unknown[]) => mockSocketSendMatchState(...args),
  onmatchdata: null as ((...args: unknown[]) => void) | null,
  onmatchpresence: null as ((...args: unknown[]) => void) | null,
  ondisconnect: null as (() => void) | null,
};

const baseGameState: GameState = {
  ...createInitialState(),
  currentTurn: 'light',
  phase: 'rolling',
  rollValue: null,
};

const mockStoreState = {
  applyServerSnapshot: mockApplyServerSnapshot,
  botDifficulty: 'easy' as const,
  gameState: baseGameState,
  initGame: mockInitGame,
  makeMove: mockMakeMove,
  matchId: 'local-1',
  matchPresences: [],
  matchToken: null,
  authoritativeServerTimeMs: null,
  authoritativeTurnDurationMs: null,
  authoritativeTurnStartedAtMs: null,
  authoritativeTurnDeadlineMs: null,
  authoritativeTurnRemainingMs: null,
  authoritativeActiveTimedPlayer: null,
  authoritativeActiveTimedPlayerColor: null,
  authoritativeActiveTimedPhase: null,
  authoritativePlayers: null,
  authoritativeAfkAccumulatedMs: null,
  authoritativeAfkRemainingMs: null,
  authoritativeReconnectingPlayer: null,
  authoritativeReconnectingPlayerColor: null,
  authoritativeReconnectGraceDurationMs: null,
  authoritativeReconnectDeadlineMs: null,
  authoritativeReconnectRemainingMs: null,
  authoritativeMatchEnd: null,
  authoritativeRematch: null,
  authoritativeSnapshotReceivedAtMs: null,
  lastProgressionAward: null,
  lastEloRatingChange: null,
  lastProgressionSnapshot: null,
  lastEloRatingProfileSnapshot: null,
  lastChallengeProgressSnapshot: null,
  moveCommandSender: null,
  nakamaSession: null,
  onlineMode: 'offline' as const,
  playerColor: 'light' as const,
  playerId: 'light',
  reset: mockReset,
  roll: mockRoll,
  rollCommandSender: null,
  serverRevision: 0,
  setBotDifficulty: jest.fn(),
  setGameStateFromServer: jest.fn(),
  setMatchId: mockSetMatchId,
  setMatchPresences: mockSetMatchPresences,
  setMatchToken: jest.fn(),
  setMoveCommandSender: mockSetMoveCommandSender,
  setNakamaSession: jest.fn(),
  setOnlineMode: mockSetOnlineMode,
  setLastProgressionAward: jest.fn(),
  setLastEloRatingChange: jest.fn(),
  setLastProgressionSnapshot: mockSetLastProgressionSnapshot,
  setLastEloRatingProfileSnapshot: mockSetLastEloRatingProfileSnapshot,
  setLastChallengeProgressSnapshot: mockSetLastChallengeProgressSnapshot,
  setPlayerColor: mockSetPlayerColor,
  setRollCommandSender: mockSetRollCommandSender,
  setServerRevision: jest.fn(),
  setSocketState: mockSetSocketState,
  setUserId: jest.fn(),
  socketState: 'connected' as const,
  updateMatchPresences: mockUpdateMatchPresences,
  userId: null,
  validMoves: [] as MoveAction[],
};

const mockAuthState = {
  user: null as {
    id: string;
    username: string;
    email: string | null;
    provider: 'guest' | 'google';
    avatarUrl: string | null;
    createdAt: string;
    nakamaUserId?: string;
  } | null,
  isLoading: false,
  loginWithGoogle: jest.fn(),
  loginAsGuest: jest.fn(),
  logout: jest.fn(),
  linkGoogleAccount: jest.fn(),
};

const makeSnapshotPlayers = (
  overrides?: Partial<{
    light: { userId: string | null; title: string | null };
    dark: { userId: string | null; title: string | null };
  }>,
) => ({
  light: {
    userId: 'self-user',
    title: 'Michel',
    ...overrides?.light,
  },
  dark: {
    userId: 'opponent-user',
    title: 'Opponent',
    ...overrides?.dark,
  },
});

const createDeferred = <T,>() => {
  let resolve!: (value: T) => void;
  let reject!: (error?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return {
    promise,
    resolve,
    reject,
  };
};

jest.mock('@/components/game/Board', () => {
  if (mockUseRealBoard) {
    return jest.requireActual('@/components/game/Board');
  }

  const React = require('react');
  const { useEffect } = React;
  const { View } = require('react-native');
  const MockBoard = (props: {
    allowInteraction?: boolean;
    onBoardImageLayout?: (layout: { x: number; y: number; width: number; height: number }) => void;
    onMakeMoveOverride?: (move: unknown) => void;
  }) => {
      mockBoard(props);
      const { onBoardImageLayout } = props;
      
      useEffect(() => {
        onBoardImageLayout?.({
          x: 0,
          y: 0,
          width: 320,
          height: 240,
        });
      }, [onBoardImageLayout]);

      return <View testID="mock-board" />;
    };

  return {
    BOARD_IMAGE_SOURCE: 1,
    Board: MockBoard,
    getBoardPiecePixelSize: () => 28,
  };
});

jest.mock('@/components/game/PieceRail', () => {
  return {
    PieceRail: (props: unknown) => mockPieceRail(props),
  };
});

jest.mock('@/components/game/GameStageHUD', () => {
  return {
    GameStageHUD: (props: unknown) => mockGameStageHUD(props),
  };
});

jest.mock('@/components/game/EdgeScore', () => {
  return {
    EdgeScore: (props: unknown) => mockEdgeScore(props as never),
  };
});

jest.mock('@/components/game/AmbientBackgroundEffects', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    AmbientBackgroundEffects: () => <View testID="mock-ambient" />,
  };
});

jest.mock('@/components/game/BoardDropIntro', () => {
  const React = require('react');
  const { useEffect } = React;
  const { View } = require('react-native');
  return {
    BoardDropIntro: ({ onComplete }: { onComplete?: () => void }) => {
      useEffect(() => {
        onComplete?.();
      }, [onComplete]);

      return <View testID="mock-board-drop" />;
    },
  };
});

jest.mock('@/components/game/ReserveCascadeIntro', () => {
  const React = require('react');
  const { useEffect } = React;
  const { View } = require('react-native');
  return {
    ReserveCascadeIntro: ({
      visible,
      onComplete,
    }: {
      visible?: boolean;
      onComplete?: () => void;
    }) => {
      useEffect(() => {
        if (visible) {
          onComplete?.();
        }
      }, [onComplete, visible]);

      return <View testID="mock-reserve-cascade" />;
    },
  };
});

jest.mock('@/components/game/AudioSettingsModal', () => {
  return {
    AudioSettingsModal: (props: unknown) => mockAudioSettingsModal(props),
  };
});

jest.mock('@/components/tutorial/PlayTutorialCoachModal', () => {
  const React = require('react');
  const { Pressable, Text, View } = require('react-native');
  return {
    PlayTutorialCoachModal: ({
      visible,
      title,
      body,
      actionLabel,
      onContinue,
    }: {
      visible: boolean;
      title: string;
      body: string;
      actionLabel?: string;
      onContinue: () => void;
    }) =>
      visible ? (
        <View testID="mock-play-tutorial-coach">
          <Text>{title}</Text>
          <Text>{body}</Text>
          <Pressable testID="mock-play-tutorial-coach-continue" onPress={onContinue}>
            <Text>{actionLabel ?? 'Continue'}</Text>
          </Pressable>
        </View>
      ) : null,
  };
});

jest.mock('@/components/progression/CinematicXpRewardModal', () => ({
  CinematicXpRewardModal: (props: unknown) => mockCinematicXpRewardModal(props),
}));

jest.mock('@/components/match/MatchResultSummaryContent', () => {
  const React = require('react');
  const { View } = require('react-native');
  const { MatchChallengeRewardsPanel } = jest.requireActual('@/components/challenges/MatchChallengeRewardsPanel');
  return {
    MatchResultSummaryContent: ({
      shouldShowChallengeRewards,
      matchChallengeSummary,
      isRefreshingMatchRewards,
      matchRewardsErrorMessage,
    }: {
      shouldShowChallengeRewards?: boolean;
      matchChallengeSummary?: unknown;
      isRefreshingMatchRewards?: boolean;
      matchRewardsErrorMessage?: string | null;
    }) => (
      <View testID="mock-match-result-summary">
        {shouldShowChallengeRewards ? (
          <MatchChallengeRewardsPanel
            summary={matchChallengeSummary ?? null}
            loading={Boolean(isRefreshingMatchRewards && !matchChallengeSummary)}
            errorMessage={matchRewardsErrorMessage ?? null}
          />
        ) : null}
      </View>
    ),
  };
});

jest.mock('@/components/tournaments/TournamentWaitingRoom', () => {
  const React = require('react');
  const { Pressable, Text, View } = require('react-native');
  return {
    TournamentWaitingRoom: ({
      visible,
      phase,
      statusText,
      rewardSummary,
      onReturnToMainPage,
      onLaunchNextMatch,
    }: {
      visible?: boolean;
      phase?: string;
      statusText?: string;
      rewardSummary?: {
        challengeCompletionCount?: number;
        challengeXpDelta?: number;
      } | null;
      onReturnToMainPage?: () => void;
      onLaunchNextMatch?: () => void;
    }) =>
      visible ? (
        <View testID="mock-tournament-waiting-room">
          {statusText ? <Text>{statusText}</Text> : null}
          {rewardSummary?.challengeXpDelta ? <Text>{`+${rewardSummary.challengeXpDelta} XP from challenges`}</Text> : null}
          {rewardSummary?.challengeCompletionCount ? (
            <Text>{`${rewardSummary.challengeCompletionCount} challenges completed`}</Text>
          ) : null}
          <Pressable onPress={onLaunchNextMatch}>
            <Text>Launch next match</Text>
          </Pressable>
          {phase === 'finalized' || phase === 'eliminated' ? (
            <Pressable onPress={onReturnToMainPage}>
              <Text>Return to Home Page</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null,
  };
});

jest.mock('@/components/ui/Modal', () => {
  return {
    Modal: (props: unknown) => mockModal(props as never),
  };
});

jest.mock('@/components/game/MatchDiceRollStage', () => ({
  MatchDiceRollStage: (props: { rolling: boolean; rollValue?: number | null; visible: boolean }) =>
    mockMatchDiceRollStage(props),
}));

jest.mock('@/components/game/MatchMomentIndicator', () => ({
  MatchMomentIndicator: (props: {
    cue: { message: string } | null;
    fontFamily?: string;
    supplementaryText?: string | null;
    onHidden: (cueId: number) => void;
  }) => {
    if (mockUseRealMatchMomentIndicator) {
      const actual = jest.requireActual('@/components/game/MatchMomentIndicator');
      return actual.MatchMomentIndicator(props);
    }

    return mockMatchMomentIndicator(props);
  },
}));

jest.mock('@/components/game/SlotDiceScene', () => ({
  SlotDiceScene: (props: unknown) => {
    if (mockUseRealSlotDiceScene) {
      const actual = jest.requireActual('@/components/game/SlotDiceScene');
      return actual.SlotDiceScene(props);
    }

    return mockSlotDiceScene();
  },
}));

jest.mock('@/components/game/Dice', () => ({
  Dice: (props: any) => mockDice(props),
  DiceStageVisual: (props: any) => mockDiceStageVisual(props),
}));

jest.mock('@/config/nakama', () => ({
  hasNakamaConfig: () => mockHasNakamaConfig(),
  isNakamaEnabled: () => mockIsNakamaEnabled(),
}));

jest.mock('@/hooks/useGameLoop', () => ({
  useGameLoop: jest.fn(),
}));

jest.mock('@/src/progression/useProgression', () => ({
  useProgression: () => ({
    progression: mockProgression,
    refresh: mockRefreshProgression,
    errorMessage: mockProgressionErrorMessage,
  }),
}));

jest.mock('@/src/elo/useEloRating', () => ({
  useEloRating: () => ({
    ratingProfile: mockEloRatingProfile,
    status: 'ready',
    errorMessage: null,
    isLoading: false,
    isRefreshing: false,
    refresh: mockRefreshElo,
  }),
}));

jest.mock('@/src/challenges/useChallenges', () => ({
  useChallenges: () => ({
    definitions: mockChallengeDefinitions,
    progress: mockChallengeProgress,
    refresh: mockRefreshChallenges,
  }),
}));

jest.mock('@/src/auth/useAuth', () => ({
  useAuth: () => mockAuthState,
}));

jest.mock('@/services/audio', () => ({
  gameAudio: {
    getPreferences: jest.fn().mockResolvedValue({
      musicEnabled: true,
      musicVolume: 1,
      sfxEnabled: true,
      sfxVolume: 1,
    }),
    play: jest.fn(),
    start: jest.fn().mockResolvedValue(undefined),
    setMusicEnabled: jest.fn().mockResolvedValue(undefined),
    setMusicVolume: jest.fn().mockResolvedValue(undefined),
    setSfxEnabled: jest.fn().mockResolvedValue(undefined),
    setSfxVolume: jest.fn().mockResolvedValue(undefined),
    stopAll: jest.fn().mockResolvedValue(undefined),
  },
}));

jest.mock('@/services/botMatchRewards', () => ({
  submitCompletedBotMatchResult: (...args: unknown[]) => mockSubmitCompletedBotMatchResult(...args),
}));

jest.mock('@/services/tournaments', () => ({
  getPublicTournamentStatus: (...args: unknown[]) => mockGetPublicTournamentStatus(...args),
  launchTournamentMatch: (...args: unknown[]) => mockLaunchTournamentMatch(...args),
}));

jest.mock('@/services/matchPreferences', () => ({
  DEFAULT_MATCH_PREFERENCES: {
    announcementCuesEnabled: true,
    autoRollEnabled: false,
    bugAnimationEnabled: true,
    diceAnimationEnabled: true,
    diceAnimationSpeed: 0.5,
    moveHintEnabled: true,
    timerDurationSeconds: 20,
    timerEnabled: true,
  },
  getMatchPreferences: (...args: unknown[]) => mockGetMatchPreferences(...args),
  updateMatchPreferences: (...args: unknown[]) => mockUpdateMatchPreferences(...args),
}));

jest.mock('@/src/tournaments/useTournamentMatchLauncher', () => ({
  useTournamentMatchLauncher: () => mockTournamentMatchLauncher,
}));

jest.mock('@/src/tournaments/useTournamentAdvanceFlow', () => ({
  useTournamentAdvanceFlow: (options: { enabled: boolean; runId: string | null; tournamentId: string | null }) => {
    if (options.enabled && mockTournamentAdvanceFlowShouldFinalize && !mockTournamentAdvanceFlowDidFinalize) {
      mockTournamentAdvanceFlowDidFinalize = true;
      mockFinalizeTournamentMatch(
        {
          runId: options.runId,
          tournamentId: options.tournamentId,
        },
        {
          matchId: 'match-next',
        },
        {
          navigationMode: 'replace',
        },
      );
    }

    return {
      isActive: options.enabled,
      tournament: null,
      ...mockTournamentAdvanceFlowState,
    };
  },
}));

jest.mock('@/services/nakama', () => ({
  nakamaService: {
    connectSocketWithRetry: (...args: unknown[]) => mockConnectSocketWithRetry(...args),
    disconnectSocket: (...args: unknown[]) => mockDisconnectSocket(...args),
  },
}));

jest.mock('@/store/useGameStore', () => {
  const mockHook = <T,>(selector: (state: typeof mockStoreState) => T) => selector(mockStoreState);
  return {
    useGameStore: Object.assign(mockHook, {
      getState: () => mockStoreState,
      setState: (partial: Partial<typeof mockStoreState>) => Object.assign(mockStoreState, partial),
    }),
  };
});

jest.mock('expo-router', () => ({
  Stack: {
    Screen: () => null,
  },
  useLocalSearchParams: () => mockSearchParams,
  useRouter: () => ({
    replace: mockRouterReplace,
  }),
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  }),
}));

jest.mock('@/src/transitions/ScreenTransitionContext', () => ({
  useScreenTransition: () => mockRunScreenTransition,
}));

jest.mock('@expo/vector-icons/MaterialIcons', () => {
  const React = require('react');
  const { Text } = require('react-native');
  const MaterialIconsMock = ({ name }: { name: string }) => <Text>{name}</Text>;
  MaterialIconsMock.displayName = 'MaterialIconsMock';
  return MaterialIconsMock;
});

jest.mock('expo-font', () => ({
  useFonts: () => [true, null],
}));

import { Platform, StyleSheet } from 'react-native';
import { GameRoom } from '@/app/match/[id]';

const configureCompletedMatchChallenges = (matchId: string) => {
  const definitions = CHALLENGE_DEFINITIONS.slice(0, 2);
  const progress = createDefaultUserChallengeProgressSnapshot('2026-03-27T12:00:00.000Z');

  progress.challenges[definitions[0].id] = {
    ...progress.challenges[definitions[0].id],
    completed: true,
    completedAt: '2026-03-27T12:00:00.000Z',
    completedMatchId: matchId,
    rewardXp: definitions[0].rewardXp,
  };
  progress.challenges[definitions[1].id] = {
    ...progress.challenges[definitions[1].id],
    completed: true,
    completedAt: '2026-03-27T12:00:01.000Z',
    completedMatchId: matchId,
    rewardXp: definitions[1].rewardXp,
  };
  progress.totalCompleted = 2;
  progress.totalRewardedXp = definitions[0].rewardXp + definitions[1].rewardXp;

  mockChallengeDefinitions = definitions;
  mockChallengeProgress = progress;
  mockRefreshChallenges.mockResolvedValue({
    definitions,
    progress,
  });

  return {
    definitions,
    totalXp: definitions[0].rewardXp + definitions[1].rewardXp,
  };
};

const createProgressionAward = (
  matchId: string,
  previousTotalXp: number,
  newTotalXp: number,
) => ({
  type: 'progression_award' as const,
  matchId,
  source: 'pvp_win' as const,
  duplicate: false,
  awardedXp: Math.max(0, newTotalXp - previousTotalXp),
  previousTotalXp,
  newTotalXp,
  previousRank: buildProgressionSnapshot(previousTotalXp).currentRank,
  newRank: buildProgressionSnapshot(newTotalXp).currentRank,
  rankChanged: buildProgressionSnapshot(previousTotalXp).currentRank !== buildProgressionSnapshot(newTotalXp).currentRank,
  progression: buildProgressionSnapshot(newTotalXp),
});

const emitTournamentRewardSummary = (
  matchId: string,
  overrides: Partial<{
    didWin: boolean;
    tournamentOutcome: 'advancing' | 'eliminated' | 'runner_up' | 'champion';
    totalXpDelta: number;
    challengeCompletionCount: number;
    challengeXpDelta: number;
    shouldEnterWaitingRoom: boolean;
    totalXpOld: number;
    totalXpNew: number;
  }> = {},
) => {
  const totalXpOld = overrides.totalXpOld ?? 500;
  const totalXpNew = overrides.totalXpNew ?? totalXpOld + (overrides.totalXpDelta ?? 100);
  const challengeProgress =
    mockChallengeProgress ?? createDefaultUserChallengeProgressSnapshot('2026-03-27T12:00:00.000Z');

  mockSocket.onmatchdata?.({
    match_id: matchId,
    op_code: 104,
    data: JSON.stringify({
      type: 'tournament_match_reward_summary',
      matchId,
      tournamentRunId: 'run-1',
      tournamentId: 'tournament-1',
      round: 2,
      playerUserId: 'self-user',
      didWin: overrides.didWin ?? true,
      tournamentOutcome: overrides.tournamentOutcome ?? 'advancing',
      eloProfile: {
        leaderboardId: 'elo_global',
        userId: 'self-user',
        usernameDisplay: 'Michel',
        eloRating: 1218,
        ratedGames: 11,
        ratedWins: 7,
        ratedLosses: 4,
        provisional: false,
        rank: 18,
        lastRatedMatchId: matchId,
        lastRatedAt: '2026-03-27T12:00:00.000Z',
      },
      eloOld: 1200,
      eloNew: 1218,
      eloDelta: 18,
      totalXpOld,
      totalXpNew,
      totalXpDelta: overrides.totalXpDelta ?? totalXpNew - totalXpOld,
      challengeCompletionCount: overrides.challengeCompletionCount ?? 0,
      challengeXpDelta: overrides.challengeXpDelta ?? 0,
      shouldEnterWaitingRoom: overrides.shouldEnterWaitingRoom ?? true,
      progression: buildProgressionSnapshot(totalXpNew),
      challengeProgress,
    }),
  });
};

describe('GameRoom match dice stage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-03-27T12:00:00.000Z'));
    mockSearchParams.id = 'local-1';
    mockSearchParams.offline = '1';
    delete mockSearchParams.privateMatch;
    delete mockSearchParams.privateHost;
    delete mockSearchParams.privateCode;
    delete mockSearchParams.modeId;
    delete mockSearchParams.tutorial;
    delete mockSearchParams.botDifficulty;
    delete mockSearchParams.tournamentRunId;
    delete mockSearchParams.tournamentId;
    delete mockSearchParams.tournamentName;
    delete mockSearchParams.tournamentRound;
    delete mockSearchParams.tournamentReturnTarget;
    mockGetMatchPreferences.mockResolvedValue({
      announcementCuesEnabled: true,
      autoRollEnabled: false,
      bugAnimationEnabled: true,
      diceAnimationEnabled: true,
      diceAnimationSpeed: 0.5,
      moveHintEnabled: true,
      timerDurationSeconds: 20,
      timerEnabled: true,
    });
    mockUpdateMatchPreferences.mockResolvedValue({
      announcementCuesEnabled: true,
      autoRollEnabled: false,
      bugAnimationEnabled: true,
      diceAnimationEnabled: true,
      diceAnimationSpeed: 0.5,
      moveHintEnabled: true,
      timerDurationSeconds: 20,
      timerEnabled: true,
    });
    mockConnectSocketWithRetry.mockResolvedValue(mockSocket);
    mockHasNakamaConfig.mockReturnValue(false);
    mockIsNakamaEnabled.mockReturnValue(false);
    mockRefreshElo.mockImplementation(() => Promise.resolve(null));
    mockRefreshProgression.mockImplementation(() => Promise.resolve(null));
    mockRefreshChallenges.mockImplementation(() => Promise.resolve(null));
    mockSubmitCompletedBotMatchResult.mockResolvedValue({ progressionAward: null });
    mockProgression = null;
    mockProgressionErrorMessage = null;
    mockEloRatingProfile = null;
    mockAutoCompleteCinematicXpModal = true;
    mockGetPublicTournamentStatus.mockResolvedValue({
      tournament: {
        runId: 'run-1',
        tournamentId: 'tournament-1',
        name: 'Spring Open',
        description: 'A public run.',
        lifecycle: 'open',
        startAt: '2026-03-27T09:00:00.000Z',
        endAt: null,
        updatedAt: '2026-03-27T10:00:00.000Z',
        entrants: 8,
        maxEntrants: 16,
        gameMode: 'standard',
        region: 'Global',
        buyInLabel: 'Free',
        prizeLabel: 'No prize listed',
        membership: {
          isJoined: true,
          joinedAt: '2026-03-27T09:00:00.000Z',
        },
      },
      standings: [],
    });
    mockLaunchTournamentMatch.mockResolvedValue({
      matchId: 'match-next',
      matchToken: null,
      tournamentRunId: 'run-1',
      tournamentId: 'tournament-1',
      tournamentRound: 2,
      tournamentEntryId: 'entry-2',
      playerState: 'advancing',
      nextRoundReady: true,
      statusMessage: 'Opponent found.',
      queueStatus: 'matched',
      statusMetadata: {},
      session: { token: 'session-token' },
      userId: 'self-user',
    });
    mockTournamentAdvanceFlowState = {
      phase: 'waiting',
      derivedRound: 2,
      statusText: 'Recording your victory in the standings...',
      subtleStatusText: null,
      retryMessage: null,
      standings: [],
      currentStanding: null,
      finalPlacement: null,
      isChampion: false,
      launchNextMatch: jest.fn(() => Promise.resolve()),
    };
    mockTournamentAdvanceFlowShouldFinalize = false;
    mockTournamentAdvanceFlowDidFinalize = false;
    mockSocketJoinMatch.mockResolvedValue({
      self: { user_id: 'self-user' },
      presences: [],
      match_id: 'local-1',
    });
    mockSocketLeaveMatch.mockResolvedValue(undefined);
    mockSocketSendMatchState.mockResolvedValue(undefined);
    mockSocket.onmatchdata = null;
    mockSocket.onmatchpresence = null;
    mockSocket.ondisconnect = null;
    mockUseRealBoard = false;
    mockUseRealSlotDiceScene = false;
    mockUseRealMatchMomentIndicator = false;
    mockChallengeDefinitions = CHALLENGE_DEFINITIONS.slice(0, 0);
    mockChallengeProgress = null;
    mockApplyServerSnapshot.mockImplementation((snapshot) => {
      Object.assign(mockStoreState, {
        gameState: snapshot.gameState,
        serverRevision: snapshot.revision,
        matchId: snapshot.matchId,
        authoritativeServerTimeMs: snapshot.serverTimeMs ?? null,
        authoritativeTurnDurationMs: snapshot.turnDurationMs ?? null,
        authoritativeTurnStartedAtMs: snapshot.turnStartedAtMs ?? null,
        authoritativeTurnDeadlineMs: snapshot.turnDeadlineMs ?? null,
        authoritativeTurnRemainingMs: snapshot.turnRemainingMs ?? null,
        authoritativeActiveTimedPlayer: snapshot.activeTimedPlayer ?? null,
        authoritativeActiveTimedPlayerColor: snapshot.activeTimedPlayerColor ?? null,
        authoritativeActiveTimedPhase: snapshot.activeTimedPhase ?? null,
        authoritativePlayers: snapshot.players,
        authoritativeAfkAccumulatedMs: snapshot.afkAccumulatedMs ?? null,
        authoritativeAfkRemainingMs: snapshot.afkRemainingMs ?? null,
        authoritativeReconnectingPlayer: snapshot.reconnectingPlayer ?? null,
        authoritativeReconnectingPlayerColor: snapshot.reconnectingPlayerColor ?? null,
        authoritativeReconnectGraceDurationMs: snapshot.reconnectGraceDurationMs ?? null,
        authoritativeReconnectDeadlineMs: snapshot.reconnectDeadlineMs ?? null,
        authoritativeReconnectRemainingMs: snapshot.reconnectRemainingMs ?? null,
        authoritativeMatchEnd: snapshot.matchEnd ?? null,
        authoritativeRematch: snapshot.rematch ?? null,
        authoritativeSnapshotReceivedAtMs: Date.now(),
      });
    });
    mockStoreState.gameState = {
      ...baseGameState,
    };
    mockStoreState.matchId = 'local-1';
    mockStoreState.validMoves = [];
    mockStoreState.matchPresences = [];
    mockStoreState.userId = null;
    mockStoreState.serverRevision = 0;
    mockStoreState.playerColor = 'light';
    mockStoreState.socketState = 'connected';
    mockStoreState.authoritativeServerTimeMs = null;
    mockStoreState.authoritativeTurnDurationMs = null;
    mockStoreState.authoritativeTurnStartedAtMs = null;
    mockStoreState.authoritativeTurnDeadlineMs = null;
    mockStoreState.authoritativeTurnRemainingMs = null;
    mockStoreState.authoritativeActiveTimedPlayer = null;
    mockStoreState.authoritativeActiveTimedPlayerColor = null;
    mockStoreState.authoritativeActiveTimedPhase = null;
    mockStoreState.authoritativePlayers = null;
    mockStoreState.authoritativeAfkAccumulatedMs = null;
    mockStoreState.authoritativeAfkRemainingMs = null;
    mockStoreState.authoritativeReconnectingPlayer = null;
    mockStoreState.authoritativeReconnectingPlayerColor = null;
    mockStoreState.authoritativeReconnectGraceDurationMs = null;
    mockStoreState.authoritativeReconnectDeadlineMs = null;
    mockStoreState.authoritativeReconnectRemainingMs = null;
    mockStoreState.authoritativeMatchEnd = null;
    mockStoreState.authoritativeRematch = null;
    mockStoreState.authoritativeSnapshotReceivedAtMs = null;
    mockAuthState.user = null;
    mockStoreState.setGameStateFromServer = jest.fn((nextState: GameState) => {
      mockStoreState.gameState = nextState;
      mockStoreState.validMoves =
        nextState.rollValue !== null && nextState.phase === 'moving'
          ? getValidMoves(nextState, nextState.rollValue)
          : [];
    });
    Object.defineProperty(Platform, 'OS', {
      configurable: true,
      get: () => 'ios',
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('routes iOS rolls through the external stage and keeps the inline scene idle', async () => {
    jest.useFakeTimers();

    render(<GameRoom />);

    await act(async () => {
      await Promise.resolve();
    });
    act(() => {
      jest.advanceTimersByTime(400);
    });
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    await act(async () => {
      fireEvent.press(screen.getByTestId('dice-roll-button'));
    });

    expect(mockRoll).toHaveBeenCalledTimes(1);
    expect(mockMatchDiceRollStage).toHaveBeenLastCalledWith(
      expect.objectContaining({
        rolling: true,
        visible: true,
      }),
    );
    expect(mockSlotDiceScene).not.toHaveBeenCalled();
  });

  it('shows a rules intro modal for Capture and dismisses it with Close', async () => {
    jest.useFakeTimers();
    mockSearchParams.modeId = 'gameMode_capture';
    mockStoreState.gameState = {
      ...baseGameState,
      matchConfig: getMatchConfig('gameMode_capture'),
    };

    render(<GameRoom />);

    await act(async () => {
      await Promise.resolve();
    });

    expect(screen.getAllByText('Capture').length).toBeGreaterThan(0);
    expect(screen.getByText(/each side plays with 5 pieces/i)).toBeTruthy();
    fireEvent.press(screen.getByText('Close'));
    expect(screen.queryByText(/each side plays with 5 pieces/i)).toBeNull();
  });

  it.each([
    {
      modeId: 'gameMode_1_piece',
      title: 'Pure Luck',
      snippet: /captures are disabled everywhere/i,
    },
    {
      modeId: 'gameMode_3_pieces',
      title: 'Race',
      snippet: /first to bear off all 3 pieces wins/i,
    },
    {
      modeId: 'gameMode_finkel_rules',
      title: 'Finkel Rules',
      snippet: /shared middle rosette stays protected/i,
    },
    {
      modeId: 'gameMode_pvp',
      title: 'PvP',
      snippet: /every roll and move is taken by a human locally/i,
    },
    {
      modeId: 'gameMode_full_path',
      title: 'Extended Path',
      snippet: /path is longer before bearing off/i,
    },
  ] as const)('shows a rules intro modal for $title', async ({ modeId, title, snippet }) => {
    jest.useFakeTimers();
    mockSearchParams.modeId = modeId;
    mockStoreState.gameState = {
      ...baseGameState,
      matchConfig: getMatchConfig(modeId),
    };

    render(<GameRoom />);

    await act(async () => {
      await Promise.resolve();
    });

    expect(screen.getAllByText(title).length).toBeGreaterThan(0);
    expect(screen.getByText(snippet)).toBeTruthy();
  });

  it('keeps the embedded dice visual mounted while an offline bot roll resolves on Android', async () => {
    jest.useFakeTimers();

    Object.defineProperty(Platform, 'OS', {
      configurable: true,
      get: () => 'android',
    });

    const view = render(<GameRoom />);

    await act(async () => {
      await Promise.resolve();
    });
    act(() => {
      jest.advanceTimersByTime(400);
    });
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    await act(async () => {
      fireEvent.press(screen.getByTestId('dice-roll-button'));
    });

    expect(screen.queryByTestId('dice-roll-scene-host')).not.toBeNull();

    mockStoreState.gameState = {
      ...baseGameState,
      currentTurn: 'light',
      phase: 'moving',
      rollValue: 2,
    };

    await act(async () => {
      view.rerender(<GameRoom />);
    });

    expect(screen.queryByTestId('dice-roll-scene-host')).not.toBeNull();

    mockStoreState.gameState = {
      ...baseGameState,
      currentTurn: 'dark',
      phase: 'moving',
      rollValue: 3,
    };

    await act(async () => {
      view.rerender(<GameRoom />);
    });

    expect(screen.queryByTestId('dice-roll-scene-host')).not.toBeNull();
  });

  it('auto-rolls after the configured delay when automatic rolling is enabled', async () => {
    jest.useFakeTimers();

    mockGetMatchPreferences.mockResolvedValue({
      announcementCuesEnabled: true,
      autoRollEnabled: true,
      bugAnimationEnabled: true,
      diceAnimationEnabled: true,
      diceAnimationSpeed: 1,
      moveHintEnabled: true,
      timerDurationSeconds: 20,
      timerEnabled: true,
    });

    render(<GameRoom />);

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
    });

    await act(async () => {
      jest.advanceTimersByTime(549);
    });

    expect(mockRoll).not.toHaveBeenCalled();

    await act(async () => {
      jest.advanceTimersByTime(1);
    });

    expect(mockRoll).toHaveBeenCalledTimes(1);
    expect(mockRoll).toHaveBeenCalledWith({ autoTriggered: true });
  });

  it('releases the live roll animation when a no-move turn snaps back to rolling', async () => {
    const view = render(<GameRoom />);

    await act(async () => {
      await Promise.resolve();
    });
    act(() => {
      jest.advanceTimersByTime(400);
    });
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    await act(async () => {
      fireEvent.press(screen.getByTestId('dice-roll-button'));
    });

    expect(mockMatchDiceRollStage.mock.calls.at(-1)?.[0]).toEqual(
      expect.objectContaining({
        rolling: true,
        visible: true,
      }),
    );

    mockStoreState.gameState = {
      ...baseGameState,
      currentTurn: 'dark',
      phase: 'rolling',
      rollValue: null,
      history: ['light rolled 0 but had no moves.'],
    };
    mockStoreState.serverRevision = 1;

    await act(async () => {
      view.rerender(<GameRoom />);
      await Promise.resolve();
      await Promise.resolve();
    });

    await act(async () => {
      jest.advanceTimersByTime(1_000);
    });

    expect(mockMatchDiceRollStage.mock.calls.at(-1)?.[0]).toEqual(
      expect.objectContaining({
        rolling: false,
        visible: true,
      }),
    );
  });

  it('keeps a zero roll visible for 1 second before clearing it', async () => {
    const view = render(<GameRoom />);

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    mockStoreState.gameState = {
      ...baseGameState,
      currentTurn: 'dark',
      phase: 'rolling',
      rollValue: null,
      history: ['light rolled 0 but had no moves.'],
    };
    mockStoreState.serverRevision = 1;

    await act(async () => {
      view.rerender(<GameRoom />);
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(mockMatchDiceRollStage.mock.calls.at(-1)?.[0]).toEqual(
      expect.objectContaining({
        rollValue: 0,
      }),
    );

    await act(async () => {
      jest.advanceTimersByTime(999);
    });

    expect(mockMatchDiceRollStage.mock.calls.at(-1)?.[0]).toEqual(
      expect.objectContaining({
        rollValue: 0,
      }),
    );

    await act(async () => {
      jest.advanceTimersByTime(1);
    });

    expect(mockMatchDiceRollStage.mock.calls.at(-1)?.[0]).toEqual(
      expect.objectContaining({
        rollValue: null,
      }),
    );
  });

  it('shows No Move in the roll display for blocked non-zero rolls', async () => {
    const view = render(<GameRoom />);

    await act(async () => {
      await Promise.resolve();
    });
    act(() => {
      jest.advanceTimersByTime(400);
    });
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    mockStoreState.gameState = {
      ...baseGameState,
      currentTurn: 'dark',
      phase: 'rolling',
      rollValue: null,
      history: ['light rolled 3 but had no moves.'],
    };
    mockStoreState.serverRevision = 1;

    await act(async () => {
      view.rerender(<GameRoom />);
      await Promise.resolve();
      await Promise.resolve();
    });

    const latestCueProps = mockMatchMomentIndicator.mock.calls.at(-1)?.[0] as
      | { cue?: { message?: string } | null }
      | undefined;

    expect(latestCueProps?.cue?.message).not.toBe('No Move');
    expect(screen.getByTestId('mock-dice-result-label')).toBeTruthy();
    expect(screen.getByText('No Move')).toBeTruthy();
  });

  it('shows only settings in the in-game top menu', async () => {
    render(<GameRoom />);

    await act(async () => {
      await Promise.resolve();
    });

    await act(async () => {
      fireEvent.press(screen.getByLabelText('Open match menu'));
    });

    expect(screen.getByText('Settings')).toBeTruthy();
    expect(screen.queryByText('Help')).toBeNull();
  });

  it('suppresses announcement cues after timeout assistance takes over during idle play', async () => {
    jest.useFakeTimers();

    mockStoreState.gameState = {
      ...baseGameState,
      history: ['light opened the match.'],
    };

    render(<GameRoom />);

    await act(async () => {
      await Promise.resolve();
    });
    act(() => {
      jest.advanceTimersByTime(400);
    });
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    await act(async () => {
      jest.advanceTimersByTime(15_000);
    });

    expect(mockRoll).not.toHaveBeenCalled();

    await act(async () => {
      jest.advanceTimersByTime(5_000);
    });

    expect(mockRoll).toHaveBeenCalledTimes(1);
    expect(screen.queryByText("Time's up")).toBeNull();
  });

  it('shows the guided tutorial title when launched in tutorial mode', async () => {
    mockSearchParams.tutorial = 'playthrough';
    mockSearchParams.botDifficulty = 'easy';

    render(<GameRoom />);

    await act(async () => {
      await Promise.resolve();
    });

    expect(screen.getByText('Play Tutorial')).toBeTruthy();
    expect(screen.getByTestId('mock-play-tutorial-coach')).toBeTruthy();
    expect(screen.getByText('Roll, move, and race to score')).toBeTruthy();
  });

  it('keeps the tutorial on one continuous scripted playthrough between lesson callouts', async () => {
    mockSearchParams.tutorial = 'playthrough';
    mockSearchParams.botDifficulty = 'easy';

    const view = render(<GameRoom />);

    await act(async () => {
      await Promise.resolve();
    });
    act(() => {
      jest.advanceTimersByTime(400);
    });
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    await act(async () => {
      fireEvent.press(screen.getByTestId('mock-play-tutorial-coach-continue'));
    });
    view.rerender(<GameRoom />);

    const rollOnce = async () => {
      const latestDiceProps = [...mockDice.mock.calls]
        .map(([props]) => props)
        .reverse()
        .find((props) => typeof props?.onRoll === 'function') as {
        onRoll?: () => void;
      };

      await act(async () => {
        latestDiceProps.onRoll?.();
      });
      view.rerender(<GameRoom />);
    };

    const moveOnce = async () => {
      const latestBoardProps = mockBoard.mock.calls.at(-1)?.[0] as {
        onMakeMoveOverride?: (move: MoveAction) => void;
      };

      await act(async () => {
        latestBoardProps.onMakeMoveOverride?.(mockStoreState.validMoves[0]);
      });
      view.rerender(<GameRoom />);
    };

    await rollOnce();
    expect(mockRoll).not.toHaveBeenCalled();
    expect(mockStoreState.gameState.rollValue).toBe(1);

    await moveOnce();
    expect(screen.getByText('Pieces begin in reserve. Bringing one in starts the race and gives you a runner to develop.')).toBeTruthy();

    await act(async () => {
      fireEvent.press(screen.getByTestId('mock-play-tutorial-coach-continue'));
    });
    view.rerender(<GameRoom />);

    await act(async () => {
      jest.advanceTimersByTime(1_800);
    });
    view.rerender(<GameRoom />);
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    await act(async () => {
      jest.advanceTimersByTime(2_500);
    });
    view.rerender(<GameRoom />);

    expect(mockStoreState.gameState.currentTurn).toBe('light');
    expect(mockStoreState.gameState.phase).toBe('rolling');
    expect(mockStoreState.gameState.light.pieces[0].position).toBe(0);
    expect(screen.queryByText('The middle row is where both sides can fight over the same squares, so captures become possible there.')).toBeNull();

    await rollOnce();
    expect(mockStoreState.gameState.rollValue).toBe(3);
    await act(async () => {
      jest.advanceTimersByTime(2_000);
    });
    view.rerender(<GameRoom />);
    expect(mockBoard.mock.calls.at(-1)?.[0]).toEqual(
      expect.objectContaining({
        validMovesOverride: [
          {
            pieceId: 'light-0',
            fromIndex: 0,
            toIndex: 3,
          },
        ],
      }),
    );
    await moveOnce();
    expect(mockStoreState.gameState.light.pieces[0].position).toBe(3);
    expect(screen.getByText('Rosettes Let You Roll Again')).toBeTruthy();
    expect(screen.getByText('Landing on a rosette gives you another roll immediately, so Light keeps the turn here.')).toBeTruthy();

    await act(async () => {
      fireEvent.press(screen.getByTestId('mock-play-tutorial-coach-continue'));
    });
    view.rerender(<GameRoom />);

    await rollOnce();
    expect(mockStoreState.gameState.rollValue).toBe(1);
    await moveOnce();

    expect(mockStoreState.gameState.light.pieces[0].position).toBe(4);
    expect(screen.getByText('The middle row is where both sides can fight over the same squares, so captures become possible there.')).toBeTruthy();
    expect(mockRoll).not.toHaveBeenCalled();
  });

  it('shows the zero-roll tutorial modal after the scripted zero', async () => {
    mockSearchParams.tutorial = 'playthrough';
    mockSearchParams.botDifficulty = 'easy';

    const view = render(<GameRoom />);

    const flushTutorialRender = async () => {
      view.rerender(<GameRoom />);
      await act(async () => {
        await Promise.resolve();
        await Promise.resolve();
      });
    };

    const continueCoach = async () => {
      await act(async () => {
        fireEvent.press(screen.getByTestId('mock-play-tutorial-coach-continue'));
      });
      await flushTutorialRender();
    };

    const rollOnce = async () => {
      const latestDiceProps = [...mockDice.mock.calls]
        .map(([props]) => props)
        .reverse()
        .find((props) => typeof props?.onRoll === 'function') as {
        onRoll?: () => void;
      };

      await act(async () => {
        latestDiceProps.onRoll?.();
      });
      await flushTutorialRender();
    };

    const moveOnce = async () => {
      const latestBoardProps = mockBoard.mock.calls.at(-1)?.[0] as {
        onMakeMoveOverride?: (move: MoveAction) => void;
      };

      await act(async () => {
        latestBoardProps.onMakeMoveOverride?.(mockStoreState.validMoves[0]);
      });
      await flushTutorialRender();
    };

    const advanceAndFlush = async (delayMs: number) => {
      await act(async () => {
        jest.advanceTimersByTime(delayMs);
      });
      await flushTutorialRender();
    };

    const advanceDarkRollAndMove = async () => {
      await advanceAndFlush(1_800);
      await advanceAndFlush(2_500);
    };

    await act(async () => {
      await Promise.resolve();
    });
    act(() => {
      jest.advanceTimersByTime(400);
    });
    await flushTutorialRender();

    await continueCoach();
    await rollOnce();
    await moveOnce();
    await continueCoach();

    await advanceDarkRollAndMove();
    await rollOnce();
    await advanceAndFlush(2_000);
    await moveOnce();
    await continueCoach();

    await rollOnce();
    await moveOnce();
    await continueCoach();

    await advanceDarkRollAndMove();
    await rollOnce();
    await moveOnce();
    await advanceDarkRollAndMove();

    await rollOnce();
    await advanceAndFlush(1_800);

    expect(screen.getByText('Zeros Can Be Rolled')).toBeTruthy();
    expect(screen.getByText(/In Ur, a roll of 0 is valid/i)).toBeTruthy();
  });

  it('shows the blocked-roll tutorial modal after the last rosette no-move', async () => {
    mockSearchParams.tutorial = 'playthrough';
    mockSearchParams.botDifficulty = 'easy';

    const view = render(<GameRoom />);

    const flushTutorialRender = async () => {
      view.rerender(<GameRoom />);
      await act(async () => {
        await Promise.resolve();
        await Promise.resolve();
      });
    };

    const continueCoach = async () => {
      await act(async () => {
        fireEvent.press(screen.getByTestId('mock-play-tutorial-coach-continue'));
      });
      await flushTutorialRender();
    };

    const rollOnce = async () => {
      const latestDiceProps = [...mockDice.mock.calls]
        .map(([props]) => props)
        .reverse()
        .find((props) => typeof props?.onRoll === 'function') as {
        onRoll?: () => void;
      };

      await act(async () => {
        latestDiceProps.onRoll?.();
      });
      await flushTutorialRender();
    };

    const moveOnce = async () => {
      const latestBoardProps = mockBoard.mock.calls.at(-1)?.[0] as {
        onMakeMoveOverride?: (move: MoveAction) => void;
      };

      await act(async () => {
        latestBoardProps.onMakeMoveOverride?.(mockStoreState.validMoves[0]);
      });
      await flushTutorialRender();
    };

    const advanceAndFlush = async (delayMs: number) => {
      await act(async () => {
        jest.advanceTimersByTime(delayMs);
      });
      await flushTutorialRender();
    };

    const advanceDarkRollAndMove = async () => {
      await advanceAndFlush(1_800);
      await advanceAndFlush(2_500);
    };

    const advanceDarkNoMove = async () => {
      await advanceAndFlush(1_800);
      await advanceAndFlush(1_800);
    };

    await act(async () => {
      await Promise.resolve();
    });
    act(() => {
      jest.advanceTimersByTime(400);
    });
    await flushTutorialRender();

    await continueCoach();

    await rollOnce();
    await moveOnce();
    await continueCoach();

    await advanceDarkRollAndMove();
    await rollOnce();
    await advanceAndFlush(2_000);
    await moveOnce();
    await continueCoach();

    await rollOnce();
    await moveOnce();
    await continueCoach();

    await advanceDarkRollAndMove();
    await rollOnce();
    await moveOnce();
    await advanceDarkRollAndMove();

    await rollOnce();
    await advanceAndFlush(1_800);
    expect(screen.getByText('Zeros Can Be Rolled')).toBeTruthy();
    await continueCoach();

    await advanceDarkRollAndMove();
    await rollOnce();
    await moveOnce();
    expect(screen.getByText('The Shared Rosette Is Safe')).toBeTruthy();
    await continueCoach();

    await rollOnce();
    await moveOnce();
    expect(screen.getByText('Capture In The Shared Row')).toBeTruthy();
    await continueCoach();

    await advanceDarkNoMove();
    await rollOnce();
    await moveOnce();
    await advanceDarkNoMove();

    await rollOnce();
    await moveOnce();
    expect(mockStoreState.gameState.light.pieces[0].position).toBe(13);

    await rollOnce();
    await advanceAndFlush(1_800);
    expect(screen.queryByText('When you roll a number but none of your pieces can legally use it, the game shows No Move and your turn ends.')).toBeNull();

    await advanceAndFlush(1_000);
    expect(screen.getByTestId('mock-play-tutorial-coach')).toBeTruthy();
    expect(
      screen.getByText(
        'When you roll a number but none of your pieces can legally use it, the game shows No Move and your turn ends.',
      ),
    ).toBeTruthy();
  }, 15_000);

  it('shows Opponent Joined only when a private match becomes ready', async () => {
    mockSearchParams.id = 'private-1';
    mockSearchParams.offline = '0';
    mockSearchParams.privateMatch = '1';
    mockSearchParams.privateHost = '1';
    mockHasNakamaConfig.mockReturnValue(true);
    mockIsNakamaEnabled.mockReturnValue(true);
    mockSocketJoinMatch.mockResolvedValue({
      self: { user_id: 'self-user' },
      presences: [],
      match_id: 'private-1',
    });
    mockStoreState.matchId = 'private-1';
    mockStoreState.userId = 'self-user';
    mockStoreState.matchPresences = ['self-user'];
    mockStoreState.gameState = {
      ...baseGameState,
      history: ['light opened the match.'],
    };

    const view = render(<GameRoom />);

    await act(async () => {
      await Promise.resolve();
    });
    act(() => {
      jest.advanceTimersByTime(400);
    });
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(screen.queryByText('Opponent Joined')).toBeNull();

    mockStoreState.matchPresences = ['self-user', 'opponent-user'];

    await act(async () => {
      view.rerender(<GameRoom />);
      await Promise.resolve();
    });

    expect(screen.getByText('Opponent Joined')).toBeTruthy();
  });

  it('renders a compact private match pill with the match code', async () => {
    mockSearchParams.id = 'private-pill';
    mockSearchParams.offline = '0';
    mockSearchParams.privateMatch = '1';
    mockSearchParams.privateHost = '1';
    mockSearchParams.privateCode = 'ABCD12';
    mockHasNakamaConfig.mockReturnValue(true);
    mockIsNakamaEnabled.mockReturnValue(true);
    mockSocketJoinMatch.mockResolvedValue({
      self: { user_id: 'self-user' },
      presences: [],
      match_id: 'private-pill',
    });
    mockStoreState.matchId = 'private-pill';
    mockStoreState.userId = 'self-user';
    mockStoreState.matchPresences = ['self-user'];

    render(<GameRoom />);

    await act(async () => {
      await Promise.resolve();
    });
    act(() => {
      jest.advanceTimersByTime(400);
    });
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(screen.getByTestId('online-match-status-pill')).toBeTruthy();
    expect(screen.getByText('Private Match - ABCD12')).toBeTruthy();
  });

  it('renders tournament status in the top pill and updates when the opponent joins', async () => {
    mockSearchParams.id = 'tournament-pill';
    mockSearchParams.offline = '0';
    mockSearchParams.tournamentRunId = 'run-1';
    mockSearchParams.tournamentId = 'tournament-1';
    mockSearchParams.tournamentName = 'Spring Open';
    mockHasNakamaConfig.mockReturnValue(true);
    mockIsNakamaEnabled.mockReturnValue(true);
    mockSocketJoinMatch.mockResolvedValue({
      self: { user_id: 'self-user' },
      presences: [],
      match_id: 'tournament-pill',
    });
    mockStoreState.matchId = 'tournament-pill';
    mockStoreState.userId = 'self-user';
    mockStoreState.matchPresences = ['self-user'];

    const view = render(<GameRoom />);

    await act(async () => {
      await Promise.resolve();
    });
    act(() => {
      jest.advanceTimersByTime(400);
    });
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(screen.getByText('Spring Open - Waiting for Opponent')).toBeTruthy();

    mockStoreState.matchPresences = ['self-user', 'opponent-user'];

    await act(async () => {
      view.rerender(<GameRoom />);
      await Promise.resolve();
    });

    expect(screen.getByText('Spring Open - Opponent Joined')).toBeTruthy();
  });

  it('renders online matchmaking status in the top pill and updates when the opponent joins', async () => {
    mockSearchParams.id = 'online-pill';
    mockSearchParams.offline = '0';
    mockHasNakamaConfig.mockReturnValue(true);
    mockIsNakamaEnabled.mockReturnValue(true);
    mockSocketJoinMatch.mockResolvedValue({
      self: { user_id: 'self-user' },
      presences: [],
      match_id: 'online-pill',
    });
    mockStoreState.matchId = 'online-pill';
    mockStoreState.userId = 'self-user';
    mockStoreState.matchPresences = ['self-user'];

    const view = render(<GameRoom />);

    await act(async () => {
      await Promise.resolve();
    });
    act(() => {
      jest.advanceTimersByTime(400);
    });
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(screen.getByText('Online Match - Waiting for Opponent')).toBeTruthy();

    mockStoreState.matchPresences = ['self-user', 'opponent-user'];

    await act(async () => {
      view.rerender(<GameRoom />);
      await Promise.resolve();
    });

    expect(screen.getByText('Online Match - Opponent Joined')).toBeTruthy();
  });

  it('uses an inline status info button instead of the top pill on mobile web', async () => {
    Object.defineProperty(Platform, 'OS', {
      configurable: true,
      get: () => 'web',
    });
    const previousWindow = global.window;
    const mockWindow = {
      ...previousWindow,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      innerWidth: 390,
      innerHeight: 844,
      visualViewport: {
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        width: 390,
        height: 844,
      },
    } as typeof window;
    Object.defineProperty(global, 'window', {
      configurable: true,
      value: mockWindow,
    });

    try {
      mockSearchParams.id = 'private-mobile-web';
      mockSearchParams.offline = '0';
      mockSearchParams.privateMatch = '1';
      mockSearchParams.privateHost = '1';
      mockSearchParams.privateCode = 'ABCD12';
      mockHasNakamaConfig.mockReturnValue(true);
      mockIsNakamaEnabled.mockReturnValue(true);
      mockSocketJoinMatch.mockResolvedValue({
        self: { user_id: 'self-user' },
        presences: [],
        match_id: 'private-mobile-web',
      });
      mockStoreState.matchId = 'private-mobile-web';
      mockStoreState.userId = 'self-user';
      mockStoreState.matchPresences = ['self-user'];

      render(<GameRoom />);

      await act(async () => {
        await Promise.resolve();
      });
      act(() => {
        jest.advanceTimersByTime(400);
      });
      await act(async () => {
        await Promise.resolve();
        await Promise.resolve();
      });

      expect(screen.queryByTestId('online-match-status-pill')).toBeNull();
      expect(screen.queryByText('Private Match - ABCD12')).toBeNull();

      await act(async () => {
        fireEvent.press(screen.getByTestId('mobile-match-status-button'));
      });

      expect(screen.getByTestId('mobile-match-status-popover')).toBeTruthy();
      expect(screen.getByText('Private Match - ABCD12')).toBeTruthy();
    } finally {
      Object.defineProperty(global, 'window', {
        configurable: true,
        value: previousWindow,
      });
    }
  });

  it('uses the larger mobile web roll button size beside the board', async () => {
    Object.defineProperty(Platform, 'OS', {
      configurable: true,
      get: () => 'web',
    });
    const previousWindow = global.window;
    const mockWindow = {
      ...previousWindow,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      innerWidth: 390,
      innerHeight: 844,
      visualViewport: {
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        width: 390,
        height: 844,
      },
    } as typeof window;
    Object.defineProperty(global, 'window', {
      configurable: true,
      value: mockWindow,
    });

    try {
      render(<GameRoom />);

      await act(async () => {
        await Promise.resolve();
      });
      act(() => {
        jest.advanceTimersByTime(400);
      });
      await act(async () => {
        await Promise.resolve();
        await Promise.resolve();
      });

      expect(screen.getByTestId('dice-roll-scene-host')).toBeTruthy();

      const latestDiceProps = [...mockDice.mock.calls]
        .map(([props]) => props)
        .reverse()
        .find((props) => typeof props?.onRoll === 'function') as {
        artSize?: number;
      };

      expect(latestDiceProps.artSize).toBeGreaterThanOrEqual(100);
    } finally {
      Object.defineProperty(global, 'window', {
        configurable: true,
        value: previousWindow,
      });
    }
  });

  it('stacks the mobile web online emoji control above the roll button', async () => {
    Object.defineProperty(Platform, 'OS', {
      configurable: true,
      get: () => 'web',
    });
    const previousWindow = global.window;
    const mockWindow = {
      ...previousWindow,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      innerWidth: 390,
      innerHeight: 844,
      visualViewport: {
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        width: 390,
        height: 844,
      },
    } as typeof window;
    Object.defineProperty(global, 'window', {
      configurable: true,
      value: mockWindow,
    });

    try {
      mockSearchParams.id = 'online-mobile-web';
      mockSearchParams.offline = '0';
      mockHasNakamaConfig.mockReturnValue(true);
      mockIsNakamaEnabled.mockReturnValue(true);
      mockSocketJoinMatch.mockResolvedValue({
        self: { user_id: 'self-user' },
        presences: [{ user_id: 'opponent-user' }],
        match_id: 'online-mobile-web',
      });
      mockStoreState.matchId = 'online-mobile-web';
      mockStoreState.userId = 'self-user';
      mockStoreState.matchPresences = ['self-user', 'opponent-user'];

      render(<GameRoom />);

      await act(async () => {
        await Promise.resolve();
      });
      act(() => {
        jest.advanceTimersByTime(400);
      });
      await act(async () => {
        await Promise.resolve();
        await Promise.resolve();
      });

      const stack = screen.getByTestId('mobile-web-roll-action-stack');
      const stackChildren = stack.children.filter((child) => typeof child !== 'string') as any[];

      expect(stackChildren[0]?.props.testID).toBe('emoji-reaction-control');
      expect(stackChildren[1]).toBeTruthy();
    } finally {
      Object.defineProperty(global, 'window', {
        configurable: true,
        value: previousWindow,
      });
    }
  });

  it('renders the tutorial objective banner inline between the score cards on mobile web', async () => {
    Object.defineProperty(Platform, 'OS', {
      configurable: true,
      get: () => 'web',
    });
    const previousWindow = global.window;
    const mockWindow = {
      ...previousWindow,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      innerWidth: 390,
      innerHeight: 844,
      visualViewport: {
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        width: 390,
        height: 844,
      },
    } as typeof window;
    Object.defineProperty(global, 'window', {
      configurable: true,
      value: mockWindow,
    });

    try {
      mockSearchParams.tutorial = 'playthrough';
      mockSearchParams.botDifficulty = 'easy';

      render(<GameRoom />);

      await act(async () => {
        await Promise.resolve();
      });
      act(() => {
        jest.advanceTimersByTime(400);
      });
      await act(async () => {
        await Promise.resolve();
        await Promise.resolve();
      });

      await act(async () => {
        fireEvent.press(screen.getByTestId('mock-play-tutorial-coach-continue'));
      });

      const bannerStyle = StyleSheet.flatten(
        screen.getByTestId('tutorial-objective-banner').props.style,
      ) as {
        flexShrink?: number;
        marginTop?: number;
        maxWidth?: number | string;
        position?: string;
      };
      const bannerText = screen.getByTestId('tutorial-objective-banner-text').props.children as string;

      expect(screen.getByTestId('score-row-center-slot')).toBeTruthy();
      expect(bannerStyle.position).toBeUndefined();
      expect(bannerStyle.marginTop).toBe(0);
      expect(bannerStyle.maxWidth).toBe('100%');
      expect(bannerStyle.flexShrink).toBe(1);
      expect(bannerText).toContain('\n');
    } finally {
      Object.defineProperty(global, 'window', {
        configurable: true,
        value: previousWindow,
      });
    }
  });

  it('keeps tablet-landscape tray sizing active when Safari chrome shrinks the visible web viewport', async () => {
    Object.defineProperty(Platform, 'OS', {
      configurable: true,
      get: () => 'web',
    });
    const reactNative = jest.requireActual('react-native') as typeof import('react-native');
    const useWindowDimensionsSpy = jest.spyOn(reactNative, 'useWindowDimensions');
    useWindowDimensionsSpy.mockReturnValue({ width: 1194, height: 834, scale: 2, fontScale: 1 });

    const previousWindow = global.window;
    const mockWindow = {
      ...previousWindow,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      innerWidth: 1194,
      innerHeight: 834,
      visualViewport: {
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        width: 1194,
        height: 724,
      },
    } as typeof window;
    Object.defineProperty(global, 'window', {
      configurable: true,
      value: mockWindow,
    });

    try {
      render(<GameRoom />);

      await act(async () => {
        await Promise.resolve();
        await Promise.resolve();
      });

      const lightTrayCall = mockPieceRail.mock.calls.find(([props]) => props?.color === 'light');
      const darkTrayCall = mockPieceRail.mock.calls.find(([props]) => props?.color === 'dark');

      expect(lightTrayCall?.[0]).toMatchObject({
        color: 'light',
        trayScale: 0.68,
      });
      expect(darkTrayCall?.[0]).toMatchObject({
        color: 'dark',
        trayScale: 0.68,
      });
    } finally {
      useWindowDimensionsSpy.mockRestore();
      Object.defineProperty(global, 'window', {
        configurable: true,
        value: previousWindow,
      });
    }
  });

  it('shows Opponent Reconnecting when a private opponent leaves mid-match', async () => {
    mockSearchParams.id = 'private-2';
    mockSearchParams.offline = '0';
    mockSearchParams.privateMatch = '1';
    mockSearchParams.privateHost = '1';
    mockHasNakamaConfig.mockReturnValue(true);
    mockIsNakamaEnabled.mockReturnValue(true);
    mockSocketJoinMatch.mockResolvedValue({
      self: { user_id: 'self-user' },
      presences: [],
      match_id: 'private-2',
    });
    mockStoreState.matchId = 'private-2';
    mockStoreState.userId = 'self-user';
    mockStoreState.matchPresences = ['self-user', 'opponent-user'];
    mockStoreState.gameState = {
      ...baseGameState,
      history: ['light opened the match.'],
    };

    const view = render(<GameRoom />);

    await act(async () => {
      await Promise.resolve();
    });
    act(() => {
      jest.advanceTimersByTime(400);
    });
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(screen.queryByText('Opponent Reconnecting')).toBeNull();

    mockStoreState.matchPresences = ['self-user'];

    await act(async () => {
      view.rerender(<GameRoom />);
      await Promise.resolve();
    });

    expect(screen.getByText('Opponent Reconnecting')).toBeTruthy();
    expect(screen.queryByText('Opponent Joined')).toBeNull();
  });

  it('tolerates join responses that omit presence lists during reconnects', async () => {
    const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => { });
    mockSearchParams.id = 'online-reconnect-join';
    mockSearchParams.offline = '0';
    mockHasNakamaConfig.mockReturnValue(true);
    mockIsNakamaEnabled.mockReturnValue(true);
    mockSocketJoinMatch.mockResolvedValue({
      self: { user_id: 'self-user' },
      match_id: 'online-reconnect-join',
    });
    mockStoreState.matchId = 'online-reconnect-join';

    render(<GameRoom />);

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(mockSetMatchPresences).toHaveBeenCalledWith(['self-user']);
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      '[Nakama][join]',
      expect.objectContaining({
        matchId: 'online-reconnect-join',
      }),
    );

    consoleWarnSpy.mockRestore();
  });

  it('stops retrying when the server reports that the online match no longer exists', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => { });
    mockSearchParams.id = 'online-missing-match';
    mockSearchParams.offline = '0';
    mockHasNakamaConfig.mockReturnValue(true);
    mockIsNakamaEnabled.mockReturnValue(true);
    mockSocketJoinMatch.mockRejectedValue({
      code: 4,
      message: 'Match not found',
    });
    mockStoreState.matchId = 'online-missing-match';

    render(<GameRoom />);

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(mockSetSocketState).toHaveBeenCalledWith('error');
    expect(mockDisconnectSocket).toHaveBeenCalledWith(false);

    await act(async () => {
      jest.advanceTimersByTime(5_000);
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(mockConnectSocketWithRetry).toHaveBeenCalledTimes(1);
    expect(mockSocketJoinMatch).toHaveBeenCalledTimes(1);

    consoleErrorSpy.mockRestore();
  });

  it('does not explicitly leave an online match during internal cleanup', async () => {
    mockSearchParams.id = 'online-cleanup';
    mockSearchParams.offline = '0';
    mockHasNakamaConfig.mockReturnValue(true);
    mockIsNakamaEnabled.mockReturnValue(true);
    mockSocketJoinMatch.mockResolvedValue({
      self: { user_id: 'self-user' },
      presences: [],
      match_id: 'online-cleanup',
    });
    mockStoreState.matchId = 'online-cleanup';

    const view = render(<GameRoom />);

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
    });

    view.unmount();

    expect(mockSocketLeaveMatch).not.toHaveBeenCalled();
    expect(mockDisconnectSocket).toHaveBeenCalledWith(false);
  });

  it('unlocks the local player for another online roll after a rosette extra turn snapshot', async () => {
    mockSearchParams.id = 'online-rosette-extra-turn';
    mockSearchParams.offline = '0';
    mockHasNakamaConfig.mockReturnValue(true);
    mockIsNakamaEnabled.mockReturnValue(true);
    mockSocketJoinMatch.mockResolvedValue({
      self: { user_id: 'self-user' },
      presences: [],
      match_id: 'online-rosette-extra-turn',
    });
    mockStoreState.matchId = 'online-rosette-extra-turn';
    mockStoreState.userId = 'self-user';
    mockStoreState.playerColor = 'light';
    mockStoreState.gameState = {
      ...baseGameState,
      currentTurn: 'light',
      phase: 'rolling',
      rollValue: null,
      history: [],
    };

    const view = render(<GameRoom />);

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
    });

    await act(async () => {
      fireEvent.press(screen.getByTestId('dice-roll-button'));
    });

    expect(mockRoll).toHaveBeenCalledTimes(1);

    await act(async () => {
      mockSocket.onmatchdata?.({
        match_id: 'online-rosette-extra-turn',
        op_code: 100,
        data: JSON.stringify({
          type: 'state_snapshot',
          matchId: 'online-rosette-extra-turn',
          revision: 1,
          gameState: {
            ...baseGameState,
            currentTurn: 'light',
            phase: 'moving',
            rollValue: 1,
            history: [],
          },
          players: makeSnapshotPlayers(),
          serverTimeMs: 1_000,
          turnDurationMs: 10_000,
          turnStartedAtMs: 1_000,
          turnDeadlineMs: 11_000,
          turnRemainingMs: 10_000,
          activeTimedPlayer: 'self-user',
          activeTimedPlayerColor: 'light',
          activeTimedPhase: 'moving',
          afkAccumulatedMs: {
            light: 0,
            dark: 0,
          },
          afkRemainingMs: 60_000,
          matchEnd: null,
        }),
      });
      await Promise.resolve();
      view.rerender(<GameRoom />);
    });

    await act(async () => {
      mockSocket.onmatchdata?.({
        match_id: 'online-rosette-extra-turn',
        op_code: 100,
        data: JSON.stringify({
          type: 'state_snapshot',
          matchId: 'online-rosette-extra-turn',
          revision: 2,
          gameState: {
            ...baseGameState,
            currentTurn: 'light',
            phase: 'rolling',
            rollValue: null,
            history: ['light moved to 3. Rosette: true'],
          },
          players: makeSnapshotPlayers(),
          serverTimeMs: 2_000,
          turnDurationMs: 10_000,
          turnStartedAtMs: 2_000,
          turnDeadlineMs: 12_000,
          turnRemainingMs: 10_000,
          activeTimedPlayer: 'self-user',
          activeTimedPlayerColor: 'light',
          activeTimedPhase: 'rolling',
          afkAccumulatedMs: {
            light: 0,
            dark: 0,
          },
          afkRemainingMs: 60_000,
          matchEnd: null,
        }),
      });
      await Promise.resolve();
      view.rerender(<GameRoom />);
    });

    await act(async () => {
      fireEvent.press(screen.getByTestId('dice-roll-button'));
    });

    expect(mockRoll).toHaveBeenCalledTimes(2);
  });

  it('keeps online rosette extra turns rollable with the real cue and dice scene on web', async () => {
    mockUseRealBoard = true;
    mockUseRealSlotDiceScene = true;
    mockUseRealMatchMomentIndicator = true;
    Object.defineProperty(Platform, 'OS', {
      configurable: true,
      get: () => 'web',
    });
    const previousWindow = global.window;
    const mockWindow = {
      ...previousWindow,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      innerWidth: 1280,
      innerHeight: 720,
      visualViewport: {
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        width: 1280,
        height: 720,
      },
    } as typeof window;
    Object.defineProperty(global, 'window', {
      configurable: true,
      value: mockWindow,
    });
    mockSearchParams.id = 'online-rosette-live';
    mockSearchParams.offline = '0';
    mockHasNakamaConfig.mockReturnValue(true);
    mockIsNakamaEnabled.mockReturnValue(true);
    mockSocketJoinMatch.mockResolvedValue({
      self: { user_id: 'self-user' },
      presences: [],
      match_id: 'online-rosette-live',
    });
    mockStoreState.matchId = 'online-rosette-live';
    mockStoreState.userId = 'self-user';
    mockStoreState.playerColor = 'light';
    mockStoreState.gameState = {
      ...baseGameState,
      currentTurn: 'light',
      phase: 'rolling',
      rollValue: null,
      history: [],
    };

    const view = render(<GameRoom />);

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
    });

    await act(async () => {
      fireEvent.press(screen.getByTestId('dice-roll-button'));
    });

    expect(mockRoll).toHaveBeenCalledTimes(1);

    await act(async () => {
      mockSocket.onmatchdata?.({
        match_id: 'online-rosette-live',
        op_code: 100,
        data: JSON.stringify({
          type: 'state_snapshot',
          matchId: 'online-rosette-live',
          revision: 1,
          gameState: {
            ...baseGameState,
            currentTurn: 'light',
            phase: 'moving',
            rollValue: 1,
            history: [],
          },
          players: makeSnapshotPlayers(),
          serverTimeMs: 1_000,
          turnDurationMs: 10_000,
          turnStartedAtMs: 1_000,
          turnDeadlineMs: 11_000,
          turnRemainingMs: 10_000,
          activeTimedPlayer: 'self-user',
          activeTimedPlayerColor: 'light',
          activeTimedPhase: 'moving',
          afkAccumulatedMs: {
            light: 0,
            dark: 0,
          },
          afkRemainingMs: 60_000,
          matchEnd: null,
        }),
      });
      await Promise.resolve();
      view.rerender(<GameRoom />);
    });

    await act(async () => {
      mockSocket.onmatchdata?.({
        match_id: 'online-rosette-live',
        op_code: 100,
        data: JSON.stringify({
          type: 'state_snapshot',
          matchId: 'online-rosette-live',
          revision: 2,
          gameState: {
            ...baseGameState,
            currentTurn: 'light',
            phase: 'rolling',
            rollValue: null,
            history: ['light moved to 3. Rosette: true'],
          },
          players: makeSnapshotPlayers(),
          serverTimeMs: 2_000,
          turnDurationMs: 10_000,
          turnStartedAtMs: 2_000,
          turnDeadlineMs: 12_000,
          turnRemainingMs: 10_000,
          activeTimedPlayer: 'self-user',
          activeTimedPlayerColor: 'light',
          activeTimedPhase: 'rolling',
          afkAccumulatedMs: {
            light: 0,
            dark: 0,
          },
          afkRemainingMs: 60_000,
          matchEnd: null,
        }),
      });
      await Promise.resolve();
      view.rerender(<GameRoom />);
    });

    act(() => {
      jest.advanceTimersByTime(50);
    });

    await act(async () => {
      fireEvent.press(screen.getByTestId('dice-roll-button'));
    });

    expect(mockRoll).toHaveBeenCalledTimes(2);
    Object.defineProperty(global, 'window', {
      configurable: true,
      value: previousWindow,
    });
  });

  it('disables online board interaction when the socket is not connected', async () => {
    mockSearchParams.id = 'online-input-locked';
    mockSearchParams.offline = '0';
    mockHasNakamaConfig.mockReturnValue(true);
    mockIsNakamaEnabled.mockReturnValue(true);
    mockSocketJoinMatch.mockResolvedValue({
      self: { user_id: 'self-user' },
      presences: [],
      match_id: 'online-input-locked',
    });
    mockStoreState.matchId = 'online-input-locked';
    mockStoreState.userId = 'self-user';
    mockStoreState.playerColor = 'light';
    mockStoreState.socketState = 'error';

    const movingState = createInitialState();
    movingState.currentTurn = 'light';
    movingState.phase = 'moving';
    movingState.rollValue = 1;
    movingState.light.pieces[0].position = 2;
    mockStoreState.gameState = movingState;
    mockStoreState.validMoves = getValidMoves(movingState, 1);

    render(<GameRoom />);

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
    });

    const latestBoardProps = mockBoard.mock.calls.at(-1)?.[0] as {
      allowInteraction?: boolean;
      onMakeMoveOverride?: (move: MoveAction) => void;
    };

    expect(latestBoardProps.allowInteraction).toBe(false);

    await act(async () => {
      latestBoardProps.onMakeMoveOverride?.(mockStoreState.validMoves[0]);
    });

    expect(mockMakeMove).not.toHaveBeenCalled();
  });

  it('treats rejected online sends as disconnects and retries the socket join', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => { });
    mockSearchParams.id = 'online-send-retry';
    mockSearchParams.offline = '0';
    mockHasNakamaConfig.mockReturnValue(true);
    mockIsNakamaEnabled.mockReturnValue(true);
    mockSocketJoinMatch.mockResolvedValue({
      self: { user_id: 'self-user' },
      presences: [],
      match_id: 'online-send-retry',
    });
    mockStoreState.matchId = 'online-send-retry';
    mockStoreState.userId = 'self-user';

    render(<GameRoom />);

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
    });

    const sendRoll = mockSetRollCommandSender.mock.calls.at(-1)?.[0] as
      | ((options?: { autoTriggered?: boolean }) => Promise<void>)
      | undefined;
    expect(typeof sendRoll).toBe('function');

    mockSocketSendMatchState.mockRejectedValueOnce(new Error('Socket connection has not been established yet.'));

    await act(async () => {
      await sendRoll?.();
    });

    expect(mockDisconnectSocket).toHaveBeenCalledWith(false);
    expect(mockSetSocketState).toHaveBeenCalledWith('disconnected');

    await act(async () => {
      jest.advanceTimersByTime(1_500);
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(mockConnectSocketWithRetry).toHaveBeenCalledTimes(2);
    expect(mockSocketJoinMatch).toHaveBeenCalledTimes(2);

    consoleErrorSpy.mockRestore();
  });

  it('tags online convenience auto-roll requests so they do not count as AFK activity', async () => {
    mockSearchParams.id = 'online-auto-roll-afk';
    mockSearchParams.offline = '0';
    mockHasNakamaConfig.mockReturnValue(true);
    mockIsNakamaEnabled.mockReturnValue(true);
    mockSocketJoinMatch.mockResolvedValue({
      self: { user_id: 'self-user' },
      presences: [],
      match_id: 'online-auto-roll-afk',
    });
    mockStoreState.matchId = 'online-auto-roll-afk';
    mockStoreState.userId = 'self-user';

    render(<GameRoom />);

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
    });

    const sendRoll = mockSetRollCommandSender.mock.calls.at(-1)?.[0] as
      | ((options?: { autoTriggered?: boolean }) => Promise<void>)
      | undefined;
    expect(typeof sendRoll).toBe('function');

    await act(async () => {
      await sendRoll?.({ autoTriggered: true });
    });

    expect(mockSocketSendMatchState).toHaveBeenCalledWith(
      'online-auto-roll-afk',
      1,
      JSON.stringify({
        type: 'roll_request',
        autoTriggered: true,
      }),
    );
  });

  it('passes authoritative online timer props to the HUD from server snapshots', async () => {
    mockSearchParams.id = 'online-1';
    mockSearchParams.offline = '0';
    mockHasNakamaConfig.mockReturnValue(true);
    mockIsNakamaEnabled.mockReturnValue(true);
    mockSocketJoinMatch.mockResolvedValue({
      self: { user_id: 'self-user' },
      presences: [],
      match_id: 'online-1',
    });
    mockStoreState.matchId = 'online-1';
    mockStoreState.userId = 'self-user';
    mockStoreState.playerColor = 'light';

    const view = render(<GameRoom />);

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
    });

    await act(async () => {
      mockSocket.onmatchdata?.({
        match_id: 'online-1',
        op_code: 100,
        data: JSON.stringify({
          type: 'state_snapshot',
          matchId: 'online-1',
          revision: 7,
          gameState: {
            ...baseGameState,
            currentTurn: 'light',
            phase: 'rolling',
          },
          players: makeSnapshotPlayers(),
          serverTimeMs: 5_000,
          turnDurationMs: 10_000,
          turnStartedAtMs: 5_000,
          turnDeadlineMs: 15_000,
          turnRemainingMs: 10_000,
          activeTimedPlayer: 'self-user',
          activeTimedPlayerColor: 'light',
          activeTimedPhase: 'rolling',
          afkAccumulatedMs: {
            light: 0,
            dark: 0,
          },
          afkRemainingMs: 60_000,
          matchEnd: null,
        }),
      });
      await Promise.resolve();
      view.rerender(<GameRoom />);
    });

    expect(
      mockGameStageHUD.mock.calls.some(
        ([props]) =>
          props.timerDurationMs === 10_000 &&
          props.timerRemainingMs === 10_000 &&
          props.timerKey === '7:15000' &&
          props.timerIsRunning === true,
      ),
    ).toBe(true);
  });

  it('uses inactivity-forfeit copy when the local online player loses on timeout', () => {
    mockSearchParams.id = 'online-2';
    mockSearchParams.offline = '0';
    mockHasNakamaConfig.mockReturnValue(true);
    mockIsNakamaEnabled.mockReturnValue(true);
    mockSocketJoinMatch.mockResolvedValue({
      self: { user_id: 'self-user' },
      presences: [],
      match_id: 'online-2',
    });
    mockStoreState.matchId = 'online-2';
    mockStoreState.userId = 'self-user';
    mockStoreState.playerColor = 'light';
    mockStoreState.gameState = {
      ...baseGameState,
      phase: 'ended',
      winner: 'dark',
    };
    mockStoreState.authoritativeMatchEnd = {
      reason: 'forfeit_inactivity',
      winnerUserId: 'opponent-user',
      loserUserId: 'self-user',
      forfeitingUserId: 'self-user',
      message: null,
    };
    mockRefreshProgression.mockImplementation(() => new Promise(() => {}));
    mockRefreshChallenges.mockImplementation(() => new Promise(() => {}));

    render(<GameRoom />);

    act(() => {
      jest.runOnlyPendingTimers();
    });

    expect(
      mockModal.mock.calls.some(
        ([props]) => props.visible === true && props.title === 'Defeat' && props.message === 'You forfeited due to inactivity.',
      ),
    ).toBe(true);
    expect(
      mockBoard.mock.calls.some(([props]) => props.freezeMotion === true),
    ).toBe(true);
  });

  it('shows the online forfeit result modal even before the local board snapshot marks a winner', async () => {
    mockSearchParams.id = 'online-forfeit-late-snapshot';
    mockSearchParams.offline = '0';
    mockHasNakamaConfig.mockReturnValue(true);
    mockIsNakamaEnabled.mockReturnValue(true);
    mockSocketJoinMatch.mockResolvedValue({
      self: { user_id: 'self-user' },
      presences: [],
      match_id: 'online-forfeit-late-snapshot',
    });
    mockStoreState.matchId = 'online-forfeit-late-snapshot';
    mockStoreState.userId = 'self-user';
    mockStoreState.playerColor = 'light';
    mockStoreState.authoritativePlayers = makeSnapshotPlayers();
    mockStoreState.gameState = {
      ...baseGameState,
      phase: 'moving',
      winner: null,
    };
    mockStoreState.authoritativeMatchEnd = {
      reason: 'forfeit_disconnect',
      winnerUserId: 'self-user',
      loserUserId: 'opponent-user',
      forfeitingUserId: 'opponent-user',
      message: null,
    };

    render(<GameRoom />);

    await act(async () => {
      jest.runOnlyPendingTimers();
      await Promise.resolve();
    });

    expect(
      mockModal.mock.calls.some(
        ([props]) =>
          props.visible === true &&
          props.title === 'Victory' &&
          props.message === 'Opponent disconnected and did not return.',
      ),
    ).toBe(true);
    expect(mockBoard.mock.calls.some(([props]) => props.freezeMotion === true)).toBe(true);
  });

  it('keeps the live forfeit transition and result modal active across follow-up snapshot rerenders', async () => {
    mockSearchParams.id = 'online-forfeit-rerender';
    mockSearchParams.offline = '0';
    mockHasNakamaConfig.mockReturnValue(true);
    mockIsNakamaEnabled.mockReturnValue(true);
    mockSocketJoinMatch.mockResolvedValue({
      self: { user_id: 'self-user' },
      presences: [],
      match_id: 'online-forfeit-rerender',
    });
    mockStoreState.matchId = 'online-forfeit-rerender';
    mockStoreState.userId = 'self-user';
    mockStoreState.playerColor = 'light';
    mockStoreState.authoritativePlayers = makeSnapshotPlayers();
    mockStoreState.gameState = {
      ...baseGameState,
      phase: 'ended',
      winner: 'light',
    };
    mockStoreState.authoritativeMatchEnd = {
      reason: 'forfeit_disconnect',
      winnerUserId: 'self-user',
      loserUserId: 'opponent-user',
      forfeitingUserId: 'opponent-user',
      message: null,
    };

    let deferredTransitionAction: (() => void | Promise<void>) | null = null;
    mockRunScreenTransition.mockImplementationOnce(async (request?: { action?: () => void | Promise<void> }) => {
      deferredTransitionAction = request?.action ?? null;
      return true;
    });

    const view = render(<GameRoom />);

    await act(async () => {
      await Promise.resolve();
    });

    mockStoreState.authoritativeMatchEnd = {
      reason: 'forfeit_disconnect',
      winnerUserId: 'self-user',
      loserUserId: 'opponent-user',
      forfeitingUserId: 'opponent-user',
      message: 'follow-up snapshot',
    };

    await act(async () => {
      view.rerender(<GameRoom />);
      await Promise.resolve();
    });

    await act(async () => {
      await deferredTransitionAction?.();
      await Promise.resolve();
    });

    act(() => {
      jest.runOnlyPendingTimers();
    });

    await act(async () => {
      await Promise.resolve();
    });

    await waitFor(() =>
      expect(
        mockModal.mock.calls.some(
          ([props]) =>
            props.visible === true &&
            props.title === 'Victory' &&
            props.message === 'Opponent disconnected and did not return.',
        ),
      ).toBe(true),
    );
  });

  it('refreshes Elo from RPC after a ranked online match ends', async () => {
    mockSearchParams.id = 'online-elo-refresh';
    mockSearchParams.offline = '0';
    mockHasNakamaConfig.mockReturnValue(true);
    mockIsNakamaEnabled.mockReturnValue(true);
    mockSocketJoinMatch.mockResolvedValue({
      self: { user_id: 'self-user' },
      presences: [],
      match_id: 'online-elo-refresh',
    });
    mockStoreState.matchId = 'online-elo-refresh';
    mockStoreState.userId = 'self-user';
    mockStoreState.playerColor = 'light';
    mockStoreState.gameState = {
      ...baseGameState,
      phase: 'ended',
      winner: 'dark',
    };
    mockRefreshElo.mockImplementation(() => new Promise(() => {}));
    mockRefreshProgression.mockImplementation(() => new Promise(() => {}));
    mockRefreshChallenges.mockImplementation(() => new Promise(() => {}));

    render(<GameRoom />);

    act(() => {
      jest.runOnlyPendingTimers();
    });

    expect(mockRefreshElo).toHaveBeenCalledWith({ silent: true });
  });

  it('shows the cinematic XP reveal before the regular online winner modal', async () => {
    const matchId = 'online-xp-win';
    mockAutoCompleteCinematicXpModal = false;
    mockSearchParams.id = matchId;
    mockSearchParams.offline = '0';
    mockHasNakamaConfig.mockReturnValue(true);
    mockIsNakamaEnabled.mockReturnValue(true);
    mockSocketJoinMatch.mockResolvedValue({
      self: { user_id: 'self-user' },
      presences: [],
      match_id: matchId,
    });
    mockProgression = buildProgressionSnapshot(500);
    mockStoreState.matchId = matchId;
    mockStoreState.userId = 'self-user';
    mockStoreState.playerColor = 'light';
    mockStoreState.lastProgressionAward = createProgressionAward(matchId, 500, 620);
    mockStoreState.gameState = {
      ...baseGameState,
      phase: 'ended',
      winner: 'light',
    };

    render(<GameRoom />);

    await act(async () => {
      jest.advanceTimersByTime(1_250);
      await Promise.resolve();
    });

    expect(screen.getByTestId('mock-cinematic-xp-modal')).toBeTruthy();
    expect(screen.queryByText('Victory')).toBeNull();

    fireEvent.press(screen.getByTestId('mock-cinematic-xp-complete'));

    expect(screen.getByText('Victory')).toBeTruthy();
  });

  it('does not show the cinematic XP reveal for losers', async () => {
    const matchId = 'online-xp-loss';
    mockSearchParams.id = matchId;
    mockSearchParams.offline = '0';
    mockHasNakamaConfig.mockReturnValue(true);
    mockIsNakamaEnabled.mockReturnValue(true);
    mockSocketJoinMatch.mockResolvedValue({
      self: { user_id: 'self-user' },
      presences: [],
      match_id: matchId,
    });
    mockProgression = buildProgressionSnapshot(500);
    mockStoreState.matchId = matchId;
    mockStoreState.userId = 'self-user';
    mockStoreState.playerColor = 'light';
    mockStoreState.lastProgressionAward = createProgressionAward(matchId, 500, 620);
    mockStoreState.gameState = {
      ...baseGameState,
      phase: 'ended',
      winner: 'dark',
    };

    render(<GameRoom />);

    await act(async () => {
      jest.runOnlyPendingTimers();
      await Promise.resolve();
    });

    expect(screen.queryByTestId('mock-cinematic-xp-modal')).toBeNull();
    expect(screen.getByText('Defeat')).toBeTruthy();
  });

  it('waits for refreshed progression data before opening the cinematic XP reveal', async () => {
    const matchId = 'online-xp-delayed-refresh';
    mockAutoCompleteCinematicXpModal = false;
    mockSearchParams.id = matchId;
    mockSearchParams.offline = '0';
    mockHasNakamaConfig.mockReturnValue(true);
    mockIsNakamaEnabled.mockReturnValue(true);
    mockSocketJoinMatch.mockResolvedValue({
      self: { user_id: 'self-user' },
      presences: [],
      match_id: matchId,
    });
    mockProgression = buildProgressionSnapshot(500);
    mockStoreState.matchId = matchId;
    mockStoreState.userId = 'self-user';
    mockStoreState.playerColor = 'light';
    mockStoreState.lastProgressionAward = null;
    mockStoreState.gameState = {
      ...baseGameState,
      phase: 'ended',
      winner: 'light',
    };
    mockRefreshProgression.mockResolvedValue(buildProgressionSnapshot(660));

    const view = render(<GameRoom />);

    await act(async () => {
      jest.advanceTimersByTime(500);
      await Promise.resolve();
    });

    expect(screen.queryByTestId('mock-cinematic-xp-modal')).toBeNull();

    mockProgression = buildProgressionSnapshot(660);
    view.rerender(<GameRoom />);

    await act(async () => {
      await Promise.resolve();
    });

    expect(screen.getByTestId('mock-cinematic-xp-modal')).toBeTruthy();
    expect(screen.getByText('XP reveal 500 -> 660')).toBeTruthy();
    expect(screen.queryByText('Victory')).toBeNull();

    fireEvent.press(screen.getByTestId('mock-cinematic-xp-complete'));

    expect(screen.getByText('Victory')).toBeTruthy();
  });

  it('shows the cinematic XP reveal before the regular offline winner modal when bot rewards are eligible', async () => {
    const matchId = 'local-1';
    mockAutoCompleteCinematicXpModal = false;
    mockSearchParams.id = matchId;
    mockSearchParams.offline = '1';
    mockHasNakamaConfig.mockReturnValue(true);
    mockIsNakamaEnabled.mockReturnValue(true);
    mockAuthState.user = {
      id: 'self-user',
      username: 'Michel',
      email: 'michel@example.com',
      provider: 'google',
      avatarUrl: null,
      createdAt: '2026-03-20T12:00:00.000Z',
      nakamaUserId: 'self-user',
    };
    mockProgression = buildProgressionSnapshot(300);
    mockStoreState.matchId = matchId;
    mockStoreState.playerColor = 'light';
    mockStoreState.gameState = {
      ...baseGameState,
      phase: 'ended',
      winner: 'light',
    };
    mockStoreState.lastProgressionAward = createProgressionAward(matchId, 300, 360);
    mockSubmitCompletedBotMatchResult.mockResolvedValue({
      progressionAward: createProgressionAward(matchId, 300, 360),
    });

    render(<GameRoom />);

    await act(async () => {
      jest.advanceTimersByTime(1_250);
      await Promise.resolve();
    });

    expect(mockSubmitCompletedBotMatchResult).toHaveBeenCalled();
    expect(screen.getByTestId('mock-cinematic-xp-modal')).toBeTruthy();
    expect(screen.queryByText('Victory')).toBeNull();

    fireEvent.press(screen.getByTestId('mock-cinematic-xp-complete'));

    expect(screen.getByText('Victory')).toBeTruthy();
  });

  it('holds the tournament waiting room until the cinematic XP reveal completes', async () => {
    const matchId = 'tournament-win-cinematic';
    mockAutoCompleteCinematicXpModal = false;
    mockSearchParams.id = matchId;
    mockSearchParams.offline = '0';
    mockSearchParams.tournamentRunId = 'run-1';
    mockSearchParams.tournamentId = 'tournament-1';
    mockSearchParams.tournamentName = 'Spring Open';
    mockSearchParams.tournamentReturnTarget = 'detail';
    mockHasNakamaConfig.mockReturnValue(true);
    mockIsNakamaEnabled.mockReturnValue(true);
    mockSocketJoinMatch.mockResolvedValue({
      self: { user_id: 'self-user' },
      presences: [],
      match_id: matchId,
    });
    mockStoreState.matchId = matchId;
    mockStoreState.userId = 'self-user';
    mockStoreState.playerColor = 'light';
    mockStoreState.gameState = {
      ...baseGameState,
      phase: 'ended',
      winner: 'light',
    };

    render(<GameRoom />);

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
      emitTournamentRewardSummary(matchId, {
        tournamentOutcome: 'advancing',
        shouldEnterWaitingRoom: true,
        totalXpOld: 500,
        totalXpNew: 650,
      });
      await Promise.resolve();
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(screen.getByTestId('mock-cinematic-xp-modal')).toBeTruthy();
    });
    expect(screen.queryByTestId('mock-tournament-waiting-room')).toBeNull();
    expect(screen.queryByText('Victory')).toBeNull();

    fireEvent.press(screen.getByTestId('mock-cinematic-xp-complete'));

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(screen.getByTestId('mock-tournament-waiting-room')).toBeTruthy();
  });

  it('does not surface a stale cinematic XP reveal after the route switches to a new match', async () => {
    const oldMatchId = 'online-stale-xp-old';
    const nextMatchId = 'online-stale-xp-next';
    mockSearchParams.id = oldMatchId;
    mockSearchParams.offline = '0';
    mockHasNakamaConfig.mockReturnValue(true);
    mockIsNakamaEnabled.mockReturnValue(true);
    mockSocketJoinMatch.mockResolvedValue({
      self: { user_id: 'self-user' },
      presences: [],
      match_id: oldMatchId,
    });
    mockProgression = buildProgressionSnapshot(500);
    mockStoreState.matchId = oldMatchId;
    mockStoreState.userId = 'self-user';
    mockStoreState.playerColor = 'light';
    mockStoreState.lastProgressionAward = createProgressionAward(oldMatchId, 500, 620);
    mockStoreState.gameState = {
      ...baseGameState,
      phase: 'ended',
      winner: 'light',
    };

    const view = render(<GameRoom />);

    mockSearchParams.id = nextMatchId;
    mockStoreState.matchId = nextMatchId;
    mockStoreState.lastProgressionAward = null;
    mockStoreState.gameState = {
      ...baseGameState,
      phase: 'rolling',
      winner: null,
    };

    view.rerender(<GameRoom />);

    await act(async () => {
      jest.advanceTimersByTime(1_250);
      await Promise.resolve();
    });

    expect(screen.queryByTestId('mock-cinematic-xp-modal')).toBeNull();
    expect(screen.queryByText('Victory')).toBeNull();
  });

  it('shows the eliminated tournament result modal when a tournament run ends in a loss', async () => {
    mockSearchParams.id = 'tournament-loss';
    mockSearchParams.offline = '0';
    mockSearchParams.tournamentRunId = 'run-1';
    mockSearchParams.tournamentId = 'tournament-1';
    mockSearchParams.tournamentName = 'Spring Open';
    mockSearchParams.tournamentReturnTarget = 'detail';
    mockHasNakamaConfig.mockReturnValue(true);
    mockIsNakamaEnabled.mockReturnValue(true);
    mockSocketJoinMatch.mockResolvedValue({
      self: { user_id: 'self-user' },
      presences: [],
      match_id: 'tournament-loss',
    });
    mockStoreState.matchId = 'tournament-loss';
    mockStoreState.userId = 'self-user';
    mockStoreState.playerColor = 'light';
    mockStoreState.gameState = {
      ...baseGameState,
      phase: 'ended',
      winner: 'dark',
    };
    mockRefreshProgression.mockImplementation(() => new Promise(() => {}));
    mockRefreshChallenges.mockImplementation(() => new Promise(() => {}));

    render(<GameRoom />);

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
      emitTournamentRewardSummary('tournament-loss', {
        didWin: false,
        tournamentOutcome: 'eliminated',
        totalXpDelta: 0,
        shouldEnterWaitingRoom: false,
      });
      await Promise.resolve();
    });

    expect(screen.getByText('Tournament Eliminated')).toBeTruthy();
    expect(screen.getByText('Your tournament run has ended.')).toBeTruthy();
    expect(screen.getByText('Return to Home Page')).toBeTruthy();
    expect(screen.queryByTestId('mock-tournament-waiting-room')).toBeNull();
  });

  it('auto-returns eliminated players to the home page after 15 seconds', async () => {
    mockSearchParams.id = 'tournament-loss-auto-exit';
    mockSearchParams.offline = '0';
    mockSearchParams.tournamentRunId = 'run-1';
    mockSearchParams.tournamentId = 'tournament-1';
    mockSearchParams.tournamentName = 'Spring Open';
    mockSearchParams.tournamentReturnTarget = 'detail';
    mockHasNakamaConfig.mockReturnValue(true);
    mockIsNakamaEnabled.mockReturnValue(true);
    mockSocketJoinMatch.mockResolvedValue({
      self: { user_id: 'self-user' },
      presences: [],
      match_id: 'tournament-loss-auto-exit',
    });
    mockStoreState.matchId = 'tournament-loss-auto-exit';
    mockStoreState.userId = 'self-user';
    mockStoreState.playerColor = 'light';
    mockStoreState.gameState = {
      ...baseGameState,
      phase: 'ended',
      winner: 'dark',
    };
    mockRefreshProgression.mockImplementation(() => new Promise(() => {}));
    mockRefreshChallenges.mockImplementation(() => new Promise(() => {}));

    render(<GameRoom />);

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
      emitTournamentRewardSummary('tournament-loss-auto-exit', {
        didWin: false,
        tournamentOutcome: 'eliminated',
        totalXpDelta: 0,
        shouldEnterWaitingRoom: false,
      });
      await Promise.resolve();
    });

    expect(screen.getByText('Return to Home Page')).toBeTruthy();

    await act(async () => {
      jest.advanceTimersByTime(15_000);
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
    });

    await waitFor(() => expect(mockRouterReplace).toHaveBeenCalledWith('/'));
  });

  it('shows a fallback defeat modal for the loser when the tournament reward summary never arrives', async () => {
    mockSearchParams.id = 'tournament-loss-fallback';
    mockSearchParams.offline = '0';
    mockSearchParams.tournamentRunId = 'run-1';
    mockSearchParams.tournamentId = 'tournament-1';
    mockSearchParams.tournamentName = 'Spring Open';
    mockSearchParams.tournamentReturnTarget = 'detail';
    mockHasNakamaConfig.mockReturnValue(true);
    mockIsNakamaEnabled.mockReturnValue(true);
    mockSocketJoinMatch.mockResolvedValue({
      self: { user_id: 'self-user' },
      presences: [],
      match_id: 'tournament-loss-fallback',
    });
    mockAuthState.user = {
      id: 'guest_self-user',
      username: 'Michel',
      email: null,
      provider: 'guest',
      avatarUrl: null,
      createdAt: '2026-03-27T09:00:00.000Z',
      nakamaUserId: 'self-user',
    };
    mockStoreState.matchId = 'tournament-loss-fallback';
    mockStoreState.userId = null;
    mockStoreState.playerColor = null;
    mockStoreState.authoritativePlayers = makeSnapshotPlayers({
      light: { userId: 'opponent-user', title: 'Opponent' },
      dark: { userId: 'self-user', title: 'Michel' },
    });
    mockStoreState.authoritativeMatchEnd = {
      reason: 'completed',
      winnerUserId: 'opponent-user',
      loserUserId: 'self-user',
      forfeitingUserId: null,
      message: null,
    };
    mockStoreState.gameState = {
      ...baseGameState,
      phase: 'ended',
      winner: 'light',
    };
    mockTournamentAdvanceFlowState = {
      ...mockTournamentAdvanceFlowState,
      phase: 'waiting',
      statusText: 'Recording the final tournament result...',
      subtleStatusText: 'Waiting for the tournament bracket to confirm your placement.',
    };

    render(<GameRoom />);

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
      jest.advanceTimersByTime(4_000);
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(screen.getByText('Defeat')).toBeTruthy();
    expect(
      screen.getByText(
        'Recording the final tournament result... Waiting for the tournament bracket to confirm your placement.',
      ),
    ).toBeTruthy();
    expect(screen.queryByText('Tournament Won')).toBeNull();
    expect(screen.queryByText('Return to Home Page')).toBeNull();
  });

  it('auto-enters the tournament waiting room after an advancing win', async () => {
    mockSearchParams.id = 'tournament-win';
    mockSearchParams.offline = '0';
    mockSearchParams.tournamentRunId = 'run-1';
    mockSearchParams.tournamentId = 'tournament-1';
    mockSearchParams.tournamentName = 'Spring Open';
    mockSearchParams.tournamentReturnTarget = 'detail';
    mockHasNakamaConfig.mockReturnValue(true);
    mockIsNakamaEnabled.mockReturnValue(true);
    mockSocketJoinMatch.mockResolvedValue({
      self: { user_id: 'self-user' },
      presences: [],
      match_id: 'tournament-win',
    });
    mockStoreState.matchId = 'tournament-win';
    mockStoreState.userId = 'self-user';
    mockStoreState.playerColor = 'light';
    mockStoreState.gameState = {
      ...baseGameState,
      phase: 'ended',
      winner: 'light',
    };
    mockRefreshProgression.mockImplementation(() => new Promise(() => {}));
    mockRefreshChallenges.mockImplementation(() => new Promise(() => {}));
    mockTournamentAdvanceFlowState = {
      ...mockTournamentAdvanceFlowState,
      phase: 'waiting',
      statusText: 'Recording your victory in the standings...',
    };

    render(<GameRoom />);

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
      emitTournamentRewardSummary('tournament-win', {
        tournamentOutcome: 'advancing',
        shouldEnterWaitingRoom: true,
      });
      await Promise.resolve();
    });

    expect(screen.getByTestId('mock-tournament-waiting-room')).toBeTruthy();
    expect(screen.getByText('Recording your victory in the standings...')).toBeTruthy();
    expect(screen.queryByText('Victory')).toBeNull();
  });

  it('shows a waiting-room prompt before sending a forfeit winner into the next tournament round', async () => {
    mockSearchParams.id = 'tournament-forfeit-win';
    mockSearchParams.offline = '0';
    mockSearchParams.tournamentRunId = 'run-1';
    mockSearchParams.tournamentId = 'tournament-1';
    mockSearchParams.tournamentName = 'Spring Open';
    mockSearchParams.tournamentReturnTarget = 'detail';
    mockHasNakamaConfig.mockReturnValue(true);
    mockIsNakamaEnabled.mockReturnValue(true);
    mockSocketJoinMatch.mockResolvedValue({
      self: { user_id: 'self-user' },
      presences: [],
      match_id: 'tournament-forfeit-win',
    });
    mockStoreState.matchId = 'tournament-forfeit-win';
    mockStoreState.userId = 'self-user';
    mockStoreState.playerColor = 'light';
    mockStoreState.gameState = {
      ...baseGameState,
      phase: 'ended',
      winner: 'light',
    };
    mockStoreState.authoritativeMatchEnd = {
      reason: 'forfeit_disconnect',
      winnerUserId: 'self-user',
      loserUserId: 'opponent-user',
      forfeitingUserId: 'opponent-user',
      message: null,
    };
    mockRefreshProgression.mockImplementation(() => new Promise(() => {}));
    mockRefreshChallenges.mockImplementation(() => new Promise(() => {}));
    mockTournamentAdvanceFlowState = {
      ...mockTournamentAdvanceFlowState,
      phase: 'waiting',
      statusText: 'Recording your victory in the standings...',
    };
    mockGetPublicTournamentStatus.mockResolvedValueOnce({
      tournament: {
        runId: 'run-1',
        tournamentId: 'tournament-1',
        name: 'Spring Open',
        description: 'A public run.',
        lifecycle: 'open',
        startAt: '2026-03-27T09:00:00.000Z',
        endAt: null,
        updatedAt: '2026-03-27T10:00:00.000Z',
        entrants: 8,
        maxEntrants: 8,
        gameMode: 'standard',
        region: 'Global',
        buyInLabel: 'Free',
        prizeLabel: 'No prize listed',
        currentRound: 2,
        membership: {
          isJoined: true,
          joinedAt: '2026-03-27T09:00:00.000Z',
        },
        participation: {
          state: 'waiting_next_round',
          currentRound: 2,
          currentEntryId: 'round-2-match-1',
          activeMatchId: null,
          finalPlacement: null,
          lastResult: 'win',
          canLaunch: false,
        },
      },
      standings: [],
    });

    render(<GameRoom />);

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
      emitTournamentRewardSummary('tournament-forfeit-win', {
        tournamentOutcome: 'advancing',
        shouldEnterWaitingRoom: true,
      });
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(screen.getByText('Victory')).toBeTruthy();
    expect(screen.getByText('Go to Waiting Room')).toBeTruthy();
    expect(screen.queryByTestId('mock-tournament-waiting-room')).toBeNull();

    await act(async () => {
      jest.advanceTimersByTime(15_000);
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(screen.getByTestId('mock-tournament-waiting-room')).toBeTruthy();
  });

  it('keeps a four-player semifinal winner in the waiting room instead of finalizing early', async () => {
    mockSearchParams.id = 'tournament-four-player-semifinal';
    mockSearchParams.offline = '0';
    mockSearchParams.tournamentRunId = 'run-1';
    mockSearchParams.tournamentId = 'tournament-1';
    mockSearchParams.tournamentName = 'Spring Open';
    mockSearchParams.tournamentRound = '1';
    mockSearchParams.tournamentReturnTarget = 'detail';
    mockHasNakamaConfig.mockReturnValue(true);
    mockIsNakamaEnabled.mockReturnValue(true);
    mockSocketJoinMatch.mockResolvedValue({
      self: { user_id: 'self-user' },
      presences: [],
      match_id: 'tournament-four-player-semifinal',
    });
    mockStoreState.matchId = 'tournament-four-player-semifinal';
    mockStoreState.userId = 'self-user';
    mockStoreState.playerColor = 'light';
    mockStoreState.gameState = {
      ...baseGameState,
      phase: 'ended',
      winner: 'light',
    };
    mockRefreshProgression.mockImplementation(() => new Promise(() => {}));
    mockRefreshChallenges.mockImplementation(() => new Promise(() => {}));
    mockGetPublicTournamentStatus.mockResolvedValueOnce({
      tournament: {
        runId: 'run-1',
        tournamentId: 'tournament-1',
        name: 'Spring Open',
        description: 'A public run.',
        lifecycle: 'open',
        startAt: '2026-03-27T09:00:00.000Z',
        endAt: null,
        updatedAt: '2026-03-27T10:00:00.000Z',
        entrants: 4,
        maxEntrants: 4,
        gameMode: 'standard',
        region: 'Global',
        buyInLabel: 'Free',
        prizeLabel: 'No prize listed',
        currentRound: 2,
        membership: {
          isJoined: true,
          joinedAt: '2026-03-27T09:00:00.000Z',
        },
        participation: {
          state: 'waiting_next_round',
          currentRound: 2,
          currentEntryId: 'round-2-match-1',
          activeMatchId: null,
          finalPlacement: null,
          lastResult: 'win',
          canLaunch: false,
        },
      },
      standings: [],
    });

    render(<GameRoom />);

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
      emitTournamentRewardSummary('tournament-four-player-semifinal', {
        tournamentOutcome: 'advancing',
        shouldEnterWaitingRoom: true,
      });
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(screen.getByTestId('mock-tournament-waiting-room')).toBeTruthy();
    expect(screen.getByText('Recording your victory in the standings...')).toBeTruthy();
    expect(screen.queryByText('Tournament Won')).toBeNull();
  });

  it('keeps an eight-player round-one winner in the waiting room instead of finalizing early', async () => {
    mockSearchParams.id = 'tournament-eight-player-quarterfinal';
    mockSearchParams.offline = '0';
    mockSearchParams.tournamentRunId = 'run-1';
    mockSearchParams.tournamentId = 'tournament-1';
    mockSearchParams.tournamentName = 'Spring Open';
    mockSearchParams.tournamentRound = '1';
    mockSearchParams.tournamentReturnTarget = 'detail';
    mockHasNakamaConfig.mockReturnValue(true);
    mockIsNakamaEnabled.mockReturnValue(true);
    mockSocketJoinMatch.mockResolvedValue({
      self: { user_id: 'self-user' },
      presences: [],
      match_id: 'tournament-eight-player-quarterfinal',
    });
    mockStoreState.matchId = 'tournament-eight-player-quarterfinal';
    mockStoreState.userId = 'self-user';
    mockStoreState.playerColor = 'light';
    mockStoreState.gameState = {
      ...baseGameState,
      phase: 'ended',
      winner: 'light',
    };
    mockRefreshProgression.mockImplementation(() => new Promise(() => {}));
    mockRefreshChallenges.mockImplementation(() => new Promise(() => {}));
    mockGetPublicTournamentStatus.mockResolvedValueOnce({
      tournament: {
        runId: 'run-1',
        tournamentId: 'tournament-1',
        name: 'Spring Open',
        description: 'A public run.',
        lifecycle: 'open',
        startAt: '2026-03-27T09:00:00.000Z',
        endAt: null,
        updatedAt: '2026-03-27T10:00:00.000Z',
        entrants: 8,
        maxEntrants: 8,
        gameMode: 'standard',
        region: 'Global',
        buyInLabel: 'Free',
        prizeLabel: 'No prize listed',
        currentRound: 2,
        membership: {
          isJoined: true,
          joinedAt: '2026-03-27T09:00:00.000Z',
        },
        participation: {
          state: 'waiting_next_round',
          currentRound: 2,
          currentEntryId: 'round-2-match-1',
          activeMatchId: null,
          finalPlacement: null,
          lastResult: 'win',
          canLaunch: false,
        },
      },
      standings: [],
    });

    render(<GameRoom />);

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
      emitTournamentRewardSummary('tournament-eight-player-quarterfinal', {
        tournamentOutcome: 'advancing',
        shouldEnterWaitingRoom: true,
      });
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(screen.getByTestId('mock-tournament-waiting-room')).toBeTruthy();
    expect(screen.getByText('Recording your victory in the standings...')).toBeTruthy();
    expect(screen.queryByText('Tournament Won')).toBeNull();
  });

  it('keeps a sixteen-player round-one winner in the waiting room instead of finalizing early', async () => {
    mockSearchParams.id = 'tournament-sixteen-player-round-one';
    mockSearchParams.offline = '0';
    mockSearchParams.tournamentRunId = 'run-1';
    mockSearchParams.tournamentId = 'tournament-1';
    mockSearchParams.tournamentName = 'Spring Open';
    mockSearchParams.tournamentRound = '1';
    mockSearchParams.tournamentReturnTarget = 'detail';
    mockHasNakamaConfig.mockReturnValue(true);
    mockIsNakamaEnabled.mockReturnValue(true);
    mockSocketJoinMatch.mockResolvedValue({
      self: { user_id: 'self-user' },
      presences: [],
      match_id: 'tournament-sixteen-player-round-one',
    });
    mockStoreState.matchId = 'tournament-sixteen-player-round-one';
    mockStoreState.userId = 'self-user';
    mockStoreState.playerColor = 'light';
    mockStoreState.gameState = {
      ...baseGameState,
      phase: 'ended',
      winner: 'light',
    };
    mockRefreshProgression.mockImplementation(() => new Promise(() => {}));
    mockRefreshChallenges.mockImplementation(() => new Promise(() => {}));
    mockGetPublicTournamentStatus.mockResolvedValueOnce({
      tournament: {
        runId: 'run-1',
        tournamentId: 'tournament-1',
        name: 'Spring Open',
        description: 'A public run.',
        lifecycle: 'open',
        startAt: '2026-03-27T09:00:00.000Z',
        endAt: null,
        updatedAt: '2026-03-27T10:00:00.000Z',
        entrants: 16,
        maxEntrants: 16,
        gameMode: 'standard',
        region: 'Global',
        buyInLabel: 'Free',
        prizeLabel: 'No prize listed',
        currentRound: 2,
        membership: {
          isJoined: true,
          joinedAt: '2026-03-27T09:00:00.000Z',
        },
        participation: {
          state: 'waiting_next_round',
          currentRound: 2,
          currentEntryId: 'round-2-match-3',
          activeMatchId: null,
          finalPlacement: null,
          lastResult: 'win',
          canLaunch: false,
        },
      },
      standings: [],
    });

    render(<GameRoom />);

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
      emitTournamentRewardSummary('tournament-sixteen-player-round-one', {
        tournamentOutcome: 'advancing',
        shouldEnterWaitingRoom: true,
      });
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(screen.getByTestId('mock-tournament-waiting-room')).toBeTruthy();
    expect(screen.getByText('Recording your victory in the standings...')).toBeTruthy();
    expect(screen.queryByText('Tournament Won')).toBeNull();
  });

  it('replaces the waiting-room CTA with a return-home action once the final win is finalized', async () => {
    mockSearchParams.id = 'tournament-final-win';
    mockSearchParams.offline = '0';
    mockSearchParams.tournamentRunId = 'run-1';
    mockSearchParams.tournamentId = 'tournament-1';
    mockSearchParams.tournamentName = 'Spring Open';
    mockSearchParams.tournamentReturnTarget = 'detail';
    mockHasNakamaConfig.mockReturnValue(true);
    mockIsNakamaEnabled.mockReturnValue(true);
    mockSocketJoinMatch.mockResolvedValue({
      self: { user_id: 'self-user' },
      presences: [],
      match_id: 'tournament-final-win',
    });
    mockStoreState.matchId = 'tournament-final-win';
    mockStoreState.userId = 'self-user';
    mockStoreState.playerColor = 'light';
    mockStoreState.gameState = {
      ...baseGameState,
      phase: 'ended',
      winner: 'light',
    };
    mockTournamentAdvanceFlowState = {
      ...mockTournamentAdvanceFlowState,
      phase: 'finalized',
      statusText: 'You won the tournament.',
      subtleStatusText: 'Your run is complete and the final standings are locked.',
      finalPlacement: 1,
      isChampion: true,
    };
    mockGetPublicTournamentStatus.mockResolvedValue({
      tournament: {
        runId: 'run-1',
        tournamentId: 'tournament-1',
        name: 'Spring Open',
        description: 'A public run.',
        lifecycle: 'finalized',
        startAt: '2026-03-27T09:00:00.000Z',
        endAt: null,
        updatedAt: '2026-03-27T10:00:00.000Z',
        entrants: 2,
        maxEntrants: 2,
        gameMode: 'standard',
        region: 'Global',
        buyInLabel: 'Free',
        prizeLabel: 'No prize listed',
        membership: {
          isJoined: true,
          joinedAt: '2026-03-27T09:00:00.000Z',
        },
        participation: {
          state: 'champion',
          currentRound: 1,
          currentEntryId: 'round-1-match-1',
          activeMatchId: null,
          finalPlacement: 1,
          lastResult: 'win',
          canLaunch: false,
        },
      },
      standings: [],
    });

    render(<GameRoom />);

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
      emitTournamentRewardSummary('tournament-final-win', {
        tournamentOutcome: 'advancing',
        shouldEnterWaitingRoom: true,
      });
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(screen.getByText('Tournament Won')).toBeTruthy();
    expect(await screen.findByText('You won the tournament and finished as champion.')).toBeTruthy();
    expect(screen.getByText('Return to Home Page')).toBeTruthy();
    expect(screen.queryByText('Wait for the Next Round')).toBeNull();
    expect(screen.queryByTestId('mock-tournament-waiting-room')).toBeNull();

    await act(async () => {
      fireEvent.press(screen.getByText('Return to Home Page'));
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(mockGetPublicTournamentStatus).toHaveBeenCalledWith('run-1');
    await waitFor(() => expect(mockRouterReplace).toHaveBeenCalledWith('/'));
  });

  it('shows an immediate tournament win modal for the champion and returns to the user home page', async () => {
    mockSearchParams.id = 'tournament-champion';
    mockSearchParams.offline = '0';
    mockSearchParams.tournamentRunId = 'run-1';
    mockSearchParams.tournamentId = 'tournament-1';
    mockSearchParams.tournamentName = 'Spring Open';
    mockSearchParams.tournamentReturnTarget = 'detail';
    mockHasNakamaConfig.mockReturnValue(true);
    mockIsNakamaEnabled.mockReturnValue(true);
    mockSocketJoinMatch.mockResolvedValue({
      self: { user_id: 'self-user' },
      presences: [],
      match_id: 'tournament-champion',
    });
    mockStoreState.matchId = 'tournament-champion';
    mockStoreState.userId = 'self-user';
    mockStoreState.playerColor = 'light';
    mockStoreState.gameState = {
      ...baseGameState,
      phase: 'ended',
      winner: 'light',
    };
    mockGetPublicTournamentStatus.mockResolvedValue({
      tournament: {
        runId: 'run-1',
        tournamentId: 'tournament-1',
        name: 'Spring Open',
        description: 'A public run.',
        lifecycle: 'finalized',
        startAt: '2026-03-27T09:00:00.000Z',
        endAt: null,
        updatedAt: '2026-03-27T10:00:00.000Z',
        entrants: 2,
        maxEntrants: 2,
        gameMode: 'standard',
        region: 'Global',
        buyInLabel: 'Free',
        prizeLabel: 'No prize listed',
        membership: {
          isJoined: true,
          joinedAt: '2026-03-27T09:00:00.000Z',
        },
        participation: {
          state: 'champion',
          currentRound: 1,
          currentEntryId: 'round-1-match-1',
          activeMatchId: null,
          finalPlacement: 1,
          lastResult: 'win',
          canLaunch: false,
        },
      },
      standings: [],
    });

    render(<GameRoom />);

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
      emitTournamentRewardSummary('tournament-champion', {
        tournamentOutcome: 'champion',
        shouldEnterWaitingRoom: false,
      });
      await Promise.resolve();
    });

    expect(screen.getByText('Tournament Won')).toBeTruthy();
    expect(screen.getByText('You won the tournament and finished as champion.')).toBeTruthy();
    expect(screen.getByText('Return to Home Page')).toBeTruthy();
    expect(screen.queryByText('Wait for the Next Round')).toBeNull();

    await act(async () => {
      fireEvent.press(screen.getByText('Return to Home Page'));
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(mockGetPublicTournamentStatus).toHaveBeenCalledWith('run-1');
    expect(mockRouterReplace).toHaveBeenCalledWith('/');
  });

  it('keeps an optimistic final-round winner modal on the match screen until the server confirms the tournament is terminal', async () => {
    mockSearchParams.id = 'tournament-strict-exit';
    mockSearchParams.offline = '0';
    mockSearchParams.tournamentRunId = 'run-1';
    mockSearchParams.tournamentId = 'tournament-1';
    mockSearchParams.tournamentName = 'Spring Open';
    mockSearchParams.tournamentRound = '1';
    mockSearchParams.tournamentReturnTarget = 'detail';
    mockHasNakamaConfig.mockReturnValue(true);
    mockIsNakamaEnabled.mockReturnValue(true);
    mockSocketJoinMatch.mockResolvedValue({
      self: { user_id: 'self-user' },
      presences: [],
      match_id: 'tournament-strict-exit',
    });
    mockStoreState.matchId = 'tournament-strict-exit';
    mockStoreState.userId = 'self-user';
    mockStoreState.playerColor = 'light';
    mockStoreState.gameState = {
      ...baseGameState,
      phase: 'ended',
      winner: 'light',
    };
    mockGetPublicTournamentStatus.mockResolvedValue({
      tournament: {
        runId: 'run-1',
        tournamentId: 'tournament-1',
        name: 'Spring Open',
        description: 'A public run.',
        lifecycle: 'open',
        startAt: '2026-03-27T09:00:00.000Z',
        endAt: null,
        updatedAt: '2026-03-27T10:00:00.000Z',
        entrants: 2,
        maxEntrants: 2,
        gameMode: 'standard',
        region: 'Global',
        buyInLabel: 'Free',
        prizeLabel: 'No prize listed',
        currentRound: 1,
        membership: {
          isJoined: true,
          joinedAt: '2026-03-27T09:00:00.000Z',
        },
        participation: {
          state: 'waiting_next_round',
          currentRound: 1,
          currentEntryId: 'round-1-match-1',
          activeMatchId: null,
          finalPlacement: null,
          lastResult: null,
          canLaunch: false,
        },
      },
      standings: [],
    });

    render(<GameRoom />);

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
      emitTournamentRewardSummary('tournament-strict-exit', {
        tournamentOutcome: 'champion',
        shouldEnterWaitingRoom: false,
      });
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(screen.getByText('Tournament Won')).toBeTruthy();
    expect(screen.getByText('Return to Home Page')).toBeTruthy();

    await act(async () => {
      fireEvent.press(screen.getByText('Return to Home Page'));
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(mockGetPublicTournamentStatus).toHaveBeenCalledWith('run-1');
    expect(mockRouterReplace).not.toHaveBeenCalled();
    expect(
      screen.getByText(
        'You won the tournament and finished as champion. We could not confirm the final standings in time, so you can leave anyway.',
      ),
    ).toBeTruthy();
    expect(screen.getByText('Leave Anyway')).toBeTruthy();
  });

  it('keeps the terminal tournament exit gated while validation is still in flight', async () => {
    const deferredStatus = createDeferred<Awaited<ReturnType<typeof mockGetPublicTournamentStatus>>>();

    mockSearchParams.id = 'tournament-exit-loading';
    mockSearchParams.offline = '0';
    mockSearchParams.tournamentRunId = 'run-1';
    mockSearchParams.tournamentId = 'tournament-1';
    mockSearchParams.tournamentName = 'Spring Open';
    mockSearchParams.tournamentReturnTarget = 'detail';
    mockHasNakamaConfig.mockReturnValue(true);
    mockIsNakamaEnabled.mockReturnValue(true);
    mockSocketJoinMatch.mockResolvedValue({
      self: { user_id: 'self-user' },
      presences: [],
      match_id: 'tournament-exit-loading',
    });
    mockStoreState.matchId = 'tournament-exit-loading';
    mockStoreState.userId = 'self-user';
    mockStoreState.playerColor = 'light';
    mockStoreState.gameState = {
      ...baseGameState,
      phase: 'ended',
      winner: 'light',
    };
    mockGetPublicTournamentStatus.mockReturnValueOnce(deferredStatus.promise);

    render(<GameRoom />);

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
      emitTournamentRewardSummary('tournament-exit-loading', {
        tournamentOutcome: 'champion',
        shouldEnterWaitingRoom: false,
      });
      await Promise.resolve();
    });

    await act(async () => {
      fireEvent.press(screen.getByText('Return to Home Page'));
      await Promise.resolve();
    });

    expect(mockGetPublicTournamentStatus).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Finalizing tournament result before returning home.')).toBeTruthy();
    expect(screen.getByText('loading')).toBeTruthy();
    expect(mockRouterReplace).not.toHaveBeenCalled();

    fireEvent.press(screen.getByText('Return to Home Page'));

    expect(mockGetPublicTournamentStatus).toHaveBeenCalledTimes(1);
  });

  it('falls back to a leave-anyway terminal exit after tournament validation times out', async () => {
    mockSearchParams.id = 'tournament-exit-timeout';
    mockSearchParams.offline = '0';
    mockSearchParams.tournamentRunId = 'run-1';
    mockSearchParams.tournamentId = 'tournament-1';
    mockSearchParams.tournamentName = 'Spring Open';
    mockSearchParams.tournamentReturnTarget = 'detail';
    mockHasNakamaConfig.mockReturnValue(true);
    mockIsNakamaEnabled.mockReturnValue(true);
    mockSocketJoinMatch.mockResolvedValue({
      self: { user_id: 'self-user' },
      presences: [],
      match_id: 'tournament-exit-timeout',
    });
    mockStoreState.matchId = 'tournament-exit-timeout';
    mockStoreState.userId = 'self-user';
    mockStoreState.playerColor = 'light';
    mockStoreState.gameState = {
      ...baseGameState,
      phase: 'ended',
      winner: 'dark',
    };
    mockGetPublicTournamentStatus.mockImplementationOnce(() => new Promise(() => {}));

    render(<GameRoom />);

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
      emitTournamentRewardSummary('tournament-exit-timeout', {
        didWin: false,
        tournamentOutcome: 'eliminated',
        totalXpDelta: 0,
        shouldEnterWaitingRoom: false,
      });
      await Promise.resolve();
    });

    await act(async () => {
      fireEvent.press(screen.getByText('Return to Home Page'));
      await Promise.resolve();
    });

    expect(screen.getByText('Finalizing tournament result before returning home.')).toBeTruthy();
    expect(mockRouterReplace).not.toHaveBeenCalled();

    await act(async () => {
      jest.advanceTimersByTime(5_000);
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(screen.getByText('Leave Anyway')).toBeTruthy();
    expect(screen.getByText(/We could not confirm the final standings in time/)).toBeTruthy();
    expect(mockRouterReplace).not.toHaveBeenCalled();

    await act(async () => {
      fireEvent.press(screen.getByText('Leave Anyway'));
      await Promise.resolve();
    });

    expect(mockRouterReplace).toHaveBeenCalledWith('/');
  });

  it('sends a rematch response from the online result modal', async () => {
    mockSearchParams.id = 'online-rematch';
    mockSearchParams.offline = '0';
    mockSearchParams.modeId = 'standard';
    mockHasNakamaConfig.mockReturnValue(true);
    mockIsNakamaEnabled.mockReturnValue(true);
    mockSocketJoinMatch.mockResolvedValue({
      self: { user_id: 'self-user' },
      presences: [],
      match_id: 'online-rematch',
    });
    mockStoreState.matchId = 'online-rematch';
    mockStoreState.userId = 'self-user';
    mockStoreState.playerColor = 'light';
    mockStoreState.gameState = {
      ...baseGameState,
      phase: 'ended',
      winner: 'light',
    };
    mockStoreState.authoritativePlayers = makeSnapshotPlayers();
    mockStoreState.authoritativeMatchEnd = {
      reason: 'completed',
      winnerUserId: 'self-user',
      loserUserId: 'opponent-user',
      forfeitingUserId: null,
      message: null,
    };
    mockStoreState.authoritativeRematch = {
      status: 'pending',
      deadlineMs: 5_000,
      acceptedUserIds: [],
      nextMatchId: null,
      nextPrivateCode: null,
    };
    mockStoreState.authoritativeServerTimeMs = 1_000;
    mockStoreState.authoritativeSnapshotReceivedAtMs = Date.now();

    render(<GameRoom />);

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
      jest.advanceTimersByTime(1_250);
      await Promise.resolve();
    });

    await waitFor(() => expect(screen.getByText('Rematch Window')).toBeTruthy());

    await act(async () => {
      fireEvent.press(screen.getByText('Rematch'));
    });

    expect(mockSocketSendMatchState).toHaveBeenCalledWith(
      'online-rematch',
      MatchOpCode.REMATCH_RESPONSE,
      JSON.stringify({
        type: 'rematch_response',
        accepted: true,
      }),
    );
  });

  it('leaves the finished match and routes into the server-created rematch once nextMatchId arrives', async () => {
    mockSearchParams.id = 'online-rematch-private';
    mockSearchParams.offline = '0';
    mockSearchParams.modeId = 'standard';
    mockSearchParams.privateMatch = '1';
    mockSearchParams.privateHost = '1';
    mockSearchParams.privateCode = 'OLDCODE1';
    mockHasNakamaConfig.mockReturnValue(true);
    mockIsNakamaEnabled.mockReturnValue(true);
    mockSocketJoinMatch.mockResolvedValue({
      self: { user_id: 'self-user' },
      presences: [],
      match_id: 'online-rematch-private',
    });
    mockStoreState.matchId = 'online-rematch-private';
    mockStoreState.userId = 'self-user';
    mockStoreState.playerColor = 'light';
    mockStoreState.gameState = {
      ...baseGameState,
      phase: 'ended',
      winner: 'light',
    };
    mockStoreState.authoritativePlayers = makeSnapshotPlayers();
    mockStoreState.authoritativeMatchEnd = {
      reason: 'completed',
      winnerUserId: 'self-user',
      loserUserId: 'opponent-user',
      forfeitingUserId: null,
      message: null,
    };
    mockStoreState.authoritativeRematch = {
      status: 'pending',
      deadlineMs: 5_000,
      acceptedUserIds: ['self-user'],
      nextMatchId: null,
      nextPrivateCode: null,
    };

    const view = render(<GameRoom />);

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
    });

    await act(async () => {
      mockStoreState.authoritativeRematch = {
        status: 'matched',
        deadlineMs: 5_000,
        acceptedUserIds: ['self-user', 'opponent-user'],
        nextMatchId: 'online-rematch-private-2',
        nextPrivateCode: 'NEWCODE1',
      };
      view.rerender(<GameRoom />);
      await Promise.resolve();
    });

    await waitFor(() => expect(mockSocketLeaveMatch).toHaveBeenCalledWith('online-rematch-private'));
    await waitFor(() =>
      expect(mockRouterReplace).toHaveBeenCalledWith(
        '/match/online-rematch-private-2?modeId=standard&privateMatch=1&privateHost=1&privateCode=NEWCODE1',
      ),
    );
  });

  it('resolves a stale final-win summary into a return-home tournament result modal', async () => {
    mockSearchParams.id = 'tournament-stale-final-win';
    mockSearchParams.offline = '0';
    mockSearchParams.tournamentRunId = 'run-1';
    mockSearchParams.tournamentId = 'tournament-1';
    mockSearchParams.tournamentName = 'Spring Open';
    mockSearchParams.tournamentReturnTarget = 'detail';
    mockHasNakamaConfig.mockReturnValue(true);
    mockIsNakamaEnabled.mockReturnValue(true);
    mockSocketJoinMatch.mockResolvedValue({
      self: { user_id: 'self-user' },
      presences: [],
      match_id: 'tournament-stale-final-win',
    });
    mockStoreState.matchId = 'tournament-stale-final-win';
    mockStoreState.userId = 'self-user';
    mockStoreState.playerColor = 'light';
    mockStoreState.gameState = {
      ...baseGameState,
      phase: 'ended',
      winner: 'light',
    };
    mockGetPublicTournamentStatus.mockResolvedValue({
      tournament: {
        runId: 'run-1',
        tournamentId: 'tournament-1',
        name: 'Spring Open',
        description: 'A public run.',
        lifecycle: 'finalized',
        startAt: '2026-03-27T09:00:00.000Z',
        endAt: null,
        updatedAt: '2026-03-27T10:00:00.000Z',
        entrants: 2,
        maxEntrants: 2,
        gameMode: 'standard',
        region: 'Global',
        buyInLabel: 'Free',
        prizeLabel: 'No prize listed',
        membership: {
          isJoined: true,
          joinedAt: '2026-03-27T09:00:00.000Z',
        },
        participation: {
          state: 'champion',
          currentRound: 1,
          currentEntryId: 'round-1-match-1',
          activeMatchId: null,
          finalPlacement: 1,
          lastResult: 'win',
          canLaunch: false,
        },
      },
      standings: [],
    });

    render(<GameRoom />);

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
      emitTournamentRewardSummary('tournament-stale-final-win', {
        tournamentOutcome: 'advancing',
        shouldEnterWaitingRoom: true,
      });
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(screen.getByText('Tournament Won')).toBeTruthy();
    expect(screen.getByText('Return to Home Page')).toBeTruthy();
    expect(screen.queryByText('Wait for the Next Round')).toBeNull();

    await act(async () => {
      fireEvent.press(screen.getByText('Return to Home Page'));
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(mockGetPublicTournamentStatus).toHaveBeenCalledWith('run-1');
    await waitFor(() => expect(mockRouterReplace).toHaveBeenCalledWith('/'));
    expect(screen.queryByTestId('mock-tournament-waiting-room')).toBeNull();
  });

  it('treats a two-player one-round final as terminal before the waiting-room CTA appears', async () => {
    mockSearchParams.id = 'tournament-single-match-final';
    mockSearchParams.offline = '0';
    mockSearchParams.tournamentRunId = 'run-1';
    mockSearchParams.tournamentId = 'tournament-1';
    mockSearchParams.tournamentName = 'Spring Open';
    mockSearchParams.tournamentRound = '1';
    mockSearchParams.tournamentReturnTarget = 'detail';
    mockHasNakamaConfig.mockReturnValue(true);
    mockIsNakamaEnabled.mockReturnValue(true);
    mockSocketJoinMatch.mockResolvedValue({
      self: { user_id: 'self-user' },
      presences: [],
      match_id: 'tournament-single-match-final',
    });
    mockStoreState.matchId = 'tournament-single-match-final';
    mockStoreState.userId = 'self-user';
    mockStoreState.playerColor = 'light';
    mockStoreState.gameState = {
      ...baseGameState,
      phase: 'ended',
      winner: 'light',
    };
    mockGetPublicTournamentStatus.mockResolvedValueOnce({
      tournament: {
        runId: 'run-1',
        tournamentId: 'tournament-1',
        name: 'Spring Open',
        description: 'A public run.',
        lifecycle: 'open',
        startAt: '2026-03-27T09:00:00.000Z',
        endAt: null,
        updatedAt: '2026-03-27T10:00:00.000Z',
        entrants: 2,
        maxEntrants: 2,
        gameMode: 'standard',
        region: 'Global',
        buyInLabel: 'Free',
        prizeLabel: 'No prize listed',
        currentRound: 1,
        membership: {
          isJoined: true,
          joinedAt: '2026-03-27T09:00:00.000Z',
        },
        participation: {
          state: 'waiting_next_round',
          currentRound: 1,
          currentEntryId: 'round-1-match-1',
          activeMatchId: null,
          finalPlacement: null,
          lastResult: null,
          canLaunch: false,
        },
      },
      standings: [],
    });

    render(<GameRoom />);

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
      emitTournamentRewardSummary('tournament-single-match-final', {
        tournamentOutcome: 'advancing',
        shouldEnterWaitingRoom: true,
      });
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(screen.getByText('Tournament Won')).toBeTruthy();
    expect(screen.getByText('You won the tournament and finished as champion.')).toBeTruthy();
    expect(screen.getByText('Return to Home Page')).toBeTruthy();
    expect(screen.queryByText('Wait for the Next Round')).toBeNull();
  });

  it('treats a larger final round as terminal before the waiting-room CTA appears', async () => {
    mockSearchParams.id = 'tournament-eight-player-final';
    mockSearchParams.offline = '0';
    mockSearchParams.tournamentRunId = 'run-1';
    mockSearchParams.tournamentId = 'tournament-1';
    mockSearchParams.tournamentName = 'Spring Open';
    mockSearchParams.tournamentRound = '3';
    mockSearchParams.tournamentReturnTarget = 'detail';
    mockHasNakamaConfig.mockReturnValue(true);
    mockIsNakamaEnabled.mockReturnValue(true);
    mockSocketJoinMatch.mockResolvedValue({
      self: { user_id: 'self-user' },
      presences: [],
      match_id: 'tournament-eight-player-final',
    });
    mockStoreState.matchId = 'tournament-eight-player-final';
    mockStoreState.userId = 'self-user';
    mockStoreState.playerColor = 'light';
    mockStoreState.gameState = {
      ...baseGameState,
      phase: 'ended',
      winner: 'light',
    };
    mockGetPublicTournamentStatus.mockResolvedValueOnce({
      tournament: {
        runId: 'run-1',
        tournamentId: 'tournament-1',
        name: 'Spring Open',
        description: 'A public run.',
        lifecycle: 'open',
        startAt: '2026-03-27T09:00:00.000Z',
        endAt: null,
        updatedAt: '2026-03-27T10:00:00.000Z',
        entrants: 8,
        maxEntrants: 8,
        gameMode: 'standard',
        region: 'Global',
        buyInLabel: 'Free',
        prizeLabel: 'No prize listed',
        currentRound: 3,
        membership: {
          isJoined: true,
          joinedAt: '2026-03-27T09:00:00.000Z',
        },
        participation: {
          state: 'waiting_next_round',
          currentRound: 3,
          currentEntryId: 'round-3-match-1',
          activeMatchId: null,
          finalPlacement: null,
          lastResult: null,
          canLaunch: false,
        },
      },
      standings: [],
    });

    render(<GameRoom />);

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
      emitTournamentRewardSummary('tournament-eight-player-final', {
        tournamentOutcome: 'advancing',
        shouldEnterWaitingRoom: true,
      });
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(screen.getByText('Tournament Won')).toBeTruthy();
    expect(screen.getByText('You won the tournament and finished as champion.')).toBeTruthy();
    expect(screen.getByText('Return to Home Page')).toBeTruthy();
    expect(screen.queryByText('Wait for the Next Round')).toBeNull();
  });

  it('keeps advancing winners in the waiting room immediately without a countdown modal', async () => {
    mockSearchParams.id = 'tournament-auto-enter';
    mockSearchParams.offline = '0';
    mockSearchParams.tournamentRunId = 'run-1';
    mockSearchParams.tournamentId = 'tournament-1';
    mockSearchParams.tournamentName = 'Spring Open';
    mockSearchParams.tournamentReturnTarget = 'detail';
    mockHasNakamaConfig.mockReturnValue(true);
    mockIsNakamaEnabled.mockReturnValue(true);
    mockSocketJoinMatch.mockResolvedValue({
      self: { user_id: 'self-user' },
      presences: [],
      match_id: 'tournament-auto-enter',
    });
    mockStoreState.matchId = 'tournament-auto-enter';
    mockStoreState.userId = 'self-user';
    mockStoreState.playerColor = 'light';
    mockStoreState.gameState = {
      ...baseGameState,
      phase: 'ended',
      winner: 'light',
    };
    mockTournamentAdvanceFlowState = {
      ...mockTournamentAdvanceFlowState,
      phase: 'waiting',
      statusText: 'Recording your victory in the standings...',
    };

    render(<GameRoom />);

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
      emitTournamentRewardSummary('tournament-auto-enter', {
        tournamentOutcome: 'advancing',
        shouldEnterWaitingRoom: true,
      });
      await Promise.resolve();
    });

    expect(screen.getByTestId('mock-tournament-waiting-room')).toBeTruthy();
    expect(screen.queryByText('Wait for the Next Round')).toBeNull();
  });

  it('replaces the waiting room with a terminal tournament result once polling finalizes after entry', async () => {
    mockSearchParams.id = 'tournament-enter-then-finalize';
    mockSearchParams.offline = '0';
    mockSearchParams.tournamentRunId = 'run-1';
    mockSearchParams.tournamentId = 'tournament-1';
    mockSearchParams.tournamentName = 'Spring Open';
    mockSearchParams.tournamentReturnTarget = 'detail';
    mockHasNakamaConfig.mockReturnValue(true);
    mockIsNakamaEnabled.mockReturnValue(true);
    mockSocketJoinMatch.mockResolvedValue({
      self: { user_id: 'self-user' },
      presences: [],
      match_id: 'tournament-enter-then-finalize',
    });
    mockStoreState.matchId = 'tournament-enter-then-finalize';
    mockStoreState.userId = 'self-user';
    mockStoreState.playerColor = 'light';
    mockStoreState.gameState = {
      ...baseGameState,
      phase: 'ended',
      winner: 'light',
    };
    mockGetPublicTournamentStatus.mockRejectedValue(new Error('Tournament status is still settling.'));
    mockTournamentAdvanceFlowState = {
      ...mockTournamentAdvanceFlowState,
      phase: 'waiting',
      statusText: 'Recording your victory in the standings...',
      subtleStatusText: null,
      retryMessage: null,
      finalPlacement: null,
      isChampion: false,
    };

    const view = render(<GameRoom />);

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
      emitTournamentRewardSummary('tournament-enter-then-finalize', {
        tournamentOutcome: 'advancing',
        shouldEnterWaitingRoom: true,
      });
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(screen.getByTestId('mock-tournament-waiting-room')).toBeTruthy();

    mockTournamentAdvanceFlowState = {
      ...mockTournamentAdvanceFlowState,
      phase: 'finalized',
      statusText: 'You won the tournament.',
      subtleStatusText: 'Your run is complete and the final standings are locked.',
      finalPlacement: 1,
      isChampion: true,
    };

    view.rerender(<GameRoom />);

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(screen.queryByTestId('mock-tournament-waiting-room')).toBeNull();
    expect(screen.getByText('Tournament Won')).toBeTruthy();
    expect(screen.getByText('Return to Home Page')).toBeTruthy();
    expect(screen.queryByText('Wait for the Next Round')).toBeNull();
  });

  it('resolves a stale final-win summary before auto-entry and keeps the return-home modal visible', async () => {
    mockSearchParams.id = 'tournament-auto-finalized';
    mockSearchParams.offline = '0';
    mockSearchParams.tournamentRunId = 'run-1';
    mockSearchParams.tournamentId = 'tournament-1';
    mockSearchParams.tournamentName = 'Spring Open';
    mockSearchParams.tournamentReturnTarget = 'detail';
    mockHasNakamaConfig.mockReturnValue(true);
    mockIsNakamaEnabled.mockReturnValue(true);
    mockSocketJoinMatch.mockResolvedValue({
      self: { user_id: 'self-user' },
      presences: [],
      match_id: 'tournament-auto-finalized',
    });
    mockStoreState.matchId = 'tournament-auto-finalized';
    mockStoreState.userId = 'self-user';
    mockStoreState.playerColor = 'light';
    mockStoreState.gameState = {
      ...baseGameState,
      phase: 'ended',
      winner: 'light',
    };
    mockGetPublicTournamentStatus.mockResolvedValueOnce({
      tournament: {
        runId: 'run-1',
        tournamentId: 'tournament-1',
        name: 'Spring Open',
        description: 'A public run.',
        lifecycle: 'finalized',
        startAt: '2026-03-27T09:00:00.000Z',
        endAt: null,
        updatedAt: '2026-03-27T10:00:00.000Z',
        entrants: 2,
        maxEntrants: 2,
        gameMode: 'standard',
        region: 'Global',
        buyInLabel: 'Free',
        prizeLabel: 'No prize listed',
        membership: {
          isJoined: true,
          joinedAt: '2026-03-27T09:00:00.000Z',
        },
        participation: {
          state: 'champion',
          currentRound: 1,
          currentEntryId: 'round-1-match-1',
          activeMatchId: null,
          finalPlacement: 1,
          lastResult: 'win',
          canLaunch: false,
        },
      },
      standings: [],
    });

    render(<GameRoom />);

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
      emitTournamentRewardSummary('tournament-auto-finalized', {
        tournamentOutcome: 'advancing',
        shouldEnterWaitingRoom: true,
      });
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(screen.getByText('Tournament Won')).toBeTruthy();
    expect(screen.getByText('Return to Home Page')).toBeTruthy();
    expect(screen.queryByText('Wait for the Next Round')).toBeNull();

    await act(async () => {
      jest.advanceTimersByTime(14_000);
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(mockGetPublicTournamentStatus).toHaveBeenCalledWith('run-1');
    expect(mockRouterReplace).not.toHaveBeenCalled();
    expect(screen.getByText('Return to Home Page')).toBeTruthy();
    expect(screen.queryByTestId('mock-tournament-waiting-room')).toBeNull();
  });

  it('keeps the regular win flow exit action visible while challenge rewards stay collapsed', async () => {
    const matchId = 'online-challenge-win';
    const { definitions, totalXp } = configureCompletedMatchChallenges(matchId);

    mockSearchParams.id = matchId;
    mockSearchParams.offline = '0';
    mockHasNakamaConfig.mockReturnValue(true);
    mockIsNakamaEnabled.mockReturnValue(true);
    mockSocketJoinMatch.mockResolvedValue({
      self: { user_id: 'self-user' },
      presences: [],
      match_id: matchId,
    });
    mockStoreState.matchId = matchId;
    mockStoreState.userId = 'self-user';
    mockStoreState.playerColor = 'light';
    mockStoreState.gameState = {
      ...baseGameState,
      phase: 'ended',
      winner: 'light',
    };

    render(<GameRoom />);

    await act(async () => {
      jest.runOnlyPendingTimers();
    });

    expect(await screen.findByText('Return to Menu')).toBeTruthy();
    expect(screen.getByText(`+${totalXp} XP from challenges`)).toBeTruthy();
    expect(screen.getByText('Show 2 completed challenges')).toBeTruthy();
    expect(screen.queryByText(definitions[0].name)).toBeNull();
    expect(screen.queryByText(definitions[1].name)).toBeNull();

    fireEvent.press(screen.getByText('Show 2 completed challenges'));

    expect(screen.getByText(definitions[0].name)).toBeTruthy();
    expect(screen.getByText(definitions[1].name)).toBeTruthy();
  });

  it('keeps tournament challenge rewards visible after the waiting room opens', async () => {
    const matchId = 'tournament-challenge-win';
    const { definitions, totalXp } = configureCompletedMatchChallenges(matchId);

    mockSearchParams.id = matchId;
    mockSearchParams.offline = '0';
    mockSearchParams.tournamentRunId = 'run-1';
    mockSearchParams.tournamentId = 'tournament-1';
    mockSearchParams.tournamentName = 'Spring Open';
    mockSearchParams.tournamentReturnTarget = 'detail';
    mockHasNakamaConfig.mockReturnValue(true);
    mockIsNakamaEnabled.mockReturnValue(true);
    mockSocketJoinMatch.mockResolvedValue({
      self: { user_id: 'self-user' },
      presences: [],
      match_id: matchId,
    });
    mockStoreState.matchId = matchId;
    mockStoreState.userId = 'self-user';
    mockStoreState.playerColor = 'light';
    mockStoreState.gameState = {
      ...baseGameState,
      phase: 'ended',
      winner: 'light',
    };
    mockTournamentAdvanceFlowState = {
      ...mockTournamentAdvanceFlowState,
      phase: 'waiting',
      statusText: 'Recording your victory in the standings...',
    };

    render(<GameRoom />);

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
      emitTournamentRewardSummary(matchId, {
        tournamentOutcome: 'advancing',
        challengeCompletionCount: 2,
        challengeXpDelta: totalXp,
        totalXpDelta: 100 + totalXp,
        totalXpOld: 500,
        totalXpNew: 600 + totalXp,
        shouldEnterWaitingRoom: true,
      });
      await Promise.resolve();
    });

    expect(await screen.findByTestId('mock-tournament-waiting-room')).toBeTruthy();
    expect(screen.getByText(`+${totalXp} XP from challenges`)).toBeTruthy();
    expect(screen.getByText('2 challenges completed')).toBeTruthy();
    expect(screen.queryByText('Wait for the Next Round')).toBeNull();
  });

  it('uses route replacement when tournament waiting-room launch succeeds', async () => {
    mockSearchParams.id = 'tournament-auto-next';
    mockSearchParams.offline = '0';
    mockSearchParams.tournamentRunId = 'run-1';
    mockSearchParams.tournamentId = 'tournament-1';
    mockSearchParams.tournamentName = 'Spring Open';
    mockSearchParams.tournamentReturnTarget = 'detail';
    mockHasNakamaConfig.mockReturnValue(true);
    mockIsNakamaEnabled.mockReturnValue(true);
    mockStoreState.matchId = 'tournament-auto-next';
    mockStoreState.userId = 'self-user';
    mockStoreState.playerColor = 'light';
    mockStoreState.gameState = {
      ...baseGameState,
      phase: 'ended',
      winner: 'light',
    };
    mockRefreshProgression.mockImplementation(() => new Promise(() => {}));
    mockRefreshChallenges.mockImplementation(() => new Promise(() => {}));
    mockTournamentAdvanceFlowState = {
      ...mockTournamentAdvanceFlowState,
      phase: 'ready',
      statusText: 'Match found',
      launchNextMatch: jest.fn(() => {
        mockFinalizeTournamentMatch(
          {
            runId: 'run-1',
            tournamentId: 'tournament-1',
          },
          {
            matchId: 'match-next',
          },
          {
            navigationMode: 'replace',
          },
        );
        return Promise.resolve();
      }),
    };

    render(<GameRoom />);

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
      emitTournamentRewardSummary('tournament-auto-next', {
        tournamentOutcome: 'advancing',
        shouldEnterWaitingRoom: true,
      });
      await Promise.resolve();
    });

    await act(async () => {
      fireEvent.press(screen.getByText('Launch next match'));
      await Promise.resolve();
    });

    expect(mockFinalizeTournamentMatch).toHaveBeenCalledWith(
      expect.objectContaining({
        runId: 'run-1',
        tournamentId: 'tournament-1',
      }),
      expect.objectContaining({
        matchId: 'match-next',
      }),
      expect.objectContaining({
        navigationMode: 'replace',
      }),
    );
  });

  it('clears stale tournament intermission UI when the next match route loads', async () => {
    mockSearchParams.id = 'tournament-transition-source';
    mockSearchParams.offline = '0';
    mockSearchParams.tournamentRunId = 'run-1';
    mockSearchParams.tournamentId = 'tournament-1';
    mockSearchParams.tournamentName = 'Spring Open';
    mockSearchParams.tournamentReturnTarget = 'detail';
    mockHasNakamaConfig.mockReturnValue(true);
    mockIsNakamaEnabled.mockReturnValue(true);
    mockStoreState.matchId = 'tournament-transition-source';
    mockStoreState.userId = 'self-user';
    mockStoreState.playerColor = 'light';
    mockStoreState.gameState = {
      ...baseGameState,
      phase: 'ended',
      winner: 'light',
    };
    mockRefreshProgression.mockImplementation(() => new Promise(() => {}));
    mockRefreshChallenges.mockImplementation(() => new Promise(() => {}));
    mockTournamentAdvanceFlowState = {
      ...mockTournamentAdvanceFlowState,
      phase: 'waiting',
      statusText: 'Recording your victory in the standings...',
    };

    const view = render(<GameRoom />);

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
      emitTournamentRewardSummary('tournament-transition-source', {
        tournamentOutcome: 'advancing',
        shouldEnterWaitingRoom: true,
      });
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(screen.getByTestId('mock-tournament-waiting-room')).toBeTruthy();

    mockSearchParams.id = 'tournament-transition-next';
    mockSearchParams.tournamentRound = '2';
    mockStoreState.matchId = 'tournament-transition-next';
    mockStoreState.gameState = {
      ...baseGameState,
      phase: 'rolling',
      winner: null,
    };

    view.rerender(<GameRoom />);

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(screen.queryByTestId('mock-tournament-waiting-room')).toBeNull();
    expect(screen.queryByTestId('mock-modal')).toBeNull();
    expect(screen.queryByText('Recording your victory in the standings...')).toBeNull();
  });

  it('does not open a stale result modal when the store winner belongs to a different match than the route', async () => {
    mockSearchParams.id = 'tournament-final-active';
    mockSearchParams.offline = '0';
    mockSearchParams.tournamentRunId = 'run-1';
    mockSearchParams.tournamentId = 'tournament-1';
    mockSearchParams.tournamentName = 'Spring Open';
    mockSearchParams.tournamentRound = '2';
    mockSearchParams.tournamentReturnTarget = 'detail';
    mockHasNakamaConfig.mockReturnValue(true);
    mockIsNakamaEnabled.mockReturnValue(true);
    mockStoreState.matchId = 'tournament-semifinal-stale';
    mockStoreState.userId = 'self-user';
    mockStoreState.playerColor = null;
    mockStoreState.gameState = {
      ...baseGameState,
      phase: 'ended',
      winner: 'light',
    };

    render(<GameRoom />);

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(screen.queryByTestId('mock-modal')).toBeNull();
    expect(screen.queryByText('Defeat')).toBeNull();
    expect(screen.queryByText('Tournament Complete')).toBeNull();
  });

  it.each([
    {
      label: 'an eight-player quarterfinal-to-semifinal transition',
      routeMatchId: 'tournament-eight-player-semifinal',
      staleMatchId: 'tournament-eight-player-quarterfinal',
      nextRound: '2',
    },
    {
      label: 'a sixteen-player round-of-16-to-quarterfinal transition',
      routeMatchId: 'tournament-sixteen-player-quarterfinal',
      staleMatchId: 'tournament-sixteen-player-round-one',
      nextRound: '2',
    },
  ])('does not open a stale result modal after %s', async ({ routeMatchId, staleMatchId, nextRound }) => {
    mockSearchParams.id = routeMatchId;
    mockSearchParams.offline = '0';
    mockSearchParams.tournamentRunId = 'run-1';
    mockSearchParams.tournamentId = 'tournament-1';
    mockSearchParams.tournamentName = 'Spring Open';
    mockSearchParams.tournamentRound = nextRound;
    mockSearchParams.tournamentReturnTarget = 'detail';
    mockHasNakamaConfig.mockReturnValue(true);
    mockIsNakamaEnabled.mockReturnValue(true);
    mockStoreState.matchId = staleMatchId;
    mockStoreState.userId = 'self-user';
    mockStoreState.playerColor = null;
    mockStoreState.gameState = {
      ...baseGameState,
      phase: 'ended',
      winner: 'light',
    };

    render(<GameRoom />);

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(screen.queryByTestId('mock-modal')).toBeNull();
    expect(screen.queryByText('Victory')).toBeNull();
    expect(screen.queryByText('Defeat')).toBeNull();
    expect(screen.queryByText('Tournament Complete')).toBeNull();
  });

  it('keeps the waiting room visible when the boundary launch is still retrying', async () => {
    mockSearchParams.id = 'tournament-auto-retry';
    mockSearchParams.offline = '0';
    mockSearchParams.tournamentRunId = 'run-1';
    mockSearchParams.tournamentId = 'tournament-1';
    mockSearchParams.tournamentName = 'Spring Open';
    mockSearchParams.tournamentReturnTarget = 'detail';
    mockHasNakamaConfig.mockReturnValue(true);
    mockIsNakamaEnabled.mockReturnValue(true);
    mockStoreState.matchId = 'tournament-auto-retry';
    mockStoreState.userId = 'self-user';
    mockStoreState.playerColor = 'light';
    mockStoreState.gameState = {
      ...baseGameState,
      phase: 'ended',
      winner: 'light',
    };
    mockRefreshProgression.mockImplementation(() => new Promise(() => {}));
    mockRefreshChallenges.mockImplementation(() => new Promise(() => {}));
    mockTournamentAdvanceFlowState = {
      ...mockTournamentAdvanceFlowState,
      phase: 'retrying',
      statusText: 'Rechecking for the next round...',
    };

    render(<GameRoom />);

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
      emitTournamentRewardSummary('tournament-auto-retry', {
        tournamentOutcome: 'advancing',
        shouldEnterWaitingRoom: true,
      });
      await Promise.resolve();
    });

    expect(screen.getByTestId('mock-tournament-waiting-room')).toBeTruthy();
    expect(screen.getByText('Rechecking for the next round...')).toBeTruthy();
    expect(mockFinalizeTournamentMatch).not.toHaveBeenCalled();
  });

  it('passes human and bot titles to the score cards in offline matches', async () => {
    mockSearchParams.id = 'local-score-titles';
    mockSearchParams.offline = '1';
    mockSearchParams.botDifficulty = 'medium';
    mockStoreState.matchId = 'local-score-titles';
    mockAuthState.user = {
      id: 'user-1',
      username: 'Michel',
      email: null,
      provider: 'google',
      avatarUrl: null,
      createdAt: '2026-03-29T00:00:00.000Z',
    };

    render(<GameRoom />);

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(
      mockEdgeScore.mock.calls.some(
        ([props]) => props.side === 'light' && props.title === 'Michel',
      ),
    ).toBe(true);
    expect(
      mockEdgeScore.mock.calls.some(
        ([props]) => props.side === 'dark' && props.title === 'Medium Bot',
      ),
    ).toBe(true);
  });

  it('renders authoritative online score titles from snapshot player data', async () => {
    mockSearchParams.id = 'online-score-titles';
    mockSearchParams.offline = '0';
    mockHasNakamaConfig.mockReturnValue(true);
    mockIsNakamaEnabled.mockReturnValue(true);
    mockSocketJoinMatch.mockResolvedValue({
      self: { user_id: 'self-user' },
      presences: [],
      match_id: 'online-score-titles',
    });
    mockStoreState.matchId = 'online-score-titles';
    mockStoreState.userId = 'self-user';
    mockStoreState.playerColor = 'light';
    mockAuthState.user = {
      id: 'user-1',
      username: 'Fallback Name',
      email: null,
      provider: 'google',
      avatarUrl: null,
      createdAt: '2026-03-29T00:00:00.000Z',
    };

    const view = render(<GameRoom />);

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
    });

    await act(async () => {
      mockSocket.onmatchdata?.({
        match_id: 'online-score-titles',
        op_code: 100,
        data: JSON.stringify({
          type: 'state_snapshot',
          matchId: 'online-score-titles',
          revision: 1,
          gameState: {
            ...baseGameState,
            currentTurn: 'light',
            phase: 'rolling',
          },
          players: makeSnapshotPlayers({
            light: { title: 'RoyalMichel', userId: 'self-user' },
            dark: { title: 'Guest', userId: 'opponent-user' },
          }),
        }),
      });
      await Promise.resolve();
      view.rerender(<GameRoom />);
    });

    expect(
      mockEdgeScore.mock.calls.some(
        ([props]) => props.side === 'light' && props.title === 'RoyalMichel',
      ),
    ).toBe(true);
    expect(
      mockEdgeScore.mock.calls.some(
        ([props]) => props.side === 'dark' && props.title === 'Guest',
      ),
    ).toBe(true);
  });

  it('keeps online timer settings visual-only while leaving offline timer settings available', async () => {
    mockSearchParams.id = 'online-3';
    mockSearchParams.offline = '0';
    mockHasNakamaConfig.mockReturnValue(true);
    mockIsNakamaEnabled.mockReturnValue(true);
    mockSocketJoinMatch.mockResolvedValue({
      self: { user_id: 'self-user' },
      presences: [],
      match_id: 'online-3',
    });
    mockStoreState.matchId = 'online-3';

    render(<GameRoom />);

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(
      mockAudioSettingsModal.mock.calls.some(
        ([props]) =>
          props.showTimerToggle === true &&
          props.showTimerDurationPicker === false &&
          props.timerToggleTitle === 'Turn Timer Animation',
      ),
    ).toBe(true);

    mockSearchParams.id = 'local-2';
    mockSearchParams.offline = '1';
    mockStoreState.matchId = 'local-2';

    render(<GameRoom />);

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(
      mockAudioSettingsModal.mock.calls.some(
        ([props]) =>
          props.showTimerToggle === true &&
          props.showTimerDurationPicker === true &&
          props.timerToggleTitle === 'Turn Timer',
      ),
    ).toBe(true);
  });
});
