import { applyMove, createInitialState, getValidMoves } from '@/logic/engine';
import { getPathCoord } from '@/logic/pathVariants';
import type { GameState } from '@/logic/types';
import { buildTutorialFrames } from './tutorialEngine';
import {
  PLAYTHROUGH_TUTORIAL_COMPLETION_COPY,
  PLAYTHROUGH_TUTORIAL_FRAMES,
  PLAYTHROUGH_TUTORIAL_LESSONS,
  PLAYTHROUGH_TUTORIAL_OPENING_COPY,
  PLAYTHROUGH_TUTORIAL_SCRIPT,
  getPlaythroughTutorialStepGuidance,
  getPlaythroughTutorialLessonState,
} from './playthroughTutorial';

type ReplayFrame = {
  gameState: GameState;
  displayRollValue: number | null;
  validMoves: ReturnType<typeof getValidMoves>;
};

const cloneGameState = (state: GameState): GameState => JSON.parse(JSON.stringify(state)) as GameState;

const replayScriptManually = (): ReplayFrame[] => {
  const frames: ReplayFrame[] = [];
  let state = createInitialState();

  frames.push({
    gameState: cloneGameState(state),
    displayRollValue: null,
    validMoves: [],
  });

  PLAYTHROUGH_TUTORIAL_SCRIPT.forEach((step) => {
    if (step.kind === 'ROLL') {
      const rolledState: GameState = {
        ...state,
        phase: 'moving',
        rollValue: step.value,
      };
      const validMoves = getValidMoves(rolledState, step.value);

      if (validMoves.length === 0) {
        state = {
          ...rolledState,
          currentTurn: rolledState.currentTurn === 'light' ? 'dark' : 'light',
          phase: 'rolling',
          rollValue: null,
          history: [...rolledState.history, `${step.player} rolled ${step.value} but had no moves.`],
        };
        frames.push({
          gameState: cloneGameState(state),
          displayRollValue: step.value,
          validMoves: [],
        });
        return;
      }

      state = rolledState;
      frames.push({
        gameState: cloneGameState(state),
        displayRollValue: step.value,
        validMoves: validMoves.map((move) => ({ ...move })),
      });
      return;
    }

    const move = getValidMoves(state, state.rollValue ?? 0).find(
      (candidate) =>
        candidate.pieceId === step.pieceId &&
        candidate.fromIndex === step.fromIndex &&
        candidate.toIndex === step.toIndex,
    );

    if (!move) {
      throw new Error(`Illegal scripted move ${step.id}`);
    }

    state = applyMove(state, move);
    frames.push({
      gameState: cloneGameState(state),
      displayRollValue: null,
      validMoves: [],
    });
  });

  return frames;
};

