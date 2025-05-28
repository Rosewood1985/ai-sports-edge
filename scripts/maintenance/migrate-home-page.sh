#!/bin/bash

# Script to migrate the HomePage component to atomic architecture
# This script creates the HomePage component in the atomic architecture

# Set up variables
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
LOG_FILE="migrate-home-page-$TIMESTAMP.log"

# Start logging
echo "Starting HomePage migration at $(date)" | tee -a $LOG_FILE
echo "----------------------------------------" | tee -a $LOG_FILE

# Check if screens/HomeScreen.tsx exists
if [ ! -f "screens/HomeScreen.tsx" ]; then
    echo "Error: screens/HomeScreen.tsx does not exist. Please check the file path." | tee -a $LOG_FILE
    exit 1
fi

# Create HomePage component in atomic architecture
echo "Creating HomePage component in atomic architecture..." | tee -a $LOG_FILE

# Create atomic/pages/HomePage.js
cat > atomic/pages/HomePage.js << EOL
/**
 * Home Page
 * 
 * A page component for the home screen using the atomic architecture.
 */

import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Image } from "react-native";
import { useNavigation } from "@react-navigation/native";

// Import atomic components
import { MainLayout } from "../templates";
import { useTheme } from "../molecules/themeContext";
import { firebaseService } from "../organisms";
import { monitoringService } from "../organisms";
import { useI18n } from "../molecules/i18nContext";

/**
 * Home Page component
 * @returns {React.ReactNode} Rendered component
 */
