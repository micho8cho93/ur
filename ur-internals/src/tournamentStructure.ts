import {
  MATCH_CONFIGS,
  isMatchModeId,
  type MatchModeId,
  type MatchConfig,
} from '../../logic/matchConfigs'
import type { GameModeDefinition } from '../../shared/gameModes'

export type TournamentStructureId = string

export type TournamentStructureOption = {
  value: TournamentStructureId
  label: string
  description: string
}

const TOURNAMENT_STRUCTURE_IDS: readonly MatchModeId[] = [
  'gameMode_3_pieces',
  'gameMode_finkel_rules',
] as const

const buildTournamentStructureOption = (modeId: TournamentStructureId, config: MatchConfig): TournamentStructureOption => ({
  value: modeId,
  label: config.displayName,
  description: config.selectionSubtitle ?? config.displayName,
})

export const buildTournamentStructureOptions = (
  featuredMode: GameModeDefinition | null = null,
): readonly TournamentStructureOption[] => {
  const builtInOptions = TOURNAMENT_STRUCTURE_IDS.map((modeId) =>
    buildTournamentStructureOption(modeId, MATCH_CONFIGS[modeId]),
  )

  if (!featuredMode) {
    return builtInOptions
  }

  return [
    ...builtInOptions,
    {
      value: featuredMode.id,
      label: featuredMode.name,
      description: featuredMode.description,
    },
  ]
}

export function getTournamentStructureLabel(
  value: string | null | undefined,
  featuredMode: GameModeDefinition | null = null,
) {
  const match = buildTournamentStructureOptions(featuredMode).find((option) => option.value === value)
  if (match) {
    return match.label
  }

  if (value && isMatchModeId(value)) {
    return MATCH_CONFIGS[value].displayName
  }

  return value?.trim() || 'Quick Play'
}

export function getTournamentStructureDescription(
  value: string | null | undefined,
  featuredMode: GameModeDefinition | null = null,
) {
  const match = buildTournamentStructureOptions(featuredMode).find((option) => option.value === value)
  if (match) {
    return match.description
  }

  if (value && isMatchModeId(value)) {
    return MATCH_CONFIGS[value].selectionSubtitle ?? MATCH_CONFIGS[value].displayName
  }

  return 'Classic seven-piece rules.'
}
