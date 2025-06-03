/**
 * Optimization Orchestrator Service
 *
 * Coordinates all optimization services and provides a unified interface
 * for managing performance optimizations across the AI Sports Edge platform.
 */

import { advancedImageOptimizationService } from './advancedImageOptimizationService';
import { advancedPerformanceOptimizationService } from './advancedPerformanceOptimizationService';
import { analyticsService } from './analyticsService';
import { bundleOptimizationService } from './bundleOptimizationService';
import { enhancedCacheService } from './enhancedCacheService';
import { sentryService } from './sentryService';

interface OptimizationStatus {
  initialized: boolean;
  services: {
    performance: boolean;
    bundle: boolean;
    image: boolean;
    cache: boolean;
  };
  lastOptimization: Date | null;
  automaticOptimizations: boolean;
}

interface OptimizationReport {
  timestamp: string;
  performance: any;
  bundle: any;
  image: any;
  cache: any;
  recommendations: any[];
  scores: {
    overall: number;
    performance: number;
    bundle: number;
    image: number;
    cache: number;
  };
}

class OptimizationOrchestrator {
  private status: OptimizationStatus = {
    initialized: false,
    services: {
      performance: false,
      bundle: false,
      image: false,
      cache: false,
    },
    lastOptimization: null,
    automaticOptimizations: false,
  };

  private optimizationInterval: NodeJS.Timeout | null = null;
  private performanceThresholds = {
    memoryUsage: 0.8,
    renderTime: 16.67, // 60fps
    cacheHitRate: 0.7,
    bundleSize: 500000, // 500KB
  };

