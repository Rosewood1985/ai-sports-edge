/**
 * Profile Page Tests
 * Tests for the Profile Page component.
 */

// External imports
import React from 'react';
import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { render, fireEvent, waitFor } from '@testing-library/react-native';

// Internal imports
import { ProfilePage } from '../../../atomic/pages';

// Mock Alert
global.Alert = { alert: jest.fn() };

// Mock dependencies
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: jest.fn(),
  }),
}));

jest.mock('../../../atomic/molecules/themeContext', () => ({
  useTheme: jest.fn(() => ({
    colors: {
      background: '#FFFFFF',
      text: '#000000',
      primary: '#007BFF',
      secondary: '#6C757D',
      error: '#FF3B30',
      success: '#4CD964',
      border: '#E0E0E0',
      surface: '#F5F5F5',
      textSecondary: '#757575',
      onPrimary: '#FFFFFF',
      onSecondary: '#FFFFFF',
      onSuccess: '#FFFFFF',
      onError: '#FFFFFF',
    },
  })),
}));

jest.mock('../../../atomic/molecules/i18nContext', () => ({
  useI18n: jest.fn(() => ({
    t: jest.fn(key => {
      const translations = {
        'common.loading': 'Loading...',
        'common.success': 'Success',
        'common.error': 'Error',
        'profile.betsWon': 'Bets Won',
        'profile.betsLost': 'Bets Lost',
        'profile.totalBets': 'Total Bets',
        'profile.winRate': 'Win Rate',
        'profile.favoriteTeam': 'Favorite Team',
        'profile.favoriteLeague': 'Favorite League',
        'profile.bettingStats': 'Betting Stats',
        'profile.bettingHistory': 'Betting History',
        'profile.settings': 'Settings',
        'profile.actions': 'Actions',
        'profile.logout': 'Log Out',
        'profile.alerts.imageUpdated': 'Profile image updated',
      };
      return translations[key] || key;
    }),
  })),
}));

jest.mock('../../../atomic/templates', () => ({
  MainLayout: ({ children }) => <>{children}</>,
}));

jest.mock('../../../atomic/organisms', () => ({
  firebaseService: {
    auth: {
      getCurrentUser: jest.fn(() => ({
        uid: 'test-uid',
        email: 'test@example.com',
        displayName: 'Test User',
        photoURL: 'https://example.com/photo.jpg',
      })),
      signOut: jest.fn(() => Promise.resolve()),
      updateProfile: jest.fn(() => Promise.resolve()),
    },
    firestore: {
      getUserStats: jest.fn(() => Promise.resolve({
        betsWon: 10,
        betsLost: 5,
        totalBets: 15,
        winRate: 67,
        favoriteTeam: 'Test Team',
        favoriteLeague: 'Test League',
      })),
    },
    storage: {
      uploadProfileImage: jest.fn(() => Promise.resolve('https://example.com/new-photo.jpg')),
    },
  },
  monitoringService: {
    error: {
      captureException: jest.fn(),
    },
  },
}));

jest.mock('expo-image-picker', () => ({
  launchImageLibraryAsync: jest.fn(),
  requestMediaLibraryPermissionsAsync: jest.fn(),
  MediaTypeOptions: {
    Images: 'images',
  },
}));

describe('ProfilePage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading state initially', () => {
    const { getByText } = render(<ProfilePage />);
    expect(getByText('Loading...')).toBeTruthy();
  });

  it('renders user info after loading', async () => {
    const { getByText } = render(<ProfilePage />);

    await waitFor(() => {
      expect(getByText('Test User')).toBeTruthy();
      expect(getByText('test@example.com')).toBeTruthy();
    });
  });

  it('renders stats after loading', async () => {
    const { getByText } = render(<ProfilePage />);

    await waitFor(() => {
      expect(getByText('10')).toBeTruthy(); // Bets Won
      expect(getByText('5')).toBeTruthy(); // Bets Lost
      expect(getByText('15')).toBeTruthy(); // Total Bets
      expect(getByText('67%')).toBeTruthy(); // Win Rate
      expect(getByText('Test Team')).toBeTruthy();
      expect(getByText('Test League')).toBeTruthy();
    });
  });

  it('renders actions after loading', async () => {
    const { getByText } = render(<ProfilePage />);

    await waitFor(() => {
      expect(getByText('Betting Stats')).toBeTruthy();
      expect(getByText('Betting History')).toBeTruthy();
      expect(getByText('Settings')).toBeTruthy();
      expect(getByText('Actions')).toBeTruthy();
      expect(getByText('Log Out')).toBeTruthy();
    });
  });

  it('handles navigation to betting history', async () => {
    const navigation = require('@react-navigation/native').useNavigation();
    const { getByText } = render(<ProfilePage />);

    await waitFor(() => {
      fireEvent.press(getByText('Betting History'));
      expect(navigation.navigate).toHaveBeenCalledWith('BettingHistory');
    });
  });

  it('handles navigation to settings', async () => {
    const navigation = require('@react-navigation/native').useNavigation();
    const { getByText } = render(<ProfilePage />);

    await waitFor(() => {
      fireEvent.press(getByText('Settings'));
      expect(navigation.navigate).toHaveBeenCalledWith('Settings');
    });
  });

  it('handles logout', async () => {
    const navigation = require('@react-navigation/native').useNavigation();
    const { getByText } = render(<ProfilePage />);

    await waitFor(() => {
      fireEvent.press(getByText('Log Out'));
      expect(navigation.navigate).toHaveBeenCalledWith('Login');
    });
  });

  it('handles image selection', async () => {
    ImagePicker.requestMediaLibraryPermissionsAsync.mockResolvedValue({ status: 'granted' });
    ImagePicker.launchImageLibraryAsync.mockResolvedValue({
      canceled: false,
      assets: [{ uri: 'file:///test/image.jpg' }],
    });

    const { getByText } = render(<ProfilePage />);

    await waitFor(() => {
      fireEvent.press(getByText('Test User'));
      expect(ImagePicker.requestMediaLibraryPermissionsAsync).toHaveBeenCalled();
      expect(ImagePicker.launchImageLibraryAsync).toHaveBeenCalled();
      expect(Alert.alert).toHaveBeenCalledWith('Success', 'Profile image updated');
    });
  });
});