import React from 'react';
import {
  ActivityIndicator,
  ImageBackground,
  ImageStyle,
  Platform,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';

import { urTheme, urTextVariants } from '@/constants/urTheme';
import { resolveHomeButtonFontFamily } from '@/src/home/homeTheme';

const lightButtonArt = require('../../assets/buttons/button_light.png');
const BUTTON_LIGHT_VISIBLE_ASPECT_RATIO = 1130 / 384;
const BUTTON_LIGHT_VISIBLE_WIDTH_PERCENT = `${(1536 / 1130) * 100}%`;
const BUTTON_LIGHT_VISIBLE_HEIGHT_PERCENT = `${(1024 / 384) * 100}%`;
const BUTTON_LIGHT_VISIBLE_LEFT_PERCENT = `${(-206 / 1130) * 100}%`;
const BUTTON_LIGHT_VISIBLE_TOP_PERCENT = `${(-305 / 384) * 100}%`;

type HomeLightButtonSize = 'regular' | 'compact' | 'small';

type HomeLightButtonProps = {
  label: string;
  onPress: () => void;
  accessibilityLabel?: string;
  disabled?: boolean;
  loading?: boolean;
  fontLoaded?: boolean;
  size?: HomeLightButtonSize;
  style?: StyleProp<ViewStyle>;
};

type HomeLightButtonInteractionState = {
  pressed: boolean;
  hovered?: boolean;
  focused?: boolean;
};

type HomeLightButtonWebStyle = ViewStyle & {
  cursor?: 'pointer';
  transitionDuration?: string;
  transitionProperty?: string;
  userSelect?: 'none';
  willChange?: string;
};

type HomeLightButtonImageWebStyle = ImageStyle & {
  filter?: string;
  willChange?: string;
};

const HOME_LIGHT_BUTTON_WEB_STYLE: HomeLightButtonWebStyle =
  Platform.select<HomeLightButtonWebStyle>({
    web: {
      cursor: 'pointer',
      transitionDuration: '160ms',
      transitionProperty: 'transform, opacity',
      userSelect: 'none',
      willChange: 'transform',
    },
    default: {},
  }) ?? {};

const HOME_LIGHT_BUTTON_IMAGE_SHADOW_STYLE =
  Platform.select<HomeLightButtonImageWebStyle>({
    web: {
      filter:
        'drop-shadow(0px 2px 0px rgba(54, 64, 74, 0.82)) drop-shadow(0px 8px 10px rgba(19, 24, 29, 0.34))',
      willChange: 'filter, opacity',
    },
    default: {},
  }) ?? {};

const HOME_LIGHT_BUTTON_IMAGE_SHADOW_PRESSED_STYLE =
  Platform.select<HomeLightButtonImageWebStyle>({
    web: {
      filter:
        'drop-shadow(0px 1px 0px rgba(54, 64, 74, 0.68)) drop-shadow(0px 4px 6px rgba(19, 24, 29, 0.2))',
    },
    default: {},
  }) ?? {};

const HOME_LIGHT_BUTTON_DEFAULT_STYLE = {} satisfies ViewStyle;

const HOME_LIGHT_BUTTON_HOVER_STYLE = {
  transform: [{ translateY: -1 }],
} satisfies ViewStyle;

const HOME_LIGHT_BUTTON_FOCUS_STYLE = {} satisfies ViewStyle;

const HOME_LIGHT_BUTTON_ACTIVE_STYLE = {
  transform: [{ translateY: 2 }],
} satisfies ViewStyle;

const getInteractionStyle = ({
  pressed,
  hovered,
  focused,
}: HomeLightButtonInteractionState): ViewStyle => {
  if (pressed) {
    return HOME_LIGHT_BUTTON_ACTIVE_STYLE;
  }

  if (hovered) {
    return HOME_LIGHT_BUTTON_HOVER_STYLE;
  }

  if (focused) {
    return HOME_LIGHT_BUTTON_FOCUS_STYLE;
  }

  return HOME_LIGHT_BUTTON_DEFAULT_STYLE;
};

export function HomeLightButton({
  label,
  onPress,
  accessibilityLabel,
  disabled = false,
  loading = false,
  fontLoaded = false,
  size = 'regular',
  style,
}: HomeLightButtonProps) {
  const isDisabled = disabled || loading;
  const labelFontFamily = resolveHomeButtonFontFamily(fontLoaded);
  const buttonCornerRadius = size === 'small' ? 14 : size === 'compact' ? 16 : 18;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: isDisabled }}
      disabled={isDisabled}
      onPress={onPress}
      style={(state) => [
        styles.pressable,
        HOME_LIGHT_BUTTON_WEB_STYLE,
        getInteractionStyle(state),
        { borderRadius: buttonCornerRadius },
        isDisabled ? styles.pressableDisabled : null,
        style,
      ]}
    >
      {({ pressed }) => (
        <ImageBackground
          source={lightButtonArt}
          resizeMode="stretch"
          style={[
            styles.image,
            {
              borderRadius: buttonCornerRadius,
            },
          ]}
          imageStyle={[
            styles.imageStyle,
            {
              borderRadius: buttonCornerRadius,
            },
            HOME_LIGHT_BUTTON_IMAGE_SHADOW_STYLE,
            pressed ? HOME_LIGHT_BUTTON_IMAGE_SHADOW_PRESSED_STYLE : null,
            pressed ? styles.imageStylePressed : null,
            isDisabled ? styles.imageStyleDisabled : null,
          ]}
        >
          <Text
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.82}
            style={[
              styles.label,
              size === 'regular'
                ? styles.labelRegular
                : size === 'compact'
                  ? styles.labelCompact
                  : styles.labelSmall,
              { fontFamily: labelFontFamily },
              loading ? styles.labelHidden : null,
            ]}
          >
            {label}
          </Text>

          {loading ? (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="small" color={urTheme.colors.ivory} />
              <Text
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.82}
                style={[
                  styles.label,
                  styles.loadingLabel,
                  size === 'regular'
                    ? styles.labelRegular
                    : size === 'compact'
                      ? styles.labelCompact
                      : styles.labelSmall,
                  { fontFamily: labelFontFamily },
                ]}
              >
                {label}
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
    aspectRatio: BUTTON_LIGHT_VISIBLE_ASPECT_RATIO,
    alignSelf: 'center',
    position: 'relative',
    overflow: 'visible',
  },
  pressableDisabled: {
    opacity: 0.62,
  },
  image: {
    width: '100%',
    height: '100%',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  imageStyle: {
    width: BUTTON_LIGHT_VISIBLE_WIDTH_PERCENT,
    height: BUTTON_LIGHT_VISIBLE_HEIGHT_PERCENT,
    left: BUTTON_LIGHT_VISIBLE_LEFT_PERCENT,
    top: BUTTON_LIGHT_VISIBLE_TOP_PERCENT,
  },
  imageStylePressed: {
    opacity: 0.96,
  },
  imageStyleDisabled: {
    opacity: 0.6,
  },
  label: {
    ...urTextVariants.buttonLabel,
    color: urTheme.colors.ivory,
    textAlign: 'center',
    zIndex: 1,
    width: '92%',
  },
  labelRegular: {
    fontSize: 16,
    lineHeight: 18,
  },
  labelCompact: {
    fontSize: 15,
    lineHeight: 17,
  },
  labelSmall: {
    fontSize: 13,
    lineHeight: 15,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 16,
  },
  loadingLabel: {
    width: 'auto',
    maxWidth: '74%',
  },
  labelHidden: {
    opacity: 0,
  },
});
