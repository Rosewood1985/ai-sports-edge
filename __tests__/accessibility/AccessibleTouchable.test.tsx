/**
 * AccessibleTouchable Accessibility Tests
 *
 * This file tests the accessibility features of the AccessibleTouchable component.
 */

import React from 'react';
import { Text } from 'react-native';
import { render } from '@testing-library/react-native';
import { axeReactNative as axe, toHaveNoViolations } from './axe-react-native';
import AccessibleTouchable from '../../components/AccessibleTouchable';

// Add the custom matcher
expect.extend({ toHaveNoViolations });

describe('AccessibleTouchable Accessibility Tests', () => {
  it('should pass accessibility checks with default props', async () => {
    const onPress = jest.fn();
    const { container } = render(
      <AccessibleTouchable onPress={onPress} accessibilityLabel="Test button">
        <Text>Press me</Text>
      </AccessibleTouchable>
    );

    const results = await axe(
      <AccessibleTouchable onPress={onPress} accessibilityLabel="Test button">
        <Text accessible={true} accessibilityLabel="Press me text" accessibilityRole="text">
          Press me
        </Text>
      </AccessibleTouchable>
    );

    expect(results).toHaveNoViolations();
  });

  it('should pass accessibility checks with custom props', async () => {
    const onPress = jest.fn();
    const results = await axe(
      <AccessibleTouchable
        onPress={onPress}
        accessibilityLabel="Custom button"
        accessibilityHint="This is a custom hint"
        accessibilityRole="button"
      >
        <Text accessible={true} accessibilityLabel="Custom text" accessibilityRole="text">
          Custom Button
        </Text>
      </AccessibleTouchable>
    );

    expect(results).toHaveNoViolations();
  });

  it('should detect accessibility issues when children have no accessibility props', async () => {
    const onPress = jest.fn();
    const results = await axe(
      <AccessibleTouchable onPress={onPress} accessibilityLabel="Button with inaccessible children">
        <Text>Missing Accessibility Props</Text>
      </AccessibleTouchable>
    );

    // We expect violations since the Text component has no accessibility props
    expect(results.violations.length).toBeGreaterThan(0);
  });
});
