/**
 * MainLayout Template Tests
 * Tests for the MainLayout template component.
 */

// External imports
import React from 'react';
import { render } from '@testing-library/react-native';

// Internal imports
import { MainLayout } from '../../../atomic/templates';

// Mock dependencies
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
    },
  })),
}));

jest.mock('../../../atomic/molecules/i18nContext', () => ({
  useI18n: jest.fn(() => ({
    t: jest.fn(key => key),
  })),
}));

describe('MainLayout', () => {
  it('renders children correctly', () => {
    const { getByText } = render(
      <MainLayout>
        <div>Content</div>
      </MainLayout>
    );

    expect(getByText('Content')).toBeTruthy();
  });

  it('renders with header and footer', () => {
    const header = <div>Header Content</div>;
    const footer = <div>Footer Content</div>;

    const { getByText } = render(
      <MainLayout header={header} footer={footer}>
        <div>Main Content</div>
      </MainLayout>
    );

    expect(getByText('Header Content')).toBeTruthy();
    expect(getByText('Main Content')).toBeTruthy();
    expect(getByText('Footer Content')).toBeTruthy();
  });

  it('applies theme colors correctly', () => {
    const { container } = render(
      <MainLayout>
        <div>Content</div>
      </MainLayout>
    );

    // Verify that the theme context is being used
    const useTheme = require('../../../atomic/molecules/themeContext').useTheme;
    expect(useTheme).toHaveBeenCalled();
  });

  it('renders without header and footer', () => {
    const { getByText, queryByText } = render(
      <MainLayout>
        <div>Only Content</div>
      </MainLayout>
    );

    expect(getByText('Only Content')).toBeTruthy();
    // Ensure no default header/footer text appears
    expect(queryByText('Header')).toBeFalsy();
    expect(queryByText('Footer')).toBeFalsy();
  });
});