import { act, renderHook } from '@testing-library/react-native';

import { useGameStore } from '@/store/useGameStore';
import { useMatchmaking } from './useMatchmaking';

const mockCancelMatchmaking = jest.fn();
const mockCreatePrivateMatch = jest.fn();
const mockFindMatch = jest.fn();
const mockGetPrivateMatchStatus = jest.fn();
const mockJoinPrivateMatch = jest.fn();
const mockGetSitePlayerCount = jest.fn();
const mockPush = jest.fn();
const mockRunScreenTransition = jest.fn();

jest.mock('@/config/nakama', () => ({
  hasNakamaConfig: () => true,
  isNakamaEnabled: () => true,
}));

jest.mock('@/services/matchmaking', () => ({
  cancelMatchmaking: (...args: unknown[]) => mockCancelMatchmaking(...args),
  createPrivateMatch: (...args: unknown[]) => mockCreatePrivateMatch(...args),
  findMatch: (...args: unknown[]) => mockFindMatch(...args),
  getPrivateMatchStatus: (...args: unknown[]) => mockGetPrivateMatchStatus(...args),
  joinPrivateMatch: (...args: unknown[]) => mockJoinPrivateMatch(...args),
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
    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/match/[id]',
      params: {
        id: 'match-private-1',
        modeId: 'standard',
        privateMatch: '1',
        privateCode: 'ABCD2345',
      },
    });
  });
});
