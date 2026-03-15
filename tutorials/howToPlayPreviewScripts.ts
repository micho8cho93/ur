import { HowToPlayPreviewId } from '@/content/howToPlayFiveStep';
import { TutorialStep } from './tutorialTypes';

const rollStep = (
  id: string,
  player: 'light' | 'dark',
  value: 0 | 1 | 2 | 3 | 4,
  timelineLabel: string,
  expectNoMoves?: boolean,
): TutorialStep => ({
  id,
  kind: 'ROLL',
  player,
  value,
  timelineLabel,
  ...(typeof expectNoMoves === 'boolean' ? { expectNoMoves } : {}),
});

const moveStep = (
  id: string,
  player: 'light' | 'dark',
  pieceId: string,
  toIndex: number,
  timelineLabel: string,
): TutorialStep => ({
  id,
  kind: 'MOVE',
  player,
  pieceId,
  toIndex,
  timelineLabel,
});

export const HOW_TO_PLAY_PREVIEW_SCRIPTS: Record<HowToPlayPreviewId, TutorialStep[]> = {
  goal: [
    rollStep('goal-roll-light-4-open', 'light', 4, 'Light rolls 4'),
    moveStep('goal-move-light-0-to-3', 'light', 'light-0', 3, 'Light enters on a rosette'),
    rollStep('goal-roll-light-4-rosette-bonus', 'light', 4, 'Rosette grants another roll'),
    moveStep('goal-move-light-0-to-7', 'light', 'light-0', 7, 'Light reaches the shared rosette'),
    rollStep('goal-roll-light-4-race', 'light', 4, 'Light rolls 4 again'),
    moveStep('goal-move-light-0-to-11', 'light', 'light-0', 11, 'Light races toward the finish'),
    rollStep('goal-roll-dark-0-pass', 'dark', 0, 'Dark rolls 0 and passes', true),
    rollStep('goal-roll-light-3-score', 'light', 3, 'Exact roll unlocks the score move'),
    moveStep('goal-move-light-0-to-14', 'light', 'light-0', 14, 'Light bears the piece off'),
  ],
  takingTurn: [
    rollStep('turn-roll-light-0-pass', 'light', 0, 'Roll 0 ends the turn', true),
    rollStep('turn-roll-dark-2', 'dark', 2, 'Dark rolls 2'),
    moveStep('turn-move-dark-0-to-1', 'dark', 'dark-0', 1, 'Dark uses the legal move'),
  ],
  legalMoves: [
    rollStep('legal-roll-light-4', 'light', 4, 'Light rolls 4'),
    moveStep('legal-move-light-0-to-3', 'light', 'light-0', 3, 'One piece claims the rosette'),
    rollStep('legal-roll-light-2', 'light', 2, 'Rosette grants another roll'),
    moveStep('legal-move-light-1-to-1', 'light', 'light-1', 1, 'A second piece enters the lane'),
    rollStep('legal-roll-dark-0-pass', 'dark', 0, 'Dark rolls 0 and passes', true),
    rollStep('legal-roll-light-2', 'light', 2, 'Only exact legal destinations glow'),
    moveStep('legal-move-light-0-to-5', 'light', 'light-0', 5, 'Blocked moves are omitted'),
  ],
  captures: [
    rollStep('capture-roll-light-4', 'light', 4, 'Light rolls 4'),
    moveStep('capture-move-light-0-to-3', 'light', 'light-0', 3, 'Light opens on a rosette'),
    rollStep('capture-roll-light-2', 'light', 2, 'Rosette grants another roll'),
    moveStep('capture-move-light-0-to-5', 'light', 'light-0', 5, 'Light steps into the shared lane'),
    rollStep('capture-roll-dark-4', 'dark', 4, 'Dark rolls 4'),
    moveStep('capture-move-dark-0-to-3', 'dark', 'dark-0', 3, 'Dark enters on its rosette'),
    rollStep('capture-roll-dark-3', 'dark', 3, 'Dark rolls again from the rosette'),
    moveStep('capture-move-dark-0-to-6', 'dark', 'dark-0', 6, 'Dark lands in range'),
    rollStep('capture-roll-light-1', 'light', 1, 'Light rolls the exact capture'),
    moveStep('capture-move-light-0-to-6', 'light', 'light-0', 6, 'Capture sends Dark back to reserve'),
  ],
  safeSquaresStrategy: [
    rollStep('safe-roll-light-2-open', 'light', 2, 'Light develops a blocker'),
    moveStep('safe-move-light-0-to-1', 'light', 'light-0', 1, 'Light holds the entry square'),
    rollStep('safe-roll-dark-0-pass-1', 'dark', 0, 'Dark rolls 0 and passes', true),
    rollStep('safe-roll-light-4-setup', 'light', 4, 'Light rolls 4'),
    moveStep('safe-move-light-1-to-3', 'light', 'light-1', 3, 'Light claims a rosette'),
    rollStep('safe-roll-light-2-advance', 'light', 2, 'Rosette grants another roll'),
    moveStep('safe-move-light-1-to-5', 'light', 'light-1', 5, 'Light advances into the lane'),
    rollStep('safe-roll-dark-0-pass-2', 'dark', 0, 'Dark rolls 0 and passes', true),
    rollStep('safe-roll-light-4-anchor', 'light', 4, 'Light rolls 4 again'),
    moveStep('safe-move-light-2-to-3', 'light', 'light-2', 3, 'Light adds a second anchor'),
    rollStep('safe-roll-light-0-pass', 'light', 0, 'The extra turn can still fizzle', true),
    rollStep('safe-roll-dark-4-enter', 'dark', 4, 'Dark rolls 4'),
    moveStep('safe-move-dark-0-to-3', 'dark', 'dark-0', 3, 'Dark enters on a rosette'),
    rollStep('safe-roll-dark-4-shared-rosette', 'dark', 4, 'Rosette grants another roll'),
    moveStep('safe-move-dark-0-to-7', 'dark', 'dark-0', 7, 'Dark escapes onto the shared rosette'),
    rollStep('safe-roll-dark-0-pass-3', 'dark', 0, 'Dark keeps the turn, then rolls 0', true),
    rollStep('safe-roll-light-2-blocked', 'light', 2, "Light can't capture the protected rosette", true),
  ],
};
