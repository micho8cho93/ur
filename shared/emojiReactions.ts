import type { EmojiReactionKey } from './urMatchProtocol';

export type EmojiReactionOption = {
  key: EmojiReactionKey;
  emoji: string;
  label: string;
};

export const EQUIPPED_EMOJI_SLOT_COUNT = 7;

// The first three reactions are always shown in the match menu.
// The remaining seven keys are reserved for equipped reactions.
export const ALL_EMOJI_REACTION_OPTIONS: readonly EmojiReactionOption[] = [
  { key: 'cool', emoji: '😎', label: 'cool' },
  { key: 'fire', emoji: '🔥', label: 'fire' },
  { key: 'laughing', emoji: '😂', label: 'laughing' },
  { key: 'omg', emoji: '😱', label: 'omg' },
  { key: 'skeleton', emoji: '💀', label: 'skeleton' },
  { key: 'sad', emoji: '😢', label: 'sad face' },
  { key: 'hugging', emoji: '🫂', label: 'hugging people' },
  { key: 'angry', emoji: '😠', label: 'angry' },
  { key: 'eyes', emoji: '👀', label: 'eyes' },
  { key: 'question', emoji: '❓', label: 'question mark' },
];

export const DEFAULT_EMOJI_REACTION_OPTIONS: readonly EmojiReactionOption[] = ALL_EMOJI_REACTION_OPTIONS.slice(0, 3);

export const EQUIPPABLE_EMOJI_REACTION_OPTIONS: readonly EmojiReactionOption[] = ALL_EMOJI_REACTION_OPTIONS.slice(3);
