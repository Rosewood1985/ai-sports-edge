import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, FlatList } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useTheme } from '../contexts/ThemeContext';
import { sportsDataService } from '../services/sportsDataService';
import { userPreferencesService } from '../services/userPreferencesService';
import { League, LeagueFilter } from '../types/sports';
import { Header } from '../atomic/organisms';
import LeagueItem from '../components/LeagueItem';
import { LeagueFilters } from '../atomic/molecules';
import { EmptyState } from '../atomic/atoms';
import { Ionicons } from '@expo/vector-icons';
import { trackScreenView } from '../services/analyticsService';

type LeagueSelectionScreenProps = {
  navigation: StackNavigationProp<any, 'LeagueSelection'>;
};

/**
 * LeagueSelectionScreen component allows users to browse and select leagues
 * @param {LeagueSelectionScreenProps} props - Component props
 * @returns {JSX.Element} - Rendered component
 */
const LeagueSelectionScreen: React.FC<LeagueSelectionScreenProps> = ({ navigation }) => {
  const [leagues, setLeagues] = useState<League[]>([]);
  const [filteredLeagues, setFilteredLeagues] = useState<League[]>([]);
  const [selectedLeagueIds, setSelectedLeagueIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<LeagueFilter>({});
  const { colors } = useTheme();

  // Track screen view
  useEffect(() => {
    trackScreenView('LeagueSelectionScreen');
  }, []);

  // Load leagues and user selections
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Load user's selected leagues
        const userSelectedLeagueIds = await userPreferencesService.getSelectedLeagueIds();
        setSelectedLeagueIds(userSelectedLeagueIds);
        
        // Load all leagues
        const allLeagues = await sportsDataService.fetchAllLeagues();
        setLeagues(allLeagues);
        setFilteredLeagues(allLeagues);
      } catch (err) {
        setError('Failed to load leagues. Please try again.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Apply filters
  useEffect(() => {
    const applyFilters = async () => {
      try {
        setLoading(true);
        
        // If no filters are set, show all leagues
        if (!filters.country && !filters.sport && filters.isCollege === undefined) {
          setFilteredLeagues(leagues);
          return;
        }
        
        const filtered = await sportsDataService.fetchLeaguesByFilter(filters);
        setFilteredLeagues(filtered);
      } catch (err) {
        setError('Failed to apply filters. Please try again.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    applyFilters();
  }, [filters, leagues]);

  // Handle filter changes
  const handleFilterChange = (newFilters: LeagueFilter) => {
    setFilters({ ...filters, ...newFilters });
  };

  // Handle league selection
  const handleLeagueSelect = async (league: League) => {
    try {
      const isSelected = await userPreferencesService.toggleLeagueSelection(league);
      
      // Update local state
      if (isSelected) {
        setSelectedLeagueIds([...selectedLeagueIds, league.idLeague]);
      } else {
        setSelectedLeagueIds(selectedLeagueIds.filter(id => id !== league.idLeague));
      }
    } catch (err) {
      console.error('Error toggling league selection:', err);
    }
  };

  // Handle refresh
  const handleRefresh = async () => {
    try {
      setLoading(true);
      
      // Clear cache and reload leagues
      sportsDataService.clearCache();
      const allLeagues = await sportsDataService.fetchAllLeagues();
      setLeagues(allLeagues);
      
      // Reload user selections
      const userSelectedLeagueIds = await userPreferencesService.getSelectedLeagueIds();
      setSelectedLeagueIds(userSelectedLeagueIds);
      
      // Apply current filters
      if (filters.country || filters.sport || filters.isCollege !== undefined) {
        const filtered = await sportsDataService.fetchLeaguesByFilter(filters);
        setFilteredLeagues(filtered);
      } else {
        setFilteredLeagues(allLeagues);
      }
    } catch (err) {
      setError('Failed to refresh leagues. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Render loading state
  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Header
          title="Select Leagues"
          onRefresh={() => {}}
          isLoading={loading}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text }]}>
            Loading leagues...
          </Text>
        </View>
      </View>
    );
  }

  // Render error state
  if (error) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Header
          title="Select Leagues"
          onRefresh={handleRefresh}
          isLoading={false}
        />
        <EmptyState
          message={error}
          icon={<Ionicons name="alert-circle-outline" size={40} color={colors.primary} />}
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header
        title="Select Leagues"
        onRefresh={handleRefresh}
        isLoading={false}
      />
      
      <LeagueFilters
        filters={filters}
        onFilterChange={handleFilterChange}
      />
      
      {filteredLeagues.length === 0 ? (
        <EmptyState
          message="No leagues found matching your filters. Try adjusting your filters."
          icon={<Ionicons name="search-outline" size={40} color={colors.primary} />}
        />
      ) : (
        <FlatList
          data={filteredLeagues}
          keyExtractor={(item) => item.idLeague}
          renderItem={({ item }) => (
            <LeagueItem
              league={item}
              onSelect={() => handleLeagueSelect(item)}
              isSelected={selectedLeagueIds.includes(item.idLeague)}
            />
          )}
          style={styles.list}
        />
      )}
    </View>
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
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    textAlign: 'center',
  },
  list: {
    flex: 1,
  },
});

export default LeagueSelectionScreen;