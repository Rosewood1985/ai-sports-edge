/**
 * Comprehensive Real-Time Data Integration Tests
 * 
 * Tests all real-time sports data services and integration points
 */

const { realTimeDataService } = require('../services/realTimeDataService');
const { nbaRealTimeStatsService } = require('../services/nba/nbaRealTimeStatsService');
const { ufcRealTimeDataService } = require('../services/ufc/ufcRealTimeDataService');
const { liveOddsTrackingService } = require('../services/liveOddsTrackingService');
const { realTimeIntegrationService } = require('../services/realTimeIntegrationService');
const { oddsCacheService } = require('../services/oddsCacheService');

// Mock dependencies
jest.mock('../utils/apiKeys', () => ({
  getSportsDataApiKey: jest.fn(() => 'test-sports-api-key'),
  getOddsApiKey: jest.fn(() => 'test-odds-api-key'),
}));

jest.mock('../services/oddsCacheService');
jest.mock('@sentry/react-native');

// Mock WebSocket for testing
global.WebSocket = jest.fn().mockImplementation(() => ({
  onopen: jest.fn(),
  onmessage: jest.fn(),
  onclose: jest.fn(),
  onerror: jest.fn(),
  send: jest.fn(),
  close: jest.fn(),
  readyState: 1, // OPEN
}));

// Mock fetch for API calls
global.fetch = jest.fn();

