/**
 * Cross-Platform Testing Utilities
 * 
 * This file contains utilities for testing components across different platforms.
 * It helps ensure that components work correctly on both iOS and Android.
 */

import { Platform } from 'react-native';

/**
 * Platform-specific test wrapper
 * Runs tests for specific platforms only
 * 
 * @param platform Platform to run tests on ('ios', 'android', or 'web')
 * @param testFn Test function to run
 */
export function platformTest(
  platform: 'ios' | 'android' | 'web' | ('ios' | 'android' | 'web')[],
  testName: string,
  testFn: () => void
): void {
  const platforms = Array.isArray(platform) ? platform : [platform];
  
  if (platforms.includes(Platform.OS as any)) {
    test(testName, testFn);
  } else {
    // Skip test on other platforms
    test.skip(`${testName} (skipped on ${Platform.OS})`, () => {});
  }
}

/**
 * iOS-specific test
 * @param testName Test name
 * @param testFn Test function
 */
export function iosTest(testName: string, testFn: () => void): void {
  platformTest('ios', testName, testFn);
}

/**
 * Android-specific test
 * @param testName Test name
 * @param testFn Test function
 */
export function androidTest(testName: string, testFn: () => void): void {
  platformTest('android', testName, testFn);
}

/**
 * Web-specific test
 * @param testName Test name
 * @param testFn Test function
 */
export function webTest(testName: string, testFn: () => void): void {
  platformTest('web', testName, testFn);
}

/**
 * Mobile-only test (iOS and Android)
 * @param testName Test name
 * @param testFn Test function
 */
export function mobileTest(testName: string, testFn: () => void): void {
  platformTest(['ios', 'android'], testName, testFn);
}

/**
 * Get platform-specific style or value
 * @param ios iOS-specific value
 * @param android Android-specific value
 * @param web Web-specific value (optional)
 * @returns Platform-specific value
 */
export function platformSpecific<T>(ios: T, android: T, web?: T): T {
  if (Platform.OS === 'ios') return ios;
  if (Platform.OS === 'android') return android;
  return web !== undefined ? web : ios; // Default to iOS for web if not specified
}

/**
 * Mock platform for testing
 * @param platform Platform to mock ('ios', 'android', or 'web')
 * @returns Function to restore original platform
 */
export function mockPlatform(platform: 'ios' | 'android' | 'web'): () => void {
  const originalPlatform = Platform.OS;
  
  // Mock Platform.OS
  jest.spyOn(Platform, 'OS', 'get').mockReturnValue(platform as any);
  
  // Mock Platform.select
  jest.spyOn(Platform, 'select').mockImplementation((obj: any) => {
    return obj[platform] || obj.default || obj.ios;
  });
  
  // Return function to restore original platform
  const restoreFn = () => {
    jest.spyOn(Platform, 'OS', 'get').mockReturnValue(originalPlatform as any);
    jest.spyOn(Platform, 'select').mockRestore();
  };
  
  return restoreFn;
}

/**
 * Run tests on all platforms
 * @param testName Test name
 * @param testFn Test function that receives the current platform
 */
export function allPlatformsTest(
  testName: string,
  testFn: (platform: 'ios' | 'android' | 'web') => void
): void {
  const platforms: ('ios' | 'android' | 'web')[] = ['ios', 'android', 'web'];
  
  platforms.forEach(platform => {
    test(`${testName} (${platform})`, () => {
      const restorePlatform = mockPlatform(platform);
      try {
        testFn(platform);
      } finally {
        restorePlatform();
      }
    });
  });
}