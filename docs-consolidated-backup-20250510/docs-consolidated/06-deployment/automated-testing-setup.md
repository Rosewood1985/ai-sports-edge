# Automated Testing Setup

To ensure ongoing quality for the Spanish version of the app, we need to set up automated testing. This document outlines the approach and implementation steps.

## Current Testing Approach

Currently, the testing approach has several limitations:

1. **Manual Testing**: Heavy reliance on manual testing for language features
2. **No CI/CD Integration**: Tests are not integrated into the CI/CD pipeline
3. **Limited Coverage**: Tests don't adequately cover all aspects of the Spanish version
4. **No Regression Testing**: No automated regression testing for language features

## Proposed Automated Testing Approach

### 1. Set Up Jest for Automated Testing

Configure Jest to run tests automatically:

```javascript
// package.json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:spanish": "jest --testPathPattern=__tests__/.*Spanish.*",
    "test:ci": "jest --ci --coverage --reporters=default --reporters=jest-junit"
  }
}
```

### 2. Create a GitHub Actions Workflow

Set up a GitHub Actions workflow to run tests automatically:

```yaml
# .github/workflows/spanish-tests.yml
name: Spanish Version Tests

on:
  push:
    branches: [ main, develop ]
    paths:
      - 'translations/**'
      - 'components/**'
      - 'screens/**'
      - 'contexts/**'
      - '__tests__/**'
  pull_request:
    branches: [ main, develop ]
    paths:
      - 'translations/**'
      - 'components/**'
      - 'screens/**'
      - 'contexts/**'
      - '__tests__/**'

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v2
    
    - name: Set up Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '16'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run Spanish version tests
      run: npm run test:spanish
    
    - name: Upload test results
      uses: actions/upload-artifact@v2
      with:
        name: test-results
        path: test-results
    
    - name: Upload coverage report
      uses: actions/upload-artifact@v2
      with:
        name: coverage-report
        path: coverage
```

### 3. Implement Translation Validation

Create a script to validate translations:

```typescript
// scripts/validateTranslations.ts
import fs from 'fs';
import path from 'path';

// Load translation files
const enTranslations = JSON.parse(fs.readFileSync(path.join(__dirname, '../translations/en.json'), 'utf8'));
const esTranslations = JSON.parse(fs.readFileSync(path.join(__dirname, '../translations/es.json'), 'utf8'));

// Function to find missing keys
const findMissingKeys = (enObj: any, esObj: any, currentPath = ''): string[] => {
  const missingKeys: string[] = [];
  
  Object.keys(enObj).forEach(key => {
    const newPath = currentPath ? `${currentPath}.${key}` : key;
    
    if (typeof enObj[key] === 'object' && enObj[key] !== null) {
      // If English has an object but Spanish doesn't, or Spanish has a non-object
      if (!esObj[key] || typeof esObj[key] !== 'object') {
        missingKeys.push(newPath);
      } else {
        // Recursively check nested objects
        missingKeys.push(...findMissingKeys(enObj[key], esObj[key], newPath));
      }
    } else {
      // Check if the key exists in Spanish
      if (!esObj || !Object.prototype.hasOwnProperty.call(esObj, key)) {
        missingKeys.push(newPath);
      }
    }
  });
  
  return missingKeys;
};

// Find missing translations
const missingTranslations = findMissingKeys(enTranslations, esTranslations);

// Output results
if (missingTranslations.length > 0) {
  console.error('Missing Spanish translations:');
  missingTranslations.forEach(key => console.error(`- ${key}`));
  process.exit(1);
} else {
  console.log('All translations are present!');
  process.exit(0);
}
```

Add this to package.json:

```json
{
  "scripts": {
    "validate:translations": "ts-node scripts/validateTranslations.ts"
  }
}
```

And to the GitHub workflow:

```yaml
- name: Validate translations
  run: npm run validate:translations
```

### 4. Set Up Visual Regression Testing

Implement visual regression testing for UI components:

```javascript
// jest.config.js
module.exports = {
  // ... existing config
  setupFilesAfterEnv: [
    '<rootDir>/jest.setup.js',
    '<rootDir>/jest.visual.setup.js'
  ],
  // ... rest of config
};
```

```javascript
// jest.visual.setup.js
import { toMatchImageSnapshot } from 'jest-image-snapshot';

expect.extend({ toMatchImageSnapshot });
```

Create visual regression tests:

