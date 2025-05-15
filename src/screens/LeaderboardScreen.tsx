// ✅ MIGRATED: Firebase Atomic Architecture
import { firebaseService } from '../src/atomic/organisms/firebaseService';
import 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { FontAwesome, MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from '../i18n/mock';
import { useTheme } from '../contexts/ThemeContext';
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  Timestamp,
  QueryDocumentSnapshot,
  DocumentData
} from 'firebase/firestore';
import { firestore } from '../config/firebase';

// Define time periods for filtering
enum TimePeriod {
  WEEK = '7days',
  MONTH = '30days',
  ALL = 'all',
}

// Define sort options
enum SortOption {
  CONFIDENCE = 'confidence',
  DATE = 'date',
}

// Define leaderboard entry interface
interface LeaderboardEntry {
  id: string;
  gameId: string;
  teamA: string;
  teamB: string;
  sport: string;
  league: string;
  confidence: number;
  result: 'win' | 'loss' | 'push' | 'pending';
  date: Timestamp;
  rank?: number;
}

/**
 * LeaderboardScreen component
 * Displays a leaderboard of AI picks ranked by performance
 */
const LeaderboardScreen: React.FC = () => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  
  // State
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [timePeriod, setTimePeriod] = useState<TimePeriod>(TimePeriod.WEEK);
  const [sortOption, setSortOption] = useState<SortOption>(SortOption.CONFIDENCE);
  const [selectedSport, setSelectedSport] = useState<string | null>(null);
  
  // Fetch leaderboard data
  useEffect(() => {
    fetchLeaderboardData();
  }, [timePeriod, sortOption, selectedSport]);
  
  // Fetch leaderboard data from Firestore
  const fetchLeaderboardData = async () => {
    try {
      setLoading(true);
      
      // Calculate date range based on time period
      const endDate = new Date();
      const startDate = new Date();
      
      if (timePeriod === TimePeriod.WEEK) {
        startDate.setDate(startDate.getDate() - 7);
      } else if (timePeriod === TimePeriod.MONTH) {
        startDate.setDate(startDate.getDate() - 30);
      } else {
        // All time - set to a year ago as default
        startDate.setFullYear(startDate.getFullYear() - 1);
      }
      
      // Convert to Firestore timestamps
      const startTimestamp = Timestamp.fromDate(startDate);
      const endTimestamp = Timestamp.fromDate(endDate);
      
      // Build query
      let predictionsQuery = firebaseService.firestore.firebaseService.firestore.query(
        firebaseService.firestore.firebaseService.firestore.collection(firestore, 'predictions'),
        firebaseService.firestore.firebaseService.firestore.where('date', '>=', startTimestamp),
        firebaseService.firestore.firebaseService.firestore.where('date', '<=', endTimestamp),
        firebaseService.firestore.firebaseService.firestore.where('result', 'in', ['win', 'loss']) // Only include completed predictions
      );
      
      // Add sport filter if selected
      if (selectedSport) {
        predictionsQuery = firebaseService.firestore.firebaseService.firestore.query(
          predictionsQuery,
          firebaseService.firestore.firebaseService.firestore.where('sport', '==', selectedSport)
        );
      }
      
      // Add sorting
      if (sortOption === SortOption.CONFIDENCE) {
        predictionsQuery = firebaseService.firestore.firebaseService.firestore.query(
          predictionsQuery,
          firebaseService.firestore.firebaseService.firestore.orderBy('confidence', 'desc')
        );
      } else {
        predictionsQuery = firebaseService.firestore.firebaseService.firestore.query(
          predictionsQuery,
          firebaseService.firestore.firebaseService.firestore.orderBy('date', 'desc')
        );
      }
      
      // Limit to 50 results
      predictionsQuery = firebaseService.firestore.firebaseService.firestore.query(
        predictionsQuery,
        firebaseService.firestore.firebaseService.firestore.limit(50)
      );
      
      // Execute query
      const querySnapshot = await getDocs(predictionsQuery);
      
      // Process results
      const leaderboardEntries: LeaderboardEntry[] = [];
      
      // Convert to array and add rank
      querySnapshot.docs.forEach((doc, index) => {
        const data = doc.data();
        leaderboardEntries.push({
          id: doc.id,
          gameId: data.gameId,
          teamA: data.teamA,
          teamB: data.teamB,
          sport: data.sport,
          league: data.league,
          confidence: data.confidence,
          result: data.result,
          date: data.date,
          rank: index + 1,
        });
      });
      
      setEntries(leaderboardEntries);
    } catch (error) {
      console.error('Error fetching leaderboard data:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Render time period selector
  const renderTimePeriodSelector = () => {
    return (
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[
            styles.filterButton,
            timePeriod === TimePeriod.WEEK && styles.filterButtonActive,
            { borderColor: theme.border }
          ]}
          onPress={() => setTimePeriod(TimePeriod.WEEK)}
        >
          <Text
            style={[
              styles.filterButtonText,
              timePeriod === TimePeriod.WEEK && styles.filterButtonTextActive,
              { color: timePeriod === TimePeriod.WEEK ? theme.primary : theme.textSecondary }
            ]}
          >
            {t('Last 7 Days')}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.filterButton,
            timePeriod === TimePeriod.MONTH && styles.filterButtonActive,
            { borderColor: theme.border }
          ]}
          onPress={() => setTimePeriod(TimePeriod.MONTH)}
        >
          <Text
            style={[
              styles.filterButtonText,
              timePeriod === TimePeriod.MONTH && styles.filterButtonTextActive,
              { color: timePeriod === TimePeriod.MONTH ? theme.primary : theme.textSecondary }
            ]}
          >
            {t('Last 30 Days')}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.filterButton,
            timePeriod === TimePeriod.ALL && styles.filterButtonActive,
            { borderColor: theme.border }
          ]}
          onPress={() => setTimePeriod(TimePeriod.ALL)}
        >
          <Text
            style={[
              styles.filterButtonText,
              timePeriod === TimePeriod.ALL && styles.filterButtonTextActive,
              { color: timePeriod === TimePeriod.ALL ? theme.primary : theme.textSecondary }
            ]}
          >
            {t('All Time')}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };
  
  // Render sort options
  const renderSortOptions = () => {
    return (
      <View style={styles.sortContainer}>
        <Text style={[styles.sortLabel, { color: theme.textSecondary }]}>
          {t('Sort by')}:
        </Text>
        
        <TouchableOpacity
          style={styles.sortButton}
          onPress={() => setSortOption(SortOption.CONFIDENCE)}
        >
          <Text
            style={[
              styles.sortButtonText,
              sortOption === SortOption.CONFIDENCE && styles.sortButtonTextActive,
              { color: sortOption === SortOption.CONFIDENCE ? theme.primary : theme.textSecondary }
            ]}
          >
            {t('Confidence Level')}
          </Text>
          {sortOption === SortOption.CONFIDENCE && (
            <MaterialIcons name="check" size={16} color={theme.primary} />
          )}
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.sortButton}
          onPress={() => setSortOption(SortOption.DATE)}
        >
          <Text
            style={[
              styles.sortButtonText,
              sortOption === SortOption.DATE && styles.sortButtonTextActive,
              { color: sortOption === SortOption.DATE ? theme.primary : theme.textSecondary }
            ]}
          >
            {t('Date')}
          </Text>
          {sortOption === SortOption.DATE && (
            <MaterialIcons name="check" size={16} color={theme.primary} />
          )}
        </TouchableOpacity>
      </View>
    );
  };
  
  // Render leaderboard entry
  const renderLeaderboardEntry = ({ item }: { item: LeaderboardEntry }) => {
    return (
      <View style={[styles.entryContainer, { backgroundColor: theme.cardBackground }]}>
        <View style={styles.rankContainer}>
          <Text style={[styles.rankText, { color: theme.text }]}>{item.rank}</Text>
        </View>
        
        <View style={styles.gameContainer}>
          <Text style={[styles.gameText, { color: theme.text }]}>
            {item.teamA} vs {item.teamB}
          </Text>
          <Text style={[styles.sportText, { color: theme.textSecondary }]}>
            {item.sport} - {item.league}
          </Text>
        </View>
        
        <View style={styles.confidenceContainer}>
          <Text style={[styles.confidenceText, { color: theme.text }]}>
            {Math.round(item.confidence)}%
          </Text>
        </View>
        
        <View style={styles.resultContainer}>
          {item.result === 'win' ? (
            <View style={[styles.resultBadge, { backgroundColor: theme.success }]}>
              <FontAwesome name="check" size={12} color="white" />
              <Text style={styles.resultText}>{t('Win')}</Text>
            </View>
          ) : (
            <View style={[styles.resultBadge, { backgroundColor: theme.error }]}>
              <FontAwesome name="times" size={12} color="white" />
              <Text style={styles.resultText}>{t('Loss')}</Text>
            </View>
          )}
        </View>
      </View>
    );
  };
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>
          {t('Leaderboard')}
        </Text>
      </View>
      
      {renderTimePeriodSelector()}
      {renderSortOptions()}
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : (
        <FlatList
          data={entries}
          renderItem={renderLeaderboardEntry}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                No predictions found for the selected filters.
              </Text>
            </View>
          }
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
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  filterContainer: {
    flexDirection: 'row',
    padding: 16,
    justifyContent: 'space-between',
  },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  filterButtonActive: {
    borderWidth: 2,
  },
  filterButtonText: {
    fontSize: 14,
  },
  filterButtonTextActive: {
    fontWeight: '600',
  },
  sortContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  sortLabel: {
    fontSize: 14,
    marginRight: 8,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  sortButtonText: {
    fontSize: 14,
    marginRight: 4,
  },
  sortButtonTextActive: {
    fontWeight: '600',
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  entryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  rankContainer: {
    width: 30,
    alignItems: 'center',
  },
  rankText: {
    fontSize: 16,
    fontWeight: '600',
  },
  gameContainer: {
    flex: 1,
    marginLeft: 8,
  },
  gameText: {
    fontSize: 14,
    fontWeight: '500',
  },
  sportText: {
    fontSize: 12,
    marginTop: 2,
  },
  confidenceContainer: {
    marginHorizontal: 8,
  },
  confidenceText: {
    fontSize: 14,
    fontWeight: '600',
  },
  resultContainer: {
    marginLeft: 8,
  },
  resultBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  resultText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
});

export default LeaderboardScreen;