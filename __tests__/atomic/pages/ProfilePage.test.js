// External imports
import React from 'react';

import { Alert } from 'react-native';

import * as ImagePicker from 'expo-image-picker';
import { render, fireEvent, waitFor } from '@testing-library/react-native';


// Internal imports
import { ProfilePage } from '../../../atomic/pages';































          betsLost: 5,
          betsWon: 10,
          favoriteLeague: 'Test League',
          favoriteTeam: 'Test Team',
          totalBets: 15,
          winRate: 67,
        'common.error': 'Error',
        'common.loading': 'Loading...',
        'common.success': 'Success',
        'profile.actions': 'Actions',
        'profile.alerts.imageUpdated': 'Profile image updated',
        'profile.anonymous': 'Anonymous User',
        'profile.betsLost': 'Bets Lost',
        'profile.betsWon': 'Bets Won',
        'profile.bettingHistory': 'Betting History',
        'profile.bettingStats': 'Betting Stats',
        'profile.errors.imageFailed': 'Failed to select image',
        'profile.errors.loadFailed': 'Failed to load profile',
        'profile.errors.logoutFailed': 'Failed to log out',
        'profile.errors.permissionDenied': 'Permission denied',
        'profile.errors.uploadFailed': 'Failed to upload image',
        'profile.favoriteLeague': 'Favorite League',
        'profile.favoriteTeam': 'Favorite Team',
        'profile.logout': 'Log Out',
        'profile.settings': 'Settings',
        'profile.totalBets': 'Total Bets',
        'profile.winRate': 'Win Rate',
        Promise.resolve({
        displayName: 'Test User',
        email: 'test@example.com',
        photoURL: 'https://example.com/photo.jpg',
        uid: 'test-uid',
        })
      'file:///test/image.jpg',
      'test-uid'
      ),
      // Find the profile image container and press it
      // In a real test, you might use testID to target it
      // This is a simplification since we can't easily target the TouchableOpacity
      assets: [{ uri: 'file:///test/image.jpg' }],
      background: '#FFFFFF',
      border: '#E0E0E0',
      canceled: false,
      captureException: jest.fn(),
      const translations = {
      error: '#FF3B30',
      expect(getByText('10')).toBeTruthy();
      expect(getByText('15')).toBeTruthy();
      expect(getByText('5')).toBeTruthy();
      expect(getByText('67%')).toBeTruthy();
      expect(getByText('Actions')).toBeTruthy();
      expect(getByText('Betting History')).toBeTruthy();
      expect(getByText('Betting Stats')).toBeTruthy();
      expect(getByText('Log Out')).toBeTruthy();
      expect(getByText('Settings')).toBeTruthy();
      expect(getByText('Test League')).toBeTruthy();
      expect(getByText('Test Team')).toBeTruthy();
      expect(getByText('Test User')).toBeTruthy();
      expect(getByText('test@example.com')).toBeTruthy();
      fireEvent.press(getByText('Betting History'));
      fireEvent.press(getByText('Log Out'));
      fireEvent.press(getByText('Settings'));
      fireEvent.press(getByText('Test User'));
      getCurrentUser: jest.fn(() => ({
      getUserStats: jest.fn(() =>
      onError: '#FFFFFF',
      onPrimary: '#FFFFFF',
      onSecondary: '#FFFFFF',
      onSuccess: '#FFFFFF',
      photoURL: 'https://example.com/new-photo.jpg',
      primary: '#007BFF',
      return translations[key] || key;
      secondary: '#6C757D',
      signOut: jest.fn(() => Promise.resolve()),
      success: '#4CD964',
      surface: '#F5F5F5',
      text: '#000000',
      textSecondary: '#757575',
      updateProfile: jest.fn(() => Promise.resolve()),
      uploadProfileImage: jest.fn(() => Promise.resolve('https://example.com/new-photo.jpg')),
      })),
      };
    );
    // Act
    // Act
    // Act
    // Act
    // Act & Assert
    // Act & Assert
    // Act & Assert
    // Arrange
    // Arrange
    // Arrange
    // Arrange
    // Arrange
    // Arrange
    // Arrange
    // Arrange
    // Assert
    // Assert
    // Assert
    // Assert
    // Assert
    ImagePicker.launchImageLibraryAsync.mockResolvedValue({
    ImagePicker.requestMediaLibraryPermissionsAsync.mockResolvedValue({ status: 'granted' });
    Images: 'images',
    auth: {
    await waitFor(() => {
    await waitFor(() => {
    await waitFor(() => {
    await waitFor(() => {
    await waitFor(() => {
    await waitFor(() => {
    await waitFor(() => {
    colors: {
    const navigation = require('@react-navigation/native').useNavigation();
    const navigation = require('@react-navigation/native').useNavigation();
    const navigation = require('@react-navigation/native').useNavigation();
    const { getByText } = render(<ProfilePage />);
    const { getByText } = render(<ProfilePage />);
    const { getByText } = render(<ProfilePage />);
    const { getByText } = render(<ProfilePage />);
    const { getByText } = render(<ProfilePage />);
    const { getByText } = render(<ProfilePage />);
    const { getByText } = render(<ProfilePage />);
    const { getByText } = render(<ProfilePage />);
    error: {
    expect(Alert.alert).toHaveBeenCalledWith('Success', 'Profile image updated');
    expect(ImagePicker.launchImageLibraryAsync).toHaveBeenCalled();
    expect(ImagePicker.requestMediaLibraryPermissionsAsync).toHaveBeenCalled();
    expect(firebaseService.auth.signOut).toHaveBeenCalled();
    expect(firebaseService.auth.updateProfile).toHaveBeenCalledWith({
    expect(firebaseService.storage.uploadProfileImage).toHaveBeenCalledWith(
    expect(getByText('Loading...')).toBeTruthy();
    expect(navigation.navigate).toHaveBeenCalledWith('BettingHistory');
    expect(navigation.navigate).toHaveBeenCalledWith('Login');
    expect(navigation.navigate).toHaveBeenCalledWith('Settings');
    firestore: {
    jest.clearAllMocks();
    navigate: jest.fn(),
    storage: {
    t: jest.fn(key => {
    }),
    });
    });
    });
    });
    });
    });
    });
    });
    });
    },
    },
    },
    },
    },
  MainLayout: ({ children }) => <>{children}</>,
  MediaTypeOptions: {
  beforeEach(() => {
  firebaseService: {
  it('handles image selection', async () => {
  it('handles logout', async () => {
  it('handles navigation to betting history', async () => {
  it('handles navigation to settings', async () => {
  it('renders actions after loading', async () => {
  it('renders loading state initially', () => {
  it('renders stats after loading', async () => {
  it('renders user info after loading', async () => {
  launchImageLibraryAsync: jest.fn(),
  monitoringService: {
  requestMediaLibraryPermissionsAsync: jest.fn(),
  useI18n: jest.fn(() => ({
  useNavigation: () => ({
  useTheme: jest.fn(() => ({
  })),
  })),
  }),
  });
  });
  });
  });
  });
  });
  });
  });
  });
  },
  },
  },
 *
 * Profile Page Tests
 * Tests for the Profile Page component.
 */
/**
// Mock Alert
// Mock dependencies
describe('ProfilePage', () => {
global.Alert = { alert: jest.fn() };
jest.mock('../../../atomic/molecules/i18nContext', () => ({
jest.mock('../../../atomic/molecules/themeContext', () => ({
jest.mock('../../../atomic/organisms', () => ({
jest.mock('../../../atomic/templates', () => ({
jest.mock('@react-navigation/native', () => ({
jest.mock('expo-image-picker', () => ({
}));
}));
}));
}));
}));
}));
});

