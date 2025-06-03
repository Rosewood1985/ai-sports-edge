/**
 * Settings Page Tests
 * Tests for the Settings Page component.
 */

// External imports
import React from 'react';
import { Alert } from 'react-native';
import { render, fireEvent, waitFor } from '@testing-library/react-native';

// Internal imports
import { SettingsPage } from '../../../atomic/pages';

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
        'settings.notifications': 'Notifications',
        'settings.analytics': 'Analytics',
        'settings.location': 'Location Services',
        'settings.theme': 'Theme',
        'settings.language': 'Language',
        'settings.account': 'Account',
        'settings.deleteAccount': 'Delete Account',
        'settings.privacy': 'Privacy Settings',
        'settings.about': 'About',
        'settings.version': 'Version',
        'settings.alerts.accountDeleted': 'Account successfully deleted',
        'settings.alerts.settingsSaved': 'Settings saved successfully',
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
      })),
      deleteUser: jest.fn(() => Promise.resolve()),
    },
    firestore: {
      getUserSettings: jest.fn(() => Promise.resolve({
        notifications: true,
        analytics: true,
        location: false,
      })),
      updateUserSettings: jest.fn(() => Promise.resolve()),
    },
  },
  monitoringService: {
    error: {
      captureException: jest.fn(),
    },
  },
}));

describe('SettingsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading state initially', () => {
    const { getByText } = render(<SettingsPage />);
    expect(getByText('Loading...')).toBeTruthy();
  });

  it('renders settings options after loading', async () => {
    const { getByText } = render(<SettingsPage />);

    await waitFor(() => {
      expect(getByText('Notifications')).toBeTruthy();
      expect(getByText('Analytics')).toBeTruthy();
      expect(getByText('Location Services')).toBeTruthy();
      expect(getByText('Theme')).toBeTruthy();
      expect(getByText('Language')).toBeTruthy();
      expect(getByText('Account')).toBeTruthy();
      expect(getByText('Privacy Settings')).toBeTruthy();
      expect(getByText('About')).toBeTruthy();
    });
  });

  it('handles notification toggle', async () => {
    const { getByText } = render(<SettingsPage />);
    const firebaseService = require('../../../atomic/organisms').firebaseService;

    await waitFor(() => {
      fireEvent.press(getByText('Notifications'));
      expect(firebaseService.firestore.updateUserSettings).toHaveBeenCalledWith({
        notifications: false,
        analytics: true,
        location: false,
      });
    });
  });

  it('handles analytics toggle', async () => {
    const { getByText } = render(<SettingsPage />);
    const firebaseService = require('../../../atomic/organisms').firebaseService;

    await waitFor(() => {
      fireEvent.press(getByText('Analytics'));
      expect(firebaseService.firestore.updateUserSettings).toHaveBeenCalledWith({
        notifications: true,
        analytics: false,
        location: false,
      });
    });
  });

  it('handles location toggle', async () => {
    const { getByText } = render(<SettingsPage />);
    const firebaseService = require('../../../atomic/organisms').firebaseService;

    await waitFor(() => {
      fireEvent.press(getByText('Location Services'));
      expect(firebaseService.firestore.updateUserSettings).toHaveBeenCalledWith({
        notifications: true,
        analytics: true,
        location: true,
      });
    });
  });

  it('handles account deletion', async () => {
    const { getByText } = render(<SettingsPage />);
    const navigation = require('@react-navigation/native').useNavigation();
    const firebaseService = require('../../../atomic/organisms').firebaseService;

    // Mock Alert.alert to simulate user confirmation
    Alert.alert.mockImplementation((title, message, buttons) => {
      // Simulate pressing the "Delete" button
      buttons[1].onPress();
    });

    await waitFor(() => {
      fireEvent.press(getByText('Delete Account'));
      expect(Alert.alert).toHaveBeenCalledWith(
        'Delete Account',
        'Are you sure you want to delete your account? This action cannot be undone.',
        expect.arrayContaining([
          expect.objectContaining({ style: 'cancel' }),
          expect.objectContaining({ style: 'destructive', onPress: expect.any(Function) }),
        ])
      );
      expect(firebaseService.auth.deleteUser).toHaveBeenCalled();
      expect(navigation.navigate).toHaveBeenCalledWith('Login');
    });
  });

  it('handles navigation to privacy settings', async () => {
    const { getByText } = render(<SettingsPage />);
    const navigation = require('@react-navigation/native').useNavigation();

    await waitFor(() => {
      fireEvent.press(getByText('Privacy Settings'));
      expect(navigation.navigate).toHaveBeenCalledWith('PrivacySettings');
    });
  });

  it('handles navigation to about page', async () => {
    const { getByText } = render(<SettingsPage />);
    const navigation = require('@react-navigation/native').useNavigation();

    await waitFor(() => {
      fireEvent.press(getByText('About'));
      expect(navigation.navigate).toHaveBeenCalledWith('About');
    });
  });
});