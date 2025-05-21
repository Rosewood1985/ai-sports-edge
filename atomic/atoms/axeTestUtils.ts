/**
 * Axe Test Utilities
 *
 * This file contains utilities for testing accessibility using jest-axe.
 * It provides functions for running axe tests on React Native components.
 */

import { configureAxe, toHaveNoViolations } from 'jest-axe';
import { ReactElement } from 'react';
import { render } from '@testing-library/react-native';

// Add jest-axe matchers to Jest
expect.extend(toHaveNoViolations);

/**
 * Default axe configuration for React Native components
 */
export const axeConfig = {
  rules: {
    // Customize rules as needed for React Native
    'color-contrast': { enabled: true },
    'image-alt': { enabled: true },
    'button-name': { enabled: true },
    'aria-allowed-attr': { enabled: false }, // Not applicable to React Native
    'document-title': { enabled: false }, // Not applicable to React Native
    'html-has-lang': { enabled: false }, // Not applicable to React Native
  },
};

/**
 * Configure axe with default settings for React Native
 */
export const axe = configureAxe(axeConfig);

/**
 * Run accessibility tests on a React Native component
 * @param component The React component to test
 * @param customConfig Optional custom axe configuration
 * @returns Promise that resolves with the axe results
 */
export async function testAccessibility(component: ReactElement, customConfig = {}): Promise<any> {
  const { container } = render(component);
  const mergedConfig = { ...axeConfig, ...customConfig };
  const results = await axe(container, mergedConfig);
  return results;
}

/**
 * Check if a component has no accessibility violations
 * @param component The React component to test
 * @param customConfig Optional custom axe configuration
 */
export async function expectNoAccessibilityViolations(
  component: ReactElement,
  customConfig = {}
): Promise<void> {
  const results = await testAccessibility(component, customConfig);
  expect(results).toHaveNoViolations();
}

/**
 * Get accessibility violations from a component
 * @param component The React component to test
 * @param customConfig Optional custom axe configuration
 * @returns Promise that resolves with the accessibility violations
 */
export async function getAccessibilityViolations(
  component: ReactElement,
  customConfig = {}
): Promise<any[]> {
  const results = await testAccessibility(component, customConfig);
  return results.violations;
}

/**
 * Check if a component has specific accessibility violations
 * @param component The React component to test
 * @param ruleIds Array of rule IDs to check for violations
 * @param customConfig Optional custom axe configuration
 * @returns Promise that resolves with the matching violations
 */
export async function checkForSpecificViolations(
  component: ReactElement,
  ruleIds: string[],
  customConfig = {}
): Promise<any[]> {
  const violations = await getAccessibilityViolations(component, customConfig);
  return violations.filter(violation => ruleIds.includes(violation.id));
}

/**
 * Get a summary of accessibility violations
 * @param violations Array of accessibility violations
 * @returns Object with summary information
 */
export function getViolationsSummary(violations: any[]): {
  total: number;
  critical: number;
  serious: number;
  moderate: number;
  minor: number;
  byRule: Record<string, number>;
} {
  const summary = {
    total: violations.length,
    critical: 0,
    serious: 0,
    moderate: 0,
    minor: 0,
    byRule: {} as Record<string, number>,
  };

  violations.forEach(violation => {
    // Count by impact
    if (violation.impact === 'critical') summary.critical++;
    if (violation.impact === 'serious') summary.serious++;
    if (violation.impact === 'moderate') summary.moderate++;
    if (violation.impact === 'minor') summary.minor++;

    // Count by rule
    const ruleId = violation.id;
    summary.byRule[ruleId] = (summary.byRule[ruleId] || 0) + 1;
  });

  return summary;
}
