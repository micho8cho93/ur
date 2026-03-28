import { CHALLENGE_DEFINITIONS, CHALLENGE_IDS, createDefaultUserChallengeProgressSnapshot } from '@/shared/challenges';
import { buildChallengeViewModels } from './challengeUi';

describe('challengeUi', () => {
  it('marks partial numeric progress as in progress and keeps completed challenges completed', () => {
    const progress = createDefaultUserChallengeProgressSnapshot('2026-03-28T12:00:00.000Z');
    progress.challenges[CHALLENGE_IDS.VETERAN_I] = {
      ...progress.challenges[CHALLENGE_IDS.VETERAN_I],
      progressCurrent: 12,
      progressTarget: 50,
      progressLabel: '12/50 games played',
    };
    progress.challenges[CHALLENGE_IDS.FIRST_VICTORY] = {
      ...progress.challenges[CHALLENGE_IDS.FIRST_VICTORY],
      completed: true,
      completedAt: '2026-03-28T12:00:00.000Z',
      completedMatchId: 'match-1',
    };

    const viewModels = buildChallengeViewModels([...CHALLENGE_DEFINITIONS], progress);
    const veteran = viewModels.find((challenge) => challenge.id === CHALLENGE_IDS.VETERAN_I);
    const firstVictory = viewModels.find((challenge) => challenge.id === CHALLENGE_IDS.FIRST_VICTORY);

    expect(veteran).toMatchObject({
      status: 'in_progress',
      progressLabel: '12/50 games played',
    });
    expect(firstVictory).toMatchObject({
      status: 'completed',
      progressLabel: 'Completed',
    });
  });
});
