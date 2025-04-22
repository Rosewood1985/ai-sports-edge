/**
 * Settings Page Tests
 * 
 * Tests for the Settings Page component.
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import * as Linking from 'expo-linking';
import Constants from 'expo-constants';
import { SettingsPage } from '../../../atomic/pages';

// Mock dependencies
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: jest.fn(),
  }),
}));

jest.mock('expo-linking', () => ({
  openURL: jest.fn(),
}));

jest.mock('expo-constants', () => ({
  manifest: {
    version: '1.2.3',
  },
}));

jest.mock('../../../atomic/molecules/themeContext', () => ({
  useTheme: jest.fn(() => ({
    colors: {
      background: '#FFFFFF',
      surface: '#F5F5F5',
      primary: '#007BFF',
      onPrimary: '#FFFFFF',
      secondary: '#6C757D',
      onSecondary: '#FFFFFF',
      text: '#000000',
      textSecondary: '#757575',
      border: '#E0E0E0',
      error: '#FF3B30',
      onError: '#FFFFFF',
      success: '#4CD964',
      onSuccess: '#FFFFFF',
    },
    theme: 'light',
    setTheme: jest.fn(),
  })),
}));

jest.mock('../../../atomic/molecules/i18nContext', () => ({
  useI18n: jest.fn(() => ({
    t: jest.fn((key) => {
      const translations = {
        'common.cancel': 'Cancel',
        'common.delete': 'Delete',
        'common.error': 'Error',
        'common.loading': 'Loading...',
        'common.success': 'Success',
        'settings.account': 'Account',
        'settings.alerts.saved': 'Settings saved successfully',
        'settings.analytics': 'Analytics',
        'settings.appearance': 'Appearance',
        'settings.darkMode': 'Dark Mode',
        'settings.deleteAccount': 'Delete Account',
        'settings.deleteAccountConfirm': 'Are you sure you want to delete your account? This action cannot be undone.',
        'settings.errors.deleteFailed': 'Failed to delete account',
        'settings.errors.loadFailed': 'Failed to load settings',
        'settings.errors.saveFailed': 'Failed to save settings',
        'settings.helpCenter': 'Help Center',
        'settings.language': 'Language',
        'settings.location': 'Location',
        'settings.notifications': 'Notifications',
        'settings.preferences': 'Preferences',
        'settings.privacyPolicy': 'Privacy Policy',
        'settings.saveSettings': 'Save Settings',
        'settings.support': 'Support',
        'settings.termsOfService': 'Terms of Service',
        'settings.version': 'Version',
      };
      return translations[key] || key;
    }),
    locale: 'en',
    setLocale: jest.fn(),
  })),
}));

jest.mock('../../../atomic/organisms', () => ({
  firebaseService: {
    auth: {
      getCurrentUser: jest.fn(() => ({
        uid: 'test-uid',
        email: 'test@example.com',
      })),
      deleteUser: jest.fn(() => Promise.resolve()),
    },
    firestore: {
      getUserSettings: jest.fn(() => Promise.resolve({
        notifications: true,
        location: false,
        analytics: true,
      })),
      updateUserSettings: jest.fn(() => Promise.resolve()),
      deleteUserData: jest.fn(() => Promise.resolve()),
    },
  },
  monitoringService: {
    error: {
      captureException: jest.fn(),
    },
  },
}));

jest.mock('../../../atomic/templates', () => ({
  MainLayout: ({ children }) => <>{children}</>,
}));

// Mock Alert
global.Alert = { alert: jest.fn() };

describe('SettingsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading state initially', () => {
    // Arrange
    const { getByText } = render(<SettingsPage />);
    
    // Assert
    expect(getByText('Loading...')).toBeTruthy();
  });

  it('renders settings after loading', async () => {
    // Arrange
    const { getByText } = render(<SettingsPage />);
    
    // Act & Assert
    await waitFor(() => {
      expect(getByText('Appearance')).toBeTruthy();
      expect(getByText('Dark Mode')).toBeTruthy();
      expect(getByText('Language')).toBeTruthy();
      expect(getByText('Preferences')).toBeTruthy();
      expect(getByText('Notifications')).toBeTruthy();
      expect(getByText('Location')).toBeTruthy();
      expect(getByText('Analytics')).toBeTruthy();
      expect(getByText('Support')).toBeTruthy();
      expect(getByText('Help Center')).toBeTruthy();
      expect(getByText('Privacy Policy')).toBeTruthy();
      expect(getByText('Terms of Service')).toBeTruthy();
      expect(getByText('Account')).toBeTruthy();
      expect(getByText('Delete Account')).toBeTruthy();
      expect(getByText('Save Settings')).toBeTruthy();
      expect(getByText('Version: 1.2.3')).toBeTruthy();
    });
  });

  it('handles save settings', async () => {
    // Arrange
    const { getByText } = render(<SettingsPage />);
    
    // Act
    await waitFor(() => {
      fireEvent.press(getByText('Save Settings'));
    });
    
    // Assert
    expect(firebaseService.firestore.updateUserSettings).toHaveBeenCalledWith(
      'test-uid',
      {
        notifications: true,
        location: false,
        analytics: true,
      }
    );
    expect(Alert.alert).toHaveBeenCalledWith('Success', 'Settings saved successfully');
  });

  it('handles opening privacy policy', async () => {
    // Arrange
    const { getByText } = render(<SettingsPage />);
    
    // Act
    await waitFor(() => {
      fireEvent.press(getByText('Privacy Policy'));
    });
    
    // Assert
    expect(Linking.openURL).toHaveBeenCalledWith('https://aisportsedge.app/privacy');
  });

  it('handles opening terms of service', async () => {
    // Arrange
    const { getByText } = render(<SettingsPage />);
    
    // Act
    await waitFor(() => {
      fireEvent.press(getByText('Terms of Service'));
    });
    
    // Assert
    expect(Linking.openURL).toHaveBeenCalledWith('https://aisportsedge.app/terms');
  });

  it('handles opening help center', async () => {
    // Arrange
    const { getByText } = render(<SettingsPage />);
    
    // Act
    await waitFor(() => {
      fireEvent.press(getByText('Help Center'));
    });
    
    // Assert
    expect(Linking.openURL).toHaveBeenCalledWith('https://aisportsedge.app/help');
  });

  it('handles delete account confirmation', async () => {
    // Arrange
    const { getByText } = render(<SettingsPage />);
    
    // Act
    await waitFor(() => {
      fireEvent.press(getByText('Delete Account'));
    });
    
    // Assert
    expect(Alert.alert).toHaveBeenCalledWith(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: expect.any(Function),
        },
      ],
      { cancelable: true }
    );
  });
});
