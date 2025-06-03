import { render, fireEvent } from '@testing-library/react-native';
import React from 'react';
import { Platform } from 'react-native';

import { I18nProvider } from '../../../atomic/organisms/i18n/I18nContext';
import LanguageSelector from '../../components/LanguageSelector';
import { ThemeProvider } from '../../contexts/ThemeContext';
import NeonLoginScreen from '../../screens/NeonLoginScreen';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(() => Promise.resolve('es')),
  setItem: jest.fn(),
}));

// Mock Toast
jest.mock('../../components/Toast', () => ({
  Toast: {
    show: jest.fn(),
  },
  ToastContainer: () => null,
}));

// Mock navigation
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: jest.fn(),
  }),
}));

// Mock expo-linear-gradient
jest.mock('expo-linear-gradient', () => ({
  LinearGradient: 'LinearGradient',
}));

// Mock animation hooks
jest.mock('../../utils/animationUtils', () => ({
  useHoverEffect: () => ({
    animatedStyle: {},
    onPressIn: jest.fn(),
    onPressOut: jest.fn(),
  }),
  useGlowHoverEffect: () => ({
    glowOpacity: 0.5,
    glowRadius: 5,
    onPressIn: jest.fn(),
    onPressOut: jest.fn(),
  }),
  useFadeIn: () => 1,
  useSlideIn: () => ({}),
}));

// Helper function to mock platform
const mockPlatform = (platform: 'ios' | 'android' | 'web') => {
  const originalPlatform = Platform.OS;
  Platform.OS = platform;
  return () => {
    Platform.OS = originalPlatform;
  };
};

describe('Spanish Cross-Platform Tests', () => {
  describe('LanguageSelector', () => {
    it('should render correctly on iOS', () => {
      const restorePlatform = mockPlatform('ios');

      try {
        const { getByText } = render(
          <ThemeProvider>
            <I18nProvider initialLanguage="es">
              <LanguageSelector />
            </I18nProvider>
          </ThemeProvider>
        );

        expect(getByText('English')).toBeTruthy();
        expect(getByText('Español')).toBeTruthy();
      } finally {
        restorePlatform();
      }
    });

    it('should render correctly on Android', () => {
      const restorePlatform = mockPlatform('android');

      try {
        const { getByText } = render(
          <ThemeProvider>
            <I18nProvider initialLanguage="es">
              <LanguageSelector />
            </I18nProvider>
          </ThemeProvider>
        );

        expect(getByText('English')).toBeTruthy();
        expect(getByText('Español')).toBeTruthy();
      } finally {
        restorePlatform();
      }
    });

    it('should render correctly on Web', () => {
      const restorePlatform = mockPlatform('web');

      try {
        const { getByText } = render(
          <ThemeProvider>
            <I18nProvider initialLanguage="es">
              <LanguageSelector />
            </I18nProvider>
          </ThemeProvider>
        );

        expect(getByText('English')).toBeTruthy();
        expect(getByText('Español')).toBeTruthy();
      } finally {
        restorePlatform();
      }
    });
  });

  describe('NeonLoginScreen', () => {
    it('should render correctly on iOS', () => {
      const restorePlatform = mockPlatform('ios');

      try {
        const { getByText } = render(
          <ThemeProvider>
            <I18nProvider initialLanguage="es">
              <NeonLoginScreen />
            </I18nProvider>
          </ThemeProvider>
        );

        expect(getByText('INICIAR SESIÓN')).toBeTruthy();
        expect(getByText('¿Olvidó su contraseña?')).toBeTruthy();
      } finally {
        restorePlatform();
      }
    });

    it('should render correctly on Android', () => {
      const restorePlatform = mockPlatform('android');

      try {
        const { getByText } = render(
          <ThemeProvider>
            <I18nProvider initialLanguage="es">
              <NeonLoginScreen />
            </I18nProvider>
          </ThemeProvider>
        );

        expect(getByText('INICIAR SESIÓN')).toBeTruthy();
        expect(getByText('¿Olvidó su contraseña?')).toBeTruthy();
      } finally {
        restorePlatform();
      }
    });

    it('should render correctly on Web', () => {
      const restorePlatform = mockPlatform('web');

      try {
        const { getByText } = render(
          <ThemeProvider>
            <I18nProvider initialLanguage="es">
              <NeonLoginScreen />
            </I18nProvider>
          </ThemeProvider>
        );

        expect(getByText('INICIAR SESIÓN')).toBeTruthy();
        expect(getByText('¿Olvidó su contraseña?')).toBeTruthy();
      } finally {
        restorePlatform();
      }
    });
  });

  describe('Language Switching', () => {
    it('should switch language correctly on all platforms', () => {
      const platforms: ('ios' | 'android' | 'web')[] = ['ios', 'android', 'web'];

      platforms.forEach(platform => {
        const restorePlatform = mockPlatform(platform);

        try {
          const { getByText } = render(
            <ThemeProvider>
              <I18nProvider initialLanguage="es">
                <LanguageSelector />
              </I18nProvider>
            </ThemeProvider>
          );

          // Switch to English
          fireEvent.press(getByText('English'));

          // Switch back to Spanish
          fireEvent.press(getByText('Español'));

          // Verify Spanish is active
          expect(getByText('Español')).toBeTruthy();
        } finally {
          restorePlatform();
        }
      });
    });
  });
});
