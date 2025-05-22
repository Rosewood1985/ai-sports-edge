/**
 * Simple Accessibility Test
 *
 * This is a basic test to verify that our accessibility testing setup works.
 * It tests a simple component with basic accessibility properties.
 */

import React from 'react';
import { Text, View } from 'react-native';
import { render } from '@testing-library/react-native';
import { axeReactNative as axe, toHaveNoViolations } from './axe-react-native';

// Add the custom matcher
expect.extend({ toHaveNoViolations });

describe('Basic Accessibility Tests', () => {
  // Test a component with good accessibility
  it('should pass accessibility checks for accessible component', async () => {
    const AccessibleComponent = () => (
      <View
        accessible={true}
        accessibilityLabel="Test view"
        accessibilityRole="button"
        testID="test-view"
      >
        <Text accessible={true} accessibilityLabel="Hello World text" accessibilityRole="text">
          Hello World
        </Text>
      </View>
    );

    const results = await axe(<AccessibleComponent />);

    expect(results).toHaveNoViolations();
  });

  // Test a component with poor accessibility
  it('should detect accessibility issues', async () => {
    const InaccessibleComponent = () => (
      <View testID="test-view">
        <Text>Hello World</Text>
      </View>
    );

    const results = await axe(<InaccessibleComponent />);

    // We expect some violations since this component has no accessibility props
    expect(results.violations.length).toBeGreaterThan(0);
  });
});
