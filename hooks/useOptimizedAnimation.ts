import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Platform } from 'react-native';
import {
  shouldEnableComplexAnimations,
  getOptimizedDuration,
  AnimationType
} from '../utils/animationOptimizer';

/**
 * Hook for creating optimized fade animations
 * @param options Animation options
 * @returns Animation value and control functions
 */
export const useOptimizedFade = (options: {
  initialValue?: number;
  toValue?: number;
  duration?: number;
  easing?: typeof Easing.linear;
} = {}) => {
  const {
    initialValue = 0,
    toValue = 1,
    duration = 300,
    easing = Easing.inOut(Easing.ease)
  } = options;
  
  // Create animation value
  const fadeAnim = useRef(new Animated.Value(initialValue)).current;
  
  // Get optimized duration based on device performance
  const optimizedDuration = getOptimizedDuration(
    duration,
    AnimationType.FADE
  );
  
  // Start fade animation
  const startFade = (callback?: () => void) => {
    Animated.timing(fadeAnim, {
      toValue,
      duration: optimizedDuration,
      easing,
      useNativeDriver: true
    }).start(({ finished }) => {
      if (finished && callback) {
        callback();
      }
    });
  };
  
  // Reset fade animation
  const resetFade = (callback?: () => void) => {
    Animated.timing(fadeAnim, {
      toValue: initialValue,
      duration: optimizedDuration / 2, // Reset faster
      easing,
      useNativeDriver: true
    }).start(({ finished }) => {
      if (finished && callback) {
        callback();
      }
    });
  };
  
  return { fadeAnim, startFade, resetFade };
};

/**
 * Hook for creating optimized scale animations
 * @param options Animation options
 * @returns Animation value and control functions
 */
export const useOptimizedScale = (options: {
  initialValue?: number;
  toValue?: number;
  duration?: number;
  easing?: typeof Easing.linear;
} = {}) => {
  const {
    initialValue = 1,
    toValue = 1.1,
    duration = 300,
    easing = Easing.inOut(Easing.ease)
  } = options;
  
  // Create animation value
  const scaleAnim = useRef(new Animated.Value(initialValue)).current;
  
  // Get optimized duration based on device performance
  const optimizedDuration = getOptimizedDuration(
    duration,
    AnimationType.SCALE
  );
  
  // Start scale animation
  const startScale = (callback?: () => void) => {
    Animated.timing(scaleAnim, {
      toValue,
      duration: optimizedDuration,
      easing,
      useNativeDriver: true
    }).start(({ finished }) => {
      if (finished && callback) {
        callback();
      }
    });
  };
  
  // Reset scale animation
  const resetScale = (callback?: () => void) => {
    Animated.timing(scaleAnim, {
      toValue: initialValue,
      duration: optimizedDuration / 2, // Reset faster
      easing,
      useNativeDriver: true
    }).start(({ finished }) => {
      if (finished && callback) {
        callback();
      }
    });
  };
  
  return { scaleAnim, startScale, resetScale };
};

/**
 * Hook for creating optimized slide animations
 * @param initialValue Initial position
 * @param toValue Target position
 * @param duration Animation duration
 * @param easing Easing function
 * @returns Animation value and control function
 */
export const useOptimizedSlide = (
  initialValue: number = 0,
  toValue: number = 0,
  duration: number = 300,
  easing: typeof Easing.linear = Easing.out(Easing.ease)
) => {
  // Create animation value
  const slideAnim = useRef(new Animated.Value(initialValue)).current;
  
  // Get optimized duration based on device performance
  const optimizedDuration = getOptimizedDuration(
    duration,
    AnimationType.SLIDE
  );
  
  // Start slide animation
  const startSlide = (callback?: () => void) => {
    Animated.timing(slideAnim, {
      toValue,
      duration: optimizedDuration,
      easing,
      useNativeDriver: true
    }).start(({ finished }) => {
      if (finished && callback) {
        callback();
      }
    });
  };
  
  return { slideAnim, startSlide };
};

/**
 * Hook for creating a sequence of animations
 * @param animations Array of animation start functions
 * @returns Function to start the sequence
 */
export const useOptimizedSequence = (
  animations: Array<(callback?: () => void) => void>
) => {
  // Start sequence of animations
  const startSequence = () => {
    if (animations.length === 0) return;
    
    let currentIndex = 0;
    
    const runNextAnimation = () => {
      if (currentIndex >= animations.length) return;
      
      const currentAnimation = animations[currentIndex];
      currentIndex++;
      
      currentAnimation(() => {
        runNextAnimation();
      });
    };
    
    runNextAnimation();
  };
  
  return { startSequence };
};

/**
 * Hook for creating a loop animation
 * @param animation Animation start function
 * @param resetAnimation Animation reset function
 * @param iterations Number of iterations (0 for infinite)
 * @returns Functions to start and stop the loop
 */
export const useOptimizedLoop = (
  animation: (callback?: () => void) => void,
  resetAnimation: (callback?: () => void) => void,
  iterations: number = 0
) => {
  const iterationCount = useRef(0);
  const isRunning = useRef(false);
  
  // Start loop animation
  const startLoop = () => {
    if (isRunning.current) return;
    
    isRunning.current = true;
    iterationCount.current = 0;
    
    const runIteration = () => {
      if (!isRunning.current) return;
      
      if (iterations > 0 && iterationCount.current >= iterations) {
        isRunning.current = false;
        return;
      }
      
      animation(() => {
        resetAnimation(() => {
          iterationCount.current++;
          runIteration();
        });
      });
    };
    
    runIteration();
  };
  
  // Stop loop animation
  const stopLoop = () => {
    isRunning.current = false;
  };
  
  return { startLoop, stopLoop };
};

/**
 * Hook to automatically start an animation on mount or when dependencies change
 * @param startAnimation Function to start the animation
 * @param dependencies Dependencies array
 */
export const useAutoStartAnimation = (
  startAnimation: () => void,
  dependencies: React.DependencyList = []
) => {
  useEffect(() => {
    startAnimation();
  }, dependencies);
};

/**
 * Hook for creating a staggered animation for lists
 * @param itemCount Number of items
 * @param createAnimation Function to create animation for each item
 * @param staggerDelay Delay between items
 * @returns Array of animation values
 */
export const useStaggeredAnimation = (
  itemCount: number,
  createAnimation: (index: number) => Animated.Value,
  staggerDelay: number = 50
) => {
  // Create animation values for each item
  const animations = Array.from({ length: itemCount }, (_, index) => 
    createAnimation(index)
  );
  
  // Get optimized delay based on device performance
  const optimizedDelay = Platform.OS === 'ios' ? 
    staggerDelay : 
    Math.max(staggerDelay / 2, 25);
  
  // Start staggered animation
  const startStaggered = () => {
    animations.forEach((anim, index) => {
      setTimeout(() => {
        Animated.timing(anim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true
        }).start();
      }, index * optimizedDelay);
    });
  };
  
  return { animations, startStaggered };
};