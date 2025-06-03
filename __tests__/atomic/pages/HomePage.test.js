/**
 * Home Page Tests
 * Tests for the Home Page component.
 */

// External imports
import { render, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';

// Internal imports
import { HomePage } from '../../../atomic/pages';

// Mock dependencies
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: jest.fn(),
  }),
}));

jest.mock('../../../atomic/molecules/themeContext', () => ({
  useTheme: jest.fn(() => ({
    colors: {
      background: '#FFFFFF',
      text: '#000000',
      primary: '#007BFF',
      secondary: '#6C757D',
      error: '#FF3B30',
      success: '#4CD964',
      border: '#E0E0E0',
      surface: '#F5F5F5',
      textSecondary: '#757575',
      onPrimary: '#FFFFFF',
      onSecondary: '#FFFFFF',
      onSuccess: '#FFFFFF',
      onError: '#FFFFFF',
    },
  })),
}));

jest.mock('../../../atomic/molecules/i18nContext', () => ({
  useI18n: jest.fn(() => ({
    t: jest.fn(key => {
      const translations = {
        'home.upcomingGames': 'Upcoming Games',
        'home.recommendations': 'Recommendations',
        'home.viewFeatured': 'View Featured',
        'home.noGames': 'No games available',
        'common.loading': 'Loading...',
      };
      return translations[key] || key;
    }),
  })),
}));

jest.mock('../../../atomic/templates', () => ({
  MainLayout: ({ children }) => <>{children}</>,
}));

jest.mock('../../../atomic/organisms', () => ({
  firebaseService: {
    auth: {
      getCurrentUser: jest.fn(() => ({
        email: 'test@example.com',
        uid: 'test-uid',
      })),
    },
    firestore: {
      getGames: jest.fn(() =>
        Promise.resolve([
          {
            id: 'game1',
            title: 'Game 1',
            subtitle: 'Team A vs Team B',
            imageUrl: 'https://example.com/game1.jpg',
            time: '7:30 PM',
          },
          {
            id: 'game2',
            title: 'Game 2',
            subtitle: 'Team C vs Team D',
            imageUrl: 'https://example.com/game2.jpg',
            time: '8:00 PM',
          },
        ])
      ),
      getRecommendations: jest.fn(() =>
        Promise.resolve([
          {
            id: 'rec1',
            title: 'Recommendation 1',
            subtitle: 'Team E vs Team F',
            imageUrl: 'https://example.com/rec1.jpg',
            confidence: 85,
          },
        ])
      ),
      getFeaturedGame: jest.fn(() =>
        Promise.resolve({
          id: 'featured1',
          title: 'Featured Game',
          subtitle: 'Big Match of the Week',
          imageUrl: 'https://example.com/featured.jpg',
        })
      ),
    },
  },
  monitoringService: {
    error: {
      captureException: jest.fn(),
    },
  },
}));

describe('HomePage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading state initially', () => {
    // Arrange & Act
    const { getByText } = render(<HomePage />);

    // Assert
    expect(getByText('Loading...')).toBeTruthy();
  });

  it('renders games after loading', async () => {
    // Arrange
    const { getByText } = render(<HomePage />);

    // Act & Assert
    await waitFor(() => {
      expect(getByText('Upcoming Games')).toBeTruthy();
      expect(getByText('Game 1')).toBeTruthy();
      expect(getByText('Game 2')).toBeTruthy();
      expect(getByText('Team A vs Team B')).toBeTruthy();
      expect(getByText('Team C vs Team D')).toBeTruthy();
    });
  });

  it('renders recommendations after loading', async () => {
    // Arrange
    const { getByText } = render(<HomePage />);

    // Act & Assert
    await waitFor(() => {
      expect(getByText('Recommendations')).toBeTruthy();
      expect(getByText('Recommendation 1')).toBeTruthy();
      expect(getByText('Team E vs Team F')).toBeTruthy();
      expect(getByText('85%')).toBeTruthy();
    });
  });

  it('renders featured game after loading', async () => {
    // Arrange
    const { getByText } = render(<HomePage />);

    // Act & Assert
    await waitFor(() => {
      expect(getByText('Featured Game')).toBeTruthy();
      expect(getByText('Big Match of the Week')).toBeTruthy();
      expect(getByText('View Featured')).toBeTruthy();
    });
  });

  it('navigates to game detail when game is selected', async () => {
    // Arrange
    const navigation = require('@react-navigation/native').useNavigation();
    const { getByText } = render(<HomePage />);

    // Act
    await waitFor(() => {
      fireEvent.press(getByText('Game 1'));
    });

    // Assert
    await waitFor(() => {
      expect(navigation.navigate).toHaveBeenCalledWith('GameDetail', { gameId: 'game1' });
    });
  });

  it('navigates to game detail when featured game is selected', async () => {
    // Arrange
    const navigation = require('@react-navigation/native').useNavigation();
    const { getByText } = render(<HomePage />);

    // Act
    await waitFor(() => {
      fireEvent.press(getByText('Featured Game'));
    });

    // Assert
    await waitFor(() => {
      expect(navigation.navigate).toHaveBeenCalledWith('GameDetail', { gameId: 'featured1' });
    });
  });
});
