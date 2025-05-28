import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { StackNavigationProp } from "@react-navigation/stack";
import { auth } from "../config/firebase";
import { hasPremiumAccess } from "../services/subscriptionService";
import useOddsData from "../hooks/useOddsData";
import { Header } from "../atomic/organisms";
import { LoadingIndicator, ErrorMessage, EmptyState } from "../atomic/atoms";
import GameCard from "../components/GameCard";
import DailyFreePick from "../components/DailyFreePick";
import TrendingBets from "../components/TrendingBets";
import CommunityPolls from "../components/CommunityPolls";
import AILeaderboard from "../components/AILeaderboard";
import FreemiumFeature from "../components/FreemiumFeature";
import BlurredPrediction from "../components/BlurredPrediction";
import { useTheme } from "../contexts/ThemeContext";
import { 
  getTrendingBets, 
  getCommunityPolls, 
  getAILeaderboard,
  getBlurredPredictions
} from "../services/aiPredictionService";

type OddsScreenProps = {
  navigation: StackNavigationProp<any, 'Odds'>;
};

/**
 * OddsScreen component displays live betting odds with freemium features
 * @param {OddsScreenProps} props - Component props
 * @returns {JSX.Element} - Rendered component
 */
export default function OddsScreen({ navigation }: OddsScreenProps): JSX.Element {
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [hasPremium, setHasPremium] = useState<boolean>(false);
  const [trendingBets, setTrendingBets] = useState<any[]>([]);
  const [communityPolls, setCommunityPolls] = useState<any[]>([]);
  const [leaderboardEntries, setLeaderboardEntries] = useState<any[]>([]);
  const [blurredPredictions, setBlurredPredictions] = useState<any[]>([]);
  const { colors, isDark } = useTheme();
  
  // Use our custom hook to manage odds data, loading state, and errors
  const {
    data: odds,
    loading,
    error,
    refresh,
    dailyInsights,
    refreshLiveData
  } = useOddsData("americanfootball_nfl");
  
  // Check if user has premium access
  useEffect(() => {
    let isMounted = true;
    
    const checkPremiumAccess = async () => {
      try {
        const userId = auth.currentUser?.uid;
        
        if (!userId) {
          if (isMounted) setHasPremium(false);
          return;
        }
        
        const premium = await hasPremiumAccess(userId);
        if (isMounted) setHasPremium(premium);
      } catch (error) {
        console.error('Error checking premium access:', error);
        if (isMounted) setHasPremium(false);
      }
    };
    
    checkPremiumAccess();
    
    // Listen for auth state changes
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user && isMounted) {
        checkPremiumAccess();
      }
    });
    
    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);
  
  // Load freemium content
  useEffect(() => {
    let isMounted = true;
    
    const loadFreemiumContent = async () => {
      try {
        // Get trending bets
        const trends = await getTrendingBets();
        if (isMounted) setTrendingBets(trends);
        
        // Get community polls
        const polls = await getCommunityPolls();
        if (isMounted) setCommunityPolls(polls);
        
        // Get leaderboard entries
        const entries = await getAILeaderboard();
        if (isMounted) setLeaderboardEntries(entries);
        
        // Get blurred predictions if not premium
        if (!hasPremium && odds.length > 0) {
          const blurred = await getBlurredPredictions(odds.slice(0, 3));
          if (isMounted) setBlurredPredictions(blurred);
        }
      } catch (error) {
        console.error('Error loading freemium content:', error);
      }
    };
    
    loadFreemiumContent();
    
    return () => {
      isMounted = false;
    };
  }, [odds, hasPremium]);
  
  // Set up auto-refresh for live data
  useEffect(() => {
    const intervalId = setInterval(() => {
      refreshLiveData();
    }, 60000); // Refresh every minute
    
    return () => clearInterval(intervalId);
  }, []);
  
  // Handle manual refresh
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);
  
  // Handle ad viewing
  const handleAdRequested = async (): Promise<boolean> => {
    // In a real app, this would show an ad
    // For now, we'll just simulate ad viewing
    return new Promise((resolve) => {
      Alert.alert(
        "Watch Ad",
        "In a real app, this would show an ad. Simulating ad view...",
        [
          {
            text: "OK",
            onPress: () => {
              // Simulate ad completion
              setTimeout(() => {
                resolve(true);
              }, 1000);
            }
          }
        ]
      );
    });
  };
  
  // Define poll option type
  interface PollOption {
    id: string;
    text: string;
    votes: number;
  }

  // Handle community poll vote
  const handlePollVote = (pollId: string, optionId: string) => {
    // In a real app, this would send the vote to a server
    // For now, we'll just update the local state
    setCommunityPolls(prev =>
      prev.map(poll => {
        if (poll.id === pollId) {
          const updatedOptions = poll.options.map((option: PollOption) => {
            if (option.id === optionId) {
              return { ...option, votes: option.votes + 1 };
            }
            return option;
          });
          
          return {
            ...poll,
            options: updatedOptions,
            totalVotes: poll.totalVotes + 1
          };
        }
        return poll;
      })
    );
  };
  
  // Navigate to subscription screen
  const handleUpgrade = () => {
    navigation.navigate('Subscription');
  };
  
  return (
    <ScrollView
      style={[styles.container, { backgroundColor: isDark ? '#121212' : '#f8f9fa' }]}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          colors={[colors.primary]}
        />
      }
    >
      <View style={styles.headerContainer}>
        <Header
          title="Live Betting Odds"
          onRefresh={refresh}
          isLoading={loading}
        />
        
        {!hasPremium && (
          <TouchableOpacity
            style={[styles.upgradeButton, { backgroundColor: colors.primary }]}
            onPress={handleUpgrade}
          >
            <Ionicons name="flash" size={16} color="#fff" />
            <Text style={styles.upgradeButtonText}>Upgrade to Premium</Text>
          </TouchableOpacity>
        )}
      </View>
      
      {/* Daily Free Pick (for free users) */}
      {!hasPremium && (
        <DailyFreePick
          games={odds}
          onAdRequested={handleAdRequested}
        />
      )}
      
      {/* Trending Bets (for all users) */}
      <TrendingBets
        trendingBets={trendingBets}
        showUpgradePrompt={!hasPremium}
      />
      
      {/* Community Polls (for all users) */}
      <CommunityPolls
        polls={communityPolls}
        onVote={handlePollVote}
        isPremium={hasPremium}
      />
      
      {/* AI Leaderboard (for all users, but with premium features) */}
      <AILeaderboard
        entries={leaderboardEntries}
        isPremium={hasPremium}
      />
      
      {/* Blurred Predictions (for free users) */}
      {!hasPremium && blurredPredictions.length > 0 && (
        <View style={styles.predictionsContainer}>
          <View style={styles.sectionHeader}>
            <Ionicons name="analytics" size={20} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              AI Predictions Preview
            </Text>
          </View>
          
          {blurredPredictions.map((game, index) => (
            <BlurredPrediction
              key={`blurred-${index}`}
              prediction={game.ai_prediction}
              isBlurred={true}
              teamName={game.home_team}
            />
          ))}
          
          <TouchableOpacity
            style={[styles.fullWidthButton, { backgroundColor: colors.primary }]}
            onPress={handleUpgrade}
          >
            <Text style={styles.fullWidthButtonText}>
              Unlock All AI Predictions
            </Text>
          </TouchableOpacity>
        </View>
      )}
      
      {/* Premium Games (for premium users) */}
      <FreemiumFeature
        type="locked"
        message="Upgrade to see all games with AI predictions"
      >
        {loading && !refreshing && (
          <LoadingIndicator message="Loading odds..." />
        )}
        
        {error && <ErrorMessage message={error} />}
        
        {!loading && odds.length === 0 && !error && (
          <EmptyState message="No odds data available" />
        )}
        
        {odds.map((game, index) => (
          <GameCard
            key={`game-${index}`}
            game={game}
            onPress={() => console.log("Game pressed:", game.id)}
          />
        ))}
      </FreemiumFeature>
      
      {/* Upgrade Banner */}
      {!hasPremium && (
        <View style={[
          styles.upgradeBanner,
          { backgroundColor: colors.primary }
        ]}>
          <View style={styles.upgradeContent}>
            <Ionicons name="star" size={24} color="#fff" />
            <View style={styles.upgradeTextContainer}>
              <Text style={styles.upgradeBannerTitle}>
                Upgrade to Premium
              </Text>
              <Text style={styles.upgradeBannerText}>
                Get unlimited AI predictions, real-time insights, and more
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.upgradeBannerButton}
            onPress={handleUpgrade}
          >
            <Text style={styles.upgradeBannerButtonText}>Upgrade</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  upgradeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 4,
  },
  upgradeButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
    marginLeft: 4,
  },
  predictionsContainer: {
    marginVertical: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  fullWidthButton: {
    paddingVertical: 12,
    borderRadius: 4,
    alignItems: 'center',
    marginTop: 8,
  },
  fullWidthButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  upgradeBanner: {
    borderRadius: 8,
    padding: 16,
    marginVertical: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  upgradeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  upgradeTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  upgradeBannerTitle: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  upgradeBannerText: {
    color: '#fff',
    fontSize: 12,
    opacity: 0.9,
  },
  upgradeBannerButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
  },
  upgradeBannerButtonText: {
    fontWeight: '600',
    fontSize: 14,
  },
});