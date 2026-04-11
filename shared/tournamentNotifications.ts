export const TOURNAMENT_BRACKET_READY_NOTIFICATION_CODE = 41_001;
export const TOURNAMENT_BRACKET_READY_NOTIFICATION_SUBJECT = 'tournament_bracket_ready';
export const TOURNAMENT_BRACKET_READY_NOTIFICATION_TYPE = 'tournament_bracket_ready' as const;

export type TournamentBracketReadyNotificationContent = {
  type: typeof TOURNAMENT_BRACKET_READY_NOTIFICATION_TYPE;
  runId: string;
  tournamentId: string;
  startedAt: string;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

export const isTournamentBracketReadyNotificationContent = (
  value: unknown,
): value is TournamentBracketReadyNotificationContent => {
  if (!isRecord(value)) {
    return false;
  }

  return (
    value.type === TOURNAMENT_BRACKET_READY_NOTIFICATION_TYPE &&
    typeof value.runId === 'string' &&
    value.runId.trim().length > 0 &&
    typeof value.tournamentId === 'string' &&
    value.tournamentId.trim().length > 0 &&
    typeof value.startedAt === 'string' &&
    value.startedAt.trim().length > 0
  );
};
