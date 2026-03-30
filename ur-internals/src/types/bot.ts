export const BOT_DIFFICULTIES = ['easy', 'medium', 'hard', 'perfect'] as const

export type BotDifficulty = (typeof BOT_DIFFICULTIES)[number]

export const DEFAULT_BOT_DIFFICULTY: BotDifficulty = 'easy'

export function isBotDifficulty(value: string | null | undefined): value is BotDifficulty {
  return BOT_DIFFICULTIES.includes(value as BotDifficulty)
}
