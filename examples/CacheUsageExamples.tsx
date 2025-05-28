/**
 * Cache Usage Examples
 * Phase 4.3: Advanced Caching Strategies
 * Comprehensive examples of how to use the unified caching system
 */

import React, { useEffect, useState } from 'react';
import { View, Text, Button, ScrollView, StyleSheet } from 'react-native';
import UnifiedCacheService from '../src/services/unifiedCacheService';

// Example interfaces for typed caching
interface GameData {
  id: string;
  homeTeam: string;
  awayTeam: string;
  score: { home: number; away: number };
  status: 'live' | 'completed' | 'scheduled';
  odds: {
    homeWin: number;
    awayWin: number;
    draw: number;
  };
}

interface PlayerStats {
  playerId: string;
  name: string;
  team: string;
  season: string;
  stats: {
    points: number;
    rebounds: number;
    assists: number;
    games: number;
  };
}

interface AnalyticsData {
  metric: string;
  value: number;
  trend: 'up' | 'down' | 'stable';
  period: string;
  confidence: number;
}

const CacheUsageExamples: React.FC = () => {
  const [cacheStats, setCacheStats] = useState<any>(null);
  const [logs, setLogs] = useState<string[]>([]);
  
  const cache = UnifiedCacheService.getInstance();

  const addLog = (message: string) => {
    setLogs(prev => [...prev.slice(-9), `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  // Example 1: Live Game Data Caching
  const handleLiveDataExample = async () => {
    addLog('Starting live data caching example...');

    try {
      // Cache live game data with high priority and short TTL
      const gameData: GameData = {
        id: 'nba_lakers_vs_warriors_2025',
        homeTeam: 'Lakers',
        awayTeam: 'Warriors',
        score: { home: 98, away: 102 },
        status: 'live',
        odds: { homeWin: 1.85, awayWin: 1.95, draw: 0 },
      };

      await cache.set('live_game_' + gameData.id, gameData, {
        dataType: 'live',
        priority: 9,
        ttl: 5000, // 5 seconds for live data
        useDistributed: true,
        replicateToNodes: true,
        source: 'espn_api',
        version: '1.0',
      });

      addLog(`Cached live game data: ${gameData.homeTeam} vs ${gameData.awayTeam}`);

      // Retrieve and verify
      const cached = await cache.get<GameData>('live_game_' + gameData.id, {
        dataType: 'live',
      });

      if (cached) {
        addLog(`Retrieved game: ${cached.homeTeam} ${cached.score.home} - ${cached.score.away} ${cached.awayTeam}`);
      } else {
        addLog('Failed to retrieve cached game data');
      }

    } catch (error) {
      addLog(`Live data example error: ${error}`);
    }
  };

  // Example 2: Historical Player Stats Caching
  const handleHistoricalDataExample = async () => {
    addLog('Starting historical data caching example...');

    try {
      const playerStats: PlayerStats = {
        playerId: 'lebron_james_23',
        name: 'LeBron James',
        team: 'Lakers',
        season: '2024-25',
        stats: {
          points: 25.2,
          rebounds: 7.8,
          assists: 8.1,
          games: 45,
        },
      };

      await cache.set('player_stats_' + playerStats.playerId, playerStats, {
        dataType: 'historical',
        priority: 6,
        ttl: 3600000, // 1 hour for historical data
        useDistributed: true,
        compress: true,
        source: 'nba_stats_api',
        version: '2.0',
        tags: ['player', 'stats', 'nba'],
      });

      addLog(`Cached player stats: ${playerStats.name} - ${playerStats.stats.points} PPG`);

      // Demonstrate batch retrieval
      const playerIds = ['lebron_james_23', 'stephen_curry_30', 'kevin_durant_35'];
      const batchResults = await cache.getBatch<PlayerStats>(
        playerIds.map(id => `player_stats_${id}`),
        { dataType: 'historical' }
      );

      let foundCount = 0;
      for (const [key, player] of batchResults) {
        if (player) {
          foundCount++;
          addLog(`Batch result: ${player.name} - ${player.stats.points} PPG`);
        }
      }

      addLog(`Batch retrieval: Found ${foundCount}/${playerIds.length} players`);

    } catch (error) {
      addLog(`Historical data example error: ${error}`);
    }
  };

  // Example 3: Analytics Data with Preloading
  const handleAnalyticsExample = async () => {
    addLog('Starting analytics caching example with preloading...');

    try {
      // Define analytics data to preload
      const analyticsEntries = [
        {
          key: 'analytics_team_efficiency_lakers',
          loader: async () => ({
            metric: 'offensive_efficiency',
            value: 118.5,
            trend: 'up' as const,
            period: 'last_10_games',
            confidence: 0.85,
          }),
          options: {
            dataType: 'analytics' as const,
            priority: 7,
            ttl: 86400000, // 24 hours
          },
        },
        {
          key: 'analytics_player_impact_lebron',
          loader: async () => ({
            metric: 'plus_minus_impact',
            value: 8.3,
            trend: 'stable' as const,
            period: 'season',
            confidence: 0.92,
          }),
          options: {
            dataType: 'analytics' as const,
            priority: 8,
            ttl: 43200000, // 12 hours
          },
        },
      ];

      // Preload analytics data
      await cache.preload(analyticsEntries);
      addLog('Preloaded analytics data');

      // Retrieve preloaded data
      for (const entry of analyticsEntries) {
        const data = await cache.get<AnalyticsData>(entry.key, entry.options);
        if (data) {
          addLog(`Analytics: ${data.metric} = ${data.value} (${data.trend}, confidence: ${Math.round(data.confidence * 100)}%)`);
        }
      }

    } catch (error) {
      addLog(`Analytics example error: ${error}`);
    }
  };

  // Example 4: Cache Invalidation Patterns
  const handleInvalidationExample = async () => {
    addLog('Starting cache invalidation example...');

    try {
      // Cache some test data
      const testData = [
        { key: 'team_lakers_stats', data: { wins: 35, losses: 10 } },
        { key: 'team_warriors_stats', data: { wins: 30, losses: 15 } },
        { key: 'player_lebron_recent', data: { lastGame: '25 pts, 8 reb, 7 ast' } },
        { key: 'odds_game_123', data: { home: 1.85, away: 1.95 } },
      ];

      for (const item of testData) {
        await cache.set(item.key, item.data, {
          dataType: 'recent',
          ttl: 300000, // 5 minutes
        });
      }

      addLog(`Cached ${testData.length} test items`);

      // Invalidate by pattern
      const invalidated1 = await cache.invalidate('team_', {
        includeDistributed: true,
        includeLocal: true,
      });
      addLog(`Invalidated ${invalidated1} items matching 'team_' pattern`);

      // Invalidate by regex
      const invalidated2 = await cache.invalidate(/^player_.*_recent$/, {
        includeDistributed: true,
        includeLocal: true,
      });
      addLog(`Invalidated ${invalidated2} items matching player recent pattern`);

      // Verify invalidation
      const remaining = await cache.get('odds_game_123');
      if (remaining) {
        addLog('Odds data still cached (not invalidated)');
      } else {
        addLog('Odds data was incorrectly invalidated');
      }

    } catch (error) {
      addLog(`Invalidation example error: ${error}`);
    }
  };

  // Example 5: Cache Warming
  const handleCacheWarmingExample = async () => {
    addLog('Starting cache warming example...');

    try {
      // Define warming patterns for different data types
      const warmingPatterns = {
        live: ['live_game_*', 'live_odds_*'],
        recent: ['player_stats_*', 'team_rankings_*'],
        historical: ['season_stats_*', 'career_stats_*'],
        analytics: ['efficiency_*', 'predictive_*'],
      };

      await cache.warmCache(warmingPatterns);
      addLog('Cache warming completed for all data types');

      // Check health after warming
      const health = await cache.healthCheck();
      addLog(`Cache health: ${health.overall} (hit rate: ${Math.round(health.metrics.hitRate * 100)}%)`);

    } catch (error) {
      addLog(`Cache warming example error: ${error}`);
    }
  };

  // Example 6: Performance Monitoring
  const handlePerformanceExample = async () => {
    addLog('Starting performance monitoring example...');

    try {
      // Perform multiple cache operations to generate metrics
      const operations = 50;
      const startTime = performance.now();

      for (let i = 0; i < operations; i++) {
        const key = `perf_test_${i}`;
        const data = {
          id: i,
          timestamp: Date.now(),
          randomValue: Math.random(),
        };

        await cache.set(key, data, {
          dataType: i % 2 === 0 ? 'recent' : 'live',
          priority: Math.floor(Math.random() * 10) + 1,
        });

        // Retrieve immediately to test hit rate
        await cache.get(key);
      }

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      addLog(`Performed ${operations * 2} operations in ${Math.round(totalTime)}ms`);
      addLog(`Average: ${Math.round(totalTime / (operations * 2))}ms per operation`);

      // Get comprehensive stats
      const stats = cache.getStats();
      addLog(`Cache hit rate: ${Math.round(stats.hitRate * 100)}%`);
      addLog(`Average latency: ${Math.round(stats.averageLatency)}ms`);
      addLog(`Memory usage: ${Math.round(stats.detailedMetrics.realTime.memoryUsage / 1024)}KB`);

    } catch (error) {
      addLog(`Performance example error: ${error}`);
    }
  };

  // Refresh cache statistics
  const refreshStats = async () => {
    try {
      const stats = cache.getStats();
      const health = await cache.healthCheck();
      setCacheStats({ ...stats, health });
    } catch (error) {
      addLog(`Stats refresh error: ${error}`);
    }
  };

  useEffect(() => {
    refreshStats();
    const interval = setInterval(refreshStats, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Advanced Caching System Examples</Text>
      
      {/* Cache Statistics */}
      <View style={styles.statsContainer}>
        <Text style={styles.sectionTitle}>Cache Statistics</Text>
        {cacheStats && (
          <View>
            <Text>Health: {cacheStats.health?.overall || 'Unknown'}</Text>
            <Text>Hit Rate: {Math.round((cacheStats.hitRate || 0) * 100)}%</Text>
            <Text>Average Latency: {Math.round(cacheStats.averageLatency || 0)}ms</Text>
            <Text>Total Requests: {cacheStats.totalRequests || 0}</Text>
            <Text>Memory Usage: {Math.round((cacheStats.detailedMetrics?.realTime?.memoryUsage || 0) / 1024)}KB</Text>
          </View>
        )}
      </View>

      {/* Example Buttons */}
      <View style={styles.buttonsContainer}>
        <Text style={styles.sectionTitle}>Cache Examples</Text>
        
        <Button
          title="1. Live Game Data"
          onPress={handleLiveDataExample}
          color="#FF6B35"
        />
        
        <Button
          title="2. Historical Player Stats"
          onPress={handleHistoricalDataExample}
          color="#4ECDC4"
        />
        
        <Button
          title="3. Analytics with Preloading"
          onPress={handleAnalyticsExample}
          color="#45B7D1"
        />
        
        <Button
          title="4. Cache Invalidation"
          onPress={handleInvalidationExample}
          color="#F39C12"
        />
        
        <Button
          title="5. Cache Warming"
          onPress={handleCacheWarmingExample}
          color="#8E44AD"
        />
        
        <Button
          title="6. Performance Testing"
          onPress={handlePerformanceExample}
          color="#27AE60"
        />
        
        <Button
          title="Refresh Stats"
          onPress={refreshStats}
          color="#34495E"
        />
      </View>

      {/* Activity Log */}
      <View style={styles.logsContainer}>
        <Text style={styles.sectionTitle}>Activity Log</Text>
        <ScrollView style={styles.logsList}>
          {logs.map((log, index) => (
            <Text key={index} style={styles.logEntry}>
              {log}
            </Text>
          ))}
        </ScrollView>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#2c3e50',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#34495e',
  },
  statsContainer: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonsContainer: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  logsContainer: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  logsList: {
    maxHeight: 300,
    backgroundColor: '#f8f9fa',
    borderRadius: 4,
    padding: 10,
  },
  logEntry: {
    fontSize: 12,
    color: '#495057',
    marginBottom: 4,
    fontFamily: 'monospace',
  },
});

export default CacheUsageExamples;