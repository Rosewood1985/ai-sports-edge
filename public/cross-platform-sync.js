/**
 * Cross-Platform Synchronization for Web
 * Ensures consistent user experience between web and mobile platforms
 */

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

/**
 * Cross-Platform Sync Service for Web
 */
class CrossPlatformSyncService {
  constructor() {
    this.userId = null;
    this.isInitialized = false;
    this.syncInterval = null;
    this.purchasedOdds = [];
    this.userPreferences = {
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
  }

  /**
   * Initialize the service with user ID
   */
  async initialize(userId) {
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
  async loadLocalData() {
    try {
      // Load purchased odds
      const purchasedOddsJson = localStorage.getItem(STORAGE_KEYS.PURCHASED_ODDS);
      if (purchasedOddsJson) {
        this.purchasedOdds = JSON.parse(purchasedOddsJson);
      }
      
      // Load user preferences
      const userPreferencesJson = localStorage.getItem(STORAGE_KEYS.USER_PREFERENCES);
      if (userPreferencesJson) {
        this.userPreferences = {
          ...this.userPreferences,
          ...JSON.parse(userPreferencesJson),
        };
      }
      
      // Load individual preferences if not loaded from combined object
      if (!userPreferencesJson) {
        // Load favorite teams
        const favoriteTeamsJson = localStorage.getItem(STORAGE_KEYS.FAVORITE_TEAMS);
        if (favoriteTeamsJson) {
          this.userPreferences.favoriteTeams = JSON.parse(favoriteTeamsJson);
        }
        
        // Load primary team
        const primaryTeam = localStorage.getItem(STORAGE_KEYS.PRIMARY_TEAM);
        if (primaryTeam) {
          this.userPreferences.primaryTeam = primaryTeam;
        }
        
        // Load button settings
        const buttonSettingsJson = localStorage.getItem(STORAGE_KEYS.BUTTON_SETTINGS);
        if (buttonSettingsJson) {
          this.userPreferences.buttonSettings = JSON.parse(buttonSettingsJson);
        }
        
        // Load affiliate enabled
        const affiliateEnabled = localStorage.getItem(STORAGE_KEYS.AFFILIATE_ENABLED);
        if (affiliateEnabled !== null) {
          this.userPreferences.affiliateEnabled = affiliateEnabled === 'true';
        }
        
        // Load affiliate code
        const affiliateCode = localStorage.getItem(STORAGE_KEYS.AFFILIATE_CODE);
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
  async syncWithCloud() {
    if (!this.userId) {
      console.warn('Cannot sync with cloud: No user ID');
      return;
    }
    
    try {
      // Get last sync timestamp
      const lastSyncJson = localStorage.getItem(STORAGE_KEYS.LAST_SYNC_TIMESTAMP);
      const lastSync = lastSyncJson ? parseInt(lastSyncJson, 10) : 0;
      const currentTime = Date.now();
      
      // Fetch cloud data
      const response = await fetch(`/api/user-data?userId=${this.userId}&lastSync=${lastSync}`);
      
      if (response.ok) {
        const cloudData = await response.json();
        
        if (cloudData) {
          // Merge purchased odds
          if (cloudData.purchasedOdds && cloudData.purchasedOdds.length > 0) {
            // Create a map of existing purchases by gameId
            const existingPurchases = new Map(
              this.purchasedOdds.map(purchase => [purchase.gameId, purchase])
            );
            
            // Add new purchases from cloud
            cloudData.purchasedOdds.forEach(cloudPurchase => {
              const existingPurchase = existingPurchases.get(cloudPurchase.gameId);
              
              // If we don't have this purchase or cloud version is newer, use cloud version
              if (!existingPurchase || cloudPurchase.timestamp > existingPurchase.timestamp) {
                existingPurchases.set(cloudPurchase.gameId, cloudPurchase);
              }
            });
            
            // Convert map back to array
            this.purchasedOdds = Array.from(existingPurchases.values());
            
            // Save to local storage
            localStorage.setItem(
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
              localStorage.setItem(
                STORAGE_KEYS.USER_PREFERENCES,
                JSON.stringify(this.userPreferences)
              );
              
              // Also save individual preferences for backward compatibility
              localStorage.setItem(
                STORAGE_KEYS.FAVORITE_TEAMS,
                JSON.stringify(this.userPreferences.favoriteTeams)
              );
              
              localStorage.setItem(
                STORAGE_KEYS.PRIMARY_TEAM,
                this.userPreferences.primaryTeam
              );
              
              localStorage.setItem(
                STORAGE_KEYS.BUTTON_SETTINGS,
                JSON.stringify(this.userPreferences.buttonSettings)
              );
              
              localStorage.setItem(
                STORAGE_KEYS.AFFILIATE_ENABLED,
                String(this.userPreferences.affiliateEnabled)
              );
              
              localStorage.setItem(
                STORAGE_KEYS.AFFILIATE_CODE,
                this.userPreferences.affiliateCode
              );
            }
          }
        }
      }
      
      // Push local changes to cloud
      await this.pushLocalChangesToCloud();
      
      // Update last sync timestamp
      localStorage.setItem(
        STORAGE_KEYS.LAST_SYNC_TIMESTAMP,
        currentTime.toString()
      );
      
      console.log('Synced with cloud successfully');
    } catch (error) {
      console.error('Error syncing with cloud:', error);
      
      // Track sync error
      if (window.analyticsService) {
        window.analyticsService.trackError(error);
      }
    }
  }

  /**
   * Push local changes to cloud
   */
  async pushLocalChangesToCloud() {
    if (!this.userId) {
      return;
    }
    
    try {
      // Add current platform info to user preferences
      const updatedPreferences = {
        ...this.userPreferences,
        lastUpdated: Date.now(),
        lastPlatform: 'web',
      };
      
      // Push to server
      await fetch('/api/update-user-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: this.userId,
          purchasedOdds: this.purchasedOdds,
          userPreferences: updatedPreferences,
        }),
      });
    } catch (error) {
      console.error('Error pushing local changes to cloud:', error);
    }
  }

  /**
   * Check if user has purchased odds for a game
   */
  hasPurchasedOdds(gameId) {
    return this.purchasedOdds.some(purchase => purchase.gameId === gameId);
  }

  /**
   * Record a new odds purchase
   */
  async recordOddsPurchase(gameId) {
    try {
      // Create purchase record
      const purchase = {
        gameId,
        timestamp: Date.now(),
        platform: 'web',
      };
      
      // Add to local array
      this.purchasedOdds.push(purchase);
      
      // Save to local storage
      localStorage.setItem(
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
  async updateUserPreferences(preferences) {
    try {
      // Update local preferences
      this.userPreferences = {
        ...this.userPreferences,
        ...preferences,
      };
      
      // Save to local storage
      localStorage.setItem(
        STORAGE_KEYS.USER_PREFERENCES,
        JSON.stringify(this.userPreferences)
      );
      
      // Also save individual preferences for backward compatibility
      if (preferences.favoriteTeams) {
        localStorage.setItem(
          STORAGE_KEYS.FAVORITE_TEAMS,
          JSON.stringify(preferences.favoriteTeams)
        );
      }
      
      if (preferences.primaryTeam) {
        localStorage.setItem(
          STORAGE_KEYS.PRIMARY_TEAM,
          preferences.primaryTeam
        );
      }
      
      if (preferences.buttonSettings) {
        localStorage.setItem(
          STORAGE_KEYS.BUTTON_SETTINGS,
          JSON.stringify(preferences.buttonSettings)
        );
      }
      
      if (preferences.affiliateEnabled !== undefined) {
        localStorage.setItem(
          STORAGE_KEYS.AFFILIATE_ENABLED,
          String(preferences.affiliateEnabled)
        );
      }
      
      if (preferences.affiliateCode) {
        localStorage.setItem(
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
  getUserPreferences() {
    return { ...this.userPreferences };
  }

  /**
   * Clean up resources
   */
  cleanup() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }
}

// Create and export the service
window.crossPlatformSyncService = new CrossPlatformSyncService();

// Initialize with a mock user ID for demo purposes
// In a real app, this would be initialized with the actual user ID after login
document.addEventListener('DOMContentLoaded', () => {
  const mockUserId = localStorage.getItem('mockUserId') || `user_${Math.random().toString(36).substring(2)}`;
  localStorage.setItem('mockUserId', mockUserId);
  
  window.crossPlatformSyncService.initialize(mockUserId).catch(err => 
    console.error('Error initializing cross-platform sync service:', err)
  );
});