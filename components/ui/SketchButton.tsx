import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React from 'react';
import { Platform, Pressable, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';

const SKETCH_BUTTON_ROTATION = '-1.2deg';
const SKETCH_BUTTON_BACKGROUND = '#B9B4AC';
const SKETCH_BUTTON_BORDER = '#5A5148';
const SKETCH_BUTTON_TEXT = '#3D362F';
const SKETCH_BUTTON_LINE = 'rgba(74, 66, 58, 0.18)';

type SketchButtonProps = {
  label: string;
  accessibilityLabel: string;
  onPress: () => void;
  iconName?: React.ComponentProps<typeof MaterialIcons>['name'];
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
  wide = false,
  disabled = false,
  fontFamily,
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
        styles.sketchButton,
        wide ? styles.sketchButtonWide : styles.sketchButtonCompact,
        style,
        hovered && !disabled && styles.sketchButtonHovered,
        pressed && !disabled && styles.sketchButtonPressed,
        disabled && styles.sketchButtonDisabled,
      ]}
    >
      <View pointerEvents="none" style={styles.sketchLineTopLeft} />
      <View pointerEvents="none" style={styles.sketchLineTopRight} />
      <View pointerEvents="none" style={styles.sketchLineBottomLeft} />
      <View pointerEvents="none" style={styles.sketchLineBottomRight} />
      {iconName ? <MaterialIcons name={iconName} size={18} color={SKETCH_BUTTON_TEXT} /> : null}
      <Text
        numberOfLines={1}
        style={[
          styles.sketchButtonLabel,
          wide ? styles.sketchButtonLabelWide : styles.sketchButtonLabelCompact,
          fontFamily ? { fontFamily } : null,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  sketchButton: {
    minHeight: 38,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 2,
    borderColor: SKETCH_BUTTON_BORDER,
    backgroundColor: SKETCH_BUTTON_BACKGROUND,
    alignSelf: 'flex-start',
    borderTopLeftRadius: 26,
    borderTopRightRadius: 20,
    borderBottomRightRadius: 28,
    borderBottomLeftRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    position: 'relative',
    transform: [{ rotate: SKETCH_BUTTON_ROTATION }],
    ...(Platform.OS === 'web'
      ? {
          cursor: 'pointer',
          transitionDuration: '235ms',
          transitionProperty: 'transform, box-shadow, opacity',
          userSelect: 'none',
          willChange: 'transform, box-shadow, opacity',
          borderTopLeftRadius: '255px 15px',
          borderTopRightRadius: '15px 225px',
          borderBottomRightRadius: '225px 15px',
          borderBottomLeftRadius: '15px 255px',
          boxShadow: [
            {
              color: 'rgba(0, 0, 0, 0.2)',
              offsetX: 15,
              offsetY: 28,
              blurRadius: 25,
              spreadDistance: -18,
            },
          ],
        }
      : {}),
  },
  sketchButtonCompact: {
    minWidth: 92,
  },
  sketchButtonWide: {
    width: '84%',
    minHeight: 42,
    paddingHorizontal: 16,
    paddingVertical: 9,
    alignSelf: 'center',
    marginTop: -2,
  },
  sketchButtonHovered: {
    transform: [{ rotate: SKETCH_BUTTON_ROTATION }, { translateY: 2 }],
    ...(Platform.OS === 'web'
      ? {
          boxShadow: [
            {
              color: 'rgba(0, 0, 0, 0.3)',
              offsetX: 2,
              offsetY: 8,
              blurRadius: 8,
              spreadDistance: -5,
            },
          ],
        }
      : {}),
  },
  sketchButtonPressed: {
    transform: [{ rotate: SKETCH_BUTTON_ROTATION }, { translateY: 3 }],
    ...(Platform.OS === 'web'
      ? {
          boxShadow: [
            {
              color: 'rgba(0, 0, 0, 0.22)',
              offsetX: 1,
              offsetY: 5,
              blurRadius: 5,
              spreadDistance: -5,
            },
          ],
        }
      : {}),
  },
  sketchButtonDisabled: {
    opacity: 0.62,
  },
  sketchButtonLabel: {
    color: SKETCH_BUTTON_TEXT,
    textAlign: 'center',
    zIndex: 1,
  },
  sketchButtonLabelCompact: {
    fontSize: 16,
    lineHeight: 18,
  },
  sketchButtonLabelWide: {
    fontSize: 18,
    lineHeight: 20,
  },
  sketchLineTopLeft: {
    position: 'absolute',
    top: 7,
    left: 14,
    width: 18,
    height: 1.5,
    borderRadius: 999,
    backgroundColor: SKETCH_BUTTON_LINE,
    transform: [{ rotate: '-5deg' }],
  },
  sketchLineTopRight: {
    position: 'absolute',
    top: 8,
    right: 16,
    width: 22,
    height: 1.5,
    borderRadius: 999,
    backgroundColor: SKETCH_BUTTON_LINE,
    transform: [{ rotate: '4deg' }],
  },
  sketchLineBottomLeft: {
    position: 'absolute',
    bottom: 8,
    left: 12,
    width: 20,
    height: 1.5,
    borderRadius: 999,
    backgroundColor: SKETCH_BUTTON_LINE,
    transform: [{ rotate: '3deg' }],
  },
  sketchLineBottomRight: {
    position: 'absolute',
    right: 14,
    bottom: 7,
    width: 16,
    height: 1.5,
    borderRadius: 999,
    backgroundColor: SKETCH_BUTTON_LINE,
    transform: [{ rotate: '-6deg' }],
  },
});
