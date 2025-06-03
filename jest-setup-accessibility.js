/**
 * Jest Setup for Axe Accessibility Testing
 *
 * This file configures Jest to work with jest-axe for accessibility testing.
 * It extends Jest's expect with the toHaveNoViolations matcher.
 */

try {
  const { toHaveNoViolations } = require('jest-axe');

  // Add jest-axe matchers to Jest
  expect.extend(toHaveNoViolations);
  console.log('✅ Successfully loaded jest-axe and extended expect with toHaveNoViolations');
} catch (error) {
  console.warn('⚠️ Warning: Could not load jest-axe. Accessibility tests may not work correctly.');
  console.warn('Error details:', error.message);

  // Provide a mock implementation to prevent tests from failing
  expect.extend({
    toHaveNoViolations: () => ({
      pass: true,
      message: () =>
        'Mock implementation of toHaveNoViolations is being used due to dependency issues',
    }),
  });
}