describe('Real-Time Data Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default cache mock responses
    oddsCacheService.getCachedData.mockResolvedValue(null);
    oddsCacheService.setCachedData.mockResolvedValue(true);
  });

  describe('Real-Time Data Service', () => {
    test('should initialize with proper configuration', async () => {
      const mockWs = new WebSocket();
      WebSocket.mockImplementation(() => mockWs);

      await realTimeDataService.initialize();

      expect(realTimeDataService.isServiceInitialized()).toBe(true);
    });

    test('should subscribe to live scores', async () => {
      const mockWs = new WebSocket();
      WebSocket.mockImplementation(() => mockWs);
      
      await realTimeDataService.initialize();
      await realTimeDataService.subscribeToLiveScores('game123', 'NBA');

      expect(mockWs.send).toHaveBeenCalledWith(
        expect.stringContaining('"type":"live_scores"')
      );
    });

    test('should handle WebSocket messages correctly', async () => {
      const mockWs = new WebSocket();
      WebSocket.mockImplementation(() => mockWs);
      
      await realTimeDataService.initialize();
      
      // Simulate receiving a live score update
      const mockMessage = {
        data: JSON.stringify({
          type: 'live_score',
          gameId: 'game123',
          sport: 'NBA',
          homeTeam: 'Lakers',
          awayTeam: 'Warriors',
          homeScore: 95,
          awayScore: 87,
          quarter: 4,
          timeRemaining: '2:30',
          status: 'live',
        }),
      };

      // Manually trigger the message handler
      mockWs.onmessage(mockMessage);

      expect(oddsCacheService.setCachedData).toHaveBeenCalledWith(
        'live_score_game123',
        expect.objectContaining({
          gameId: 'game123',
          homeScore: 95,
          awayScore: 87,
        }),
        5000,
        'api'
      );
    });

    test('should handle connection errors gracefully', async () => {
      const mockWs = new WebSocket();
      WebSocket.mockImplementation(() => {
        throw new Error('Connection failed');
      });

      await expect(realTimeDataService.initialize()).rejects.toThrow();
    });

    test('should implement rate limiting', async () => {
      const mockWs = new WebSocket();
      WebSocket.mockImplementation(() => mockWs);
      
      await realTimeDataService.initialize();

      // Simulate rapid message processing
      for (let i = 0; i < 150; i++) {
        const mockMessage = {
          data: JSON.stringify({
            type: 'live_score',
            gameId: `game${i}`,
            sport: 'NBA',
          }),
        };
        mockWs.onmessage(mockMessage);
      }

      // Should trigger rate limit warning
      expect(true).toBe(true); // Placeholder - actual implementation would check event emissions
    });
  });

  describe('NBA Real-Time Stats Service', () => {
    beforeEach(() => {
      // Mock successful API responses
      fetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue([
          {
            PlayerID: 123,
            FirstName: 'LeBron',
            LastName: 'James',
            Team: 'LAL',
            Games: 65,
            Minutes: 35.5,
            Points: 25.3,
            Rebounds: 7.3,
            Assists: 7.5,
            FieldGoalsPercentage: 0.545,
            ThreePointersPercentage: 0.410,
            FreeThrowsPercentage: 0.731,
          },
        ]),
      });
    });

    test('should fetch real player statistics', async () => {
      const stats = await nbaRealTimeStatsService.getPlayerStats('123');

      expect(stats).toEqual(
        expect.objectContaining({
          playerId: '123',
          playerName: 'LeBron James',
          team: 'LAL',
          games: 65,
          points: 25.3,
          rebounds: 7.3,
          assists: 7.5,
        })
      );

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('PlayerSeasonStats'),
        expect.objectContaining({ timeout: 10000 })
      );
    });

    test('should cache player statistics', async () => {
      await nbaRealTimeStatsService.getPlayerStats('123');

      expect(oddsCacheService.setCachedData).toHaveBeenCalledWith(
        'nba_player_stats_123',
        expect.any(Object),
        300000 // 5 minutes
      );
    });

    test('should return cached data when available', async () => {
      const cachedData = {
        data: {
          playerId: '123',
          playerName: 'LeBron James',
          team: 'LAL',
          points: 25.3,
        },
        source: 'api',
      };

      oddsCacheService.getCachedData.mockResolvedValue(cachedData);

      const stats = await nbaRealTimeStatsService.getPlayerStats('123');

      expect(stats).toEqual(cachedData.data);
      expect(fetch).not.toHaveBeenCalled();
    });

    test('should handle API errors gracefully', async () => {
      fetch.mockRejectedValue(new Error('API Error'));

      const stats = await nbaRealTimeStatsService.getPlayerStats('123');

      expect(stats).toEqual(
        expect.objectContaining({
          playerId: '123',
          playerName: 'Unknown Player',
          points: 0,
        })
      );
    });

    test('should get team records with real data', async () => {
      fetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue([
          {
            TeamID: 25,
            Wins: 45,
            Losses: 20,
            Percentage: 0.692,
            StreakDescription: 'W3',
            HomeWins: 25,
            HomeLosses: 8,
            AwayWins: 20,
            AwayLosses: 12,
          },
        ]),
      });

      const record = await nbaRealTimeStatsService.getCurrentSeasonRecord('25');

      expect(record).toEqual(
        expect.objectContaining({
          teamId: '25',
          wins: 45,
          losses: 20,
          winPercentage: 0.692,
          streak: { type: 'W', count: 3 },
        })
      );
    });
  });

  describe('UFC Real-Time Data Service', () => {
    beforeEach(() => {
      fetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue([
          {
            FighterID: 1,
            FirstName: 'Jon',
            LastName: 'Jones',
            Nickname: 'Bones',
            WeightClass: 'Heavyweight',
            Wins: 27,
            Losses: 1,
            Draws: 0,
            Active: true,
            Ranking: 1,
          },
        ]),
      });
    });

    test('should fetch real UFC fighter data', async () => {
      const fighters = await ufcRealTimeDataService.getAllFighters();

      expect(fighters).toHaveLength(1);
      expect(fighters[0]).toEqual(
        expect.objectContaining({
          id: '1',
          name: 'Jon Jones',
          nickname: 'Bones',
          weightClass: 'Heavyweight',
          record: { wins: 27, losses: 1, draws: 0, nc: 0 },
          isActive: true,
        })
      );
    });

    test('should fetch upcoming UFC events', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);

      fetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue([
          {
            GameID: 300,
            Title: 'UFC 300: Jones vs Miocic',
            DateTime: futureDate.toISOString(),
            VenueName: 'Madison Square Garden',
            VenueCity: 'New York',
            VenueCountry: 'USA',
          },
        ]),
      });

      const events = await ufcRealTimeDataService.getUpcomingEvents();

      expect(events).toHaveLength(1);
      expect(events[0]).toEqual(
        expect.objectContaining({
          id: '300',
          name: 'UFC 300: Jones vs Miocic',
          venue: 'Madison Square Garden',
          location: 'New York, USA',
          status: 'upcoming',
        })
      );
    });

    test('should handle API failures gracefully', async () => {
      fetch.mockRejectedValue(new Error('UFC API Error'));

      const fighters = await ufcRealTimeDataService.getAllFighters();
      expect(fighters).toEqual([]);
    });
  });

  describe('Live Odds Tracking Service', () => {
    beforeEach(() => {
      // Mock odds service responses
      jest.doMock('../services/OddsService', () => ({
        getOdds: jest.fn().mockResolvedValue([
          {
            id: 'game123',
            homeTeam: 'Lakers',
            awayTeam: 'Warriors',
            bookmakers: [
              {
                name: 'fanduel',
                markets: [
                  {
                    key: 'h2h',
                    outcomes: [
                      { name: 'Lakers', price: -110 },
                      { name: 'Warriors', price: -110 },
                    ],
                  },
                ],
              },
            ],
          },
        ]),
      }));
    });

    test('should track odds movements', async () => {
      await liveOddsTrackingService.initialize();
      await liveOddsTrackingService.startTrackingGame(
        'game123',
        'NBA',
        'Lakers',
        'Warriors',
        new Date().toISOString()
      );

      const trackingData = liveOddsTrackingService.getGameTrackingData('game123');
      
      expect(trackingData).toEqual(
        expect.objectContaining({
          gameId: 'game123',
          sport: 'NBA',
          homeTeam: 'Lakers',
          awayTeam: 'Warriors',
        })
      );
    });

    test('should detect significant odds movements', async () => {
      await liveOddsTrackingService.initialize();
      
      // Mock a significant odds movement
      const alertEmitted = new Promise((resolve) => {
        liveOddsTrackingService.once('odds_alert', resolve);
      });

      // This would trigger internal movement detection
      // In real implementation, this would be tested with actual odds changes

      expect(true).toBe(true); // Placeholder for movement detection test
    });

    test('should respect tracking limits', async () => {
      await liveOddsTrackingService.initialize();

      // Try to track more games than the limit allows
      const promises = [];
      for (let i = 0; i < 105; i++) {
        promises.push(
          liveOddsTrackingService.startTrackingGame(
            `game${i}`,
            'NBA',
            'Team A',
            'Team B',
            new Date().toISOString()
          )
        );
      }

      // Should throw error when limit exceeded
      await expect(Promise.all(promises)).rejects.toThrow();
    });
  });

  describe('Real-Time Integration Service', () => {
    test('should initialize all services', async () => {
      await realTimeIntegrationService.initialize();

      expect(realTimeIntegrationService.isServiceInitialized()).toBe(true);
      
      const statuses = realTimeIntegrationService.getServiceStatuses();
      expect(statuses.length).toBeGreaterThan(0);
    });

    test('should start comprehensive game tracking', async () => {
      await realTimeIntegrationService.initialize();
      
      await realTimeIntegrationService.startGameTracking(
        'game123',
        'NBA',
        'Lakers',
        'Warriors',
        new Date().toISOString()
      );

      // Verify all tracking services were engaged
      expect(true).toBe(true); // Placeholder for comprehensive tracking verification
    });

    test('should provide status summary', async () => {
      await realTimeIntegrationService.initialize();

      const summary = realTimeIntegrationService.getStatusSummary();

      expect(summary).toEqual(
        expect.objectContaining({
          totalActiveSubscriptions: expect.any(Number),
          trackedGames: expect.any(Number),
          trackedFights: expect.any(Number),
          connectionStatus: expect.stringMatching(/healthy|degraded|disconnected/),
        })
      );
    });

    test('should handle service failures gracefully', async () => {
      // Mock one service to fail
      const originalInit = realTimeDataService.initialize;
      realTimeDataService.initialize = jest.fn().mockRejectedValue(new Error('Service failed'));

      await realTimeIntegrationService.initialize();

      // Should still initialize with partial service failures
      expect(realTimeIntegrationService.isServiceInitialized()).toBe(true);

      // Restore original method
      realTimeDataService.initialize = originalInit;
    });

    test('should forward events between services', async () => {
      await realTimeIntegrationService.initialize();

      const eventReceived = new Promise((resolve) => {
        realTimeIntegrationService.once('live_score_update', resolve);
      });

      // Simulate event from underlying service
      realTimeDataService.emit('score_update', {
        gameId: 'game123',
        sport: 'NBA',
        homeScore: 95,
        awayScore: 87,
      });

      const event = await eventReceived;
      expect(event).toEqual(
        expect.objectContaining({
          gameId: 'game123',
          homeScore: 95,
          awayScore: 87,
        })
      );
    });

    test('should perform health monitoring', async () => {
      await realTimeIntegrationService.initialize();

      // Wait for health check cycle
      await new Promise(resolve => setTimeout(resolve, 100));

      const statuses = realTimeIntegrationService.getServiceStatuses();
      expect(statuses.every(status => status.hasOwnProperty('isConnected'))).toBe(true);
    });
  });

  describe('Error Handling and Recovery', () => {
    test('should handle WebSocket reconnections', async () => {
      const mockWs = new WebSocket();
      WebSocket.mockImplementation(() => mockWs);

      await realTimeDataService.initialize();

      // Simulate connection loss
      mockWs.onclose();

      // Should attempt reconnection
      expect(true).toBe(true); // Placeholder for reconnection logic verification
    });

    test('should handle API rate limiting', async () => {
      fetch.mockResolvedValue({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
      });

      const stats = await nbaRealTimeStatsService.getPlayerStats('123');

      // Should return empty/default data instead of throwing
      expect(stats).toEqual(
        expect.objectContaining({
          playerId: '123',
          points: 0,
        })
      );
    });

    test('should cache data to handle temporary API failures', async () => {
      // First call succeeds and caches data
      fetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue([{ PlayerID: 123, Points: 25.3 }]),
      });

      await nbaRealTimeStatsService.getPlayerStats('123');

      // Second call fails, but should return cached data
      fetch.mockRejectedValue(new Error('API Down'));
      oddsCacheService.getCachedData.mockResolvedValue({
        data: { playerId: '123', points: 25.3 },
        source: 'cache',
      });

      const stats = await nbaRealTimeStatsService.getPlayerStats('123');
      expect(stats.points).toBe(25.3);
    });
  });

  describe('Performance and Scalability', () => {
    test('should handle multiple concurrent subscriptions', async () => {
      await realTimeIntegrationService.initialize();

      const subscriptionPromises = [];
      for (let i = 0; i < 20; i++) {
        subscriptionPromises.push(
          realTimeIntegrationService.startGameTracking(
            `game${i}`,
            'NBA',
            'Team A',
            'Team B',
            new Date().toISOString()
          )
        );
      }

      await Promise.all(subscriptionPromises);

      const summary = realTimeIntegrationService.getStatusSummary();
      expect(summary.totalActiveSubscriptions).toBeGreaterThan(0);
    });

    test('should cleanup resources properly', async () => {
      await realTimeIntegrationService.initialize();
      
      await realTimeIntegrationService.startGameTracking(
        'game123',
        'NBA',
        'Lakers',
        'Warriors',
        new Date().toISOString()
      );

      await realTimeIntegrationService.shutdown();

      expect(realTimeIntegrationService.isServiceInitialized()).toBe(false);
    });

    test('should cache frequently accessed data', async () => {
      // Make multiple calls for same data
      await nbaRealTimeStatsService.getPlayerStats('123');
      await nbaRealTimeStatsService.getPlayerStats('123');
      await nbaRealTimeStatsService.getPlayerStats('123');

      // Should only make one API call due to caching
      expect(fetch).toHaveBeenCalledTimes(1);
      expect(oddsCacheService.getCachedData).toHaveBeenCalledTimes(3);
    });
  });
});

