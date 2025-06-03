/**
 * Forgot Password Page Tests
 * Tests for the Forgot Password page component.
 */

// External imports
import { render, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';

// Internal imports
import { ForgotPasswordPage } from '../../../atomic/pages';

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
      error: '#FF3B30',
      success: '#4CD964',
      border: '#E0E0E0',
      surface: '#F5F5F5',
      textSecondary: '#757575',
      onPrimary: '#FFFFFF',
      onSuccess: '#FFFFFF',
      onError: '#FFFFFF',
    },
  })),
}));

jest.mock('../../../atomic/templates', () => ({
  MainLayout: ({ children }) => <>{children}</>,
}));

jest.mock('../../../atomic/organisms', () => ({
  firebaseService: {
    auth: {
      sendPasswordResetEmail: jest.fn(() => Promise.resolve()),
    },
  },
  monitoringService: {
    error: {
      captureException: jest.fn(),
      getUserFriendlyMessage: jest.fn(() => 'An error occurred'),
    },
  },
}));

describe('ForgotPasswordPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly', () => {
    // Arrange & Act
    const { getByText, getByPlaceholderText } = render(<ForgotPasswordPage />);

    // Assert
    expect(getByText('Reset Password')).toBeTruthy();
    expect(getByPlaceholderText('Enter your email')).toBeTruthy();
    expect(getByText('Send Reset Email')).toBeTruthy();
    expect(getByText('Back to login')).toBeTruthy();
  });

  it('navigates to login when back link is pressed', () => {
    // Arrange
    const navigation = require('@react-navigation/native').useNavigation();
    const { getByText } = render(<ForgotPasswordPage />);

    // Act
    fireEvent.press(getByText('Back to login'));

    // Assert
    expect(navigation.navigate).toHaveBeenCalledWith('Login');
  });

  it('calls sendPasswordResetEmail when form is submitted', async () => {
    // Arrange
    const { firebaseService } = require('../../../atomic/organisms');
    const { getByText, getByPlaceholderText } = render(<ForgotPasswordPage />);

    // Act
    fireEvent.changeText(getByPlaceholderText('Enter your email'), 'test@example.com');
    fireEvent.press(getByText('Send Reset Email'));

    // Assert
    await waitFor(() => {
      expect(firebaseService.auth.sendPasswordResetEmail).toHaveBeenCalledWith('test@example.com');
    });
  });

  it('shows success message when reset email is sent', async () => {
    // Arrange
    const { getByText, getByPlaceholderText } = render(<ForgotPasswordPage />);

    // Act
    fireEvent.changeText(getByPlaceholderText('Enter your email'), 'test@example.com');
    fireEvent.press(getByText('Send Reset Email'));

    // Assert
    await waitFor(() => {
      expect(getByText('Check your inbox for the reset link.')).toBeTruthy();
    });
  });

  it('shows error message when reset email fails', async () => {
    // Arrange
    const { firebaseService, monitoringService } = require('../../../atomic/organisms');

    // Mock the reset to fail
    firebaseService.auth.sendPasswordResetEmail.mockRejectedValueOnce(new Error('Reset failed'));

    const { getByText, getByPlaceholderText } = render(<ForgotPasswordPage />);

    // Act
    fireEvent.changeText(getByPlaceholderText('Enter your email'), 'test@example.com');
    fireEvent.press(getByText('Send Reset Email'));

    // Assert
    await waitFor(() => {
      expect(getByText('An error occurred')).toBeTruthy();
      expect(monitoringService.error.captureException).toHaveBeenCalled();
    });
  });
});
