import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';
import i18n from 'i18n-js';
import React, { createContext, useState, useEffect, useContext } from 'react';
import { I18nManager } from 'react-native';

// Define a more accurate type for i18n that matches how we're using it
// This is necessary because the TypeScript definitions from the library don't match our usage
interface I18nExtended {
  translations: Record<string, any>;
  fallbacks: boolean;
  defaultLocale: string;
  locale: string;
  t: (key: string, options?: any) => string;
}

// Cast i18n to our extended interface
const i18nExt = i18n as unknown as I18nExtended;

// Define available languages
export const LANGUAGES = {
  en: { code: 'en', name: 'English', direction: 'ltr' },
  es: { code: 'es', name: 'Español', direction: 'ltr' },
};

// Initialize empty translations
i18nExt.translations = {};

// Lazy load translations
const loadTranslations = async (languageCode: string): Promise<any> => {
  console.log(`LanguageContext: Loading translations for ${languageCode}`);
  // Check if translations are already loaded
  if (i18nExt.translations[languageCode]) {
    console.log(`LanguageContext: Translations for ${languageCode} already loaded`);
    return i18nExt.translations[languageCode];
  }

  try {
    // Dynamically import the translation file
    console.log(`LanguageContext: Dynamically importing translations for ${languageCode}`);
    let translations;
    switch (languageCode) {
      case 'en':
        translations = (await import('../translations/en.json')).default;
        break;
      case 'es':
        translations = (await import('../translations/es.json')).default;
        break;
      default:
        console.log(
          `LanguageContext: Unknown language code ${languageCode}, falling back to English`
        );
        translations = (await import('../translations/en.json')).default;
    }

    // Cache the translations
    console.log(`LanguageContext: Caching translations for ${languageCode}`);
    i18nExt.translations[languageCode] = translations;
    return translations;
  } catch (error) {
    console.error(`LanguageContext: Error loading translations for ${languageCode}:`, error);
    // Fallback to English if there's an error
    if (languageCode !== 'en') {
      console.log(`LanguageContext: Falling back to English translations due to error`);
      return loadTranslations('en');
    }
    return {};
  }
};

// Set fallback language
console.log('LanguageContext: Setting fallback language options');
i18nExt.fallbacks = true;
i18nExt.defaultLocale = 'en';

// Storage key for language preference
const LANGUAGE_PREFERENCE_KEY = 'user_language_preference';

// Create the language context
interface LanguageContextType {
  language: string;
  setLanguage: (language: string) => Promise<void>;
  t: (key: string, options?: any) => string;
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
      console.log('LanguageContext: Starting language initialization');
      try {
        // Start performance measurement
        const startTime = Date.now();

        // Try to get stored language preference
        console.log('LanguageContext: Retrieving stored language preference');
        let storedLanguage;
        try {
          storedLanguage = await AsyncStorage.getItem(LANGUAGE_PREFERENCE_KEY);
          console.log(`LanguageContext: Retrieved stored language: ${storedLanguage || 'none'}`);
        } catch (storageError) {
          console.error('LanguageContext: Error accessing AsyncStorage:', storageError);
          storedLanguage = null;
        }

        let languageToUse: string;

        if (storedLanguage && LANGUAGES[storedLanguage as keyof typeof LANGUAGES]) {
          // Use stored preference if available
          languageToUse = storedLanguage;
          console.log(`LanguageContext: Using stored language preference: ${languageToUse}`);
        } else {
          // Otherwise use device locale
          console.log(`LanguageContext: No valid stored preference, checking device locale`);
          const deviceLocale = Localization.locale.split('-')[0];
          console.log(`LanguageContext: Device locale is: ${deviceLocale}`);

          languageToUse = LANGUAGES[deviceLocale as keyof typeof LANGUAGES] ? deviceLocale : 'en';
          console.log(`LanguageContext: Selected language to use: ${languageToUse}`);
        }

        // Set the language
        console.log(`LanguageContext: Changing language to: ${languageToUse}`);
        await changeLanguage(languageToUse);

        // Log performance metrics in development
        if (__DEV__) {
          const endTime = Date.now();
          console.log(`LanguageContext: Language initialization took ${endTime - startTime}ms`);
        }
      } catch (error) {
        console.error('LanguageContext: Error initializing language:', error);
        // Default to English on error
        console.log('LanguageContext: Falling back to English due to error');
        try {
          await changeLanguage('en');
        } catch (fallbackError) {
          console.error(
            'LanguageContext: Critical error - even fallback to English failed:',
            fallbackError
          );
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

      // Load translations if not already loaded
      await loadTranslations(languageCode);

      // Update i18n locale
      console.log(`LanguageContext: Setting i18n locale to ${languageCode}`);
      i18nExt.locale = languageCode;

      // Check if RTL
      const isRightToLeft = LANGUAGES[languageCode as keyof typeof LANGUAGES].direction === 'rtl';
      console.log(`LanguageContext: Language direction is ${isRightToLeft ? 'RTL' : 'LTR'}`);
      setIsRTL(isRightToLeft);

      // Update React Native's RTL handling
      if (I18nManager.isRTL !== isRightToLeft) {
        console.log(`LanguageContext: Updating RTL setting to ${isRightToLeft}`);
        I18nManager.forceRTL(isRightToLeft);
        console.log(
          'LanguageContext: RTL setting updated. Note: App reload may be needed for full effect'
        );
        // Note: In a real app, you might want to reload the app here
        // to ensure RTL changes take effect properly
      }

      // Save preference
      console.log(`LanguageContext: Saving language preference to AsyncStorage: ${languageCode}`);
      await AsyncStorage.setItem(LANGUAGE_PREFERENCE_KEY, languageCode);

      // Update state
      console.log(`LanguageContext: Updating language state to ${languageCode}`);
      setLanguageState(languageCode);

      // Log performance metrics in development
      if (__DEV__) {
        console.log(`LanguageContext: Language changed to ${languageCode}`);
        console.log(
          `LanguageContext: Translation object size: ${JSON.stringify(i18nExt.translations[languageCode]).length} bytes`
        );
      }
    } catch (error) {
      console.error('Error changing language:', error);
      throw error;
    }
  };

  // Translation function
  const translate = (key: string, options?: any) => {
    console.log(`LanguageContext: Translating key: ${key}`);
    return i18nExt.t(key, options);
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
