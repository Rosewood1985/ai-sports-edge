import React, { useRef, useEffect } from 'react';
import { Animated, Dimensions, StyleSheet, ViewStyle, StyleProp } from 'react-native';

// Get screen dimensions
const { width, height } = Dimensions.get('window');

// Define transition types
export type TransitionType =
  | 'fade'
  | 'slideLeft'
  | 'slideRight'
  | 'slideUp'
  | 'slideDown'
  | 'zoom'
  | 'flip'
  | 'none';

interface PageTransitionProps {
  /**
   * Children to be animated
   */
  children: React.ReactNode;
  
  /**
   * Type of transition animation
   */
  type?: TransitionType;
  
  /**
   * Duration of the animation in milliseconds
   */
  duration?: number;
  
  /**
   * Whether the component is currently visible
   */
  visible?: boolean;
  
  /**
   * Callback when animation completes
   */
  onAnimationComplete?: () => void;
  
  /**
   * Additional styles for the container
   */
  style?: StyleProp<ViewStyle>;
}

/**
 * PageTransition component for smooth transitions between screens
 */
const PageTransition: React.FC<PageTransitionProps> = ({
  children,
  type = 'fade',
  duration = 300,
  visible = true,
  onAnimationComplete,
  style,
}) => {
  // Animation values
  const opacityAnim = useRef(new Animated.Value(visible ? 1 : 0)).current;
  const translateXAnim = useRef(new Animated.Value(0)).current;
  const translateYAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(visible ? 1 : 0.8)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  
  // Run animation when visibility changes
  useEffect(() => {
    // Create animations based on transition type and visibility
    const animations = [];
    
    // Opacity animation for all types except 'none'
    if (type !== 'none') {
      animations.push(
        Animated.timing(opacityAnim, {
          toValue: visible ? 1 : 0,
          duration,
          useNativeDriver: true,
        })
      );
    }
    
    // Add specific animation based on type
    switch (type) {
      case 'slideLeft':
        animations.push(
          Animated.timing(translateXAnim, {
            toValue: visible ? 0 : -width,
            duration,
            useNativeDriver: true,
          })
        );
        break;
      case 'slideRight':
        animations.push(
          Animated.timing(translateXAnim, {
            toValue: visible ? 0 : width,
            duration,
            useNativeDriver: true,
          })
        );
        break;
      case 'slideUp':
        animations.push(
          Animated.timing(translateYAnim, {
            toValue: visible ? 0 : -height,
            duration,
            useNativeDriver: true,
          })
        );
        break;
      case 'slideDown':
        animations.push(
          Animated.timing(translateYAnim, {
            toValue: visible ? 0 : height,
            duration,
            useNativeDriver: true,
          })
        );
        break;
      case 'zoom':
        animations.push(
          Animated.timing(scaleAnim, {
            toValue: visible ? 1 : 0.8,
            duration,
            useNativeDriver: true,
          })
        );
        break;
      case 'flip':
        animations.push(
          Animated.timing(rotateAnim, {
            toValue: visible ? 0 : 1,
            duration,
            useNativeDriver: true,
          })
        );
        break;
    }
    
    // Run animations in parallel
    Animated.parallel(animations).start(({ finished }) => {
      if (finished && onAnimationComplete) {
        onAnimationComplete();
      }
    });
  }, [visible, type, duration]);
  
  // Calculate transform based on transition type
  const getTransform = () => {
    const transform = [];
    
    switch (type) {
      case 'slideLeft':
      case 'slideRight':
        transform.push({ translateX: translateXAnim });
        break;
      case 'slideUp':
      case 'slideDown':
        transform.push({ translateY: translateYAnim });
        break;
      case 'zoom':
        transform.push({ scale: scaleAnim });
        break;
      case 'flip':
        transform.push({
          rotateY: rotateAnim.interpolate({
            inputRange: [0, 1],
            outputRange: ['0deg', '180deg'],
          }),
        });
        break;
    }
    
    return transform;
  };
  
  // If transition type is 'none', just render children without animation
  if (type === 'none') {
    return <>{children}</>;
  }
  
  return (
    <Animated.View
      style={[
        styles.container,
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default PageTransition;