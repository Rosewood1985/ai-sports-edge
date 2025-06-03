import { render, fireEvent } from '@testing-library/react-native';
import React from 'react';
import { Animated, View, Text } from 'react-native';

import {
  useOptimizedFade,
  useOptimizedScale,
  useOptimizedSlide,
  useOptimizedSequence,
  useAutoStartAnimation,
} from '../../hooks/useOptimizedAnimation';
import {
  shouldEnableComplexAnimations,
  getOptimizedDuration,
  DevicePerformanceLevel,
  AnimationType,
} from '../../utils/animationOptimizer';

// Mock the animationOptimizer module
jest.mock('../../utils/animationOptimizer', () => ({
  shouldEnableComplexAnimations: jest.fn(),
  getOptimizedDuration: jest.fn(),
  getDevicePerformanceLevel: jest.fn(),
  DevicePerformanceLevel: {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high',
  },
  AnimationType: {
    FADE: 'fade',
    SCALE: 'scale',
    SLIDE: 'slide',
    ROTATE: 'rotate',
    SEQUENCE: 'sequence',
    PARALLEL: 'parallel',
    SPRING: 'spring',
    STAGGER: 'stagger',
  },
}));

// Mock Animated.timing
jest.mock('react-native/Libraries/Animated/Animated', () => {
  const actual = jest.requireActual('react-native/Libraries/Animated/Animated');
  return {
    ...actual,
    timing: jest.fn(() => ({
      start: jest.fn(callback => {
        if (callback) {
          callback({ finished: true });
        }
      }),
    })),
    loop: jest.fn(() => ({
      start: jest.fn(),
      stop: jest.fn(),
    })),
    sequence: jest.fn(() => ({
      start: jest.fn(callback => {
        if (callback) {
          callback({ finished: true });
        }
      }),
    })),
  };
});

// Test component using the optimized fade hook
const TestFadeComponent = ({ onAnimationComplete }: { onAnimationComplete?: () => void }) => {
  const { fadeAnim, startFade } = useOptimizedFade({
    initialValue: 0,
    toValue: 1,
    duration: 300,
  });

  return (
    <View>
      <Animated.View style={{ opacity: fadeAnim }}>
        <Text>Fade Test</Text>
      </Animated.View>
      <Text testID="start-button" onPress={() => startFade(onAnimationComplete)}>
        Start Animation
      </Text>
    </View>
  );
};

// Test component using the optimized scale hook
const TestScaleComponent = ({ onAnimationComplete }: { onAnimationComplete?: () => void }) => {
  const { scaleAnim, startScale } = useOptimizedScale({
    initialValue: 1,
    toValue: 1.5,
    duration: 300,
  });

  return (
    <View>
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <Text>Scale Test</Text>
      </Animated.View>
      <Text testID="start-button" onPress={() => startScale(onAnimationComplete)}>
        Start Animation
      </Text>
    </View>
  );
};

// Test component using the optimized slide hook
const TestSlideComponent = ({ onAnimationComplete }: { onAnimationComplete?: () => void }) => {
  const { slideAnim, startSlide } = useOptimizedSlide(0, 100, 300);

  return (
    <View>
      <Animated.View style={{ transform: [{ translateY: slideAnim }] }}>
        <Text>Slide Test</Text>
      </Animated.View>
      <Text testID="start-button" onPress={() => startSlide(onAnimationComplete)}>
        Start Animation
      </Text>
    </View>
  );
};

// Test component using the optimized sequence hook
const TestSequenceComponent = ({ onAnimationComplete }: { onAnimationComplete?: () => void }) => {
  const { fadeAnim, startFade } = useOptimizedFade();
  const { scaleAnim, startScale } = useOptimizedScale();

  const { startSequence } = useOptimizedSequence([startFade, startScale]);

  return (
    <View>
      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        }}
      >
        <Text>Sequence Test</Text>
      </Animated.View>
      <Text
        testID="start-button"
        onPress={() => {
          startSequence();
          if (onAnimationComplete) {
            setTimeout(onAnimationComplete, 10);
          }
        }}
      >
        Start Sequence
      </Text>
    </View>
  );
};