describe('playthrough tutorial continuous script', () => {
  it('replays from the initial state without errors', () => {
    expect(() => buildTutorialFrames(PLAYTHROUGH_TUTORIAL_SCRIPT)).not.toThrow();
  });

  it('keeps every scripted move legal at the moment it is executed', () => {
    const frames = PLAYTHROUGH_TUTORIAL_FRAMES;

    PLAYTHROUGH_TUTORIAL_SCRIPT.forEach((step, index) => {
      if (step.kind !== 'MOVE') {
        return;
      }

      expect(frames[index].validMoves).toContainEqual({
        pieceId: step.pieceId,
        fromIndex: step.fromIndex,
        toIndex: step.toIndex,
      });
    });
  });

  it('maps each lesson boundary to a frame produced by the continuous script', () => {
    PLAYTHROUGH_TUTORIAL_LESSONS.forEach((lesson, lessonIndex) => {
      expect(PLAYTHROUGH_TUTORIAL_FRAMES[lesson.startFrameIndex]).toBeDefined();
      expect(getPlaythroughTutorialLessonState(lessonIndex)).toEqual(
        PLAYTHROUGH_TUTORIAL_FRAMES[lesson.startFrameIndex].gameState,
      );
      expect(lesson.rollStepIndex).toBe(lesson.startFrameIndex);
      expect(lesson.moveStepIndex).toBeGreaterThan(lesson.rollStepIndex);
    });
  });

  it('keeps lesson boundaries on the same replay timeline instead of resetting snapshots', () => {
    PLAYTHROUGH_TUTORIAL_LESSONS.forEach((lesson, lessonIndex) => {
      const replayedFrames = buildTutorialFrames(PLAYTHROUGH_TUTORIAL_SCRIPT.slice(0, lesson.startFrameIndex));
      const boundaryFrame = replayedFrames[replayedFrames.length - 1];

      expect(boundaryFrame.gameState).toEqual(PLAYTHROUGH_TUTORIAL_FRAMES[lesson.startFrameIndex].gameState);

      if (lessonIndex === 0) {
        expect(lesson.startFrameIndex).toBe(0);
        return;
      }

      const previousLesson = PLAYTHROUGH_TUTORIAL_LESSONS[lessonIndex - 1];
      expect(lesson.startFrameIndex).toBeGreaterThanOrEqual(previousLesson.moveStepIndex + 1);
    });
  });

  it('keeps only one active light piece on the board throughout the guided sequence', () => {
    PLAYTHROUGH_TUTORIAL_FRAMES.forEach((frame) => {
      expect(frame.gameState.light.pieces.filter((piece) => !piece.isFinished && piece.position >= 0).length).toBeLessThanOrEqual(1);
    });
  });

  it('makes the rosette lesson keep Light on turn and protects the shared rosette from capture', () => {
    const rosetteLesson = PLAYTHROUGH_TUTORIAL_LESSONS[2];
    const captureLesson = PLAYTHROUGH_TUTORIAL_LESSONS[3];
    const resultFrame = PLAYTHROUGH_TUTORIAL_FRAMES[rosetteLesson.moveStepIndex + 1];
    const threatenedState: GameState = {
      ...resultFrame.gameState,
      currentTurn: 'dark',
      phase: 'moving',
      rollValue: 4,
    };

    expect(resultFrame.gameState.currentTurn).toBe('light');
    expect(resultFrame.gameState.phase).toBe('rolling');
    expect(resultFrame.gameState.light.pieces[0]?.position).toBe(7);
    expect(resultFrame.gameState.dark.pieces[0]?.position).toBe(3);
    expect(getValidMoves(threatenedState, 4)).not.toContainEqual({
      pieceId: 'dark-0',
      fromIndex: 3,
      toIndex: 7,
    });
    expect(captureLesson.startFrameIndex).toBe(rosetteLesson.moveStepIndex + 1);
  });

  it('makes the capture lesson perform a real shared-row capture', () => {
    const captureLesson = PLAYTHROUGH_TUTORIAL_LESSONS[3];
    const startFrame = PLAYTHROUGH_TUTORIAL_FRAMES[captureLesson.startFrameIndex];
    const resultFrame = PLAYTHROUGH_TUTORIAL_FRAMES[captureLesson.moveStepIndex + 1];
    const captureCoord = getPathCoord(
      resultFrame.gameState.matchConfig.pathVariant,
      'light',
      captureLesson.expectedMove.toIndex,
    );

    expect(startFrame.gameState.dark.pieces.find((piece) => piece.id === 'dark-1')?.position).toBe(8);
    expect(captureCoord?.row).toBe(1);
    expect(resultFrame.gameState.light.capturedCount).toBe(1);
    expect(resultFrame.gameState.dark.pieces.find((piece) => piece.id === 'dark-1')?.position).toBe(-1);
    expect(resultFrame.gameState.light.pieces[0]?.position).toBe(8);
  });

  it('ends the final lesson with exactly one light piece scored', () => {
    const finalLesson = PLAYTHROUGH_TUTORIAL_LESSONS[PLAYTHROUGH_TUTORIAL_LESSONS.length - 1];
    const finalFrame = PLAYTHROUGH_TUTORIAL_FRAMES[finalLesson.moveStepIndex + 1];

    expect(finalFrame.gameState.light.finishedCount).toBe(1);
    expect(finalFrame.gameState.light.pieces.filter((piece) => piece.isFinished)).toHaveLength(1);
    expect(finalFrame.gameState.winner).toBeNull();
    expect(finalFrame.gameState.currentTurn).toBe('dark');
  });

  it('numbers the lessons exactly 1 through 5 with no duplicates', () => {
    expect(PLAYTHROUGH_TUTORIAL_LESSONS.map((lesson) => lesson.lessonNumber)).toEqual([1, 2, 3, 4, 5]);
  });

  it('exports opening and completion copy for the guided flow', () => {
    expect(PLAYTHROUGH_TUTORIAL_OPENING_COPY.body).toContain('rolling the dice');
    expect(PLAYTHROUGH_TUTORIAL_OPENING_COPY.body).toContain('move it off the board to score');
    expect(PLAYTHROUGH_TUTORIAL_COMPLETION_COPY.body).toContain('bot');
    expect(PLAYTHROUGH_TUTORIAL_COMPLETION_COPY.body).toContain('XP');
  });

  it('describes tutorial banner guidance with plain-language prompts', () => {
    expect(getPlaythroughTutorialStepGuidance(PLAYTHROUGH_TUTORIAL_SCRIPT[0]!)).toBe(
      'Roll the dice, then move the glowing piece the same number of spaces.',
    );
    expect(getPlaythroughTutorialStepGuidance(PLAYTHROUGH_TUTORIAL_SCRIPT[6]!)).toBe(
      'Move into the middle column.',
    );
    expect(getPlaythroughTutorialStepGuidance(PLAYTHROUGH_TUTORIAL_SCRIPT[10]!)).toBe(
      'You rolled a zero, so this piece cannot move.',
    );
    expect(getPlaythroughTutorialStepGuidance(PLAYTHROUGH_TUTORIAL_SCRIPT[20]!)).toBe(
      'Move down and land on the rosette tile.',
    );
  });

  it('derives the exported frame timeline only by applying the next scripted step', () => {
    expect(replayScriptManually()).toEqual(PLAYTHROUGH_TUTORIAL_FRAMES);
  });
});
