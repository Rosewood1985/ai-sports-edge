/**
 * Real-Time Integration Service
 * 
 * Unified interface for all real-time sports data integration
 * Coordinates NBA stats, UFC data, odds tracking, and live updates
 */

import { EventEmitter } from 'events';
import { realTimeDataService, REALTIME_EVENTS } from './realTimeDataService';
import { nbaRealTimeStatsService } from './nba/nbaRealTimeStatsService';
import { ufcRealTimeDataService } from './ufc/ufcRealTimeDataService';
import { liveOddsTrackingService } from './liveOddsTrackingService';
import { oddsCacheService } from './oddsCacheService';
import * as Sentry from '@sentry/react-native';

// Integration events
export const INTEGRATION_EVENTS = {
  // Service status
  SERVICE_INITIALIZED: 'service_initialized',
  SERVICE_ERROR: 'service_error',
  
  // Data updates
  LIVE_SCORE_UPDATE: 'live_score_update',
  ODDS_MOVEMENT: 'odds_movement',
  PLAYER_STAT_UPDATE: 'player_stat_update',
  FIGHT_UPDATE: 'fight_update',
  
  // Alerts
  SIGNIFICANT_MOVEMENT_ALERT: 'significant_movement_alert',
  INJURY_ALERT: 'injury_alert',
  
  // Connection status
  CONNECTION_STATUS_CHANGE: 'connection_status_change',
};

// Service status interface
interface ServiceStatus {
  name: string;
  isInitialized: boolean;
  isConnected: boolean;
  lastUpdate: string | null;
  errorCount: number;
  subscriptions: number;
}

// Real-time data summary
interface RealTimeDataSummary {
  totalActiveSubscriptions: number;
  trackedGames: number;
  trackedFights: number;
  recentAlerts: number;
  oddsMovements: number;
  connectionStatus: 'healthy' | 'degraded' | 'disconnected';
  lastDataUpdate: string;
}

/**
 * Real-Time Integration Service
 * Main coordinator for all real-time sports data services
 */
export class RealTimeIntegrationService extends EventEmitter {
  private isInitialized: boolean = false;
  private serviceStatuses: Map<string, ServiceStatus> = new Map();
  private healthCheckInterval?: NodeJS.Timeout;
  private errorCounts: Map<string, number> = new Map();

  constructor() {
    super();
    this.setMaxListeners(100);
  }

  /**
   * Initialize all real-time services
   */
  async initialize(): Promise<void> {
    try {
      console.log('[REALTIME INTEGRATION] Initializing real-time integration service...');

      // Initialize services in parallel for better performance
      const initPromises = [
        this.initializeService('realTimeData', () => realTimeDataService.initialize()),
        this.initializeService('nbaRealTimeStats', () => nbaRealTimeStatsService.initialize()),
        this.initializeService('ufcRealTimeData', () => ufcRealTimeDataService.initialize()),
        this.initializeService('liveOddsTracking', () => liveOddsTrackingService.initialize()),
      ];

      // Wait for all services to initialize
      const results = await Promise.allSettled(initPromises);

      // Check for failures
      const failures = results.filter(result => result.status === 'rejected');
      if (failures.length > 0) {
        console.warn(`[REALTIME INTEGRATION] ${failures.length} services failed to initialize`);
        failures.forEach((failure, index) => {
          console.error(`Service ${index} initialization error:`, failure.reason);
        });
      }

      // Setup cross-service event forwarding
      this.setupEventForwarding();

      // Start health monitoring
      this.startHealthMonitoring();

      this.isInitialized = true;
      console.log('[REALTIME INTEGRATION] Real-time integration service initialized');
      
      this.emit(INTEGRATION_EVENTS.SERVICE_INITIALIZED, {
        timestamp: new Date().toISOString(),
        successfulServices: results.filter(r => r.status === 'fulfilled').length,
        failedServices: failures.length,
      });

    } catch (error) {
      console.error('[REALTIME INTEGRATION] Failed to initialize integration service:', error);
      Sentry.captureException(error);
      this.emit(INTEGRATION_EVENTS.SERVICE_ERROR, { error: error.message });
      throw error;
    }
  }

