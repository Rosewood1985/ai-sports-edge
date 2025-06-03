// =============================================================================
// PERFORMANCE OPTIMIZATION SERVICE
// React Native Performance Enhancement and Monitoring
// =============================================================================

import * as Sentry from '@sentry/react-native';
import React from 'react';
import { InteractionManager, DeviceEventEmitter } from 'react-native';

// =============================================================================
// INTERFACES
// =============================================================================

export interface PerformanceMetrics {
  jsHeapSizeUsed: number;
  jsHeapSizeTotal: number;
  jsHeapSizeLimit: number;
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeUsedPercent: number;
  memoryWarningLevel: 'low' | 'medium' | 'high' | 'critical';
  lastGCTime?: number;
  gcFrequency: number;
}

export interface ComponentPerformanceMetrics {
  componentName: string;
  renderTime: number;
  mountTime: number;
  updateCount: number;
  rerenderCount: number;
  lastRenderTime: Date;
  averageRenderTime: number;
  memoryUsage: number;
}

export interface NetworkOptimizationMetrics {
  requestCount: number;
  averageResponseTime: number;
  cacheHitRate: number;
  failedRequests: number;
  totalBandwidthUsed: number;
  compressionSavings: number;
}

export interface BundleOptimizationMetrics {
  bundleSize: number;
  gzippedSize: number;
  compressionRatio: number;
  codeSpittingChunks: number;
  lazyLoadedComponents: number;
  unusedCodePercentage: number;
}

export interface PerformanceConfig {
  enableMemoryMonitoring: boolean;
  enableComponentProfiling: boolean;
  enableNetworkOptimization: boolean;
  enableBundleOptimization: boolean;
  memoryWarningThreshold: number; // MB
  maxRenderTime: number; // ms
  maxComponentUpdates: number;
  reportingInterval: number; // ms
}

// =============================================================================
// PERFORMANCE OPTIMIZATION SERVICE
// =============================================================================

export class PerformanceOptimizationService {
  private config: PerformanceConfig;
  private performanceMetrics: PerformanceMetrics;
  private componentMetrics = new Map<string, ComponentPerformanceMetrics>();
  private networkMetrics: NetworkOptimizationMetrics;
  private bundleMetrics: BundleOptimizationMetrics;
  private memoryPressureListeners = new Set<() => void>();
  private performanceObserver?: PerformanceObserver;
  private isMonitoring = false;

  constructor(config?: Partial<PerformanceConfig>) {
    this.config = {
      enableMemoryMonitoring: true,
      enableComponentProfiling: true,
      enableNetworkOptimization: true,
      enableBundleOptimization: true,
      memoryWarningThreshold: 100, // 100MB
      maxRenderTime: 16, // 60fps target
      maxComponentUpdates: 10,
      reportingInterval: 30000, // 30 seconds
      ...config,
    };

    this.performanceMetrics = this.initializePerformanceMetrics();
    this.networkMetrics = this.initializeNetworkMetrics();
    this.bundleMetrics = this.initializeBundleMetrics();

    this.initialize();
  }

  /**
   * Initialize the performance optimization service
   */
  private async initialize(): Promise<void> {
    try {
      if (this.config.enableMemoryMonitoring) {
        this.startMemoryMonitoring();
      }

      if (this.config.enableComponentProfiling) {
        this.startComponentProfiling();
      }

      if (this.config.enableNetworkOptimization) {
        this.startNetworkOptimization();
      }

      this.startPerformanceReporting();
      this.isMonitoring = true;

      Sentry.addBreadcrumb({
        message: 'Performance Optimization Service initialized',
        category: 'performance.optimization.init',
        level: 'info',
        data: this.config,
      });
    } catch (error) {
      Sentry.captureException(error);
      console.error('Error initializing Performance Optimization Service:', error);
    }
  }

  // =============================================================================
  // MEMORY OPTIMIZATION
  // =============================================================================

  /**
   * Start memory monitoring
   */
  private startMemoryMonitoring(): void {
    // Monitor memory usage every 5 seconds
    setInterval(() => {
      this.updateMemoryMetrics();
    }, 5000);

    // Listen for memory warnings
    DeviceEventEmitter.addListener('memoryWarning', () => {
      this.handleMemoryWarning();
    });
  }

