import {
  urPanelColors,
  urTextColors,
  urTextVariants,
  urTheme,
  urTextures,
} from '@/constants/urTheme';
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
import {
  HOME_FREDOKA_FONT_FAMILY,
  HOME_SUPERCELL_FONT_FAMILY,
} from '@/src/home/homeTheme';
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

type MessageBlock =
  | { type: 'paragraph'; text: string }
  | { type: 'bullets'; items: string[] };

const BULLET_PREFIX = /^[•*-]\s+/;

const buildMessageBlocks = (message: string): MessageBlock[] => {
  const blocks: MessageBlock[] = [];
  const paragraphLines: string[] = [];
  const bulletItems: string[] = [];

  const flushParagraph = () => {
    if (paragraphLines.length === 0) {
      return;
    }

    blocks.push({ type: 'paragraph', text: paragraphLines.join(' ').trim() });
    paragraphLines.length = 0;
  };

  const flushBullets = () => {
    if (bulletItems.length === 0) {
      return;
    }

    blocks.push({ type: 'bullets', items: [...bulletItems] });
    bulletItems.length = 0;
  };

  for (const line of message.split('\n')) {
    const trimmedLine = line.trim();

    if (trimmedLine.length === 0) {
      flushParagraph();
      flushBullets();
      continue;
    }

    if (BULLET_PREFIX.test(trimmedLine)) {
      flushParagraph();
      bulletItems.push(trimmedLine.replace(BULLET_PREFIX, '').trim());
      continue;
    }

    flushBullets();
    paragraphLines.push(trimmedLine);
  }

  flushParagraph();
  flushBullets();

  if (blocks.length === 0) {
    const trimmedMessage = message.trim();
    return trimmedMessage.length > 0 ? [{ type: 'paragraph', text: trimmedMessage }] : [];
  }

  return blocks;
};

const renderMessageBlocks = (message: string) => {
  const blocks = buildMessageBlocks(message);

  if (blocks.length === 0) {
    return null;
  }

  return (
    <View style={styles.messageWrap}>
      {blocks.map((block, blockIndex) => {
        if (block.type === 'paragraph') {
          return (
            <Text
              key={`paragraph-${blockIndex}`}
              style={[styles.messageText, blockIndex > 0 && styles.messageBlockSpacing]}
            >
              {block.text}
            </Text>
          );
        }

        return (
          <View
            key={`bullets-${blockIndex}`}
            testID="shared-modal-bullet-list"
            style={[styles.bulletList, blockIndex > 0 && styles.messageBlockSpacing]}
          >
            {block.items.map((item, itemIndex) => (
              <View
                key={`${blockIndex}-${itemIndex}`}
                style={[styles.bulletRow, itemIndex > 0 && styles.bulletRowSpacing]}
              >
                <Text style={styles.bulletGlyph}>•</Text>
                <Text style={styles.bulletText}>{item}</Text>
              </View>
            ))}
          </View>
        );
      })}
    </View>
  );
};

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
  const overlayContent = (
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
            {message ? renderMessageBlocks(message) : null}
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
  );

  if (!visible) {
    return null;
  }

  if (Platform.OS === 'web') {
    return (
      <View pointerEvents="box-none" style={styles.webOverlay}>
        {overlayContent}
      </View>
    );
  }

  return (
    <RNModal transparent visible animationType="fade" onRequestClose={onAction ?? (() => undefined)}>
      {overlayContent}
    </RNModal>
  );
};

const styles = StyleSheet.create({
  webOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 120,
    elevation: 40,
  },
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
    backgroundColor: urTheme.colors.tableWalnut,
    borderWidth: 1.5,
    borderColor: urPanelColors.darkBorderStrong,
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
    backgroundColor: urPanelColors.topGlow,
  },
  border: {
    ...StyleSheet.absoluteFillObject,
    margin: urTheme.spacing.xs,
    borderRadius: urTheme.radii.md,
    borderWidth: 1,
    borderColor: urPanelColors.darkBorder,
  },
  title: {
    ...urTextVariants.sectionTitle,
    color: urTextColors.titleOnScene,
    fontFamily: HOME_SUPERCELL_FONT_FAMILY,
    fontSize: 30,
    textAlign: 'center',
    marginBottom: urTheme.spacing.sm,
  },
  messageWrap: {
    alignSelf: 'stretch',
    marginBottom: urTheme.spacing.lg,
  },
  messageText: {
    color: 'rgba(230, 211, 163, 0.92)',
    textAlign: 'center',
    fontSize: 15,
    lineHeight: 21,
    fontFamily: HOME_FREDOKA_FONT_FAMILY,
    ...urTextVariants.body,
  },
  messageBlockSpacing: {
    marginTop: urTheme.spacing.sm,
  },
  bulletList: {
    alignSelf: 'stretch',
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  bulletRowSpacing: {
    marginTop: urTheme.spacing.xs,
  },
  bulletGlyph: {
    width: 18,
    color: 'rgba(230, 211, 163, 0.92)',
    textAlign: 'center',
    fontSize: 15,
    lineHeight: 21,
    fontFamily: HOME_FREDOKA_FONT_FAMILY,
    ...urTextVariants.body,
  },
  bulletText: {
    flex: 1,
    color: 'rgba(230, 211, 163, 0.92)',
    textAlign: 'left',
    fontSize: 15,
    lineHeight: 21,
    fontFamily: HOME_FREDOKA_FONT_FAMILY,
    ...urTextVariants.body,
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
