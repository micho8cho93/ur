import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React from 'react';
import {
  ImageBackground,
  ImageStyle,
  Platform,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  ViewStyle,
} from 'react-native';

import { urTextVariants } from '@/constants/urTheme';
import { HOME_GROBOLD_FONT_FAMILY } from '@/src/home/homeTheme';
import { CTA_BUTTON_VISIBLE_IMAGE_STYLE } from '@/components/ui/buttonArt';

const ctaButtonArt = require('../../assets/buttons/cta_button.png');
const settingsButtonArt = require('../../assets/buttons/settings_button_square.png');

type SketchButtonProps = {
  label: string;
  accessibilityLabel: string;
  onPress: () => void;
  iconName?: React.ComponentProps<typeof MaterialIcons>['name'];
  iconSize?: number;
  iconOnly?: boolean;
  wide?: boolean;
  disabled?: boolean;
  fontFamily?: string;
  sizeScale?: number;
  style?: StyleProp<ViewStyle>;
};

type SketchButtonImageWebStyle = ImageStyle & {
  filter?: string;
  willChange?: string;
};

const SKETCH_BUTTON_IMAGE_SHADOW_STYLE =
  Platform.select<SketchButtonImageWebStyle>({
    web: {
      filter:
        'drop-shadow(0px 4px 0px rgba(86, 42, 0, 0.34)) drop-shadow(0px 10px 12px rgba(54, 22, 0, 0.18))',
      willChange: 'filter, opacity',
    },
    default: {},
  }) ?? {};

const SKETCH_BUTTON_IMAGE_SHADOW_PRESSED_STYLE =
  Platform.select<SketchButtonImageWebStyle>({
    web: {
      filter:
        'drop-shadow(0px 2px 0px rgba(86, 42, 0, 0.28)) drop-shadow(0px 5px 6px rgba(54, 22, 0, 0.12))',
    },
    default: {},
  }) ?? {};

