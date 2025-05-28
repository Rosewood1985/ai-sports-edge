# Advanced Caching System Guide

## Overview

The AI Sports Edge app implements a sophisticated multi-level caching system designed to optimize performance, reduce API calls, and provide seamless user experience. This guide covers the implementation, usage, and best practices for our advanced caching strategies.

## Architecture

### Cache Hierarchy

```
┌─────────────────────────────────────────────────────┐
│                Unified Cache Service                │
│           (Intelligent Request Routing)            │
└─────────────────────────┬───────────────────────────┘
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
┌───────▼──────┐ ┌────────▼────────┐ ┌──────▼───────┐
│ Real-Time    │ │ Distributed     │ │ Model Cache  │
│ Cache        │ │ Cache (Redis)   │ │ Service      │
│              │ │                 │ │              │
│ • L1: Live   │ │ • Cluster       │ │ • ML Models  │
│ • L2: Recent │ │ • Replication   │ │ • Predictions│
│ • L3: Hist   │ │ • Persistence   │ │ • LRU Evict  │
│ • L4: Analyt │ │ • Consistency   │ │ • Preloading │
└──────────────┘ └─────────────────┘ └──────────────┘
```

### Cache Levels

1. **L1 Cache (Live Data)**: Ultra-fast in-memory cache for live scores, odds, and real-time updates
2. **L2 Cache (Recent Data)**: Compressed memory cache for recently accessed game data
3. **L3 Cache (Historical Data)**: Persistent storage for historical stats and long-term data
4. **L4 Cache (Analytics)**: Specialized cache for ML predictions and analytics data

## Services

### 1. UnifiedCacheService

The main entry point that intelligently routes cache requests to appropriate storage layers.

```typescript
import UnifiedCacheService from '../src/services/unifiedCacheService';

const cache = UnifiedCacheService.getInstance();

// Basic usage
await cache.set('game_data_123', gameData, {
  dataType: 'live',
  priority: 9,
  ttl: 5000,
});

const data = await cache.get('game_data_123', { dataType: 'live' });
```

### 2. RealTimeDataCacheService

Multi-level cache optimized for real-time sports data with automatic tier management.

```typescript
import { RealTimeDataCacheService } from '../src/services/realTimeDataCacheService';

const rtCache = RealTimeDataCacheService.getInstance();

// Cache live game data
await rtCache.set('live_score_nba_123', {
  homeScore: 98,
  awayScore: 102,
  quarter: 4,
  timeLeft: '2:45'
}, {
  dataType: 'live',
  priority: 10,
  source: 'espn_api'
});
```

### 3. DistributedCacheService

Redis-backed distributed cache for scalability and persistence.

```typescript
import { DistributedCacheService } from '../src/services/distributedCacheService';

const distCache = DistributedCacheService.getInstance();

// Configure replication
distCache.configureReplication({
  enabled: true,
  nodes: [
    { id: 'node1', host: 'cache1.example.com', port: 6379, status: 'active' },
    { id: 'node2', host: 'cache2.example.com', port: 6379, status: 'active' }
  ],
  replicationFactor: 2,
  consistencyLevel: 'eventual'
});
```

### 4. ModelCacheService

Specialized cache for ML models and prediction results.

```typescript
import ModelCacheService from '../src/services/modelCacheService';

const modelCache = ModelCacheService.getInstance();

// Cache ML model
await modelCache.setModel('nba_prediction_v2', '1.0', modelArrayBuffer);

// Get cached prediction
const prediction = modelCache.getCachedPrediction(gameInputs, 'nba_prediction_v2', '1.0');
```

## Cache Options

### DataType Classification

- **`live`**: Real-time data (scores, odds) - TTL: 5 seconds
- **`recent`**: Recently accessed data - TTL: 1 minute  
- **`historical`**: Historical stats - TTL: 1 hour
- **`analytics`**: ML predictions and analytics - TTL: 24 hours
- **`model`**: ML models and weights
- **`prediction`**: Cached prediction results

### Priority Levels

- **1-3**: Low priority (background data)
- **4-6**: Normal priority (user-requested data)
- **7-8**: High priority (frequently accessed)
- **9-10**: Critical priority (live/real-time data)

### Advanced Options