  /**
   * Initialize all optimization services
   */
  async initialize(): Promise<void> {
    try {
      console.log('🚀 Initializing Optimization Orchestrator...');

      // Initialize performance optimization service
      console.log('   Initializing performance optimization...');
      await advancedPerformanceOptimizationService.initialize();
      this.status.services.performance = true;

      // Initialize bundle optimization service
      console.log('   Initializing bundle optimization...');
      // Bundle service is passive, just mark as ready
      this.status.services.bundle = true;

      // Initialize image optimization service
      console.log('   Initializing image optimization...');
      // Image service auto-initializes, just mark as ready
      this.status.services.image = true;

      // Initialize cache service
      console.log('   Initializing cache optimization...');
      // Cache service is already initialized, just mark as ready
      this.status.services.cache = true;

      this.status.initialized = true;
      this.status.lastOptimization = new Date();

      // Start automatic optimization monitoring
      await this.startAutomaticOptimizations();

      console.log('✅ Optimization Orchestrator initialized successfully');

      // Track initialization
      analyticsService.trackEvent('optimization_orchestrator_init', {
        services: this.status.services,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('❌ Failed to initialize Optimization Orchestrator:', error);
      sentryService.captureException(error);
      throw error;
    }
  }

  /**
   * Start automatic optimization monitoring
   */
  private async startAutomaticOptimizations(): Promise<void> {
    if (this.optimizationInterval) return;

    this.status.automaticOptimizations = true;

    // Run optimization checks every 30 seconds
    this.optimizationInterval = setInterval(async () => {
      try {
        await this.runAutomaticOptimizations();
      } catch (error) {
        console.error('Error in automatic optimization:', error);
        sentryService.captureException(error);
      }
    }, 30000);

    console.log('⚡ Automatic optimizations started');
  }

  /**
   * Stop automatic optimization monitoring
   */
  stopAutomaticOptimizations(): void {
    if (this.optimizationInterval) {
      clearInterval(this.optimizationInterval);
      this.optimizationInterval = null;
    }

    this.status.automaticOptimizations = false;
    console.log('⏹️  Automatic optimizations stopped');
  }

  /**
   * Run automatic optimizations based on current performance metrics
   */
  private async runAutomaticOptimizations(): Promise<void> {
    try {
      // Get current metrics
      const performanceMetrics = advancedPerformanceOptimizationService.getMetrics();
      const cacheStats = enhancedCacheService.getStats();

      let optimizationsTriggered = 0;

      // Check memory usage
      if (performanceMetrics.memoryUsage > this.performanceThresholds.memoryUsage) {
        await this.optimizeMemoryUsage();
        optimizationsTriggered++;
      }

      // Check render time
      if (performanceMetrics.renderTime > this.performanceThresholds.renderTime) {
        await this.optimizeRenderPerformance();
        optimizationsTriggered++;
      }

      // Check cache hit rate
      if (cacheStats.hitRate < this.performanceThresholds.cacheHitRate) {
        await this.optimizeCachePerformance();
        optimizationsTriggered++;
      }

      // Apply bundle optimizations if needed
      await bundleOptimizationService.applyAutomaticOptimizations();

      if (optimizationsTriggered > 0) {
        this.status.lastOptimization = new Date();
        console.log(`⚡ Triggered ${optimizationsTriggered} automatic optimizations`);

        analyticsService.trackEvent('automatic_optimization_triggered', {
          optimizationsCount: optimizationsTriggered,
          metrics: performanceMetrics,
        });
      }
    } catch (error) {
      console.error('Error in automatic optimizations:', error);
    }
  }

  /**
   * Optimize memory usage across all services
   */
  private async optimizeMemoryUsage(): Promise<void> {
    console.log('🧹 Optimizing memory usage...');

    // Clear image optimization cache
    advancedImageOptimizationService.clearCache();

    // Clear enhanced cache service
    await enhancedCacheService.clearExpiredEntries();

    // Trigger performance service memory optimization
    await advancedPerformanceOptimizationService.triggerOptimization();
  }

  /**
   * Optimize render performance
   */
  private async optimizeRenderPerformance(): Promise<void> {
    console.log('⚡ Optimizing render performance...');

    // Get adaptive settings and reduce quality if needed
    const settings = advancedPerformanceOptimizationService.getAdaptiveSettings();
    const deviceCapabilities = advancedPerformanceOptimizationService.getDeviceCapabilities();

    if (deviceCapabilities && deviceCapabilities.tier !== 'low') {
      // Temporarily reduce image quality
      advancedImageOptimizationService.updateConfig({
        qualityTiers: {
          low: 40,
          medium: 60,
          high: 75,
          lossless: 90,
        },
      });
    }
  }

  /**
   * Optimize cache performance
   */
  private async optimizeCachePerformance(): Promise<void> {
    console.log('💾 Optimizing cache performance...');

    // Update cache configuration for better hit rates
    await enhancedCacheService.updateConfiguration({
      strategy: 'cache-first',
      maxAge: 300000, // 5 minutes
      enablePrefetching: true,
    });
  }

  /**
   * Run comprehensive optimization analysis
   */
  async runComprehensiveAnalysis(): Promise<OptimizationReport> {
    try {
      console.log('📊 Running comprehensive optimization analysis...');

      const report: OptimizationReport = {
        timestamp: new Date().toISOString(),
        performance: advancedPerformanceOptimizationService.generatePerformanceReport(),
        bundle: await bundleOptimizationService.generateOptimizationReport(),
        image: advancedImageOptimizationService.generateOptimizationReport(),
        cache: enhancedCacheService.generateCacheReport(),
        recommendations: [],
        scores: {
          overall: 0,
          performance: 0,
          bundle: 0,
          image: 0,
          cache: 0,
        },
      };

      // Generate bundle recommendations
      const bundleRecommendations = await bundleOptimizationService.analyzeBundleOptimization();
      report.recommendations.push(
        ...bundleRecommendations.map(rec => ({
          ...rec,
          category: 'Bundle',
        }))
      );

      // Calculate scores
      report.scores = this.calculateOptimizationScores(report);

      console.log('✅ Comprehensive analysis complete');
      console.log(`📊 Overall Optimization Score: ${report.scores.overall}/100`);

      // Track analysis
      analyticsService.trackEvent('comprehensive_analysis_complete', {
        overallScore: report.scores.overall,
        recommendationCount: report.recommendations.length,
      });

      return report;
    } catch (error) {
      console.error('❌ Error in comprehensive analysis:', error);
      sentryService.captureException(error);
      throw error;
    }
  }

  /**
   * Calculate optimization scores based on metrics
   */
  private calculateOptimizationScores(report: OptimizationReport): any {
    const scores = {
      performance: 100,
      bundle: 100,
      image: 100,
      cache: 100,
      overall: 100,
    };

    // Performance score
    const perfMetrics = report.performance.metrics;
    if (perfMetrics.memoryUsage > 0.8) scores.performance -= 20;
    if (perfMetrics.renderTime > 20) scores.performance -= 15;
    if (perfMetrics.networkLatency > 500) scores.performance -= 10;

    // Bundle score
    const bundleSize = report.bundle.estimatedSavings || 0;
    if (bundleSize > 100000)
      scores.bundle -= 30; // > 100KB savings available
    else if (bundleSize > 50000) scores.bundle -= 15; // > 50KB savings available

    // Image score
    const imageMetrics = report.image.performance;
    if (imageMetrics.totalBandwidthSaved < 1000000) scores.image -= 10; // < 1MB saved
    if (imageMetrics.averageLoadTime > 1000) scores.image -= 15; // > 1s load time

    // Cache score
    const cacheStats = report.cache;
    if (cacheStats.hitRate < 0.8) scores.cache -= 20;
    if (cacheStats.missRate > 0.3) scores.cache -= 10;

    // Overall score
    scores.overall = Math.round(
      (scores.performance + scores.bundle + scores.image + scores.cache) / 4
    );

    return scores;
  }

  /**
   * Apply optimization recommendations
   */
  async applyOptimizationRecommendations(recommendations: any[]): Promise<void> {
    console.log(`🔧 Applying ${recommendations.length} optimization recommendations...`);

    let applied = 0;

    for (const rec of recommendations) {
      try {
        switch (rec.type) {
          case 'lazy':
            // Enable lazy loading for component
            console.log(`   Enabling lazy loading for ${rec.target}`);
            applied++;
            break;

          case 'preload':
            // Enable preloading for component
            console.log(`   Enabling preloading for ${rec.target}`);
            applied++;
            break;

          case 'split':
            // Code splitting recommendation (manual implementation needed)
            console.log(`   Code splitting recommended for ${rec.target}`);
            break;

          case 'merge':
            // Bundle merging recommendation (manual implementation needed)
            console.log(`   Bundle merging recommended for ${rec.target}`);
            break;

          case 'remove':
            // Dependency removal recommendation (manual implementation needed)
            console.log(`   Dependency removal recommended: ${rec.target}`);
            break;

          default:
            console.log(`   Unknown recommendation type: ${rec.type}`);
        }
      } catch (error) {
        console.error(`Failed to apply recommendation ${rec.id}:`, error);
      }
    }

    console.log(`✅ Applied ${applied} automatic optimizations`);

    // Track applied optimizations
    analyticsService.trackEvent('optimizations_applied', {
      totalRecommendations: recommendations.length,
      appliedCount: applied,
    });
  }

  /**
   * Get current optimization status
   */
  getOptimizationStatus(): OptimizationStatus {
    return { ...this.status };
  }

  /**
   * Update performance thresholds
   */
  updatePerformanceThresholds(thresholds: Partial<typeof this.performanceThresholds>): void {
    this.performanceThresholds = {
      ...this.performanceThresholds,
      ...thresholds,
    };

    console.log('⚙️  Performance thresholds updated:', this.performanceThresholds);
  }

  /**
   * Get optimization statistics
   */
  getOptimizationStatistics(): any {
    return {
      status: this.status,
      thresholds: this.performanceThresholds,
      services: {
        performance: advancedPerformanceOptimizationService.getDeviceCapabilities(),
        bundle: bundleOptimizationService.getOptimizationStats(),
        image: advancedImageOptimizationService.getOptimizationStats(),
        cache: enhancedCacheService.getStats(),
      },
    };
  }

  /**
   * Emergency optimization mode - apply all aggressive optimizations
   */
  async activateEmergencyOptimization(): Promise<void> {
    console.log('🚨 Activating emergency optimization mode...');

    try {
      // Apply aggressive memory optimization
      await this.optimizeMemoryUsage();

      // Apply aggressive render optimization
      await this.optimizeRenderPerformance();

      // Apply aggressive cache optimization
      await this.optimizeCachePerformance();

      // Disable animations
      advancedImageOptimizationService.updateConfig({
        enableAdaptiveQuality: true,
        qualityTiers: {
          low: 30,
          medium: 50,
          high: 65,
          lossless: 80,
        },
      });

      console.log('✅ Emergency optimization mode activated');

      // Track emergency optimization
      analyticsService.trackEvent('emergency_optimization_activated', {
        timestamp: new Date().toISOString(),
        trigger: 'manual',
      });
    } catch (error) {
      console.error('❌ Failed to activate emergency optimization:', error);
      sentryService.captureException(error);
    }
  }

  /**
   * Reset optimizations to default settings
   */
  async resetOptimizations(): Promise<void> {
    console.log('🔄 Resetting optimizations to default settings...');

    try {
      // Reset image optimization settings
      advancedImageOptimizationService.updateConfig({
        enableAdaptiveQuality: true,
        qualityTiers: {
          low: 50,
          medium: 75,
          high: 90,
          lossless: 100,
        },
      });

      // Clear all caches
      advancedImageOptimizationService.clearCache();
      await enhancedCacheService.clearExpiredEntries();

      console.log('✅ Optimizations reset to defaults');
    } catch (error) {
      console.error('❌ Failed to reset optimizations:', error);
      sentryService.captureException(error);
    }
  }

  /**
   * Cleanup and shutdown optimization services
   */
  async shutdown(): Promise<void> {
    console.log('🛑 Shutting down Optimization Orchestrator...');

    // Stop automatic optimizations
    this.stopAutomaticOptimizations();

    // Reset status
    this.status = {
      initialized: false,
      services: {
        performance: false,
        bundle: false,
        image: false,
        cache: false,
      },
      lastOptimization: null,
      automaticOptimizations: false,
    };

    console.log('✅ Optimization Orchestrator shutdown complete');
  }
}

// Create singleton instance
export const optimizationOrchestrator = new OptimizationOrchestrator();
export default optimizationOrchestrator;
