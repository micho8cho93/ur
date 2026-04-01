import { createInitialState } from '../logic/engine';
import {
  isEmojiReactionBroadcastPayload,
  isEmojiReactionRequestPayload,
  isMatchEndPayload,
  isRollRequestPayload,
  isStateSnapshotPayload,
} from './urMatchProtocol';

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
        rollDisplayValue: 3,
        rollDisplayLabel: 'No Move',
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
        afkRemainingMs: 20_000,
        reconnectingPlayer: 'dark-user',
        reconnectingPlayerColor: 'dark',
        reconnectGraceDurationMs: 15_000,
        reconnectDeadlineMs: 16_000,
        reconnectRemainingMs: 15_000,
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
        rollDisplayValue: 5,
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

    expect(
      isMatchEndPayload({
        reason: 'forfeit_disconnect',
        winnerUserId: 'winner',
        loserUserId: 'loser',
        forfeitingUserId: 'loser',
        message: 'Disconnected.',
      }),
    ).toBe(true);
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

  it('accepts valid emoji reaction payloads and broadcasts', () => {
    expect(
      isEmojiReactionRequestPayload({
        type: 'emoji_reaction',
        emoji: 'fire',
      }),
    ).toBe(true);

    expect(
      isEmojiReactionBroadcastPayload({
        type: 'reaction_broadcast',
        emoji: 'laughing',
        senderUserId: 'light-user',
        senderColor: 'light',
        remainingForSender: 4,
        createdAtMs: 1_234,
      }),
    ).toBe(true);
  });

  it('rejects malformed emoji reaction payloads and broadcasts', () => {
    expect(
      isEmojiReactionRequestPayload({
        type: 'emoji_reaction',
        emoji: 'party',
      }),
    ).toBe(false);

    expect(
      isEmojiReactionBroadcastPayload({
        type: 'reaction_broadcast',
        emoji: 'fire',
        senderUserId: 'light-user',
        senderColor: 'blue',
        remainingForSender: -1,
        createdAtMs: 'now',
      }),
    ).toBe(false);
  });
});
