/**
 * Signup Page Tests
 * 
 * Tests for the Signup page component.
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react';
import { SignupPage } from '../../../atomic/pages';

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
      error: '#FF3B30',
      onError: '#FFFFFF',
    },
  })),
}));

jest.mock('../../../atomic/organisms', () => ({
  firebaseService: {
    auth: {
      createUserWithEmailAndPassword: jest.fn(() => Promise.resolve()),
    },
  },
  monitoringService: {
    error: {
      captureException: jest.fn(),
      getUserFriendlyMessage: jest.fn(() => 'An error occurred'),
    },
  },
}));

jest.mock('../../../atomic/templates', () => ({
  MainLayout: ({ children }) => <>{children}</>,
}));

describe('SignupPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly', () => {
    // Arrange & Act
    const { getByText, getByPlaceholderText } = render(<SignupPage />);
    
    // Assert
    expect(getByText('Create Account')).toBeTruthy();
    expect(getByPlaceholderText('Enter your email')).toBeTruthy();
    expect(getByPlaceholderText('Enter your password')).toBeTruthy();
    expect(getByPlaceholderText('Confirm your password')).toBeTruthy();
    expect(getByText('Sign Up')).toBeTruthy();
    expect(getByText('Already have an account? Sign in')).toBeTruthy();
  });

  it('shows error when passwords do not match', () => {
    // Arrange
    const { getByText, getByPlaceholderText } = render(<SignupPage />);
    
    // Act
    fireEvent.changeText(getByPlaceholderText('Enter your email'), 'test@example.com');
    fireEvent.changeText(getByPlaceholderText('Enter your password'), 'password123');
    fireEvent.changeText(getByPlaceholderText('Confirm your password'), 'password456');
    fireEvent.press(getByText('Sign Up'));
    
    // Assert
    expect(getByText("Passwords don't match.")).toBeTruthy();
  });

  it('calls createUserWithEmailAndPassword when form is valid', async () => {
    // Arrange
    const { getByText, getByPlaceholderText } = render(<SignupPage />);
    const { firebaseService } = require('../../../atomic/organisms');
    
    // Act
    fireEvent.changeText(getByPlaceholderText('Enter your email'), 'test@example.com');
    fireEvent.changeText(getByPlaceholderText('Enter your password'), 'password123');
    fireEvent.changeText(getByPlaceholderText('Confirm your password'), 'password123');
    fireEvent.press(getByText('Sign Up'));
    
    // Assert
    await waitFor(() => {
      expect(firebaseService.auth.createUserWithEmailAndPassword).toHaveBeenCalledWith(
        'test@example.com',
        'password123'
      );
    });
  });

  it('shows error message when signup fails', async () => {
    // Arrange
    const { getByText, getByPlaceholderText } = render(<SignupPage />);
    const { firebaseService, monitoringService } = require('../../../atomic/organisms');
    
    // Mock the signup to fail
    firebaseService.auth.createUserWithEmailAndPassword.mockRejectedValueOnce(new Error('Signup failed'));
    
    // Act
    fireEvent.changeText(getByPlaceholderText('Enter your email'), 'test@example.com');
    fireEvent.changeText(getByPlaceholderText('Enter your password'), 'password123');
    fireEvent.changeText(getByPlaceholderText('Confirm your password'), 'password123');
    fireEvent.press(getByText('Sign Up'));
    
    // Assert
    await waitFor(() => {
      expect(monitoringService.error.captureException).toHaveBeenCalled();
      expect(getByText('An error occurred')).toBeTruthy();
    });
  });
});