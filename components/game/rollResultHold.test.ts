import {
  getNoMoveRollValueFromHistoryEntry,
  ROLL_RESULT_HOLD_MS,
  shouldHoldRollResult,
} from './rollResultHold';

describe('rollResultHold', () => {
  it('extracts the no-move roll value from history entries', () => {
    expect(getNoMoveRollValueFromHistoryEntry('light rolled 0 but had no moves.')).toBe(0);
    expect(getNoMoveRollValueFromHistoryEntry('dark rolled 3 but had no moves.')).toBe(3);
  });

  it('ignores unrelated history entries', () => {
    expect(getNoMoveRollValueFromHistoryEntry('light moved to 3. Rosette: false')).toBeNull();
    expect(getNoMoveRollValueFromHistoryEntry('dark captured light')).toBeNull();
  });

  it('holds only zero-roll outcomes for 1 second', () => {
    expect(shouldHoldRollResult(0)).toBe(true);
    expect(shouldHoldRollResult(1)).toBe(false);
    expect(shouldHoldRollResult(null)).toBe(false);
    expect(ROLL_RESULT_HOLD_MS).toBe(1_000);
  });
});
