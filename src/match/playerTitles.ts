import type { BotDifficulty } from '@/logic/bot/types';
import type { PlayerColor } from '@/logic/types';
import type { StateSnapshotPlayers } from '@/shared/urMatchProtocol';
import type { User } from '@/src/types/user';

const DEFAULT_HUMAN_SCORE_TITLE = 'Player';
const GUEST_SCORE_TITLE = 'Guest';

const BOT_SCORE_TITLES: Record<BotDifficulty, string> = {
  easy: 'Easy Bot',
  medium: 'Medium Bot',
  hard: 'Hard Bot',
  perfect: 'Perfect Bot',
};

export const getHumanScoreTitle = (
  user: Pick<User, 'username' | 'provider'> | null | undefined,
): string => {
  if (user?.provider === 'guest') {
    return GUEST_SCORE_TITLE;
  }

  const username = user?.username?.trim();
  return username && username.length > 0 ? username : DEFAULT_HUMAN_SCORE_TITLE;
};

export const getBotScoreTitle = (difficulty: BotDifficulty): string => BOT_SCORE_TITLES[difficulty];

export const getPlayerColorForUserId = (
  players: StateSnapshotPlayers | null | undefined,
  userId: string | null | undefined,
): PlayerColor | null => {
  if (!players || !userId) {
    return null;
  }

  if (players.light.userId === userId) {
    return 'light';
  }

  if (players.dark.userId === userId) {
    return 'dark';
  }

  return null;
};

export const getSnapshotScoreTitle = (
  players: StateSnapshotPlayers | null | undefined,
  color: PlayerColor,
): string | null => {
  const title = players?.[color]?.title?.trim();
  return title && title.length > 0 ? title : null;
};
