import { render, waitFor } from '@testing-library/react-native';
import React from 'react';
import { OpenOnlineMatchMonitor } from './OpenOnlineMatchMonitor';

const mockReplace = jest.fn();
const mockGetActiveOpenOnlineMatch = jest.fn();
const mockEnsureAuthenticatedDevice = jest.fn();
const mockRunScreenTransition = jest.fn();
const mockResolveGameModeMatchConfig = jest.fn();
const mockUseAuth = jest.fn();
const mockGetState = jest.fn();

jest.mock('@/config/nakama', () => ({
  isNakamaEnabled: () => true,
}));

jest.mock('@/src/auth/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}));

jest.mock('@/services/matchmaking', () => ({
  getActiveOpenOnlineMatch: (...args: unknown[]) => mockGetActiveOpenOnlineMatch(...args),
}));

jest.mock('@/services/gameModes', () => ({
  resolveGameModeMatchConfig: (...args: unknown[]) => mockResolveGameModeMatchConfig(...args),
}));

jest.mock('@/services/nakama', () => ({
  nakamaService: {
    ensureAuthenticatedDevice: (...args: unknown[]) => mockEnsureAuthenticatedDevice(...args),
  },
}));

jest.mock('@/src/transitions/ScreenTransitionContext', () => ({
  useScreenTransition: () => mockRunScreenTransition,
}));

jest.mock('expo-router', () => ({
  usePathname: () => '/(game)/lobby',
  useRouter: () => ({
    replace: mockReplace,
  }),
}));

jest.mock('@/store/useGameStore', () => ({
  useGameStore: {
    getState: (...args: unknown[]) => mockGetState(...args),
  },
}));

describe('OpenOnlineMatchMonitor', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({
      user: { id: 'user-1', nakamaUserId: 'user-1' },
      isLoading: false,
    });
    mockEnsureAuthenticatedDevice.mockResolvedValue({
      user_id: 'user-1',
      token: 'token',
      refresh_token: 'refresh',
    });
    mockRunScreenTransition.mockResolvedValue(false);
    mockResolveGameModeMatchConfig.mockResolvedValue({
      modeId: 'standard',
      displayName: 'Quick Play',
      baseRulesetPreset: 'quick_play',
      pieceCountPerSide: 7,
      rulesVariant: 'standard',
      rosetteSafetyMode: 'standard',
      exitStyle: 'standard',
      eliminationMode: 'return_to_start',
      fogOfWar: false,
      allowsXp: true,
      allowsChallenges: true,
      allowsCoins: true,
      allowsOnline: true,
      allowsRankedStats: true,
      isPracticeMode: false,
      offlineWinRewardSource: 'pvp_win',
      opponentType: 'human',
      pathVariant: 'default',
      throwProfile: 'standard',
      bonusTurnOnRosette: true,
      bonusTurnOnCapture: false,
      selectionSubtitle: 'Classic seven-piece rules.',
      rulesIntro: null,
    });
    mockGetState.mockReturnValue({
      onlineMode: 'nakama',
      matchId: 'match-1',
      gameState: {
        winner: null,
        phase: 'rolling',
      },
      setNakamaSession: jest.fn(),
      setUserId: jest.fn(),
      setMatchToken: jest.fn(),
      setOnlineMode: jest.fn(),
      setPlayerColor: jest.fn(),
      initGame: jest.fn(),
      setSocketState: jest.fn(),
      reset: jest.fn(),
    });
  });

  it('reopens the creator table when an open wager match is still waiting', async () => {
    mockGetActiveOpenOnlineMatch.mockResolvedValue({
      openMatchId: 'open-1',
      matchId: 'match-1',
      modeId: 'standard',
      creatorUserId: 'user-1',
      joinedUserId: null,
      wager: 40,
      durationMinutes: 5,
      status: 'open',
      createdAt: '2026-04-18T10:00:00.000Z',
      expiresAt: '2026-04-18T10:05:00.000Z',
      updatedAt: '2026-04-18T10:00:00.000Z',
      entrants: 1,
      maxEntrants: 2,
      isCreator: true,
      isJoiner: false,
    });

    render(<OpenOnlineMatchMonitor />);

    await waitFor(() =>
      expect(mockRunScreenTransition).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Returning to Table',
          message: 'Your wager match is still waiting. Reopening the board now.',
        }),
      ),
    );

    await waitFor(() =>
      expect(mockReplace).toHaveBeenCalledWith('/match/match-1?modeId=standard'),
    );
  });

  it('resumes the joiner table when their open wager match is already matched', async () => {
    mockGetActiveOpenOnlineMatch.mockResolvedValue({
      openMatchId: 'open-2',
      matchId: 'match-2',
      modeId: 'gameMode_3_pieces',
      creatorUserId: 'creator-1',
      joinedUserId: 'user-1',
      wager: 40,
      durationMinutes: 5,
      status: 'matched',
      createdAt: '2026-04-18T10:00:00.000Z',
      expiresAt: '2026-04-18T10:05:00.000Z',
      updatedAt: '2026-04-18T10:01:00.000Z',
      entrants: 2,
      maxEntrants: 2,
      isCreator: false,
      isJoiner: true,
    });
    mockGetState.mockReturnValue({
      onlineMode: 'nakama',
      matchId: 'match-2',
      gameState: {
        winner: null,
        phase: 'rolling',
      },
      setNakamaSession: jest.fn(),
      setUserId: jest.fn(),
      setMatchToken: jest.fn(),
      setOnlineMode: jest.fn(),
      setPlayerColor: jest.fn(),
      initGame: jest.fn(),
      setSocketState: jest.fn(),
      reset: jest.fn(),
    });
    mockResolveGameModeMatchConfig.mockResolvedValue({
      modeId: 'gameMode_3_pieces',
      displayName: 'Race',
      baseRulesetPreset: 'race',
      pieceCountPerSide: 3,
      rulesVariant: 'standard',
      rosetteSafetyMode: 'standard',
      exitStyle: 'standard',
      eliminationMode: 'return_to_start',
      fogOfWar: false,
      allowsXp: true,
      allowsChallenges: true,
      allowsCoins: true,
      allowsOnline: true,
      allowsRankedStats: true,
      isPracticeMode: false,
      offlineWinRewardSource: 'pvp_win',
      opponentType: 'human',
      pathVariant: 'default',
      throwProfile: 'standard',
      bonusTurnOnRosette: true,
      bonusTurnOnCapture: false,
      selectionSubtitle: 'Three pieces per side with the standard capture rules.',
      rulesIntro: null,
    });

    render(<OpenOnlineMatchMonitor />);

    await waitFor(() =>
      expect(mockRunScreenTransition).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Returning to Table',
          message: 'Your wager match is ready. Reopening the board now.',
        }),
      ),
    );

    await waitFor(() =>
      expect(mockReplace).toHaveBeenCalledWith('/match/match-2?modeId=gameMode_3_pieces'),
    );
  });
});
