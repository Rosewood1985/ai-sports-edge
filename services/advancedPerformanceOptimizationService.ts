/**
 * Advanced Performance Optimization Service
 * 
 * Builds on existing performance infrastructure to provide enterprise-grade
 * optimization with real-time monitoring, predictive caching, and automated tuning.
 */

import { performanceOptimizationService } from './performanceOptimizationService';
import { enhancedCacheService } from './enhancedCacheService';
import { sentryService } from './sentryService';
import { analyticsService } from './analyticsService';

interface PerformanceMetrics {
  renderTime: number;
  memoryUsage: number;
  networkLatency: number;
  cacheHitRate: number;
  bundleLoadTime: number;
  componentMountTime: number;
}

interface OptimizationRule {
  id: string;
  condition: (metrics: PerformanceMetrics) => boolean;
  action: () => Promise<void>;
  priority: 'low' | 'medium' | 'high' | 'critical';
  description: string;
}

interface DeviceCapabilities {
  tier: 'low' | 'medium' | 'high' | 'premium';
  memoryGB: number;
  isLowEndDevice: boolean;
  networkSpeed: 'slow' | 'fast' | 'unknown';
  supportedFormats: string[];
}

class AdvancedPerformanceOptimizationService {
  private metrics: PerformanceMetrics = {
    renderTime: 0,
    memoryUsage: 0,
    networkLatency: 0,
    cacheHitRate: 0,
    bundleLoadTime: 0,
    componentMountTime: 0,
  };

  private deviceCapabilities: DeviceCapabilities | null = null;
  private optimizationRules: OptimizationRule[] = [];
  private isMonitoring = false;
  private performanceQueue: Array<() => Promise<void>> = [];
  private adaptiveSettings = {
    imageQuality: 80,
    prefetchDistance: 3,
    maxCacheSize: 50,
    enableAnimations: true,
    lazyLoadThreshold: 0.1,
  };

  constructor() {
    this.initializeOptimizationRules();
    this.detectDeviceCapabilities();
  }

  /**
   * Initialize the advanced optimization service
   */
  async initialize(): Promise<void> {
    try {
      console.log('🚀 Initializing Advanced Performance Optimization Service...');

      // Start existing performance monitoring
      await performanceOptimizationService.initializeOptimization();
      
      // Begin advanced monitoring
      this.startAdvancedMonitoring();
      
      // Apply device-specific optimizations
      await this.applyDeviceOptimizations();
      
      // Set up predictive caching
      await this.initializePredictiveCaching();
      
      console.log('✅ Advanced Performance Optimization Service initialized');
      
      // Track initialization
      analyticsService.trackEvent('performance_optimization_init', {
        deviceTier: this.deviceCapabilities?.tier,
        memoryGB: this.deviceCapabilities?.memoryGB,
      });
      
    } catch (error) {
      console.error('❌ Failed to initialize advanced performance optimization:', error);
      sentryService.captureException(error);
    }
  }

