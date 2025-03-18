/**
 * Cross-Platform Synchronization Service
 * Ensures consistent user experience between web and mobile platforms
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { analyticsService } from './analyticsService';
import axios from 'axios';
import { API_CONFIG } from '../config/affiliateConfig';

// Storage keys
const STORAGE_KEYS = {
  AFFILIATE_CODE: 'betting_affiliate_code',
  AFFILIATE_ENABLED: 'betting_affiliate_enabled',
  BUTTON_SETTINGS: 'betting_affiliate_button_settings',
  FAVORITE_TEAMS: 'favorite_teams',
  PRIMARY_TEAM: 'primary_team',
  PURCHASED_ODDS: 'purchased_odds',
  USER_PREFERENCES: 'user_preferences',
  LAST_SYNC_TIMESTAMP: 'last_sync_timestamp',
};

// Define types
export interface PurchasedOdds {
  gameId: string;
  timestamp: number;
  platform: string;
}

export interface UserPreferences {
  favoriteTeams: string[];
  primaryTeam: string;
  buttonSettings: any;
  affiliateEnabled: boolean;
  affiliateCode: string;
  lastUpdated?: number;
  lastPlatform?: string;
}

class CrossPlatformSyncService {
  private userId: string | null = null;
  private isInitialized: boolean = false;
  private syncInterval: any = null;
  private purchasedOdds: PurchasedOdds[] = [];
  private userPreferences: UserPreferences = {
    favoriteTeams: [],
    primaryTeam: '',
    buttonSettings: {
      size: 'medium',
      animation: 'pulse',
      position: 'inline',
      style: 'default'
    },
    affiliateEnabled: true,
    affiliateCode: '',
  };

  /**
   * Initialize the service with user ID
   */
  async initialize(userId: string): Promise<void> {
    if (this.isInitialized && this.userId === userId) {
      return;
    }

    this.userId = userId;
    
    try {
      // Load local data first
      await this.loadLocalData();
      
      // Then sync with cloud
      await this.syncWithCloud();
      
      // Set up periodic sync
      if (this.syncInterval) {
        clearInterval(this.syncInterval);
      }
      
      this.syncInterval = setInterval(() => {
        this.syncWithCloud().catch(err => 
          console.error('Background sync failed:', err)
        );
      }, 60000); // Sync every minute
      
      this.isInitialized = true;
      console.log('Cross-platform sync service initialized');
    } catch (error) {
      console.error('Error initializing cross-platform sync service:', error);
    }
  }

  /**
   * Load data from local storage
   */
  private async loadLocalData(): Promise<void> {
    try {
      // Load purchased odds
      const purchasedOddsJson = await AsyncStorage.getItem(STORAGE_KEYS.PURCHASED_ODDS);
      if (purchasedOddsJson) {
        this.purchasedOdds = JSON.parse(purchasedOddsJson);
      }
      
      // Load user preferences
      const userPreferencesJson = await AsyncStorage.getItem(STORAGE_KEYS.USER_PREFERENCES);
      if (userPreferencesJson) {
        this.userPreferences = {
          ...this.userPreferences,
          ...JSON.parse(userPreferencesJson),
        };
      }
      
      // Load individual preferences if not loaded from combined object
      if (!userPreferencesJson) {
        // Load favorite teams
        const favoriteTeamsJson = await AsyncStorage.getItem(STORAGE_KEYS.FAVORITE_TEAMS);
        if (favoriteTeamsJson) {
          this.userPreferences.favoriteTeams = JSON.parse(favoriteTeamsJson);
        }
        
        // Load primary team
        const primaryTeam = await AsyncStorage.getItem(STORAGE_KEYS.PRIMARY_TEAM);
        if (primaryTeam) {
          this.userPreferences.primaryTeam = primaryTeam;
        }
        
        // Load button settings
        const buttonSettingsJson = await AsyncStorage.getItem(STORAGE_KEYS.BUTTON_SETTINGS);
        if (buttonSettingsJson) {
          this.userPreferences.buttonSettings = JSON.parse(buttonSettingsJson);
        }
        
        // Load affiliate enabled
        const affiliateEnabled = await AsyncStorage.getItem(STORAGE_KEYS.AFFILIATE_ENABLED);
        if (affiliateEnabled !== null) {
          this.userPreferences.affiliateEnabled = affiliateEnabled === 'true';
        }
        
        // Load affiliate code
        const affiliateCode = await AsyncStorage.getItem(STORAGE_KEYS.AFFILIATE_CODE);
        if (affiliateCode) {
          this.userPreferences.affiliateCode = affiliateCode;
        }
      }
    } catch (error) {
      console.error('Error loading local data:', error);
    }
  }

  /**
   * Sync with cloud data
   */
  async syncWithCloud(): Promise<void> {
    if (!this.userId) {
      console.warn('Cannot sync with cloud: No user ID');
      return;
    }
    
    try {
      // Get last sync timestamp
      const lastSyncJson = await AsyncStorage.getItem(STORAGE_KEYS.LAST_SYNC_TIMESTAMP);
      const lastSync = lastSyncJson ? parseInt(lastSyncJson, 10) : 0;
      const currentTime = Date.now();
      
      // Fetch cloud data
      const response = await axios.get(`${API_CONFIG.BASE_URL}/api/user-data`, {
        params: {
          userId: this.userId,
          lastSync
        }
      });
      
      if (response.status === 200 && response.data) {
        const cloudData = response.data;
        
        // Merge purchased odds
        if (cloudData.purchasedOdds && cloudData.purchasedOdds.length > 0) {
          // Create a map of existing purchases by gameId
          const existingPurchases = new Map(
            this.purchasedOdds.map(purchase => [purchase.gameId, purchase])
          );
          
          // Add new purchases from cloud
          cloudData.purchasedOdds.forEach((cloudPurchase: PurchasedOdds) => {
            const existingPurchase = existingPurchases.get(cloudPurchase.gameId);
            
            // If we don't have this purchase or cloud version is newer, use cloud version
            if (!existingPurchase || cloudPurchase.timestamp > existingPurchase.timestamp) {
              existingPurchases.set(cloudPurchase.gameId, cloudPurchase);
            }
          });
          
          // Convert map back to array
          this.purchasedOdds = Array.from(existingPurchases.values());
          
          // Save to local storage
          await AsyncStorage.setItem(
            STORAGE_KEYS.PURCHASED_ODDS, 
            JSON.stringify(this.purchasedOdds)
          );
        }
        
        // Merge user preferences
        if (cloudData.userPreferences) {
          // Only update if cloud data is newer
          if (!this.userPreferences.lastUpdated || 
              (cloudData.userPreferences.lastUpdated && 
               cloudData.userPreferences.lastUpdated > (this.userPreferences.lastUpdated || 0))) {
            this.userPreferences = {
              ...this.userPreferences,
              ...cloudData.userPreferences,
            };
            
            // Save to local storage
            await AsyncStorage.setItem(
              STORAGE_KEYS.USER_PREFERENCES,
              JSON.stringify(this.userPreferences)
            );
            
            // Also save individual preferences for backward compatibility
            await AsyncStorage.setItem(
              STORAGE_KEYS.FAVORITE_TEAMS,
              JSON.stringify(this.userPreferences.favoriteTeams)
            );
            
            await AsyncStorage.setItem(
              STORAGE_KEYS.PRIMARY_TEAM,
              this.userPreferences.primaryTeam
            );
            
            await AsyncStorage.setItem(
              STORAGE_KEYS.BUTTON_SETTINGS,
              JSON.stringify(this.userPreferences.buttonSettings)
            );
            
            await AsyncStorage.setItem(
              STORAGE_KEYS.AFFILIATE_ENABLED,
              String(this.userPreferences.affiliateEnabled)
            );
            
            await AsyncStorage.setItem(
              STORAGE_KEYS.AFFILIATE_CODE,
              this.userPreferences.affiliateCode
            );
          }
        }
      }
      
      // Push local changes to cloud
      await this.pushLocalChangesToCloud();
      
      // Update last sync timestamp
      await AsyncStorage.setItem(
        STORAGE_KEYS.LAST_SYNC_TIMESTAMP,
        currentTime.toString()
      );
      
      console.log('Synced with cloud successfully');
    } catch (error) {
      console.error('Error syncing with cloud:', error);
      
      // Track sync error
      analyticsService.trackError(error instanceof Error ? error : new Error('Unknown sync error'), {
        userId: this.userId,
        context: 'cross_platform_sync',
      });
    }
  }

  /**
   * Push local changes to cloud
   */
  private async pushLocalChangesToCloud(): Promise<void> {
    if (!this.userId) {
      return;
    }
    
    try {
      // Add current platform info to user preferences
      const updatedPreferences = {
        ...this.userPreferences,
        lastUpdated: Date.now(),
        lastPlatform: Platform.OS,
      };
      
      // Push to server
      await axios.post(`${API_CONFIG.BASE_URL}/api/update-user-data`, {
        userId: this.userId,
        purchasedOdds: this.purchasedOdds,
        userPreferences: updatedPreferences,
      });
    } catch (error) {
      console.error('Error pushing local changes to cloud:', error);
    }
  }

  /**
   * Check if user has purchased odds for a game
   */
  hasPurchasedOdds(gameId: string): boolean {
    return this.purchasedOdds.some(purchase => purchase.gameId === gameId);
  }

  /**
   * Record a new odds purchase
   */
  async recordOddsPurchase(gameId: string): Promise<void> {
    try {
      // Create purchase record
      const purchase: PurchasedOdds = {
        gameId,
        timestamp: Date.now(),
        platform: Platform.OS,
      };
      
      // Add to local array
      this.purchasedOdds.push(purchase);
      
      // Save to local storage
      await AsyncStorage.setItem(
        STORAGE_KEYS.PURCHASED_ODDS,
        JSON.stringify(this.purchasedOdds)
      );
      
      // Sync with cloud immediately
      this.syncWithCloud().catch(err => 
        console.error('Error syncing purchase with cloud:', err)
      );
      
      console.log('Recorded odds purchase for game:', gameId);
    } catch (error) {
      console.error('Error recording odds purchase:', error);
    }
  }

  /**
   * Update user preferences
   */
  async updateUserPreferences(preferences: Partial<UserPreferences>): Promise<void> {
    try {
      // Update local preferences
      this.userPreferences = {
        ...this.userPreferences,
        ...preferences,
      };
      
      // Save to local storage
      await AsyncStorage.setItem(
        STORAGE_KEYS.USER_PREFERENCES,
        JSON.stringify(this.userPreferences)
      );
      
      // Also save individual preferences for backward compatibility
      if (preferences.favoriteTeams) {
        await AsyncStorage.setItem(
          STORAGE_KEYS.FAVORITE_TEAMS,
          JSON.stringify(preferences.favoriteTeams)
        );
      }
      
      if (preferences.primaryTeam) {
        await AsyncStorage.setItem(
          STORAGE_KEYS.PRIMARY_TEAM,
          preferences.primaryTeam
        );
      }
      
      if (preferences.buttonSettings) {
        await AsyncStorage.setItem(
          STORAGE_KEYS.BUTTON_SETTINGS,
          JSON.stringify(preferences.buttonSettings)
        );
      }
      
      if (preferences.affiliateEnabled !== undefined) {
        await AsyncStorage.setItem(
          STORAGE_KEYS.AFFILIATE_ENABLED,
          String(preferences.affiliateEnabled)
        );
      }
      
      if (preferences.affiliateCode) {
        await AsyncStorage.setItem(
          STORAGE_KEYS.AFFILIATE_CODE,
          preferences.affiliateCode
        );
      }
      
      // Sync with cloud
      this.syncWithCloud().catch(err => 
        console.error('Error syncing preferences with cloud:', err)
      );
    } catch (error) {
      console.error('Error updating user preferences:', error);
    }
  }

  /**
   * Get user preferences
   */
  getUserPreferences(): UserPreferences {
    return { ...this.userPreferences };
  }

  /**
   * Clean up resources
   */
  cleanup(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }
}

export const crossPlatformSyncService = new CrossPlatformSyncService();