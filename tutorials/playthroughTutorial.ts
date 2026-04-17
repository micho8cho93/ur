import type { GameState, MoveAction, PlayerColor } from '@/logic/types';
import { buildTutorialFrames } from './tutorialEngine';
import type {
  TutorialResultModalContent,
  TutorialMoveStep,
  TutorialRollStep,
  TutorialRollValue,
  TutorialStep,
} from './tutorialTypes';

export const PLAYTHROUGH_TUTORIAL_ID = 'playthrough' as const;
export const PLAYTHROUGH_TUTORIAL_LESSON_COUNT = 6 as const;

export const PLAYTHROUGH_TUTORIAL_OPENING_PAGES = [
  {
    eyebrow: undefined,
    title: 'Welcome to the Royal Game of Ur',
    body:
      "In this tutorial, you’ll learn to play one of the world’s most ancient board games, played by royals and common folk in Mesopotamia since at least 4,500 years ago!",
    actionLabel: 'Next',
  },
  {
    eyebrow: undefined,
    title: 'Welcome to the Royal Game of Ur',
    body:
      'It’s a simple race game – roll the dice each turn to move one of your seven checkers across the board and towards your finish line. The first player to move all seven checkers from the beginning to the end of their path wins!',
    actionLabel: 'Start Game',
  },
] as const;

export const PLAYTHROUGH_TUTORIAL_COMPLETION_MODAL = {
  title: 'Tutorial Complete',
  body: "You’ve learned the basics, now play on to finish this match and earn your first XP!",
  actionLabel: 'Play For XP',
} as const;

type PlaythroughTutorialLessonSpec = {
  id: string;
  lessonNumber: number;
  title: string;
  objective: string;
  implication: string;
  rollStepId: string;
  moveStepId: string;
  coachPlacement?: 'center' | 'side';
  showResultModal?: boolean;
};

export type PlaythroughTutorialLesson = PlaythroughTutorialLessonSpec & {
  startFrameIndex: number;
  rollStepIndex: number;
  moveStepIndex: number;
  forcedRoll: TutorialRollValue;
  expectedMove: MoveAction;
};

type TutorialInstructionParams = {
  hasMoves: boolean;
  phase: GameState['phase'];
  rollValue: GameState['rollValue'];
  stepId?: string | null;
  turn: PlayerColor;
};

function assertTutorial(condition: boolean, message: string): asserts condition {
  if (condition) {
    return;
  }

  throw new Error(`[PlaythroughTutorial] ${message}`);
}

const cloneGameState = (state: GameState): GameState => JSON.parse(JSON.stringify(state)) as GameState;

const rollStep = (
  id: string,
  player: PlayerColor,
  value: TutorialRollValue,
  options?: boolean | {
    expectNoMoves?: boolean;
    forceNoMoves?: boolean;
    resultModal?: TutorialResultModalContent;
  },
): TutorialRollStep => ({
  ...(typeof options === 'object' && options?.resultModal ? { resultModal: options.resultModal } : {}),
  id,
  kind: 'ROLL',
  player,
  value,
  ...(typeof options === 'boolean'
    ? { expectNoMoves: options }
    : typeof options?.expectNoMoves === 'boolean'
      ? { expectNoMoves: options.expectNoMoves }
      : {}),
  ...(typeof options === 'object' && options?.forceNoMoves ? { forceNoMoves: true } : {}),
});

