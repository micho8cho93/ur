import { resolveVisibleViewportSize } from './matchViewport';

describe('resolveVisibleViewportSize', () => {
  it('falls back to the window dimensions when no visual viewport is available', () => {
    expect(resolveVisibleViewportSize({ width: 390, height: 844 })).toEqual({ width: 390, height: 844 });
  });

  it('prefers positive visual viewport dimensions when they are available', () => {
    expect(
      resolveVisibleViewportSize(
        { width: 390, height: 844 },
        { width: 372.4, height: 662.7 },
      ),
    ).toEqual({ width: 372, height: 663 });
  });

  it('ignores invalid visual viewport values', () => {
    expect(
      resolveVisibleViewportSize(
        { width: 390, height: 844 },
        { width: 0, height: Number.NaN },
      ),
    ).toEqual({ width: 390, height: 844 });
  });
});
