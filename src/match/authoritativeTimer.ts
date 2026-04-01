type TimerValue = number | null | undefined;

const clampToRemainingMs = (value: number) => Math.max(0, Math.round(value));

export const projectAuthoritativeServerTimeMs = ({
  serverTimeMs,
  snapshotReceivedAtMs,
  nowMs,
}: {
  serverTimeMs: TimerValue;
  snapshotReceivedAtMs: TimerValue;
  nowMs: number;
}): number | null => {
  if (typeof serverTimeMs !== 'number' || typeof snapshotReceivedAtMs !== 'number') {
    return null;
  }

  return serverTimeMs + Math.max(0, nowMs - snapshotReceivedAtMs);
};

export const resolveAuthoritativeRemainingMs = ({
  deadlineMs,
  remainingMs,
  serverTimeMs,
  snapshotReceivedAtMs,
  nowMs,
}: {
  deadlineMs: TimerValue;
  remainingMs: TimerValue;
  serverTimeMs: TimerValue;
  snapshotReceivedAtMs: TimerValue;
  nowMs: number;
}): number | undefined => {
  const projectedServerTimeMs = projectAuthoritativeServerTimeMs({
    serverTimeMs,
    snapshotReceivedAtMs,
    nowMs,
  });

  if (projectedServerTimeMs !== null && typeof deadlineMs === 'number') {
    return clampToRemainingMs(deadlineMs - projectedServerTimeMs);
  }

  if (typeof remainingMs === 'number' && typeof snapshotReceivedAtMs === 'number') {
    return clampToRemainingMs(remainingMs - Math.max(0, nowMs - snapshotReceivedAtMs));
  }

  if (typeof remainingMs === 'number') {
    return clampToRemainingMs(remainingMs);
  }

  return undefined;
};
