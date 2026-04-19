import React from 'react';
import {
  Animated,
  ImageBackground,
  ImageSourcePropType,
  ImageStyle,
  Platform,
  Pressable,
  StyleProp,
  StyleSheet,
  ViewStyle,
} from 'react-native';

type PressablePanelCardProps = {
  accessibilityLabel: string;
  children: React.ReactNode;
  disabled?: boolean;
  dimmed?: boolean;
  imageStyle?: StyleProp<ImageStyle>;
  onPress: () => void;
  panelStyle?: StyleProp<ViewStyle>;
  source: ImageSourcePropType;
  style?: StyleProp<ViewStyle>;
};

export function PressablePanelCard({
  accessibilityLabel,
  children,
  disabled = false,
  dimmed,
  imageStyle,
  onPress,
  panelStyle,
  source,
  style,
}: PressablePanelCardProps) {
  const pressProgress = React.useRef(new Animated.Value(0)).current;
  const [isHovered, setIsHovered] = React.useState(false);
  const [isPressed, setIsPressed] = React.useState(false);
  const shouldDim = dimmed ?? disabled;

  const animateTo = React.useCallback(
    (toValue: number) => {
      Animated.spring(pressProgress, {
        toValue,
        friction: toValue >= 1 ? 18 : 14,
        tension: toValue >= 1 ? 260 : 170,
        useNativeDriver: true,
      }).start();
    },
    [pressProgress]
  );

  React.useEffect(() => {
    const nextProgress = disabled ? 0 : isPressed ? 1 : isHovered ? 0.34 : 0;
    animateTo(nextProgress);
  }, [animateTo, disabled, isHovered, isPressed]);

  const translateY = React.useMemo(
    () =>
      pressProgress.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 12],
      }),
    [pressProgress]
  );
  const scaleX = React.useMemo(
    () =>
      pressProgress.interpolate({
        inputRange: [0, 1],
        outputRange: [1, 0.986],
      }),
    [pressProgress]
  );
  const scaleY = React.useMemo(
    () =>
      pressProgress.interpolate({
        inputRange: [0, 1],
        outputRange: [1, 0.968],
      }),
    [pressProgress]
  );
  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      onHoverIn={() => setIsHovered(true)}
      onHoverOut={() => setIsHovered(false)}
      onPressIn={() => setIsPressed(true)}
      onPressOut={() => setIsPressed(false)}
      style={() => [
        styles.pressable,
        style,
        shouldDim && styles.pressableDimmed,
      ]}
    >
      <Animated.View
        style={[
          styles.surface,
          {
            transform: [{ translateY }, { scaleX }, { scaleY }],
          },
        ]}
      >
        <ImageBackground source={source} resizeMode="stretch" style={[styles.panel, panelStyle]} imageStyle={imageStyle}>
          {children}
        </ImageBackground>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: {
    width: '100%',
    position: 'relative',
    overflow: 'visible',
    ...(Platform.OS === 'web'
      ? {
          cursor: 'pointer',
          userSelect: 'none',
        }
      : {}),
  },
  pressableDimmed: {
    opacity: 0.68,
  },
  surface: {
    width: '100%',
  },
  panel: {
    width: '100%',
    overflow: 'visible',
  },
});
