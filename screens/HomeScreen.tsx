import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useNavigation, useTheme } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../../atomic/organisms/i18n/LanguageContext';
import { ThemedText } from '../atomic/atoms/ThemedText';
import { ThemedView } from '../atomic/atoms/ThemedView';
import LanguageSelector from '../components/LanguageSelector';
import { Colors } from '../constants/Colors'; // Import base Colors

// Mock data (remains the same)
const FEATURED_GAMES = [
  {
    id: 'game1',
    homeTeam: {
      id: 'team1',
      name: 'Lakers',
      logo: '🏀',
      score: 105,
    },
    awayTeam: {
      id: 'team2',
      name: 'Warriors',
      logo: '🏀',
      score: 98,
    },
    status: 'completed',
    date: new Date(2025, 2, 20, 19, 30),
    venue: 'Staples Center',
  },
  {
    id: 'game2',
    homeTeam: {
      id: 'team3',
      name: 'Celtics',
      logo: '🏀',
      score: 0,
    },
    awayTeam: {
      id: 'team4',
      name: 'Nets',
      logo: '🏀',
      score: 0,
    },
    status: 'upcoming',
    date: new Date(2025, 3, 25, 20, 0),
    venue: 'TD Garden',
  },
  {
    id: 'game3',
    homeTeam: {
      id: 'team5',
      name: 'Heat',
      logo: '🏀',
      score: 87,
    },
    awayTeam: {
      id: 'team6',
      name: 'Bulls',
      logo: '🏀',
      score: 92,
    },
    status: 'live',
    date: new Date(),
    venue: 'American Airlines Arena',
    quarter: 4,
    timeRemaining: '3:45',
  },
];
const TRENDING_TOPICS = [
  {
    id: 'trend1',
    title: 'LeBron James breaks scoring record',
    image: '🏆',
    category: 'news',
  },
  {
    id: 'trend2',
    title: 'Warriors on 10-game winning streak',
    image: '🔥',
    category: 'stats',
  },
  {
    id: 'trend3',
    title: 'Top 5 rookies to watch this season',
    image: '👀',
    category: 'analysis',
  },
];

const HomeScreen = () => {
  const navigation = useNavigation();
  const { colors } = useTheme(); // Use theme colors provided by NavigationContainer
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [featuredGames, setFeaturedGames] = useState(FEATURED_GAMES);
  const [trendingTopics, setTrendingTopics] = useState(TRENDING_TOPICS);

  // Load data (remains the same)
  useEffect(() => {
    const loadData = async () => {
      try {
        setTimeout(() => {
          setFeaturedGames(FEATURED_GAMES);
          setTrendingTopics(TRENDING_TOPICS);
          setLoading(false);
        }, 500);
      } catch (error) {
        console.error('Error loading home data:', error);
        setLoading(false);
      }
    };
    loadData();
  }, []);

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
  const renderFeaturedGameItem = ({ item }: { item: (typeof FEATURED_GAMES)[0] }) => {
    return (
      <TouchableOpacity
        style={[styles.cardBase, styles.gameCard, { backgroundColor: colors.card }]} // Use theme card color
        onPress={() => {
          // @ts-ignore - Navigation typing issue
          navigation.navigate('GameDetails', { gameId: item.id });
        }}
      >
        <View style={styles.gameHeader}>
          <ThemedText style={styles.gameVenueText}>{item.venue}</ThemedText>
          {item.status === 'live' && (
            <View style={[styles.liveIndicator, { backgroundColor: colors.notification }]}>
              <ThemedText style={styles.liveText}>LIVE</ThemedText>
            </View>
          )}
        </View>

        <View style={styles.teamsContainer}>
          {/* Home Team */}
          <View style={styles.teamContainer}>
            <ThemedText style={styles.teamLogo}>{item.homeTeam.logo}</ThemedText>
            <ThemedText style={styles.teamName} numberOfLines={1}>
              {item.homeTeam.name}
            </ThemedText>
            <ThemedText style={styles.teamScore}>
              {item.status !== 'upcoming' ? item.homeTeam.score : '-'}
            </ThemedText>
          </View>

          {/* Game Info */}
          <View style={styles.gameInfo}>
            {item.status === 'live' ? (
              <View style={styles.liveInfo}>
                <ThemedText style={styles.quarterText}>Q{item.quarter}</ThemedText>
                <ThemedText style={styles.timeRemainingText}>{item.timeRemaining}</ThemedText>
              </View>
            ) : (
              <ThemedText style={styles.gameDateText}>{formatDate(item.date)}</ThemedText>
            )}
          </View>

          {/* Away Team */}
          <View style={styles.teamContainer}>
            <ThemedText style={styles.teamLogo}>{item.awayTeam.logo}</ThemedText>
            <ThemedText style={styles.teamName} numberOfLines={1}>
              {item.awayTeam.name}
            </ThemedText>
            <ThemedText style={styles.teamScore}>
              {item.status !== 'upcoming' ? item.awayTeam.score : '-'}
            </ThemedText>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // Render trending topic item
  const renderTrendingTopicItem = ({ item }: { item: (typeof TRENDING_TOPICS)[0] }) => {
    return (
      <TouchableOpacity
        style={[styles.cardBase, styles.trendingCard, { backgroundColor: colors.card }]} // Use theme card color
        onPress={() => {
          console.log('Navigate to trending topic:', item.id);
        }}
      >
        <ThemedText style={styles.trendingEmoji}>{item.image}</ThemedText>
        <ThemedText style={styles.trendingTitle} numberOfLines={2}>
          {item.title}
        </ThemedText>
        <View style={[styles.categoryBadge, { backgroundColor: colors.primary + '33' }]}>
          {' '}
          {/* Use primary accent with opacity */}
          <ThemedText style={[styles.categoryText, { color: colors.primary }]}>
            {item.category.toUpperCase()}
          </ThemedText>
        </View>
      </TouchableOpacity>
    );
  };

  // Render loading state
  if (loading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <ThemedText style={styles.loadingText}>{t('common.loading')}</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={styles.headerLeft}>
          <ThemedText style={styles.headerTitle}>AI Sports Edge</ThemedText>
        </View>
        <View style={styles.headerRight}>
          <LanguageSelector />
        </View>
      </View>

      {/* Content */}
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.welcomeSection}>
          <ThemedText style={styles.welcomeText}>{t('home.welcome')}</ThemedText>
        </View>

        {/* Featured Games Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <ThemedText style={styles.sectionTitle}>{t('home.featured_games')}</ThemedText>
            <TouchableOpacity
              onPress={() => {
                // @ts-ignore - Navigation typing issue
                navigation.navigate('Games');
              }}
            >
              <ThemedText style={[styles.viewAllText, { color: colors.primary }]}>
                {t('home.view_all')}
              </ThemedText>
            </TouchableOpacity>
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
            <ThemedText style={styles.sectionTitle}>{t('home.trending')}</ThemedText>
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
    </ThemedView>
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
