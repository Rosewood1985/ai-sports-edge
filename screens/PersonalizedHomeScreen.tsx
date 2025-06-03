import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import { StyleSheet, ScrollView, RefreshControl, Image } from 'react-native';

import { AccessibleThemedText } from '../atomic/atoms/AccessibleThemedText';
import { AccessibleThemedView } from '../atomic/atoms/AccessibleThemedView';
import AccessibleTouchableOpacity from '../atomic/atoms/AccessibleTouchableOpacity';
import BetNowButton from '../components/BetNowButton';
import BetNowPopup from '../components/BetNowPopup';
import LoadingIndicator from '../components/LoadingIndicator';
import { useBettingAffiliate } from '../contexts/BettingAffiliateContext';
import { usePersonalization } from '../contexts/PersonalizationContext';
import { useTheme } from '../contexts/ThemeContext';

/**
 * Personalized Home Screen
 * Shows content tailored to the user's preferences
 */
const PersonalizedHomeScreen = () => {
  const navigation = useNavigation();
  const { preferences, userProfile, personalizedContent, refreshPersonalizedContent, isLoading } =
    usePersonalization();
  const { showBetButton } = useBettingAffiliate();
  const { colors, isDark } = useTheme();

  const [refreshing, setRefreshing] = useState(false);
  const [greeting, setGreeting] = useState('');
  const [showBetPopup, setShowBetPopup] = useState(false);

  // Set greeting based on time of day
  useEffect(() => {
    const hour = new Date().getHours();
    let newGreeting = '';

    if (hour < 12) {
      newGreeting = 'Good Morning';
    } else if (hour < 18) {
      newGreeting = 'Good Afternoon';
    } else {
      newGreeting = 'Good Evening';
    }

    if (userProfile?.displayName) {
      newGreeting += `, ${userProfile.displayName}`;
    }

    setGreeting(newGreeting);
  }, [userProfile]);

  // Handle refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshPersonalizedContent();

    // Also refresh personalized data
    try {
      const userId = userProfile?.uid || 'default-user';
      const response = await fetch(
        `https://us-central1-ai-sports-edge.cloudfunctions.net/personalizedRecommendations?userId=${userId}`
      );
      const data = await response.json();

      if (data.success) {
        setPersonalizedData(data.data);
      }
    } catch (error) {
      console.error('Error refreshing personalized data:', error);
    }

    setRefreshing(false);
  };

  // Render section header
  const renderSectionHeader = (title: string) => (
    <AccessibleThemedView style={styles.sectionHeader} accessibilityLabel={`${title} section`}>
      <AccessibleThemedText style={styles.sectionHeaderText} type="h2" accessibilityLabel={title}>
        {title}
      </AccessibleThemedText>
      <AccessibleTouchableOpacity
        accessibilityLabel={`See all ${title}`}
        accessibilityRole="button"
        accessibilityHint={`View all ${title.toLowerCase()}`}
      >
        <AccessibleThemedText style={styles.seeAllText}>See All</AccessibleThemedText>
      </AccessibleTouchableOpacity>
    </AccessibleThemedView>
  );

  // Render recommended bet card
  const renderRecommendedBetCard = (bet: any, index: number) => (
    <AccessibleTouchableOpacity
      key={index}
      style={styles.recommendedBetCard}
      accessibilityLabel={`Recommended bet: ${bet.team1.name} vs ${bet.team2.name}`}
      accessibilityRole="button"
      accessibilityHint="View bet details"
    >
      <AccessibleThemedView style={styles.recommendedBetHeader} accessibilityLabel="Bet header">
        <AccessibleThemedView
          style={styles.sportIconContainer}
          accessibilityLabel={`${bet.sport} icon`}
        >
          <Ionicons
            name="basketball-outline"
            size={24}
            color={colors.primary}
            accessibilityLabel={`${bet.sport} icon`}
          />
        </AccessibleThemedView>
        <AccessibleThemedView accessibilityLabel={`${bet.sport} ${bet.league}`}>
          <AccessibleThemedText style={styles.sportText}>{bet.sport}</AccessibleThemedText>
          <AccessibleThemedText style={styles.leagueText}>{bet.league}</AccessibleThemedText>
        </AccessibleThemedView>
        <AccessibleThemedView
          style={styles.confidenceContainer}
          accessibilityLabel="Confidence rating"
        >
          <AccessibleThemedText
            style={styles.confidenceText}
            accessibilityLabel={`${bet.confidence}% confidence`}
          >
            {bet.confidence}%
          </AccessibleThemedText>
          <AccessibleThemedText style={styles.confidenceLabel}>Confidence</AccessibleThemedText>
        </AccessibleThemedView>
      </AccessibleThemedView>

      <AccessibleThemedView style={styles.teamsContainer} accessibilityLabel="Teams matchup">
        <AccessibleThemedView style={styles.teamContainer} accessibilityLabel={bet.team1.name}>
          <Image
            source={{ uri: bet.team1.logo }}
            style={styles.teamLogo}
            accessibilityLabel={`${bet.team1.name} logo`}
          />
          <AccessibleThemedText style={styles.teamName}>{bet.team1.name}</AccessibleThemedText>
        </AccessibleThemedView>

        <AccessibleThemedView style={styles.vsContainer} accessibilityLabel="versus">
          <AccessibleThemedText style={styles.vsText}>VS</AccessibleThemedText>
        </AccessibleThemedView>

        <AccessibleThemedView style={styles.teamContainer} accessibilityLabel={bet.team2.name}>
          <Image
            source={{ uri: bet.team2.logo }}
            style={styles.teamLogo}
            accessibilityLabel={`${bet.team2.name} logo`}
          />
          <AccessibleThemedText style={styles.teamName}>{bet.team2.name}</AccessibleThemedText>
        </AccessibleThemedView>
      </AccessibleThemedView>

      <AccessibleThemedView style={styles.betInfoContainer} accessibilityLabel="Bet information">
        <AccessibleThemedView
          style={styles.betTypeContainer}
          accessibilityLabel="Recommended bet type"
        >
          <AccessibleThemedText style={styles.betTypeLabel}>Recommended Bet</AccessibleThemedText>
          <AccessibleThemedText
            style={styles.betTypeValue}
            accessibilityLabel={`Recommendation: ${bet.recommendation}`}
          >
            {bet.recommendation}
          </AccessibleThemedText>
        </AccessibleThemedView>

        <AccessibleThemedView style={styles.oddsContainer} accessibilityLabel="Odds information">
          <AccessibleThemedText style={styles.oddsLabel}>Odds</AccessibleThemedText>
          <AccessibleThemedText style={styles.oddsValue} accessibilityLabel={`Odds: ${bet.odds}`}>
            {bet.odds}
          </AccessibleThemedText>
        </AccessibleThemedView>
      </AccessibleThemedView>

      {showBetButton('game') ? (
        <BetNowButton
          size="medium"
          position="fixed"
          contentType="game"
          teamId={`nba-${bet.team1.name.toLowerCase()}`}
          style={styles.betNowButton}
        />
      ) : (
        <AccessibleTouchableOpacity
          style={styles.placeBetButton}
          onPress={() => setShowBetPopup(true)}
          accessibilityLabel="Place bet"
          accessibilityRole="button"
          accessibilityHint="Open betting options"
        >
          <AccessibleThemedText style={styles.placeBetButtonText}>PLACE BET</AccessibleThemedText>
        </AccessibleTouchableOpacity>
      )}
    </AccessibleTouchableOpacity>
  );

  // Render upcoming game card
  const renderUpcomingGameCard = (game: any, index: number) => (
    <AccessibleTouchableOpacity
      key={index}
      style={styles.upcomingGameCard}
      accessibilityLabel={`Upcoming game: ${game.team1.name} vs ${game.team2.name}`}
      accessibilityRole="button"
      accessibilityHint="View game details"
    >
      <AccessibleThemedView style={styles.upcomingGameHeader} accessibilityLabel="Game information">
        <AccessibleThemedText
          style={styles.upcomingGameLeague}
          accessibilityLabel={`League: ${game.league}`}
        >
          {game.league}
        </AccessibleThemedText>
        <AccessibleThemedText
          style={styles.upcomingGameTime}
          accessibilityLabel={`Game time: ${game.time}`}
        >
          {game.time}
        </AccessibleThemedText>
      </AccessibleThemedView>

      <AccessibleThemedView style={styles.teamsContainer} accessibilityLabel="Teams matchup">
        <AccessibleThemedView style={styles.teamContainer} accessibilityLabel={game.team1.name}>
          <Image
            source={{ uri: game.team1.logo }}
            style={styles.teamLogo}
            accessibilityLabel={`${game.team1.name} logo`}
          />
          <AccessibleThemedText style={styles.teamName}>{game.team1.name}</AccessibleThemedText>
        </AccessibleThemedView>

        <AccessibleThemedView style={styles.vsContainer} accessibilityLabel="versus">
          <AccessibleThemedText style={styles.vsText}>VS</AccessibleThemedText>
        </AccessibleThemedView>

        <AccessibleThemedView style={styles.teamContainer} accessibilityLabel={game.team2.name}>
          <Image
            source={{ uri: game.team2.logo }}
            style={styles.teamLogo}
            accessibilityLabel={`${game.team2.name} logo`}
          />
          <AccessibleThemedText style={styles.teamName}>{game.team2.name}</AccessibleThemedText>
        </AccessibleThemedView>
      </AccessibleThemedView>
    </AccessibleTouchableOpacity>
  );

  // Render news item
  const renderNewsItem = (news: any, index: number) => (
    <AccessibleTouchableOpacity
      key={index}
      style={styles.newsItem}
      accessibilityLabel={`News: ${news.title}`}
      accessibilityRole="button"
      accessibilityHint="Read full news article"
    >
      <Image
        source={{ uri: news.image }}
        style={styles.newsImage}
        accessibilityLabel={`Image for news: ${news.title}`}
      />
      <AccessibleThemedView style={styles.newsContent} accessibilityLabel="News content">
        <AccessibleThemedText style={styles.newsTitle} accessibilityLabel={`Title: ${news.title}`}>
          {news.title}
        </AccessibleThemedText>
        <AccessibleThemedView style={styles.newsMetaContainer} accessibilityLabel="News metadata">
          <AccessibleThemedText
            style={styles.newsSource}
            accessibilityLabel={`Source: ${news.source}`}
          >
            {news.source}
          </AccessibleThemedText>
          <AccessibleThemedText
            style={styles.newsTime}
            accessibilityLabel={`Published: ${news.time}`}
          >
            {news.time}
          </AccessibleThemedText>
        </AccessibleThemedView>
      </AccessibleThemedView>
    </AccessibleTouchableOpacity>
  );

  // State for personalized data
  const [personalizedData, setPersonalizedData] = useState({
    recommendedBets: [],
    upcomingGames: [],
    news: [],
  });
  const [dataLoading, setDataLoading] = useState(true);

  // Load personalized data
  useEffect(() => {
    const loadPersonalizedData = async () => {
      try {
        setDataLoading(true);

        // Get user ID from userProfile or use default
        const userId = userProfile?.uid || 'default-user';

        // Fetch personalized data from Firebase function
        const response = await fetch(
          `https://us-central1-ai-sports-edge.cloudfunctions.net/personalizedRecommendations?userId=${userId}`
        );
        const data = await response.json();

        if (data.success) {
          setPersonalizedData(data.data);
        } else {
          throw new Error('Failed to fetch personalized data');
        }
      } catch (error) {
        console.error('Error loading personalized data:', error);
        // Fallback to empty arrays instead of mock data
        setPersonalizedData({
          recommendedBets: [],
          upcomingGames: [],
          news: [],
        });
      } finally {
        setDataLoading(false);
      }
    };

    loadPersonalizedData();
  }, [userProfile]);

  if (isLoading) {
    return (
      <AccessibleThemedView
        style={styles.loadingContainer}
        accessibilityLabel="Loading personalized content"
      >
        <LoadingIndicator />
      </AccessibleThemedView>
    );
  }

  return (
    <AccessibleThemedView style={styles.container} accessibilityLabel="Personalized Home Screen">
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
            accessibilityLabel="Pull to refresh content"
          />
        }
      >
        {/* Header */}
        <AccessibleThemedView style={styles.header} accessibilityLabel="Dashboard header">
          <AccessibleThemedView accessibilityLabel="Greeting section">
            <AccessibleThemedText
              style={styles.greeting}
              type="h1"
              accessibilityLabel={`Greeting: ${greeting}`}
            >
              {greeting}
            </AccessibleThemedText>
            <AccessibleThemedText style={styles.welcomeText} accessibilityLabel="Welcome message">
              Here's your personalized dashboard
            </AccessibleThemedText>
          </AccessibleThemedView>

          <AccessibleTouchableOpacity
            style={styles.settingsButton}
            onPress={() => navigation.navigate('Personalization' as never)}
            accessibilityLabel="Personalization settings"
            accessibilityRole="button"
            accessibilityHint="Navigate to personalization settings"
          >
            <Ionicons
              name="settings-outline"
              size={24}
              color={colors.primary}
              accessibilityLabel="Settings icon"
            />
          </AccessibleTouchableOpacity>
        </AccessibleThemedView>

        {/* Recommended Bets */}
        {renderSectionHeader('RECOMMENDED BETS')}
        {dataLoading ? (
          <LoadingIndicator />
        ) : (
          personalizedData.recommendedBets.map((bet, index) => renderRecommendedBetCard(bet, index))
        )}

        {/* Upcoming Games */}
        {renderSectionHeader('UPCOMING GAMES')}
        {dataLoading ? (
          <LoadingIndicator />
        ) : (
          personalizedData.upcomingGames.map((game, index) => renderUpcomingGameCard(game, index))
        )}

        {/* News */}
        {renderSectionHeader('LATEST NEWS')}
        {dataLoading ? (
          <LoadingIndicator />
        ) : (
          personalizedData.news.map((news, index) => renderNewsItem(news, index))
        )}
      </ScrollView>
      {/* Bet Now Popup */}
      <BetNowPopup
        show={showBetPopup}
        onClose={() => setShowBetPopup(false)}
        message="Ready to place your bets? Use our exclusive FanDuel affiliate link for a special bonus!"
        teamId={
          personalizedData.recommendedBets[0]?.team1
            ? `nba-${personalizedData.recommendedBets[0].team1.name.toLowerCase()}`
            : undefined
        }
      />
    </AccessibleThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  welcomeText: {
    fontSize: 16,
    opacity: 0.7,
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(52, 152, 219, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(52, 152, 219, 0.05)',
  },
  sectionHeaderText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#3498db',
    letterSpacing: 1,
  },
  seeAllText: {
    fontSize: 14,
    opacity: 0.7,
  },
  recommendedBetCard: {
    margin: 16,
    marginTop: 16,
    marginBottom: 8,
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#3498db',
  },
  recommendedBetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sportIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(52, 152, 219, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  sportText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  leagueText: {
    fontSize: 14,
    opacity: 0.7,
  },
  confidenceContainer: {
    marginLeft: 'auto',
    alignItems: 'flex-end',
  },
  confidenceText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#3498db',
  },
  confidenceLabel: {
    fontSize: 12,
    opacity: 0.7,
  },
  teamsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  teamContainer: {
    flex: 2,
    alignItems: 'center',
  },
  teamLogo: {
    width: 60,
    height: 60,
    marginBottom: 8,
  },
  teamName: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  vsContainer: {
    flex: 1,
    alignItems: 'center',
  },
  vsText: {
    fontSize: 16,
    fontWeight: 'bold',
    opacity: 0.7,
  },
  betInfoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  betTypeContainer: {
    flex: 1,
  },
  betTypeLabel: {
    fontSize: 12,
    opacity: 0.7,
    marginBottom: 4,
  },
  betTypeValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  oddsContainer: {
    flex: 1,
    alignItems: 'flex-end',
  },
  oddsLabel: {
    fontSize: 12,
    opacity: 0.7,
    marginBottom: 4,
  },
  oddsValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  placeBetButton: {
    backgroundColor: '#3498db',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeBetButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  betNowButton: {
    width: '100%',
  },
  upcomingGameCard: {
    margin: 16,
    marginTop: 8,
    marginBottom: 8,
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    padding: 16,
  },
  upcomingGameHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  upcomingGameLeague: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  upcomingGameTime: {
    fontSize: 14,
    opacity: 0.7,
  },
  newsItem: {
    flexDirection: 'row',
    margin: 16,
    marginTop: 8,
    marginBottom: 8,
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    overflow: 'hidden',
  },
  newsImage: {
    width: 100,
    height: 100,
  },
  newsContent: {
    flex: 1,
    padding: 12,
  },
  newsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  newsMetaContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  newsSource: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3498db',
  },
  newsTime: {
    fontSize: 12,
    opacity: 0.7,
  },
});

export default PersonalizedHomeScreen;
