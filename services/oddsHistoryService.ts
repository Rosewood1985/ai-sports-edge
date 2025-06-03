/**
 * Odds History Service
 * Tracks historical odds data over time
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Storage keys
const STORAGE_KEYS = {
  ODDS_HISTORY: 'odds_history_',
  LAST_UPDATED: 'odds_history_last_updated',
};

// Maximum number of history points to store per sport/game
const MAX_HISTORY_POINTS = 50;

// History point interface
export interface OddsHistoryPoint {
  timestamp: number;
  draftKingsOdds: number | null;
  fanDuelOdds: number | null;
  bestOdds: number | null;
  bestBookmaker: string | null;
  sportKey: string;
  gameId: string;
  homeTeam: string;
  awayTeam: string;
}

// Game history interface
export interface GameOddsHistory {
  gameId: string;
  sportKey: string;
  homeTeam: string;
  awayTeam: string;
  history: OddsHistoryPoint[];
  firstRecorded: number;
  lastUpdated: number;
}

// Movement alert interface
export interface OddsMovementAlert {
  id: string;
  gameId: string;
  sportKey: string;
  homeTeam: string;
  awayTeam: string;
  bookmaker: string;
  previousOdds: number;
  currentOdds: number;
  percentageChange: number;
  timestamp: number;
  read: boolean;
}

class OddsHistoryService {
  private alerts: OddsMovementAlert[] = [];
  private alertThreshold: number = 5; // Default 5% change threshold

  /**
   * Track odds for a game
   * @param sportKey Sport key
   * @param gameId Game ID
   * @param homeTeam Home team
   * @param awayTeam Away team
   * @param draftKingsOdds DraftKings odds
   * @param fanDuelOdds FanDuel odds
   */
  async trackOdds(
    sportKey: string,
    gameId: string,
    homeTeam: string,
    awayTeam: string,
    draftKingsOdds: number | null,
    fanDuelOdds: number | null
  ): Promise<void> {
    try {
      // Calculate best odds
      let bestOdds: number | null = null;
      let bestBookmaker: string | null = null;

      if (draftKingsOdds !== null && fanDuelOdds !== null) {
        if (draftKingsOdds < fanDuelOdds) {
          bestOdds = draftKingsOdds;
          bestBookmaker = 'draftkings';
        } else {
          bestOdds = fanDuelOdds;
          bestBookmaker = 'fanduel';
        }
      } else if (draftKingsOdds !== null) {
        bestOdds = draftKingsOdds;
        bestBookmaker = 'draftkings';
      } else if (fanDuelOdds !== null) {
        bestOdds = fanDuelOdds;
        bestBookmaker = 'fanduel';
      }

      // Create history point
      const historyPoint: OddsHistoryPoint = {
        timestamp: Date.now(),
        draftKingsOdds,
        fanDuelOdds,
        bestOdds,
        bestBookmaker,
        sportKey,
        gameId,
        homeTeam,
        awayTeam,
      };

      // Get existing history
      const storageKey = `${STORAGE_KEYS.ODDS_HISTORY}${sportKey}_${gameId}`;
      const historyString = await AsyncStorage.getItem(storageKey);
      let gameHistory: GameOddsHistory;

      if (historyString) {
        gameHistory = JSON.parse(historyString);

        // Check for significant odds movement
        const lastPoint = gameHistory.history[gameHistory.history.length - 1];

        // Check DraftKings odds movement
        if (draftKingsOdds !== null && lastPoint.draftKingsOdds !== null) {
          const percentChange = this.calculatePercentageChange(
            lastPoint.draftKingsOdds,
            draftKingsOdds
          );
          if (Math.abs(percentChange) >= this.alertThreshold) {
            this.createMovementAlert(
              gameId,
              sportKey,
              homeTeam,
              awayTeam,
              'DraftKings',
              lastPoint.draftKingsOdds,
              draftKingsOdds,
              percentChange
            );
          }
        }

        // Check FanDuel odds movement
        if (fanDuelOdds !== null && lastPoint.fanDuelOdds !== null) {
          const percentChange = this.calculatePercentageChange(lastPoint.fanDuelOdds, fanDuelOdds);
          if (Math.abs(percentChange) >= this.alertThreshold) {
            this.createMovementAlert(
              gameId,
              sportKey,
              homeTeam,
              awayTeam,
              'FanDuel',
              lastPoint.fanDuelOdds,
              fanDuelOdds,
              percentChange
            );
          }
        }

        // Add new history point
        gameHistory.history.push(historyPoint);

        // Trim history if needed
        if (gameHistory.history.length > MAX_HISTORY_POINTS) {
          gameHistory.history = gameHistory.history.slice(-MAX_HISTORY_POINTS);
        }

        // Update last updated timestamp
        gameHistory.lastUpdated = Date.now();
      } else {
        // Create new game history
        gameHistory = {
          gameId,
          sportKey,
          homeTeam,
          awayTeam,
          history: [historyPoint],
          firstRecorded: Date.now(),
          lastUpdated: Date.now(),
        };
      }

      // Save updated history
      await AsyncStorage.setItem(storageKey, JSON.stringify(gameHistory));

      // Update last updated timestamp
      await AsyncStorage.setItem(STORAGE_KEYS.LAST_UPDATED, Date.now().toString());
    } catch (error) {
      console.error('Error tracking odds:', error);
    }
  }

  /**
   * Get odds history for a game
   * @param sportKey Sport key
   * @param gameId Game ID
   * @returns Game odds history
   */
  async getOddsHistory(sportKey: string, gameId: string): Promise<GameOddsHistory | null> {
    try {
      const storageKey = `${STORAGE_KEYS.ODDS_HISTORY}${sportKey}_${gameId}`;
      const historyString = await AsyncStorage.getItem(storageKey);

      if (historyString) {
        return JSON.parse(historyString);
      }

      return null;
    } catch (error) {
      console.error('Error getting odds history:', error);
      return null;
    }
  }

  /**
   * Get all tracked games for a sport
   * @param sportKey Sport key
   * @returns List of tracked games
   */
  async getTrackedGames(sportKey: string): Promise<GameOddsHistory[]> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const historyKeys = keys.filter(key =>
        key.startsWith(`${STORAGE_KEYS.ODDS_HISTORY}${sportKey}_`)
      );

      const games: GameOddsHistory[] = [];

      for (const key of historyKeys) {
        const historyString = await AsyncStorage.getItem(key);
        if (historyString) {
          games.push(JSON.parse(historyString));
        }
      }

      return games;
    } catch (error) {
      console.error('Error getting tracked games:', error);
      return [];
    }
  }

  /**
   * Calculate percentage change between two odds values
   * @param oldOdds Old odds value
   * @param newOdds New odds value
   * @returns Percentage change
   */
  private calculatePercentageChange(oldOdds: number, newOdds: number): number {
    // Handle American odds format
    if (oldOdds === 0) return 0;

    // For positive odds (underdogs)
    if (oldOdds > 0 && newOdds > 0) {
      return ((newOdds - oldOdds) / oldOdds) * 100;
    }

    // For negative odds (favorites)
    if (oldOdds < 0 && newOdds < 0) {
      // Convert to positive for calculation
      const oldPositive = Math.abs(oldOdds);
      const newPositive = Math.abs(newOdds);
      return ((oldPositive - newPositive) / oldPositive) * 100;
    }

    // For odds that changed from positive to negative or vice versa
    // This is a significant change, so we'll return a large percentage
    return 100;
  }

  /**
   * Create a movement alert
   * @param gameId Game ID
   * @param sportKey Sport key
   * @param homeTeam Home team
   * @param awayTeam Away team
   * @param bookmaker Bookmaker name
   * @param previousOdds Previous odds
   * @param currentOdds Current odds
   * @param percentageChange Percentage change
   */
  private createMovementAlert(
    gameId: string,
    sportKey: string,
    homeTeam: string,
    awayTeam: string,
    bookmaker: string,
    previousOdds: number,
    currentOdds: number,
    percentageChange: number
  ): void {
    const alert: OddsMovementAlert = {
      id: `${gameId}_${bookmaker}_${Date.now()}`,
      gameId,
      sportKey,
      homeTeam,
      awayTeam,
      bookmaker,
      previousOdds,
      currentOdds,
      percentageChange,
      timestamp: Date.now(),
      read: false,
    };

    this.alerts.push(alert);
    this.saveAlerts();
  }

  /**
   * Save alerts to storage
   */
  private async saveAlerts(): Promise<void> {
    try {
      await AsyncStorage.setItem('odds_movement_alerts', JSON.stringify(this.alerts));
    } catch (error) {
      console.error('Error saving alerts:', error);
    }
  }

  /**
   * Load alerts from storage
   */
  private async loadAlerts(): Promise<void> {
    try {
      const alertsString = await AsyncStorage.getItem('odds_movement_alerts');
      if (alertsString) {
        this.alerts = JSON.parse(alertsString);
      }
    } catch (error) {
      console.error('Error loading alerts:', error);
    }
  }

  /**
   * Get all movement alerts
   * @returns List of movement alerts
   */
  async getMovementAlerts(): Promise<OddsMovementAlert[]> {
    await this.loadAlerts();
    return [...this.alerts];
  }

  /**
   * Get unread movement alerts
   * @returns List of unread movement alerts
   */
  async getUnreadMovementAlerts(): Promise<OddsMovementAlert[]> {
    await this.loadAlerts();
    return this.alerts.filter(alert => !alert.read);
  }

  /**
   * Mark alert as read
   * @param alertId Alert ID
   */
  async markAlertAsRead(alertId: string): Promise<void> {
    await this.loadAlerts();

    const alertIndex = this.alerts.findIndex(alert => alert.id === alertId);
    if (alertIndex !== -1) {
      this.alerts[alertIndex].read = true;
      await this.saveAlerts();
    }
  }

  /**
   * Set alert threshold
   * @param threshold Percentage threshold for alerts
   */
  setAlertThreshold(threshold: number): void {
    this.alertThreshold = threshold;
  }

  /**
   * Get alert threshold
   * @returns Current alert threshold
   */
  getAlertThreshold(): number {
    return this.alertThreshold;
  }

  /**
   * Clear all history
   */
  async clearAllHistory(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const historyKeys = keys.filter(key => key.startsWith(STORAGE_KEYS.ODDS_HISTORY));

      if (historyKeys.length > 0) {
        await AsyncStorage.multiRemove(historyKeys);
      }

      // Clear alerts
      this.alerts = [];
      await this.saveAlerts();
    } catch (error) {
      console.error('Error clearing history:', error);
    }
  }
}

export const oddsHistoryService = new OddsHistoryService();