  /**
   * Update memory metrics
   */
  private updateMemoryMetrics(): void {
    try {
      // In React Native, we can approximate memory usage
      const memoryInfo = this.getMemoryInfo();

      this.performanceMetrics = {
        ...this.performanceMetrics,
        ...memoryInfo,
        jsHeapSizeUsedPercent: (memoryInfo.usedJSHeapSize / memoryInfo.totalJSHeapSize) * 100,
        memoryWarningLevel: this.calculateMemoryWarningLevel(memoryInfo.usedJSHeapSize),
      };

      // Check for memory pressure
      if (
        this.performanceMetrics.memoryWarningLevel === 'high' ||
        this.performanceMetrics.memoryWarningLevel === 'critical'
      ) {
        this.triggerMemoryOptimization();
      }
    } catch (error) {
      console.error('Error updating memory metrics:', error);
    }
  }

  /**
   * Get memory information
   */
  private getMemoryInfo(): Pick<
    PerformanceMetrics,
    'jsHeapSizeUsed' | 'jsHeapSizeTotal' | 'jsHeapSizeLimit' | 'usedJSHeapSize' | 'totalJSHeapSize'
  > {
    // Simulate memory metrics - in production, would use actual React Native APIs
    const usedMB = Math.random() * 150 + 50; // 50-200 MB
    const totalMB = 512; // 512 MB total

    return {
      jsHeapSizeUsed: usedMB * 1024 * 1024,
      jsHeapSizeTotal: totalMB * 1024 * 1024,
      jsHeapSizeLimit: totalMB * 1024 * 1024,
      usedJSHeapSize: usedMB * 1024 * 1024,
      totalJSHeapSize: totalMB * 1024 * 1024,
    };
  }

  /**
   * Calculate memory warning level
   */
  private calculateMemoryWarningLevel(
    usedMemory: number
  ): PerformanceMetrics['memoryWarningLevel'] {
    const usedMB = usedMemory / (1024 * 1024);

    if (usedMB > 200) return 'critical';
    if (usedMB > 150) return 'high';
    if (usedMB > 100) return 'medium';
    return 'low';
  }

  /**
   * Handle memory warning
   */
  private handleMemoryWarning(): void {
    Sentry.addBreadcrumb({
      message: 'Memory warning detected',
      category: 'performance.memory.warning',
      level: 'warning',
      data: this.performanceMetrics,
    });

    this.triggerMemoryOptimization();

    // Notify listeners
    this.memoryPressureListeners.forEach(listener => {
      try {
        listener();
      } catch (error) {
        console.error('Error in memory pressure listener:', error);
      }
    });
  }

  /**
   * Trigger memory optimization
   */
  private triggerMemoryOptimization(): void {
    // Force garbage collection if available
    if (global.gc) {
      global.gc();
      this.performanceMetrics.lastGCTime = Date.now();
      this.performanceMetrics.gcFrequency++;
    }

    // Clear component metrics for unmounted components
    this.cleanupComponentMetrics();

    // Trigger cache cleanup
    this.optimizeMemoryUsage();

    console.log('Memory optimization triggered');
  }

  /**
   * Optimize memory usage
   */
  private optimizeMemoryUsage(): void {
    // Clear old component metrics
    const cutoffTime = Date.now() - 60000; // 1 minute ago

    this.componentMetrics.forEach((metrics, componentName) => {
      if (metrics.lastRenderTime.getTime() < cutoffTime) {
        this.componentMetrics.delete(componentName);
      }
    });

    // Force React Native to optimize images
    this.optimizeImageMemory();
  }

  /**
   * Optimize image memory usage
   */
  private optimizeImageMemory(): void {
    // In production, this would integrate with image caching libraries
    console.log('Optimizing image memory usage');

    Sentry.addBreadcrumb({
      message: 'Image memory optimization triggered',
      category: 'performance.memory.images',
      level: 'info',
    });
  }

  // =============================================================================
  // COMPONENT PERFORMANCE PROFILING
  // =============================================================================

