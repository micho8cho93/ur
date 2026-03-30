import { urTheme, urTextures, urTypography } from '@/constants/urTheme';
import { boxShadow } from '@/constants/styleEffects';
import React from 'react';
import {
  Image,
  Modal as RNModal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { Button } from './Button';

interface ModalProps {
  visible: boolean;
  title: string;
  message?: string;
  actionLabel?: string;
  actionLoading?: boolean;
  onAction?: () => void;
  children?: React.ReactNode;
  maxWidth?: number;
}

export const Modal: React.FC<ModalProps> = ({
  visible,
  title,
  message,
  actionLabel,
  actionLoading = false,
  onAction,
  children,
  maxWidth = 380,
}) => {
  const { width, height } = useWindowDimensions();
  const isMobileWeb = Platform.OS === 'web' && width < 760;
  const resolvedMaxWidth = Math.min(maxWidth, Math.max(280, width - (isMobileWeb ? 20 : 32)));
  const resolvedMaxHeight = Math.max(
    320,
    Math.min(height - (isMobileWeb ? 20 : 32), Math.round(height * (isMobileWeb ? 0.92 : 0.86))),
  );

  return (
    <RNModal transparent visible={visible} animationType="fade" onRequestClose={onAction ?? (() => undefined)}>
      <View style={[styles.backdrop, isMobileWeb && styles.backdropMobileWeb]}>
        <View testID="shared-modal-sheet" style={[styles.sheet, isMobileWeb && styles.sheetMobileWeb, { maxWidth: resolvedMaxWidth, maxHeight: resolvedMaxHeight }]}>
          <Image source={urTextures.woodDark} resizeMode="repeat" style={styles.texture} />
          <Image source={urTextures.border} resizeMode="repeat" style={styles.borderTexture} />
          <View style={styles.sheetGlow} />
          <View style={styles.border} />

          <ScrollView
            testID="shared-modal-scroll"
            style={styles.contentScroll}
            contentContainerStyle={styles.contentScrollContent}
            alwaysBounceVertical={false}
            bounces={false}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.contentStack}>
              <Text style={styles.title}>{title}</Text>
              {message ? <Text style={styles.message}>{message}</Text> : null}
              {children}
            </View>
          </ScrollView>

          {actionLabel && onAction ? (
            <View style={styles.buttonWrap}>
              <Button title={actionLabel} onPress={onAction} loading={actionLoading} />
            </View>
          ) : null}
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
  backdropMobileWeb: {
    justifyContent: 'flex-start',
    paddingTop: urTheme.spacing.lg,
    paddingBottom: urTheme.spacing.sm,
  },
  sheet: {
    width: '100%',
    maxWidth: 380,
    borderRadius: urTheme.radii.lg,
    overflow: 'hidden',
    backgroundColor: '#3B2416',
    borderWidth: 1.5,
    borderColor: 'rgba(217, 164, 65, 0.7)',
    padding: urTheme.spacing.lg,
    alignItems: 'center',
    ...boxShadow({
      color: '#000',
      opacity: 0.34,
      offset: { width: 0, height: 12 },
      blurRadius: 18,
      elevation: 12,
    }),
  },
  sheetMobileWeb: {
    paddingHorizontal: urTheme.spacing.md,
    paddingTop: urTheme.spacing.md,
    paddingBottom: urTheme.spacing.sm,
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
    fontSize: 30,
    textAlign: 'center',
    marginBottom: urTheme.spacing.sm,
  },
  message: {
    color: 'rgba(247, 229, 203, 0.92)',
    textAlign: 'center',
    fontSize: 15,
    lineHeight: 21,
    marginBottom: urTheme.spacing.lg,
  },
  contentScroll: {
    width: '100%',
    flexGrow: 0,
    flexShrink: 1,
  },
  contentScrollContent: {
    flexGrow: 1,
  },
  contentStack: {
    width: '100%',
    alignItems: 'stretch',
  },
  buttonWrap: {
    width: '100%',
    marginTop: urTheme.spacing.md,
  },
});
