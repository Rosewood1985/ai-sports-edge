// External imports
import React from 'react';


import { render, fireEvent, waitFor } from '@testing-library/react';


// Internal imports
import { ForgotPasswordPage } from '../../../atomic/pages';




























      background: '#FFFFFF',
      border: '#E0E0E0',
      captureException: jest.fn(),
      error: '#FF3B30',
      expect(firebaseService.auth.sendPasswordResetEmail).toHaveBeenCalledWith('test@example.com');
      expect(getByText('An error occurred')).toBeTruthy();
      expect(getByText('Check your inbox for the reset link.')).toBeTruthy();
      expect(monitoringService.error.captureException).toHaveBeenCalled();
      getUserFriendlyMessage: jest.fn(() => 'An error occurred'),
      onError: '#FFFFFF',
      onPrimary: '#FFFFFF',
      onSuccess: '#FFFFFF',
      primary: '#007BFF',
      sendPasswordResetEmail: jest.fn(() => Promise.resolve()),
      success: '#4CD964',
      surface: '#F5F5F5',
      text: '#000000',
      textSecondary: '#757575',
    // Act
    // Act
    // Act
    // Act
    // Arrange
    // Arrange
    // Arrange
    // Arrange
    // Arrange & Act
    // Assert
    // Assert
    // Assert
    // Assert
    // Assert
    // Mock the reset to fail
    auth: {
    await waitFor(() => {
    await waitFor(() => {
    await waitFor(() => {
    colors: {
    const navigation = require('@react-navigation/native').useNavigation();
    const { firebaseService } = require('../../../atomic/organisms');
    const { firebaseService, monitoringService } = require('../../../atomic/organisms');
    const { getByText } = render(<ForgotPasswordPage />);
    const { getByText, getByPlaceholderText } = render(<ForgotPasswordPage />);
    const { getByText, getByPlaceholderText } = render(<ForgotPasswordPage />);
    const { getByText, getByPlaceholderText } = render(<ForgotPasswordPage />);
    const { getByText, getByPlaceholderText } = render(<ForgotPasswordPage />);
    error: {
    expect(getByPlaceholderText('Enter your email')).toBeTruthy();
    expect(getByText('Back to login')).toBeTruthy();
    expect(getByText('Reset Password')).toBeTruthy();
    expect(getByText('Send Reset Email')).toBeTruthy();
    expect(navigation.navigate).toHaveBeenCalledWith('Login');
    fireEvent.changeText(getByPlaceholderText('Enter your email'), 'test@example.com');
    fireEvent.changeText(getByPlaceholderText('Enter your email'), 'test@example.com');
    fireEvent.changeText(getByPlaceholderText('Enter your email'), 'test@example.com');
    fireEvent.press(getByText('Back to login'));
    fireEvent.press(getByText('Send Reset Email'));
    fireEvent.press(getByText('Send Reset Email'));
    fireEvent.press(getByText('Send Reset Email'));
    firebaseService.auth.sendPasswordResetEmail.mockRejectedValueOnce(new Error('Reset failed'));
    jest.clearAllMocks();
    navigate: jest.fn(),
    });
    });
    });
    },
    },
    },
  MainLayout: ({ children }) => <>{children}</>,
  beforeEach(() => {
  firebaseService: {
  it('calls sendPasswordResetEmail when form is submitted', async () => {
  it('navigates to login when back link is pressed', () => {
  it('renders correctly', () => {
  it('shows error message when reset email fails', async () => {
  it('shows success message when reset email is sent', async () => {
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
  });
  },
  },
 *
 * Forgot Password Page Tests
 * Tests for the Forgot Password page component.
 */
/**
// External imports
// Internal imports
// Mock dependencies
describe('ForgotPasswordPage', () => {
jest.mock('../../../atomic/molecules/themeContext', () => ({
jest.mock('../../../atomic/organisms', () => ({
jest.mock('../../../atomic/templates', () => ({
jest.mock('@react-navigation/native', () => ({
}));
}));
}));
}));
});

