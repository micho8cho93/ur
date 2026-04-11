import { act, renderHook } from '@testing-library/react-native';

import {
  TOURNAMENT_BRACKET_READY_NOTIFICATION_CODE,
  TOURNAMENT_BRACKET_READY_NOTIFICATION_SUBJECT,
  TOURNAMENT_BRACKET_READY_NOTIFICATION_TYPE,
} from '@/shared/tournamentNotifications';
import { useTournamentUiStore } from '@/src/tournaments/store';
import type { PublicTournamentDetail, PublicTournamentStanding } from '@/src/tournaments/types';
import { useTournamentDetail } from './useTournamentDetail';

const mockGetPublicTournamentStatus = jest.fn();
const mockJoinPublicTournament = jest.fn();
const mockLaunchMatch = jest.fn();
const mockUseFocusEffect = jest.fn();
const mockConnectSocketWithRetry = jest.fn();
const mockSocket = {
  onnotification: undefined as ((notification: unknown) => void) | undefined,
};

jest.mock('@/services/tournaments', () => ({
  getPublicTournamentStatus: (...args: unknown[]) => mockGetPublicTournamentStatus(...args),
  joinPublicTournament: (...args: unknown[]) => mockJoinPublicTournament(...args),
}));

jest.mock('@/services/nakama', () => ({
  nakamaService: {
    connectSocketWithRetry: (...args: unknown[]) => mockConnectSocketWithRetry(...args),
  },
}));

jest.mock('@react-navigation/native', () => ({
  useFocusEffect: (callback: () => void | (() => void)) => {
    mockUseFocusEffect(callback);
  },
}));

jest.mock('@/src/tournaments/useTournamentMatchLauncher', () => ({
  useTournamentMatchLauncher: () => ({
    launchingRunId: null,
    launchMatch: (...args: unknown[]) => mockLaunchMatch(...args),
  }),
}));

const flush = async () => {
  await Promise.resolve();
  await Promise.resolve();
};

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

const buildTournament = (overrides: Partial<PublicTournamentDetail> = {}): PublicTournamentDetail => ({
  runId: 'run-1',
  tournamentId: 'tour-1',
  name: 'Spring Open',
  description: 'A public run.',
  lifecycle: 'open',
  startAt: '2026-03-27T09:00:00.000Z',
  endAt: null,
  updatedAt: '2026-03-27T10:00:00.000Z',
  lobbyDeadlineAt: '2026-03-27T09:05:00.000Z',
  entrants: 16,
  maxEntrants: 16,
  gameMode: 'standard',
  region: 'Global',
  buyInLabel: 'Free',
  prizeLabel: 'No prize listed',
  xpPerMatchWin: 150,
  xpForTournamentChampion: 450,
  bots: {
    autoAdd: false,
    difficulty: null,
    count: 0,
  },
  isLocked: true,
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
  ...overrides,
});

const buildStanding = (overrides: Partial<PublicTournamentStanding> = {}): PublicTournamentStanding => ({
  rank: 1,
  ownerId: 'user-1',
  username: 'Michel',
  score: 1,
  subscore: 0,
  attempts: 1,
  maxAttempts: 3,
  matchId: 'match-1',
  round: 1,
  result: 'win',
  updatedAt: '2026-03-27T10:00:00.000Z',
  metadata: {},
  ...overrides,
});

