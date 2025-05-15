import React, { useEffect, useState } from 'react';
import { View, ViewProps, StyleSheet, StyleProp, ViewStyle, TextStyle, AccessibilityRole } from 'react-native';
import { useThemeColor } from '../hooks/useThemeColor';
import accessibilityService, { AccessibilityPreferences } from '../services/accessibilityService';

/**
 * Props for the AccessibleView component
 */
interface AccessibleViewProps extends ViewProps {
  /**
   * Accessibility label
   */
  accessibilityLabel?: string;
  
  /**
   * Accessibility hint
   */
  accessibilityHint?: string;
  
  /**
   * Accessibility role
   */
  accessibilityRole?: AccessibilityRole;
  
  /**
   * Accessibility state
   */
  accessibilityState?: Record<string, boolean>;
  
  /**
   * Whether to apply high contrast styles
   */
  applyHighContrast?: boolean;
  
  /**
   * Whether to apply reduced motion styles
   */
  applyReducedMotion?: boolean;
  
  /**
   * High contrast style overrides
   */
  highContrastStyle?: StyleProp<ViewStyle>;
  
  /**
   * Children
   */
  children: React.ReactNode;
  
  /**
   * Whether the component is important for accessibility
   */
  importantForAccessibility?: 'auto' | 'yes' | 'no' | 'no-hide-descendants';
}

/**
 * A view component that adapts to accessibility settings
 */
const AccessibleView: React.FC<AccessibleViewProps> = ({
  accessibilityLabel,
  accessibilityHint,
  accessibilityRole,
  accessibilityState,
  applyHighContrast = true,
  applyReducedMotion = true,
  highContrastStyle,
  style,
  children,
  importantForAccessibility,
  ...props
}) => {
  const [preferences, setPreferences] = useState<AccessibilityPreferences>(
    accessibilityService.getPreferences()
  );
  
  // Theme colors
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  
  // Subscribe to accessibility service changes
  useEffect(() => {
    const unsubscribe = accessibilityService.addListener((newPreferences) => {
      setPreferences(newPreferences);
    });
    
    return () => {
      unsubscribe();
    };
  }, []);
  
  // Determine if high contrast should be applied
  const shouldApplyHighContrast = applyHighContrast && (
    preferences.highContrast || accessibilityService.isHighContrastActive()
  );
  
  // Determine if reduced motion should be applied
  const shouldApplyReducedMotion = applyReducedMotion && (
    preferences.reduceMotion || accessibilityService.isReduceMotionActive()
  );
  
  // Get accessibility props
  const accessibilityProps = accessibilityLabel
    ? accessibilityService.getAccessibilityProps(
        accessibilityLabel,
        accessibilityHint,
        accessibilityRole,
        accessibilityState
      )
    : {};
  
  // Apply high contrast styles if needed
  const appliedStyle = [
    style,
    shouldApplyHighContrast && styles.highContrast,
    shouldApplyHighContrast && highContrastStyle
  ];
  
  return (
    <View
      style={appliedStyle}
      importantForAccessibility={importantForAccessibility}
      {...accessibilityProps}
      {...props}
    >
      {children}
    </View>
  );
};

/**
 * Props for the AccessibleText component
 */
interface AccessibleTextStyleProps {
  /**
   * Base text style
   */
  style?: StyleProp<TextStyle>;
  
  /**
   * High contrast text style
   */
  highContrastStyle?: StyleProp<TextStyle>;
  
  /**
   * Large text style
   */
  largeTextStyle?: StyleProp<TextStyle>;
  
  /**
   * Bold text style
   */
  boldTextStyle?: StyleProp<TextStyle>;
}

/**
 * Get accessible text style based on preferences
 * @param props Style props
 * @returns Accessible text style
 */
export const getAccessibleTextStyle = (props: AccessibleTextStyleProps): StyleProp<TextStyle> => {
  const { style, highContrastStyle, largeTextStyle, boldTextStyle } = props;
  
  // Get preferences
  const isHighContrast = accessibilityService.isHighContrastActive() || 
    accessibilityService.getPreferences().highContrast;
  
  const isLargeText = accessibilityService.getPreferences().largeText;
  
  const isBoldText = accessibilityService.isBoldTextActive() || 
    accessibilityService.getPreferences().boldText;
  
  // Apply styles based on preferences
  return [
    style,
    isHighContrast && [styles.highContrastText, highContrastStyle],
    isLargeText && [styles.largeText, largeTextStyle],
    isBoldText && [styles.boldText, boldTextStyle]
  ];
};

/**
 * Get accessible animation config based on preferences
 * @param defaultConfig Default animation config
 * @returns Accessible animation config
 */
export const getAccessibleAnimationConfig = (defaultConfig: any): any => {
  const isReduceMotion = accessibilityService.isReduceMotionActive() || 
    accessibilityService.getPreferences().reduceMotion;
  
  if (isReduceMotion) {
    // Reduce animation duration or disable animation
    return {
      ...defaultConfig,
      duration: 0, // Disable animation
      // Or reduce duration: Math.min(100, defaultConfig.duration || 300)
    };
  }
  
  return defaultConfig;
};

const styles = StyleSheet.create({
  highContrast: {
    borderWidth: 1,
    borderColor: '#000',
  },
  highContrastText: {
    color: '#000',
    backgroundColor: '#fff',
  },
  largeText: {
    fontSize: 18, // Base size, will be scaled
  },
  boldText: {
    fontWeight: 'bold',
  },
});

export default AccessibleView;