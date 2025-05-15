import { firebaseService } from '../src/atomic/organisms/firebaseService';
import 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Modal,
  Alert,
  ActivityIndicator
} from 'react-native';
import { ThemedText } from '../components/ThemedText';
import { useThemeColor } from '../hooks/useThemeColor';
import { useColorScheme } from '../hooks/useColorScheme';
import { StackScreenProps } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { auth } from '../config/firebase';
import PlayerComparisonView from '../components/PlayerComparisonView';
import * as subscriptionService from '../services/subscriptionService';
import advancedPlayerStatsService from '../services/advancedPlayerStatsService';
import {
  AdvancedPlayerMetrics,
  getGameAdvancedMetrics,
  getAdvancedPlayerMetrics,
  comparePlayerMetrics
} from '../services/playerStatsService';
import AdvancedPlayerMetricsCard from '../components/AdvancedPlayerMetricsCard';
import EnhancedPlayerComparison from '../components/EnhancedPlayerComparison';
import EmptyState from '../components/EmptyState';
import ErrorMessage from '../components/ErrorMessage';
import UpgradePrompt from '../components/UpgradePrompt';
import ViewLimitIndicator from '../components/ViewLimitIndicator';

// Import the RootStackParamList from the navigator file
type RootStackParamList = {
  AdvancedPlayerStats: { gameId: string; gameTitle?: string };
  Subscription: undefined;
  Payment: { planId: string; updatePaymentMethod?: boolean };
  // Add other routes as needed
  [key: string]: object | undefined;
};

type AdvancedPlayerStatsScreenProps = StackScreenProps<RootStackParamList, 'AdvancedPlayerStats'>;

/**
 * Screen to display advanced player statistics for a game
 */
