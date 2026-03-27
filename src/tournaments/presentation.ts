import { getMatchConfig } from '@/logic/matchConfigs';
import type { PublicTournamentSummary } from '@/src/tournaments/types';

export type TournamentChipTone = 'neutral' | 'info' | 'success' | 'warning';

export type TournamentChipState = {
  label: 'Open' | 'Starting soon' | 'Full';
  tone: TournamentChipTone;
};

const safeParseTime = (value: string): number => {
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const safeParseOptionalTime = (value: string | null): number | null => {
  if (!value) {
    return null;
  }

  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : null;
};

export const hasTournamentStarted = (tournament: Pick<PublicTournamentSummary, 'startAt'>, now = Date.now()): boolean =>
  safeParseTime(tournament.startAt) <= now;

export const hasTournamentEnded = (tournament: Pick<PublicTournamentSummary, 'endAt'>, now = Date.now()): boolean => {
  const endAt = safeParseOptionalTime(tournament.endAt);
  return endAt !== null && endAt <= now;
};

export const isTournamentVisibleForPlay = (
  tournament: Pick<PublicTournamentSummary, 'lifecycle' | 'endAt'>,
  now = Date.now(),
): boolean => tournament.lifecycle === 'open' && !hasTournamentEnded(tournament, now);

export const isTournamentFull = (tournament: Pick<PublicTournamentSummary, 'entrants' | 'maxEntrants'>): boolean =>
  tournament.maxEntrants > 0 && tournament.entrants >= tournament.maxEntrants;

export const getTournamentChipState = (tournament: PublicTournamentSummary, now = Date.now()): TournamentChipState => {
  if (isTournamentFull(tournament) && !tournament.membership.isJoined) {
    return {
      label: 'Full',
      tone: 'warning',
    };
  }

  if (!hasTournamentStarted(tournament, now)) {
    return {
      label: 'Starting soon',
      tone: 'info',
    };
  }

  return {
    label: 'Open',
    tone: 'success',
  };
};

export const getTournamentModeLabel = (gameMode: string): string => getMatchConfig(gameMode).displayName;

export const sortPublicTournamentsForPlay = (tournaments: PublicTournamentSummary[]): PublicTournamentSummary[] =>
  tournaments.slice().sort((left, right) => {
    const now = Date.now();
    const leftStarted = hasTournamentStarted(left, now);
    const rightStarted = hasTournamentStarted(right, now);

    if (leftStarted !== rightStarted) {
      return leftStarted ? -1 : 1;
    }

    const leftStart = safeParseTime(left.startAt);
    const rightStart = safeParseTime(right.startAt);
    if (leftStarted && rightStarted && leftStart !== rightStart) {
      return rightStart - leftStart;
    }

    if (!leftStarted && !rightStarted && leftStart !== rightStart) {
      return leftStart - rightStart;
    }

    return right.updatedAt.localeCompare(left.updatedAt);
  });

export const formatTournamentDateTime = (value: string | null): string => {
  if (!value) {
    return 'Not scheduled';
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
};

export const buildTournamentPrizeSummary = (tournament: Pick<PublicTournamentSummary, 'buyInLabel' | 'prizeLabel'>): string =>
  `${tournament.buyInLabel} • ${tournament.prizeLabel}`;

export const getTournamentCardPrimaryState = (
  tournament: PublicTournamentSummary,
): { label: 'Join' | 'Joined' | 'Play Tournament Match' | 'Full'; disabled: boolean; intent: 'join' | 'play' | 'none' } => {
  if (isTournamentFull(tournament) && !tournament.membership.isJoined) {
    return {
      label: 'Full',
      disabled: true,
      intent: 'none',
    };
  }

  if (tournament.membership.isJoined && hasTournamentStarted(tournament)) {
    return {
      label: 'Play Tournament Match',
      disabled: false,
      intent: 'play',
    };
  }

  if (tournament.membership.isJoined) {
    return {
      label: 'Joined',
      disabled: true,
      intent: 'none',
    };
  }

  return {
    label: 'Join',
    disabled: false,
    intent: 'join',
  };
};

export const getTournamentDetailPrimaryState = (
  tournament: PublicTournamentSummary,
): { label: 'Join' | 'Play Tournament Match' | 'Full'; disabled: boolean; intent: 'join' | 'play' | 'none' } => {
  if (isTournamentFull(tournament) && !tournament.membership.isJoined) {
    return {
      label: 'Full',
      disabled: true,
      intent: 'none',
    };
  }

  if (tournament.membership.isJoined) {
    return {
      label: 'Play Tournament Match',
      disabled: !hasTournamentStarted(tournament),
      intent: hasTournamentStarted(tournament) ? 'play' : 'none',
    };
  }

  return {
    label: 'Join',
    disabled: false,
    intent: 'join',
  };
};
