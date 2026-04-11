import { boxShadow, textShadow } from '@/constants/styleEffects';
import { urTheme } from '@/constants/urTheme';
import type { PlayerColor } from '@/logic/types';
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

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
  const progress = useRef(new Animated.Value(0)).current;
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    const animation = Animated.timing(progress, {
      toValue: 1,
      duration: FLOAT_DURATION_MS,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });

    animation.start(({ finished }) => {
      if (finished) {
        onCompleteRef.current(reaction.id);
      }
    });

    return () => {
      animation.stop();
    };
  }, [progress, reaction.id]);

  const opacity = progress.interpolate({
    inputRange: [0, 0.12, 0.78, 1],
    outputRange: [0, 1, 1, 0],
  });
  const translateY = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -travelDistance],
  });
  const translateX = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, reaction.driftX],
  });
  const scale = progress.interpolate({
    inputRange: [0, 0.18, 1],
    outputRange: [0.76, 1, 1.06],
  });
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
        {
          left: reaction.left,
          bottom: reaction.bottom,
          opacity,
          transform: [{ translateX }, { translateY }, { scale }],
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
