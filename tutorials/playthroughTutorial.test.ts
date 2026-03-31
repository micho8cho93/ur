import { applyMove, createInitialState, getValidMoves } from '@/logic/engine';
import { getPathCoord } from '@/logic/pathVariants';
import type { GameState } from '@/logic/types';
import { buildTutorialFrames } from './tutorialEngine';
import {
  PLAYTHROUGH_TUTORIAL_COMPLETION_MODAL,
  PLAYTHROUGH_TUTORIAL_FRAMES,
  PLAYTHROUGH_TUTORIAL_LESSONS,
  PLAYTHROUGH_TUTORIAL_OPENING_MODAL,
  PLAYTHROUGH_TUTORIAL_SCRIPT,
  getPlaythroughTutorialInstruction,
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
      const noMoves = step.forceNoMoves === true || validMoves.length === 0;

      if (noMoves) {
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

  it('makes the first rosette lesson keep Light on turn for the bonus roll', () => {
    const openingRosetteLesson = PLAYTHROUGH_TUTORIAL_LESSONS[1];
    const warZoneLesson = PLAYTHROUGH_TUTORIAL_LESSONS[2];
    const resultFrame = PLAYTHROUGH_TUTORIAL_FRAMES[openingRosetteLesson.moveStepIndex + 1];

    expect(resultFrame.gameState.currentTurn).toBe('light');
    expect(resultFrame.gameState.phase).toBe('rolling');
    expect(resultFrame.gameState.light.pieces[0]?.position).toBe(3);
    expect(warZoneLesson.startFrameIndex).toBe(openingRosetteLesson.moveStepIndex + 1);
  });

  it('makes the shared rosette lesson keep Light on turn and protect the tile from capture', () => {
    const rosetteLesson = PLAYTHROUGH_TUTORIAL_LESSONS[3];
    const captureLesson = PLAYTHROUGH_TUTORIAL_LESSONS[4];
    const resultFrame = PLAYTHROUGH_TUTORIAL_FRAMES[rosetteLesson.moveStepIndex + 1];
    const threatenedState: GameState = {
      ...resultFrame.gameState,
      currentTurn: 'dark',
      phase: 'moving',
      rollValue: 5,
    };

    expect(resultFrame.gameState.currentTurn).toBe('light');
    expect(resultFrame.gameState.phase).toBe('rolling');
    expect(resultFrame.gameState.light.pieces[0]?.position).toBe(7);
    expect(resultFrame.gameState.dark.pieces[0]?.position).toBe(2);
    expect(getValidMoves(threatenedState, 5)).not.toContainEqual({
      pieceId: 'dark-0',
      fromIndex: 2,
      toIndex: 7,
    });
    expect(captureLesson.startFrameIndex).toBe(rosetteLesson.moveStepIndex + 1);
  });

  it('makes the capture lesson perform a real shared-row capture', () => {
    const captureLesson = PLAYTHROUGH_TUTORIAL_LESSONS[4];
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

  it('numbers the lessons exactly 1 through 6 with no duplicates', () => {
    expect(PLAYTHROUGH_TUTORIAL_LESSONS.map((lesson) => lesson.lessonNumber)).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it('lets Dark move first and never gives Light more than one zero in a row', () => {
    const firstDarkMove = PLAYTHROUGH_TUTORIAL_SCRIPT.find((step) => step.kind === 'MOVE' && step.player === 'dark');
    const lightRollValues = PLAYTHROUGH_TUTORIAL_SCRIPT.reduce<number[]>((values, step) => {
      if (step.kind === 'ROLL' && step.player === 'light') {
        values.push(step.value);
      }

      return values;
    }, []);

    expect(firstDarkMove).toMatchObject({
      pieceId: 'dark-0',
      fromIndex: -1,
      toIndex: 2,
    });
    expect(lightRollValues.filter((roll) => roll === 0)).toHaveLength(1);
    expect(lightRollValues.some((roll, index) => roll === 0 && lightRollValues[index + 1] === 0)).toBe(false);
  });

  it('teaches zero rolls and blocked non-zero rolls with scripted result modals', () => {
    const zeroRollStep = PLAYTHROUGH_TUTORIAL_SCRIPT.find(
      (step) => step.kind === 'ROLL' && step.id === 'roll-light-pass-before-capture-setup',
    );
    const blockedRollStep = PLAYTHROUGH_TUTORIAL_SCRIPT.find(
      (step) => step.kind === 'ROLL' && step.id === 'roll-light-home-rosette-no-move',
    );
    const homeRosetteMoveIndex = PLAYTHROUGH_TUTORIAL_SCRIPT.findIndex(
      (step) => step.kind === 'MOVE' && step.id === 'move-light-home-rosette',
    );
    const blockedRollIndex = PLAYTHROUGH_TUTORIAL_SCRIPT.findIndex(
      (step) => step.kind === 'ROLL' && step.id === 'roll-light-home-rosette-no-move',
    );

    expect(zeroRollStep).toMatchObject({
      value: 0,
      expectNoMoves: true,
      resultModal: {
        title: 'Zeros Can Be Rolled',
      },
    });
    expect(blockedRollStep).toMatchObject({
      value: 2,
      expectNoMoves: true,
      forceNoMoves: true,
      resultModal: {
        title: 'No Move',
      },
    });
    expect(blockedRollIndex).toBe(homeRosetteMoveIndex + 1);
  });

  it('exports opening and completion modal copy for the guided flow', () => {
    expect(PLAYTHROUGH_TUTORIAL_OPENING_MODAL).toMatchObject({
      title: 'Roll, move, and race to score',
      actionLabel: 'Start Tutorial',
    });
    expect(PLAYTHROUGH_TUTORIAL_COMPLETION_MODAL).toMatchObject({
      title: 'Now finish the match',
      actionLabel: 'Play For XP',
    });
  });

  it('provides contextual tutorial banner instructions without lesson numbering', () => {
    expect(
      getPlaythroughTutorialInstruction({
        stepId: 'roll-light-opening-rosette',
        turn: 'light',
        phase: 'rolling',
        rollValue: null,
        hasMoves: false,
      }),
    ).toBe('Roll again and keep moving the same piece.');

    expect(
      getPlaythroughTutorialInstruction({
        stepId: 'move-light-opening-rosette',
        turn: 'light',
        phase: 'moving',
        rollValue: 3,
        hasMoves: true,
      }),
    ).toBe('Move up the board and land on the rosette for another roll.');

    expect(
      getPlaythroughTutorialInstruction({
        stepId: 'roll-light-pass-before-capture-setup',
        turn: 'dark',
        phase: 'moving',
        rollValue: 0,
        hasMoves: false,
      }),
    ).toBe('Dark rolled a zero, so the turn comes back to you.');

    expect(
      getPlaythroughTutorialInstruction({
        stepId: 'roll-light-home-rosette-no-move',
        turn: 'light',
        phase: 'moving',
        rollValue: 2,
        hasMoves: false,
      }),
    ).toBe('No move matches that roll, so your turn passes.');
  });

  it('derives the exported frame timeline only by applying the next scripted step', () => {
    expect(replayScriptManually()).toEqual(PLAYTHROUGH_TUTORIAL_FRAMES);
  });
});
