import { firebaseService } from '../src/atomic/organisms/firebaseService';
import 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { formula1Service, firebaseSubscription } from '../services';
import { Formula1Race, Formula1Driver, Formula1Team, Formula1Prediction } from '../services/formula1Service';
import { auth } from '../config/firebase';
import { useTheme } from '../contexts/ThemeContext';
import Formula1BlurredPrediction from '../components/Formula1BlurredPrediction';
import PremiumFeature from '../components/PremiumFeature';
import LoadingIndicator from '../components/LoadingIndicator';
import EmptyState from '../components/EmptyState';

/**
 * Formula 1 screen component
 * @returns {JSX.Element} - Rendered component
 */
const Formula1Screen = (): JSX.Element => {
  const [races, setRaces] = useState<Formula1Race[]>([]);
  const [drivers, setDrivers] = useState<Formula1Driver[]>([]);
  const [teams, setTeams] = useState<Formula1Team[]>([]);
  const [selectedRace, setSelectedRace] = useState<Formula1Race | null>(null);
  const [prediction, setPrediction] = useState<Formula1Prediction | null>(null);
  const [hasPremium, setHasPremium] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [predictionLoading, setPredictionLoading] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'races' | 'drivers' | 'teams'>('races');
  
  const navigation = useNavigation();
  const { colors } = useTheme();
  
  // Load data on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Check premium access
        const userId = auth.currentUser?.uid;
        if (userId) {
          const premium = await firebaseSubscription.hasPremiumAccess(userId);
          setHasPremium(premium);
        }
        
        // Load races, drivers, and teams
        const [racesData, driversData, teamsData] = await Promise.all([
          formula1Service.getUpcomingRaces(),
          formula1Service.getDriverStandings(),
          formula1Service.getTeamStandings()
        ]);
        
        setRaces(racesData);
        setDrivers(driversData);
        setTeams(teamsData);
        
        // Set first race as selected
        if (racesData.length > 0) {
          setSelectedRace(racesData[0]);
        }
      } catch (error) {
        console.error('Error loading Formula 1 data:', error);
        Alert.alert('Error', 'Failed to load Formula 1 data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, []);
  
  // Load prediction when selected race changes
  useEffect(() => {
    const loadPrediction = async () => {
      if (!selectedRace) return;
      
      try {
        setPredictionLoading(true);
        const userId = auth.currentUser?.uid || '';
        const predictionData = await formula1Service.getRacePrediction(selectedRace.id, userId);
        setPrediction(predictionData);
      } catch (error) {
        console.error('Error loading Formula 1 prediction:', error);
      } finally {
        setPredictionLoading(false);
      }
    };
    
    loadPrediction();
  }, [selectedRace]);
  
  // Handle race selection
  const handleRaceSelect = (race: Formula1Race) => {
    setSelectedRace(race);
  };
  
  // Handle purchase of prediction
  const handlePurchasePrediction = async () => {
    if (!selectedRace) return;
    
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) {
        navigation.navigate('Login' as never);
        return;
      }
      
      // Get user's payment methods
      const paymentMethods = await firebaseSubscription.getUserPaymentMethods(userId);
      if (paymentMethods.length === 0) {
        Alert.alert(
          'Payment Method Required',
          'Please add a payment method in your account settings.',
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Go to Settings', 
              onPress: () => navigation.navigate('SubscriptionManagement' as never) 
            }
          ]
        );
        return;
      }
      
      // Purchase the prediction
      const success = await firebaseSubscription.purchaseMicrotransaction(
        userId,
        'formula1-race-prediction',
        paymentMethods[0].id
      );
      
      if (success) {
        Alert.alert('Success', 'Prediction purchased successfully!');
        // Reload prediction
        const predictionData = await formula1Service.getRacePrediction(selectedRace.id, userId);
        setPrediction(predictionData);
      } else {
        Alert.alert('Error', 'Failed to purchase prediction. Please try again.');
      }
    } catch (error) {
      console.error('Error purchasing prediction:', error);
      Alert.alert('Error', 'An error occurred while processing your purchase.');
    }
  };
  
  // Handle purchase of driver stats
  const handlePurchaseDriverStats = async () => {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) {
        navigation.navigate('Login' as never);
        return;
      }
      
      // Get user's payment methods
      const paymentMethods = await firebaseSubscription.getUserPaymentMethods(userId);
      if (paymentMethods.length === 0) {
        Alert.alert(
          'Payment Method Required',
          'Please add a payment method in your account settings.',
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Go to Settings', 
              onPress: () => navigation.navigate('SubscriptionManagement' as never) 
            }
          ]
        );
        return;
      }
      
      // Purchase the driver stats
      const success = await firebaseSubscription.purchaseMicrotransaction(
        userId,
        'formula1-driver-stats',
        paymentMethods[0].id
      );
      
      if (success) {
        Alert.alert('Success', 'Driver statistics package purchased successfully!');
        // Reload data
        const driversData = await formula1Service.getDriverStandings();
        setDrivers(driversData);
      } else {
        Alert.alert('Error', 'Failed to purchase driver statistics. Please try again.');
      }
    } catch (error) {
      console.error('Error purchasing driver stats:', error);
      Alert.alert('Error', 'An error occurred while processing your purchase.');
    }
  };
  
  // Render loading state
  if (loading) {
    return <LoadingIndicator message="Loading Formula 1 data..." />;
  }
  
  // Render empty state
  if (races.length === 0) {
    return (
      <EmptyState
        message="There are no upcoming Formula 1 races at the moment. Please check back later."
        icon={<Ionicons name="car-sport" size={48} color="#999" />}
      />
    );
  }
  
  // Render race card
  const renderRaceCard = (race: Formula1Race, isSelected: boolean) => (
    <TouchableOpacity
      key={race.id}
      style={[
        styles.raceCard,
        { backgroundColor: colors.card },
        isSelected && { borderColor: colors.primary, borderWidth: 2 }
      ]}
      onPress={() => handleRaceSelect(race)}
    >
      <Text style={[styles.raceTitle, { color: colors.text }]}>{race.name}</Text>
      <Text style={[styles.raceDetails, { color: colors.text }]}>
        {race.circuit} • {new Date(race.date).toLocaleDateString()}
      </Text>
      <Text style={[styles.raceCountry, { color: colors.text }]}>{race.country}</Text>
    </TouchableOpacity>
  );
  
  // Render driver card
  const renderDriverCard = (driver: Formula1Driver) => (
    <View
      key={driver.id}
      style={[styles.driverCard, { backgroundColor: colors.card }]}
    >
      <View style={styles.driverPosition}>
        <Text style={[styles.positionText, { color: colors.primary }]}>
          {driver.position}
        </Text>
      </View>
      <View style={styles.driverInfo}>
        <Text style={[styles.driverName, { color: colors.text }]}>{driver.name}</Text>
        <Text style={[styles.driverTeam, { color: colors.text }]}>{driver.team}</Text>
      </View>
      <View style={styles.driverStats}>
        <Text style={[styles.pointsText, { color: colors.text }]}>{driver.points}</Text>
        <Text style={[styles.pointsLabel, { color: colors.text }]}>PTS</Text>
      </View>
    </View>
  );
  
  // Render team card
  const renderTeamCard = (team: Formula1Team) => (
    <View
      key={team.id}
      style={[styles.teamCard, { backgroundColor: colors.card }]}
    >
      <View style={styles.teamPosition}>
        <Text style={[styles.positionText, { color: colors.primary }]}>
          {team.position}
        </Text>
      </View>
      <View style={styles.teamInfo}>
        <Text style={[styles.teamName, { color: colors.text }]}>{team.name}</Text>
        <Text style={[styles.teamNationality, { color: colors.text }]}>{team.nationality}</Text>
      </View>
      <View style={styles.teamStats}>
        <Text style={[styles.pointsText, { color: colors.text }]}>{team.points}</Text>
        <Text style={[styles.pointsLabel, { color: colors.text }]}>PTS</Text>
      </View>
    </View>
  );
  
  // Render prediction
  const renderPrediction = () => {
    if (!selectedRace) return null;
    
    if (predictionLoading) {
      return (
        <View style={styles.predictionLoading}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text }]}>
            Loading prediction...
          </Text>
        </View>
      );
    }
    
    if (!prediction) {
      return (
        <Formula1BlurredPrediction
          title={`${selectedRace.name} Prediction`}
          description="Get AI-powered predictions for this race, including podium finishers and fastest lap."
          onUnlock={handlePurchasePrediction}
          price="$3.99"
        />
      );
    }
    
    return (
      <View style={[styles.predictionContainer, { backgroundColor: colors.card }]}>
        <Text style={[styles.predictionTitle, { color: colors.text }]}>
          {selectedRace.name} Prediction
        </Text>
        
        <View style={styles.podiumContainer}>
          <Text style={[styles.podiumTitle, { color: colors.primary }]}>Predicted Podium</Text>
          <View style={styles.podiumPositions}>
            <View style={[styles.podiumPosition, { backgroundColor: colors.background }]}>
              <Text style={[styles.positionNumber, { color: colors.primary }]}>1</Text>
              <Text style={[styles.positionDriver, { color: colors.text }]}>
                {prediction.podiumPrediction.first}
              </Text>
            </View>
            <View style={[styles.podiumPosition, { backgroundColor: colors.background }]}>
              <Text style={[styles.positionNumber, { color: colors.primary }]}>2</Text>
              <Text style={[styles.positionDriver, { color: colors.text }]}>
                {prediction.podiumPrediction.second}
              </Text>
            </View>
            <View style={[styles.podiumPosition, { backgroundColor: colors.background }]}>
              <Text style={[styles.positionNumber, { color: colors.primary }]}>3</Text>
              <Text style={[styles.positionDriver, { color: colors.text }]}>
                {prediction.podiumPrediction.third}
              </Text>
            </View>
          </View>
          <Text style={[styles.confidenceText, { color: colors.text }]}>
            Confidence: {Math.round(prediction.podiumPrediction.confidence * 100)}%
          </Text>
        </View>
        
        <View style={styles.fastestLapContainer}>
          <Text style={[styles.fastestLapTitle, { color: colors.primary }]}>
            Fastest Lap Prediction
          </Text>
          <Text style={[styles.fastestLapDriver, { color: colors.text }]}>
            {prediction.fastestLapPrediction.driver}
          </Text>
          <Text style={[styles.confidenceText, { color: colors.text }]}>
            Confidence: {Math.round(prediction.fastestLapPrediction.confidence * 100)}%
          </Text>
        </View>
        
        <Text style={[styles.generatedAt, { color: colors.text }]}>
          Generated: {new Date(prediction.generatedAt).toLocaleString()}
        </Text>
      </View>
    );
  };
  
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Tab navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'races' && { borderBottomColor: colors.primary, borderBottomWidth: 2 }
          ]}
          onPress={() => setActiveTab('races')}
        >
          <Text
            style={[
              styles.tabText,
              { color: activeTab === 'races' ? colors.primary : colors.text }
            ]}
          >
            Races
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'drivers' && { borderBottomColor: colors.primary, borderBottomWidth: 2 }
          ]}
          onPress={() => setActiveTab('drivers')}
        >
          <Text
            style={[
              styles.tabText,
              { color: activeTab === 'drivers' ? colors.primary : colors.text }
            ]}
          >
            Drivers
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'teams' && { borderBottomColor: colors.primary, borderBottomWidth: 2 }
          ]}
          onPress={() => setActiveTab('teams')}
        >
          <Text
            style={[
              styles.tabText,
              { color: activeTab === 'teams' ? colors.primary : colors.text }
            ]}
          >
            Teams
          </Text>
        </TouchableOpacity>
      </View>
      
      {/* Content based on active tab */}
      <ScrollView style={styles.content}>
        {activeTab === 'races' && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Upcoming Races
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.racesContainer}
            >
              {races.map(race => renderRaceCard(race, selectedRace?.id === race.id))}
            </ScrollView>
            
            {/* Race prediction */}
            {selectedRace && (
              <>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  Race Prediction
                </Text>
                {hasPremium ? (
                  renderPrediction()
                ) : (
                  <PremiumFeature
                    message="Upgrade to Premium Annual to access Formula 1 predictions and data."
                  >
                    <TouchableOpacity
                      style={{
                        paddingHorizontal: 16,
                        paddingVertical: 8,
                        borderRadius: 4,
                        marginTop: 8,
                        backgroundColor: colors.primary
                      }}
                      onPress={() => navigation.navigate('SubscriptionScreen' as never)}
                    >
                      <Text style={{ color: '#fff', fontWeight: '600', fontSize: 14 }}>Upgrade Now</Text>
                    </TouchableOpacity>
                  </PremiumFeature>
                )}
              </>
            )}
          </>
        )}
        
        {activeTab === 'drivers' && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Driver Standings
            </Text>
            {hasPremium ? (
              <View style={styles.driversContainer}>
                {drivers.map(driver => renderDriverCard(driver))}
              </View>
            ) : (
              <PremiumFeature
                message="Upgrade to Premium Annual to access Formula 1 predictions and data."
              >
                <TouchableOpacity
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                    borderRadius: 4,
                    marginTop: 8,
                    backgroundColor: colors.primary
                  }}
                  onPress={() => navigation.navigate('SubscriptionScreen' as never)}
                >
                  <Text style={{ color: '#fff', fontWeight: '600', fontSize: 14 }}>Upgrade Now</Text>
                </TouchableOpacity>
              </PremiumFeature>
            )}
          </>
        )}
        
        {activeTab === 'teams' && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Team Standings
            </Text>
            {hasPremium ? (
              <View style={styles.teamsContainer}>
                {teams.map(team => renderTeamCard(team))}
              </View>
            ) : (
              <PremiumFeature
                message="Upgrade to Premium Annual to access Formula 1 predictions and data."
              >
                <TouchableOpacity
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                    borderRadius: 4,
                    marginTop: 8,
                    backgroundColor: colors.primary
                  }}
                  onPress={() => navigation.navigate('SubscriptionScreen' as never)}
                >
                  <Text style={{ color: '#fff', fontWeight: '600', fontSize: 14 }}>Upgrade Now</Text>
                </TouchableOpacity>
              </PremiumFeature>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    marginTop: 8,
  },
  racesContainer: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  raceCard: {
    width: 250,
    padding: 16,
    marginRight: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  raceTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  raceDetails: {
    fontSize: 14,
    marginBottom: 8,
  },
  raceCountry: {
    fontSize: 14,
    opacity: 0.7,
  },
  driversContainer: {
    marginBottom: 24,
  },
  driverCard: {
    flexDirection: 'row',
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  driverPosition: {
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  positionText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  driverInfo: {
    flex: 1,
    marginLeft: 12,
  },
  driverName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  driverTeam: {
    fontSize: 14,
    opacity: 0.7,
  },
  driverStats: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 12,
  },
  pointsText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  pointsLabel: {
    fontSize: 12,
    opacity: 0.7,
  },
  teamsContainer: {
    marginBottom: 24,
  },
  teamCard: {
    flexDirection: 'row',
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  teamPosition: {
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  teamInfo: {
    flex: 1,
    marginLeft: 12,
  },
  teamName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  teamNationality: {
    fontSize: 14,
    opacity: 0.7,
  },
  teamStats: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 12,
  },
  predictionContainer: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  predictionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  podiumContainer: {
    marginBottom: 16,
  },
  podiumTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  podiumPositions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  podiumPosition: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  positionNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  positionDriver: {
    fontSize: 14,
    textAlign: 'center',
  },
  confidenceText: {
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'right',
    marginTop: 4,
  },
  fastestLapContainer: {
    marginBottom: 16,
  },
  fastestLapTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  fastestLapDriver: {
    fontSize: 16,
    marginBottom: 4,
  },
  generatedAt: {
    fontSize: 12,
    opacity: 0.7,
    textAlign: 'right',
    marginTop: 8,
  },
  predictionLoading: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
});

export default Formula1Screen;