const AdvancedPlayerStatsScreen: React.FC<AdvancedPlayerStatsScreenProps> = ({
  route,
  navigation
}) => {
  const { gameId, gameTitle = 'Advanced Stats' } = route.params;
  const [players, setPlayers] = useState<AdvancedPlayerMetrics[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<AdvancedPlayerMetrics | null>(null);
  const [expandedPlayerId, setExpandedPlayerId] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [upgradeModalVisible, setUpgradeModalVisible] = useState(false);
  const [comparisonModalVisible, setComparisonModalVisible] = useState(false);
  const [comparisonMode, setComparisonMode] = useState(false);
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>([]);
  const [comparisonData, setComparisonData] = useState<any>(null);
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [hasComparisonAccess, setHasComparisonAccess] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [comparisonLoading, setComparisonLoading] = useState(false);
  const [viewsRemaining, setViewsRemaining] = useState<number | null>(null);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const [showViewWarning, setShowViewWarning] = useState(false);
  const [hasReachedViewLimit, setHasReachedViewLimit] = useState(false);
  
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const colorScheme = useColorScheme() ?? 'light';
  const primaryColor = '#0a7ea4';
  
  // Modal background and card colors
  const modalBackgroundColor = colorScheme === 'light' ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.7)';
  const cardBackgroundColor = colorScheme === 'light' ? '#fff' : '#1c1c1e';
  const cardBorderColor = colorScheme === 'light' ? '#e1e1e1' : '#38383A';
  
  // Check if user has access to advanced player metrics
  useEffect(() => {
    const checkAccess = async () => {
      setLoading(true);
      const user = auth?.currentUser;
      
      if (!user) {
        setHasAccess(false);
        setHasComparisonAccess(false);
        setLoading(false);
        return;
      }

      // Check view limit for free users
      const viewLimitCheck = await advancedPlayerStatsService.checkFreeViewLimit(user.uid);
      setViewsRemaining(viewLimitCheck.viewsRemaining);
      setShowViewWarning(viewLimitCheck.showWarning);
      setHasReachedViewLimit(viewLimitCheck.hasReachedLimit);
      
      // Check if user has access to features
      const metricsAccess = await advancedPlayerStatsService.hasAdvancedPlayerMetricsAccess(user.uid, gameId);
      const comparisonAccess = await advancedPlayerStatsService.hasPlayerComparisonAccess(user.uid, gameId);
      
      setHasAccess(metricsAccess);
      setHasComparisonAccess(comparisonAccess);
      
      if (metricsAccess) {
        // Load player data if user has access
        try {
          const playerData = await getGameAdvancedMetrics(gameId);
          setPlayers(playerData);
        } catch (error) {
          console.error('Error loading advanced player metrics:', error);
          Alert.alert('Error', 'Failed to load advanced player statistics');
        }
      } else if (!viewLimitCheck.hasReachedLimit) {
        // If user doesn't have premium access but hasn't reached view limit,
        // increment the view count and load the data
        try {
          // Increment view count
          const newViewCount = await advancedPlayerStatsService.incrementFreeViewCount(user.uid);
          
          // Update remaining views
          const remainingViews = Math.max(0, advancedPlayerStatsService.FREE_TIER_VIEW_LIMIT - newViewCount);
          setViewsRemaining(remainingViews);
          
          // Show warning if approaching limit
          if (remainingViews <= advancedPlayerStatsService.FREE_TIER_WARNING_THRESHOLD && remainingViews > 0) {
            setShowViewWarning(true);
          } else if (remainingViews <= 0) {
            setHasReachedViewLimit(true);
          }
          
          // Load player data
          const playerData = await getGameAdvancedMetrics(gameId);
          setPlayers(playerData);
          
          // Track feature usage
          await advancedPlayerStatsService.trackFeatureUsage(
            user.uid,
            gameId,
            'advanced_metrics'
          );
        } catch (error) {
          console.error('Error loading advanced player metrics:', error);
          Alert.alert('Error', 'Failed to load advanced player statistics');
        }
      }
      
      setLoading(false);
    };
    
    checkAccess();
  }, [gameId]);
  
  // Show upgrade prompt when view limit is reached or warning is shown
  useEffect(() => {
    if (hasReachedViewLimit) {
      // Show upgrade prompt immediately if view limit is reached
      setShowUpgradePrompt(true);
    } else if (showViewWarning && viewsRemaining !== null) {
      // Show upgrade prompt after a short delay if warning should be shown
      const timer = setTimeout(() => {
        setShowUpgradePrompt(true);
      }, 1500);
      
      return () => clearTimeout(timer);
    }
  }, [hasReachedViewLimit, showViewWarning, viewsRemaining]);
  
  // Handle player selection
  const handlePlayerPress = (player: AdvancedPlayerMetrics) => {
    if (comparisonMode) {
      // In comparison mode, add player to selection
      if (selectedPlayerIds.includes(player.playerId)) {
        // Remove player if already selected
        setSelectedPlayerIds(selectedPlayerIds.filter(id => id !== player.playerId));
      } else if (selectedPlayerIds.length < 2) {
        // Add player if less than 2 players are selected
        setSelectedPlayerIds([...selectedPlayerIds, player.playerId]);
      } else {
        // Replace the first player if 2 players are already selected
        setSelectedPlayerIds([selectedPlayerIds[1], player.playerId]);
      }
    } else {
      // In normal mode, expand player card
      if (expandedPlayerId === player.playerId) {
        setExpandedPlayerId(null);
      } else {
        setExpandedPlayerId(player.playerId);
      }
    }
  };
  
  // Toggle comparison mode
  const toggleComparisonMode = () => {
    setComparisonMode(!comparisonMode);
    setSelectedPlayerIds([]);
    setExpandedPlayerId(null);
  };
  
  // Start player comparison
  const startComparison = async () => {
    if (selectedPlayerIds.length !== 2) {
      Alert.alert('Error', 'Please select two players to compare');
      return;
    }
    
    setComparisonLoading(true);
    
    try {
      const comparison = await comparePlayerMetrics(
        gameId,
        selectedPlayerIds[0],
        selectedPlayerIds[1]
      );
      
      if (comparison) {
        setComparisonData(comparison);
        setComparisonModalVisible(true);
      } else {
        Alert.alert('Error', 'Failed to compare players. Please try again.');
      }
    } catch (error) {
      console.error('Error comparing players:', error);
      Alert.alert('Error', 'An error occurred while comparing players');
    } finally {
      setComparisonLoading(false);
    }
  };
  
  // Close the modal
  const closeModal = () => {
    setModalVisible(false);
  };
  
  // Show upgrade modal
  const showUpgradeModal = () => {
    setUpgradeModalVisible(true);
  };
  
  // Close upgrade modal
  const closeUpgradeModal = () => {
    setUpgradeModalVisible(false);
  };
  
  // Close upgrade prompt
  const closeUpgradePrompt = () => {
    setShowUpgradePrompt(false);
  };
  
  // Navigate to subscription screen
  const navigateToSubscription = () => {
    closeUpgradeModal();
    navigation.navigate('Subscription');
  };
  
  // Purchase advanced metrics access
  const purchaseAdvancedMetrics = async () => {
    const user = auth?.currentUser;
    
    if (!user) {
      Alert.alert('Error', 'You must be logged in to make a purchase.');
      return;
    }
    
    try {
      const success = await advancedPlayerStatsService.purchaseAdvancedPlayerMetrics(user.uid, gameId);
      
      if (success) {
        Alert.alert(
          'Purchase Successful',
          'You now have access to advanced player metrics for this game.',
          [{ text: 'OK', onPress: async () => {
            setHasAccess(true);
            closeUpgradeModal();
            
            // Load player data
            setLoading(true);
            try {
              const playerData = await getGameAdvancedMetrics(gameId);
              setPlayers(playerData);
            } catch (error) {
              console.error('Error loading advanced player metrics:', error);
              Alert.alert('Error', 'Failed to load advanced player statistics');
            } finally {
              setLoading(false);
            }
          }}]
        );
      } else {
        Alert.alert('Error', 'Failed to process your purchase. Please try again.');
      }
    } catch (error) {
      console.error('Error purchasing access:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again later.');
    }
  };
  
  // Purchase player comparison access
  const purchasePlayerComparison = async () => {
    const user = auth?.currentUser;
    
    if (!user) {
      Alert.alert('Error', 'You must be logged in to make a purchase.');
      return;
    }
    
    try {
      const success = await advancedPlayerStatsService.purchasePlayerComparison(user.uid, gameId);
      
      if (success) {
        Alert.alert(
          'Purchase Successful',
          'You now have access to the player comparison tool for this game.',
          [{ text: 'OK', onPress: () => {
            setHasComparisonAccess(true);
            closeUpgradeModal();
          }}]
        );
      } else {
        Alert.alert('Error', 'Failed to process your purchase. Please try again.');
      }
    } catch (error) {
      console.error('Error purchasing access:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again later.');
    }
  };
  
  // Render loading state
  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor }]}>
        <View style={styles.header}>
          <ThemedText style={styles.title}>{gameTitle}</ThemedText>
          <ThemedText style={styles.subtitle}>Advanced Player Metrics</ThemedText>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={primaryColor} />
          <ThemedText style={styles.loadingText}>Loading advanced statistics...</ThemedText>
        </View>
      </SafeAreaView>
    );
  }
  
  // Render locked state for users without access
  if (!hasAccess) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor }]}>
        <View style={styles.header}>
          <ThemedText style={styles.title}>{gameTitle}</ThemedText>
          <ThemedText style={styles.subtitle}>Advanced Player Metrics</ThemedText>
        </View>
        
        {/* Compact View Limit Indicator for locked state */}
        {viewsRemaining !== null && viewsRemaining <= advancedPlayerStatsService.FREE_TIER_WARNING_THRESHOLD && (
          <ViewLimitIndicator
            onUpgradePress={showUpgradeModal}
            compact={true}
          />
        )}
        
        <View style={styles.lockedContainer}>
          <Ionicons 
            name="analytics" 
            size={64} 
            color={colorScheme === 'light' ? '#999' : '#666'} 
            style={styles.lockIcon}
          />
          <ThemedText style={styles.lockedTitle}>Premium Feature</ThemedText>
          <ThemedText style={styles.lockedDescription}>
            Advanced player metrics are available to Premium subscribers or as a one-time purchase.
          </ThemedText>
          
          <TouchableOpacity 
            style={[styles.upgradeButton, { backgroundColor: primaryColor }]}
            onPress={showUpgradeModal}
          >
            <ThemedText style={styles.upgradeButtonText}>Unlock Advanced Metrics</ThemedText>
          </TouchableOpacity>
        </View>
        
        {/* Upgrade Modal */}
        <Modal
          animationType="fade"
          transparent={true}
          visible={upgradeModalVisible}
          onRequestClose={closeUpgradeModal}
        >
          <TouchableOpacity 
            style={[styles.modalOverlay, { backgroundColor: modalBackgroundColor }]}
            activeOpacity={1}
            onPress={closeUpgradeModal}
          >
            <View 
              style={[
                styles.modalContent, 
                { 
                  backgroundColor: cardBackgroundColor,
                  borderColor: cardBorderColor
                }
              ]}
            >
              <ThemedText style={styles.modalTitle}>
                Unlock Advanced Player Metrics
              </ThemedText>
              
              <ThemedText style={styles.modalDescription}>
                Get deep insights into player performance with advanced analytics.
              </ThemedText>
              
              <View style={styles.optionContainer}>
                <ThemedText style={styles.optionTitle}>Option 1: Subscribe</ThemedText>
                <ThemedText style={styles.optionDescription}>
                  Get full access to all premium features including advanced player metrics for all games.
                </ThemedText>
                <View style={styles.planRow}>
                  <ThemedText style={styles.planName}>Premium Monthly</ThemedText>
                  <ThemedText style={styles.planPrice}>$9.99/month</ThemedText>
                </View>
                <View style={styles.planRow}>
                  <ThemedText style={styles.planName}>Premium Annual</ThemedText>
                  <ThemedText style={styles.planPrice}>$99.99/year</ThemedText>
                </View>
                <TouchableOpacity 
                  style={[styles.optionButton, { backgroundColor: primaryColor }]}
                  onPress={navigateToSubscription}
                >
                  <ThemedText style={styles.optionButtonText}>View Plans</ThemedText>
                </TouchableOpacity>
              </View>
              
              <View style={[styles.optionContainer, styles.optionContainerAlt]}>
                <ThemedText style={styles.optionTitle}>Option 2: One-Time Purchase</ThemedText>
                <ThemedText style={styles.optionDescription}>
                  Get access to advanced player metrics for this game only.
                </ThemedText>
                <View style={styles.planRow}>
                  <ThemedText style={styles.planName}>Single Game Access</ThemedText>
                  <ThemedText style={styles.planPrice}>$0.99</ThemedText>
                </View>
                <TouchableOpacity 
                  style={[styles.optionButton, { backgroundColor: '#34C759' }]}
                  onPress={purchaseAdvancedMetrics}
                >
                  <ThemedText style={styles.optionButtonText}>Purchase</ThemedText>
                </TouchableOpacity>
              </View>
              
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={closeUpgradeModal}
              >
                <ThemedText style={styles.closeButtonText}>Close</ThemedText>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>
      </SafeAreaView>
    );
  }
  
  // Render player stats for users with access
  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]}>
      <View style={styles.header}>
        <ThemedText style={styles.title}>{gameTitle}</ThemedText>
        <ThemedText style={styles.subtitle}>Advanced Player Metrics</ThemedText>
      </View>
      
      {/* View Limit Indicator for free users */}
      {!hasReachedViewLimit && viewsRemaining !== null && viewsRemaining <= advancedPlayerStatsService.FREE_TIER_WARNING_THRESHOLD && (
        <ViewLimitIndicator
          onUpgradePress={() => setShowUpgradePrompt(true)}
          compact={false}
        />
      )}
      
      <View style={styles.actionsContainer}>
        {hasComparisonAccess ? (
          <TouchableOpacity 
            style={[
              styles.comparisonButton, 
              { 
                backgroundColor: comparisonMode ? primaryColor : 'transparent',
                borderColor: primaryColor
              }
            ]}
            onPress={toggleComparisonMode}
          >
            <ThemedText 
              style={[
                styles.comparisonButtonText, 
                { color: comparisonMode ? 'white' : primaryColor }
              ]}
            >
              {comparisonMode ? 'Cancel Comparison' : 'Compare Players'}
            </ThemedText>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            style={[styles.comparisonButton, { borderColor: primaryColor }]}
            onPress={() => {
              Alert.alert(
                'Player Comparison Tool',
                'Would you like to unlock the player comparison tool for $0.99?',
                [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Purchase', onPress: purchasePlayerComparison }
                ]
              );
            }}
          >
            <ThemedText style={[styles.comparisonButtonText, { color: primaryColor }]}>
              Unlock Comparison Tool
            </ThemedText>
          </TouchableOpacity>
        )}
        
        {comparisonMode && selectedPlayerIds.length === 2 && (
          <TouchableOpacity 
            style={[styles.compareNowButton, { backgroundColor: '#34C759' }]}
            onPress={startComparison}
            disabled={comparisonLoading}
          >
            {comparisonLoading ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <ThemedText style={styles.compareNowButtonText}>
                Compare Now
              </ThemedText>
            )}
          </TouchableOpacity>
        )}
      </View>
      
      {comparisonMode && (
        <View style={styles.selectionInfo}>
          <ThemedText style={styles.selectionText}>
            {selectedPlayerIds.length === 0 
              ? 'Select two players to compare' 
              : selectedPlayerIds.length === 1 
                ? 'Select one more player' 
                : 'Ready to compare'}
          </ThemedText>
          
          {selectedPlayerIds.length > 0 && (
            <View style={styles.selectedPlayersContainer}>
              {selectedPlayerIds.map((id, index) => {
                const player = players.find(p => p.playerId === id);
                return player ? (
                  <View key={id} style={styles.selectedPlayerChip}>
                    <ThemedText style={styles.selectedPlayerText}>
                      {index + 1}. {player.playerName}
                    </ThemedText>
                    <TouchableOpacity
                      onPress={() => {
                        setSelectedPlayerIds(selectedPlayerIds.filter(pid => pid !== id));
                      }}
                      style={styles.removePlayerButton}
                    >
                      <Ionicons name="close-circle" size={16} color={textColor} />
                    </TouchableOpacity>
                  </View>
                ) : null;
              })}
            </View>
          )}
        </View>
      )}
      
      <ScrollView style={styles.scrollView}>
        {players.length === 0 ? (
          <EmptyState
            message="No advanced player metrics available for this game."
          />
        ) : (
          players.map(player => (
            <AdvancedPlayerMetricsCard
              key={player.playerId}
              playerData={player}
              onPress={() => handlePlayerPress(player)}
              expanded={expandedPlayerId === player.playerId}
            />
          ))
        )}
      </ScrollView>
      
      {/* Player Comparison Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={comparisonModalVisible}
        onRequestClose={() => setComparisonModalVisible(false)}
      >
        <TouchableOpacity 
          style={[styles.modalOverlay, { backgroundColor: modalBackgroundColor }]}
          activeOpacity={1}
          onPress={() => setComparisonModalVisible(false)}
        >
          <View 
            style={[
              styles.comparisonModalContent, 
              { 
                backgroundColor: cardBackgroundColor,
                borderColor: cardBorderColor
              }
            ]}
          >
            <View style={styles.comparisonModalHeader}>
              <ThemedText style={styles.comparisonModalTitle}>
                Player Comparison
              </ThemedText>
              
              <TouchableOpacity 
                onPress={() => setComparisonModalVisible(false)}
                style={styles.closeModalButton}
              >
                <Ionicons name="close" size={24} color={textColor} />
              </TouchableOpacity>
            </View>
            
            {comparisonData && (
              <EnhancedPlayerComparison
                comparisonData={comparisonData}
                loading={comparisonLoading}
              />
            )}
          </View>
        </TouchableOpacity>
      </Modal>
      
      {/* Upgrade Prompt */}
      {showUpgradePrompt && (
        <UpgradePrompt
          onClose={closeUpgradePrompt}
          gameId={gameId}
          featureType="advanced-metrics"
          viewsRemaining={viewsRemaining}
          hasReachedLimit={hasReachedViewLimit}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e1e1',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.7,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e1e1',
  },
  comparisonButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
  },
  comparisonButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  compareNowButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  compareNowButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
  selectionInfo: {
    padding: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  selectionText: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  selectedPlayersContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  selectedPlayerChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(10, 126, 164, 0.2)',
    borderRadius: 16,
    paddingVertical: 4,
    paddingHorizontal: 12,
    marginRight: 8,
    marginBottom: 8,
  },
  selectedPlayerText: {
    fontSize: 14,
    marginRight: 4,
  },
  removePlayerButton: {
    padding: 2,
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  lockedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  lockIcon: {
    marginBottom: 16,
  },
  lockedTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  lockedDescription: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  upgradeButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 8,
  },
  upgradeButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    maxHeight: '80%',
  },
  comparisonModalContent: {
    width: '95%',
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    maxHeight: '90%',
  },
  comparisonModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  comparisonModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeModalButton: {
    padding: 4,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalDescription: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    opacity: 0.8,
  },
  optionContainer: {
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  optionContainerAlt: {
    backgroundColor: 'rgba(52, 199, 89, 0.1)',
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  optionDescription: {
    fontSize: 14,
    marginBottom: 12,
    opacity: 0.8,
  },
  planRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  planName: {
    fontSize: 15,
  },
  planPrice: {
    fontSize: 15,
    fontWeight: '600',
  },
  optionButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 8,
  },
  optionButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  closeButton: {
    marginTop: 20,
    padding: 12,
    backgroundColor: '#0a7ea4',
    borderRadius: 8,
    alignItems: 'center',
  },
  closeButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default AdvancedPlayerStatsScreen;