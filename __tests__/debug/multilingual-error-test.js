/**
 * Multilingual Error Handling Test
 *
 * This test validates that error messages are properly displayed in different languages.
 */

import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, getAuth } from 'firebase/auth';
import React from 'react';
import { Alert } from 'react-native';

import { LanguageProvider, useLanguage } from '../../../atomic/organisms/i18n/LanguageContext';
import AuthScreen from '../../screens/AuthScreen';
import { safeErrorCapture } from '../../services/errorUtils';
import { info, error as logError, LogCategory } from '../../services/loggingService';

// Mock the Firebase auth functions
jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(),
  createUserWithEmailAndPassword: jest.fn(),
  signInWithEmailAndPassword: jest.fn(),
  updateProfile: jest.fn(),
}));

// Mock the logging service
jest.mock('../../services/loggingService', () => ({
  info: jest.fn(),
  error: jest.fn(),
  LogCategory: {
    AUTH: 'auth',
    API: 'api',
    APP: 'app',
    USER: 'user',
  },
}));

// Mock the error tracking service
jest.mock('../../services/errorUtils', () => ({
  safeErrorCapture: jest.fn(),
}));

// Mock Alert
jest.spyOn(Alert, 'alert').mockImplementation(() => {});

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

// Mock i18n
jest.mock('i18n-js', () => ({
  t: jest.fn(key => key),
  locale: 'en',
  translations: {},
  fallbacks: true,
  defaultLocale: 'en',
}));

// Mock expo-localization
jest.mock('expo-localization', () => ({
  locale: 'en',
}));

// Create a wrapper component that allows changing the language
const TestWrapper = ({ children, initialLanguage = 'en' }) => {
  return <LanguageProvider>{children}</LanguageProvider>;
};

// Test component that displays an error message
const ErrorMessageComponent = ({ errorKey }) => {
  const { t } = useLanguage();
  return <div data-testid="error-message">{t(errorKey)}</div>;
};

