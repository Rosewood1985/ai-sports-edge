# Dependency Management Guide

## Overview

This guide provides instructions for managing dependencies in the AI Sports Edge application. It covers how to check for outdated packages, update dependencies, and ensure that the application remains secure and stable.

## Dependency Update Script

The AI Sports Edge application includes a dependency update script that helps manage dependencies in a controlled manner. The script is located at `scripts/update-dependencies.js` and provides several options for updating dependencies.

### Features

- Check for outdated packages
- Apply patch, minor, or major updates
- Update specific packages
- Apply security-focused updates
- Check for security vulnerabilities
- Create backups before updates
- Run tests after updates to verify functionality
- Restore backups if tests fail
- Check for peer dependency issues

### Usage

To use the dependency update script:

1. Make sure the script is executable:

   ```bash
   chmod +x scripts/update-dependencies.js
   ```

2. Run the script:

   ```bash
   node scripts/update-dependencies.js
   ```

3. Select an option from the menu:
   - **Patch updates only (safest)**: Updates only patch versions (e.g., 1.0.0 to 1.0.1)
   - **Minor and patch updates (recommended)**: Updates minor and patch versions (e.g., 1.0.0 to 1.1.0)
   - **All updates including major versions**: Updates all versions (e.g., 1.0.0 to 2.0.0)
   - **Update specific packages**: Updates only the packages you specify
   - **Security-focused updates**: Prioritizes fixing security vulnerabilities
   - **Check for security vulnerabilities**: Checks for security vulnerabilities without updating
   - **Exit**: Exits the script

## Update Strategy

Our update strategy follows these principles:

1. **Security First**: Prioritize fixing security vulnerabilities
2. **Stability**: Prefer patch and minor updates over major updates
3. **Compatibility**: Ensure updates don't break existing functionality
4. **Testing**: Verify all updates with automated tests
5. **Documentation**: Document all updates and their impact

## React Native Considerations

When updating React Native dependencies, we need to be especially careful with:

- React and React Native versions (must be compatible)
- Native modules that may require additional configuration
- Expo SDK compatibility
- iOS and Android platform-specific issues

### React Native Version Compatibility

| React Native Version | React Version | Expo SDK Version |
| -------------------- | ------------- | ---------------- |
| 0.68.x               | 17.0.2        | 45.0.0           |
| 0.69.x               | 18.0.0        | 46.0.0           |
| 0.70.x               | 18.1.0        | 47.0.0           |
| 0.71.x               | 18.2.0        | 48.0.0           |

## Dependency Groups

The following dependency groups should be kept in sync (same version):

1. React-related:

   - react
   - react-dom
   - react-test-renderer

2. React Navigation:

   - @react-navigation/native
   - @react-navigation/stack
   - @react-navigation/bottom-tabs

3. Firebase:
   - firebase
   - @firebase/app
   - @firebase/auth
   - @firebase/firestore

## Security Considerations

Security is a top priority when managing dependencies. The following practices help ensure the security of the application:

1. **Regular Updates**: Keep dependencies up-to-date to benefit from security patches
2. **Security Audits**: Regularly run security audits using `npm audit`
3. **Vulnerability Monitoring**: Monitor for security vulnerabilities in dependencies
4. **Dependency Pinning**: Pin dependencies to specific versions to prevent unexpected updates
5. **Lockfile Maintenance**: Keep the lockfile up-to-date and verify its integrity

## Troubleshooting

### Peer Dependency Issues

Peer dependency issues occur when a package requires a specific version of another package. To resolve peer dependency issues:

1. Check the error message to identify the conflicting packages
2. Update the packages to compatible versions
3. Use the `--legacy-peer-deps` flag if necessary (already included in the update script)

### Breaking Changes

Major version updates may include breaking changes. To handle breaking changes:

1. Read the release notes for the updated package
2. Identify the breaking changes
3. Update the application code to accommodate the changes
4. Test thoroughly to ensure functionality

## References

- [React Native Upgrade Helper](https://react-native-community.github.io/upgrade-helper/)
- [Expo SDK Compatibility](https://docs.expo.dev/versions/latest/)
- [npm Documentation](https://docs.npmjs.com/)
