import React from 'react';
import { View, Text, FlatList, Image, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { 
  NewsSearchResult, 
  TeamSearchResult, 
  PlayerSearchResult, 
  OddsSearchResult,
  SearchFilters
} from '../../services/searchService';

interface SearchResultsProps {
  isLoading: boolean;
  query: string;
  newsResults: NewsSearchResult[];
  teamsResults: TeamSearchResult[];
  playersResults: PlayerSearchResult[];
  oddsResults: OddsSearchResult[];
  totalResults: number;
  onNewsItemPress: (item: NewsSearchResult) => void;
  onTeamPress: (item: TeamSearchResult) => void;
  onPlayerPress: (item: PlayerSearchResult) => void;
  onOddsPress: (item: OddsSearchResult) => void;
  onFilterChange: (filters: SearchFilters) => void;
  filters: SearchFilters;
  style?: object;
}

/**
 * SearchResults component for displaying search results
 */
const SearchResults: React.FC<SearchResultsProps> = ({
  isLoading,
  query,
  newsResults,
  teamsResults,
  playersResults,
  oddsResults,
  totalResults,
  onNewsItemPress,
  onTeamPress,
  onPlayerPress,
  onOddsPress,
  onFilterChange,
  filters,
  style = {}
}) => {
  // Format date for display
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Render news item
  const renderNewsItem = ({ item }: { item: NewsSearchResult }) => (
    <TouchableOpacity 
      style={styles.newsItem} 
      onPress={() => onNewsItemPress(item)}
    >
      {item.imageUrl && (
        <Image 
          source={{ uri: item.imageUrl }} 
          style={styles.newsImage} 
          resizeMode="cover" 
        />
      )}
      <View style={styles.newsContent}>
        <Text style={styles.newsTitle} numberOfLines={2}>{item.title}</Text>
        <Text style={styles.newsSnippet} numberOfLines={2}>{item.snippet}</Text>
        <View style={styles.newsFooter}>
          <Text style={styles.newsSource}>{item.source}</Text>
          <Text style={styles.newsDate}>{formatDate(item.date)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  // Render team item
  const renderTeamItem = ({ item }: { item: TeamSearchResult }) => (
    <TouchableOpacity 
      style={styles.teamItem} 
      onPress={() => onTeamPress(item)}
    >
      <Image 
        source={{ uri: item.logo }} 
        style={styles.teamLogo} 
        resizeMode="contain" 
      />
      <View style={styles.teamContent}>
        <Text style={styles.teamName}>{item.name}</Text>
        <Text style={styles.teamDetails}>{item.sport} | {item.league}</Text>
        {item.record && <Text style={styles.teamRecord}>{item.record}</Text>}
      </View>
    </TouchableOpacity>
  );

  // Render player item
  const renderPlayerItem = ({ item }: { item: PlayerSearchResult }) => (
    <TouchableOpacity 
      style={styles.playerItem} 
      onPress={() => onPlayerPress(item)}
    >
      {item.imageUrl ? (
        <Image 
          source={{ uri: item.imageUrl }} 
          style={styles.playerImage} 
          resizeMode="cover" 
        />
      ) : (
        <View style={styles.playerImagePlaceholder}>
          <Ionicons name="person" size={24} color="#ccc" />
        </View>
      )}
      <View style={styles.playerContent}>
        <Text style={styles.playerName}>{item.name}</Text>
        <Text style={styles.playerTeam}>{item.team}</Text>
        <Text style={styles.playerDetails}>{item.position} | {item.sport} | {item.league}</Text>
      </View>
    </TouchableOpacity>
  );

  // Render odds item
  const renderOddsItem = ({ item }: { item: OddsSearchResult }) => (
    <TouchableOpacity 
      style={styles.oddsItem} 
      onPress={() => onOddsPress(item)}
    >
      <View style={styles.oddsHeader}>
        <Text style={styles.oddsTeams}>{item.homeTeam} vs {item.awayTeam}</Text>
        <Text style={styles.oddsDate}>{formatDate(item.date)}</Text>
      </View>
      <View style={styles.oddsContent}>
        <View style={styles.oddsDetail}>
          <Text style={styles.oddsLabel}>Moneyline</Text>
          <Text style={styles.oddsValue}>
            {item.odds.homeMoneyline > 0 ? '+' : ''}{item.odds.homeMoneyline} / {item.odds.awayMoneyline > 0 ? '+' : ''}{item.odds.awayMoneyline}
          </Text>
        </View>
        <View style={styles.oddsDetail}>
          <Text style={styles.oddsLabel}>Spread</Text>
          <Text style={styles.oddsValue}>{item.odds.spread > 0 ? '+' : ''}{item.odds.spread}</Text>
        </View>
        <View style={styles.oddsDetail}>
          <Text style={styles.oddsLabel}>O/U</Text>
          <Text style={styles.oddsValue}>{item.odds.overUnder}</Text>
        </View>
      </View>
      <View style={styles.oddsFooter}>
        <Text style={styles.oddsLeague}>{item.sport} | {item.league}</Text>
      </View>
    </TouchableOpacity>
  );

  // Render empty state
  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      {isLoading ? (
        <ActivityIndicator size="large" color="#007bff" />
      ) : (
        <>
          <Ionicons name="search-outline" size={48} color="#ccc" />
          <Text style={styles.emptyStateTitle}>
            {query ? `No results found for "${query}"` : 'Search for sports content'}
          </Text>
          <Text style={styles.emptyStateText}>
            {query ? 'Try different keywords or filters' : 'Enter a search term to find news, teams, players, and odds'}
          </Text>
        </>
      )}
    </View>
  );

  // Render section header
  const renderSectionHeader = (title: string, count: number) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.sectionCount}>{count}</Text>
    </View>
  );

  // Render filter options
  const renderFilterOptions = () => (
    <View style={styles.filtersContainer}>
      <Text style={styles.filtersTitle}>Filters</Text>
      <View style={styles.filterOptions}>
        <TouchableOpacity 
          style={[
            styles.filterOption, 
            filters.contentTypes?.includes('news') && styles.filterOptionActive
          ]}
          onPress={() => {
            const contentTypes = filters.contentTypes || [];
            const newContentTypes = contentTypes.includes('news')
              ? contentTypes.filter(type => type !== 'news')
              : [...contentTypes, 'news'];
            
            onFilterChange({
              ...filters,
              contentTypes: newContentTypes
            });
          }}
        >
          <Text style={[
            styles.filterOptionText,
            filters.contentTypes?.includes('news') && styles.filterOptionTextActive
          ]}>News</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[
            styles.filterOption, 
            filters.contentTypes?.includes('teams') && styles.filterOptionActive
          ]}
          onPress={() => {
            const contentTypes = filters.contentTypes || [];
            const newContentTypes = contentTypes.includes('teams')
              ? contentTypes.filter(type => type !== 'teams')
              : [...contentTypes, 'teams'];
            
            onFilterChange({
              ...filters,
              contentTypes: newContentTypes
            });
          }}
        >
          <Text style={[
            styles.filterOptionText,
            filters.contentTypes?.includes('teams') && styles.filterOptionTextActive
          ]}>Teams</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[
            styles.filterOption, 
            filters.contentTypes?.includes('players') && styles.filterOptionActive
          ]}
          onPress={() => {
            const contentTypes = filters.contentTypes || [];
            const newContentTypes = contentTypes.includes('players')
              ? contentTypes.filter(type => type !== 'players')
              : [...contentTypes, 'players'];
            
            onFilterChange({
              ...filters,
              contentTypes: newContentTypes
            });
          }}
        >
          <Text style={[
            styles.filterOptionText,
            filters.contentTypes?.includes('players') && styles.filterOptionTextActive
          ]}>Players</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[
            styles.filterOption, 
            filters.contentTypes?.includes('odds') && styles.filterOptionActive
          ]}
          onPress={() => {
            const contentTypes = filters.contentTypes || [];
            const newContentTypes = contentTypes.includes('odds')
              ? contentTypes.filter(type => type !== 'odds')
              : [...contentTypes, 'odds'];
            
            onFilterChange({
              ...filters,
              contentTypes: newContentTypes
            });
          }}
        >
          <Text style={[
            styles.filterOptionText,
            filters.contentTypes?.includes('odds') && styles.filterOptionTextActive
          ]}>Odds</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, style]}>
      {query && !isLoading && (
        <Text style={styles.resultsCount}>
          {totalResults} {totalResults === 1 ? 'result' : 'results'} for "{query}"
        </Text>
      )}
      
      {renderFilterOptions()}
      
      {totalResults === 0 ? (
        renderEmptyState()
      ) : (
        <FlatList
          data={[]}
          renderItem={null}
          ListHeaderComponent={() => (
            <>
              {newsResults.length > 0 && (
                <View style={styles.section}>
                  {renderSectionHeader('News', newsResults.length)}
                  <FlatList
                    data={newsResults}
                    renderItem={renderNewsItem}
                    keyExtractor={(item) => item.id}
                    horizontal={false}
                    scrollEnabled={false}
                  />
                </View>
              )}
              
              {teamsResults.length > 0 && (
                <View style={styles.section}>
                  {renderSectionHeader('Teams', teamsResults.length)}
                  <FlatList
                    data={teamsResults}
                    renderItem={renderTeamItem}
                    keyExtractor={(item) => item.id}
                    horizontal={false}
                    scrollEnabled={false}
                  />
                </View>
              )}
              
              {playersResults.length > 0 && (
                <View style={styles.section}>
                  {renderSectionHeader('Players', playersResults.length)}
                  <FlatList
                    data={playersResults}
                    renderItem={renderPlayerItem}
                    keyExtractor={(item) => item.id}
                    horizontal={false}
                    scrollEnabled={false}
                  />
                </View>
              )}
              
              {oddsResults.length > 0 && (
                <View style={styles.section}>
                  {renderSectionHeader('Odds', oddsResults.length)}
                  <FlatList
                    data={oddsResults}
                    renderItem={renderOddsItem}
                    keyExtractor={(item) => item.id}
                    horizontal={false}
                    scrollEnabled={false}
                  />
                </View>
              )}
            </>
          )}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  resultsCount: {
    fontSize: 14,
    color: '#666',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  filtersContainer: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  filtersTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterOption: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  filterOptionActive: {
    backgroundColor: '#e6f0ff',
    borderColor: '#007bff',
  },
  filterOptionText: {
    fontSize: 14,
    color: '#666',
  },
  filterOptionTextActive: {
    color: '#007bff',
    fontWeight: 'bold',
  },
  section: {
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#f8f8f8',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  sectionCount: {
    fontSize: 14,
    color: '#666',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
  },
  newsItem: {
    flexDirection: 'row',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  newsImage: {
    width: 80,
    height: 80,
    borderRadius: 4,
    marginRight: 12,
  },
  newsContent: {
    flex: 1,
  },
  newsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  newsSnippet: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  newsFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  newsSource: {
    fontSize: 12,
    color: '#007bff',
  },
  newsDate: {
    fontSize: 12,
    color: '#999',
  },
  teamItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  teamLogo: {
    width: 60,
    height: 60,
    marginRight: 12,
  },
  teamContent: {
    flex: 1,
  },
  teamName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  teamDetails: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  teamRecord: {
    fontSize: 14,
    color: '#333',
  },
  playerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  playerImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 12,
  },
  playerImagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  playerContent: {
    flex: 1,
  },
  playerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  playerTeam: {
    fontSize: 14,
    color: '#007bff',
    marginBottom: 4,
  },
  playerDetails: {
    fontSize: 14,
    color: '#666',
  },
  oddsItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  oddsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  oddsTeams: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  oddsDate: {
    fontSize: 14,
    color: '#999',
  },
  oddsContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  oddsDetail: {
    alignItems: 'center',
  },
  oddsLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  oddsValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  oddsFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  oddsLeague: {
    fontSize: 12,
    color: '#666',
  },
});

export default SearchResults;