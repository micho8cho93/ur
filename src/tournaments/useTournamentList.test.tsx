import { act, renderHook } from '@testing-library/react-native';

import {
  TOURNAMENT_BRACKET_READY_NOTIFICATION_CODE,
  TOURNAMENT_BRACKET_READY_NOTIFICATION_SUBJECT,
  TOURNAMENT_BRACKET_READY_NOTIFICATION_TYPE,
} from '@/shared/tournamentNotifications';
import { useTournamentUiStore } from '@/src/tournaments/store';
import type { PublicTournamentSummary } from '@/src/tournaments/types';
import { useTournamentList } from './useTournamentList';

const mockListPublicTournaments = jest.fn();
const mockJoinPublicTournament = jest.fn();
const mockLaunchMatch = jest.fn();
const mockUseFocusEffect = jest.fn();
const mockConnectSocketWithRetry = jest.fn();
const mockSocket = {
  ondisconnect: undefined as ((event: Event) => void) | undefined,
  onnotification: undefined as ((notification: unknown) => void) | undefined,
};

jest.mock('@/services/tournaments', () => ({
  joinPublicTournament: (...args: unknown[]) => mockJoinPublicTournament(...args),
  listPublicTournaments: (...args: unknown[]) => mockListPublicTournaments(...args),
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

const buildTournament = (overrides: Partial<PublicTournamentSummary> = {}): PublicTournamentSummary => ({
  runId: 'run-1',
  tournamentId: 'tour-1',
  name: 'Spring Open',
  description: 'A public run.',
  lifecycle: 'open',
  startAt: '2026-03-27T09:00:00.000Z',
  endAt: null,
  updatedAt: '2026-03-27T10:00:00.000Z',
  lobbyDeadlineAt: null,
  entrants: 16,
  maxEntrants: 32,
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
  isLocked: false,
  currentRound: 1,
  membership: {
    isJoined: false,
    joinedAt: null,
  },
  participation: {
    state: null,
    currentRound: null,
    currentEntryId: null,
    activeMatchId: null,
    finalPlacement: null,
    lastResult: null,
    canLaunch: false,
  },
  ...overrides,
});

describe('useTournamentList', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useTournamentUiStore.setState({ revision: 0 });
    mockSocket.ondisconnect = undefined;
    mockSocket.onnotification = undefined;
    mockConnectSocketWithRetry.mockResolvedValue(mockSocket);
  });

  it('refreshes immediately when a bracket-ready socket notification arrives', async () => {
    mockListPublicTournaments
      .mockResolvedValueOnce([buildTournament({ name: 'Before Bracket Start' })])
      .mockResolvedValueOnce([buildTournament({ name: 'After Bracket Start', entrants: 18 })]);

    const { result } = renderHook(() => useTournamentList());

    await act(async () => {
      await flush();
    });

    expect(result.current.tournaments[0]?.name).toBe('Before Bracket Start');
    expect(mockListPublicTournaments).toHaveBeenCalledTimes(1);
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

    expect(mockListPublicTournaments).toHaveBeenCalledTimes(2);
    expect(result.current.tournaments[0]?.name).toBe('After Bracket Start');
  });

  it('skips interval polling while socket notifications are attached', async () => {
    mockListPublicTournaments.mockResolvedValue([buildTournament()]);

    renderHook(() => useTournamentList());

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
    mockListPublicTournaments.mockResolvedValue([buildTournament()]);

    renderHook(() => useTournamentList());

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

    expect(setIntervalSpy).toHaveBeenCalledWith(expect.any(Function), 10_000);
    cleanup?.();
    setIntervalSpy.mockRestore();
  });
});