const moveStep = (
  id: string,
  player: PlayerColor,
  pieceId: string,
  fromIndex: number,
  toIndex: number,
): TutorialMoveStep => ({
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

  rollStep('roll-dark-open-with-runner', 'dark', 3),
  moveStep('move-dark-open-with-runner', 'dark', 'dark-0', -1, 2),
  rollStep('roll-light-opening-rosette', 'light', 3),
  moveStep('move-light-opening-rosette', 'light', 'light-0', 0, 3),

  rollStep('roll-light-enter-war-zone', 'light', 1),
  moveStep('move-light-enter-war-zone', 'light', 'light-0', 3, 4),

  rollStep('roll-dark-enter-capture-runner', 'dark', 2),
  moveStep('move-dark-enter-capture-runner', 'dark', 'dark-1', -1, 1),
  rollStep('roll-light-advance-before-rosette', 'light', 2),
  moveStep('move-light-advance-before-rosette', 'light', 'light-0', 4, 6),
  rollStep('roll-dark-advance-capture-runner', 'dark', 4),
  moveStep('move-dark-advance-capture-runner', 'dark', 'dark-1', 1, 5),
  rollStep('roll-light-pass-before-capture-setup', 'light', 0, {
    expectNoMoves: true,
    resultModal: {
      title: 'I rolled a zero?',
      body:
        'Yes, that’s right. Unlike modern dice, the four-sided dice used in ancient Mesopotamia can result in a roll of 1, 2, 3, 4, or 0! Here’s how they work: each die can either land on a marked side, which counts as one, or an unmarked side, which counts as zero. Adding them all up gives you your roll. The highest roll is four, and the lowest is zero, which skips your turn. The most likely roll is two. Use these probabilities to your advantage when deciding which checkers to move!',
    },
  }),
  rollStep('roll-dark-set-capture-target', 'dark', 3),
  moveStep('move-dark-set-capture-target', 'dark', 'dark-1', 5, 8),
  rollStep('roll-light-shared-rosette', 'light', 1),
  moveStep('move-light-shared-rosette', 'light', 'light-0', 6, 7),

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
    title: 'Bring Your First Checker In',
    objective: 'Roll 1 and move your first light checker out of reserve onto the board.',
    implication: 'Pieces begin in reserve. Bringing one in starts the race and gives you a checker to develop.',
    rollStepId: 'roll-light-enter',
    moveStepId: 'move-light-enter',
    showResultModal: false,
  },
  {
    id: 'opening-rosette-extra-roll',
    lessonNumber: 2,
    title: 'Rosette Tiles Give You Another Roll',
    objective: 'Land on the rosette to earn an extra roll.',
    implication: 'Landing on a rosette tile gives you another roll, so it is still your turn.',
    rollStepId: 'roll-light-opening-rosette',
    moveStepId: 'move-light-opening-rosette',
  },
  {
    id: 'enter-war-zone',
    lessonNumber: 3,
    title: 'Step onto the Royal Road',
    objective: 'Keep that same runner moving and enter the shared middle row.',
    implication:
      'Your path is highlighted in blue. This is the path your checkers will take. Your checkers must reach the end of the path and exit the board to score. First player to score all seven of their checkers wins! Within the middle column, your opponent can land on your checker to capture it, which removes it from play and sends it back to your tray. Unless your checker is on the rosette tile, which is a safe spot. While a checker is here, it can’t be removed from play!',
    rollStepId: 'roll-light-enter-war-zone',
    moveStepId: 'move-light-enter-war-zone',
    coachPlacement: 'side',
  },
  {
    id: 'shared-rosette-bonus-and-safety',
    lessonNumber: 4,
    title: 'The Shared Rosette Tile Is Safe',
    objective: 'Land your checker on the shared rosette.',
    implication:
      'This central rosette tile is the most important tile in the game. It gives you another roll AND keeps your checker safe from capture. Use it to your advantage and the Royal Road will be yours!',
    rollStepId: 'roll-light-shared-rosette',
    moveStepId: 'move-light-shared-rosette',
  },
  {
    id: 'capture-in-shared-row',
    lessonNumber: 5,
    title: "Capture Your Opponents' Checkers",
    objective: 'Use the bonus roll to capture the dark piece waiting ahead of you.',
    implication:
      'While in the shared central area of the board, you and your opponent can capture each others’ pieces, sending them back to the beginning in their player’s tray.',
    rollStepId: 'roll-light-capture',
    moveStepId: 'move-light-capture',
  },
  {
    id: 'score-first-piece',
    lessonNumber: 6,
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

const getMoveStepOrThrow = (stepId: string): TutorialMoveStep & { fromIndex: number } => {
  const step = PLAYTHROUGH_TUTORIAL_SCRIPT[getStepIndexOrThrow(stepId)];
  assertTutorial(step.kind === 'MOVE', `Expected "${stepId}" to be a MOVE step.`);
  assertTutorial(typeof step.fromIndex === 'number', `Expected "${stepId}" to define fromIndex.`);
  return step as TutorialMoveStep & { fromIndex: number };
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
  const frame = PLAYTHROUGH_TUTORIAL_FRAMES[lesson.startFrameIndex];
  assertTutorial(Boolean(frame), `Missing frame for lesson index ${lessonIndex}.`);
  return cloneGameState(frame.gameState);
};

const PLAYTHROUGH_TUTORIAL_INSTRUCTION_BY_STEP_ID: Record<string, string> = {
  'roll-light-enter': 'Roll the dice to get started',
  'move-light-enter': 'Move your first checker onto the board',
  'roll-dark-open-with-runner': "Opponent's turn",
  'move-dark-open-with-runner': 'Opponent moves',
  'roll-light-opening-rosette': 'Your turn. Roll again!',
  'move-light-opening-rosette': 'Move your checker to the rosette tile',
  'roll-light-enter-war-zone': 'Roll again!',
  'move-light-enter-war-zone': 'Advance your checker',
  'roll-dark-enter-capture-runner': "Opponent's turn",
  'move-dark-enter-capture-runner': 'Opponent moves',
  'roll-light-advance-before-rosette': 'Your turn, roll again!',
  'move-light-advance-before-rosette': 'Advance your checker',
  'roll-dark-advance-capture-runner': "Opponent's turn",
  'move-dark-advance-capture-runner': 'Opponent moves',
  'roll-light-pass-before-capture-setup': 'Your turn, roll again!',
  'roll-dark-set-capture-target': "Opponent's turn",
  'move-dark-set-capture-target': 'Opponent moves',
  'roll-light-shared-rosette': 'Your turn, roll again!',
  'move-light-shared-rosette': 'Land on the rosette tile for another roll!',
  'roll-light-capture': 'Roll again!',
  'move-light-capture': "Capture your opponent's checker.",
  'roll-dark-pass-after-capture': "Opponent's turn",
  'roll-light-home-stretch': 'Your turn to roll!',
  'move-light-home-stretch': 'Advance your checker',
  'roll-dark-pass-before-score-setup': "Opponent's turn",
  'roll-light-home-rosette': 'Your turn to roll!',
  'move-light-home-rosette': 'Advance your checker',
  'roll-light-score': 'Roll a 1 to move off the board and score a point!',
  'move-light-score': 'Move your checker off the board to score a point!',
};

export const getPlaythroughTutorialInstruction = ({
  hasMoves,
  phase,
  rollValue,
  stepId,
  turn,
}: TutorialInstructionParams): string | null => {
  if (phase === 'moving' && rollValue !== null && !hasMoves) {
    if (rollValue === 0) {
      return turn === 'light'
        ? 'You rolled a zero, so your turn passes.'
        : 'Dark rolled a zero, so the turn comes back to you.';
    }

    return turn === 'light'
      ? 'No move matches that roll, so your turn passes.'
      : 'Dark rolled a number with no legal move, so the turn comes back to you.';
  }

  if (!stepId) {
    return null;
  }

  return PLAYTHROUGH_TUTORIAL_INSTRUCTION_BY_STEP_ID[stepId] ?? null;
};

export const isPlaythroughTutorialId = (value: unknown): value is typeof PLAYTHROUGH_TUTORIAL_ID =>
  value === PLAYTHROUGH_TUTORIAL_ID;
