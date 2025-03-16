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
import { colors, typography, borderRadius, spacing } from '../../styles/theme';
import LinearGradient from 'react-native-linear-gradient';
import { useHoverEffect, useGlowHoverEffect } from '../../utils/animationUtils';

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
const NeonButton: React.FC<NeonButtonProps> = ({
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
        background: colors.button.disabled,
        text: colors.text.secondary,
        border: 'transparent',
      };
    }

    switch (type) {
      case 'primary':
        return {
          background: colors.button.primary,
          text: colors.text.primary,
          border: 'transparent',
        };
      case 'secondary':
        return {
          background: colors.button.secondary,
          text: colors.background.primary,
          border: 'transparent',
        };
      case 'outline':
        return {
          background: 'transparent',
          text: colors.button.primary,
          border: colors.button.primary,
        };
      default:
        return {
          background: colors.button.primary,
          text: colors.text.primary,
          border: 'transparent',
        };
    }
  };

  // Determine button padding based on size
  const getButtonPadding = () => {
    switch (size) {
      case 'small':
        return {
          paddingVertical: spacing.xs,
          paddingHorizontal: spacing.md,
        };
      case 'large':
        return {
          paddingVertical: spacing.md,
          paddingHorizontal: spacing.xl,
        };
      case 'medium':
      default:
        return {
          paddingVertical: spacing.sm,
          paddingHorizontal: spacing.lg,
        };
    }
  };

  // Determine text size based on button size
  const getTextSize = () => {
    switch (size) {
      case 'small':
        return typography.fontSize.sm;
      case 'large':
        return typography.fontSize.lg;
      case 'medium':
      default:
        return typography.fontSize.md;
    }
  };

  // Get button colors
  const buttonColors = getButtonColors();
  
  // Get gradient colors based on type or use provided colors
  const getGradientColors = () => {
    if (gradientColors) return gradientColors;
    if (disabled) return [colors.button.disabled, colors.button.disabled];
    
    switch (type) {
      case 'primary':
        return ['#00D4FF', '#00BFFF'];
      case 'secondary':
        return ['#00FF88', '#00CC88'];
      case 'outline':
        return ['transparent', 'transparent'];
      default:
        return ['#00D4FF', '#00BFFF'];
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
              <View style={styles.iconLeft}>{icon}</View>
            )}
            <Text
              style={[
                styles.text,
                {
                  color: buttonColors.text,
                  fontSize: getTextSize(),
                },
                textStyle,
              ]}
            >
              {title}
            </Text>
            {icon && iconPosition === 'right' && (
              <View style={styles.iconRight}>{icon}</View>
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
          style={[styles.buttonWrapper, style]}
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
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  },
  button: {
    borderRadius: borderRadius.md,
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
    fontWeight: '600',
    textAlign: 'center',
  },
  iconLeft: {
    marginRight: spacing.xs,
  },
  iconRight: {
    marginLeft: spacing.xs,
  },
  loader: {
    marginHorizontal: spacing.xs,
  },
});

export default NeonButton;