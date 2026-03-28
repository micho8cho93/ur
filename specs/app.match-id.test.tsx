import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { createInitialState, getValidMoves } from '@/logic/engine';
import type { GameState, MoveAction } from '@/logic/types';

const mockMatchDiceRollStage = jest.fn(({ rolling, visible }: { rolling: boolean; visible: boolean }) => {
  const { Text } = require('react-native');
  return <Text testID="match-dice-stage-playback">{`${visible ? 'visible' : 'hidden'}:${rolling ? 'rolling' : 'idle'}`}</Text>;
});
const mockBoard = jest.fn();
const mockGameStageHUD = jest.fn(() => {
  const { View } = require('react-native');
  return <View testID="mock-stage-hud" />;
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
    children,
  }: {
    visible?: boolean;
    title?: string;
    message?: string;
    children?: React.ReactNode;
  }) => {
    const { Text, View } = require('react-native');
    if (!visible) {
      return null;
    }
    return (
      <View testID="mock-modal">
        {title ? <Text>{title}</Text> : null}
        {message ? <Text>{message}</Text> : null}
        {children}
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
  authoritativeAfkAccumulatedMs: null,
  authoritativeAfkRemainingMs: null,
  authoritativeMatchEnd: null,
  authoritativeSnapshotReceivedAtMs: null,
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
  const React = require('react');
  const { View } = require('react-native');
  return {
    EdgeScore: () => <View testID="mock-edge-score" />,
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
  return {
    MatchResultSummaryContent: () => <View testID="mock-match-result-summary" />,
  };
});

jest.mock('@/components/tournaments/TournamentWaitingRoom', () => {
  const React = require('react');
  const { Text, View } = require('react-native');
  return {
    TournamentWaitingRoom: ({
      visible,
      statusText,
      children,
    }: {
      visible?: boolean;
      statusText?: string;
      children?: React.ReactNode;
    }) =>
      visible ? (
        <View testID="mock-tournament-waiting-room">
          {statusText ? <Text>{statusText}</Text> : null}
          {children}
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
    definitions: [],
    progress: [],
    refresh: mockRefreshChallenges,
  }),
}));

jest.mock('@/src/auth/useAuth', () => ({
  useAuth: () => ({
    user: null,
    isLoading: false,
    loginWithGoogle: jest.fn(),
    loginAsGuest: jest.fn(),
    logout: jest.fn(),
    linkGoogleAccount: jest.fn(),
  }),
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
    mockStoreState.authoritativeAfkAccumulatedMs = null;
    mockStoreState.authoritativeAfkRemainingMs = null;
    mockStoreState.authoritativeMatchEnd = null;
    mockStoreState.authoritativeSnapshotReceivedAtMs = null;
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
    expect(screen.queryByText('The middle row is where both sides can fight over the same squares, so captures become possible there.')).toBeNull();

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
          assignments: {
            'self-user': 'light',
            'opponent-user': 'dark',
          },
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
          assignments: {
            'self-user': 'light',
            'opponent-user': 'dark',
          },
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
          assignments: {
            'self-user': 'light',
            'opponent-user': 'dark',
          },
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
          assignments: {
            'self-user': 'light',
            'opponent-user': 'dark',
          },
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
          assignments: {
            'self-user': 'light',
            'opponent-user': 'dark',
          },
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

  it('keeps the existing tournament loss modal with Back to Standings', () => {
    mockSearchParams.id = 'tournament-loss';
    mockSearchParams.offline = '0';
    mockSearchParams.tournamentRunId = 'run-1';
    mockSearchParams.tournamentId = 'tournament-1';
    mockSearchParams.tournamentName = 'Spring Open';
    mockSearchParams.tournamentReturnTarget = 'detail';
    mockHasNakamaConfig.mockReturnValue(true);
    mockIsNakamaEnabled.mockReturnValue(true);
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

    expect(screen.getByText('Back to Standings')).toBeTruthy();
    expect(screen.queryByTestId('mock-tournament-waiting-room')).toBeNull();
  });

  it('enters the tournament waiting room after a tournament win instead of showing the old modal path', () => {
    mockSearchParams.id = 'tournament-win';
    mockSearchParams.offline = '0';
    mockSearchParams.tournamentRunId = 'run-1';
    mockSearchParams.tournamentId = 'tournament-1';
    mockSearchParams.tournamentName = 'Spring Open';
    mockSearchParams.tournamentReturnTarget = 'detail';
    mockHasNakamaConfig.mockReturnValue(true);
    mockIsNakamaEnabled.mockReturnValue(true);
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

    expect(screen.getByTestId('mock-tournament-waiting-room')).toBeTruthy();
    expect(screen.getByText('Recording your victory in the standings...')).toBeTruthy();
    expect(screen.queryByText('Victory')).toBeNull();
  });

  it('uses route replacement when tournament auto-advance succeeds', () => {
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
      phase: 'launching',
      statusText: 'Joining next match...',
    };
    mockTournamentAdvanceFlowShouldFinalize = true;

    render(<GameRoom />);

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

  it('returns to waiting/retry when tournament auto-launch fails instead of hard-failing', () => {
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

    expect(screen.getByTestId('mock-tournament-waiting-room')).toBeTruthy();
    expect(screen.getByText('Rechecking for the next round...')).toBeTruthy();
    expect(mockFinalizeTournamentMatch).not.toHaveBeenCalled();
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