  /**
   * Detect device capabilities and classify performance tier
   */
  private detectDeviceCapabilities(): void {
    try {
      const navigator = globalThis.navigator as any;
      const deviceMemory = navigator.deviceMemory || 4; // Default to 4GB
      const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
      
      const memoryGB = deviceMemory;
      const isLowEndDevice = memoryGB < 3;
      
      // Determine network speed
      let networkSpeed: 'slow' | 'fast' | 'unknown' = 'unknown';
      if (connection) {
        const effectiveType = connection.effectiveType;
        networkSpeed = ['slow-2g', '2g', '3g'].includes(effectiveType) ? 'slow' : 'fast';
      }
      
      // Classify device tier
      let tier: 'low' | 'medium' | 'high' | 'premium' = 'medium';
      if (memoryGB >= 8) tier = 'premium';
      else if (memoryGB >= 6) tier = 'high';
      else if (memoryGB >= 4) tier = 'medium';
      else tier = 'low';
      
      // Detect supported formats
      const supportedFormats = [];
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
        // Check WebP support
        canvas.toDataURL('image/webp').startsWith('data:image/webp') && supportedFormats.push('webp');
        // Check AVIF support (more complex detection needed)
        supportedFormats.push('jpeg', 'png');
      }
      
      this.deviceCapabilities = {
        tier,
        memoryGB,
        isLowEndDevice,
        networkSpeed,
        supportedFormats,
      };
      
      console.log('📱 Device capabilities detected:', this.deviceCapabilities);
      
    } catch (error) {
      console.error('Error detecting device capabilities:', error);
      // Fallback to conservative settings
      this.deviceCapabilities = {
        tier: 'medium',
        memoryGB: 4,
        isLowEndDevice: false,
        networkSpeed: 'unknown',
        supportedFormats: ['jpeg', 'png'],
      };
    }
  }

  /**
   * Apply device-specific optimizations
   */
  private async applyDeviceOptimizations(): Promise<void> {
    if (!this.deviceCapabilities) return;
    
    const { tier, isLowEndDevice, networkSpeed } = this.deviceCapabilities;
    
    try {
      // Adjust settings based on device tier
      switch (tier) {
        case 'low':
          this.adaptiveSettings = {
            imageQuality: 60,
            prefetchDistance: 1,
            maxCacheSize: 20,
            enableAnimations: false,
            lazyLoadThreshold: 0.3,
          };
          break;
          
        case 'medium':
          this.adaptiveSettings = {
            imageQuality: 75,
            prefetchDistance: 2,
            maxCacheSize: 35,
            enableAnimations: true,
            lazyLoadThreshold: 0.2,
          };
          break;
          
        case 'high':
          this.adaptiveSettings = {
            imageQuality: 85,
            prefetchDistance: 4,
            maxCacheSize: 60,
            enableAnimations: true,
            lazyLoadThreshold: 0.1,
          };
          break;
          
        case 'premium':
          this.adaptiveSettings = {
            imageQuality: 95,
            prefetchDistance: 6,
            maxCacheSize: 100,
            enableAnimations: true,
            lazyLoadThreshold: 0.05,
          };
          break;
      }
      
      // Apply network-specific optimizations
      if (networkSpeed === 'slow') {
        this.adaptiveSettings.imageQuality = Math.min(this.adaptiveSettings.imageQuality, 70);
        this.adaptiveSettings.prefetchDistance = 1;
      }
      
      // Configure enhanced cache service
      await enhancedCacheService.updateConfiguration({
        maxSize: this.adaptiveSettings.maxCacheSize,
        enablePrefetching: this.adaptiveSettings.prefetchDistance > 1,
      });
      
      console.log('⚡ Device optimizations applied:', this.adaptiveSettings);
      
    } catch (error) {
      console.error('Error applying device optimizations:', error);
      sentryService.captureException(error);
    }
  }

  /**
   * Initialize predictive caching based on user behavior
   */
  private async initializePredictiveCaching(): Promise<void> {
    try {
      // Get user's preferred sports and teams from analytics
      const userPreferences = await analyticsService.getUserPreferences();
      
      if (userPreferences) {
        // Prefetch data for user's favorite sports
        const favoriteLeagues = userPreferences.favoriteLeagues || [];
        const favoriteTeams = userPreferences.favoriteTeams || [];
        
        // Queue prefetch operations
        for (const league of favoriteLeagues.slice(0, this.adaptiveSettings.prefetchDistance)) {
          this.queuePrefetchOperation(`league_${league}`);
        }
        
        for (const team of favoriteTeams.slice(0, this.adaptiveSettings.prefetchDistance)) {
          this.queuePrefetchOperation(`team_${team}`);
        }
      }
      
      console.log('🔮 Predictive caching initialized');
      
    } catch (error) {
      console.error('Error initializing predictive caching:', error);
    }
  }

  /**
   * Queue a prefetch operation to be executed when optimal
   */
  private queuePrefetchOperation(key: string): void {
    const operation = async () => {
      try {
        // Use existing cache service to prefetch data
        await enhancedCacheService.prefetch(key);
      } catch (error) {
        console.error(`Failed to prefetch ${key}:`, error);
      }
    };
    
    this.performanceQueue.push(operation);
  }

  /**
   * Process queued performance operations when system is idle
   */
  private async processPerformanceQueue(): Promise<void> {
    if (this.performanceQueue.length === 0) return;
    
    // Check if system is idle (low CPU usage)
    if (this.metrics.renderTime < 16 && this.metrics.memoryUsage < 0.8) {
      const operation = this.performanceQueue.shift();
      if (operation) {
        try {
          await operation();
        } catch (error) {
          console.error('Error processing performance operation:', error);
        }
      }
    }
  }

  /**
   * Start advanced monitoring with real-time optimization
   */
  private startAdvancedMonitoring(): void {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    
    // Monitor performance metrics every 5 seconds
    setInterval(() => {
      this.collectAdvancedMetrics();
      this.evaluateOptimizationRules();
      this.processPerformanceQueue();
    }, 5000);
    
    console.log('📊 Advanced monitoring started');
  }

  /**
   * Collect advanced performance metrics
   */
  private collectAdvancedMetrics(): void {
    try {
      // Get existing metrics from performance service
      const existingMetrics = performanceOptimizationService.getMetrics();
      
      // Enhance with additional metrics
      const performance = globalThis.performance;
      const navigation = performance.getEntriesByType('navigation')[0] as any;
      
      this.metrics = {
        renderTime: existingMetrics.componentRenderTime || 0,
        memoryUsage: existingMetrics.memoryUsage || 0,
        networkLatency: existingMetrics.networkLatency || 0,
        cacheHitRate: enhancedCacheService.getCacheHitRate() || 0,
        bundleLoadTime: navigation?.loadEventEnd - navigation?.navigationStart || 0,
        componentMountTime: existingMetrics.componentMountTime || 0,
      };
      
    } catch (error) {
      console.error('Error collecting advanced metrics:', error);
    }
  }

  /**
   * Initialize optimization rules
   */
  private initializeOptimizationRules(): void {
    this.optimizationRules = [
      {
        id: 'high_memory_usage',
        condition: (metrics) => metrics.memoryUsage > 0.85,
        action: async () => {
          await this.optimizeMemoryUsage();
        },
        priority: 'critical',
        description: 'Optimize memory usage when > 85%',
      },
      {
        id: 'slow_render_time',
        condition: (metrics) => metrics.renderTime > 16.67, // 60fps threshold
        action: async () => {
          await this.optimizeRenderPerformance();
        },
        priority: 'high',
        description: 'Optimize rendering when < 60fps',
      },
      {
        id: 'low_cache_hit_rate',
        condition: (metrics) => metrics.cacheHitRate < 0.7,
        action: async () => {
          await this.optimizeCacheStrategy();
        },
        priority: 'medium',
        description: 'Optimize caching when hit rate < 70%',
      },
      {
        id: 'high_network_latency',
        condition: (metrics) => metrics.networkLatency > 500,
        action: async () => {
          await this.optimizeNetworkStrategy();
        },
        priority: 'medium',
        description: 'Optimize network when latency > 500ms',
      },
    ];
  }

  /**
   * Evaluate optimization rules and apply when triggered
   */
  private evaluateOptimizationRules(): void {
    for (const rule of this.optimizationRules) {
      if (rule.condition(this.metrics)) {
        console.log(`🔧 Triggering optimization: ${rule.description}`);
        
        // Execute optimization asynchronously
        rule.action().catch((error) => {
          console.error(`Failed to execute optimization ${rule.id}:`, error);
          sentryService.captureException(error);
        });
        
        // Track optimization trigger
        analyticsService.trackEvent('optimization_triggered', {
          ruleId: rule.id,
          priority: rule.priority,
          metrics: this.metrics,
        });
      }
    }
  }

  /**
   * Optimize memory usage
   */
  private async optimizeMemoryUsage(): Promise<void> {
    try {
      // Clear old cache entries
      await enhancedCacheService.cleanup();
      
      // Trigger garbage collection in performance service
      await performanceOptimizationService.optimizeMemory();
      
      // Reduce adaptive settings temporarily
      this.adaptiveSettings.maxCacheSize = Math.max(20, this.adaptiveSettings.maxCacheSize * 0.8);
      this.adaptiveSettings.prefetchDistance = Math.max(1, Math.floor(this.adaptiveSettings.prefetchDistance * 0.5));
      
      console.log('🧹 Memory optimization applied');
      
    } catch (error) {
      console.error('Error optimizing memory:', error);
    }
  }

  /**
   * Optimize render performance
   */
  private async optimizeRenderPerformance(): Promise<void> {
    try {
      // Reduce animation complexity
      this.adaptiveSettings.enableAnimations = false;
      
      // Increase lazy loading threshold
      this.adaptiveSettings.lazyLoadThreshold = Math.min(0.5, this.adaptiveSettings.lazyLoadThreshold * 1.5);
      
      // Reduce image quality temporarily
      this.adaptiveSettings.imageQuality = Math.max(50, this.adaptiveSettings.imageQuality * 0.9);
      
      console.log('⚡ Render performance optimization applied');
      
    } catch (error) {
      console.error('Error optimizing render performance:', error);
    }
  }

  /**
   * Optimize cache strategy
   */
  private async optimizeCacheStrategy(): Promise<void> {
    try {
      // Update cache configuration for better hit rates
      await enhancedCacheService.updateConfiguration({
        strategy: 'cache-first',
        enablePrefetching: true,
        maxAge: 300000, // 5 minutes
      });
      
      console.log('💾 Cache strategy optimization applied');
      
    } catch (error) {
      console.error('Error optimizing cache strategy:', error);
    }
  }

  /**
   * Optimize network strategy
   */
  private async optimizeNetworkStrategy(): Promise<void> {
    try {
      // Reduce concurrent requests
      await enhancedCacheService.updateConfiguration({
        maxConcurrentRequests: 3,
        enableRequestDeduplication: true,
      });
      
      // Prefer cached data
      this.adaptiveSettings.prefetchDistance = 1;
      
      console.log('🌐 Network strategy optimization applied');
      
    } catch (error) {
      console.error('Error optimizing network strategy:', error);
    }
  }

  /**
   * Get current performance metrics
   */
  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  /**
   * Get current adaptive settings
   */
  getAdaptiveSettings() {
    return { ...this.adaptiveSettings };
  }

  /**
   * Get device capabilities
   */
  getDeviceCapabilities(): DeviceCapabilities | null {
    return this.deviceCapabilities;
  }

  /**
   * Manually trigger optimization
   */
  async triggerOptimization(): Promise<void> {
    console.log('🚀 Manual optimization triggered');
    
    this.collectAdvancedMetrics();
    this.evaluateOptimizationRules();
    
    // Process all queued operations
    while (this.performanceQueue.length > 0) {
      await this.processPerformanceQueue();
    }
  }

  /**
   * Generate performance report
   */
  generatePerformanceReport(): any {
    return {
      timestamp: new Date().toISOString(),
      metrics: this.metrics,
      deviceCapabilities: this.deviceCapabilities,
      adaptiveSettings: this.adaptiveSettings,
      queueLength: this.performanceQueue.length,
      optimizationRules: this.optimizationRules.map(rule => ({
        id: rule.id,
        description: rule.description,
        priority: rule.priority,
        triggered: rule.condition(this.metrics),
      })),
    };
  }
}

// Create singleton instance
export const advancedPerformanceOptimizationService = new AdvancedPerformanceOptimizationService();
export default advancedPerformanceOptimizationService;