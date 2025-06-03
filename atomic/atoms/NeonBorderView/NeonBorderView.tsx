import { useTheme } from '@react-navigation/native';
import React, { useEffect, useCallback, useState, useRef } from 'react';
import {
  View,
  Animated,
  StyleProp,
  ViewStyle,
  AccessibilityInfo,
  InteractionManager,
  Platform,
} from 'react-native';

import AccessibleThemedView from '../AccessibleThemedView';
import CircuitGridPattern from './CircuitGridPattern';
import { createStyles } from './NeonBorderView.styles';
import useRotationAnimation from './RotationAnimation';
import { getDeviceType, getOptimizedGlowIntensity } from '../../../utils/deviceOptimization';

/**
 * Props for the NeonBorderView component
 */
export interface NeonBorderViewProps {
  /**
   * Width of the border in pixels
   * @default 2
   */
  borderWidth?: number;

  /**
   * Color of the neon border
   * @default '#00BFFF' (Deep Sky Blue)
   */
  borderColor?: string;

  /**
   * Duration of one complete rotation in milliseconds
   * @default 20000 (20 seconds)
   */
  rotationDuration?: number;

  /**
   * Duration of the grid flash animation cycle in milliseconds
   * @default 3000 (3 seconds)
   */
  gridFlashDuration?: number;

  /**
   * Density of the grid pattern (number of lines)
   * @default 'medium'
   */
  gridDensity?: 'low' | 'medium' | 'high';

  /**
   * Level of performance optimization
   * 'auto': Automatically determine based on device capabilities
   * 'high': Full animations and effects
   * 'medium': Reduced complexity animations
   * 'low': Minimal animations for low-end devices
   * @default 'auto'
   */
  optimizationLevel?: 'auto' | 'high' | 'medium' | 'low';

  /**
   * Whether to respect the user's reduced motion settings
   * @default true
   */
  respectReducedMotion?: boolean;

  /**
   * Additional style for the container
   */
  style?: StyleProp<ViewStyle>;

  /**
   * Content to be wrapped by the neon border
   */
  children: React.ReactNode;
}

/**
 * Determine the optimization level based on device capabilities
 */
const determineOptimizationLevel = (
  deviceType: ReturnType<typeof getDeviceType>
): 'high' | 'medium' | 'low' => {
  // Check if device is low-end
  const isLowEndDevice =
    (Platform.OS === 'android' && Platform.constants.Brand?.toLowerCase().includes('low')) || false;

  // Check if device has low pixel ratio
  const isLowPixelRatio = Platform.OS === 'android' && require('react-native').PixelRatio.get() < 2;

  // Check if device is small
  const isSmallDevice = deviceType === 'PHONE_SMALL';

  if (isLowEndDevice || isSmallDevice || isLowPixelRatio) {
    return 'low';
  }

  // Check if device is mid-range
  const isMidRangeDevice =
    Platform.OS === 'android' && require('react-native').PixelRatio.get() < 3;

  if (isMidRangeDevice) {
    return 'medium';
  }

  // Otherwise, use high optimization level
  return 'high';
};

/**
 * Hook to check if reduced motion is enabled
 */
const useReducedMotion = (): boolean => {
  const [isReducedMotionEnabled, setIsReducedMotionEnabled] = useState(false);

  useEffect(() => {
    const checkReducedMotion = async () => {
      const isEnabled = await AccessibilityInfo.isReduceMotionEnabled();
      setIsReducedMotionEnabled(isEnabled);
    };

    checkReducedMotion();

    // Listen for changes to reduced motion setting
    const listener = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      setIsReducedMotionEnabled
    );

    return () => {
      listener.remove();
    };
  }, []);

  return isReducedMotionEnabled;
};

/**
 * NeonBorderView component
 *
 * A component that wraps content with a neon border effect featuring rotation animation
 * and a flashing grid pattern that resembles a simplified circuit board.
 */
