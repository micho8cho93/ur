export type RankDefinition = {
  index: number;
  title: string;
  threshold: number;
};

// Thresholds are cumulative total XP, not per-rank deltas.
export const PROGRESSION_RANKS: readonly RankDefinition[] = [
  { index: 1, title: "Laborer", threshold: 0 },
  { index: 2, title: "Servant of the Temple", threshold: 100 },
  { index: 3, title: "Apprentice Scribe", threshold: 250 },
  { index: 4, title: "Scribe", threshold: 475 },
  { index: 5, title: "Merchant", threshold: 800 },
  { index: 6, title: "Artisan", threshold: 1275 },
  { index: 7, title: "Priest", threshold: 1975 },
  { index: 8, title: "Diviner", threshold: 2975 },
  { index: 9, title: "Royal Guard", threshold: 4375 },
  { index: 10, title: "Noble of the Court", threshold: 6375 },
  { index: 11, title: "Governor", threshold: 9175 },
  { index: 12, title: "Royalty", threshold: 13175 },
  { index: 13, title: "High Priest", threshold: 19175 },
  { index: 14, title: "Emperor of Sumer & Akkad", threshold: 28175 },
  { index: 15, title: "Immortal", threshold: 40000 },
] as const;

export const XP_SOURCE_CONFIG = {
  pvp_win: {
    amount: 100,
    description: "Authoritative PvP win reward.",
  },
  bot_win: {
    amount: 100,
    description: "Authenticated bot win reward.",
  },
} as const;

export type XpSource = keyof typeof XP_SOURCE_CONFIG;

export type ProgressionProfile = {
  totalXp: number;
  currentRankTitle: string;
  lastUpdatedAt: string;
};

export type ProgressionSnapshot = {
  totalXp: number;
  currentRank: string;
  currentRankThreshold: number;
  nextRank: string | null;
  nextRankThreshold: number | null;
  xpIntoCurrentRank: number;
  xpNeededForNextRank: number;
  progressPercent: number;
};

export type ProgressionAwardResponse = {
  matchId: string;
  source: XpSource;
  duplicate: boolean;
  awardedXp: number;
  previousTotalXp: number;
  newTotalXp: number;
  previousRank: string;
  newRank: string;
  rankChanged: boolean;
  progression: ProgressionSnapshot;
};

export type ProgressionAwardNotificationPayload = ProgressionAwardResponse & {
  type: "progression_award";
};

export type ProgressionRpcResponse = ProgressionSnapshot;

const MAX_RANK = PROGRESSION_RANKS[PROGRESSION_RANKS.length - 1];

const roundProgressPercent = (value: number): number => Math.round(value * 100) / 100;

export const sanitizeTotalXp = (value: number): number => {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.floor(value));
};

export const getXpAwardAmount = (source: XpSource): number => XP_SOURCE_CONFIG[source].amount;

export const createDefaultProgressionProfile = (
  totalXp = 0,
  lastUpdatedAt = new Date().toISOString()
): ProgressionProfile => {
  const sanitizedXp = sanitizeTotalXp(totalXp);
  const currentRank = getRankForXp(sanitizedXp);

  return {
    totalXp: sanitizedXp,
    currentRankTitle: currentRank.title,
    lastUpdatedAt,
  };
};

export const getRankForXp = (totalXp: number): RankDefinition => {
  const sanitizedXp = sanitizeTotalXp(totalXp);

  for (let index = PROGRESSION_RANKS.length - 1; index >= 0; index -= 1) {
    const rank = PROGRESSION_RANKS[index];
    if (sanitizedXp >= rank.threshold) {
      return rank;
    }
  }

  return PROGRESSION_RANKS[0];
};

export const getNextRankForXp = (totalXp: number): RankDefinition | null => {
  const currentRank = getRankForXp(totalXp);
  const nextRankIndex = currentRank.index;
  return PROGRESSION_RANKS[nextRankIndex] ?? null;
};

export const getProgressWithinCurrentRank = (
  totalXp: number
): {
  currentRank: RankDefinition;
  nextRank: RankDefinition | null;
  xpIntoCurrentRank: number;
  progressPercent: number;
} => {
  const sanitizedXp = sanitizeTotalXp(totalXp);
  const currentRank = getRankForXp(sanitizedXp);
  const nextRank = getNextRankForXp(sanitizedXp);

  if (!nextRank) {
    return {
      currentRank,
      nextRank: null,
      xpIntoCurrentRank: Math.max(0, sanitizedXp - currentRank.threshold),
      progressPercent: 100,
    };
  }

  const xpIntoCurrentRank = Math.max(0, sanitizedXp - currentRank.threshold);
  const rankSpan = Math.max(1, nextRank.threshold - currentRank.threshold);
  const progressPercent = roundProgressPercent(Math.min(100, (xpIntoCurrentRank / rankSpan) * 100));

  return {
    currentRank,
    nextRank,
    xpIntoCurrentRank,
    progressPercent,
  };
};

export const getXpRequiredForNextRank = (totalXp: number): number => {
  const sanitizedXp = sanitizeTotalXp(totalXp);
  const nextRank = getNextRankForXp(sanitizedXp);
  if (!nextRank) {
    return 0;
  }

  return Math.max(0, nextRank.threshold - sanitizedXp);
};

export const buildProgressionSnapshot = (totalXp: number): ProgressionSnapshot => {
  const sanitizedXp = sanitizeTotalXp(totalXp);
  const { currentRank, nextRank, xpIntoCurrentRank, progressPercent } =
    getProgressWithinCurrentRank(sanitizedXp);

  return {
    totalXp: sanitizedXp,
    currentRank: currentRank.title,
    currentRankThreshold: currentRank.threshold,
    nextRank: nextRank?.title ?? null,
    nextRankThreshold: nextRank?.threshold ?? null,
    xpIntoCurrentRank,
    xpNeededForNextRank: getXpRequiredForNextRank(sanitizedXp),
    progressPercent: nextRank ? progressPercent : 100,
  };
};

export const isProgressionSnapshot = (value: unknown): value is ProgressionSnapshot => {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const snapshot = value as ProgressionSnapshot;
  return (
    typeof snapshot.totalXp === "number" &&
    typeof snapshot.currentRank === "string" &&
    typeof snapshot.currentRankThreshold === "number" &&
    (typeof snapshot.nextRank === "string" || snapshot.nextRank === null) &&
    (typeof snapshot.nextRankThreshold === "number" || snapshot.nextRankThreshold === null) &&
    typeof snapshot.xpIntoCurrentRank === "number" &&
    typeof snapshot.xpNeededForNextRank === "number" &&
    typeof snapshot.progressPercent === "number"
  );
};

export const isProgressionAwardResponse = (value: unknown): value is ProgressionAwardResponse => {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const award = value as ProgressionAwardResponse;
  return (
    typeof award.matchId === "string" &&
    typeof award.source === "string" &&
    typeof award.duplicate === "boolean" &&
    typeof award.awardedXp === "number" &&
    typeof award.previousTotalXp === "number" &&
    typeof award.newTotalXp === "number" &&
    typeof award.previousRank === "string" &&
    typeof award.newRank === "string" &&
    typeof award.rankChanged === "boolean" &&
    isProgressionSnapshot(award.progression)
  );
};

export const isProgressionAwardNotificationPayload = (
  value: unknown
): value is ProgressionAwardNotificationPayload => {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const payload = value as ProgressionAwardNotificationPayload;
  return payload.type === "progression_award" && isProgressionAwardResponse(payload);
};

export const MAX_PROGRESSION_RANK = MAX_RANK;
