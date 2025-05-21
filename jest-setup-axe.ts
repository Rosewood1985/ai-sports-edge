/**
 * Jest Setup for Axe Accessibility Testing
 *
 * This file configures Jest to work with jest-axe for accessibility testing.
 * It extends Jest's expect with the toHaveNoViolations matcher.
 */

import { toHaveNoViolations } from 'jest-axe';

// Add jest-axe matchers to Jest
expect.extend(toHaveNoViolations);
