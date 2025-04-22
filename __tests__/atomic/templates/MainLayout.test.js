/**
 * Main Layout Template Tests
 * 
 * Tests for the main layout template.
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import MainLayout from '../../../atomic/templates/MainLayout';

// Mock dependencies
jest.mock('../../../atomic/molecules/themeContext', () => ({
  useTheme: jest.fn(() => ({
    colors: {
      background: '#FFFFFF',
      text: '#000000',
    },
    effectiveTheme: 'light',
  })),
}));

describe('Main Layout Template', () => {
  it('should render with children', () => {
    // Arrange
    const testId = 'test-child';
    const children = <div data-testid={testId}>Test Child</div>;
    
    // Act
    const { getByTestId } = render(
      <MainLayout>{children}</MainLayout>
    );
    
    // Assert
    expect(getByTestId(testId)).toBeTruthy();
  });
  
  it('should render with header and footer', () => {
    // Arrange
    const headerTestId = 'test-header';
    const footerTestId = 'test-footer';
    const header = <div data-testid={headerTestId}>Header</div>;
    const footer = <div data-testid={footerTestId}>Footer</div>;
    
    // Act
    const { getByTestId } = render(
      <MainLayout header={header} footer={footer}>
        <div>Content</div>
      </MainLayout>
    );
    
    // Assert
    expect(getByTestId(headerTestId)).toBeTruthy();
    expect(getByTestId(footerTestId)).toBeTruthy();
  });
});
