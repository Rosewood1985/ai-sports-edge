// External imports
import React from 'react';


import { render, fireEvent, waitFor } from '@testing-library/react';


// Internal imports
import { HomePage } from '../../../atomic/pages';




























            confidence: 85,
            id: 'game1',
            id: 'game2',
            id: 'rec1',
            imageUrl: 'https://example.com/game1.jpg',
            imageUrl: 'https://example.com/game2.jpg',
            imageUrl: 'https://example.com/rec1.jpg',
            subtitle: 'Team A vs Team B',
            subtitle: 'Team C vs Team D',
            subtitle: 'Team E vs Team F',
            time: '7:30 PM',
            time: '8:00 PM',
            title: 'Game 1',
            title: 'Game 2',
            title: 'Recommendation 1',
          id: 'featured1',
          imageUrl: 'https://example.com/featured.jpg',
          subtitle: 'Big Match of the Week',
          title: 'Featured Game',
          {
          {
          {
          },
          },
          },
        'common.loading': 'Loading...',
        'home.noGames': 'No games available',
        'home.recommendations': 'Recommendations',
        'home.upcomingGames': 'Upcoming Games',
        'home.viewFeatured': 'View Featured',
        Promise.resolve([
        Promise.resolve([
        Promise.resolve({
        ])
        ])
        email: 'test@example.com',
        uid: 'test-uid',
        })
      ),
      ),
      ),
      background: '#FFFFFF',
      border: '#E0E0E0',
      captureException: jest.fn(),
      const translations = {
      error: '#FF3B30',
      expect(getByText('85%')).toBeTruthy();
      expect(getByText('Big Match of the Week')).toBeTruthy();
      expect(getByText('Featured Game')).toBeTruthy();
      expect(getByText('Game 1')).toBeTruthy();
      expect(getByText('Game 2')).toBeTruthy();
      expect(getByText('Recommendation 1')).toBeTruthy();
      expect(getByText('Recommendations')).toBeTruthy();
      expect(getByText('Team A vs Team B')).toBeTruthy();
      expect(getByText('Team C vs Team D')).toBeTruthy();
      expect(getByText('Team E vs Team F')).toBeTruthy();
      expect(getByText('Upcoming Games')).toBeTruthy();
      expect(getByText('View Featured')).toBeTruthy();
      fireEvent.press(getByText('Featured Game'));
      fireEvent.press(getByText('Game 1'));
      getCurrentUser: jest.fn(() => ({
      getFeaturedGame: jest.fn(() =>
      getGames: jest.fn(() =>
      getRecommendations: jest.fn(() =>
      onError: '#FFFFFF',
      onPrimary: '#FFFFFF',
      onSecondary: '#FFFFFF',
      onSuccess: '#FFFFFF',
      primary: '#007BFF',
      return translations[key] || key;
      secondary: '#6C757D',
      success: '#4CD964',
      surface: '#F5F5F5',
      text: '#000000',
      textSecondary: '#757575',
      })),
      };
    // Act
    // Act
    // Act & Assert
    // Act & Assert
    // Act & Assert
    // Arrange
    // Arrange
    // Arrange
    // Arrange
    // Arrange
    // Arrange & Act
    // Assert
    // Assert
    // Assert
    auth: {
    await waitFor(() => {
    await waitFor(() => {
    await waitFor(() => {
    await waitFor(() => {
    await waitFor(() => {
    colors: {
    const navigation = require('@react-navigation/native').useNavigation();
    const navigation = require('@react-navigation/native').useNavigation();
    const { getByText } = render(<HomePage />);
    const { getByText } = render(<HomePage />);
    const { getByText } = render(<HomePage />);
    const { getByText } = render(<HomePage />);
    const { getByText } = render(<HomePage />);
    const { getByText } = render(<HomePage />);
    error: {
    expect(getByText('Loading...')).toBeTruthy();
    expect(navigation.navigate).toHaveBeenCalledWith('GameDetail', { gameId: 'featured1' });
    expect(navigation.navigate).toHaveBeenCalledWith('GameDetail', { gameId: 'game1' });
    firestore: {
    jest.clearAllMocks();
    navigate: jest.fn(),
    t: jest.fn(key => {
    }),
    });
    });
    });
    });
    });
    },
    },
    },
    },
  MainLayout: ({ children }) => <>{children}</>,
  beforeEach(() => {
  firebaseService: {
  it('navigates to game detail when featured game is selected', async () => {
  it('navigates to game detail when game is selected', async () => {
  it('renders featured game after loading', async () => {
  it('renders games after loading', async () => {
  it('renders loading state initially', () => {
  it('renders recommendations after loading', async () => {
  monitoringService: {
  useI18n: jest.fn(() => ({
  useNavigation: () => ({
  useTheme: jest.fn(() => ({
  })),
  })),
  }),
  });
  });
  });
  });
  });
  });
  });
  },
  },
 *
 * Home Page Tests
 * Tests for the Home Page component.
 */
/**
// External imports
// Internal imports
// Mock dependencies
describe('HomePage', () => {
jest.mock('../../../atomic/molecules/i18nContext', () => ({
jest.mock('../../../atomic/molecules/themeContext', () => ({
jest.mock('../../../atomic/organisms', () => ({
jest.mock('../../../atomic/templates', () => ({
jest.mock('@react-navigation/native', () => ({
}));
}));
}));
}));
}));
});

