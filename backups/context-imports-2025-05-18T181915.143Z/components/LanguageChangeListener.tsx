import React, { useEffect } from 'react';
import { NativeEventEmitter, NativeModules, Platform, AppState } from 'react-native';

import { useI18n } from '../contexts/I18nContext';

/**
 * LanguageChangeListener component
 *
 * This component listens for device language changes on iOS and updates
 * the app language accordingly. It ensures that the app language stays
 * in sync with the device language.
 */
const LanguageChangeListener: React.FC = () => {
  const { language, setLanguage } = useI18n();

  useEffect(() => {
    // Only run on iOS
    if (Platform.OS !== 'ios') {
      return;
    }

    // Get the current device locale
    const getDeviceLocale = (): string => {
      return (
        NativeModules.SettingsManager.settings.AppleLocale ||
        NativeModules.SettingsManager.settings.AppleLanguages[0] ||
        'en'
      );
    };

    // Convert locale to language code (e.g., 'en-US' -> 'en')
    const getLanguageFromLocale = (locale: string): 'en' | 'es' => {
      const langCode = locale.split('-')[0].toLowerCase();
      return langCode === 'es' ? 'es' : 'en'; // Default to English for unsupported languages
    };

    // Set initial language based on device locale
    const deviceLanguage = getLanguageFromLocale(getDeviceLocale());
    if (deviceLanguage !== language) {
      setLanguage(deviceLanguage);
    }

    // Set up event listener for locale changes
    // Note: This requires additional setup in the native iOS code
    // to emit events when the locale changes
    try {
      const localeEmitter = new NativeEventEmitter(NativeModules.LocaleManager);

      const subscription = localeEmitter.addListener('localeChanged', event => {
        const newLocale = event.locale || getDeviceLocale();
        const newLanguage = getLanguageFromLocale(newLocale);

        if (newLanguage !== language) {
          setLanguage(newLanguage);
        }
      });

      return () => {
        subscription.remove();
      };
    } catch (error) {
      console.warn('Could not set up locale change listener:', error);

      // Improved fallback strategy:
      // 1. Check less frequently (30 seconds instead of 5)
      // 2. Add AppState listener to check when app comes to foreground

      // Set up AppState listener for iOS
      const handleAppStateChange = (nextAppState: string) => {
        if (nextAppState === 'active') {
          // Check language when app comes to foreground
          const deviceLanguage = getLanguageFromLocale(getDeviceLocale());
          if (deviceLanguage !== language) {
            setLanguage(deviceLanguage);
          }
        }
      };

      // Add AppState listener using the newer API
      const subscription = AppState.addEventListener('change', handleAppStateChange);

      // Still keep a less frequent interval check as a backup
      const intervalId = setInterval(() => {
        const deviceLanguage = getLanguageFromLocale(getDeviceLocale());
        if (deviceLanguage !== language) {
          setLanguage(deviceLanguage);
        }
      }, 30000); // Check every 30 seconds instead of 5

      return () => {
        // Clean up both listeners
        clearInterval(intervalId);
        subscription.remove(); // Use the subscription object to remove the listener
      };
    }
  }, [language, setLanguage]);

  // This component doesn't render anything
  return null;
};

export default LanguageChangeListener;
