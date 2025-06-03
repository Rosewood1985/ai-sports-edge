/**
 * Axe Accessibility Tests
 *
 * This file contains accessibility tests using jest-axe for various components.
 * It tests components against WCAG accessibility guidelines.
 */

import { render } from '@testing-library/react-native';
import { axe } from 'jest-axe';
import React from 'react';
import { Text } from 'react-native';

import AccessibleTouchableOpacity from '../../atomic/atoms/AccessibleTouchableOpacity';
import {
  expectNoAccessibilityViolations,
  getAccessibilityViolations,
} from '../../atomic/atoms/axeTestUtils';

describe('Accessibility Tests with jest-axe', () => {
  it('AccessibleTouchableOpacity with proper accessibility props should have no violations', async () => {
    const { container } = render(
      <AccessibleTouchableOpacity
        accessibilityLabel="Test button"
        accessibilityHint="This is a test button"
        accessibilityRole="button"
      >
        <Text>Press Me</Text>
      </AccessibleTouchableOpacity>
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('AccessibleTouchableOpacity without accessibility props should have violations', async () => {
    const { container } = render(
      <AccessibleTouchableOpacity>
        <Text>Press Me</Text>
      </AccessibleTouchableOpacity>
    );

    const violations = await getAccessibilityViolations(
      <AccessibleTouchableOpacity>
        <Text>Press Me</Text>
      </AccessibleTouchableOpacity>
    );

    // We expect violations because there's no accessibility label
    expect(violations.length).toBeGreaterThan(0);
  });

  it('should use expectNoAccessibilityViolations utility', async () => {
    await expectNoAccessibilityViolations(
      <AccessibleTouchableOpacity
        accessibilityLabel="Test button"
        accessibilityHint="This is a test button"
        accessibilityRole="button"
      >
        <Text>Press Me</Text>
      </AccessibleTouchableOpacity>
    );
  });

  it('should test a component with nested elements', async () => {
    const ComplexComponent = () => (
      <AccessibleTouchableOpacity
        accessibilityLabel="Complex button"
        accessibilityHint="This is a complex button"
        accessibilityRole="button"
      >
        <Text>Main Text</Text>
        <Text>Secondary Text</Text>
        <AccessibleTouchableOpacity
          accessibilityLabel="Nested button"
          accessibilityHint="This is a nested button"
          accessibilityRole="button"
        >
          <Text>Nested Button</Text>
        </AccessibleTouchableOpacity>
      </AccessibleTouchableOpacity>
    );

    await expectNoAccessibilityViolations(<ComplexComponent />);
  });
});
