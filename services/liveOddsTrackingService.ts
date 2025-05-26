/**
 * Live Odds Movement Tracking Service
 * 
 * Provides real-time odds monitoring, line movement tracking, and betting volume analysis
 * Addresses the missing real-time odds features identified in the analysis
 */

import { EventEmitter } from 'events';
import { realTimeDataService, REALTIME_EVENTS } from './realTimeDataService';
import { oddsCacheService } from './oddsCacheService';
import oddsService from './OddsService';
import apiKeys from '../utils/apiKeys';
import * as Sentry from '@sentry/react-native';

// Odds movement tracking configuration
const ODDS_TRACKING_CONFIG = {
  // Update intervals
  REAL_TIME_INTERVAL: 3000, // 3 seconds for live games
  ACTIVE_GAMES_INTERVAL: 30000, // 30 seconds for pre-game
  HISTORICAL_TRACKING_DAYS: 7, // Track movement for 7 days
  
  // Movement thresholds
  SIGNIFICANT_MOVEMENT_THRESHOLD: 10, // American odds movement threshold
  ALERT_MOVEMENT_THRESHOLD: 25, // Large movement alert threshold
  
  // Tracking limits
  MAX_TRACKED_GAMES: 100,
  MAX_BOOKMAKERS: 10,
  
  // Storage keys
  CACHE_PREFIX: 'odds_tracking_',
};

// Odds movement interfaces
interface OddsMovementData {
  gameId: string;
  sport: string;
  homeTeam: string;
  awayTeam: string;
  gameDate: string;
  movements: OddsMovement[];
  currentOdds: BookmakerOdds[];
  lastUpdated: string;
}

interface OddsMovement {
  timestamp: string;
  bookmaker: string;
  market: 'h2h' | 'spreads' | 'totals';
  oddsType: 'home' | 'away' | 'over' | 'under' | 'spread_home' | 'spread_away';
  oldValue: number;
  newValue: number;
  movement: number;
  movementPercentage: number;
  isSignificant: boolean;
}

interface BookmakerOdds {
  bookmaker: string;
  lastUpdated: string;
  markets: {
    h2h?: {
      home: number;
      away: number;
    };
    spreads?: {
      homeSpread: number;
      homeOdds: number;
      awaySpread: number;
      awayOdds: number;
    };
    totals?: {
      overUnder: number;
      overOdds: number;
      underOdds: number;
    };
  };
}

interface OddsAlert {
  id: string;
  gameId: string;
  sport: string;
  teams: string;
  alertType: 'significant_movement' | 'line_reversal' | 'steam_move' | 'large_volume';
  message: string;
  movement: OddsMovement;
  timestamp: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

interface BettingVolumeData {
  gameId: string;
  bookmaker: string;
  market: string;
  homeVolumePercentage: number;
  awayVolumePercentage: number;
  totalVolume: 'low' | 'medium' | 'high' | 'extreme';
  lastUpdated: string;
}

/**
 * Live Odds Movement Tracking Service
 */
export class LiveOddsTrackingService extends EventEmitter {
  private isInitialized: boolean = false;
  private trackedGames: Map<string, OddsMovementData> = new Map();
  private previousOdds: Map<string, BookmakerOdds[]> = new Map();
  private trackingIntervals: Map<string, NodeJS.Timeout> = new Map();
  private alertQueue: OddsAlert[] = [];

  constructor() {
    super();
    this.setMaxListeners(50);
  }

  /**
   * Initialize the odds tracking service
   */
  async initialize(): Promise<void> {
    try {
      console.log('[ODDS TRACKING] Initializing live odds tracking service...');

      // Validate API keys
      if (!apiKeys.getOddsApiKey()) {
        throw new Error('Odds API key not configured');
      }

      // Initialize real-time data service
      await realTimeDataService.initialize();

      // Setup real-time event listeners
      this.setupRealTimeListeners();

      // Setup cleanup interval
      this.setupCleanupInterval();

      this.isInitialized = true;
      console.log('[ODDS TRACKING] Live odds tracking service initialized');

    } catch (error) {
      console.error('[ODDS TRACKING] Failed to initialize odds tracking service:', error);
      Sentry.captureException(error);
      throw error;
    }
  }

