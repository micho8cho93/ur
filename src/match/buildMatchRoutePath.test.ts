import { buildMatchRoutePath } from './buildMatchRoutePath';

describe('buildMatchRoutePath', () => {
  it('adds spectator route mode when requested', () => {
    expect(
      buildMatchRoutePath({
        id: 'match 1',
        modeId: 'standard',
        spectator: true,
      }),
    ).toBe('/match/match%201?modeId=standard&spectator=1');
  });
});
