/**
 * Login Screen Tests
 * 
 * Tests for the Login Screen component.
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react';
import { LoginScreen } from '../../../atomic/pages';

// Mock dependencies
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: jest.fn(),
    replace: jest.fn(),
  }),
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
  })),
}));

jest.mock('../../../atomic/molecules/i18nContext', () => ({
  useI18n: jest.fn(() => ({
    t: jest.fn((key) => {
      const translations = {
        'common.error': 'Error',
        'common.success': 'Success',
        'common.loading': 'Loading...',
        'common.close': 'Close',
        'login.title': 'Welcome Back',
        'login.subtitle': 'Sign in to continue',
        'login.email': 'Email',
        'login.password': 'Password',
        'login.signIn': 'Sign In',
        'login.signUp': 'Sign Up',
        'login.forgotPassword': 'Forgot Password?',
        'login.dontHaveAccount': 'Don\'t have an account?',
        'login.features.signUp': 'Sign Up',
        'login.alerts.accountCreated': 'Account created successfully',
        'login.alerts.loggedIn': 'Logged in successfully',
        'login.errors.emailRequired': 'Email is required',
        'login.errors.passwordRequired': 'Password is required',
        'login.errors.invalidEmail': 'Invalid email format',
        'login.errors.signUpFailed': 'Sign up failed',
        'login.errors.emailInUse': 'Email already in use',
        'login.errors.weakPassword': 'Password is too weak',
        'login.errors.loginFailed': 'Login failed',
        'login.errors.invalidCredentials': 'Invalid email or password',
        'login.errors.accountDisabled': 'Account has been disabled',
        'login.errors.tooManyAttempts': 'Too many attempts, try again later',
        'download.title': 'Get the App',
        'download.subtitle': 'Download our app for a better experience',
        'download.appStore': 'App Store',
        'download.playStore': 'Play Store',
      };
      return translations[key] || key;
    }),
  })),
}));

jest.mock('../../../atomic/organisms', () => ({
  firebaseService: {
    auth: {
      signInWithEmailAndPassword: jest.fn(() => Promise.resolve()),
      createUserWithEmailAndPassword: jest.fn(() => Promise.resolve()),
      getCurrentUser: jest.fn(() => ({
        uid: 'test-uid',
        email: 'test@example.com',
      })),
    },
  },
  monitoringService: {
    error: {
      captureException: jest.fn(),
    },
  },
  appDownloadService: {
    getAppStoreUrls: jest.fn(() => ({
      appStoreUrl: 'https://apps.apple.com/app/id123456789',
      playStoreUrl: 'https://play.google.com/store/apps/details?id=com.example.app',
      webAppUrl: 'https://example.com',
    })),
    shouldShowDownloadPrompt: jest.fn(() => Promise.resolve(false)),
    markDownloadPromptAsShown: jest.fn(() => Promise.resolve()),
    openAppStore: jest.fn(),
    openPlayStore: jest.fn(),
  },
}));

jest.mock('../../../atomic/templates', () => ({
  MainLayout: ({ children }) => <>{children}</>,
}));

// Mock Alert
global.Alert = {
  alert: jest.fn(),
};

describe('LoginScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly', () => {
    // Arrange & Act
    const { getByText, getByPlaceholderText } = render(<LoginScreen />);
    
    // Assert
    expect(getByText('Welcome Back')).toBeTruthy();
    expect(getByText('Sign in to continue')).toBeTruthy();
    expect(getByPlaceholderText('Email')).toBeTruthy();
    expect(getByPlaceholderText('Password')).toBeTruthy();
    expect(getByText('Sign In')).toBeTruthy();
    expect(getByText('Sign Up')).toBeTruthy();
    expect(getByText('Forgot Password?')).toBeTruthy();
    expect(getByText("Don't have an account?")).toBeTruthy();
  });

  it('validates email and password on login', () => {
    // Arrange
    const { getByText } = render(<LoginScreen />);
    
    // Act
    fireEvent.press(getByText('Sign In'));
    
    // Assert
    expect(global.Alert.alert).toHaveBeenCalledWith('Error', 'Email is required');
  });

  it('calls signInWithEmailAndPassword when form is valid', async () => {
    // Arrange
    const { getByText, getByPlaceholderText } = render(<LoginScreen />);
    const { firebaseService } = require('../../../atomic/organisms');
    
    // Act
    fireEvent.changeText(getByPlaceholderText('Email'), 'test@example.com');
    fireEvent.changeText(getByPlaceholderText('Password'), 'password123');
    fireEvent.press(getByText('Sign In'));
    
    // Assert
    await waitFor(() => {
      expect(firebaseService.auth.signInWithEmailAndPassword).toHaveBeenCalledWith(
        'test@example.com',
        'password123'
      );
    });
  });

  it('calls createUserWithEmailAndPassword when signing up', async () => {
    // Arrange
    const { getByText, getByPlaceholderText } = render(<LoginScreen />);
    const { firebaseService } = require('../../../atomic/organisms');
    
    // Act
    fireEvent.changeText(getByPlaceholderText('Email'), 'test@example.com');
    fireEvent.changeText(getByPlaceholderText('Password'), 'password123');
    fireEvent.press(getByText('Sign Up'));
    
    // Assert
    await waitFor(() => {
      expect(firebaseService.auth.createUserWithEmailAndPassword).toHaveBeenCalledWith(
        'test@example.com',
        'password123'
      );
    });
  });

  it('shows error message when login fails', async () => {
    // Arrange
    const { getByText, getByPlaceholderText } = render(<LoginScreen />);
    const { firebaseService } = require('../../../atomic/organisms');
    
    // Mock the login to fail
    firebaseService.auth.signInWithEmailAndPassword.mockRejectedValueOnce({
      code: 'auth/user-not-found',
    });
    
    // Act
    fireEvent.changeText(getByPlaceholderText('Email'), 'test@example.com');
    fireEvent.changeText(getByPlaceholderText('Password'), 'password123');
    fireEvent.press(getByText('Sign In'));
    
    // Assert
    await waitFor(() => {
      expect(global.Alert.alert).toHaveBeenCalledWith('Error', 'Invalid email or password');
    });
  });

  it('navigates to ForgotPassword when forgot password link is pressed', () => {
    // Arrange
    const { getByText } = render(<LoginScreen />);
    const navigation = require('@react-navigation/native').useNavigation();
    
    // Act
    fireEvent.press(getByText('Forgot Password?'));
    
    // Assert
    expect(navigation.navigate).toHaveBeenCalledWith('ForgotPassword');
  });
});