export function SketchButton({
  label,
  accessibilityLabel,
  onPress,
  iconName,
  iconSize = 18,
  iconOnly = false,
  wide = false,
  disabled = false,
  fontFamily = HOME_GROBOLD_FONT_FAMILY,
  sizeScale = 1,
  style,
}: SketchButtonProps) {
  const resolvedSizeScale = Math.max(0.5, sizeScale);
  const scaledIconSize = Math.round(iconSize * resolvedSizeScale);
  const iconOnlySize = Math.round(46 * resolvedSizeScale);
  const compactMinWidth = Math.round(104 * resolvedSizeScale);
  const surfaceCompactMinWidth = Math.round(116 * resolvedSizeScale);
  const surfaceCompactMinHeight = Math.round(48 * resolvedSizeScale);
  const contentMinHeight = Math.round((wide ? 48 : iconOnly ? 42 : 44) * resolvedSizeScale);
  const contentGap = Math.round(6 * resolvedSizeScale);
  const contentHorizontalPadding = Math.round((wide ? 20 : 16) * resolvedSizeScale);
  const contentVerticalPadding = Math.round((wide ? 10 : 8) * resolvedSizeScale);
  const compactLabelFontSize = Math.round(17 * resolvedSizeScale);
  const compactLabelLineHeight = Math.round(19 * resolvedSizeScale);
  const wideLabelFontSize = Math.round(18 * resolvedSizeScale);
  const wideLabelLineHeight = Math.round(20 * resolvedSizeScale);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed, hovered }) => [
        styles.pressable,
        iconOnly ? styles.pressableIconOnly : wide ? styles.pressableWide : styles.pressableCompact,
        iconOnly
          ? {
              width: iconOnlySize,
              minWidth: iconOnlySize,
              height: iconOnlySize,
            }
          : wide
            ? null
            : {
                minWidth: compactMinWidth,
              },
        style,
        hovered && !disabled ? styles.pressableHovered : null,
        pressed && !disabled ? styles.pressablePressed : null,
        disabled ? styles.pressableDisabled : null,
      ]}
    >
      {({ pressed }) => (
        <ImageBackground
          source={iconOnly ? settingsButtonArt : ctaButtonArt}
          resizeMode={iconOnly ? 'contain' : 'stretch'}
          style={[
            styles.surface,
            iconOnly ? styles.surfaceIconOnly : wide ? styles.surfaceWide : styles.surfaceCompact,
            iconOnly
              ? {
                  width: iconOnlySize,
                  minWidth: iconOnlySize,
                  height: iconOnlySize,
                }
              : wide
                ? {
                    minHeight: Math.round(52 * resolvedSizeScale),
                    minWidth: '100%',
                  }
                : {
                    minWidth: surfaceCompactMinWidth,
                    minHeight: surfaceCompactMinHeight,
                  },
            iconOnly
              ? null
              : {
                  minHeight: contentMinHeight,
                  gap: contentGap,
                  paddingHorizontal: contentHorizontalPadding,
                  paddingVertical: contentVerticalPadding,
                },
          ]}
          imageStyle={[
            iconOnly ? styles.surfaceImageIconOnly : styles.surfaceImage,
            SKETCH_BUTTON_IMAGE_SHADOW_STYLE,
            pressed && !disabled ? SKETCH_BUTTON_IMAGE_SHADOW_PRESSED_STYLE : null,
            pressed && !disabled ? styles.surfaceImagePressed : null,
            disabled ? styles.surfaceImageDisabled : null,
          ]}
        >
          {iconName ? (
            <MaterialIcons
              name={iconName}
              size={scaledIconSize}
              color="#FFFFFF"
              style={iconOnly ? styles.iconOnlyGlyph : undefined}
            />
          ) : null}
          {!iconOnly ? (
            <Text
              numberOfLines={1}
              style={[
                styles.label,
                wide ? styles.labelWide : styles.labelCompact,
                {
                  color: '#FFFFFF',
                  fontFamily,
                  fontSize: wide ? wideLabelFontSize : compactLabelFontSize,
                  lineHeight: wide ? wideLabelLineHeight : compactLabelLineHeight,
                },
              ]}
            >
              {label}
            </Text>
          ) : null}
        </ImageBackground>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: {
    alignSelf: 'flex-start',
    ...(Platform.OS === 'web'
      ? {
          cursor: 'pointer',
          transitionDuration: '160ms',
          transitionProperty: 'transform, opacity',
          userSelect: 'none',
          willChange: 'transform',
        }
      : {}),
  },
  pressableCompact: {
    minWidth: 104,
  },
  pressableIconOnly: {
    width: 46,
    minWidth: 46,
    height: 46,
  },
  pressableWide: {
    width: '84%',
    alignSelf: 'center',
  },
  pressableHovered: {
    transform: [{ translateY: -1 }],
  },
  pressablePressed: {
    transform: [{ translateY: 2 }],
  },
  pressableDisabled: {
    opacity: 0.54,
  },
  surface: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  surfaceCompact: {
    minWidth: 116,
    minHeight: 48,
    flexDirection: 'row',
  },
  surfaceIconOnly: {
    width: 46,
    minWidth: 46,
    height: 46,
  },
  surfaceWide: {
    width: '100%',
    minHeight: 52,
    flexDirection: 'row',
  },
  surfaceImage: {
    ...CTA_BUTTON_VISIBLE_IMAGE_STYLE,
  },
  surfaceImageIconOnly: {
    width: '100%',
    height: '100%',
  },
  surfaceImagePressed: {
    opacity: 0.97,
  },
  surfaceImageDisabled: {
    opacity: 0.62,
  },
  label: {
    ...urTextVariants.buttonLabel,
    textAlign: 'center',
    letterSpacing: 0.3,
    textShadowColor: 'rgba(86, 42, 0, 0.42)',
    textShadowOffset: {
      width: 0,
      height: 1,
    },
    textShadowRadius: 1.5,
  },
  labelCompact: {
    fontSize: 17,
    lineHeight: 19,
  },
  labelWide: {
    fontSize: 18,
    lineHeight: 20,
  },
  iconOnlyGlyph: {
    textShadowColor: 'rgba(39, 20, 3, 0.5)',
    textShadowOffset: {
      width: 0,
      height: 1,
    },
    textShadowRadius: 1.5,
  },
});
