import type { GameState, MoveAction, PlayerColor } from '@/logic/types';
import { buildTutorialFrames } from './tutorialEngine';
import type { TutorialRollStep, TutorialRollValue, TutorialStep } from './tutorialTypes';

export const PLAYTHROUGH_TUTORIAL_ID = 'playthrough' as const;
export const PLAYTHROUGH_TUTORIAL_LESSON_COUNT = 5 as const;

type PlaythroughTutorialLessonSpec = {
  id: string;
  lessonNumber: number;
  title: string;
  objective: string;
  implication: string;
  rollStepId: string;
  moveStepId: string;
};

export type PlaythroughTutorialLesson = PlaythroughTutorialLessonSpec & {
  startFrameIndex: number;
  rollStepIndex: number;
  moveStepIndex: number;
  forcedRoll: TutorialRollValue;
  expectedMove: MoveAction;
};

const assertTutorial = (condition: boolean, message: string): asserts condition => {
  if (condition) {
    return;
  }

  throw new Error(`[PlaythroughTutorial] ${message}`);
};

const cloneGameState = (state: GameState): GameState => JSON.parse(JSON.stringify(state)) as GameState;

const rollStep = (
  id: string,
  player: PlayerColor,
  value: TutorialRollValue,
  expectNoMoves?: boolean,
): TutorialRollStep => ({
  id,
  kind: 'ROLL',
  player,
  value,
  ...(typeof expectNoMoves === 'boolean' ? { expectNoMoves } : {}),
});

const moveStep = (
  id: string,
  player: PlayerColor,
  pieceId: string,
  fromIndex: number,
  toIndex: number,
): TutorialStep => ({
  id,
  kind: 'MOVE',
  player,
  pieceId,
  fromIndex,
  toIndex,
});

// Authoring note: every frame in the play tutorial comes from replaying this script from the
// initial state. Lessons are just boundary markers into the single continuous sequence below.
export const PLAYTHROUGH_TUTORIAL_SCRIPT: readonly TutorialStep[] = [
  rollStep('roll-light-enter', 'light', 1),
  moveStep('move-light-enter', 'light', 'light-0', -1, 0),

  rollStep('roll-dark-pass-after-entry', 'dark', 0, true),
  rollStep('roll-light-opening-rosette', 'light', 3),
  moveStep('move-light-opening-rosette', 'light', 'light-0', 0, 3),

  rollStep('roll-light-enter-war-zone', 'light', 1),
  moveStep('move-light-enter-war-zone', 'light', 'light-0', 3, 4),

  rollStep('roll-dark-shared-rosette-threat', 'dark', 4),
  moveStep('move-dark-shared-rosette-threat', 'dark', 'dark-0', -1, 3),
  rollStep('roll-dark-threat-fizzles', 'dark', 0, true),
  rollStep('roll-light-pass-before-capture-setup-1', 'light', 0, true),
  rollStep('roll-dark-enter-capture-runner', 'dark', 2),
  moveStep('move-dark-enter-capture-runner', 'dark', 'dark-1', -1, 1),
  rollStep('roll-light-pass-before-capture-setup-2', 'light', 0, true),
  rollStep('roll-dark-advance-capture-runner', 'dark', 4),
  moveStep('move-dark-advance-capture-runner', 'dark', 'dark-1', 1, 5),
  rollStep('roll-light-pass-before-capture-setup-3', 'light', 0, true),
  rollStep('roll-dark-set-capture-target', 'dark', 3),
  moveStep('move-dark-set-capture-target', 'dark', 'dark-1', 5, 8),

  rollStep('roll-light-shared-rosette', 'light', 3),
  moveStep('move-light-shared-rosette', 'light', 'light-0', 4, 7),

  rollStep('roll-light-capture', 'light', 1),
  moveStep('move-light-capture', 'light', 'light-0', 7, 8),

  rollStep('roll-dark-pass-after-capture', 'dark', 0, true),
  rollStep('roll-light-home-stretch', 'light', 3),
  moveStep('move-light-home-stretch', 'light', 'light-0', 8, 11),
  rollStep('roll-dark-pass-before-score-setup', 'dark', 0, true),
  rollStep('roll-light-home-rosette', 'light', 2),
  moveStep('move-light-home-rosette', 'light', 'light-0', 11, 13),

  rollStep('roll-light-score', 'light', 1),
  moveStep('move-light-score', 'light', 'light-0', 13, 14),
] as const;

