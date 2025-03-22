import React, { useEffect } from 'react';
import { NativeEventEmitter, NativeModules, Platform } from 'react-native';
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
      
      const subscription = localeEmitter.addListener(
        'localeChanged',
        (event) => {
          const newLocale = event.locale || getDeviceLocale();
          const newLanguage = getLanguageFromLocale(newLocale);
          
          if (newLanguage !== language) {
            setLanguage(newLanguage);
          }
        }
      );
      
      return () => {
        subscription.remove();
      };
    } catch (error) {
      console.warn('Could not set up locale change listener:', error);
      
      // Fallback: Check for locale changes periodically
      const intervalId = setInterval(() => {
        const deviceLanguage = getLanguageFromLocale(getDeviceLocale());
        if (deviceLanguage !== language) {
          setLanguage(deviceLanguage);
        }
      }, 5000); // Check every 5 seconds
      
      return () => {
        clearInterval(intervalId);
      };
    }
  }, [language, setLanguage]);
  
  // This component doesn't render anything
  return null;
};

export default LanguageChangeListener;