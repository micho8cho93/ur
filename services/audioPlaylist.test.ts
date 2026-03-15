import { createShuffledPlaylistOrder } from './audioPlaylist';

const createMockRandom = (...values: number[]) => {
  let index = 0;
  return () => {
    const value = values[index] ?? values[values.length - 1] ?? 0;
    index += 1;
    return value;
  };
};

describe('createShuffledPlaylistOrder', () => {
  it('returns each track index exactly once', () => {
    const order = createShuffledPlaylistOrder(4, null, createMockRandom(0.2, 0.8, 0.4));

    expect(order).toHaveLength(4);
    expect([...order].sort((left, right) => left - right)).toEqual([0, 1, 2, 3]);
  });

  it('avoids immediately repeating the previously played track when possible', () => {
    const order = createShuffledPlaylistOrder(3, 2, createMockRandom(0, 0.9, 0));

    expect(order[0]).not.toBe(2);
    expect([...order].sort((left, right) => left - right)).toEqual([0, 1, 2]);
  });

  it('keeps the only track available in place for single-track playlists', () => {
    expect(createShuffledPlaylistOrder(1, 0, createMockRandom(0.75))).toEqual([0]);
  });
});
