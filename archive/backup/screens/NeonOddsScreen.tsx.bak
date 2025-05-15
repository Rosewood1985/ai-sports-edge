import { firebaseService } from '../src/atomic/organisms/firebaseService';
import "react";
import {
  View,
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
import LoadingIndicator from "../components/LoadingIndicator";
import ErrorMessage from "../components/ErrorMessage";
import EmptyState from "../components/EmptyState";
import FreemiumFeature from "../components/FreemiumFeature";
import BlurredPrediction from "../components/BlurredPrediction";
import DailyFreePick from "../components/DailyFreePick";
import TrendingBets from "../components/TrendingBets";
import CommunityPolls from "../components/CommunityPolls";
import AILeaderboard from "../components/AILeaderboard";
import NeonGameCard from "../components/NeonGameCard";
import { 
  getTrendingBets, 
  getCommunityPolls, 
  getAILeaderboard,
  getBlurredPredictions
} from "../services/aiPredictionService";
import { 
  NeonText, 
  NeonButton, 
  NeonCard, 
  NeonContainer 
} from "../components/ui";
import { colors, spacing, borderRadius } from "../styles/theme";
import { LinearGradient } from "expo-linear-gradient";

type OddsScreenProps = {
  navigation: StackNavigationProp<any, 'Odds'>;
};

/**
 * NeonOddsScreen component displays live betting odds with freemium features using neon UI design
 * @param {OddsScreenProps} props - Component props
 * @returns {JSX.Element} - Rendered component
 */
export default function NeonOddsScreen({ navigation }: OddsScreenProps): JSX.Element {
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [hasPremium, setHasPremium] = useState<boolean>(false);
  const [trendingBets, setTrendingBets] = useState<any[]>([]);
  const [communityPolls, setCommunityPolls] = useState<any[]>([]);
  const [leaderboardEntries, setLeaderboardEntries] = useState<any[]>([]);
  const [blurredPredictions, setBlurredPredictions] = useState<any[]>([]);
  
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
  
  // Render section header
  const renderSectionHeader = (title: string, icon: string) => (
    <View style={styles.sectionHeader}>
      <Ionicons name={icon as any} size={20} color={colors.neon.blue} />
      <NeonText type="subheading" glow={true} style={styles.sectionTitle}>
        {title}
      </NeonText>
    </View>
  );
  
  return (
    <NeonContainer gradient={true} gradientColors={[colors.background.primary, '#0D0D0D']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.neon.blue]}
            tintColor={colors.neon.blue}
            progressBackgroundColor={colors.background.secondary}
          />
        }
      >
        <View style={styles.headerContainer}>
          <View>
            <NeonText type="heading" glow={true}>Live Betting Odds</NeonText>
            <NeonText type="caption" color={colors.text.secondary}>
              Powered by AI Sports Edge
            </NeonText>
          </View>
          
          {!hasPremium ? (
            <NeonButton
              title="Upgrade"
              onPress={handleUpgrade}
              type="primary"
              size="small"
              icon={<Ionicons name="flash" size={16} color="#fff" />}
              iconPosition="left"
            />
          ) : (
            <TouchableOpacity onPress={refresh} style={styles.refreshButton}>
              <Ionicons 
                name="refresh" 
                size={24} 
                color={colors.neon.blue} 
                style={{ opacity: loading ? 0.5 : 1 }}
              />
            </TouchableOpacity>
          )}
        </View>
        
        {/* Daily Free Pick (for free users) */}
        {!hasPremium && (
          <View style={styles.section}>
            {renderSectionHeader('Daily Free Pick', 'gift-outline')}
            <DailyFreePick
              games={odds}
              onAdRequested={handleAdRequested}
            />
          </View>
        )}
        
        {/* Trending Bets (for all users) */}
        <View style={styles.section}>
          {renderSectionHeader('Trending Bets', 'trending-up')}
          <TrendingBets
            trendingBets={trendingBets}
            showUpgradePrompt={!hasPremium}
          />
        </View>
        
        {/* Community Polls (for all users) */}
        <View style={styles.section}>
          {renderSectionHeader('Community Polls', 'people')}
          <CommunityPolls
            polls={communityPolls}
            onVote={handlePollVote}
            isPremium={hasPremium}
          />
        </View>
        
        {/* AI Leaderboard (for all users, but with premium features) */}
        <View style={styles.section}>
          {renderSectionHeader('AI vs Public Leaderboard', 'podium')}
          <AILeaderboard
            entries={leaderboardEntries}
            isPremium={hasPremium}
          />
        </View>
        
        {/* Blurred Predictions (for free users) */}
        {!hasPremium && blurredPredictions.length > 0 && (
          <View style={styles.section}>
            {renderSectionHeader('AI Predictions Preview', 'analytics')}
            
            {blurredPredictions.map((game, index) => (
              <BlurredPrediction
                key={`blurred-${index}`}
                prediction={game.ai_prediction}
                isBlurred={true}
                teamName={game.home_team}
              />
            ))}
            
            <NeonButton
              title="Unlock All AI Predictions"
              onPress={handleUpgrade}
              type="primary"
              style={styles.fullWidthButton}
            />
          </View>
        )}
        
        {/* Sports Navigation */}
        <View style={styles.section}>
          {renderSectionHeader('Sports Categories', 'grid')}
          
          <View style={styles.sportsGrid}>
            <TouchableOpacity
              style={styles.sportCard}
              onPress={() => navigation.navigate('Formula1')}
            >
              <LinearGradient
                colors={['#121212', '#1a1a1a']}
                style={styles.sportCardGradient}
              >
                <Ionicons name="car-sport" size={28} color="#FF3B30" />
                <NeonText type="subheading" color={colors.text.primary} style={styles.sportCardText}>
                  Formula 1
                </NeonText>
              </LinearGradient>
            </TouchableOpacity>
            
            {/* Placeholder for other sports */}
            <TouchableOpacity style={[styles.sportCard, { opacity: 0.5 }]}>
              <LinearGradient
                colors={['#121212', '#1a1a1a']}
                style={styles.sportCardGradient}
              >
                <Ionicons name="flag" size={28} color={colors.neon.yellow} />
                <NeonText type="subheading" color={colors.text.primary} style={styles.sportCardText}>
                  NASCAR
                </NeonText>
              </LinearGradient>
            </TouchableOpacity>
            
            <TouchableOpacity style={[styles.sportCard, { opacity: 0.5 }]}>
              <LinearGradient
                colors={['#121212', '#1a1a1a']}
                style={styles.sportCardGradient}
              >
                <Ionicons name="football" size={28} color={colors.neon.green} />
                <NeonText type="subheading" color={colors.text.primary} style={styles.sportCardText}>
                  Rugby
                </NeonText>
              </LinearGradient>
            </TouchableOpacity>
            
            <TouchableOpacity style={[styles.sportCard, { opacity: 0.5 }]}>
              <LinearGradient
                colors={['#121212', '#1a1a1a']}
                style={styles.sportCardGradient}
              >
                <Ionicons name="baseball" size={28} color={colors.neon.blue} />
                <NeonText type="subheading" color={colors.text.primary} style={styles.sportCardText}>
                  Cricket
                </NeonText>
              </LinearGradient>
            </TouchableOpacity>
          </View>
          
          {!hasPremium && (
            <View style={styles.premiumSportsNote}>
              <Ionicons name="information-circle" size={16} color={colors.neon.yellow} />
              <NeonText type="caption" color={colors.text.secondary} style={{ marginLeft: 8 }}>
                Premium Annual subscription required for NASCAR, Rugby, and Cricket
              </NeonText>
            </View>
          )}
        </View>
        
        {/* Games List */}
        <View style={styles.section}>
          {renderSectionHeader('Live Games', 'basketball')}
          
          {loading && !refreshing && (
            <LoadingIndicator message="Loading odds..." />
          )}
          
          {error && <ErrorMessage message={error} />}
          
          {!loading && odds.length === 0 && !error && (
            <EmptyState message="No odds data available" />
          )}
          
          {odds.map((game, index) => (
            <NeonGameCard
              key={`game-${index}`}
              game={game}
              onPress={() => console.log("Game pressed:", game.id)}
            />
          ))}
        </View>
        
        {/* Upgrade Banner */}
        {!hasPremium && (
          <NeonCard
            borderColor={colors.neon.cyan}
            glowColor={colors.neon.cyan}
            glowIntensity="medium"
            gradient={true}
            gradientColors={[colors.neon.blue, '#0077B6']}
            style={styles.upgradeBanner}
          >
            <View style={styles.upgradeContent}>
              <Ionicons name="star" size={24} color="#fff" />
              <View style={styles.upgradeTextContainer}>
                <NeonText type="subheading" color="#FFFFFF">
                  Upgrade to Premium
                </NeonText>
                <NeonText type="caption" color="#FFFFFF" style={{ opacity: 0.9 }}>
                  Get unlimited AI predictions, real-time insights, and more
                </NeonText>
              </View>
            </View>
            <NeonButton
              title="Upgrade"
              onPress={handleUpgrade}
              type="secondary"
              size="small"
            />
          </NeonCard>
        )}
      </ScrollView>
    </NeonContainer>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.md,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  refreshButton: {
    padding: spacing.xs,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    marginLeft: spacing.xs,
  },
  fullWidthButton: {
    marginTop: spacing.sm,
  },
  upgradeBanner: {
    marginVertical: spacing.md,
    padding: spacing.md,
  },
  upgradeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  upgradeTextContainer: {
    marginLeft: spacing.sm,
    flex: 1,
  },
  // New styles for sports grid
  sportsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  sportCard: {
    width: '48%',
    marginBottom: spacing.sm,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  sportCardGradient: {
    padding: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    height: 100,
  },
  sportCardText: {
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  premiumSportsNote: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 204, 0, 0.1)',
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    marginTop: spacing.xs,
  },
});