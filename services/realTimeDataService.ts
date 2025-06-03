/**
 * Real-Time Sports Data Integration Service
 *
 * Provides WebSocket-based real-time updates for:
 * - Live scores and in-game events
 * - Real-time odds movement tracking
 * - Player statistics updates
 * - Injury reports and news alerts
 * - Live betting line changes
 */

import { EventEmitter } from 'events';

import { oddsCacheService } from './oddsCacheService';
import {
  securityMonitoringService,
  SEVERITY_LEVELS,
  INCIDENT_TYPES,
} from './securityMonitoringService';
import apiKeys from '../utils/apiKeys';

// Real-time data configuration
const REALTIME_CONFIG = {
  // Sports data WebSocket endpoints
  SPORTS_WEBSOCKET_URL: 'wss://api.sportsdata.io/v3',
  ODDS_WEBSOCKET_URL: 'wss://api.the-odds-api.com/v4',

  // Update intervals
  FAST_UPDATE_INTERVAL: 1000, // 1 second for live games
  MEDIUM_UPDATE_INTERVAL: 5000, // 5 seconds for active odds
  SLOW_UPDATE_INTERVAL: 30000, // 30 seconds for inactive content

  // Connection settings
  MAX_RECONNECT_ATTEMPTS: 5,
  RECONNECT_DELAY: 2000,
  HEARTBEAT_INTERVAL: 30000,

  // Rate limiting
  MAX_SUBSCRIPTIONS: 50,
  MAX_UPDATES_PER_SECOND: 100,
};

// Real-time event types
export const REALTIME_EVENTS = {
  // Live scores
  SCORE_UPDATE: 'score_update',
  QUARTER_CHANGE: 'quarter_change',
  GAME_START: 'game_start',
  GAME_END: 'game_end',

  // Odds movement
  ODDS_CHANGE: 'odds_change',
  LINE_MOVEMENT: 'line_movement',
  BETTING_VOLUME: 'betting_volume',

  // Player events
  PLAYER_STAT_UPDATE: 'player_stat_update',
  INJURY_REPORT: 'injury_report',
  LINEUP_CHANGE: 'lineup_change',

  // Connection events
  CONNECTION_ESTABLISHED: 'connection_established',
  CONNECTION_LOST: 'connection_lost',
  RECONNECTING: 'reconnecting',

  // Errors
  DATA_ERROR: 'data_error',
  RATE_LIMIT_WARNING: 'rate_limit_warning',
};

// Interfaces for real-time data
interface LiveScoreUpdate {
  gameId: string;
  sport: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  quarter: number;
  timeRemaining: string;
  gameStatus: 'upcoming' | 'live' | 'halftime' | 'final' | 'postponed';
  lastUpdate: string;
}

interface OddsMovement {
  gameId: string;
  sport: string;
  bookmaker: string;
  market: string;
  oldOdds: number;
  newOdds: number;
  movement: 'up' | 'down' | 'stable';
  movementSize: number;
  timestamp: string;
}

interface PlayerStatUpdate {
  gameId: string;
  playerId: string;
  playerName: string;
  team: string;
  statType: string;
  value: number;
  quarter: number;
  timestamp: string;
}

interface InjuryReport {
  playerId: string;
  playerName: string;
  team: string;
  sport: string;
  injuryType: string;
  severity: 'questionable' | 'doubtful' | 'out' | 'day-to-day';
  expectedReturn: string | null;
  timestamp: string;
}

/**
 * Real-Time Sports Data Service
 */
export class RealTimeDataService extends EventEmitter {
  private connections: Map<string, WebSocket> = new Map();
  private subscriptions: Set<string> = new Set();
  private reconnectAttempts: Map<string, number> = new Map();
  private updateRateLimiter: Map<string, number[]> = new Map();
  private heartbeatIntervals: Map<string, NodeJS.Timeout> = new Map();
  private isInitialized: boolean = false;

  constructor() {
    super();
    this.setMaxListeners(100); // Allow many concurrent listeners
  }

