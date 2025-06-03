/**
 * BettingPage Tests
 * Tests for the betting page component.
 */

// External imports
import { render } from '@testing-library/react-native';
import React from 'react';

// Internal imports
import { BettingPage } from '../../../atomic/pages';

// Mock navigation
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: jest.fn() }),
}));

// Mock theme context
jest.mock('../../../atomic/molecules/themeContext', () => ({
  useTheme: () => ({ colors: { background: '#FFF', text: '#000', primary: '#007BFF' } }),
}));

// Mock i18n context
jest.mock('../../../atomic/molecules/i18nContext', () => ({
  useI18n: () => ({ t: key => key }),
}));

// Mock templates
jest.mock('../../../atomic/templates', () => ({
  MainLayout: ({ children }) => <>{children}</>,
}));

// Mock organisms
jest.mock('../../../atomic/organisms', () => ({
  monitoringService: { error: { captureException: jest.fn() } },
}));

// Mock format utils
jest.mock('../../../atomic/atoms/formatUtils', () => ({
  formatCurrency: jest.fn(val => `$${val}`),
}));

// Mock Firebase service
jest.mock('../../../services/firebaseService', () => ({
  firebaseService: {
    auth: { getCurrentUser: jest.fn() },
    firestore: { getUserData: jest.fn(), getAvailableGames: jest.fn() },
  },
}));

describe('BettingPage', () => {
  it('renders correctly', () => {
    const { getByText } = render(<BettingPage />);
    expect(getByText('common.loading')).toBeTruthy();
  });
});
