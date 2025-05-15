# Cross-Platform Testing Enhancements

Our testing revealed that the cross-platform testing for the Spanish version of the app could be improved. This document outlines the issues and proposes solutions.

## Current Implementation

The current cross-platform testing implementation consists of:

1. **Platform-specific tests**: Some tests are specific to iOS or web
2. **Cross-platform test utilities**: Limited utilities for testing across platforms
3. **Manual testing**: Reliance on manual testing for cross-platform compatibility

## Issues Identified

1. **Limited Platform Coverage**: Tests don't adequately cover all platforms (iOS, Android, web)
2. **Inconsistent Testing Approach**: Different approaches for testing different platforms
3. **No Automated Cross-Platform Testing**: Lack of automated tests that verify consistency across platforms
4. **Limited Device/Browser Testing**: Tests don't account for different devices and browsers

## Proposed Solutions

### 1. Create a Cross-Platform Testing Framework

Develop a unified framework for testing across platforms:

```typescript
// __tests__/utils/crossPlatformTestUtils.ts
import { Platform } from 'react-native';
import { render, RenderAPI } from '@testing-library/react-native';
import { I18nProvider } from '../../contexts/I18nContext';

// Mock Platform for testing different platforms
export const mockPlatform = (platform: 'ios' | 'android' | 'web') => {
  const originalPlatform = Platform.OS;
  Platform.OS = platform;
  return () => {
    Platform.OS = originalPlatform;
  };
};

// Render with I18n provider and specific language and platform
export const renderWithI18nAndPlatform = (
  component: React.ReactElement,
  options: {
    language?: 'en' | 'es';
    platform?: 'ios' | 'android' | 'web';
  } = {}
): RenderAPI & { restorePlatform?: () => void } => {
  const { language = 'en', platform } = options;
  
  let restorePlatform: (() => void) | undefined;
  
  if (platform) {
    restorePlatform = mockPlatform(platform);
  }
  
  const Wrapper: React.FC<{children: React.ReactNode}> = ({ children }) => {
    return (
      <I18nProvider initialLanguage={language}>
        {children}
      </I18nProvider>
    );
  };
  
  const renderResult = render(component, { wrapper: Wrapper });
  
  return {
    ...renderResult,
    restorePlatform
  };
};

// Test a component across all platforms
export const testAcrossPlatforms = (
  testName: string,
  component: React.ReactElement,
  assertions: (result: RenderAPI, platform: 'ios' | 'android' | 'web') => void | Promise<void>
) => {
  describe(testName, () => {
    const platforms: ('ios' | 'android' | 'web')[] = ['ios', 'android', 'web'];
    
    platforms.forEach(platform => {
      test(`on ${platform}`, async () => {
        const result = renderWithI18nAndPlatform(component, { platform });
        
        try {
          await assertions(result, platform);
        } finally {
          if (result.restorePlatform) {
            result.restorePlatform();
          }
        }
      });
    });
  });
};
```

### 2. Create Platform-Specific Test Utilities

Develop utilities for testing platform-specific behavior:

```typescript
// __tests__/utils/platformSpecificTestUtils.ts
import { Platform } from 'react-native';

// iOS-specific test utilities
export const iOSTestUtils = {
  simulateDeviceLanguageChange: (newLanguage: string) => {
    // Simulate iOS device language change
    if (Platform.OS !== 'ios') {
      throw new Error('This utility can only be used on iOS');
    }
    
    // Mock the NativeEventEmitter to emit a locale change event
    const { NativeEventEmitter } = require('react-native');
    const emitter = new NativeEventEmitter();
    emitter.emit('localeChanged', { locale: newLanguage });
  }
};

// Android-specific test utilities
export const androidTestUtils = {
  simulateDeviceLanguageChange: (newLanguage: string) => {
    // Simulate Android device language change
    if (Platform.OS !== 'android') {
      throw new Error('This utility can only be used on Android');
    }
    
    // Mock the NativeModules.I18nManager
    const { NativeModules } = require('react-native');
    NativeModules.I18nManager.localeIdentifier = newLanguage;
    
    // Emit a configuration change event
    const { DeviceEventEmitter } = require('react-native');
    DeviceEventEmitter.emit('configurationChanged');
  }
};

// Web-specific test utilities
export const webTestUtils = {
  simulateUrlLanguageChange: (newLanguage: 'en' | 'es') => {
    // Simulate web URL language change
    if (Platform.OS !== 'web') {
      throw new Error('This utility can only be used on web');
    }
    
    // Mock window.location
    Object.defineProperty(window, 'location', {
      value: {
        ...window.location,
        pathname: `/${newLanguage}/`
      },
      writable: true
    });
    
    // Simulate a popstate event
    window.dispatchEvent(new PopStateEvent('popstate', { state: null }));
  },
  
  simulateBrowserLanguageChange: (newLanguage: string) => {
    // Simulate browser language change
    if (Platform.OS !== 'web') {
      throw new Error('This utility can only be used on web');
    }
    
    // Mock navigator.language
    Object.defineProperty(navigator, 'language', {
      value: newLanguage,
      writable: true
    });
    
    // Simulate a languagechange event
    window.dispatchEvent(new Event('languagechange'));
  }
};
```

