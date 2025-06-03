import { useNavigation, useTheme } from '@react-navigation/native';
import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  FlatList,
  ActivityIndicator,
  Dimensions,
} from 'react-native';

import { AccessibleThemedText } from '../atomic/atoms/AccessibleThemedText';
import { AccessibleThemedView } from '../atomic/atoms/AccessibleThemedView';
import AccessibleTouchableOpacity from '../atomic/atoms/AccessibleTouchableOpacity';
import { LanguageSelector } from '../atomic/molecules';
import { useLanguage } from '../atomic/organisms/i18n/LanguageContext';

// Dynamic featured games from real sports API
const useFeaturedGames = () => {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeaturedGames = async () => {
      try {
        // Use real sports API to get today's featured games from Firebase function
        const response = await fetch(
          'https://us-central1-ai-sports-edge.cloudfunctions.net/featuredGames'
        );
        const data = await response.json();

        if (data.success) {
          setGames(data.games);
        } else {
          throw new Error('Failed to fetch games');
        }
      } catch (error) {
        console.error('Error fetching featured games:', error);
        // Fallback to empty array instead of hardcoded data
        setGames([]);
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedGames();

    // Refresh every 30 seconds for live games
    const interval = setInterval(fetchFeaturedGames, 30000);
    return () => clearInterval(interval);
  }, []);

  return { games, loading };
};

