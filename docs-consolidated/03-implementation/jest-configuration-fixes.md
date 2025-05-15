# Jest Configuration Fixes

When attempting to run the Spanish version tests, we encountered several issues with the Jest configuration. This document outlines the problems and proposes solutions.

## Issues Identified

1. **TypeScript Errors**:
   - Missing type declarations for testing libraries
   - Type errors in test files

2. **JSX Syntax Error**:
   - Error in `NotificationPermission.jsx`: "Support for the experimental syntax 'jsx' isn't currently enabled"

3. **React Native Mocking Issues**:
   - Error: "Cannot read properties of undefined (reading 'get')"
   - Issues with mocking React Native components

## Proposed Solutions

### 1. Fix TypeScript Errors

Install missing type declarations:

```bash
npm install --save-dev @types/testing-library__react-native @types/jest
```

Add proper type annotations to test files:

```typescript
// Example fix for LanguageSupport.test.tsx
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { RenderAPI } from '@testing-library/react-native';
```

### 2. Fix JSX Syntax Error

Update the Babel configuration to properly handle JSX syntax. Create or modify `.babelrc` file:

```json
{
  "presets": [
    "@babel/preset-env",
    "@babel/preset-react",
    "@babel/preset-typescript"
  ],
  "plugins": [
    "@babel/plugin-transform-react-jsx"
  ]
}
```

Install required Babel dependencies:

```bash
npm install --save-dev @babel/preset-react @babel/plugin-transform-react-jsx
```

### 3. Fix React Native Mocking Issues

Update the Jest setup file (`jest.setup.js`) to properly mock React Native components:

```javascript
// Add to jest.setup.js
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  
  // Mock the Dimensions API
  RN.Dimensions = {
    ...RN.Dimensions,
    get: jest.fn().mockReturnValue({ width: 375, height: 667 })
  };
  
  // Mock the PixelRatio API
  RN.PixelRatio = {
    ...RN.PixelRatio,
    get: jest.fn().mockReturnValue(2),
    getFontScale: jest.fn().mockReturnValue(1),
    getPixelSizeForLayoutSize: jest.fn(size => size * 2),
    roundToNearestPixel: jest.fn(size => size)
  };
  
  return RN;
});
```

### 4. Update Jest Configuration

Update the Jest configuration in `jest.config.js`:

```javascript
module.exports = {
  preset: 'react-native',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|react-navigation|@react-navigation|@expo|expo|@unimodules|react-native-vector-icons|react-native-gesture-handler)/)'
  ],
  setupFiles: [
    '<rootDir>/jest.setup.js'
  ],
  testEnvironment: 'jsdom',
  testPathIgnorePatterns: [
    '/node_modules/',
    '/android/',
    '/ios/'
  ],
  moduleNameMapper: {
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$': '<rootDir>/__mocks__/fileMock.js',
    '\\.(css|less)$': '<rootDir>/__mocks__/styleMock.js'
  },
  collectCoverage: true,
  collectCoverageFrom: [
    'components/**/*.{js,jsx,ts,tsx}',
    'screens/**/*.{js,jsx,ts,tsx}',
    '!**/node_modules/**',
    '!**/vendor/**'
  ],
  coverageReporters: ['json', 'lcov', 'text', 'clover'],
  testRegex: '(/__tests__/.*|(\\.|/)(test|spec))\\.(jsx?|tsx?)$',
  globals: {
    'ts-jest': {
      babelConfig: true,
      tsconfig: 'tsconfig.jest.json'
    }
  },
  // Add these lines to fix JSX syntax error
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest'
  }
};
```

### 5. Create a Simplified Test Runner

Create a simplified test runner that focuses on one test at a time:

```javascript
// __tests__/run-single-test.js
const jest = require('jest');

// Get the test file from command line arguments
const testFile = process.argv[2];

if (!testFile) {
  console.error('Please specify a test file to run');
  process.exit(1);
}

// Configure Jest options
const jestConfig = {
  projects: [process.cwd()],
  testMatch: [testFile],
  verbose: true
};

// Run the test
jest.runCLI(jestConfig, [process.cwd()]).then(({ results }) => {
  console.log('Test Results:');
  console.log(`Tests: ${results.numTotalTests}`);
  console.log(`Passed: ${results.numPassedTests}`);
  console.log(`Failed: ${results.numFailedTests}`);
  
  // Exit with appropriate code
  process.exit(results.success ? 0 : 1);
}).catch(error => {
  console.error('Error running test:', error);
  process.exit(1);
});
```

Run a single test with:

```bash
node __tests__/run-single-test.js __tests__/i18n/LanguageSupport.test.tsx
```

## Implementation Steps

1. Install missing dependencies
2. Update Jest configuration
3. Update Jest setup file
4. Create simplified test runner
5. Run tests one by one to identify and fix specific issues
6. Once all tests pass individually, run the full test suite

By implementing these fixes, we should be able to run the Spanish version tests successfully.