  /**
   * Initialize individual service with error handling
   */
  private async initializeService(serviceName: string, initFunction: () => Promise<void>): Promise<void> {
    try {
      console.log(`[REALTIME INTEGRATION] Initializing ${serviceName}...`);
      await initFunction();
      
      this.serviceStatuses.set(serviceName, {
        name: serviceName,
        isInitialized: true,
        isConnected: true,
        lastUpdate: new Date().toISOString(),
        errorCount: 0,
        subscriptions: 0,
      });
      
      console.log(`[REALTIME INTEGRATION] ${serviceName} initialized successfully`);
      
    } catch (error) {
      console.error(`[REALTIME INTEGRATION] Failed to initialize ${serviceName}:`, error);
      
      this.serviceStatuses.set(serviceName, {
        name: serviceName,
        isInitialized: false,
        isConnected: false,
        lastUpdate: null,
        errorCount: 1,
        subscriptions: 0,
      });
      
      // Don't rethrow - allow other services to continue initializing
    }
  }

  /**
   * Setup event forwarding between services
   */
  private setupEventForwarding(): void {
    // Forward real-time data events
    realTimeDataService.on(REALTIME_EVENTS.SCORE_UPDATE, (data) => {
      this.emit(INTEGRATION_EVENTS.LIVE_SCORE_UPDATE, data);
      this.updateServiceStatus('realTimeData');
    });

    realTimeDataService.on(REALTIME_EVENTS.ODDS_CHANGE, (data) => {
      this.emit(INTEGRATION_EVENTS.ODDS_MOVEMENT, data);
      this.updateServiceStatus('realTimeData');
    });

    realTimeDataService.on(REALTIME_EVENTS.PLAYER_STAT_UPDATE, (data) => {
      this.emit(INTEGRATION_EVENTS.PLAYER_STAT_UPDATE, data);
      this.updateServiceStatus('realTimeData');
    });

    realTimeDataService.on(REALTIME_EVENTS.INJURY_REPORT, (data) => {
      this.emit(INTEGRATION_EVENTS.INJURY_ALERT, data);
      this.updateServiceStatus('realTimeData');
    });

    // Forward odds tracking events
    liveOddsTrackingService.on('significant_movement', (data) => {
      this.emit(INTEGRATION_EVENTS.SIGNIFICANT_MOVEMENT_ALERT, data);
      this.updateServiceStatus('liveOddsTracking');
    });

    liveOddsTrackingService.on('odds_alert', (data) => {
      this.emit(INTEGRATION_EVENTS.SIGNIFICANT_MOVEMENT_ALERT, data);
      this.updateServiceStatus('liveOddsTracking');
    });

    // Handle connection status changes
    realTimeDataService.on(REALTIME_EVENTS.CONNECTION_ESTABLISHED, (data) => {
      this.updateConnectionStatus('realTimeData', true);
    });

    realTimeDataService.on(REALTIME_EVENTS.CONNECTION_LOST, (data) => {
      this.updateConnectionStatus('realTimeData', false);
    });
  }

  /**
   * Update service status
   */
  private updateServiceStatus(serviceName: string): void {
    const status = this.serviceStatuses.get(serviceName);
    if (status) {
      status.lastUpdate = new Date().toISOString();
      this.serviceStatuses.set(serviceName, status);
    }
  }

