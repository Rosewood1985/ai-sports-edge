/**
 * Microtransaction Service
 * 
 * This service identifies and manages microtransaction opportunities throughout the app.
 * It provides functions to determine when and where to show microtransaction options,
 * track user interactions, and optimize conversion rates.
 */

import { firebaseService } from '../src/atomic/organisms/firebaseService';
import '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { analyticsService } from './analyticsService';
import { FEATURE_FLAGS, STRIPE_CONFIG } from '../config/affiliateConfig';
import { fanduelCookieService } from './fanduelCookieService';
import apiService from './apiService';
import { auth } from '../config/firebase';

// Storage keys
const STORAGE_KEYS = {
  MICROTRANSACTION_HISTORY: 'microtransaction_history',
  USER_PREFERENCES: 'user_microtransaction_preferences',
  CONVERSION_TRACKING: 'microtransaction_conversion_tracking',
  LAST_SHOWN_TIMESTAMPS: 'microtransaction_last_shown_timestamps',
  RECENT_OPPORTUNITIES: 'microtransaction_recent_opportunities',
};

// Microtransaction types
export const MICROTRANSACTION_TYPES = {
  ODDS_ACCESS: 'odds_access',
  PREMIUM_STATS: 'premium_stats',
  EXPERT_PICKS: 'expert_picks',
  PLAYER_COMPARISON: 'player_comparison',
  TEAM_INSIGHTS: 'team_insights',
  INJURY_REPORTS: 'injury_reports',
  BETTING_TRENDS: 'betting_trends',
  HISTORICAL_MATCHUPS: 'historical_matchups',
  LIVE_UPDATES: 'live_updates',
  PERSONALIZED_ALERTS: 'personalized_alerts',
  LIVE_PARLAY_ODDS: 'live_parlay_odds',
};

// Opportunity types
export const OPPORTUNITY_TYPES = {
  GAME_CARD: 'game_card',
  PLAYER_PROFILE: 'player_profile',
  TEAM_PAGE: 'team_page',
  ODDS_PAGE: 'odds_page',
  STATS_PAGE: 'stats_page',
  PREDICTION_PAGE: 'prediction_page',
  LIVE_FEED: 'live_feed',
  SEARCH_RESULTS: 'search_results',
  HOME_SCREEN: 'home_screen',
  NOTIFICATION: 'notification',
};

class MicrotransactionService {
  constructor() {
    // Initialize frequency control storage
    this.lastShownTimestamps = {};
    this.recentOpportunities = [];
    
    // Load from AsyncStorage if available
    this.loadFrequencyControlData();
  }
  
  /**
   * Load frequency control data from AsyncStorage
   * @private
   */
  async loadFrequencyControlData() {
    try {
      const lastShownData = await AsyncStorage.getItem(STORAGE_KEYS.LAST_SHOWN_TIMESTAMPS);
      if (lastShownData) {
        this.lastShownTimestamps = JSON.parse(lastShownData);
      }
      
      const recentOppsData = await AsyncStorage.getItem(STORAGE_KEYS.RECENT_OPPORTUNITIES);
      if (recentOppsData) {
        this.recentOpportunities = JSON.parse(recentOppsData);
      }
    } catch (error) {
      console.error('Error loading frequency control data:', error);
    }
  }
  
  /**
   * Save frequency control data to AsyncStorage
   * @private
   */
  async saveFrequencyControlData() {
    try {
      await AsyncStorage.setItem(
        STORAGE_KEYS.LAST_SHOWN_TIMESTAMPS,
        JSON.stringify(this.lastShownTimestamps)
      );
      
      await AsyncStorage.setItem(
        STORAGE_KEYS.RECENT_OPPORTUNITIES,
        JSON.stringify(this.recentOpportunities)
      );
    } catch (error) {
      console.error('Error saving frequency control data:', error);
    }
  }
  
  /**
   * Check if microtransactions are enabled
   * @returns {boolean} Whether microtransactions are enabled
   */
  isMicrotransactionsEnabled() {
    return FEATURE_FLAGS.ENABLE_MICROTRANSACTIONS;
  }
  
