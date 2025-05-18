# Internationalization

## Overview

AI Sports Edge supports multiple languages with a comprehensive internationalization system. This document provides an overview of the internationalization architecture and how it's implemented in the application.

## Features

- Multi-language support (currently English and Spanish)
- Dynamic language switching
- Automatic language detection based on device settings
- RTL language support (for future language additions)
- Translation management system
- Localized error messages
- Formatted dates, numbers, and currencies
- Cross-platform compatibility (iOS, Android, Web)

## Architecture

The internationalization system follows the atomic architecture pattern:

- **Atoms**: Basic translation utilities, constants, and translation files
- **Molecules**: Language context and hooks
- **Organisms**: Language provider and integration with the rest of the application

### Core Components

#### 1. Translation Files

Translations are stored in JSON files in the `atomic/atoms/translations` directory:

```
atomic/atoms/translations/
  ├── en.json                  # English translations
  ├── es.json                  # Spanish translations
  ├── fr.json                  # French translations
  ├── es-error-updates.json    # Additional Spanish error messages
  ├── odds-comparison-en.json  # English odds comparison translations
  ├── odds-comparison-es.json  # Spanish odds comparison translations
  └── index.js                 # Export utilities
```

Translation files are structured as nested JSON objects with keys organized by feature or section:

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
  }
}
```

#### 2. I18nContext

Located in `atomic/organisms/i18n/I18nContext.tsx`, this React Context provides:

- Current language state
- Language switching functionality
- Translation function (`t`)
- Formatting functions for dates, numbers, and currencies
- RTL status

```typescript
// Example of I18nContext usage
const { language, setLanguage, t, formatDate, formatNumber, formatCurrency, isRTL } = useI18n();
```

#### 3. LanguageContext

Located in `atomic/organisms/i18n/LanguageContext.tsx`, this React Context provides:

- Language state management
- Translation function
- RTL support
- Available languages information

```typescript
// Example of LanguageContext usage
const { language, setLanguage, t, isRTL, availableLanguages } = useLanguage();
```

#### 4. Language Detection

The system automatically detects the user's device language on first launch:

```typescript
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
```

#### 5. Language Persistence

The selected language is persisted using AsyncStorage:

```typescript
// Save language preference
await AsyncStorage.setItem(LANGUAGE_PREFERENCE_KEY, languageCode);

// Load saved language
const savedLanguage = await AsyncStorage.getItem(LANGUAGE_PREFERENCE_KEY);
```

## Implementation

### Translation System

The translation system uses a combination of custom implementation and the i18n-js library:

1. **Translation Function**: The `t` function retrieves translations based on keys:

```typescript
// Basic usage
const message = t('common.loading');

// With variables
const welcome = t('profile.welcome_message', { name: 'John' });
```

2. **Fallback Mechanism**: If a translation is missing in the current language, the system falls back to English:

```typescript
// If 'common.new_feature' is missing in Spanish, it will use the English version
const feature = t('common.new_feature');
```

3. **Formatting Functions**: The system provides functions for formatting dates, numbers, and currencies:

```typescript
// Format date
const date = formatDate(new Date(), { year: 'numeric', month: 'long', day: 'numeric' });

// Format number
const number = formatNumber(1000.5, { maximumFractionDigits: 2 });

// Format currency
const price = formatCurrency(29.99, 'USD');
```

### Language Switching

Users can change the language through the UI:

```typescript
// Switch to Spanish
setLanguage('es');

// Switch to English
setLanguage('en');
```

When the language is changed:

1. The new language is set in the context
2. The preference is saved to AsyncStorage
3. RTL settings are updated if needed
4. The UI is re-rendered with the new translations

### RTL Support

The system supports right-to-left (RTL) languages:

```typescript
// Check if current language is RTL
const { isRTL } = useLanguage();

// Use in styles
const styles = StyleSheet.create({
  container: {
    flexDirection: isRTL ? 'row-reverse' : 'row',
    textAlign: isRTL ? 'right' : 'left',
  },
});
```

### Error Handling

The system provides localized error messages:

```typescript
try {
  // Some operation that might fail
} catch (error) {
  console.error('Error occurred:', error);
  setError(t('auth.authentication_failed'));
}
```

Error messages are defined in the translation files and categorized by type:

- Authentication errors
- API errors
- General errors

## Usage Examples

### Basic Translation

```javascript
import { useI18n } from '../atomic/organisms/i18n/I18nContext';

