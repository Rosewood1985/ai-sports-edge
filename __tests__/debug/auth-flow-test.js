/**
 * Authentication Flow Test Script
 * 
 * This script tests the authentication flow with enhanced logging and error handling.
 * It validates the improvements made to the authentication process.
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, getAuth } from 'firebase/auth';
import AuthScreen from '../../screens/AuthScreen';
import { info, error as logError, LogCategory } from '../../services/loggingService';
import { safeErrorCapture } from '../../services/errorUtils';

// Mock the Firebase auth functions
jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(),
  createUserWithEmailAndPassword: jest.fn(),
  signInWithEmailAndPassword: jest.fn(),
  updateProfile: jest.fn(),
}));

// Mock the logging service
jest.mock('../../services/loggingService', () => ({
  info: jest.fn(),
  error: jest.fn(),
  LogCategory: {
    AUTH: 'auth',
    USER: 'user',
    APP: 'app',
  },
}));

// Mock the error tracking service
jest.mock('../../services/errorUtils', () => ({
  safeErrorCapture: jest.fn(),
}));

// Mock the navigation
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: jest.fn(),
  }),
  useTheme: () => ({
    colors: {
      primary: '#007bff',
      text: '#000000',
      border: '#cccccc',
    },
  }),
}));

// Mock the language context
jest.mock('../../contexts/LanguageContext', () => ({
  useLanguage: () => ({
    t: (key) => key,
  }),
}));

// Mock Alert
jest.spyOn(Alert, 'alert').mockImplementation(() => {});

describe('AuthScreen', () => {
  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    
    // Mock successful auth
    getAuth.mockReturnValue({});
    createUserWithEmailAndPassword.mockResolvedValue({ 
      user: { uid: 'test-uid', email: 'test@example.com' } 
    });
    signInWithEmailAndPassword.mockResolvedValue({
      user: { uid: 'test-uid', email: 'test@example.com' }
    });
  });

  test('logs successful sign in', async () => {
    const { getByPlaceholderText, getByText } = render(<AuthScreen />);
    
    // Fill in the form
    fireEvent.changeText(getByPlaceholderText('auth.email'), 'test@example.com');
    fireEvent.changeText(getByPlaceholderText('auth.password (min. 8 characters)'), 'Password123!');
    
    // Submit the form
    fireEvent.press(getByText('auth.sign_in'));
    
    // Wait for the sign in to complete
    await waitFor(() => {
      // Verify that the sign in function was called
      expect(signInWithEmailAndPassword).toHaveBeenCalledWith(
        expect.anything(),
        'test@example.com',
        'Password123!'
      );
      
      // Verify that the success was logged
      expect(info).toHaveBeenCalledWith(
        LogCategory.AUTH,
        'User signed in successfully',
        expect.objectContaining({ email: 'test@example.com' })
      );
    });
  });

  test('logs sign in error', async () => {
    // Mock a failed sign in
    const authError = new Error('Invalid credentials');
    authError.code = 'auth/wrong-password';
    signInWithEmailAndPassword.mockRejectedValue(authError);
    
    const { getByPlaceholderText, getByText } = render(<AuthScreen />);
    
    // Fill in the form
    fireEvent.changeText(getByPlaceholderText('auth.email'), 'test@example.com');
    fireEvent.changeText(getByPlaceholderText('auth.password (min. 8 characters)'), 'WrongPassword123!');
    
    // Submit the form
    fireEvent.press(getByText('auth.sign_in'));
    
    // Wait for the sign in to fail
    await waitFor(() => {
      // Verify that the error was logged
      expect(logError).toHaveBeenCalledWith(
        LogCategory.AUTH,
        expect.stringContaining('Authentication failed'),
        expect.anything()
      );
      
      // Verify that the error was captured
      expect(safeErrorCapture).toHaveBeenCalled();
    });
  });

  test('logs successful sign up', async () => {
    const { getByPlaceholderText, getByText } = render(<AuthScreen />);
    
    // Switch to sign up mode
    fireEvent.press(getByText('auth.sign_up'));
    
    // Fill in the form
    fireEvent.changeText(getByPlaceholderText('auth.username (3-20 characters)'), 'testuser');
    fireEvent.changeText(getByPlaceholderText('auth.email'), 'test@example.com');
    fireEvent.changeText(getByPlaceholderText('auth.password (min. 8 characters)'), 'Password123!');
    fireEvent.changeText(getByPlaceholderText('auth.confirm_password'), 'Password123!');
    
    // Submit the form
    fireEvent.press(getByText('auth.sign_up'));
    
    // Wait for the sign up to complete
    await waitFor(() => {
      // Verify that the sign up function was called
      expect(createUserWithEmailAndPassword).toHaveBeenCalledWith(
        expect.anything(),
        'test@example.com',
        'Password123!'
      );
      
      // Verify that the success was logged
      expect(info).toHaveBeenCalledWith(
        LogCategory.AUTH,
        'User account created',
        expect.objectContaining({ 
          email: 'test@example.com',
          userId: 'test-uid'
        })
      );
    });
  });

  test('logs forgot password request', async () => {
    const { getByPlaceholderText, getByText } = render(<AuthScreen />);
    
    // Fill in the email
    fireEvent.changeText(getByPlaceholderText('auth.email'), 'test@example.com');
    
    // Press forgot password
    fireEvent.press(getByText('auth.forgot_password'));
    
    // Verify that the request was logged
    expect(info).toHaveBeenCalledWith(
      LogCategory.AUTH,
      'Password reset email requested',
      expect.objectContaining({ email: 'test@example.com' })
    );
    
    // Verify that the alert was shown
    expect(Alert.alert).toHaveBeenCalledWith(
      'auth.password_reset',
      'auth.password_reset_email_sent',
      expect.anything()
    );
  });

  test('logs forgot password error when email is missing', async () => {
    const { getByText } = render(<AuthScreen />);
    
    // Press forgot password without entering an email
    fireEvent.press(getByText('auth.forgot_password'));
    
    // Verify that the error was logged
    expect(logError).toHaveBeenCalledWith(
      LogCategory.AUTH,
      'Password reset attempted without email',
      expect.anything()
    );
    
    // Verify that the alert was shown
    expect(Alert.alert).toHaveBeenCalledWith(
      'auth.email_required',
      'auth.please_enter_email_for_reset',
      expect.anything()
    );
  });
});