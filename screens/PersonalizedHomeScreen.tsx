import React, { useEffect, useState } from 'react';
import { StyleSheet, ScrollView, View, TouchableOpacity, RefreshControl, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { usePersonalization } from '../contexts/PersonalizationContext';
import { ThemedView } from '../components/ThemedView';
import { ThemedText } from '../components/ThemedText';
import { colors } from '../styles/theme';
import LoadingIndicator from '../components/LoadingIndicator';
import BetNowButton from '../components/BetNowButton';
import BetNowPopup from '../components/BetNowPopup';
import { useBettingAffiliate } from '../contexts/BettingAffiliateContext';

/**
 * Personalized Home Screen
 * Shows content tailored to the user's preferences
 */
const PersonalizedHomeScreen = () => {
  const navigation = useNavigation();
  const {
    preferences,
    userProfile,
    personalizedContent,
    refreshPersonalizedContent,
    isLoading
  } = usePersonalization();
  const { showBetButton } = useBettingAffiliate();
  
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
    setRefreshing(false);
  };
  
  // Render section header
  const renderSectionHeader = (title: string) => (
    <View style={styles.sectionHeader}>
      <ThemedText style={styles.sectionHeaderText}>{title}</ThemedText>
      <TouchableOpacity>
        <ThemedText style={styles.seeAllText}>See All</ThemedText>
      </TouchableOpacity>
    </View>
  );
  
  // Render recommended bet card
  const renderRecommendedBetCard = (bet: any, index: number) => (
    <TouchableOpacity key={index} style={styles.recommendedBetCard}>
      <View style={styles.recommendedBetHeader}>
        <View style={styles.sportIconContainer}>
          <Ionicons name="basketball-outline" size={24} color={colors.neon.blue} />
        </View>
        <View>
          <ThemedText style={styles.sportText}>{bet.sport}</ThemedText>
          <ThemedText style={styles.leagueText}>{bet.league}</ThemedText>
        </View>
        <View style={styles.confidenceContainer}>
          <ThemedText style={styles.confidenceText}>{bet.confidence}%</ThemedText>
          <ThemedText style={styles.confidenceLabel}>Confidence</ThemedText>
        </View>
      </View>
      
      <View style={styles.teamsContainer}>
        <View style={styles.teamContainer}>
          <Image source={{ uri: bet.team1.logo }} style={styles.teamLogo} />
          <ThemedText style={styles.teamName}>{bet.team1.name}</ThemedText>
        </View>
        
        <View style={styles.vsContainer}>
          <ThemedText style={styles.vsText}>VS</ThemedText>
        </View>
        
        <View style={styles.teamContainer}>
          <Image source={{ uri: bet.team2.logo }} style={styles.teamLogo} />
          <ThemedText style={styles.teamName}>{bet.team2.name}</ThemedText>
        </View>
      </View>
      
      <View style={styles.betInfoContainer}>
        <View style={styles.betTypeContainer}>
          <ThemedText style={styles.betTypeLabel}>Recommended Bet</ThemedText>
          <ThemedText style={styles.betTypeValue}>{bet.recommendation}</ThemedText>
        </View>
        
        <View style={styles.oddsContainer}>
          <ThemedText style={styles.oddsLabel}>Odds</ThemedText>
          <ThemedText style={styles.oddsValue}>{bet.odds}</ThemedText>
        </View>
      </View>
      
      {showBetButton('game') ? (
        <BetNowButton
          size="medium"
          position="fixed"
          contentType="game"
          teamId={`nba-${bet.team1.name.toLowerCase()}`}
          style={styles.betNowButton}
        />
      ) : (
        <TouchableOpacity
          style={styles.placeBetButton}
          onPress={() => setShowBetPopup(true)}
        >
          <ThemedText style={styles.placeBetButtonText}>PLACE BET</ThemedText>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
  
  // Render upcoming game card
  const renderUpcomingGameCard = (game: any, index: number) => (
    <TouchableOpacity key={index} style={styles.upcomingGameCard}>
      <View style={styles.upcomingGameHeader}>
        <ThemedText style={styles.upcomingGameLeague}>{game.league}</ThemedText>
        <ThemedText style={styles.upcomingGameTime}>{game.time}</ThemedText>
      </View>
      
      <View style={styles.teamsContainer}>
        <View style={styles.teamContainer}>
          <Image source={{ uri: game.team1.logo }} style={styles.teamLogo} />
          <ThemedText style={styles.teamName}>{game.team1.name}</ThemedText>
        </View>
        
        <View style={styles.vsContainer}>
          <ThemedText style={styles.vsText}>VS</ThemedText>
        </View>
        
        <View style={styles.teamContainer}>
          <Image source={{ uri: game.team2.logo }} style={styles.teamLogo} />
          <ThemedText style={styles.teamName}>{game.team2.name}</ThemedText>
        </View>
      </View>
    </TouchableOpacity>
  );
  
  // Render news item
  const renderNewsItem = (news: any, index: number) => (
    <TouchableOpacity key={index} style={styles.newsItem}>
      <Image source={{ uri: news.image }} style={styles.newsImage} />
      <View style={styles.newsContent}>
        <ThemedText style={styles.newsTitle}>{news.title}</ThemedText>
        <View style={styles.newsMetaContainer}>
          <ThemedText style={styles.newsSource}>{news.source}</ThemedText>
          <ThemedText style={styles.newsTime}>{news.time}</ThemedText>
        </View>
      </View>
    </TouchableOpacity>
  );
  
  // Mock data for demonstration
  const mockRecommendedBets = [
    {
      sport: 'NBA',
      league: 'Basketball',
      confidence: 87,
      team1: {
        name: 'Lakers',
        logo: 'https://cdn.nba.com/logos/nba/1610612747/primary/L/logo.svg',
      },
      team2: {
        name: 'Warriors',
        logo: 'https://cdn.nba.com/logos/nba/1610612744/primary/L/logo.svg',
      },
      recommendation: 'Lakers -4.5',
      odds: '-110',
    },
  ];
  
  const mockUpcomingGames = [
    {
      league: 'NFL',
      time: 'Today, 8:30 PM',
      team1: {
        name: 'Chiefs',
        logo: 'https://static.www.nfl.com/image/private/f_auto/league/puhrqgj71gobgmwxqkdz',
      },
      team2: {
        name: 'Ravens',
        logo: 'https://static.www.nfl.com/image/private/f_auto/league/ucsdijmddsqcj1i9tddd',
      },
    },
    {
      league: 'MLB',
      time: 'Tomorrow, 7:00 PM',
      team1: {
        name: 'Yankees',
        logo: 'https://www.mlbstatic.com/team-logos/team-cap-on-light/147.svg',
      },
      team2: {
        name: 'Red Sox',
        logo: 'https://www.mlbstatic.com/team-logos/team-cap-on-light/111.svg',
      },
    },
  ];
  
  const mockNews = [
    {
      title: 'Lakers sign new star player to 3-year contract',
      image: 'https://cdn.nba.com/manage/2020/10/GettyImages-1229130751-784x523.jpg',
      source: 'ESPN',
      time: '2 hours ago',
    },
    {
      title: 'NFL announces new playoff format for upcoming season',
      image: 'https://static.www.nfl.com/image/private/t_editorial_landscape_12_desktop/league/vmvmxjxe6xdtjwxeosa2',
      source: 'NFL.com',
      time: '5 hours ago',
    },
  ];
  
  if (isLoading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <LoadingIndicator />
      </ThemedView>
    );
  }
  
  return (
    <ThemedView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.neon.blue}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <ThemedText style={styles.greeting}>{greeting}</ThemedText>
            <ThemedText style={styles.welcomeText}>
              Here's your personalized dashboard
            </ThemedText>
          </View>
          
          <TouchableOpacity 
            style={styles.settingsButton}
            onPress={() => navigation.navigate('Personalization' as never)}
          >
            <Ionicons name="settings-outline" size={24} color={colors.neon.blue} />
          </TouchableOpacity>
        </View>
        
        {/* Recommended Bets */}
        {renderSectionHeader('RECOMMENDED BETS')}
        {mockRecommendedBets.map((bet, index) => renderRecommendedBetCard(bet, index))}
        
        {/* Upcoming Games */}
        {renderSectionHeader('UPCOMING GAMES')}
        {mockUpcomingGames.map((game, index) => renderUpcomingGameCard(game, index))}
        
        {/* News */}
        {renderSectionHeader('LATEST NEWS')}
        {mockNews.map((news, index) => renderNewsItem(news, index))}
      </ScrollView>
      {/* Bet Now Popup */}
      <BetNowPopup
        show={showBetPopup}
        onClose={() => setShowBetPopup(false)}
        message="Ready to place your bets? Use our exclusive FanDuel affiliate link for a special bonus!"
        teamId={mockRecommendedBets[0]?.team1 ? `nba-${mockRecommendedBets[0].team1.name.toLowerCase()}` : undefined}
      />
    </ThemedView>
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
    color: colors.text.secondary,
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.background.secondary,
  },
  sectionHeaderText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.neon.blue,
    letterSpacing: 1,
  },
  seeAllText: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  recommendedBetCard: {
    margin: 16,
    marginTop: 16,
    marginBottom: 8,
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: colors.neon.blue,
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
    backgroundColor: 'rgba(0, 229, 255, 0.1)',
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
    color: colors.text.secondary,
  },
  confidenceContainer: {
    marginLeft: 'auto',
    alignItems: 'flex-end',
  },
  confidenceText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.neon.blue,
  },
  confidenceLabel: {
    fontSize: 12,
    color: colors.text.secondary,
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
    color: colors.text.secondary,
  },
  betInfoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border.default,
  },
  betTypeContainer: {
    flex: 1,
  },
  betTypeLabel: {
    fontSize: 12,
    color: colors.text.secondary,
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
    color: colors.text.secondary,
    marginBottom: 4,
  },
  oddsValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  placeBetButton: {
    backgroundColor: colors.neon.blue,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeBetButtonText: {
    color: colors.background.primary,
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
    backgroundColor: colors.background.secondary,
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
    color: colors.text.secondary,
  },
  newsItem: {
    flexDirection: 'row',
    margin: 16,
    marginTop: 8,
    marginBottom: 8,
    backgroundColor: colors.background.secondary,
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
    justifyContent: 'space-between',
  },
  newsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  newsMetaContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  newsSource: {
    fontSize: 12,
    color: colors.neon.blue,
  },
  newsTime: {
    fontSize: 12,
    color: colors.text.secondary,
  },
});

export default PersonalizedHomeScreen;