# Dependency Audit Report

## Summary

- **Outdated Packages**: 41
- **Security Vulnerabilities**: 119
- **Version Conflicts**: 0
- **Missing Dependencies**: 0
- **Duplicate Dependencies**: 0
- **Peer Dependency Issues**: 0
- **Ecosystem Conflicts**: 
  - React: 4
  - Testing: 5
  - Build Tools: 3
  - TypeScript: 3
  - Firebase: 1
- **Broken Dependency Patterns**: 0
- **React Native Issues**: 0

## Outdated Packages

- **@babel/core**: 7.26.10 → 7.27.1
- **@expo/vector-icons**: 13.0.0 → 14.1.0
- **@expo/webpack-config**: 0.17.0 → 19.0.1
- **@react-native-async-storage/async-storage**: 1.17.12 → 2.1.2
- **@react-native-community/masked-view**: 0.1.10 → 0.1.11
- **@react-navigation/bottom-tabs**: 6.6.1 → 7.3.13
- **@react-navigation/native**: 6.1.18 → 7.1.9
- **@react-navigation/stack**: 6.4.1 → 7.3.2
- **@testing-library/jest-dom**: 5.17.0 → 6.6.3
- **@testing-library/react**: 12.1.5 → 16.3.0
- **@testing-library/react-native**: 9.2.0 → 13.2.0
- **@types/react**: 17.0.85 → 19.1.5
- **@types/react-native**: 0.67.26 → 0.72.8
- **babel-preset-expo**: 9.1.0 → 13.1.11
- **commander**: 12.1.0 → 14.0.0
- **eslint**: 8.57.1 → 9.27.0
- **eslint-config-universe**: 11.3.0 → 15.0.3
- **expo**: 45.0.8 → 53.0.9
- **expo-asset**: 8.5.0 → 11.1.5
- **expo-constants**: 13.1.1 → 17.1.6
- **expo-font**: 10.1.0 → 13.3.1
- **expo-linking**: 3.1.0 → 7.1.5
- **expo-splash-screen**: 0.15.1 → 0.30.8
- **expo-status-bar**: 1.3.0 → 2.2.3
- **expo-web-browser**: 10.2.1 → 14.1.6
- **firebase**: 9.23.0 → 11.8.1
- **immer**: 9.0.5 → 10.1.1
- **jest**: 26.6.3 → 29.7.0
- **jest-axe**: 7.0.1 → 10.0.0
- **jest-expo**: 45.0.1 → 53.0.5
- **node-html-parser**: 6.1.13 → 7.0.1
- **prettier**: 2.8.8 → 3.5.3
- **react**: 17.0.2 → 19.1.0
- **react-dom**: 17.0.2 → 19.1.0
- **react-native**: 0.68.2 → 0.79.2
- **react-native-gesture-handler**: 2.2.1 → 2.25.0
- **react-native-safe-area-context**: 4.2.4 → 5.4.1
- **react-native-screens**: 3.11.1 → 4.10.0
- **react-native-web**: 0.17.7 → 0.20.0
- **react-test-renderer**: 17.0.2 → 19.1.0
- **typescript**: 4.3.5 → 5.8.3

## Security Vulnerabilities

