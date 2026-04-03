import {
  MATCH_CONFIGS,
  MATCH_MODE_SELECTION_OPTIONS,
  isMatchModeId,
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

  if (value && isMatchModeId(value)) {
    return MATCH_CONFIGS[value].displayName
  }

  return value?.trim() || 'Quick Play'
}

export function getTournamentStructureDescription(value: string | null | undefined) {
  const match = TOURNAMENT_STRUCTURE_OPTIONS.find((option) => option.value === value)
  if (match) {
    return match.description
  }

  if (value && isMatchModeId(value)) {
    return MATCH_CONFIGS[value].selectionSubtitle ?? MATCH_CONFIGS[value].displayName
  }

  return 'Classic seven-piece rules.'
}