const HomePage = () => {
  // Get theme from context
  const { colors } = useTheme();
  
  // Navigation
  const navigation = useNavigation();
  
  // Get translations
  const { t } = useI18n();
  
  // State
  const [loading, setLoading] = useState(true);
  const [games, setGames] = useState([]);
  const [featured, setFeatured] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  
  // Fetch data on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Get user data
        const user = firebaseService.auth.getCurrentUser();
        
        // Get games
        const gamesData = await firebaseService.firestore.getGames();
        setGames(gamesData);
        
        // Get featured game
        const featuredData = await firebaseService.firestore.getFeaturedGame();
        setFeatured(featuredData);
        
        // Get recommendations
        if (user) {
          const recommendationsData = await firebaseService.firestore.getRecommendations(user.uid);
          setRecommendations(recommendationsData);
        }
      } catch (error) {
        monitoringService.error.captureException(error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  /**
   * Handle game selection
   * @param {Object} game The selected game
   */
  const handleGameSelect = (game) => {
    navigation.navigate("GameDetail", { gameId: game.id });
  };
  
  /**
   * Handle featured game selection
   */
  const handleFeaturedSelect = () => {
    if (featured) {
      navigation.navigate("GameDetail", { gameId: featured.id });
    }
  };
  
  /**
   * Render featured game section
   * @returns {React.ReactNode} Rendered component
   */
  const renderFeatured = () => {
    if (!featured) return null;
    
    return (
      <TouchableOpacity
        style={[styles.featuredContainer, { backgroundColor: colors.surface }]}
        onPress={handleFeaturedSelect}
      >
        <Image
          source={{ uri: featured.imageUrl }}
          style={styles.featuredImage}
          resizeMode="cover"
        />
        <View style={styles.featuredOverlay}>
          <Text style={[styles.featuredTitle, { color: colors.onPrimary }]}>
            {featured.title}
          </Text>
          <Text style={[styles.featuredSubtitle, { color: colors.onPrimary }]}>
            {featured.subtitle}
          </Text>
          <View style={[styles.featuredButton, { backgroundColor: colors.primary }]}>
            <Text style={[styles.featuredButtonText, { color: colors.onPrimary }]}>
              {t("home.viewFeatured")}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };
  
  /**
   * Render games section
   * @returns {React.ReactNode} Rendered component
   */
  const renderGames = () => {
    if (games.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            {t("home.noGames")}
          </Text>
        </View>
      );
    }
    
    return (
      <View style={styles.gamesContainer}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          {t("home.upcomingGames")}
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {games.map((game) => (
            <TouchableOpacity
              key={game.id}
              style={[styles.gameCard, { backgroundColor: colors.surface }]}
              onPress={() => handleGameSelect(game)}
            >
              <Image
                source={{ uri: game.imageUrl }}
                style={styles.gameImage}
                resizeMode="cover"
              />
              <View style={styles.gameInfo}>
                <Text style={[styles.gameTitle, { color: colors.text }]}>
                  {game.title}
                </Text>
                <Text style={[styles.gameSubtitle, { color: colors.textSecondary }]}>
                  {game.subtitle}
                </Text>
                <Text style={[styles.gameTime, { color: colors.primary }]}>
                  {game.time}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };
  
  /**
   * Render recommendations section
   * @returns {React.ReactNode} Rendered component
   */
  const renderRecommendations = () => {
    if (recommendations.length === 0) return null;
    
    return (
      <View style={styles.recommendationsContainer}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          {t("home.recommendations")}
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {recommendations.map((recommendation) => (
            <TouchableOpacity
              key={recommendation.id}
              style={[styles.recommendationCard, { backgroundColor: colors.surface }]}
              onPress={() => handleGameSelect(recommendation)}
            >
              <Image
                source={{ uri: recommendation.imageUrl }}
                style={styles.recommendationImage}
                resizeMode="cover"
              />
              <View style={styles.recommendationInfo}>
                <Text style={[styles.recommendationTitle, { color: colors.text }]}>
                  {recommendation.title}
                </Text>
                <Text style={[styles.recommendationSubtitle, { color: colors.textSecondary }]}>
                  {recommendation.subtitle}
                </Text>
                <View style={[styles.recommendationBadge, { backgroundColor: colors.secondary }]}>
                  <Text style={[styles.recommendationBadgeText, { color: colors.onSecondary }]}>
                    {recommendation.confidence}%
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };
  
  // Content component
  const Content = () => (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.contentContainer}
    >
      {loading ? (
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            {t("common.loading")}
          </Text>
        </View>
      ) : (
        <>
          {renderFeatured()}
          {renderGames()}
          {renderRecommendations()}
        </>
      )}
    </ScrollView>
  );
  
  // Render page using MainLayout template
  return (
    <MainLayout
      scrollable={false}
      safeArea={true}
    >
      <Content />
    </MainLayout>
  );
};

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
  },
  featuredContainer: {
    height: 200,
    borderRadius: 10,
    overflow: "hidden",
    marginBottom: 20,
  },
  featuredImage: {
    width: "100%",
    height: "100%",
  },
  featuredOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  featuredTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 4,
  },
  featuredSubtitle: {
    fontSize: 14,
    marginBottom: 8,
  },
  featuredButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
    alignSelf: "flex-start",
  },
  featuredButtonText: {
    fontSize: 12,
    fontWeight: "bold",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
  },
  gamesContainer: {
    marginBottom: 20,
  },
  gameCard: {
    width: 160,
    height: 200,
    borderRadius: 10,
    overflow: "hidden",
    marginRight: 12,
  },
  gameImage: {
    width: "100%",
    height: 100,
  },
  gameInfo: {
    padding: 10,
  },
  gameTitle: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 4,
  },
  gameSubtitle: {
    fontSize: 12,
    marginBottom: 4,
  },
  gameTime: {
    fontSize: 12,
    fontWeight: "bold",
  },
  emptyContainer: {
    padding: 20,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 14,
  },
  recommendationsContainer: {
    marginBottom: 20,
  },
  recommendationCard: {
    width: 180,
    height: 220,
    borderRadius: 10,
    overflow: "hidden",
    marginRight: 12,
  },
  recommendationImage: {
    width: "100%",
    height: 120,
  },
  recommendationInfo: {
    padding: 10,
  },
  recommendationTitle: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 4,
  },
  recommendationSubtitle: {
    fontSize: 12,
    marginBottom: 4,
  },
  recommendationBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    alignSelf: "flex-start",
  },
  recommendationBadgeText: {
    fontSize: 10,
    fontWeight: "bold",
  },
});

export default HomePage;
EOL

# Create test file
echo "Creating test file..." | tee -a $LOG_FILE

