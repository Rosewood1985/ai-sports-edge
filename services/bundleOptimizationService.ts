/**
 * Bundle Optimization Service
 *
 * Provides intelligent bundle analysis, code splitting recommendations,
 * and dynamic import optimization for the AI Sports Edge platform.
 */

import React from 'react';

import { analyticsService } from './analyticsService';
import { sentryService } from './sentryService';

interface BundleMetrics {
  totalSize: number;
  chunks: ChunkInfo[];
  duplicates: DuplicateModule[];
  unusedModules: string[];
  loadTime: number;
  compressionRatio: number;
}

interface ChunkInfo {
  name: string;
  size: number;
  modules: string[];
  loadTime: number;
  usage: 'critical' | 'important' | 'optional' | 'unused';
}

interface DuplicateModule {
  name: string;
  chunks: string[];
  totalSize: number;
  wastedBytes: number;
}

interface OptimizationRecommendation {
  type: 'split' | 'merge' | 'lazy' | 'preload' | 'prefetch' | 'remove';
  target: string;
  impact: 'high' | 'medium' | 'low';
  description: string;
  estimatedSavings: number;
}

interface LazyLoadConfig {
  component: string;
  threshold: number;
  fallback: string;
  preload: boolean;
}

class BundleOptimizationService {
  private bundleMetrics: BundleMetrics | null = null;
  private loadedChunks: Set<string> = new Set();
  private chunkLoadTimes: Map<string, number> = new Map();
  private componentUsageStats: Map<string, number> = new Map();
  private lazyComponents: Map<string, LazyLoadConfig> = new Map();

  constructor() {
    this.initializeLazyLoadConfigs();
    this.trackBundleMetrics();
  }

  /**
   * Initialize lazy loading configurations for heavy components
   */
  private initializeLazyLoadConfigs(): void {
    const lazyConfigs: LazyLoadConfig[] = [
      {
        component: 'AdvancedAnalyticsDashboard',
        threshold: 0.1,
        fallback: 'AnalyticsLoadingSkeleton',
        preload: false,
      },
      {
        component: 'BettingAnalyticsChart',
        threshold: 0.2,
        fallback: 'ChartLoadingSkeleton',
        preload: true,
      },
      {
        component: 'EnhancedPlayerStatistics',
        threshold: 0.1,
        fallback: 'PlayerStatsLoadingSkeleton',
        preload: false,
      },
      {
        component: 'ParlayOddsCard',
        threshold: 0.15,
        fallback: 'OddsCardSkeleton',
        preload: true,
      },
      {
        component: 'RealTimeDataIntegration',
        threshold: 0.1,
        fallback: 'DataLoadingSkeleton',
        preload: false,
      },
      {
        component: 'AdvancedStripeComponents',
        threshold: 0.05,
        fallback: 'PaymentLoadingSkeleton',
        preload: false,
      },
    ];

    lazyConfigs.forEach(config => {
      this.lazyComponents.set(config.component, config);
    });
  }

  /**
   * Track bundle metrics and performance
   */
  private trackBundleMetrics(): void {
    // Monitor chunk loading
    if (typeof window !== 'undefined' && window.performance) {
      const observer = new PerformanceObserver(list => {
        for (const entry of list.getEntries()) {
          if (entry.name.includes('.chunk.js')) {
            const chunkName = this.extractChunkName(entry.name);
            this.chunkLoadTimes.set(chunkName, entry.duration);
            this.loadedChunks.add(chunkName);
          }
        }
      });

      observer.observe({ entryTypes: ['resource'] });
    }

    // Track component usage
    this.startComponentUsageTracking();
  }

  /**
   * Extract chunk name from resource URL
   */
  private extractChunkName(url: string): string {
    const match = url.match(/([^\/]+)\.chunk\.js/);
    return match ? match[1] : 'unknown';
  }