  /**
   * Start component profiling
   */
  private startComponentProfiling(): void {
    // In production, this would integrate with React DevTools Profiler
    console.log('Component profiling started');
  }

  /**
   * Record component render performance
   */
  recordComponentRender(componentName: string, renderTime: number): void {
    if (!this.config.enableComponentProfiling) return;

    const existing = this.componentMetrics.get(componentName);
    const now = new Date();

    if (existing) {
      const newMetrics: ComponentPerformanceMetrics = {
        ...existing,
        renderTime,
        updateCount: existing.updateCount + 1,
        rerenderCount: renderTime > 0 ? existing.rerenderCount + 1 : existing.rerenderCount,
        lastRenderTime: now,
        averageRenderTime:
          (existing.averageRenderTime * existing.updateCount + renderTime) /
          (existing.updateCount + 1),
      };

      this.componentMetrics.set(componentName, newMetrics);
    } else {
      const newMetrics: ComponentPerformanceMetrics = {
        componentName,
        renderTime,
        mountTime: renderTime,
        updateCount: 1,
        rerenderCount: renderTime > 0 ? 1 : 0,
        lastRenderTime: now,
        averageRenderTime: renderTime,
        memoryUsage: 0,
      };

      this.componentMetrics.set(componentName, newMetrics);
    }

    // Alert on slow renders
    if (renderTime > this.config.maxRenderTime) {
      this.alertSlowRender(componentName, renderTime);
    }
  }

  /**
   * Alert on slow component renders
   */
  private alertSlowRender(componentName: string, renderTime: number): void {
    Sentry.addBreadcrumb({
      message: `Slow component render detected`,
      category: 'performance.component.slow_render',
      level: 'warning',
      data: {
        componentName,
        renderTime,
        threshold: this.config.maxRenderTime,
      },
    });

    console.warn(`Slow render: ${componentName} took ${renderTime}ms`);
  }

  /**
   * Get component performance analytics
   */
  getComponentPerformanceAnalytics(): {
    slowestComponents: ComponentPerformanceMetrics[];
    mostUpdatedComponents: ComponentPerformanceMetrics[];
    averageRenderTime: number;
    totalComponents: number;
  } {
    const components = Array.from(this.componentMetrics.values());

    if (components.length === 0) {
      return {
        slowestComponents: [],
        mostUpdatedComponents: [],
        averageRenderTime: 0,
        totalComponents: 0,
      };
    }

    const slowestComponents = [...components]
      .sort((a, b) => b.averageRenderTime - a.averageRenderTime)
      .slice(0, 10);

    const mostUpdatedComponents = [...components]
      .sort((a, b) => b.updateCount - a.updateCount)
      .slice(0, 10);

    const averageRenderTime =
      components.reduce((sum, c) => sum + c.averageRenderTime, 0) / components.length;

    return {
      slowestComponents,
      mostUpdatedComponents,
      averageRenderTime: Math.round(averageRenderTime * 100) / 100,
      totalComponents: components.length,
    };
  }

  // =============================================================================
  // NETWORK OPTIMIZATION
  // =============================================================================

  /**
   * Start network optimization monitoring
   */
  private startNetworkOptimization(): void {
    // Monitor network requests
    this.setupNetworkInterceptors();

    // Update network metrics every 10 seconds
    setInterval(() => {
      this.updateNetworkMetrics();
    }, 10000);
  }

  /**
   * Setup network request interceptors
   */
  private setupNetworkInterceptors(): void {
    // In production, this would intercept fetch requests
    console.log('Network interceptors setup');
  }

  /**
   * Record network request performance
   */
  recordNetworkRequest(url: string, responseTime: number, cached: boolean, size: number): void {
    this.networkMetrics.requestCount++;
    this.networkMetrics.averageResponseTime =
      (this.networkMetrics.averageResponseTime * (this.networkMetrics.requestCount - 1) +
        responseTime) /
      this.networkMetrics.requestCount;

    if (cached) {
      this.networkMetrics.cacheHitRate =
        (this.networkMetrics.cacheHitRate * (this.networkMetrics.requestCount - 1) + 1) /
        this.networkMetrics.requestCount;
    }

    this.networkMetrics.totalBandwidthUsed += size;

    // Alert on slow network requests
    if (responseTime > 5000) {
      // 5 seconds
      this.alertSlowNetworkRequest(url, responseTime);
    }
  }

