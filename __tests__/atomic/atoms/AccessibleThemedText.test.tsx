/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AccessibleThemedText } from '../../../atomic/atoms/AccessibleThemedText';

// Mock the theme context
jest.mock('../../../contexts/ThemeContext', () => ({
  useTheme: () => ({
    colors: {
      text: '#000000',
      background: '#ffffff',
    },
    isDark: false,
  }),
}));

describe('AccessibleThemedText', () => {
  const defaultProps = {
    children: 'Test text content',
  };

  it('renders without crashing', () => {
    render(<AccessibleThemedText {...defaultProps} />);
    expect(screen.getByText('Test text content')).toBeInTheDocument();
  });

  it('applies accessibility attributes correctly', () => {
    render(
      <AccessibleThemedText 
        {...defaultProps}
        accessibilityRole="header"
        accessibilityLabel="Main heading"
      />
    );
    
    const element = screen.getByText('Test text content');
    expect(element).toHaveAttribute('role', 'header');
    expect(element).toHaveAttribute('aria-label', 'Main heading');
  });

  it('handles empty children gracefully', () => {
    render(<AccessibleThemedText>{''}</AccessibleThemedText>);
    expect(screen.getByTestId('accessible-themed-text')).toBeInTheDocument();
  });

  it('handles null children gracefully', () => {
    render(<AccessibleThemedText>{null}</AccessibleThemedText>);
    expect(screen.getByTestId('accessible-themed-text')).toBeInTheDocument();
  });

  it('applies custom styles correctly', () => {
    const customStyle = { fontSize: 16, fontWeight: 'bold' };
    render(<AccessibleThemedText {...defaultProps} style={customStyle} />);
    
    const element = screen.getByText('Test text content');
    expect(element).toHaveStyle('font-size: 16px');
    expect(element).toHaveStyle('font-weight: bold');
  });

  it('supports semantic heading levels', () => {
    render(
      <AccessibleThemedText 
        {...defaultProps}
        accessibilityRole="heading"
        accessibilityLevel={2}
      />
    );
    
    const element = screen.getByText('Test text content');
    expect(element).toHaveAttribute('role', 'heading');
    expect(element).toHaveAttribute('aria-level', '2');
  });

  it('handles long text content', () => {
    const longText = 'A'.repeat(1000);
    render(<AccessibleThemedText>{longText}</AccessibleThemedText>);
    expect(screen.getByText(longText)).toBeInTheDocument();
  });

  it('supports accessibility hints', () => {
    render(
      <AccessibleThemedText 
        {...defaultProps}
        accessibilityHint="This text provides important information"
      />
    );
    
    const element = screen.getByText('Test text content');
    expect(element).toHaveAttribute('aria-describedby');
  });

  it('handles special characters and emojis', () => {
    const specialText = 'Special chars: & < > " \' and emoji 🎉';
    render(<AccessibleThemedText>{specialText}</AccessibleThemedText>);
    expect(screen.getByText(specialText)).toBeInTheDocument();
  });

  it('applies correct color contrast for accessibility', () => {
    render(<AccessibleThemedText {...defaultProps} />);
    const element = screen.getByText('Test text content');
    
    // Should have adequate contrast (mocked theme provides black on white)
    expect(element).toHaveStyle('color: #000000');
  });

  it('supports screen reader-only content', () => {
    render(
      <AccessibleThemedText 
        {...defaultProps}
        screenReaderOnly={true}
      />
    );
    
    const element = screen.getByText('Test text content');
    expect(element).toHaveClass('sr-only');
  });

  it('handles dynamic text updates', () => {
    const { rerender } = render(<AccessibleThemedText>Original text</AccessibleThemedText>);
    expect(screen.getByText('Original text')).toBeInTheDocument();
    
    rerender(<AccessibleThemedText>Updated text</AccessibleThemedText>);
    expect(screen.getByText('Updated text')).toBeInTheDocument();
    expect(screen.queryByText('Original text')).not.toBeInTheDocument();
  });

  it('supports multiple accessibility roles', () => {
    render(
      <AccessibleThemedText 
        {...defaultProps}
        accessibilityRole="button"
        accessibilityLabel="Text button"
        accessibilityState={{ pressed: false }}
      />
    );
    
    const element = screen.getByText('Test text content');
    expect(element).toHaveAttribute('role', 'button');
    expect(element).toHaveAttribute('aria-label', 'Text button');
    expect(element).toHaveAttribute('aria-pressed', 'false');
  });
});