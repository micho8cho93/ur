import {
  urButtonPalettes,
  urTextVariants,
  urTheme,
} from '@/constants/urTheme';
import { boxShadow } from '@/constants/styleEffects';
import { RoyalPrimaryButtonFrame } from '@/components/ui/RoyalPrimaryButtonFrame';
import { HOME_GROBOLD_FONT_FAMILY } from '@/src/home/homeTheme';
import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  PressableProps,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';

interface ButtonProps extends Omit<PressableProps, 'style'> {
  title: string;
  variant?: 'primary' | 'secondary' | 'outline';
  loading?: boolean;
  className?: string;
  labelStyle?: StyleProp<TextStyle>;
  style?: StyleProp<ViewStyle>;
}

type VariantStyle = {
  lip: string;
  face: string;
  faceLowlight: string;
  border: string;
  gloss: string;
  sheen: string;
  textColor: string;
  spinnerColor: string;
};

const variants: Record<'primary' | 'secondary' | 'outline', VariantStyle> = {
  primary: {
    ...urButtonPalettes.primary,
    textColor: urButtonPalettes.primary.text,
    spinnerColor: urButtonPalettes.primary.text,
  },
  secondary: {
    ...urButtonPalettes.secondary,
    textColor: urButtonPalettes.secondary.text,
    spinnerColor: urButtonPalettes.secondary.text,
  },
  outline: {
    ...urButtonPalettes.outline,
    textColor: urButtonPalettes.outline.text,
    spinnerColor: urButtonPalettes.outline.text,
  },
};

const disabledPalette: VariantStyle = {
  ...urButtonPalettes.disabled,
  textColor: urButtonPalettes.disabled.text,
  spinnerColor: urButtonPalettes.disabled.text,
};

export const Button: React.FC<ButtonProps> = ({
  title,
  variant = 'primary',
  loading = false,
  disabled,
  style,
  className,
  labelStyle,
  onFocus,
  onBlur,
  ...props
}) => {
  const isDisabled = Boolean(disabled || loading);
  const [isFocused, setIsFocused] = React.useState(false);

  return (
    <Pressable
      {...props}
      className={className}
      accessibilityRole="button"
      disabled={isDisabled}
      onFocus={(event) => {
        setIsFocused(true);
        onFocus?.(event);
      }}
      onBlur={(event) => {
        setIsFocused(false);
        onBlur?.(event);
      }}
      style={({ pressed }) => [
        styles.pressable,
        style,
        pressed && !isDisabled ? styles.pressablePressed : null,
      ]}
    >
      {({ pressed, hovered }) => {
        const palette = isDisabled ? disabledPalette : variants[variant];
        const isRoyalPrimary = variant === 'primary';

        if (isRoyalPrimary) {
          return (
            <RoyalPrimaryButtonFrame
              pressed={pressed && !isDisabled}
              hovered={hovered && !isDisabled}
              focused={isFocused && !isDisabled}
              disabled={isDisabled}
              outerRadius={20}
              innerRadius={17}
              shellStyle={styles.shellRoyal}
              bodyStyle={styles.faceRoyal}
              contentStyle={styles.contentRoyal}
            >
              {loading ? (
                <View style={styles.loadingContent}>
                  <ActivityIndicator color={palette.spinnerColor} />
                  <Text
                    style={[
                      styles.label,
                      styles.loadingLabel,
                      { color: palette.textColor },
                      labelStyle,
                    ]}
                  >
                    {title}
                  </Text>
                </View>
              ) : (
                <Text style={[styles.label, { color: palette.textColor }, labelStyle]}>
                  {title}
                </Text>
              )}
            </RoyalPrimaryButtonFrame>
          );
        }

        return (
          <View
            style={[
              styles.shell,
              pressed && !isDisabled ? styles.shellPressed : styles.shellRaised,
              hovered && !isDisabled ? styles.shellHovered : null,
              { backgroundColor: palette.lip },
            ]}
          >
            <View
              style={[
                styles.face,
                pressed && !isDisabled ? styles.facePressed : null,
                {
                  backgroundColor: palette.face,
                  borderColor: palette.border,
                },
              ]}
            >
              <View style={[styles.glossOverlay, { backgroundColor: palette.gloss }]} />
              <View style={[styles.sheenOverlay, { backgroundColor: palette.sheen }]} />
              <View style={[styles.lowlightOverlay, { backgroundColor: palette.faceLowlight }]} />

              {loading ? (
                <View style={styles.loadingContent}>
                  <ActivityIndicator color={palette.spinnerColor} />
                  <Text
                    style={[
                      styles.label,
                      styles.loadingLabel,
                      { color: palette.textColor },
                      labelStyle,
                    ]}
                  >
                    {title}
                  </Text>
                </View>
              ) : (
                <Text style={[styles.label, { color: palette.textColor }, labelStyle]}>
                  {title}
                </Text>
              )}
            </View>
          </View>
        );
      }}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  pressable: {
    minHeight: 54,
    borderRadius: urTheme.radii.pill,
  },
  pressablePressed: {
    transform: [{ translateY: 1 }],
  },
  shell: {
    minHeight: 54,
    borderRadius: urTheme.radii.pill,
    paddingBottom: 6,
  },
  shellRoyal: {
    minHeight: 60,
  },
  shellRaised: {
    ...boxShadow({
      color: urTheme.colors.deepShadow,
      opacity: 0.32,
      offset: { width: 0, height: 8 },
      blurRadius: 12,
      elevation: 7,
    }),
  },
  shellHovered: {
    ...boxShadow({
      color: urTheme.colors.deepShadow,
      opacity: 0.28,
      offset: { width: 0, height: 10 },
      blurRadius: 14,
      elevation: 8,
    }),
  },
  shellPressed: {
    paddingBottom: 3,
    ...boxShadow({
      color: urTheme.colors.deepShadow,
      opacity: 0.18,
      offset: { width: 0, height: 4 },
      blurRadius: 8,
      elevation: 3,
    }),
  },
  face: {
    minHeight: 48,
    borderRadius: urTheme.radii.pill,
    paddingHorizontal: urTheme.spacing.lg,
    paddingVertical: urTheme.spacing.sm + 2,
    borderWidth: 1.8,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  faceRoyal: {
    minHeight: 54,
  },
  facePressed: {
    transform: [{ translateY: 1 }],
  },
  glossOverlay: {
    position: 'absolute',
    top: 0,
    left: 5,
    right: 5,
    height: '46%',
    borderRadius: urTheme.radii.pill,
  },
  sheenOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '42%',
    bottom: '16%',
  },
  lowlightOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '42%',
  },
  label: {
    ...urTextVariants.buttonLabel,
    fontFamily: HOME_GROBOLD_FONT_FAMILY,
    fontSize: 14,
    lineHeight: 16,
  },
  loadingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: urTheme.spacing.xs,
  },
  contentRoyal: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: urTheme.spacing.lg,
    paddingVertical: urTheme.spacing.sm + 4,
  },
  loadingLabel: {
    width: 'auto',
  },
});
