import React from 'react';
import {
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import Svg, {
  Defs,
  Ellipse,
  LinearGradient,
  Rect,
  Stop,
} from 'react-native-svg';

import { urRoyalButtonColors } from '@/constants/urTheme';

type RoyalPrimaryButtonFrameProps = {
  children: React.ReactNode;
  pressed: boolean;
  hovered?: boolean;
  focused?: boolean;
  disabled?: boolean;
  shellStyle?: StyleProp<ViewStyle>;
  bodyStyle?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  outerRadius?: number;
  innerRadius?: number;
};

const ROYAL_CONTACT_SHADOW = {
  color: 'rgba(31, 18, 8, 0.54)',
  offsetX: 0,
  offsetY: 4,
  blurRadius: 1,
  spreadDistance: 0,
};

const ROYAL_LIFT_SHADOW = {
  color: 'rgba(31, 18, 8, 0.3)',
  offsetX: 0,
  offsetY: 12,
  blurRadius: 18,
  spreadDistance: -4,
};

const ROYAL_HOVER_CONTACT_SHADOW = {
  color: 'rgba(31, 18, 8, 0.56)',
  offsetX: 0,
  offsetY: 5,
  blurRadius: 2,
  spreadDistance: 0,
};

const ROYAL_HOVER_LIFT_SHADOW = {
  color: 'rgba(31, 18, 8, 0.34)',
  offsetX: 0,
  offsetY: 14,
  blurRadius: 20,
  spreadDistance: -4,
};

const ROYAL_PRESSED_CONTACT_SHADOW = {
  color: 'rgba(31, 18, 8, 0.36)',
  offsetX: 0,
  offsetY: 2,
  blurRadius: 1,
  spreadDistance: 0,
};

const ROYAL_PRESSED_LIFT_SHADOW = {
  color: 'rgba(31, 18, 8, 0.18)',
  offsetX: 0,
  offsetY: 5,
  blurRadius: 10,
  spreadDistance: -3,
};

const ROYAL_DISABLED_SHADOW = {
  boxShadow: [
    {
      color: 'rgba(31, 18, 8, 0.18)',
      offsetX: 0,
      offsetY: 4,
      blurRadius: 8,
      spreadDistance: -3,
    },
  ],
  transform: [{ translateY: 0 }],
} satisfies ViewStyle;

const ROYAL_RAISED_SHADOW = {
  boxShadow: [ROYAL_CONTACT_SHADOW, ROYAL_LIFT_SHADOW],
  transform: [{ translateY: 0 }],
} satisfies ViewStyle;

const ROYAL_HOVER_SHADOW = {
  boxShadow: [ROYAL_HOVER_CONTACT_SHADOW, ROYAL_HOVER_LIFT_SHADOW],
  transform: [{ translateY: -1 }],
} satisfies ViewStyle;

const ROYAL_PRESSED_SHADOW = {
  boxShadow: [ROYAL_PRESSED_CONTACT_SHADOW, ROYAL_PRESSED_LIFT_SHADOW],
  transform: [{ translateY: 3 }],
} satisfies ViewStyle;

const getRoyalFocusShadow = () =>
  ({
    boxShadow: [
      {
        color: urRoyalButtonColors.focusGlow,
        offsetX: 0,
        offsetY: 0,
        blurRadius: 0,
        spreadDistance: 2,
      },
      ROYAL_CONTACT_SHADOW,
      ROYAL_LIFT_SHADOW,
    ],
    transform: [{ translateY: 0 }],
  }) satisfies ViewStyle;

const getShellInteractionStyle = ({
  pressed,
  hovered,
  focused,
  disabled,
}: Pick<RoyalPrimaryButtonFrameProps, 'pressed' | 'hovered' | 'focused' | 'disabled'>): ViewStyle => {
  if (disabled) {
    return ROYAL_DISABLED_SHADOW;
  }

  if (pressed) {
    return ROYAL_PRESSED_SHADOW;
  }

  if (hovered) {
    return ROYAL_HOVER_SHADOW;
  }

  if (focused) {
    return getRoyalFocusShadow();
  }

  return ROYAL_RAISED_SHADOW;
};

export function RoyalPrimaryButtonFrame({
  children,
  pressed,
  hovered = false,
  focused = false,
  disabled = false,
  shellStyle,
  bodyStyle,
  contentStyle,
  outerRadius = 20,
  innerRadius = 17,
}: RoyalPrimaryButtonFrameProps) {
  const gradientPrefix = React.useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const bodyGradientId = `${gradientPrefix}-body`;
  const topCapGradientId = `${gradientPrefix}-cap`;
  const glossGradientId = `${gradientPrefix}-gloss`;
  const faceHighlightGradientId = `${gradientPrefix}-face-highlight`;
  const seamGradientId = `${gradientPrefix}-seam`;
  const lipGradientId = `${gradientPrefix}-lip`;

  return (
    <View
      style={[
        styles.shell,
        {
          borderRadius: outerRadius,
          backgroundColor: urRoyalButtonColors.outerStroke,
        },
        getShellInteractionStyle({ pressed, hovered, focused, disabled }),
        shellStyle,
      ]}
    >
      <View
        style={[
          styles.body,
          {
            borderRadius: innerRadius,
            backgroundColor: urRoyalButtonColors.mainFace,
          },
          bodyStyle,
        ]}
      >
        <Svg pointerEvents="none" style={styles.paint} width="100%" height="100%" preserveAspectRatio="none">
          <Defs>
            <LinearGradient id={bodyGradientId} x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor={urRoyalButtonColors.mainFace} />
              <Stop offset="36%" stopColor={urRoyalButtonColors.faceMid} />
              <Stop offset="74%" stopColor={urRoyalButtonColors.midDepth} />
              <Stop offset="100%" stopColor={urRoyalButtonColors.faceBase} />
            </LinearGradient>
            <LinearGradient id={topCapGradientId} x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor={urRoyalButtonColors.topHighlight} />
              <Stop offset="100%" stopColor={urRoyalButtonColors.topHighlightFade} />
            </LinearGradient>
            <LinearGradient id={glossGradientId} x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor={urRoyalButtonColors.capGloss} />
              <Stop offset="100%" stopColor={urRoyalButtonColors.capGlossFade} />
            </LinearGradient>
            <LinearGradient id={faceHighlightGradientId} x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor={urRoyalButtonColors.faceHighlight} />
              <Stop offset="100%" stopColor={urRoyalButtonColors.faceHighlightFade} />
            </LinearGradient>
            <LinearGradient id={seamGradientId} x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor={urRoyalButtonColors.seamShadowFade} />
              <Stop offset="58%" stopColor={urRoyalButtonColors.seamShadow} />
              <Stop offset="100%" stopColor={urRoyalButtonColors.seamShadowFade} />
            </LinearGradient>
            <LinearGradient id={lipGradientId} x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor={pressed ? urRoyalButtonColors.bottomLip : urRoyalButtonColors.midDepth} />
              <Stop offset="45%" stopColor={urRoyalButtonColors.bottomLip} />
              <Stop offset="100%" stopColor={pressed ? urRoyalButtonColors.bottomLipBase : urRoyalButtonColors.bottomLipBase} />
            </LinearGradient>
          </Defs>

          <Rect x="0" y="0" width="100%" height="100%" fill={`url(#${bodyGradientId})`} />
          <Rect
            x="0"
            y={pressed ? '1.5%' : '0%'}
            width="100%"
            height={pressed ? '20.5%' : '22.5%'}
            fill={`url(#${topCapGradientId})`}
          />
          <Rect
            x="14%"
            y={pressed ? '7.5%' : '5.5%'}
            width="72%"
            height={pressed ? '10.5%' : '12%'}
            rx="999"
            fill={`url(#${glossGradientId})`}
          />
          <Rect
            x="0"
            y={pressed ? '14%' : '12%'}
            width="100%"
            height={pressed ? '22%' : '24%'}
            fill={`url(#${faceHighlightGradientId})`}
          />
          <Ellipse
            cx="50%"
            cy={pressed ? '24%' : '22%'}
            rx="28%"
            ry="10%"
            fill={urRoyalButtonColors.faceGlow}
          />
          <Rect x="0" y="70%" width="100%" height="16%" fill={`url(#${seamGradientId})`} />
          <Rect x="0" y="84%" width="100%" height="16%" fill={`url(#${lipGradientId})`} />
          <Rect x="16%" y="84.5%" width="68%" height="1.2%" rx="999" fill={urRoyalButtonColors.lipHighlight} />
          <Rect x="0" y="94%" width="100%" height="6%" fill={urRoyalButtonColors.lipShade} />
        </Svg>
        <View
          pointerEvents="none"
          style={[
            styles.innerStroke,
            {
              borderRadius: Math.max(innerRadius - 1, 0),
            },
          ]}
        />
        {pressed ? <View pointerEvents="none" style={styles.pressedWash} /> : null}
        {disabled ? <View pointerEvents="none" style={styles.disabledWash} /> : null}
        <View style={[styles.content, contentStyle]}>{children}</View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    padding: 2,
    overflow: 'visible',
  },
  body: {
    flex: 1,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  paint: {
    ...StyleSheet.absoluteFillObject,
  },
  innerStroke: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 1,
    borderColor: urRoyalButtonColors.innerHighlight,
    opacity: 0.92,
  },
  pressedWash: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: urRoyalButtonColors.pressedWash,
  },
  disabledWash: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: urRoyalButtonColors.disabledWash,
  },
  content: {
    flex: 1,
    zIndex: 1,
  },
});
