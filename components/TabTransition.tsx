import React, { useEffect, useRef } from 'react';
import { Animated, ViewStyle, StyleProp, Easing } from 'react-native';
import { useAccessibilityService } from '../hooks/useAccessibilityService';

interface TabTransitionProps {
  /**
   * Children to be animated
   */
  children: React.ReactNode;
  
  /**
   * Whether the tab is currently active
   */
  active: boolean;
  
  /**
   * Additional styles for the container
   */
  style?: StyleProp<ViewStyle>;
}

/**
 * TabTransition component for smooth tab transitions
 * 
 * This component provides smooth transitions between tabs
 * with accessibility considerations (reduced motion when needed).
 */
const TabTransition: React.FC<TabTransitionProps> = ({
  children,
  active,
  style,
}) => {
  // Animation values
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const translateXAnim = useRef(new Animated.Value(20)).current;
  
  // Get accessibility preferences
  const { isReducedMotionEnabled } = useAccessibilityService();
  
  // Run animation when active state changes
  useEffect(() => {
    if (active) {
      // Create animations
      const animations = [];
      
      // Fade animation (always used)
      animations.push(
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: isReducedMotionEnabled ? 0 : 300,
          useNativeDriver: true,
          easing: Easing.out(Easing.cubic),
        })
      );
      
      // Only add motion animations if reduced motion is not enabled
      if (!isReducedMotionEnabled) {
        // Slide animation
        animations.push(
          Animated.timing(translateXAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
            easing: Easing.out(Easing.cubic),
          })
        );
      } else {
        // Immediately set final values for reduced motion
        translateXAnim.setValue(0);
      }
      
      // Run all animations in parallel
      Animated.parallel(animations).start();
    } else {
      // Reset animations if not active
      opacityAnim.setValue(0);
      translateXAnim.setValue(20);
    }
  }, [active, isReducedMotionEnabled]);
  
  // Don't render anything if not active
  if (!active) {
    return null;
  }
  
  return (
    <Animated.View
      style={[
        style,
        {
          opacity: opacityAnim,
          transform: [
            { translateX: translateXAnim },
          ],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
};

export default TabTransition;