# Create __tests__/atomic/pages/HomePage.test.js
mkdir -p __tests__/atomic/pages
cat > __tests__/atomic/pages/HomePage.test.js << EOL
/**
 * Home Page Tests
 * 
 * Tests for the Home Page component.
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react';
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
      surface: '#F5F5F5',
      primary: '#007BFF',
      onPrimary: '#FFFFFF',
      secondary: '#6C757D',
      onSecondary: '#FFFFFF',
      text: '#000000',
      textSecondary: '#757575',
      border: '#E0E0E0',
      error: '#FF3B30',
      onError: '#FFFFFF',
      success: '#4CD964',
      onSuccess: '#FFFFFF',
    },
  })),
}));

jest.mock('../../../atomic/molecules/i18nContext', () => ({
  useI18n: jest.fn(() => ({
    t: jest.fn((key) => {
      const translations = {
        'common.loading': 'Loading...',
        'home.viewFeatured': 'View Featured',
        'home.upcomingGames': 'Upcoming Games',
        'home.recommendations': 'Recommendations',
        'home.noGames': 'No games available',
      };
      return translations[key] || key;
    }),
  })),
}));

jest.mock('../../../atomic/organisms', () => ({
  firebaseService: {
    auth: {
      getCurrentUser: jest.fn(() => ({
        uid: 'test-uid',
        email: 'test@example.com',
      })),
    },
    firestore: {
      getGames: jest.fn(() => Promise.resolve([
        {
          id: 'game1',
          title: 'Game 1',
          subtitle: 'Team A vs Team B',
          time: '7:30 PM',
          imageUrl: 'https://example.com/game1.jpg',
        },
        {
          id: 'game2',
          title: 'Game 2',
          subtitle: 'Team C vs Team D',
          time: '8:00 PM',
          imageUrl: 'https://example.com/game2.jpg',
        },
      ])),
      getFeaturedGame: jest.fn(() => Promise.resolve({
        id: 'featured1',
        title: 'Featured Game',
        subtitle: 'Big Match of the Week',
        imageUrl: 'https://example.com/featured.jpg',
      })),
      getRecommendations: jest.fn(() => Promise.resolve([
        {
          id: 'rec1',
          title: 'Recommendation 1',
          subtitle: 'Team E vs Team F',
          confidence: 85,
          imageUrl: 'https://example.com/rec1.jpg',
        },
      ])),
    },
  },
  monitoringService: {
    error: {
      captureException: jest.fn(),
    },
  },
}));

jest.mock('../../../atomic/templates', () => ({
  MainLayout: ({ children }) => <>{children}</>,
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

  it('renders games after loading', async () => {
    // Arrange
    const { getByText } = render(<HomePage />);
    
    // Act & Assert
    await waitFor(() => {
      expect(getByText('Upcoming Games')).toBeTruthy();
      expect(getByText('Game 1')).toBeTruthy();
      expect(getByText('Team A vs Team B')).toBeTruthy();
      expect(getByText('Game 2')).toBeTruthy();
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

  it('navigates to game detail when game is selected', async () => {
    // Arrange
    const { getByText } = render(<HomePage />);
    const navigation = require('@react-navigation/native').useNavigation();
    
    // Act
    await waitFor(() => {
      fireEvent.press(getByText('Game 1'));
    });
    
    // Assert
    expect(navigation.navigate).toHaveBeenCalledWith('GameDetail', { gameId: 'game1' });
  });

  it('navigates to game detail when featured game is selected', async () => {
    // Arrange
    const { getByText } = render(<HomePage />);
    const navigation = require('@react-navigation/native').useNavigation();
    
    // Act
    await waitFor(() => {
      fireEvent.press(getByText('Featured Game'));
    });
    
    // Assert
    expect(navigation.navigate).toHaveBeenCalledWith('GameDetail', { gameId: 'featured1' });
  });
});
EOL

# Update index.js
echo "Updating index.js..." | tee -a $LOG_FILE

# Update atomic/pages/index.js
sed -i.bak '/export { default as LoginScreen } from/a export { default as HomePage } from '\''./HomePage'\'';' atomic/pages/index.js

# Run ESLint
echo "Running ESLint..." | tee -a $LOG_FILE
npx eslint --config .eslintrc.atomic.js atomic/pages/HomePage.js >> $LOG_FILE 2>&1

# Run tests
echo "Running tests..." | tee -a $LOG_FILE
npx jest --config=jest.config.atomic.js __tests__/atomic/pages/HomePage.test.js >> $LOG_FILE 2>&1

# Update to-do files
echo "Updating to-do files..." | tee -a $LOG_FILE

# Update ai-sports-edge-todo.md
sed -i.bak 's/- \[ \] HomePage/- \[x\] HomePage/g' ai-sports-edge-todo.md

# Commit changes
echo "Committing changes..." | tee -a $LOG_FILE
git add atomic/pages/HomePage.js
git add atomic/pages/index.js
git add __tests__/atomic/pages/HomePage.test.js
git add ai-sports-edge-todo.md
git commit -m "Migrate HomePage to atomic architecture

- Add HomePage component to atomic/pages
- Add HomePage tests
- Update pages index
- Update to-do files"

# Push changes
echo "Pushing changes..." | tee -a $LOG_FILE
git push origin $(git rev-parse --abbrev-ref HEAD)

# Final message
echo "----------------------------------------" | tee -a $LOG_FILE
echo "HomePage migration completed at $(date)" | tee -a $LOG_FILE
echo "See $LOG_FILE for details" | tee -a $LOG_FILE
echo "✅ Migration completed successfully" | tee -a $LOG_FILE

# Summary
echo "
Migration Summary:

1. Created files:
   - atomic/pages/HomePage.js
   - __tests__/atomic/pages/HomePage.test.js

2. Updated files:
   - atomic/pages/index.js
   - ai-sports-edge-todo.md

3. Ran tests and ESLint

4. Committed and pushed changes

The HomePage has been successfully migrated to the atomic architecture!
Next steps:
1. Migrate ProfilePage
2. Migrate BettingPage
3. Migrate SettingsPage
"