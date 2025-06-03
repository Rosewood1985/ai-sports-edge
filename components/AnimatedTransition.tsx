import React, { useEffect, useRef } from 'react';
import { Animated, ViewStyle, StyleProp, Easing } from 'react-native';

type AnimationType = 'fade' | 'slide' | 'scale' | 'slideUp' | 'slideDown';

interface AnimatedTransitionProps {
  /**
   * Children to be animated
   */
  children: React.ReactNode;

  /**
   * Type of animation
   */
  type?: AnimationType;

  /**
   * Duration of the animation in milliseconds
   */
  duration?: number;

  /**
   * Delay before starting the animation in milliseconds
   */
  delay?: number;

  /**
   * Whether the animation should be active
   */
  active?: boolean;

  /**
   * Additional styles for the container
   */
  style?: StyleProp<ViewStyle>;

  /**
   * Index for staggered animations
   */
  index?: number;

  /**
   * Stagger delay between items in milliseconds
   */
  staggerDelay?: number;
}

/**
 * AnimatedTransition component for smooth UI transitions
 */
const AnimatedTransition: React.FC<AnimatedTransitionProps> = ({
  children,
  type = 'fade',
  duration = 300,
  delay = 0,
  active = true,
  style,
  index = 0,
  staggerDelay = 50,
}) => {
  // Animation values
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const translateYAnim = useRef(new Animated.Value(50)).current;
  const translateXAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  // Calculate total delay including stagger
  const totalDelay = delay + index * staggerDelay;

  // Run animation when component mounts or when active state changes
  useEffect(() => {
    if (active) {
      // Create animation based on type
      const animations = [];

      // Fade animation (used in all types)
      animations.push(
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration,
          delay: totalDelay,
          useNativeDriver: true,
          easing: Easing.out(Easing.cubic),
        })
      );

      // Add specific animation based on type
      switch (type) {
        case 'slide':
          animations.push(
            Animated.timing(translateXAnim, {
              toValue: 0,
              duration,
              delay: totalDelay,
              useNativeDriver: true,
              easing: Easing.out(Easing.cubic),
            })
          );
          break;
        case 'slideUp':
          animations.push(
            Animated.timing(translateYAnim, {
              toValue: 0,
              duration,
              delay: totalDelay,
              useNativeDriver: true,
              easing: Easing.out(Easing.cubic),
            })
          );
          break;
        case 'slideDown':
          // Start from above
          translateYAnim.setValue(-50);
          animations.push(
            Animated.timing(translateYAnim, {
              toValue: 0,
              duration,
              delay: totalDelay,
              useNativeDriver: true,
              easing: Easing.out(Easing.cubic),
            })
          );
          break;
        case 'scale':
          animations.push(
            Animated.timing(scaleAnim, {
              toValue: 1,
              duration,
              delay: totalDelay,
              useNativeDriver: true,
              easing: Easing.out(Easing.cubic),
            })
          );
          break;
        default:
          // Fade only, no additional animation needed
          break;
      }

      // Run all animations in parallel
      Animated.parallel(animations).start();
    } else {
      // Reset animations if not active
      opacityAnim.setValue(0);

      if (type === 'slide') {
        translateXAnim.setValue(50);
      } else if (type === 'slideUp') {
        translateYAnim.setValue(50);
      } else if (type === 'slideDown') {
        translateYAnim.setValue(-50);
      } else if (type === 'scale') {
        scaleAnim.setValue(0.9);
      }
    }
  }, [active, type, duration, totalDelay]);

  // Create transform array based on animation type
  const getTransform = () => {
    switch (type) {
      case 'slide':
        return [{ translateX: translateXAnim }];
      case 'slideUp':
      case 'slideDown':
        return [{ translateY: translateYAnim }];
      case 'scale':
        return [{ scale: scaleAnim }];
      default:
        return [];
    }
  };

  return (
    <Animated.View
      style={[
        style,
        {
          opacity: opacityAnim,
          transform: getTransform(),
        },
      ]}
    >
      {children}
    </Animated.View>
  );
};

export default AnimatedTransition;
