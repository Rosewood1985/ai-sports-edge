# Internationalization and SEO Implementation

This document outlines the internationalization (i18n) and search engine optimization (SEO) implementation for the AI Sports Edge application.

## Table of Contents

1. [Overview](#overview)
2. [URL Structure](#url-structure)
3. [Translation System](#translation-system)
4. [Hreflang Tags](#hreflang-tags)
5. [Multilingual Sitemap](#multilingual-sitemap)
6. [Usage Guide](#usage-guide)
7. [Best Practices](#best-practices)

## Overview

The AI Sports Edge application has been internationalized to support multiple languages, with a focus on English and Spanish. The implementation includes:

- Language-specific URL structure (e.g., `/en/dashboard`, `/es/dashboard`)
- Translation system for UI text
- Localized formatting for numbers, dates, and currencies
- SEO optimization with hreflang tags
- Multilingual XML sitemap

## URL Structure and Language Detection

### Web Platform

The web application uses a language prefix in the URL to indicate the current language:

```
https://ai-sports-edge.com/en/dashboard  # English version
https://ai-sports-edge.com/es/dashboard  # Spanish version
```

The `LanguageRedirect` component handles:
- Extracting the language from the URL path
- Setting the application language based on the URL
- Redirecting to a language-specific URL based on the device locale if no language is specified

### iOS Platform

The iOS application automatically detects the device's language settings and updates the app language accordingly:

- The `LanguageChangeListener` component listens for device locale changes
- When the device language changes, the app language is updated automatically
- The app respects the user's device language preferences

The native `LocaleManager` module bridges between iOS and React Native:
- Listens for `NSLocale.currentLocaleDidChangeNotification` events
- Emits events to React Native when the locale changes
- Provides methods to get the current device locale

## Translation System

### Translation Files

Translations are stored in JSON files in the `translations` directory:

- `translations/en.json` - English translations
- `translations/es.json` - Spanish translations

The translation files use a nested structure for organization:

```json
{
  "dashboard": {
    "title": "Analytics Dashboard",
    "tabs": {
      "overview": "Overview",
      "betting": "Betting",
      "engagement": "Engagement",
      "revenue": "Revenue"
    }
  }
}
```

### I18n Context

The `I18nContext` provides translation and formatting functions throughout the application:

```jsx
// Example usage in a component
import { useI18n } from '../contexts/I18nContext';

const MyComponent = () => {
  const { t, formatNumber, formatCurrency, formatDate } = useI18n();
  
  return (
    <View>
      <Text>{t('dashboard.title')}</Text>
      <Text>{formatNumber(1000)}</Text>
      <Text>{formatCurrency(29.99)}</Text>
      <Text>{formatDate(new Date())}</Text>
    </View>
  );
};
```

### Language Selector

The `LanguageSelector` component allows users to switch between languages:

```jsx
<LanguageSelector />
```

A compact version is used in the header:

```jsx
<LanguageSelector compact={true} />
```

## Hreflang Tags

Hreflang tags are implemented using the `SEOMetadata` component, which adds the appropriate tags to the HTML head:

```jsx
<SEOMetadata
  titleKey="dashboard.title"
  descriptionKey="dashboard.description"
  path="/dashboard"
/>
```

This adds the following tags to the HTML head:

```html
<link rel="alternate" hrefLang="en" href="https://ai-sports-edge.com/en/dashboard" />
<link rel="alternate" hrefLang="es" href="https://ai-sports-edge.com/es/dashboard" />
<link rel="alternate" hrefLang="x-default" href="https://ai-sports-edge.com/en/dashboard" />
```

## Multilingual Sitemap

A multilingual XML sitemap is generated using the `generateSitemap.js` script:

```bash
node scripts/generateSitemap.js
```

The sitemap includes all pages in all supported languages with hreflang annotations:

```xml
<url>
  <loc>https://ai-sports-edge.com/en/dashboard</loc>
  <xhtml:link rel="alternate" hreflang="en" href="https://ai-sports-edge.com/en/dashboard" />
  <xhtml:link rel="alternate" hreflang="es" href="https://ai-sports-edge.com/es/dashboard" />
  <xhtml:link rel="alternate" hreflang="x-default" href="https://ai-sports-edge.com/en/dashboard" />
  <lastmod>2025-03-21</lastmod>
  <changefreq>weekly</changefreq>
  <priority>0.8</priority>
</url>
```

## Usage Guide

### Adding a New Translation

1. Add the translation key to `translations/en.json` and `translations/es.json`:

```json
// translations/en.json
{
  "features": {
    "newFeature": "New Feature"
  }
}

// translations/es.json
{
  "features": {
    "newFeature": "Nueva Característica"
  }
}
```

2. Use the translation in your component:

```jsx
const { t } = useI18n();
<Text>{t('features.newFeature')}</Text>
```

### Adding a New Page

1. Add the page to the navigation stack in `App.tsx`
2. Add the page's URL to the routes array in `scripts/generateSitemap.js`
3. Run the sitemap generator script to update the sitemap

### Adding a New Language

1. Create a new translation file (e.g., `translations/fr.json`)
2. Add the language to the supported languages in:
   - `contexts/I18nContext.tsx`
   - `components/LanguageSelector.tsx`
   - `scripts/generateSitemap.js`

## Best Practices

### Translation Keys

- Use descriptive, hierarchical keys (e.g., `dashboard.tabs.overview` instead of `dashboardTabsOverview`)
- Group related translations together (e.g., all dashboard-related translations under a `dashboard` key)
- Use consistent naming conventions

### SEO Optimization

- Always use the `SEOMetadata` component on web pages
- Provide descriptive titles and descriptions for each page
- Include relevant keywords in translations
- Ensure all pages are included in the sitemap

### URL Structure

- Always use language-prefixed URLs (e.g., `/en/dashboard`, `/es/dashboard`)
- Use the same URL structure across all languages
- Avoid using query parameters for language selection (e.g., `?lang=es`)

### Testing

- Test the application in all supported languages
- Verify that hreflang tags are correctly implemented
- Check that the sitemap includes all pages in all languages
- Test language switching functionality