// In a component
const { t } = useI18n();
const message = t('welcome_message');
```

### Translation with Variables

```javascript
import { useI18n } from '../atomic/organisms/i18n/I18nContext';

// In a component
const { t } = useI18n();
const message = t('hello_name', { name: user.name });
```

### Using the Language Context

```javascript
import React from 'react';
import { View, Text, Button } from 'react-native';
import { useLanguage } from '../atomic/organisms/i18n/LanguageContext';

const LanguageDisplay = () => {
  const { language, setLanguage, t } = useLanguage();

  return (
    <View>
      <Text>
        {t('current_language')}: {language}
      </Text>
      <Button title={t('switch_to_english')} onPress={() => setLanguage('en')} />
      <Button title={t('switch_to_spanish')} onPress={() => setLanguage('es')} />
    </View>
  );
};
```

### Using Automatic Text Components

```javascript
import React from 'react';
import { View } from 'react-native';
import { ThemedText } from '../atomic/atoms';

const WelcomeScreen = () => {
  return (
    <View>
      <ThemedText translationKey="welcome_title" />
      <ThemedText translationKey="welcome_message" />
    </View>
  );
};
```

### Formatting Dates and Numbers

```javascript
import React from 'react';
import { View, Text } from 'react-native';
import { useI18n } from '../atomic/organisms/i18n/I18nContext';

const FormattedDisplay = () => {
  const { t, formatDate, formatNumber, formatCurrency } = useI18n();
  const now = new Date();
  const value = 1234.56;

  return (
    <View>
      <Text>
        {t('today_is')}: {formatDate(now, { dateStyle: 'full' })}
      </Text>
      <Text>
        {t('value')}: {formatNumber(value)}
      </Text>
      <Text>
        {t('price')}: {formatCurrency(value, 'USD')}
      </Text>
    </View>
  );
};
```

## Best Practices

1. **Use translation keys**: Always use translation keys instead of hardcoded strings
2. **Keep translations organized**: Group related translations together
3. **Use variables for dynamic content**: Use variables for names, numbers, and other dynamic content
4. **Test with different languages**: Test the UI with different languages to ensure proper layout
5. **Consider text expansion**: Some languages may require more space than others
6. **Use automatic text components**: Use the provided text components for automatic translation
7. **Document translation keys**: Keep a central list of translation keys for reference
8. **Be consistent with terminology**: Use consistent terminology across languages
9. **Provide context for translators**: Add comments to explain context when needed
10. **Handle pluralization**: Use appropriate pluralization rules for each language

## Adding a New Language

To add a new language:

1. Create a new translation file (e.g., `atomic/atoms/translations/fr.json` for French)
2. Add the language to the `LANGUAGES` object in `LanguageContext.tsx`:

```typescript
export const LANGUAGES = {
  en: { code: 'en', name: 'English', direction: 'ltr' },
  es: { code: 'es', name: 'Español', direction: 'ltr' },
  fr: { code: 'fr', name: 'Français', direction: 'ltr' }, // New language
};
```

3. Update the translations object in both context providers:

```typescript
// In I18nContext.tsx
import { en, es, fr } from '../../atoms/translations';

const translations = {
  en,
  es,
  fr, // Add the new language
};
```

4. Update the language selector UI to include the new language
5. Test the application with the new language

## Testing Internationalization

### Manual Testing

1. Switch between languages and verify all text is translated
2. Check for missing translations
3. Verify that dates, numbers, and currencies are formatted correctly
4. Test RTL layout if applicable
5. Verify that error messages are displayed in the correct language

### Automated Testing

The application includes tests for internationalization:

- Unit tests for the translation system
- Tests for language switching
- Tests for RTL support
- Tests for error handling in different languages

## Troubleshooting

### Missing Translations

If a translation key is missing:

1. The system will try to use the English version
2. If still not found, it will display the key itself
3. In development, a warning will be logged to the console

To fix missing translations:

1. Check the console for warnings
2. Add the missing keys to all language files

### RTL Layout Issues

If RTL layouts don't display correctly:

1. Ensure components use `isRTL` for direction
2. Use start/end positioning instead of left/right
3. Test with explicit RTL forcing

### Performance Considerations

For better performance:

1. Memoize translated text that doesn't change
2. Avoid unnecessary re-renders
3. Consider lazy loading for large translation files

## Related Documentation

- [Internationalization Implementation Guide](../implementation-guides/internationalization-guide.md)
- [Spanish Version Implementation Plan](../spanish-version-implementation-plan.md)
- [Multilingual Error Handling](../multilingual-error-handling.md)
