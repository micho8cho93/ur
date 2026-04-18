import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { EmojiReactionMenu } from './EmojiReactionMenu';
import { DEFAULT_EMOJI_REACTION_OPTIONS } from '@/shared/emojiReactions';

describe('EmojiReactionMenu', () => {
  it('renders the three default emoji reactions in a single compact row', () => {
    const { toJSON } = render(
      <EmojiReactionMenu
        compact
        menuVisible
        onSelect={jest.fn()}
        onToggle={jest.fn()}
        options={DEFAULT_EMOJI_REACTION_OPTIONS}
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

    expect(rowNodes).toHaveLength(1);
    expect(rowNodes.map((row: any) => row.children?.length ?? 0)).toEqual([3]);
  });

  it('calls onSelect with the chosen emoji key', () => {
    const onSelect = jest.fn();

    render(
      <EmojiReactionMenu
        compact
        menuVisible
        onSelect={onSelect}
        onToggle={jest.fn()}
        options={DEFAULT_EMOJI_REACTION_OPTIONS}
        remainingCount={8}
      />,
    );

    fireEvent.press(screen.getByLabelText('Send laughing emoji reaction'));

    expect(onSelect).toHaveBeenCalledWith('laughing');
  });
});
