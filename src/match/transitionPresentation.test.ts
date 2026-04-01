import {
  buildForfeitTransitionCopy,
  buildReconnectGraceBannerText,
  TOURNAMENT_AUTO_RETURN_COUNTDOWN_MS,
  TOURNAMENT_READY_LAUNCH_COUNTDOWN_SECONDS,
} from './transitionPresentation';

describe('transitionPresentation', () => {
  it('builds reconnect grace copy for opponents and local disconnects', () => {
    expect(
      buildReconnectGraceBannerText({
        isOpponentReconnecting: true,
        remainingMs: 4_100,
      }),
    ).toBe('Opponent disconnected. Holding the board for 5s while they reconnect.');

    expect(
      buildReconnectGraceBannerText({
        isOpponentReconnecting: false,
        remainingMs: 2_000,
      }),
    ).toBe('Connection lost. Rejoin within 2s to avoid forfeiting the match.');
  });

  it('builds warning copy for disconnect and inactivity forfeits', () => {
    expect(
      buildForfeitTransitionCopy({
        didPlayerWin: true,
        reason: 'forfeit_disconnect',
      }),
    ).toEqual({
      title: 'Opponent Disconnected',
      message: 'Reconnect grace expired. Recording the disconnect forfeit and sealing the result.',
    });

    expect(
      buildForfeitTransitionCopy({
        didPlayerWin: false,
        reason: 'forfeit_inactivity',
      }),
    ).toEqual({
      title: 'Turn Timed Out',
      message: 'Your inactivity forfeit is being recorded before the final result appears.',
    });
  });

  it('exports the shortened tournament countdown defaults', () => {
    expect(TOURNAMENT_AUTO_RETURN_COUNTDOWN_MS).toBe(5_000);
    expect(TOURNAMENT_READY_LAUNCH_COUNTDOWN_SECONDS).toBe(3);
  });
});
