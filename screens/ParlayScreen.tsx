import { firebaseService } from '../src/atomic/organisms/firebaseService';
import 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Alert
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { getTrendingParlays, ParlayPackage } from '../services/parlayService';
import useOddsData from '../hooks/useOddsData';
import ParlayCard from '../components/ParlayCard';
import Header from '../components/Header';
import EmptyState from '../components/EmptyState';
import { trackScreenView } from '../services/analyticsService';
import { auth } from '../config/firebase';
import { hasPremiumAccess } from '../services/subscriptionService';

type ParlayScreenProps = {
  navigation: StackNavigationProp<any, 'Parlays'>;
};

/**
 * ParlayScreen component displays AI-driven parlay suggestions
 * @param {ParlayScreenProps} props - Component props
 * @returns {JSX.Element} - Rendered component
 */
const ParlayScreen: React.FC<ParlayScreenProps> = ({ navigation }) => {
  const [parlays, setParlays] = useState<ParlayPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [hasPremium, setHasPremium] = useState(false);
  const { colors, isDark } = useTheme();
  
  // Use our custom hook to get odds data
  const { data: odds, loading: oddsLoading, error: oddsError } = useOddsData();
  
  // Track screen view
  useEffect(() => {
    trackScreenView('ParlayScreen');
  }, []);
  
  // Check if user has premium access
  useEffect(() => {
    const checkPremiumAccess = async () => {
      const userId = auth.currentUser?.uid;
      if (userId) {
        const premium = await hasPremiumAccess(userId);
        setHasPremium(premium);
      }
    };
    
    checkPremiumAccess();
  }, []);
  
  // Load parlay suggestions
  const loadParlays = useCallback(async () => {
    if (odds.length === 0) return;
    
    try {
      setLoading(true);
      const trendingParlays = await getTrendingParlays(odds);
      setParlays(trendingParlays);
    } catch (error) {
      console.error('Error loading parlays:', error);
      Alert.alert('Error', 'Failed to load parlay suggestions. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [odds]);
  
  // Load parlays when odds data is available
  useEffect(() => {
    if (!oddsLoading && odds.length > 0) {
      loadParlays();
    }
  }, [oddsLoading, odds, loadParlays]);
  
  // Handle refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadParlays();
    setRefreshing(false);
  };
  
  // Handle parlay purchase completion
  const handlePurchaseComplete = () => {
    // Reload parlays to update purchased status
    loadParlays();
  };
  
  // Render loading state
  if (loading || oddsLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Header
          title="AI Parlay Suggestions"
          onRefresh={() => {}}
          isLoading={loading}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text }]}>
            Generating AI parlay suggestions...
          </Text>
        </View>
      </View>
    );
  }
  
  // Render error state
  if (oddsError) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Header
          title="AI Parlay Suggestions"
          onRefresh={handleRefresh}
          isLoading={false}
        />
        <EmptyState
          message="Error loading odds data. Please try refreshing."
          icon={<Ionicons name="alert-circle" size={40} color={colors.primary} />}
        />
      </View>
    );
  }
  
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header
        title="AI Parlay Suggestions"
        onRefresh={handleRefresh}
        isLoading={refreshing}
      />
      
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
          />
        }
      >
        {/* Premium User Banner */}
        {hasPremium && (
          <View style={[styles.premiumBanner, { backgroundColor: colors.primary }]}>
            <Ionicons name="star" size={18} color="#fff" />
            <Text style={styles.premiumBannerText}>
              Premium members get 30% off all parlay purchases!
            </Text>
          </View>
        )}
        
        {/* Info Banner */}
        <View style={[
          styles.infoBanner,
          { backgroundColor: isDark ? '#1e1e1e' : '#f0f8ff' }
        ]}>
          <Ionicons name="information-circle" size={20} color={colors.primary} />
          <Text style={[styles.infoBannerText, { color: colors.text }]}>
            AI-generated parlay suggestions based on real-time trends and historical data
          </Text>
        </View>
        
        {/* Parlays */}
        {parlays.length === 0 ? (
          <EmptyState
            message="No parlay suggestions available. Check back later for AI-generated parlay suggestions."
            icon={<Ionicons name="analytics" size={40} color={colors.primary} />}
          />
        ) : (
          <>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Trending Parlays
            </Text>
            
            {parlays.map((parlay) => (
              <ParlayCard
                key={parlay.id}
                parlay={parlay}
                onPurchaseComplete={handlePurchaseComplete}
              />
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    textAlign: 'center',
  },
  premiumBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    borderRadius: 8,
  },
  premiumBannerText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  infoBannerText: {
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginHorizontal: 16,
    marginBottom: 8,
  },
});

export default ParlayScreen;