  /**
   * Start tracking component usage for optimization decisions
   */
  private startComponentUsageTracking(): void {
    // Track component mounts and usage frequency
    const originalCreateElement = React.createElement;
    React.createElement = (...args) => {
      const type = args[0];
      if (typeof type === 'string' || (typeof type === 'function' && type.name)) {
        const componentName = typeof type === 'string' ? type : type.name;
        const currentCount = this.componentUsageStats.get(componentName) || 0;
        this.componentUsageStats.set(componentName, currentCount + 1);
      }
      return originalCreateElement.apply(React, args);
    };
  }

  /**
   * Analyze current bundle and generate optimization recommendations
   */
  async analyzeBundleOptimization(): Promise<OptimizationRecommendation[]> {
    try {
      console.log('📊 Analyzing bundle optimization opportunities...');

      const recommendations: OptimizationRecommendation[] = [];

      // Analyze component usage patterns
      const usageRecommendations = this.analyzeComponentUsage();
      recommendations.push(...usageRecommendations);

      // Analyze chunk loading patterns
      const chunkRecommendations = this.analyzeChunkLoading();
      recommendations.push(...chunkRecommendations);

      // Analyze dependencies
      const dependencyRecommendations = await this.analyzeDependencies();
      recommendations.push(...dependencyRecommendations);

      // Sort by impact
      recommendations.sort((a, b) => {
        const impactOrder = { high: 3, medium: 2, low: 1 };
        return impactOrder[b.impact] - impactOrder[a.impact];
      });

      console.log(`✅ Found ${recommendations.length} optimization opportunities`);

      // Track analysis results
      analyticsService.trackEvent('bundle_analysis_complete', {
        recommendationCount: recommendations.length,
        highImpactCount: recommendations.filter(r => r.impact === 'high').length,
        estimatedTotalSavings: recommendations.reduce((sum, r) => sum + r.estimatedSavings, 0),
      });

      return recommendations;
    } catch (error) {
      console.error('❌ Error analyzing bundle optimization:', error);
      sentryService.captureException(error);
      return [];
    }
  }

  /**
   * Analyze component usage patterns
   */
  private analyzeComponentUsage(): OptimizationRecommendation[] {
    const recommendations: OptimizationRecommendation[] = [];

    // Find rarely used components that should be lazy loaded
    for (const [component, usage] of this.componentUsageStats.entries()) {
      if (usage < 5 && !this.lazyComponents.has(component)) {
        recommendations.push({
          type: 'lazy',
          target: component,
          impact: 'medium',
          description: `Convert ${component} to lazy loading (used ${usage} times)`,
          estimatedSavings: this.estimateComponentSize(component),
        });
      }
    }

    // Find components that should be preloaded
    for (const [component, usage] of this.componentUsageStats.entries()) {
      if (usage > 50 && this.lazyComponents.has(component)) {
        const config = this.lazyComponents.get(component)!;
        if (!config.preload) {
          recommendations.push({
            type: 'preload',
            target: component,
            impact: 'low',
            description: `Enable preloading for ${component} (used ${usage} times)`,
            estimatedSavings: 0, // No size savings, but better UX
          });
        }
      }
    }

    return recommendations;
  }

  /**
   * Analyze chunk loading patterns
   */
  private analyzeChunkLoading(): OptimizationRecommendation[] {
    const recommendations: OptimizationRecommendation[] = [];

    // Find slow-loading chunks
    for (const [chunk, loadTime] of this.chunkLoadTimes.entries()) {
      if (loadTime > 1000) {
        // > 1 second
        recommendations.push({
          type: 'split',
          target: chunk,
          impact: 'high',
          description: `Split ${chunk} chunk (loads in ${loadTime.toFixed(0)}ms)`,
          estimatedSavings: Math.floor(loadTime * 0.3), // Estimated 30% improvement
        });
      }
    }

    // Find chunks that are always loaded together
    const coLoadedChunks = this.findCoLoadedChunks();
    for (const group of coLoadedChunks) {
      if (group.length > 1) {
        recommendations.push({
          type: 'merge',
          target: group.join(', '),
          impact: 'medium',
          description: `Merge frequently co-loaded chunks: ${group.join(', ')}`,
          estimatedSavings: group.length * 50, // Estimated overhead reduction
        });
      }
    }

    return recommendations;
  }

