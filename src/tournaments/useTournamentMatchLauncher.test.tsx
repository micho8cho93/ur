import { act, renderHook } from '@testing-library/react-native';

import { useGameStore } from '@/store/useGameStore';
import { useTournamentMatchLauncher } from './useTournamentMatchLauncher';

const mockLaunchTournamentMatch = jest.fn();
const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockRunScreenTransition = jest.fn();

jest.mock('@/services/tournaments', () => ({
  launchTournamentMatch: (...args: unknown[]) => mockLaunchTournamentMatch(...args),
}));

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
  }),
}));

jest.mock('@/src/transitions/ScreenTransitionContext', () => ({
  useScreenTransition: () => mockRunScreenTransition,
}));

describe('useTournamentMatchLauncher', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useGameStore.getState().reset();
    mockRunScreenTransition.mockImplementation(async (request: { action?: () => void | Promise<void> }) => {
      await request.action?.();
      return true;
    });
  });

  it('launches tournament matches through the shared transition helper and preserves the match params', async () => {
    mockLaunchTournamentMatch.mockResolvedValue({
      matchId: 'tournament-match-1',
      tournamentRunId: 'run-1',
      tournamentId: 'tournament-1',
      tournamentRound: 4,
      tournamentEntryId: 'entry-4',
      session: { user_id: 'user-1' },
      userId: 'user-1',
      matchToken: 'join-token-1',
    });

    const { result } = renderHook(() => useTournamentMatchLauncher());

    await act(async () => {
      await result.current.launchMatch({
        runId: 'run-1',
        tournamentId: 'tournament-1',
        gameMode: 'standard',
        name: 'Spring Open',
      });
    });

    expect(mockRunScreenTransition).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Preparing Next Board',
        message: 'Carrying your tournament seat into the next match.',
        action: expect.any(Function),
      }),
    );
    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/match/[id]',
      params: {
        id: 'tournament-match-1',
        modeId: 'standard',
        tournamentRunId: 'run-1',
        tournamentId: 'tournament-1',
        tournamentName: 'Spring Open',
        tournamentReturnTarget: 'detail',
        tournamentRound: '4',
        tournamentEntryId: 'entry-4',
      },
    });
    expect(useGameStore.getState().matchId).toBe('tournament-match-1');
  });
});
