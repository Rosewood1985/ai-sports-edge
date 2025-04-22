/**
 * Jest Configuration for Atomic Architecture
 * 
 * This configuration is specifically for testing atomic components.
 */

module.exports = {
  // Use jsdom test environment for React components
  testEnvironment: 'jsdom',
  
  // Test environment
  testEnvironment: 'node',
  
  // Test paths
  testMatch: [
    '**/__tests__/atomic/**/*.test.js'
  ],
  
  // Transform files
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest',
  },
  
  // Module file extensions
  moduleFileExtensions: ['js', 'jsx', 'ts', 'tsx', 'json'],
  
  // Module name mapper for imports
  moduleNameMapper: {
    // Handle image imports
    '\\.(jpg|jpeg|png|gif|webp|svg)$': '<rootDir>/__mocks__/fileMock.js',
    
    // Handle style imports
    '\\.(css|less|scss|sass)$': '<rootDir>/__mocks__/styleMock.js',
  },
  
  // Setup files
  setupFiles: [
    '<rootDir>/jest.setup.atomic.js'
  ],
  
  // Coverage configuration
  collectCoverage: true,
  collectCoverageFrom: [
    'atomic/**/*.{js,jsx,ts,tsx}',
    '!atomic/**/*.d.ts',
    '!atomic/**/index.{js,jsx,ts,tsx}',
    '!atomic/**/*.stories.{js,jsx,ts,tsx}',
  ],
  coverageDirectory: 'coverage/atomic',
  
  // Ignore patterns
  testPathIgnorePatterns: [
    '/node_modules/',
    '/build/',
    '/dist/',
    '/coverage/',
  ],
  
  // Mock all native modules
  transformIgnorePatterns: [
    'node_modules/(?!(jest-)?react-native|@react-native|expo(nent)?|@expo(nent)?/.*|@unimodules/.*|react-navigation|@react-navigation/.*|@react-native-community|react-native-svg)'
  ],
};