### 3. Create Cross-Platform Consistency Tests

Develop tests that verify consistency across platforms:

```typescript
// __tests__/cross-platform/ConsistencyTests.test.tsx
import React from 'react';
import { testAcrossPlatforms } from '../utils/crossPlatformTestUtils';
import { LanguageSelector } from '../../components/LanguageSelector';
import { NeonLoginScreen } from '../../screens/NeonLoginScreen';
import { PersonalizationSettings } from '../../components/PersonalizationSettings';

describe('Cross-Platform Consistency Tests', () => {
  // Test language selector consistency
  testAcrossPlatforms(
    'LanguageSelector renders consistently',
    <LanguageSelector />,
    (result, platform) => {
      // Verify that language options are displayed consistently
      const { getByText } = result;
      expect(getByText('English')).toBeTruthy();
      expect(getByText('Español')).toBeTruthy();
      
      // Platform-specific assertions if needed
      if (platform === 'web') {
        // Web-specific assertions
      } else if (platform === 'ios') {
        // iOS-specific assertions
      } else if (platform === 'android') {
        // Android-specific assertions
      }
    }
  );
  
  // Test login screen consistency
  testAcrossPlatforms(
    'NeonLoginScreen renders consistently',
    <NeonLoginScreen />,
    (result, platform) => {
      // Verify that login screen elements are displayed consistently
      const { getByText, getByPlaceholderText } = result;
      expect(getByText('AI SPORTS EDGE')).toBeTruthy();
      expect(getByPlaceholderText('Email')).toBeTruthy();
      expect(getByPlaceholderText('Password')).toBeTruthy();
      
      // Platform-specific assertions if needed
    }
  );
  
  // Test personalization settings consistency
  testAcrossPlatforms(
    'PersonalizationSettings renders consistently',
    <PersonalizationSettings />,
    (result, platform) => {
      // Verify that personalization settings elements are displayed consistently
      const { getByText } = result;
      expect(getByText('Personalization')).toBeTruthy();
      expect(getByText('General')).toBeTruthy();
      expect(getByText('Sportsbooks')).toBeTruthy();
      expect(getByText('Notifications')).toBeTruthy();
      
      // Platform-specific assertions if needed
    }
  );
});
```

### 4. Create Spanish Language Consistency Tests

Develop tests that verify Spanish translations are consistent across platforms:

