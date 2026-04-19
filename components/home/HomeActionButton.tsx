import React from 'react';
import {
  ActivityIndicator,
  ImageBackground,
  Platform,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';

import { urTextVariants, urTheme } from '@/constants/urTheme';
import { resolveHomeButtonFontFamily } from '@/src/home/homeTheme';
import { CTA_BUTTON_VISIBLE_IMAGE_STYLE } from '@/components/ui/buttonArt';

const ctaButtonArt = require('../../assets/buttons/cta_button.png');

type HomeActionButtonTone = 'teal' | 'gold' | 'stone' | 'green' | 'ember';
type HomeActionButtonSize = 'regular' | 'small';

type HomeActionButtonProps = {
  title: string;
  onPress: () => void;
  tone: HomeActionButtonTone;
  size?: HomeActionButtonSize;
  compact?: boolean;
  disabled?: boolean;
  loading?: boolean;
  fontLoaded?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
};

type HomeActionInteractionState = {
  pressed: boolean;
  hovered?: boolean;
};

type HomeActionWebStyle = ViewStyle & {
  cursor?: 'pointer';
  transitionDuration?: string;
  transitionProperty?: string;
  userSelect?: 'none';
  willChange?: string;
};

const ACTION_BUTTON_WEB_STYLE: HomeActionWebStyle =
  Platform.select<HomeActionWebStyle>({
    web: {
      cursor: 'pointer',
      transitionDuration: '180ms',
      transitionProperty: 'transform, opacity',
      userSelect: 'none',
      willChange: 'transform',
    },
    default: {},
  }) ?? {};

const getPressableInteractionStyle = ({
  pressed,
  hovered,
}: HomeActionInteractionState): ViewStyle | null => {
  if (pressed) {
    return styles.pressed;
  }

  if (hovered) {
    return styles.hovered;
  }

  return null;
};

export function HomeActionButton({
  title,
  onPress,
  tone: _tone,
  size = 'regular',
  compact = false,
  disabled = false,
  loading = false,
  fontLoaded = false,
  style,
  accessibilityLabel,
}: HomeActionButtonProps) {
  const isDisabled = disabled || loading;
  const labelFontFamily = resolveHomeButtonFontFamily(fontLoaded);
  const labelColor = isDisabled ? 'rgba(255, 243, 196, 0.72)' : urTheme.colors.ivory;
  const actionButtonHeight = size === 'small' ? (compact ? 44 : 50) : compact ? 56 : 62;
  const actionButtonCornerRadius = Math.max(12, Math.round(actionButtonHeight * 0.34));

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityState={{ disabled: isDisabled }}
      disabled={isDisabled}
      onPress={onPress}
      style={(state) => [
        styles.pressable,
        ACTION_BUTTON_WEB_STYLE,
        size === 'small'
          ? compact
            ? styles.smallCompactHeight
            : styles.smallHeight
          : compact
            ? styles.compactHeight
            : styles.regularHeight,
        { borderRadius: actionButtonCornerRadius },
        !isDisabled && getPressableInteractionStyle(state),
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {({ pressed }) => (
        <ImageBackground
          source={ctaButtonArt}
          resizeMode="stretch"
          style={[
            styles.imageFrame,
            size === 'small'
              ? styles.imageFrameSmall
              : compact
                ? styles.imageFrameCompact
                : styles.imageFrameRegular,
            {
              borderRadius: actionButtonCornerRadius,
              overflow: 'hidden',
            },
          ]}
          imageStyle={[
            styles.imageStyle,
            {
              borderRadius: actionButtonCornerRadius,
            },
            pressed ? styles.imageStylePressed : null,
            isDisabled ? styles.imageStyleDisabled : null,
          ]}
        >
          <Text
            numberOfLines={1}
            style={[
              styles.label,
              loading ? styles.labelHidden : null,
              compact ? styles.labelCompact : styles.labelRegular,
              size === 'small' && styles.labelSmall,
              {
                color: labelColor,
                fontFamily: labelFontFamily,
              },
            ]}
          >
            {title}
          </Text>

          {loading ? (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="small" color={labelColor} />
              <Text
                numberOfLines={1}
                style={[
                  styles.label,
                  styles.loadingLabel,
                  compact ? styles.labelCompact : styles.labelRegular,
                  size === 'small' && styles.labelSmall,
                  {
                    color: labelColor,
                    fontFamily: labelFontFamily,
                  },
                ]}
              >
                {title}
              </Text>
            </View>
          ) : null}
        </ImageBackground>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  regularHeight: {
    height: 62,
  },
  compactHeight: {
    height: 56,
  },
  smallHeight: {
    height: 50,
  },
  smallCompactHeight: {
    height: 44,
  },
  imageFrame: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageFrameRegular: {
    paddingHorizontal: 22,
    paddingTop: 8,
    paddingBottom: 10,
  },
  imageFrameCompact: {
    paddingHorizontal: 18,
    paddingTop: 7,
    paddingBottom: 9,
  },
  imageFrameSmall: {
    paddingHorizontal: 15,
    paddingTop: 6,
    paddingBottom: 8,
  },
  imageStyle: {
    ...CTA_BUTTON_VISIBLE_IMAGE_STYLE,
  },
  imageStylePressed: {
    opacity: 0.94,
  },
  imageStyleDisabled: {
    opacity: 0.62,
  },
  label: {
    ...urTextVariants.buttonLabel,
    textAlign: 'center',
    width: '92%',
    textShadowColor: 'rgba(86, 42, 0, 0.42)',
    textShadowOffset: {
      width: 0,
      height: 1,
    },
    textShadowRadius: 1.5,
  },
  labelRegular: {
    fontSize: 17,
    lineHeight: 19,
  },
  labelCompact: {
    fontSize: 14,
    lineHeight: 16,
  },
  labelSmall: {
    fontSize: 12,
    lineHeight: 14,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'transparent',
  },
  loadingLabel: {
    width: 'auto',
    maxWidth: '72%',
  },
  labelHidden: {
    opacity: 0,
  },
  pressed: {
    transform: [{ translateY: 4 }, { scale: 0.96 }],
  },
  hovered: {
    transform: [{ translateY: -2 }],
  },
  disabled: {
    opacity: 0.58,
  },
});
