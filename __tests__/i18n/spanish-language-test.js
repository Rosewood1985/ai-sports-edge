/**
 * Spanish Language Test
 *
 * This test file verifies that the Spanish language functionality works correctly
 * across the app, including the new features we've added.
 */

import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import React from 'react';

import { I18nProvider, useI18n } from '../../../atomic/organisms/i18n/I18nContext';
import BettingSlipImportScreen from '../../screens/BettingSlipImportScreen';
import EnhancedAnalyticsDashboardScreen from '../../screens/EnhancedAnalyticsDashboardScreen';
import HomeScreen from '../../screens/HomeScreen';
import LoginScreen from '../../screens/LoginScreen';
import NeonLoginScreen from '../../screens/NeonLoginScreen';

// Mock navigation
const Stack = createStackNavigator();
const MockNavigator = ({ component, params = {} }) => (
  <NavigationContainer>
    <Stack.Navigator>
      <Stack.Screen name="MockScreen" component={component} initialParams={params} />
    </Stack.Navigator>
  </NavigationContainer>
);

// Mock auth
jest.mock('../../config/firebase', () => ({
  auth: {
    currentUser: { uid: 'test-user-id' },
    onAuthStateChanged: jest.fn(callback => {
      callback({ uid: 'test-user-id' });
      return jest.fn();
    }),
  },
  firestore: jest.fn(),
}));

// Mock subscription service
jest.mock('../../services/subscriptionService', () => ({
  hasActiveSubscription: jest.fn(() => Promise.resolve(true)),
}));

// Mock analytics service
jest.mock('../../services/analyticsService', () => ({
  trackEvent: jest.fn(),
  AnalyticsEventType: {
    CUSTOM: 'custom',
  },
}));

// Mock enhanced analytics service
jest.mock('../../services/enhancedAnalyticsService', () => ({
  enhancedAnalyticsService: {
    getDashboardData: jest.fn(() =>
      Promise.resolve({
        userEngagement: {
          totalUsers: 5000,
          activeUsers: {
            daily: 1200,
            weekly: 2500,
            monthly: 3800,
          },
          newUsers: 450,
          returningUsers: 3350,
          churnRate: 0.12,
          retentionRate: {
            day1: 0.85,
            day7: 0.65,
            day30: 0.45,
          },
        },
      })
    ),
  },
}));

// Mock betting slip import service
jest.mock('../../services/bettingSlipImportService', () => ({
  bettingSlipImportService: {
    checkSubscriptionRequirements: jest.fn(() =>
      Promise.resolve({
        isFeatureEnabled: true,
        requiredTier: 'premium',
        currentTier: 'premium',
        isEligible: true,
      })
    ),
    importFromScreenshot: jest.fn(() =>
      Promise.resolve({
        success: true,
        message: 'Successfully imported 1 bet from draftkings',
        bets: [
          {
            id: '123',
            betType: 'moneyline',
            amount: 50,
            odds: -110,
            potentialWinnings: 95.45,
            description: 'Los Angeles Lakers ML',
          },
        ],
      })
    ),
  },
}));

