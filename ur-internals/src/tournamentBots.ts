import type { Tournament } from './types/tournament'

export function formatTournamentBotSummary(tournament: Pick<Tournament, 'bots'>): string {
  if (tournament.bots.count > 0 && tournament.bots.difficulty) {
    return `Includes ${tournament.bots.count} ${tournament.bots.difficulty} bot${tournament.bots.count === 1 ? '' : 's'}`
  }

  if (tournament.bots.autoAdd && tournament.bots.difficulty) {
    return `Bot fill enabled · ${tournament.bots.difficulty}`
  }

  return 'Bots off'
}
