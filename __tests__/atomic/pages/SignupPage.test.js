/**
 * Signup Page Tests
 * Tests for the Signup Page component.
 */

// External imports
import React from 'react';
import { Alert } from 'react-native';
import { render, fireEvent, waitFor } from '@testing-library/react-native';

// Internal imports
import { SignupPage } from '../../../atomic/pages';

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
        'signup.title': 'Create Account',
        'signup.email': 'Email',
        'signup.password': 'Password',
        'signup.confirmPassword': 'Confirm Password',
        'signup.createAccount': 'Create Account',
        'signup.alreadyHaveAccount': 'Already have an account? Sign in',
        'signup.errors.passwordMismatch': 'Passwords do not match',
        'signup.errors.weakPassword': 'Password should be at least 6 characters',
        'signup.errors.emailInUse': 'Email is already in use',
        'signup.alerts.accountCreated': 'Account created successfully',
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

describe('SignupPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly', () => {
    const { getByText, getByPlaceholderText } = render(<SignupPage />);

    expect(getByText('Create Account')).toBeTruthy();
    expect(getByPlaceholderText('Email')).toBeTruthy();
    expect(getByPlaceholderText('Password')).toBeTruthy();
    expect(getByPlaceholderText('Confirm Password')).toBeTruthy();
    expect(getByText('Create Account')).toBeTruthy();
    expect(getByText('Already have an account? Sign in')).toBeTruthy();
  });

  it('navigates to login when sign in link is pressed', () => {
    const navigation = require('@react-navigation/native').useNavigation();
    const { getByText } = render(<SignupPage />);

    fireEvent.press(getByText('Already have an account? Sign in'));

    expect(navigation.navigate).toHaveBeenCalledWith('Login');
  });

  it('creates account when form is submitted with valid data', async () => {
    const { firebaseService } = require('../../../atomic/organisms');
    const navigation = require('@react-navigation/native').useNavigation();
    const { getByText, getByPlaceholderText } = render(<SignupPage />);

    // Fill in the form
    fireEvent.changeText(getByPlaceholderText('Email'), 'test@example.com');
    fireEvent.changeText(getByPlaceholderText('Password'), 'password123');
    fireEvent.changeText(getByPlaceholderText('Confirm Password'), 'password123');
    fireEvent.press(getByText('Create Account'));

    // Verify the signup call
    await waitFor(() => {
      expect(firebaseService.auth.createUserWithEmailAndPassword).toHaveBeenCalledWith(
        'test@example.com',
        'password123'
      );
      expect(navigation.navigate).toHaveBeenCalledWith('Home');
    });
  });

  it('shows error when passwords do not match', async () => {
    const { getByText, getByPlaceholderText } = render(<SignupPage />);

    // Fill in the form with mismatched passwords
    fireEvent.changeText(getByPlaceholderText('Email'), 'test@example.com');
    fireEvent.changeText(getByPlaceholderText('Password'), 'password123');
    fireEvent.changeText(getByPlaceholderText('Confirm Password'), 'differentpassword');
    fireEvent.press(getByText('Create Account'));

    // Verify error message
    await waitFor(() => {
      expect(getByText('Passwords do not match')).toBeTruthy();
    });
  });

  it('shows error when signup fails', async () => {
    const { firebaseService, monitoringService } = require('../../../atomic/organisms');
    
    // Mock the signup to fail
    firebaseService.auth.createUserWithEmailAndPassword.mockRejectedValueOnce({
      code: 'auth/email-already-in-use',
    });
    
    const { getByText, getByPlaceholderText } = render(<SignupPage />);

    // Fill in the form
    fireEvent.changeText(getByPlaceholderText('Email'), 'test@example.com');
    fireEvent.changeText(getByPlaceholderText('Password'), 'password123');
    fireEvent.changeText(getByPlaceholderText('Confirm Password'), 'password123');
    fireEvent.press(getByText('Create Account'));

    // Verify error handling
    await waitFor(() => {
      expect(getByText('An error occurred')).toBeTruthy();
      expect(monitoringService.error.captureException).toHaveBeenCalled();
    });
  });

  it('shows error for weak password', async () => {
    const { getByText, getByPlaceholderText } = render(<SignupPage />);

    // Fill in the form with weak password
    fireEvent.changeText(getByPlaceholderText('Email'), 'test@example.com');
    fireEvent.changeText(getByPlaceholderText('Password'), '123');
    fireEvent.changeText(getByPlaceholderText('Confirm Password'), '123');
    fireEvent.press(getByText('Create Account'));

    // Verify error message
    await waitFor(() => {
      expect(getByText('Password should be at least 6 characters')).toBeTruthy();
    });
  });
});