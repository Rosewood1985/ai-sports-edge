import React, { createContext, useContext, useState, useEffect } from 'react';
import { I18nManager, Platform, NativeModules } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage key for language preference
const LANGUAGE_STORAGE_KEY = 'app_language';

// Import translations
import en from 'atomic/atoms/translations/en.json';
import es from '../translations/es.json';

// Define supported languages
export type Language = 'en' | 'es';

// Available translations
const translations = {
  en,
  es,
};

/**
 * Get the device language
 * @returns The device language code
 */
const getDeviceLanguage = (): string => {
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
  
  // Web
  if (Platform.OS === 'web' && typeof navigator !== 'undefined') {
    return navigator.language || 'en';
  }
  
  return 'en';
};

/**
 * Get language from locale
 * @param locale The locale string (e.g., 'en-US', 'es-ES')
 * @returns The language code ('en' or 'es')
 */
const getLanguageFromLocale = (locale: string): Language => {
  const langCode = locale.split('-')[0].toLowerCase();
  
  // Fix: Add better language detection for Spanish variants
  if (langCode === 'es' || locale.startsWith('es-') ||
      locale === 'spa' || locale.includes('spanish')) {
    return 'es';
  }
  
  // Default to English for all other languages
  return 'en';
};

// Default language
const DEFAULT_LANGUAGE: Language = 'en';

// Context type definition
interface I18nContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  formatNumber: (value: number, options?: Intl.NumberFormatOptions) => string;
  formatCurrency: (value: number, currencyCode?: string) => string;
  formatDate: (date: Date, options?: Intl.DateTimeFormatOptions) => string;
  isRTL: boolean;
}

// Create context with default values
const I18nContext = createContext<I18nContextType>({
  language: DEFAULT_LANGUAGE,
  setLanguage: () => {},
  t: (key) => key,
  formatNumber: (value) => String(value),
  formatCurrency: (value) => String(value),
  formatDate: (date) => date.toISOString(),
  isRTL: false,
});

/**
 * I18nProvider component
 * 
 * This component provides internationalization functionality to the app.
 * It manages the current language and provides translation and formatting functions.
 */
export const I18nProvider: React.FC<{
  children: React.ReactNode;
  initialLanguage?: Language;
}> = ({ children, initialLanguage }) => {
  // State for current language
  const [language, setLanguageState] = useState<Language>(initialLanguage || DEFAULT_LANGUAGE);
  const [isRTL, setIsRTL] = useState<boolean>(I18nManager.isRTL);
  
  // Load saved language on startup
  useEffect(() => {
    const loadSavedLanguage = async () => {
      try {
        // Try to load saved language
        const savedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
        
        if (savedLanguage && (savedLanguage === 'en' || savedLanguage === 'es')) {
          setLanguageState(savedLanguage as Language);
          
          // Update RTL status
          const isRTLLanguage = ['ar', 'he', 'ur'].includes(savedLanguage);
          setIsRTL(isRTLLanguage);
        } else if (!initialLanguage) {
          // If no saved language and no initial language provided, try to detect device language
          const deviceLocale = getDeviceLanguage();
          const detectedLanguage = getLanguageFromLocale(deviceLocale);
          
          setLanguageState(detectedLanguage);
          
          // Save detected language
          await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, detectedLanguage);
        }
      } catch (error) {
        console.error('Error loading saved language:', error);
      }
    };
    
    loadSavedLanguage();
  }, [initialLanguage]);
  
  // Set language and update RTL status
  const setLanguage = async (lang: Language) => {
    if (Object.keys(translations).includes(lang)) {
      setLanguageState(lang);
      
      // Save language preference
      try {
        await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
      } catch (error) {
        console.error('Error saving language preference:', error);
      }
      
      // Update RTL status (not needed for English/Spanish, but included for future languages)
      const isRTLLanguage = ['ar', 'he', 'ur'].includes(lang);
      setIsRTL(isRTLLanguage);
    } else {
      console.warn(`Language ${lang} is not supported. Using ${DEFAULT_LANGUAGE} instead.`);
      setLanguageState(DEFAULT_LANGUAGE);
      setIsRTL(false);
    }
  };
  
  /**
   * Translate a key with optional parameter interpolation
   */
  const t = (key: string, params?: Record<string, string | number>): string => {
    const keys = key.split('.');
    let translation: any = translations[language];
    let foundTranslation = true;
    
    // Navigate through the nested keys
    for (const k of keys) {
      if (!translation || !translation[k]) {
        foundTranslation = false;
        break;
      }
      translation = translation[k];
    }
    
    // If translation not found in current language, try fallback
    if (!foundTranslation) {
      console.warn(`Translation missing for key: ${key} in language: ${language}`);
      
      // Try English as fallback
      let fallbackTranslation: any = translations[DEFAULT_LANGUAGE];
      let foundInFallback = true;
      
      // Navigate through the nested keys in fallback
      for (const fallbackKey of keys) {
        if (!fallbackTranslation || !fallbackTranslation[fallbackKey]) {
          foundInFallback = false;
          break;
        }
        fallbackTranslation = fallbackTranslation[fallbackKey];
      }
      
      // Use fallback if found
      if (foundInFallback) {
        translation = fallbackTranslation;
      } else {
        // Return the key if translation not found in any language
        return key;
      }
    }
    
    // Return the key if translation not found
    if (!translation) return key;
    
    // Replace parameters if provided
    if (params) {
      return Object.entries(params).reduce(
        (str, [paramKey, paramValue]) =>
          str.replace(new RegExp(`{{${paramKey}}}`, 'g'), String(paramValue)),
        translation
      );
    }
    
    return translation;
  };
  
  /**
   * Format a number according to the current locale
   */
  const formatNumber = (value: number, options?: Intl.NumberFormatOptions): string => {
    const locale = language === 'en' ? 'en-US' : 'es-ES';
    return new Intl.NumberFormat(locale, options).format(value);
  };
  
  /**
   * Format a currency according to the current locale
   */
  const formatCurrency = (value: number, currencyCode = 'USD'): string => {
    return formatNumber(value, {
      style: 'currency',
      currency: currencyCode
    });
  };
  
  /**
   * Format a date according to the current locale
   */
  const formatDate = (date: Date, options?: Intl.DateTimeFormatOptions): string => {
    const locale = language === 'en' ? 'en-US' : 'es-ES';
    return new Intl.DateTimeFormat(locale, options).format(date);
  };
  
  return (
    <I18nContext.Provider
      value={{
        language,
        setLanguage,
        t,
        formatNumber,
        formatCurrency,
        formatDate,
        isRTL,
      }}
    >
      {children}
    </I18nContext.Provider>
  );
};

/**
 * Custom hook to use the I18n context
 */
export const useI18n = () => useContext(I18nContext);

export default I18nContext;