```typescript
interface CacheOptions {
  dataType?: 'live' | 'recent' | 'historical' | 'analytics' | 'model' | 'prediction';
  priority?: number; // 1-10
  ttl?: number; // milliseconds
  useDistributed?: boolean;
  replicateToNodes?: boolean;
  consistencyLevel?: 'eventual' | 'strong' | 'weak';
  preload?: boolean;
  compress?: boolean;
  useLocalOnly?: boolean;
  version?: string;
  source?: string;
  tags?: string[];
}
```

## Usage Patterns

### 1. Live Game Data

```typescript
// Cache live game updates
const gameData = {
  id: 'nba_lakers_vs_warriors_2025',
  homeTeam: 'Lakers',
  awayTeam: 'Warriors',
  score: { home: 98, away: 102 },
  status: 'live'
};

await cache.set(`live_game_${gameData.id}`, gameData, {
  dataType: 'live',
  priority: 9,
  ttl: 5000, // 5 seconds
  useDistributed: true,
  replicateToNodes: true
});
```

### 2. Player Statistics

```typescript
// Cache historical player stats
const playerStats = {
  playerId: 'lebron_james_23',
  season: '2024-25',
  stats: { points: 25.2, rebounds: 7.8, assists: 8.1 }
};

await cache.set(`player_stats_${playerStats.playerId}`, playerStats, {
  dataType: 'historical',
  priority: 6,
  ttl: 3600000, // 1 hour
  compress: true,
  tags: ['player', 'stats', 'nba']
});
```

### 3. Batch Operations

```typescript
// Batch retrieval for efficiency
const playerIds = ['lebron_james_23', 'stephen_curry_30', 'kevin_durant_35'];
const keys = playerIds.map(id => `player_stats_${id}`);

const batchResults = await cache.getBatch<PlayerStats>(keys, {
  dataType: 'historical'
});

for (const [key, player] of batchResults) {
  if (player) {
    console.log(`${player.name}: ${player.stats.points} PPG`);
  }
}
```

### 4. Preloading Strategy

```typescript
// Preload frequently accessed data
const preloadEntries = [
  {
    key: 'popular_games_today',
    loader: async () => await fetchTodaysGames(),
    options: { dataType: 'recent', priority: 8 }
  },
  {
    key: 'trending_players',
    loader: async () => await fetchTrendingPlayers(),
    options: { dataType: 'analytics', priority: 7 }
  }
];

await cache.preload(preloadEntries);
```

### 5. Cache Invalidation

```typescript
// Pattern-based invalidation
await cache.invalidate('team_*', {
  includeDistributed: true,
  includeLocal: true
});

// Regex invalidation
await cache.invalidate(/^player_.*_recent$/, {
  includeDistributed: true
});

// Tag-based invalidation (if implemented)
await cache.invalidate(['outdated', 'season_2023']);
```

## Performance Optimization

### 1. Cache Warming

```typescript
// Warm cache with predictable access patterns
await cache.warmCache({
  live: ['live_game_*', 'live_odds_*'],
  recent: ['player_stats_*', 'team_rankings_*'],
  historical: ['season_stats_*'],
  analytics: ['predictions_*', 'trends_*']
});
```

### 2. Memory Management

```typescript
// Configure cache sizes and eviction policies
const rtCache = RealTimeDataCacheService.getInstance();
const metrics = rtCache.getMetrics();

if (metrics.memoryUsage > 100 * 1024 * 1024) { // 100MB
  // Trigger aggressive cleanup
  await rtCache.invalidate(/.*old.*/);
}
```

### 3. Monitoring and Health Checks

```typescript
// Regular health monitoring
const healthCheck = async () => {
  const health = await cache.healthCheck();
  const stats = cache.getStats();
  
  console.log(`Cache Health: ${health.overall}`);
  console.log(`Hit Rate: ${Math.round(stats.hitRate * 100)}%`);
  console.log(`Average Latency: ${Math.round(stats.averageLatency)}ms`);
  
  // Alert if performance degrades
  if (health.overall === 'unhealthy' || stats.hitRate < 0.8) {
    // Trigger alerts or fallback strategies
    await handleCacheIssues();
  }
};

setInterval(healthCheck, 30000); // Check every 30 seconds
```

## Best Practices

### 1. Key Naming Conventions

