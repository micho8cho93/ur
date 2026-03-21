jest.mock('./progression', () => {
  const actual = jest.requireActual('./progression');
  const sharedProgression = jest.requireActual('../../shared/progression');

  return {
    ...actual,
    awardXpForMatchWin: jest.fn((_nk, _logger, params) => {
      const source = params.source ?? 'bot_win';
      const awardedXp = sharedProgression.getXpAwardAmount(source);
      const newRank = sharedProgression.getRankForXp(awardedXp).title;

      return {
        matchId: params.matchId,
        source,
        duplicate: false,
        awardedXp,
        previousTotalXp: 0,
        newTotalXp: awardedXp,
        previousRank: 'Laborer',
        newRank,
        rankChanged: newRank !== 'Laborer',
        progression: sharedProgression.buildProgressionSnapshot(awardedXp),
      };
    }),
  };
});

import { rpcSubmitCompletedBotMatch } from './challenges';
import { awardXpForMatchWin } from './progression';

const mockedAwardXpForMatchWin = awardXpForMatchWin as jest.MockedFunction<typeof awardXpForMatchWin>;

describe('rpcSubmitCompletedBotMatch', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('skips challenge processing for tutorial matches that only award base win xp', () => {
    const logger = {
      info: jest.fn(),
      warn: jest.fn(),
    };
    const nk = {
      storageRead: jest.fn(),
      storageWrite: jest.fn(),
    };

    const response = rpcSubmitCompletedBotMatch(
      { userId: 'user-1' },
      logger,
      nk,
      JSON.stringify({
        summary: {
          matchId: 'local-1',
          playerUserId: 'ignored-client-value',
          opponentType: 'easy_bot',
          didWin: true,
          totalMoves: 1,
          playerMoveCount: 1,
          piecesLost: 0,
          maxRollCount: 0,
          capturesMade: 0,
          capturesSuffered: 0,
          contestedTilesLandedCount: 0,
          borneOffCount: 7,
          opponentBorneOffCount: 0,
          wasBehindDuringMatch: false,
          behindCheckpointCount: 0,
          behindReasons: [],
          timestamp: '2026-03-19T12:00:00.000Z',
        },
        tutorialId: 'playthrough',
        modeId: 'standard',
        rewardMode: 'base_win_only',
      }),
    );

    expect(mockedAwardXpForMatchWin).toHaveBeenCalledWith(
      nk,
      logger,
      expect.objectContaining({
        matchId: 'local-1',
        source: 'bot_win',
        userId: 'user-1',
      }),
    );
    expect(nk.storageRead).not.toHaveBeenCalled();
    expect(nk.storageWrite).not.toHaveBeenCalled();
    expect(JSON.parse(response)).toMatchObject({
      progressionAward: expect.objectContaining({
        awardedXp: 50,
        matchId: 'local-1',
        source: 'bot_win',
      }),
    });
  });

  it('uses practice-mode rewards and keeps challenge processing off for practice matches', () => {
    const logger = {
      info: jest.fn(),
      warn: jest.fn(),
    };
    const nk = {
      storageRead: jest.fn(),
      storageWrite: jest.fn(),
    };

    const response = rpcSubmitCompletedBotMatch(
      { userId: 'user-1' },
      logger,
      nk,
      JSON.stringify({
        summary: {
          matchId: 'local-2',
          playerUserId: 'ignored-client-value',
          opponentType: 'easy_bot',
          didWin: true,
          totalMoves: 1,
          playerMoveCount: 1,
          piecesLost: 0,
          maxRollCount: 0,
          capturesMade: 0,
          capturesSuffered: 0,
          contestedTilesLandedCount: 0,
          borneOffCount: 1,
          opponentBorneOffCount: 0,
          wasBehindDuringMatch: false,
          behindCheckpointCount: 0,
          behindReasons: [],
          timestamp: '2026-03-19T12:00:00.000Z',
        },
        modeId: 'gameMode_1_piece',
      }),
    );

    expect(mockedAwardXpForMatchWin).toHaveBeenCalledWith(
      nk,
      logger,
      expect.objectContaining({
        matchId: 'local-2',
        source: 'practice_1_piece_win',
        userId: 'user-1',
      }),
    );
    expect(nk.storageRead).not.toHaveBeenCalled();
    expect(nk.storageWrite).not.toHaveBeenCalled();
    expect(JSON.parse(response)).toMatchObject({
      progressionAward: expect.objectContaining({
        awardedXp: 10,
        matchId: 'local-2',
        source: 'practice_1_piece_win',
      }),
    });
  });
});
