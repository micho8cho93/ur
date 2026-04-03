import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React from 'react';
import {
  Platform,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  ViewStyle,
} from 'react-native';

import { urTextVariants } from '@/constants/urTheme';
import { HOME_GROBOLD_FONT_FAMILY } from '@/src/home/homeTheme';
import { RoyalPrimaryButtonFrame } from '@/components/ui/RoyalPrimaryButtonFrame';

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
  const wideBodyMinHeight = Math.round(48 * resolvedSizeScale);
  const surfaceBodyMinHeight = Math.round((wide ? 48 : iconOnly ? 42 : 44) * resolvedSizeScale);
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
      {({ pressed, hovered, focused }) => (
        <RoyalPrimaryButtonFrame
          pressed={pressed && !disabled}
          hovered={hovered && !disabled}
          focused={focused && !disabled}
          disabled={disabled}
          outerRadius={Math.round((iconOnly ? 23 : 20) * resolvedSizeScale)}
          innerRadius={Math.round((iconOnly ? 20 : 17) * resolvedSizeScale)}
          shellStyle={[
            styles.surface,
            iconOnly ? styles.surfaceIconOnly : wide ? styles.surfaceWide : styles.surfaceCompact,
            iconOnly
              ? {
                  width: iconOnlySize,
                  minWidth: iconOnlySize,
                  minHeight: iconOnlySize,
                }
              : wide
                ? {
                    minHeight: Math.round(52 * resolvedSizeScale),
                  }
                : {
                    minWidth: surfaceCompactMinWidth,
                    minHeight: surfaceCompactMinHeight,
                  },
          ]}
          bodyStyle={[
            iconOnly ? styles.surfaceBodyIconOnly : styles.surfaceBody,
            wide ? styles.surfaceBodyWide : null,
            {
              minHeight: wide ? wideBodyMinHeight : surfaceBodyMinHeight,
            },
          ]}
          contentStyle={[
            iconOnly ? styles.contentIconOnly : styles.content,
            wide ? styles.contentWide : null,
            iconOnly
              ? {
                  minHeight: Math.round(42 * resolvedSizeScale),
                }
              : {
                  minHeight: contentMinHeight,
                  gap: contentGap,
                  paddingHorizontal: contentHorizontalPadding,
                  paddingVertical: contentVerticalPadding,
                },
          ]}
        >
          {iconName ? <MaterialIcons name={iconName} size={scaledIconSize} color="#FFFFFF" /> : null}
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
        </RoyalPrimaryButtonFrame>
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
  },
  surfaceCompact: {
    minWidth: 116,
    minHeight: 48,
  },
  surfaceIconOnly: {
    width: 46,
    minWidth: 46,
    minHeight: 46,
  },
  surfaceBody: {
    minHeight: 44,
  },
  surfaceBodyIconOnly: {
    minHeight: 42,
  },
  surfaceBodyWide: {
    minHeight: 48,
  },
  content: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  contentIconOnly: {
    minHeight: 42,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  contentWide: {
    minHeight: 48,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  surfaceWide: {
    width: '100%',
    minHeight: 52,
  },
  label: {
    ...urTextVariants.buttonLabel,
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  labelCompact: {
    fontSize: 17,
    lineHeight: 19,
  },
  labelWide: {
    fontSize: 18,
    lineHeight: 20,
  },
});
