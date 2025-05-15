/**
 * Personalization Service
 * 
 * This service manages user preferences and personalization options.
 * It allows users to set default sportsbooks, sports, and other preferences.
 */

import { firebaseService } from '../src/atomic/organisms/firebaseService';
import '@react-native-async-storage/async-storage';
import { Platform, NativeModules } from 'react-native';
import { auth } from '../config/firebase';
import { analyticsService, AnalyticsEventType } from './analyticsService';

// Player interface
export interface Player {
  id: string;
  name: string;
  team: string;
  sport: string;
  position?: string;
}

// User preferences interface
export interface UserPreferences {
  defaultSport?: string;
  defaultSportsbook?: 'draftkings' | 'fanduel' | null;
  favoriteTeams?: string[];
  favoriteLeagues?: string[];
  favoritePlayers?: Player[];
  hiddenSportsbooks?: ('draftkings' | 'fanduel')[];
  defaultOddsFormat?: 'american' | 'decimal' | 'fractional';
  defaultView?: 'odds' | 'props' | 'parlays';
  notificationPreferences?: {
    oddsMovements: boolean;
    gameStart: boolean;
    gameEnd: boolean;
    specialOffers: boolean;
  };
  displayPreferences?: {
    darkMode?: boolean;
    compactView?: boolean;
    showBetterOddsHighlight?: boolean;
  };
  lastUpdated?: number;
}

class PersonalizationService {
  private static instance: PersonalizationService;
  private userPreferences: UserPreferences = {};
  private isInitialized: boolean = false;
  private readonly STORAGE_KEY = 'user_preferences';
  
  // Get singleton instance
  public static getInstance(): PersonalizationService {
    if (!PersonalizationService.instance) {
      PersonalizationService.instance = new PersonalizationService();
    }
    return PersonalizationService.instance;
  }
  
