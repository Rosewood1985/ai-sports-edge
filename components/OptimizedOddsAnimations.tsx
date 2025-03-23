import React from 'react';
import { Animated, Platform, StyleSheet } from 'react-native';
import { shouldEnableComplexAnimations } from '../utils/animationOptimizer';

/**
 * Creates an optimized glow style for odds comparison cards
 * @param animation Animated value for the glow effect
 * @param color Base color for the glow effect
 * @returns Animated style object
 */
export const createOptimizedGlowStyle = (animation: Animated.Value, color: string = '#FFD700') => {
  // Check if we should use complex animations based on device performance
  const useComplexAnimations = shouldEnableComplexAnimations();
  
  // Determine shadow opacity and radius based on device performance
  const maxShadowOpacity = useComplexAnimations ? 0.8 : 0.5;
  const maxShadowRadius = useComplexAnimations ? 10 : 6;
  const maxElevation = useComplexAnimations ? 8 : 4;
  const maxScale = useComplexAnimations ? 1.1 : 1.05;
  
  // Create the animated style
  return {
    transform: [{ 
      scale: animation.interpolate({ 
        inputRange: [0, 1], 
        outputRange: [1, maxScale] 
      }) 
    }],
    shadowColor: color,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: animation.interpolate({
      inputRange: [0, 1],
      outputRange: [0.2, maxShadowOpacity]
    }),
    shadowRadius: animation.interpolate({
      inputRange: [0, 1],
      outputRange: [3, maxShadowRadius]
    }),
    elevation: animation.interpolate({
      inputRange: [0, 1],
      outputRange: [2, maxElevation]
    })
  };
};

/**
 * Creates an optimized entrance animation for odds cards
 * @param index Index of the card in the list
 * @param totalCards Total number of cards
 * @returns Animated style object and start function
 */
export const useOptimizedEntranceAnimation = (index: number, totalCards: number) => {
  // Create animated values
  const opacity = new Animated.Value(0);
  const translateY = new Animated.Value(20);
  
  // Determine if we should use complex animations
  const useComplexAnimations = shouldEnableComplexAnimations();
  
  // Calculate delay based on index and device performance
  const baseDelay = useComplexAnimations ? 100 : 50;
  const delay = index * baseDelay;
  
  // Create animation
  const startAnimation = () => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        delay,
        useNativeDriver: true
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 300,
        delay,
        useNativeDriver: true
      })
    ]).start();
  };
  
  // Create style
  const style = {
    opacity,
    transform: [{ translateY }]
  };
  
  return { style, startAnimation };
};

/**
 * Creates an optimized pulse animation for highlighting new odds
 * @param initialDelay Initial delay before animation starts
 * @returns Animated style object and start/stop functions
 */
export const useOptimizedPulseAnimation = (initialDelay: number = 0) => {
  // Create animated value
  const pulse = new Animated.Value(1);
  
  // Reference to animation for cleanup
  let pulseAnimation: Animated.CompositeAnimation | null = null;
  
  // Determine if we should use complex animations
  const useComplexAnimations = shouldEnableComplexAnimations();
  
  // Create animation
  const startAnimation = () => {
    // Stop any existing animation
    if (pulseAnimation) {
      pulseAnimation.stop();
    }
    
    // Create new animation
    pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: useComplexAnimations ? 1.1 : 1.05,
          duration: 500,
          useNativeDriver: true
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true
        })
      ])
    );
    
    // Start animation after delay
    setTimeout(() => {
      if (pulseAnimation) {
        pulseAnimation.start();
      }
    }, initialDelay);
  };
  
  // Stop animation
  const stopAnimation = () => {
    if (pulseAnimation) {
      pulseAnimation.stop();
      pulse.setValue(1);
    }
  };
  
  // Create style
  const style = {
    transform: [{ scale: pulse }]
  };
  
  return { style, startAnimation, stopAnimation };
};

export default {
  createOptimizedGlowStyle,
  useOptimizedEntranceAnimation,
  useOptimizedPulseAnimation
};