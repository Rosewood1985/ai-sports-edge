import { useRef, useCallback } from 'react';
import { Animated, Easing } from 'react-native';

/**
 * Custom hook for creating a rotation animation
 *
 * @param duration - Duration of one complete rotation in milliseconds
 * @param isReducedMotionEnabled - Whether reduced motion is enabled
 * @returns Object containing rotation style and control functions
 */
export const useRotationAnimation = (duration: number, isReducedMotionEnabled: boolean) => {
  // Create animated value for rotation
  const rotateValue = useRef(new Animated.Value(0)).current;

  // Create animation loop
  const startRotation = useCallback(() => {
    // If reduced motion is enabled, don't animate
    if (isReducedMotionEnabled) {
      return;
    }

    // Reset rotation value
    rotateValue.setValue(0);

    // Create and start animation
    Animated.loop(
      Animated.timing(rotateValue, {
        toValue: 1,
        duration,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, [rotateValue, duration, isReducedMotionEnabled]);

  // Stop animation
  const stopRotation = useCallback(() => {
    rotateValue.stopAnimation();
  }, [rotateValue]);

  // Create rotation style
  const rotationStyle = {
    transform: [
      {
        rotate: rotateValue.interpolate({
          inputRange: [0, 1],
          outputRange: ['0deg', '360deg'],
        }),
      },
    ],
  };

  return { rotationStyle, startRotation, stopRotation };
};

export default useRotationAnimation;
