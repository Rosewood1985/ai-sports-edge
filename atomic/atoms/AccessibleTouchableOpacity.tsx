import React from 'react';
import { TouchableOpacity, TouchableOpacityProps, StyleSheet } from 'react-native';
import accessibilityService from '../../services/accessibilityService';

/**
 * AccessibleTouchableOpacity component that extends TouchableOpacity with accessibility features.
 *
 * This component adds proper accessibility attributes to TouchableOpacity components,
 * making them more accessible to users with disabilities.
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
   * Whether the touchable is currently focused
   */
  isFocused?: boolean;

  /**
   * Style to apply when the touchable is focused
   */
  focusedStyle?: any;
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
  isFocused = false,
  focusedStyle,
  style,
  children,
  ...props
}) => {
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

  // Apply focus style if focused
  const combinedStyle = [style, isFocused && [styles.focused, focusedStyle]];

  return (
    <TouchableOpacity style={combinedStyle} {...accessibilityProps} {...props}>
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