  /**
   * Initialize the real-time data service
   */
  async initialize(): Promise<void> {
    try {
      console.log('[REALTIME] Initializing real-time data service...');

      // Validate API keys
      if (!apiKeys.getSportsDataApiKey() || !apiKeys.getOddsApiKey()) {
        throw new Error('Required API keys not configured for real-time data');
      }

      // Initialize connection pools
      await this.initializeConnections();

      // Set up error handling
      this.setupErrorHandling();

      // Set up rate limiting
      this.setupRateLimiting();

      this.isInitialized = true;
      console.log('[REALTIME] Real-time data service initialized successfully');
    } catch (error) {
      console.error('[REALTIME] Failed to initialize real-time data service:', error);

      await securityMonitoringService.logIncident({
        severity: SEVERITY_LEVELS.HIGH,
        type: INCIDENT_TYPES.SUSPICIOUS_ACTIVITY,
        source: 'realtime_data_service',
        message: `Failed to initialize real-time service: ${error.message}`,
        details: { error: error.message },
      });

      throw error;
    }
  }

  /**
   * Subscribe to live scores for a specific game
   */
  async subscribeToLiveScores(gameId: string, sport: string): Promise<void> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      const subscriptionKey = `scores_${sport}_${gameId}`;

      if (this.subscriptions.has(subscriptionKey)) {
        console.log(`[REALTIME] Already subscribed to live scores for game ${gameId}`);
        return;
      }

      // Check subscription limits
      if (this.subscriptions.size >= REALTIME_CONFIG.MAX_SUBSCRIPTIONS) {
        throw new Error('Maximum subscriptions reached');
      }

      const connection = await this.getOrCreateConnection('sports');

      // Send subscription message
      const subscriptionMessage = {
        action: 'subscribe',
        type: 'live_scores',
        sport: sport.toLowerCase(),
        gameId,
        timestamp: new Date().toISOString(),
      };

      connection.send(JSON.stringify(subscriptionMessage));
      this.subscriptions.add(subscriptionKey);

