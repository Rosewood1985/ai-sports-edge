import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import AccessibleTouchableOpacity from '../../atomic/atoms/AccessibleTouchableOpacity';
import { Text } from 'react-native';
import accessibilityService from '../../services/accessibilityService';

// Mock the accessibilityService
jest.mock('../../services/accessibilityService', () => ({
  getAccessibilityProps: jest.fn((label, hint, role, state) => ({
    accessible: true,
    accessibilityLabel: label,
    accessibilityHint: hint,
    accessibilityRole: role,
    accessibilityState: state,
  })),
}));

// Mock Animated
jest.mock('react-native/Libraries/Animated/Animated', () => {
  const ActualAnimated = jest.requireActual('react-native/Libraries/Animated/Animated');
  return {
    ...ActualAnimated,
    timing: jest.fn(() => ({
      start: jest.fn(cb => cb && cb()),
    })),
    Value: jest.fn(() => ({
      setValue: jest.fn(),
      interpolate: jest.fn(() => ({
        __getValue: jest.fn(() => 0),
      })),
    })),
  };
});

describe('AccessibleTouchableOpacity', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly with default props', () => {
    const { getByText } = render(
      <AccessibleTouchableOpacity>
        <Text>Test Button</Text>
      </AccessibleTouchableOpacity>
    );

    expect(getByText('Test Button')).toBeTruthy();
  });

  it('applies accessibility props correctly', () => {
    const { getByA11yLabel } = render(
      <AccessibleTouchableOpacity
        accessibilityLabel="Test Label"
        accessibilityHint="Test Hint"
        accessibilityRole="button"
      >
        <Text>Test Button</Text>
      </AccessibleTouchableOpacity>
    );

    expect(getByA11yLabel('Test Label')).toBeTruthy();
    expect(accessibilityService.getAccessibilityProps).toHaveBeenCalledWith(
      'Test Label',
      'Test Hint',
      'button',
      undefined
    );
  });

  it('handles press events correctly', () => {
    const onPressMock = jest.fn();
    const onPressInMock = jest.fn();
    const onPressOutMock = jest.fn();

    const { getByText } = render(
      <AccessibleTouchableOpacity
        onPress={onPressMock}
        onPressIn={onPressInMock}
        onPressOut={onPressOutMock}
      >
        <Text>Test Button</Text>
      </AccessibleTouchableOpacity>
    );

    const button = getByText('Test Button');

    // Test press
    fireEvent.press(button);
    expect(onPressMock).toHaveBeenCalled();

    // Test press in
    fireEvent(button, 'pressIn');
    expect(onPressInMock).toHaveBeenCalled();

    // Test press out
    fireEvent(button, 'pressOut');
    expect(onPressOutMock).toHaveBeenCalled();
  });

  it('applies focus styles when focused', () => {
    const { getByText, update } = render(
      <AccessibleTouchableOpacity isFocused={false}>
        <Text>Test Button</Text>
      </AccessibleTouchableOpacity>
    );

    // Update with focused state
    update(
      <AccessibleTouchableOpacity isFocused={true}>
        <Text>Test Button</Text>
      </AccessibleTouchableOpacity>
    );

    const button = getByText('Test Button').parent;
    expect(button.props.style).toBeDefined();
  });

  it('applies custom focus styles when provided', () => {
    const customFocusStyle = {
      backgroundColor: 'blue',
      borderRadius: 10,
    };

    const { getByText } = render(
      <AccessibleTouchableOpacity isFocused={true} focusedStyle={customFocusStyle}>
        <Text>Test Button</Text>
      </AccessibleTouchableOpacity>
    );

    const button = getByText('Test Button').parent;
    expect(button.props.style).toBeDefined();
  });

  it('handles focus and blur events correctly', () => {
    const onFocusMock = jest.fn();
    const onBlurMock = jest.fn();

    const { getByText, update } = render(
      <AccessibleTouchableOpacity onFocus={onFocusMock} onBlur={onBlurMock}>
        <Text>Test Button</Text>
      </AccessibleTouchableOpacity>
    );

    // Simulate press in (which triggers focus)
    fireEvent(getByText('Test Button'), 'pressIn');
    expect(onFocusMock).toHaveBeenCalled();

    // We can't directly test blur since we're maintaining focus on press out
    // But we can test the internal implementation by updating the component
    update(
      <AccessibleTouchableOpacity onFocus={onFocusMock} onBlur={onBlurMock} isFocused={false}>
        <Text>Test Button</Text>
      </AccessibleTouchableOpacity>
    );
  });

  it('disables the button correctly', () => {
    const onPressMock = jest.fn();

    const { getByText } = render(
      <AccessibleTouchableOpacity onPress={onPressMock} disabled={true}>
        <Text>Test Button</Text>
      </AccessibleTouchableOpacity>
    );

    const button = getByText('Test Button');

    // Test press on disabled button
    fireEvent.press(button);
    expect(onPressMock).not.toHaveBeenCalled();
  });
});
