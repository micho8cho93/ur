import { createInitialState } from '../logic/engine';
import { isMatchEndPayload, isRollRequestPayload, isStateSnapshotPayload } from './urMatchProtocol';

describe('urMatchProtocol', () => {
  it('accepts authoritative online snapshot fields when they are well-formed', () => {
    expect(
      isStateSnapshotPayload({
        type: 'state_snapshot',
        matchId: 'match-1',
        revision: 3,
        gameState: createInitialState(),
        historyCount: 0,
        players: {
          light: {
            userId: 'light-user',
            title: 'Michel',
          },
          dark: {
            userId: 'dark-user',
            title: 'Guest',
          },
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
        historyCount: -1,
        players: {
          light: {
            userId: 'light-user',
            title: 'Michel',
          },
          dark: {
            userId: 'dark-user',
            title: 'Guest',
          },
        },
      }),
    ).toBe(false);

    expect(
      isStateSnapshotPayload({
        type: 'state_snapshot',
        matchId: 'match-1',
        revision: 3,
        gameState: createInitialState(),
        players: {
          light: {
            userId: 'light-user',
            title: 'Michel',
          },
          dark: {
            userId: 'dark-user',
            title: 42,
          },
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
        players: {
          light: {
            userId: 'light-user',
            title: 'Michel',
          },
          dark: {
            userId: 'dark-user',
            title: 'Guest',
          },
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

  it('accepts auto-trigger metadata on roll requests only when it is boolean', () => {
    expect(
      isRollRequestPayload({
        type: 'roll_request',
        autoTriggered: true,
      }),
    ).toBe(true);

    expect(
      isRollRequestPayload({
        type: 'roll_request',
        autoTriggered: 'yes',
      }),
    ).toBe(false);
  });
});
