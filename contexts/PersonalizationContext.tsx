import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { personalizationService, UserPreferences, Player } from '../services/personalizationService';
import { analyticsService, AnalyticsEventType } from '../services/analyticsService';

// Context interface
interface PersonalizationContextType {
  preferences: UserPreferences;
  isLoading: boolean;
  setDefaultSport: (sport: string) => Promise<void>;
  setDefaultSportsbook: (sportsbook: 'draftkings' | 'fanduel' | null) => Promise<void>;
  addFavoriteTeam: (team: string) => Promise<void>;
  removeFavoriteTeam: (team: string) => Promise<void>;
  addFavoriteLeague: (league: string) => Promise<void>;
  removeFavoriteLeague: (league: string) => Promise<void>;
  addFavoritePlayer: (player: Player) => Promise<void>;
  removeFavoritePlayer: (playerId: string) => Promise<void>;
  updateFavoritePlayers: (players: Player[]) => Promise<void>;
  updatePreferences: (preferences: Partial<UserPreferences>) => Promise<void>;
  hideSportsbook: (sportsbook: 'draftkings' | 'fanduel') => Promise<void>;
  showSportsbook: (sportsbook: 'draftkings' | 'fanduel') => Promise<void>;
  setNotificationPreferences: (preferences: Partial<UserPreferences['notificationPreferences']>) => Promise<void>;
  setDisplayPreferences: (preferences: Partial<UserPreferences['displayPreferences']>) => Promise<void>;
  resetPreferences: () => Promise<void>;
}

// Create context with default values
const PersonalizationContext = createContext<PersonalizationContextType>({
  preferences: {},
  isLoading: true,
  setDefaultSport: async () => {},
  setDefaultSportsbook: async () => {},
  addFavoriteTeam: async () => {},
  removeFavoriteTeam: async () => {},
  addFavoriteLeague: async () => {},
  removeFavoriteLeague: async () => {},
  addFavoritePlayer: async () => {},
  removeFavoritePlayer: async () => {},
  updateFavoritePlayers: async () => {},
  updatePreferences: async () => {},
  hideSportsbook: async () => {},
  showSportsbook: async () => {},
  setNotificationPreferences: async () => {},
  setDisplayPreferences: async () => {},
  resetPreferences: async () => {}
});

// Provider props interface
interface PersonalizationProviderProps {
  children: ReactNode;
}

