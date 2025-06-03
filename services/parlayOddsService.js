/**
 * Parlay Odds Service
 *
 * This service calculates parlay odds and provides functionality for the Live Parlay Odds microtransaction feature.
 * It handles odds calculation, caching, and real-time updates for parlay bets.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

import { analyticsService } from './analyticsService';
import { fanduelCookieService } from './fanduelCookieService';
import { FEATURE_FLAGS } from '../config/affiliateConfig';

// Storage keys
const STORAGE_KEYS = {
  PARLAY_ODDS_CACHE: 'parlay_odds_cache',
  PARLAY_ACCESS: 'parlay_access',
  PARLAY_HISTORY: 'parlay_history',
};

// Parlay types
export const PARLAY_TYPES = {
  TWO_TEAM: '2_team',
  THREE_TEAM: '3_team',
  FOUR_TEAM: '4_team',
  CUSTOM: 'custom',
};

// Access durations
export const ACCESS_DURATIONS = {
  DAILY: 'daily',
  WEEKLY: 'weekly',
  MONTHLY: 'monthly',
};

class ParlayOddsService {
  constructor() {
    this.cache = {};
    this.lastFetchTime = null;
    this.accessRights = {};
  }

  /**
   * Initialize the service
   * @param {string} userId User ID
   * @returns {Promise<void>}
   */
  async initialize(userId) {
    try {
      // Load cache from storage
      await this.loadCache();

      // Load access rights
      await this.loadAccessRights(userId);

      // Clean up expired access rights
      this.cleanupExpiredAccess();

      console.log('ParlayOddsService initialized');
    } catch (error) {
      console.error('Error initializing ParlayOddsService:', error);
    }
  }

  /**
   * Load cache from storage
   * @returns {Promise<void>}
   */
  async loadCache() {
    try {
      const cacheJson = await AsyncStorage.getItem(STORAGE_KEYS.PARLAY_ODDS_CACHE);
      if (cacheJson) {
        this.cache = JSON.parse(cacheJson);
      }
    } catch (error) {
      console.error('Error loading parlay odds cache:', error);
    }
  }

  /**
   * Save cache to storage
   * @returns {Promise<void>}
   */
  async saveCache() {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.PARLAY_ODDS_CACHE, JSON.stringify(this.cache));
    } catch (error) {
      console.error('Error saving parlay odds cache:', error);
    }
  }

  /**
   * Load access rights for a user
   * @param {string} userId User ID
   * @returns {Promise<void>}
   */
  async loadAccessRights(userId) {
    try {
      const accessJson = await AsyncStorage.getItem(`${STORAGE_KEYS.PARLAY_ACCESS}_${userId}`);
      if (accessJson) {
        const access = JSON.parse(accessJson);

        // Convert string dates to Date objects
        if (access.startDate) {
          access.startDate = new Date(access.startDate);
        }
        if (access.endDate) {
          access.endDate = new Date(access.endDate);
        }

        this.accessRights[userId] = access;
      }
    } catch (error) {
      console.error('Error loading parlay access rights:', error);
    }
  }

  /**
   * Save access rights for a user
   * @param {string} userId User ID
   * @returns {Promise<void>}
   */
  async saveAccessRights(userId) {
    try {
      if (this.accessRights[userId]) {
        await AsyncStorage.setItem(
          `${STORAGE_KEYS.PARLAY_ACCESS}_${userId}`,
          JSON.stringify(this.accessRights[userId])
        );
      }
    } catch (error) {
      console.error('Error saving parlay access rights:', error);
    }
  }

  /**
   * Clean up expired access rights
   */
  cleanupExpiredAccess() {
    const now = new Date();

    // Check each user's access rights
    Object.keys(this.accessRights).forEach(userId => {
      const access = this.accessRights[userId];

      // If access has expired, remove it
      if (access.endDate && access.endDate < now) {
        delete this.accessRights[userId];

        // Save the updated access rights
        this.saveAccessRights(userId).catch(error => {
          console.error('Error saving access rights after cleanup:', error);
        });
      }
    });
  }

  /**
   * Check if a user has access to parlay odds
   * @param {string} userId User ID
   * @returns {boolean} Whether the user has access
   */
  hasAccess(userId) {
    // If no user ID, no access
    if (!userId) {
      return false;
    }

    // Get access rights for the user
    const access = this.accessRights[userId];

    // If no access rights, no access
    if (!access) {
      return false;
    }

    // If access has no end date, it's permanent
    if (!access.endDate) {
      return true;
    }

    // Check if access has expired
    const now = new Date();
    return access.endDate > now;
  }

  /**
   * Grant access to parlay odds for a user
   * @param {string} userId User ID
   * @param {string} duration Access duration (daily, weekly, monthly)
   * @returns {Promise<boolean>} Success status
   */
  async grantAccess(userId, duration) {
    try {
      // Calculate end date based on duration
      const startDate = new Date();
      let endDate;

      switch (duration) {
        case ACCESS_DURATIONS.DAILY:
          endDate = new Date(startDate);
          endDate.setDate(endDate.getDate() + 1);
          break;
        case ACCESS_DURATIONS.WEEKLY:
          endDate = new Date(startDate);
          endDate.setDate(endDate.getDate() + 7);
          break;
        case ACCESS_DURATIONS.MONTHLY:
          endDate = new Date(startDate);
          endDate.setMonth(endDate.getMonth() + 1);
          break;
        default:
          endDate = new Date(startDate);
          endDate.setDate(endDate.getDate() + 1);
      }

      // Set access rights
      this.accessRights[userId] = {
        startDate,
        endDate,
        duration,
      };

      // Save access rights
      await this.saveAccessRights(userId);

      // Track access grant
      analyticsService.trackEvent('parlay_access_granted', {
        userId,
        duration,
        startDate,
        endDate,
        platform: Platform.OS,
      });

      return true;
    } catch (error) {
      console.error('Error granting parlay access:', error);
      return false;
    }
  }

  /**
   * Revoke access to parlay odds for a user
   * @param {string} userId User ID
   * @returns {Promise<boolean>} Success status
   */
  async revokeAccess(userId) {
    try {
      // Delete access rights
      delete this.accessRights[userId];

      // Save access rights
      await this.saveAccessRights(userId);

      // Track access revocation
      analyticsService.trackEvent('parlay_access_revoked', {
        userId,
        platform: Platform.OS,
      });

      return true;
    } catch (error) {
      console.error('Error revoking parlay access:', error);
      return false;
    }
  }

  /**
   * Calculate parlay odds for a set of games
   * @param {Array} games Array of games with odds
   * @returns {Object} Parlay odds and potential payouts
   */
  calculateParlayOdds(games) {
    // Ensure we have at least 2 games
    if (!games || games.length < 2) {
      throw new Error('Parlay requires at least 2 games');
    }

    // Calculate decimal odds for each game
    const decimalOdds = games.map(game => this.americanToDecimal(game.odds));

    // Calculate combined decimal odds
    const combinedDecimalOdds = decimalOdds.reduce((product, odds) => product * odds, 1);

    // Convert back to American odds
    const americanOdds = this.decimalToAmerican(combinedDecimalOdds);

    // Calculate potential payouts for standard bet amounts
    const payouts = {
      bet10: this.calculatePayout(10, combinedDecimalOdds),
      bet50: this.calculatePayout(50, combinedDecimalOdds),
      bet100: this.calculatePayout(100, combinedDecimalOdds),
    };

    return {
      decimalOdds: combinedDecimalOdds,
      americanOdds,
      payouts,
      games: games.length,
    };
  }

  /**
   * Convert American odds to decimal odds
   * @param {number} americanOdds American odds
   * @returns {number} Decimal odds
   */
  americanToDecimal(americanOdds) {
    if (americanOdds > 0) {
      return americanOdds / 100 + 1;
    } else {
      return 100 / Math.abs(americanOdds) + 1;
    }
  }

  /**
   * Convert decimal odds to American odds
   * @param {number} decimalOdds Decimal odds
   * @returns {number} American odds
   */
  decimalToAmerican(decimalOdds) {
    if (decimalOdds >= 2) {
      return Math.round((decimalOdds - 1) * 100);
    } else {
      return Math.round(-100 / (decimalOdds - 1));
    }
  }

  /**
   * Calculate potential payout for a bet
   * @param {number} betAmount Bet amount
   * @param {number} decimalOdds Decimal odds
   * @returns {number} Potential payout
   */
  calculatePayout(betAmount, decimalOdds) {
    return Math.round(betAmount * decimalOdds * 100) / 100;
  }

  /**
   * Get parlay odds for a set of games
   * @param {Array} gameIds Array of game IDs
   * @param {string} userId User ID
   * @returns {Promise<Object>} Parlay odds and potential payouts
   */
  async getParlayOdds(gameIds, userId) {
    // Check if user has access
    if (!this.hasAccess(userId)) {
      throw new Error('User does not have access to parlay odds');
    }

    // Sort game IDs to ensure consistent caching
    const sortedGameIds = [...gameIds].sort();

    // Create cache key
    const cacheKey = sortedGameIds.join('_');

    // Check cache
    if (this.cache[cacheKey] && this.cache[cacheKey].timestamp > Date.now() - 5 * 60 * 1000) {
      return this.cache[cacheKey].odds;
    }

    // Fetch odds for each game
    const games = await Promise.all(
      sortedGameIds.map(async gameId => {
        // In a real implementation, this would fetch odds from an API
        // For now, we'll generate random odds
        const odds =
          Math.random() > 0.5
            ? Math.floor(Math.random() * 300) + 100 // Positive odds
            : -1 * (Math.floor(Math.random() * 300) + 100); // Negative odds

        return {
          id: gameId,
          odds,
        };
      })
    );

    // Calculate parlay odds
    const parlayOdds = this.calculateParlayOdds(games);

    // Cache the result
    this.cache[cacheKey] = {
      odds: parlayOdds,
      timestamp: Date.now(),
    };

    // Save cache
    await this.saveCache();

    // Track odds calculation
    analyticsService.trackEvent('parlay_odds_calculated', {
      userId,
      gameIds: sortedGameIds,
      parlayOdds,
      platform: Platform.OS,
    });

    return parlayOdds;
  }

  /**
   * Generate deep link to FanDuel parlay builder
   * @param {Array} gameIds Array of game IDs
   * @param {string} userId User ID
   * @returns {Promise<string>} Deep link URL
   */
  async generateFanDuelDeepLink(gameIds, userId) {
    // Base URL for FanDuel parlay builder
    const baseUrl = 'https://sportsbook.fanduel.com/parlay-builder';

    // Generate URL with cookies
    return fanduelCookieService.generateUrlWithCookies(baseUrl);
  }

  /**
   * Save parlay to user history
   * @param {Array} gameIds Array of game IDs
   * @param {Object} parlayOdds Parlay odds
   * @param {string} userId User ID
   * @returns {Promise<boolean>} Success status
   */
  async saveParlayToHistory(gameIds, parlayOdds, userId) {
    try {
      // Get existing history
      const historyJson = await AsyncStorage.getItem(`${STORAGE_KEYS.PARLAY_HISTORY}_${userId}`);
      const history = historyJson ? JSON.parse(historyJson) : [];

      // Add new parlay to history
      history.push({
        gameIds,
        parlayOdds,
        timestamp: Date.now(),
      });

      // Save history
      await AsyncStorage.setItem(
        `${STORAGE_KEYS.PARLAY_HISTORY}_${userId}`,
        JSON.stringify(history)
      );

      // Track parlay save
      analyticsService.trackEvent('parlay_saved', {
        userId,
        gameIds,
        parlayOdds,
        platform: Platform.OS,
      });

      return true;
    } catch (error) {
      console.error('Error saving parlay to history:', error);
      return false;
    }
  }

  /**
   * Get parlay history for a user
   * @param {string} userId User ID
   * @returns {Promise<Array>} Parlay history
   */
  async getParlayHistory(userId) {
    try {
      const historyJson = await AsyncStorage.getItem(`${STORAGE_KEYS.PARLAY_HISTORY}_${userId}`);
      return historyJson ? JSON.parse(historyJson) : [];
    } catch (error) {
      console.error('Error getting parlay history:', error);
      return [];
    }
  }

  /**
   * Clear parlay history for a user
   * @param {string} userId User ID
   * @returns {Promise<boolean>} Success status
   */
  async clearParlayHistory(userId) {
    try {
      await AsyncStorage.removeItem(`${STORAGE_KEYS.PARLAY_HISTORY}_${userId}`);
      return true;
    } catch (error) {
      console.error('Error clearing parlay history:', error);
      return false;
    }
  }
}

export const parlayOddsService = new ParlayOddsService();
