import type { PublicTournamentDetail } from '@/src/tournaments/types';

export type ServerConfirmedTournamentOutcome = 'champion' | 'runner_up' | 'eliminated';

export const isServerConfirmedTournamentTerminal = (
  tournament: PublicTournamentDetail | null | undefined,
): boolean => {
  const lifecycle = tournament?.lifecycle ?? null;
  const participationState = tournament?.participation?.state ?? null;

  return (
    lifecycle === 'finalized' ||
    lifecycle === 'closed' ||
    participationState === 'champion' ||
    participationState === 'runner_up' ||
    participationState === 'eliminated'
  );
};

export const deriveServerConfirmedTournamentOutcome = (
  tournament: PublicTournamentDetail | null | undefined,
): ServerConfirmedTournamentOutcome | null => {
  const participationState = tournament?.participation?.state ?? null;

  if (
    participationState === 'champion' ||
    participationState === 'runner_up' ||
    participationState === 'eliminated'
  ) {
    return participationState;
  }

  const lifecycle = tournament?.lifecycle ?? null;
  if (lifecycle !== 'finalized' && lifecycle !== 'closed') {
    return null;
  }

  const finalPlacement = tournament?.participation?.finalPlacement ?? null;
  if (finalPlacement === 1) {
    return 'champion';
  }

  if (finalPlacement === 2) {
    return 'runner_up';
  }

  return null;
};
