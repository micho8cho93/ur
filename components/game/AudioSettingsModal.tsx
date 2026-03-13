import { Button } from '@/components/ui/Button';
import { boxShadow } from '@/constants/styleEffects';
import { urTheme, urTextures, urTypography } from '@/constants/urTheme';
import React from 'react';
import { Image, Modal as RNModal, Pressable, StyleSheet, Switch, Text, View } from 'react-native';

interface AudioSettingsModalProps {
  visible: boolean;
  musicEnabled: boolean;
  sfxEnabled: boolean;
  onClose: () => void;
  onToggleMusic: (enabled: boolean) => void;
  onToggleSfx: (enabled: boolean) => void;
}

export const AudioSettingsModal: React.FC<AudioSettingsModalProps> = ({
  visible,
  musicEnabled,
  sfxEnabled,
  onClose,
  onToggleMusic,
  onToggleSfx,
}) => (
  <RNModal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
    <Pressable style={styles.backdrop} onPress={onClose}>
      <Pressable style={styles.sheet} onPress={(event) => event.stopPropagation()}>
        <Image source={urTextures.woodDark} resizeMode="repeat" style={styles.texture} />
        <Image source={urTextures.border} resizeMode="repeat" style={styles.borderTexture} />
        <View style={styles.sheetGlow} />
        <View style={styles.border} />

        <Text style={styles.title}>Audio Settings</Text>
        <Text style={styles.subtitle}>Choose whether the hall stays musical and whether game sounds remain active.</Text>

        <View style={styles.optionList}>
          <View style={styles.optionRow}>
            <View style={styles.copyWrap}>
              <Text style={styles.optionTitle}>Background Music</Text>
              <Text style={styles.optionHint}>Ancient ambience during the match</Text>
            </View>
            <Switch
              value={musicEnabled}
              onValueChange={onToggleMusic}
              trackColor={{ false: 'rgba(92, 66, 41, 0.72)', true: 'rgba(200, 152, 32, 0.62)' }}
              thumbColor={musicEnabled ? '#F4D38A' : '#E7D2B1'}
            />
          </View>

          <View style={styles.optionRow}>
            <View style={styles.copyWrap}>
              <Text style={styles.optionTitle}>Sound Effects</Text>
              <Text style={styles.optionHint}>Rolls, captures, scores, and tray drops</Text>
            </View>
            <Switch
              value={sfxEnabled}
              onValueChange={onToggleSfx}
              trackColor={{ false: 'rgba(92, 66, 41, 0.72)', true: 'rgba(200, 152, 32, 0.62)' }}
              thumbColor={sfxEnabled ? '#F4D38A' : '#E7D2B1'}
            />
          </View>
        </View>

        <View style={styles.buttonWrap}>
          <Button title="Close" variant="secondary" onPress={onClose} />
        </View>
      </Pressable>
    </Pressable>
  </RNModal>
);

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
    maxWidth: 420,
    borderRadius: urTheme.radii.lg,
    overflow: 'hidden',
    backgroundColor: '#3B2416',
    borderWidth: 1.5,
    borderColor: 'rgba(217, 164, 65, 0.7)',
    padding: urTheme.spacing.lg,
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
    height: '40%',
    backgroundColor: 'rgba(255, 219, 164, 0.16)',
  },
  border: {
    ...StyleSheet.absoluteFillObject,
    margin: urTheme.spacing.xs,
    borderRadius: urTheme.radii.md,
    borderWidth: 1,
    borderColor: 'rgba(252, 225, 177, 0.33)',
  },
  title: {
    ...urTypography.title,
    color: urTheme.colors.parchment,
    fontSize: 28,
    textAlign: 'center',
  },
  subtitle: {
    color: 'rgba(247, 229, 203, 0.88)',
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 20,
    marginTop: urTheme.spacing.xs,
    marginBottom: urTheme.spacing.lg,
  },
  optionList: {
    gap: urTheme.spacing.sm,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: urTheme.spacing.md,
    borderRadius: urTheme.radii.md,
    borderWidth: 1,
    borderColor: 'rgba(246, 219, 163, 0.18)',
    backgroundColor: 'rgba(10, 12, 16, 0.16)',
    paddingHorizontal: urTheme.spacing.md,
    paddingVertical: urTheme.spacing.sm + 2,
  },
  copyWrap: {
    flex: 1,
    minWidth: 0,
  },
  optionTitle: {
    ...urTypography.label,
    color: urTheme.colors.parchment,
    fontSize: 12,
    letterSpacing: 0.9,
  },
  optionHint: {
    color: 'rgba(247, 229, 203, 0.76)',
    fontSize: 12,
    lineHeight: 16,
    marginTop: 2,
  },
  buttonWrap: {
    marginTop: urTheme.spacing.lg,
  },
});
