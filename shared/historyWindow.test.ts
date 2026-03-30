import { getAppendedHistoryEntries } from './historyWindow';

describe('getAppendedHistoryEntries', () => {
  it('returns only the entries appended since the previous count when the windows overlap', () => {
    expect(
      getAppendedHistoryEntries(
        ['light rolled 1', 'light moved to 1'],
        2,
        ['light rolled 1', 'light moved to 1', 'dark rolled 0'],
        3,
      ),
    ).toEqual(['dark rolled 0']);
  });

  it('falls back to the current window when older entries have been trimmed away', () => {
    expect(
      getAppendedHistoryEntries(
        ['light rolled 1', 'light moved to 1'],
        2,
        ['dark moved to 4', 'light rolled 0'],
        8,
      ),
    ).toEqual(['dark moved to 4', 'light rolled 0']);
  });
});