  // Initialize personalization service
  public async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    try {
      // Load user preferences
      await this.loadUserPreferences();
      
      // Check if we need to set language-specific defaults
      if (Object.keys(this.userPreferences).length === 0) {
        // Get device language
        const getDeviceLanguage = (): string => {
          // iOS
          if (Platform.OS === 'ios') {
            return (
              NativeModules.SettingsManager.settings.AppleLocale ||
              NativeModules.SettingsManager.settings.AppleLanguages[0] ||
              'en'
            );
          }
          
          // Android
          if (Platform.OS === 'android') {
            return NativeModules.I18nManager.localeIdentifier || 'en';
          }
          
          // Web
          if (Platform.OS === 'web' && typeof navigator !== 'undefined') {
            return navigator.language || 'en';
          }
          
          return 'en';
        };
        
        // Determine if user is likely Spanish-speaking
        const deviceLang = getDeviceLanguage().toLowerCase();
        const isSpanishUser = deviceLang.startsWith('es') ||
                              deviceLang === 'spa' ||
                              deviceLang.includes('spanish');
        
        // Set default sport based on language preference
        const defaultSportForUser = isSpanishUser ? 'soccer_liga' : 'basketball_nba';
        
        // Set language-appropriate defaults
        this.userPreferences = {
          defaultSport: defaultSportForUser,
          defaultSportsbook: null,
          favoriteTeams: [],
          favoriteLeagues: [],
          favoritePlayers: [],
          hiddenSportsbooks: [],
          defaultOddsFormat: isSpanishUser ? 'decimal' : 'american',
          defaultView: 'odds',
          notificationPreferences: {
            oddsMovements: true,
            gameStart: true,
            gameEnd: true,
            specialOffers: true
          },
          displayPreferences: {
            darkMode: false,
            compactView: false,
            showBetterOddsHighlight: true
          },
          lastUpdated: Date.now()
        };
        
        // Save these defaults
        await this.saveUserPreferences();
      }
      
      this.isInitialized = true;
      
      console.log('Personalization service initialized');
    } catch (error) {
      console.error('Error initializing personalization service:', error);
    }
  }
  
  // Get user preferences
  public async getUserPreferences(): Promise<UserPreferences> {
    if (!this.isInitialized) {
      await this.initialize();
    }
    
    return this.userPreferences;
  }
  
  // Set user preferences
  public async setUserPreferences(preferences: Partial<UserPreferences>): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }
    
    // Merge new preferences with existing ones
    this.userPreferences = {
      ...this.userPreferences,
      ...preferences,
      lastUpdated: Date.now()
    };
    
    // Save user preferences
    await this.saveUserPreferences();
    
    // Track preference changes in analytics
    await analyticsService.trackEvent(AnalyticsEventType.CUSTOM, {
      event_name: 'preferences_updated',
      ...Object.keys(preferences).reduce((obj, key) => {
        obj[`preference_${key}`] = preferences[key as keyof UserPreferences];
        return obj;
      }, {} as Record<string, any>)
    });
  }
  
  // Set default sport
  public async setDefaultSport(sport: string): Promise<void> {
    await this.setUserPreferences({ defaultSport: sport });
    
    // Track specific preference change
    await analyticsService.trackEvent(AnalyticsEventType.CUSTOM, {
      event_name: 'default_sport_set',
      sport
    });
  }
  
  // Set default sportsbook
  public async setDefaultSportsbook(sportsbook: 'draftkings' | 'fanduel' | null): Promise<void> {
    await this.setUserPreferences({ defaultSportsbook: sportsbook });
    
    // Track specific preference change
    await analyticsService.trackEvent(AnalyticsEventType.CUSTOM, {
      event_name: 'default_sportsbook_set',
      sportsbook: sportsbook || 'none'
    });
  }
  
  // Add favorite team
  public async addFavoriteTeam(team: string): Promise<void> {
    const favoriteTeams = [...(this.userPreferences.favoriteTeams || [])];
    
    if (!favoriteTeams.includes(team)) {
      favoriteTeams.push(team);
      await this.setUserPreferences({ favoriteTeams });
      
      // Track specific preference change
      await analyticsService.trackEvent(AnalyticsEventType.CUSTOM, {
        event_name: 'favorite_team_added',
        team
      });
    }
  }
  
  // Remove favorite team
  public async removeFavoriteTeam(team: string): Promise<void> {
    const favoriteTeams = [...(this.userPreferences.favoriteTeams || [])];
    const index = favoriteTeams.indexOf(team);
    
    if (index !== -1) {
      favoriteTeams.splice(index, 1);
      await this.setUserPreferences({ favoriteTeams });
      
      // Track specific preference change
      await analyticsService.trackEvent(AnalyticsEventType.CUSTOM, {
        event_name: 'favorite_team_removed',
        team
      });
    }
  }
  
  // Add favorite league
  public async addFavoriteLeague(league: string): Promise<void> {
    const favoriteLeagues = [...(this.userPreferences.favoriteLeagues || [])];
    
    if (!favoriteLeagues.includes(league)) {
      favoriteLeagues.push(league);
      await this.setUserPreferences({ favoriteLeagues });
      
      // Track specific preference change
      await analyticsService.trackEvent(AnalyticsEventType.CUSTOM, {
        event_name: 'favorite_league_added',
        league
      });
    }
  }
  
  // Remove favorite league
  public async removeFavoriteLeague(league: string): Promise<void> {
    const favoriteLeagues = [...(this.userPreferences.favoriteLeagues || [])];
    const index = favoriteLeagues.indexOf(league);
    
    if (index !== -1) {
      favoriteLeagues.splice(index, 1);
      await this.setUserPreferences({ favoriteLeagues });
      
      // Track specific preference change
      await analyticsService.trackEvent(AnalyticsEventType.CUSTOM, {
        event_name: 'favorite_league_removed',
        league
      });
    }
  }
  
  // Hide sportsbook
  public async hideSportsbook(sportsbook: 'draftkings' | 'fanduel'): Promise<void> {
    const hiddenSportsbooks = [...(this.userPreferences.hiddenSportsbooks || [])];
    
    if (!hiddenSportsbooks.includes(sportsbook)) {
      hiddenSportsbooks.push(sportsbook);
      await this.setUserPreferences({ hiddenSportsbooks });
      
      // Track specific preference change
      await analyticsService.trackEvent(AnalyticsEventType.CUSTOM, {
        event_name: 'sportsbook_hidden',
        sportsbook
      });
    }
  }
  
  // Show sportsbook
  public async showSportsbook(sportsbook: 'draftkings' | 'fanduel'): Promise<void> {
    const hiddenSportsbooks = [...(this.userPreferences.hiddenSportsbooks || [])];
    const index = hiddenSportsbooks.indexOf(sportsbook);
    
    if (index !== -1) {
      hiddenSportsbooks.splice(index, 1);
      await this.setUserPreferences({ hiddenSportsbooks });
      
      // Track specific preference change
      await analyticsService.trackEvent(AnalyticsEventType.CUSTOM, {
        event_name: 'sportsbook_shown',
        sportsbook
      });
    }
  }
  
  // Set notification preferences
  public async setNotificationPreferences(preferences: Partial<UserPreferences['notificationPreferences']>): Promise<void> {
    const notificationPreferences = {
      ...(this.userPreferences.notificationPreferences || {
        oddsMovements: true,
        gameStart: true,
        gameEnd: true,
        specialOffers: true
      }),
      ...preferences
    };
    
    await this.setUserPreferences({ notificationPreferences });
    
    // Track specific preference change
    await analyticsService.trackEvent(AnalyticsEventType.CUSTOM, {
      event_name: 'notification_preferences_updated',
      ...Object.entries(preferences || {}).reduce((obj, [key, value]) => {
        obj[`notification_${key}`] = value;
        return obj;
      }, {} as Record<string, any>)
    });
  }
  
  // Set display preferences
  public async setDisplayPreferences(preferences: Partial<UserPreferences['displayPreferences']>): Promise<void> {
    const displayPreferences = {
      ...(this.userPreferences.displayPreferences || {
        darkMode: false,
        compactView: false,
        showBetterOddsHighlight: true
      }),
      ...preferences
    };
    
    await this.setUserPreferences({ displayPreferences });
    
    // Track specific preference change
    await analyticsService.trackEvent(AnalyticsEventType.CUSTOM, {
      event_name: 'display_preferences_updated',
      ...Object.entries(preferences || {}).reduce((obj, [key, value]) => {
        obj[`display_${key}`] = value;
        return obj;
      }, {} as Record<string, any>)
    });
  }
  
  // Add favorite player
  public async addFavoritePlayer(player: Player): Promise<void> {
    const favoritePlayers = [...(this.userPreferences.favoritePlayers || [])];
    
    // Check if player is already in favorites
    if (!favoritePlayers.some(p => p.id === player.id)) {
      favoritePlayers.push(player);
      await this.setUserPreferences({ favoritePlayers });
      
      // Track specific preference change
      await analyticsService.trackEvent(AnalyticsEventType.CUSTOM, {
        event_name: 'favorite_player_added',
        player_id: player.id,
        player_name: player.name,
        player_sport: player.sport
      });
    }
  }
  
  // Remove favorite player
  public async removeFavoritePlayer(playerId: string): Promise<void> {
    const favoritePlayers = [...(this.userPreferences.favoritePlayers || [])];
    const playerIndex = favoritePlayers.findIndex(p => p.id === playerId);
    
    if (playerIndex !== -1) {
      const player = favoritePlayers[playerIndex];
      favoritePlayers.splice(playerIndex, 1);
      await this.setUserPreferences({ favoritePlayers });
      
      // Track specific preference change
      await analyticsService.trackEvent(AnalyticsEventType.CUSTOM, {
        event_name: 'favorite_player_removed',
        player_id: player.id,
        player_name: player.name,
        player_sport: player.sport
      });
    }
  }
  
  // Update favorite players
  public async updateFavoritePlayers(players: Player[]): Promise<void> {
    await this.setUserPreferences({ favoritePlayers: players });
    
    // Track specific preference change
    await analyticsService.trackEvent(AnalyticsEventType.CUSTOM, {
      event_name: 'favorite_players_updated',
      player_count: players.length
    });
  }

  // Reset user preferences to defaults
  public async resetPreferences(): Promise<void> {
    // Get device language to set appropriate defaults
    const getDeviceLanguage = (): string => {
      // iOS
      if (Platform.OS === 'ios') {
        return (
          NativeModules.SettingsManager.settings.AppleLocale ||
          NativeModules.SettingsManager.settings.AppleLanguages[0] ||
          'en'
        );
      }
      
      // Android
      if (Platform.OS === 'android') {
        return NativeModules.I18nManager.localeIdentifier || 'en';
      }
      
      // Web
      if (Platform.OS === 'web' && typeof navigator !== 'undefined') {
        return navigator.language || 'en';
      }
      
      return 'en';
    };
    
    // Determine if user is likely Spanish-speaking
    const deviceLang = getDeviceLanguage().toLowerCase();
    const isSpanishUser = deviceLang.startsWith('es') ||
                          deviceLang === 'spa' ||
                          deviceLang.includes('spanish');
    
    // Set default sport based on language preference
    // Spanish users might prefer soccer over basketball
    const defaultSportForUser = isSpanishUser ? 'soccer_liga' : 'basketball_nba';
    
    this.userPreferences = {
      defaultSport: defaultSportForUser,
      defaultSportsbook: null,
      favoriteTeams: [],
      favoriteLeagues: [],
      favoritePlayers: [],
      hiddenSportsbooks: [],
      defaultOddsFormat: isSpanishUser ? 'decimal' : 'american', // Spanish users typically prefer decimal odds
      defaultView: 'odds',
      notificationPreferences: {
        oddsMovements: true,
        gameStart: true,
        gameEnd: true,
        specialOffers: true
      },
      displayPreferences: {
        darkMode: false,
        compactView: false,
        showBetterOddsHighlight: true
      },
      lastUpdated: Date.now()
    };
    
    // Save user preferences
    await this.saveUserPreferences();
    
    // Track reset event
    await analyticsService.trackEvent(AnalyticsEventType.CUSTOM, {
      event_name: 'preferences_reset'
    });
  }
  
  // Load user preferences from storage
  private async loadUserPreferences(): Promise<void> {
    try {
      const userId = auth.currentUser?.uid;
      const storageKey = userId ? `${this.STORAGE_KEY}_${userId}` : this.STORAGE_KEY;
      
      const preferencesString = await AsyncStorage.getItem(storageKey);
      
      if (preferencesString) {
        try {
          // Parse preferences with error handling
          const parsedPreferences = JSON.parse(preferencesString);
          
          // Validate the parsed preferences
          if (typeof parsedPreferences === 'object' && parsedPreferences !== null) {
            this.userPreferences = parsedPreferences;
          } else {
            // If preferences are invalid, set to empty object
            // The initialize method will set appropriate defaults
            this.userPreferences = {};
            console.warn('Invalid user preferences format, resetting to defaults');
          }
        } catch (parseError) {
          // Handle JSON parse errors
          console.error('Error parsing user preferences:', parseError);
          this.userPreferences = {};
        }
      } else {
        // No preferences found, initialize with empty object
        // The initialize method will set appropriate defaults
        this.userPreferences = {};
      }
    } catch (error) {
      console.error('Error loading user preferences:', error);
      // Set empty preferences on error
      this.userPreferences = {};
    }
  }
  
  // Save user preferences to storage
  private async saveUserPreferences(): Promise<void> {
    const maxRetries = 3;
    let retries = 0;
    
    while (retries < maxRetries) {
      try {
        const userId = auth.currentUser?.uid;
        const storageKey = userId ? `${this.STORAGE_KEY}_${userId}` : this.STORAGE_KEY;
        
        // Add a timestamp to track when preferences were last saved
        const preferencesToSave = {
          ...this.userPreferences,
          lastUpdated: Date.now()
        };
        
        await AsyncStorage.setItem(
          storageKey,
          JSON.stringify(preferencesToSave)
        );
        
        // If successful, break out of retry loop
        return;
      } catch (error) {
        retries++;
        console.error(`Error saving user preferences (attempt ${retries}/${maxRetries}):`, error);
        
        if (retries >= maxRetries) {
          // Log analytics event for persistent storage failures
          analyticsService.trackEvent(AnalyticsEventType.CUSTOM, {
            event_name: 'preferences_save_failed',
            retries: retries
          }).catch(() => {}); // Ignore analytics errors
        } else {
          // Wait before retrying (exponential backoff)
          await new Promise<void>(resolve => setTimeout(() => resolve(), 500 * Math.pow(2, retries)));
        }
      }
    }
  }
}

// Export singleton instance
export const personalizationService = PersonalizationService.getInstance();