import { urTheme, urTypography } from '@/constants/urTheme';
import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, TouchableOpacityProps, ViewStyle } from 'react-native';

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'outline';
  loading?: boolean;
  className?: string;
}

type VariantStyle = {
  button: ViewStyle;
  textColor: string;
  spinnerColor: string;
};

const variants: Record<'primary' | 'secondary' | 'outline', VariantStyle> = {
  primary: {
    button: {
      backgroundColor: urTheme.colors.lapis,
      borderColor: 'rgba(170, 208, 255, 0.5)',
      borderWidth: 1.2,
    },
    textColor: urTheme.colors.ivory,
    spinnerColor: urTheme.colors.ivory,
  },
  secondary: {
    button: {
      backgroundColor: urTheme.colors.gold,
      borderColor: 'rgba(85, 52, 24, 0.32)',
      borderWidth: 1,
    },
    textColor: '#2E1C0F',
    spinnerColor: '#2E1C0F',
  },
  outline: {
    button: {
      backgroundColor: 'rgba(13, 15, 18, 0.3)',
      borderColor: 'rgba(217, 164, 65, 0.85)',
      borderWidth: 1.3,
    },
    textColor: urTheme.colors.parchment,
    spinnerColor: urTheme.colors.parchment,
  },
};

export const Button: React.FC<ButtonProps> = ({
  title,
  variant = 'primary',
  loading = false,
  disabled,
  style,
  className,
  ...props
}) => {
  const config = variants[variant];
  const isDisabled = Boolean(disabled || loading);

  return (
    <TouchableOpacity
      {...props}
      className={className}
      disabled={isDisabled}
      activeOpacity={0.86}
      style={[
        styles.base,
        config.button,
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={config.spinnerColor} />
      ) : (
        <Text style={[styles.label, { color: config.textColor }]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    minHeight: 50,
    borderRadius: urTheme.radii.md,
    paddingHorizontal: urTheme.spacing.md,
    paddingVertical: urTheme.spacing.sm + 2,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.2,
    shadowRadius: 7,
    elevation: 5,
  },
  label: {
    ...urTypography.label,
    fontSize: 14,
  },
  disabled: {
    opacity: 0.52,
    shadowOpacity: 0.08,
    elevation: 1,
  },
});