      console.log(`[REALTIME] Subscribed to live scores for ${sport} game ${gameId}`);
    } catch (error) {
      console.error(`[REALTIME] Failed to subscribe to live scores:`, error);
      this.emit(REALTIME_EVENTS.DATA_ERROR, { error: error.message, type: 'subscription' });
    }
  }

  /**
   * Subscribe to real-time odds changes
   */
  async subscribeToOddsMovement(
    gameId: string,
    sport: string,
    markets: string[] = ['h2h', 'spreads', 'totals']
  ): Promise<void> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      const subscriptionKey = `odds_${sport}_${gameId}`;

      if (this.subscriptions.has(subscriptionKey)) {
        console.log(`[REALTIME] Already subscribed to odds for game ${gameId}`);
        return;
      }

      const connection = await this.getOrCreateConnection('odds');

      const subscriptionMessage = {
        action: 'subscribe',
        type: 'odds_changes',
        sport: sport.toLowerCase(),
        gameId,
        markets,
        timestamp: new Date().toISOString(),
      };

      connection.send(JSON.stringify(subscriptionMessage));
      this.subscriptions.add(subscriptionKey);

      console.log(`[REALTIME] Subscribed to odds movement for ${sport} game ${gameId}`);
    } catch (error) {
      console.error(`[REALTIME] Failed to subscribe to odds movement:`, error);
      this.emit(REALTIME_EVENTS.DATA_ERROR, { error: error.message, type: 'odds_subscription' });
    }
  }

  /**
   * Subscribe to player statistics updates
   */
  async subscribeToPlayerStats(gameId: string, playerIds: string[]): Promise<void> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      const subscriptionKey = `stats_${gameId}`;

      if (this.subscriptions.has(subscriptionKey)) {
        console.log(`[REALTIME] Already subscribed to player stats for game ${gameId}`);
        return;
      }

      const connection = await this.getOrCreateConnection('sports');

      const subscriptionMessage = {
        action: 'subscribe',
        type: 'player_stats',
        gameId,
        playerIds,
        timestamp: new Date().toISOString(),
      };

      connection.send(JSON.stringify(subscriptionMessage));
      this.subscriptions.add(subscriptionKey);

      console.log(`[REALTIME] Subscribed to player stats for game ${gameId}`);
    } catch (error) {
      console.error(`[REALTIME] Failed to subscribe to player stats:`, error);
      this.emit(REALTIME_EVENTS.DATA_ERROR, { error: error.message, type: 'stats_subscription' });
    }
  }

  /**
   * Subscribe to injury reports and lineup changes
   */
  async subscribeToInjuryReports(sport: string, teamIds: string[] = []): Promise<void> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      const subscriptionKey = `injuries_${sport}`;

      if (this.subscriptions.has(subscriptionKey)) {
        console.log(`[REALTIME] Already subscribed to injury reports for ${sport}`);
        return;
      }

      const connection = await this.getOrCreateConnection('sports');

      const subscriptionMessage = {
        action: 'subscribe',
        type: 'injury_reports',
        sport: sport.toLowerCase(),
        teamIds,
        timestamp: new Date().toISOString(),
      };

      connection.send(JSON.stringify(subscriptionMessage));
      this.subscriptions.add(subscriptionKey);

      console.log(`[REALTIME] Subscribed to injury reports for ${sport}`);
    } catch (error) {
      console.error(`[REALTIME] Failed to subscribe to injury reports:`, error);
      this.emit(REALTIME_EVENTS.DATA_ERROR, { error: error.message, type: 'injury_subscription' });
    }
  }

  /**
   * Get or create WebSocket connection
   */
  private async getOrCreateConnection(type: 'sports' | 'odds'): Promise<WebSocket> {
    const existingConnection = this.connections.get(type);

    if (existingConnection && existingConnection.readyState === WebSocket.OPEN) {
      return existingConnection;
    }

    return this.createConnection(type);
  }

  /**
   * Create new WebSocket connection
   */
  private async createConnection(type: 'sports' | 'odds'): Promise<WebSocket> {
    return new Promise((resolve, reject) => {
      try {
        const url =
          type === 'sports'
            ? REALTIME_CONFIG.SPORTS_WEBSOCKET_URL
            : REALTIME_CONFIG.ODDS_WEBSOCKET_URL;

        const apiKey = type === 'sports' ? apiKeys.getSportsDataApiKey() : apiKeys.getOddsApiKey();

        const connectionUrl = `${url}?apikey=${apiKey}`;
        const ws = new WebSocket(connectionUrl);

        ws.onopen = () => {
          console.log(`[REALTIME] ${type} WebSocket connection established`);
          this.connections.set(type, ws);
          this.reconnectAttempts.set(type, 0);
          this.setupHeartbeat(type, ws);
          this.emit(REALTIME_EVENTS.CONNECTION_ESTABLISHED, { type });
          resolve(ws);
        };

        ws.onmessage = event => {
          this.handleMessage(type, event);
        };

        ws.onclose = () => {
          console.log(`[REALTIME] ${type} WebSocket connection closed`);
          this.connections.delete(type);
          this.clearHeartbeat(type);
          this.emit(REALTIME_EVENTS.CONNECTION_LOST, { type });
          this.attemptReconnection(type);
        };

        ws.onerror = error => {
          console.error(`[REALTIME] ${type} WebSocket error:`, error);
          this.emit(REALTIME_EVENTS.DATA_ERROR, { error: error.message, type: 'connection' });
          reject(error);
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Handle incoming WebSocket messages
   */
  private handleMessage(connectionType: string, event: MessageEvent): void {
    try {
      // Rate limiting check
      if (!this.checkRateLimit(connectionType)) {
        console.warn(`[REALTIME] Rate limit exceeded for ${connectionType}`);
        this.emit(REALTIME_EVENTS.RATE_LIMIT_WARNING, { connectionType });
        return;
      }

      const data = JSON.parse(event.data);

      // Handle different message types
      switch (data.type) {
        case 'live_score':
          this.handleLiveScoreUpdate(data);
          break;

        case 'odds_change':
          this.handleOddsMovement(data);
          break;

        case 'player_stat':
          this.handlePlayerStatUpdate(data);
          break;

        case 'injury_report':
          this.handleInjuryReport(data);
          break;

        case 'heartbeat':
          // Acknowledge heartbeat
          break;

        default:
          console.warn(`[REALTIME] Unknown message type: ${data.type}`);
      }
    } catch (error) {
      console.error(`[REALTIME] Error parsing message:`, error);
      this.emit(REALTIME_EVENTS.DATA_ERROR, { error: error.message, type: 'parsing' });
    }
  }

  /**
   * Handle live score updates
   */
  private handleLiveScoreUpdate(data: any): void {
    const scoreUpdate: LiveScoreUpdate = {
      gameId: data.gameId,
      sport: data.sport,
      homeTeam: data.homeTeam,
      awayTeam: data.awayTeam,
      homeScore: data.homeScore,
      awayScore: data.awayScore,
      quarter: data.quarter,
      timeRemaining: data.timeRemaining,
      gameStatus: data.status,
      lastUpdate: new Date().toISOString(),
    };

    // Update cache
    oddsCacheService.setCachedData(`live_score_${data.gameId}`, scoreUpdate, 5000, 'api');

    // Emit event
    this.emit(REALTIME_EVENTS.SCORE_UPDATE, scoreUpdate);

    console.log(
      `[REALTIME] Live score update: ${scoreUpdate.awayTeam} ${scoreUpdate.awayScore} - ${scoreUpdate.homeScore} ${scoreUpdate.homeTeam}`
    );
  }

  /**
   * Handle odds movement
   */
  private handleOddsMovement(data: any): void {
    const oddsMovement: OddsMovement = {
      gameId: data.gameId,
      sport: data.sport,
      bookmaker: data.bookmaker,
      market: data.market,
      oldOdds: data.oldOdds,
      newOdds: data.newOdds,
      movement:
        data.newOdds > data.oldOdds ? 'up' : data.newOdds < data.oldOdds ? 'down' : 'stable',
      movementSize: Math.abs(data.newOdds - data.oldOdds),
      timestamp: new Date().toISOString(),
    };

    // Update cache
    oddsCacheService.setCachedData(`odds_movement_${data.gameId}`, oddsMovement, 5000, 'api');

    // Emit event
    this.emit(REALTIME_EVENTS.ODDS_CHANGE, oddsMovement);

    console.log(
      `[REALTIME] Odds movement: ${oddsMovement.bookmaker} ${oddsMovement.market} ${oddsMovement.oldOdds} → ${oddsMovement.newOdds}`
    );
  }

  /**
   * Handle player statistics updates
   */
  private handlePlayerStatUpdate(data: any): void {
    const statUpdate: PlayerStatUpdate = {
      gameId: data.gameId,
      playerId: data.playerId,
      playerName: data.playerName,
      team: data.team,
      statType: data.statType,
      value: data.value,
      quarter: data.quarter,
      timestamp: new Date().toISOString(),
    };

    // Update cache
    oddsCacheService.setCachedData(
      `player_stat_${data.playerId}_${data.statType}`,
      statUpdate,
      10000,
      'api'
    );

    // Emit event
    this.emit(REALTIME_EVENTS.PLAYER_STAT_UPDATE, statUpdate);

    console.log(
      `[REALTIME] Player stat update: ${statUpdate.playerName} ${statUpdate.statType}: ${statUpdate.value}`
    );
  }

  /**
   * Handle injury reports
   */
  private handleInjuryReport(data: any): void {
    const injuryReport: InjuryReport = {
      playerId: data.playerId,
      playerName: data.playerName,
      team: data.team,
      sport: data.sport,
      injuryType: data.injuryType,
      severity: data.severity,
      expectedReturn: data.expectedReturn,
      timestamp: new Date().toISOString(),
    };

    // Update cache
    oddsCacheService.setCachedData(`injury_${data.playerId}`, injuryReport, 60000, 'api');

    // Emit event
    this.emit(REALTIME_EVENTS.INJURY_REPORT, injuryReport);

    console.log(
      `[REALTIME] Injury report: ${injuryReport.playerName} - ${injuryReport.injuryType} (${injuryReport.severity})`
    );
  }

  /**
   * Setup heartbeat for connection health monitoring
   */
  private setupHeartbeat(type: string, ws: WebSocket): void {
    const interval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'heartbeat', timestamp: Date.now() }));
      } else {
        this.clearHeartbeat(type);
      }
    }, REALTIME_CONFIG.HEARTBEAT_INTERVAL);

    this.heartbeatIntervals.set(type, interval);
  }

  /**
   * Clear heartbeat interval
   */
  private clearHeartbeat(type: string): void {
    const interval = this.heartbeatIntervals.get(type);
    if (interval) {
      clearInterval(interval);
      this.heartbeatIntervals.delete(type);
    }
  }

  /**
   * Attempt to reconnect on connection loss
   */
  private async attemptReconnection(type: 'sports' | 'odds'): Promise<void> {
    const attempts = this.reconnectAttempts.get(type) || 0;

    if (attempts >= REALTIME_CONFIG.MAX_RECONNECT_ATTEMPTS) {
      console.error(`[REALTIME] Max reconnection attempts reached for ${type}`);
      return;
    }

    this.reconnectAttempts.set(type, attempts + 1);

    console.log(`[REALTIME] Attempting to reconnect ${type} (attempt ${attempts + 1})`);
    this.emit(REALTIME_EVENTS.RECONNECTING, { type, attempt: attempts + 1 });

    setTimeout(
      async () => {
        try {
          await this.createConnection(type);
          console.log(`[REALTIME] Successfully reconnected ${type}`);
        } catch (error) {
          console.error(`[REALTIME] Reconnection failed for ${type}:`, error);
          this.attemptReconnection(type);
        }
      },
      REALTIME_CONFIG.RECONNECT_DELAY * (attempts + 1)
    );
  }

  /**
   * Check rate limiting
   */
  private checkRateLimit(connectionType: string): boolean {
    const now = Date.now();
    const window = 1000; // 1 second window

    if (!this.updateRateLimiter.has(connectionType)) {
      this.updateRateLimiter.set(connectionType, []);
    }

    const timestamps = this.updateRateLimiter.get(connectionType)!;

    // Remove old timestamps
    const cutoff = now - window;
    const validTimestamps = timestamps.filter(ts => ts > cutoff);

    // Check if under limit
    if (validTimestamps.length >= REALTIME_CONFIG.MAX_UPDATES_PER_SECOND) {
      return false;
    }

    // Add current timestamp
    validTimestamps.push(now);
    this.updateRateLimiter.set(connectionType, validTimestamps);

    return true;
  }

  /**
   * Initialize connections
   */
  private async initializeConnections(): Promise<void> {
    // Create initial connections but don't fail if they don't connect immediately
    try {
      await this.createConnection('sports');
    } catch (error) {
      console.warn('[REALTIME] Initial sports connection failed, will retry on first subscription');
    }

    try {
      await this.createConnection('odds');
    } catch (error) {
      console.warn('[REALTIME] Initial odds connection failed, will retry on first subscription');
    }
  }

  /**
   * Setup error handling
   */
  private setupErrorHandling(): void {
    this.on('error', error => {
      console.error('[REALTIME] Service error:', error);

      securityMonitoringService.logIncident({
        severity: SEVERITY_LEVELS.MEDIUM,
        type: INCIDENT_TYPES.SUSPICIOUS_ACTIVITY,
        source: 'realtime_data_service',
        message: `Real-time service error: ${error.message}`,
        details: { error: error.message },
      });
    });
  }

  /**
   * Setup rate limiting monitoring
   */
  private setupRateLimiting(): void {
    this.on(REALTIME_EVENTS.RATE_LIMIT_WARNING, data => {
      securityMonitoringService.logIncident({
        severity: SEVERITY_LEVELS.LOW,
        type: INCIDENT_TYPES.RATE_LIMIT_EXCEEDED,
        source: 'realtime_data_service',
        message: `Rate limit warning for ${data.connectionType}`,
        details: data,
      });
    });
  }

  /**
   * Unsubscribe from updates
   */
  async unsubscribe(subscriptionKey: string): Promise<void> {
    if (this.subscriptions.has(subscriptionKey)) {
      this.subscriptions.delete(subscriptionKey);
      console.log(`[REALTIME] Unsubscribed from ${subscriptionKey}`);
    }
  }

  /**
   * Disconnect all connections
   */
  async disconnect(): Promise<void> {
    console.log('[REALTIME] Disconnecting all real-time connections...');

    // Clear all heartbeat intervals
    this.heartbeatIntervals.forEach(interval => {
      clearInterval(interval);
    });
    this.heartbeatIntervals.clear();

    // Close all connections
    this.connections.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    });

    this.connections.clear();
    this.subscriptions.clear();
    this.reconnectAttempts.clear();
    this.updateRateLimiter.clear();

    this.isInitialized = false;
    console.log('[REALTIME] All real-time connections disconnected');
  }

  /**
   * Get service status
   */
  getStatus(): {
    isInitialized: boolean;
    activeConnections: string[];
    activeSubscriptions: string[];
    reconnectAttempts: { [key: string]: number };
  } {
    return {
      isInitialized: this.isInitialized,
      activeConnections: Array.from(this.connections.keys()),
      activeSubscriptions: Array.from(this.subscriptions),
      reconnectAttempts: Object.fromEntries(this.reconnectAttempts),
    };
  }
}

// Export singleton instance
export const realTimeDataService = new RealTimeDataService();