describe('Spanish Language Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('LoginScreen displays Spanish text when language is set to Spanish', async () => {
    const TestComponent = () => {
      const { setLanguage } = useI18n();
      React.useEffect(() => {
        setLanguage('es');
      }, [setLanguage]);

      return <LoginScreen />;
    };

    const WrappedComponent = () => (
      <I18nProvider>
        <TestComponent />
      </I18nProvider>
    );

    const { getByText, queryByText } = render(<MockNavigator component={WrappedComponent} />);

    await waitFor(() => {
      expect(getByText('INICIAR SESIÓN')).toBeTruthy();
      expect(getByText('Correo electrónico')).toBeTruthy();
      expect(getByText('Contraseña')).toBeTruthy();
      expect(getByText('¿Olvidó su contraseña?')).toBeTruthy();
      expect(getByText('¿No tiene una cuenta?')).toBeTruthy();
      expect(getByText('Registrarse')).toBeTruthy();

      // Verify English text is not present
      expect(queryByText('SIGN IN')).toBeNull();
      expect(queryByText('Email')).toBeNull();
      expect(queryByText('Password')).toBeNull();
    });
  });

  test('NeonLoginScreen displays Spanish text when language is set to Spanish', async () => {
    const TestComponent = () => {
      const { setLanguage } = useI18n();
      React.useEffect(() => {
        setLanguage('es');
      }, [setLanguage]);

      return <NeonLoginScreen />;
    };

    const WrappedComponent = () => (
      <I18nProvider>
        <TestComponent />
      </I18nProvider>
    );

    const { getByText, queryByText } = render(<MockNavigator component={WrappedComponent} />);

    await waitFor(() => {
      expect(getByText('INICIAR SESIÓN')).toBeTruthy();
      expect(getByText('Correo electrónico')).toBeTruthy();
      expect(getByText('Contraseña')).toBeTruthy();

      // Verify English text is not present
      expect(queryByText('SIGN IN')).toBeNull();
      expect(queryByText('Email')).toBeNull();
      expect(queryByText('Password')).toBeNull();
    });
  });

  test('HomeScreen displays Spanish text for new features when language is set to Spanish', async () => {
    const TestComponent = () => {
      const { setLanguage } = useI18n();
      React.useEffect(() => {
        setLanguage('es');
      }, [setLanguage]);

      return <HomeScreen />;
    };

    const WrappedComponent = () => (
      <I18nProvider>
        <TestComponent />
      </I18nProvider>
    );

    const { getByText } = render(<MockNavigator component={WrappedComponent} />);

    await waitFor(() => {
      // Check for Spanish text in the new features
      expect(getByText('Análisis Mejorado')).toBeTruthy();
      expect(getByText('Importación de Boletos de Apuestas')).toBeTruthy();
    });
  });

  test('EnhancedAnalyticsDashboardScreen displays Spanish text when language is set to Spanish', async () => {
    const TestComponent = () => {
      const { setLanguage } = useI18n();
      React.useEffect(() => {
        setLanguage('es');
      }, [setLanguage]);

      return <EnhancedAnalyticsDashboardScreen />;
    };

    const WrappedComponent = () => (
      <I18nProvider>
        <TestComponent />
      </I18nProvider>
    );

    const { getByText, queryByText } = render(<MockNavigator component={WrappedComponent} />);

    await waitFor(() => {
      // Check for Spanish text in the Enhanced Analytics Dashboard
      expect(getByText('Análisis Mejorado')).toBeTruthy();
      expect(getByText('Panel de Administración')).toBeTruthy();
      expect(getByText('Participación de Usuarios')).toBeTruthy();

      // Verify English text is not present
      expect(queryByText('Enhanced Analytics')).toBeNull();
      expect(queryByText('Admin Dashboard')).toBeNull();
      expect(queryByText('User Engagement')).toBeNull();
    });
  });

  test('BettingSlipImportScreen displays Spanish text when language is set to Spanish', async () => {
    const TestComponent = () => {
      const { setLanguage } = useI18n();
      React.useEffect(() => {
        setLanguage('es');
      }, [setLanguage]);

      return <BettingSlipImportScreen />;
    };

    const WrappedComponent = () => (
      <I18nProvider>
        <TestComponent />
      </I18nProvider>
    );

    const { getByText, queryByText } = render(<MockNavigator component={WrappedComponent} />);

    await waitFor(() => {
      // Check for Spanish text in the Betting Slip Import Screen
      expect(getByText('Importación de Boletos de Apuestas')).toBeTruthy();
      expect(getByText('Importe sus boletos de apuestas desde casas de apuestas')).toBeTruthy();
      expect(getByText('Seleccionar Casa de Apuestas')).toBeTruthy();

      // Verify English text is not present
      expect(queryByText('Betting Slip Import')).toBeNull();
      expect(queryByText('Import your betting slips from sportsbooks')).toBeNull();
      expect(queryByText('Select Sportsbook')).toBeNull();
    });
  });

  test('Language can be switched from Spanish to English', async () => {
    const TestComponent = () => {
      const { language, setLanguage, t } = useI18n();

      React.useEffect(() => {
        setLanguage('es');
      }, [setLanguage]);

      return (
        <div>
          <div data-testid="current-language">{language}</div>
          <button
            data-testid="switch-language"
            onClick={() => setLanguage(language === 'en' ? 'es' : 'en')}
          >
            {t('languageSelector.switchToEnglish')}
          </button>
          <div data-testid="login-text">{t('login.signIn')}</div>
        </div>
      );
    };

    const WrappedComponent = () => (
      <I18nProvider>
        <TestComponent />
      </I18nProvider>
    );

    const { getByTestId } = render(<MockNavigator component={WrappedComponent} />);

    await waitFor(() => {
      expect(getByTestId('current-language').textContent).toBe('es');
      expect(getByTestId('login-text').textContent).toBe('INICIAR SESIÓN');
    });

    // Switch language to English
    fireEvent.press(getByTestId('switch-language'));

    await waitFor(() => {
      expect(getByTestId('current-language').textContent).toBe('en');
      expect(getByTestId('login-text').textContent).toBe('SIGN IN');
    });
  });
});
