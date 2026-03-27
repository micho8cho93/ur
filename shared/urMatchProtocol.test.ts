import { createInitialState } from '../logic/engine';
import { isMatchEndPayload, isStateSnapshotPayload } from './urMatchProtocol';

describe('urMatchProtocol', () => {
  it('accepts authoritative online snapshot fields when they are well-formed', () => {
    expect(
      isStateSnapshotPayload({
        type: 'state_snapshot',
        matchId: 'match-1',
        revision: 3,
        gameState: createInitialState(),
        assignments: {
          'light-user': 'light',
          'dark-user': 'dark',
        },
        serverTimeMs: 1_000,
        turnDurationMs: 10_000,
        turnStartedAtMs: 500,
        turnDeadlineMs: 10_500,
        turnRemainingMs: 9_500,
        activeTimedPlayer: 'light-user',
        activeTimedPlayerColor: 'light',
        activeTimedPhase: 'rolling',
        afkAccumulatedMs: {
          light: 0,
          dark: 20_000,
        },
        afkRemainingMs: 70_000,
        matchEnd: {
          reason: 'completed',
          winnerUserId: 'light-user',
          loserUserId: 'dark-user',
          forfeitingUserId: null,
          message: null,
        },
      }),
    ).toBe(true);
  });

  it('rejects malformed authoritative snapshot fields', () => {
    expect(
      isStateSnapshotPayload({
        type: 'state_snapshot',
        matchId: 'match-1',
        revision: 3,
        gameState: createInitialState(),
        assignments: {
          'light-user': 'light',
        },
        activeTimedPlayerColor: 'blue',
      }),
    ).toBe(false);

    expect(
      isStateSnapshotPayload({
        type: 'state_snapshot',
        matchId: 'match-1',
        revision: 3,
        gameState: createInitialState(),
        assignments: {
          'light-user': 'light',
        },
        afkAccumulatedMs: {
          light: '0',
          dark: 10,
        },
      }),
    ).toBe(false);
  });

  it('validates inactivity-forfeit match end payloads', () => {
    expect(
      isMatchEndPayload({
        reason: 'forfeit_inactivity',
        winnerUserId: 'winner',
        loserUserId: 'loser',
        forfeitingUserId: 'loser',
        message: 'Timed out.',
      }),
    ).toBe(true);

    expect(
      isMatchEndPayload({
        reason: 'timeout',
        winnerUserId: 'winner',
        loserUserId: 'loser',
        forfeitingUserId: 'loser',
      }),
    ).toBe(false);
  });
});
