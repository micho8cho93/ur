import { DEFAULT_BOT_DIFFICULTY, isBotDifficulty, type BotDifficulty } from '../logic/bot/types';

export type TournamentBotPolicy = {
  autoAdd: boolean;
  difficulty: BotDifficulty | null;
};

export type TournamentBotSummary = TournamentBotPolicy & {
  count: number;
};

export const TOURNAMENT_BOT_USER_ID_PREFIX = 'tournament-bot:';

const asRecord = (value: unknown): Record<string, unknown> | null =>
  typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : null;

const readBooleanField = (value: unknown, keys: string[]): boolean | null => {
  const record = asRecord(value);
  if (!record) {
    return null;
  }

  for (const key of keys) {
    if (typeof record[key] === 'boolean') {
      return record[key] as boolean;
    }
  }

  return null;
};

const readStringField = (value: unknown, keys: string[]): string | null => {
  const record = asRecord(value);
  if (!record) {
    return null;
  }

  for (const key of keys) {
    const candidate = record[key];
    if (typeof candidate === 'string' && candidate.trim().length > 0) {
      return candidate.trim();
    }
  }

  return null;
};

const parseBotSlot = (userId: string): number | null => {
  if (!isTournamentBotUserId(userId)) {
    return null;
  }

  const parts = userId.split(':');
  const parsed = Number(parts[parts.length - 1]);
  return Number.isFinite(parsed) ? Math.max(1, Math.floor(parsed)) : null;
};

export const isTournamentBotUserId = (value: string | null | undefined): value is string =>
  typeof value === 'string' && value.startsWith(TOURNAMENT_BOT_USER_ID_PREFIX);

export const buildTournamentBotUserId = (runId: string, slot: number): string =>
  `${TOURNAMENT_BOT_USER_ID_PREFIX}${runId}:${Math.max(1, Math.floor(slot))}`;

export const formatBotDifficultyLabel = (difficulty: BotDifficulty): string =>
  `${difficulty.slice(0, 1).toUpperCase()}${difficulty.slice(1)}`;

export const buildTournamentBotDisplayName = (difficulty: BotDifficulty, ordinal: number): string =>
  `${formatBotDifficultyLabel(difficulty)} Bot ${Math.max(1, Math.floor(ordinal))}`;

export const normalizeTournamentBotPolicy = (metadata: unknown): TournamentBotPolicy => {
  const autoAdd = readBooleanField(metadata, ['autoAddBots', 'auto_add_bots']) ?? false;
  const requestedDifficulty = readStringField(metadata, ['botDifficulty', 'bot_difficulty']);
  const difficulty = requestedDifficulty && isBotDifficulty(requestedDifficulty) ? requestedDifficulty : null;

  if (!autoAdd) {
    return {
      autoAdd: false,
      difficulty: null,
    };
  }

  return {
    autoAdd: true,
    difficulty: difficulty ?? DEFAULT_BOT_DIFFICULTY,
  };
};

export const buildTournamentBotDisplayNames = (
  userIds: Array<string | null | undefined>,
  difficulty: BotDifficulty | null,
): Record<string, string> => {
  const resolvedDifficulty = difficulty ?? DEFAULT_BOT_DIFFICULTY;
  const uniqueIds = Array.from(new Set(userIds.filter(isTournamentBotUserId)));
  uniqueIds.sort((left, right) => {
    const leftSlot = parseBotSlot(left) ?? Number.MAX_SAFE_INTEGER;
    const rightSlot = parseBotSlot(right) ?? Number.MAX_SAFE_INTEGER;

    if (leftSlot !== rightSlot) {
      return leftSlot - rightSlot;
    }

    return left.localeCompare(right);
  });

  return uniqueIds.reduce<Record<string, string>>((accumulator, userId, index) => {
    accumulator[userId] = buildTournamentBotDisplayName(resolvedDifficulty, index + 1);
    return accumulator;
  }, {});
};

export const countTournamentBotEntrants = (userIds: Array<string | null | undefined>): number =>
  Object.keys(buildTournamentBotDisplayNames(userIds, null)).length;

export const buildTournamentBotSummary = (
  metadata: unknown,
  userIds: Array<string | null | undefined>,
): TournamentBotSummary => {
  const policy = normalizeTournamentBotPolicy(metadata);

  return {
    ...policy,
    count: countTournamentBotEntrants(userIds),
  };
};

export const getTournamentBotStatusLabel = (bots: TournamentBotSummary): string => {
  if (bots.count > 0 && bots.difficulty) {
    return `Includes ${bots.count} ${bots.difficulty} bot${bots.count === 1 ? '' : 's'}`;
  }

  if (bots.autoAdd && bots.difficulty) {
    return `Bot fill enabled · ${bots.difficulty}`;
  }

  return 'Bots off';
};
