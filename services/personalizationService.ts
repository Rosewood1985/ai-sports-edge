import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { analyticsService } from './analyticsService';

/**
 * User preferences interface
 */
export interface UserPreferences {
  // Theme preferences
  darkMode: boolean;
  accentColor: string;
  
  // Content preferences
  favoriteLeagues: string[];
  favoriteSports: string[];
  favoriteTeams: string[];
  
  // Notification preferences
  enablePushNotifications: boolean;
  notifyBeforeGames: boolean;
  notifyForFavoriteTeams: boolean;
  notifyForBettingOpportunities: boolean;
  
  // Betting preferences
  riskTolerance: 'low' | 'medium' | 'high';
  defaultBetUnit: number;
  preferredOddsFormat: 'american' | 'decimal' | 'fractional';
  
  // Display preferences
  showLiveScores: boolean;
  showPredictionConfidence: boolean;
  showBettingHistory: boolean;
  
  // Privacy preferences
  shareDataForBetterPredictions: boolean;
  anonymousUsageStats: boolean;
}

/**
 * Default user preferences
 */
const DEFAULT_PREFERENCES: UserPreferences = {
  // Theme preferences
  darkMode: true,
  accentColor: '#0088ff',
  
  // Content preferences
  favoriteLeagues: [],
  favoriteSports: [],
  favoriteTeams: [],
  
  // Notification preferences
  enablePushNotifications: true,
  notifyBeforeGames: true,
  notifyForFavoriteTeams: true,
  notifyForBettingOpportunities: true,
  
  // Betting preferences
  riskTolerance: 'medium',
  defaultBetUnit: 10,
  preferredOddsFormat: 'american',
  
  // Display preferences
  showLiveScores: true,
  showPredictionConfidence: true,
  showBettingHistory: true,
  
  // Privacy preferences
  shareDataForBetterPredictions: true,
  anonymousUsageStats: true,
};

/**
 * User betting history interface
 */
export interface BettingHistoryItem {
  id: string;
  date: string;
  sport: string;
  league: string;
  teams: string[];
  betType: string;
  odds: number;
  stake: number;
  result: 'win' | 'loss' | 'push' | 'pending';
  payout?: number;
  aiRecommended: boolean;
  notes?: string;
}

/**
 * User profile interface
 */
export interface UserProfile {
  displayName?: string;
  avatar?: string;
  joinDate: string;
  subscriptionTier: 'free' | 'pro' | 'elite';
  subscriptionExpiry?: string;
  totalBets: number;
  winRate: number;
  roi: number;
  badges: string[];
  achievements: string[];
  referralCode?: string;
  referralCount: number;
}

/**
 * Personalized content interface
 */
export interface PersonalizedContent {
  recommendedBets: any[];
  trendingBets: any[];
  upcomingGames: any[];
  relevantNews: any[];
  insights: any[];
}

/**
 * Storage keys
 */
const STORAGE_KEYS = {
  USER_PREFERENCES: 'user_preferences',
  BETTING_HISTORY: 'betting_history',
  USER_PROFILE: 'user_profile',
};

/**
 * Personalization service
 */
class PersonalizationService {
  private preferences: UserPreferences | null = null;
  private bettingHistory: BettingHistoryItem[] = [];
  private userProfile: UserProfile | null = null;
  
  /**
   * Initialize the personalization service
   */
  async initialize(): Promise<void> {
    try {
      // Load user preferences
      await this.loadPreferences();
      
      // Load betting history
      await this.loadBettingHistory();
      
      // Load user profile
      await this.loadUserProfile();
      
      // Log initialization
      console.log('Personalization service initialized');
    } catch (error) {
      console.error('Error initializing personalization service:', error);
    }
  }
  