  /**
   * Update connection status
   */
  private updateConnectionStatus(serviceName: string, isConnected: boolean): void {
    const status = this.serviceStatuses.get(serviceName);
    if (status) {
      status.isConnected = isConnected;
      this.serviceStatuses.set(serviceName, status);
      
      this.emit(INTEGRATION_EVENTS.CONNECTION_STATUS_CHANGE, {
        serviceName,
        isConnected,
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Start comprehensive game tracking
   */
  async startGameTracking(gameId: string, sport: string, homeTeam: string, awayTeam: string, gameDate: string): Promise<void> {
    try {
      console.log(`[REALTIME INTEGRATION] Starting comprehensive tracking for ${sport} game: ${homeTeam} vs ${awayTeam}`);

      // Start live score tracking
      await realTimeDataService.subscribeToLiveScores(gameId, sport);

      // Start odds tracking
      await liveOddsTrackingService.startTrackingGame(gameId, sport, homeTeam, awayTeam, gameDate);

      // Sport-specific tracking
      switch (sport.toUpperCase()) {
        case 'NBA':
        case 'WNBA':
          // Get player IDs for stat tracking (simplified - would need real player lookup)
          const playerIds = ['player1', 'player2']; // This would be real player IDs
          await realTimeDataService.subscribeToPlayerStats(gameId, playerIds);
          break;

        case 'UFC':
        case 'MMA':
          await ufcRealTimeDataService.subscribeToLiveFight(gameId);
          break;
      }

      console.log(`[REALTIME INTEGRATION] Comprehensive tracking started for game ${gameId}`);

    } catch (error) {
      console.error(`[REALTIME INTEGRATION] Failed to start game tracking for ${gameId}:`, error);
      Sentry.captureException(error);
      this.emit(INTEGRATION_EVENTS.SERVICE_ERROR, { 
        error: error.message, 
        gameId, 
        operation: 'start_tracking' 
      });
    }
  }

  /**
   * Stop game tracking
   */
  async stopGameTracking(gameId: string, sport: string): Promise<void> {
    try {
      console.log(`[REALTIME INTEGRATION] Stopping tracking for ${sport} game ${gameId}`);

      // Stop live score tracking
      await realTimeDataService.unsubscribe(`scores_${sport.toLowerCase()}_${gameId}`);

      // Stop odds tracking
      await liveOddsTrackingService.stopTrackingGame(gameId);

      // Sport-specific cleanup
      switch (sport.toUpperCase()) {
        case 'NBA':
        case 'WNBA':
          await realTimeDataService.unsubscribe(`stats_${gameId}`);
          break;

        case 'UFC':
        case 'MMA':
          // UFC-specific cleanup would go here
          break;
      }

      console.log(`[REALTIME INTEGRATION] Tracking stopped for game ${gameId}`);

    } catch (error) {
      console.error(`[REALTIME INTEGRATION] Failed to stop game tracking for ${gameId}:`, error);
      Sentry.captureException(error);
    }
  }

  /**
   * Get NBA player statistics
   */
  async getNBAPlayerStats(playerId: string): Promise<any> {
    try {
      return await nbaRealTimeStatsService.getPlayerStats(playerId);
    } catch (error) {
      console.error(`[REALTIME INTEGRATION] Error getting NBA player stats:`, error);
      return null;
    }
  }

  /**
   * Get UFC fight data
   */
  async getUFCFightData(fightId: string): Promise<any> {
    try {
      // This would get specific fight data - simplified for now
      const events = await ufcRealTimeDataService.getUpcomingEvents();
      for (const event of events) {
        const fight = event.fights.find(f => f.id === fightId);
        if (fight) return fight;
      }
      return null;
    } catch (error) {
      console.error(`[REALTIME INTEGRATION] Error getting UFC fight data:`, error);
      return null;
    }
  }

  /**
   * Get odds movement data
   */
  getOddsMovementData(gameId: string): any {
    try {
      return liveOddsTrackingService.getGameTrackingData(gameId);
    } catch (error) {
      console.error(`[REALTIME INTEGRATION] Error getting odds movement data:`, error);
      return null;
    }
  }

  /**
   * Start health monitoring
   */
  private startHealthMonitoring(): void {
    this.healthCheckInterval = setInterval(() => {
      this.performHealthCheck();
    }, 60000); // Check every minute
  }

  /**
   * Perform health check on all services
   */
  private performHealthCheck(): void {
    try {
      // Check each service status
      this.serviceStatuses.forEach((status, serviceName) => {
        if (status.lastUpdate) {
          const lastUpdateTime = new Date(status.lastUpdate).getTime();
          const now = Date.now();
          const timeSinceUpdate = now - lastUpdateTime;
          
          // Consider service unhealthy if no updates for 5 minutes
          if (timeSinceUpdate > 5 * 60 * 1000) {
            status.isConnected = false;
            this.emit(INTEGRATION_EVENTS.CONNECTION_STATUS_CHANGE, {
              serviceName,
              isConnected: false,
              timestamp: new Date().toISOString(),
              reason: 'No recent updates',
            });
          }
        }
      });

    } catch (error) {
      console.error('[REALTIME INTEGRATION] Health check error:', error);
    }
  }

  /**
   * Get comprehensive status summary
   */
  getStatusSummary(): RealTimeDataSummary {
    const realTimeStatus = realTimeDataService.getStatus();
    const nbaStatus = nbaRealTimeStatsService.getStatus();
    const ufcStatus = ufcRealTimeDataService.getStatus();
    const oddsStatus = liveOddsTrackingService.getStatus();

    const totalSubscriptions = realTimeStatus.activeSubscriptions.length +
                              nbaStatus.subscribedGames.length +
                              ufcStatus.subscribedFights.length +
                              oddsStatus.trackedGamesCount;

    const healthyServices = Array.from(this.serviceStatuses.values())
      .filter(status => status.isInitialized && status.isConnected).length;
    const totalServices = this.serviceStatuses.size;

    let connectionStatus: 'healthy' | 'degraded' | 'disconnected' = 'healthy';
    if (healthyServices === 0) {
      connectionStatus = 'disconnected';
    } else if (healthyServices < totalServices) {
      connectionStatus = 'degraded';
    }

    return {
      totalActiveSubscriptions: totalSubscriptions,
      trackedGames: oddsStatus.trackedGamesCount,
      trackedFights: ufcStatus.subscribedFights.length,
      recentAlerts: oddsStatus.recentAlertsCount,
      oddsMovements: oddsStatus.totalMovements,
      connectionStatus,
      lastDataUpdate: this.getLastDataUpdate(),
    };
  }

  /**
   * Get the timestamp of the most recent data update
   */
  private getLastDataUpdate(): string {
    let mostRecent = new Date(0).toISOString();
    
    this.serviceStatuses.forEach(status => {
      if (status.lastUpdate && status.lastUpdate > mostRecent) {
        mostRecent = status.lastUpdate;
      }
    });
    
    return mostRecent;
  }

  /**
   * Get service statuses
   */
  getServiceStatuses(): ServiceStatus[] {
    return Array.from(this.serviceStatuses.values());
  }

  /**
   * Get recent alerts across all services
   */
  getRecentAlerts(limit: number = 20): any[] {
    const oddsAlerts = liveOddsTrackingService.getRecentAlerts(limit);
    // Could add other alert sources here
    
    return oddsAlerts
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }

  /**
   * Shutdown all services
   */
  async shutdown(): Promise<void> {
    try {
      console.log('[REALTIME INTEGRATION] Shutting down all real-time services...');

      // Clear health check interval
      if (this.healthCheckInterval) {
        clearInterval(this.healthCheckInterval);
      }

      // Shutdown services in parallel
      const shutdownPromises = [
        realTimeDataService.disconnect(),
        nbaRealTimeStatsService.cleanup(),
        ufcRealTimeDataService.cleanup(),
        liveOddsTrackingService.shutdown(),
      ];

      await Promise.allSettled(shutdownPromises);

      this.serviceStatuses.clear();
      this.errorCounts.clear();
      this.isInitialized = false;

      console.log('[REALTIME INTEGRATION] All real-time services shut down');

    } catch (error) {
      console.error('[REALTIME INTEGRATION] Error during shutdown:', error);
    }
  }

  /**
   * Get initialization status
   */
  isServiceInitialized(): boolean {
    return this.isInitialized;
  }
}

// Export singleton instance
export const realTimeIntegrationService = new RealTimeIntegrationService();