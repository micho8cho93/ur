const pickRandomIndex = (size: number, random: () => number) => {
  const candidate = Math.floor(random() * size);
  return Math.min(candidate, size - 1);
};

export const createShuffledPlaylistOrder = (
  trackCount: number,
  previousTrackIndex: number | null = null,
  random: () => number = Math.random,
) => {
  const order = Array.from({ length: trackCount }, (_, index) => index);

  for (let index = order.length - 1; index > 0; index -= 1) {
    const swapIndex = pickRandomIndex(index + 1, random);
    [order[index], order[swapIndex]] = [order[swapIndex], order[index]];
  }

  if (order.length > 1 && previousTrackIndex !== null && order[0] === previousTrackIndex) {
    const swapIndex = 1 + pickRandomIndex(order.length - 1, random);
    [order[0], order[swapIndex]] = [order[swapIndex], order[0]];
  }

  return order;
};
