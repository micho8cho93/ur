import { act, renderHook } from '@testing-library/react-native';

import { useGameStore } from '@/store/useGameStore';
import { useMatchmaking } from './useMatchmaking';

const mockCancelMatchmaking = jest.fn();
const mockCreateOpenMatch = jest.fn();
const mockCreatePrivateMatch = jest.fn();
const mockFindMatch = jest.fn();
const mockGetPrivateMatchStatus = jest.fn();
const mockJoinPrivateMatch = jest.fn();
const mockGetSitePlayerCount = jest.fn();
const mockPush = jest.fn();
const mockRunScreenTransition = jest.fn();
const mockResolveGameModeMatchConfig = jest.fn();

jest.mock('@/config/nakama', () => ({
  hasNakamaConfig: () => true,
  isNakamaEnabled: () => true,
}));

jest.mock('@/services/matchmaking', () => ({
  cancelMatchmaking: (...args: unknown[]) => mockCancelMatchmaking(...args),
  createOpenOnlineMatch: (...args: unknown[]) => mockCreateOpenMatch(...args),
  createPrivateMatch: (...args: unknown[]) => mockCreatePrivateMatch(...args),
  findMatch: (...args: unknown[]) => mockFindMatch(...args),
  getPrivateMatchStatus: (...args: unknown[]) => mockGetPrivateMatchStatus(...args),
  joinPrivateMatch: (...args: unknown[]) => mockJoinPrivateMatch(...args),
}));

jest.mock('@/services/gameModes', () => ({
  resolveGameModeMatchConfig: (...args: unknown[]) => mockResolveGameModeMatchConfig(...args),
}));

jest.mock('@/services/presence', () => ({
  getSitePlayerCount: (...args: unknown[]) => mockGetSitePlayerCount(...args),
}));

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

jest.mock('@/src/transitions/ScreenTransitionContext', () => ({
  useScreenTransition: () => mockRunScreenTransition,
}));

const flush = async () => {
  await Promise.resolve();
  await Promise.resolve();
};

