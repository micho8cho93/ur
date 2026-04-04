import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { EmojiReactionMenu, type EmojiReactionMenuOption } from './EmojiReactionMenu';

const EMOJI_OPTIONS: readonly EmojiReactionMenuOption[] = [
  { key: 'laughing', emoji: '😂', label: 'laughing' },
  { key: 'cool', emoji: '😎', label: 'cool' },
  { key: 'fire', emoji: '🔥', label: 'fire' },
  { key: 'omg', emoji: '😱', label: 'omg' },
  { key: 'skeleton', emoji: '💀', label: 'skeleton' },
  { key: 'sad', emoji: '😢', label: 'sad face' },
  { key: 'hugging', emoji: '🫂', label: 'hugging people' },
  { key: 'angry', emoji: '😠', label: 'angry' },
  { key: 'eyes', emoji: '👀', label: 'eyes' },
  { key: 'question', emoji: '❓', label: 'question mark' },
] as const;

describe('EmojiReactionMenu', () => {
  it('splits compact emoji menus into two rows of five options', () => {
    const { toJSON } = render(
      <EmojiReactionMenu
        compact
        menuVisible
        onSelect={jest.fn()}
        onToggle={jest.fn()}
        options={EMOJI_OPTIONS}
        remainingCount={8}
        testID="emoji-reaction-control"
      />,
    );

    const tree = toJSON();
    expect(tree).not.toBeNull();
    expect(Array.isArray(tree)).toBe(false);

    const wrapNode = tree as any;
    const menuNode = wrapNode.children?.[0];
    const rowNodes = menuNode?.children ?? [];

    expect(rowNodes).toHaveLength(2);
    expect(rowNodes.map((row: any) => row.children?.length ?? 0)).toEqual([5, 5]);
  });

  it('calls onSelect with the chosen emoji key', () => {
    const onSelect = jest.fn();

    render(
      <EmojiReactionMenu
        compact
        menuVisible
        onSelect={onSelect}
        onToggle={jest.fn()}
        options={EMOJI_OPTIONS}
        remainingCount={8}
      />,
    );

    fireEvent.press(screen.getByLabelText('Send laughing emoji reaction'));

    expect(onSelect).toHaveBeenCalledWith('laughing');
  });
});