const NeonBorderView: React.FC<NeonBorderViewProps> = ({
  borderWidth = 2,
  borderColor = '#00BFFF',
  rotationDuration = 20000,
  gridFlashDuration = 3000,
  gridDensity = 'medium',
  optimizationLevel = 'auto',
  respectReducedMotion = true,
  style,
  children,
}) => {
  // Create styles
  const styles = createStyles();
  const { colors } = useTheme();

  // Detect device capabilities and determine actual optimization level
  const deviceType = getDeviceType();
  const actualOptimizationLevel =
    optimizationLevel === 'auto' ? determineOptimizationLevel(deviceType) : optimizationLevel;

  // Check if reduced motion is enabled
  const isReducedMotionEnabled = useReducedMotion() && respectReducedMotion;

  // Get rotation animation style
  const { rotationStyle, startRotation, stopRotation } = useRotationAnimation(
    rotationDuration,
    isReducedMotionEnabled
  );

  // State to track if grid animation should start
  const [shouldStartGridAnimation, setShouldStartGridAnimation] = useState(false);

  // Reference to track if component is mounted
  const isMounted = useRef(true);

  // Start rotation animation on mount
  useEffect(() => {
    startRotation();

    // Use InteractionManager to delay non-essential animations
    const interactionPromise = InteractionManager.runAfterInteractions(() => {
      if (isMounted.current) {
        setShouldStartGridAnimation(true);
      }
    });

    return () => {
      isMounted.current = false;
      stopRotation();
      interactionPromise.cancel();
    };
  }, [startRotation, stopRotation]);

  // Measure container dimensions for the grid pattern
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const onLayout = useCallback(event => {
    const { width, height } = event.nativeEvent.layout;
    setDimensions({ width, height });
  }, []);

  // Apply bitmap caching for Android
  const borderViewStyle =
    Platform.OS === 'android' && Platform.Version >= 28
      ? { ...styles.border, renderToHardwareTextureAndroid: true }
      : styles.border;

  return (
    <AccessibleThemedView
      style={[styles.container, style]}
      onLayout={onLayout}
      accessibilityRole="none"
      accessibilityLabel="Decorative neon border"
      accessibilityHint="This is a decorative element with a neon border effect"
    >
      {/* Border with rotation animation */}
      <Animated.View
        style={[
          borderViewStyle,
          {
            borderColor,
            borderWidth,
            shadowColor: borderColor,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity:
              getOptimizedGlowIntensity(actualOptimizationLevel === 'high' ? 'high' : 'medium') ===
              'high'
                ? 0.8
                : 0.5,
            shadowRadius:
              getOptimizedGlowIntensity(actualOptimizationLevel === 'high' ? 'high' : 'medium') ===
              'high'
                ? 8
                : 5,
            elevation:
              getOptimizedGlowIntensity(actualOptimizationLevel === 'high' ? 'high' : 'medium') ===
              'high'
                ? 8
                : 5,
          },
          rotationStyle,
        ]}
      >
        {/* Circuit grid pattern */}
        {dimensions.width > 0 && dimensions.height > 0 && shouldStartGridAnimation && (
          <CircuitGridPattern
            width={dimensions.width}
            height={dimensions.height}
            color={borderColor}
            density={gridDensity}
            flashDuration={gridFlashDuration}
            optimizationLevel={actualOptimizationLevel}
          />
        )}
      </Animated.View>

      {/* Content */}
      <View style={styles.content}>{children}</View>
    </AccessibleThemedView>
  );
};

export default React.memo(NeonBorderView, (prevProps, nextProps) => {
  // Custom comparison function to prevent unnecessary re-renders
  return (
    prevProps.borderWidth === nextProps.borderWidth &&
    prevProps.borderColor === nextProps.borderColor &&
    prevProps.rotationDuration === nextProps.rotationDuration &&
    prevProps.gridFlashDuration === nextProps.gridFlashDuration &&
    prevProps.gridDensity === nextProps.gridDensity &&
    prevProps.optimizationLevel === nextProps.optimizationLevel &&
    prevProps.respectReducedMotion === nextProps.respectReducedMotion &&
    prevProps.style === nextProps.style
    // We don't compare children as they are likely to change
  );
});
