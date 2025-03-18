/**
 * Cross-Platform Synchronization Service for Web
 * Ensures consistent user experience between web and mobile platforms
 */

// Mock firebaseService for web
const firebaseService = {
  getUserData: async (userId, lastSync) => {
    console.log('Getting user data from Firebase for', userId);
    return null;
  },
  updateUserData: async (userId, data) => {
    console.log('Updating user data in Firebase for', userId);
  }
};

class CrossPlatformSyncService {
  constructor() {
    this.userId = null;
    this.isInitialized = false;
    this.syncInterval = null;
    this.purchasedOdds = [];
    this.userPreferences = {
      favoriteTeams: [],
      primaryTeam: '',
      buttonSettings: {},
      affiliateEnabled: true,
      affiliateCode: '',
    };
    
    // Initialize event listeners for cross-tab communication
    this.initEventListeners();
  }
  
  /**
   * Initialize event listeners for cross-tab communication
   */
  initEventListeners() {
    // Listen for storage events to sync between tabs
    window.addEventListener('storage', (event) => {
      if (event.key === 'purchased_odds') {
        try {
          this.purchasedOdds = JSON.parse(event.newValue || '[]');
          // Dispatch custom event for components to listen to
          window.dispatchEvent(new CustomEvent('purchasedOddsUpdated', {
            detail: { purchasedOdds: this.purchasedOdds }
          }));
        } catch (error) {
          console.error('Error parsing purchased odds from storage event:', error);
        }
      }
    });
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
      const purchasedOddsJson = localStorage.getItem('purchased_odds');
      if (purchasedOddsJson) {
        this.purchasedOdds = JSON.parse(purchasedOddsJson);
      }
      
      // Load user preferences
      const userPreferencesJson = localStorage.getItem('user_preferences');
      if (userPreferencesJson) {
        this.userPreferences = {
          ...this.userPreferences,
          ...JSON.parse(userPreferencesJson),
        };
      }
      
      // Load individual preferences if not loaded from combined object
      if (!userPreferencesJson) {
        // Load favorite teams
        const favoriteTeamsJson = localStorage.getItem('favorite_teams');
        if (favoriteTeamsJson) {
          this.userPreferences.favoriteTeams = JSON.parse(favoriteTeamsJson);
        }
        
        // Load primary team
        const primaryTeam = localStorage.getItem('primary_team');
        if (primaryTeam) {
          this.userPreferences.primaryTeam = primaryTeam;
        }
        
        // Load button settings
        const buttonSettingsJson = localStorage.getItem('button_settings');
        if (buttonSettingsJson) {
          this.userPreferences.buttonSettings = JSON.parse(buttonSettingsJson);
        }
        
        // Load affiliate enabled
        const affiliateEnabled = localStorage.getItem('affiliate_enabled');
        if (affiliateEnabled !== null) {
          this.userPreferences.affiliateEnabled = affiliateEnabled === 'true';
        }
        
        // Load affiliate code
        const affiliateCode = localStorage.getItem('affiliate_code');
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
      const lastSyncJson = localStorage.getItem('last_sync_timestamp');
      const lastSync = lastSyncJson ? parseInt(lastSyncJson, 10) : 0;
      const currentTime = Date.now();
      
      // Fetch cloud data
      const cloudData = await firebaseService.getUserData(this.userId, lastSync);
      
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
            'purchased_odds',
            JSON.stringify(this.purchasedOdds)
          );
          
          // Dispatch custom event for components to listen to
          window.dispatchEvent(new CustomEvent('purchasedOddsUpdated', {
            detail: { purchasedOdds: this.purchasedOdds }
          }));
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
              'user_preferences',
              JSON.stringify(this.userPreferences)
            );
            
            // Also save individual preferences for backward compatibility
            localStorage.setItem(
              'favorite_teams',
              JSON.stringify(this.userPreferences.favoriteTeams)
            );
            
            localStorage.setItem(
              'primary_team',
              this.userPreferences.primaryTeam
            );
            
            localStorage.setItem(
              'button_settings',
              JSON.stringify(this.userPreferences.buttonSettings)
            );
            
            localStorage.setItem(
              'affiliate_enabled',
              String(this.userPreferences.affiliateEnabled)
            );
            
            localStorage.setItem(
              'affiliate_code',
              this.userPreferences.affiliateCode
            );
          }
        }
      }
      
      // Push local changes to cloud
      await this.pushLocalChangesToCloud();
      
      // Update last sync timestamp
      localStorage.setItem(
        'last_sync_timestamp',
        currentTime.toString()
      );
      
      console.log('Synced with cloud successfully');
    } catch (error) {
      console.error('Error syncing with cloud:', error);
      
      // Track sync error
      if (window.analyticsService) {
        window.analyticsService.trackError(error instanceof Error ? error : new Error('Unknown sync error'), {
          userId: this.userId,
          context: 'cross_platform_sync',
        });
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
      
      // Push to Firebase
      await firebaseService.updateUserData(this.userId, {
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
        'purchased_odds',
        JSON.stringify(this.purchasedOdds)
      );
      
      // Dispatch custom event for components to listen to
      window.dispatchEvent(new CustomEvent('purchasedOddsUpdated', {
        detail: { purchasedOdds: this.purchasedOdds }
      }));
      
      // Sync with cloud immediately
      this.syncWithCloud().catch(err => 
        console.error('Error syncing purchase with cloud:', err)
      );
      
      console.log('Recorded odds purchase for game:', gameId);
      return true;
    } catch (error) {
      console.error('Error recording odds purchase:', error);
      return false;
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
        'user_preferences',
        JSON.stringify(this.userPreferences)
      );
      
      // Also save individual preferences for backward compatibility
      if (preferences.favoriteTeams) {
        localStorage.setItem(
          'favorite_teams',
          JSON.stringify(preferences.favoriteTeams)
        );
      }
      
      if (preferences.primaryTeam) {
        localStorage.setItem(
          'primary_team',
          preferences.primaryTeam
        );
      }
      
      if (preferences.buttonSettings) {
        localStorage.setItem(
          'button_settings',
          JSON.stringify(preferences.buttonSettings)
        );
      }
      
      if (preferences.affiliateEnabled !== undefined) {
        localStorage.setItem(
          'affiliate_enabled',
          String(preferences.affiliateEnabled)
        );
      }
      
      if (preferences.affiliateCode) {
        localStorage.setItem(
          'affiliate_code',
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

// Create and export singleton instance
const crossPlatformSyncService = new CrossPlatformSyncService();

// Make it globally available
window.crossPlatformSyncService = crossPlatformSyncService;

export default crossPlatformSyncService;