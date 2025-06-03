import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Import translations
import enTranslations from './translations/en.json';
import esTranslations from './translations/es.json';

// Language resources
const resources = {
  en: {
    translation: enTranslations,
  },
  es: {
    translation: esTranslations,
  },
};

// Language storage key
const LANGUAGE_KEY = 'user_language';

// Initialize i18next
i18n
  .use(initReactI18next) // passes i18n down to react-i18next
  .init({
    resources,
    lng: Localization.locale.split('-')[0], // language to use, more information here: https://www.i18next.com/overview/configuration-options#languages-namespaces-resources
    fallbackLng: 'en', // language to use if translations in user language are not available
    interpolation: {
      escapeValue: false, // react already safes from xss
    },
    compatibilityJSON: 'v3',
  });

// Function to get the user's preferred language
export async function getLanguage(): Promise<string> {
  try {
    // Check if user has a saved language preference
    const savedLanguage = await AsyncStorage.getItem(LANGUAGE_KEY);
    if (savedLanguage) {
      return savedLanguage;
    }

    // Otherwise, return the current language
    return i18n.language;
  } catch (error) {
    console.error('Error getting language:', error);
    return 'en'; // Default to English
  }
}

// Function to set the user's preferred language
export async function setLanguage(language: string): Promise<void> {
  try {
    // Change language
    await i18n.changeLanguage(language);

    // Save preference
    await AsyncStorage.setItem(LANGUAGE_KEY, language);
  } catch (error) {
    console.error('Error setting language:', error);
  }
}

export default i18n;
