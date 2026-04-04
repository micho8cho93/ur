import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

export type EloImpactDirection = 'up' | 'neutral' | 'down';

export const resolveEloImpactDirection = (delta: number): EloImpactDirection => {
  if (delta > 0) {
    return 'up';
  }

  if (delta < 0) {
    return 'down';
  }

  return 'neutral';
};

const DIRECTION_ICON: Record<EloImpactDirection, keyof typeof MaterialIcons.glyphMap> = {
  up: 'arrow-upward',
  neutral: 'remove',
  down: 'arrow-downward',
};

const DIRECTION_COLOR: Record<EloImpactDirection, string> = {
  up: '#57D77B',
  neutral: '#97A2AF',
  down: '#F06A54',
};

const DIRECTION_LABEL: Record<EloImpactDirection, string> = {
  up: 'Elo increased',
  neutral: 'Elo unchanged',
  down: 'Elo decreased',
};

interface EloImpactIndicatorProps {
  delta: number;
  size?: number;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export const EloImpactIndicator: React.FC<EloImpactIndicatorProps> = ({
  delta,
  size = 18,
  style,
  testID,
}) => {
  const direction = resolveEloImpactDirection(delta);

  return (
    <View
      testID={testID}
      accessibilityLabel={DIRECTION_LABEL[direction]}
      style={[styles.wrap, style]}
    >
      <MaterialIcons name={DIRECTION_ICON[direction]} size={size} color={DIRECTION_COLOR[direction]} />
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
