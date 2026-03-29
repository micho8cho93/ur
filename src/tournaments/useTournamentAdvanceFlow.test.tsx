import { act, render, screen } from '@testing-library/react-native';
import React from 'react';
import { Text } from 'react-native';

import type { PublicTournamentStanding, TournamentParticipationState } from '@/src/tournaments/types';
import { useTournamentAdvanceFlow, type UseTournamentAdvanceFlowResult } from './useTournamentAdvanceFlow';

const mockGetPublicTournamentStatus = jest.fn();
const mockLaunchTournamentMatch = jest.fn();
const mockFinalizeMatchLaunch = jest.fn();
const READY_JOINING_DELAY_MS = 720;
const mockTournamentMatchLauncher = {
  finalizeMatchLaunch: (...args: unknown[]) => mockFinalizeMatchLaunch(...args),
};

jest.mock('@/services/tournaments', () => ({
  getPublicTournamentStatus: (...args: unknown[]) => mockGetPublicTournamentStatus(...args),
  launchTournamentMatch: (...args: unknown[]) => mockLaunchTournamentMatch(...args),
}));

jest.mock('@/src/tournaments/useTournamentMatchLauncher', () => ({
  useTournamentMatchLauncher: () => mockTournamentMatchLauncher,
}));

type HarnessProps = {
  enabled: boolean;
  runId: string | null;
  tournamentId: string | null;
  tournamentName: string;
  gameMode: string;
  didPlayerWin: boolean;
  playerUserId: string | null;
  finishedMatchId: string | null;
  initialRound?: number | null;
  onState?: (state: UseTournamentAdvanceFlowResult) => void;
};

function HookHarness({ onState, ...props }: HarnessProps) {
  const state = useTournamentAdvanceFlow(props);

  React.useEffect(() => {
    onState?.(state);
  }, [onState, state]);

  return (
    <>
      <Text testID="phase">{state.phase}</Text>
      <Text testID="status">{state.statusText}</Text>
    </>
  );
}

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

const buildStanding = (overrides: Partial<PublicTournamentStanding>): PublicTournamentStanding => ({
  rank: 4,
  ownerId: 'user-1',
  username: 'Michel',
  score: 4,
  subscore: 1,
  attempts: 2,
  maxAttempts: 3,
  matchId: 'match-finished',
  round: 2,
  result: 'win',
  updatedAt: '2026-03-27T10:00:00.000Z',
  metadata: {},
  ...overrides,
});

const buildParticipation = (
  overrides: Partial<TournamentParticipationState> = {},
): TournamentParticipationState => ({
  state: 'waiting_next_round',
  currentRound: 3,
  currentEntryId: 'entry-3',
  activeMatchId: null,
  finalPlacement: null,
  lastResult: 'win',
  canLaunch: false,
  ...overrides,
});

const buildSnapshot = (
  standings: PublicTournamentStanding[],
  options: {
    lifecycle?: 'open' | 'finalized' | 'closed';
    isLocked?: boolean;
    currentRound?: number | null;
    participation?: TournamentParticipationState;
  } = {},
) => ({
  tournament: {
    runId: 'run-1',
    tournamentId: 'tournament-1',
    name: 'Spring Open',
    description: 'A public run.',
    lifecycle: options.lifecycle ?? 'open',
    startAt: '2026-03-27T09:00:00.000Z',
    endAt: null,
    updatedAt: '2026-03-27T10:00:00.000Z',
    entrants: 8,
    maxEntrants: 16,
    gameMode: 'standard',
    region: 'Global',
    buyInLabel: 'Free',
    prizeLabel: 'No prize listed',
    isLocked: options.isLocked ?? true,
    currentRound: options.currentRound ?? options.participation?.currentRound ?? 3,
    membership: {
      isJoined: true,
      joinedAt: '2026-03-27T09:00:00.000Z',
    },
    participation: options.participation ?? buildParticipation(),
  },
  standings,
});