// Dynamic trending topics from real sports news API
const useTrendingTopics = () => {
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrendingTopics = async () => {
      try {
        // Use real sports news API to get trending topics from Firebase function
        const response = await fetch(
          'https://us-central1-ai-sports-edge.cloudfunctions.net/trendingTopics'
        );
        const data = await response.json();

        if (data.success) {
          setTopics(data.topics);
        } else {
          throw new Error('Failed to fetch trending topics');
        }
      } catch (error) {
        console.error('Error fetching trending topics:', error);
        // Fallback to empty array instead of hardcoded data
        setTopics([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTrendingTopics();

    // Refresh every 5 minutes for trending topics
    const interval = setInterval(fetchTrendingTopics, 300000);
    return () => clearInterval(interval);
  }, []);

  return { topics, loading };
};

const HomeScreen = () => {
  const navigation = useNavigation();
  const { colors } = useTheme(); // Use theme colors provided by NavigationContainer
  const { t } = useLanguage();

  // Use dynamic hooks for real API data
  const { games: featuredGames, loading: gamesLoading } = useFeaturedGames();
  const { topics: trendingTopics, loading: topicsLoading } = useTrendingTopics();

  const loading = gamesLoading || topicsLoading;

  // Format date (remains the same)
  const formatDate = (date: Date) => {
    return date.toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Render featured game item
  const renderFeaturedGameItem = ({ item }: { item: any }) => {
    return (
      <AccessibleTouchableOpacity
        style={[styles.cardBase, styles.gameCard, { backgroundColor: colors.card }]} // Use theme card color
        onPress={() => {
          // @ts-ignore - Navigation typing issue
          navigation.navigate('GameDetails', { gameId: item.id });
        }}
        accessibilityLabel={`${t('game.game_card')}: ${item.homeTeam.name} vs ${
          item.awayTeam.name
        }`}
        accessibilityHint={t('game.tap_to_view_details')}
        accessibilityRole="button"
      >
        <View style={styles.gameHeader}>
          <AccessibleThemedText
            style={styles.gameVenueText}
            type="small"
            accessibilityLabel={`${t('game.venue')}: ${item.venue}`}
          >
            {item.venue}
          </AccessibleThemedText>
          {item.status === 'live' && (
            <View style={[styles.liveIndicator, { backgroundColor: colors.notification }]}>
              <AccessibleThemedText
                style={styles.liveText}
                type="small"
                accessibilityLabel={t('game.live_status')}
              >
                LIVE
              </AccessibleThemedText>
            </View>
          )}
        </View>

        <View style={styles.teamsContainer}>
          {/* Home Team */}
          <View style={styles.teamContainer}>
            <AccessibleThemedText
              style={styles.teamLogo}
              type="h2"
              accessibilityLabel={`${t('game.home_team_logo')}`}
            >
              {item.homeTeam.logo}
            </AccessibleThemedText>
            <AccessibleThemedText
              style={styles.teamName}
              type="bodySmall"
              numberOfLines={1}
              accessibilityLabel={`${t('game.home_team')}: ${item.homeTeam.name}`}
            >
              {item.homeTeam.name}
            </AccessibleThemedText>
            <AccessibleThemedText
              style={styles.teamScore}
              type="h3"
              accessibilityLabel={`${t('game.home_team_score')}: ${
                item.status !== 'upcoming' ? item.homeTeam.score : t('game.not_started')
              }`}
            >
              {item.status !== 'upcoming' ? item.homeTeam.score : '-'}
            </AccessibleThemedText>
          </View>

          {/* Game Info */}
          <View style={styles.gameInfo}>
            {item.status === 'live' ? (
              <View style={styles.liveInfo}>
                <AccessibleThemedText
                  style={styles.quarterText}
                  type="bodySmall"
                  accessibilityLabel={`${t('game.quarter')} ${item.quarter}`}
                >
                  Q{item.quarter}
                </AccessibleThemedText>
                <AccessibleThemedText
                  style={styles.timeRemainingText}
                  type="small"
                  accessibilityLabel={`${t('game.time_remaining')}: ${item.timeRemaining}`}
                >
                  {item.timeRemaining}
                </AccessibleThemedText>
              </View>
            ) : (
              <AccessibleThemedText
                style={styles.gameDateText}
                type="small"
                accessibilityLabel={`${t('game.date')}: ${formatDate(item.date)}`}
              >
                {formatDate(item.date)}
              </AccessibleThemedText>
            )}
          </View>

          {/* Away Team */}
          <View style={styles.teamContainer}>
            <AccessibleThemedText
              style={styles.teamLogo}
              type="h2"
              accessibilityLabel={`${t('game.away_team_logo')}`}
            >
              {item.awayTeam.logo}
            </AccessibleThemedText>
            <AccessibleThemedText
              style={styles.teamName}
              type="bodySmall"
              numberOfLines={1}
              accessibilityLabel={`${t('game.away_team')}: ${item.awayTeam.name}`}
            >
              {item.awayTeam.name}
            </AccessibleThemedText>
            <AccessibleThemedText
              style={styles.teamScore}
              type="h3"
              accessibilityLabel={`${t('game.away_team_score')}: ${
                item.status !== 'upcoming' ? item.awayTeam.score : t('game.not_started')
              }`}
            >
              {item.status !== 'upcoming' ? item.awayTeam.score : '-'}
            </AccessibleThemedText>
          </View>
        </View>
      </AccessibleTouchableOpacity>
    );
  };

  // Render trending topic item
  const renderTrendingTopicItem = ({ item }: { item: any }) => {
    return (
      <AccessibleTouchableOpacity
        style={[styles.cardBase, styles.trendingCard, { backgroundColor: colors.card }]} // Use theme card color
        onPress={() => {
          console.log('Navigate to trending topic:', item.id);
        }}
        accessibilityLabel={`${t('trending.trending_topic')}: ${item.title}`}
        accessibilityHint={t('trending.tap_to_view_topic')}
        accessibilityRole="button"
      >
        <AccessibleThemedText
          style={styles.trendingEmoji}
          type="h2"
          accessibilityLabel={`${t('trending.emoji')}: ${item.image}`}
        >
          {item.image}
        </AccessibleThemedText>
        <AccessibleThemedText
          style={styles.trendingTitle}
          type="h4"
          numberOfLines={2}
          accessibilityLabel={`${t('trending.title')}: ${item.title}`}
        >
          {item.title}
        </AccessibleThemedText>
        <View style={[styles.categoryBadge, { backgroundColor: colors.primary + '33' }]}>
          {' '}
          {/* Use primary accent with opacity */}
          <AccessibleThemedText
            style={[styles.categoryText, { color: colors.primary }]}
            type="small"
            accessibilityLabel={`${t('trending.category')}: ${item.category}`}
          >
            {item.category.toUpperCase()}
          </AccessibleThemedText>
        </View>
      </AccessibleTouchableOpacity>
    );
  };

  // Render loading state
  if (loading) {
    return (
      <AccessibleThemedView
        style={styles.loadingContainer}
        background="primary"
        accessibilityLabel={t('common.loading_screen')}
      >
        <ActivityIndicator size="large" color={colors.primary} />
        <AccessibleThemedText
          style={styles.loadingText}
          type="bodyStd"
          accessibilityLabel={t('common.loading')}
        >
          {t('common.loading')}
        </AccessibleThemedText>
      </AccessibleThemedView>
    );
  }

  return (
    <AccessibleThemedView
      style={styles.container}
      background="primary"
      accessibilityLabel={t('home.screen_title')}
    >
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={styles.headerLeft}>
          <AccessibleThemedText
            style={styles.headerTitle}
            type="h2"
            accessibilityLabel="AI Sports Edge"
          >
            AI Sports Edge
          </AccessibleThemedText>
        </View>
        <View style={styles.headerRight}>
          <LanguageSelector />
        </View>
      </View>

      {/* Content */}
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.welcomeSection}>
          <AccessibleThemedText
            style={styles.welcomeText}
            type="h1"
            accessibilityLabel={t('home.welcome')}
          >
            {t('home.welcome')}
          </AccessibleThemedText>
        </View>

        {/* Featured Games Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <AccessibleThemedText
              style={styles.sectionTitle}
              type="h3"
              accessibilityLabel={t('home.featured_games')}
            >
              {t('home.featured_games')}
            </AccessibleThemedText>
            <AccessibleTouchableOpacity
              onPress={() => {
                // @ts-ignore - Navigation typing issue
                navigation.navigate('Games');
              }}
              accessibilityLabel={t('home.view_all')}
              accessibilityHint={t('home.view_all_games_hint')}
              accessibilityRole="button"
            >
              <AccessibleThemedText
                style={[styles.viewAllText, { color: colors.primary }]}
                type="button"
                accessibilityLabel={t('home.view_all')}
                accessibilityHint={t('home.view_all_games_hint')}
              >
                {t('home.view_all')}
              </AccessibleThemedText>
            </AccessibleTouchableOpacity>
          </View>
          <FlatList
            data={featuredGames}
            renderItem={renderFeaturedGameItem}
            keyExtractor={item => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalListContent} // Use shared style
          />
        </View>

        {/* Trending Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <AccessibleThemedText
              style={styles.sectionTitle}
              type="h3"
              accessibilityLabel={t('home.trending')}
            >
              {t('home.trending')}
            </AccessibleThemedText>
          </View>
          <FlatList
            data={trendingTopics}
            renderItem={renderTrendingTopicItem}
            keyExtractor={item => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalListContent} // Use shared style
          />
        </View>
      </ScrollView>
    </AccessibleThemedView>
  );
};

// --- Styles ---
const { width } = Dimensions.get('window');
const SPACING_UNIT = 8; // Base spacing unit

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // Background color is set by ThemedView using theme
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING_UNIT * 2, // 16
    paddingVertical: SPACING_UNIT * 1.5, // 12
    borderBottomWidth: 1,
    // borderBottomColor is set dynamically using theme
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    // Color is set by ThemedText using theme
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: SPACING_UNIT * 3, // 24
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    // Background color is set by ThemedView using theme
  },
  loadingText: {
    marginTop: SPACING_UNIT * 2, // 16
    fontSize: 16,
    // Color is set by ThemedText using theme
  },
  welcomeSection: {
    paddingHorizontal: SPACING_UNIT * 2, // 16
    marginBottom: SPACING_UNIT * 2, // 16
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    // Color is set by ThemedText using theme
    textAlign: 'left', // Explicitly left-align
  },
  section: {
    marginBottom: SPACING_UNIT * 4, // 32 - Increased spacing
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING_UNIT * 2, // 16
    marginBottom: SPACING_UNIT * 2, // 16 - Increased spacing
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    // Color is set by ThemedText using theme
    textAlign: 'left', // Explicitly left-align
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '500',
    // Color is set dynamically using theme
  },
  horizontalListContent: {
    paddingHorizontal: SPACING_UNIT * 1.5, // 12 (Start list slightly indented)
    paddingVertical: SPACING_UNIT / 2, // Add slight vertical padding for shadow visibility
  },
  // Base card style with shadow
  cardBase: {
    borderRadius: 16, // Increased border radius
    marginHorizontal: SPACING_UNIT * 0.75, // 6
    // Shadow applied consistently
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5, // Slightly softer shadow
    elevation: 3,
  },
  gameCard: {
    width: width * 0.8, // Slightly smaller width
    padding: SPACING_UNIT * 2, // 16
  },
  gameHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING_UNIT * 1.5, // 12
  },
  gameVenueText: {
    fontSize: 12,
    opacity: 0.7, // Use opacity for secondary text
    // Color is set by ThemedText using theme
    flexShrink: 1, // Allow text to shrink
  },
  liveIndicator: {
    paddingHorizontal: SPACING_UNIT, // 8
    paddingVertical: SPACING_UNIT * 0.25, // 2
    borderRadius: 4,
    marginLeft: SPACING_UNIT, // Add space if venue text is long
    // Background color is set dynamically using theme
  },
  liveText: {
    color: '#FFFFFF', // Ensure high contrast on notification background
    fontSize: 10,
    fontWeight: 'bold',
  },
  teamsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between', // Ensure space between elements
  },
  teamContainer: {
    flex: 0.35, // Adjust flex distribution
    alignItems: 'center',
    paddingHorizontal: SPACING_UNIT / 2, // 4
  },
  teamLogo: {
    fontSize: 32,
    marginBottom: SPACING_UNIT, // 8
  },
  teamName: {
    fontSize: 14, // Slightly smaller for potentially long names
    fontWeight: '600', // Semi-bold
    marginBottom: SPACING_UNIT * 0.5, // 4
    textAlign: 'center',
    // Color is set by ThemedText using theme
  },
  teamScore: {
    fontSize: 24,
    fontWeight: 'bold',
    // Color is set by ThemedText using theme
  },
  gameInfo: {
    flex: 0.3, // Adjust flex distribution
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING_UNIT / 2, // 4
  },
  gameDateText: {
    fontSize: 12,
    textAlign: 'center',
    opacity: 0.7, // Use opacity for secondary text
    // Color is set by ThemedText using theme
  },
  liveInfo: {
    alignItems: 'center',
  },
  quarterText: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: SPACING_UNIT * 0.5, // 4
    // Color is set by ThemedText using theme
  },
  timeRemainingText: {
    fontSize: 12,
    opacity: 0.7,
    // Color is set by ThemedText using theme
  },
  trendingCard: {
    width: width * 0.65, // Adjust width
    padding: SPACING_UNIT * 2, // 16
  },
  trendingEmoji: {
    fontSize: 40,
    marginBottom: SPACING_UNIT * 1.5, // 12
    textAlign: 'left', // Align emoji left
  },
  trendingTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: SPACING_UNIT * 1.5, // 12
    textAlign: 'left', // Align title left
    lineHeight: 22, // Improve readability for multi-line
    // Color is set by ThemedText using theme
  },
  categoryBadge: {
    alignSelf: 'flex-start', // Keep badge aligned left
    paddingHorizontal: SPACING_UNIT, // 8
    paddingVertical: SPACING_UNIT * 0.5, // 4
    borderRadius: 6, // Slightly more rounded
    // Background color is set dynamically using theme
  },
  categoryText: {
    fontSize: 10, // Smaller category text
    fontWeight: 'bold',
    // Color is set dynamically using theme
  },
});

export default HomeScreen;
