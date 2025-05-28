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
import { ThemedText } from '../atomic/atoms/ThemedText';
import { LoadingIndicator, ErrorMessage } from '../atomic/atoms';
import { EmptyState } from '../atomic/atoms';
import { sentryService } from '../services/sentryService';
import nascarService, {
  NascarRace,
  NascarDriver,
  NascarTeam,
  NascarPrediction
} from '../services/nascarService';
import { auth } from '../config/firebase';

interface NascarScreenProps {
  navigation: StackNavigationProp<any, 'Nascar'>;
}

interface ScreenState {
  races: NascarRace[];
  drivers: NascarDriver[];
  teams: NascarTeam[];
  predictions: { [key: string]: NascarPrediction };
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  selectedTab: 'races' | 'standings' | 'predictions';
}

const NascarScreen: React.FC<NascarScreenProps> = ({ navigation }) => {
  const { theme } = useTheme();
  const [state, setState] = useState<ScreenState>({
    races: [],
    drivers: [],
    teams: [],
    predictions: {},
    loading: true,
    refreshing: false,
    error: null,
    selectedTab: 'races'
  });

  // Track screen view
  useEffect(() => {
    sentryService.addBreadcrumb('NASCAR Screen Viewed', 'navigation', 'info');
    sentryService.trackFeatureUsage('nascar', 'screen_view', auth.currentUser?.uid);
  }, []);

  const loadNascarData = useCallback(async (isRefresh = false) => {
    const transaction = sentryService.startTransaction('nascar-load-data', 'user_interaction', 'Load NASCAR data');
    const startTime = Date.now();

    try {
      if (!isRefresh) {
        setState(prev => ({ ...prev, loading: true, error: null }));
      }

      sentryService.trackRacingOperation('load_nascar_data', 'nascar', { 
        isRefresh, 
        userId: auth.currentUser?.uid || 'anonymous' 
      });

      // Load data in parallel
      const [races, drivers, teams] = await Promise.all([
        nascarService.getUpcomingRaces(),
        nascarService.getDriverStandings(),
        nascarService.getTeamStandings()
      ]);

      // Load predictions for upcoming races
      const predictions: { [key: string]: NascarPrediction } = {};
      const userId = auth.currentUser?.uid || '';
      
      for (const race of races) {
        try {
          const prediction = await nascarService.getRacePrediction(race.id, userId);
          if (prediction) {
            predictions[race.id] = prediction;
          }
        } catch (predictionError) {
          // Log prediction errors but don't fail the whole load
          sentryService.captureError(predictionError as Error, {
            feature: 'nascar',
            action: 'load_prediction',
            additionalData: { raceId: race.id, userId }
          });
        }
      }

      setState(prev => ({
        ...prev,
        races,
        drivers,
        teams,
        predictions,
        loading: false,
        refreshing: false,
        error: null
      }));

      const duration = Date.now() - startTime;
      sentryService.trackRacingOperation('nascar_data_loaded', 'nascar', {
        raceCount: races.length,
        driverCount: drivers.length,
        teamCount: teams.length,
        predictionCount: Object.keys(predictions).length,
        duration
      });

      transaction?.finish();

    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Failed to load NASCAR data';
      
      setState(prev => ({
        ...prev,
        loading: false,
        refreshing: false,
        error: errorMessage
      }));

      sentryService.captureError(error as Error, {
        feature: 'nascar',
        action: 'load_data',
        additionalData: { 
          isRefresh, 
          duration,
          userId: auth.currentUser?.uid || 'anonymous'
        }
      });

      transaction?.setStatus('internal_error');
      transaction?.finish();

      Alert.alert('Error', errorMessage);
    }
  }, []);

  const onRefresh = useCallback(() => {
    setState(prev => ({ ...prev, refreshing: true }));
    loadNascarData(true);
  }, [loadNascarData]);

  const onTabPress = useCallback((tab: 'races' | 'standings' | 'predictions') => {
    sentryService.trackFeatureUsage('nascar', 'tab_switch', auth.currentUser?.uid, { 
      fromTab: state.selectedTab, 
      toTab: tab 
    });
    setState(prev => ({ ...prev, selectedTab: tab }));
  }, [state.selectedTab]);

  const onRacePress = useCallback((race: NascarRace) => {
    sentryService.trackFeatureUsage('nascar', 'race_selected', auth.currentUser?.uid, { 
      raceId: race.id,
      raceName: race.name,
      track: race.track
    });
    
    navigation.navigate('NascarRaceDetail', { race, prediction: state.predictions[race.id] });
  }, [navigation, state.predictions]);

  const onDriverPress = useCallback((driver: NascarDriver) => {
    sentryService.trackFeatureUsage('nascar', 'driver_selected', auth.currentUser?.uid, { 
      driverId: driver.id,
      driverName: driver.name,
      team: driver.team
    });
    
    navigation.navigate('NascarDriverDetail', { driver });
  }, [navigation]);

  const onPredictionPress = useCallback((race: NascarRace, prediction: NascarPrediction) => {
    sentryService.trackFeatureUsage('nascar', 'prediction_viewed', auth.currentUser?.uid, { 
      raceId: race.id,
      predictionConfidence: prediction.winnerPrediction.confidence
    });
    
    navigation.navigate('NascarPredictionDetail', { race, prediction });
  }, [navigation]);

  useEffect(() => {
    loadNascarData();
  }, [loadNascarData]);

  if (state.loading) {
    return (
      <Container style={styles.container}>
        <LoadingIndicator message="Loading NASCAR data..." />
      </Container>
    );
  }

  if (state.error) {
    return (
      <Container style={styles.container}>
        <ErrorMessage 
          message={state.error}
          onRetry={() => loadNascarData()}
        />
      </Container>
    );
  }

  const renderTabButton = (tab: 'races' | 'standings' | 'predictions', title: string, icon: string) => (
    <TouchableOpacity
      style={[styles.tabButton, state.selectedTab === tab && styles.activeTabButton]}
      onPress={() => onTabPress(tab)}
      accessible={true}
      accessibilityLabel={`Switch to ${title} tab`}
      accessibilityRole="button"
    >
      <Ionicons 
        name={icon as any} 
        size={20} 
        color={state.selectedTab === tab ? theme.colors.primary : theme.colors.text} 
      />
      <ThemedText style={[styles.tabButtonText, state.selectedTab === tab && styles.activeTabButtonText]}>
        {title}
      </ThemedText>
    </TouchableOpacity>
  );

  const renderRaceItem = ({ item }: { item: NascarRace }) => (
    <TouchableOpacity
      style={[styles.raceCard, { backgroundColor: theme.colors.card }]}
      onPress={() => onRacePress(item)}
      accessible={true}
      accessibilityLabel={`${item.name} at ${item.track} on ${item.date}`}
      accessibilityRole="button"
    >
      <View style={styles.raceHeader}>
        <ThemedText style={styles.raceName}>{item.name}</ThemedText>
        <ThemedText style={styles.raceDate}>{new Date(item.date).toLocaleDateString()}</ThemedText>
      </View>
      <ThemedText style={styles.raceTrack}>{item.track}</ThemedText>
      <ThemedText style={styles.raceLocation}>{item.location}</ThemedText>
      <View style={styles.raceDetails}>
        <ThemedText style={styles.raceDetail}>{item.series} Series</ThemedText>
        <ThemedText style={styles.raceDetail}>{item.distance} miles</ThemedText>
        <ThemedText style={styles.raceDetail}>{item.laps} laps</ThemedText>
      </View>
      {state.predictions[item.id] && (
        <View style={styles.predictionBadge}>
          <ThemedText style={styles.predictionText}>Prediction Available</ThemedText>
        </View>
      )}
    </TouchableOpacity>
  );

  const renderDriverItem = ({ item }: { item: NascarDriver }) => (
    <TouchableOpacity
      style={[styles.driverCard, { backgroundColor: theme.colors.card }]}
      onPress={() => onDriverPress(item)}
      accessible={true}
      accessibilityLabel={`${item.name}, position ${item.position}, ${item.wins} wins`}
      accessibilityRole="button"
    >
      <View style={styles.driverHeader}>
        <ThemedText style={styles.driverPosition}>#{item.position}</ThemedText>
        <View style={styles.driverInfo}>
          <ThemedText style={styles.driverName}>{item.name}</ThemedText>
          <ThemedText style={styles.driverNumber}>#{item.number}</ThemedText>
        </View>
        <ThemedText style={styles.driverPoints}>{item.points} pts</ThemedText>
      </View>
      <ThemedText style={styles.driverTeam}>{item.team}</ThemedText>
      <View style={styles.driverStats}>
        <ThemedText style={styles.driverStat}>Wins: {item.wins}</ThemedText>
        <ThemedText style={styles.driverStat}>Top 5: {item.top5}</ThemedText>
        <ThemedText style={styles.driverStat}>Top 10: {item.top10}</ThemedText>
      </View>
    </TouchableOpacity>
  );

  const renderPredictionItem = ({ item }: { item: NascarRace }) => {
    const prediction = state.predictions[item.id];
    if (!prediction) return null;

    return (
      <TouchableOpacity
        style={[styles.predictionCard, { backgroundColor: theme.colors.card }]}
        onPress={() => onPredictionPress(item, prediction)}
        accessible={true}
        accessibilityLabel={`Prediction for ${item.name}: ${prediction.winnerPrediction.driver} to win`}
        accessibilityRole="button"
      >
        <View style={styles.predictionHeader}>
          <ThemedText style={styles.predictionRaceName}>{item.name}</ThemedText>
          <ThemedText style={styles.predictionConfidence}>
            {Math.round(prediction.winnerPrediction.confidence * 100)}% confidence
          </ThemedText>
        </View>
        <ThemedText style={styles.predictionWinner}>
          Winner: {prediction.winnerPrediction.driver}
        </ThemedText>
        <View style={styles.predictionTop5}>
          <ThemedText style={styles.predictionTop5Title}>Top 5:</ThemedText>
          {prediction.top5Prediction.slice(0, 3).map((driver, index) => (
            <ThemedText key={index} style={styles.predictionTop5Driver}>
              {index + 1}. {driver}
            </ThemedText>
          ))}
        </View>
        <ThemedText style={styles.predictionGenerated}>
          Generated: {new Date(prediction.generatedAt).toLocaleString()}
        </ThemedText>
      </TouchableOpacity>
    );
  };

  const renderTabContent = () => {
    switch (state.selectedTab) {
      case 'races':
        return (
          <FlatList
            data={state.races}
            renderItem={renderRaceItem}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={state.refreshing} onRefresh={onRefresh} />
            }
            ListEmptyComponent={
              <EmptyState
                icon="car-sport"
                title="No Upcoming Races"
                message="Check back later for the NASCAR schedule"
              />
            }
          />
        );
      case 'standings':
        return (
          <FlatList
            data={state.drivers}
            renderItem={renderDriverItem}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={state.refreshing} onRefresh={onRefresh} />
            }
            ListEmptyComponent={
              <EmptyState
                icon="podium"
                title="No Driver Standings"
                message="Driver standings will appear here during the season"
              />
            }
          />
        );
      case 'predictions':
        const racesWithPredictions = state.races.filter(race => state.predictions[race.id]);
        return (
          <FlatList
            data={racesWithPredictions}
            renderItem={renderPredictionItem}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={state.refreshing} onRefresh={onRefresh} />
            }
            ListEmptyComponent={
              <EmptyState
                icon="analytics"
                title="No Predictions Available"
                message="AI predictions will appear here for upcoming races"
              />
            }
          />
        );
      default:
        return null;
    }
  };

  return (
    <Container style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
        <ThemedText style={styles.headerTitle}>NASCAR</ThemedText>
        <TouchableOpacity
          onPress={onRefresh}
          accessible={true}
          accessibilityLabel="Refresh NASCAR data"
          accessibilityRole="button"
        >
          <Ionicons name="refresh" size={24} color={theme.colors.text} />
        </TouchableOpacity>
      </View>

      {/* Tab Navigation */}
      <View style={[styles.tabContainer, { borderBottomColor: theme.colors.border }]}>
        {renderTabButton('races', 'Races', 'calendar')}
        {renderTabButton('standings', 'Standings', 'podium')}
        {renderTabButton('predictions', 'Predictions', 'analytics')}
      </View>

      {/* Tab Content */}
      <View style={styles.content}>
        {renderTabContent()}
      </View>
    </Container>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  activeTabButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  tabButtonText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
  },
  activeTabButtonText: {
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  raceCard: {
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  raceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  raceName: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
  },
  raceDate: {
    fontSize: 14,
    opacity: 0.7,
  },
  raceTrack: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  raceLocation: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 8,
  },
  raceDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  raceDetail: {
    fontSize: 12,
    opacity: 0.6,
  },
  predictionBadge: {
    marginTop: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: 'rgba(0, 122, 255, 0.2)',
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  predictionText: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '500',
  },
  driverCard: {
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  driverHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  driverPosition: {
    fontSize: 24,
    fontWeight: 'bold',
    marginRight: 12,
    minWidth: 40,
  },
  driverInfo: {
    flex: 1,
  },
  driverName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  driverNumber: {
    fontSize: 14,
    opacity: 0.7,
  },
  driverPoints: {
    fontSize: 16,
    fontWeight: '500',
  },
  driverTeam: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 8,
  },
  driverStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  driverStat: {
    fontSize: 12,
    opacity: 0.6,
  },
  predictionCard: {
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  predictionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  predictionRaceName: {
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
  },
  predictionConfidence: {
    fontSize: 14,
    fontWeight: '500',
    color: '#007AFF',
  },
  predictionWinner: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  predictionTop5: {
    marginBottom: 8,
  },
  predictionTop5Title: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  predictionTop5Driver: {
    fontSize: 13,
    opacity: 0.7,
    marginLeft: 8,
  },
  predictionGenerated: {
    fontSize: 12,
    opacity: 0.5,
  },
});

export default NascarScreen;