describe('useTournamentAdvanceFlow', () => {
  const baseProps: HarnessProps = {
    enabled: true,
    runId: 'run-1',
    tournamentId: 'tournament-1',
    tournamentName: 'Spring Open',
    gameMode: 'standard',
    didPlayerWin: true,
    playerUserId: 'user-1',
    finishedMatchId: 'match-finished',
    initialRound: 2,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('starts in waiting after a tournament win while the bracket result catches up', async () => {
    mockGetPublicTournamentStatus.mockResolvedValue(
      buildSnapshot(
        [
          buildStanding({
            matchId: 'previous-match',
            updatedAt: '2026-03-27T09:40:00.000Z',
          }),
        ],
        {
          participation: buildParticipation({
            lastResult: null,
            canLaunch: false,
          }),
        },
      ),
    );

    render(<HookHarness {...baseProps} />);

    await act(async () => {
      await flush();
    });

    expect(screen.getByTestId('phase').props.children).toBe('waiting');
    expect(screen.getByTestId('status').props.children).toBe('Recording your victory in the bracket...');
    expect(mockLaunchTournamentMatch).not.toHaveBeenCalled();
  });

  it('launches the next round once the bracket marks the player ready', async () => {
    mockGetPublicTournamentStatus.mockResolvedValue(
      buildSnapshot(
        [
          buildStanding({ ownerId: 'user-1', username: 'Michel' }),
          buildStanding({
            ownerId: 'user-2',
            username: 'Opponent',
            rank: 5,
            matchId: 'match-opponent',
            updatedAt: '2026-03-27T10:02:00.000Z',
          }),
        ],
        {
          participation: buildParticipation({
            canLaunch: true,
            lastResult: 'win',
          }),
        },
      ),
    );
    mockLaunchTournamentMatch.mockResolvedValue({
      matchId: 'match-next',
      matchToken: null,
      tournamentRunId: 'run-1',
      tournamentId: 'tournament-1',
      tournamentRound: 3,
      tournamentEntryId: 'entry-3',
      playerState: 'advancing',
      nextRoundReady: true,
      statusMessage: 'Opponent found.',
      queueStatus: 'matched',
      statusMetadata: {},
      session: { token: 'session-token' },
      userId: 'user-1',
    });

    render(<HookHarness {...baseProps} />);

    await act(async () => {
      await flush();
    });

    expect(screen.getByTestId('phase').props.children).toBe('ready');

    await act(async () => {
      jest.advanceTimersByTime(READY_JOINING_DELAY_MS);
      await flush();
    });

    expect(mockLaunchTournamentMatch).toHaveBeenCalledWith('run-1');
    expect(mockFinalizeMatchLaunch).toHaveBeenCalledWith(
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

  it('keeps launch attempts single-flight while a ready launch is still pending', async () => {
    mockGetPublicTournamentStatus.mockResolvedValue(
      buildSnapshot(
        [
          buildStanding({ ownerId: 'user-1', username: 'Michel' }),
          buildStanding({
            ownerId: 'user-2',
            username: 'Opponent',
            rank: 5,
            matchId: 'match-opponent',
            updatedAt: '2026-03-27T10:02:00.000Z',
          }),
        ],
        {
          participation: buildParticipation({
            canLaunch: true,
            lastResult: 'win',
          }),
        },
      ),
    );

    const deferredLaunch = createDeferred<{
      matchId: string;
      matchToken: null;
      tournamentRunId: string;
      tournamentId: string;
      tournamentRound: number | null;
      tournamentEntryId: string | null;
      playerState: string | null;
      nextRoundReady: boolean | null;
      statusMessage: string | null;
      queueStatus: string | null;
      statusMetadata: Record<string, unknown>;
      session: { token: string };
      userId: string;
    }>();
    mockLaunchTournamentMatch.mockReturnValue(deferredLaunch.promise);

    render(<HookHarness {...baseProps} />);

    await act(async () => {
      await flush();
      jest.advanceTimersByTime(READY_JOINING_DELAY_MS);
      await flush();
      jest.advanceTimersByTime(10_000);
      await flush();
    });

    expect(mockLaunchTournamentMatch).toHaveBeenCalledTimes(1);

    await act(async () => {
      deferredLaunch.resolve({
        matchId: 'match-next',
        matchToken: null,
        tournamentRunId: 'run-1',
        tournamentId: 'tournament-1',
        tournamentRound: 3,
        tournamentEntryId: 'entry-3',
        playerState: 'advancing',
        nextRoundReady: true,
        statusMessage: 'Opponent found.',
        queueStatus: 'matched',
        statusMetadata: {},
        session: { token: 'session-token' },
        userId: 'user-1',
      });
      await flush();
    });
  });

  it('falls back to retrying and resumes polling with backoff after a soft launch failure', async () => {
    mockGetPublicTournamentStatus
      .mockResolvedValueOnce(
        buildSnapshot(
          [
            buildStanding({ ownerId: 'user-1', username: 'Michel' }),
            buildStanding({
              ownerId: 'user-2',
              username: 'Opponent',
              rank: 5,
              matchId: 'match-opponent',
              updatedAt: '2026-03-27T10:02:00.000Z',
            }),
          ],
          {
            participation: buildParticipation({
              canLaunch: true,
              lastResult: 'win',
            }),
          },
        ),
      )
      .mockResolvedValueOnce(
        buildSnapshot(
          [
            buildStanding({
              ownerId: 'user-1',
              username: 'Michel',
              updatedAt: '2026-03-27T10:04:00.000Z',
            }),
          ],
          {
            participation: buildParticipation({
              canLaunch: false,
              lastResult: 'win',
            }),
          },
        ),
      );
    mockLaunchTournamentMatch.mockRejectedValue(new Error('Next round not ready yet.'));

    render(<HookHarness {...baseProps} />);

    await act(async () => {
      await flush();
      jest.advanceTimersByTime(READY_JOINING_DELAY_MS);
      await flush();
    });

    expect(screen.getByTestId('phase').props.children).toBe('retrying');

    await act(async () => {
      jest.advanceTimersByTime(12_000);
      await flush();
    });

    expect(mockGetPublicTournamentStatus).toHaveBeenCalledTimes(2);
  });

  it('rejects stale refresh responses after the flow is reset', async () => {
    const deferredStatus = createDeferred<ReturnType<typeof buildSnapshot>>();
    let latestState: UseTournamentAdvanceFlowResult | null = null;

    mockGetPublicTournamentStatus.mockReturnValue(deferredStatus.promise);

    const view = render(
      <HookHarness
        {...baseProps}
        onState={(state) => {
          latestState = state;
        }}
      />,
    );

    view.rerender(
      <HookHarness
        {...baseProps}
        enabled={false}
        onState={(state) => {
          latestState = state;
        }}
      />,
    );

    await act(async () => {
      deferredStatus.resolve(
        buildSnapshot(
          [
            buildStanding({ ownerId: 'user-1', username: 'Michel' }),
          ],
          {
            participation: buildParticipation({
              canLaunch: false,
            }),
          },
        ),
      );
      await flush();
    });

    const resolvedLatestState = latestState as UseTournamentAdvanceFlowResult | null;
    expect(resolvedLatestState?.isActive).toBe(false);
    expect(resolvedLatestState?.tournament).toBeNull();
    expect(mockLaunchTournamentMatch).not.toHaveBeenCalled();
  });

  it('stops polling when the tournament is finalized', async () => {
    mockGetPublicTournamentStatus.mockResolvedValue(
      buildSnapshot(
        [
          buildStanding({
            ownerId: 'user-1',
            username: 'Michel',
            rank: 1,
          }),
        ],
        {
          lifecycle: 'finalized',
          participation: buildParticipation({
            state: 'champion',
            finalPlacement: 1,
            canLaunch: false,
          }),
        },
      ),
    );

    render(<HookHarness {...baseProps} />);

    await act(async () => {
      await flush();
      jest.advanceTimersByTime(20_000);
      await flush();
    });

    expect(screen.getByTestId('phase').props.children).toBe('finalized');
    expect(mockGetPublicTournamentStatus).toHaveBeenCalledTimes(1);
  });

  it('tracks a local loss until the run is explicitly eliminated', async () => {
    mockGetPublicTournamentStatus
      .mockResolvedValueOnce(
        buildSnapshot(
          [
            buildStanding({
              result: null,
              matchId: null,
              updatedAt: null,
            }),
          ],
          {
            participation: buildParticipation({
              state: 'waiting_next_round',
              lastResult: null,
              canLaunch: false,
              finalPlacement: null,
            }),
          },
        ),
      )
      .mockResolvedValueOnce(
        buildSnapshot(
          [
            buildStanding({
              result: 'loss',
              rank: 4,
            }),
          ],
          {
            participation: buildParticipation({
              state: 'eliminated',
              lastResult: 'loss',
              finalPlacement: 4,
              canLaunch: false,
            }),
          },
        ),
      );

    render(<HookHarness {...baseProps} didPlayerWin={false} />);

    await act(async () => {
      await flush();
    });

    expect(screen.getByTestId('phase').props.children).toBe('waiting');
    expect(screen.getByTestId('status').props.children).toBe('Recording the final tournament result...');
    expect(mockLaunchTournamentMatch).not.toHaveBeenCalled();

    await act(async () => {
      jest.advanceTimersByTime(4_000);
      await flush();
    });

    expect(screen.getByTestId('phase').props.children).toBe('eliminated');
    expect(screen.getByTestId('status').props.children).toBe('Your tournament run has ended.');
    expect(mockLaunchTournamentMatch).not.toHaveBeenCalled();
  });
});
