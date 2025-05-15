import { AccessibilityInfo, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { analyticsService } from './analyticsService';

/**
 * Accessibility preferences
 */
export interface AccessibilityPreferences {
  /**
   * Whether to use larger text
   */
  largeText: boolean;
  
  /**
   * Whether to use high contrast
   */
  highContrast: boolean;
  
  /**
   * Whether to reduce motion
   */
  reduceMotion: boolean;
  
  /**
   * Whether to use screen reader hints
   */
  screenReaderHints: boolean;
  
  /**
   * Whether to use bold text
   */
  boldText: boolean;
  
  /**
   * Whether to use grayscale
   */
  grayscale: boolean;
  
  /**
   * Whether to invert colors
   */
  invertColors: boolean;
}

/**
 * Default accessibility preferences
 */
const DEFAULT_PREFERENCES: AccessibilityPreferences = {
  largeText: false,
  highContrast: false,
  reduceMotion: false,
  screenReaderHints: true,
  boldText: false,
  grayscale: false,
  invertColors: false
};

/**
 * Service for managing accessibility features
 */
class AccessibilityService {
  private static readonly PREFERENCES_KEY = '@AISportsEdge:accessibilityPreferences';
  
  private preferences: AccessibilityPreferences = { ...DEFAULT_PREFERENCES };
  private isScreenReaderEnabled: boolean = false;
  private isBoldTextEnabled: boolean = false;
  private isReduceMotionEnabled: boolean = false;
  private isReduceTransparencyEnabled: boolean = false;
  private isInvertColorsEnabled: boolean = false;
  private isGrayscaleEnabled: boolean = false;
  private listeners: Array<(preferences: AccessibilityPreferences) => void> = [];
  private systemListeners: Array<() => void> = [];
  
  /**
   * Initialize the accessibility service
   */
  async initialize(): Promise<void> {
    try {
      // Load preferences
      await this.loadPreferences();
      
      // Check system settings
      await this.checkSystemSettings();
      
      // Subscribe to system setting changes
      this.subscribeToSystemChanges();
      
      console.log('Accessibility service initialized');
    } catch (error) {
      console.error('Error initializing accessibility service:', error);
      analyticsService.trackError(error as Error, { method: 'initialize' });
    }
  }
  
  /**
   * Clean up the accessibility service
   */
  cleanup(): void {
    // Unsubscribe from system setting changes
    this.unsubscribeFromSystemChanges();
    
    // Clear listeners
    this.listeners = [];
    
    console.log('Accessibility service cleaned up');
  }
  
  /**
   * Get accessibility preferences
   * @returns Accessibility preferences
   */
  getPreferences(): AccessibilityPreferences {
    return { ...this.preferences };
  }
  
  /**
   * Update accessibility preferences
   * @param preferences New preferences
   * @returns Promise that resolves when preferences are updated
   */
  async updatePreferences(preferences: Partial<AccessibilityPreferences>): Promise<void> {
    try {
      // Merge with existing preferences
      this.preferences = {
        ...this.preferences,
        ...preferences
      };
      
      // Save preferences
      await this.savePreferences();
      
      // Notify listeners
      this.notifyListeners();
      
      console.log('Accessibility preferences updated');
      
      // Track event
      analyticsService.trackEvent('accessibility_preferences_updated', preferences);
    } catch (error) {
      console.error('Error updating accessibility preferences:', error);
      analyticsService.trackError(error as Error, { method: 'updatePreferences' });
    }
  }
  
  /**
   * Reset accessibility preferences to default
   * @returns Promise that resolves when preferences are reset
   */
  async resetPreferences(): Promise<void> {
    try {
      this.preferences = { ...DEFAULT_PREFERENCES };
      await this.savePreferences();
      
      // Notify listeners
      this.notifyListeners();
      
      console.log('Accessibility preferences reset to default');
      
      // Track event
      analyticsService.trackEvent('accessibility_preferences_reset');
    } catch (error) {
      console.error('Error resetting accessibility preferences:', error);
      analyticsService.trackError(error as Error, { method: 'resetPreferences' });
    }
  }
  
  /**
   * Add listener for preference changes
   * @param listener Function to call when preferences change
   * @returns Function to remove the listener
   */
  addListener(listener: (preferences: AccessibilityPreferences) => void): () => void {
    this.listeners.push(listener);
    
    // Notify listener immediately
    listener(this.getPreferences());
    
    // Return function to remove the listener
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }
  
  /**
   * Check if screen reader is enabled
   * @returns Whether screen reader is enabled
   */
  isScreenReaderActive(): boolean {
    return this.isScreenReaderEnabled;
  }
  
  /**
   * Check if bold text is enabled
   * @returns Whether bold text is enabled
   */
  isBoldTextActive(): boolean {
    return this.isBoldTextEnabled || this.preferences.boldText;
  }
  
  /**
   * Check if reduce motion is enabled
   * @returns Whether reduce motion is enabled
   */
  isReduceMotionActive(): boolean {
    return this.isReduceMotionEnabled || this.preferences.reduceMotion;
  }
  
  /**
   * Check if high contrast is enabled
   * @returns Whether high contrast is enabled
   */
  isHighContrastActive(): boolean {
    return this.isReduceTransparencyEnabled || this.preferences.highContrast;
  }
  
  /**
   * Check if grayscale is enabled
   * @returns Whether grayscale is enabled
   */
  isGrayscaleActive(): boolean {
    return this.isGrayscaleEnabled || this.preferences.grayscale;
  }
  
  /**
   * Check if invert colors is enabled
   * @returns Whether invert colors is enabled
   */
  isInvertColorsActive(): boolean {
    return this.isInvertColorsEnabled || this.preferences.invertColors;
  }
  
  /**
   * Get font scale factor
   * @returns Font scale factor
   */
  getFontScale(): number {
    return this.preferences.largeText ? 1.3 : 1.0;
  }
  
  /**
   * Get screen reader hint for an element
   * @param element Element name
   * @param hint Hint text
   * @returns Hint text if screen reader hints are enabled, empty string otherwise
   */
  getScreenReaderHint(element: string, hint: string): string {
    if (!this.preferences.screenReaderHints) {
      return '';
    }
    
    return hint;
  }
  
  /**
   * Get accessibility props for a component
   * @param label Accessibility label
   * @param hint Accessibility hint
   * @param role Accessibility role
   * @param state Accessibility state
   * @returns Accessibility props
   */
  getAccessibilityProps(
    label: string,
    hint?: string,
    role?: string,
    state?: Record<string, boolean>
  ): Record<string, any> {
    const props: Record<string, any> = {
      accessible: true,
      accessibilityLabel: label
    };
    
    if (hint && this.preferences.screenReaderHints) {
      props.accessibilityHint = hint;
    }
    
    if (role) {
      if (Platform.OS === 'ios') {
        props.accessibilityRole = role;
      } else {
        props.accessibilityRole = role;
      }
    }
    
    if (state) {
      if (Platform.OS === 'ios') {
        props.accessibilityState = state;
      } else {
        props.accessibilityState = state;
      }
    }
    
    return props;
  }
  
  /**
   * Load preferences from storage
   * @returns Promise that resolves when preferences are loaded
   */
  private async loadPreferences(): Promise<void> {
    try {
      const preferencesJson = await AsyncStorage.getItem(AccessibilityService.PREFERENCES_KEY);
      
      if (preferencesJson) {
        this.preferences = {
          ...DEFAULT_PREFERENCES,
          ...JSON.parse(preferencesJson)
        };
        
        console.log('Loaded accessibility preferences');
      } else {
        this.preferences = { ...DEFAULT_PREFERENCES };
        console.log('No saved accessibility preferences found, using defaults');
      }
    } catch (error) {
      console.error('Error loading accessibility preferences:', error);
      this.preferences = { ...DEFAULT_PREFERENCES };
    }
  }
  
  /**
   * Save preferences to storage
   * @returns Promise that resolves when preferences are saved
   */
  private async savePreferences(): Promise<void> {
    try {
      await AsyncStorage.setItem(
        AccessibilityService.PREFERENCES_KEY,
        JSON.stringify(this.preferences)
      );
      
      console.log('Saved accessibility preferences');
    } catch (error) {
      console.error('Error saving accessibility preferences:', error);
    }
  }
  
  /**
   * Check system accessibility settings
   * @returns Promise that resolves when settings are checked
   */
  private async checkSystemSettings(): Promise<void> {
    try {
      // Check screen reader
      this.isScreenReaderEnabled = await AccessibilityInfo.isScreenReaderEnabled();
      
      // Check other settings
      if (Platform.OS === 'ios') {
        this.isBoldTextEnabled = await AccessibilityInfo.isBoldTextEnabled();
        this.isGrayscaleEnabled = await AccessibilityInfo.isGrayscaleEnabled();
        this.isInvertColorsEnabled = await AccessibilityInfo.isInvertColorsEnabled();
        this.isReduceMotionEnabled = await AccessibilityInfo.isReduceMotionEnabled();
        this.isReduceTransparencyEnabled = await AccessibilityInfo.isReduceTransparencyEnabled();
      } else {
        // Android doesn't support all these settings
        this.isReduceMotionEnabled = await AccessibilityInfo.isReduceMotionEnabled();
        
        // Set others to false
        this.isBoldTextEnabled = false;
        this.isGrayscaleEnabled = false;
        this.isInvertColorsEnabled = false;
        this.isReduceTransparencyEnabled = false;
      }
      
      console.log('Checked system accessibility settings');
    } catch (error) {
      console.error('Error checking system accessibility settings:', error);
    }
  }
  
  /**
   * Subscribe to system accessibility setting changes
   */
  private subscribeToSystemChanges(): void {
    // Screen reader
    const screenReaderListener = AccessibilityInfo.addEventListener(
      'screenReaderChanged',
      (isEnabled) => {
        this.isScreenReaderEnabled = isEnabled;
        this.notifyListeners();
      }
    );
    
    // Other settings (iOS only)
    if (Platform.OS === 'ios') {
      // Bold text
      const boldTextListener = AccessibilityInfo.addEventListener(
        'boldTextChanged',
        (isEnabled) => {
          this.isBoldTextEnabled = isEnabled;
          this.notifyListeners();
        }
      );
      
      // Grayscale
      const grayscaleListener = AccessibilityInfo.addEventListener(
        'grayscaleChanged',
        (isEnabled) => {
          this.isGrayscaleEnabled = isEnabled;
          this.notifyListeners();
        }
      );
      
      // Invert colors
      const invertColorsListener = AccessibilityInfo.addEventListener(
        'invertColorsChanged',
        (isEnabled) => {
          this.isInvertColorsEnabled = isEnabled;
          this.notifyListeners();
        }
      );
      
      // Reduce motion
      const reduceMotionListener = AccessibilityInfo.addEventListener(
        'reduceMotionChanged',
        (isEnabled) => {
          this.isReduceMotionEnabled = isEnabled;
          this.notifyListeners();
        }
      );
      
      // Reduce transparency
      const reduceTransparencyListener = AccessibilityInfo.addEventListener(
        'reduceTransparencyChanged',
        (isEnabled) => {
          this.isReduceTransparencyEnabled = isEnabled;
          this.notifyListeners();
        }
      );
      
      // Add to system listeners
      this.systemListeners.push(
        screenReaderListener.remove,
        boldTextListener.remove,
        grayscaleListener.remove,
        invertColorsListener.remove,
        reduceMotionListener.remove,
        reduceTransparencyListener.remove
      );
    } else {
      // Android only supports reduce motion
      const reduceMotionListener = AccessibilityInfo.addEventListener(
        'reduceMotionChanged',
        (isEnabled) => {
          this.isReduceMotionEnabled = isEnabled;
          this.notifyListeners();
        }
      );
      
      // Add to system listeners
      this.systemListeners.push(
        screenReaderListener.remove,
        reduceMotionListener.remove
      );
    }
    
    console.log('Subscribed to system accessibility setting changes');
  }
  
  /**
   * Unsubscribe from system accessibility setting changes
   */
  private unsubscribeFromSystemChanges(): void {
    // Remove all listeners
    this.systemListeners.forEach(remove => remove());
    this.systemListeners = [];
    
    console.log('Unsubscribed from system accessibility setting changes');
  }
  
  /**
   * Notify listeners of preference changes
   */
  private notifyListeners(): void {
    const preferences = this.getPreferences();
    
    this.listeners.forEach(listener => {
      try {
        listener(preferences);
      } catch (error) {
        console.error('Error in accessibility preference listener:', error);
      }
    });
  }
}

export const accessibilityService = new AccessibilityService();
export default accessibilityService;