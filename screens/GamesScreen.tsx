import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@react-navigation/native';
import { useLanguage } from '../contexts/LanguageContext';
import { ThemedText, ThemedView } from '../components/ThemedComponents';

// Mock data for games
const MOCK_GAMES = [
  {
    id: 'game1',
    homeTeam: {
      id: 'team1',
      name: 'Lakers',
      logo: '🏀',
      score: 105
    },
    awayTeam: {
      id: 'team2',
      name: 'Warriors',
      logo: '🏀',
      score: 98
    },
    status: 'completed',
    date: new Date(2025, 2, 20, 19, 30),
    venue: 'Staples Center'
  },
  {
    id: 'game2',
    homeTeam: {
      id: 'team3',
      name: 'Celtics',
      logo: '🏀',
      score: 0
    },
    awayTeam: {
      id: 'team4',
      name: 'Nets',
      logo: '🏀',
      score: 0
    },
    status: 'upcoming',
    date: new Date(2025, 3, 25, 20, 0),
    venue: 'TD Garden'
  },
  {
    id: 'game3',
    homeTeam: {
      id: 'team5',
      name: 'Heat',
      logo: '🏀',
      score: 87
    },
    awayTeam: {
      id: 'team6',
      name: 'Bulls',
      logo: '🏀',
      score: 92
    },
    status: 'live',
    date: new Date(),
    venue: 'American Airlines Arena',
    quarter: 4,
    timeRemaining: '3:45'
  }
];

