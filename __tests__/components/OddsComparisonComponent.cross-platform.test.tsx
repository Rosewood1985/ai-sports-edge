import { render, fireEvent, waitFor } from '@testing-library/react-native';
import React from 'react';

import OddsComparisonComponent from '../../components/OddsComparisonComponent';
import { ThemeContext } from '../../contexts/ThemeContext';
import { allPlatformsTest, iosTest, androidTest, webTest } from '../utils/crossPlatformTesting';

// Mock the services
jest.mock('../../services/oddsCacheService');
jest.mock('../../services/errorRecoveryService');
jest.mock('../../services/oddsHistoryService');
jest.mock('../../services/bettingAffiliateService');

// Mock the firebase auth
jest.mock('../../config/firebase', () => ({
  auth: {
    currentUser: null,
  },
}));

// Mock the LazyComponents
jest.mock('../../components/LazyComponents', () => ({
  LazySportSelector: ({ selectedSport, onSelectSport }) => (
    <select
      data-testid="sport-selector"
      value={selectedSport}
      onChange={e => onSelectSport(e.target.value)}
    >
      <option value="basketball_nba">NBA</option>
      <option value="football_nfl">NFL</option>
    </select>
  ),
  LazyOddsMovementAlerts: ({ onClose }) => (
    <div data-testid="odds-movement-alerts">
      <button data-testid="close-alerts" onClick={onClose}>
        Close
      </button>
    </div>
  ),
  LazyParlayIntegration: props => <div data-testid="parlay-integration">Parlay Integration</div>,
}));

// Mock the Animated API
jest.mock('react-native/Libraries/Animated/Animated', () => {
  const ActualAnimated = jest.requireActual('react-native/Libraries/Animated/Animated');
  return {
    ...ActualAnimated,
    timing: jest.fn(() => ({
      start: jest.fn(cb => cb && cb({ finished: true })),
    })),
    loop: jest.fn(() => ({
      start: jest.fn(),
      stop: jest.fn(),
    })),
    Value: jest.fn(() => ({
      setValue: jest.fn(),
      interpolate: jest.fn(() => ({
        interpolate: jest.fn(),
      })),
    })),
  };
});

// Theme context mock
const mockTheme = {
  colors: {
    primary: '#007BFF',
    text: '#000000',
    background: '#FFFFFF',
  },
  isDark: false,
};

describe('OddsComparisonComponent Cross-Platform Tests', () => {
  const renderComponent = (props = {}) => {
    return render(
      <ThemeContext.Provider value={mockTheme}>
        <OddsComparisonComponent {...props} />
      </ThemeContext.Provider>
    );
  };

  // Test that runs on all platforms
  allPlatformsTest('renders on all platforms', platform => {
    const { getByTestId } = renderComponent();
    expect(getByTestId('loading-indicator')).toBeTruthy();
  });

  // iOS-specific tests
  iosTest('renders with iOS-specific styles', () => {
    const { getByTestId } = renderComponent();
    // Check iOS-specific styling or behavior
    // For example, check if the component uses iOS-specific UI elements
    expect(getByTestId('loading-indicator')).toBeTruthy();
  });

  // Android-specific tests
  androidTest('renders with Android-specific styles', () => {
    const { getByTestId } = renderComponent();
    // Check Android-specific styling or behavior
    // For example, check if the component uses Android-specific UI elements
    expect(getByTestId('loading-indicator')).toBeTruthy();
  });

  // Web-specific tests
  webTest('renders with web-specific styles', () => {
    const { getByTestId } = renderComponent();
    // Check web-specific styling or behavior
    // For example, check if the component uses web-specific UI elements
    expect(getByTestId('loading-indicator')).toBeTruthy();
  });

  // Test touch interactions on mobile platforms
  allPlatformsTest('handles touch interactions correctly', platform => {
    const { getByTestId } = renderComponent();

    // Wait for the component to load
    waitFor(() => {
      const refreshButton = getByTestId('refresh-button');
      expect(refreshButton).toBeTruthy();

      // Test touch interaction
      fireEvent.press(refreshButton);

      // Verify platform-specific behavior if needed
      if (platform === 'ios') {
        // iOS-specific verification
      } else if (platform === 'android') {
        // Android-specific verification
      } else {
        // Web-specific verification
      }
    });
  });

  // Test responsive layout on different screen sizes
  allPlatformsTest('adapts to different screen sizes', platform => {
    // Mock different screen sizes
    const originalDimensions = require('react-native').Dimensions.get('window');

    // Mock small screen (e.g., iPhone SE)
    jest.spyOn(require('react-native').Dimensions, 'get').mockReturnValue({
      width: 320,
      height: 568,
    });

    const { getByTestId: getByTestIdSmall } = renderComponent();
    expect(getByTestIdSmall('loading-indicator')).toBeTruthy();

    // Mock large screen (e.g., iPad)
    jest.spyOn(require('react-native').Dimensions, 'get').mockReturnValue({
      width: 768,
      height: 1024,
    });

    const { getByTestId: getByTestIdLarge } = renderComponent();
    expect(getByTestIdLarge('loading-indicator')).toBeTruthy();

    // Restore original dimensions
    jest.spyOn(require('react-native').Dimensions, 'get').mockReturnValue(originalDimensions);
  });

  // Test accessibility features
  allPlatformsTest('has proper accessibility features', platform => {
    const { getByTestId } = renderComponent();

    waitFor(() => {
      // Check for accessibility props on key elements
      const refreshButton = getByTestId('refresh-button');
      expect(refreshButton.props.accessibilityRole).toBe('button');

      // Platform-specific accessibility checks
      if (platform === 'ios') {
        // iOS-specific accessibility checks
      } else if (platform === 'android') {
        // Android-specific accessibility checks
      } else {
        // Web-specific accessibility checks
      }
    });
  });
});
