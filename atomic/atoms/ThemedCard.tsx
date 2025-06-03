/**
 * Atomic Atom: Themed Card
 * Standardized card component using UI theme system
 * Location: /atomic/atoms/ThemedCard.tsx
 */
import React from 'react';
import { View, TouchableOpacity, ViewStyle } from 'react-native';

import { useUITheme } from '../../components/UIThemeProvider';

interface ThemedCardProps {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'outlined' | 'neon';
  size?: 'sm' | 'md' | 'lg';
  touchable?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
}

export function ThemedCard({
  children,
  variant = 'default',
  size = 'md',
  touchable = false,
  onPress,
  style,
}: ThemedCardProps) {
  const { theme } = useUITheme();

  const getVariantStyles = () => {
    switch (variant) {
      case 'default':
        return {
          backgroundColor: theme.colors.surfaceBackground,
          borderWidth: 0,
        };
      case 'elevated':
        return {
          backgroundColor: theme.colors.surfaceBackground,
          borderWidth: 0,
          ...theme.shadows.medium,
        };
      case 'outlined':
        return {
          backgroundColor: theme.colors.surfaceBackground,
          borderWidth: 1,
          borderColor: theme.colors.border,
        };
      case 'neon':
        return {
          backgroundColor: theme.colors.surfaceBackground,
          borderWidth: 1,
          borderColor: theme.colors.primary,
          shadowColor: theme.colors.primary,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 8,
        };
      default:
        return {
          backgroundColor: theme.colors.surfaceBackground,
          borderWidth: 0,
        };
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return {
          padding: theme.spacing.sm,
          borderRadius: theme.borderRadius.sm,
        };
      case 'md':
        return {
          padding: theme.spacing.sm,
          borderRadius: theme.borderRadius.md,
        };
      case 'lg':
        return {
          padding: theme.spacing.md,
          borderRadius: theme.borderRadius.lg,
        };
      default:
        return {
          padding: theme.spacing.sm,
          borderRadius: theme.borderRadius.md,
        };
    }
  };

  const cardStyle = {
    ...getVariantStyles(),
    ...getSizeStyles(),
  };

  if (touchable && onPress) {
    return (
      <TouchableOpacity style={[cardStyle, style]} onPress={onPress} activeOpacity={0.8}>
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={[cardStyle, style]}>{children}</View>;
}

export default ThemedCard;
