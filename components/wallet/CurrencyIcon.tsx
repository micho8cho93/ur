import React from 'react';
import {
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';

export type CurrencyIconVariant = 'coin' | 'gem';

type CurrencyIconProps = {
  variant: CurrencyIconVariant;
  size?: number;
  style?: StyleProp<ViewStyle>;
};

type CurrencyAmountProps = {
  amount: number;
  variant: CurrencyIconVariant;
  fontFamily?: string;
  iconSize?: number;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  accessibilityLabel?: string;
};

const getCurrencyName = (variant: CurrencyIconVariant) => (variant === 'coin' ? 'coins' : 'gems');

export function CurrencyIcon({ variant, size = 16, style }: CurrencyIconProps) {
  const isCoin = variant === 'coin';

  return (
    <View
      accessible={false}
      importantForAccessibility="no"
      style={[
        styles.iconFrame,
        {
          width: size,
          height: size,
        },
        style,
      ]}
    >
      {isCoin ? (
        <View
          style={[
            styles.coin,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              borderWidth: Math.max(1, size * 0.1),
            },
          ]}
        >
          <View
            style={[
              styles.coinShine,
              {
                width: size * 0.28,
                height: size * 0.18,
                borderRadius: size * 0.08,
                top: size * 0.22,
                left: size * 0.2,
              },
            ]}
          />
        </View>
      ) : (
        <View
          style={[
            styles.gem,
            {
              width: size * 0.74,
              height: size * 0.74,
              borderRadius: size * 0.08,
              borderWidth: Math.max(1, size * 0.08),
            },
          ]}
        >
          <View style={styles.gemFacetTop} />
          <View style={styles.gemFacetBottom} />
        </View>
      )}
    </View>
  );
}

export function CurrencyAmount({
  amount,
  variant,
  fontFamily,
  iconSize = 16,
  style,
  textStyle,
  accessibilityLabel,
}: CurrencyAmountProps) {
  return (
    <View
      accessibilityRole="text"
      accessibilityLabel={accessibilityLabel ?? `${amount.toLocaleString()} ${getCurrencyName(variant)}`}
      style={[styles.amountRow, style]}
    >
      <Text
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.72}
        style={[
          styles.amountText,
          fontFamily ? { fontFamily } : undefined,
          textStyle,
        ]}
      >
        {amount.toLocaleString()}
      </Text>
      <CurrencyIcon variant={variant} size={iconSize} />
    </View>
  );
}

const styles = StyleSheet.create({
  iconFrame: {
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  coin: {
    position: 'relative',
    overflow: 'hidden',
    borderColor: '#FFF2BF',
    backgroundColor: '#E2B038',
    shadowColor: '#6F3B00',
    shadowOpacity: 0.3,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
  },
  coinShine: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 249, 207, 0.74)',
    transform: [{ rotate: '-18deg' }],
  },
  gem: {
    overflow: 'hidden',
    borderColor: '#D9F5FF',
    backgroundColor: '#58B8F8',
    transform: [{ rotate: '45deg' }],
    shadowColor: '#063B67',
    shadowOpacity: 0.3,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
  },
  gemFacetTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '48%',
    backgroundColor: 'rgba(213, 247, 255, 0.58)',
  },
  gemFacetBottom: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: '50%',
    height: '50%',
    backgroundColor: 'rgba(19, 102, 193, 0.36)',
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minWidth: 0,
  },
  amountText: {
    color: '#FFE296',
  },
});
