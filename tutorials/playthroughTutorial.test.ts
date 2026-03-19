import { applyMove, getValidMoves } from '@/logic/engine';
import type { GameState } from '@/logic/types';
import { PLAYTHROUGH_TUTORIAL_SEGMENTS } from './playthroughTutorial';

const withForcedRoll = (state: GameState, value: number): GameState => ({
  ...state,
  phase: 'moving',
  rollValue: value,
});

describe('playthrough tutorial snapshots', () => {
  it('gives each guided segment the scripted move for its forced roll', () => {
    PLAYTHROUGH_TUTORIAL_SEGMENTS.forEach((segment) => {
      const moves = getValidMoves(withForcedRoll(segment.snapshot, segment.forcedRoll), segment.forcedRoll);

      expect(moves).toContainEqual(segment.expectedMove);
    });
  });

  it('leaves the player with six pieces after scoring the first guided piece', () => {
    const finalSegment = PLAYTHROUGH_TUTORIAL_SEGMENTS[PLAYTHROUGH_TUTORIAL_SEGMENTS.length - 1];
    const nextState = applyMove(withForcedRoll(finalSegment.snapshot, finalSegment.forcedRoll), finalSegment.expectedMove);

    expect(nextState.light.finishedCount).toBe(1);
    expect(nextState.light.pieces.filter((piece) => !piece.isFinished)).toHaveLength(6);
    expect(nextState.currentTurn).toBe('dark');
    expect(nextState.winner).toBeNull();
  });
});
