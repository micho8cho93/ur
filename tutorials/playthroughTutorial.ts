import { createInitialState } from '@/logic/engine';
import { PATH_LENGTH } from '@/logic/constants';
import type { GameState, MoveAction, PlayerColor } from '@/logic/types';

export const PLAYTHROUGH_TUTORIAL_ID = 'playthrough' as const;
export const PLAYTHROUGH_TUTORIAL_LESSON_COUNT = 6 as const;

export type PlaythroughTutorialSegment = {
  id: string;
  lessonNumber: number;
  title: string;
  objective: string;
  implication: string;
  snapshot: GameState;
  forcedRoll: 0 | 1 | 2 | 3 | 4;
  expectedMove: MoveAction;
};

type PiecePlacement = number | 'finished';

const applyPlacements = (
  state: GameState,
  color: PlayerColor,
  placements: PiecePlacement[],
) => {
  const player = state[color];

  placements.forEach((placement, index) => {
    const piece = player.pieces[index];
    if (!piece) {
      return;
    }

    if (placement === 'finished') {
      piece.position = PATH_LENGTH;
      piece.isFinished = true;
      player.finishedCount += 1;
      return;
    }

    piece.position = placement;
  });
};

const createTutorialState = (params: {
  light?: PiecePlacement[];
  dark?: PiecePlacement[];
  currentTurn?: PlayerColor;
  phase?: GameState['phase'];
  rollValue?: number | null;
  history?: string[];
}): GameState => {
  const state = createInitialState();
  state.currentTurn = params.currentTurn ?? 'light';
  state.phase = params.phase ?? 'rolling';
  state.rollValue = params.rollValue ?? null;
  state.history = [...(params.history ?? [])];

  if (params.light) {
    applyPlacements(state, 'light', params.light);
  }

  if (params.dark) {
    applyPlacements(state, 'dark', params.dark);
  }

  return state;
};

export const PLAYTHROUGH_TUTORIAL_SEGMENTS: readonly PlaythroughTutorialSegment[] = [
  {
    id: 'enter-board',
    lessonNumber: 1,
    title: 'Bring A Piece In',
    objective: 'Move a new piece from reserve onto the board.',
    implication: 'Pieces start in reserve. Bringing one in gives you a piece to race with.',
    snapshot: createTutorialState({}),
    forcedRoll: 1,
    expectedMove: { pieceId: 'light-0', fromIndex: -1, toIndex: 0 },
  },
  {
    id: 'leave-safe-lane',
    lessonNumber: 2,
    title: 'Step Into The War Zone',
    objective: 'Move your lead piece off the rosette and into the middle row.',
    implication: 'The middle row is the war zone. Once you enter it, captures become possible.',
    snapshot: createTutorialState({
      light: [3],
      dark: [0],
    }),
    forcedRoll: 1,
    expectedMove: { pieceId: 'light-0', fromIndex: 3, toIndex: 4 },
  },
  {
    id: 'rosette-extra-roll',
    lessonNumber: 3,
    title: 'Rosettes Give Another Roll',
    objective: 'Move your lead piece onto the rosette.',
    implication: 'Landing on a rosette keeps your turn, so you get to roll again right away.',
    snapshot: createTutorialState({
      light: [4, 0],
      dark: [8],
    }),
    forcedRoll: 3,
    expectedMove: { pieceId: 'light-0', fromIndex: 4, toIndex: 7 },
  },
  {
    id: 'capture-in-war-zone',
    lessonNumber: 4,
    title: 'Capture In The Middle',
    objective: 'After rolling again, capture the dark piece in the middle row.',
    implication: 'Capturing sends the enemy piece back to reserve and costs your opponent time.',
    snapshot: createTutorialState({
      light: [7, 0],
      dark: [8],
    }),
    forcedRoll: 1,
    expectedMove: { pieceId: 'light-0', fromIndex: 7, toIndex: 8 },
  },
  {
    id: 'shared-rosette-safety',
    lessonNumber: 5,
    title: 'The Shared Rosette Is Safe',
    objective: 'Move your other piece onto the shared rosette.',
    implication: 'That rosette is a safe spot. Pieces on it cannot be captured.',
    snapshot: createTutorialState({
      light: [11, 6],
      dark: [1],
    }),
    forcedRoll: 1,
    expectedMove: { pieceId: 'light-1', fromIndex: 6, toIndex: 7 },
  },
  {
    id: 'home-stretch',
    lessonNumber: 6,
    title: 'Enter The Last Two Tiles',
    objective: 'Move your lead piece into the last two tiles.',
    implication: 'The last two tiles set up scoring. You still need the exact roll to finish.',
    snapshot: createTutorialState({
      light: [11, 7],
      dark: [1],
    }),
    forcedRoll: 2,
    expectedMove: { pieceId: 'light-0', fromIndex: 11, toIndex: 13 },
  },
  {
    id: 'score-button',
    lessonNumber: 6,
    title: 'Use The SCORE Button',
    objective: 'Use the SCORE button to bear off your first piece.',
    implication: 'Scoring removes the piece from the board and gives you your first point.',
    snapshot: createTutorialState({
      light: [13, 7],
      dark: [1],
    }),
    forcedRoll: 1,
    expectedMove: { pieceId: 'light-0', fromIndex: 13, toIndex: PATH_LENGTH },
  },
] as const;

export const isPlaythroughTutorialId = (value: unknown): value is typeof PLAYTHROUGH_TUTORIAL_ID =>
  value === PLAYTHROUGH_TUTORIAL_ID;
