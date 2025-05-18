/**
 * URL Utility Functions
 *
 * This file contains utility functions for handling URLs in the AI Sports Edge application,
 * with a focus on multilingual SEO support.
 */

import { seoConfig, Language } from '../config/seo';

/**
 * Generates an absolute URL from a relative path
 * @param {string} path - Relative path (with or without leading slash)
 * @returns {string} Absolute URL
 */
export const getAbsoluteUrl = (path: string): string => {
  // Ensure path starts with a slash
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${seoConfig.baseUrl}${normalizedPath}`;
};

/**
 * Generates a canonical URL for the current page
 * @param {string} path - Relative path (with or without leading slash)
 * @returns {string} Canonical URL
 */
export const getCanonicalUrl = (path: string): string => {
  return getAbsoluteUrl(path);
};

/**
 * Generates an image URL with the base URL
 * @param {string} imagePath - Relative image path
 * @returns {string} Absolute image URL
 */
export const getImageUrl = (imagePath: string): string => {
  return getAbsoluteUrl(imagePath);
};

/**
 * Generates a language-specific URL
 * @param {string} path - Relative path without language prefix
 * @param {Language} language - Language code
 * @returns {string} Language-specific URL
 */
export const getLanguageUrl = (path: string, language: Language): string => {
  // Ensure path starts with a slash
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;

  // For Spanish regional variants, use the format /es-xx/path
  if (language.startsWith('es-')) {
    return `${seoConfig.baseUrl}/${language.toLowerCase()}${normalizedPath}`;
  }

  // For generic languages (en, es), use the format /en/path
  return `${seoConfig.baseUrl}/${language}${normalizedPath}`;
};

/**
 * Extracts the language code from a URL path
 * @param {string} path - URL path
 * @returns {Language | null} Language code or null if not found
 */
export const extractLanguageFromPath = (path: string): Language | null => {
  if (!path) return null;

  const pathSegments = path.split('/').filter(segment => segment.length > 0);
  if (pathSegments.length === 0) return null;

  const firstSegment = pathSegments[0].toLowerCase();

  // Check if the first segment is a supported language
  const supportedLanguages = seoConfig.languages.map(lang => lang.code);
  if (supportedLanguages.includes(firstSegment as Language)) {
    return firstSegment as Language;
  }

  return null;
};

/**
 * Removes the language prefix from a path
 * @param {string} path - URL path with language prefix
 * @returns {string} Path without language prefix
 */
export const removeLanguageFromPath = (path: string): string => {
  if (!path) return '/';

  const language = extractLanguageFromPath(path);
  if (!language) return path;

  // Remove the language prefix
  const pathWithoutLang = path.replace(new RegExp(`^/${language}`), '');
  return pathWithoutLang || '/';
};

/**
 * Standardizes URL parameters for consistent hreflang implementation
 * @param {Record<string, string>} params - URL parameters
 * @returns {string} Standardized query string
 */
export const standardizeParams = (params: Record<string, string>): string => {
  // Filter out session and tracking parameters
  const filteredParams = Object.entries(params).filter(([key]) => {
    const nonEssentialParams = ['sid', 'utm_source', 'utm_medium', 'utm_campaign'];
    return !nonEssentialParams.includes(key);
  });

  // Sort parameters alphabetically
  const sortedParams = filteredParams.sort(([keyA], [keyB]) => keyA.localeCompare(keyB));

  // Format as query string
  return sortedParams.length > 0
    ? '?' + sortedParams.map(([key, value]) => `${key}=${encodeURIComponent(value)}`).join('&')
    : '';
};

/**
 * Gets the default language
 * @returns {Language} Default language
 */
export const getDefaultLanguage = (): Language => {
  const defaultLang = seoConfig.languages.find(lang => lang.default);
  return defaultLang ? defaultLang.code : 'en';
};

/**
 * Gets the x-default language
 * @returns {Language} x-default language
 */
export const getXDefaultLanguage = (): Language => {
  return getDefaultLanguage();
};