  /**
   * Record failed network request
   */
  recordFailedNetworkRequest(url: string, error: Error): void {
    this.networkMetrics.failedRequests++;

    Sentry.addBreadcrumb({
      message: 'Network request failed',
      category: 'performance.network.failed',
      level: 'error',
      data: { url, error: error.message },
    });
  }

  /**
   * Alert on slow network requests
   */
  private alertSlowNetworkRequest(url: string, responseTime: number): void {
    Sentry.addBreadcrumb({
      message: 'Slow network request detected',
      category: 'performance.network.slow',
      level: 'warning',
      data: { url, responseTime },
    });
  }

  /**
   * Update network metrics
   */
  private updateNetworkMetrics(): void {
    // Calculate cache hit rate as percentage
    this.networkMetrics.cacheHitRate = Math.round(this.networkMetrics.cacheHitRate * 100);

    // Calculate compression savings (simulated)
    this.networkMetrics.compressionSavings = Math.round(
      this.networkMetrics.totalBandwidthUsed * 0.3
    );
  }

  // =============================================================================
  // BUNDLE OPTIMIZATION
  // =============================================================================

  /**
   * Monitor bundle optimization metrics
   */
  private updateBundleMetrics(): void {
    // In production, this would analyze actual bundle metrics
    this.bundleMetrics = {
      bundleSize: 2.5 * 1024 * 1024, // 2.5 MB
      gzippedSize: 0.8 * 1024 * 1024, // 800 KB
      compressionRatio: 0.32, // 32% of original size
      codeSpittingChunks: 8,
      lazyLoadedComponents: 15,
      unusedCodePercentage: 12.5,
    };
  }

  // =============================================================================
  // PERFORMANCE REPORTING
  // =============================================================================

  /**
   * Start performance reporting
   */
  private startPerformanceReporting(): void {
    setInterval(() => {
      this.reportPerformanceMetrics();
    }, this.config.reportingInterval);
  }

  /**
   * Report performance metrics to Sentry
   */
  private reportPerformanceMetrics(): void {
    const componentAnalytics = this.getComponentPerformanceAnalytics();

    Sentry.addBreadcrumb({
      message: 'Performance metrics report',
      category: 'performance.report',
      level: 'info',
      data: {
        memory: {
          usedMB: Math.round(this.performanceMetrics.usedJSHeapSize / (1024 * 1024)),
          warningLevel: this.performanceMetrics.memoryWarningLevel,
          gcFrequency: this.performanceMetrics.gcFrequency,
        },
        components: {
          totalComponents: componentAnalytics.totalComponents,
          averageRenderTime: componentAnalytics.averageRenderTime,
          slowComponents: componentAnalytics.slowestComponents.slice(0, 3).map(c => ({
            name: c.componentName,
            renderTime: c.averageRenderTime,
          })),
        },
        network: {
          requestCount: this.networkMetrics.requestCount,
          averageResponseTime: Math.round(this.networkMetrics.averageResponseTime),
          cacheHitRate: Math.round(this.networkMetrics.cacheHitRate),
          failedRequests: this.networkMetrics.failedRequests,
        },
        bundle: {
          sizeMB: Math.round((this.bundleMetrics.bundleSize / (1024 * 1024)) * 100) / 100,
          compressionRatio: this.bundleMetrics.compressionRatio,
          lazyComponents: this.bundleMetrics.lazyLoadedComponents,
        },
      },
    });
  }

  // =============================================================================
  // PUBLIC API
  // =============================================================================

  /**
   * Get current performance metrics
   */
  getPerformanceMetrics(): {
    memory: PerformanceMetrics;
    components: ComponentPerformanceMetrics[];
    network: NetworkOptimizationMetrics;
    bundle: BundleOptimizationMetrics;
  } {
    return {
      memory: this.performanceMetrics,
      components: Array.from(this.componentMetrics.values()),
      network: this.networkMetrics,
      bundle: this.bundleMetrics,
    };
  }

