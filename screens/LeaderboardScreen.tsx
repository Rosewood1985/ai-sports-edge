import { Ionicons } from '@expo/vector-icons';
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  getFirestore,
} from 'firebase/firestore';
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from 'react-native';

import { useTheme } from '../src/contexts/ThemeContext';
import { formatDate } from '../utils/dateUtils';

// Define interfaces
interface LeaderboardEntry {
  id: string;
  gameId: string;
  teamA: string;
  teamB: string;
  confidence: number;
  result: 'win' | 'loss' | 'push' | 'pending';
  sport: string;
  createdAt: any; // Timestamp
  predictedWinner?: string;
  actualWinner?: string;
}

interface LeaderboardStats {
  totalPicks: number;
  wins: number;
  losses: number;
  pushes: number;
  pending: number;
  winPercentage: number;
}

// Time period options
type TimePeriod = '7days' | '30days' | 'alltime';

/**
 * LeaderboardScreen Component
 *
 * Displays a ranking of AI picks by performance
 */
const LeaderboardScreen: React.FC = () => {
  const { theme, themePreset } = useTheme();
  const isDark = themePreset === 'dark';
  const db = getFirestore();

  // State
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [stats, setStats] = useState<LeaderboardStats>({
    totalPicks: 0,
    wins: 0,
    losses: 0,
    pushes: 0,
    pending: 0,
    winPercentage: 0,
  });
  const [loading, setLoading] = useState(true);
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('7days');
  const [sportFilter, setSportFilter] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'confidence' | 'date'>('date');

  // Fetch leaderboard data
  useEffect(() => {
    fetchLeaderboardData();
  }, [timePeriod, sportFilter, sortBy]);

  const fetchLeaderboardData = async () => {
    try {
      setLoading(true);

      // Calculate date threshold based on time period
      const now = new Date();
      let startDate = new Date();

      if (timePeriod === '7days') {
        startDate.setDate(now.getDate() - 7);
      } else if (timePeriod === '30days') {
        startDate.setDate(now.getDate() - 30);
      } else {
        // For 'alltime', set a far past date
        startDate = new Date(2020, 0, 1);
      }

      // Build query
      const aiPicksRef = collection(db, 'aiPicksOfDay');
      let q = query(aiPicksRef);

      // Add filters
      if (sportFilter) {
        q = query(q, where('sport', '==', sportFilter));
      }

      // Add sorting
      if (sortBy === 'confidence') {
        q = query(q, orderBy('confidence', 'desc'));
      } else {
        q = query(q, orderBy('createdAt', 'desc'));
      }

      // Execute query
      const querySnapshot = await getDocs(q);

      // Process results
      const leaderboardEntries: LeaderboardEntry[] = [];
      let wins = 0;
      let losses = 0;
      let pushes = 0;
      let pending = 0;

      querySnapshot.forEach(doc => {
        const data = doc.data();

        // Skip entries outside the time period
        if (data.createdAt && data.createdAt.toDate() < startDate) {
          return;
        }

        const entry: LeaderboardEntry = {
          id: doc.id,
          gameId: data.gameId || '',
          teamA: data.teamA || '',
          teamB: data.teamB || '',
          confidence: data.confidence || 0,
          result: data.result || 'pending',
          sport: data.sport || '',
          createdAt: data.createdAt,
          predictedWinner: data.predictedWinner,
          actualWinner: data.actualWinner,
        };

        // Count results
        if (entry.result === 'win') wins++;
        else if (entry.result === 'loss') losses++;
        else if (entry.result === 'push') pushes++;
        else pending++;

        leaderboardEntries.push(entry);
      });

      // Calculate stats
      const totalPicks = wins + losses + pushes + pending;
      const winPercentage = wins + losses > 0 ? Math.round((wins / (wins + losses)) * 100) : 0;

      // Update state
      setEntries(leaderboardEntries);
      setStats({
        totalPicks,
        wins,
        losses,
        pushes,
        pending,
        winPercentage,
      });

      setLoading(false);
    } catch (error) {
      console.error('Error fetching leaderboard data:', error);
      setLoading(false);
    }
  };

  // Render time period tabs
  const renderTimePeriodTabs = () => {
    return (
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[
            styles.tab,
            timePeriod === '7days' && [styles.activeTab, { backgroundColor: theme.primary }],
          ]}
          onPress={() => setTimePeriod('7days')}
        >
          <Text style={[styles.tabText, timePeriod === '7days' && styles.activeTabText]}>
            7 Days
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tab,
            timePeriod === '30days' && [styles.activeTab, { backgroundColor: theme.primary }],
          ]}
          onPress={() => setTimePeriod('30days')}
        >
          <Text style={[styles.tabText, timePeriod === '30days' && styles.activeTabText]}>
            30 Days
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tab,
            timePeriod === 'alltime' && [styles.activeTab, { backgroundColor: theme.primary }],
          ]}
          onPress={() => setTimePeriod('alltime')}
        >
          <Text style={[styles.tabText, timePeriod === 'alltime' && styles.activeTabText]}>
            All Time
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  // Render sport filter
  const renderSportFilter = () => {
    const sports = ['NBA', 'NFL', 'MLB', 'NHL', 'NCAAB', 'NCAAF'];

    return (
      <View style={styles.sportFilterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity
            style={[
              styles.sportFilterItem,
              sportFilter === null && [
                styles.activeSportFilter,
                { backgroundColor: theme.primary },
              ],
            ]}
            onPress={() => setSportFilter(null)}
          >
            <Text
              style={[styles.sportFilterText, sportFilter === null && styles.activeSportFilterText]}
            >
              All
            </Text>
          </TouchableOpacity>

          {sports.map(sport => (
            <TouchableOpacity
              key={sport}
              style={[
                styles.sportFilterItem,
                sportFilter === sport && [
                  styles.activeSportFilter,
                  { backgroundColor: theme.primary },
                ],
              ]}
              onPress={() => setSportFilter(sport)}
            >
              <Text
                style={[
                  styles.sportFilterText,
                  sportFilter === sport && styles.activeSportFilterText,
                ]}
              >
                {sport}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  // Render stats summary
  const renderStatsSummary = () => {
    return (
      <View style={[styles.statsContainer, { backgroundColor: theme.cardBackground }]}>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: theme.text }]}>{stats.winPercentage}%</Text>
          <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Win Rate</Text>
        </View>

        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: theme.success }]}>{stats.wins}</Text>
          <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Wins</Text>
        </View>

        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: theme.error }]}>{stats.losses}</Text>
          <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Losses</Text>
        </View>

        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: theme.text }]}>{stats.totalPicks}</Text>
          <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Total</Text>
        </View>
      </View>
    );
  };

  // Render sort options
  const renderSortOptions = () => {
    return (
      <View style={styles.sortContainer}>
        <Text style={[styles.sortLabel, { color: theme.textSecondary }]}>Sort by:</Text>

        <TouchableOpacity style={styles.sortButton} onPress={() => setSortBy('date')}>
          <Text
            style={[
              styles.sortButtonText,
              { color: sortBy === 'date' ? theme.primary : theme.text },
            ]}
          >
            Date
          </Text>
          {sortBy === 'date' && <Ionicons name="checkmark" size={16} color={theme.primary} />}
        </TouchableOpacity>

        <TouchableOpacity style={styles.sortButton} onPress={() => setSortBy('confidence')}>
          <Text
            style={[
              styles.sortButtonText,
              { color: sortBy === 'confidence' ? theme.primary : theme.text },
            ]}
          >
            Confidence
          </Text>
          {sortBy === 'confidence' && <Ionicons name="checkmark" size={16} color={theme.primary} />}
        </TouchableOpacity>
      </View>
    );
  };

  // Render leaderboard entry
  const renderLeaderboardEntry = ({ item, index }: { item: LeaderboardEntry; index: number }) => {
    // Get result icon
    const getResultIcon = () => {
      if (item.result === 'win') {
        return <Ionicons name="checkmark-circle" size={20} color={theme.success} />;
      } else if (item.result === 'loss') {
        return <Ionicons name="close-circle" size={20} color={theme.error} />;
      } else if (item.result === 'push') {
        return <Ionicons name="remove-circle" size={20} color={theme.warning} />;
      } else {
        return <Ionicons name="time" size={20} color={theme.textSecondary} />;
      }
    };

    return (
      <View style={[styles.entryContainer, { backgroundColor: theme.cardBackground }]}>
        <View style={styles.entryHeader}>
          <View style={styles.entryRank}>
            <Text style={[styles.rankText, { color: theme.text }]}>{index + 1}</Text>
          </View>

          <View style={styles.entrySport}>
            <Text style={[styles.sportText, { color: theme.textSecondary }]}>{item.sport}</Text>
          </View>

          <View style={styles.entryDate}>
            <Text style={[styles.dateText, { color: theme.textSecondary }]}>
              {item.createdAt ? formatDate(item.createdAt.toDate()) : 'N/A'}
            </Text>
          </View>

          <View style={styles.entryResult}>{getResultIcon()}</View>
        </View>

        <View style={styles.entryTeams}>
          <Text style={[styles.teamText, { color: theme.text }]}>
            {item.teamA} vs {item.teamB}
          </Text>
        </View>

        <View style={styles.entryDetails}>
          <View style={styles.confidenceContainer}>
            <Text style={[styles.confidenceLabel, { color: theme.textSecondary }]}>
              Confidence:
            </Text>
            <Text style={[styles.confidenceValue, { color: theme.text }]}>{item.confidence}%</Text>
          </View>

          {item.predictedWinner && (
            <View style={styles.winnerContainer}>
              <Text style={[styles.winnerLabel, { color: theme.textSecondary }]}>Pick:</Text>
              <Text style={[styles.winnerValue, { color: theme.text }]}>
                {item.predictedWinner}
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.title, { color: theme.text }]}>AI Picks Leaderboard</Text>

      {renderTimePeriodTabs()}
      {renderSportFilter()}
      {renderStatsSummary()}
      {renderSortOptions()}

      {loading ? (
        <ActivityIndicator size="large" color={theme.primary} style={styles.loader} />
      ) : (
        <FlatList
          data={entries}
          renderItem={renderLeaderboardEntry}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="analytics-outline" size={48} color={theme.textSecondary} />
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                No AI picks found for the selected filters
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  tabsContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
    marginHorizontal: 4,
  },
  activeTab: {
    backgroundColor: '#0066FF',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  sportFilterContainer: {
    marginBottom: 16,
  },
  sportFilterItem: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
  },
  activeSportFilter: {
    backgroundColor: '#0066FF',
  },
  sportFilterText: {
    fontSize: 12,
    fontWeight: '600',
  },
  activeSportFilterText: {
    color: '#FFFFFF',
  },
  statsContainer: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  sortContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
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
    fontWeight: '600',
    marginRight: 4,
  },
  listContainer: {
    paddingBottom: 16,
  },
  entryContainer: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  entryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  entryRank: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  rankText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  entrySport: {
    flex: 1,
  },
  sportText: {
    fontSize: 12,
  },
  entryDate: {
    marginRight: 8,
  },
  dateText: {
    fontSize: 12,
  },
  entryResult: {
    width: 24,
    alignItems: 'center',
  },
  entryTeams: {
    marginBottom: 8,
  },
  teamText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  entryDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  confidenceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  confidenceLabel: {
    fontSize: 12,
    marginRight: 4,
  },
  confidenceValue: {
    fontSize: 12,
    fontWeight: '600',
  },
  winnerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  winnerLabel: {
    fontSize: 12,
    marginRight: 4,
  },
  winnerValue: {
    fontSize: 12,
    fontWeight: '600',
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
  },
});

export default LeaderboardScreen;
