import {
  MATCH_CONFIGS,
  isMatchModeId,
  type MatchModeId,
} from '../../logic/matchConfigs'

export type TournamentStructureId = MatchModeId

export type TournamentStructureOption = {
  value: TournamentStructureId
  label: string
  description: string
}

const TOURNAMENT_STRUCTURE_IDS: readonly TournamentStructureId[] = [
  'gameMode_3_pieces',
  'gameMode_capture',
  'gameMode_finkel_rules',
] as const

export const TOURNAMENT_STRUCTURE_OPTIONS: readonly TournamentStructureOption[] =
  TOURNAMENT_STRUCTURE_IDS.map((modeId) => {
    const config = MATCH_CONFIGS[modeId]

    return {
      value: modeId,
      label: config.displayName,
      description: config.selectionSubtitle ?? config.displayName,
    }
  })

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
