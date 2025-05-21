# Accessibility Testing with jest-axe

This guide provides an overview of how to use jest-axe for automated accessibility testing in AI Sports Edge.

## Overview

Automated accessibility testing helps ensure that our application is accessible to all users, including those with disabilities. We use jest-axe, a Jest matcher library that integrates with axe-core, to test our components against Web Content Accessibility Guidelines (WCAG).

## Setup

The jest-axe testing framework has been set up with the following components:

1. **Dependencies**: We've added the following dependencies to our project:

   - `jest-axe`: The main library for accessibility testing
   - `axe-core`: The core accessibility testing engine
   - `@types/jest-axe`: TypeScript type definitions for jest-axe

2. **Configuration Files**:

   - `jest-setup-axe.ts`: Configures Jest to work with jest-axe
   - `atomic/atoms/axeTestUtils.ts`: Provides utility functions for accessibility testing

3. **Jest Configuration**:
   - Updated `jest.config.js` to include the jest-axe setup file

## Using jest-axe in Tests

### Basic Usage

To test a component for accessibility violations:

```tsx
import { render } from '@testing-library/react-native';
import { axe } from 'jest-axe';
import MyComponent from '../path/to/MyComponent';

describe('Accessibility Tests', () => {
  it('should have no accessibility violations', async () => {
    const { container } = render(<MyComponent />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
```

### Using Utility Functions

We've created utility functions to simplify accessibility testing:

```tsx
import { expectNoAccessibilityViolations } from '../../atomic/atoms/axeTestUtils';
import MyComponent from '../path/to/MyComponent';

describe('Accessibility Tests', () => {
  it('should have no accessibility violations', async () => {
    await expectNoAccessibilityViolations(<MyComponent />);
  });
});
```

### Testing for Specific Violations

To test for specific accessibility violations:

```tsx
import { getAccessibilityViolations } from '../../atomic/atoms/axeTestUtils';
import MyComponent from '../path/to/MyComponent';

describe('Accessibility Tests', () => {
  it('should check for specific violations', async () => {
    const violations = await getAccessibilityViolations(<MyComponent />);

    // Check if there are any color contrast issues
    const contrastIssues = violations.filter(v => v.id === 'color-contrast');
    expect(contrastIssues.length).toBe(0);
  });
});
```

## Accessibility Rules

jest-axe tests components against the following WCAG rules:

- **color-contrast**: Ensures text has sufficient contrast against its background
- **image-alt**: Ensures images have alternative text
- **button-name**: Ensures buttons have accessible names
- **aria-roles**: Ensures ARIA roles are used correctly
- **aria-props**: Ensures ARIA properties are used correctly

## Best Practices

1. **Test All Interactive Components**: Ensure all buttons, links, and other interactive elements have proper accessibility attributes.

2. **Test Screen Flows**: Test entire screen components to ensure they're accessible as a whole.

3. **Test with Different Themes**: Test components in both light and dark themes to ensure proper contrast.

4. **Fix Violations Promptly**: Address accessibility violations as soon as they're detected.

5. **Include in CI/CD**: Run accessibility tests as part of your continuous integration pipeline.

## Example Test Cases

### Testing a Button Component

```tsx
import { expectNoAccessibilityViolations } from '../../atomic/atoms/axeTestUtils';
import AccessibleTouchableOpacity from '../../atomic/atoms/AccessibleTouchableOpacity';
import { Text } from 'react-native';

describe('AccessibleTouchableOpacity', () => {
  it('should have no accessibility violations', async () => {
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
});
```

### Testing a Form Component

```tsx
import { expectNoAccessibilityViolations } from '../../atomic/atoms/axeTestUtils';
import LoginForm from '../../components/LoginForm';

describe('LoginForm', () => {
  it('should have no accessibility violations', async () => {
    await expectNoAccessibilityViolations(<LoginForm />);
  });
});
```

## Troubleshooting

### Common Issues

1. **False Positives**: Some rules might not be applicable to React Native. You can disable specific rules in the axe configuration.

2. **Test Environment Issues**: Make sure your test environment properly renders React Native components.

3. **Missing Accessibility Props**: The most common violations are missing accessibility labels and roles.

### Fixing Violations

1. **Add Missing Props**: Add `accessibilityLabel`, `accessibilityHint`, and `accessibilityRole` to interactive components.

2. **Use Accessible Components**: Use our accessible component library (e.g., `AccessibleTouchableOpacity`, `AccessibleThemedText`).

3. **Check Color Contrast**: Ensure text has sufficient contrast against its background.

## Conclusion

Automated accessibility testing with jest-axe helps us ensure that AI Sports Edge is accessible to all users. By integrating these tests into our development workflow, we can catch and fix accessibility issues early in the development process.