// Test component using auto start animation
const TestAutoStartComponent = ({ shouldStart = true }: { shouldStart?: boolean }) => {
  const { fadeAnim, startFade } = useOptimizedFade();

  useAutoStartAnimation(() => {
    startFade();
  }, [shouldStart]);

  return (
    <Animated.View style={{ opacity: fadeAnim }}>
      <Text>Auto Start Test</Text>
    </Animated.View>
  );
};

describe('Animation Optimization', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (shouldEnableComplexAnimations as jest.Mock).mockReturnValue(true);
    (getOptimizedDuration as jest.Mock).mockImplementation(duration => duration);
  });

  describe('useOptimizedFade', () => {
    it('should create and start a fade animation', () => {
      const onAnimationComplete = jest.fn();
      const { getByTestId } = render(
        <TestFadeComponent onAnimationComplete={onAnimationComplete} />
      );

      fireEvent.press(getByTestId('start-button'));

      expect(Animated.timing).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          toValue: 1,
          useNativeDriver: true,
        })
      );

      expect(onAnimationComplete).toHaveBeenCalled();
    });
  });

  describe('useOptimizedScale', () => {
    it('should create and start a scale animation', () => {
      const onAnimationComplete = jest.fn();
      const { getByTestId } = render(
        <TestScaleComponent onAnimationComplete={onAnimationComplete} />
      );

      fireEvent.press(getByTestId('start-button'));

      expect(Animated.timing).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          toValue: 1.5,
          useNativeDriver: true,
        })
      );

      expect(onAnimationComplete).toHaveBeenCalled();
    });
  });

  describe('useOptimizedSlide', () => {
    it('should create and start a slide animation', () => {
      const onAnimationComplete = jest.fn();
      const { getByTestId } = render(
        <TestSlideComponent onAnimationComplete={onAnimationComplete} />
      );

      fireEvent.press(getByTestId('start-button'));

      expect(Animated.timing).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          toValue: 100,
          useNativeDriver: true,
        })
      );

      expect(onAnimationComplete).toHaveBeenCalled();
    });
  });

  describe('useOptimizedSequence', () => {
    it('should create and start a sequence of animations', () => {
      const onAnimationComplete = jest.fn();
      const { getByTestId } = render(
        <TestSequenceComponent onAnimationComplete={onAnimationComplete} />
      );

      fireEvent.press(getByTestId('start-button'));

      // Wait for the sequence to complete
      setTimeout(() => {
        expect(onAnimationComplete).toHaveBeenCalled();
      }, 20);
    });
  });

  describe('useAutoStartAnimation', () => {
    it('should automatically start animation on mount', () => {
      render(<TestAutoStartComponent />);

      expect(Animated.timing).toHaveBeenCalled();
    });

    it('should restart animation when dependencies change', () => {
      const { rerender } = render(<TestAutoStartComponent shouldStart={false} />);

      // Clear the initial call
      (Animated.timing as jest.Mock).mockClear();

      // Rerender with changed dependency
      rerender(<TestAutoStartComponent shouldStart />);

      expect(Animated.timing).toHaveBeenCalled();
    });
  });

  describe('Animation optimization based on device performance', () => {
    it('should use optimized durations for high-performance devices', () => {
      (shouldEnableComplexAnimations as jest.Mock).mockReturnValue(true);
      (getOptimizedDuration as jest.Mock).mockImplementation(duration => duration);

      const { getByTestId } = render(<TestFadeComponent />);
      fireEvent.press(getByTestId('start-button'));

      expect(getOptimizedDuration).toHaveBeenCalledWith(300, AnimationType.FADE);
    });

    it('should use reduced durations for low-performance devices', () => {
      (shouldEnableComplexAnimations as jest.Mock).mockReturnValue(false);
      (getOptimizedDuration as jest.Mock).mockImplementation(duration => duration * 0.7);

      const { getByTestId } = render(<TestFadeComponent />);
      fireEvent.press(getByTestId('start-button'));

      expect(getOptimizedDuration).toHaveBeenCalledWith(300, AnimationType.FADE);
      expect(Animated.timing).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          duration: 210, // 300 * 0.7
          useNativeDriver: true,
        })
      );
    });
  });
});
