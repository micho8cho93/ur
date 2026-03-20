import { boxShadow, textShadow } from '@/constants/styleEffects';
import { urTheme, urTextures, urTypography } from '@/constants/urTheme';
import React from 'react';
import { Animated, Easing, Image, StyleSheet, Text, View } from 'react-native';

export interface MatchMomentIndicatorCue {
  id: number;
  message: string;
  accent: string;
  border: string;
  glow: string;
  background: string;
  durationMs?: number;
}

interface MatchMomentIndicatorProps {
  cue: MatchMomentIndicatorCue | null;
  fontFamily?: string;
  supplementaryText?: string | null;
  onHidden: (cueId: number) => void;
}

export function MatchMomentIndicator({ cue, fontFamily, supplementaryText, onHidden }: MatchMomentIndicatorProps) {
  const opacity = React.useRef(new Animated.Value(0)).current;
  const translateY = React.useRef(new Animated.Value(18)).current;
  const scale = React.useRef(new Animated.Value(0.94)).current;

  React.useEffect(() => {
    if (!cue) {
      return;
    }

    opacity.setValue(0);
    translateY.setValue(18);
    scale.setValue(0.94);

    const reveal = Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 220,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        damping: 13,
        stiffness: 170,
        mass: 0.7,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 260,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]);

    const hide = Animated.parallel([
      Animated.timing(opacity, {
        toValue: 0,
        duration: 420,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 1.04,
        duration: 420,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: -12,
        duration: 420,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
    ]);

    const sequence = Animated.sequence([
      reveal,
      Animated.delay(cue.durationMs ?? 1100),
      hide,
    ]);

    sequence.start(({ finished }) => {
      if (finished) {
        onHidden(cue.id);
      }
    });

    return () => {
      sequence.stop();
    };
  }, [cue, onHidden, opacity, scale, translateY]);

  if (!cue) {
    return null;
  }

  const resolvedFontFamily = fontFamily ?? urTypography.title.fontFamily;

  return (
    <View pointerEvents="none" style={styles.overlay}>
      <Animated.View
        style={[
          styles.shell,
          {
            opacity,
            transform: [{ translateY }, { scale }],
          },
        ]}
      >
        <View style={[styles.glow, { backgroundColor: cue.glow }]} />
        <View
          style={[
            styles.plaque,
            {
              borderColor: cue.border,
              backgroundColor: cue.background,
            },
            boxShadow({
              color: cue.accent,
              opacity: 0.26,
              offset: { width: 0, height: 16 },
              blurRadius: 28,
              elevation: 16,
            }),
          ]}
        >
          <Image source={urTextures.goldInlay} resizeMode="repeat" style={styles.texture} />
          <Image source={urTextures.rosette} resizeMode="repeat" style={styles.rosetteTexture} />
          <View style={[styles.innerBorder, { borderColor: cue.border }]} />

          <View style={styles.ruleRow}>
            <View style={[styles.rule, { backgroundColor: cue.border }]} />
            <View style={[styles.ruleGem, { borderColor: cue.border, backgroundColor: cue.glow }]} />
            <View style={[styles.rule, { backgroundColor: cue.border }]} />
          </View>

          <Text
            adjustsFontSizeToFit
            minimumFontScale={0.72}
            numberOfLines={2}
            style={[
              styles.message,
              {
                color: urTheme.colors.ivory,
                fontFamily: resolvedFontFamily,
              },
              textShadow({
                color: cue.accent,
                opacity: 0.5,
                offset: { width: 0, height: 0 },
                blurRadius: 18,
              }),
            ]}
          >
            {cue.message}
          </Text>

          <View style={styles.ruleRow}>
            <View style={[styles.rule, { backgroundColor: cue.border }]} />
            <View style={[styles.ruleGem, { borderColor: cue.border, backgroundColor: cue.glow }]} />
            <View style={[styles.rule, { backgroundColor: cue.border }]} />
          </View>
        </View>
        {supplementaryText ? (
          <View style={styles.supplementaryRow}>
            <Text
              numberOfLines={1}
              style={[
                styles.supplementaryText,
                {
                  color: urTheme.colors.ivory,
                  fontFamily: resolvedFontFamily,
                },
              ]}
            >
              {supplementaryText}
            </Text>
          </View>
        ) : null}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 60,
    elevation: 30,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: urTheme.spacing.lg,
  },
  shell: {
    width: '100%',
    maxWidth: 460,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    position: 'absolute',
    width: '88%',
    height: 132,
    borderRadius: 999,
    opacity: 0.82,
  },
  plaque: {
    width: '100%',
    overflow: 'hidden',
    borderRadius: urTheme.radii.lg,
    borderWidth: 1.6,
    paddingHorizontal: urTheme.spacing.lg,
    paddingVertical: urTheme.spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: urTheme.spacing.sm,
  },
  texture: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.16,
  },
  rosetteTexture: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.08,
  },
  innerBorder: {
    ...StyleSheet.absoluteFillObject,
    margin: urTheme.spacing.xs,
    borderRadius: urTheme.radii.md,
    borderWidth: 1,
    opacity: 0.48,
  },
  ruleRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: urTheme.spacing.sm,
  },
  rule: {
    flex: 1,
    height: 1.5,
    opacity: 0.78,
  },
  ruleGem: {
    width: 14,
    height: 14,
    borderRadius: 999,
    borderWidth: 1.1,
    opacity: 0.92,
  },
  message: {
    ...urTypography.title,
    width: '100%',
    fontSize: 34,
    lineHeight: 40,
    letterSpacing: 1.3,
    textAlign: 'center',
  },
  supplementaryRow: {
    width: '100%',
    marginTop: urTheme.spacing.xs,
    paddingLeft: urTheme.spacing.lg,
    alignItems: 'flex-start',
  },
  supplementaryText: {
    ...urTypography.title,
    fontSize: 34,
    lineHeight: 38,
    letterSpacing: 0.8,
    textAlign: 'left',
  },
});
