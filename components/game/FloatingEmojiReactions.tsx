import { boxShadow, textShadow } from '@/constants/styleEffects';
import { urTheme } from '@/constants/urTheme';
import type { PlayerColor } from '@/logic/types';
import React, { useCallback, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

const FLOAT_DURATION_MS = 2_500;

export interface FloatingEmojiReactionItem {
  id: string;
  emoji: string;
  senderColor: PlayerColor;
  left: number;
  bottom: number;
  driftX: number;
}

interface FloatingEmojiReactionsProps {
  onComplete: (id: string) => void;
  reactions: readonly FloatingEmojiReactionItem[];
}

function FloatingEmojiReactionBubble({
  onComplete,
  reaction,
  travelDistance,
}: {
  onComplete: (id: string) => void;
  reaction: FloatingEmojiReactionItem;
  travelDistance: number;
}) {
  const progress = useSharedValue(0);
  const onCompleteRef = useRef(onComplete);
  const completeReaction = useCallback((id: string) => {
    onCompleteRef.current(id);
  }, []);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    cancelAnimation(progress);
    progress.value = 0;
    progress.value = withTiming(
      1,
      {
        duration: FLOAT_DURATION_MS,
        easing: Easing.out(Easing.cubic),
      },
      (finished) => {
        if (!finished) {
          return;
        }
        runOnJS(completeReaction)(reaction.id);
      },
    );

    return () => {
      cancelAnimation(progress);
    };
  }, [completeReaction, progress, reaction.id]);

  const bubbleStyle = useAnimatedStyle(() => {
    const opacity = interpolate(progress.value, [0, 0.12, 0.78, 1], [0, 1, 1, 0]);
    const translateY = interpolate(progress.value, [0, 1], [0, -travelDistance]);
    const translateX = interpolate(progress.value, [0, 1], [0, reaction.driftX]);
    const scale = interpolate(progress.value, [0, 0.18, 1], [0.76, 1, 1.06]);

    return {
      opacity,
      transform: [{ translateX }, { translateY }, { scale }],
    };
  }, [reaction.driftX, travelDistance]);

  const accent =
    reaction.senderColor === 'light'
      ? {
          backgroundColor: 'rgba(120, 34, 14, 0.92)',
          borderColor: 'rgba(240, 192, 64, 0.72)',
        }
      : {
          backgroundColor: 'rgba(18, 32, 58, 0.92)',
          borderColor: 'rgba(132, 188, 255, 0.74)',
        };

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.bubble,
        accent,
        bubbleStyle,
        {
          left: reaction.left,
          bottom: reaction.bottom,
        },
      ]}
    >
      <Text style={styles.emoji}>{reaction.emoji}</Text>
    </Animated.View>
  );
}

export function FloatingEmojiReactions({
  onComplete,
  reactions,
}: FloatingEmojiReactionsProps) {
  const { height: windowHeight } = useWindowDimensions();
  const [overlayHeight, setOverlayHeight] = React.useState(0);

  if (reactions.length === 0) {
    return null;
  }

  const travelDistance = Math.round((overlayHeight || windowHeight) * 0.8);

  return (
    <View
      pointerEvents="none"
      style={styles.overlay}
      onLayout={(event) => {
        const nextHeight = Math.round(event.nativeEvent.layout.height);
        setOverlayHeight((current) => (current === nextHeight ? current : nextHeight));
      }}
    >
      {reactions.map((reaction) => (
        <FloatingEmojiReactionBubble
          key={reaction.id}
          onComplete={onComplete}
          reaction={reaction}
          travelDistance={travelDistance}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 7,
  },
  bubble: {
    position: 'absolute',
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.2,
    ...boxShadow({
      color: '#000',
      opacity: 0.18,
      offset: { width: 0, height: 6 },
      blurRadius: 12,
      elevation: 8,
    }),
  },
  emoji: {
    fontSize: 26,
    lineHeight: 30,
    textAlign: 'center',
    ...textShadow({
      color: 'rgba(0, 0, 0, 0.32)',
      offset: { width: 0, height: 1 },
      blurRadius: 1,
    }),
    color: urTheme.colors.ivory,
  },
});
