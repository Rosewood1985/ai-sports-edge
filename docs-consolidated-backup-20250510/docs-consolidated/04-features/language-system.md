# AI Sports Edge Language System Documentation

This document provides comprehensive information about the language system implemented in the AI Sports Edge application. It covers how the system works, how to use it in your components, and how to extend it with new languages or translations.

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Using Translations in Components](#using-translations-in-components)
4. [Adding New Translations](#adding-new-translations)
5. [Adding New Languages](#adding-new-languages)
6. [RTL Language Support](#rtl-language-support)
7. [Best Practices](#best-practices)
8. [Troubleshooting](#troubleshooting)

## Overview

The AI Sports Edge app supports multiple languages through a context-based internationalization (i18n) system. The current implementation includes:

- English (en) - Default language
- Spanish (es)

The system automatically detects the user's device language on first launch and sets it as the app language if supported. Users can manually change the language through the app settings.

## Architecture

The language system consists of several key components:

### 1. LanguageContext and Provider

Located in `contexts/LanguageContext.tsx`, this React Context provides language state and functions throughout the app:

- `language`: Current language code (e.g., 'en', 'es', 'fr')
- `setLanguage`: Function to change the current language
- `t`: Translation function to get localized strings
- `isRTL`: Boolean indicating if the current language is right-to-left
- `availableLanguages`: Object containing all supported languages

### 2. Translation Files

JSON files in the `translations/` directory containing all translated strings:

- `en.json`: English translations
- `es.json`: Spanish translations
- `fr.json`: French translations

### 3. UI Components

- `LanguageSelector.tsx`: Reusable component for selecting a language
- `LanguageSettingsScreen.tsx`: Dedicated screen for language settings

## Using Translations in Components

To use translations in your components:

1. Import the `useLanguage` hook:

```tsx
import { useLanguage } from '../contexts/LanguageContext';
```

2. Use the hook to access the translation function:

```tsx
const { t } = useLanguage();
```

3. Use the translation function with the appropriate key:

```tsx
<Text>{t('common.loading')}</Text>
```

### Example Component

```tsx
import React from 'react';
import { View, Text } from 'react-native';
import { useLanguage } from '../contexts/LanguageContext';

const MyComponent = () => {
  const { t } = useLanguage();
  
  return (
    <View>
      <Text>{t('home.welcome')}</Text>
      <Text>{t('common.loading')}</Text>
    </View>
  );
};

export default MyComponent;
```

### Using Variables in Translations

You can include variables in your translations:

1. In the translation file:

```json
{
  "subscription": {
    "renews_on": "Renews on {{date}}"
  }
}
```

2. In your component:

```tsx
<Text>{t('subscription.renews_on', { date: '2023-12-31' })}</Text>
```

## Adding New Translations

To add new translations to existing language files:

1. Identify the appropriate section in the translation files
2. Add your new key and translation to all language files
3. Use a consistent naming convention (lowercase with underscores)

Example:

```json
// In en.json
{
  "games": {
    "new_key": "Your new English text"
  }
}

// In es.json
{
  "games": {
    "new_key": "Your new Spanish text"
  }
}

// In fr.json
{
  "games": {
    "new_key": "Your new French text"
  }
}
```

## Adding New Languages

To add a new language:

1. Create a new translation file in the `translations/` directory (e.g., `de.json` for German)
2. Copy the structure from `en.json` and translate all strings
3. Update the `LANGUAGES` object in `LanguageContext.tsx`:

```tsx
export const LANGUAGES = {
  en: { code: 'en', name: 'English', direction: 'ltr' },
  es: { code: 'es', name: 'Español', direction: 'ltr' },
  fr: { code: 'fr', name: 'Français', direction: 'ltr' },
  de: { code: 'de', name: 'Deutsch', direction: 'ltr' }, // New language
};
```

4. Update the `i18n.translations` object:

```tsx
import deTranslations from '../translations/de.json';

i18n.translations = {
  en: enTranslations,
  es: esTranslations,
  fr: frTranslations,
  de: deTranslations, // New language
};
```

5. Update the `getLanguageNativeName` function in `LanguageSettingsScreen.tsx`:

```tsx
const getLanguageNativeName = (code: string): string => {
  switch (code) {
    case 'en': return 'English';
    case 'es': return 'Español';
    case 'fr': return 'Français';
    case 'de': return 'Deutsch'; // New language
    default: return '';
  }
};
```

## RTL Language Support

The language system includes support for right-to-left (RTL) languages like Arabic and Hebrew. To add an RTL language:

1. Follow the steps for adding a new language
2. Set the `direction` property to `'rtl'`:

```tsx
export const LANGUAGES = {
  // Existing languages...
  ar: { code: 'ar', name: 'العربية', direction: 'rtl' }, // Arabic example
};
```

The system will automatically handle RTL layout changes when an RTL language is selected.

## Best Practices

1. **Use Namespaced Keys**: Organize translations with namespaced keys (e.g., `section.subsection.key`)
2. **Keep Translations Consistent**: Ensure all languages have the same keys
3. **Use Variables for Dynamic Content**: Use variables instead of string concatenation
4. **Document Special Formatting**: If a translation requires special formatting, document it in comments
5. **Test All Languages**: Regularly test the app in all supported languages

## Troubleshooting

### Missing Translations

If a translation key is missing, the system will:

1. Try to find the key in the fallback language (English)
2. If still not found, display the key itself

To fix missing translations:

1. Check the console for warnings about missing translations
2. Add the missing keys to all language files

### Language Not Changing

If the language doesn't change when selected:

1. Check if the language code is correct in the `LANGUAGES` object
2. Verify that the translation file is properly imported
3. Make sure the translation file has the correct format

### RTL Layout Issues

If RTL layouts don't display correctly:

1. Ensure the component uses flexDirection from the theme
2. Use start/end positioning instead of left/right
3. Test with explicit RTL forcing using the React Native dev menu

---

For additional help or to report issues with the language system, please contact the development team.