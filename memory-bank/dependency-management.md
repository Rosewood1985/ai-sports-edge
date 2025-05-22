# Dependency Management Guide

## Overview

This document provides a comprehensive guide to managing dependencies in the AI Sports Edge project. It covers common issues, solutions, and best practices for maintaining a healthy dependency ecosystem.

## Current Dependency Status

As of May 22, 2025, the project has several dependency issues:

1. **Outdated Packages**: Many packages are outdated, including React, React Native, Expo, and testing libraries.
2. **Security Vulnerabilities**: 119 vulnerabilities (71 moderate, 44 high, 4 critical) identified by npm audit.
3. **Version Conflicts**: React 17.0.2 vs react-test-renderer 19.1.0 causing testing issues.
4. **Missing Dependencies**: @sentry/browser and @sentry/types are imported but not installed.
5. **React Navigation Theme Issues**: Theme configuration problems in the test environment.

## Dependency Management Tools

We've created two scripts to help manage dependencies:

### 1. Dependency Audit Script

The `scripts/dependency-audit.js` script performs a comprehensive audit of dependencies:

- Identifies outdated packages
- Checks for security vulnerabilities
- Detects version conflicts
- Identifies missing dependencies
- Checks for ecosystem conflicts (React, testing, build tools, TypeScript, Firebase)
- Generates a detailed report

Usage:

```bash
# Run audit only
node scripts/dependency-audit.js

# Run audit and apply fixes
node scripts/dependency-audit.js --fix

# Generate report only
node scripts/dependency-audit.js --report-only

# Show detailed information
node scripts/dependency-audit.js --verbose
```

### 2. React Test Renderer Fix Script

The `scripts/fix-react-test-renderer.js` script specifically addresses the React/react-test-renderer version mismatch:

- Aligns react-test-renderer version with React version
- Installs missing Sentry dependencies
- Updates Jest setup files to handle potential errors
- Creates mock implementations if needed

Usage:

```bash
# Apply fixes
node scripts/fix-react-test-renderer.js

# Show what would be done without making changes
node scripts/fix-react-test-renderer.js --dry-run

# Show detailed information
node scripts/fix-react-test-renderer.js --verbose
```

## Common Dependency Issues and Solutions

### 1. React Ecosystem Version Conflicts

**Issue**: Mismatched versions between React, React DOM, React Native, and react-test-renderer.

**Solution**:

- Align react-test-renderer version with React version
- Ensure React and React DOM versions match
- Use compatible React Native version

```bash
# Example fix
npm install react-test-renderer@17.0.2 --save-dev
```

### 2. Missing Dependencies

**Issue**: Dependencies imported in code but not listed in package.json.

**Solution**:

- Install missing dependencies
- Use dependency audit script to identify missing dependencies

```bash
# Example fix for Sentry
npm install @sentry/browser @sentry/types --save-dev
```

### 3. Security Vulnerabilities

**Issue**: Dependencies with known security vulnerabilities.

**Solution**:

- Run npm audit to identify vulnerabilities
- Use npm audit fix to automatically fix vulnerabilities
- Update dependencies to secure versions

```bash
# Fix vulnerabilities
npm audit fix

# Fix vulnerabilities including breaking changes
npm audit fix --force
```

### 4. Expo and React Native Compatibility

**Issue**: Incompatible versions of Expo and React Native.

**Solution**:

- Refer to Expo documentation for compatible React Native versions
- Update both packages together
- Test thoroughly after updates

## Best Practices for Dependency Management

### 1. Regular Updates

- Schedule regular dependency updates (monthly or quarterly)
- Update minor versions more frequently than major versions
- Test thoroughly after updates

### 2. Version Pinning

- Pin exact versions for critical dependencies
- Use caret (^) for minor updates of stable dependencies
- Use tilde (~) for patch updates of less stable dependencies

### 3. Peer Dependencies

- Respect peer dependency requirements
- Document peer dependency relationships
- Test with compatible peer dependency versions

### 4. Dependency Pruning

- Regularly remove unused dependencies
- Consolidate similar dependencies
- Avoid duplicate functionality

### 5. Testing After Updates

- Run comprehensive tests after dependency updates
- Test on all supported platforms
- Verify critical functionality

## Dependency Update Workflow

1. **Backup**: Create backups of package.json and lock files
2. **Audit**: Run dependency audit script to identify issues
3. **Plan**: Create an update plan based on audit results
4. **Update**: Update dependencies in small, manageable batches
5. **Test**: Run tests after each batch of updates
6. **Document**: Document changes and any required adjustments
7. **Commit**: Commit changes with clear commit messages

## Troubleshooting Common Issues

### Jest and React Testing Library

**Issue**: Version conflicts between Jest, React, and testing libraries.

**Solution**:

- Ensure react-test-renderer version matches React version
- Use compatible versions of @testing-library/react and @testing-library/react-native
- Configure Jest to use babel-jest for TypeScript files

### Expo and React Native

**Issue**: Expo SDK version compatibility with React Native.

**Solution**:

- Refer to Expo documentation for compatible React Native versions
- Update both packages together
- Test thoroughly after updates

### TypeScript and @types Packages

**Issue**: Incompatible versions of TypeScript and @types packages.

**Solution**:

- Ensure @types/react and @types/react-native versions are compatible with TypeScript version
- Update TypeScript and @types packages together
- Run type checks after updates

## Resources

- [npm Documentation](https://docs.npmjs.com/)
- [Yarn Documentation](https://yarnpkg.com/getting-started)
- [Expo SDK Versions](https://docs.expo.dev/versions/latest/)
- [React Native Versions](https://reactnative.dev/versions)
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)

## Conclusion

Proper dependency management is critical for maintaining a healthy, secure, and maintainable codebase. By following the guidelines in this document and using the provided tools, you can effectively manage dependencies in the AI Sports Edge project.

Regular audits, careful updates, and thorough testing will help prevent dependency-related issues and ensure a smooth development experience.
