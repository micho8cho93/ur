import React from 'react';
import {
  Image,
  Platform,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';

import {
  HomeLayoutVariant,
  resolveHomeFredokaFontFamily,
} from '@/src/home/homeTheme';

const homeStatCardArt = require('../../assets/images/home_stat_card.png');

export const HOME_STAT_CARD_ASPECT_RATIO = 626 / 732;
const DESKTOP_CARD_ART_SCALE = 1.0;
const COMPACT_CARD_ART_SCALE = 1.0;
const HOME_STAT_CARD_CTA_ROTATION = '-1.2deg';
const HOME_STAT_CARD_CTA_BACKGROUND = '#B9B4AC';
const HOME_STAT_CARD_CTA_BORDER = '#5A5148';
const HOME_STAT_CARD_CTA_TEXT = '#3D362F';
const HOME_STAT_CARD_CTA_SKETCH = 'rgba(74, 66, 58, 0.18)';

type HomeStatCardProps = {
  title: string;
  ctaLabel: string;
  onCtaPress: () => void;
  ctaAccessibilityLabel?: string;
  ctaDisabled?: boolean;
  layoutVariant?: HomeLayoutVariant;
  fontLoaded?: boolean;
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
  children: React.ReactNode;
};

type HomeStatCardInteractionState = {
  pressed: boolean;
  hovered?: boolean;
  focused?: boolean;
};

type HomeStatCardWebStyle = ViewStyle & {
  cursor?: 'pointer';
  transitionDuration?: string;
  transitionProperty?: string;
  userSelect?: 'none';
  willChange?: string;
  borderTopLeftRadius?: number | string;
  borderTopRightRadius?: number | string;
  borderBottomRightRadius?: number | string;
  borderBottomLeftRadius?: number | string;
};

const HOME_STAT_CARD_CTA_WEB_STYLE: HomeStatCardWebStyle =
  Platform.select<HomeStatCardWebStyle>({
    web: {
      cursor: 'pointer',
      transitionDuration: '235ms',
      transitionProperty: 'transform, box-shadow',
      userSelect: 'none',
      willChange: 'transform, box-shadow',
      borderTopLeftRadius: '255px 15px',
      borderTopRightRadius: '15px 225px',
      borderBottomRightRadius: '225px 15px',
      borderBottomLeftRadius: '15px 255px',
    },
    default: {},
  }) ?? {};

const HOME_STAT_CARD_CTA_DEFAULT_STYLE = {
  boxShadow: [
    {
      color: 'rgba(0, 0, 0, 0.2)',
      offsetX: 15,
      offsetY: 28,
      blurRadius: 25,
      spreadDistance: -18,
    },
  ],
  transform: [{ rotate: HOME_STAT_CARD_CTA_ROTATION }],
} satisfies ViewStyle;

const HOME_STAT_CARD_CTA_HOVER_STYLE = {
  boxShadow: [
    {
      color: 'rgba(0, 0, 0, 0.3)',
      offsetX: 2,
      offsetY: 8,
      blurRadius: 8,
      spreadDistance: -5,
    },
  ],
  transform: [{ rotate: HOME_STAT_CARD_CTA_ROTATION }, { translateY: 2 }],
} satisfies ViewStyle;

const HOME_STAT_CARD_CTA_FOCUS_STYLE = {
  boxShadow: [
    {
      color: 'rgba(0, 0, 0, 0.3)',
      offsetX: 2,
      offsetY: 8,
      blurRadius: 4,
      spreadDistance: -6,
    },
  ],
  transform: [{ rotate: HOME_STAT_CARD_CTA_ROTATION }],
} satisfies ViewStyle;

const HOME_STAT_CARD_CTA_ACTIVE_STYLE = {
  boxShadow: [
    {
      color: 'rgba(0, 0, 0, 0.22)',
      offsetX: 1,
      offsetY: 5,
      blurRadius: 5,
      spreadDistance: -5,
    },
  ],
  transform: [{ rotate: HOME_STAT_CARD_CTA_ROTATION }, { translateY: 3 }],
} satisfies ViewStyle;

const getCtaInteractionStyle = ({
  pressed,
  hovered,
  focused,
}: HomeStatCardInteractionState): ViewStyle => {
  if (pressed) {
    return HOME_STAT_CARD_CTA_ACTIVE_STYLE;
  }

  if (hovered) {
    return HOME_STAT_CARD_CTA_HOVER_STYLE;
  }

  if (focused) {
    return HOME_STAT_CARD_CTA_FOCUS_STYLE;
  }

  return HOME_STAT_CARD_CTA_DEFAULT_STYLE;
};

export function HomeStatCard({
  title,
  ctaLabel,
  onCtaPress,
  ctaAccessibilityLabel,
  ctaDisabled = false,
  layoutVariant = 'desktop',
  fontLoaded = false,
  style,
  contentContainerStyle,
  children,
}: HomeStatCardProps) {
  const isCompact = layoutVariant === 'compact';
  const fredokaFontFamily = resolveHomeFredokaFontFamily(fontLoaded);
  const artScale = isCompact ? COMPACT_CARD_ART_SCALE : DESKTOP_CARD_ART_SCALE;

  return (
    <View style={[styles.cardShell, style]}>
      <Image
        source={homeStatCardArt}
        resizeMode="contain"
        accessibilityRole="image"
        accessibilityLabel={`${title} card`}
        style={[
          styles.cardArt,
          {
            width: `${artScale * 100}%`,
            height: `${artScale * 100}%`,
            left: `${(100 - artScale * 100) / 2}%`,
            bottom: isCompact ? '8%' : '6%',
          },
        ]}
      />

      <View style={[styles.innerFrame, isCompact ? styles.innerFrameCompact : styles.innerFrameDesktop]}>
        <Text
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.8}
          style={[
            styles.title,
            isCompact ? styles.titleCompact : styles.titleDesktop,
            { fontFamily: fredokaFontFamily },
          ]}
        >
          {title}
        </Text>

        <View style={[styles.content, contentContainerStyle]}>{children}</View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={ctaAccessibilityLabel ?? ctaLabel}
          disabled={ctaDisabled}
          onPress={onCtaPress}
          style={(state) => [
            styles.cta,
            HOME_STAT_CARD_CTA_WEB_STYLE,
            isCompact ? styles.ctaCompact : styles.ctaDesktop,
            getCtaInteractionStyle(state),
            ctaDisabled && styles.ctaDisabled,
          ]}
        >
          <View pointerEvents="none" style={styles.ctaSketchLineTopLeft} />
          <View pointerEvents="none" style={styles.ctaSketchLineTopRight} />
          <View pointerEvents="none" style={styles.ctaSketchLineBottomLeft} />
          <View pointerEvents="none" style={styles.ctaSketchLineBottomRight} />
          <Text
            numberOfLines={1}
            style={[
              styles.ctaLabel,
              isCompact ? styles.ctaLabelCompact : styles.ctaLabelDesktop,
              { fontFamily: fredokaFontFamily },
            ]}
          >
            {ctaLabel}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cardShell: {
    position: 'relative',
    width: '100%',
    aspectRatio: HOME_STAT_CARD_ASPECT_RATIO,
    overflow: 'visible',
  },
  cardArt: {
    position: 'absolute',
    zIndex: 0,
  },
  innerFrame: {
    position: 'absolute',
    left: '13%',
    right: '13%',
    alignItems: 'center',
    zIndex: 1,
  },
  innerFrameDesktop: {
    top: '12%',
    bottom: '14%',
  },
  innerFrameCompact: {
    top: '11.5%',
    bottom: '13%',
  },
  title: {
    textAlign: 'center',
    color: '#6C3A12',
    textShadowColor: 'rgba(255, 245, 221, 0.34)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  titleDesktop: {
    fontSize: 21,
    lineHeight: 24,
  },
  titleCompact: {
    fontSize: 20,
    lineHeight: 23,
  },
  content: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cta: {
    width: '82%',
    alignSelf: 'center',
    backgroundColor: HOME_STAT_CARD_CTA_BACKGROUND,
    borderWidth: 2,
    borderColor: HOME_STAT_CARD_CTA_BORDER,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 24,
    borderBottomRightRadius: 32,
    borderBottomLeftRadius: 22,
    overflow: 'visible',
  },
  ctaDesktop: {
    minHeight: 40,
    paddingHorizontal: 12,
    paddingVertical: 8,
    top: -6,
  },
  ctaCompact: {
    minHeight: 38,
    paddingHorizontal: 10,
    paddingVertical: 8,
    top: -20,
  },
  ctaLabel: {
    color: HOME_STAT_CARD_CTA_TEXT,
    textAlign: 'center',
    zIndex: 1,
  },
  ctaLabelDesktop: {
    fontSize: 16,
    lineHeight: 19,
  },
  ctaLabelCompact: {
    fontSize: 15,
    lineHeight: 18,
  },
  ctaDisabled: {
    opacity: 0.62,
  },
  ctaSketchLineTopLeft: {
    position: 'absolute',
    top: 7,
    left: 14,
    width: 18,
    height: 1.5,
    borderRadius: 999,
    backgroundColor: HOME_STAT_CARD_CTA_SKETCH,
    transform: [{ rotate: '-5deg' }],
  },
  ctaSketchLineTopRight: {
    position: 'absolute',
    top: 8,
    right: 16,
    width: 22,
    height: 1.5,
    borderRadius: 999,
    backgroundColor: HOME_STAT_CARD_CTA_SKETCH,
    transform: [{ rotate: '4deg' }],
  },
  ctaSketchLineBottomLeft: {
    position: 'absolute',
    bottom: 8,
    left: 12,
    width: 20,
    height: 1.5,
    borderRadius: 999,
    backgroundColor: HOME_STAT_CARD_CTA_SKETCH,
    transform: [{ rotate: '3deg' }],
  },
  ctaSketchLineBottomRight: {
    position: 'absolute',
    right: 14,
    bottom: 7,
    width: 16,
    height: 1.5,
    borderRadius: 999,
    backgroundColor: HOME_STAT_CARD_CTA_SKETCH,
    transform: [{ rotate: '-6deg' }],
  },
});
