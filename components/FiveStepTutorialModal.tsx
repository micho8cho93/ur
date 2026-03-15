import { HowToPlayBoardPreview } from '@/components/tutorial/HowToPlayBoardPreview';
import { Button } from '@/components/ui/Button';
import {
  HOW_TO_PLAY_FIVE_STEP_NOTE,
  HOW_TO_PLAY_FIVE_STEP_TITLE,
  HOW_TO_PLAY_STEPS,
} from '@/content/howToPlayFiveStep';
import { boxShadow } from '@/constants/styleEffects';
import { urTheme, urTextures, urTypography } from '@/constants/urTheme';
import React from 'react';
import { Image, Modal as RNModal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface FiveStepTutorialModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
}

export const FiveStepTutorialModal: React.FC<FiveStepTutorialModalProps> = ({
  visible,
  onClose,
  title = HOW_TO_PLAY_FIVE_STEP_TITLE,
}) => {
  const [stepIndex, setStepIndex] = React.useState(0);

  React.useEffect(() => {
    if (visible) {
      setStepIndex(0);
    }
  }, [visible]);

  const currentStep = HOW_TO_PLAY_STEPS[stepIndex];
  const isFirstStep = stepIndex === 0;
  const isLastStep = stepIndex === HOW_TO_PLAY_STEPS.length - 1;

  return (
    <RNModal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
      presentationStyle="overFullScreen"
    >
      <View style={styles.modalRoot}>
        <Pressable
          style={styles.backdrop}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Close 5 step tutorial"
        />

        <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']} pointerEvents="box-none">
          <View pointerEvents="box-none" style={styles.centerWrap}>
            <View style={styles.sheet} accessibilityViewIsModal>
              <Image source={urTextures.woodDark} resizeMode="repeat" style={styles.texture} />
              <Image source={urTextures.border} resizeMode="repeat" style={styles.borderTexture} />
              <View style={styles.sheetGlow} />
              <View style={styles.border} />

              <View style={styles.headerRow}>
                <View style={styles.headerCopy}>
                  <Text style={styles.title}>{title}</Text>
                  <Text style={styles.stepCount}>
                    Step {stepIndex + 1} of {HOW_TO_PLAY_STEPS.length}
                  </Text>
                </View>
                <Pressable
                  onPress={onClose}
                  style={({ pressed }) => [styles.closeIconButton, pressed && styles.closeIconButtonPressed]}
                  accessibilityRole="button"
                  accessibilityLabel="Close"
                  hitSlop={8}
                >
                  <Text style={styles.closeIconLabel}>X</Text>
                </Pressable>
              </View>

              <View style={styles.progressRow}>
                {HOW_TO_PLAY_STEPS.map((step, index) => (
                  <View
                    key={step.id}
                    testID={index === stepIndex ? 'tutorial-dot-active' : `tutorial-dot-${index + 1}`}
                    style={[styles.progressDot, index === stepIndex && styles.progressDotActive]}
                  />
                ))}
              </View>

              <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator
                keyboardShouldPersistTaps="handled"
              >
                <Text style={styles.sectionHeading}>{currentStep.heading}</Text>

                <HowToPlayBoardPreview previewId={currentStep.previewId} visible={visible} />

                <View style={styles.listWrap}>
                  {currentStep.items.map((item) => (
                    <View key={item} style={styles.bulletRow}>
                      <Text style={styles.bulletDot}>{'\u2022'}</Text>
                      <Text style={styles.bulletText}>{item}</Text>
                    </View>
                  ))}
                </View>

                <Text style={styles.noteText}>{HOW_TO_PLAY_FIVE_STEP_NOTE}</Text>
              </ScrollView>

              <View style={styles.footer}>
                <View style={styles.footerButton}>
                  <Button
                    title="Back"
                    variant="outline"
                    disabled={isFirstStep}
                    onPress={() => setStepIndex((current) => Math.max(0, current - 1))}
                  />
                </View>
                <View style={styles.footerButton}>
                  <Button
                    title={isLastStep ? 'Done' : 'Next'}
                    onPress={() => {
                      if (isLastStep) {
                        onClose();
                        return;
                      }

                      setStepIndex((current) => Math.min(HOW_TO_PLAY_STEPS.length - 1, current + 1));
                    }}
                  />
                </View>
              </View>
            </View>
          </View>
        </SafeAreaView>
      </View>
    </RNModal>
  );
};

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    backgroundColor: 'rgba(4, 7, 12, 0.28)',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(4, 7, 12, 0.68)',
  },
  safeArea: {
    flex: 1,
  },
  centerWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: urTheme.spacing.md,
    paddingVertical: urTheme.spacing.md,
  },
  sheet: {
    width: '100%',
    maxWidth: 760,
    maxHeight: '92%',
    borderRadius: urTheme.radii.lg,
    overflow: 'hidden',
    backgroundColor: '#2E1C12',
    borderWidth: 1.5,
    borderColor: 'rgba(217, 164, 65, 0.74)',
    paddingHorizontal: urTheme.spacing.lg,
    paddingTop: urTheme.spacing.lg,
    paddingBottom: urTheme.spacing.md,
    ...boxShadow({
      color: '#000',
      opacity: 0.34,
      offset: { width: 0, height: 12 },
      blurRadius: 18,
      elevation: 12,
    }),
  },
  texture: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.22,
  },
  borderTexture: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.14,
  },
  sheetGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '24%',
    backgroundColor: 'rgba(255, 223, 170, 0.16)',
  },
  border: {
    ...StyleSheet.absoluteFillObject,
    margin: urTheme.spacing.xs,
    borderRadius: urTheme.radii.md,
    borderWidth: 1,
    borderColor: 'rgba(252, 225, 177, 0.28)',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: urTheme.spacing.sm,
    marginBottom: urTheme.spacing.sm,
  },
  headerCopy: {
    flex: 1,
  },
  title: {
    ...urTypography.title,
    color: urTheme.colors.parchment,
    fontSize: 26,
    lineHeight: 32,
  },
  stepCount: {
    marginTop: 4,
    ...urTypography.label,
    color: 'rgba(243, 217, 166, 0.9)',
    fontSize: 11,
  },
  closeIconButton: {
    width: 34,
    height: 34,
    borderRadius: urTheme.radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(236, 205, 152, 0.35)',
    backgroundColor: 'rgba(12, 15, 18, 0.38)',
  },
  closeIconButtonPressed: {
    opacity: 0.78,
  },
  closeIconLabel: {
    color: urTheme.colors.parchment,
    fontSize: 16,
    lineHeight: 18,
    fontWeight: '700',
  },
  progressRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: urTheme.spacing.sm,
  },
  progressDot: {
    flex: 1,
    height: 6,
    borderRadius: urTheme.radii.pill,
    backgroundColor: 'rgba(243, 217, 166, 0.18)',
  },
  progressDotActive: {
    backgroundColor: '#F0C040',
  },
  scroll: {
    flexGrow: 0,
    flexShrink: 1,
  },
  scrollContent: {
    paddingBottom: urTheme.spacing.sm,
  },
  sectionHeading: {
    ...urTypography.subtitle,
    color: '#F3DFBE',
    fontSize: 22,
    lineHeight: 28,
    marginBottom: urTheme.spacing.sm,
    fontWeight: '700',
  },
  listWrap: {
    marginTop: urTheme.spacing.md,
    gap: 8,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingRight: urTheme.spacing.xs,
  },
  bulletDot: {
    width: 18,
    color: 'rgba(244, 210, 152, 0.95)',
    fontSize: 16,
    lineHeight: 22,
    textAlign: 'center',
  },
  bulletText: {
    flex: 1,
    color: 'rgba(247, 229, 203, 0.94)',
    fontSize: 15,
    lineHeight: 22,
  },
  noteText: {
    marginTop: urTheme.spacing.md,
    color: 'rgba(232, 210, 176, 0.72)',
    fontSize: 12,
    lineHeight: 18,
  },
  footer: {
    flexDirection: 'row',
    gap: urTheme.spacing.sm,
    marginTop: urTheme.spacing.md,
  },
  footerButton: {
    flex: 1,
  },
});
