import { buildProgressionSnapshot, PROGRESSION_RANKS, type ProgressionSnapshot, type RankDefinition } from '@/shared/progression';

const DISPLAY_TITLE_OVERRIDES: Record<string, string> = {
  Royalty: 'King',
};

const xpFormatter = new Intl.NumberFormat('en-US');

export type DisplayRankDefinition = RankDefinition & {
  displayTitle: string;
};

export const getProgressionDisplayTitle = (title?: string | null): string | null => {
  if (!title) {
    return null;
  }

  return DISPLAY_TITLE_OVERRIDES[title] ?? title;
};

export const PROGRESSION_DISPLAY_RANKS: readonly DisplayRankDefinition[] = PROGRESSION_RANKS.map((rank) => ({
  ...rank,
  displayTitle: getProgressionDisplayTitle(rank.title) ?? rank.title,
}));

export const buildDisplayedProgressionSnapshot = (totalXp: number): ProgressionSnapshot => {
  const snapshot = buildProgressionSnapshot(totalXp);

  return {
    ...snapshot,
    currentRank: getProgressionDisplayTitle(snapshot.currentRank) ?? snapshot.currentRank,
    nextRank: getProgressionDisplayTitle(snapshot.nextRank),
  };
};

export const formatProgressionXp = (value: number): string =>
  xpFormatter.format(Math.max(0, Math.floor(value)));
