import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Platform, 
  Keyboard,
  FlatList,
  Text
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface SearchBarProps {
  placeholder?: string;
  onSearch: (query: string) => void;
  initialValue?: string;
  showHistory?: boolean;
  autoFocus?: boolean;
  style?: object;
}

/**
 * SearchBar component for searching content
 */
const SearchBar: React.FC<SearchBarProps> = ({
  placeholder = 'Search...',
  onSearch,
  initialValue = '',
  showHistory = false,
  autoFocus = true,
  style = {}
}) => {
  const [query, setQuery] = useState(initialValue);
  const [isFocused, setIsFocused] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const inputRef = useRef<TextInput>(null);

  // Load recent searches
  useEffect(() => {
    if (showHistory) {
      // In a real app, this would load from storage or API
      setRecentSearches([
        'NBA',
        'NFL',
        'Golden State Warriors',
        'LeBron James',
        'Super Bowl'
      ]);
    }
  }, [showHistory]);

  // Handle search submission
  const handleSubmit = () => {
    if (query.trim()) {
      onSearch(query.trim());
      
      // Add to recent searches if not already present
      if (showHistory && !recentSearches.includes(query.trim())) {
        setRecentSearches(prev => [query.trim(), ...prev.slice(0, 9)]);
      }
      
      Keyboard.dismiss();
      setIsFocused(false);
    }
  };

  // Handle clearing the search input
  const handleClear = () => {
    setQuery('');
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // Handle selecting a recent search
  const handleSelectRecentSearch = (item: string) => {
    setQuery(item);
    onSearch(item);
    Keyboard.dismiss();
    setIsFocused(false);
  };

  // Render recent search item
  const renderRecentSearchItem = ({ item }: { item: string }) => (
    <TouchableOpacity 
      style={styles.recentSearchItem} 
      onPress={() => handleSelectRecentSearch(item)}
    >
      <Ionicons name="time-outline" size={16} color="#666" />
      <Text style={styles.recentSearchText}>{item}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, style]}>
      <View style={styles.searchInputContainer}>
        <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
        
        <TextInput
          ref={inputRef}
          style={styles.input}
          placeholder={placeholder}
          value={query}
          onChangeText={setQuery}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => setIsFocused(false), 200)}
          onSubmitEditing={handleSubmit}
          returnKeyType="search"
          clearButtonMode="while-editing"
          autoCapitalize="none"
          autoCorrect={false}
          autoFocus={autoFocus}
        />
        
        {query.length > 0 && Platform.OS === 'android' && (
          <TouchableOpacity onPress={handleClear} style={styles.clearButton}>
            <Ionicons name="close-circle" size={18} color="#999" />
          </TouchableOpacity>
        )}
        
        <TouchableOpacity onPress={handleSubmit} style={styles.searchButton}>
          <Text style={styles.searchButtonText}>Search</Text>
        </TouchableOpacity>
      </View>
      
      {isFocused && showHistory && recentSearches.length > 0 && (
        <View style={styles.recentSearchesContainer}>
          <View style={styles.recentSearchesHeader}>
            <Text style={styles.recentSearchesTitle}>Recent Searches</Text>
            <TouchableOpacity onPress={() => setRecentSearches([])}>
              <Text style={styles.clearAllText}>Clear All</Text>
            </TouchableOpacity>
          </View>
          
          <FlatList
            data={recentSearches}
            renderItem={renderRecentSearchItem}
            keyExtractor={(item) => item}
            style={styles.recentSearchesList}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 10 : 0,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  searchIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    paddingVertical: Platform.OS === 'ios' ? 0 : 8,
  },
  clearButton: {
    padding: 4,
  },
  searchButton: {
    backgroundColor: '#007bff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    marginLeft: 8,
  },
  searchButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  recentSearchesContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    maxHeight: 300,
  },
  recentSearchesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  recentSearchesTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  clearAllText: {
    fontSize: 14,
    color: '#007bff',
  },
  recentSearchesList: {
    maxHeight: 250,
  },
  recentSearchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  recentSearchText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 8,
  },
});

export default SearchBar;