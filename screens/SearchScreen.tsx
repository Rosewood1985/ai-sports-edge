import React, { useState } from 'react';
import { View, StyleSheet, SafeAreaView, Linking, ScrollView } from 'react-native';

import SearchBar from '../components/search/SearchBar';
import SearchResults from '../components/search/SearchResults';
import { useSearch } from '../hooks/useSearch';
import {
  SearchFilters,
  NewsSearchResult,
  TeamSearchResult,
  PlayerSearchResult,
  OddsSearchResult,
} from '../services/searchService';

/**
 * SearchScreen component for searching content
 */
const SearchScreen: React.FC = () => {
  const [showFilters, setShowFilters] = useState(false);

  const {
    query,
    setQuery,
    filters,
    setFilters,
    newsResults,
    teamsResults,
    playersResults,
    oddsResults,
    totalResults,
    isLoading,
    search,
  } = useSearch({
    initialFilters: {
      contentTypes: ['news', 'teams', 'players', 'odds'],
    },
  });

  // Handle search
  const handleSearch = (searchQuery: string) => {
    setQuery(searchQuery);
    search();
  };

  // Handle filter change
  const handleFilterChange = (newFilters: SearchFilters) => {
    setFilters(newFilters);
    search();
  };

  // Handle news item press
  const handleNewsItemPress = (item: NewsSearchResult) => {
    if (item.url) {
      Linking.openURL(item.url);
    }
  };

  // Handle team press
  const handleTeamPress = (item: TeamSearchResult) => {
    // Navigate to team details screen
    // For now, we'll just log the team
    console.log('Team pressed:', item);
  };

  // Handle player press
  const handlePlayerPress = (item: PlayerSearchResult) => {
    // Navigate to player details screen
    // For now, we'll just log the player
    console.log('Player pressed:', item);
  };

  // Handle odds press
  const handleOddsPress = (item: OddsSearchResult) => {
    // Navigate to game details screen or open betting site
    // For now, we'll just log the odds
    console.log('Odds pressed:', item);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.searchBarContainer}>
        <SearchBar
          onSearch={handleSearch}
          placeholder="Search sports, teams, players..."
          showHistory
          autoFocus={false}
        />
      </View>

      <ScrollView style={styles.content}>
        <SearchResults
          isLoading={isLoading}
          query={query}
          newsResults={newsResults}
          teamsResults={teamsResults}
          playersResults={playersResults}
          oddsResults={oddsResults}
          totalResults={totalResults}
          onNewsItemPress={handleNewsItemPress}
          onTeamPress={handleTeamPress}
          onPlayerPress={handlePlayerPress}
          onOddsPress={handleOddsPress}
          onFilterChange={handleFilterChange}
          filters={filters}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  searchBarContainer: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  content: {
    flex: 1,
  },
});

export default SearchScreen;
