import { useTheme } from '@react-navigation/native';
import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  ViewStyle,
  StyleProp,
  TextStyle,
  TouchableWithoutFeedback,
  GestureResponderEvent,
  AccessibilityInfo,
  LayoutChangeEvent,
} from 'react-native';

import AccessibleThemedText from './AccessibleThemedText';
import AccessibleThemedView from './AccessibleThemedView';
import { useI18n } from '../organisms/i18n/I18nContext';

/**
 * Slider component for selecting numeric values.
 *
 * This is an atomic component (atom) that serves as a building block for
 * more complex components in the atomic design system.
 */
export interface SliderProps {
  /**
   * Current value of the slider
   */
  value: number;

  /**
   * Callback when the value changes
   */
  onValueChange: (value: number) => void;

  /**
   * Minimum value of the slider
   * @default 0
   */
  minimumValue?: number;

  /**
   * Maximum value of the slider
   * @default 100
   */
  maximumValue?: number;

  /**
   * Step size for the slider
   * @default 1
   */
  step?: number;

  /**
   * Whether to show the value label
   * @default true
   */
  showValue?: boolean;

  /**
   * Format function for the value label
   * @default (value) => value.toString()
   */
  formatValue?: (value: number) => string;

  /**
   * Labels to show below the slider
   */
  labels?: string[];

  /**
   * Accessibility label for screen readers
   */
  accessibilityLabel?: string;

  /**
   * Accessibility hint for screen readers
   */
  accessibilityHint?: string;

  /**
   * Additional style for the slider container
   */
  style?: StyleProp<ViewStyle>;

  /**
   * Additional style for the value label
   */
  valueStyle?: StyleProp<TextStyle>;

  /**
   * Additional style for the labels
   */
  labelStyle?: StyleProp<TextStyle>;

  /**
   * Whether the slider is disabled
   * @default false
   */
  disabled?: boolean;

  /**
   * Color of the slider track
   */
  trackColor?: string;

  /**
   * Color of the slider thumb
   */
  thumbColor?: string;

  /**
   * Color of the minimum track
   */
  minimumTrackColor?: string;

  /**
   * Color of the maximum track
   */
  maximumTrackColor?: string;
}

const Slider: React.FC<SliderProps> = ({
  value,
  onValueChange,
  minimumValue = 0,
  maximumValue = 100,
  step = 1,
  showValue = true,
  formatValue = value => value.toString(),
  labels,
  accessibilityLabel,
  accessibilityHint,
  style,
  valueStyle,
  labelStyle,
  disabled = false,
  trackColor,
  thumbColor,
  minimumTrackColor,
  maximumTrackColor,
}) => {
  const { colors } = useTheme();
  const { t } = useI18n();

  // Local state for tracking value
  const [localValue, setLocalValue] = useState(value);

  // Update local value when prop value changes
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  // Default accessibility label if none provided
  const defaultAccessibilityLabel =
    accessibilityLabel ||
    t('components.slider.label', {
      value: formatValue(value),
      min: formatValue(minimumValue),
      max: formatValue(maximumValue),
    });

  // Default accessibility hint if none provided
  const defaultAccessibilityHint = accessibilityHint || t('components.slider.hint');

  // Calculate percentage for positioning
  const getPercentage = (val: number) => {
    return ((val - minimumValue) / (maximumValue - minimumValue)) * 100;
  };

  // Calculate value from percentage
  const getValueFromPercentage = (percentage: number) => {
    const rawValue = minimumValue + (percentage / 100) * (maximumValue - minimumValue);

    // Apply step if provided
    if (step > 0) {
      return Math.round(rawValue / step) * step;
    }

    return rawValue;
  };

  // Track width for calculations
  const [trackWidth, setTrackWidth] = useState(0);

  // Handle track layout to get width
  const handleTrackLayout = (event: LayoutChangeEvent) => {
    const { width } = event.nativeEvent.layout;
    setTrackWidth(width);
  };

  // Handle track press to update value
  const handleTrackPress = (event: GestureResponderEvent) => {
    if (disabled) return;

    const { locationX } = event.nativeEvent;

    if (trackWidth === 0) return;

    // Calculate percentage based on press location
    const percentage = (locationX / trackWidth) * 100;
    const clampedPercentage = Math.max(0, Math.min(100, percentage));

    // Calculate new value
    const newValue = getValueFromPercentage(clampedPercentage);
    setLocalValue(newValue);
    onValueChange(newValue);

    // Announce value change to screen readers
    AccessibilityInfo.isScreenReaderEnabled().then(screenReaderEnabled => {
      if (screenReaderEnabled) {
        AccessibilityInfo.announceForAccessibility(
          t('components.slider.valueChanged', { value: formatValue(newValue) })
        );
      }
    });
  };

  // Use theme colors if no custom colors provided
  const actualThumbColor = thumbColor || colors.primary;
  const actualMinimumTrackColor = minimumTrackColor || colors.primary;
  const actualMaximumTrackColor = maximumTrackColor || colors.border;

  // Calculate current percentage for styling
  const currentPercentage = getPercentage(localValue);

  return (
    <AccessibleThemedView
      style={[styles.container, style]}
      accessibilityLabel={defaultAccessibilityLabel}
      accessibilityHint={defaultAccessibilityHint}
    >
      {showValue && (
        <AccessibleThemedText style={[styles.valueText, valueStyle]}>
          {formatValue(localValue)}
        </AccessibleThemedText>
      )}

      <TouchableWithoutFeedback
        onPress={handleTrackPress}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityState={{ disabled }}
        accessibilityValue={{
          min: minimumValue,
          max: maximumValue,
          now: localValue,
        }}
      >
        <View style={styles.sliderContainer} onLayout={handleTrackLayout}>
          <View style={[styles.track, { backgroundColor: actualMaximumTrackColor }]}>
            <View
              style={[
                styles.minimumTrack,
                { backgroundColor: actualMinimumTrackColor, width: `${currentPercentage}%` },
              ]}
            />
          </View>

          <View
            style={[
              styles.thumb,
              { backgroundColor: actualThumbColor, left: `${currentPercentage}%` },
              disabled && styles.disabled,
            ]}
          />
        </View>
      </TouchableWithoutFeedback>

      {labels && labels.length > 0 && (
        <View style={styles.labelsContainer}>
          {labels.map((label, index) => (
            <AccessibleThemedText key={`label-${index}`} style={[styles.labelText, labelStyle]}>
              {label}
            </AccessibleThemedText>
          ))}
        </View>
      )}
    </AccessibleThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  valueText: {
    textAlign: 'center',
    marginBottom: 8,
    fontSize: 14,
    fontWeight: '500',
  },
  sliderContainer: {
    height: 40,
    justifyContent: 'center',
    position: 'relative',
  },
  track: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  minimumTrack: {
    height: '100%',
    position: 'absolute',
    left: 0,
    top: 0,
  },
  thumb: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    top: '50%',
    marginLeft: -10,
    marginTop: -10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  disabled: {
    opacity: 0.5,
  },
  labelsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 10,
    marginTop: 4,
  },
  labelText: {
    fontSize: 12,
    color: '#888',
  },
});

export default Slider;
