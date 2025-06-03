import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useState, useEffect, useContext } from 'react';
import { I18nManager, Platform, NativeModules } from 'react-native';

// Import translations directly
import { en, es } from '../../atoms/translations';

// Define available languages
export const LANGUAGES = {
  en: { code: 'en', name: 'English', direction: 'ltr' },
  es: { code: 'es', name: 'Español', direction: 'ltr' },
};

// Type for translations
type TranslationsType = {
  en: Record<string, any>;
  es: Record<string, any>;
};

// Simple i18n implementation to avoid dependency issues
const i18n = {
  translations: {
    en,
    es,
  } as TranslationsType,
  locale: 'en',
  fallbacks: true,
  defaultLocale: 'en',
  t(key: string, options?: Record<string, any>): string {
    try {
      const keys = key.split('.');
      const translationObj = this.locale === 'en' ? this.translations.en : this.translations.es;

      // Navigate through the nested keys
      let result = translationObj;
      for (const k of keys) {
        if (result && typeof result === 'object' && k in result) {
          result = result[k];
        } else {
          // Try fallback to English
          if (this.fallbacks && this.locale !== 'en') {
            let fallbackResult = this.translations.en;
            let fallbackFound = true;

            for (const fallbackKey of keys) {
              if (
                fallbackResult &&
                typeof fallbackResult === 'object' &&
                fallbackKey in fallbackResult
              ) {
                fallbackResult = fallbackResult[fallbackKey];
              } else {
                fallbackFound = false;
                break;
              }
            }

            if (fallbackFound && typeof fallbackResult === 'string') {
              return options ? interpolate(fallbackResult, options) : fallbackResult;
            }
          }

          // Return key if translation not found
          return key;
        }
      }

      // Return the translation if it's a string
      if (typeof result === 'string') {
        return options ? interpolate(result, options) : result;
      }

      // Return key if result is not a string
      return key;
    } catch (error) {
      console.error(`Error translating key: ${key}`, error);
      return key;
    }
  },
};

// Helper function for interpolation
function interpolate(text: string, params: Record<string, any>): string {
  return Object.entries(params).reduce(
    (str, [paramKey, paramValue]) =>
      str.replace(new RegExp(`{{${paramKey}}}`, 'g'), String(paramValue)),
    text
  );
}

/**
 * Get the device language
 * @returns The device language code
 */
const getDeviceLanguage = (): string => {
  // iOS
  if (Platform.OS === 'ios') {
    return (
      NativeModules.SettingsManager?.settings?.AppleLocale ||
      NativeModules.SettingsManager?.settings?.AppleLanguages?.[0] ||
      'en'
    );
  }

  // Android
  if (Platform.OS === 'android') {
    return NativeModules.I18nManager?.localeIdentifier || 'en';
  }

  // Web
  if (Platform.OS === 'web' && typeof navigator !== 'undefined') {
    return navigator.language || 'en';
  }

  return 'en';
};

// Storage key for language preference
const LANGUAGE_PREFERENCE_KEY = 'user_language_preference';

// Create the language context
interface LanguageContextType {
  language: string;
  setLanguage: (language: string) => Promise<void>;
  t: (key: string, options?: Record<string, any>) => string;
  isRTL: boolean;
  availableLanguages: typeof LANGUAGES;
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  setLanguage: async () => {},
  t: (key: string) => key,
  isRTL: false,
  availableLanguages: LANGUAGES,
});

export const useLanguage = () => useContext(LanguageContext);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState('en');
  const [isRTL, setIsRTL] = useState(false);

  // Initialize language on app start
  useEffect(() => {
    const initializeLanguage = async () => {
      try {
        // Try to get stored language preference
        let storedLanguage;
        try {
          storedLanguage = await AsyncStorage.getItem(LANGUAGE_PREFERENCE_KEY);
        } catch (storageError) {
          console.error('Error accessing AsyncStorage:', storageError);
          storedLanguage = null;
        }

        let languageToUse: string;

        if (storedLanguage && LANGUAGES[storedLanguage as keyof typeof LANGUAGES]) {
          // Use stored preference if available
          languageToUse = storedLanguage;
        } else {
          // Otherwise use device locale
          const deviceLocale = getDeviceLanguage().split('-')[0];

          languageToUse = LANGUAGES[deviceLocale as keyof typeof LANGUAGES] ? deviceLocale : 'en';
        }

        // Set the language
        await changeLanguage(languageToUse);
      } catch (error) {
        console.error('Error initializing language:', error);
        // Default to English on error
        try {
          await changeLanguage('en');
        } catch (fallbackError) {
          console.error('Critical error - even fallback to English failed:', fallbackError);
        }
      }
    };

    initializeLanguage();
  }, []);

  // Change language function
  const changeLanguage = async (languageCode: string) => {
    try {
      // Validate language code
      if (!LANGUAGES[languageCode as keyof typeof LANGUAGES]) {
        throw new Error(`Unsupported language: ${languageCode}`);
      }

      // Update i18n locale
      i18n.locale = languageCode;

      // Check if RTL
      const isRightToLeft = LANGUAGES[languageCode as keyof typeof LANGUAGES].direction === 'rtl';
      setIsRTL(isRightToLeft);

      // Update React Native's RTL handling
      if (I18nManager.isRTL !== isRightToLeft) {
        I18nManager.forceRTL(isRightToLeft);
        // Note: In a real app, you might want to reload the app here
        // to ensure RTL changes take effect properly
      }

      // Save preference
      await AsyncStorage.setItem(LANGUAGE_PREFERENCE_KEY, languageCode);

      // Update state
      setLanguageState(languageCode);

      // Log performance metrics in development
      if (__DEV__) {
        console.log(`Language changed to ${languageCode}`);
      }
    } catch (error) {
      console.error('Error changing language:', error);
      throw error;
    }
  };

  // Translation function
  const translate = (key: string, options?: Record<string, any>) => {
    return i18n.t(key, options);
  };

  const contextValue: LanguageContextType = {
    language,
    setLanguage: changeLanguage,
    t: translate,
    isRTL,
    availableLanguages: LANGUAGES,
  };

  return <LanguageContext.Provider value={contextValue}>{children}</LanguageContext.Provider>;
};

export default LanguageContext;
