# Language Switching Improvements

Our testing revealed that the language switching functionality in the app could be improved. This document outlines the issues and proposes solutions.

## Current Implementation

The current language switching implementation consists of:

1. **I18nContext**: Provides translation functions and language state
2. **LanguageSelector**: UI component for switching languages
3. **LanguageChangeListener**: Detects device language changes on iOS
4. **LanguageRedirect**: Handles URL-based language selection on web

## Issues Identified

1. **Incomplete Translations**: The Spanish translation file is incomplete, missing key sections like login and personalization
2. **No Persistence**: Language preference is not persisted between app sessions
3. **Limited Platform Support**: Language detection works differently on iOS and web, with limited Android support
4. **No Feedback**: Users don't receive feedback when changing languages
5. **Accessibility Issues**: Language selector lacks proper accessibility features

## Proposed Solutions

### 1. Complete Translations

- Add missing translations for login, personalization, and other key features
- Implement a translation validation system to identify missing translations
- Create a process for adding translations when new features are developed

### 2. Implement Language Persistence

Add persistence to language selection using AsyncStorage:

```typescript
// In I18nContext.tsx
import AsyncStorage from '@react-native-async-storage/async-storage';

const LANGUAGE_STORAGE_KEY = 'app_language';

// In I18nProvider component
useEffect(() => {
  // Load saved language on startup
  const loadSavedLanguage = async () => {
    try {
      const savedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
      if (savedLanguage && (savedLanguage === 'en' || savedLanguage === 'es')) {
        setLanguageState(savedLanguage as Language);
      }
    } catch (error) {
      console.error('Error loading saved language:', error);
    }
  };
  
  loadSavedLanguage();
}, []);

// In setLanguage function
const setLanguage = async (lang: Language) => {
  if (Object.keys(translations).includes(lang)) {
    setLanguageState(lang);
    
    // Save language preference
    try {
      await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
    } catch (error) {
      console.error('Error saving language preference:', error);
    }
    
    // Update RTL status (not needed for English/Spanish, but included for future languages)
    const isRTLLanguage = ['ar', 'he', 'ur'].includes(lang);
    setIsRTL(isRTLLanguage);
  } else {
    console.warn(`Language ${lang} is not supported. Using ${DEFAULT_LANGUAGE} instead.`);
    setLanguageState(DEFAULT_LANGUAGE);
    setIsRTL(false);
  }
};
```

### 3. Improve Cross-Platform Support

Enhance language detection across platforms:

```typescript
// In a new file: utils/languageUtils.ts
import { Platform, NativeModules } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LANGUAGE_STORAGE_KEY = 'app_language';

export const getDeviceLanguage = (): string => {
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

export const getLanguageFromLocale = (locale: string): 'en' | 'es' => {
  const langCode = locale.split('-')[0].toLowerCase();
  return langCode === 'es' ? 'es' : 'en';
};

export const getSavedLanguage = async (): Promise<'en' | 'es' | null> => {
  try {
    const savedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (savedLanguage && (savedLanguage === 'en' || savedLanguage === 'es')) {
      return savedLanguage as 'en' | 'es';
    }
  } catch (error) {
    console.error('Error loading saved language:', error);
  }
  return null;
};

export const saveLanguage = async (language: 'en' | 'es'): Promise<void> => {
  try {
    await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  } catch (error) {
    console.error('Error saving language preference:', error);
  }
};
```

### 4. Add User Feedback for Language Changes

Implement a toast notification when language is changed:

```typescript
// In LanguageSelector.tsx
import { Toast } from '../components/Toast'; // Create this component

// In LanguageSelector component
const handleLanguageChange = (lang: Language) => {
  setLanguage(lang);
  
  // Show toast notification
  Toast.show({
    message: lang === 'en' ? 'Language changed to English' : 'Idioma cambiado a Español',
    duration: 2000
  });
};

// Then use handleLanguageChange instead of setLanguage directly
<TouchableOpacity
  key={lang.code}
  style={[
    styles.languageButton,
    compact && styles.compactButton,
    language === lang.code && styles.activeLanguage,
  ]}
  onPress={() => handleLanguageChange(lang.code)}
  accessibilityLabel={t(`languageSelector.switchTo${lang.label}`)}
  accessibilityRole="button"
>
  {/* ... */}
</TouchableOpacity>
```

### 5. Improve Accessibility

Enhance accessibility for the language selector:

```typescript
// In LanguageSelector.tsx
<TouchableOpacity
  key={lang.code}
  style={[
    styles.languageButton,
    compact && styles.compactButton,
    language === lang.code && styles.activeLanguage,
  ]}
  onPress={() => handleLanguageChange(lang.code)}
  accessibilityLabel={t(`languageSelector.switchTo${lang.label}`)}
  accessibilityRole="button"
  accessibilityState={{ selected: language === lang.code }}
  accessibilityHint={t('languageSelector.hint')}
>
  {/* ... */}
</TouchableOpacity>
```

Add these translations:

```json
// In en.json
"languageSelector": {
  "switchToEnglish": "Switch to English",
  "switchToSpanish": "Switch to Spanish",
  "hint": "Changes the app language"
}

// In es.json
"languageSelector": {
  "switchToEnglish": "Cambiar a inglés",
  "switchToSpanish": "Cambiar a español",
  "hint": "Cambia el idioma de la aplicación"
}
```

## Implementation Plan

1. Update translation files with missing translations
2. Implement language persistence using AsyncStorage
3. Create language utility functions for better cross-platform support
4. Add toast notifications for language changes
5. Enhance accessibility for the language selector
6. Test language switching on iOS, Android, and web platforms

By implementing these improvements, we can provide a better user experience for Spanish-speaking users and make it easier to add support for additional languages in the future.