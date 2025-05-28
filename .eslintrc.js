module.exports = {
  root: true,
  extends: ['universe/native'],
  env: {
    node: true,
    jest: true,
  },
  rules: {
    // Customize rules as needed
    'no-console': 'warn',
    'no-debugger': 'warn',
    'prefer-const': 'warn',
    'no-var': 'error',
  },
  overrides: [
    {
      files: ['*.test.ts', '*.test.tsx', '*.spec.ts', '*.spec.tsx'],
      env: {
        jest: true,
      },
      rules: {
        'no-console': 'off',
      },
    },
    {
      files: ['functions/**/*.js', 'functions/**/*.ts'],
      env: {
        node: true,
        es6: true,
      },
      rules: {
        'no-console': 'off',
      },
    },
    {
      files: ['scripts/**/*.js'],
      env: {
        node: true,
      },
      rules: {
        'no-console': 'off',
      },
    },
  ],
  ignorePatterns: [
    'node_modules/',
    'build/',
    'dist/',
    'coverage/',
    'ios/',
    'android/',
    '*.generated.*',
    'metro.config.js',
    'babel.config.js',
    'jest.config.js',
  ],
};
