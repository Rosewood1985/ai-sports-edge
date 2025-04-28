import { firestore } from '../config/firebase';
import { collection, query, where, orderBy, limit, getDocs, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { User } from 'firebase/auth';

export interface SearchFilters {
  contentTypes?: string[];
  sports?: string[];
  leagues?: string[];
  teams?: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  location?: {
    latitude: number;
    longitude: number;
    radius: number; // in kilometers
  };
}

export interface SearchResults {
  news: NewsSearchResult[];
  teams: TeamSearchResult[];
  players: PlayerSearchResult[];
  odds: OddsSearchResult[];
  totalResults: number;
}

export interface NewsSearchResult {
  id: string;
  title: string;
  source: string;
  date: Date;
  snippet: string;
  url: string;
  imageUrl?: string;
  categories: string[];
  isBettingContent: boolean;
}

export interface TeamSearchResult {
  id: string;
  name: string;
  sport: string;
  league: string;
  logo: string;
  location: string;
  record?: string;
}

export interface PlayerSearchResult {
  id: string;
  name: string;
  team: string;
  sport: string;
  league: string;
  position: string;
  imageUrl?: string;
  stats?: Record<string, any>;
}

export interface OddsSearchResult {
  id: string;
  gameId: string;
  homeTeam: string;
  awayTeam: string;
  date: Date;
  sport: string;
  league: string;
  odds: {
    homeMoneyline: number;
    awayMoneyline: number;
    spread: number;
    overUnder: number;
  };
}

export interface SearchHistoryItem {
  id: string;
  userId: string;
  query: string;
  timestamp: Date;
  resultCount: number;
  filters?: SearchFilters;
}

export interface SearchPreferences {
  defaultFilters: SearchFilters;
  saveHistory: boolean;
  showRecentSearches: boolean;
  autocompleteEnabled: boolean;
  maxHistoryItems: number;
  preferredContentTypes: string[];
}

/**
 * Service for handling search functionality
 */
class SearchService {
  /**
   * Search across all content types
   * @param query Search query
   * @param filters Optional search filters
   * @returns Search results
   */
  async search(query: string, filters?: SearchFilters): Promise<SearchResults> {
    // Normalize query
    const normalizedQuery = query.trim().toLowerCase();
    
    // Execute searches in parallel
    const [newsResults, teamsResults, playersResults, oddsResults] = await Promise.all([
      this.searchNews(normalizedQuery, filters),
      this.searchTeams(normalizedQuery, filters),
      this.searchPlayers(normalizedQuery, filters),
      this.searchOdds(normalizedQuery, filters)
    ]);
    
    // Combine results
    const results: SearchResults = {
      news: newsResults,
      teams: teamsResults,
      players: playersResults,
      odds: oddsResults,
      totalResults: newsResults.length + teamsResults.length + playersResults.length + oddsResults.length
    };
    
    return results;
  }
  
  /**
   * Search news content
   * @param query Search query
   * @param filters Optional search filters
   * @returns News search results
   */
  async searchNews(query: string, filters?: SearchFilters): Promise<NewsSearchResult[]> {
    try {
      // Create base query
      let newsQuery = collection(firestore, 'news');
      
      // TODO: Implement full-text search using Firebase Extensions or a third-party service
      // For now, we'll use a simple contains query which is not efficient for production
      
      // Apply filters if provided
      if (filters) {
        // Apply content type filter
        if (filters.contentTypes && !filters.contentTypes.includes('news')) {
          return [];
        }
        
        // Apply sports filter
        if (filters.sports && filters.sports.length > 0) {
          // This would need to be implemented with a more complex query or in-memory filtering
        }
        
        // Apply date range filter
        if (filters.dateRange) {
          // This would need to be implemented with a more complex query or in-memory filtering
        }
      }
      
      // Execute query and process results
      // This is a placeholder for actual implementation
      return [];
    } catch (error) {
      console.error('Error searching news:', error);
      return [];
    }
  }
  
  /**
   * Search teams
   * @param query Search query
   * @param filters Optional search filters
   * @returns Team search results
   */
  async searchTeams(query: string, filters?: SearchFilters): Promise<TeamSearchResult[]> {
    try {
      // Create base query
      let teamsQuery = collection(firestore, 'teams');
      
      // Apply filters if provided
      if (filters) {
        // Apply content type filter
        if (filters.contentTypes && !filters.contentTypes.includes('teams')) {
          return [];
        }
        
        // Apply sports filter
        if (filters.sports && filters.sports.length > 0) {
          // This would need to be implemented with a more complex query or in-memory filtering
        }
        
        // Apply leagues filter
        if (filters.leagues && filters.leagues.length > 0) {
          // This would need to be implemented with a more complex query or in-memory filtering
        }
      }
      
      // Execute query and process results
      // This is a placeholder for actual implementation
      return [];
    } catch (error) {
      console.error('Error searching teams:', error);
      return [];
    }
  }
  
  /**
   * Search players
   * @param query Search query
   * @param filters Optional search filters
   * @returns Player search results
   */
  async searchPlayers(query: string, filters?: SearchFilters): Promise<PlayerSearchResult[]> {
    try {
      // Create base query
      let playersQuery = collection(firestore, 'players');
      
      // Apply filters if provided
      if (filters) {
        // Apply content type filter
        if (filters.contentTypes && !filters.contentTypes.includes('players')) {
          return [];
        }
        
        // Apply sports filter
        if (filters.sports && filters.sports.length > 0) {
          // This would need to be implemented with a more complex query or in-memory filtering
        }
        
        // Apply teams filter
        if (filters.teams && filters.teams.length > 0) {
          // This would need to be implemented with a more complex query or in-memory filtering
        }
      }
      
      // Execute query and process results
      // This is a placeholder for actual implementation
      return [];
    } catch (error) {
      console.error('Error searching players:', error);
      return [];
    }
  }
  
  /**
   * Search odds
   * @param query Search query
   * @param filters Optional search filters
   * @returns Odds search results
   */
  async searchOdds(query: string, filters?: SearchFilters): Promise<OddsSearchResult[]> {
    try {
      // Create base query
      let oddsQuery = collection(firestore, 'odds');
      
      // Apply filters if provided
      if (filters) {
        // Apply content type filter
        if (filters.contentTypes && !filters.contentTypes.includes('odds')) {
          return [];
        }
        
        // Apply sports filter
        if (filters.sports && filters.sports.length > 0) {
          // This would need to be implemented with a more complex query or in-memory filtering
        }
        
        // Apply date range filter
        if (filters.dateRange) {
          // This would need to be implemented with a more complex query or in-memory filtering
        }
      }
      
      // Execute query and process results
      // This is a placeholder for actual implementation
      return [];
    } catch (error) {
      console.error('Error searching odds:', error);
      return [];
    }
  }
  
  /**
   * Get search history for a user
   * @param userId User ID
   * @param limit Maximum number of history items to return
   * @returns Search history items
   */
  async getSearchHistory(userId: string, maxItems: number = 10): Promise<SearchHistoryItem[]> {
    try {
      const historyQuery = query(
        collection(firestore, 'searchHistory'),
        where('userId', '==', userId),
        orderBy('timestamp', 'desc'),
        limit(maxItems)
      );
      
      const snapshot = await getDocs(historyQuery);
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as SearchHistoryItem[];
    } catch (error) {
      console.error('Error getting search history:', error);
      return [];
    }
  }
  
  /**
   * Save a search query to history
   * @param userId User ID
   * @param query Search query
   * @param resultCount Number of results found
   * @param filters Search filters used
   */
  async saveSearchQuery(
    userId: string, 
    query: string, 
    resultCount: number = 0, 
    filters?: SearchFilters
  ): Promise<void> {
    try {
      // Get user preferences to check if history should be saved
      const preferences = await this.getSearchPreferences(userId);
      
      if (!preferences.saveHistory) {
        return;
      }
      
      // Create history item
      const historyItem: Omit<SearchHistoryItem, 'id'> = {
        userId,
        query,
        timestamp: new Date(),
        resultCount,
        filters
      };
      
      // Add to Firestore
      await addDoc(collection(firestore, 'searchHistory'), historyItem);
      
      // Limit history items if needed
      if (preferences.maxHistoryItems > 0) {
        const allHistory = await this.getSearchHistory(userId, 1000);
        
        if (allHistory.length > preferences.maxHistoryItems) {
          // Delete oldest items
          const itemsToDelete = allHistory.slice(preferences.maxHistoryItems);
          
          for (const item of itemsToDelete) {
            await deleteDoc(doc(firestore, 'searchHistory', item.id));
          }
        }
      }
    } catch (error) {
      console.error('Error saving search query:', error);
    }
  }
  
  /**
   * Clear search history for a user
   * @param userId User ID
   */
  async clearSearchHistory(userId: string): Promise<void> {
    try {
      const historyQuery = query(
        collection(firestore, 'searchHistory'),
        where('userId', '==', userId)
      );
      
      const snapshot = await getDocs(historyQuery);
      
      // Delete all history items
      const deletePromises = snapshot.docs.map(doc => 
        deleteDoc(doc.ref)
      );
      
      await Promise.all(deletePromises);
    } catch (error) {
      console.error('Error clearing search history:', error);
    }
  }
  
  /**
   * Get search preferences for a user
   * @param userId User ID
   * @returns Search preferences
   */
  async getSearchPreferences(userId: string): Promise<SearchPreferences> {
    try {
      const preferencesQuery = query(
        collection(firestore, 'searchPreferences'),
        where('userId', '==', userId),
        limit(1)
      );
      
      const snapshot = await getDocs(preferencesQuery);
      
      if (snapshot.empty) {
        // Return default preferences
        return this.getDefaultSearchPreferences();
      }
      
      return snapshot.docs[0].data() as SearchPreferences;
    } catch (error) {
      console.error('Error getting search preferences:', error);
      return this.getDefaultSearchPreferences();
    }
  }
  
  /**
   * Update search preferences for a user
   * @param userId User ID
   * @param preferences Search preferences
   */
  async updateSearchPreferences(userId: string, preferences: SearchPreferences): Promise<void> {
    try {
      const preferencesQuery = query(
        collection(firestore, 'searchPreferences'),
        where('userId', '==', userId),
        limit(1)
      );
      
      const snapshot = await getDocs(preferencesQuery);
      
      if (snapshot.empty) {
        // Create new preferences
        await addDoc(collection(firestore, 'searchPreferences'), {
          userId,
          ...preferences
        });
      } else {
        // Update existing preferences
        // Convert preferences to a plain object for Firestore
        const preferencesData = {
          defaultFilters: preferences.defaultFilters,
          saveHistory: preferences.saveHistory,
          showRecentSearches: preferences.showRecentSearches,
          autocompleteEnabled: preferences.autocompleteEnabled,
          maxHistoryItems: preferences.maxHistoryItems,
          preferredContentTypes: preferences.preferredContentTypes
        };
        
        await updateDoc(snapshot.docs[0].ref, preferencesData);
      }
    } catch (error) {
      console.error('Error updating search preferences:', error);
    }
  }
  
  /**
   * Get default search preferences
   * @returns Default search preferences
   */
  private getDefaultSearchPreferences(): SearchPreferences {
    return {
      defaultFilters: {
        contentTypes: ['news', 'teams', 'players', 'odds'],
        sports: [],
        leagues: [],
        teams: []
      },
      saveHistory: true,
      showRecentSearches: true,
      autocompleteEnabled: true,
      maxHistoryItems: 20,
      preferredContentTypes: ['news', 'teams', 'players', 'odds']
    };
  }
}

export default new SearchService();