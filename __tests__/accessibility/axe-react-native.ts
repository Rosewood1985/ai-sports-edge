/**
 * Axe React Native Adapter
 *
 * This file provides an adapter to use jest-axe with React Native components.
 * It converts React Native accessibility props to a format that axe-core can understand.
 */

import { render } from '@testing-library/react-native';
import { configureAxe } from 'jest-axe';
import { ReactElement } from 'react';

// Custom rules for React Native
const reactNativeRules = {
  // Basic rules that can be checked in React Native
  accessibleName: {
    enabled: true,
    evaluate: (node: any) => {
      return {
        id: 'accessibleName',
        impact: 'serious',
        passes: node.accessible && node.accessibilityLabel,
        message: 'Element should have an accessibility label',
      };
    },
  },
  accessibleRole: {
    enabled: true,
    evaluate: (node: any) => {
      return {
        id: 'accessibleRole',
        impact: 'moderate',
        passes: node.accessibilityRole !== undefined,
        message: 'Element should have an accessibility role',
      };
    },
  },
};

// Create a custom axe configuration for React Native
export const axe = configureAxe({
  rules: [],
});

// Override the axe function to work with React Native
const originalAxe = axe;
export const axeReactNative = async (component: ReactElement) => {
  const { toJSON } = render(component);
  const tree = toJSON();

  // Simulate axe results
  const violations: any[] = [];
  const passes: any[] = [];

  // Recursively check the component tree
  function checkNode(node: any) {
    if (!node) return;

    // Check if the node has accessibility props
    if (node.props) {
      // Check for accessible name
      if (!node.props.accessible || !node.props.accessibilityLabel) {
        violations.push({
          id: 'accessibleName',
          impact: 'serious',
          nodes: [node],
          description: 'Elements must have an accessible name',
          help: 'Provide an accessibility label for all interactive elements',
          helpUrl: 'https://reactnative.dev/docs/accessibility',
        });
      } else {
        passes.push({
          id: 'accessibleName',
          impact: 'serious',
          nodes: [node],
        });
      }

      // Check for accessibility role on interactive elements
      if (node.props.accessible && !node.props.accessibilityRole) {
        violations.push({
          id: 'accessibleRole',
          impact: 'moderate',
          nodes: [node],
          description: 'Elements should have an accessibility role',
          help: 'Specify an accessibility role for interactive elements',
          helpUrl: 'https://reactnative.dev/docs/accessibility',
        });
      } else if (node.props.accessible && node.props.accessibilityRole) {
        passes.push({
          id: 'accessibleRole',
          impact: 'moderate',
          nodes: [node],
        });
      }
    }

    // Check children
    if (node.children) {
      node.children.forEach((child: any) => {
        if (typeof child === 'object') {
          checkNode(child);
        }
      });
    }
  }

  checkNode(tree);

  // Return a result object that matches axe's format
  return {
    violations,
    passes,
    incomplete: [],
    inapplicable: [],
    testEngine: {
      name: 'axe-react-native',
      version: '1.0.0',
    },
    testRunner: {
      name: 'axe-react-native',
    },
    testEnvironment: {
      userAgent: 'react-native',
      windowWidth: 375,
      windowHeight: 667,
    },
    timestamp: new Date().toISOString(),
    url: 'react-native',
  };
};

// Add the toHaveNoViolations matcher
export const toHaveNoViolations = (received: any) => {
  const violations = received.violations || [];

  if (violations.length === 0) {
    return {
      pass: true,
      message: () => 'Expected the component to have accessibility violations',
    };
  }

  return {
    pass: false,
    message: () =>
      `Expected the component to have no accessibility violations, but found ${
        violations.length
      }:\n${JSON.stringify(violations, null, 2)}`,
  };
};
