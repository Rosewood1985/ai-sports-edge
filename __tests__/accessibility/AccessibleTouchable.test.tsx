/**
 * Accessibility Tests for AccessibleTouchable Component
 *
 * This file contains tests for the AccessibleTouchable component,
 * focusing on keyboard navigation and accessibility features.
 */

import React from 'react';
import { Text } from 'react-native';
import { render, fireEvent } from '@testing-library/react-native';
import { axe } from 'jest-axe';
import AccessibleTouchable from '../../components/AccessibleTouchable';
import { expectNoAccessibilityViolations } from '../../atomic/atoms/axeTestUtils';

// Mock the accessibilityService
jest.mock('../../services/accessibilityService', () => ({
  focusElementById: jest.fn(),
  registerKeyboardNavigableElement: jest.fn(),
  unregisterKeyboardNavigableElement: jest.fn(),
  handleKeyboardNavigation: jest.fn((event, id) => {
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      return true;
    }
    if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      return true;
    }
    return false;
  }),
}));

describe('AccessibleTouchable Accessibility Tests', () => {
  // Basic accessibility tests
  it('should have no accessibility violations with proper props', async () => {
    await expectNoAccessibilityViolations(
      <AccessibleTouchable
        accessibilityLabel="Test button"
        accessibilityHint="This is a test button"
        accessibilityRole="button"
        keyboardNavigationId="test-button"
      >
        <Text>Press Me</Text>
      </AccessibleTouchable>
    );
  });

  it('should have accessibility violations without proper props', async () => {
    const { container } = render(
      <AccessibleTouchable accessibilityLabel="Missing props button">
        <Text>Press Me</Text>
      </AccessibleTouchable>
    );

    const results = await axe(container);
    expect(results.violations.length).toBeGreaterThan(0);
  });

  // Keyboard navigation tests
  it('should handle keyboard focus correctly', () => {
    const { getByTestId } = render(
      <AccessibleTouchable
        accessibilityLabel="Test button"
        keyboardNavigationId="test-button"
        testID="test-button"
      >
        <Text>Press Me</Text>
      </AccessibleTouchable>
    );

    const button = getByTestId('test-button');

    // Simulate focus
    fireEvent(button, 'focus');

    // Check if the component has the focused state
    expect(button.props.accessibilityState).toEqual(expect.objectContaining({ focused: true }));

    // Simulate blur
    fireEvent(button, 'blur');

    // Check if the component has the focused state removed
    expect(button.props.accessibilityState).toEqual(expect.objectContaining({ focused: false }));
  });

  it('should handle keyboard press events', () => {
    const onPress = jest.fn();
    const { getByTestId } = render(
      <AccessibleTouchable
        accessibilityLabel="Test button"
        keyboardNavigationId="test-button"
        testID="test-button"
        onPress={onPress}
      >
        <Text>Press Me</Text>
      </AccessibleTouchable>
    );

    const button = getByTestId('test-button');

    // Simulate Enter key press
    fireEvent(button, 'keyPress', { key: 'Enter', code: 'Enter' });
    expect(onPress).toHaveBeenCalledTimes(1);

    // Simulate Space key press
    fireEvent(button, 'keyPress', { key: ' ', code: 'Space' });
    expect(onPress).toHaveBeenCalledTimes(2);
  });

  it('should navigate between elements using keyboard', () => {
    // Get the mocked service
    const accessibilityService = require('../../services/accessibilityService');
    const handleKeyboardNavigation = accessibilityService.handleKeyboardNavigation;

    const { getByTestId } = render(
      <AccessibleTouchable
        accessibilityLabel="Test button"
        keyboardNavigationId="test-button"
        nextElementId="next-button"
        prevElementId="prev-button"
        testID="test-button"
      >
        <Text>Press Me</Text>
      </AccessibleTouchable>
    );

    const button = getByTestId('test-button');

    // Simulate key presses
    fireEvent(button, 'keyPress', { key: 'ArrowRight', code: 'ArrowRight' });
    expect(handleKeyboardNavigation).toHaveBeenCalled();

    fireEvent(button, 'keyPress', { key: 'ArrowDown', code: 'ArrowDown' });
    expect(handleKeyboardNavigation).toHaveBeenCalled();

    fireEvent(button, 'keyPress', { key: 'ArrowLeft', code: 'ArrowLeft' });
    expect(handleKeyboardNavigation).toHaveBeenCalled();

    fireEvent(button, 'keyPress', { key: 'ArrowUp', code: 'ArrowUp' });
    expect(handleKeyboardNavigation).toHaveBeenCalled();
  });

  it('should handle complex nested components', async () => {
    const ComplexComponent = () => (
      <AccessibleTouchable
        accessibilityLabel="Complex button"
        accessibilityHint="This is a complex button"
        accessibilityRole="button"
        keyboardNavigationId="complex-button"
      >
        <Text>Main Text</Text>
        <Text>Secondary Text</Text>
        <AccessibleTouchable
          accessibilityLabel="Nested button"
          accessibilityHint="This is a nested button"
          accessibilityRole="button"
          keyboardNavigationId="nested-button"
        >
          <Text>Nested Button</Text>
        </AccessibleTouchable>
      </AccessibleTouchable>
    );

    await expectNoAccessibilityViolations(<ComplexComponent />);
  });
});
