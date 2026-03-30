export const getAppendedHistoryEntries = (
  previousEntries: readonly string[],
  previousCount: number,
  nextEntries: readonly string[],
  nextCount: number,
): string[] => {
  if (nextCount <= previousCount || nextEntries.length === 0) {
    return [];
  }

  const nextWindowStart = Math.max(0, nextCount - nextEntries.length);
  if (previousCount < nextWindowStart) {
    return [...nextEntries];
  }

  const sliceStart = Math.max(0, previousCount - nextWindowStart);
  return nextEntries.slice(sliceStart);
};
