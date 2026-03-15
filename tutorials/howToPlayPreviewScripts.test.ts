import { buildTutorialFrames } from './tutorialEngine';
import { HOW_TO_PLAY_PREVIEW_SCRIPTS } from './howToPlayPreviewScripts';

describe('HOW_TO_PLAY_PREVIEW_SCRIPTS', () => {
  it('capture preview sends the captured piece back to reserve', () => {
    const frames = buildTutorialFrames(HOW_TO_PLAY_PREVIEW_SCRIPTS.captures);
    const finalFrame = frames[frames.length - 1];
    const capturedPiece = finalFrame.gameState.dark.pieces.find((piece) => piece.id === 'dark-0');

    expect(finalFrame.gameState.light.capturedCount).toBe(1);
    expect(capturedPiece?.position).toBe(-1);
  });

  it('safe-square preview preserves the extra turn and blocks the rosette capture', () => {
    const script = HOW_TO_PLAY_PREVIEW_SCRIPTS.safeSquaresStrategy;
    const frames = buildTutorialFrames(script);
    const sharedRosetteFrame = frames[script.findIndex((step) => step.id === 'safe-move-dark-0-to-7') + 1];
    const finalFrame = frames[frames.length - 1];
    const darkPiece = finalFrame.gameState.dark.pieces.find((piece) => piece.id === 'dark-0');

    expect(sharedRosetteFrame.gameState.currentTurn).toBe('dark');
    expect(sharedRosetteFrame.gameState.phase).toBe('rolling');
    expect(darkPiece?.position).toBe(7);
    expect(finalFrame.displayRollValue).toBe(2);
    expect(finalFrame.validMoves).toHaveLength(0);
    expect(finalFrame.gameState.currentTurn).toBe('dark');
  });
});