const GamesScreen = () => {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const { t } = useLanguage();
  const [games, setGames] = useState(MOCK_GAMES);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  // Load games
  const loadGames = async (tab = activeTab) => {
    try {
      setLoading(true);
      
      // In a real app, this would be an API call
      // const response = await gamesService.getGames(tab);
      // setGames(response.data);
      
      // For now, we'll just filter the mock data
      let filteredGames = [...MOCK_GAMES];
      
      if (tab === 'live') {
        filteredGames = MOCK_GAMES.filter(game => game.status === 'live');
      } else if (tab === 'upcoming') {
        filteredGames = MOCK_GAMES.filter(game => game.status === 'upcoming');
      } else if (tab === 'completed') {
        filteredGames = MOCK_GAMES.filter(game => game.status === 'completed');
      }
      
      setGames(filteredGames);
    } catch (error) {
      console.error('Error loading games:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Initial load
  useEffect(() => {
    loadGames();
  }, []);

  // Handle refresh
  const handleRefresh = () => {
    setRefreshing(true);
    loadGames();
  };

  // Handle tab change
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    loadGames(tab);
  };

  // Format date
  const formatDate = (date: Date) => {
    return date.toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Render game item
  const renderGameItem = ({ item }: { item: typeof MOCK_GAMES[0] }) => {
    return (
      <TouchableOpacity
        style={[styles.gameCard, { backgroundColor: colors.card }]}
        onPress={() => {
          // @ts-ignore - Navigation typing issue
          navigation.navigate('GameDetails', { gameId: item.id });
        }}
      >
        <View style={styles.gameHeader}>
          <ThemedText style={styles.gameVenue}>{item.venue}</ThemedText>
          
          {item.status === 'live' && (
            <View style={[styles.liveIndicator, { backgroundColor: '#FF3B30' }]}>
              <ThemedText style={styles.liveText}>LIVE</ThemedText>
            </View>
          )}
        </View>
        
        <View style={styles.teamsContainer}>
          <View style={styles.teamContainer}>
            <ThemedText style={styles.teamLogo}>{item.homeTeam.logo}</ThemedText>
            <ThemedText style={styles.teamName}>{item.homeTeam.name}</ThemedText>
            <ThemedText style={styles.teamScore}>
              {item.status !== 'upcoming' ? item.homeTeam.score : '-'}
            </ThemedText>
          </View>
          
          <View style={styles.gameInfo}>
            {item.status === 'live' ? (
              <View style={styles.liveInfo}>
                <ThemedText style={styles.quarter}>Q{item.quarter}</ThemedText>
                <ThemedText style={styles.timeRemaining}>{item.timeRemaining}</ThemedText>
              </View>
            ) : (
              <ThemedText style={styles.gameDate}>
                {formatDate(item.date)}
              </ThemedText>
            )}
          </View>
          
          <View style={styles.teamContainer}>
            <ThemedText style={styles.teamLogo}>{item.awayTeam.logo}</ThemedText>
            <ThemedText style={styles.teamName}>{item.awayTeam.name}</ThemedText>
            <ThemedText style={styles.teamScore}>
              {item.status !== 'upcoming' ? item.awayTeam.score : '-'}
            </ThemedText>
          </View>
        </View>
        
        <View style={styles.gameFooter}>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="stats-chart-outline" size={16} color={colors.text} />
            <ThemedText style={styles.actionText}>{t('games.stats')}</ThemedText>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="podium-outline" size={16} color={colors.text} />
            <ThemedText style={styles.actionText}>{t('games.odds')}</ThemedText>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="analytics-outline" size={16} color={colors.text} />
            <ThemedText style={styles.actionText}>{t('games.predictions')}</ThemedText>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  // Render empty state
  const renderEmptyState = () => {
    if (loading) return null;
    
    return (
      <View style={styles.emptyState}>
        <Ionicons name="basketball-outline" size={64} color={colors.text} style={{ opacity: 0.5 }} />
        <ThemedText style={styles.emptyStateText}>
          {t('games.no_games_found')}
        </ThemedText>
      </View>
    );
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText style={styles.headerTitle}>{t('games.all_games')}</ThemedText>
      </View>
      
      <View style={[styles.tabs, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'all' && { borderBottomColor: colors.primary, borderBottomWidth: 2 }
          ]}
          onPress={() => handleTabChange('all')}
        >
          <ThemedText
            style={[
              styles.tabText,
              activeTab === 'all' ? { color: colors.primary, fontWeight: 'bold' } : {}
            ]}
          >
            {t('games.all_games')}
          </ThemedText>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'live' && { borderBottomColor: colors.primary, borderBottomWidth: 2 }
          ]}
          onPress={() => handleTabChange('live')}
        >
          <ThemedText
            style={[
              styles.tabText,
              activeTab === 'live' ? { color: colors.primary, fontWeight: 'bold' } : {}
            ]}
          >
            {t('games.live_games')}
          </ThemedText>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'upcoming' && { borderBottomColor: colors.primary, borderBottomWidth: 2 }
          ]}
          onPress={() => handleTabChange('upcoming')}
        >
          <ThemedText
            style={[
              styles.tabText,
              activeTab === 'upcoming' ? { color: colors.primary, fontWeight: 'bold' } : {}
            ]}
          >
            {t('games.upcoming_games')}
          </ThemedText>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'completed' && { borderBottomColor: colors.primary, borderBottomWidth: 2 }
          ]}
          onPress={() => handleTabChange('completed')}
        >
          <ThemedText
            style={[
              styles.tabText,
              activeTab === 'completed' ? { color: colors.primary, fontWeight: 'bold' } : {}
            ]}
          >
            {t('games.completed_games')}
          </ThemedText>
        </TouchableOpacity>
      </View>
      
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <ThemedText style={styles.loadingText}>{t('common.loading')}</ThemedText>
        </View>
      ) : (
        <FlatList
          data={games}
          renderItem={renderGameItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={renderEmptyState}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
        />
      )}
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    marginBottom: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  tabText: {
    fontSize: 14,
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  gameCard: {
    borderRadius: 12,
    marginBottom: 16,
    padding: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  gameHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  gameVenue: {
    fontSize: 12,
    opacity: 0.7,
  },
  liveIndicator: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  liveText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  teamsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  teamContainer: {
    flex: 2,
    alignItems: 'center',
  },
  teamLogo: {
    fontSize: 32,
    marginBottom: 8,
  },
  teamName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
    textAlign: 'center',
  },
  teamScore: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  gameInfo: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gameDate: {
    fontSize: 12,
    textAlign: 'center',
  },
  liveInfo: {
    alignItems: 'center',
  },
  quarter: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  timeRemaining: {
    fontSize: 12,
  },
  gameFooter: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingTop: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionText: {
    fontSize: 12,
    marginLeft: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyStateText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
    opacity: 0.7,
  },
});

export default GamesScreen;