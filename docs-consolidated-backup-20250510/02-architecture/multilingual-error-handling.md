# Multilingual Error Handling

This document describes the multilingual error handling implementation in the AI Sports Edge application. The application supports multiple languages, including English and Spanish, and provides localized error messages for a better user experience.

## Overview

The application uses the i18n-js library for internationalization. Error messages and logs are displayed in the user's selected language. The translation system is integrated with the error handling and logging mechanisms to provide a consistent user experience across languages.

## Implementation

### Translation Files

The application uses JSON files for translations:

- `translations/en.json`: English translations
- `translations/es.json`: Spanish translations
- `translations/es-error-updates.json`: Additional Spanish error message translations

### Language Context

The `LanguageContext` provides a React context for managing the application's language. It handles:

- Loading translations dynamically
- Switching between languages
- Providing the translation function (`t`) to components

### Error Handling with Translations

Error messages are defined in the translation files and accessed using the `t` function:

```typescript
// Example of error handling with translations
try {
  // Some operation that might fail
} catch (error) {
  console.error('Error occurred:', error);
  logError(LogCategory.AUTH, 'Authentication failed', error);
  setError(t('auth.authentication_failed'));
}
```

### Logging with Translations

Log messages can also use translations for consistency:

```typescript
// Example of logging with translations
info(LogCategory.AUTH, t('auth.user_signed_in'), { userId });
```

## Error Categories

The application defines several error categories, each with its own set of translated messages:

### Authentication Errors

- Invalid credentials
- Email already in use
- Weak password
- Invalid email
- Authentication failed

### API Errors

- Network error
- Server error
- Authentication error
- Resource not found
- Validation error
- Unknown error

### General Errors

- General error
- Network unavailable
- Timeout
- Unexpected error

## Translation Merge Script

The `scripts/merge-translations.js` script merges the error updates into the main Spanish translation file. This ensures that all error messages are properly translated in both English and Spanish.

To run the script:

```bash
node scripts/merge-translations.js
```

## Testing Multilingual Error Handling

The application includes tests for multilingual error handling:

- `__tests__/debug/auth-flow-test.js`: Tests authentication flow with error handling
- `__tests__/debug/api-service-test.js`: Tests API service with error handling

These tests verify that error messages are properly displayed in the user's selected language.

## Best Practices

1. **Always use translation keys**: Never hardcode error messages. Always use translation keys with the `t` function.

2. **Provide context**: Include context information in error messages to help users understand what went wrong.

3. **Be consistent**: Use consistent terminology across languages.

4. **Keep translations up to date**: When adding new error messages, update all translation files.

5. **Test with different languages**: Test the application with different languages to ensure that error messages are properly displayed.

## Conclusion

Multilingual error handling is an important aspect of the AI Sports Edge application. It provides a better user experience by displaying error messages in the user's preferred language. The implementation uses the i18n-js library and follows best practices for internationalization.