  /**
   * Check if a microtransaction opportunity should be shown based on frequency rules
   * @param {string} userId User ID
   * @param {string} contextType Context type (e.g., 'game_card')
   * @param {string} opportunityId Opportunity ID
   * @returns {boolean} Whether the opportunity should be shown
   */
  async shouldShowOpportunity(userId, contextType, opportunityId) {
    if (!userId) return true; // Always show for non-authenticated users
    
    const now = Date.now();
    const key = `${userId}_${contextType}_${opportunityId}`;
    
    // Check if this specific opportunity was shown recently (24-hour cooldown)
    if (this.lastShownTimestamps[key] &&
        (now - this.lastShownTimestamps[key]) < 24 * 60 * 60 * 1000) {
      return false;
    }
    
    // Check if we've shown too many opportunities recently (max 3 per hour)
    const oneHourAgo = now - 60 * 60 * 1000;
    const recentCount = this.recentOpportunities.filter(
      opp => opp.userId === userId && opp.timestamp > oneHourAgo
    ).length;
    
    if (recentCount >= 3) {
      return false;
    }
    
    // Get user preferences
    const prefs = await this.getUserPreferences(userId);
    if (!prefs.enableMicrotransactions) {
      return false;
    }
    
    // Update frequency control data
    this.lastShownTimestamps[key] = now;
    this.recentOpportunities.push({
      userId,
      contextType,
      opportunityId,
      timestamp: now
    });
    
    // Clean up old data (older than 7 days)
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
    this.recentOpportunities = this.recentOpportunities.filter(
      opp => opp.timestamp > sevenDaysAgo
    );
    
    // Save updated data
    this.saveFrequencyControlData();
    
    return true;
  }
  
  /**
   * Get microtransaction opportunities for a specific context
   * @param {string} contextType Type of context (e.g., 'game_card', 'player_profile')
   * @param {Object} contextData Data about the context
   * @param {Object} userData User data
   * @returns {Promise<Array>} Array of microtransaction opportunities
   */
  async getOpportunities(contextType, contextData, userData) {
    // If microtransactions are disabled, return empty array
    if (!this.isMicrotransactionsEnabled()) {
      return [];
    }
    
    // Get all potential opportunities based on context type
    let opportunities = [];
    switch (contextType) {
      case OPPORTUNITY_TYPES.GAME_CARD:
        opportunities = this.getGameCardOpportunities(contextData, userData);
        break;
      case OPPORTUNITY_TYPES.PLAYER_PROFILE:
        opportunities = this.getPlayerProfileOpportunities(contextData, userData);
        break;
      case OPPORTUNITY_TYPES.TEAM_PAGE:
        opportunities = this.getTeamPageOpportunities(contextData, userData);
        break;
      case OPPORTUNITY_TYPES.ODDS_PAGE:
        opportunities = this.getOddsPageOpportunities(contextData, userData);
        break;
      case OPPORTUNITY_TYPES.STATS_PAGE:
        opportunities = this.getStatsPageOpportunities(contextData, userData);
        break;
      case OPPORTUNITY_TYPES.PREDICTION_PAGE:
        opportunities = this.getPredictionPageOpportunities(contextData, userData);
        break;
      case OPPORTUNITY_TYPES.LIVE_FEED:
        opportunities = this.getLiveFeedOpportunities(contextData, userData);
        break;
      case OPPORTUNITY_TYPES.SEARCH_RESULTS:
        opportunities = this.getSearchResultsOpportunities(contextData, userData);
        break;
      case OPPORTUNITY_TYPES.HOME_SCREEN:
        opportunities = this.getHomeScreenOpportunities(contextData, userData);
        break;
      case OPPORTUNITY_TYPES.NOTIFICATION:
        opportunities = this.getNotificationOpportunities(contextData, userData);
        break;
      default:
        opportunities = [];
    }
    
    // Filter opportunities based on frequency rules
    if (userData && userData.id) {
      const filteredOpportunities = [];
      
      for (const opportunity of opportunities) {
        const opportunityId = opportunity.type + (opportunity.gameId || opportunity.playerId || opportunity.teamId || '');
        const shouldShow = await this.shouldShowOpportunity(userData.id, contextType, opportunityId);
        
        if (shouldShow) {
          filteredOpportunities.push(opportunity);
        }
      }
      
      return filteredOpportunities;
    }
    
    return opportunities;
  }
  
