import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  TextInput,
  ActivityIndicator,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useI18n } from '../contexts/I18nContext';
import CachedPlayerImage from './CachedPlayerImage';
import { usePersonalization } from '../contexts/PersonalizationContext';

// Player data interface
interface Player {
  id: string;
  name: string;
  team: string;
  sport: string;
  position?: string;
}

interface FavoritePlayerPickerProps {
  onClose?: () => void;
}

const FavoritePlayerPicker: React.FC<FavoritePlayerPickerProps> = ({ onClose }) => {
  const { colors, isDark } = useTheme();
  const { t } = useI18n();
  const { preferences, updatePreferences } = usePersonalization();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Player[]>([]);
  const [favoritePlayers, setFavoritePlayers] = useState<Player[]>([]);
  const [selectedSport, setSelectedSport] = useState<string>('all');
  
  // Sports list
  const sportsList = [
    { key: 'all', name: t('personalization.favoritePlayers.allSports') },
    { key: 'basketball_nba', name: t('sports.basketball_nba') },
    { key: 'basketball_ncaab', name: t('sports.basketball_ncaab') },
    { key: 'football_nfl', name: t('sports.football_nfl') },
    { key: 'baseball_mlb', name: t('sports.baseball_mlb') },
    { key: 'hockey_nhl', name: t('sports.hockey_nhl') },
    { key: 'soccer_epl', name: t('sports.soccer_epl') },
    { key: 'soccer_mls', name: t('sports.soccer_mls') },
    { key: 'soccer_womens_nwsl', name: t('sports.soccer_womens_nwsl') },
    { key: 'soccer_laliga', name: t('sports.soccer_laliga') }
  ];
  
  // Load favorite players from preferences
  useEffect(() => {
    if (preferences.favoritePlayers) {
      setFavoritePlayers(preferences.favoritePlayers);
    }
  }, [preferences.favoritePlayers]);
  
  // Search for players
  const searchPlayers = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    
    setIsSearching(true);
    
    try {
      // Filter by sport if needed
      const sportFilter = selectedSport !== 'all' ? `&sport=${selectedSport}` : '';
      
      // Call the player search API
      const response = await fetch(`/api/players/search?q=${encodeURIComponent(query)}${sportFilter}`);
      const data = await response.json();
      
      if (data.success) {
        setSearchResults(data.players);
      } else {
        console.error('Error searching players:', data.error);
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Error searching players:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };
  
  // Add player to favorites
  const addToFavorites = (player: Player) => {
    // Check if player is already in favorites
    if (favoritePlayers.some(p => p.id === player.id)) {
      Alert.alert(
        t('personalization.favoritePlayers.alreadyFavorited.title'),
        t('personalization.favoritePlayers.alreadyFavorited.message', { playerName: player.name }),
        [{ text: t('personalization.alerts.ok') }]
      );
      return;
    }
    
    // Add to favorites
    const updatedFavorites = [...favoritePlayers, player];
    setFavoritePlayers(updatedFavorites);
    
    // Update preferences
    updatePreferences({
      ...preferences,
      favoritePlayers: updatedFavorites
    });
    
    // Show confirmation
    Alert.alert(
      t('personalization.favoritePlayers.added.title'),
      t('personalization.favoritePlayers.added.message', { playerName: player.name }),
      [{ text: t('personalization.alerts.ok') }]
    );
  };
  
  // Remove player from favorites
  const removeFromFavorites = (playerId: string) => {
    // Find player name for alert
    const player = favoritePlayers.find(p => p.id === playerId);
    
    if (!player) return;
    
    // Confirm removal
    Alert.alert(
      t('personalization.favoritePlayers.remove.title'),
      t('personalization.favoritePlayers.remove.message', { playerName: player.name }),
      [
        {
          text: t('personalization.alerts.cancel'),
          style: 'cancel'
        },
        {
          text: t('personalization.favoritePlayers.remove.confirm'),
          style: 'destructive',
          onPress: () => {
            // Remove from favorites
            const updatedFavorites = favoritePlayers.filter(p => p.id !== playerId);
            setFavoritePlayers(updatedFavorites);
            
            // Update preferences
            updatePreferences({
              ...preferences,
              favoritePlayers: updatedFavorites
            });
          }
        }
      ]
    );
  };
  
  // Render player item in search results
  const renderSearchResultItem = ({ item }: { item: Player }) => (
    <TouchableOpacity
      style={[styles.playerItem, { backgroundColor: isDark ? '#333' : '#f5f5f5' }]}
      onPress={() => addToFavorites(item)}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={t('personalization.favoritePlayers.accessibility.addPlayer', { playerName: item.name })}
      accessibilityHint={t('personalization.favoritePlayers.accessibility.addPlayerHint')}
    >
      <CachedPlayerImage
        playerId={item.id}
        playerName={item.name}
        sport={item.sport}
        size={50}
        style={styles.playerImage}
      />
      <View style={styles.playerInfo}>
        <Text style={[styles.playerName, { color: colors.text }]}>{item.name}</Text>
        <Text style={[styles.playerTeam, { color: colors.text }]}>
          {item.team} {item.position ? `• ${item.position}` : ''}
        </Text>
      </View>
      <Ionicons name="add-circle" size={24} color={colors.primary} />
    </TouchableOpacity>
  );
  
  // Render favorite player item
  const renderFavoritePlayerItem = ({ item }: { item: Player }) => (
    <TouchableOpacity
      style={[styles.playerItem, { backgroundColor: isDark ? '#333' : '#f5f5f5' }]}
      onPress={() => removeFromFavorites(item.id)}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={t('personalization.favoritePlayers.accessibility.removePlayer', { playerName: item.name })}
      accessibilityHint={t('personalization.favoritePlayers.accessibility.removePlayerHint')}
    >
      <CachedPlayerImage
        playerId={item.id}
        playerName={item.name}
        sport={item.sport}
        size={50}
        style={styles.playerImage}
      />
      <View style={styles.playerInfo}>
        <Text style={[styles.playerName, { color: colors.text }]}>{item.name}</Text>
        <Text style={[styles.playerTeam, { color: colors.text }]}>
          {item.team} {item.position ? `• ${item.position}` : ''}
        </Text>
      </View>
      <Ionicons name="close-circle" size={24} color="#FF6347" />
    </TouchableOpacity>
  );
  
  // Render sport filter item
  const renderSportFilterItem = ({ item }: { item: { key: string, name: string } }) => (
    <TouchableOpacity
      style={[
        styles.sportFilterItem,
        selectedSport === item.key && [styles.sportFilterItemActive, { backgroundColor: colors.primary }]
      ]}
      onPress={() => setSelectedSport(item.key)}
      accessible={true}
      accessibilityRole="radio"
      accessibilityState={{ checked: selectedSport === item.key }}
      accessibilityLabel={item.name}
    >
      <Text
        style={[
          styles.sportFilterText,
          selectedSport === item.key && styles.sportFilterTextActive
        ]}
      >
        {item.name}
      </Text>
    </TouchableOpacity>
  );
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>
          {t('personalization.favoritePlayers.title')}
        </Text>
        {onClose && (
          <TouchableOpacity
            onPress={onClose}
            style={styles.closeButton}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={t('personalization.accessibility.closeButton')}
          >
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
        )}
      </View>
      
      <Text style={[styles.sectionTitle, { color: colors.text }]}>
        {t('personalization.favoritePlayers.filterBySport')}
      </Text>
      
      <FlatList
        data={sportsList}
        renderItem={renderSportFilterItem}
        keyExtractor={item => item.key}
        horizontal={true}
        showsHorizontalScrollIndicator={false}
        style={styles.sportFilterList}
      />
      
      <View style={[styles.searchContainer, { backgroundColor: isDark ? '#333' : '#f5f5f5' }]}>
        <Ionicons name="search" size={20} color={colors.text} style={styles.searchIcon} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder={t('personalization.favoritePlayers.searchPlaceholder')}
          placeholderTextColor={isDark ? '#999' : '#666'}
          value={searchQuery}
          onChangeText={text => {
            setSearchQuery(text);
            searchPlayers(text);
          }}
          accessible={true}
          accessibilityLabel={t('personalization.favoritePlayers.accessibility.searchInput')}
          accessibilityHint={t('personalization.favoritePlayers.accessibility.searchInputHint')}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity
            onPress={() => {
              setSearchQuery('');
              setSearchResults([]);
            }}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={t('personalization.favoritePlayers.accessibility.clearSearch')}
          >
            <Ionicons name="close-circle" size={20} color={colors.text} />
          </TouchableOpacity>
        )}
      </View>
      
      {isSearching && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text }]}>
            {t('personalization.favoritePlayers.searching')}
          </Text>
        </View>
      )}
      
      {searchQuery.length > 0 && !isSearching && (
        <>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {t('personalization.favoritePlayers.searchResults')}
          </Text>
          
          {searchResults.length > 0 ? (
            <FlatList
              data={searchResults}
              renderItem={renderSearchResultItem}
              keyExtractor={item => item.id}
              style={styles.playerList}
            />
          ) : (
            <Text style={[styles.noResultsText, { color: colors.text }]}>
              {t('personalization.favoritePlayers.noResults')}
            </Text>
          )}
        </>
      )}
      
      <Text style={[styles.sectionTitle, { color: colors.text }]}>
        {t('personalization.favoritePlayers.yourFavorites')}
      </Text>
      
      {favoritePlayers.length > 0 ? (
        <FlatList
          data={favoritePlayers.filter(player => 
            selectedSport === 'all' || player.sport === selectedSport
          )}
          renderItem={renderFavoritePlayerItem}
          keyExtractor={item => item.id}
          style={styles.playerList}
        />
      ) : (
        <Text style={[styles.noResultsText, { color: colors.text }]}>
          {t('personalization.favoritePlayers.noFavorites')}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  sportFilterList: {
    marginBottom: 16,
  },
  sportFilterItem: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    backgroundColor: '#e0e0e0',
  },
  sportFilterItemActive: {
    backgroundColor: '#007BFF',
  },
  sportFilterText: {
    fontSize: 14,
    color: '#333',
  },
  sportFilterTextActive: {
    color: '#fff',
    fontWeight: 'bold',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 16,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    padding: 4,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 14,
  },
  playerList: {
    flex: 1,
  },
  playerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  playerImage: {
    marginRight: 12,
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  playerTeam: {
    fontSize: 14,
    marginTop: 2,
  },
  noResultsText: {
    textAlign: 'center',
    padding: 16,
    fontSize: 14,
  }
});

export default FavoritePlayerPicker;