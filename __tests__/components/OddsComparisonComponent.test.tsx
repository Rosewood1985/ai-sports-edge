import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import OddsComparisonComponent from '../../components/OddsComparisonComponent';
import { ThemeContext } from '../../contexts/ThemeContext';
import { oddsCacheService } from '../../services/oddsCacheService';
import { errorRecoveryService } from '../../services/errorRecoveryService';
import { oddsHistoryService } from '../../services/oddsHistoryService';

// Mock the services
jest.mock('../../services/oddsCacheService');
jest.mock('../../services/errorRecoveryService');
jest.mock('../../services/oddsHistoryService');
jest.mock('../../services/bettingAffiliateService');

// Mock the firebase auth
jest.mock('../../config/firebase', () => ({
  auth: {
    currentUser: null
  }
}));

// Mock the LazyComponents
jest.mock('../../components/LazyComponents', () => ({
  LazySportSelector: ({ selectedSport, onSelectSport }) => (
    <select 
      data-testid="sport-selector" 
      value={selectedSport} 
      onChange={(e) => onSelectSport(e.target.value)}
    >
      <option value="basketball_nba">NBA</option>
      <option value="football_nfl">NFL</option>
    </select>
  ),
  LazyOddsMovementAlerts: ({ onClose }) => (
    <div data-testid="odds-movement-alerts">
      <button data-testid="close-alerts" onClick={onClose}>Close</button>
    </div>
  ),
  LazyParlayIntegration: (props) => (
    <div data-testid="parlay-integration">
      Parlay Integration
    </div>
  )
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

// Mock axios
jest.mock('axios');

// Theme context mock
const mockTheme = {
  colors: {
    primary: '#007BFF',
    text: '#000000',
    background: '#FFFFFF',
  },
  isDark: false,
};

describe('OddsComparisonComponent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock oddsCacheService
    oddsCacheService.getCachedData = jest.fn().mockResolvedValue(null);
    oddsCacheService.setCachedData = jest.fn().mockResolvedValue(undefined);
    
    // Mock errorRecoveryService
    errorRecoveryService.handleApiError = jest.fn().mockResolvedValue({
      data: mockOddsData,
      error: null,
      source: 'api'
    });
    
    // Mock oddsHistoryService
    oddsHistoryService.trackOdds = jest.fn().mockResolvedValue(undefined);
    oddsHistoryService.getUnreadMovementAlerts = jest.fn().mockResolvedValue([]);
  });
  
  const renderComponent = (props = {}) => {
    return render(
      <ThemeContext.Provider value={mockTheme}>
        <OddsComparisonComponent {...props} />
      </ThemeContext.Provider>
    );
  };
  
  it('renders loading state initially', () => {
    const { getByTestId } = renderComponent();
    expect(getByTestId('loading-indicator')).toBeTruthy();
  });
  
  it('renders error state when there is an error', async () => {
    errorRecoveryService.handleApiError = jest.fn().mockResolvedValue({
      data: null,
      error: { message: 'Test error', type: 'API', timestamp: Date.now() },
      source: 'error'
    });
    
    const { getByText } = renderComponent();
    
    await waitFor(() => {
      expect(getByText('Error Loading Odds')).toBeTruthy();
      expect(getByText('Test error. Please try again later.')).toBeTruthy();
    });
  });
  
  it('renders no data state when no data is available', async () => {
    errorRecoveryService.handleApiError = jest.fn().mockResolvedValue({
      data: [],
      error: null,
      source: 'api'
    });
    
    const { getByText } = renderComponent();
    
    await waitFor(() => {
      expect(getByText('No Odds Available')).toBeTruthy();
    });
  });
  
  it('renders odds comparison when data is available', async () => {
    const { getByText } = renderComponent();
    
    await waitFor(() => {
      expect(getByText('DraftKings')).toBeTruthy();
      expect(getByText('FanDuel')).toBeTruthy();
    });
  });
  
  it('changes sport when sport selector is changed', async () => {
    const { getByTestId } = renderComponent();
    
    await waitFor(() => {
      const sportSelector = getByTestId('sport-selector');
      expect(sportSelector).toBeTruthy();
    });
    
    const sportSelector = getByTestId('sport-selector');
    fireEvent.change(sportSelector, { target: { value: 'football_nfl' } });
    
    expect(oddsCacheService.getCachedData).toHaveBeenCalledWith('odds_football_nfl');
  });
  
  it('shows alerts modal when alerts button is clicked', async () => {
    const { getByTestId, queryByTestId } = renderComponent();
    
    await waitFor(() => {
      const alertsButton = getByTestId('alerts-button');
      expect(alertsButton).toBeTruthy();
    });
    
    expect(queryByTestId('odds-movement-alerts')).toBeNull();
    
    const alertsButton = getByTestId('alerts-button');
    fireEvent.press(alertsButton);
    
    await waitFor(() => {
      expect(getByTestId('odds-movement-alerts')).toBeTruthy();
    });
  });
  
  it('closes alerts modal when close button is clicked', async () => {
    const { getByTestId, queryByTestId } = renderComponent();
    
    await waitFor(() => {
      const alertsButton = getByTestId('alerts-button');
      expect(alertsButton).toBeTruthy();
    });
    
    const alertsButton = getByTestId('alerts-button');
    fireEvent.press(alertsButton);
    
    await waitFor(() => {
      expect(getByTestId('odds-movement-alerts')).toBeTruthy();
    });
    
    const closeButton = getByTestId('close-alerts');
    fireEvent.press(closeButton);
    
    await waitFor(() => {
      expect(queryByTestId('odds-movement-alerts')).toBeNull();
    });
  });
  
  it('refreshes odds when refresh button is clicked', async () => {
    const { getByTestId } = renderComponent();
    
    await waitFor(() => {
      const refreshButton = getByTestId('refresh-button');
      expect(refreshButton).toBeTruthy();
    });
    
    // Clear mocks to check if they're called again
    oddsCacheService.getCachedData.mockClear();
    errorRecoveryService.handleApiError.mockClear();
    
    const refreshButton = getByTestId('refresh-button');
    fireEvent.press(refreshButton);
    
    await waitFor(() => {
      expect(oddsCacheService.getCachedData).toHaveBeenCalled();
      expect(errorRecoveryService.handleApiError).toHaveBeenCalled();
    });
  });
  
  it('shows parlay integration when user has purchased odds', async () => {
    const { queryAllByTestId } = renderComponent({ isPremium: true });
    
    await waitFor(() => {
      const parlayIntegrations = queryAllByTestId('parlay-integration');
      expect(parlayIntegrations.length).toBeGreaterThan(0);
    });
  });
  
  it('does not show parlay integration when user has not purchased odds', async () => {
    const { queryAllByTestId } = renderComponent({ isPremium: false });
    
    await waitFor(() => {
      const parlayIntegrations = queryAllByTestId('parlay-integration');
      expect(parlayIntegrations.length).toBe(0);
    });
  });
});

// Mock odds data
const mockOddsData = [
  {
    id: 'test-game-1',
    sport_key: 'basketball_nba',
    sport_title: 'NBA',
    commence_time: new Date().toISOString(),
    home_team: 'Los Angeles Lakers',
    away_team: 'Boston Celtics',
    bookmakers: [
      {
        key: 'draftkings',
        title: 'DraftKings',
        markets: [{
          key: 'h2h',
          outcomes: [{
            name: 'Los Angeles Lakers',
            price: -110
          }]
        }]
      },
      {
        key: 'fanduel',
        title: 'FanDuel',
        markets: [{
          key: 'h2h',
          outcomes: [{
            name: 'Los Angeles Lakers',
            price: -105
          }]
        }]
      }
    ]
  }
];