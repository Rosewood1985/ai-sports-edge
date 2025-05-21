#!/usr/bin/env node

/**
 * Color Contrast Testing Script
 *
 * This script tests color combinations in the app against WCAG 2.1 contrast requirements.
 * It uses the color contrast utilities to validate that all color combinations meet
 * accessibility standards.
 */

const fs = require('fs');
const path = require('path');
const {
  calculateContrastRatio,
  meetsWCAGAA,
  meetsWCAGAAA,
  validateContrast,
} = require('../utils/accessibilityTestUtils');

// Import theme colors
const Colors = require('../constants/Colors');

// Results storage
const results = {
  passed: [],
  failed: [],
  warnings: [],
  summary: {
    total: 0,
    passed: 0,
    failed: 0,
    warnings: 0,
  },
};

/**
 * Test a color combination against WCAG standards
 * @param {string} name - Name of the test
 * @param {string} foreground - Foreground color
 * @param {string} background - Background color
 * @param {boolean} isLargeText - Whether the text is large
 * @param {boolean} isRequired - Whether this combination is required to pass
 */
function testColorCombination(
  name,
  foreground,
  background,
  isLargeText = false,
  isRequired = true
) {
  try {
    const validation = validateContrast(foreground, background, isLargeText);
    results.summary.total++;

    const testResult = {
      name,
      foreground,
      background,
      isLargeText,
      ratio: validation.ratio,
      meetsAA: validation.meetsAA,
      meetsAAA: validation.meetsAAA,
      recommendation: validation.recommendation,
    };

    if (!validation.meetsAA && isRequired) {
      results.failed.push(testResult);
      results.summary.failed++;
      console.error(`❌ FAIL: ${name} - ${validation.recommendation}`);
    } else if (!validation.meetsAAA && isRequired) {
      results.warnings.push(testResult);
      results.summary.warnings++;
      console.warn(`⚠️ WARNING: ${name} - ${validation.recommendation}`);
    } else {
      results.passed.push(testResult);
      results.summary.passed++;
      console.log(`✅ PASS: ${name} - Contrast ratio: ${validation.ratio.toFixed(2)}`);
    }
  } catch (error) {
    console.error(`Error testing ${name}:`, error);
    results.failed.push({
      name,
      foreground,
      background,
      error: error.message,
    });
    results.summary.failed++;
  }
}

// Light theme tests
console.log('\n🔍 Testing Light Theme Colors\n');

// Text on background
testColorCombination('Text on Background (Light)', Colors.light.text, Colors.light.background);
testColorCombination(
  'Primary on Background (Light)',
  Colors.light.primary,
  Colors.light.background
);
testColorCombination(
  'Secondary on Background (Light)',
  Colors.light.secondary || '#6c757d',
  Colors.light.background
);
testColorCombination(
  'Tertiary on Background (Light)',
  Colors.light.tertiary || '#6c757d80',
  Colors.light.background,
  false,
  false
);
testColorCombination(
  'Error on Background (Light)',
  Colors.light.error || '#dc3545',
  Colors.light.background
);

// Button combinations
if (Colors.light.buttonText && Colors.light.buttonBackground) {
  testColorCombination(
    'Button Text on Button Background (Light)',
    Colors.light.buttonText,
    Colors.light.buttonBackground
  );
}

// Card combinations
if (Colors.light.cardText && Colors.light.card) {
  testColorCombination('Card Text on Card (Light)', Colors.light.cardText, Colors.light.card);
}

// Dark theme tests
console.log('\n🔍 Testing Dark Theme Colors\n');

// Text on background
testColorCombination('Text on Background (Dark)', Colors.dark.text, Colors.dark.background);
testColorCombination('Primary on Background (Dark)', Colors.dark.primary, Colors.dark.background);
testColorCombination(
  'Secondary on Background (Dark)',
  Colors.dark.secondary || '#6c757d',
  Colors.dark.background
);
testColorCombination(
  'Tertiary on Background (Dark)',
  Colors.dark.tertiary || '#6c757d80',
  Colors.dark.background,
  false,
  false
);
testColorCombination(
  'Error on Background (Dark)',
  Colors.dark.error || '#dc3545',
  Colors.dark.background
);

// Button combinations
if (Colors.dark.buttonText && Colors.dark.buttonBackground) {
  testColorCombination(
    'Button Text on Button Background (Dark)',
    Colors.dark.buttonText,
    Colors.dark.buttonBackground
  );
}

// Card combinations
if (Colors.dark.cardText && Colors.dark.card) {
  testColorCombination('Card Text on Card (Dark)', Colors.dark.cardText, Colors.dark.card);
}

// High contrast theme tests (if available)
if (Colors.highContrast) {
  console.log('\n🔍 Testing High Contrast Theme Colors\n');

  // Text on background
  testColorCombination(
    'Text on Background (High Contrast)',
    Colors.highContrast.text,
    Colors.highContrast.background
  );
  testColorCombination(
    'Primary on Background (High Contrast)',
    Colors.highContrast.primary,
    Colors.highContrast.background
  );

  // Button combinations
  if (Colors.highContrast.buttonText && Colors.highContrast.buttonBackground) {
    testColorCombination(
      'Button Text on Button Background (High Contrast)',
      Colors.highContrast.buttonText,
      Colors.highContrast.buttonBackground
    );
  }
}

// Print summary
console.log('\n📊 Test Summary\n');
console.log(`Total tests: ${results.summary.total}`);
console.log(`Passed: ${results.summary.passed}`);
console.log(`Warnings: ${results.summary.warnings}`);
console.log(`Failed: ${results.summary.failed}`);

// Save results to file
const outputPath = path.join(process.cwd(), 'accessibility-report.json');
fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
console.log(`\nResults saved to ${outputPath}`);

// Exit with error code if any tests failed
if (results.summary.failed > 0) {
  console.error('\n❌ Some color contrast tests failed. See report for details.');
  process.exit(1);
} else if (results.summary.warnings > 0) {
  console.warn('\n⚠️ Some color combinations do not meet AAA standards. Consider improving them.');
  process.exit(0);
} else {
  console.log('\n✅ All color contrast tests passed!');
  process.exit(0);
}
