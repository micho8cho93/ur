import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { createInitialState } from '@/logic/engine';
import type { GameState, MoveAction } from '@/logic/types';

const mockMatchDiceRollStage = jest.fn(({ rolling, visible }: { rolling: boolean; visible: boolean }) => {
  const { Text } = require('react-native');
  return <Text testID="match-dice-stage-playback">{`${visible ? 'visible' : 'hidden'}:${rolling ? 'rolling' : 'idle'}`}</Text>;
});
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

const mockMatchMomentIndicator = jest.fn(({ cue }: { cue: { message: string } | null }) => {
  const { Text } = require('react-native');
  return cue ? <Text testID="mock-match-cue">{cue.message}</Text> : null;
});

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
const mockSetSocketState = jest.fn();
const mockSetRollCommandSender = jest.fn();
const mockSetMoveCommandSender = jest.fn();
const mockGetMatchPreferences = jest.fn();
const mockUpdateMatchPreferences = jest.fn();
const mockConnectSocketWithRetry = jest.fn();
const mockDisconnectSocket = jest.fn();
const mockRefreshProgression = jest.fn(() => Promise.resolve(null));
const mockRefreshChallenges = jest.fn(() => Promise.resolve(null));
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
  setMatchPresences: jest.fn(),
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
  const React = require('react');
  const { useEffect } = React;
  const { View } = require('react-native');
  return {
    BOARD_IMAGE_SOURCE: 1,
    Board: ({ onBoardImageLayout }: { onBoardImageLayout?: (layout: { x: number; y: number; width: number; height: number }) => void }) => {
      useEffect(() => {
        onBoardImageLayout?.({
          x: 0,
          y: 0,
          width: 320,
          height: 240,
        });
      }, [onBoardImageLayout]);

      return <View testID="mock-board" />;
    },
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
  const { View } = require('react-native');
  return {
    PlayTutorialCoachModal: ({ visible }: { visible: boolean }) =>
      visible ? <View testID="mock-play-tutorial-coach" /> : null,
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
  MatchMomentIndicator: (props: { cue: { message: string } | null }) => mockMatchMomentIndicator(props),
}));

jest.mock('@/components/game/SlotDiceScene', () => ({
  SlotDiceScene: () => mockSlotDiceScene(),
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
    mockRefreshProgression.mockImplementation(() => Promise.resolve(null));
    mockRefreshChallenges.mockImplementation(() => Promise.resolve(null));
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
