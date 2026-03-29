export const TOURNAMENT_SIZE_OPTIONS = [2, 4, 8, 16, 32, 64, 128] as const

export const AUTO_TOURNAMENT_DURATION_SECONDS = 31_536_000

export function getSingleEliminationRoundCount(entrantCap: number) {
  const normalizedCap = Math.max(2, Math.floor(entrantCap))
  const rounds = Math.log2(normalizedCap)

  return Number.isFinite(rounds) && Number.isInteger(rounds) ? rounds : 0
}

export function formatSingleEliminationRoundLabel(roundCount: number) {
  return `${roundCount} round${roundCount === 1 ? '' : 's'}`
}