describe('useTournamentDetail', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useTournamentUiStore.setState({ revision: 0 });
    mockSocket.onnotification = undefined;
    mockConnectSocketWithRetry.mockResolvedValue(mockSocket);
  });

  it('ignores stale out-of-order refresh responses', async () => {
    const staleRefresh = createDeferred<{ tournament: PublicTournamentDetail; standings: PublicTournamentStanding[] }>();
    const latestRefresh = createDeferred<{ tournament: PublicTournamentDetail; standings: PublicTournamentStanding[] }>();

    mockGetPublicTournamentStatus
      .mockReturnValueOnce(staleRefresh.promise)
      .mockReturnValueOnce(latestRefresh.promise);

    const { result } = renderHook(() => useTournamentDetail('run-1'));

    await act(async () => {
      void result.current.refresh();
      await flush();
    });

    await act(async () => {
      latestRefresh.resolve({
        tournament: buildTournament({
          name: 'Fresh Snapshot',
          updatedAt: '2026-03-27T10:05:00.000Z',
        }),
        standings: [buildStanding({ score: 2 })],
      });
      await flush();
    });

    expect(result.current.tournament?.name).toBe('Fresh Snapshot');
    expect(result.current.standings[0]?.score).toBe(2);

    await act(async () => {
      staleRefresh.resolve({
        tournament: buildTournament({
          name: 'Stale Snapshot',
          updatedAt: '2026-03-27T09:55:00.000Z',
        }),
        standings: [buildStanding({ score: 1 })],
      });
      await flush();
    });

    expect(result.current.tournament?.name).toBe('Fresh Snapshot');
    expect(result.current.standings[0]?.score).toBe(2);
  });

  it('ignores stale refresh errors after a newer refresh succeeds', async () => {
    const staleRefresh = createDeferred<{ tournament: PublicTournamentDetail; standings: PublicTournamentStanding[] }>();
    const latestRefresh = createDeferred<{ tournament: PublicTournamentDetail; standings: PublicTournamentStanding[] }>();

    mockGetPublicTournamentStatus
      .mockReturnValueOnce(staleRefresh.promise)
      .mockReturnValueOnce(latestRefresh.promise);

    const { result } = renderHook(() => useTournamentDetail('run-1'));

    await act(async () => {
      void result.current.refresh();
      await flush();
    });

    await act(async () => {
      latestRefresh.resolve({
        tournament: buildTournament({
          name: 'Fresh Snapshot',
          updatedAt: '2026-03-27T10:06:00.000Z',
        }),
        standings: [buildStanding({ score: 3 })],
      });
      await flush();
    });

    await act(async () => {
      staleRefresh.reject(new Error('Stale request failed.'));
      await flush();
    });

    expect(result.current.tournament?.name).toBe('Fresh Snapshot');
    expect(result.current.errorMessage).toBeNull();
  });

  it('refreshes immediately when a bracket-ready socket notification arrives for this run', async () => {
    mockGetPublicTournamentStatus
      .mockResolvedValueOnce({
        tournament: buildTournament({
          name: 'Before Bracket Start',
          updatedAt: '2026-03-27T10:00:00.000Z',
        }),
        standings: [buildStanding({ score: 1 })],
      })
      .mockResolvedValueOnce({
        tournament: buildTournament({
          name: 'After Bracket Start',
          updatedAt: '2026-03-27T10:01:00.000Z',
          participation: {
            ...buildTournament().participation,
            canLaunch: true,
          },
        }),
        standings: [buildStanding({ score: 2 })],
      });

    const { result } = renderHook(() => useTournamentDetail('run-1'));

    await act(async () => {
      await flush();
    });

    expect(result.current.tournament?.name).toBe('Before Bracket Start');
    expect(mockGetPublicTournamentStatus).toHaveBeenCalledTimes(1);
    expect(typeof mockSocket.onnotification).toBe('function');

    await act(async () => {
      mockSocket.onnotification?.({
        code: TOURNAMENT_BRACKET_READY_NOTIFICATION_CODE,
        subject: TOURNAMENT_BRACKET_READY_NOTIFICATION_SUBJECT,
        content: {
          type: TOURNAMENT_BRACKET_READY_NOTIFICATION_TYPE,
          runId: 'run-1',
          tournamentId: 'tour-1',
          startedAt: '2026-03-27T10:01:00.000Z',
        },
      });
      await flush();
    });

    expect(mockGetPublicTournamentStatus).toHaveBeenCalledTimes(2);
    expect(result.current.tournament?.name).toBe('After Bracket Start');
  });

  it('skips interval polling while socket notifications are attached', async () => {
    mockGetPublicTournamentStatus.mockResolvedValue({
      tournament: buildTournament(),
      standings: [buildStanding()],
    });

    renderHook(() => useTournamentDetail('run-1'));

    await act(async () => {
      await flush();
    });

    const focusCallback = mockUseFocusEffect.mock.calls.at(-1)?.[0] as () => void | (() => void);
    const setIntervalSpy = jest.spyOn(global, 'setInterval');

    let cleanup: void | (() => void);
    await act(async () => {
      cleanup = focusCallback();
      await flush();
    });

    expect(setIntervalSpy).not.toHaveBeenCalled();
    cleanup?.();
    setIntervalSpy.mockRestore();
  });

  it('keeps polling through intervals when socket notifications are unavailable', async () => {
    mockConnectSocketWithRetry.mockRejectedValueOnce(new Error('Socket unavailable'));
    mockGetPublicTournamentStatus.mockResolvedValue({
      tournament: buildTournament(),
      standings: [buildStanding()],
    });

    renderHook(() => useTournamentDetail('run-1'));

    await act(async () => {
      await flush();
    });

    const focusCallback = mockUseFocusEffect.mock.calls.at(-1)?.[0] as () => void | (() => void);
    const setIntervalSpy = jest.spyOn(global, 'setInterval');

    let cleanup: void | (() => void);
    await act(async () => {
      cleanup = focusCallback();
      await flush();
    });

    expect(setIntervalSpy).toHaveBeenCalledWith(expect.any(Function), 4_000);
    cleanup?.();
    setIntervalSpy.mockRestore();
  });
});
