import { boxShadow } from '@/constants/styleEffects';
import { urTheme, urTextures, urTypography } from '@/constants/urTheme';
import { describeTutorialStep } from '@/tutorials/tutorialEngine';
import { TutorialStep } from '@/tutorials/tutorialTypes';
import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

interface TutorialControlsProps {
  steps: readonly TutorialStep[];
  stepIndex: number;
  isPlaying: boolean;
  speed: 1 | 2;
  controlsLocked: boolean;
  onTogglePlay: () => void;
  onNext: () => void;
  onBack: () => void;
  onRestart: () => void;
  onToggleSpeed: () => void;
  compact?: boolean;
}

interface ControlChipProps {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  active?: boolean;
}

const ControlChip: React.FC<ControlChipProps> = ({ label, onPress, disabled = false, active = false }) => (
  <Pressable
    onPress={onPress}
    disabled={disabled}
    style={({ pressed }) => [
      styles.controlChip,
      active && styles.controlChipActive,
      disabled && styles.controlChipDisabled,
      pressed && !disabled && styles.controlChipPressed,
    ]}
  >
    <Text style={[styles.controlChipLabel, active && styles.controlChipLabelActive]}>{label}</Text>
  </Pressable>
);

export const TutorialControls: React.FC<TutorialControlsProps> = ({
  steps,
  stepIndex,
  isPlaying,
  speed,
  controlsLocked,
  onTogglePlay,
  onNext,
  onBack,
  onRestart,
  onToggleSpeed,
  compact = false,
}) => {
  const totalSteps = steps.length;
  const progress = totalSteps === 0 ? 0 : stepIndex / totalSteps;
  const clampedStepIndex = Math.max(0, Math.min(stepIndex, totalSteps));
  const currentStep = clampedStepIndex >= totalSteps ? null : steps[clampedStepIndex];
  const nextLabel = currentStep ? describeTutorialStep(currentStep) : 'Tutorial complete';

  return (
    <View style={[styles.wrap, compact && styles.wrapCompact]}>
      <Image source={urTextures.lapisMosaic} resizeMode="cover" style={styles.texture} />
      <View style={styles.topGlow} />
      <View style={styles.innerBorder} />

      <View style={[styles.progressHeader, compact && styles.progressHeaderCompact]}>
        <Text style={styles.progressText}>Step {clampedStepIndex} / {totalSteps}</Text>
        <Text style={[styles.progressHint, compact && styles.progressHintCompact]}>{controlsLocked ? 'Paused for lesson' : nextLabel}</Text>
      </View>

      <View style={[styles.timelineTrack, compact && styles.timelineTrackCompact]}>
        <View style={[styles.timelineFill, { width: `${Math.max(0, Math.min(100, progress * 100))}%` }]} />
        <View style={styles.markerRow} pointerEvents="none">
          {steps.map((step, index) => {
            const left = totalSteps <= 1 ? 0 : (index / (totalSteps - 1)) * 100;
            const isTeaching = step.kind === 'PAUSE' || step.kind === 'UI_HINT';
            const isPassed = index < clampedStepIndex;
            const isCurrent = index === clampedStepIndex;

            return (
              <View
                key={step.id}
                style={[
                  styles.marker,
                  { left: `${left}%` },
                  isTeaching && styles.markerTeaching,
                  isPassed && styles.markerPassed,
                  isCurrent && styles.markerCurrent,
                ]}
              />
            );
          })}
        </View>
      </View>

      <View style={[styles.controlsRow, compact && styles.controlsRowCompact]}>
        <View style={[styles.controlChipWrap, compact && styles.controlChipWrapCompact]}>
          <ControlChip label={isPlaying ? 'Pause' : 'Play'} onPress={onTogglePlay} disabled={controlsLocked || stepIndex >= totalSteps} active={isPlaying} />
        </View>
        <View style={[styles.controlChipWrap, compact && styles.controlChipWrapCompact]}>
          <ControlChip label="Next" onPress={onNext} disabled={controlsLocked || stepIndex >= totalSteps} />
        </View>
        <View style={[styles.controlChipWrap, compact && styles.controlChipWrapCompact]}>
          <ControlChip label="Back" onPress={onBack} disabled={controlsLocked || stepIndex <= 0} />
        </View>
        <View style={[styles.controlChipWrap, compact && styles.controlChipWrapCompact]}>
          <ControlChip label="Restart" onPress={onRestart} />
        </View>
        <View style={[styles.controlChipWrap, compact && styles.controlChipWrapCompact]}>
          <ControlChip label={`Speed ${speed}x`} onPress={onToggleSpeed} active={speed === 2} disabled={controlsLocked} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    borderRadius: urTheme.radii.md,
    borderWidth: 1,
    borderColor: 'rgba(217, 164, 65, 0.5)',
    backgroundColor: 'rgba(9, 14, 20, 0.78)',
    padding: urTheme.spacing.md,
    gap: urTheme.spacing.sm,
    overflow: 'hidden',
  },
  wrapCompact: {
    padding: urTheme.spacing.sm,
    gap: urTheme.spacing.xs,
  },
  texture: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.18,
  },
  topGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '45%',
    backgroundColor: 'rgba(255, 226, 181, 0.08)',
  },
  innerBorder: {
    ...StyleSheet.absoluteFillObject,
    margin: 4,
    borderRadius: urTheme.radii.sm,
    borderWidth: 1,
    borderColor: 'rgba(247, 228, 188, 0.18)',
  },
  progressHeader: {
    gap: 4,
  },
  progressHeaderCompact: {
    gap: 2,
  },
  progressText: {
    ...urTypography.label,
    color: urTheme.colors.parchment,
    fontSize: 11,
  },
  progressHint: {
    color: 'rgba(238, 227, 207, 0.9)',
    fontSize: 12,
    lineHeight: 17,
  },
  progressHintCompact: {
    fontSize: 11,
    lineHeight: 14,
  },
  timelineTrack: {
    position: 'relative',
    height: 18,
    borderRadius: urTheme.radii.pill,
    backgroundColor: 'rgba(13, 20, 28, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(248, 229, 189, 0.14)',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  timelineTrackCompact: {
    height: 14,
  },
  timelineFill: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(111, 184, 255, 0.24)',
  },
  markerRow: {
    ...StyleSheet.absoluteFillObject,
  },
  marker: {
    position: 'absolute',
    top: 5,
    marginLeft: -2.5,
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(245, 229, 203, 0.42)',
  },
  markerTeaching: {
    width: 7,
    height: 7,
    marginLeft: -3.5,
    top: 4,
    backgroundColor: 'rgba(246, 194, 106, 0.7)',
  },
  markerPassed: {
    backgroundColor: 'rgba(111, 184, 255, 0.9)',
  },
  markerCurrent: {
    backgroundColor: '#F6C26A',
    ...boxShadow({
      color: '#F6C26A',
      opacity: 0.7,
      blurRadius: 4,
      elevation: 4,
    }),
  },
  controlsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: urTheme.spacing.xs,
  },
  controlsRowCompact: {
    flexWrap: 'nowrap',
  },
  controlChipWrap: {
    flexShrink: 1,
  },
  controlChipWrapCompact: {
    flex: 1,
    minWidth: 0,
  },
  controlChip: {
    minHeight: 38,
    paddingHorizontal: 12,
    borderRadius: urTheme.radii.pill,
    borderWidth: 1,
    borderColor: 'rgba(217, 164, 65, 0.46)',
    backgroundColor: 'rgba(15, 22, 31, 0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlChipActive: {
    borderColor: 'rgba(111, 184, 255, 0.84)',
    backgroundColor: 'rgba(19, 44, 66, 0.95)',
  },
  controlChipDisabled: {
    opacity: 0.48,
  },
  controlChipPressed: {
    opacity: 0.82,
  },
  controlChipLabel: {
    ...urTypography.label,
    fontSize: 11,
    color: urTheme.colors.parchment,
  },
  controlChipLabelActive: {
    color: '#D7EEFF',
  },
});
