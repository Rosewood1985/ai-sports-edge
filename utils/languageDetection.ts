/**
 * Language Detection Utilities
 *
 * This file contains utility functions for detecting and handling user language preferences
 * for multilingual SEO support.
 */

import { Language, seoConfig } from '../config/seo';

/**
 * Detect user's preferred language from browser settings
 * @returns {Language} Detected language code
 */
export const detectUserLanguage = (): Language => {
  // Only run in browser environment
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return 'en';
  }

  try {
    // Get browser language
    const browserLang = navigator.language || (navigator as any).userLanguage || '';

    // Extract language and region codes
    const langCode = browserLang.split('-')[0]?.toLowerCase();
    const regionCode = browserLang.split('-')[1]?.toUpperCase();

    // Handle Spanish variants
    if (langCode === 'es') {
      if (regionCode === 'US') return 'es-US';
      if (regionCode === 'MX') return 'es-MX';
      if (regionCode === 'ES') return 'es-ES';

      // Default to generic Spanish if no specific region or unsupported region
      return 'es';
    }

    // Check if language is supported
    const isLanguageSupported = seoConfig.languages.some(lang => lang.code === langCode);
    if (isLanguageSupported) {
      return langCode as Language;
    }

    // Default to English
    return 'en';
  } catch (error) {
    console.error('Error detecting user language:', error);
    return 'en';
  }
};

/**
 * Get stored language preference from localStorage
 * @returns {Language | null} Stored language code or null if not found
 */
export const getStoredLanguage = (): Language | null => {
  if (typeof window === 'undefined' || !window.localStorage) {
    return null;
  }

  try {
    const storedLang = localStorage.getItem('app_language');
    if (storedLang && isValidLanguage(storedLang)) {
      return storedLang as Language;
    }
    return null;
  } catch (error) {
    console.error('Error getting stored language:', error);
    return null;
  }
};

/**
 * Store language preference in localStorage
 * @param {Language} language - Language code to store
 */
export const storeLanguage = (language: Language): void => {
  if (typeof window === 'undefined' || !window.localStorage) {
    return;
  }

  try {
    localStorage.setItem('app_language', language);
  } catch (error) {
    console.error('Error storing language preference:', error);
  }
};

/**
 * Check if a language code is valid
 * @param {string} language - Language code to check
 * @returns {boolean} True if language is valid
 */
export const isValidLanguage = (language: string): boolean => {
  return seoConfig.languages.some(lang => lang.code === language);
};

/**
 * Get language from URL path
 * @param {string} path - URL path
 * @returns {Language | null} Language code or null if not found
 */
export const getLanguageFromPath = (path: string): Language | null => {
  if (!path) return null;

  const pathSegments = path.split('/').filter(segment => segment.length > 0);
  if (pathSegments.length === 0) return null;

  const firstSegment = pathSegments[0].toLowerCase();

  // Check if the first segment is a supported language
  if (isValidLanguage(firstSegment)) {
    return firstSegment as Language;
  }

  return null;
};

/**
 * Get the best language for the user
 * Priority: 1. URL path, 2. Stored preference, 3. Browser setting, 4. Default language
 * @param {string} path - Current URL path
 * @returns {Language} Best language for the user
 */
export const getBestLanguage = (path: string): Language => {
  // Check URL path first
  const pathLanguage = getLanguageFromPath(path);
  if (pathLanguage) return pathLanguage;

  // Check stored preference
  const storedLanguage = getStoredLanguage();
  if (storedLanguage) return storedLanguage;

  // Check browser setting
  const browserLanguage = detectUserLanguage();
  if (browserLanguage) return browserLanguage;

  // Default to English
  return 'en';
};

/**
 * Get language name from language code
 * @param {Language} language - Language code
 * @returns {string} Language name
 */
export const getLanguageName = (language: Language): string => {
  const langConfig = seoConfig.languages.find(lang => lang.code === language);
  return langConfig ? langConfig.name : 'English';
};

/**
 * Get language region from language code
 * @param {Language} language - Language code
 * @returns {string | undefined} Language region
 */
export const getLanguageRegion = (language: Language): string | undefined => {
  const langConfig = seoConfig.languages.find(lang => lang.code === language);
  return langConfig ? langConfig.region : undefined;
};

export default {
  detectUserLanguage,
  getStoredLanguage,
  storeLanguage,
  isValidLanguage,
  getLanguageFromPath,
  getBestLanguage,
  getLanguageName,
  getLanguageRegion,
};
