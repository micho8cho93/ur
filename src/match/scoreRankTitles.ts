import type { PlayerColor } from '@/logic/types';

type ScoreTitles = Record<PlayerColor, string>;
type ScoreRankTitles = Record<PlayerColor, string | null>;

type ResolveMatchScoreRankTitlesOptions = {
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
  side,
  humanScoreTitle,
  playerRankTitle,
  resolvedPlayerColor,
  scoreTitles,
}: Pick<
  ResolveMatchScoreRankTitlesOptions,
  'humanScoreTitle' | 'playerRankTitle' | 'resolvedPlayerColor' | 'scoreTitles'
> & {
  side: PlayerColor;
}): string | null => {
  const scoreTitle = scoreTitles[side].trim();

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
      side: 'light',
      humanScoreTitle,
      playerRankTitle,
      resolvedPlayerColor,
      scoreTitles,
    }),
    dark: resolveOnlineSideRankTitle({
      side: 'dark',
      humanScoreTitle,
      playerRankTitle,
      resolvedPlayerColor,
      scoreTitles,
    }),
  };
};
