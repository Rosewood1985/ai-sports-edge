/**
 * Personalization Service
 * 
 * This service manages user preferences and personalization options.
 * It allows users to set default sportsbooks, sports, and other preferences.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from '../config/firebase';
import { analyticsService, AnalyticsEventType } from './analyticsService';

// User preferences interface
export interface UserPreferences {
  defaultSport?: string;
  defaultSportsbook?: 'draftkings' | 'fanduel' | null;
  favoriteTeams?: string[];
  favoriteLeagues?: string[];
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
  
  // Reset user preferences to defaults
  public async resetPreferences(): Promise<void> {
    this.userPreferences = {
      defaultSport: 'basketball_nba',
      defaultSportsbook: null,
      favoriteTeams: [],
      favoriteLeagues: [],
      hiddenSportsbooks: [],
      defaultOddsFormat: 'american',
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
        this.userPreferences = JSON.parse(preferencesString);
      } else {
        // Initialize with default preferences
        this.userPreferences = {
          defaultSport: 'basketball_nba',
          defaultSportsbook: null,
          favoriteTeams: [],
          favoriteLeagues: [],
          hiddenSportsbooks: [],
          defaultOddsFormat: 'american',
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
        
        // Save default preferences
        await this.saveUserPreferences();
      }
    } catch (error) {
      console.error('Error loading user preferences:', error);
    }
  }
  
  // Save user preferences to storage
  private async saveUserPreferences(): Promise<void> {
    try {
      const userId = auth.currentUser?.uid;
      const storageKey = userId ? `${this.STORAGE_KEY}_${userId}` : this.STORAGE_KEY;
      
      await AsyncStorage.setItem(
        storageKey,
        JSON.stringify(this.userPreferences)
      );
    } catch (error) {
      console.error('Error saving user preferences:', error);
    }
  }
}

// Export singleton instance
export const personalizationService = PersonalizationService.getInstance();