export type TournamentStructureId =
  | 'standard'
  | 'gameMode_1_piece'
  | 'gameMode_3_pieces'
  | 'gameMode_5_pieces'
  | 'gameMode_full_path'

export type TournamentStructureOption = {
  value: TournamentStructureId
  label: string
  description: string
}

export const TOURNAMENT_STRUCTURE_OPTIONS: readonly TournamentStructureOption[] = [
  {
    value: 'gameMode_1_piece',
    label: '1 Piece',
    description: 'One piece per side for the fastest tournament games.',
  },
  {
    value: 'gameMode_3_pieces',
    label: '3 Pieces',
    description: 'Three pieces per side for short tournament rounds.',
  },
  {
    value: 'gameMode_5_pieces',
    label: '5 Pieces',
    description: 'Five pieces per side for a medium-length format.',
  },
  {
    value: 'standard',
    label: '7 Pieces',
    description: 'Standard Royal Game of Ur rules with seven pieces.',
  },
  {
    value: 'gameMode_full_path',
    label: 'Extended Path',
    description: 'Seven pieces using the extended-path board rules.',
  },
] as const

export function getTournamentStructureLabel(value: string | null | undefined) {
  const match = TOURNAMENT_STRUCTURE_OPTIONS.find((option) => option.value === value)
  if (match) {
    return match.label
  }

  return value?.trim() || '7 Pieces'
}

export function getTournamentStructureDescription(value: string | null | undefined) {
  const match = TOURNAMENT_STRUCTURE_OPTIONS.find((option) => option.value === value)
  return match?.description ?? 'Standard Royal Game of Ur rules.'
}
