import type { PlayerColor } from '@/logic/types';
import type { MatchEndPayload, StateSnapshotPlayers } from '@/shared/urMatchProtocol';
import { getPlayerColorForUserId } from '@/src/match/playerTitles';

export const resolveMatchPlayerColor = (params: {
  playerColor: PlayerColor | null;
  authoritativePlayers: StateSnapshotPlayers | null;
  userId: string | null;
}): PlayerColor | null => {
  if (params.playerColor === 'light' || params.playerColor === 'dark') {
    return params.playerColor;
  }

  if (!params.authoritativePlayers || !params.userId) {
    return null;
  }

  return getPlayerColorForUserId(params.authoritativePlayers, params.userId);
};

export const resolveDidPlayerWin = (params: {
  winnerColor: PlayerColor | null;
  resolvedPlayerColor: PlayerColor | null;
  authoritativeMatchEnd: MatchEndPayload | null;
  userId: string | null;
}): boolean | null => {
  if (params.resolvedPlayerColor === 'light' || params.resolvedPlayerColor === 'dark') {
    if (params.winnerColor) {
      return params.winnerColor === params.resolvedPlayerColor;
    }

    if (
      params.userId &&
      params.authoritativeMatchEnd &&
      (params.authoritativeMatchEnd.winnerUserId === params.userId ||
        params.authoritativeMatchEnd.loserUserId === params.userId)
    ) {
      return params.authoritativeMatchEnd.winnerUserId === params.userId;
    }

    return null;
  }

  if (!params.userId || !params.authoritativeMatchEnd) {
    return null;
  }

  if (params.authoritativeMatchEnd.winnerUserId === params.userId) {
    return true;
  }

  if (params.authoritativeMatchEnd.loserUserId === params.userId) {
    return false;
  }

  return null;
};
