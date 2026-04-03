import React from 'react';
import {
  ActivityIndicator,
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
import { RoyalPrimaryButtonFrame } from '@/components/ui/RoyalPrimaryButtonFrame';

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
  loading?: boolean;
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
    lip: '#1D5F72',
    face: '#2D9CDB',
    border: '#BCEBFF',
    gloss: 'rgba(224, 247, 255, 0.28)',
    text: urTheme.colors.ivory,
    accent: 'rgba(45, 156, 219, 0.86)',
  },
  gold: {
    lip: '#A86D12',
    face: urTheme.colors.gold,
    border: urTheme.colors.goldBright,
    gloss: 'rgba(255, 245, 197, 0.38)',
    text: urTheme.colors.ivory,
    accent: 'rgba(255, 226, 122, 0.72)',
  },
  stone: {
    lip: '#6A4822',
    face: '#C59450',
    border: '#F4D58E',
    gloss: 'rgba(255, 243, 196, 0.24)',
    text: urTheme.colors.cedar,
    accent: 'rgba(244, 197, 66, 0.62)',
  },
  green: {
    lip: '#537622',
    face: '#7FBF3E',
    border: '#D9F2AA',
    gloss: 'rgba(246, 255, 224, 0.24)',
    text: urTheme.colors.ivory,
    accent: 'rgba(181, 226, 103, 0.72)',
  },
  ember: {
    lip: '#8A3D13',
    face: urTheme.colors.ember,
    border: '#FFD18A',
    gloss: 'rgba(255, 234, 196, 0.28)',
    text: urTheme.colors.ivory,
    accent: 'rgba(255, 190, 106, 0.72)',
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
        color: 'rgba(59, 38, 15, 0.38)',
        offsetX: 0,
        offsetY: 4,
        blurRadius: 6,
        spreadDistance: 0,
      },
      {
        color: 'rgba(59, 38, 15, 0.24)',
        offsetX: 0,
        offsetY: 10,
        blurRadius: 14,
        spreadDistance: -4,
      },
      {
        color: accent,
        offsetX: 0,
        offsetY: -2,
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
        color: 'rgba(59, 38, 15, 0.34)',
        offsetX: 0,
        offsetY: 6,
        blurRadius: 10,
        spreadDistance: 0,
      },
      {
        color: 'rgba(59, 38, 15, 0.22)',
        offsetX: 0,
        offsetY: 12,
        blurRadius: 16,
        spreadDistance: -4,
      },
      {
        color: accent,
        offsetX: 0,
        offsetY: -2,
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
        offsetY: 2,
        blurRadius: 6,
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
  loading = false,
  fontLoaded = false,
  style,
  accessibilityLabel,
}: HomeActionButtonProps) {
  const isDisabled = disabled || loading;
  const isRoyalTone = tone === 'gold';
  const palette = isDisabled
    ? {
        lip: '#6B5A43',
        face: '#9D8A6E',
        border: 'rgba(255, 226, 122, 0.28)',
        gloss: 'rgba(255, 248, 226, 0.16)',
        text: 'rgba(255, 243, 196, 0.72)',
        accent: 'rgba(255, 226, 122, 0.18)',
      }
    : TONES[tone];
  const labelFontFamily = resolveHomeButtonFontFamily(fontLoaded);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
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
        !isDisabled && getPressableInteractionStyle(state),
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {(state) => {
        if (isRoyalTone) {
          return (
            <RoyalPrimaryButtonFrame
              pressed={state.pressed && !isDisabled}
              hovered={state.hovered && !isDisabled}
              focused={state.focused && !isDisabled}
              disabled={isDisabled}
              outerRadius={20}
              innerRadius={18}
              shellStyle={styles.baseRoyal}
              bodyStyle={styles.faceRoyal}
              contentStyle={styles.royalContent}
            >
              <Text
                numberOfLines={1}
                style={[
                  styles.label,
                  loading && styles.labelHidden,
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
              {loading ? (
                <View style={styles.loadingOverlay}>
                  <ActivityIndicator size="small" color={palette.text} />
                  <Text
                    numberOfLines={1}
                    style={[
                      styles.label,
                      styles.loadingLabel,
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
              ) : null}
            </RoyalPrimaryButtonFrame>
          );
        }

        return (
          <View
            style={[
              styles.base,
              !isDisabled ? getBaseInteractionStyle(state, palette.accent) : styles.baseDisabled,
              { backgroundColor: palette.lip },
            ]}
          >
            <View style={[styles.face, { backgroundColor: palette.face, borderColor: palette.border }]}>
              <View style={[styles.gloss, { backgroundColor: palette.gloss }]} />
              <View style={styles.glossBottom} />
              <Text
                numberOfLines={1}
                style={[
                  styles.label,
                  loading && styles.labelHidden,
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
              {loading ? (
                <View style={styles.loadingOverlay}>
                  <ActivityIndicator size="small" color={palette.text} />
                  <Text
                    numberOfLines={1}
                    style={[
                      styles.label,
                      styles.loadingLabel,
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
              ) : null}
            </View>
          </View>
        );
      }}
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
  base: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
    paddingBottom: 7,
  },
  baseRoyal: {
    width: '100%',
    height: '100%',
  },
  baseDisabled: {
    ...Platform.select<ViewStyle>({
      web: {
        boxShadow: [
          {
            color: 'rgba(59, 38, 15, 0.12)',
            offsetX: 0,
            offsetY: 5,
            blurRadius: 8,
            spreadDistance: -3,
          },
        ],
      },
      default: {},
    }),
  },
  face: {
    flex: 1,
    borderRadius: 18,
    borderWidth: 1.8,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    paddingHorizontal: urTheme.spacing.lg,
  },
  faceRoyal: {
    flex: 1,
    minHeight: 0,
  },
  gloss: {
    position: 'absolute',
    top: 0,
    left: 4,
    right: 4,
    height: '48%',
    borderRadius: 17,
  },
  glossBottom: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '40%',
    backgroundColor: 'rgba(59, 38, 15, 0.12)',
  },
  label: {
    ...urTextVariants.buttonLabel,
    textAlign: 'center',
    width: '96%',
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
  royalContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: urTheme.spacing.lg,
  },
  loadingLabel: {
    width: 'auto',
  },
  labelHidden: {
    opacity: 0,
  },
  pressed: {
    transform: [{ translateY: 3 }],
  },
  hovered: {
    transform: [{ translateY: -2 }],
  },
  disabled: {
    opacity: 0.58,
  },
});
