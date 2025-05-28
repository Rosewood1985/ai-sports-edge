import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  RefreshControl
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { Container } from '../atomic/molecules/layout/ResponsiveLayout';
import {  ThemedText  } from '../atomic/atoms/ThemedText';
import { LoadingIndicator, ErrorMessage } from '../atomic/atoms';
import { EmptyState } from '../atomic/atoms';
import BankrollManagementCard from '../components/BankrollManagementCard';
import BettingHistoryChart from '../components/BettingHistoryChart';
import { auth } from '../config/firebase';
import { bankrollManagementService } from '../services/bankrollManagementService';
import {
  BankrollData,
  BankrollRecommendation,
  Race,
  Track,
  TrackCondition,
  RaceType,
  RaceGrade,
  RaceStatus
} from '../types/horseRacing';
import { trackScreenView } from '../services/analyticsService';
import { sentryService } from '../services/sentryService';



// Navigation prop type
type HorseRacingScreenNavigationProp = StackNavigationProp<any, 'HorseRacing'>;

interface HorseRacingScreenProps {
  navigation: HorseRacingScreenNavigationProp;
}

const HorseRacingScreen: React.FC<HorseRacingScreenProps> = ({ navigation }) => {
  const [selectedTab, setSelectedTab] = useState<'races' | 'bankroll'>('races');
  const [tracks, setTracks] = useState<Track[]>([]);
  const [races, setRaces] = useState<Race[]>([]);
  const [selectedTrack, setSelectedTrack] = useState<Track | null>(null);
  const [bankrollData, setBankrollData] = useState<BankrollData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { colors, isDark } = useTheme();
  
  // Track screen view
  useEffect(() => {
    trackScreenView('HorseRacingScreen');
    sentryService.addBreadcrumb('Horse Racing Screen Viewed', 'navigation', 'info');
    sentryService.trackFeatureUsage('horse_racing', 'screen_view', auth.currentUser?.uid);
  }, []);
  
  // Load bankroll data
  const loadBankrollData = useCallback(async () => {
    const user = auth.currentUser;
    if (!user) {
      return;
    }
    
    try {
      // Check if bankroll data exists
      let data = await bankrollManagementService.getBankrollData(user.uid);
      
      // Initialize if not exists
      if (!data) {
        const initialized = await bankrollManagementService.initializeBankrollData(user.uid, 1000);
        if (initialized) {
          data = await bankrollManagementService.getBankrollData(user.uid);
        }
      }
      
      setBankrollData(data);
    } catch (error) {
      console.error('Error loading bankroll data:', error);
      setError('Failed to load bankroll data. Please try again.');
    }
  }, []);
  
  // Load data
  const loadData = useCallback(async () => {
    const transaction = sentryService.startTransaction('horse-racing-load-data', 'user_interaction', 'Load horse racing data');
    const startTime = Date.now();
    
    try {
      setError(null);
      sentryService.trackRacingOperation('load_horse_racing_data', 'horse_racing', {
        userId: auth.currentUser?.uid || 'anonymous',
        selectedTrackId: selectedTrack?.id
      });
      
      // Fetch tracks from Firebase function
      const tracksResponse = await fetch('https://us-central1-ai-sports-edge.cloudfunctions.net/racingTracks');
      const tracksData = await tracksResponse.json();
      
      if (tracksData.success) {
        setTracks(tracksData.tracks);
        
        // Select first track by default if none selected
        if (!selectedTrack && tracksData.tracks.length > 0) {
          setSelectedTrack(tracksData.tracks[0]);
        }
      } else {
        throw new Error('Failed to fetch racing tracks');
      }
      
      // Fetch races from Firebase function
      const racesResponse = await fetch(`https://us-central1-ai-sports-edge.cloudfunctions.net/racingRaces${selectedTrack ? `?trackId=${selectedTrack.id}` : ''}`);
      const racesData = await racesResponse.json();
      
      if (racesData.success) {
        setRaces(racesData.races);
      } else {
        throw new Error('Failed to fetch racing data');
      }
      
      // Load bankroll data
      await loadBankrollData();
      
      const duration = Date.now() - startTime;
      sentryService.trackRacingOperation('horse_racing_data_loaded', 'horse_racing', {
        trackCount: tracks.length,
        raceCount: races.length,
        selectedTrackId: selectedTrack?.id,
        duration
      });
      
      transaction?.finish();
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error('Error loading horse racing data:', error);
      setError('Failed to load horse racing data. Please try again.');
      
      sentryService.captureError(error as Error, {
        feature: 'horse_racing',
        action: 'load_data',
        additionalData: {
          selectedTrackId: selectedTrack?.id,
          duration,
          userId: auth.currentUser?.uid || 'anonymous'
        }
      });
      
      transaction?.setStatus('internal_error');
      transaction?.finish();
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedTrack, loadBankrollData]);
  
  // Initial load
  useEffect(() => {
    loadData();
  }, [loadData]);
  
  // Handle refresh
  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };
  
  // Navigate to race detail screen
  const navigateToRaceDetail = (race: Race) => {
    sentryService.trackFeatureUsage('horse_racing', 'race_selected', auth.currentUser?.uid, {
      raceId: race.id,
      trackId: race.trackId,
      raceNumber: race.raceNumber,
      raceName: race.name,
      purse: race.purse
    });
    
    // In a real app, we would navigate to a race detail screen
    Alert.alert('Race Selected', `You selected ${race.track.name} Race ${race.raceNumber}`);
  };
  
  // Render track item
  const renderTrackItem = ({ item }: { item: Track }) => (
    <TouchableOpacity
      style={[
        styles.trackItem,
        {
          backgroundColor: isDark ? '#2A2A2A' : '#F5F5F5',
          borderColor: selectedTrack?.id === item.id ? colors.primary : 'transparent',
        },
      ]}
      onPress={() => {
        sentryService.trackFeatureUsage('horse_racing', 'track_selected', auth.currentUser?.uid, {
          trackId: item.id,
          trackName: item.name,
          location: item.location
        });
        setSelectedTrack(item);
      }}
    >
      <ThemedText style={styles.trackName}>{item.name}</ThemedText>
      <ThemedText style={styles.trackLocation}>{item.location}</ThemedText>
    </TouchableOpacity>
  );
  
  // Render race item
  const renderRaceItem = ({ item }: { item: Race }) => (
    <TouchableOpacity
      style={[
        styles.raceItem,
        {
          backgroundColor: isDark ? '#222222' : '#FFFFFF',
          borderColor: isDark ? '#333333' : '#EEEEEE',
        },
      ]}
      onPress={() => navigateToRaceDetail(item)}
    >
      <View style={styles.raceHeader}>
        <View>
          <ThemedText style={styles.raceNumber}>Race {item.raceNumber}</ThemedText>
          {item.name && (
            <ThemedText style={styles.raceName}>{item.name}</ThemedText>
          )}
        </View>
        
        {item.isGraded && (
          <View style={[
            styles.gradeBadge,
            { backgroundColor: isDark ? '#D4AF37' : '#FFD700' }
          ]}>
            <ThemedText style={[styles.gradeText, { color: '#000000' }]}>
              {item.raceGrade}
            </ThemedText>
          </View>
        )}
      </View>
      
      <View style={styles.raceDetails}>
        <View style={styles.raceDetailRow}>
          <ThemedText style={styles.raceDetailLabel}>Post Time:</ThemedText>
          <ThemedText style={styles.raceDetailValue}>
            {new Date(`2025-01-01T${item.postTime}`).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </ThemedText>
        </View>
        
        <View style={styles.raceDetailRow}>
          <ThemedText style={styles.raceDetailLabel}>Distance:</ThemedText>
          <ThemedText style={styles.raceDetailValue}>
            {item.distance} furlongs
          </ThemedText>
        </View>
        
        <View style={styles.raceDetailRow}>
          <ThemedText style={styles.raceDetailLabel}>Surface:</ThemedText>
          <ThemedText style={styles.raceDetailValue}>
            {item.surface.charAt(0).toUpperCase() + item.surface.slice(1)}
          </ThemedText>
        </View>
        
        <View style={styles.raceDetailRow}>
          <ThemedText style={styles.raceDetailLabel}>Purse:</ThemedText>
          <ThemedText style={styles.raceDetailValue}>
            ${item.purse.toLocaleString()}
          </ThemedText>
        </View>
      </View>
      
      <View style={styles.raceFooter}>
        <TouchableOpacity
          style={[
            styles.viewEntriesButton,
            { backgroundColor: colors.primary }
          ]}
          onPress={() => navigateToRaceDetail(item)}
        >
          <ThemedText style={styles.viewEntriesButtonText}>
            View Entries
          </ThemedText>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
  
  // Render recommendation item
  const renderRecommendationItem = ({ item }: { item: BankrollRecommendation }) => (
    <BankrollManagementCard
      recommendation={item}
      onImplemented={loadBankrollData}
    />
  );
  
  // Render loading state
  if (loading) {
    return (
      <Container style={{ backgroundColor: colors.background }}>
        <LoadingIndicator message="Loading horse racing data..." />
      </Container>
    );
  }
  
  // Render error state
  if (error) {
    return (
      <Container style={{ backgroundColor: colors.background }}>
        <View style={styles.errorContainer}>
          <ErrorMessage message={error} />
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: colors.primary }]}
            onPress={handleRefresh}
          >
            <ThemedText style={styles.retryButtonText}>Retry</ThemedText>
          </TouchableOpacity>
        </View>
      </Container>
    );
  }
  
  // Filter races by selected track
  const filteredRaces = selectedTrack
    ? races.filter(race => race.trackId === selectedTrack.id)
    : races;
  
  // Get active recommendations
  const activeRecommendations = bankrollData
    ? bankrollData.recommendations.filter(rec => !rec.isImplemented)
    : [];
  
  return (
    <Container style={{ backgroundColor: colors.background }}>
      {/* Tab selector */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[
            styles.tabButton,
            selectedTab === 'races' && [
              styles.activeTabButton,
              { borderBottomColor: colors.primary }
            ]
          ]}
          onPress={() => setSelectedTab('races')}
        >
          <Ionicons
            name="trophy-outline"
            size={20}
            color={selectedTab === 'races' ? colors.primary : colors.text}
          />
          <ThemedText
            style={[
              styles.tabButtonText,
              selectedTab === 'races' && { color: colors.primary, fontWeight: 'bold' }
            ]}
          >
            Races
          </ThemedText>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.tabButton,
            selectedTab === 'bankroll' && [
              styles.activeTabButton,
              { borderBottomColor: colors.primary }
            ]
          ]}
          onPress={() => setSelectedTab('bankroll')}
        >
          <Ionicons
            name="wallet-outline"
            size={20}
            color={selectedTab === 'bankroll' ? colors.primary : colors.text}
          />
          <ThemedText
            style={[
              styles.tabButtonText,
              selectedTab === 'bankroll' && { color: colors.primary, fontWeight: 'bold' }
            ]}
          >
            Bankroll AI
          </ThemedText>
        </TouchableOpacity>
      </View>
      
      {/* Races tab content */}
      {selectedTab === 'races' && (
        <View style={styles.tabContent}>
          {/* Tracks horizontal list */}
          <FlatList
            horizontal
            data={tracks}
            renderItem={renderTrackItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.tracksList}
            showsHorizontalScrollIndicator={false}
          />
          
          {/* Races list */}
          {filteredRaces.length > 0 ? (
            <FlatList
              data={filteredRaces}
              renderItem={renderRaceItem}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.racesList}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={handleRefresh}
                  colors={[colors.primary]}
                  tintColor={colors.primary}
                />
              }
            />
          ) : (
            <View style={styles.emptyStateContainer}>
              <EmptyState
                message={`There are no races scheduled at ${selectedTrack?.name || 'this track'} today.`}
                icon={<Ionicons name="calendar-outline" size={64} color={colors.primary} />}
              />
              <TouchableOpacity
                style={[styles.refreshButton, { backgroundColor: colors.primary }]}
                onPress={handleRefresh}
              >
                <ThemedText style={styles.refreshButtonText}>Refresh</ThemedText>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}
      
      {/* Bankroll tab content */}
      {selectedTab === 'bankroll' && (
        <View style={styles.tabContent}>
          {/* Bankroll summary */}
          {bankrollData ? (
            <View style={styles.bankrollContent}>
              <View style={[
                styles.bankrollSummary,
                { backgroundColor: isDark ? '#222222' : '#FFFFFF' }
              ]}>
                <View style={styles.bankrollHeader}>
                  <ThemedText style={styles.bankrollTitle}>Your Bankroll</ThemedText>
                  <View style={[
                    styles.riskProfileBadge,
                    {
                      backgroundColor: bankrollData.riskProfile === 'aggressive'
                        ? '#e74c3c20'
                        : bankrollData.riskProfile === 'moderate'
                          ? '#f39c1220'
                          : '#2ecc7120'
                    }
                  ]}>
                    <ThemedText style={[
                      styles.riskProfileText,
                      {
                        color: bankrollData.riskProfile === 'aggressive'
                          ? '#e74c3c'
                          : bankrollData.riskProfile === 'moderate'
                            ? '#f39c12'
                            : '#2ecc71'
                      }
                    ]}>
                      {bankrollData.riskProfile.toUpperCase()} RISK
                    </ThemedText>
                  </View>
                </View>
                
                <View style={styles.balanceContainer}>
                  <ThemedText style={styles.balanceLabel}>Current Balance</ThemedText>
                  <ThemedText style={styles.balanceAmount}>
                    ${bankrollData.currentBalance.toFixed(2)}
                  </ThemedText>
                </View>
                
                <View style={styles.bankrollStats}>
                  <View style={styles.bankrollStat}>
                    <ThemedText style={styles.bankrollStatLabel}>Avg. Bet Size</ThemedText>
                    <ThemedText style={styles.bankrollStatValue}>
                      ${bankrollData.bettingPatterns.averageBetSize.toFixed(2)}
                    </ThemedText>
                  </View>
                  
                  <View style={styles.bankrollStat}>
                    <ThemedText style={styles.bankrollStatLabel}>Win Rate</ThemedText>
                    <ThemedText style={styles.bankrollStatValue}>
                      {bankrollData.bettingHistory.length > 0
                        ? (bankrollData.bettingHistory.reduce((sum, day) => 
                            sum + (day.betsPlaced > 0 ? day.betsWon / day.betsPlaced : 0), 0) / 
                            bankrollData.bettingHistory.length * 100).toFixed(1)
                        : '0.0'}%
                    </ThemedText>
                  </View>
                  
                  <View style={styles.bankrollStat}>
                    <ThemedText style={styles.bankrollStatLabel}>ROI</ThemedText>
                    <ThemedText style={[
                      styles.bankrollStatValue,
                      {
                        color: bankrollData.bettingHistory.length > 0 &&
                          bankrollData.bettingHistory[0].roi >= 0
                            ? '#2ecc71'
                            : '#e74c3c'
                      }
                    ]}>
                      {bankrollData.bettingHistory.length > 0
                        ? (bankrollData.bettingHistory[0].roi * 100).toFixed(1)
                        : '0.0'}%
                    </ThemedText>
                  </View>
                </View>
                
                <TouchableOpacity
                  style={[styles.depositButton, { backgroundColor: colors.primary }]}
                  onPress={() => Alert.alert('Deposit', 'Deposit functionality would be implemented here.')}
                >
                  <ThemedText style={styles.depositButtonText}>Deposit Funds</ThemedText>
                </TouchableOpacity>
              </View>
              
              {/* AI Recommendations */}
              <View style={styles.recommendationsContainer}>
                <View style={styles.recommendationsHeader}>
                  <ThemedText style={styles.recommendationsTitle}>
                    AI Recommendations
                  </ThemedText>
                  <ThemedText style={styles.recommendationsSubtitle}>
                    Based on your betting patterns
                  </ThemedText>
                </View>
                
                {activeRecommendations.length > 0 ? (
                  <FlatList
                    data={activeRecommendations}
                    renderItem={renderRecommendationItem}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.recommendationsList}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                      <RefreshControl
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                        colors={[colors.primary]}
                        tintColor={colors.primary}
                      />
                    }
                  />
                ) : (
                  <View style={styles.emptyRecommendationsContainer}>
                    <Ionicons
                      name="checkmark-circle-outline"
                      size={64}
                      color={colors.primary}
                    />
                    <ThemedText style={styles.emptyRecommendationsTitle}>
                      All Caught Up!
                    </ThemedText>
                    <ThemedText style={styles.emptyRecommendationsMessage}>
                      You've implemented all recommendations. New ones will appear as your betting patterns evolve.
                    </ThemedText>
                  </View>
                )}
              </View>
              
              {/* Betting History Chart */}
              <View style={[
                styles.chartContainer,
                { backgroundColor: isDark ? '#222222' : '#FFFFFF' }
              ]}>
                <View style={styles.chartHeader}>
                  <ThemedText style={styles.chartTitle}>
                    Betting Performance
                  </ThemedText>
                  <ThemedText style={styles.chartSubtitle}>
                    Track your betting history and performance
                  </ThemedText>
                </View>
                
                <BettingHistoryChart
                  bankrollData={bankrollData}
                  timeRange="month"
                />
              </View>
            </View>
          ) : (
            <View style={styles.loginPromptContainer}>
              <Ionicons name="lock-closed-outline" size={64} color={colors.primary} />
              <ThemedText style={styles.loginPromptTitle}>
                Sign In Required
              </ThemedText>
              <ThemedText style={styles.loginPromptMessage}>
                Please sign in to access bankroll management features and AI recommendations.
              </ThemedText>
              <TouchableOpacity
                style={[styles.loginButton, { backgroundColor: colors.primary }]}
                onPress={() => navigation.navigate('Login')}
              >
                <ThemedText style={styles.loginButtonText}>Sign In</ThemedText>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}
    </Container>
  );
};

