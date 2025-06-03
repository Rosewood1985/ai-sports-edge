import { render, fireEvent } from '@testing-library/react-native';
import React from 'react';

import { AccessibleThemedText } from '../../atomic/atoms/AccessibleThemedText';
import accessibilityService from '../../services/accessibilityService';

// Mock the accessibilityService
jest.mock('../../services/accessibilityService', () => ({
  getPreferences: jest.fn(),
  addListener: jest.fn(() => jest.fn()), // Return a function to unsubscribe
  isHighContrastActive: jest.fn(),
  isBoldTextActive: jest.fn(),
  getAccessibilityProps: jest.fn((label, hint, role) => ({
    accessible: true,
    accessibilityLabel: label,
    accessibilityHint: hint,
    accessibilityRole: role,
  })),
}));

// Mock the useTheme hook
jest.mock('@react-navigation/native', () => ({
  useTheme: jest.fn(() => ({
    colors: {
      text: '#000000',
      primary: '#0066CC',
    },
  })),
}));

describe('AccessibleThemedText', () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Default mock implementations
    (accessibilityService.getPreferences as jest.Mock).mockReturnValue({
      largeText: false,
      highContrast: false,
      reduceMotion: false,
      screenReaderHints: true,
      boldText: false,
      grayscale: false,
      invertColors: false,
    });

    (accessibilityService.isHighContrastActive as jest.Mock).mockReturnValue(false);
    (accessibilityService.isBoldTextActive as jest.Mock).mockReturnValue(false);
  });

  it('renders correctly with default props', () => {
    const { getByText } = render(<AccessibleThemedText>Test Text</AccessibleThemedText>);
    expect(getByText('Test Text')).toBeTruthy();
  });

  it('applies the correct semantic type styles', () => {
    const { getByText, rerender } = render(
      <AccessibleThemedText type="h1">Heading 1</AccessibleThemedText>
    );

    const h1Element = getByText('Heading 1');
    expect(h1Element.props.style).toContainEqual(
      expect.objectContaining({
        fontSize: 28,
        fontWeight: 'bold',
      })
    );

    // Test h2
    rerender(<AccessibleThemedText type="h2">Heading 2</AccessibleThemedText>);
    const h2Element = getByText('Heading 2');
    expect(h2Element.props.style).toContainEqual(
      expect.objectContaining({
        fontSize: 24,
        fontWeight: 'bold',
      })
    );

    // Test h3
    rerender(<AccessibleThemedText type="h3">Heading 3</AccessibleThemedText>);
    const h3Element = getByText('Heading 3');
    expect(h3Element.props.style).toContainEqual(
      expect.objectContaining({
        fontSize: 20,
        fontWeight: '600',
      })
    );
  });

  it('applies the correct color based on the color prop', () => {
    const { getByText, rerender } = render(
      <AccessibleThemedText color="primary">Primary Text</AccessibleThemedText>
    );

    const primaryElement = getByText('Primary Text');
    expect(primaryElement.props.style).toContainEqual(
      expect.objectContaining({
        color: '#000000', // From the mocked useTheme
      })
    );

    // Test action color
    rerender(<AccessibleThemedText color="action">Action Text</AccessibleThemedText>);
    const actionElement = getByText('Action Text');
    expect(actionElement.props.style).toContainEqual(
      expect.objectContaining({
        color: '#0066CC', // From the mocked useTheme
      })
    );

    // Test statusHigh color
    rerender(<AccessibleThemedText color="statusHigh">Status High</AccessibleThemedText>);
    const statusHighElement = getByText('Status High');
    expect(statusHighElement.props.style).toContainEqual(
      expect.objectContaining({
        color: '#39FF14', // Neon Green
      })
    );
  });

  it('applies high contrast styles when enabled', () => {
    // Mock high contrast as enabled
    (accessibilityService.isHighContrastActive as jest.Mock).mockReturnValue(true);

    const { getByText } = render(<AccessibleThemedText>High Contrast Text</AccessibleThemedText>);

    const textElement = getByText('High Contrast Text');
    expect(textElement.props.style).toContainEqual(
      expect.objectContaining({
        color: '#000000',
        backgroundColor: '#ffffff',
      })
    );
  });

  it('applies large text styles when enabled', () => {
    // Mock large text as enabled
    (accessibilityService.getPreferences as jest.Mock).mockReturnValue({
      largeText: true,
      highContrast: false,
      reduceMotion: false,
      screenReaderHints: true,
      boldText: false,
      grayscale: false,
      invertColors: false,
    });

    const { getByText } = render(<AccessibleThemedText>Large Text</AccessibleThemedText>);

    const textElement = getByText('Large Text');
    expect(textElement.props.style).toContainEqual(
      expect.objectContaining({
        fontSize: 18,
      })
    );
  });

  it('applies bold text styles when enabled', () => {
    // Mock bold text as enabled
    (accessibilityService.isBoldTextActive as jest.Mock).mockReturnValue(true);

    const { getByText } = render(<AccessibleThemedText>Bold Text</AccessibleThemedText>);

    const textElement = getByText('Bold Text');
    expect(textElement.props.style).toContainEqual(
      expect.objectContaining({
        fontWeight: 'bold',
      })
    );
  });

  it('applies custom style overrides', () => {
    const customStyle = {
      marginTop: 20,
      paddingHorizontal: 10,
    };

    const { getByText } = render(
      <AccessibleThemedText style={customStyle}>Custom Style</AccessibleThemedText>
    );

    const textElement = getByText('Custom Style');
    expect(textElement.props.style).toContainEqual(expect.objectContaining(customStyle));
  });

  it('applies custom high contrast style overrides', () => {
    // Mock high contrast as enabled
    (accessibilityService.isHighContrastActive as jest.Mock).mockReturnValue(true);

    const customHighContrastStyle = {
      backgroundColor: '#FFFF00', // Yellow background
      color: '#000000', // Black text
    };

    const { getByText } = render(
      <AccessibleThemedText highContrastStyle={customHighContrastStyle}>
        Custom High Contrast
      </AccessibleThemedText>
    );

    const textElement = getByText('Custom High Contrast');
    expect(textElement.props.style).toContainEqual(
      expect.objectContaining(customHighContrastStyle)
    );
  });

  it('applies custom large text style overrides', () => {
    // Mock large text as enabled
    (accessibilityService.getPreferences as jest.Mock).mockReturnValue({
      largeText: true,
      highContrast: false,
      reduceMotion: false,
      screenReaderHints: true,
      boldText: false,
      grayscale: false,
      invertColors: false,
    });

    const customLargeTextStyle = {
      fontSize: 24,
      lineHeight: 32,
    };

    const { getByText } = render(
      <AccessibleThemedText largeTextStyle={customLargeTextStyle}>
        Custom Large Text
      </AccessibleThemedText>
    );

    const textElement = getByText('Custom Large Text');
    expect(textElement.props.style).toContainEqual(expect.objectContaining(customLargeTextStyle));
  });

  it('applies custom bold text style overrides', () => {
    // Mock bold text as enabled
    (accessibilityService.isBoldTextActive as jest.Mock).mockReturnValue(true);

    const customBoldTextStyle = {
      fontWeight: '900',
      letterSpacing: 0.5,
    };

    const { getByText } = render(
      <AccessibleThemedText boldTextStyle={customBoldTextStyle}>
        Custom Bold Text
      </AccessibleThemedText>
    );

    const textElement = getByText('Custom Bold Text');
    expect(textElement.props.style).toContainEqual(expect.objectContaining(customBoldTextStyle));
  });

  it('sets the correct accessibility props', () => {
    const { getByText } = render(
      <AccessibleThemedText accessibilityLabel="Test Label" accessibilityHint="Test Hint" type="h1">
        Accessible Text
      </AccessibleThemedText>
    );

    const textElement = getByText('Accessible Text');
    expect(textElement.props.accessibilityLabel).toBe('Test Label');
    expect(textElement.props.accessibilityHint).toBe('Test Hint');
    expect(textElement.props.accessibilityRole).toBe('header');
  });

  it('uses the text content as the default accessibility label', () => {
    const { getByText } = render(<AccessibleThemedText>Default Label</AccessibleThemedText>);

    const textElement = getByText('Default Label');
    expect(textElement.props.accessibilityLabel).toBe('Default Label');
  });

  it('sets the correct accessibility role based on type', () => {
    const { getByText, rerender } = render(
      <AccessibleThemedText type="h1">Header</AccessibleThemedText>
    );

    let textElement = getByText('Header');
    expect(textElement.props.accessibilityRole).toBe('header');

    rerender(<AccessibleThemedText type="button">Button Text</AccessibleThemedText>);
    textElement = getByText('Button Text');
    expect(textElement.props.accessibilityRole).toBe('button');

    rerender(<AccessibleThemedText type="bodyStd">Body Text</AccessibleThemedText>);
    textElement = getByText('Body Text');
    expect(textElement.props.accessibilityRole).toBe('text');
  });

  it('subscribes to accessibility service changes', () => {
    render(<AccessibleThemedText>Subscription Test</AccessibleThemedText>);
    expect(accessibilityService.addListener).toHaveBeenCalled();
  });

  it('unsubscribes from accessibility service on unmount', () => {
    const unsubscribeMock = jest.fn();
    (accessibilityService.addListener as jest.Mock).mockReturnValue(unsubscribeMock);

    const { unmount } = render(<AccessibleThemedText>Unmount Test</AccessibleThemedText>);
    unmount();

    expect(unsubscribeMock).toHaveBeenCalled();
  });
});
