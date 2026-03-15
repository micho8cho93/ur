import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { createInitialState } from '@/logic/engine';
import type { MoveAction } from '@/logic/types';

const mockMatchDiceRollStage = jest.fn(({ playbackId }: { playbackId: number }) => {
  const { Text } = require('react-native');
  return <Text testID="match-dice-stage-playback">{String(playbackId)}</Text>;
});

const mockDiceRollScene = jest.fn(() => {
  const { Text } = require('react-native');
  return <Text testID="mock-inline-dice-scene">inline</Text>;
});

const mockRouterReplace = jest.fn();
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

const baseGameState = {
  ...createInitialState(),
  currentTurn: 'light' as const,
  phase: 'rolling' as const,
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
  const { View } = require('react-native');
  return {
    BOARD_IMAGE_SOURCE: 1,
    Board: () => <View testID="mock-board" />,
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
  const React = require('react');
  const { View } = require('react-native');
  return {
    GameStageHUD: () => <View testID="mock-stage-hud" />,
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
  const { View } = require('react-native');
  return {
    BoardDropIntro: () => <View testID="mock-board-drop" />,
  };
});

jest.mock('@/components/game/ReserveCascadeIntro', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    ReserveCascadeIntro: () => <View testID="mock-reserve-cascade" />,
  };
});

jest.mock('@/components/game/AudioSettingsModal', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    AudioSettingsModal: () => <View testID="mock-audio-settings" />,
  };
});

jest.mock('@/components/HowToPlayModal', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    HowToPlayModal: () => <View testID="mock-how-to-play" />,
  };
});

jest.mock('@/components/ui/Modal', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    Modal: () => <View testID="mock-modal" />,
  };
});

jest.mock('@/components/game/MatchDiceRollStage', () => ({
  MatchDiceRollStage: (props: { playbackId: number }) => mockMatchDiceRollStage(props),
}));

jest.mock('@/components/3d/DiceRollScene', () => ({
  DiceRollScene: () => mockDiceRollScene(),
}));

jest.mock('@/config/nakama', () => ({
  hasNakamaConfig: () => false,
  isNakamaEnabled: () => false,
}));

jest.mock('@/hooks/useGameLoop', () => ({
  useGameLoop: jest.fn(),
}));

jest.mock('@/services/audio', () => ({
  gameAudio: {
    getPreferences: jest.fn().mockResolvedValue({
      musicEnabled: true,
      sfxEnabled: true,
    }),
    play: jest.fn(),
    start: jest.fn().mockResolvedValue(undefined),
    setMusicEnabled: jest.fn().mockResolvedValue(undefined),
    setSfxEnabled: jest.fn().mockResolvedValue(undefined),
    stopAll: jest.fn().mockResolvedValue(undefined),
  },
}));

jest.mock('@/services/nakama', () => ({
  nakamaService: {
    disconnectSocket: jest.fn(),
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
  useLocalSearchParams: () => ({
    id: 'local-1',
    offline: '1',
  }),
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
  return ({ name }: { name: string }) => <Text>{name}</Text>;
});

import { Platform } from 'react-native';
import { GameRoom } from '@/app/match/[id]';

describe('GameRoom match dice stage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    mockStoreState.gameState = {
      ...baseGameState,
    };
    mockStoreState.validMoves = [];
    Object.defineProperty(Platform, 'OS', {
      configurable: true,
      get: () => 'ios',
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('routes iOS rolls through the external stage playback id and keeps the inline scene idle', async () => {
    render(<GameRoom />);

    await act(async () => {
      await Promise.resolve();
    });

    await act(async () => {
      fireEvent.press(screen.getByTestId('dice-roll-button'));
    });

    expect(mockRoll).toHaveBeenCalledTimes(1);
    expect(mockMatchDiceRollStage).toHaveBeenLastCalledWith(
      expect.objectContaining({
        playbackId: 1,
      }),
    );
    expect(mockDiceRollScene).not.toHaveBeenCalled();
  });
});
