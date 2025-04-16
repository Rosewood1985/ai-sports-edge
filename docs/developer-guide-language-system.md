# Language System Developer Guide

This guide provides detailed technical information for developers working with the AI Sports Edge language system. It covers implementation details, workflow, and advanced usage scenarios.

## Technical Implementation

### Core Components

#### 1. LanguageContext.tsx

The `LanguageContext.tsx` file is the heart of the language system. It:

- Creates a React Context for language state
- Provides the translation function (`t`)
- Manages language switching
- Handles persistence of language preferences
- Supports RTL languages

Key implementation details:

```typescript
// Language definition
export const LANGUAGES = {
  en: { code: 'en', name: 'English', direction: 'ltr' },
  es: { code: 'es', name: 'Español', direction: 'ltr' },
};

// Context creation
const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  setLanguage: async () => {},
  t: (key: string) => key,
  isRTL: false,
  availableLanguages: LANGUAGES,
});

// Provider implementation
export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // State and implementation...
}
```

#### 2. Translation Files

Translation files are structured JSON objects with nested keys. The structure is:

```
{
  "section": {
    "subsection": {
      "key": "Translated text"
    }
  }
}
```

For example:

```json
{
  "common": {
    "loading": "Loading...",
    "error": "Error"
  },
  "auth": {
    "sign_in": "Sign In",
    "sign_up": "Sign Up"
  }
}
```

#### 3. i18n-js Integration

The system uses i18n-js for translation management:

```typescript
// Set up translations
i18n.translations = {
  en: enTranslations,
  es: esTranslations,
};

// Set fallback language
i18n.fallbacks = true;
i18n.defaultLocale = 'en';
```

### Workflow

The language system follows this workflow:

1. **Initialization**:
   - Load stored language preference from AsyncStorage
   - If no preference exists, detect device language
   - Initialize i18n with the selected language

2. **Translation**:
   - Components use the `t` function to get translated strings
   - If a translation is missing, fallback to English
   - If still missing, display the key itself

3. **Language Switching**:
   - User selects a new language
   - Update i18n locale
   - Update RTL settings if needed
   - Save preference to AsyncStorage
   - Update React state to trigger re-renders

## Advanced Usage

### Dynamic Content with Variables

The translation system supports variable interpolation:

```typescript
// In translation file
{
  "profile": {
    "welcome_message": "Welcome back, {{name}}!"
  }
}

// In component
const { t } = useLanguage();
const username = "John";

<Text>{t('profile.welcome_message', { name: username })}</Text>
// Renders: "Welcome back, John!"
```

### Pluralization

For pluralization, use multiple keys or the count parameter:

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
const { t } = useLanguage();
const itemCount = 5;

<Text>{t('items', { count: itemCount })}</Text>
// Renders: "5 items"
```

### Formatting Dates and Numbers

For consistent date and number formatting across languages:

```typescript
// In component
const { t, language } = useLanguage();
const date = new Date();

// Format date according to current language
const formattedDate = new Intl.DateTimeFormat(language, {
  year: 'numeric',
  month: 'long',
  day: 'numeric'
}).format(date);

<Text>{formattedDate}</Text>
```

### RTL Support

The system automatically handles RTL languages. For custom RTL-aware components:

```typescript
const { isRTL } = useLanguage();

// Use in styles
const styles = StyleSheet.create({
  container: {
    flexDirection: isRTL ? 'row-reverse' : 'row',
    textAlign: isRTL ? 'right' : 'left',
  }
});
```

## Testing Translations

### Unit Testing

For unit testing translations:

```typescript
// Mock the language context
jest.mock('../contexts/LanguageContext', () => ({
  useLanguage: () => ({
    language: 'en',
    t: (key: string, options?: any) => {
      // Simple mock implementation
      if (key === 'common.loading') return 'Loading...';
      return key;
    },
    isRTL: false,
  }),
}));

// In your test
it('displays the correct translation', () => {
  const { getByText } = render(<MyComponent />);
  expect(getByText('Loading...')).toBeTruthy();
});
```

### Manual Testing

For manual testing:

1. Create a language switcher in your development environment
2. Test all supported languages
3. Check for missing translations
4. Verify RTL layout for RTL languages
5. Test variable interpolation

## Performance Considerations

### Memoization

Use memoization to prevent unnecessary re-renders:

```typescript
// Memoize translated text that doesn't change
const translatedTitle = useMemo(() => {
  return t('screen.title');
}, [t]);
```

### Lazy Loading

For large translation files, consider lazy loading:

```typescript
// In LanguageContext.tsx
const loadTranslations = async (language: string) => {
  let translations;
  switch (language) {
    case 'en':
      translations = (await import('../translations/en.json')).default;
      break;
    case 'es':
      translations = (await import('../translations/es.json')).default;
      break;
    // ...other languages
  }
  
  i18n.translations[language] = translations;
};
```

## Extending the System

### Adding New Translation Keys

When adding new features that require translations:

1. Add the keys to all language files
2. Follow the existing structure
3. Use descriptive, hierarchical keys

### Supporting New Languages

To add a new language:

1. Create the translation file
2. Update the `LANGUAGES` object
3. Add the translations to i18n
4. Update the language selector UI
5. Test thoroughly

### Custom Translation Functions

For specialized translation needs, extend the base functionality:

```typescript
// In a custom hook
export const useCustomTranslations = () => {
  const { t, language } = useLanguage();
  
  // Custom function for specific formatting
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(language, {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };
  
  return {
    t,
    formatCurrency,
  };
};
```

## Troubleshooting

### Common Issues

1. **Missing Translations**:
   - Check if the key exists in all language files
   - Verify the key path is correct
   - Check for typos in the key name

2. **RTL Layout Problems**:
   - Ensure components use isRTL for direction
   - Use start/end instead of left/right
   - Test with explicit RTL forcing

3. **Performance Issues**:
   - Memoize translated text
   - Avoid unnecessary re-renders
   - Consider lazy loading for large translation files

### Debugging

For debugging translation issues:

```typescript
// Add this to LanguageContext.tsx
const debugTranslation = (key: string, result: string) => {
  if (__DEV__) {
    if (result === key && key.includes('.')) {
      console.warn(`Missing translation for key: ${key}`);
    }
  }
};

// Use in the translate function
const translate = (key: string, options?: any) => {
  const result = i18n.t(key, options);
  debugTranslation(key, result);
  return result;
};
```

## Best Practices

1. **Keep translations organized** by feature or screen
2. **Use descriptive keys** that indicate the purpose
3. **Avoid hardcoded strings** in components
4. **Test all languages** regularly
5. **Document special formatting** requirements
6. **Use variables** for dynamic content
7. **Consider cultural differences** when writing content
8. **Maintain consistent terminology** across translations

By following this guide, you'll be able to effectively work with and extend the language system in the AI Sports Edge app.