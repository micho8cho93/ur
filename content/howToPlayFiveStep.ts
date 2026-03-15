import { HOW_TO_PLAY_FINAL_NOTE } from '@/content/howToPlay';

export type HowToPlayPreviewId =
  | 'goal'
  | 'takingTurn'
  | 'legalMoves'
  | 'captures'
  | 'safeSquaresStrategy';

export interface HowToPlayStep {
  id: string;
  heading: string;
  items: string[];
  previewId: HowToPlayPreviewId;
}

export const HOW_TO_PLAY_FIVE_STEP_TITLE = '5 Step Tutorial';
export const HOW_TO_PLAY_FIVE_STEP_NOTE = HOW_TO_PLAY_FINAL_NOTE;

export const HOW_TO_PLAY_STEPS: HowToPlayStep[] = [
  {
    id: 'goal',
    heading: 'Goal',
    items: ['Move all of your pieces from the start, along the track, and off the board before your opponent.'],
    previewId: 'goal',
  },
  {
    id: 'taking-turn',
    heading: 'Taking a turn',
    items: [
      'Roll the dice to determine how many squares you can move.',
      'If you have at least one legal move, choose a piece to move exactly that number of squares.',
      'If you roll 0 or have no legal moves, your turn ends.',
    ],
    previewId: 'takingTurn',
  },
  {
    id: 'legal-moves',
    heading: 'Legal moves',
    items: [
      'You must move a piece forward by the exact roll.',
      "You can't land on a square occupied by one of your own pieces.",
      'To score, you must roll the exact number needed to move off the board.',
    ],
    previewId: 'legalMoves',
  },
  {
    id: 'captures',
    heading: 'Captures',
    items: ['If you land on an opponent on a normal square, you capture it and send it back to reserve.'],
    previewId: 'captures',
  },
  {
    id: 'safe-squares-strategy',
    heading: 'Safe squares + strategy tips',
    items: [
      "Landing on a rosette is safe: your piece can't be captured while it stays there.",
      "Landing on a rosette also grants an extra turn, and you can't capture a piece on a rosette.",
      'Prioritize rosettes for safety and momentum.',
      'Avoid leaving pieces vulnerable on contested shared squares.',
      "Bring new pieces onto the board when it's safe, but don't overcrowd your own path.",
    ],
    previewId: 'safeSquaresStrategy',
  },
];
