import {
  MATCH_MODE_SELECTION_OPTIONS,
  type MatchModeId,
} from '../../logic/matchConfigs'

export type TournamentStructureId = MatchModeId

export type TournamentStructureOption = {
  value: TournamentStructureId
  label: string
  description: string
}

export const TOURNAMENT_STRUCTURE_OPTIONS: readonly TournamentStructureOption[] =
  MATCH_MODE_SELECTION_OPTIONS.map((option) => ({
    value: option.modeId,
    label: option.label,
    description: option.description,
  }))

export function getTournamentStructureLabel(value: string | null | undefined) {
  const match = TOURNAMENT_STRUCTURE_OPTIONS.find((option) => option.value === value)
  if (match) {
    return match.label
  }

  return value?.trim() || 'Quick Play'
}

export function getTournamentStructureDescription(value: string | null | undefined) {
  const match = TOURNAMENT_STRUCTURE_OPTIONS.find((option) => option.value === value)
  return match?.description ?? 'Classic seven-piece rules.'
}
