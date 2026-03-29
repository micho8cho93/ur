import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { createInitialState, getValidMoves } from '@/logic/engine';
import { getMatchConfig } from '@/logic/matchConfigs';
import type { GameState, MoveAction } from '@/logic/types';
import { CHALLENGE_DEFINITIONS, createDefaultUserChallengeProgressSnapshot } from '@/shared/challenges';
import { buildProgressionSnapshot } from '@/shared/progression';

const mockMatchDiceRollStage = jest.fn(({ rolling, visible }: { rolling: boolean; visible: boolean }) => {
  const { Text } = require('react-native');
  return <Text testID="match-dice-stage-playback">{`${visible ? 'visible' : 'hidden'}:${rolling ? 'rolling' : 'idle'}`}</Text>;
});
const mockBoard = jest.fn();
const mockGameStageHUD = jest.fn(() => {
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
const mockAudioSettingsModal = jest.fn(() => {
  const { View } = require('react-native');
  return <View testID="mock-audio-settings" />;
});
const mockModal = jest.fn(
  ({
    visible,
    title,
    message,
    actionLabel,
    onAction,
    children,
  }: {
    visible?: boolean;
    title?: string;
    message?: string;
    actionLabel?: string;
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
          <Pressable onPress={onAction}>
            <Text>{actionLabel}</Text>
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
const mockDice = jest.fn(({ canRoll, onRoll }: { canRoll?: boolean; onRoll?: () => void }) => {
  const { Pressable, Text, View } = require('react-native');
  return (
    <View testID="dice-roll-scene-host">
      <Pressable testID="dice-roll-button" disabled={!canRoll} onPress={onRoll}>
        <Text>{canRoll ? 'rollable' : 'locked'}</Text>
      </Pressable>
    </View>
  );
});
const mockDiceStageVisual = jest.fn(() => {
  const { View } = require('react-native');
  return <View testID="mock-dice-stage-visual" />;
});

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
const mockGetMatchPreferences = jest.fn();
const mockUpdateMatchPreferences = jest.fn();
const mockConnectSocketWithRetry = jest.fn();
const mockDisconnectSocket = jest.fn();
const mockRefreshElo = jest.fn(() => Promise.resolve(null));
const mockRefreshProgression = jest.fn(() => Promise.resolve(null));
const mockRefreshChallenges = jest.fn(() => Promise.resolve(null));
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
  authoritativeMatchEnd: null,
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
  const React = require('react');
  const { View } = require('react-native');
  return {
    PieceRail: () => <View testID="mock-piece-rail" />,
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

jest.mock('@/components/HowToPlayModal', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    HowToPlayModal: () => <View testID="mock-how-to-play" />,
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
      statusText,
      onReturnToMainPage,
      onLaunchNextMatch,
    }: {
      visible?: boolean;
      statusText?: string;
      onReturnToMainPage?: () => void;
      onLaunchNextMatch?: () => void;
    }) =>
      visible ? (
        <View testID="mock-tournament-waiting-room">
          {statusText ? <Text>{statusText}</Text> : null}
          <Pressable onPress={onLaunchNextMatch}>
            <Text>Launch next match</Text>
          </Pressable>
          <Pressable onPress={onReturnToMainPage}>
            <Text>Return to Home Page</Text>
          </Pressable>
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
  MatchDiceRollStage: (props: { rolling: boolean; visible: boolean }) => mockMatchDiceRollStage(props),
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
  Dice: (props: unknown) => mockDice(props),
  DiceStageVisual: (props: unknown) => mockDiceStageVisual(props),
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
    progression: null,
    refresh: mockRefreshProgression,
    errorMessage: null,
  }),
}));

jest.mock('@/src/elo/useEloRating', () => ({
  useEloRating: () => ({
    ratingProfile: null,
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

import { Platform } from 'react-native';
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
        authoritativeMatchEnd: snapshot.matchEnd ?? null,
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
    mockStoreState.authoritativeMatchEnd = null;
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

  it('shows a rules intro modal for Capture mode and dismisses it with Close', async () => {
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

    expect(screen.getByText('Capture Mode')).toBeTruthy();
    expect(screen.getByText(/shared middle rosette is no longer safe/i)).toBeTruthy();
    fireEvent.press(screen.getByText('Close'));
    expect(screen.queryByText('Capture Mode')).toBeNull();
  });

  it('shows a rules intro modal for Extended Path', async () => {
    jest.useFakeTimers();
    mockSearchParams.modeId = 'gameMode_full_path';
    mockStoreState.gameState = {
      ...baseGameState,
      matchConfig: getMatchConfig('gameMode_full_path'),
    };

    render(<GameRoom />);

    await act(async () => {
      await Promise.resolve();
    });

    expect(screen.getAllByText('Extended Path').length).toBeGreaterThan(0);
    expect(screen.getByText(/longer path before bearing off/i)).toBeTruthy();
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
      jest.advanceTimersByTime(1_500);
    });

    expect(mockMatchDiceRollStage.mock.calls.at(-1)?.[0]).toEqual(
      expect.objectContaining({
        rolling: false,
        visible: true,
      }),
    );
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

  it('shows Opponent Forfeit when a private opponent leaves mid-match', async () => {
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

    expect(screen.queryByText('Opponent Forfeit')).toBeNull();

    mockStoreState.matchPresences = ['self-user'];

    await act(async () => {
      view.rerender(<GameRoom />);
      await Promise.resolve();
    });

    expect(screen.getByText('Opponent Forfeit')).toBeTruthy();
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
          afkRemainingMs: 90_000,
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
          afkRemainingMs: 90_000,
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
          afkRemainingMs: 90_000,
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
          afkRemainingMs: 90_000,
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

    const sendRoll = mockSetRollCommandSender.mock.calls.at(-1)?.[0] as (() => Promise<void>) | undefined;
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
          afkRemainingMs: 90_000,
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

  it('shows the tournament victory modal before entering the waiting room', async () => {
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

    expect(screen.getByText('Victory')).toBeTruthy();
    expect(screen.getByText('Enter Waiting Room')).toBeTruthy();
    expect(screen.queryByTestId('mock-tournament-waiting-room')).toBeNull();
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

    render(<GameRoom />);

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
      emitTournamentRewardSummary('tournament-final-win', {
        tournamentOutcome: 'advancing',
        shouldEnterWaitingRoom: true,
      });
      await Promise.resolve();
    });

    expect(screen.getByText('Tournament Won')).toBeTruthy();
    expect(screen.getByText('You won the tournament and finished as champion.')).toBeTruthy();
    expect(screen.getByText('Return to Home Page')).toBeTruthy();
    expect(screen.queryByText('Enter Waiting Room')).toBeNull();
    expect(screen.queryByTestId('mock-tournament-waiting-room')).toBeNull();

    fireEvent.press(screen.getByText('Return to Home Page'));

    expect(mockGetPublicTournamentStatus).toHaveBeenCalledWith('run-1');
    expect(mockRouterReplace).toHaveBeenCalledWith('/');
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
    expect(screen.queryByText('Enter Waiting Room')).toBeNull();
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
      emitTournamentRewardSummary('tournament-stale-final-win', {
        tournamentOutcome: 'advancing',
        shouldEnterWaitingRoom: true,
      });
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(screen.getByText('Tournament Won')).toBeTruthy();
    expect(screen.getByText('Return to Home Page')).toBeTruthy();
    expect(screen.queryByText('Enter Waiting Room')).toBeNull();

    await act(async () => {
      fireEvent.press(screen.getByText('Return to Home Page'));
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(mockGetPublicTournamentStatus).toHaveBeenCalledWith('run-1');
    expect(mockRouterReplace).toHaveBeenCalledWith('/');
    expect(screen.queryByTestId('mock-tournament-waiting-room')).toBeNull();
  });

  it('auto-enters the waiting room after 15 seconds when the victory modal is untouched', async () => {
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

    expect(screen.getByText('Enter Waiting Room')).toBeTruthy();
    expect(screen.queryByTestId('mock-tournament-waiting-room')).toBeNull();

    await act(async () => {
      jest.advanceTimersByTime(15_000);
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(screen.getByTestId('mock-tournament-waiting-room')).toBeTruthy();
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
    expect(screen.queryByText('Enter Waiting Room')).toBeNull();

    await act(async () => {
      jest.advanceTimersByTime(15_000);
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

  it('shows tournament challenge rewards in the victory modal before the waiting room opens', async () => {
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

    expect(await screen.findByText('Enter Waiting Room')).toBeTruthy();
    expect(screen.getByText(`+${totalXp} XP from challenges`)).toBeTruthy();
    expect(screen.getByText('Show 2 completed challenges')).toBeTruthy();
    expect(screen.queryByText(definitions[0].name)).toBeNull();
    expect(screen.queryByText(definitions[1].name)).toBeNull();
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
      fireEvent.press(screen.getByText('Enter Waiting Room'));
      await Promise.resolve();
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

    await act(async () => {
      fireEvent.press(screen.getByText('Enter Waiting Room'));
      await Promise.resolve();
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

  it('hides timer-length settings for online matches while leaving offline timer settings available', async () => {
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
        ([props]) => props.showTimerToggle === false && props.showTimerDurationPicker === false,
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
        ([props]) => props.showTimerToggle === true && props.showTimerDurationPicker === true,
      ),
    ).toBe(true);
  });
});
