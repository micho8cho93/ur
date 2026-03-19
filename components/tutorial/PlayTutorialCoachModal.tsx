import { Button } from '@/components/ui/Button';
import { boxShadow } from '@/constants/styleEffects';
import { urTheme, urTextures, urTypography } from '@/constants/urTheme';
import React from 'react';
import { Image, Modal as RNModal, StyleSheet, Text, View } from 'react-native';

interface PlayTutorialCoachModalProps {
  visible: boolean;
  eyebrow?: string;
  title: string;
  body: string;
  actionLabel?: string;
  onContinue: () => void;
}

export const PlayTutorialCoachModal: React.FC<PlayTutorialCoachModalProps> = ({
  visible,
  eyebrow,
  title,
  body,
  actionLabel = 'Continue',
  onContinue,
}) => {
  return (
    <RNModal transparent visible={visible} animationType="fade">
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <Image source={urTextures.woodDark} resizeMode="repeat" style={styles.texture} />
          <Image source={urTextures.border} resizeMode="repeat" style={styles.borderTexture} />
          <View style={styles.sheetGlow} />
          <View style={styles.border} />

          {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.body}>{body}</Text>

          <Button title={actionLabel} onPress={onContinue} />
        </View>
      </View>
    </RNModal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(4, 7, 12, 0.72)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: urTheme.spacing.md,
  },
  sheet: {
    width: '100%',
    maxWidth: 440,
    borderRadius: urTheme.radii.lg,
    overflow: 'hidden',
    backgroundColor: '#3B2416',
    borderWidth: 1.5,
    borderColor: 'rgba(217, 164, 65, 0.7)',
    padding: urTheme.spacing.lg,
    gap: urTheme.spacing.sm,
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
    opacity: 0.18,
  },
  sheetGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '38%',
    backgroundColor: 'rgba(255, 219, 164, 0.14)',
  },
  border: {
    ...StyleSheet.absoluteFillObject,
    margin: urTheme.spacing.xs,
    borderRadius: urTheme.radii.md,
    borderWidth: 1,
    borderColor: 'rgba(252, 225, 177, 0.28)',
  },
  eyebrow: {
    ...urTypography.label,
    color: '#F3D9A6',
    fontSize: 11,
  },
  title: {
    ...urTypography.title,
    color: urTheme.colors.parchment,
    fontSize: 26,
    lineHeight: 32,
  },
  body: {
    color: 'rgba(247, 229, 203, 0.94)',
    fontSize: 15,
    lineHeight: 22,
    marginBottom: urTheme.spacing.xs,
  },
});
