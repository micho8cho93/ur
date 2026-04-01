import { boxShadow, textShadow } from '@/constants/styleEffects';
import { urTheme, urTextures, urTypography } from '@/constants/urTheme';
import React from 'react';
import { Animated, Easing, Image, StyleSheet, Text, View } from 'react-native';

export type ScreenTransitionVariant = 'neutral' | 'success' | 'warning';

export type ScreenTransitionRequest = {
  title: string;
  message?: string;
  variant?: ScreenTransitionVariant;
  countdownSeconds?: number;
  preActionDelayMs?: number;
  postActionDelayMs?: number;
  action?: () => void | Promise<void>;
};

type ActiveScreenTransition = {
  title: string;
  message: string | null;
  variant: ScreenTransitionVariant;
  remainingSeconds: number | null;
  visible: boolean;
};

type ScreenTransitionContextValue = {
  isTransitionActive: boolean;
  runTransition: (request: ScreenTransitionRequest) => Promise<boolean>;
};

const DEFAULT_PRE_ACTION_DELAY_MS = 980;
const DEFAULT_POST_ACTION_DELAY_MS = 260;
const HIDE_ANIMATION_DURATION_MS = 260;

const VARIANT_ACCENTS: Record<
  ScreenTransitionVariant,
  {
    accent: string;
    border: string;
    glow: string;
    background: string;
  }
> = {
  neutral: {
    accent: urTheme.colors.lapisBright,
    border: 'rgba(167, 211, 255, 0.84)',
    glow: 'rgba(90, 168, 255, 0.22)',
    background: 'rgba(9, 18, 31, 0.92)',
  },
  success: {
    accent: urTheme.colors.goldBright,
    border: 'rgba(246, 214, 151, 0.86)',
    glow: 'rgba(240, 192, 64, 0.22)',
    background: 'rgba(37, 26, 12, 0.94)',
  },
  warning: {
    accent: urTheme.colors.carnelianBright,
    border: 'rgba(232, 98, 46, 0.86)',
    glow: 'rgba(232, 98, 46, 0.22)',
    background: 'rgba(47, 20, 15, 0.94)',
  },
};

const ScreenTransitionContext = React.createContext<ScreenTransitionContextValue | null>(null);

const buildTransitionState = (request: ScreenTransitionRequest): ActiveScreenTransition => ({
  title: request.title,
  message: request.message ?? null,
  variant: request.variant ?? 'neutral',
  remainingSeconds:
    typeof request.countdownSeconds === 'number' && request.countdownSeconds > 0
      ? Math.ceil(request.countdownSeconds)
      : null,
  visible: true,
});

