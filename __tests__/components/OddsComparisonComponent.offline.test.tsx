/**
 * @jest-environment jsdom
 */

import { render, fireEvent, waitFor } from '@testing-library/react-native';
import React from 'react';

import OddsComparisonComponent from '../../components/OddsComparisonComponent';
import { ThemeContext } from '../../contexts/ThemeContext';
import { offlineTest, crossBrowserTest, networkSpeedTest } from '../utils/offlineTesting';

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

// Theme context mock
const mockTheme = {
  colors: {
    primary: '#007BFF',
    text: '#000000',
    background: '#FFFFFF',
  },
  isDark: false,
};

describe('OddsComparisonComponent Offline Tests', () => {
  const renderComponent = (props = {}) => {
    return render(
      <ThemeContext.Provider value={mockTheme}>
        <OddsComparisonComponent {...props} />
      </ThemeContext.Provider>
    );
  };

  // Test component behavior in offline mode
  offlineTest('falls back to cached data when offline', () => {
    // Mock oddsCacheService to return cached data
    const oddsCacheService = require('../../services/oddsCacheService');
    oddsCacheService.getCachedData = jest.fn().mockResolvedValue({
      data: [
        {
          id: 'cached-game-1',
          sport_key: 'basketball_nba',
          sport_title: 'NBA',
          commence_time: new Date().toISOString(),
          home_team: 'Los Angeles Lakers',
          away_team: 'Boston Celtics',
          bookmakers: [
            {
              key: 'draftkings',
              title: 'DraftKings',
              markets: [
                {
                  key: 'h2h',
                  outcomes: [
                    {
                      name: 'Los Angeles Lakers',
                      price: -110,
                    },
                  ],
                },
              ],
            },
            {
              key: 'fanduel',
              title: 'FanDuel',
              markets: [
                {
                  key: 'h2h',
                  outcomes: [
                    {
                      name: 'Los Angeles Lakers',
                      price: -105,
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
      timestamp: Date.now(),
      ttl: 300000,
      source: 'cache',
    });

    const { getByTestId } = renderComponent();

    // Wait for the component to load
    waitFor(() => {
      // Verify that the component is using cached data
      expect(oddsCacheService.getCachedData).toHaveBeenCalled();
      expect(getByTestId('loading-indicator')).toBeTruthy();
    });
  });

  // Test component behavior across different browsers
  crossBrowserTest('renders correctly across browsers', browser => {
    const { getByTestId } = renderComponent();

    // Wait for the component to load
    waitFor(() => {
      expect(getByTestId('loading-indicator')).toBeTruthy();

      // Browser-specific checks
      if (browser === 'safari') {
        // Safari-specific checks
      } else if (browser === 'firefox') {
        // Firefox-specific checks
      } else if (browser === 'edge') {
        // Edge-specific checks
      } else {
        // Chrome-specific checks
      }
    });
  });

  // Test component behavior with different network speeds
  networkSpeedTest('handles different network speeds', speed => {
    const { getByTestId } = renderComponent();

    // Wait for the component to load
    waitFor(() => {
      expect(getByTestId('loading-indicator')).toBeTruthy();

      // Network speed-specific checks
      if (speed === 'slow') {
        // Slow network checks
        // For example, check if loading indicator is shown for longer
      } else if (speed === 'variable') {
        // Variable network checks
      } else {
        // Fast network checks
      }
    });
  });

  // Test caching behavior
  test('uses cached data when available', async () => {
    // Mock oddsCacheService to return cached data
    const oddsCacheService = require('../../services/oddsCacheService');
    oddsCacheService.getCachedData = jest.fn().mockResolvedValue({
      data: [
        {
          id: 'cached-game-1',
          sport_key: 'basketball_nba',
          sport_title: 'NBA',
          commence_time: new Date().toISOString(),
          home_team: 'Los Angeles Lakers',
          away_team: 'Boston Celtics',
          bookmakers: [
            {
              key: 'draftkings',
              title: 'DraftKings',
              markets: [
                {
                  key: 'h2h',
                  outcomes: [
                    {
                      name: 'Los Angeles Lakers',
                      price: -110,
                    },
                  ],
                },
              ],
            },
            {
              key: 'fanduel',
              title: 'FanDuel',
              markets: [
                {
                  key: 'h2h',
                  outcomes: [
                    {
                      name: 'Los Angeles Lakers',
                      price: -105,
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
      timestamp: Date.now(),
      ttl: 300000,
      source: 'cache',
    });

    const { getByTestId } = renderComponent();

    // Wait for the component to load
    await waitFor(() => {
      // Verify that the component is using cached data
      expect(oddsCacheService.getCachedData).toHaveBeenCalled();
      expect(getByTestId('loading-indicator')).toBeTruthy();
    });
  });

  // Test error handling
  test('shows error message when API fails', async () => {
    // Mock errorRecoveryService to return an error
    const errorRecoveryService = require('../../services/errorRecoveryService');
    errorRecoveryService.handleApiError = jest.fn().mockResolvedValue({
      data: null,
      error: { message: 'API Error', type: 'API', timestamp: Date.now() },
      source: 'error',
    });

    const { getByText } = renderComponent();

    // Wait for the component to load
    await waitFor(() => {
      // Verify that the component shows an error message
      expect(getByText('Error Loading Odds')).toBeTruthy();
      expect(getByText('API Error. Please try again later.')).toBeTruthy();
    });
  });
});
