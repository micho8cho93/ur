jest.mock('./progression', () => {
  const actual = jest.requireActual('./progression');

  return {
    ...actual,
    awardXpForMatchWin: jest.fn(() => ({
      matchId: 'local-1',
      source: 'bot_win',
      duplicate: false,
      awardedXp: 100,
      previousTotalXp: 0,
      newTotalXp: 100,
      previousRank: 'Laborer',
      newRank: 'Servant of the Temple',
      rankChanged: true,
      progression: {
        totalXp: 100,
        currentRank: 'Servant of the Temple',
        currentRankThreshold: 100,
        nextRank: 'Apprentice Scribe',
        nextRankThreshold: 250,
        xpIntoCurrentRank: 0,
        xpNeededForNextRank: 150,
        progressPercent: 0,
      },
    })),
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
        awardedXp: 100,
        matchId: 'local-1',
        source: 'bot_win',
      }),
    });
  });
});
