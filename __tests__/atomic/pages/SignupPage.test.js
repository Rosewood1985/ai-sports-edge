// External imports
import React from 'react';


import { render, fireEvent, waitFor } from '@testing-library/react';


// Internal imports
import { SignupPage } from '../../../atomic/pages';

























        'password123'
        'test@example.com',
      );
      background: '#FFFFFF',
      border: '#E0E0E0',
      captureException: jest.fn(),
      createUserWithEmailAndPassword: jest.fn(() => Promise.resolve()),
      error: '#FF3B30',
      expect(firebaseService.auth.createUserWithEmailAndPassword).toHaveBeenCalledWith(
      expect(getByText('An error occurred')).toBeTruthy();
      expect(monitoringService.error.captureException).toHaveBeenCalled();
      getUserFriendlyMessage: jest.fn(() => 'An error occurred'),
      new Error('Signup failed')
      onError: '#FFFFFF',
      onPrimary: '#FFFFFF',
      primary: '#007BFF',
      surface: '#F5F5F5',
      text: '#000000',
      textSecondary: '#757575',
    );
    // Act
    // Act
    // Act
    // Arrange
    // Arrange
    // Arrange
    // Arrange & Act
    // Assert
    // Assert
    // Assert
    // Assert
    // Mock the signup to fail
    auth: {
    await waitFor(() => {
    await waitFor(() => {
    colors: {
    const { firebaseService } = require('../../../atomic/organisms');
    const { firebaseService, monitoringService } = require('../../../atomic/organisms');
    const { getByText, getByPlaceholderText } = render(<SignupPage />);
    const { getByText, getByPlaceholderText } = render(<SignupPage />);
    const { getByText, getByPlaceholderText } = render(<SignupPage />);
    const { getByText, getByPlaceholderText } = render(<SignupPage />);
    error: {
    expect(getByPlaceholderText('Confirm your password')).toBeTruthy();
    expect(getByPlaceholderText('Enter your email')).toBeTruthy();
    expect(getByPlaceholderText('Enter your password')).toBeTruthy();
    expect(getByText("Passwords don't match.")).toBeTruthy();
    expect(getByText('Already have an account? Sign in')).toBeTruthy();
    expect(getByText('Create Account')).toBeTruthy();
    expect(getByText('Sign Up')).toBeTruthy();
    fireEvent.changeText(getByPlaceholderText('Confirm your password'), 'password123');
    fireEvent.changeText(getByPlaceholderText('Confirm your password'), 'password123');
    fireEvent.changeText(getByPlaceholderText('Confirm your password'), 'password456');
    fireEvent.changeText(getByPlaceholderText('Enter your email'), 'test@example.com');
    fireEvent.changeText(getByPlaceholderText('Enter your email'), 'test@example.com');
    fireEvent.changeText(getByPlaceholderText('Enter your email'), 'test@example.com');
    fireEvent.changeText(getByPlaceholderText('Enter your password'), 'password123');
    fireEvent.changeText(getByPlaceholderText('Enter your password'), 'password123');
    fireEvent.changeText(getByPlaceholderText('Enter your password'), 'password123');
    fireEvent.press(getByText('Sign Up'));
    fireEvent.press(getByText('Sign Up'));
    fireEvent.press(getByText('Sign Up'));
    firebaseService.auth.createUserWithEmailAndPassword.mockRejectedValueOnce(
    jest.clearAllMocks();
    navigate: jest.fn(),
    });
    });
    },
    },
    },
  MainLayout: ({ children }) => <>{children}</>,
  beforeEach(() => {
  firebaseService: {
  it('calls createUserWithEmailAndPassword when form is valid', async () => {
  it('renders correctly', () => {
  it('shows error message when signup fails', async () => {
  it('shows error when passwords do not match', () => {
  monitoringService: {
  useNavigation: () => ({
  useTheme: jest.fn(() => ({
  })),
  }),
  });
  });
  });
  });
  });
  },
  },
 *
 * Signup Page Tests
 * Tests for the Signup page component.
 */
/**
// External imports
// Internal imports
// Mock dependencies
describe('SignupPage', () => {
jest.mock('../../../atomic/molecules/themeContext', () => ({
jest.mock('../../../atomic/organisms', () => ({
jest.mock('../../../atomic/templates', () => ({
jest.mock('@react-navigation/native', () => ({
}));
}));
}));
}));
});