  /**
   * Get microtransaction opportunities for game cards
   * @param {Object} gameData Game data
   * @param {Object} userData User data
   * @returns {Array} Array of microtransaction opportunities
   */
  getGameCardOpportunities(gameData, userData) {
    const opportunities = [];
    
    // Check if user has already purchased odds for this game
    const hasPurchasedOdds = userData.purchases?.includes(gameData.id);
    
    // If user hasn't purchased odds, add odds access opportunity
    if (!hasPurchasedOdds) {
      opportunities.push({
        type: MICROTRANSACTION_TYPES.ODDS_ACCESS,
        gameId: gameData.id,
        price: STRIPE_CONFIG.PRICING.ODDS_ACCESS,
        title: 'Get Odds',
        description: 'Unlock betting odds for this game',
        buttonText: 'Get Odds',
        priority: 1,
        cookieEnabled: true,
      });
    }
    
    // Add premium stats opportunity
    opportunities.push({
      type: MICROTRANSACTION_TYPES.PREMIUM_STATS,
      gameId: gameData.id,
      price: 299, // $2.99
      title: 'Premium Stats',
      description: 'Unlock advanced statistics for this game',
      buttonText: 'Get Stats',
      priority: 2,
      cookieEnabled: true,
    });
    
    // Add expert picks opportunity
    opportunities.push({
      type: MICROTRANSACTION_TYPES.EXPERT_PICKS,
      gameId: gameData.id,
      price: 399, // $3.99
      title: 'Expert Picks',
      description: 'See what our experts are predicting',
      buttonText: 'Get Picks',
      priority: 3,
      cookieEnabled: true,
    });
    
    return opportunities;
  }
  
  /**
   * Get microtransaction opportunities for player profiles
   * @param {Object} playerData Player data
   * @param {Object} userData User data
   * @returns {Array} Array of microtransaction opportunities
   */
  getPlayerProfileOpportunities(playerData, userData) {
    const opportunities = [];
    
    // Add player comparison opportunity
    opportunities.push({
      type: MICROTRANSACTION_TYPES.PLAYER_COMPARISON,
      playerId: playerData.id,
      price: 199, // $1.99
      title: 'Player Comparison',
      description: 'Compare this player with others',
      buttonText: 'Compare',
      priority: 1,
      cookieEnabled: true,
    });
    
    // Add premium stats opportunity
    opportunities.push({
      type: MICROTRANSACTION_TYPES.PREMIUM_STATS,
      playerId: playerData.id,
      price: 299, // $2.99
      title: 'Premium Stats',
      description: 'Unlock advanced statistics for this player',
      buttonText: 'Get Stats',
      priority: 2,
      cookieEnabled: true,
    });
    
    // Add injury reports opportunity
    opportunities.push({
      type: MICROTRANSACTION_TYPES.INJURY_REPORTS,
      playerId: playerData.id,
      price: 149, // $1.49
      title: 'Injury Reports',
      description: 'Access detailed injury reports',
      buttonText: 'Get Reports',
      priority: 3,
      cookieEnabled: true,
    });
    
    return opportunities;
  }
  
  /**
   * Get microtransaction opportunities for team pages
   * @param {Object} teamData Team data
   * @param {Object} userData User data
   * @returns {Array} Array of microtransaction opportunities
   */
  getTeamPageOpportunities(teamData, userData) {
    const opportunities = [];
    
    // Add team insights opportunity
    opportunities.push({
      type: MICROTRANSACTION_TYPES.TEAM_INSIGHTS,
      teamId: teamData.id,
      price: 299, // $2.99
      title: 'Team Insights',
      description: 'Unlock advanced team analysis',
      buttonText: 'Get Insights',
      priority: 1,
      cookieEnabled: true,
    });
    
    // Add historical matchups opportunity
    opportunities.push({
      type: MICROTRANSACTION_TYPES.HISTORICAL_MATCHUPS,
      teamId: teamData.id,
      price: 249, // $2.49
      title: 'Historical Matchups',
      description: 'See how this team has performed against opponents',
      buttonText: 'Get History',
      priority: 2,
      cookieEnabled: true,
    });
    
    // Add betting trends opportunity
    opportunities.push({
      type: MICROTRANSACTION_TYPES.BETTING_TRENDS,
      teamId: teamData.id,
      price: 199, // $1.99
      title: 'Betting Trends',
      description: 'See betting trends for this team',
      buttonText: 'Get Trends',
      priority: 3,
      cookieEnabled: true,
    });
    
    return opportunities;
  }
  
  /**
   * Get microtransaction opportunities for odds pages
   * @param {Object} oddsData Odds data
   * @param {Object} userData User data
   * @returns {Array} Array of microtransaction opportunities
   */
  getOddsPageOpportunities(oddsData, userData) {
    const opportunities = [];
    
    // Add expert picks opportunity
    opportunities.push({
      type: MICROTRANSACTION_TYPES.EXPERT_PICKS,
      gameId: oddsData.gameId,
      price: 399, // $3.99
      title: 'Expert Picks',
      description: 'See what our experts are predicting',
      buttonText: 'Get Picks',
      priority: 1,
      cookieEnabled: true,
    });
    
    // Add betting trends opportunity
    opportunities.push({
      type: MICROTRANSACTION_TYPES.BETTING_TRENDS,
      gameId: oddsData.gameId,
      price: 199, // $1.99
      title: 'Betting Trends',
      description: 'See betting trends for this game',
      buttonText: 'Get Trends',
      priority: 2,
      cookieEnabled: true,
    });
    
    return opportunities;
  }
  
