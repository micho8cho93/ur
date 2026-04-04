import type { PlayerColor } from '@/logic/types';
import type { StateSnapshotPlayers } from '@/shared/urMatchProtocol';

type ScoreTitles = Record<PlayerColor, string>;
type ScoreRankTitles = Record<PlayerColor, string | null>;

type ResolveMatchScoreRankTitlesOptions = {
  authoritativePlayers: StateSnapshotPlayers | null;
  isOffline: boolean;
  isOfflineLocalPvPMatch: boolean;
  humanScoreTitle: string;
  playerRankTitle: string | null;
  resolvedPlayerColor: PlayerColor | null;
  scoreTitles: ScoreTitles;
};

const GUEST_SCORE_TITLE = 'Guest';
const LABORER_RANK_TITLE = 'Laborer';

const resolveOnlineSideRankTitle = ({
  authoritativePlayers,
  side,
  humanScoreTitle,
  playerRankTitle,
  resolvedPlayerColor,
  scoreTitles,
}: Pick<
  ResolveMatchScoreRankTitlesOptions,
  'authoritativePlayers' | 'humanScoreTitle' | 'playerRankTitle' | 'resolvedPlayerColor' | 'scoreTitles'
> & {
  side: PlayerColor;
}): string | null => {
  const scoreTitle = scoreTitles[side].trim();
  const snapshotRankTitle = authoritativePlayers?.[side]?.rankTitle ?? null;

  if (snapshotRankTitle) {
    return snapshotRankTitle;
  }

  if (resolvedPlayerColor === side) {
    return playerRankTitle;
  }

  if (
    humanScoreTitle !== GUEST_SCORE_TITLE &&
    playerRankTitle &&
    scoreTitle.length > 0 &&
    scoreTitle === humanScoreTitle
  ) {
    return playerRankTitle;
  }

  if (scoreTitle === GUEST_SCORE_TITLE) {
    return LABORER_RANK_TITLE;
  }

  return null;
};

export const resolveMatchScoreRankTitles = ({
  authoritativePlayers,
  isOffline,
  isOfflineLocalPvPMatch,
  humanScoreTitle,
  playerRankTitle,
  resolvedPlayerColor,
  scoreTitles,
}: ResolveMatchScoreRankTitlesOptions): ScoreRankTitles => {
  if (isOfflineLocalPvPMatch) {
    return {
      light: LABORER_RANK_TITLE,
      dark: LABORER_RANK_TITLE,
    };
  }

  if (isOffline) {
    return {
      light: playerRankTitle,
      dark: null,
    };
  }

  return {
    light: resolveOnlineSideRankTitle({
      authoritativePlayers,
      side: 'light',
      humanScoreTitle,
      playerRankTitle,
      resolvedPlayerColor,
      scoreTitles,
    }),
    dark: resolveOnlineSideRankTitle({
      authoritativePlayers,
      side: 'dark',
      humanScoreTitle,
      playerRankTitle,
      resolvedPlayerColor,
      scoreTitles,
    }),
  };
};
