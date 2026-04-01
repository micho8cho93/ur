import type { MatchEndReason } from '@/shared/urMatchProtocol';

export const FORFEIT_RESULT_TRANSITION_DELAY_MS = 1_350;
export const MATCH_EXIT_TRANSITION_PRE_DELAY_MS = 980;
export const MATCH_EXIT_TRANSITION_POST_DELAY_MS = 260;
export const TOURNAMENT_AUTO_RETURN_COUNTDOWN_MS = 5_000;
export const TOURNAMENT_WAITING_ROOM_TRANSITION_DELAY_MS = 980;
export const TOURNAMENT_READY_LAUNCH_COUNTDOWN_SECONDS = 3;

type ReconnectGraceBannerOptions = {
  isOpponentReconnecting: boolean;
  remainingMs?: number | undefined;
};

type ForfeitTransitionCopyOptions = {
  didPlayerWin: boolean;
  reason: Extract<MatchEndReason, 'forfeit_disconnect' | 'forfeit_inactivity'>;
};

const getRemainingSeconds = (remainingMs?: number | undefined) => {
  if (typeof remainingMs !== 'number' || !Number.isFinite(remainingMs)) {
    return null;
  }

  return Math.max(1, Math.ceil(remainingMs / 1_000));
};

export const buildReconnectGraceBannerText = ({
  isOpponentReconnecting,
  remainingMs,
}: ReconnectGraceBannerOptions) => {
  const remainingSeconds = getRemainingSeconds(remainingMs);

  if (isOpponentReconnecting) {
    return remainingSeconds === null
      ? 'Opponent disconnected. Holding the board while they reconnect.'
      : `Opponent disconnected. Holding the board for ${remainingSeconds}s while they reconnect.`;
  }

  return remainingSeconds === null
    ? 'Connection lost. Rejoin now to avoid forfeiting the match.'
    : `Connection lost. Rejoin within ${remainingSeconds}s to avoid forfeiting the match.`;
};

export const buildForfeitTransitionCopy = ({
  didPlayerWin,
  reason,
}: ForfeitTransitionCopyOptions): {
  title: string;
  message: string;
} => {
  if (reason === 'forfeit_disconnect') {
    return didPlayerWin
      ? {
          title: 'Opponent Disconnected',
          message: 'Reconnect grace expired. Recording the disconnect forfeit and sealing the result.',
        }
      : {
          title: 'Connection Lost',
          message: 'Reconnect grace expired. Recording the disconnect forfeit before the result appears.',
        };
  }

  return didPlayerWin
    ? {
        title: 'Opponent Timed Out',
        message: 'Their inactivity forfeit is being recorded before the final result appears.',
      }
    : {
        title: 'Turn Timed Out',
        message: 'Your inactivity forfeit is being recorded before the final result appears.',
      };
};