describe('useMatchmaking', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useGameStore.getState().reset();
    mockCancelMatchmaking.mockResolvedValue(undefined);
    mockGetPrivateMatchStatus.mockResolvedValue({
      matchId: 'match-private-1',
      modeId: 'standard',
      code: 'ABCD2345',
      hasGuestJoined: false,
    });
    mockGetSitePlayerCount.mockResolvedValue(12);
    mockRunScreenTransition.mockImplementation(async (request: { action?: () => void | Promise<void> }) => {
      await request.action?.();
      return true;
    });
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
      boardAssetKey: 'board_design',
      allowsXp: true,
      allowsChallenges: true,
      allowsOnline: true,
      allowsRankedStats: true,
      allowsCoins: true,
      isPracticeMode: false,
      offlineWinRewardSource: 'pvp_win',
      opponentType: 'bot',
      pathVariant: 'default',
      throwProfile: 'standard',
      bonusTurnOnRosette: true,
      bonusTurnOnCapture: false,
      selectionSubtitle: 'Quick Play',
      rulesIntro: null,
    });
  });

  it('routes public matchmaking through the shared transition helper before pushing the match route', async () => {
    mockFindMatch.mockResolvedValue({
      matchId: 'match-public-1',
      session: { user_id: 'user-1' },
      userId: 'user-1',
      matchmakerTicket: 'ticket-1',
      playerColor: 'light',
      matchToken: 'join-token-1',
    });

    const { result } = renderHook(() => useMatchmaking('online'));

    await act(async () => {
      await flush();
    });

    await act(async () => {
      await result.current.startMatch();
    });

    expect(mockRunScreenTransition).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Match Found',
        message: 'Seating both players and preparing the board.',
        action: expect.any(Function),
      }),
    );
    expect(mockPush).toHaveBeenCalledWith('/match/match-public-1');
    expect(useGameStore.getState().matchId).toBe('match-public-1');
  });

  it('routes private code joins through the shared transition helper and preserves the private params', async () => {
    mockJoinPrivateMatch.mockResolvedValue({
      matchId: 'match-private-1',
      modeId: 'standard',
      code: 'ABCD2345',
      session: { user_id: 'user-2' },
      userId: 'user-2',
    });

    const { result } = renderHook(() => useMatchmaking('online'));

    await act(async () => {
      await flush();
    });

    await act(async () => {
      await result.current.joinPrivateMatchByCode('ABCD2345');
    });

    expect(mockRunScreenTransition).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Joining Private Table',
        message: 'Connecting your code and opening the private board.',
        action: expect.any(Function),
      }),
    );
    expect(mockPush).toHaveBeenCalledWith(
      '/match/match-private-1?modeId=standard&privateMatch=1&privateCode=ABCD2345',
    );
  });

  it('reapplies the host private match session before opening a created private table', async () => {
    mockCreatePrivateMatch.mockResolvedValue({
      matchId: 'match-private-host-1',
      modeId: 'gameMode_3_pieces',
      code: 'CAPTURE1',
      session: { user_id: 'host-1' },
      userId: 'host-1',
    });

    const { result } = renderHook(() => useMatchmaking('online'));

    await act(async () => {
      await flush();
    });

    await act(async () => {
      await result.current.startPrivateMatch('gameMode_3_pieces');
    });

    expect(result.current.createdPrivateMatch).toEqual(
      expect.objectContaining({
        matchId: 'match-private-host-1',
        modeId: 'gameMode_3_pieces',
        code: 'CAPTURE1',
        hasGuestJoined: false,
      }),
    );

    act(() => {
      useGameStore.getState().setOnlineMode('offline');
      useGameStore.getState().setNakamaSession(null);
      useGameStore.getState().setUserId(null);
    });

    await act(async () => {
      await result.current.startCreatedPrivateMatch();
    });

    expect(mockRunScreenTransition).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Opening Private Table',
        message: 'Laying out the private board and seating both players.',
        action: expect.any(Function),
      }),
    );
    expect(useGameStore.getState().onlineMode).toBe('nakama');
    expect(useGameStore.getState().nakamaSession).toEqual(expect.objectContaining({ user_id: 'host-1' }));
    expect(useGameStore.getState().userId).toBe('host-1');
    expect(mockPush).toHaveBeenCalledWith(
      '/match/match-private-host-1?modeId=gameMode_3_pieces&privateMatch=1&privateHost=1&privateCode=CAPTURE1',
    );
    expect(result.current.createdPrivateMatch).toEqual(
      expect.objectContaining({
        matchId: 'match-private-host-1',
        modeId: 'gameMode_3_pieces',
        code: 'CAPTURE1',
        hasGuestJoined: false,
      }),
    );
  });

  it('opens a created open match directly into the board flow', async () => {
    mockCreateOpenMatch.mockResolvedValue({
      match: {
        openMatchId: 'open-1',
        matchId: 'match-open-1',
        modeId: 'standard',
        creatorUserId: 'user-1',
        joinedUserId: null,
        wager: 20,
        durationMinutes: 5,
        status: 'open',
        createdAt: '2026-04-18T10:00:00.000Z',
        expiresAt: '2026-04-18T10:05:00.000Z',
        updatedAt: '2026-04-18T10:00:00.000Z',
        entrants: 1,
        maxEntrants: 2,
        isCreator: true,
        isJoiner: false,
      },
      session: { user_id: 'user-1' },
      userId: 'user-1',
    });

    const { result } = renderHook(() => useMatchmaking('online'));

    await act(async () => {
      await flush();
    });

    await act(async () => {
      await result.current.createOpenMatch(20, 5, 'standard');
    });

    expect(mockRunScreenTransition).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Opening Wager Match',
        message: 'Creating your table and seating you at the board.',
        action: expect.any(Function),
      }),
    );
    expect(mockResolveGameModeMatchConfig).toHaveBeenCalledWith(
      'standard',
      expect.objectContaining({
        allowsXp: true,
        allowsChallenges: true,
        allowsCoins: true,
        allowsOnline: true,
        allowsRankedStats: true,
        isPracticeMode: false,
      }),
    );
    expect(mockPush).toHaveBeenCalledWith('/match/match-open-1?modeId=standard');
    expect(useGameStore.getState().matchId).toBe('match-open-1');
    expect(useGameStore.getState().playerColor).toBeNull();
  });

  it('marks offline bot matches with a light player color immediately', async () => {
    const { result } = renderHook(() => useMatchmaking('bot'));

    await act(async () => {
      await flush();
    });

    await act(async () => {
      await result.current.startBotGame('easy');
    });

    expect(useGameStore.getState().onlineMode).toBe('offline');
    expect(useGameStore.getState().playerColor).toBe('light');
    expect(mockPush).toHaveBeenCalled();
    expect(String(mockPush.mock.calls[0]?.[0])).toContain('/match/local-');
  });

  it('keeps the created private code visible when opening the host table fails', async () => {
    mockCreatePrivateMatch.mockResolvedValue({
      matchId: 'match-private-host-2',
      modeId: 'gameMode_3_pieces',
      code: 'RACE1234',
      session: { user_id: 'host-2' },
      userId: 'host-2',
    });
    mockPush.mockImplementation(() => {
      throw new Error('Navigation failed.');
    });

    const { result } = renderHook(() => useMatchmaking('online'));

    await act(async () => {
      await flush();
    });

    await act(async () => {
      await result.current.startPrivateMatch('gameMode_3_pieces');
    });

    await act(async () => {
      await result.current.startCreatedPrivateMatch();
    });

    expect(result.current.createdPrivateMatch).toEqual(
      expect.objectContaining({
        matchId: 'match-private-host-2',
        modeId: 'gameMode_3_pieces',
        code: 'RACE1234',
      }),
    );
    expect(result.current.errorMessage).toBe('Navigation failed.');
    expect(result.current.status).toBe('error');
  });
});