  /**
   * Start tracking odds for a specific game
   */
  async startTrackingGame(gameId: string, sport: string, homeTeam: string, awayTeam: string, gameDate: string): Promise<void> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      // Check if already tracking
      if (this.trackedGames.has(gameId)) {
        console.log(`[ODDS TRACKING] Already tracking game ${gameId}`);
        return;
      }

      // Check tracking limits
      if (this.trackedGames.size >= ODDS_TRACKING_CONFIG.MAX_TRACKED_GAMES) {
        throw new Error('Maximum tracked games limit reached');
      }

      // Initialize tracking data
      const trackingData: OddsMovementData = {
        gameId,
        sport,
        homeTeam,
        awayTeam,
        gameDate,
        movements: [],
        currentOdds: [],
        lastUpdated: new Date().toISOString(),
      };

      this.trackedGames.set(gameId, trackingData);

      // Subscribe to real-time odds updates
      await realTimeDataService.subscribeToOddsMovement(gameId, sport);

      // Get initial odds
      await this.updateGameOdds(gameId);

      // Start tracking interval
      const interval = setInterval(() => {
        this.updateGameOdds(gameId);
      }, this.getUpdateInterval(gameDate));

      this.trackingIntervals.set(gameId, interval);

      console.log(`[ODDS TRACKING] Started tracking odds for ${sport} game ${gameId}: ${homeTeam} vs ${awayTeam}`);

    } catch (error) {
      console.error(`[ODDS TRACKING] Failed to start tracking game ${gameId}:`, error);
      Sentry.captureException(error);
    }
  }

  /**
   * Stop tracking odds for a game
   */
  async stopTrackingGame(gameId: string): Promise<void> {
    try {
      // Clear interval
      const interval = this.trackingIntervals.get(gameId);
      if (interval) {
        clearInterval(interval);
        this.trackingIntervals.delete(gameId);
      }

      // Unsubscribe from real-time updates
      await realTimeDataService.unsubscribe(`odds_${gameId}`);

      // Archive tracking data before removing
      const trackingData = this.trackedGames.get(gameId);
      if (trackingData) {
        await this.archiveTrackingData(gameId, trackingData);
        this.trackedGames.delete(gameId);
      }

      // Clear previous odds
      this.previousOdds.delete(gameId);

      console.log(`[ODDS TRACKING] Stopped tracking odds for game ${gameId}`);

    } catch (error) {
      console.error(`[ODDS TRACKING] Failed to stop tracking game ${gameId}:`, error);
    }
  }

  /**
   * Update odds for a specific game
   */
  private async updateGameOdds(gameId: string): Promise<void> {
    try {
      const trackingData = this.trackedGames.get(gameId);
      if (!trackingData) return;

      // Fetch current odds from multiple markets
      const [h2hOdds, spreadsOdds, totalsOdds] = await Promise.all([
        oddsService.getOdds(trackingData.sport, 'h2h').catch(() => []),
        oddsService.getOdds(trackingData.sport, 'spreads').catch(() => []),
        oddsService.getOdds(trackingData.sport, 'totals').catch(() => []),
      ]);

      // Find odds for this specific game
      const gameH2H = h2hOdds.find((game: any) => game.id === gameId);
      const gameSpreads = spreadsOdds.find((game: any) => game.id === gameId);
      const gameTotals = totalsOdds.find((game: any) => game.id === gameId);

      if (!gameH2H && !gameSpreads && !gameTotals) {
        console.warn(`[ODDS TRACKING] No odds found for game ${gameId}`);
        return;
      }

      // Process odds from all bookmakers
      const currentOdds = this.processGameOdds(gameH2H, gameSpreads, gameTotals);
      const previousOdds = this.previousOdds.get(gameId) || [];

      // Detect movements
      const movements = this.detectOddsMovements(gameId, previousOdds, currentOdds);

      // Update tracking data
      trackingData.currentOdds = currentOdds;
      trackingData.movements.push(...movements);
      trackingData.lastUpdated = new Date().toISOString();

      // Store previous odds for next comparison
      this.previousOdds.set(gameId, currentOdds);

      // Check for alerts
      await this.checkForAlerts(gameId, movements);

      // Emit events for significant movements
      movements.forEach(movement => {
        if (movement.isSignificant) {
          this.emit('significant_movement', {
            gameId,
            sport: trackingData.sport,
            teams: `${trackingData.homeTeam} vs ${trackingData.awayTeam}`,
            movement,
          });
        }
      });

      // Cache updated data
      await oddsCacheService.setCachedData(
        `${ODDS_TRACKING_CONFIG.CACHE_PREFIX}${gameId}`,
        trackingData,
        60000 // 1 minute cache
      );

    } catch (error) {
      console.error(`[ODDS TRACKING] Error updating odds for game ${gameId}:`, error);
    }
  }

  /**
   * Process odds data from multiple markets and bookmakers
   */
  private processGameOdds(h2hGame: any, spreadsGame: any, totalsGame: any): BookmakerOdds[] {
    const bookmakerMap = new Map<string, BookmakerOdds>();

    // Process H2H odds
    if (h2hGame?.bookmakers) {
      h2hGame.bookmakers.forEach((bookmaker: any) => {
        const h2hMarket = bookmaker.markets.find((m: any) => m.key === 'h2h');
        if (h2hMarket) {
          const odds: BookmakerOdds = {
            bookmaker: bookmaker.name,
            lastUpdated: new Date().toISOString(),
            markets: {
              h2h: {
                home: h2hMarket.outcomes.find((o: any) => o.name === h2hGame.homeTeam)?.price || 0,
                away: h2hMarket.outcomes.find((o: any) => o.name === h2hGame.awayTeam)?.price || 0,
              },
            },
          };
          bookmakerMap.set(bookmaker.name, odds);
        }
      });
    }

    // Process spreads odds
    if (spreadsGame?.bookmakers) {
      spreadsGame.bookmakers.forEach((bookmaker: any) => {
        const spreadsMarket = bookmaker.markets.find((m: any) => m.key === 'spreads');
        if (spreadsMarket) {
          const existing = bookmakerMap.get(bookmaker.name) || {
            bookmaker: bookmaker.name,
            lastUpdated: new Date().toISOString(),
            markets: {},
          };

          const homeOutcome = spreadsMarket.outcomes.find((o: any) => o.name === spreadsGame.homeTeam);
          const awayOutcome = spreadsMarket.outcomes.find((o: any) => o.name === spreadsGame.awayTeam);

          existing.markets.spreads = {
            homeSpread: homeOutcome?.point || 0,
            homeOdds: homeOutcome?.price || 0,
            awaySpread: awayOutcome?.point || 0,
            awayOdds: awayOutcome?.price || 0,
          };

          bookmakerMap.set(bookmaker.name, existing);
        }
      });
    }

    // Process totals odds
    if (totalsGame?.bookmakers) {
      totalsGame.bookmakers.forEach((bookmaker: any) => {
        const totalsMarket = bookmaker.markets.find((m: any) => m.key === 'totals');
        if (totalsMarket) {
          const existing = bookmakerMap.get(bookmaker.name) || {
            bookmaker: bookmaker.name,
            lastUpdated: new Date().toISOString(),
            markets: {},
          };

          const overOutcome = totalsMarket.outcomes.find((o: any) => o.name === 'Over');
          const underOutcome = totalsMarket.outcomes.find((o: any) => o.name === 'Under');

          existing.markets.totals = {
            overUnder: overOutcome?.point || 0,
            overOdds: overOutcome?.price || 0,
            underOdds: underOutcome?.price || 0,
          };

          bookmakerMap.set(bookmaker.name, existing);
        }
      });
    }

    return Array.from(bookmakerMap.values());
  }

  /**
   * Detect odds movements by comparing previous and current odds
   */
  private detectOddsMovements(gameId: string, previousOdds: BookmakerOdds[], currentOdds: BookmakerOdds[]): OddsMovement[] {
    const movements: OddsMovement[] = [];
    const timestamp = new Date().toISOString();

    currentOdds.forEach(current => {
      const previous = previousOdds.find(p => p.bookmaker === current.bookmaker);
      if (!previous) return;

      // Check H2H movements
      if (current.markets.h2h && previous.markets.h2h) {
        const homeMovement = this.calculateMovement(previous.markets.h2h.home, current.markets.h2h.home);
        const awayMovement = this.calculateMovement(previous.markets.h2h.away, current.markets.h2h.away);

        if (homeMovement.movement !== 0) {
          movements.push({
            timestamp,
            bookmaker: current.bookmaker,
            market: 'h2h',
            oddsType: 'home',
            oldValue: previous.markets.h2h.home,
            newValue: current.markets.h2h.home,
            movement: homeMovement.movement,
            movementPercentage: homeMovement.percentage,
            isSignificant: Math.abs(homeMovement.movement) >= ODDS_TRACKING_CONFIG.SIGNIFICANT_MOVEMENT_THRESHOLD,
          });
        }

        if (awayMovement.movement !== 0) {
          movements.push({
            timestamp,
            bookmaker: current.bookmaker,
            market: 'h2h',
            oddsType: 'away',
            oldValue: previous.markets.h2h.away,
            newValue: current.markets.h2h.away,
            movement: awayMovement.movement,
            movementPercentage: awayMovement.percentage,
            isSignificant: Math.abs(awayMovement.movement) >= ODDS_TRACKING_CONFIG.SIGNIFICANT_MOVEMENT_THRESHOLD,
          });
        }
      }

      // Check spreads movements
      if (current.markets.spreads && previous.markets.spreads) {
        const homeOddsMovement = this.calculateMovement(previous.markets.spreads.homeOdds, current.markets.spreads.homeOdds);
        const awayOddsMovement = this.calculateMovement(previous.markets.spreads.awayOdds, current.markets.spreads.awayOdds);

        if (homeOddsMovement.movement !== 0) {
          movements.push({
            timestamp,
            bookmaker: current.bookmaker,
            market: 'spreads',
            oddsType: 'spread_home',
            oldValue: previous.markets.spreads.homeOdds,
            newValue: current.markets.spreads.homeOdds,
            movement: homeOddsMovement.movement,
            movementPercentage: homeOddsMovement.percentage,
            isSignificant: Math.abs(homeOddsMovement.movement) >= ODDS_TRACKING_CONFIG.SIGNIFICANT_MOVEMENT_THRESHOLD,
          });
        }

        if (awayOddsMovement.movement !== 0) {
          movements.push({
            timestamp,
            bookmaker: current.bookmaker,
            market: 'spreads',
            oddsType: 'spread_away',
            oldValue: previous.markets.spreads.awayOdds,
            newValue: current.markets.spreads.awayOdds,
            movement: awayOddsMovement.movement,
            movementPercentage: awayOddsMovement.percentage,
            isSignificant: Math.abs(awayOddsMovement.movement) >= ODDS_TRACKING_CONFIG.SIGNIFICANT_MOVEMENT_THRESHOLD,
          });
        }
      }

      // Check totals movements
      if (current.markets.totals && previous.markets.totals) {
        const overMovement = this.calculateMovement(previous.markets.totals.overOdds, current.markets.totals.overOdds);
        const underMovement = this.calculateMovement(previous.markets.totals.underOdds, current.markets.totals.underOdds);

        if (overMovement.movement !== 0) {
          movements.push({
            timestamp,
            bookmaker: current.bookmaker,
            market: 'totals',
            oddsType: 'over',
            oldValue: previous.markets.totals.overOdds,
            newValue: current.markets.totals.overOdds,
            movement: overMovement.movement,
            movementPercentage: overMovement.percentage,
            isSignificant: Math.abs(overMovement.movement) >= ODDS_TRACKING_CONFIG.SIGNIFICANT_MOVEMENT_THRESHOLD,
          });
        }

        if (underMovement.movement !== 0) {
          movements.push({
            timestamp,
            bookmaker: current.bookmaker,
            market: 'totals',
            oddsType: 'under',
            oldValue: previous.markets.totals.underOdds,
            newValue: current.markets.totals.underOdds,
            movement: underMovement.movement,
            movementPercentage: underMovement.percentage,
            isSignificant: Math.abs(underMovement.movement) >= ODDS_TRACKING_CONFIG.SIGNIFICANT_MOVEMENT_THRESHOLD,
          });
        }
      }
    });

    return movements;
  }

  /**
   * Calculate movement between two odds values
   */
  private calculateMovement(oldValue: number, newValue: number): { movement: number; percentage: number } {
    const movement = newValue - oldValue;
    const percentage = oldValue !== 0 ? (movement / Math.abs(oldValue)) * 100 : 0;
    
    return { movement, percentage };
  }

  /**
   * Check for alert conditions
   */
  private async checkForAlerts(gameId: string, movements: OddsMovement[]): Promise<void> {
    const trackingData = this.trackedGames.get(gameId);
    if (!trackingData) return;

    for (const movement of movements) {
      // Large movement alert
      if (Math.abs(movement.movement) >= ODDS_TRACKING_CONFIG.ALERT_MOVEMENT_THRESHOLD) {
        const alert: OddsAlert = {
          id: `${gameId}_${movement.bookmaker}_${movement.market}_${Date.now()}`,
          gameId,
          sport: trackingData.sport,
          teams: `${trackingData.homeTeam} vs ${trackingData.awayTeam}`,
          alertType: 'significant_movement',
          message: `Large ${movement.market} movement: ${movement.oldValue} → ${movement.newValue} (${movement.movement > 0 ? '+' : ''}${movement.movement})`,
          movement,
          timestamp: new Date().toISOString(),
          severity: Math.abs(movement.movement) >= 50 ? 'critical' : 'high',
        };

        this.alertQueue.push(alert);
        this.emit('odds_alert', alert);
      }

      // Line reversal detection
      if (this.isLineReversal(movement)) {
        const alert: OddsAlert = {
          id: `${gameId}_reversal_${movement.bookmaker}_${Date.now()}`,
          gameId,
          sport: trackingData.sport,
          teams: `${trackingData.homeTeam} vs ${trackingData.awayTeam}`,
          alertType: 'line_reversal',
          message: `Line reversal detected: ${movement.market} ${movement.oddsType}`,
          movement,
          timestamp: new Date().toISOString(),
          severity: 'high',
        };

        this.alertQueue.push(alert);
        this.emit('odds_alert', alert);
      }
    }
  }

  /**
   * Determine if movement represents a line reversal
   */
  private isLineReversal(movement: OddsMovement): boolean {
    // For American odds, a line reversal typically means crossing from positive to negative or vice versa
    return (movement.oldValue > 0 && movement.newValue < 0) || 
           (movement.oldValue < 0 && movement.newValue > 0);
  }

  /**
   * Get appropriate update interval based on game timing
   */
  private getUpdateInterval(gameDate: string): number {
    const gameTime = new Date(gameDate);
    const now = new Date();
    const timeUntilGame = gameTime.getTime() - now.getTime();
    
    // If game is live or starting soon (within 2 hours)
    if (timeUntilGame <= 2 * 60 * 60 * 1000) {
      return ODDS_TRACKING_CONFIG.REAL_TIME_INTERVAL;
    }
    
    // For upcoming games
    return ODDS_TRACKING_CONFIG.ACTIVE_GAMES_INTERVAL;
  }

  /**
   * Setup real-time event listeners
   */
  private setupRealTimeListeners(): void {
    realTimeDataService.on(REALTIME_EVENTS.ODDS_CHANGE, (oddsChange) => {
      // Handle real-time odds updates
      console.log(`[ODDS TRACKING] Real-time odds change: ${oddsChange.bookmaker} ${oddsChange.market} ${oddsChange.oldOdds} → ${oddsChange.newOdds}`);
    });

    realTimeDataService.on(REALTIME_EVENTS.LINE_MOVEMENT, (lineMovement) => {
      // Handle line movement events
      console.log(`[ODDS TRACKING] Line movement detected: ${lineMovement.movement}`);
    });
  }

  /**
   * Setup cleanup interval for old data
   */
  private setupCleanupInterval(): void {
    setInterval(() => {
      this.cleanupOldData();
    }, 60 * 60 * 1000); // Run every hour
  }

  /**
   * Archive tracking data to persistent storage
   */
  private async archiveTrackingData(gameId: string, trackingData: OddsMovementData): Promise<void> {
    try {
      await oddsCacheService.setCachedData(
        `odds_archive_${gameId}`,
        trackingData,
        ODDS_TRACKING_CONFIG.HISTORICAL_TRACKING_DAYS * 24 * 60 * 60 * 1000
      );
    } catch (error) {
      console.error(`[ODDS TRACKING] Failed to archive data for game ${gameId}:`, error);
    }
  }

  /**
   * Clean up old tracking data
   */
  private cleanupOldData(): void {
    const cutoffTime = Date.now() - (ODDS_TRACKING_CONFIG.HISTORICAL_TRACKING_DAYS * 24 * 60 * 60 * 1000);
    
    // Clean up alert queue
    this.alertQueue = this.alertQueue.filter(alert => 
      new Date(alert.timestamp).getTime() > cutoffTime
    );
    
    console.log('[ODDS TRACKING] Cleaned up old tracking data');
  }

  /**
   * Get tracking data for a game
   */
  getGameTrackingData(gameId: string): OddsMovementData | null {
    return this.trackedGames.get(gameId) || null;
  }

  /**
   * Get recent alerts
   */
  getRecentAlerts(limit: number = 20): OddsAlert[] {
    return this.alertQueue
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }

  /**
   * Get service status
   */
  getStatus(): {
    isInitialized: boolean;
    trackedGamesCount: number;
    recentAlertsCount: number;
    totalMovements: number;
  } {
    const totalMovements = Array.from(this.trackedGames.values())
      .reduce((total, game) => total + game.movements.length, 0);

    return {
      isInitialized: this.isInitialized,
      trackedGamesCount: this.trackedGames.size,
      recentAlertsCount: this.alertQueue.length,
      totalMovements,
    };
  }

  /**
   * Cleanup and shutdown
   */
  async shutdown(): Promise<void> {
    console.log('[ODDS TRACKING] Shutting down odds tracking service...');
    
    // Stop all tracking intervals
    this.trackingIntervals.forEach(interval => clearInterval(interval));
    this.trackingIntervals.clear();
    
    // Archive all current tracking data
    for (const [gameId, trackingData] of this.trackedGames.entries()) {
      await this.archiveTrackingData(gameId, trackingData);
    }
    
    this.trackedGames.clear();
    this.previousOdds.clear();
    this.alertQueue = [];
    this.isInitialized = false;
    
    console.log('[ODDS TRACKING] Odds tracking service shut down');
  }
}

// Export singleton instance
export const liveOddsTrackingService = new LiveOddsTrackingService();