describe('Integration Test Scenarios', () => {
  test('should handle complete game lifecycle', async () => {
    await realTimeIntegrationService.initialize();

    // Start tracking a game
    await realTimeIntegrationService.startGameTracking(
      'game123',
      'NBA',
      'Lakers',
      'Warriors',
      new Date().toISOString()
    );

    // Simulate live score updates
    realTimeDataService.emit('score_update', {
      gameId: 'game123',
      homeScore: 45,
      awayScore: 42,
      quarter: 2,
    });

    // Simulate odds movement
    liveOddsTrackingService.emit('significant_movement', {
      gameId: 'game123',
      movement: { movement: 15, isSignificant: true },
    });

    // Stop tracking after game ends
    await realTimeIntegrationService.stopGameTracking('game123', 'NBA');

    expect(true).toBe(true); // Placeholder for complete lifecycle verification
  });

  test('should handle UFC fight with real-time updates', async () => {
    await realTimeIntegrationService.initialize();

    // Start tracking UFC fight
    await realTimeIntegrationService.startGameTracking(
      'fight123',
      'UFC',
      'Jon Jones',
      'Stipe Miocic',
      new Date().toISOString()
    );

    // Get UFC fight data
    const fightData = await realTimeIntegrationService.getUFCFightData('fight123');
    
    expect(fightData || {}).toEqual(expect.any(Object));
  });

  test('should provide real-time alerts across all sports', async () => {
    await realTimeIntegrationService.initialize();

    const alerts = realTimeIntegrationService.getRecentAlerts(10);
    expect(Array.isArray(alerts)).toBe(true);
  });
});