```typescript
// __tests__/visual/SpanishUIComponents.visual.test.tsx
import React from 'react';
import { render } from '@testing-library/react-native';
import { I18nProvider } from '../../contexts/I18nContext';
import { LanguageSelector } from '../../components/LanguageSelector';
import { NeonLoginScreen } from '../../screens/NeonLoginScreen';
import { PersonalizationSettings } from '../../components/PersonalizationSettings';
import { takeSnapshot } from '../utils/visualTestUtils';

// Wrapper component with Spanish language
const SpanishWrapper: React.FC<{children: React.ReactNode}> = ({ children }) => (
  <I18nProvider initialLanguage="es">
    {children}
  </I18nProvider>
);

describe('Spanish UI Components Visual Tests', () => {
  it('LanguageSelector renders correctly in Spanish', async () => {
    const { container } = render(<LanguageSelector />, { wrapper: SpanishWrapper });
    const snapshot = await takeSnapshot(container);
    expect(snapshot).toMatchImageSnapshot();
  });
  
  it('NeonLoginScreen renders correctly in Spanish', async () => {
    const { container } = render(<NeonLoginScreen />, { wrapper: SpanishWrapper });
    const snapshot = await takeSnapshot(container);
    expect(snapshot).toMatchImageSnapshot();
  });
  
  it('PersonalizationSettings renders correctly in Spanish', async () => {
    const { container } = render(<PersonalizationSettings />, { wrapper: SpanishWrapper });
    const snapshot = await takeSnapshot(container);
    expect(snapshot).toMatchImageSnapshot();
  });
});
```

### 5. Implement End-to-End Testing

Set up Detox for end-to-end testing:

```bash
npm install --save-dev detox
detox init
```

Create end-to-end tests for the Spanish version:

```javascript
// e2e/spanishVersion.test.js
describe('Spanish Version Tests', () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it('should switch to Spanish language', async () => {
    // Open language selector
    await element(by.id('languageSelectorButton')).tap();
    
    // Select Spanish
    await element(by.text('Español')).tap();
    
    // Verify UI is in Spanish
    await expect(element(by.text('INICIAR SESIÓN'))).toBeVisible();
  });

  it('should display login screen in Spanish', async () => {
    // Switch to Spanish first
    await element(by.id('languageSelectorButton')).tap();
    await element(by.text('Español')).tap();
    
    // Verify login screen elements
    await expect(element(by.text('INICIAR SESIÓN'))).toBeVisible();
    await expect(element(by.placeholder('Correo electrónico'))).toBeVisible();
    await expect(element(by.placeholder('Contraseña'))).toBeVisible();
    await expect(element(by.text('¿Olvidó su contraseña?'))).toBeVisible();
  });

  it('should display personalization settings in Spanish', async () => {
    // Switch to Spanish first
    await element(by.id('languageSelectorButton')).tap();
    await element(by.text('Español')).tap();
    
    // Login
    await element(by.placeholder('Correo electrónico')).typeText('test@example.com');
    await element(by.placeholder('Contraseña')).typeText('password123');
    await element(by.text('INICIAR SESIÓN')).tap();
    
    // Navigate to personalization settings
    await element(by.id('settingsButton')).tap();
    await element(by.text('Personalización')).tap();
    
    // Verify personalization settings elements
    await expect(element(by.text('General'))).toBeVisible();
    await expect(element(by.text('Casas de Apuestas'))).toBeVisible();
    await expect(element(by.text('Notificaciones'))).toBeVisible();
  });
});
```

### 6. Set Up Continuous Monitoring

Implement continuous monitoring for the Spanish version:

1. **Error Tracking**: Set up error tracking with Sentry to monitor Spanish-specific errors
2. **Analytics**: Track language usage and errors with analytics
3. **Automated Reports**: Generate automated reports on Spanish version usage and issues

```typescript
// utils/errorTracking.ts
import * as Sentry from '@sentry/react-native';
import { I18nContext } from '../contexts/I18nContext';

export const initErrorTracking = () => {
  Sentry.init({
    dsn: 'YOUR_SENTRY_DSN',
    // ...other config
  });
};

export const captureError = (error: Error, context?: Record<string, any>) => {
  // Get current language from context if available
  const language = I18nContext._currentValue?.language || 'unknown';
  
  // Add language to error context
  Sentry.captureException(error, {
    tags: {
      language,
    },
    extra: {
      ...context,
    },
  });
};
```

## Implementation Plan

1. **Set Up Jest Configuration**: Configure Jest for automated testing
2. **Create GitHub Actions Workflow**: Set up CI/CD pipeline for automated testing
3. **Implement Translation Validation**: Create script to validate translations
4. **Set Up Visual Regression Testing**: Implement visual regression tests
5. **Implement End-to-End Testing**: Set up Detox for end-to-end testing
6. **Set Up Continuous Monitoring**: Implement error tracking and monitoring

## Benefits

1. **Early Detection of Issues**: Catch translation and UI issues early in the development process
2. **Consistent Quality**: Ensure consistent quality across all languages
3. **Reduced Manual Testing**: Reduce the need for manual testing
4. **Improved Developer Experience**: Make it easier for developers to work with translations
5. **Better User Experience**: Provide a better experience for Spanish-speaking users

By implementing automated testing for the Spanish version, we can ensure ongoing quality and a better user experience for Spanish-speaking users.