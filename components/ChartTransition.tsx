import React, { useEffect, useRef } from 'react';
import { Animated, ViewStyle, StyleProp, Easing, View } from 'react-native';
import { useAccessibilityService } from '../hooks/useAccessibilityService';

interface ChartTransitionProps {
  /**
   * Children to be animated
   */
  children: React.ReactNode;
  
  /**
   * Delay before starting the animation in milliseconds
   */
  delay?: number;
  
  /**
   * Index for staggered animations
   */
  index?: number;
  
  /**
   * Additional styles for the container
   */
  style?: StyleProp<ViewStyle>;
  
  /**
   * Whether the chart is currently visible
   */
  visible?: boolean;
}

/**
 * ChartTransition component for smooth chart animations
 * 
 * This component provides smooth entrance animations for charts
 * with accessibility considerations (reduced motion when needed).
 */
const ChartTransition: React.FC<ChartTransitionProps> = ({
  children,
  delay = 0,
  index = 0,
  style,
  visible = true,
}) => {
  // Animation values
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const translateYAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  
  // Get accessibility preferences
  const { isReducedMotionEnabled } = useAccessibilityService();
  
  // Calculate total delay including index
  const totalDelay = delay + (index * 100);
  
  // Run animation when component mounts or when visibility changes
  useEffect(() => {
    if (visible) {
      // Create animations
      const animations = [];
      
      // Fade animation (always used)
      animations.push(
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: isReducedMotionEnabled ? 0 : 400,
          delay: isReducedMotionEnabled ? 0 : totalDelay,
          useNativeDriver: true,
          easing: Easing.out(Easing.cubic),
        })
      );
      
      // Only add motion animations if reduced motion is not enabled
      if (!isReducedMotionEnabled) {
        // Slide up animation
        animations.push(
          Animated.timing(translateYAnim, {
            toValue: 0,
            duration: 500,
            delay: totalDelay,
            useNativeDriver: true,
            easing: Easing.out(Easing.cubic),
          })
        );
        
        // Scale animation
        animations.push(
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 500,
            delay: totalDelay,
            useNativeDriver: true,
            easing: Easing.out(Easing.cubic),
          })
        );
      } else {
        // Immediately set final values for reduced motion
        translateYAnim.setValue(0);
        scaleAnim.setValue(1);
      }
      
      // Run all animations in parallel
      Animated.parallel(animations).start();
    } else {
      // Reset animations if not visible
      opacityAnim.setValue(0);
      translateYAnim.setValue(50);
      scaleAnim.setValue(0.95);
    }
  }, [visible, totalDelay, isReducedMotionEnabled]);
  
  return (
    <Animated.View
      style={[
        style,
        {
          opacity: opacityAnim,
          transform: [
            { translateY: translateYAnim },
            { scale: scaleAnim },
          ],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
};

export default ChartTransition;