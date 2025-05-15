// External imports
import React from 'react';


import { render } from '@testing-library/react-native';


// Internal imports
import { BettingPage } from '../../../atomic/pages';








    auth: { getCurrentUser: jest.fn() },
    const { getByText } = render(<BettingPage />);
    expect(getByText('common.loading')).toBeTruthy();
    firestore: { getUserData: jest.fn(), getAvailableGames: jest.fn() },
  MainLayout: ({ children }) => <>{children}</>,
  firebaseService: {
  formatCurrency: jest.fn(val => `$${val}`),
  it('renders correctly', () => {
  monitoringService: { error: { captureException: jest.fn() } },
  useI18n: () => ({ t: key => key }),
  useNavigation: () => ({ navigate: jest.fn() }),
  useTheme: () => ({ colors: { background: '#FFF', text: '#000', primary: '#007BFF' } }),
  });
  },
describe('BettingPage', () => {
jest.mock('../../../atomic/atoms/formatUtils', () => ({
jest.mock('../../../atomic/molecules/i18nContext', () => ({
jest.mock('../../../atomic/molecules/themeContext', () => ({
jest.mock('../../../atomic/organisms', () => ({
jest.mock('../../../atomic/templates', () => ({
jest.mock('@react-navigation/native', () => ({
}));
}));
}));
}));
}));
}));
});

