import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { DiceStageVisual } from './Dice';
import {
  computeLandingZone,
  type BoardFrame,
} from './matchDiceStageLayout';
import { DEFAULT_DICE_ROLL_DURATION_MS } from './slotDiceShared';

interface MatchDiceRollStageProps {
  boardFrame: BoardFrame | null;
  canRoll: boolean;
  compact: boolean;
  durationMs?: number;
  onResultShown?: () => void;
  rollValue: number | null;
  rolling: boolean;
  viewportHeight: number;
  viewportWidth: number;
  visible: boolean;
}

export const MatchDiceRollStage: React.FC<MatchDiceRollStageProps> = ({
  boardFrame,
  canRoll,
  compact,
  durationMs = DEFAULT_DICE_ROLL_DURATION_MS,
  onResultShown,
  rollValue,
  rolling,
  viewportHeight,
  viewportWidth,
  visible,
}) => {
  const landingZone = useMemo(() => {
    if (!boardFrame) {
      return null;
    }

    return computeLandingZone({
      boardFrame,
      compact,
      viewportHeight,
      viewportWidth,
    });
  }, [boardFrame, compact, viewportHeight, viewportWidth]);

  if (!visible || !landingZone) {
    return null;
  }

  return (
    <View pointerEvents="none" style={styles.overlay}>
      <View
        pointerEvents="none"
        style={[
          styles.stageHost,
          {
            height: landingZone.height,
            left: landingZone.x,
            top: landingZone.y,
            width: landingZone.width,
          },
        ]}
      >
        <DiceStageVisual
          animationDurationMs={durationMs}
          value={rollValue}
          rolling={rolling}
          canRoll={canRoll}
          compact={compact}
          onResultShown={onResultShown}
          visible={visible}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  stageHost: {
    position: 'absolute',
  },
});
