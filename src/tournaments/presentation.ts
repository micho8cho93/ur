import { getMatchConfig } from '@/logic/matchConfigs';
import {
  formatTournamentLobbyCountdown,
  getTournamentLobbyCountdownMsRemaining,
} from '@/shared/tournamentLobby';
import { getTournamentBotStatusLabel } from '@/shared/tournamentBots';
import type { PublicTournamentSummary } from '@/src/tournaments/types';

export type TournamentChipTone = 'neutral' | 'info' | 'success' | 'warning';
const TOURNAMENT_DESCRIPTION_PLACEHOLDER = 'No description configured.';

export type TournamentChipState = {
  label: 'Open' | 'Starting soon' | 'Full' | 'Locked' | 'In Progress';
  tone: TournamentChipTone;
};

export type TournamentPrimaryState = {
  label:
    | 'Join'
    | 'Full'
    | 'Tournament Locked'
    | 'Play Tournament Match'
    | 'Resume Tournament Match'
    | 'Continue Tournament'
    | 'Tournament In Progress'
    | 'Waiting for lobby to fill'
    | 'Tournament starts soon'
    | 'Eliminated'
    | 'Tournament Complete';
  disabled: boolean;
  intent: 'join' | 'play' | 'none';
  loading?: boolean;
  waitReason?: 'lobby' | 'start' | 'bracket' | null;
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

type TournamentLobbyCountdownState = Pick<
  PublicTournamentSummary,
  'lifecycle' | 'isLocked' | 'entrants' | 'maxEntrants'
> & {
  lobbyDeadlineAt?: string | null;
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

export const isTournamentLocked = (
  tournament: Pick<PublicTournamentSummary, 'isLocked'>,
): boolean => tournament.isLocked;

export const isTournamentFull = (tournament: Pick<PublicTournamentSummary, 'entrants' | 'maxEntrants'>): boolean =>
  tournament.maxEntrants > 0 && tournament.entrants >= tournament.maxEntrants;

export const isTournamentReadyToLaunch = (
  tournament: Pick<PublicTournamentSummary, 'entrants' | 'maxEntrants' | 'startAt'>,
  now = Date.now(),
): boolean => isTournamentFull(tournament) && hasTournamentStarted(tournament, now);

export const getTournamentLobbyCountdownMs = (
  tournament: TournamentLobbyCountdownState,
  now = Date.now(),
): number | null => {
  if (tournament.lifecycle !== 'open' || isTournamentLocked(tournament) || isTournamentFull(tournament)) {
    return null;
  }

  return getTournamentLobbyCountdownMsRemaining(tournament.lobbyDeadlineAt ?? null, now);
};

export const getTournamentLobbyCountdownLabel = (
  tournament: TournamentLobbyCountdownState,
  now = Date.now(),
): string | null => {
  const remainingMs = getTournamentLobbyCountdownMs(tournament, now);
  return remainingMs === null ? null : formatTournamentLobbyCountdown(remainingMs);
};

export const isTournamentPreStartWaitingRoomVisible = (
  tournament: Pick<PublicTournamentSummary, 'membership' | 'participation' | 'currentRound'>,
): boolean => {
  if (!tournament.membership.isJoined) {
    return false;
  }

  const participationState = tournament.participation?.state ?? null;
  if (
    participationState === 'eliminated' ||
    participationState === 'runner_up' ||
    participationState === 'champion'
  ) {
    return false;
  }

  const derivedRound = tournament.participation?.currentRound ?? tournament.currentRound ?? 1;
  if (
    derivedRound > 1 ||
    (tournament.participation?.lastResult ?? null) !== null ||
    (tournament.participation?.finalPlacement ?? null) !== null
  ) {
    return false;
  }

  return participationState === 'lobby' || participationState === 'waiting_next_round' || participationState === 'in_match';
};

export const isTournamentPlayerLaunchReady = (
  tournament: Pick<PublicTournamentSummary, 'membership' | 'participation'>,
): boolean => {
  if (!tournament.membership.isJoined) {
    return false;
  }

  if (tournament.participation?.state === 'in_match' && Boolean(tournament.participation?.activeMatchId)) {
    return true;
  }

  return tournament.participation?.canLaunch === true;
};

export const getTournamentChipState = (tournament: PublicTournamentSummary, now = Date.now()): TournamentChipState => {
  if (tournament.membership.isJoined && tournament.participation?.state && tournament.participation.state !== 'lobby') {
    return {
      label: 'In Progress',
      tone: 'info',
    };
  }

  if (isTournamentLocked(tournament) && !tournament.membership.isJoined) {
    return {
      label: 'Locked',
      tone: 'warning',
    };
  }

  if (isTournamentFull(tournament) && !tournament.membership.isJoined) {
    return {
      label: 'Full',
      tone: 'warning',
    };
  }

  if (!isTournamentReadyToLaunch(tournament, now)) {
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
    const leftReady = isTournamentReadyToLaunch(left, now);
    const rightReady = isTournamentReadyToLaunch(right, now);

    if (leftReady !== rightReady) {
      return leftReady ? -1 : 1;
    }

    const leftStart = safeParseTime(left.startAt);
    const rightStart = safeParseTime(right.startAt);
    if (leftReady && rightReady && leftStart !== rightStart) {
      return rightStart - leftStart;
    }

    if (!leftReady && !rightReady && leftStart !== rightStart) {
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

export const shouldShowTournamentDescription = (description: string | null | undefined): boolean => {
  const normalized = description?.trim();
  return Boolean(normalized && normalized !== TOURNAMENT_DESCRIPTION_PLACEHOLDER);
};

export const isTournamentJoinable = (
  tournament: Pick<PublicTournamentSummary, 'lifecycle' | 'endAt' | 'isLocked' | 'entrants' | 'maxEntrants'>,
  now = Date.now(),
): boolean => isTournamentVisibleForPlay(tournament, now) && !isTournamentLocked(tournament) && !isTournamentFull(tournament);

export const getTournamentJoinStatusLabel = (
  tournament: Pick<PublicTournamentSummary, 'lifecycle' | 'endAt' | 'isLocked' | 'entrants' | 'maxEntrants'>,
  now = Date.now(),
): 'Open' | 'Closed' => (isTournamentJoinable(tournament, now) ? 'Open' : 'Closed');

export const buildTournamentRewardSummary = (
  tournament: Pick<PublicTournamentSummary, 'xpPerMatchWin' | 'xpForTournamentChampion'>,
): string => {
  const xpPerMatchWin = Math.max(0, Math.floor(tournament.xpPerMatchWin ?? 0));
  const xpForTournamentChampion = Math.max(0, Math.floor(tournament.xpForTournamentChampion ?? 0));

  return `XP per win: ${xpPerMatchWin} / XP for champion: ${xpForTournamentChampion}`;
};

export const buildTournamentPrizeSummary = buildTournamentRewardSummary;

export const buildTournamentBotSummary = (tournament: Pick<PublicTournamentSummary, 'bots'>): string =>
  getTournamentBotStatusLabel(tournament.bots);

const getJoinedTournamentPrimaryState = (tournament: PublicTournamentSummary, now = Date.now()): TournamentPrimaryState => {
  const participationState = tournament.participation?.state ?? null;
  const activeMatchId = tournament.participation?.activeMatchId ?? null;
  const canLaunch = tournament.participation?.canLaunch === true;

  if (tournament.lifecycle === 'closed' || tournament.lifecycle === 'finalized') {
    if (participationState === 'eliminated') {
      return {
        label: 'Eliminated',
        disabled: true,
        intent: 'none',
        loading: false,
        waitReason: null,
      };
    }

    return {
      label: 'Tournament Complete',
      disabled: true,
      intent: 'none',
      loading: false,
      waitReason: null,
    };
  }

  if (participationState === 'in_match' && activeMatchId) {
    return {
      label: 'Resume Tournament Match',
      disabled: false,
      intent: 'play',
      loading: false,
      waitReason: null,
    };
  }

  if (participationState === 'waiting_next_round') {
    if (canLaunch) {
      return {
        label: 'Continue Tournament',
        disabled: false,
        intent: 'play',
        loading: false,
        waitReason: null,
      };
    }

    return {
      label: 'Tournament In Progress',
      disabled: true,
      intent: 'none',
      loading: true,
      waitReason: 'bracket',
    };
  }

  if (participationState === 'eliminated') {
    return {
      label: 'Eliminated',
      disabled: true,
      intent: 'none',
      loading: false,
      waitReason: null,
    };
  }

  if (participationState === 'runner_up' || participationState === 'champion') {
    return {
      label: 'Tournament Complete',
      disabled: true,
      intent: 'none',
      loading: false,
      waitReason: null,
    };
  }

  if (isTournamentReadyToLaunch(tournament, now)) {
    return {
      label: 'Play Tournament Match',
      disabled: false,
      intent: 'play',
      loading: false,
      waitReason: null,
    };
  }

  if (!isTournamentFull(tournament)) {
    return {
      label: 'Waiting for lobby to fill',
      disabled: true,
      intent: 'none',
      loading: true,
      waitReason: 'lobby',
    };
  }

  return {
    label: 'Tournament starts soon',
    disabled: true,
    intent: 'none',
    loading: true,
    waitReason: 'start',
  };
};

export const getTournamentCardPrimaryState = (
  tournament: PublicTournamentSummary,
  now = Date.now(),
): TournamentPrimaryState => {
  if (isTournamentLocked(tournament) && !tournament.membership.isJoined) {
    return {
      label: 'Tournament Locked',
      disabled: true,
      intent: 'none',
    };
  }

  if (isTournamentFull(tournament) && !tournament.membership.isJoined) {
    return {
      label: 'Full',
      disabled: true,
      intent: 'none',
    };
  }

  if (tournament.membership.isJoined) {
    return getJoinedTournamentPrimaryState(tournament, now);
  }

  return {
    label: 'Join',
    disabled: false,
    intent: 'join',
  };
};

export const getTournamentDetailPrimaryState = (
  tournament: PublicTournamentSummary,
  now = Date.now(),
): TournamentPrimaryState => {
  if (isTournamentLocked(tournament) && !tournament.membership.isJoined) {
    return {
      label: 'Tournament Locked',
      disabled: true,
      intent: 'none',
    };
  }

  if (isTournamentFull(tournament) && !tournament.membership.isJoined) {
    return {
      label: 'Full',
      disabled: true,
      intent: 'none',
    };
  }

  if (tournament.membership.isJoined) {
    return getJoinedTournamentPrimaryState(tournament, now);
  }

  return {
    label: 'Join',
    disabled: false,
    intent: 'join',
  };
};
