import React, { useRef, useEffect } from 'react';
import { Animated, Easing, ViewStyle, StyleProp } from 'react-native';

import { getOptimizedGlowIntensity } from './deviceOptimization';

/**
 * Animation Utilities
 *
 * This file provides utilities for creating animations in the app.
 */

/**
 * Create a pulsing animation for a neon glow effect
 * @param {number} duration - Animation duration in milliseconds
 * @param {number} minValue - Minimum opacity value
 * @param {number} maxValue - Maximum opacity value
 * @returns {Animated.Value} - Animated value for opacity
 */
export const useNeonPulse = (
  duration: number = 1500,
  minValue: number = 0.5,
  maxValue: number = 1
): Animated.Value => {
  const pulseAnim = useRef(new Animated.Value(minValue)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: maxValue,
          duration,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: minValue,
          duration,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    return () => {
      pulseAnim.stopAnimation();
    };
  }, [pulseAnim, duration, minValue, maxValue]);

  return pulseAnim;
};

/**
 * Create a hover effect animation
 * @param {number} scaleAmount - Amount to scale on hover
 * @returns {Object} - Animated style and event handlers
 */
export const useHoverEffect = (
  scaleAmount: number = 1.05
): {
  animatedStyle: StyleProp<ViewStyle>;
  onPressIn: () => void;
  onPressOut: () => void;
} => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const onPressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: scaleAmount,
      friction: 7,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  const onPressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 7,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  const animatedStyle = {
    transform: [{ scale: scaleAnim }],
  };

  return {
    animatedStyle,
    onPressIn,
    onPressOut,
  };
};

/**
 * Create a glow intensity animation for hover effect
 * @param {string} baseIntensity - Base glow intensity ('low', 'medium', 'high')
 * @param {string} hoverIntensity - Hover glow intensity ('low', 'medium', 'high')
 * @returns {Object} - Animated values and event handlers
 */
export const useGlowHoverEffect = (
  baseIntensity: 'low' | 'medium' | 'high' = 'low',
  hoverIntensity: 'low' | 'medium' | 'high' = 'medium'
): {
  glowOpacity: Animated.Value;
  glowRadius: Animated.Value;
  onPressIn: () => void;
  onPressOut: () => void;
} => {
  // Optimize intensities based on device performance
  const optimizedBaseIntensity = getOptimizedGlowIntensity(baseIntensity);
  const optimizedHoverIntensity = getOptimizedGlowIntensity(hoverIntensity);

  // Map intensity to radius and opacity values
  const getRadiusForIntensity = (intensity: 'low' | 'medium' | 'high'): number => {
    switch (intensity) {
      case 'low':
        return 3;
      case 'medium':
        return 5;
      case 'high':
        return 10;
      default:
        return 5;
    }
  };

  const getOpacityForIntensity = (intensity: 'low' | 'medium' | 'high'): number => {
    switch (intensity) {
      case 'low':
        return 0.3;
      case 'medium':
        return 0.5;
      case 'high':
        return 0.7;
      default:
        return 0.5;
    }
  };

  const baseRadius = getRadiusForIntensity(optimizedBaseIntensity);
  const hoverRadius = getRadiusForIntensity(optimizedHoverIntensity);
  const baseOpacity = getOpacityForIntensity(optimizedBaseIntensity);
  const hoverOpacity = getOpacityForIntensity(optimizedHoverIntensity);

  const glowOpacity = useRef(new Animated.Value(baseOpacity)).current;
  const glowRadius = useRef(new Animated.Value(baseRadius)).current;

  const onPressIn = () => {
    Animated.parallel([
      Animated.timing(glowOpacity, {
        toValue: hoverOpacity,
        duration: 150,
        easing: Easing.ease,
        useNativeDriver: false,
      }),
      Animated.timing(glowRadius, {
        toValue: hoverRadius,
        duration: 150,
        easing: Easing.ease,
        useNativeDriver: false,
      }),
    ]).start();
  };

  const onPressOut = () => {
    Animated.parallel([
      Animated.timing(glowOpacity, {
        toValue: baseOpacity,
        duration: 200,
        easing: Easing.ease,
        useNativeDriver: false,
      }),
      Animated.timing(glowRadius, {
        toValue: baseRadius,
        duration: 200,
        easing: Easing.ease,
        useNativeDriver: false,
      }),
    ]).start();
  };

  return {
    glowOpacity,
    glowRadius,
    onPressIn,
    onPressOut,
  };
};

/**
 * Create a fade-in animation
 * @param {number} duration - Animation duration in milliseconds
 * @param {number} delay - Animation delay in milliseconds
 * @returns {Animated.Value} - Animated value for opacity
 */
export const useFadeIn = (duration: number = 500, delay: number = 0): Animated.Value => {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: 1,
      duration,
      delay,
      easing: Easing.ease,
      useNativeDriver: true,
    }).start();

    return () => {
      opacity.stopAnimation();
    };
  }, [opacity, duration, delay]);

  return opacity;
};

/**
 * Create a slide-in animation
 * @param {number} duration - Animation duration in milliseconds
 * @param {number} delay - Animation delay in milliseconds
 * @param {string} direction - Direction to slide from ('left', 'right', 'top', 'bottom')
 * @param {number} distance - Distance to slide from
 * @returns {Object} - Animated style
 */
export const useSlideIn = (
  duration: number = 500,
  delay: number = 0,
  direction: 'left' | 'right' | 'top' | 'bottom' = 'bottom',
  distance: number = 100
): StyleProp<ViewStyle> => {
  const translateX = useRef(
    new Animated.Value(direction === 'left' ? -distance : direction === 'right' ? distance : 0)
  ).current;
  const translateY = useRef(
    new Animated.Value(direction === 'top' ? -distance : direction === 'bottom' ? distance : 0)
  ).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration,
        delay,
        easing: Easing.ease,
        useNativeDriver: true,
      }),
      Animated.timing(translateX, {
        toValue: 0,
        duration,
        delay,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration,
        delay,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();

    return () => {
      translateX.stopAnimation();
      translateY.stopAnimation();
      opacity.stopAnimation();
    };
  }, [translateX, translateY, opacity, duration, delay]);

  return {
    opacity,
    transform: [{ translateX }, { translateY }],
  };
};

export default {
  useNeonPulse,
  useHoverEffect,
  useGlowHoverEffect,
  useFadeIn,
  useSlideIn,
};
