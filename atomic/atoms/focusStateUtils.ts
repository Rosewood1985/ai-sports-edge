/**
 * Focus State Utilities
 *
 * This file contains utilities for handling focus states in a consistent way
 * across the application. It provides functions for creating focus styles,
 * handling focus events, and managing focus state.
 */

import { useTheme } from '@react-navigation/native';
import { useRef, useState, useEffect } from 'react';
import { StyleSheet } from 'react-native';

/**
 * Default focus style
 */
export const defaultFocusStyle = StyleSheet.create({
  focused: {
    borderWidth: 2,
    borderColor: '#39FF14', // Neon green for high visibility
  },
});

/**
 * Focus state options
 */
export interface FocusStateOptions {
  /**
   * Initial focus state
   * @default false
   */
  initialFocused?: boolean;

  /**
   * External focus state (controlled mode)
   * If provided, the hook will use this value instead of its internal state
   */
  externalFocused?: boolean;

  /**
   * Callback when the component receives focus
   */
  onFocus?: () => void;

  /**
   * Callback when the component loses focus
   */
  onBlur?: () => void;
}

/**
 * Focus state result
 */
export interface FocusStateResult {
  /**
   * Whether the component is currently focused
   */
  isFocused: boolean;

  /**
   * Set the focus state
   */
  setFocused: (focused: boolean) => void;

  /**
   * Handle focus event
   */
  handleFocus: () => void;

  /**
   * Handle blur event
   */
  handleBlur: () => void;

  /**
   * Handle press in event (also triggers focus)
   */
  handlePressIn: (event: any) => void;

  /**
   * Handle press out event (does not trigger blur to maintain focus state)
   */
  handlePressOut: (event: any) => void;

  /**
   * Focus style to apply to the component
   */
  focusStyle: any;
}

/**
 * Hook for managing focus state
 *
 * @param options Focus state options
 * @returns Focus state result
 */
export function useFocusState(options: FocusStateOptions = {}): FocusStateResult {
  const { initialFocused = false, externalFocused, onFocus, onBlur } = options;

  // Internal focus state (used if externalFocused is not provided)
  const [internalFocused, setInternalFocused] = useState(initialFocused);

  // Use external focus state if provided, otherwise use internal state
  const isFocused = externalFocused !== undefined ? externalFocused : internalFocused;

  // Get theme colors
  const { colors } = useTheme();

  // Focus style
  const focusStyle = isFocused
    ? {
        borderWidth: 2,
        borderColor: colors.primary || '#39FF14', // Use theme primary color or fallback to neon green
      }
    : undefined;

  // Handle focus
  const handleFocus = () => {
    if (externalFocused === undefined) {
      setInternalFocused(true);
    }

    if (onFocus) {
      onFocus();
    }
  };

  // Handle blur
  const handleBlur = () => {
    if (externalFocused === undefined) {
      setInternalFocused(false);
    }

    if (onBlur) {
      onBlur();
    }
  };

  // Handle press in (also triggers focus)
  const handlePressIn = (event: any) => {
    handleFocus();
  };

  // Handle press out (does not trigger blur to maintain focus state)
  const handlePressOut = (event: any) => {
    // Do not blur on press out to maintain focus state
  };

  return {
    isFocused,
    setFocused: setInternalFocused,
    handleFocus,
    handleBlur,
    handlePressIn,
    handlePressOut,
    focusStyle,
  };
}

/**
 * Create focus props for a component
 *
 * @param isFocused Whether the component is focused
 * @param customFocusStyle Custom focus style to apply
 * @returns Focus props
 */
export function createFocusProps(isFocused: boolean, customFocusStyle?: any) {
  return {
    style: isFocused ? [defaultFocusStyle.focused, customFocusStyle] : undefined,
    accessibilityState: {
      focused: isFocused,
    },
  };
}

/**
 * Get high contrast focus color based on background color
 *
 * @param backgroundColor Background color
 * @returns Focus color with high contrast
 */
export function getHighContrastFocusColor(backgroundColor: string): string {
  // Simple implementation - for dark backgrounds use neon green, for light backgrounds use blue
  // A more sophisticated implementation would calculate contrast ratios
  if (
    backgroundColor === '#000000' ||
    backgroundColor === '#121212' ||
    backgroundColor === 'black'
  ) {
    return '#39FF14'; // Neon green for dark backgrounds
  } else {
    return '#0066FF'; // Blue for light backgrounds
  }
}
