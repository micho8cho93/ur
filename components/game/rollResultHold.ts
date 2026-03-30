export const ROLL_RESULT_HOLD_MS = 1_000;

const NO_MOVE_ROLL_HISTORY_RE = /^(light|dark) rolled (\d+) but had no moves\.$/;

export const getNoMoveRollValueFromHistoryEntry = (entry: string): number | null => {
  const match = entry.match(NO_MOVE_ROLL_HISTORY_RE);
  if (!match) {
    return null;
  }

  const parsedValue = Number.parseInt(match[2] ?? '', 10);
  if (!Number.isInteger(parsedValue) || parsedValue < 0 || parsedValue > 4) {
    return null;
  }

  return parsedValue;
};

export const shouldHoldRollResult = (value: number | null): boolean => value === 0;
