import React from 'react';
import { render } from '@testing-library/react-native';
import { BettingPage } from '../../../atomic/pages';

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: jest.fn() }),
}));

jest.mock('../../../atomic/molecules/themeContext', () => ({
  useTheme: () => ({ colors: { background: '#FFF', text: '#000', primary: '#007BFF' } }),
}));

jest.mock('../../../atomic/molecules/i18nContext', () => ({
  useI18n: () => ({ t: key => key }),
}));

jest.mock('../../../atomic/organisms', () => ({
  firebaseService: {
    auth: { getCurrentUser: jest.fn() },
    firestore: { getUserData: jest.fn(), getAvailableGames: jest.fn() },
  },
  monitoringService: { error: { captureException: jest.fn() } },
}));

jest.mock('../../../atomic/templates', () => ({
  MainLayout: ({ children }) => <>{children}</>,
}));

jest.mock('../../../atomic/atoms/formatUtils', () => ({
  formatCurrency: jest.fn(val => `$${val}`),
}));

describe('BettingPage', () => {
  it('renders correctly', () => {
    const { getByText } = render(<BettingPage />);
    expect(getByText('common.loading')).toBeTruthy();
  });
});