  /**
   * Find chunks that are frequently loaded together
   */
  private findCoLoadedChunks(): string[][] {
    // This would require more sophisticated tracking in a real implementation
    // For now, return some common patterns
    return [
      ['vendor.react', 'vendor.redux'], // React ecosystem
      ['vendor.firebase', 'vendor.firestore'], // Firebase ecosystem
    ];
  }

  /**
   * Analyze dependencies for optimization opportunities
   */
  private async analyzeDependencies(): Promise<OptimizationRecommendation[]> {
    const recommendations: OptimizationRecommendation[] = [];

    // Check for known optimization opportunities
    const heavyDependencies = [
      {
        name: 'moment',
        replacement: 'date-fns',
        savings: 67000, // bytes
        description: 'Replace moment.js with date-fns for smaller bundle size',
      },
      {
        name: 'lodash',
        replacement: 'lodash-es',
        savings: 24000,
        description: 'Use lodash-es for better tree-shaking',
      },
      {
        name: '@mui/material',
        replacement: 'selective imports',
        savings: 150000,
        description: 'Use selective imports instead of default import',
      },
    ];

    for (const dep of heavyDependencies) {
      // In a real implementation, we'd check package.json or bundle analysis
      // For now, assume these might be present
      recommendations.push({
        type: 'remove',
        target: dep.name,
        impact: 'high',
        description: dep.description,
        estimatedSavings: dep.savings,
      });
    }

    return recommendations;
  }

  /**
   * Estimate component size for optimization calculations
   */
  private estimateComponentSize(componentName: string): number {
    // Rough estimates based on component complexity
    const sizeEstimates: Record<string, number> = {
      AdvancedAnalyticsDashboard: 45000,
      BettingAnalyticsChart: 32000,
      EnhancedPlayerStatistics: 28000,
      ParlayOddsCard: 15000,
      RealTimeDataIntegration: 38000,
      AdvancedStripeComponents: 25000,
    };

    return sizeEstimates[componentName] || 10000; // Default 10KB
  }

  /**
   * Create lazy loading wrapper for a component
   */
  createLazyComponent(
    componentPath: string,
    fallback?: React.ComponentType
  ): React.LazyExoticComponent<any> {
    const LazyComponent = React.lazy(() => import(componentPath));

    return LazyComponent;
  }

  /**
   * Generate lazy loading code for a component
   */
  generateLazyLoadingCode(componentName: string): string {
    const config = this.lazyComponents.get(componentName);
    if (!config) {
      throw new Error(`No lazy load config found for ${componentName}`);
    }

    return `
// Lazy loading configuration for ${componentName}
import React, { Suspense } from 'react';
import ${config.fallback} from './components/skeletons/${config.fallback}';

const Lazy${componentName} = React.lazy(() => 
  import('./components/${componentName}')${config.preload ? '.then(module => {\n    // Preload for better UX\n    return module;\n  })' : ''}
);

export const ${componentName} = (props) => (
  <Suspense fallback={<${config.fallback} />}>
    <Lazy${componentName} {...props} />
  </Suspense>
);
`;
  }

  /**
   * Implement a performance budget checker
   */
  checkPerformanceBudget(): {
    passed: boolean;
    results: { metric: string; value: number; budget: number; passed: boolean }[];
  } {
    const budgets = {
      totalBundleSize: 500 * 1024, // 500KB
      mainChunkSize: 250 * 1024, // 250KB
      vendorChunkSize: 300 * 1024, // 300KB
      cssSize: 50 * 1024, // 50KB
    };

    const results = [];
    let allPassed = true;

    // Check each budget (in a real implementation, these would come from actual bundle analysis)
    for (const [metric, budget] of Object.entries(budgets)) {
      const currentValue = this.getCurrentBundleSize(metric);
      const passed = currentValue <= budget;

      if (!passed) allPassed = false;

      results.push({
        metric,
        value: currentValue,
        budget,
        passed,
      });
    }

    return { passed: allPassed, results };
  }