function ScreenTransitionOverlay({
  transition,
}: {
  transition: ActiveScreenTransition | null;
}) {
  const opacity = React.useRef(new Animated.Value(0)).current;
  const scale = React.useRef(new Animated.Value(0.96)).current;
  const translateY = React.useRef(new Animated.Value(12)).current;

  React.useEffect(() => {
    if (!transition) {
      return;
    }

    const animateIn = transition.visible;
    const animation = Animated.parallel([
      Animated.timing(opacity, {
        toValue: animateIn ? 1 : 0,
        duration: animateIn ? 240 : HIDE_ANIMATION_DURATION_MS,
        easing: animateIn ? Easing.out(Easing.cubic) : Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: animateIn ? 1 : 1.02,
        damping: animateIn ? 16 : 18,
        stiffness: animateIn ? 190 : 160,
        mass: 0.7,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: animateIn ? 0 : -8,
        duration: animateIn ? 260 : HIDE_ANIMATION_DURATION_MS,
        easing: animateIn ? Easing.out(Easing.cubic) : Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
    ]);

    animation.start();

    return () => {
      animation.stop();
    };
  }, [opacity, scale, transition, translateY]);

  if (!transition) {
    return null;
  }

  const accents = VARIANT_ACCENTS[transition.variant];

  return (
    <View
      pointerEvents={transition.visible ? 'auto' : 'none'}
      style={styles.overlay}
      accessibilityViewIsModal
      importantForAccessibility="yes"
    >
      <Animated.View
        style={[
          styles.backdrop,
          {
            opacity,
          },
        ]}
      />
      <Animated.View
        style={[
          styles.shell,
          {
            opacity,
            transform: [{ translateY }, { scale }],
          },
        ]}
      >
        <View style={[styles.glow, { backgroundColor: accents.glow }]} />
        <View
          style={[
            styles.panel,
            {
              borderColor: accents.border,
              backgroundColor: accents.background,
            },
            boxShadow({
              color: accents.accent,
              opacity: 0.24,
              offset: { width: 0, height: 16 },
              blurRadius: 28,
              elevation: 16,
            }),
          ]}
        >
          <Image source={urTextures.goldInlay} resizeMode="repeat" style={styles.texture} />
          <Image source={urTextures.border} resizeMode="repeat" style={styles.borderTexture} />
          <View style={[styles.innerBorder, { borderColor: accents.border }]} />

          {transition.remainingSeconds !== null ? (
            <View style={styles.countdownWrap}>
              <Text
                style={[
                  styles.countdownValue,
                  {
                    color: urTheme.colors.ivory,
                  },
                  textShadow({
                    color: accents.accent,
                    opacity: 0.58,
                    offset: { width: 0, height: 0 },
                    blurRadius: 18,
                  }),
                ]}
              >
                {transition.remainingSeconds}
              </Text>
            </View>
          ) : null}

          <Text
            style={[
              styles.title,
              {
                color: urTheme.colors.ivory,
              },
              textShadow({
                color: accents.accent,
                opacity: 0.5,
                offset: { width: 0, height: 0 },
                blurRadius: 16,
              }),
            ]}
          >
            {transition.title}
          </Text>

          {transition.message ? <Text style={styles.message}>{transition.message}</Text> : null}
        </View>
      </Animated.View>
    </View>
  );
}

export function ScreenTransitionProvider({ children }: React.PropsWithChildren) {
  const [activeTransition, setActiveTransition] = React.useState<ActiveScreenTransition | null>(null);
  const activeRef = React.useRef(false);
  const timeoutRefs = React.useRef<Set<ReturnType<typeof setTimeout>>>(new Set());

  const wait = React.useCallback((durationMs: number) => {
    if (durationMs <= 0) {
      return Promise.resolve();
    }

    return new Promise<void>((resolve) => {
      const timeout = setTimeout(() => {
        timeoutRefs.current.delete(timeout);
        resolve();
      }, durationMs);

      timeoutRefs.current.add(timeout);
    });
  }, []);

  React.useEffect(() => {
    const timeouts = timeoutRefs.current;

    return () => {
      timeouts.forEach((timeout) => clearTimeout(timeout));
      timeouts.clear();
    };
  }, []);

  const runTransition = React.useCallback(
    async (request: ScreenTransitionRequest) => {
      if (activeRef.current) {
        return false;
      }

      activeRef.current = true;
      const normalizedRequest = {
        variant: 'neutral' as ScreenTransitionVariant,
        preActionDelayMs:
          typeof request.countdownSeconds === 'number' && request.countdownSeconds > 0
            ? 0
            : DEFAULT_PRE_ACTION_DELAY_MS,
        postActionDelayMs: DEFAULT_POST_ACTION_DELAY_MS,
        ...request,
      };

      setActiveTransition(buildTransitionState(normalizedRequest));

      let thrownError: unknown = null;

      try {
        if ((normalizedRequest.countdownSeconds ?? 0) > 0) {
          const countdownSeconds = Math.max(1, Math.ceil(normalizedRequest.countdownSeconds ?? 0));
          for (let second = countdownSeconds; second > 0; second -= 1) {
            setActiveTransition((current) =>
              current
                ? {
                    ...current,
                    remainingSeconds: second,
                    visible: true,
                  }
                : current,
            );
            await wait(1_000);
          }
        }

        await wait(normalizedRequest.preActionDelayMs ?? 0);
        await normalizedRequest.action?.();
        await wait(normalizedRequest.postActionDelayMs ?? 0);
      } catch (error) {
        thrownError = error;
      } finally {
        setActiveTransition((current) =>
          current
            ? {
                ...current,
                visible: false,
              }
            : current,
        );
        await wait(HIDE_ANIMATION_DURATION_MS);
        setActiveTransition(null);
        activeRef.current = false;
      }

      if (thrownError) {
        throw thrownError;
      }

      return true;
    },
    [wait],
  );

  const contextValue = React.useMemo<ScreenTransitionContextValue>(
    () => ({
      isTransitionActive: activeTransition !== null,
      runTransition,
    }),
    [activeTransition, runTransition],
  );

  return (
    <ScreenTransitionContext.Provider value={contextValue}>
      {children}
      <ScreenTransitionOverlay transition={activeTransition} />
    </ScreenTransitionContext.Provider>
  );
}

export function useScreenTransition() {
  const context = React.useContext(ScreenTransitionContext);

  if (!context) {
    throw new Error('useScreenTransition must be used within a ScreenTransitionProvider.');
  }

  return context.runTransition;
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 160,
    elevation: 80,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: urTheme.spacing.lg,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(4, 7, 12, 0.82)',
  },
  shell: {
    width: '100%',
    maxWidth: 440,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    position: 'absolute',
    width: '90%',
    height: 170,
    borderRadius: 999,
    opacity: 0.78,
  },
  panel: {
    width: '100%',
    overflow: 'hidden',
    borderRadius: urTheme.radii.lg,
    borderWidth: 1.5,
    paddingHorizontal: urTheme.spacing.lg,
    paddingVertical: urTheme.spacing.lg,
    alignItems: 'center',
    gap: urTheme.spacing.sm,
  },
  texture: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.16,
  },
  borderTexture: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.1,
  },
  innerBorder: {
    ...StyleSheet.absoluteFillObject,
    margin: urTheme.spacing.xs,
    borderRadius: urTheme.radii.md,
    borderWidth: 1,
  },
  countdownWrap: {
    minHeight: 72,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countdownValue: {
    ...urTypography.title,
    fontSize: 58,
    lineHeight: 62,
    fontWeight: '700',
    textAlign: 'center',
  },
  title: {
    ...urTypography.title,
    fontSize: 32,
    lineHeight: 36,
    textAlign: 'center',
  },
  message: {
    color: 'rgba(247, 229, 203, 0.88)',
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
});
