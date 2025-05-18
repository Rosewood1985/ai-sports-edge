/**
 * API Key Detection Patterns
 *
 * This module provides patterns for detecting hardcoded API keys and secrets in code.
 * These patterns are used by the security scanning utilities to identify potential
 * security vulnerabilities.
 */

/**
 * Common API key and secret patterns with their descriptions
 */
const API_KEY_PATTERNS = [
  {
    name: 'Generic API Key',
    // Matches common API key formats with alphanumeric characters
    pattern: /(['"])(?:api|access)[-_]?key['"]?\s*[:=]\s*['"]([a-zA-Z0-9_\-\.]{16,})['"]/,
    severity: 'high',
    description: 'Generic API key pattern detected',
  },
  {
    name: 'Firebase API Key',
    // Matches Firebase API key format (typically starts with AIza)
    pattern: /(['"])?AIza[0-9A-Za-z\-_]{35}(['"])?/,
    severity: 'critical',
    description: 'Firebase API key detected',
  },
  {
    name: 'AWS Access Key',
    // Matches AWS access key format
    pattern: /(['"])?AKIA[0-9A-Z]{16}(['"])?/,
    severity: 'critical',
    description: 'AWS access key detected',
  },
  {
    name: 'AWS Secret Key',
    // Matches AWS secret key format
    pattern: /(['"])?[0-9a-zA-Z\/+]{40}(['"])?/,
    severity: 'critical',
    description: 'Possible AWS secret key detected',
  },
  {
    name: 'Stripe API Key',
    // Matches Stripe API key format (starts with sk_live or sk_test)
    pattern: /(['"])?sk_(live|test)_[0-9a-zA-Z]{24}(['"])?/,
    severity: 'critical',
    description: 'Stripe API key detected',
  },
  {
    name: 'Stripe Publishable Key',
    // Matches Stripe publishable key format (starts with pk_live or pk_test)
    pattern: /(['"])?pk_(live|test)_[0-9a-zA-Z]{24}(['"])?/,
    severity: 'high',
    description: 'Stripe publishable key detected',
  },
  {
    name: 'Google API Key',
    // Matches Google API key format
    pattern: /(['"])?AIza[0-9A-Za-z\-_]{35}(['"])?/,
    severity: 'critical',
    description: 'Google API key detected',
  },
  {
    name: 'GitHub Token',
    // Matches GitHub token format
    pattern: /(['"])?gh[pousr]_[0-9a-zA-Z]{36}(['"])?/,
    severity: 'critical',
    description: 'GitHub token detected',
  },
  {
    name: 'Generic Secret',
    // Matches generic secret patterns
    pattern: /(['"])(?:secret|private)[-_]?key['"]?\s*[:=]\s*['"]([a-zA-Z0-9_\-\.]{16,})['"]/,
    severity: 'high',
    description: 'Generic secret pattern detected',
  },
  {
    name: 'Password',
    // Matches password assignments
    pattern: /(['"])password['"]?\s*[:=]\s*['"]([^'"]{8,})['"]/,
    severity: 'high',
    description: 'Hardcoded password detected',
  },
  {
    name: 'Authentication Token',
    // Matches authentication token assignments
    pattern: /(['"])(?:auth|token|jwt|bearer)['"]?\s*[:=]\s*['"]([a-zA-Z0-9_\-\.]{16,})['"]/,
    severity: 'high',
    description: 'Authentication token detected',
  },
];

/**
 * Files and directories to exclude from scanning
 */
const SCAN_EXCLUSIONS = [
  'node_modules',
  '.git',
  'build',
  'dist',
  'coverage',
  '.next',
  '.nuxt',
  '.cache',
  'public',
  'assets',
  'images',
  '*.jpg',
  '*.jpeg',
  '*.png',
  '*.gif',
  '*.svg',
  '*.ico',
  '*.woff',
  '*.woff2',
  '*.ttf',
  '*.eot',
  '*.mp3',
  '*.mp4',
  '*.webm',
  '*.pdf',
  '*.lock',
  'package-lock.json',
  'yarn.lock',
];

/**
 * Files that are allowed to contain API keys (e.g., example files)
 */
const ALLOWLISTED_FILES = [
  '.env.example',
  '.env.template',
  '.env.sample',
  '*.example.js',
  '*.example.ts',
  '*.sample.js',
  '*.sample.ts',
  '*.test.js',
  '*.test.ts',
  '*.spec.js',
  '*.spec.ts',
  'test/**/*',
  '__tests__/**/*',
  'docs/**/*',
];

module.exports = {
  API_KEY_PATTERNS,
  SCAN_EXCLUSIONS,
  ALLOWLISTED_FILES,
};
