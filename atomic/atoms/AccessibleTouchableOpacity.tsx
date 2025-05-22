import React, { useRef, useEffect } from 'react';
import {
  TouchableOpacity,
  TouchableOpacityProps,
  StyleSheet,
  Animated,
  Platform,
  findNodeHandle,
} from 'react-native';
import accessibilityService from '../../services/accessibilityService';
import { useFocusState } from './focusStateUtils';

/**
 * AccessibleTouchableOpacity component that extends TouchableOpacity with accessibility features.
 *
 * This component adds proper accessibility attributes to TouchableOpacity components,
 * making them more accessible to users with disabilities. It includes focus state handling
 * for both touch and keyboard navigation.
 */
export interface AccessibleTouchableOpacityProps extends TouchableOpacityProps {
  /**
   * Accessibility label that describes the action of the touchable
   */
  accessibilityLabel?: string;

  /**
   * Accessibility hint that explains what will happen when the touchable is activated
   */
  accessibilityHint?: string;

  /**
   * Accessibility role of the touchable
   */
  accessibilityRole?:
    | 'button'
    | 'link'
    | 'tab'
    | 'menu'
    | 'menuitem'
    | 'summary'
    | 'checkbox'
    | 'radio'
    | 'switch';

  /**
   * Accessibility state of the touchable
   */
  accessibilityState?: {
    disabled?: boolean;
    selected?: boolean;
    checked?: boolean | 'mixed';
    busy?: boolean;
    expanded?: boolean;
  };

  /**
   * Whether the touchable is currently focused (controlled mode)
   * If provided, the component will use this value instead of its internal state
   */
  isFocused?: boolean;

  /**
   * Style to apply when the touchable is focused
   */
  focusedStyle?: any;

  /**
   * Whether to animate the focus state
   * @default true
   */
  animateFocus?: boolean;

  /**
   * Duration of the focus animation in milliseconds
   * @default 150
   */
  focusAnimationDuration?: number;

  /**
   * Callback when the component receives focus
   */
  onFocus?: () => void;

  /**
   * Callback when the component loses focus
   */
  onBlur?: () => void;

  /**
   * ID for keyboard navigation
   * Used to register this component with the accessibility service
   */
  keyboardNavigationId?: string;

  /**
   * ID of the next element in the tab order
   */
  nextElementId?: string;

  /**
   * ID of the previous element in the tab order
   */
  prevElementId?: string;
}

/**
 * AccessibleTouchableOpacity component that extends TouchableOpacity with accessibility features.
 *
 * @param props - Component props
 * @returns Rendered component
 */
const AccessibleTouchableOpacity: React.FC<AccessibleTouchableOpacityProps> = ({
  accessibilityLabel,
  accessibilityHint,
  accessibilityRole = 'button',
  accessibilityState,
  isFocused: externalFocused,
  focusedStyle,
  style,
  children,
  animateFocus = true,
  focusAnimationDuration = 150,
  onFocus,
  onBlur,
  onPressIn,
  onPressOut,
  keyboardNavigationId,
  nextElementId,
  prevElementId,
  ...props
}) => {
  // Use focus state hook
  const { isFocused, handleFocus, handleBlur, handlePressIn, handlePressOut } = useFocusState({
    externalFocused,
    onFocus,
    onBlur,
  });

  // Animation value for focus effect
  const focusAnim = useRef(new Animated.Value(0)).current;

  // Reference to the TouchableOpacity
  const touchableRef = useRef(null);

  // Handle focus animation
  useEffect(() => {
    if (animateFocus) {
      Animated.timing(focusAnim, {
        toValue: isFocused ? 1 : 0,
        duration: focusAnimationDuration,
        useNativeDriver: false,
      }).start();
    } else {
      focusAnim.setValue(isFocused ? 1 : 0);
    }
  }, [isFocused, animateFocus, focusAnimationDuration, focusAnim]);

  // Set up accessibility focus handling
  useEffect(() => {
    // Register for keyboard navigation if ID is provided
    if (keyboardNavigationId) {
      accessibilityService.registerKeyboardNavigableElement(keyboardNavigationId, {
        ref: touchableRef,
        nextElementId,
        prevElementId,
        onFocus: handleFocus,
        onBlur: handleBlur,
      });

      // Clean up on unmount
      return () => {
        accessibilityService.unregisterKeyboardNavigableElement(keyboardNavigationId);
      };
    }

    return undefined;
  }, [keyboardNavigationId, nextElementId, prevElementId, handleFocus, handleBlur]);

  // Wrap the original handlers to call both our focus handlers and the user's handlers
  const wrappedPressIn = (event: any) => {
    handlePressIn(event);

    if (onPressIn) {
      onPressIn(event);
    }
  };

  const wrappedPressOut = (event: any) => {
    handlePressOut(event);

    if (onPressOut) {
      onPressOut(event);
    }
  };

  // Get accessibility props
  // Convert accessibilityState to Record<string, boolean> for compatibility with accessibilityService
  const convertedAccessibilityState = accessibilityState
    ? Object.entries(accessibilityState).reduce((acc, [key, value]) => {
        // Convert 'mixed' to true for checked property
        if (key === 'checked' && value === 'mixed') {
          acc[key] = true;
        } else {
          acc[key] = !!value; // Convert any value to boolean
        }
        return acc;
      }, {} as Record<string, boolean>)
    : undefined;

  const accessibilityProps = accessibilityLabel
    ? accessibilityService.getAccessibilityProps(
        accessibilityLabel,
        accessibilityHint,
        accessibilityRole,
        convertedAccessibilityState
      )
    : {};

  // Create animated focus styles
  const animatedBorderWidth = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 2],
  });

  // Apply focus style if focused
  const combinedStyle = [
    style,
    // Apply either animated style or static style based on animateFocus
    animateFocus
      ? isFocused
        ? {
            borderWidth: animatedBorderWidth as unknown as number,
            borderColor: '#39FF14', // Neon green for high visibility
          }
        : undefined
      : isFocused
      ? [styles.focused, focusedStyle]
      : undefined,
  ];

  return (
    <TouchableOpacity
      ref={touchableRef}
      style={combinedStyle as any} // Type cast to avoid TS errors with animated values
      {...accessibilityProps}
      {...props}
      onPressIn={wrappedPressIn}
      onPressOut={wrappedPressOut}
      accessible={true}
      accessibilityState={{
        ...accessibilityState,
        disabled: props.disabled,
      }}
    >
      {children}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  focused: {
    borderWidth: 2,
    borderColor: '#39FF14', // Neon green for high visibility
  },
});

export default AccessibleTouchableOpacity;