  /**
   * Get microtransaction opportunities for stats pages
   * @param {Object} statsData Stats data
   * @param {Object} userData User data
   * @returns {Array} Array of microtransaction opportunities
   */
  getStatsPageOpportunities(statsData, userData) {
    const opportunities = [];
    
    // Add premium stats opportunity
    opportunities.push({
      type: MICROTRANSACTION_TYPES.PREMIUM_STATS,
      entityId: statsData.entityId,
      entityType: statsData.entityType,
      price: 299, // $2.99
      title: 'Premium Stats',
      description: 'Unlock advanced statistics',
      buttonText: 'Get Stats',
      priority: 1,
      cookieEnabled: true,
    });
    
    return opportunities;
  }
  
  /**
   * Get microtransaction opportunities for prediction pages
   * @param {Object} predictionData Prediction data
   * @param {Object} userData User data
   * @returns {Array} Array of microtransaction opportunities
   */
  getPredictionPageOpportunities(predictionData, userData) {
    const opportunities = [];
    
    // Add expert picks opportunity
    opportunities.push({
      type: MICROTRANSACTION_TYPES.EXPERT_PICKS,
      gameId: predictionData.gameId,
      price: 399, // $3.99
      title: 'Expert Picks',
      description: 'See what our experts are predicting',
      buttonText: 'Get Picks',
      priority: 1,
      cookieEnabled: true,
    });
    
    return opportunities;
  }
  
  /**
   * Get microtransaction opportunities for live feeds
   * @param {Object} feedData Feed data
   * @param {Object} userData User data
   * @returns {Array} Array of microtransaction opportunities
   */
  getLiveFeedOpportunities(feedData, userData) {
    const opportunities = [];
    
    // Add live updates opportunity
    opportunities.push({
      type: MICROTRANSACTION_TYPES.LIVE_UPDATES,
      gameId: feedData.gameId,
      price: 149, // $1.49
      title: 'Live Updates',
      description: 'Get real-time updates for this game',
      buttonText: 'Get Updates',
      priority: 1,
      cookieEnabled: true,
    });
    
    return opportunities;
  }
  
  /**
   * Get microtransaction opportunities for search results
   * @param {Object} searchData Search data
   * @param {Object} userData User data
   * @returns {Array} Array of microtransaction opportunities
   */
  getSearchResultsOpportunities(searchData, userData) {
    // For search results, we'll return an empty array as microtransactions
    // in search results might be too intrusive
    return [];
  }
  
  /**
   * Get microtransaction opportunities for the home screen
   * @param {Object} homeData Home screen data
   * @param {Object} userData User data
   * @returns {Array} Array of microtransaction opportunities
   */
  getHomeScreenOpportunities(homeData, userData) {
    const opportunities = [];
    
    // Add personalized alerts opportunity
    opportunities.push({
      type: MICROTRANSACTION_TYPES.PERSONALIZED_ALERTS,
      price: 499, // $4.99
      title: 'Personalized Alerts',
      description: 'Get alerts for your favorite teams and players',
      buttonText: 'Get Alerts',
      priority: 1,
      cookieEnabled: true,
    });
    
    return opportunities;
  }
  
  /**
   * Get microtransaction opportunities for notifications
   * @param {Object} notificationData Notification data
   * @param {Object} userData User data
   * @returns {Array} Array of microtransaction opportunities
   */
  getNotificationOpportunities(notificationData, userData) {
    // For notifications, we'll return an empty array as microtransactions
    // in notifications might be too intrusive
    return [];
  }
  
