import { textShadow } from '@/constants/styleEffects';
import { urTypography } from '@/constants/urTheme';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

interface AnimatedScoreValueProps {
  value: number;
  maxValue: number;
  compact?: boolean;
  align?: 'left' | 'right';
  color?: string;
  onScoreIncrease?: () => void;
}

const DESKTOP_DIGIT_HEIGHT = 34;
const MOBILE_DIGIT_HEIGHT = 20;

const buildRollSequence = (from: number, to: number, maxValue: number) => {
  const safeMax = Math.max(0, Math.max(from, to, maxValue));
  const leadInSteps = safeMax >= 4 ? 4 : 3;
  const sequence = [from];
  let cursor = from;

  // Add a short overshoot strip so the score visibly "rolls" before landing.
  for (let step = 0; step < leadInSteps; step += 1) {
    cursor = cursor >= safeMax ? 0 : cursor + 1;
    sequence.push(cursor);
  }

  if (sequence[sequence.length - 1] !== to) {
    sequence.push(to);
  }

  return sequence;
};

export const AnimatedScoreValue: React.FC<AnimatedScoreValueProps> = ({
  value,
  maxValue,
  compact = false,
  align = 'left',
  color = '#F7E9CD',
  onScoreIncrease,
}) => {
  const digitHeight = compact ? MOBILE_DIGIT_HEIGHT : DESKTOP_DIGIT_HEIGHT;
  const [stripValues, setStripValues] = useState<number[]>([value]);
  const previousValueRef = useRef(value);
  const hasMountedRef = useRef(false);
  const isMountedRef = useRef(true);
  const translateY = useSharedValue(0);
  const translateYRef = useRef(translateY);

  const settleStrip = useCallback((nextValue: number) => {
    setStripValues((current) => {
      if (current.length === 1 && current[0] === nextValue) {
        return current;
      }

      return [nextValue];
    });
  }, []);

  const handleRollComplete = useCallback((nextValue: number) => {
    if (!isMountedRef.current) {
      return;
    }

    settleStrip(nextValue);
  }, [settleStrip]);

  useEffect(() => {
    const animationValue = translateYRef.current;

    return () => {
      isMountedRef.current = false;
      cancelAnimation(animationValue);
    };
  }, []);

  useEffect(() => {
    const previousValue = previousValueRef.current;

    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      previousValueRef.current = value;
      return;
    }

    previousValueRef.current = value;
    cancelAnimation(translateYRef.current);
    translateYRef.current.value = 0;

    // Only animate genuine score gains so sync restores and first mount stay calm.
    if (value <= previousValue) {
      settleStrip(value);
      return;
    }

    const nextStripValues = buildRollSequence(previousValue, value, maxValue);
    setStripValues(nextStripValues);
    onScoreIncrease?.();

    translateYRef.current.value = withTiming(
      -(nextStripValues.length - 1) * digitHeight,
      {
        duration: 680,
        easing: Easing.bezier(0.16, 1, 0.3, 1),
      },
      (finished) => {
        if (!finished) {
          return;
        }

        translateYRef.current.value = 0;
        runOnJS(handleRollComplete)(value);
      },
    );
  }, [digitHeight, handleRollComplete, maxValue, onScoreIncrease, settleStrip, value]);

  const stripAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const digitStyles = useMemo(
    () => [
      styles.digit,
      compact ? styles.compactDigit : styles.regularDigit,
      align === 'right' ? styles.rightAlignedDigit : styles.leftAlignedDigit,
      { color },
    ],
    [align, color, compact],
  );

  return (
    <View style={[styles.viewport, { height: digitHeight }]}>
      <Animated.View style={[styles.strip, align === 'right' ? styles.rightAlignedStrip : styles.leftAlignedStrip, stripAnimatedStyle]}>
        {stripValues.map((entry, index) => (
          <Text key={`${entry}-${index}`} style={digitStyles}>
            {entry}
          </Text>
        ))}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  viewport: {
    minWidth: 24,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  strip: {
    justifyContent: 'flex-start',
  },
  leftAlignedStrip: {
    alignItems: 'flex-start',
  },
  rightAlignedStrip: {
    alignItems: 'flex-end',
  },
  digit: {
    ...urTypography.title,
    color: '#F7E9CD',
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
    ...textShadow({
      color: '#040302',
      offset: { width: 0, height: 1 },
      blurRadius: 2,
    }),
  },
  regularDigit: {
    minWidth: 24,
    fontSize: 30,
    lineHeight: DESKTOP_DIGIT_HEIGHT,
    letterSpacing: 0.3,
  },
  compactDigit: {
    minWidth: 16,
    fontSize: 18,
    lineHeight: MOBILE_DIGIT_HEIGHT,
    letterSpacing: 0.2,
  },
  leftAlignedDigit: {
    textAlign: 'left',
  },
  rightAlignedDigit: {
    textAlign: 'right',
  },
});
