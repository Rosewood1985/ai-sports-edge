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
import { colors, borderRadius, spacing, shadows } from '../../styles/theme';
import LinearGradient from 'react-native-linear-gradient';
import {
  getOptimizedShadow,
  getOptimizedGlowIntensity,
  getResponsiveSpacing
} from '../../utils/deviceOptimization';
import { useGlowHoverEffect } from '../../utils/animationUtils';

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
const NeonCard: React.FC<NeonCardProps> = ({
  borderColor = colors.neon.blue,
  glowColor = colors.neon.blue,
  glowIntensity = 'medium',
  gradient = false,
  gradientColors = ['#121212', '#1A1A1A'],
  style,
  contentStyle,
  onPress,
  animated = true,
  children,
  ...rest
}) => {
  // Apply glow hover effect if animated is true
  const { glowOpacity, glowRadius, onPressIn, onPressOut } = useGlowHoverEffect(
    glowIntensity === 'none' ? 'low' : glowIntensity,
    glowIntensity === 'none' ? 'medium' : glowIntensity === 'high' ? 'high' : glowIntensity === 'medium' ? 'high' : 'medium'
  );
  // Get shadow style based on glow intensity with device optimization
  const getShadowStyle = () => {
    if (glowIntensity === 'none') return {};

    // If animated is true, use animated values for shadow
    if (animated) {
      return {
        shadowColor: glowColor,
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
      shadowColor: glowColor,
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
      return (
        <LinearGradient
          colors={gradientColors}
          style={[styles.gradient, contentStyle]}
        >
          {children}
        </LinearGradient>
      );
    }

    return (
      <View style={[styles.content, contentStyle]}>
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
            borderColor,
            backgroundColor: colors.background.secondary,
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
    borderRadius: borderRadius.md,
    borderWidth: 1,
    overflow: 'hidden',
    margin: getResponsiveSpacing(spacing.xs),
  },
  content: {
    padding: getResponsiveSpacing(spacing.md),
  },
  gradient: {
    padding: getResponsiveSpacing(spacing.md),
  },
});

export default NeonCard;