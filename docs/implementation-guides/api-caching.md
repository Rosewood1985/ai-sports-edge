# API Caching Implementation Guide

## Overview

This guide explains the API caching mechanism implemented in the AI Sports Edge application. The caching system is designed to reduce network requests, improve performance, and provide a better user experience, especially in scenarios with poor network connectivity.

## Architecture

The API caching system follows the atomic architecture pattern and consists of the following components:

### Molecules

- **apiCache** (`atomic/molecules/cache/apiCache.ts`): Provides a generic caching mechanism for API responses, building on top of the existing cacheService.

### Organisms

- **apiService** (`atomic/organisms/api/apiService.ts`): Enhanced API service that uses the apiCache molecule to provide consistent caching for all API calls.

## Key Features

1. **Generic Caching**: The caching mechanism can be used with any API endpoint.
2. **Configurable Cache TTL**: Different endpoints can have different cache expiration times.
3. **Memory and Storage Caching**: Data is cached both in memory for fast access and in AsyncStorage for persistence.
4. **Automatic Cache Invalidation**: Cache entries are automatically invalidated when they expire.
5. **Manual Cache Invalidation**: Cache can be manually invalidated for specific endpoints or all endpoints.
6. **Cache Control**: API calls can specify whether to use cache or not.

## Usage

### Basic Usage

To make an API request with caching:

```typescript
import { apiService } from 'atomic/organisms';

// Get games with caching (default)
const games = await apiService.getGames();

// Get games without caching
const liveGames = await apiService.getGames('live', false);
```

### Custom API Requests

For custom API requests that aren't covered by the predefined methods:

```typescript
import { apiService } from 'atomic/organisms';

// GET request with caching
const data = await apiService.makeRequest(
  '/custom-endpoint',
  { method: 'GET' },
  { param1: 'value1' },
  { useCache: true, ttl: 10 * 60 * 1000 } // 10 minutes cache
);

// POST request (automatically bypasses cache)
const result = await apiService.makeRequest('/custom-endpoint', {
  method: 'POST',
  body: JSON.stringify({ data: 'value' }),
});
```

### Clearing Cache

To clear the cache:

```typescript
import { apiService } from 'atomic/organisms';

// Clear all API cache
await apiService.clearCache();

// Clear cache for a specific endpoint
await apiService.clearCache('/games');
```

## Cache Configuration

The caching system has default configurations that can be overridden for specific endpoints or requests:

```typescript
// Default cache options
const DEFAULT_CACHE_OPTIONS = {
  useCache: true,
  ttl: 5 * 60 * 1000, // 5 minutes
  prefix: 'api:',
  useMemory: true,
};

// Custom cache options for different endpoints
const CACHE_OPTIONS = {
  '/games': {
    ttl: 2 * 60 * 1000, // 2 minutes for games (more frequent updates)
  },
  '/trending': {
    ttl: 10 * 60 * 1000, // 10 minutes for trending (less frequent updates)
  },
};
```

## Implementation Details

### Cache Key Generation

Cache keys are generated based on the endpoint and query parameters:

```typescript
const key = apiCache.generateCacheKey(endpoint, params, prefix);
```

This ensures that different API calls with different parameters have different cache keys.

### Cache Entry Structure

Each cache entry includes:

- **data**: The actual data returned by the API
- **timestamp**: When the data was cached
- **expiresAt**: When the cache entry expires

### Caching Logic

1. When making a GET request, the system first checks if the cache should be used.
2. If caching is enabled, it tries to get the data from the cache.
3. If the data is in the cache and not expired, it returns the cached data.
4. If the data is not in the cache or is expired, it makes the API request and caches the result.
5. For non-GET requests, caching is automatically disabled.

## Best Practices

1. **Use Caching for Read-Only Data**: Only cache data that doesn't change frequently.
2. **Set Appropriate TTL**: Set the cache TTL based on how frequently the data changes.
3. **Clear Cache When Needed**: Clear the cache when the user performs actions that might invalidate the cache.
4. **Disable Cache for Sensitive Data**: Disable caching for sensitive data that shouldn't be stored locally.

## Troubleshooting

### Cache Not Working

If the cache doesn't seem to be working:

1. Check if caching is enabled for the endpoint.
2. Check if the cache TTL is set correctly.
3. Check if the cache has been cleared.

### Stale Data

If the app is showing stale data:

1. Clear the cache for the specific endpoint.
2. Reduce the cache TTL for the endpoint.
3. Add a manual cache invalidation when data is updated.

## Future Improvements

1. **Cache Compression**: Compress cached data to reduce storage usage.
2. **Cache Prioritization**: Prioritize cache entries based on usage patterns.
3. **Background Sync**: Sync cached data with the server in the background.
4. **Cache Analytics**: Track cache hit/miss rates and optimize accordingly.
5. **Offline Mode**: Enhance the caching system to support full offline mode.
