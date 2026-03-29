export const SLOT_DICE_TIMING_SCALE = 1.3;
const scaleDuration = (durationMs: number) => Math.round(durationMs * SLOT_DICE_TIMING_SCALE);

export const DEFAULT_DICE_ROLL_DURATION_MS = scaleDuration(520);
export const SLOT_DICE_COUNT = 4;
export const SLOT_DICE_SPIN_STEP_MS = scaleDuration(16);
export const SLOT_DICE_SPIN_STEP_VARIANCE_MS = scaleDuration(1);
export const SLOT_DICE_STOP_STAGGER_MS = scaleDuration(48);
export const SLOT_DICE_STOP_SETTLE_MS = scaleDuration(320);
export const SLOT_DICE_STOP_BOUNCE_MS = 0;
export const SLOT_DICE_TOTAL_STOP_MS =
  SLOT_DICE_STOP_SETTLE_MS + SLOT_DICE_STOP_STAGGER_MS * (SLOT_DICE_COUNT - 1);

export type SlotDiceVariant = 'animated' | 'start' | 'settled';

const createSeededRandom = (seed: number) => {
  let state = seed >>> 0;

  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x100000000;
  };
};

export const clampSlotRollValue = (rollValue: number | null) => {
  if (rollValue === null || !Number.isFinite(rollValue)) {
    return null;
  }

  return Math.max(0, Math.min(SLOT_DICE_COUNT, Math.round(rollValue)));
};

export const buildSlotDiceFaces = ({
  playbackId,
  rollValue,
}: {
  playbackId: number;
  rollValue: number | null;
}) => {
  const normalizedRollValue = clampSlotRollValue(rollValue);

  if (normalizedRollValue === null) {
    return Array.from({ length: SLOT_DICE_COUNT }, () => false);
  }

  const indices = Array.from({ length: SLOT_DICE_COUNT }, (_, index) => index);
  const nextRandom = createSeededRandom((playbackId || 1) * 131 + normalizedRollValue * 977 + 17);

  for (let index = indices.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(nextRandom() * (index + 1));
    [indices[index], indices[swapIndex]] = [indices[swapIndex], indices[index]];
  }

  const markedIndices = new Set(indices.slice(0, normalizedRollValue));

  return Array.from({ length: SLOT_DICE_COUNT }, (_, index) => markedIndices.has(index));
};
