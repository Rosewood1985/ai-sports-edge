import React, { useEffect } from 'react';
import { Platform, NativeModules } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';

// Type declarations for web-specific globals
declare global {
  interface Window {
    location: {
      pathname: string;
    };
    history: {
      replaceState(data: any, unused: string, url?: string): void;
    };
  }

  interface Navigator {
    language: string;
  }

  var window: Window | undefined;
  var navigator: Navigator | undefined;
}

// Define supported languages
export type Language = 'en' | 'es';

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
  setLanguage 
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
          const deviceLocale = getDeviceLocale().split('-')[0];
          const redirectLang = deviceLocale === 'es' ? 'es' : 'en';
          
          if (redirectLang !== currentLanguage) {
            setLanguage(redirectLang as Language);
          }
          
          // Redirect to language-specific URL
          const newPath = `/${redirectLang}${path === '/' ? '' : path}`;
          window.history.replaceState(null, '', newPath);
        }
      } catch (error) {
        console.error('Error in LanguageRedirect:', error);
      }
    } else {
      // For native platforms, just use the device locale
      const deviceLocale = getDeviceLocale().split('-')[0];
      const detectedLang = deviceLocale === 'es' ? 'es' : 'en';
      
      if (detectedLang !== currentLanguage) {
        setLanguage(detectedLang as Language);
      }
    }
  }, [currentLanguage, setLanguage]);
  
  return null;
};