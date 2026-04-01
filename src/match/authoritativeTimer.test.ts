import { projectAuthoritativeServerTimeMs, resolveAuthoritativeRemainingMs } from './authoritativeTimer';

describe('authoritativeTimer', () => {
  it('projects server time from the snapshot receipt timestamp', () => {
    expect(
      projectAuthoritativeServerTimeMs({
        serverTimeMs: 5_000,
        snapshotReceivedAtMs: 10_000,
        nowMs: 10_600,
      }),
    ).toBe(5_600);
  });

  it('prefers authoritative deadlines when synchronized server time is available', () => {
    expect(
      resolveAuthoritativeRemainingMs({
        deadlineMs: 15_000,
        remainingMs: 10_000,
        serverTimeMs: 5_000,
        snapshotReceivedAtMs: 20_000,
        nowMs: 21_400,
      }),
    ).toBe(8_600);
  });

  it('falls back to snapshot elapsed time when only remaining time is available', () => {
    expect(
      resolveAuthoritativeRemainingMs({
        deadlineMs: null,
        remainingMs: 7_500,
        serverTimeMs: null,
        snapshotReceivedAtMs: 40_000,
        nowMs: 41_250,
      }),
    ).toBe(6_250);
  });

  it('clamps fallback remaining time at zero', () => {
    expect(
      resolveAuthoritativeRemainingMs({
        deadlineMs: null,
        remainingMs: 800,
        serverTimeMs: null,
        snapshotReceivedAtMs: 12_000,
        nowMs: 13_500,
      }),
    ).toBe(0);
  });
});
