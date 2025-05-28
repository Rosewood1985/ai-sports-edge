/**
 * Model Cache Service
 * Phase 4.3: Performance Optimization
 * Real ML model caching with LRU eviction and performance monitoring
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

export interface ModelCacheEntry {
  modelId: string;
  modelData: ArrayBuffer;
  version: string;
  lastAccessed: number;
  accessCount: number;
  size: number;
  loadTime: number;
}

export interface CacheMetrics {
  hits: number;
  misses: number;
  evictions: number;
  totalSize: number;
  averageLoadTime: number;
  hitRate: number;
}

export interface ModelPredictionCache {
  inputs: string; // hashed inputs
  outputs: any;
  modelVersion: string;
  timestamp: number;
  confidence: number;
}

export class ModelCacheService {
  private static instance: ModelCacheService;
  private memoryCache = new Map<string, ModelCacheEntry>();
  private predictionCache = new Map<string, ModelPredictionCache>();
  private metrics: CacheMetrics = {
    hits: 0,
    misses: 0,
    evictions: 0,
    totalSize: 0,
    averageLoadTime: 0,
    hitRate: 0,
  };
  
  // Configuration
  private readonly MAX_MEMORY_SIZE = 100 * 1024 * 1024; // 100MB
  private readonly MAX_PREDICTION_CACHE_SIZE = 10000;
  private readonly PREDICTION_TTL = 30 * 60 * 1000; // 30 minutes
  private readonly STORAGE_KEY_PREFIX = 'model_cache_';
  private readonly METRICS_UPDATE_INTERVAL = 5000; // 5 seconds

  private constructor() {
    this.startMetricsUpdater();
    this.loadPersistedCache();
  }

  public static getInstance(): ModelCacheService {
    if (!ModelCacheService.instance) {
      ModelCacheService.instance = new ModelCacheService();
    }
    return ModelCacheService.instance;
  }

  /**
   * Get model from cache with performance tracking
   */
  async getModel(modelId: string, version: string): Promise<ArrayBuffer | null> {
    const cacheKey = `${modelId}_${version}`;
    const startTime = performance.now();

    // Check memory cache first
    const memoryEntry = this.memoryCache.get(cacheKey);
    if (memoryEntry && this.isValidEntry(memoryEntry)) {
      this.updateAccessMetrics(memoryEntry);
      this.metrics.hits++;
      this.updateMetrics();
      return memoryEntry.modelData;
    }

    // Check persistent storage
    try {
      const persistedData = await this.getFromStorage(cacheKey);
      if (persistedData) {
        // Load into memory cache
        const modelData = new Uint8Array(persistedData).buffer;
        const loadTime = performance.now() - startTime;
        
        const entry: ModelCacheEntry = {
          modelId,
          modelData,
          version,
          lastAccessed: Date.now(),
          accessCount: 1,
          size: modelData.byteLength,
          loadTime,
        };

        this.setInMemoryCache(cacheKey, entry);
        this.metrics.hits++;
        this.updateMetrics();
        return modelData;
      }
    } catch (error) {
      console.error(`Error loading model ${modelId} from storage:`, error);
    }

    this.metrics.misses++;
    this.updateMetrics();
    return null;
  }

  /**
   * Store model in cache with size management
   */
  async setModel(
    modelId: string, 
    version: string, 
    modelData: ArrayBuffer
  ): Promise<void> {
    const cacheKey = `${modelId}_${version}`;
    const loadTime = performance.now();

    const entry: ModelCacheEntry = {
      modelId,
      modelData,
      version,
      lastAccessed: Date.now(),
      accessCount: 0,
      size: modelData.byteLength,
      loadTime: 0,
    };

    // Check if we need to evict
    await this.ensureCapacity(entry.size);

    // Store in memory
    this.setInMemoryCache(cacheKey, entry);

    // Store in persistent storage asynchronously
    this.setInStorage(cacheKey, modelData).catch(error => {
      console.error(`Error persisting model ${modelId}:`, error);
    });

    this.updateMetrics();
  }

  /**
   * Get cached prediction result
   */
  getCachedPrediction(inputs: any, modelId: string, version: string): any | null {
    const inputHash = this.hashInputs(inputs);
    const cacheKey = `${modelId}_${version}_${inputHash}`;
    
    const cached = this.predictionCache.get(cacheKey);
    if (cached && this.isValidPrediction(cached)) {
      this.metrics.hits++;
      this.updateMetrics();
      return cached.outputs;
    }

    this.metrics.misses++;
    this.updateMetrics();
    return null;
  }

  /**
   * Cache prediction result
   */
  setCachedPrediction(
    inputs: any, 
    outputs: any, 
    modelId: string, 
    version: string,
    confidence: number = 1.0
  ): void {
    const inputHash = this.hashInputs(inputs);
    const cacheKey = `${modelId}_${version}_${inputHash}`;

    // Evict old predictions if at capacity
    if (this.predictionCache.size >= this.MAX_PREDICTION_CACHE_SIZE) {
      this.evictOldestPredictions(Math.floor(this.MAX_PREDICTION_CACHE_SIZE * 0.1));
    }

    this.predictionCache.set(cacheKey, {
      inputs: inputHash,
      outputs,
      modelVersion: version,
      timestamp: Date.now(),
      confidence,
    });
  }

  /**
   * Preload frequently used models
   */
  async preloadModels(modelConfigs: Array<{id: string, version: string, url: string}>): Promise<void> {
    const promises = modelConfigs.map(async config => {
      try {
        // Check if already cached
        const cached = await this.getModel(config.id, config.version);
        if (cached) return;

        // Load from URL
        const response = await fetch(config.url);
        if (!response.ok) {
          throw new Error(`Failed to fetch model ${config.id}: ${response.statusText}`);
        }

        const modelData = await response.arrayBuffer();
        await this.setModel(config.id, config.version, modelData);
        
        console.log(`Preloaded model ${config.id} v${config.version}`);
      } catch (error) {
        console.error(`Failed to preload model ${config.id}:`, error);
      }
    });

    await Promise.allSettled(promises);
  }

  /**
   * Get cache metrics for monitoring
   */
  getMetrics(): CacheMetrics {
    return { ...this.metrics };
  }

  /**
   * Clear specific model from cache
   */
  async clearModel(modelId: string, version?: string): Promise<void> {
    const pattern = version ? `${modelId}_${version}` : modelId;
    
    // Clear from memory
    for (const [key, entry] of this.memoryCache.entries()) {
      if (key.includes(pattern)) {
        this.metrics.totalSize -= entry.size;
        this.memoryCache.delete(key);
      }
    }

    // Clear from storage
    try {
      const keys = await AsyncStorage.getAllKeys();
      const modelKeys = keys.filter(key => 
        key.startsWith(this.STORAGE_KEY_PREFIX) && key.includes(pattern)
      );
      
      if (modelKeys.length > 0) {
        await AsyncStorage.multiRemove(modelKeys);
      }
    } catch (error) {
      console.error(`Error clearing model ${modelId} from storage:`, error);
    }

    // Clear predictions
    for (const [key] of this.predictionCache.entries()) {
      if (key.includes(pattern)) {
        this.predictionCache.delete(key);
      }
    }

    this.updateMetrics();
  }

  /**
   * Clear all caches
   */
  async clearAll(): Promise<void> {
    this.memoryCache.clear();
    this.predictionCache.clear();
    this.metrics = {
      hits: 0,
      misses: 0,
      evictions: 0,
      totalSize: 0,
      averageLoadTime: 0,
      hitRate: 0,
    };

    try {
      const keys = await AsyncStorage.getAllKeys();
      const modelKeys = keys.filter(key => key.startsWith(this.STORAGE_KEY_PREFIX));
      
      if (modelKeys.length > 0) {
        await AsyncStorage.multiRemove(modelKeys);
      }
    } catch (error) {
      console.error('Error clearing cache storage:', error);
    }
  }

  /**
   * Get cache status for debugging
   */
  getCacheStatus(): {
    memoryUsage: number;
    modelCount: number;
    predictionCount: number;
    metrics: CacheMetrics;
  } {
    return {
      memoryUsage: this.metrics.totalSize,
      modelCount: this.memoryCache.size,
      predictionCount: this.predictionCache.size,
      metrics: this.getMetrics(),
    };
  }

  // Private methods

  private setInMemoryCache(key: string, entry: ModelCacheEntry): void {
    this.memoryCache.set(key, entry);
    this.metrics.totalSize += entry.size;
  }

  private async ensureCapacity(newEntrySize: number): Promise<void> {
    while (this.metrics.totalSize + newEntrySize > this.MAX_MEMORY_SIZE && this.memoryCache.size > 0) {
      await this.evictLRU();
    }
  }

  private async evictLRU(): Promise<void> {
    let oldestKey = '';
    let oldestTime = Date.now();

    for (const [key, entry] of this.memoryCache.entries()) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      const entry = this.memoryCache.get(oldestKey);
      if (entry) {
        this.metrics.totalSize -= entry.size;
        this.metrics.evictions++;
        this.memoryCache.delete(oldestKey);
      }
    }
  }

  private evictOldestPredictions(count: number): void {
    const entries = Array.from(this.predictionCache.entries())
      .sort(([, a], [, b]) => a.timestamp - b.timestamp)
      .slice(0, count);

    for (const [key] of entries) {
      this.predictionCache.delete(key);
    }
  }

  private updateAccessMetrics(entry: ModelCacheEntry): void {
    entry.lastAccessed = Date.now();
    entry.accessCount++;
  }

  private isValidEntry(entry: ModelCacheEntry): boolean {
    return entry.modelData && entry.modelData.byteLength > 0;
  }

  private isValidPrediction(prediction: ModelPredictionCache): boolean {
    const now = Date.now();
    return now - prediction.timestamp < this.PREDICTION_TTL;
  }

  private hashInputs(inputs: any): string {
    // Simple hash function for caching inputs
    const str = JSON.stringify(inputs);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(36);
  }

  private async getFromStorage(key: string): Promise<number[] | null> {
    try {
      const data = await AsyncStorage.getItem(this.STORAGE_KEY_PREFIX + key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error(`Error reading from storage: ${key}`, error);
      return null;
    }
  }

  private async setInStorage(key: string, data: ArrayBuffer): Promise<void> {
    try {
      const array = Array.from(new Uint8Array(data));
      await AsyncStorage.setItem(this.STORAGE_KEY_PREFIX + key, JSON.stringify(array));
    } catch (error) {
      console.error(`Error writing to storage: ${key}`, error);
    }
  }

  private async loadPersistedCache(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const modelKeys = keys.filter(key => key.startsWith(this.STORAGE_KEY_PREFIX));
      
      // Load a subset to avoid overwhelming memory
      const priorityKeys = modelKeys.slice(0, 5);
      
      for (const key of priorityKeys) {
        const modelKey = key.replace(this.STORAGE_KEY_PREFIX, '');
        const [modelId, version] = modelKey.split('_');
        
        if (modelId && version) {
          // Load asynchronously to avoid blocking
          this.getModel(modelId, version).catch(error => {
            console.error(`Error loading persisted model ${modelId}:`, error);
          });
        }
      }
    } catch (error) {
      console.error('Error loading persisted cache:', error);
    }
  }

  private updateMetrics(): void {
    const total = this.metrics.hits + this.metrics.misses;
    this.metrics.hitRate = total > 0 ? this.metrics.hits / total : 0;
  }

  private startMetricsUpdater(): void {
    setInterval(() => {
      // Clean up expired predictions
      const now = Date.now();
      for (const [key, prediction] of this.predictionCache.entries()) {
        if (now - prediction.timestamp > this.PREDICTION_TTL) {
          this.predictionCache.delete(key);
        }
      }
    }, this.METRICS_UPDATE_INTERVAL);
  }
}

export default ModelCacheService;