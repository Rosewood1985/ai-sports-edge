/**
 * Atomic Atom: Themed Button
 * Standardized button component using UI theme system
 * Location: /atomic/atoms/ThemedButton.tsx
 */
import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import { useUITheme } from '../../components/UIThemeProvider';

interface ThemedButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function ThemedButton({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  style,
  textStyle,
}: ThemedButtonProps) {
  const { theme } = useUITheme();

  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: theme.colors.primary,
          borderColor: theme.colors.primary,
          borderWidth: 1,
        };
      case 'secondary':
        return {
          backgroundColor: theme.colors.surfaceBackground,
          borderColor: theme.colors.border,
          borderWidth: 1,
        };
      case 'outline':
        return {
          backgroundColor: 'transparent',
          borderColor: theme.colors.primary,
          borderWidth: 1,
        };
      case 'danger':
        return {
          backgroundColor: theme.colors.error,
          borderColor: theme.colors.error,
          borderWidth: 1,
        };
      case 'success':
        return {
          backgroundColor: theme.colors.success,
          borderColor: theme.colors.success,
          borderWidth: 1,
        };
      default:
        return {
          backgroundColor: theme.colors.primary,
          borderColor: theme.colors.primary,
          borderWidth: 1,
        };
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return {
          paddingHorizontal: theme.spacing.sm,
          paddingVertical: theme.spacing.xs,
          borderRadius: theme.borderRadius.sm,
        };
      case 'md':
        return {
          paddingHorizontal: theme.spacing.sm,
          paddingVertical: theme.spacing.sm,
          borderRadius: theme.borderRadius.sm,
        };
      case 'lg':
        return {
          paddingHorizontal: theme.spacing.md,
          paddingVertical: theme.spacing.sm,
          borderRadius: theme.borderRadius.md,
        };
      default:
        return {
          paddingHorizontal: theme.spacing.sm,
          paddingVertical: theme.spacing.sm,
          borderRadius: theme.borderRadius.sm,
        };
    }
  };

  const getTextColor = () => {
    switch (variant) {
      case 'primary':
      case 'danger':
      case 'success':
        return theme.colors.onPrimary;
      case 'secondary':
        return theme.colors.text;
      case 'outline':
        return theme.colors.primary;
      default:
        return theme.colors.onPrimary;
    }
  };

  const getTextSize = () => {
    switch (size) {
      case 'sm':
        return theme.typography.fontSize.label;
      case 'md':
        return theme.typography.fontSize.button;
      case 'lg':
        return theme.typography.fontSize.bodyLg;
      default:
        return theme.typography.fontSize.button;
    }
  };

  const buttonStyle = {
    ...getVariantStyles(),
    ...getSizeStyles(),
    opacity: disabled || loading ? 0.6 : 1,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    flexDirection: 'row' as const,
  };

  const buttonTextStyle = {
    color: getTextColor(),
    fontSize: getTextSize(),
    fontWeight: theme.typography.fontWeight.semiBold as '600',
    fontFamily: theme.typography.fontFamily.body,
    marginLeft: loading ? theme.spacing.xs : 0,
  };

  return (
    <TouchableOpacity
      style={[buttonStyle, style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading && (
        <ActivityIndicator 
          size="small" 
          color={getTextColor()} 
        />
      )}
      <Text style={[buttonTextStyle, textStyle]}>
        {title}
      </Text>
    </TouchableOpacity>
  );
}

export default ThemedButton;