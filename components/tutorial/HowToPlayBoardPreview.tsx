import { HowToPlayPreviewId } from '@/content/howToPlayFiveStep';
import { Board } from '@/components/game/Board';
import { boxShadow } from '@/constants/styleEffects';
import { urTheme, urTypography } from '@/constants/urTheme';
import { buildTutorialFrames, describeTutorialStep } from '@/tutorials/tutorialEngine';
import { HOW_TO_PLAY_PREVIEW_SCRIPTS } from '@/tutorials/howToPlayPreviewScripts';
import { TutorialFrame, TutorialStep } from '@/tutorials/tutorialTypes';
import React from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';

interface HowToPlayBoardPreviewProps {
  previewId: HowToPlayPreviewId;
  visible: boolean;
}

const STEP_DELAY_MS = {
  initial: 700,
  roll: 950,
  move: 1080,
  loopReset: 1200,
} as const;

const getStepDelay = (frameIndex: number, frames: TutorialFrame[], script: TutorialStep[]) => {
  if (frameIndex === 0) return STEP_DELAY_MS.initial;
  if (frameIndex >= frames.length - 1) return STEP_DELAY_MS.loopReset;

  const previousStep = script[frameIndex - 1];
  return previousStep.kind === 'MOVE' ? STEP_DELAY_MS.move : STEP_DELAY_MS.roll;
};

export const HowToPlayBoardPreview: React.FC<HowToPlayBoardPreviewProps> = ({ previewId, visible }) => {
  const { width } = useWindowDimensions();
  const script = React.useMemo(() => HOW_TO_PLAY_PREVIEW_SCRIPTS[previewId], [previewId]);
  const frames = React.useMemo(() => buildTutorialFrames(script), [script]);
  const [frameIndex, setFrameIndex] = React.useState(0);

  React.useEffect(() => {
    if (!visible) {
      setFrameIndex(0);
      return;
    }

    setFrameIndex(0);
  }, [previewId, visible]);

  React.useEffect(() => {
    if (!visible) return;

    const timer = setTimeout(() => {
      setFrameIndex((current) => {
        if (current >= frames.length - 1) {
          return 0;
        }
        return current + 1;
      });
    }, getStepDelay(frameIndex, frames, script));

    return () => clearTimeout(timer);
  }, [frameIndex, frames, script, visible]);

  const currentFrame = frames[frameIndex];
  const activeStep = frameIndex > 0 ? script[frameIndex - 1] : null;
  const boardScale = width < 420 ? 0.7 : width < 900 ? 0.58 : 0.46;
  const statusLabel =
    activeStep?.timelineLabel ?? (frameIndex === 0 ? 'Looping example resets to the starting position.' : 'Looping example');

  return (
    <View style={styles.shell} testID={`how-to-play-preview-${previewId}`}>
      <View style={styles.headerRow}>
        <Text style={styles.previewLabel}>Looping preview</Text>
        {currentFrame.displayRollValue !== null ? (
          <View style={styles.rollBadge}>
            <Text style={styles.rollBadgeLabel}>Roll {currentFrame.displayRollValue}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.boardWrap} pointerEvents="none">
        <Board
          allowInteraction
          autoMoveHintEnabled
          boardScale={boardScale}
          gameStateOverride={currentFrame.gameState}
          highlightMode="theatrical"
          orientation="horizontal"
          playerColorOverride={currentFrame.gameState.currentTurn}
          validMovesOverride={currentFrame.validMoves}
        />
      </View>

      <Text style={styles.statusText}>
        {activeStep ? describeTutorialStep(activeStep) : statusLabel}
      </Text>
      <Text style={styles.helperText}>
        Turn: {currentFrame.gameState.currentTurn === 'light' ? 'Light' : 'Dark'}
        {currentFrame.gameState.phase === 'ended' && currentFrame.gameState.winner
          ? ` • ${currentFrame.gameState.winner === 'light' ? 'Light' : 'Dark'} wins`
          : ` • ${currentFrame.gameState.phase === 'moving' ? 'Choose a move' : 'Waiting to roll'}`}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  shell: {
    borderRadius: urTheme.radii.lg,
    borderWidth: 1,
    borderColor: 'rgba(217, 164, 65, 0.34)',
    backgroundColor: 'rgba(8, 11, 16, 0.48)',
    paddingHorizontal: urTheme.spacing.sm,
    paddingTop: urTheme.spacing.sm,
    paddingBottom: urTheme.spacing.md,
    ...boxShadow({
      color: '#000',
      opacity: 0.18,
      offset: { width: 0, height: 6 },
      blurRadius: 10,
      elevation: 4,
    }),
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: urTheme.spacing.sm,
    marginBottom: urTheme.spacing.xs,
  },
  previewLabel: {
    ...urTypography.label,
    color: '#F3D9A6',
    fontSize: 11,
  },
  rollBadge: {
    borderRadius: urTheme.radii.pill,
    paddingHorizontal: urTheme.spacing.sm,
    paddingVertical: 4,
    backgroundColor: 'rgba(28, 76, 138, 0.56)',
    borderWidth: 1,
    borderColor: 'rgba(160, 204, 255, 0.32)',
  },
  rollBadgeLabel: {
    ...urTypography.label,
    fontSize: 10,
    color: urTheme.colors.ivory,
  },
  boardWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: urTheme.spacing.sm,
    minHeight: 124,
  },
  statusText: {
    color: urTheme.colors.parchment,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  helperText: {
    marginTop: 4,
    color: 'rgba(234, 218, 190, 0.84)',
    fontSize: 12,
    lineHeight: 16,
    textAlign: 'center',
  },
});
