import { Platform, Dimensions } from 'react-native';

/**
 * Animation types for optimization
 */
export enum AnimationType {
  FADE = 'fade',
  SCALE = 'scale',
  SLIDE = 'slide',
  ROTATE = 'rotate',
  SEQUENCE = 'sequence',
  PARALLEL = 'parallel',
  SPRING = 'spring',
  STAGGER = 'stagger',
}

/**
 * Device performance levels
 */
export enum DevicePerformanceLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
}

// Cache the device performance level
let cachedPerformanceLevel: DevicePerformanceLevel | null = null;

/**
 * Detect device performance level based on platform, screen size, and memory
 * @returns Device performance level
 */
export const getDevicePerformanceLevel = (): DevicePerformanceLevel => {
  // Return cached value if available
  if (cachedPerformanceLevel) {
    return cachedPerformanceLevel;
  }

  // Get screen dimensions
  const { width, height } = Dimensions.get('window');
  const screenResolution = width * height;

  // Determine performance level based on platform and screen resolution
  if (Platform.OS === 'web') {
    // Web performance is generally good
    cachedPerformanceLevel = DevicePerformanceLevel.HIGH;
  } else if (Platform.OS === 'ios') {
    // iOS devices are generally performant
    if (screenResolution > 2000000) {
      // High-end iOS devices (iPhone 12 Pro and above)
      cachedPerformanceLevel = DevicePerformanceLevel.HIGH;
    } else {
      // Older iOS devices
      cachedPerformanceLevel = DevicePerformanceLevel.MEDIUM;
    }
  } else {
    // Android has more variable performance
    if (screenResolution > 2500000) {
      // High-end Android devices
      cachedPerformanceLevel = DevicePerformanceLevel.HIGH;
    } else if (screenResolution > 1500000) {
      // Mid-range Android devices
      cachedPerformanceLevel = DevicePerformanceLevel.MEDIUM;
    } else {
      // Low-end Android devices
      cachedPerformanceLevel = DevicePerformanceLevel.LOW;
    }
  }

  return cachedPerformanceLevel;
};

/**
 * Check if complex animations should be enabled based on device performance
 * @returns True if complex animations should be enabled
 */
export const shouldEnableComplexAnimations = (): boolean => {
  const performanceLevel = getDevicePerformanceLevel();

  // Enable complex animations only on medium and high performance devices
  return performanceLevel !== DevicePerformanceLevel.LOW;
};

/**
 * Get optimized animation duration based on device performance
 * @param baseDuration Base animation duration in milliseconds
 * @param animationType Type of animation
 * @returns Optimized duration in milliseconds
 */
export const getOptimizedDuration = (
  baseDuration: number,
  animationType: AnimationType
): number => {
  const performanceLevel = getDevicePerformanceLevel();

  // Adjust duration based on performance level and animation type
  switch (performanceLevel) {
    case DevicePerformanceLevel.LOW:
      // Shorter durations for low-end devices
      return Math.min(baseDuration * 0.7, 500);

    case DevicePerformanceLevel.MEDIUM:
      // Slightly adjusted durations for mid-range devices
      return baseDuration * 0.9;

    case DevicePerformanceLevel.HIGH:
    default:
      // Full durations for high-end devices
      return baseDuration;
  }
};

/**
 * Get optimized animation configuration based on device performance
 * @param animationType Type of animation
 * @returns Configuration object with optimized parameters
 */
export const getOptimizedConfig = (animationType: AnimationType): Record<string, any> => {
  const performanceLevel = getDevicePerformanceLevel();

  // Base configurations
  const baseConfig: Record<string, Record<string, any>> = {
    [AnimationType.FADE]: {
      useNativeDriver: true,
    },
    [AnimationType.SCALE]: {
      useNativeDriver: true,
    },
    [AnimationType.SLIDE]: {
      useNativeDriver: true,
    },
    [AnimationType.ROTATE]: {
      useNativeDriver: true,
    },
    [AnimationType.SEQUENCE]: {
      // No specific config for sequence
    },
    [AnimationType.PARALLEL]: {
      // No specific config for parallel
    },
    [AnimationType.SPRING]: {
      useNativeDriver: true,
      friction: 8,
      tension: 40,
    },
    [AnimationType.STAGGER]: {
      // No specific config for stagger
    },
  };

  // Get base config for animation type
  const config = { ...baseConfig[animationType] };

  // Adjust config based on performance level
  switch (performanceLevel) {
    case DevicePerformanceLevel.LOW:
      // Optimize for performance on low-end devices
      if (animationType === AnimationType.SPRING) {
        config.friction = 10; // Higher friction for smoother animation
        config.tension = 30; // Lower tension for less computation
      }
      break;

    case DevicePerformanceLevel.MEDIUM:
      // Slight optimizations for mid-range devices
      if (animationType === AnimationType.SPRING) {
        config.friction = 9;
        config.tension = 35;
      }
      break;

    case DevicePerformanceLevel.HIGH:
    default:
      // No adjustments needed for high-end devices
      break;
  }

  return config;
};

/**
 * Get optimized animation delay for staggered animations
 * @param baseDelay Base delay in milliseconds
 * @returns Optimized delay in milliseconds
 */
export const getOptimizedDelay = (baseDelay: number): number => {
  const performanceLevel = getDevicePerformanceLevel();

  switch (performanceLevel) {
    case DevicePerformanceLevel.LOW:
      // Longer delays for low-end devices to reduce CPU load
      return Math.max(baseDelay * 1.5, 100);

    case DevicePerformanceLevel.MEDIUM:
      // Slightly longer delays for mid-range devices
      return baseDelay * 1.2;

    case DevicePerformanceLevel.HIGH:
    default:
      // Normal delays for high-end devices
      return baseDelay;
  }
};

// Alias for backward compatibility
export const getOptimizedAnimationDuration = getOptimizedDuration;
