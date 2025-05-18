import React, { useEffect } from 'react';
import { Platform, NativeModules } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';

// Import types from config
import { seoConfig } from '../config/seo';

// No need for global declarations as these types are already defined in lib.dom.d.ts

// Define supported languages
import { Language } from '../config/seo';

interface LanguageRedirectProps {
  currentLanguage: Language;
  setLanguage: (language: Language) => void;
}

/**
 * LanguageRedirect component
 *
 * This component handles URL-based language selection and redirection.
 * It extracts the language from the URL path and sets the application language accordingly.
 * If no language is specified in the URL, it redirects to a language-specific URL based on the device locale.
 */
export const LanguageRedirect: React.FC<LanguageRedirectProps> = ({
  currentLanguage,
  setLanguage,
}) => {
  const navigation = useNavigation();
  const route = useRoute();

  // Get device locale
  const getDeviceLocale = (): string => {
    // iOS
    if (Platform.OS === 'ios') {
      return (
        NativeModules.SettingsManager.settings.AppleLocale ||
        NativeModules.SettingsManager.settings.AppleLanguages[0] ||
        'en'
      );
    }
    // Android
    if (Platform.OS === 'android') {
      return NativeModules.I18nManager.localeIdentifier || 'en';
    }
    // Web - use navigator.language if available
    if (Platform.OS === 'web' && typeof navigator !== 'undefined') {
      return navigator.language || 'en';
    }

    return 'en'; // Default to English
  };

  useEffect(() => {
    // Only run on web platform
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      try {
        // Extract language from URL path
        const path = window.location.pathname;
        const pathSegments = path.split('/').filter((segment: string) => segment.length > 0);
        const pathLang = pathSegments.length > 0 ? pathSegments[0] : '';

        if (pathLang === 'en' || pathLang === 'es') {
          // Set language based on URL
          if (pathLang !== currentLanguage) {
            setLanguage(pathLang as Language);
          }
        } else {
          // Determine language based on device locale
          const deviceLocale = getDeviceLocale();
          const langCode = deviceLocale.split('-')[0].toLowerCase();
          const regionCode = deviceLocale.split('-')[1]?.toUpperCase();

          let redirectLang: Language = 'en';

          // Handle Spanish variants
          if (langCode === 'es') {
            if (regionCode === 'US') redirectLang = 'es-US';
            else if (regionCode === 'MX') redirectLang = 'es-MX';
            else if (regionCode === 'ES') redirectLang = 'es-ES';
            else redirectLang = 'es'; // Default to generic Spanish
          }

          if (redirectLang !== currentLanguage) {
            setLanguage(redirectLang);
          }

          // Redirect to language-specific URL
          const newPath = `/${redirectLang}${path === '/' ? '' : path}`;
          window.history.replaceState(null, '', newPath);
        }
      } catch (error) {
        console.error('Error in LanguageRedirect:', error);
      }
    } else {
      // For native platforms, use the device locale with region detection
      const deviceLocale = getDeviceLocale();
      const langCode = deviceLocale.split('-')[0].toLowerCase();
      const regionCode = deviceLocale.split('-')[1]?.toUpperCase();

      let detectedLang: Language = 'en';

      // Handle Spanish variants
      if (langCode === 'es') {
        if (regionCode === 'US') detectedLang = 'es-US';
        else if (regionCode === 'MX') detectedLang = 'es-MX';
        else if (regionCode === 'ES') detectedLang = 'es-ES';
        else detectedLang = 'es'; // Default to generic Spanish
      }

      if (detectedLang !== currentLanguage) {
        setLanguage(detectedLang);
      }
    }
  }, [currentLanguage, setLanguage]);

  return null;
};