```typescript
// Use consistent, hierarchical naming
const keys = {
  liveData: `live_${sport}_${gameId}`,
  playerStats: `player_${playerId}_${season}_stats`,
  teamData: `team_${teamId}_${dataType}`,
  analytics: `analytics_${metric}_${period}`,
  predictions: `prediction_${modelId}_${inputHash}`
};
```

### 2. TTL Strategy

```typescript
const ttlStrategy = {
  live: 5000,        // 5 seconds
  recent: 60000,     // 1 minute
  hourly: 3600000,   // 1 hour
  daily: 86400000,   // 24 hours
  weekly: 604800000  // 7 days
};
```

### 3. Error Handling

```typescript
const safeCache = async <T>(
  key: string, 
  fallback: () => Promise<T>, 
  options: CacheOptions = {}
): Promise<T> => {
  try {
    // Try cache first
    const cached = await cache.get<T>(key, options);
    if (cached) return cached;
    
    // Fallback to source
    const data = await fallback();
    
    // Cache the result
    await cache.set(key, data, options);
    
    return data;
  } catch (error) {
    console.error('Cache operation failed:', error);
    
    // Always return fallback data
    return await fallback();
  }
};
```

### 4. Cache Synchronization

```typescript
// Sync local and distributed caches
const syncCaches = async () => {
  const result = await distCache.sync({
    direction: 'bidirectional',
    patterns: ['critical_*', 'live_*'],
    dryRun: false
  });
  
  console.log(`Synchronized ${result.synchronized} items`);
  if (result.conflicts > 0) {
    console.warn(`Resolved ${result.conflicts} conflicts`);
  }
};

// Run sync periodically
setInterval(syncCaches, 300000); // Every 5 minutes
```

## Debugging and Troubleshooting

### 1. Cache Inspection

```typescript
// Get detailed cache status
const debugCache = () => {
  const stats = cache.getStats();
  
  console.log('=== Cache Debug Info ===');
  console.log('Hit Rate:', Math.round(stats.hitRate * 100) + '%');
  console.log('Total Requests:', stats.totalRequests);
  console.log('Average Latency:', Math.round(stats.averageLatency) + 'ms');
  
  console.log('\nDistribution:');
  console.log('- Local Hits:', stats.distributionStats.localHits);
  console.log('- Distributed Hits:', stats.distributionStats.distributedHits);
  console.log('- Model Cache Hits:', stats.distributionStats.modelCacheHits);
  
  console.log('\nDetailed Metrics:');
  console.log('- Real-time Cache:', stats.detailedMetrics.realTime);
  console.log('- Distributed Cache:', stats.detailedMetrics.distributed);
  console.log('- Model Cache:', stats.detailedMetrics.model);
};
```

### 2. Performance Profiling

```typescript
// Profile cache operations
const profileCacheOperation = async (operation: () => Promise<any>) => {
  const startTime = performance.now();
  const startStats = cache.getStats();
  
  await operation();
  
  const endTime = performance.now();
  const endStats = cache.getStats();
  
  console.log(`Operation took ${endTime - startTime}ms`);
  console.log(`Requests: ${endStats.totalRequests - startStats.totalRequests}`);
  console.log(`Hit rate change: ${endStats.hitRate - startStats.hitRate}`);
};
```

## Integration Examples

See `examples/CacheUsageExamples.tsx` for comprehensive React Native integration examples including:

- Live game data caching
- Historical player statistics
- Analytics data with preloading
- Cache invalidation patterns
- Performance monitoring
- Error handling strategies

## Configuration

### Environment Variables

```bash
# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password
REDIS_DB=0

# Cache Settings
CACHE_DEFAULT_TTL=300000
CACHE_MAX_MEMORY=100MB
CACHE_ENABLE_COMPRESSION=true
CACHE_ENABLE_DISTRIBUTED=true
```

### Production Considerations

1. **Monitoring**: Implement comprehensive monitoring for cache hit rates, latency, and memory usage
2. **Alerting**: Set up alerts for cache failures or performance degradation
3. **Backup**: Ensure critical cached data has backup strategies
4. **Scaling**: Plan for horizontal scaling of Redis clusters
5. **Security**: Implement proper authentication and encryption for distributed caches

This advanced caching system provides the foundation for high-performance, scalable sports data management while maintaining data consistency and user experience quality.