```typescript
// __tests__/cross-platform/SpanishConsistencyTests.test.tsx
import React from 'react';
import { testAcrossPlatforms } from '../utils/crossPlatformTestUtils';
import { LanguageSelector } from '../../components/LanguageSelector';
import { NeonLoginScreen } from '../../screens/NeonLoginScreen';
import { PersonalizationSettings } from '../../components/PersonalizationSettings';

describe('Spanish Language Consistency Tests', () => {
  // Test language selector in Spanish
  testAcrossPlatforms(
    'LanguageSelector renders correctly in Spanish',
    <LanguageSelector />,
    async (result, platform) => {
      // Set language to Spanish
      const { getByText } = result;
      const spanishButton = getByText('Español');
      await fireEvent.press(spanishButton);
      
      // Verify Spanish text
      expect(getByText('Español')).toBeTruthy();
      expect(getByText('English')).toBeTruthy();
    }
  );
  
  // Test login screen in Spanish
  testAcrossPlatforms(
    'NeonLoginScreen renders correctly in Spanish',
    <NeonLoginScreen />,
    async (result, platform) => {
      // Set language to Spanish first
      // ...
      
      // Verify Spanish text
      const { getByText, getByPlaceholderText } = result;
      expect(getByText('AI SPORTS EDGE')).toBeTruthy(); // Brand name stays the same
      expect(getByText('IMPULSADO POR IA AVANZADA')).toBeTruthy();
      expect(getByPlaceholderText('Correo electrónico')).toBeTruthy();
      expect(getByPlaceholderText('Contraseña')).toBeTruthy();
      expect(getByText('INICIAR SESIÓN')).toBeTruthy();
      expect(getByText('¿Olvidó su contraseña?')).toBeTruthy();
      expect(getByText('¿No tiene una cuenta?')).toBeTruthy();
      expect(getByText('Registrarse')).toBeTruthy();
    }
  );
  
  // Test personalization settings in Spanish
  testAcrossPlatforms(
    'PersonalizationSettings renders correctly in Spanish',
    <PersonalizationSettings />,
    async (result, platform) => {
      // Set language to Spanish first
      // ...
      
      // Verify Spanish text
      const { getByText } = result;
      expect(getByText('Personalización')).toBeTruthy();
      expect(getByText('General')).toBeTruthy();
      expect(getByText('Casas de Apuestas')).toBeTruthy();
      expect(getByText('Notificaciones')).toBeTruthy();
      expect(getByText('Deporte Predeterminado')).toBeTruthy();
      expect(getByText('Restablecer Todas las Preferencias')).toBeTruthy();
    }
  );
});
```

### 5. Implement Device/Browser Testing

Set up testing for different devices and browsers:

```typescript
// __tests__/utils/deviceTestUtils.ts
import { Dimensions, Platform, ScaledSize } from 'react-native';

// Device sizes
export const deviceSizes = {
  // iOS devices
  iPhoneSE: { width: 320, height: 568 },
  iPhone8: { width: 375, height: 667 },
  iPhone11: { width: 414, height: 896 },
  iPhone12: { width: 390, height: 844 },
  
  // Android devices
  pixelSmall: { width: 360, height: 640 },
  pixelMedium: { width: 393, height: 851 },
  pixelLarge: { width: 412, height: 915 },
  
  // Web breakpoints
  webMobile: { width: 375, height: 667 },
  webTablet: { width: 768, height: 1024 },
  webDesktop: { width: 1280, height: 800 }
};

// Mock device dimensions
export const mockDeviceDimensions = (size: { width: number; height: number }) => {
  const originalDimensions = Dimensions.get('window');
  
  // Mock Dimensions.get
  jest.spyOn(Dimensions, 'get').mockImplementation((dim) => {
    if (dim === 'window' || dim === 'screen') {
      return size as ScaledSize;
    }
    return originalDimensions;
  });
  
  // Return function to restore original dimensions
  return () => {
    jest.spyOn(Dimensions, 'get').mockRestore();
  };
};

// Test across different device sizes
export const testAcrossDevices = (
  testName: string,
  component: React.ReactElement,
  assertions: (result: RenderAPI, deviceName: string, size: { width: number; height: number }) => void | Promise<void>
) => {
  describe(testName, () => {
    // Select devices based on platform
    const devices = Platform.OS === 'ios'
      ? { iPhoneSE: deviceSizes.iPhoneSE, iPhone8: deviceSizes.iPhone8, iPhone11: deviceSizes.iPhone11, iPhone12: deviceSizes.iPhone12 }
      : Platform.OS === 'android'
        ? { pixelSmall: deviceSizes.pixelSmall, pixelMedium: deviceSizes.pixelMedium, pixelLarge: deviceSizes.pixelLarge }
        : { webMobile: deviceSizes.webMobile, webTablet: deviceSizes.webTablet, webDesktop: deviceSizes.webDesktop };
    
    Object.entries(devices).forEach(([deviceName, size]) => {
      test(`on ${deviceName} (${size.width}x${size.height})`, async () => {
        const restoreDimensions = mockDeviceDimensions(size);
        
        try {
          const result = render(component);
          await assertions(result, deviceName, size);
        } finally {
          restoreDimensions();
        }
      });
    });
  });
};
```

## Implementation Plan

1. Create cross-platform testing utilities
2. Implement platform-specific test utilities
3. Develop cross-platform consistency tests
4. Create Spanish language consistency tests
5. Set up device/browser testing
6. Run tests across all platforms and fix any issues

By enhancing our cross-platform testing, we can ensure that the Spanish version of the app works consistently across all platforms and devices.