/**
 * Home Page Tests
 * 
 * Tests for the Home page component.
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { HomePage } from '../../../atomic/pages';

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
      surface: '#F5F5F5',
      primary: '#007BFF',
      onPrimary: '#FFFFFF',
      text: '#000000',
      textSecondary: '#757575',
      border: '#E0E0E0',
    },
    toggleTheme: jest.fn(),
  })),
}));

jest.mock('../../../atomic/organisms', () => ({
  firebaseService: {
    auth: {
      getCurrentUser: jest.fn(() => ({
        uid: 'test-uid',
        email: 'test@example.com',
        displayName: 'Test User',
      })),
    },
    firestore: {
      getDocument: jest.fn(() => Promise.resolve({
        id: 'test-uid',
        name: 'Test User',
        email: 'test@example.com',
        preferences: {
          notifications: true,
          darkMode: false,
        },
      })),
    },
  },
  monitoringService: {
    error: {
      captureException: jest.fn(),
      getUserFriendlyMessage: jest.fn(() => 'An error occurred'),
    },
    performance: {
      startTrace: jest.fn(() => ({
        stop: jest.fn(),
      })),
    },
  },
}));

jest.mock('../../../atomic/templates', () => ({
  MainLayout: ({ children, header }) => (
    <>
      {header}
      {children}
    </>
  ),
}));

describe('HomePage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly', async () => {
    // Arrange & Act
    const { getByText, findByText } = render(<HomePage />);
    
    // Assert
    expect(getByText('AI Sports Edge')).toBeTruthy();
    
    // Wait for async content to load
    const welcomeText = await findByText('Welcome, Test User');
    expect(welcomeText).toBeTruthy();
  });

  it('navigates to profile when profile button is pressed', () => {
    // Arrange
    const { getByTestId } = render(<HomePage />);
    const navigation = require('@react-navigation/native').useNavigation();
    
    // Act
    fireEvent.press(getByTestId('profile-button'));
    
    // Assert
    expect(navigation.navigate).toHaveBeenCalledWith('Profile');
  });

  it('toggles theme when theme button is pressed', () => {
    // Arrange
    const { getByTestId } = render(<HomePage />);
    const { useTheme } = require('../../../atomic/molecules/themeContext');
    const { toggleTheme } = useTheme();
    
    // Act
    fireEvent.press(getByTestId('theme-toggle-button'));
    
    // Assert
    expect(toggleTheme).toHaveBeenCalled();
  });

  it('fetches user data on mount', () => {
    // Arrange
    render(<HomePage />);
    const { firebaseService } = require('../../../atomic/organisms');
    
    // Assert
    expect(firebaseService.auth.getCurrentUser).toHaveBeenCalled();
    expect(firebaseService.firestore.getDocument).toHaveBeenCalledWith('users', 'test-uid');
  });

  it('starts performance trace on mount', () => {
    // Arrange
    render(<HomePage />);
    const { monitoringService } = require('../../../atomic/organisms');
    
    // Assert
    expect(monitoringService.performance.startTrace).toHaveBeenCalledWith('home_page_load');
  });
});