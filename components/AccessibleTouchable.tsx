import React, { useRef, useEffect } from 'react';
import {
  TouchableOpacity,
  TouchableOpacityProps,
  StyleSheet,
  StyleProp,
  ViewStyle,
  findNodeHandle,
  AccessibilityInfo,
  Platform,
} from 'react-native';
import { useThemeColor } from '../hooks/useThemeColor';
import accessibilityService from '../services/accessibilityService';

/**
 * Props for the AccessibleTouchable component
 */
interface AccessibleTouchableProps extends TouchableOpacityProps {
  /**
   * Accessibility label
   */
  accessibilityLabel: string;

  /**
   * Accessibility hint
   */
  accessibilityHint?: string;

  /**
   * Accessibility role
   */
  accessibilityRole?: 'button' | 'link' | 'checkbox' | 'radio' | 'tab' | 'switch' | 'menuitem';

  /**
   * Accessibility state
   */
  accessibilityState?: Record<string, boolean>;

  /**
   * Whether to apply high contrast styles
   */
  applyHighContrast?: boolean;

  /**
   * High contrast style overrides
   */
  highContrastStyle?: StyleProp<ViewStyle>;

  /**
   * Tab index for keyboard navigation (-1 to exclude from tab order)
   */
  tabIndex?: number;

  /**
   * Whether this element should be focused when the screen is mounted
   */
  autoFocus?: boolean;

  /**
   * ID for keyboard navigation
   */
  keyboardNavigationId?: string;

  /**
   * Next element ID for keyboard navigation
   */
  nextElementId?: string;

  /**
   * Previous element ID for keyboard navigation
   */
  prevElementId?: string;

  /**
   * Callback when element receives focus
   */
  onFocus?: () => void;

  /**
   * Callback when element loses focus
   */
  onBlur?: () => void;

  /**
   * Children
   */
  children: React.ReactNode;
}

/**
 * A touchable component that adapts to accessibility settings and supports keyboard navigation
 */
const AccessibleTouchable: React.FC<AccessibleTouchableProps> = ({
  accessibilityLabel,
  accessibilityHint,
  accessibilityRole = 'button',
  accessibilityState,
  applyHighContrast = true,
  highContrastStyle,
  style,
  children,
  tabIndex = 0,
  autoFocus = false,
  keyboardNavigationId,
  nextElementId,
  prevElementId,
  onFocus,
  onBlur,
  onPress,
  ...props
}) => {
  // Reference to the touchable element
  const touchableRef = useRef<TouchableOpacity>(null);

  // Theme colors
  const backgroundColor = useThemeColor({}, 'primaryBackground');
  const textColor = useThemeColor({}, 'primaryText');

  // Determine if high contrast should be applied
  const shouldApplyHighContrast =
    applyHighContrast &&
    (accessibilityService.getPreferences().highContrast ||
      accessibilityService.isHighContrastActive());

  // Get accessibility props
  const accessibilityProps = accessibilityService.getAccessibilityProps(
    accessibilityLabel,
    accessibilityHint,
    accessibilityRole,
    {
      ...accessibilityState,
      // Add focused state if needed
    }
  );

  // Apply high contrast styles if needed
  const appliedStyle = [
    style,
    shouldApplyHighContrast && styles.highContrast,
    shouldApplyHighContrast && highContrastStyle,
  ];

  // Register for keyboard navigation
  useEffect(() => {
    if (keyboardNavigationId) {
      accessibilityService.registerKeyboardNavigableElement(keyboardNavigationId, {
        ref: touchableRef,
        nextElementId,
        prevElementId,
        onFocus: () => {
          if (onFocus) onFocus();
        },
        onBlur: () => {
          if (onBlur) onBlur();
        },
      });

      return () => {
        accessibilityService.unregisterKeyboardNavigableElement(keyboardNavigationId);
      };
    }
  }, [keyboardNavigationId, nextElementId, prevElementId, onFocus, onBlur]);

  // Set auto focus if needed
  useEffect(() => {
    if (autoFocus && touchableRef.current) {
      const nodeHandle = findNodeHandle(touchableRef.current);
      if (nodeHandle) {
        setTimeout(() => {
          AccessibilityInfo.setAccessibilityFocus(nodeHandle);
        }, 100);
      }
    }
  }, [autoFocus]);

  // Handle key events for keyboard navigation
  const handleKeyPress = (event: any) => {
    if (!keyboardNavigationId) return;

    // Handle tab key
    if (event.key === 'Tab') {
      if (event.shiftKey) {
        // Shift+Tab - move to previous element
        if (prevElementId && onFocus) {
          // This will be replaced with proper focus management
          onFocus();
          event.preventDefault();
        }
      } else {
        // Tab - move to next element
        if (nextElementId && onFocus) {
          // This will be replaced with proper focus management
          onFocus();
          event.preventDefault();
        }
      }
    }

    // Handle arrow keys
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      if (nextElementId && onFocus) {
        // This will be replaced with proper focus management
        onFocus();
        event.preventDefault();
      }
    }

    if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      if (prevElementId && onFocus) {
        // This will be replaced with proper focus management
        onFocus();
        event.preventDefault();
      }
    }

    // Handle Enter/Space key
    if (event.key === 'Enter' || event.key === ' ') {
      if (onPress) {
        onPress(event);
        event.preventDefault();
      }
    }
  };

  // Additional props for keyboard navigation
  const keyboardProps =
    Platform.OS === 'web'
      ? {
          tabIndex: tabIndex,
          onKeyDown: handleKeyPress,
        }
      : {};

  return (
    <TouchableOpacity
      ref={touchableRef}
      style={appliedStyle}
      {...accessibilityProps}
      {...keyboardProps}
      onPress={onPress}
      {...props}
    >
      {children}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  highContrast: {
    borderWidth: 2,
    borderColor: '#000',
  },
  focused: {
    borderWidth: 2,
    borderColor: '#3B82F6', // Neon blue
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 5,
    elevation: 5,
  },
});

export default AccessibleTouchable;
