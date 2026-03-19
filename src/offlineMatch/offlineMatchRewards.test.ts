import { createInitialState } from '@/logic/engine';

import {
  buildOfflineCompletedMatchSummary,
  createOfflineMatchTelemetry,
  getBotOpponentType,
  recordOfflineHistoryEntries,
  recordOfflineRoll,
} from './offlineMatchRewards';

describe('offlineMatchRewards', () => {
  it('records captures, contested landings, and move totals from local history', () => {
    let telemetry = createOfflineMatchTelemetry();
    telemetry = recordOfflineRoll(telemetry, 'light', 4);

    const nextState = createInitialState();
    nextState.light.pieces[0].position = 4;
    nextState.dark.pieces[0].position = -1;
    nextState.history = ['light captured dark', 'light moved to 4. Rosette: false'];

    telemetry = recordOfflineHistoryEntries(telemetry, nextState, nextState.history);

    expect(telemetry.totalMoves).toBe(1);
    expect(telemetry.players.light.playerMoveCount).toBe(1);
    expect(telemetry.players.light.maxRollCount).toBe(1);
    expect(telemetry.players.light.capturesMade).toBe(1);
    expect(telemetry.players.dark.capturesSuffered).toBe(1);
    expect(telemetry.players.light.contestedTilesLandedCount).toBe(1);
  });

  it('tracks comeback checkpoints and builds a bot-match summary', () => {
    let telemetry = createOfflineMatchTelemetry();

    const behindState = createInitialState();
    behindState.dark.finishedCount = 1;
    behindState.dark.pieces[0].position = 10;

    telemetry = recordOfflineHistoryEntries(telemetry, behindState, ['light rolled 0 but had no moves.']);

    const finalState = createInitialState();
    finalState.light.finishedCount = 7;
    finalState.light.pieces.forEach((piece) => {
      piece.position = 14;
      piece.isFinished = true;
    });
    finalState.dark.finishedCount = 5;
    finalState.dark.pieces.slice(0, 5).forEach((piece) => {
      piece.position = 14;
      piece.isFinished = true;
    });
    finalState.winner = 'light';
    finalState.phase = 'ended';

    const summary = buildOfflineCompletedMatchSummary({
      matchId: 'local-123',
      playerColor: 'light',
      opponentType: getBotOpponentType('easy'),
      finalState,
      telemetry,
      playerUserId: 'user-1',
      completedAt: '2026-03-19T12:00:00.000Z',
    });

    expect(summary).toMatchObject({
      matchId: 'local-123',
      playerUserId: 'user-1',
      opponentType: 'easy_bot',
      didWin: true,
      borneOffCount: 7,
      opponentBorneOffCount: 5,
      wasBehindDuringMatch: true,
      behindCheckpointCount: 1,
      behindReasons: expect.arrayContaining(['borne_off_deficit', 'progress_deficit']),
      timestamp: '2026-03-19T12:00:00.000Z',
    });
  });
});
