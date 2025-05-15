import { useState, useEffect } from 'react';
import { accessibilityService, AccessibilityPreferences } from '../services/accessibilityService';

/**
 * Hook for using the accessibility service
 * @returns Accessibility service methods and state
 */
export const useAccessibilityService = () => {
  const [preferences, setPreferences] = useState<AccessibilityPreferences>(
    accessibilityService.getPreferences()
  );

  useEffect(() => {
    // Subscribe to preference changes
    const unsubscribe = accessibilityService.addListener(setPreferences);
    
    // Unsubscribe on cleanup
    return unsubscribe;
  }, []);

  return {
    // Preferences
    preferences,
    
    // Update methods
    updatePreferences: accessibilityService.updatePreferences.bind(accessibilityService),
    resetPreferences: accessibilityService.resetPreferences.bind(accessibilityService),
    
    // Status checks
    isScreenReaderEnabled: accessibilityService.isScreenReaderActive(),
    isBoldTextEnabled: accessibilityService.isBoldTextActive(),
    isReducedMotionEnabled: accessibilityService.isReduceMotionActive(),
    isHighContrastEnabled: accessibilityService.isHighContrastActive(),
    isGrayscaleEnabled: accessibilityService.isGrayscaleActive(),
    isInvertColorsEnabled: accessibilityService.isInvertColorsActive(),
    
    // Helper methods
    getFontScale: accessibilityService.getFontScale.bind(accessibilityService),
    getScreenReaderHint: accessibilityService.getScreenReaderHint.bind(accessibilityService),
    getAccessibilityProps: accessibilityService.getAccessibilityProps.bind(accessibilityService),
  };
};

export default useAccessibilityService;