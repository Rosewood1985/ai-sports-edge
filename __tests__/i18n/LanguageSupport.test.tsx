import AsyncStorage from '@react-native-async-storage/async-storage';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import React from 'react';

import { I18nProvider, useI18n } from '../../../atomic/organisms/i18n/I18nContext';
import LanguageSelector from '../../components/LanguageSelector';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  getAllKeys: jest.fn(),
  multiGet: jest.fn(),
  multiSet: jest.fn(),
  multiRemove: jest.fn(),
}));

// Mock Toast
jest.mock('../../components/Toast', () => ({
  Toast: {
    show: jest.fn(),
  },
  ToastContainer: () => null,
}));

// Test component that uses the I18n context
const TestComponent = () => {
  const { t, language } = useI18n();
  return (
    <>
      <LanguageSelector />
      <div data-testid="language">{language}</div>
      <div data-testid="translation">{t('login.title')}</div>
    </>
  );
};

describe('Language Support', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should default to English if no language is saved', async () => {
    // Mock AsyncStorage to return null (no saved language)
    AsyncStorage.getItem.mockResolvedValue(null);

    const { getByTestId } = render(
      <I18nProvider>
        <TestComponent />
      </I18nProvider>
    );

    // Wait for AsyncStorage to resolve
    await waitFor(() => {
      expect(AsyncStorage.getItem).toHaveBeenCalledWith('app_language');
    });

    // Check that the language is English
    expect(getByTestId('language').props.children).toBe('en');
    expect(getByTestId('translation').props.children).toBe('AI SPORTS EDGE');
  });

  it('should load Spanish if it is saved in AsyncStorage', async () => {
    // Mock AsyncStorage to return 'es' (Spanish)
    AsyncStorage.getItem.mockResolvedValue('es');

    const { getByTestId } = render(
      <I18nProvider>
        <TestComponent />
      </I18nProvider>
    );

    // Wait for AsyncStorage to resolve
    await waitFor(() => {
      expect(AsyncStorage.getItem).toHaveBeenCalledWith('app_language');
    });

    // Check that the language is Spanish
    expect(getByTestId('language').props.children).toBe('es');
    expect(getByTestId('translation').props.children).toBe('AI SPORTS EDGE');
  });

  it('should change language when the language selector is clicked', async () => {
    // Mock AsyncStorage to return 'en' (English)
    AsyncStorage.getItem.mockResolvedValue('en');

    const { getByText, getByTestId } = render(
      <I18nProvider>
        <TestComponent />
      </I18nProvider>
    );

    // Wait for AsyncStorage to resolve
    await waitFor(() => {
      expect(AsyncStorage.getItem).toHaveBeenCalledWith('app_language');
    });

    // Check that the language is English
    expect(getByTestId('language').props.children).toBe('en');

    // Click on the Spanish language button
    fireEvent.press(getByText('Español'));

    // Check that the language is changed to Spanish
    expect(getByTestId('language').props.children).toBe('es');
    expect(AsyncStorage.setItem).toHaveBeenCalledWith('app_language', 'es');
  });

  it('should save the language preference when the language is changed', async () => {
    // Mock AsyncStorage to return 'en' (English)
    AsyncStorage.getItem.mockResolvedValue('en');

    const { getByText } = render(
      <I18nProvider>
        <TestComponent />
      </I18nProvider>
    );

    // Wait for AsyncStorage to resolve
    await waitFor(() => {
      expect(AsyncStorage.getItem).toHaveBeenCalledWith('app_language');
    });

    // Click on the Spanish language button
    fireEvent.press(getByText('Español'));

    // Check that the language preference is saved
    expect(AsyncStorage.setItem).toHaveBeenCalledWith('app_language', 'es');
  });

  it('should detect device language if no language is saved', async () => {
    // Mock AsyncStorage to return null (no saved language)
    AsyncStorage.getItem.mockResolvedValue(null);

    // Mock navigator.language to return 'es-ES' (Spanish)
    Object.defineProperty(navigator, 'language', {
      get: () => 'es-ES',
      configurable: true,
    });

    const { getByTestId } = render(
      <I18nProvider>
        <TestComponent />
      </I18nProvider>
    );

    // Wait for AsyncStorage to resolve
    await waitFor(() => {
      expect(AsyncStorage.getItem).toHaveBeenCalledWith('app_language');
    });

    // Check that the language is Spanish
    expect(getByTestId('language').props.children).toBe('es');
    expect(AsyncStorage.setItem).toHaveBeenCalledWith('app_language', 'es');
  });
});
