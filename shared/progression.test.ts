import {
  buildProgressionSnapshot,
  createDefaultProgressionProfile,
  getXpAwardAmount,
  getNextRankForXp,
  getProgressWithinCurrentRank,
  getRankForXp,
  getXpRequiredForNextRank,
  MAX_PROGRESSION_RANK,
} from "./progression";

describe("progression helpers", () => {
  it("derives the correct rank for cumulative XP thresholds", () => {
    expect(getRankForXp(0).title).toBe("Laborer");
    expect(getRankForXp(100).title).toBe("Servant of the Temple");
    expect(getRankForXp(13175).title).toBe("Royalty");
    expect(getRankForXp(40000).title).toBe("Immortal");
    expect(getRankForXp(999999).title).toBe("Immortal");
  });

  it("returns the next rank when one exists", () => {
    expect(getNextRankForXp(0)?.title).toBe("Servant of the Temple");
    expect(getNextRankForXp(250)?.title).toBe("Scribe");
    expect(getNextRankForXp(MAX_PROGRESSION_RANK.threshold)).toBeNull();
  });

  it("computes progress inside the current rank band", () => {
    const progress = getProgressWithinCurrentRank(200);

    expect(progress.currentRank.title).toBe("Servant of the Temple");
    expect(progress.nextRank?.title).toBe("Apprentice Scribe");
    expect(progress.xpIntoCurrentRank).toBe(100);
    expect(progress.progressPercent).toBeCloseTo(66.67, 2);
  });

  it("computes XP needed for the next rank and handles max rank", () => {
    expect(getXpRequiredForNextRank(200)).toBe(50);
    expect(getXpRequiredForNextRank(MAX_PROGRESSION_RANK.threshold)).toBe(0);
  });

  it("builds a stable progression snapshot for intermediate ranks", () => {
    expect(buildProgressionSnapshot(200)).toEqual({
      totalXp: 200,
      currentRank: "Servant of the Temple",
      currentRankThreshold: 100,
      nextRank: "Apprentice Scribe",
      nextRankThreshold: 250,
      xpIntoCurrentRank: 100,
      xpNeededForNextRank: 50,
      progressPercent: 66.67,
    });
  });

  it("returns a terminal snapshot for max-rank players", () => {
    expect(buildProgressionSnapshot(45000)).toEqual({
      totalXp: 45000,
      currentRank: "Immortal",
      currentRankThreshold: 40000,
      nextRank: null,
      nextRankThreshold: null,
      xpIntoCurrentRank: 5000,
      xpNeededForNextRank: 0,
      progressPercent: 100,
    });
  });

  it("creates a default persisted profile from the rank helpers", () => {
    expect(createDefaultProgressionProfile(475, "2026-03-19T12:00:00.000Z")).toEqual({
      totalXp: 475,
      currentRankTitle: "Scribe",
      lastUpdatedAt: "2026-03-19T12:00:00.000Z",
    });
  });

  it("keeps private-match wins as the smallest win reward", () => {
    expect(getXpAwardAmount("private_pvp_win")).toBe(25);
    expect(getXpAwardAmount("private_pvp_win")).toBeLessThan(getXpAwardAmount("pvp_win"));
  });
});