  /**
   * Track microtransaction interaction
   * @param {string} interactionType Type of interaction (e.g., 'impression', 'click', 'purchase')
   * @param {Object} opportunityData Opportunity data
   * @param {Object} userData User data
   * @returns {Promise<boolean|Object>} Success status or purchase result
   */
  async trackInteraction(interactionType, opportunityData, userData) {
    try {
      // Create interaction data
      const interactionData = {
        interactionType,
        opportunityData,
        userData: {
          userId: userData.id,
          isPremium: userData.isPremium,
        },
        timestamp: Date.now(),
        platform: Platform.OS,
      };
      
      // Track interaction
      analyticsService.trackEvent('microtransaction_interaction', interactionData);
      
      // If this is a purchase, use the API service for server-side validation
      if (interactionType === 'purchase') {
        // Only authenticated users can make purchases
        if (!auth.currentUser) {
          throw new Error('User must be authenticated to make purchases');
        }
        
        try {
          // Get payment method (in a real app, this would be selected by the user)
          const paymentMethodId = 'pm_card_visa'; // Example payment method ID
          
          // Use the API service to make the purchase with server-side validation
          const result = await apiService.purchaseMicrotransaction(
            opportunityData.type,
            paymentMethodId
          );
          
          // If purchase is successful and cookies are enabled, initialize cookies
          if (result && opportunityData.cookieEnabled) {
            await fanduelCookieService.initializeCookies(
              userData.id,
              opportunityData.gameId || opportunityData.entityId,
              opportunityData.teamId
            );
          }
          
          // Return the purchase result
          return result;
        } catch (error) {
          console.error('Error purchasing microtransaction:', error);
          throw error;
        }
      }
      
      return true;
    } catch (error) {
      console.error('Error tracking microtransaction interaction:', error);
      return false;
    }
  }
  
  /**
   * Get pricing for a microtransaction type
   * @param {string} type Microtransaction type
   * @param {string} duration Optional duration for time-based access (daily, weekly, monthly)
   * @returns {number} Price in cents
   */
  getPricing(type, duration = 'daily') {
    // Handle special case for parlay odds with different durations
    if (type === MICROTRANSACTION_TYPES.LIVE_PARLAY_ODDS) {
      switch (duration) {
        case 'daily':
          return 299; // $2.99
        case 'weekly':
          return 999; // $9.99
        case 'monthly':
          return 2499; // $24.99
        default:
          return 299; // $2.99 default
      }
    }
    
    // Handle other microtransaction types
    switch (type) {
      case MICROTRANSACTION_TYPES.ODDS_ACCESS:
        return STRIPE_CONFIG.PRICING.ODDS_ACCESS;
      case MICROTRANSACTION_TYPES.PREMIUM_STATS:
        return 299; // $2.99
      case MICROTRANSACTION_TYPES.EXPERT_PICKS:
        return 399; // $3.99
      case MICROTRANSACTION_TYPES.PLAYER_COMPARISON:
        return 199; // $1.99
      case MICROTRANSACTION_TYPES.TEAM_INSIGHTS:
        return 299; // $2.99
      case MICROTRANSACTION_TYPES.INJURY_REPORTS:
        return 149; // $1.49
      case MICROTRANSACTION_TYPES.BETTING_TRENDS:
        return 199; // $1.99
      case MICROTRANSACTION_TYPES.HISTORICAL_MATCHUPS:
        return 249; // $2.49
      case MICROTRANSACTION_TYPES.LIVE_UPDATES:
        return 149; // $1.49
      case MICROTRANSACTION_TYPES.PERSONALIZED_ALERTS:
        return 499; // $4.99
      default:
        return 199; // $1.99 default
    }
  }
  
  /**
   * Get user's microtransaction preferences
   * @param {string} userId User ID
   * @returns {Promise<Object>} User preferences
   */
  async getUserPreferences(userId) {
    try {
      const preferencesJson = await AsyncStorage.getItem(`${STORAGE_KEYS.USER_PREFERENCES}_${userId}`);
      return preferencesJson ? JSON.parse(preferencesJson) : {
        enableMicrotransactions: true,
        preferredTypes: [],
        maxPrice: 500, // $5.00
      };
    } catch (error) {
      console.error('Error getting user microtransaction preferences:', error);
      return {
        enableMicrotransactions: true,
        preferredTypes: [],
        maxPrice: 500, // $5.00
      };
    }
  }
  
  /**
   * Save user's microtransaction preferences
   * @param {string} userId User ID
   * @param {Object} preferences User preferences
   * @returns {Promise<boolean>} Success status
   */
  async saveUserPreferences(userId, preferences) {
    try {
      await AsyncStorage.setItem(
        `${STORAGE_KEYS.USER_PREFERENCES}_${userId}`,
        JSON.stringify(preferences)
      );
      return true;
    } catch (error) {
      console.error('Error saving user microtransaction preferences:', error);
      return false;
    }
  }
}

export const microtransactionService = new MicrotransactionService();