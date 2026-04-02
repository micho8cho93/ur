import React from 'react';
import { Platform, Pressable, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';

import { urTheme } from '@/constants/urTheme';
import { resolveHomeMagicFontFamily } from '@/src/home/homeTheme';

type HomeActionButtonTone = 'teal' | 'gold' | 'stone' | 'green' | 'ember';
type HomeActionButtonSize = 'regular' | 'small';

type ToneConfig = {
  lip: string;
  face: string;
  border: string;
  gloss: string;
  text: string;
  accent: string;
};

type HomeActionButtonProps = {
  title: string;
  onPress: () => void;
  tone: HomeActionButtonTone;
  size?: HomeActionButtonSize;
  compact?: boolean;
  disabled?: boolean;
  fontLoaded?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
};

type HomeActionInteractionState = {
  pressed: boolean;
  hovered?: boolean;
  focused?: boolean;
};

type HomeActionWebStyle = ViewStyle & {
  cursor?: 'pointer';
  transitionDuration?: string;
  transitionProperty?: string;
  userSelect?: 'none';
  willChange?: string;
};

const TONES: Record<HomeActionButtonTone, ToneConfig> = {
  teal: {
    lip: '#0A7B86',
    face: '#18C7D8',
    border: '#8CF4FB',
    gloss: 'rgba(255, 255, 255, 0.22)',
    text: '#F7FFFF',
    accent: '#3C4FE0',
  },
  gold: {
    lip: '#9D6615',
    face: '#E2B038',
    border: '#FFF2BF',
    gloss: 'rgba(255, 248, 220, 0.24)',
    text: '#FFFFFF',
    accent: '#FFFFFF',
  },
  stone: {
    lip: '#40362D',
    face: '#7E7A70',
    border: '#E4CB8B',
    gloss: 'rgba(255, 255, 255, 0.18)',
    text: '#F8F0DE',
    accent: '#B78C2B',
  },
  green: {
    lip: '#3B8B10',
    face: '#73D300',
    border: '#CCFF79',
    gloss: 'rgba(255, 255, 255, 0.18)',
    text: '#F8FFF0',
    accent: '#5D9317',
  },
  ember: {
    lip: '#7A2D08',
    face: '#D9771B',
    border: '#FFD18A',
    gloss: 'rgba(255, 237, 193, 0.24)',
    text: '#FFF7E8',
    accent: '#A65010',
  },
};

const ACTION_BUTTON_WEB_STYLE: HomeActionWebStyle =
  Platform.select<HomeActionWebStyle>({
    web: {
      cursor: 'pointer',
      transitionDuration: '150ms',
      transitionProperty: 'transform, box-shadow',
      userSelect: 'none',
      willChange: 'transform, box-shadow',
    },
    default: {},
  }) ?? {};

const getActionDefaultShadow = (accent: string) =>
  ({
    boxShadow: [
      {
        color: 'rgba(45, 35, 66, 0.4)',
        offsetX: 0,
        offsetY: 2,
        blurRadius: 4,
        spreadDistance: 0,
      },
      {
        color: 'rgba(45, 35, 66, 0.3)',
        offsetX: 0,
        offsetY: 7,
        blurRadius: 13,
        spreadDistance: -3,
      },
      {
        color: accent,
        offsetX: 0,
        offsetY: -3,
        blurRadius: 0,
        spreadDistance: 0,
        inset: true,
      },
    ],
  }) satisfies ViewStyle;

const getActionHoverShadow = (accent: string) =>
  ({
    boxShadow: [
      {
        color: 'rgba(45, 35, 66, 0.4)',
        offsetX: 0,
        offsetY: 4,
        blurRadius: 8,
        spreadDistance: 0,
      },
      {
        color: 'rgba(45, 35, 66, 0.3)',
        offsetX: 0,
        offsetY: 7,
        blurRadius: 13,
        spreadDistance: -3,
      },
      {
        color: accent,
        offsetX: 0,
        offsetY: -3,
        blurRadius: 0,
        spreadDistance: 0,
        inset: true,
      },
    ],
  }) satisfies ViewStyle;

const getActionActiveShadow = (accent: string) =>
  ({
    boxShadow: [
      {
        color: accent,
        offsetX: 0,
        offsetY: 3,
        blurRadius: 7,
        spreadDistance: 0,
        inset: true,
      },
    ],
  }) satisfies ViewStyle;

const getActionFocusRing = (accent: string) =>
  ({
    boxShadow: [
      {
        color: accent,
        offsetX: 0,
        offsetY: 0,
        blurRadius: 0,
        spreadDistance: 1.5,
        inset: true,
      },
      ...getActionDefaultShadow(accent).boxShadow,
    ],
  }) satisfies ViewStyle;

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

const getBaseInteractionStyle = ({
  pressed,
  hovered,
  focused,
}: HomeActionInteractionState, accent: string): ViewStyle => {
  if (pressed) {
    return getActionActiveShadow(accent);
  }

  if (hovered) {
    return getActionHoverShadow(accent);
  }

  if (focused) {
    return getActionFocusRing(accent);
  }

  return getActionDefaultShadow(accent);
};

export function HomeActionButton({
  title,
  onPress,
  tone,
  size = 'regular',
  compact = false,
  disabled = false,
  fontLoaded = false,
  style,
  accessibilityLabel,
}: HomeActionButtonProps) {
  const palette = TONES[tone];
  const labelFontFamily = resolveHomeMagicFontFamily(fontLoaded);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      disabled={disabled}
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
        !disabled && getPressableInteractionStyle(state),
        disabled && styles.disabled,
        style,
      ]}
    >
      {(state) => (
        <View
          style={[
            styles.base,
            getBaseInteractionStyle(state, palette.accent),
            { backgroundColor: palette.lip },
          ]}
        >
          <View style={[styles.face, { backgroundColor: palette.face, borderColor: palette.border }]}>
            <View style={[styles.gloss, { backgroundColor: palette.gloss }]} />
            <Text
              numberOfLines={1}
              style={[
                styles.label,
                compact ? styles.labelCompact : styles.labelRegular,
                size === 'small' && styles.labelSmall,
                {
                  color: palette.text,
                  fontFamily: labelFontFamily,
                },
              ]}
            >
              {title}
            </Text>
          </View>
        </View>
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
    height: 58,
  },
  compactHeight: {
    height: 52,
  },
  smallHeight: {
    height: 46,
  },
  smallCompactHeight: {
    height: 40,
  },
  base: {
    width: '100%',
    height: '100%',
    borderRadius: 18,
    paddingBottom: 6,
  },
  face: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    paddingHorizontal: urTheme.spacing.md,
  },
  gloss: {
    position: 'absolute',
    top: 0,
    left: 3,
    right: 3,
    height: '58%',
    borderRadius: 15,
  },
  label: {
    textAlign: 'center',
    textShadowColor: 'rgba(57, 30, 12, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
    width: '96%',
  },
  labelRegular: {
    fontSize: 18,
    lineHeight: 20,
    letterSpacing: 0.2,
  },
  labelCompact: {
    fontSize: 14,
    lineHeight: 16,
  },
  labelSmall: {
    fontSize: 12,
    lineHeight: 14,
  },
  pressed: {
    transform: [{ translateY: 2 }],
  },
  hovered: {
    transform: [{ translateY: -2 }],
  },
  disabled: {
    opacity: 0.58,
  },
});
