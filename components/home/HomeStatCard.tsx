import React from 'react';
import {
  Image,
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
import {
  urTextColors,
  urTextVariants,
} from '@/constants/urTheme';
import { HomeLightButton } from '@/components/home/HomeLightButton';

const homeStatCardArt = require('../../assets/images/featured_card_portrait.png');

export const HOME_STAT_CARD_ASPECT_RATIO = 626 / 732;
const DESKTOP_CARD_ART_SCALE = 1.0;
const COMPACT_CARD_ART_SCALE = 1.0;
const HOME_STAT_CARD_CONTENT_SCALE = 0.7727272727;
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
  ctaStyle?: StyleProp<ViewStyle>;
  children: React.ReactNode;
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
  ctaStyle,
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
        <View
          style={[
            styles.innerFrameContent,
            isCompact ? styles.innerFrameContentCompact : styles.innerFrameContentDesktop,
          ]}
        >
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

          <HomeLightButton
            label={ctaLabel}
            onPress={onCtaPress}
            accessibilityLabel={ctaAccessibilityLabel ?? ctaLabel}
            disabled={ctaDisabled}
            fontLoaded={fontLoaded}
            size={isCompact ? 'compact' : 'regular'}
            style={[
              styles.cta,
              isCompact ? styles.ctaCompact : styles.ctaDesktop,
              ctaStyle,
            ]}
          />
        </View>
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
  innerFrameContent: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  innerFrameContentDesktop: {
    transform: [{ scale: HOME_STAT_CARD_CONTENT_SCALE }],
  },
  innerFrameContentCompact: {
    transform: [{ scale: HOME_STAT_CARD_CONTENT_SCALE }],
  },
  title: {
    textAlign: 'center',
    color: urTextColors.titleOnPanel,
    ...urTextVariants.cardTitle,
  },
  titleDesktop: {
    fontSize: 22,
    lineHeight: 25,
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
    width: '78%',
    alignSelf: 'center',
    position: 'relative',
    overflow: 'visible',
  },
  ctaDesktop: {
    top: -6,
  },
  ctaCompact: {
    top: -16,
  },
});