const styles = StyleSheet.create({
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(150, 150, 150, 0.2)',
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  activeTabButton: {
    borderBottomWidth: 2,
  },
  tabButtonText: {
    fontSize: 16,
    marginLeft: 8,
  },
  tabContent: {
    flex: 1,
  },
  tracksList: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  trackItem: {
    padding: 12,
    borderRadius: 8,
    marginRight: 12,
    borderWidth: 2,
    minWidth: 150,
  },
  trackName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  trackLocation: {
    fontSize: 12,
    opacity: 0.7,
  },
  racesList: {
    padding: 16,
  },
  raceItem: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  raceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  raceNumber: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  raceName: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 4,
  },
  gradeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  gradeText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  raceDetails: {
    marginBottom: 16,
  },
  raceDetailRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  raceDetailLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    marginRight: 8,
    width: 80,
  },
  raceDetailValue: {
    fontSize: 14,
  },
  raceFooter: {
    alignItems: 'flex-end',
  },
  viewEntriesButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
  },
  viewEntriesButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  refreshButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
    marginTop: 20,
  },
  refreshButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
    marginTop: 20,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  bankrollContent: {
    flex: 1,
    padding: 16,
  },
  bankrollSummary: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(150, 150, 150, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  bankrollHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  bankrollTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  riskProfileBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  riskProfileText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  balanceContainer: {
    marginBottom: 16,
  },
  balanceLabel: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 4,
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  bankrollStats: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  bankrollStat: {
    flex: 1,
  },
  bankrollStatLabel: {
    fontSize: 12,
    opacity: 0.7,
    marginBottom: 4,
  },
  bankrollStatValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  depositButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  depositButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  recommendationsContainer: {
    flex: 1,
  },
  recommendationsHeader: {
    marginBottom: 16,
  },
  recommendationsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  recommendationsSubtitle: {
    fontSize: 14,
    opacity: 0.7,
  },
  recommendationsList: {
    paddingBottom: 16,
  },
  emptyRecommendationsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyRecommendationsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyRecommendationsMessage: {
    fontSize: 14,
    textAlign: 'center',
    opacity: 0.7,
  },
  loginPromptContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loginPromptTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  loginPromptMessage: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    opacity: 0.7,
  },
  loginButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  loginButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  chartContainer: {
    borderRadius: 12,
    padding: 16,
    marginTop: 24,
    borderWidth: 1,
    borderColor: 'rgba(150, 150, 150, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  chartHeader: {
    marginBottom: 16,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  chartSubtitle: {
    fontSize: 14,
    opacity: 0.7,
  },
});

export default HorseRacingScreen;