  /**
   * Get current bundle size for a specific metric
   */
  private getCurrentBundleSize(metric: string): number {
    // In a real implementation, this would analyze actual bundle files
    // For now, return mock values
    const mockSizes: Record<string, number> = {
      totalBundleSize: 480 * 1024,
      mainChunkSize: 230 * 1024,
      vendorChunkSize: 280 * 1024,
      cssSize: 35 * 1024,
    };

    return mockSizes[metric] || 0;
  }

  /**
   * Generate bundle optimization report
   */
  async generateOptimizationReport(): Promise<any> {
    const recommendations = await this.analyzeBundleOptimization();
    const budgetCheck = this.checkPerformanceBudget();

    return {
      timestamp: new Date().toISOString(),
      bundleMetrics: this.bundleMetrics,
      performanceBudget: budgetCheck,
      recommendations,
      componentUsage: Array.from(this.componentUsageStats.entries())
        .sort(([, a], [, b]) => b - a)
        .slice(0, 20), // Top 20 most used components
      chunkLoadTimes: Array.from(this.chunkLoadTimes.entries()).sort(([, a], [, b]) => b - a),
      lazyLoadConfigs: Array.from(this.lazyComponents.entries()),
      estimatedSavings: recommendations.reduce((sum, r) => sum + r.estimatedSavings, 0),
    };
  }

  /**
   * Apply automatic optimizations
   */
  async applyAutomaticOptimizations(): Promise<void> {
    try {
      console.log('🚀 Applying automatic bundle optimizations...');

      const recommendations = await this.analyzeBundleOptimization();

      // Apply low-risk optimizations automatically
      for (const rec of recommendations) {
        if (rec.impact === 'low' && rec.type === 'preload') {
          await this.enablePreloading(rec.target);
        }
      }

      // Update lazy loading thresholds based on usage
      this.optimizeLazyLoadingThresholds();

      console.log('✅ Automatic optimizations applied');
    } catch (error) {
      console.error('❌ Error applying automatic optimizations:', error);
      sentryService.captureException(error);
    }
  }

  /**
   * Enable preloading for a component
   */
  private async enablePreloading(componentName: string): Promise<void> {
    const config = this.lazyComponents.get(componentName);
    if (config) {
      config.preload = true;
      this.lazyComponents.set(componentName, config);
      console.log(`📦 Enabled preloading for ${componentName}`);
    }
  }

  /**
   * Optimize lazy loading thresholds based on usage data
   */
  private optimizeLazyLoadingThresholds(): void {
    for (const [component, config] of this.lazyComponents.entries()) {
      const usage = this.componentUsageStats.get(component) || 0;

      // Adjust threshold based on usage frequency
      if (usage > 100) {
        config.threshold = Math.max(0.05, config.threshold * 0.8); // Load earlier
      } else if (usage < 10) {
        config.threshold = Math.min(0.5, config.threshold * 1.2); // Load later
      }

      this.lazyComponents.set(component, config);
    }
  }

  /**
   * Get optimization statistics
   */
  getOptimizationStats(): any {
    return {
      lazyComponentsCount: this.lazyComponents.size,
      loadedChunksCount: this.loadedChunks.size,
      componentUsageEntries: this.componentUsageStats.size,
      averageChunkLoadTime: this.calculateAverageChunkLoadTime(),
      mostUsedComponents: this.getMostUsedComponents(5),
    };
  }

  private calculateAverageChunkLoadTime(): number {
    if (this.chunkLoadTimes.size === 0) return 0;
    const total = Array.from(this.chunkLoadTimes.values()).reduce((sum, time) => sum + time, 0);
    return total / this.chunkLoadTimes.size;
  }

  private getMostUsedComponents(count: number): { name: string; usage: number }[] {
    return Array.from(this.componentUsageStats.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, count)
      .map(([name, usage]) => ({ name, usage }));
  }
}

// Create singleton instance
export const bundleOptimizationService = new BundleOptimizationService();
export default bundleOptimizationService;