const PLAYTHROUGH_TUTORIAL_LESSON_SPECS: readonly PlaythroughTutorialLessonSpec[] = [
  {
    id: 'enter-board',
    lessonNumber: 1,
    title: 'Bring Your First Runner In',
    objective: 'Roll 1 and move your first light piece out of reserve onto the board.',
    implication: 'Pieces begin in reserve. Bringing one in starts the race and gives you a runner to develop.',
    rollStepId: 'roll-light-enter',
    moveStepId: 'move-light-enter',
  },
  {
    id: 'enter-war-zone',
    lessonNumber: 2,
    title: 'Step Into The War Zone',
    objective: 'Keep that same runner moving and enter the shared middle row.',
    implication: 'The middle row is where both sides can fight over the same squares, so captures become possible there.',
    rollStepId: 'roll-light-enter-war-zone',
    moveStepId: 'move-light-enter-war-zone',
  },
  {
    id: 'shared-rosette-bonus-and-safety',
    lessonNumber: 3,
    title: 'Rosettes Give Tempo And Safety',
    objective: 'Land your runner on the shared rosette.',
    implication: 'Rosettes grant another roll, and the shared rosette is also safe from capture even with Dark waiting behind you.',
    rollStepId: 'roll-light-shared-rosette',
    moveStepId: 'move-light-shared-rosette',
  },
  {
    id: 'capture-in-shared-row',
    lessonNumber: 4,
    title: 'Capture In The Shared Row',
    objective: 'Use the bonus roll to capture the dark piece waiting ahead of you.',
    implication: 'Captures send the opposing piece back to reserve and buy your runner more space to race.',
    rollStepId: 'roll-light-capture',
    moveStepId: 'move-light-capture',
  },
  {
    id: 'score-first-piece',
    lessonNumber: 5,
    title: 'Score Your First Piece',
    objective: 'Use the exact roll and the SCORE button to bear off your lead runner.',
    implication: 'Bearing off removes the piece from the board and gives Light the first point of the tutorial run.',
    rollStepId: 'roll-light-score',
    moveStepId: 'move-light-score',
  },
] as const;

const STEP_INDEX_BY_ID = new Map(PLAYTHROUGH_TUTORIAL_SCRIPT.map((step, index) => [step.id, index]));

const getStepIndexOrThrow = (stepId: string): number => {
  const stepIndex = STEP_INDEX_BY_ID.get(stepId);
  assertTutorial(typeof stepIndex === 'number', `Missing step id "${stepId}".`);
  return stepIndex;
};

const getRollStepOrThrow = (stepId: string): TutorialRollStep => {
  const step = PLAYTHROUGH_TUTORIAL_SCRIPT[getStepIndexOrThrow(stepId)];
  assertTutorial(step.kind === 'ROLL', `Expected "${stepId}" to be a ROLL step.`);
  return step;
};

const getMoveStepOrThrow = (stepId: string) => {
  const step = PLAYTHROUGH_TUTORIAL_SCRIPT[getStepIndexOrThrow(stepId)];
  assertTutorial(step.kind === 'MOVE', `Expected "${stepId}" to be a MOVE step.`);
  assertTutorial(typeof step.fromIndex === 'number', `Expected "${stepId}" to define fromIndex.`);
  return step;
};

const buildLesson = (spec: PlaythroughTutorialLessonSpec): PlaythroughTutorialLesson => {
  const rollStepIndex = getStepIndexOrThrow(spec.rollStepId);
  const moveStepIndex = getStepIndexOrThrow(spec.moveStepId);
  const rollStep = getRollStepOrThrow(spec.rollStepId);
  const moveStep = getMoveStepOrThrow(spec.moveStepId);

  assertTutorial(
    moveStepIndex > rollStepIndex,
    `Lesson "${spec.id}" move step must come after its roll step.`,
  );
  assertTutorial(
    moveStep.player === rollStep.player,
    `Lesson "${spec.id}" roll and move must belong to the same player.`,
  );

  return {
    ...spec,
    startFrameIndex: rollStepIndex,
    rollStepIndex,
    moveStepIndex,
    forcedRoll: rollStep.value,
    expectedMove: {
      pieceId: moveStep.pieceId,
      fromIndex: moveStep.fromIndex,
      toIndex: moveStep.toIndex,
    },
  };
};

export const PLAYTHROUGH_TUTORIAL_FRAMES = buildTutorialFrames(PLAYTHROUGH_TUTORIAL_SCRIPT);

export const PLAYTHROUGH_TUTORIAL_LESSONS: readonly PlaythroughTutorialLesson[] =
  PLAYTHROUGH_TUTORIAL_LESSON_SPECS.map(buildLesson);

assertTutorial(
  PLAYTHROUGH_TUTORIAL_LESSONS.length === PLAYTHROUGH_TUTORIAL_LESSON_COUNT,
  `Expected ${PLAYTHROUGH_TUTORIAL_LESSON_COUNT} lessons, received ${PLAYTHROUGH_TUTORIAL_LESSONS.length}.`,
);

export const getPlaythroughTutorialLessonState = (lessonIndex: number): GameState => {
  const lesson = PLAYTHROUGH_TUTORIAL_LESSONS[lessonIndex];
  assertTutorial(Boolean(lesson), `Unknown lesson index ${lessonIndex}.`);
  return cloneGameState(PLAYTHROUGH_TUTORIAL_FRAMES[lesson.startFrameIndex].gameState);
};

export const isPlaythroughTutorialId = (value: unknown): value is typeof PLAYTHROUGH_TUTORIAL_ID =>
  value === PLAYTHROUGH_TUTORIAL_ID;