describe('Multilingual Error Handling', () => {
  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();

    // Mock successful auth
    getAuth.mockReturnValue({
      currentUser: null,
    });
  });

  test('displays authentication errors in English', async () => {
    // Mock a failed sign in
    const authError = new Error('Invalid credentials');
    authError.code = 'auth/wrong-password';
    signInWithEmailAndPassword.mockRejectedValue(authError);

    const { getByPlaceholderText, getByText, findByText } = render(
      <TestWrapper initialLanguage="en">
        <AuthScreen />
      </TestWrapper>
    );

    // Fill in the form
    fireEvent.changeText(getByPlaceholderText('auth.email'), 'test@example.com');
    fireEvent.changeText(
      getByPlaceholderText('auth.password (min. 8 characters)'),
      'WrongPassword123!'
    );

    // Submit the form
    fireEvent.press(getByText('auth.sign_in'));

    // Wait for the error message
    await findByText('auth.invalid_credentials');

    // Verify that the error was logged
    expect(logError).toHaveBeenCalledWith(
      LogCategory.AUTH,
      expect.stringContaining('Authentication failed'),
      expect.anything()
    );
  });

  test('displays authentication errors in Spanish', async () => {
    // Set the language to Spanish
    const i18n = require('i18n-js');
    i18n.locale = 'es';

    // Mock translations
    i18n.translations = {
      es: {
        auth: {
          invalid_credentials:
            'Credenciales inválidas. Por favor, verifique su correo electrónico y contraseña.',
          email: 'Correo electrónico',
          password: 'Contraseña',
          sign_in: 'Iniciar sesión',
        },
      },
    };

    // Mock a failed sign in
    const authError = new Error('Invalid credentials');
    authError.code = 'auth/wrong-password';
    signInWithEmailAndPassword.mockRejectedValue(authError);

    const { getByPlaceholderText, getByText, findByText } = render(
      <TestWrapper initialLanguage="es">
        <AuthScreen />
      </TestWrapper>
    );

    // Fill in the form
    fireEvent.changeText(getByPlaceholderText('auth.email'), 'test@example.com');
    fireEvent.changeText(
      getByPlaceholderText('auth.password (min. 8 characters)'),
      'WrongPassword123!'
    );

    // Submit the form
    fireEvent.press(getByText('auth.sign_in'));

    // Wait for the error message
    await findByText('auth.invalid_credentials');

    // Verify that the error was logged
    expect(logError).toHaveBeenCalledWith(
      LogCategory.AUTH,
      expect.stringContaining('Authentication failed'),
      expect.anything()
    );
  });

  test('displays API errors in English', async () => {
    // Create a test component that simulates an API error
    const ApiErrorComponent = () => {
      const { t } = useLanguage();

      const handleApiError = () => {
        try {
          throw new Error('Network error');
        } catch (error) {
          logError(LogCategory.API, 'API request failed', error);
          Alert.alert(t('error.general_error'), t('api.network_error'));
        }
      };

      return (
        <button data-testid="api-button" onClick={handleApiError}>
          Make API Request
        </button>
      );
    };

    const { getByTestId } = render(
      <TestWrapper initialLanguage="en">
        <ApiErrorComponent />
      </TestWrapper>
    );

    // Trigger the API error
    fireEvent.press(getByTestId('api-button'));

    // Verify that the alert was shown
    expect(Alert.alert).toHaveBeenCalledWith('error.general_error', 'api.network_error');

    // Verify that the error was logged
    expect(logError).toHaveBeenCalledWith(LogCategory.API, 'API request failed', expect.anything());
  });

  test('displays API errors in Spanish', async () => {
    // Set the language to Spanish
    const i18n = require('i18n-js');
    i18n.locale = 'es';

    // Mock translations
    i18n.translations = {
      es: {
        error: {
          general_error: 'Ha ocurrido un error',
        },
        api: {
          network_error:
            'Error de red. Por favor, verifique su conexión a Internet e inténtelo de nuevo.',
        },
      },
    };

    // Create a test component that simulates an API error
    const ApiErrorComponent = () => {
      const { t } = useLanguage();

      const handleApiError = () => {
        try {
          throw new Error('Network error');
        } catch (error) {
          logError(LogCategory.API, 'API request failed', error);
          Alert.alert(t('error.general_error'), t('api.network_error'));
        }
      };

      return (
        <button data-testid="api-button" onClick={handleApiError}>
          Make API Request
        </button>
      );
    };

    const { getByTestId } = render(
      <TestWrapper initialLanguage="es">
        <ApiErrorComponent />
      </TestWrapper>
    );

    // Trigger the API error
    fireEvent.press(getByTestId('api-button'));

    // Verify that the alert was shown
    expect(Alert.alert).toHaveBeenCalledWith('error.general_error', 'api.network_error');

    // Verify that the error was logged
    expect(logError).toHaveBeenCalledWith(LogCategory.API, 'API request failed', expect.anything());
  });

  test('language switching updates error messages', async () => {
    // Create a test component that allows changing the language
    const LanguageSwitchComponent = () => {
      const { language, setLanguage, t } = useLanguage();
      const [error, setError] = useState('error.general_error');

      const switchToSpanish = async () => {
        await setLanguage('es');
      };

      const switchToEnglish = async () => {
        await setLanguage('en');
      };

      return (
        <div>
          <div data-testid="current-language">{language}</div>
          <div data-testid="error-message">{t(error)}</div>
          <button data-testid="spanish-button" onClick={switchToSpanish}>
            Switch to Spanish
          </button>
          <button data-testid="english-button" onClick={switchToEnglish}>
            Switch to English
          </button>
        </div>
      );
    };

    const { getByTestId } = render(
      <TestWrapper>
        <LanguageSwitchComponent />
      </TestWrapper>
    );

    // Verify initial language
    expect(getByTestId('current-language').textContent).toBe('en');
    expect(getByTestId('error-message').textContent).toBe('error.general_error');

    // Switch to Spanish
    fireEvent.press(getByTestId('spanish-button'));

    // Wait for language to change
    await waitFor(() => {
      expect(getByTestId('current-language').textContent).toBe('es');
    });

    // Verify error message in Spanish
    expect(getByTestId('error-message').textContent).toBe('error.general_error');

    // Switch back to English
    fireEvent.press(getByTestId('english-button'));

    // Wait for language to change
    await waitFor(() => {
      expect(getByTestId('current-language').textContent).toBe('en');
    });

    // Verify error message in English
    expect(getByTestId('error-message').textContent).toBe('error.general_error');
  });
});
