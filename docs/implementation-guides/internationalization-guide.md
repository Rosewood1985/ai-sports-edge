# Internationalization Implementation Guide

This guide provides practical instructions for implementing internationalization in the AI Sports Edge application. It covers how to use the internationalization system in components, add new translations, support new languages, and test internationalized features.

## Table of Contents

1. [Using Translations in Components](#using-translations-in-components)
2. [Adding New Translations](#adding-new-translations)
3. [Handling Text Expansion](#handling-text-expansion)
4. [Adding Support for New Languages](#adding-support-for-new-languages)
5. [Testing Internationalized Components](#testing-internationalized-components)
6. [Advanced Techniques](#advanced-techniques)
7. [Troubleshooting](#troubleshooting)

## Using Translations in Components

### Basic Translation

To use translations in your components, follow these steps:

1. Import the appropriate hook:

```typescript
// Using I18nContext (recommended for new components)
import { useI18n } from '../atomic/organisms/i18n/I18nContext';

// OR using LanguageContext (for compatibility with older components)
import { useLanguage } from '../atomic/organisms/i18n/LanguageContext';
```

2. Use the hook to access the translation function:

```typescript
// Using I18nContext
const { t } = useI18n();

// OR using LanguageContext
const { t } = useLanguage();
```

3. Use the translation function with the appropriate key:

```typescript
<Text>{t('common.loading')}</Text>
```

### Complete Example

```typescript
import React from 'react';
import { View, Text, Button } from 'react-native';
import { useI18n } from '../atomic/organisms/i18n/I18nContext';

const MyComponent = () => {
  const { t, language, setLanguage } = useI18n();

  return (
    <View>
      <Text>{t('home.welcome')}</Text>
      <Text>{t('home.current_language', { language })}</Text>

      <Button
        title={t('home.switch_language')}
        onPress={() => setLanguage(language === 'en' ? 'es' : 'en')}
      />
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
  "profile": {
    "welcome_message": "Welcome back, {{name}}!",
    "points_earned": "You have earned {{points}} points"
  }
}
```

2. In your component:

```typescript
const { t } = useI18n();
const username = 'John';
const points = 100;

return (
  <View>
    <Text>{t('profile.welcome_message', { name: username })}</Text>
    <Text>{t('profile.points_earned', { points })}</Text>
  </View>
);
```

### Using Formatted Values

For dates, numbers, and currencies, use the formatting functions:

```typescript
const { t, formatDate, formatNumber, formatCurrency } = useI18n();
const date = new Date();
const value = 1234.56;

return (
  <View>
    <Text>
      {t('profile.joined_on')}: {formatDate(date, { dateStyle: 'medium' })}
    </Text>
    <Text>
      {t('profile.score')}: {formatNumber(value)}
    </Text>
    <Text>
      {t('profile.balance')}: {formatCurrency(value, 'USD')}
    </Text>
  </View>
);
```

### Using ThemedText Component

For simpler cases, you can use the `ThemedText` component:

```typescript
import React from 'react';
import { View } from 'react-native';
import { ThemedText } from '../atomic/atoms';

const SimpleComponent = () => {
  return (
    <View>
      <ThemedText translationKey="common.loading" />
      <ThemedText translationKey="profile.welcome_message" translationParams={{ name: 'John' }} />
    </View>
  );
};
```

### Handling RTL Languages

For components that need special RTL handling:

```typescript
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useI18n } from '../atomic/organisms/i18n/I18nContext';
import { ThemedText } from '../atomic/atoms';

const RTLAwareComponent = () => {
  const { isRTL } = useI18n();

  return (
    <View style={[styles.container, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
      <View style={styles.iconContainer}>{/* Icon */}</View>
      <View style={styles.textContainer}>
        <ThemedText translationKey="component.title" />
        <ThemedText translationKey="component.description" />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    alignItems: 'center',
  },
  iconContainer: {
    marginHorizontal: 8,
  },
  textContainer: {
    flex: 1,
  },
});
```

## Adding New Translations

### Adding Translation Keys

To add new translations:

1. Identify the appropriate section in the translation files
2. Add your new key and translation to all language files
3. Use a consistent naming convention (lowercase with underscores)

Example:

```json
// In atomic/atoms/translations/en.json
{
  "feature_name": {
    "new_key": "Your new English text"
  }
}

// In atomic/atoms/translations/es.json
{
  "feature_name": {
    "new_key": "Your new Spanish text"
  }
}
```

### Translation Key Naming Conventions

Follow these conventions for translation keys:

1. Use lowercase with underscores
2. Group related translations under a common prefix
3. Use descriptive names that indicate the purpose
4. Keep keys consistent across all language files

Examples of good key names:

- `common.loading`
- `auth.sign_in_button`
- `profile.edit_profile_title`
- `settings.language_selection_label`

### Organizing Translations

Organize translations by feature or screen:

```json
{
  "common": {
    "loading": "Loading...",
    "error": "Error",
    "retry": "Retry"
  },
  "auth": {
    "sign_in": "Sign In",
    "sign_up": "Sign Up",
    "forgot_password": "Forgot Password?"
  },
  "profile": {
    "edit_profile": "Edit Profile",
    "change_photo": "Change Photo",
    "save_changes": "Save Changes"
  }
}
```

### Using the Translation Scripts

The project includes scripts to help manage translations:

1. Find missing translations:

```bash
node scripts/findMissingTranslations.js
```

2. Add missing translations:

```bash
node scripts/addMissingTranslations.js
```

3. Merge translation updates:

```bash
node scripts/mergeTranslations.js
```

## Handling Text Expansion

Some languages require more space than others. For example, Spanish text is often 20-30% longer than English. Follow these guidelines to handle text expansion:

### UI Layout Best Practices

1. **Use flexible containers**: Avoid fixed-width containers for text

```typescript
// Good
<View style={{ flex: 1 }}>
  <Text>{t('some.translation_key')}</Text>
</View>

// Bad
<View style={{ width: 200 }}>
  <Text>{t('some.translation_key')}</Text>
</View>
```

2. **Allow text wrapping**: Make sure text can wrap to multiple lines

```typescript
<Text style={{ flexWrap: 'wrap' }}>{t('some.long_text')}</Text>
```

3. **Use ellipsis for truncation when necessary**:

```typescript
<Text numberOfLines={2} ellipsizeMode="tail">
  {t('some.potentially_long_text')}
</Text>
```

4. **Test with longer text**: Test your UI with text that's 30% longer than your default language

### Using the Text Expansion Analysis Tool

The project includes a tool to analyze text expansion:

```bash
node scripts/analyzeTextExpansion.js
```

This script compares the length of translations across languages and identifies potential UI issues.

### Responsive Text Components

Use the `ResponsiveText` component for text that needs to adapt to different languages:

```typescript
import { ResponsiveText } from '../atomic/atoms';

// In your component
<ResponsiveText translationKey="feature.long_title" minFontSize={12} maxFontSize={18} />;
```

## Adding Support for New Languages

To add a new language to the application:

### 1. Create the Translation File

Create a new JSON file in the `atomic/atoms/translations` directory:

```bash
touch atomic/atoms/translations/fr.json
```

Copy the structure from `en.json` and translate all strings:

```json
{
  "common": {
    "loading": "Chargement...",
    "error": "Erreur",
    "retry": "Réessayer"
  },
  "auth": {
    "sign_in": "Se connecter",
    "sign_up": "S'inscrire",
    "forgot_password": "Mot de passe oublié ?"
  }
}
```

### 2. Update the Translations Index

Update `atomic/atoms/translations/index.js` to include the new language:

```javascript
import en from './en.json';
import es from './es.json';
import fr from './fr.json'; // Add the new language

export { en, es, fr }; // Export the new language

export default {
  en,
  es,
  fr, // Add to default export
};
```

### 3. Update the Language Contexts

Update both context providers to include the new language:

In `atomic/organisms/i18n/I18nContext.tsx`:

```typescript
// Import translations
import { en, es, fr } from '../../atoms/translations';

// Define supported languages
export type Language = 'en' | 'es' | 'fr'; // Add the new language

// Available translations
const translations = {
  en,
  es,
  fr, // Add the new language
};
```

In `atomic/organisms/i18n/LanguageContext.tsx`:

```typescript
// Define available languages
export const LANGUAGES = {
  en: { code: 'en', name: 'English', direction: 'ltr' },
  es: { code: 'es', name: 'Español', direction: 'ltr' },
  fr: { code: 'fr', name: 'Français', direction: 'ltr' }, // Add the new language
};

// Update i18n implementation
const i18n = {
  translations: {
    en,
    es,
    fr, // Add the new language
  } as TranslationsType,
  // ...
};
```

### 4. Update the Language Selector UI

Update the language selector component to include the new language:

```typescript
import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useLanguage } from '../atomic/organisms/i18n/LanguageContext';

const LanguageSelector = () => {
  const { language, setLanguage, t, availableLanguages } = useLanguage();

  return (
    <View style={styles.container}>
      {Object.entries(availableLanguages).map(([code, langInfo]) => (
        <TouchableOpacity
          key={code}
          style={[styles.languageButton, language === code && styles.activeLanguage]}
          onPress={() => setLanguage(code)}
        >
          <Text style={styles.languageText}>{langInfo.name}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    padding: 16,
  },
  languageButton: {
    padding: 8,
    marginHorizontal: 8,
    borderRadius: 4,
    backgroundColor: '#f0f0f0',
  },
  activeLanguage: {
    backgroundColor: '#007bff',
  },
  languageText: {
    fontSize: 16,
  },
});
```

### 5. Test the New Language

Test the application with the new language to ensure all translations are displayed correctly.

## Testing Internationalized Components

### Manual Testing

1. **Switch between languages**: Test your component in all supported languages
2. **Check for missing translations**: Look for keys displayed instead of translated text
3. **Verify text expansion handling**: Ensure UI handles longer text properly
4. **Test RTL layout**: If supporting RTL languages, test the RTL layout

### Automated Testing

#### Unit Testing Translations

```typescript
import React from 'react';
import { render } from '@testing-library/react-native';
import { I18nProvider } from '../atomic/organisms/i18n/I18nContext';
import MyComponent from './MyComponent';

describe('MyComponent', () => {
  it('displays correct translations in English', () => {
    const { getByText } = render(
      <I18nProvider initialLanguage="en">
        <MyComponent />
      </I18nProvider>
    );

    expect(getByText('Welcome')).toBeTruthy();
  });

  it('displays correct translations in Spanish', () => {
    const { getByText } = render(
      <I18nProvider initialLanguage="es">
        <MyComponent />
      </I18nProvider>
    );

    expect(getByText('Bienvenido')).toBeTruthy();
  });
});
```

#### Testing Language Switching

```typescript
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { I18nProvider } from '../atomic/organisms/i18n/I18nContext';
import LanguageSwitcher from './LanguageSwitcher';

describe('LanguageSwitcher', () => {
  it('changes language when button is pressed', () => {
    const { getByText } = render(
      <I18nProvider initialLanguage="en">
        <LanguageSwitcher />
      </I18nProvider>
    );

    // Initially in English
    expect(getByText('Current language: English')).toBeTruthy();

    // Switch to Spanish
    fireEvent.press(getByText('Switch to Spanish'));

    // Now in Spanish
    expect(getByText('Idioma actual: Español')).toBeTruthy();
  });
});
```

#### Testing with Mock Translations

For more isolated tests, you can mock the translation function:

```typescript
// Mock the language context
jest.mock('../atomic/organisms/i18n/I18nContext', () => ({
  useI18n: () => ({
    language: 'en',
    t: (key: string, options?: any) => {
      // Simple mock implementation
      if (key === 'common.loading') return 'Loading...';
      if (key === 'profile.welcome_message' && options?.name) {
        return `Welcome back, ${options.name}!`;
      }
      return key;
    },
    isRTL: false,
  }),
}));
```

## Advanced Techniques

### Lazy Loading Translations

For large applications, you can implement lazy loading of translations:

```typescript
const loadTranslations = async (language: string) => {
  let translations;
  switch (language) {
    case 'en':
      translations = (await import('../../atoms/translations/en.json')).default;
      break;
    case 'es':
      translations = (await import('../../atoms/translations/es.json')).default;
      break;
    case 'fr':
      translations = (await import('../../atoms/translations/fr.json')).default;
      break;
    default:
      translations = (await import('../../atoms/translations/en.json')).default;
  }

  return translations;
};
```

### Custom Translation Hooks

Create custom hooks for specific translation needs:

```typescript
export const useErrorTranslations = () => {
  const { t, language } = useI18n();

  const translateError = (errorCode: string, params?: Record<string, any>) => {
    return t(`errors.${errorCode}`, params);
  };

  return {
    translateError,
    language,
  };
};
```

### Pluralization

Handle pluralization in translations:

```typescript
// In translation file
{
  "items": {
    "zero": "No items",
    "one": "1 item",
    "other": "{{count}} items"
  }
}

// In component
const { t } = useI18n();
const itemCount = 5;

<Text>{t('items', { count: itemCount })}</Text>
// Renders: "5 items"
```

### Memoization for Performance

Use memoization to prevent unnecessary re-renders:

```typescript
import React, { useMemo } from 'react';
import { useI18n } from '../atomic/organisms/i18n/I18nContext';

const OptimizedComponent = () => {
  const { t, language } = useI18n();

  // Memoize translations that don't depend on props
  const translations = useMemo(
    () => ({
      title: t('component.title'),
      description: t('component.description'),
      buttonText: t('component.button'),
    }),
    [t, language]
  );

  return (
    <View>
      <Text>{translations.title}</Text>
      <Text>{translations.description}</Text>
      <Button title={translations.buttonText} onPress={() => {}} />
    </View>
  );
};
```

## Troubleshooting

### Missing Translations

If you see translation keys instead of translated text:

1. Check if the key exists in the translation file
2. Verify the key path is correct (check for typos)
3. Make sure the translation file is properly imported
4. Check the console for warnings about missing translations

### Language Not Changing

If the language doesn't change when selected:

1. Check if the language code is correct in the `LANGUAGES` object
2. Verify that the translation file is properly imported
3. Check for errors in the console
4. Verify that AsyncStorage is working correctly

### RTL Layout Issues

If RTL layouts don't display correctly:

1. Ensure components use `isRTL` for direction
2. Use start/end positioning instead of left/right
3. Test with explicit RTL forcing using React Native's I18nManager

### Performance Issues

If you notice performance issues with translations:

1. Memoize translated text that doesn't change
2. Avoid unnecessary re-renders by using React.memo or useMemo
3. Consider lazy loading for large translation files
4. Profile your app to identify bottlenecks

### Debugging Translation Issues

Add debugging to help identify translation issues:

```typescript
// Add this to your component for debugging
useEffect(() => {
  if (__DEV__) {
    console.log('Current language:', language);
    console.log('Translation for key:', t('some.key'));
  }
}, [language, t]);
```

---

By following this guide, you'll be able to effectively implement internationalization in your components, add new translations, and ensure your application works well across different languages.