- **@expo/cli**: high severity
- **@expo/config**: high severity
- **@expo/config-plugins**: moderate severity
- **@expo/dev-server**: high severity
- **@expo/image-utils**: high severity
- **@expo/metro-config**: high severity
- **@expo/prebuild-config**: high severity
- **@expo/webpack-config**: high severity
- **@firebase/firestore**: moderate severity
- **@firebase/firestore-compat**: moderate severity
- **@grpc/grpc-js**: moderate severity
- **@jest/core**: moderate severity
- **@jest/reporters**: moderate severity
- **@jest/test-sequencer**: moderate severity
- **@jest/transform**: moderate severity
- **@react-native-community/cli**: high severity
- **@react-native-community/cli-hermes**: high severity
- **ansi-html**: high severity
- **anymatch**: moderate severity
- **babel-jest**: moderate severity
- **body-parser**: high severity
- **bonjour**: high severity
- **braces**: high severity
- **browserslist**: moderate severity
- **chokidar**: high severity
- **cross-spawn**: high severity
- **css-declaration-sorter**: moderate severity
- **css-loader**: moderate severity
- **css-select**: high severity
- **cssnano**: moderate severity
- **cssnano-preset-default**: moderate severity
- **cssnano-util-raw-cache**: moderate severity
- **dns-packet**: high severity
- **expo**: high severity
- **expo-constants**: high severity
- **expo-file-system**: moderate severity
- **expo-linking**: high severity
- **expo-pwa**: high severity
- **expo-splash-screen**: high severity
- **firebase**: moderate severity
- **fork-ts-checker-webpack-plugin**: moderate severity
- **http-proxy-middleware**: high severity
- **icss-utils**: moderate severity
- **immer**: critical severity
- **ip**: high severity
- **jest**: moderate severity
- **jest-cli**: moderate severity
- **jest-config**: moderate severity
- **jest-expo**: high severity
- **jest-haste-map**: moderate severity
- **jest-jasmine2**: moderate severity
- **jest-resolve-dependencies**: moderate severity
- **jest-runner**: moderate severity
- **jest-runtime**: moderate severity
- **jest-snapshot**: moderate severity
- **jscodeshift**: moderate severity
- **loader-utils**: critical severity
- **micromatch**: high severity
- **mini-css-extract-plugin**: moderate severity
- **minimatch**: high severity
- **multicast-dns**: high severity
- **node-forge**: high severity
- **node-sftp-deploy**: high severity
- **nth-check**: high severity
- **optimize-css-assets-webpack-plugin**: moderate severity
- **postcss**: moderate severity
- **postcss-calc**: moderate severity
- **postcss-colormin**: moderate severity
- **postcss-convert-values**: moderate severity
- **postcss-discard-comments**: moderate severity
- **postcss-discard-duplicates**: moderate severity
- **postcss-discard-empty**: moderate severity
- **postcss-discard-overridden**: moderate severity
- **postcss-merge-longhand**: moderate severity
- **postcss-merge-rules**: moderate severity
- **postcss-minify-font-values**: moderate severity
- **postcss-minify-gradients**: moderate severity
- **postcss-minify-params**: moderate severity
- **postcss-minify-selectors**: moderate severity
- **postcss-modules-extract-imports**: moderate severity
- **postcss-modules-local-by-default**: moderate severity
- **postcss-modules-scope**: moderate severity
- **postcss-modules-values**: moderate severity
- **postcss-normalize-charset**: moderate severity
- **postcss-normalize-display-values**: moderate severity
- **postcss-normalize-positions**: moderate severity
- **postcss-normalize-repeat-style**: moderate severity
- **postcss-normalize-string**: moderate severity
- **postcss-normalize-timing-functions**: moderate severity
- **postcss-normalize-unicode**: moderate severity
- **postcss-normalize-url**: moderate severity
- **postcss-normalize-whitespace**: moderate severity
- **postcss-ordered-values**: moderate severity
- **postcss-reduce-initial**: moderate severity
- **postcss-reduce-transforms**: moderate severity
- **postcss-safe-parser**: moderate severity
- **postcss-svgo**: high severity
- **postcss-unique-selectors**: moderate severity
- **qs**: high severity
- **react-dev-utils**: critical severity
- **react-native**: high severity
- **react-native-codegen**: moderate severity
- **readdirp**: moderate severity
- **recursive-readdir**: high severity
- **sane**: moderate severity
- **selfsigned**: high severity
- **semver**: high severity
- **sftp-deploy**: high severity
- **shell-quote**: critical severity
- **ssh2**: high severity
- **stylehacks**: moderate severity
- **svgo**: high severity
- **terser-webpack-plugin**: moderate severity
- **watchpack**: high severity
- **watchpack-chokidar2**: high severity
- **webpack**: moderate severity
- **webpack-dev-middleware**: high severity
- **webpack-dev-server**: high severity
- **xml2js**: moderate severity

## Missing Dependencies



## React Ecosystem Conflicts

- **react**: 17.0.2
- **react-dom**: 17.0.2
- **react-native**: 0.68.2
- **react-test-renderer**: ^17.0.2

## Testing Library Conflicts

- **jest**: ^26.6.3
- **jest-expo**: ^45.0.0
- **@testing-library/react**: ^12.1.5
- **@testing-library/react-native**: ^9.1.0
- **react-test-renderer**: ^17.0.2

## Build Tool Conflicts

- **expo**: ^45.0.0
- **babel-preset-expo**: ~9.1.0
- **@babel/core**: ^7.12.9

## TypeScript Conflicts

- **typescript**: ~4.3.5
- **@types/react**: ~17.0.21
- **@types/react-native**: ~0.67.6

## Firebase Conflicts

- **firebase**: ^9.23.0

## Recommended Actions

1. **Update React and React Native Dependencies**:
   - Align React, React DOM, and React Native versions
   - Update React Test Renderer to match React version

2. **Fix Security Vulnerabilities**:
   - Update packages with security vulnerabilities
   - Run `npm audit fix` for automatic fixes

3. **Install Missing Dependencies**:
   - Install @sentry/browser and @sentry/types

4. **Resolve Version Conflicts**:
   - Ensure consistent versions across related packages
   - Update TypeScript and @types packages to compatible versions

5. **Update Build Tools**:
   - Update Expo and related packages
   - Update Babel and Metro bundler

## Execution Plan

1. Install missing dependencies
2. Update React ecosystem packages
3. Update testing libraries
4. Update build tools
5. Fix security vulnerabilities
6. Run comprehensive tests

Generated on: 2025-05-22T18:44:42.580Z