  /**
   * Load user preferences from storage
   */
  private async loadPreferences(): Promise<void> {
    try {
      const storedPreferences = await AsyncStorage.getItem(STORAGE_KEYS.USER_PREFERENCES);
      
      if (storedPreferences) {
        this.preferences = JSON.parse(storedPreferences);
      } else {
        // Use default preferences if none are stored
        this.preferences = DEFAULT_PREFERENCES;
        await this.savePreferences();
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
      this.preferences = DEFAULT_PREFERENCES;
    }
  }
  
  /**
   * Save user preferences to storage
   */
  private async savePreferences(): Promise<void> {
    try {
      if (this.preferences) {
        await AsyncStorage.setItem(STORAGE_KEYS.USER_PREFERENCES, JSON.stringify(this.preferences));
      }
    } catch (error) {
      console.error('Error saving preferences:', error);
    }
  }
  
  /**
   * Load betting history from storage
   */
  private async loadBettingHistory(): Promise<void> {
    try {
      const storedHistory = await AsyncStorage.getItem(STORAGE_KEYS.BETTING_HISTORY);
      
      if (storedHistory) {
        this.bettingHistory = JSON.parse(storedHistory);
      }
    } catch (error) {
      console.error('Error loading betting history:', error);
    }
  }
  
  /**
   * Save betting history to storage
   */
  private async saveBettingHistory(): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.BETTING_HISTORY, JSON.stringify(this.bettingHistory));
    } catch (error) {
      console.error('Error saving betting history:', error);
    }
  }
  
  /**
   * Load user profile from storage
   */
  private async loadUserProfile(): Promise<void> {
    try {
      const storedProfile = await AsyncStorage.getItem(STORAGE_KEYS.USER_PROFILE);
      
      if (storedProfile) {
        this.userProfile = JSON.parse(storedProfile);
      } else {
        // Create default profile if none exists
        this.userProfile = {
          joinDate: new Date().toISOString(),
          subscriptionTier: 'free',
          totalBets: 0,
          winRate: 0,
          roi: 0,
          badges: [],
          achievements: [],
          referralCount: 0,
        };
        await this.saveUserProfile();
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  }
  
  /**
   * Save user profile to storage
   */
  private async saveUserProfile(): Promise<void> {
    try {
      if (this.userProfile) {
        await AsyncStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(this.userProfile));
      }
    } catch (error) {
      console.error('Error saving user profile:', error);
    }
  }
  
  /**
   * Get user preferences
   */
  getPreferences(): UserPreferences {
    return this.preferences || DEFAULT_PREFERENCES;
  }
  
  /**
   * Update user preferences
   */
  async updatePreferences(newPreferences: Partial<UserPreferences>): Promise<void> {
    try {
      if (!this.preferences) {
        this.preferences = DEFAULT_PREFERENCES;
      }
      
      // Merge new preferences with existing ones
      this.preferences = {
        ...this.preferences,
        ...newPreferences,
      } as UserPreferences;
      
      // Save updated preferences
      await this.savePreferences();
      
      // Track preference changes for analytics
      analyticsService.trackEvent('preferences_updated', {
        changedFields: Object.keys(newPreferences),
        platform: Platform.OS,
      });
    } catch (error) {
      console.error('Error updating preferences:', error);
    }
  }
  
  /**
   * Get betting history
   */
  getBettingHistory(): BettingHistoryItem[] {
    return this.bettingHistory;
  }
  
  /**
   * Add betting history item
   */
  async addBettingHistoryItem(item: Omit<BettingHistoryItem, 'id'>): Promise<void> {
    try {
      // Create new item with ID
      const newItem: BettingHistoryItem = {
        ...item,
        id: `bet_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      };
      
      // Add to history
      this.bettingHistory.unshift(newItem);
      
      // Save updated history
      await this.saveBettingHistory();
      
      // Update user profile stats
      if (this.userProfile) {
        this.userProfile.totalBets += 1;
        
        // Only update win rate and ROI for completed bets
        if (newItem.result !== 'pending') {
          const wins = this.bettingHistory.filter(bet => bet.result === 'win').length;
          this.userProfile.winRate = wins / this.userProfile.totalBets;
          
          // Calculate ROI
          const totalInvested = this.bettingHistory.reduce((sum, bet) => sum + bet.stake, 0);
          const totalReturns = this.bettingHistory.reduce((sum, bet) => {
            if (bet.result === 'win' && bet.payout) {
              return sum + bet.payout;
            }
            return sum;
          }, 0);
          
          this.userProfile.roi = totalInvested > 0 ? (totalReturns - totalInvested) / totalInvested : 0;
        }
        
        await this.saveUserProfile();
      }
      
      // Track for analytics
      analyticsService.trackEvent('bet_placed', {
        sport: item.sport,
        league: item.league,
        betType: item.betType,
        stake: item.stake,
        aiRecommended: item.aiRecommended,
      });
    } catch (error) {
      console.error('Error adding betting history item:', error);
    }
  }
  
  /**
   * Update betting history item
   */
  async updateBettingHistoryItem(id: string, updates: Partial<BettingHistoryItem>): Promise<void> {
    try {
      // Find item index
      const index = this.bettingHistory.findIndex(item => item.id === id);
      
      if (index !== -1) {
        // Update item
        this.bettingHistory[index] = {
          ...this.bettingHistory[index],
          ...updates,
        };
        
        // Save updated history
        await this.saveBettingHistory();
        
        // Update user profile stats if result changed
        if (updates.result && this.userProfile) {
          const wins = this.bettingHistory.filter(bet => bet.result === 'win').length;
          this.userProfile.winRate = wins / this.userProfile.totalBets;
          
          // Calculate ROI
          const totalInvested = this.bettingHistory.reduce((sum, bet) => sum + bet.stake, 0);
          const totalReturns = this.bettingHistory.reduce((sum, bet) => {
            if (bet.result === 'win' && bet.payout) {
              return sum + bet.payout;
            }
            return sum;
          }, 0);
          
          this.userProfile.roi = totalInvested > 0 ? (totalReturns - totalInvested) / totalInvested : 0;
          
          await this.saveUserProfile();
        }
        
        // Track for analytics
        analyticsService.trackEvent('bet_updated', {
          betId: id,
          updatedFields: Object.keys(updates),
        });
      }
    } catch (error) {
      console.error('Error updating betting history item:', error);
    }
  }
  
  /**
   * Get user profile
   */
  getUserProfile(): UserProfile | null {
    return this.userProfile;
  }
  
  /**
   * Update user profile
   */
  async updateUserProfile(updates: Partial<UserProfile>): Promise<void> {
    try {
      if (this.userProfile) {
        // Merge updates with existing profile
        this.userProfile = {
          ...this.userProfile,
          ...updates,
        };
        
        // Save updated profile
        await this.saveUserProfile();
        
        // Track for analytics
        analyticsService.trackEvent('profile_updated', {
          updatedFields: Object.keys(updates),
        });
      }
    } catch (error) {
      console.error('Error updating user profile:', error);
    }
  }
  
  /**
   * Get personalized content based on user preferences and history
   */
  async getPersonalizedContent(): Promise<PersonalizedContent> {
    try {
      // This would typically call an API to get personalized content
      // For now, we'll return mock data based on user preferences
      
      const prefs = this.getPreferences();
      const favoriteSports = prefs.favoriteSports;
      const favoriteTeams = prefs.favoriteTeams;
      
      // Track content request for analytics
      analyticsService.trackEvent('personalized_content_requested', {
        favoriteSportsCount: favoriteSports.length,
        favoriteTeamsCount: favoriteTeams.length,
      });
      
      // Return mock personalized content
      return {
        recommendedBets: [],
        trendingBets: [],
        upcomingGames: [],
        relevantNews: [],
        insights: [],
      };
    } catch (error) {
      console.error('Error getting personalized content:', error);
      return {
        recommendedBets: [],
        trendingBets: [],
        upcomingGames: [],
        relevantNews: [],
        insights: [],
      };
    }
  }
  
  /**
   * Add achievement to user profile
   */
  async addAchievement(achievement: string): Promise<void> {
    try {
      if (this.userProfile && !this.userProfile.achievements.includes(achievement)) {
        this.userProfile.achievements.push(achievement);
        await this.saveUserProfile();
        
        // Track for analytics
        analyticsService.trackEvent('achievement_earned', {
          achievement,
        });
      }
    } catch (error) {
      console.error('Error adding achievement:', error);
    }
  }
  
  /**
   * Add badge to user profile
   */
  async addBadge(badge: string): Promise<void> {
    try {
      if (this.userProfile && !this.userProfile.badges.includes(badge)) {
        this.userProfile.badges.push(badge);
        await this.saveUserProfile();
        
        // Track for analytics
        analyticsService.trackEvent('badge_earned', {
          badge,
        });
      }
    } catch (error) {
      console.error('Error adding badge:', error);
    }
  }
  
  /**
   * Get personalized recommendations based on betting history
   */
  async getPersonalizedRecommendations(): Promise<any[]> {
    try {
      // This would typically call an AI service to get recommendations
      // For now, we'll return mock data
      
      // Track recommendation request for analytics
      analyticsService.trackEvent('recommendations_requested', {
        historyItemsCount: this.bettingHistory.length,
      });
      
      // Return mock recommendations
      return [];
    } catch (error) {
      console.error('Error getting personalized recommendations:', error);
      return [];
    }
  }
}

export const personalizationService = new PersonalizationService();