// Provider component
export const PersonalizationProvider: React.FC<PersonalizationProviderProps> = ({ children }) => {
  const [preferences, setPreferences] = useState<UserPreferences>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  // Initialize personalization service and load preferences
  useEffect(() => {
    const initializePersonalization = async () => {
      try {
        setIsLoading(true);
        
        // Initialize personalization service
        await personalizationService.initialize();
        
        // Load user preferences
        const userPreferences = await personalizationService.getUserPreferences();
        setPreferences(userPreferences);
        
        // Track personalization loaded event
        await analyticsService.trackEvent(AnalyticsEventType.CUSTOM, {
          event_name: 'personalization_loaded',
          has_default_sport: !!userPreferences.defaultSport,
          has_default_sportsbook: !!userPreferences.defaultSportsbook,
          favorite_teams_count: userPreferences.favoriteTeams?.length || 0,
          favorite_leagues_count: userPreferences.favoriteLeagues?.length || 0,
          favorite_players_count: userPreferences.favoritePlayers?.length || 0
        });
      } catch (error) {
        console.error('Error initializing personalization:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    initializePersonalization();
  }, []);
  
  // Set default sport
  const setDefaultSport = async (sport: string) => {
    try {
      await personalizationService.setDefaultSport(sport);
      
      // Update local state
      setPreferences(prev => ({
        ...prev,
        defaultSport: sport
      }));
    } catch (error) {
      console.error('Error setting default sport:', error);
    }
  };
  
  // Set default sportsbook
  const setDefaultSportsbook = async (sportsbook: 'draftkings' | 'fanduel' | null) => {
    try {
      await personalizationService.setDefaultSportsbook(sportsbook);
      
      // Update local state
      setPreferences(prev => ({
        ...prev,
        defaultSportsbook: sportsbook
      }));
    } catch (error) {
      console.error('Error setting default sportsbook:', error);
    }
  };
  
  // Add favorite team
  const addFavoriteTeam = async (team: string) => {
    try {
      await personalizationService.addFavoriteTeam(team);
      
      // Update local state
      setPreferences(prev => ({
        ...prev,
        favoriteTeams: [...(prev.favoriteTeams || []), team]
      }));
    } catch (error) {
      console.error('Error adding favorite team:', error);
    }
  };
  
  // Remove favorite team
  const removeFavoriteTeam = async (team: string) => {
    try {
      await personalizationService.removeFavoriteTeam(team);
      
      // Update local state
      setPreferences(prev => ({
        ...prev,
        favoriteTeams: (prev.favoriteTeams || []).filter(t => t !== team)
      }));
    } catch (error) {
      console.error('Error removing favorite team:', error);
    }
  };
  
  // Add favorite league
  const addFavoriteLeague = async (league: string) => {
    try {
      await personalizationService.addFavoriteLeague(league);
      
      // Update local state
      setPreferences(prev => ({
        ...prev,
        favoriteLeagues: [...(prev.favoriteLeagues || []), league]
      }));
    } catch (error) {
      console.error('Error adding favorite league:', error);
    }
  };
  
  // Remove favorite league
  const removeFavoriteLeague = async (league: string) => {
    try {
      await personalizationService.removeFavoriteLeague(league);
      
      // Update local state
      setPreferences(prev => ({
        ...prev,
        favoriteLeagues: (prev.favoriteLeagues || []).filter(l => l !== league)
      }));
    } catch (error) {
      console.error('Error removing favorite league:', error);
    }
  };
  
  // Hide sportsbook
  const hideSportsbook = async (sportsbook: 'draftkings' | 'fanduel') => {
    try {
      await personalizationService.hideSportsbook(sportsbook);
      
      // Update local state
      setPreferences(prev => ({
        ...prev,
        hiddenSportsbooks: [...(prev.hiddenSportsbooks || []), sportsbook]
      }));
    } catch (error) {
      console.error('Error hiding sportsbook:', error);
    }
  };
  
  // Show sportsbook
  const showSportsbook = async (sportsbook: 'draftkings' | 'fanduel') => {
    try {
      await personalizationService.showSportsbook(sportsbook);
      
      // Update local state
      setPreferences(prev => ({
        ...prev,
        hiddenSportsbooks: (prev.hiddenSportsbooks || []).filter(s => s !== sportsbook)
      }));
    } catch (error) {
      console.error('Error showing sportsbook:', error);
    }
  };
  
  // Set notification preferences
  const setNotificationPreferences = async (notificationPrefs: Partial<UserPreferences['notificationPreferences']>) => {
    try {
      await personalizationService.setNotificationPreferences(notificationPrefs);
      
      // Update local state
      setPreferences(prev => ({
        ...prev,
        notificationPreferences: {
          ...(prev.notificationPreferences || {
            oddsMovements: true,
            gameStart: true,
            gameEnd: true,
            specialOffers: true
          }),
          ...notificationPrefs
        }
      }));
    } catch (error) {
      console.error('Error setting notification preferences:', error);
    }
  };
  
  // Set display preferences
  const setDisplayPreferences = async (displayPrefs: Partial<UserPreferences['displayPreferences']>) => {
    try {
      await personalizationService.setDisplayPreferences(displayPrefs);
      
      // Update local state
      setPreferences(prev => ({
        ...prev,
        displayPreferences: {
          ...(prev.displayPreferences || {
            darkMode: false,
            compactView: false,
            showBetterOddsHighlight: true
          }),
          ...displayPrefs
        }
      }));
    } catch (error) {
      console.error('Error setting display preferences:', error);
    }
  };
  
  // Reset preferences
  const resetPreferences = async () => {
    try {
      await personalizationService.resetPreferences();
      
      // Load updated preferences
      const userPreferences = await personalizationService.getUserPreferences();
      setPreferences(userPreferences);
    } catch (error) {
      console.error('Error resetting preferences:', error);
    }
  };
  
  // Add favorite player
  const addFavoritePlayer = async (player: Player) => {
    try {
      await personalizationService.addFavoritePlayer(player);
      
      // Update local state
      setPreferences(prev => ({
        ...prev,
        favoritePlayers: [...(prev.favoritePlayers || []), player]
      }));
    } catch (error) {
      console.error('Error adding favorite player:', error);
    }
  };
  
  // Remove favorite player
  const removeFavoritePlayer = async (playerId: string) => {
    try {
      await personalizationService.removeFavoritePlayer(playerId);
      
      // Update local state
      setPreferences(prev => ({
        ...prev,
        favoritePlayers: (prev.favoritePlayers || []).filter(p => p.id !== playerId)
      }));
    } catch (error) {
      console.error('Error removing favorite player:', error);
    }
  };
  
  // Update favorite players
  const updateFavoritePlayers = async (players: Player[]) => {
    try {
      await personalizationService.updateFavoritePlayers(players);
      
      // Update local state
      setPreferences(prev => ({
        ...prev,
        favoritePlayers: players
      }));
    } catch (error) {
      console.error('Error updating favorite players:', error);
    }
  };
  
  // Update preferences directly
  const updatePreferences = async (newPreferences: Partial<UserPreferences>) => {
    try {
      await personalizationService.setUserPreferences(newPreferences);
      
      // Update local state
      setPreferences(prev => ({
        ...prev,
        ...newPreferences
      }));
    } catch (error) {
      console.error('Error updating preferences:', error);
    }
  };

  // Context value
  const contextValue: PersonalizationContextType = {
    preferences,
    isLoading,
    setDefaultSport,
    setDefaultSportsbook,
    addFavoriteTeam,
    removeFavoriteTeam,
    addFavoriteLeague,
    removeFavoriteLeague,
    addFavoritePlayer,
    removeFavoritePlayer,
    updateFavoritePlayers,
    updatePreferences,
    hideSportsbook,
    showSportsbook,
    setNotificationPreferences,
    setDisplayPreferences,
    resetPreferences
  };
  
  return (
    <PersonalizationContext.Provider value={contextValue}>
      {children}
    </PersonalizationContext.Provider>
  );
};

// Custom hook for using personalization context
export const usePersonalization = () => useContext(PersonalizationContext);