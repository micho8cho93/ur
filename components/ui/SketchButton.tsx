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
  style,
}: SketchButtonProps) {
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
          outerRadius={iconOnly ? 23 : 20}
          innerRadius={iconOnly ? 20 : 17}
          shellStyle={[
            styles.surface,
            iconOnly ? styles.surfaceIconOnly : wide ? styles.surfaceWide : styles.surfaceCompact,
          ]}
          bodyStyle={[
            iconOnly ? styles.surfaceBodyIconOnly : styles.surfaceBody,
            wide ? styles.surfaceBodyWide : null,
          ]}
          contentStyle={[
            iconOnly ? styles.contentIconOnly : styles.content,
            wide ? styles.contentWide : null,
          ]}
        >
          {iconName ? <MaterialIcons name={iconName} size={iconSize} color="#FFFFFF" /> : null}
          {!iconOnly ? (
            <Text
              numberOfLines={1}
              style={[
                styles.label,
                wide ? styles.labelWide : styles.labelCompact,
                {
                  color: '#FFFFFF',
                  fontFamily,
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
