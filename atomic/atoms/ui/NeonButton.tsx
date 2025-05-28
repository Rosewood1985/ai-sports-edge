/**
 * Atomic Atom: Neon Button
 * Button component with neon glow effect using UI theme system
 * Location: /atomic/atoms/ui/NeonButton.tsx
 */
import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  StyleProp,
  ActivityIndicator,
  View,
  Animated,
} from 'react-native';
import { useUITheme } from '../../../components/UIThemeProvider';
import { LinearGradient } from 'expo-linear-gradient';
import { useHoverEffect, useGlowHoverEffect } from '../../../utils/animationUtils';

interface NeonButtonProps {
  title: string;
  onPress: () => void;
  type?: 'primary' | 'secondary' | 'outline';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  gradientColors?: string[];
}

/**
 * NeonButton component for displaying buttons with a neon glow effect
 * @param {NeonButtonProps} props - Component props
 * @returns {JSX.Element} - Rendered component
 */
export const NeonButton: React.FC<NeonButtonProps> = ({
  title,
  onPress,
  type = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'left',
  style,
  textStyle,
  gradientColors,
}) => {
  const { theme } = useUITheme();
  
  // Apply hover effect animation
  const { animatedStyle, onPressIn, onPressOut } = useHoverEffect(1.05);
  
  // Apply glow hover effect
  const baseIntensity = type === 'primary' ? 'medium' : 'low';
  const hoverIntensity = type === 'primary' ? 'high' : 'medium';
  const { glowOpacity, glowRadius } = useGlowHoverEffect(baseIntensity, hoverIntensity);

  // Determine button colors based on type
  const getButtonColors = () => {
    if (disabled) {
      return {
        background: theme.colors.surfaceBackground,
        text: theme.colors.textSecondary,
        border: 'transparent',
      };
    }

    switch (type) {
      case 'primary':
        return {
          background: theme.colors.primary,
          text: theme.colors.onPrimary,
          border: 'transparent',
        };
      case 'secondary':
        return {
          background: theme.colors.surfaceBackground,
          text: theme.colors.text,
          border: 'transparent',
        };
      case 'outline':
        return {
          background: 'transparent',
          text: theme.colors.primary,
          border: theme.colors.primary,
        };
      default:
        return {
          background: theme.colors.primary,
          text: theme.colors.onPrimary,
          border: 'transparent',
        };
    }
  };

  // Determine button padding based on size
  const getButtonPadding = () => {
    switch (size) {
      case 'small':
        return {
          paddingVertical: theme.spacing.xs,
          paddingHorizontal: theme.spacing.sm,
        };
      case 'large':
        return {
          paddingVertical: theme.spacing.sm,
          paddingHorizontal: theme.spacing.xl,
        };
      case 'medium':
      default:
        return {
          paddingVertical: theme.spacing.xs,
          paddingHorizontal: theme.spacing.md,
        };
    }
  };

  // Determine text size based on button size
  const getTextSize = () => {
    switch (size) {
      case 'small':
        return theme.typography.fontSize.label;
      case 'large':
        return theme.typography.fontSize.bodyLg;
      case 'medium':
      default:
        return theme.typography.fontSize.button;
    }
  };

  // Get button colors
  const buttonColors = getButtonColors();
  
  // Get gradient colors based on type or use provided colors
  const getGradientColors = (): readonly [string, string] => {
    if (gradientColors && gradientColors.length >= 2)
      return [gradientColors[0], gradientColors[1]] as const;
    if (disabled)
      return [theme.colors.surfaceBackground, theme.colors.surfaceBackground] as const;
    
    switch (type) {
      case 'primary':
        return [theme.colors.primary, theme.colors.primary] as const;
      case 'secondary':
        return [theme.colors.surfaceBackground, theme.colors.surfaceBackground] as const;
      case 'outline':
        return ['transparent', 'transparent'] as const;
      default:
        return [theme.colors.primary, theme.colors.primary] as const;
    }
  };

  // Render button content
  const renderContent = () => {
    return (
      <View style={styles.contentContainer}>
        {loading ? (
          <ActivityIndicator
            size="small"
            color={buttonColors.text}
            style={styles.loader}
          />
        ) : (
          <>
            {icon && iconPosition === 'left' && (
              <View style={[styles.iconLeft, { marginRight: theme.spacing.xs }]}>{icon}</View>
            )}
            <Text
              style={[
                styles.text,
                {
                  color: buttonColors.text,
                  fontSize: getTextSize(),
                  fontFamily: theme.typography.fontFamily.body,
                  fontWeight: theme.typography.fontWeight.semiBold as '600',
                },
                textStyle,
              ]}
            >
              {title}
            </Text>
            {icon && iconPosition === 'right' && (
              <View style={[styles.iconRight, { marginLeft: theme.spacing.xs }]}>{icon}</View>
            )}
          </>
        )}
      </View>
    );
  };

  // Render button with or without gradient
  const renderButton = () => {
    // Create animated shadow style
    const animatedShadowStyle = {
      shadowOpacity: glowOpacity,
      shadowRadius: glowRadius,
      shadowColor: buttonColors.background === 'transparent' ? buttonColors.text : buttonColors.background,
      shadowOffset: { width: 0, height: 0 },
      elevation: glowRadius,
    };

    // For outline buttons or when no gradient is needed
    if (type === 'outline' || disabled) {
      return (
        <Animated.View style={[animatedStyle, animatedShadowStyle]}>
          <TouchableOpacity
            style={[
              styles.button,
              getButtonPadding(),
              {
                backgroundColor: buttonColors.background,
                borderColor: buttonColors.border,
                borderWidth: type === 'outline' ? 1 : 0,
                borderRadius: theme.borderRadius.md,
              },
              style,
            ]}
            onPress={onPress}
            onPressIn={onPressIn}
            onPressOut={onPressOut}
            disabled={disabled || loading}
            activeOpacity={0.8}
          >
            {renderContent()}
          </TouchableOpacity>
        </Animated.View>
      );
    }

    // For buttons with gradient background
    return (
      <Animated.View style={[animatedStyle, animatedShadowStyle]}>
        <TouchableOpacity
          onPress={onPress}
          onPressIn={onPressIn}
          onPressOut={onPressOut}
          disabled={disabled || loading}
          activeOpacity={0.8}
          style={[styles.buttonWrapper, { borderRadius: theme.borderRadius.md }, style]}
        >
          <LinearGradient
            colors={getGradientColors()}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.button, getButtonPadding()]}
          >
            {renderContent()}
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return renderButton();
};

const styles = StyleSheet.create({
  buttonWrapper: {
    overflow: 'hidden',
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    textAlign: 'center',
  },
  iconLeft: {
    // marginRight handled dynamically with theme.spacing.xs
  },
  iconRight: {
    // marginLeft handled dynamically with theme.spacing.xs
  },
  loader: {
    // margin handled dynamically with theme.spacing.xs
  },
});

export default NeonButton;