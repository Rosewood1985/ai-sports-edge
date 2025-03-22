import React, { createContext, useContext, useState, useEffect } from 'react';
import { I18nManager } from 'react-native';

// Import translations
import en from '../translations/en.json';
import es from '../translations/es.json';

// Define supported languages
export type Language = 'en' | 'es';

// Available translations
const translations = {
  en,
  es,
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
export const I18nProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  // State for current language
  const [language, setLanguageState] = useState<Language>(DEFAULT_LANGUAGE);
  const [isRTL, setIsRTL] = useState<boolean>(I18nManager.isRTL);
  
  // Set language and update RTL status
  const setLanguage = (lang: Language) => {
    if (Object.keys(translations).includes(lang)) {
      setLanguageState(lang);
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
    
    // Navigate through the nested keys
    for (const k of keys) {
      if (!translation || !translation[k]) {
        // Fallback to English if translation not found
        translation = translations[DEFAULT_LANGUAGE];
        for (const fallbackKey of keys) {
          if (!translation || !translation[fallbackKey]) {
            return key; // Return the key if translation not found
          }
          translation = translation[fallbackKey];
        }
        break;
      }
      translation = translation[k];
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