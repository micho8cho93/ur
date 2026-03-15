import { urTheme, urTypography } from '@/constants/urTheme';
import { HourglassTimer } from '@/components/timer/HourglassTimer';
import { useFonts } from 'expo-font';
import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

const MATCH_CUE_FONT_FAMILY = 'CinzelDecorativeBold';

interface GameStageHUDProps {
  isMyTurn: boolean;
  canRoll: boolean;
  phase: 'rolling' | 'moving' | 'ended';
  compact?: boolean;
  layout?: 'stacked' | 'inline';
  timerDurationMs?: number;
  timerRemainingMs?: number;
  timerProgress?: number;
  timerIsRunning?: boolean;
  timerKey?: number | string;
  timerWarningThreshold?: number;
  timerSize?: number;
  countdownFontSize?: number;
  countdownLineHeight?: number;
}

export const GameStageHUD: React.FC<GameStageHUDProps> = ({
  compact = false,
  layout = 'stacked',
  timerDurationMs,
  timerRemainingMs,
  timerProgress,
  timerIsRunning = true,
  timerKey,
  timerWarningThreshold,
  timerSize,
  countdownFontSize,
  countdownLineHeight,
}) => {
  const [ancientFontLoaded] = useFonts({
    [MATCH_CUE_FONT_FAMILY]: require('../../assets/fonts/CinzelDecorative-Bold.ttf'),
  });
  const [localElapsedMs, setLocalElapsedMs] = useState(0);
  const isInline = layout === 'inline';

  useEffect(() => {
    setLocalElapsedMs(0);

    if (!timerDurationMs || !timerIsRunning || typeof timerRemainingMs === 'number' || typeof timerProgress === 'number') {
      return;
    }

    const startedAt = Date.now();
    const intervalId = setInterval(() => {
      setLocalElapsedMs(Math.min(Date.now() - startedAt, timerDurationMs));
    }, 200);

    return () => {
      clearInterval(intervalId);
    };
  }, [timerDurationMs, timerIsRunning, timerKey, timerProgress, timerRemainingMs]);

  const resolvedRemainingMs = useMemo(() => {
    if (!timerDurationMs) {
      return null;
    }

    if (typeof timerRemainingMs === 'number') {
      return Math.max(0, timerRemainingMs);
    }

    if (typeof timerProgress === 'number') {
      return Math.max(0, Math.round(timerDurationMs * (1 - timerProgress)));
    }

    return Math.max(0, timerDurationMs - localElapsedMs);
  }, [localElapsedMs, timerDurationMs, timerProgress, timerRemainingMs]);

  const countdownSeconds = resolvedRemainingMs === null ? null : Math.max(0, Math.ceil(resolvedRemainingMs / 1000));
  const countdownFontFamily = ancientFontLoaded ? MATCH_CUE_FONT_FAMILY : urTypography.title.fontFamily;
  const resolvedTimerSize = timerSize ?? (compact ? (isInline ? 30 : 34) : 40);
  const resolvedInlineCountdownLineHeight = countdownLineHeight ?? resolvedTimerSize;
  const resolvedInlineCountdownFontSize = countdownFontSize ?? Math.max(26, resolvedInlineCountdownLineHeight - 2);
  const inlineCountdownTextStyle = isInline
    ? {
      color: urTheme.colors.ivory,
      fontSize: resolvedInlineCountdownFontSize,
      lineHeight: resolvedInlineCountdownLineHeight,
    }
    : null;

  return (
    <View style={[styles.wrap, compact && styles.compactWrap, isInline && styles.inlineWrap]}>
      {timerDurationMs ? (
        <View
          style={[
            styles.timerWrap,
            compact ? styles.compactTimerWrap : styles.regularTimerWrap,
            isInline && styles.inlineTimerWrap,
          ]}
        >
          <View style={[styles.timerStack, isInline && styles.inlineTimerStack]}>
            <HourglassTimer
              key={timerKey}
              durationMs={timerDurationMs}
              remainingMs={resolvedRemainingMs ?? undefined}
              progress={timerProgress}
              isRunning={timerIsRunning}
              warningThreshold={timerWarningThreshold}
              size={resolvedTimerSize}
            />
            {countdownSeconds !== null ? (
              <Text
                style={[
                  styles.timerCountdown,
                  compact && styles.compactTimerCountdown,
                  isInline && styles.inlineTimerCountdown,
                  inlineCountdownTextStyle,
                  { fontFamily: countdownFontFamily },
                ]}
              >
                {countdownSeconds}s
              </Text>
            ) : null}
          </View>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    alignItems: 'flex-start',
  },
  compactWrap: {
    alignItems: 'flex-start',
  },
  inlineWrap: {
    width: 'auto',
    alignItems: 'center',
  },
  timerWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    paddingHorizontal: 0,
  },
  regularTimerWrap: {
    paddingVertical: urTheme.spacing.sm,
  },
  compactTimerWrap: {
    paddingVertical: urTheme.spacing.xs,
  },
  inlineTimerWrap: {
    paddingVertical: 0,
  },
  timerStack: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: urTheme.spacing.xs,
  },
  inlineTimerStack: {
    justifyContent: 'center',
  },
  timerCountdown: {
    ...urTypography.title,
    color: urTheme.colors.parchment,
    fontSize: 21,
    lineHeight: 24,
    letterSpacing: 0.7,
    minWidth: 34,
    textAlign: 'left',
  },
  compactTimerCountdown: {
    fontSize: 18,
    lineHeight: 20,
    minWidth: 30,
  },
  inlineTimerCountdown: {
    minWidth: 0,
    textAlign: 'center',
  },
});
