import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';

import { CurrencyAmount } from '@/components/wallet/CurrencyIcon';

type Props = {
  value: number;
  animateFrom?: number;
  variant: 'coin' | 'gem';
  isDesktopLayout: boolean;
  fontFamily?: string;
  delayMs?: number;
  onDone?: () => void;
};

export function AnimatedCurrencyChip({
  value,
  animateFrom,
  variant,
  isDesktopLayout,
  fontFamily,
  delayMs = 0,
  onDone,
}: Props) {
  const hasAnimation = animateFrom !== undefined && animateFrom !== value;
  const delta = hasAnimation ? value - animateFrom! : 0;
  const isIncrease = delta > 0;

  const [displayValue, setDisplayValue] = useState(hasAnimation ? animateFrom! : value);

  const countAnim = useRef(new Animated.Value(hasAnimation ? animateFrom! : value)).current;
  const deltaOpacity = useRef(new Animated.Value(0)).current;
  const deltaTranslateY = useRef(new Animated.Value(0)).current;
  const chipScale = useRef(new Animated.Value(1)).current;

  // Keep latest onDone accessible inside the effect without re-running it
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  // Capture animation config at mount — animation plays once
  const mountConfig = useRef({ hasAnimation, animateFrom, value, delayMs });

  useEffect(() => {
    const { hasAnimation: shouldAnimate, animateFrom: from, value: to, delayMs: delay } = mountConfig.current;
    if (!shouldAnimate || from === undefined) return;

    const timer = setTimeout(() => {
      // Chip scale bounce
      Animated.sequence([
        Animated.spring(chipScale, {
          toValue: 1.1,
          damping: 9,
          stiffness: 320,
          mass: 0.5,
          useNativeDriver: true,
        }),
        Animated.spring(chipScale, {
          toValue: 1,
          damping: 14,
          stiffness: 180,
          mass: 0.9,
          useNativeDriver: true,
        }),
      ]).start();

      // Dramatic count animation (non-native driver — drives JS state)
      const listenerId = countAnim.addListener(({ value: v }) => {
        setDisplayValue(Math.round(v));
      });
      Animated.timing(countAnim, {
        toValue: to,
        duration: 1800,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }).start(({ finished }) => {
        countAnim.removeListener(listenerId);
        if (finished) setDisplayValue(to);
      });

      // Delta badge: appear → hold → float up and fade
      deltaTranslateY.setValue(0);
      deltaOpacity.setValue(0);
      Animated.sequence([
        Animated.timing(deltaOpacity, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.delay(900),
        Animated.parallel([
          Animated.timing(deltaOpacity, {
            toValue: 0,
            duration: 650,
            useNativeDriver: true,
          }),
          Animated.timing(deltaTranslateY, {
            toValue: -32,
            duration: 650,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
        ]),
      ]).start(({ finished }) => {
        if (finished) onDoneRef.current?.();
      });
    }, delay);

    return () => clearTimeout(timer);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const chipHeight = isDesktopLayout ? 34 : 30;
  const isCoin = variant === 'coin';
  const currencyName = isCoin ? 'coins' : 'gems';
  const deltaText = delta > 0 ? `+${delta.toLocaleString()}` : delta.toLocaleString();
  const deltaColor = isIncrease ? '#4ADE80' : '#F87171';

  return (
    <View style={styles.wrapper}>
      <Animated.View
        style={[
          styles.chip,
          isCoin ? styles.coinChip : styles.gemChip,
          isDesktopLayout ? styles.chipDesktop : styles.chipCompact,
          { transform: [{ scale: chipScale }] },
        ]}
      >
        <CurrencyAmount
          amount={displayValue}
          variant={variant}
          fontFamily={fontFamily}
          iconSize={isDesktopLayout ? 17 : 15}
          accessibilityLabel={`${displayValue.toLocaleString()} ${currencyName}`}
          textStyle={[
            styles.chipText,
            isCoin ? styles.coinText : styles.gemText,
            isDesktopLayout ? styles.chipTextDesktop : styles.chipTextCompact,
          ]}
        />
      </Animated.View>

      {hasAnimation && (
        <Animated.View
          style={[
            styles.deltaBadge,
            {
              bottom: chipHeight + 4,
              opacity: deltaOpacity,
              transform: [{ translateY: deltaTranslateY }],
            },
          ]}
          pointerEvents="none"
        >
          <Text
            style={[
              styles.deltaText,
              { color: deltaColor },
              fontFamily ? { fontFamily } : undefined,
            ]}
          >
            {deltaText}
          </Text>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flexShrink: 0,
    position: 'relative',
  },
  chip: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    shadowColor: '#2D1607',
    shadowOpacity: 0.28,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
  coinChip: {
    borderColor: 'rgba(255, 226, 150, 0.62)',
    backgroundColor: 'rgba(67, 37, 15, 0.66)',
  },
  gemChip: {
    borderColor: 'rgba(120, 200, 255, 0.62)',
    backgroundColor: 'rgba(14, 38, 68, 0.72)',
  },
  chipDesktop: {
    minWidth: 76,
    height: 34,
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  chipCompact: {
    minWidth: 68,
    height: 30,
    borderRadius: 8,
    paddingHorizontal: 10,
  },
  chipText: {
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  coinText: {
    color: '#FFE296',
    textShadowColor: 'rgba(72, 31, 10, 0.5)',
  },
  gemText: {
    color: '#82DEFF',
    textShadowColor: 'rgba(10, 40, 90, 0.5)',
  },
  chipTextDesktop: {
    fontSize: 16,
    lineHeight: 19,
  },
  chipTextCompact: {
    fontSize: 14,
    lineHeight: 17,
  },
  deltaBadge: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  deltaText: {
    fontSize: 15,
    fontWeight: '700',
    textShadowColor: 'rgba(0, 0, 0, 0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
});