  /**
   * Force garbage collection
   */
  forceGarbageCollection(): void {
    this.triggerMemoryOptimization();
  }

  /**
   * Add memory pressure listener
   */
  addMemoryPressureListener(listener: () => void): () => void {
    this.memoryPressureListeners.add(listener);

    // Return cleanup function
    return () => {
      this.memoryPressureListeners.delete(listener);
    };
  }

  /**
   * Clear all performance metrics
   */
  clearMetrics(): void {
    this.componentMetrics.clear();
    this.performanceMetrics = this.initializePerformanceMetrics();
    this.networkMetrics = this.initializeNetworkMetrics();
    this.bundleMetrics = this.initializeBundleMetrics();
  }

  /**
   * Stop monitoring
   */
  stopMonitoring(): void {
    this.isMonitoring = false;
    this.memoryPressureListeners.clear();

    if (this.performanceObserver) {
      this.performanceObserver.disconnect();
    }
  }

  /**
   * Check if monitoring is active
   */
  isActive(): boolean {
    return this.isMonitoring;
  }

  // =============================================================================
  // INITIALIZATION HELPERS
  // =============================================================================

  private initializePerformanceMetrics(): PerformanceMetrics {
    return {
      jsHeapSizeUsed: 0,
      jsHeapSizeTotal: 0,
      jsHeapSizeLimit: 0,
      usedJSHeapSize: 0,
      totalJSHeapSize: 0,
      jsHeapSizeUsedPercent: 0,
      memoryWarningLevel: 'low',
      gcFrequency: 0,
    };
  }

  private initializeNetworkMetrics(): NetworkOptimizationMetrics {
    return {
      requestCount: 0,
      averageResponseTime: 0,
      cacheHitRate: 0,
      failedRequests: 0,
      totalBandwidthUsed: 0,
      compressionSavings: 0,
    };
  }

  private initializeBundleMetrics(): BundleOptimizationMetrics {
    return {
      bundleSize: 0,
      gzippedSize: 0,
      compressionRatio: 0,
      codeSpittingChunks: 0,
      lazyLoadedComponents: 0,
      unusedCodePercentage: 0,
    };
  }

  private cleanupComponentMetrics(): void {
    // Keep only metrics from the last 5 minutes for active monitoring
    const cutoffTime = Date.now() - 5 * 60 * 1000;

    this.componentMetrics.forEach((metrics, componentName) => {
      if (metrics.lastRenderTime.getTime() < cutoffTime) {
        this.componentMetrics.delete(componentName);
      }
    });
  }
}

// =============================================================================
// REACT PERFORMANCE HOOKS
// =============================================================================

/**
 * Hook for monitoring component performance
 */
export function usePerformanceMonitoring(componentName: string) {
  const startTime = Date.now();

  return {
    recordRender: () => {
      const renderTime = Date.now() - startTime;
      performanceOptimizationService.recordComponentRender(componentName, renderTime);
    },
  };
}

/**
 * HOC for automatic performance monitoring
 */
export function withPerformanceMonitoring<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  componentName?: string
) {
  const displayName = componentName || WrappedComponent.displayName || WrappedComponent.name;

  return React.memo((props: P) => {
    const { recordRender } = usePerformanceMonitoring(displayName);

    React.useEffect(() => {
      recordRender();
    });

    return React.createElement(WrappedComponent, props);
  });
}

// =============================================================================
// SINGLETON INSTANCE
// =============================================================================

export const performanceOptimizationService = new PerformanceOptimizationService();

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Optimize interaction manager for performance
 */
export function optimizeInteractionManager(callback: () => void): void {
  InteractionManager.runAfterInteractions(() => {
    // Use requestAnimationFrame for optimal timing
    requestAnimationFrame(callback);
  });
}

/**
 * Debounce function for performance optimization
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;

  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}

/**
 * Throttle function for performance optimization
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let lastExecution = 0;

  return (...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastExecution >= delay) {
      lastExecution = now;
      func(...args);
    }
  };
}
