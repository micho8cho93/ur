export const TOURNAMENT_LOBBY_FILL_COUNTDOWN_SECONDS = 180;
export const TOURNAMENT_LOBBY_FILL_COUNTDOWN_MS = TOURNAMENT_LOBBY_FILL_COUNTDOWN_SECONDS * 1000;

const parseIsoMs = (value: string | null | undefined): number | null => {
  if (!value) {
    return null;
  }

  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : null;
};

export const getTournamentLobbyDeadlineMs = (openedAt: string | null | undefined): number | null => {
  const openedAtMs = parseIsoMs(openedAt);
  if (openedAtMs === null) {
    return null;
  }

  return openedAtMs + TOURNAMENT_LOBBY_FILL_COUNTDOWN_MS;
};

export const getTournamentLobbyDeadlineAt = (openedAt: string | null | undefined): string | null => {
  const deadlineMs = getTournamentLobbyDeadlineMs(openedAt);
  return deadlineMs === null ? null : new Date(deadlineMs).toISOString();
};

export const getTournamentLobbyCountdownMsRemaining = (
  deadlineAt: string | null | undefined,
  now = Date.now(),
): number | null => {
  const deadlineMs = parseIsoMs(deadlineAt);
  if (deadlineMs === null) {
    return null;
  }

  return Math.max(0, deadlineMs - now);
};

export const formatTournamentLobbyCountdown = (remainingMs: number): string => {
  const totalSeconds = Math.max(0, Math.ceil(remainingMs / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};
