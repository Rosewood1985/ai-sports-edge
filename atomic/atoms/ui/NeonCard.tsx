/**
 * Atomic Atom: Neon Card
 * Card component with neon glow effect using UI theme system
 * Location: /atomic/atoms/ui/NeonCard.tsx
 */
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import {
  View,
  StyleSheet,
  ViewProps,
  StyleProp,
  ViewStyle,
  Platform,
  Animated,
  TouchableWithoutFeedback,
} from 'react-native';

import { useUITheme } from '../../../components/UIThemeProvider';
import { useGlowHoverEffect } from '../../../utils/animationUtils';
import {
  getOptimizedShadow,
  getOptimizedGlowIntensity,
  getResponsiveSpacing,
} from '../../../utils/deviceOptimization';

interface NeonCardProps extends ViewProps {
  borderColor?: string;
  glowColor?: string;
  glowIntensity?: 'none' | 'low' | 'medium' | 'high';
  gradient?: boolean;
  gradientColors?: string[];
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  onPress?: () => void;
  animated?: boolean;
}

/**
 * NeonCard component for displaying content with a neon glow effect
 * @param {NeonCardProps} props - Component props
 * @returns {JSX.Element} - Rendered component
 */
export const NeonCard: React.FC<NeonCardProps> = ({
  borderColor,
  glowColor,
  glowIntensity = 'medium',
  gradient = false,
  gradientColors,
  style,
  contentStyle,
  onPress,
  animated = true,
  children,
  ...rest
}) => {
  const { theme } = useUITheme();

  // Use theme colors if not provided
  const cardBorderColor = borderColor || theme.colors.primary;
  const cardGlowColor = glowColor || theme.colors.primary;
  const defaultGradientColors = gradientColors || [
    theme.colors.primaryBackground,
    theme.colors.surfaceBackground,
  ];

  // Apply glow hover effect if animated is true
  const { glowOpacity, glowRadius, onPressIn, onPressOut } = useGlowHoverEffect(
    glowIntensity === 'none' ? 'low' : glowIntensity,
    glowIntensity === 'none'
      ? 'medium'
      : glowIntensity === 'high'
        ? 'high'
        : glowIntensity === 'medium'
          ? 'high'
          : 'medium'
  );

  // Get shadow style based on glow intensity with device optimization
  const getShadowStyle = () => {
    if (glowIntensity === 'none') return {};

    // If animated is true, use animated values for shadow
    if (animated) {
      return {
        shadowColor: cardGlowColor,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: glowOpacity,
        shadowRadius: glowRadius,
        elevation: Platform.OS === 'android' ? 4 : 0, // Android elevation
      };
    }

    // Otherwise, use static shadow based on intensity
    // Optimize glow intensity based on device performance
    const optimizedIntensity = getOptimizedGlowIntensity(glowIntensity);

    // Base shadow properties
    const shadowProps = {
      shadowColor: cardGlowColor,
      shadowOffset: { width: 0, height: 0 },
      elevation: Platform.OS === 'android' ? 4 : 0, // Android elevation
    };

    // Adjust shadow radius and opacity based on intensity
    let shadowStyle;
    switch (optimizedIntensity) {
      case 'low':
        shadowStyle = {
          ...shadowProps,
          shadowOpacity: 0.3,
          shadowRadius: 3,
        };
        break;
      case 'high':
        shadowStyle = {
          ...shadowProps,
          shadowOpacity: 0.7,
          shadowRadius: 10,
        };
        break;
      case 'medium':
      default:
        shadowStyle = {
          ...shadowProps,
          shadowOpacity: 0.5,
          shadowRadius: 5,
        };
    }

    // Apply device-specific optimizations to shadow
    return getOptimizedShadow(shadowStyle);
  };

  // Render card with or without gradient
  const renderCardContent = () => {
    if (gradient) {
      // Ensure we have at least two colors for the gradient
      const colors: readonly [string, string] =
        Array.isArray(defaultGradientColors) && defaultGradientColors.length >= 2
          ? ([defaultGradientColors[0], defaultGradientColors[1]] as const)
          : ([theme.colors.primaryBackground, theme.colors.surfaceBackground] as const);

      return (
        <LinearGradient
          colors={colors}
          style={[
            styles.gradient,
            { padding: getResponsiveSpacing(theme.spacing.sm) },
            contentStyle,
          ]}
        >
          {children}
        </LinearGradient>
      );
    }

    return (
      <View
        style={[styles.content, { padding: getResponsiveSpacing(theme.spacing.sm) }, contentStyle]}
      >
        {children}
      </View>
    );
  };

  // Render the card with or without touch handling
  const renderCard = () => {
    const cardContent = (
      <Animated.View
        style={[
          styles.container,
          {
            borderColor: cardBorderColor,
            backgroundColor: theme.colors.surfaceBackground,
            borderRadius: theme.borderRadius.md,
            margin: getResponsiveSpacing(theme.spacing.xxs),
          },
          getShadowStyle(),
          style,
        ]}
        {...rest}
      >
        {renderCardContent()}
      </Animated.View>
    );

    // If onPress is provided, wrap in TouchableWithoutFeedback
    if (onPress) {
      return (
        <TouchableWithoutFeedback
          onPress={onPress}
          onPressIn={animated ? onPressIn : undefined}
          onPressOut={animated ? onPressOut : undefined}
        >
          {cardContent}
        </TouchableWithoutFeedback>
      );
    }

    // Otherwise, just return the card
    return cardContent;
  };

  return renderCard();
};

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    overflow: 'hidden',
  },
  content: {
    // padding handled dynamically with theme spacing
  },
  gradient: {
    // padding handled dynamically with theme spacing
  },
});

export default NeonCard;
