/**
 * Advanced Image Optimization Service
 *
 * Provides intelligent image optimization with adaptive quality,
 * next-gen format support, and performance-based loading strategies.
 */

import { analyticsService } from './analyticsService';
import { enhancedCacheService } from './enhancedCacheService';
import { sentryService } from './sentryService';

interface ImageMetrics {
  totalImages: number;
  loadedImages: number;
  averageLoadTime: number;
  bandwidthSaved: number;
  formatSupport: FormatSupport;
}

interface FormatSupport {
  webp: boolean;
  avif: boolean;
  heic: boolean;
  jpeg2000: boolean;
}

interface ImageOptimizationConfig {
  enableAdaptiveQuality: boolean;
  enableLazyLoading: boolean;
  enableProgressiveLoading: boolean;
  preferredFormat: 'auto' | 'webp' | 'avif' | 'jpeg' | 'png';
  qualityTiers: QualityTiers;
  lazyLoadThreshold: number;
  preloadCritical: boolean;
}

interface QualityTiers {
  low: number;
  medium: number;
  high: number;
  lossless: number;
}

interface ImageLoadRequest {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  priority: 'critical' | 'high' | 'medium' | 'low';
  responsive?: boolean;
  quality?: 'auto' | 'low' | 'medium' | 'high' | 'lossless';
}

interface OptimizedImageResult {
  src: string;
  srcSet?: string;
  sizes?: string;
  format: string;
  originalSize: number;
  optimizedSize: number;
  compressionRatio: number;
  loadTime?: number;
}

class AdvancedImageOptimizationService {
  private config: ImageOptimizationConfig;
  private formatSupport: FormatSupport;
  private metrics: ImageMetrics;
  private loadingQueue: ImageLoadRequest[] = [];
  private loadingInProgress: Set<string> = new Set();
  private imageCache: Map<string, OptimizedImageResult> = new Map();
  private intersectionObserver?: IntersectionObserver;
  private networkQuality: 'slow' | 'fast' | 'unknown' = 'unknown';

  constructor() {
    this.config = this.getDefaultConfig();
    this.formatSupport = this.detectFormatSupport();
    this.metrics = this.initializeMetrics();

    this.detectNetworkQuality();
    this.initializeLazyLoading();
    this.startMetricsCollection();
  }

  /**
   * Get default optimization configuration
   */
  private getDefaultConfig(): ImageOptimizationConfig {
    return {
      enableAdaptiveQuality: true,
      enableLazyLoading: true,
      enableProgressiveLoading: true,
      preferredFormat: 'auto',
      qualityTiers: {
        low: 50,
        medium: 75,
        high: 90,
        lossless: 100,
      },
      lazyLoadThreshold: 0.1,
      preloadCritical: true,
    };
  }

  /**
   * Detect browser format support
   */
  private detectFormatSupport(): FormatSupport {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;

    return {
      webp: canvas.toDataURL('image/webp').startsWith('data:image/webp'),
      avif: canvas.toDataURL('image/avif').startsWith('data:image/avif'),
      heic: false, // Generally not supported in browsers
      jpeg2000: canvas.toDataURL('image/jp2').startsWith('data:image/jp2'),
    };
  }

  /**
   * Initialize metrics tracking
   */
  private initializeMetrics(): ImageMetrics {
    return {
      totalImages: 0,
      loadedImages: 0,
      averageLoadTime: 0,
      bandwidthSaved: 0,
      formatSupport: this.formatSupport,
    };
  }

  /**
   * Detect network quality for adaptive optimization
   */
  private detectNetworkQuality(): void {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      const effectiveType = connection?.effectiveType;

      if (['slow-2g', '2g', '3g'].includes(effectiveType)) {
        this.networkQuality = 'slow';
      } else if (['4g'].includes(effectiveType)) {
        this.networkQuality = 'fast';
      }

      // Listen for network changes
      connection?.addEventListener('change', () => {
        this.detectNetworkQuality();
        this.adjustConfigForNetwork();
      });
    }
  }

  /**
   * Adjust configuration based on network quality
   */
  private adjustConfigForNetwork(): void {
    if (this.networkQuality === 'slow') {
      this.config.qualityTiers = {
        low: 40,
        medium: 60,
        high: 75,
        lossless: 90,
      };
      this.config.lazyLoadThreshold = 0.3;
    } else if (this.networkQuality === 'fast') {
      this.config.qualityTiers = {
        low: 60,
        medium: 80,
        high: 95,
        lossless: 100,
      };
      this.config.lazyLoadThreshold = 0.05;
    }
  }

  /**
   * Initialize lazy loading with Intersection Observer
   */
  private initializeLazyLoading(): void {
    if (!('IntersectionObserver' in window)) return;

    this.intersectionObserver = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            this.loadImage(img);
            this.intersectionObserver?.unobserve(img);
          }
        });
      },
      {
        threshold: this.config.lazyLoadThreshold,
        rootMargin: '50px 0px',
      }
    );
  }

  /**
   * Start collecting performance metrics
   */
  private startMetricsCollection(): void {
    // Monitor image loading performance
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver(list => {
        list.getEntries().forEach(entry => {
          if (entry.initiatorType === 'img') {
            this.updateLoadTimeMetrics(entry.duration);
          }
        });
      });

      observer.observe({ entryTypes: ['resource'] });
    }
  }

  /**
   * Update load time metrics
   */
  private updateLoadTimeMetrics(loadTime: number): void {
    const totalTime = this.metrics.averageLoadTime * this.metrics.loadedImages + loadTime;
    this.metrics.loadedImages++;
    this.metrics.averageLoadTime = totalTime / this.metrics.loadedImages;
  }

  /**
   * Optimize image with intelligent format selection and quality adjustment
   */
  async optimizeImage(request: ImageLoadRequest): Promise<OptimizedImageResult> {
    try {
      const cacheKey = this.generateCacheKey(request);

      // Check cache first
      const cached = this.imageCache.get(cacheKey);
      if (cached) {
        return cached;
      }

      // Determine optimal format
      const format = this.selectOptimalFormat(request);

      // Determine optimal quality
      const quality = this.selectOptimalQuality(request);

      // Generate optimized image URLs
      const optimizedSrc = this.generateOptimizedUrl(
        request.src,
        format,
        quality,
        request.width,
        request.height
      );
      const result = await this.processImageOptimization(request, optimizedSrc, format, quality);

      // Cache the result
      this.imageCache.set(cacheKey, result);

      // Update metrics
      this.metrics.totalImages++;
      this.metrics.bandwidthSaved += result.originalSize - result.optimizedSize;

      return result;
    } catch (error) {
      console.error('Error optimizing image:', error);
      sentryService.captureException(error);

      // Fallback to original image
      return {
        src: request.src,
        format: 'original',
        originalSize: 0,
        optimizedSize: 0,
        compressionRatio: 1,
      };
    }
  }

  /**
   * Generate cache key for image optimization result
   */
  private generateCacheKey(request: ImageLoadRequest): string {
    return `img_${request.src}_${request.width || 'auto'}_${request.height || 'auto'}_${request.quality || 'auto'}_${this.networkQuality}`;
  }

  /**
   * Select optimal image format based on browser support and image type
   */
  private selectOptimalFormat(request: ImageLoadRequest): string {
    if (this.config.preferredFormat !== 'auto') {
      return this.config.preferredFormat;
    }

    // Check if it's a complex image that benefits from next-gen formats
    const isPhoto = /\.(jpg|jpeg)$/i.test(request.src);
    const hasTransparency = /\.png$/i.test(request.src);

    if (this.formatSupport.avif && isPhoto) {
      return 'avif'; // Best compression for photos
    } else if (this.formatSupport.webp) {
      return 'webp'; // Good compression, wide support
    } else if (hasTransparency) {
      return 'png'; // Preserve transparency
    } else {
      return 'jpeg'; // Fallback
    }
  }

  /**
   * Select optimal quality based on request priority and network conditions
   */
  private selectOptimalQuality(request: ImageLoadRequest): number {
    if (request.quality && request.quality !== 'auto') {
      return this.config.qualityTiers[request.quality];
    }

    // Adaptive quality based on priority and network
    switch (request.priority) {
      case 'critical':
        return this.networkQuality === 'slow'
          ? this.config.qualityTiers.medium
          : this.config.qualityTiers.high;

      case 'high':
        return this.config.qualityTiers.medium;

      case 'medium':
        return this.networkQuality === 'slow'
          ? this.config.qualityTiers.low
          : this.config.qualityTiers.medium;

      case 'low':
        return this.config.qualityTiers.low;

      default:
        return this.config.qualityTiers.medium;
    }
  }

  /**
   * Generate optimized image URL (would integrate with CDN or image service)
   */
  private generateOptimizedUrl(
    originalSrc: string,
    format: string,
    quality: number,
    width?: number,
    height?: number
  ): string {
    // In a real implementation, this would integrate with a CDN like Cloudinary, ImageKit, etc.
    // For now, we'll create a mock optimized URL
    const params = new URLSearchParams();

    if (format !== 'original') params.set('f', format);
    params.set('q', quality.toString());
    if (width) params.set('w', width.toString());
    if (height) params.set('h', height.toString());

    // Mock CDN URL structure
    return `https://cdn.aisportsedge.com/optimized/${encodeURIComponent(originalSrc)}?${params.toString()}`;
  }

  /**
   * Process image optimization and measure results
   */
  private async processImageOptimization(
    request: ImageLoadRequest,
    optimizedSrc: string,
    format: string,
    quality: number
  ): Promise<OptimizedImageResult> {
    const startTime = performance.now();

    try {
      // In a real implementation, we'd measure actual file sizes
      // For now, estimate based on quality and format
      const originalSize = this.estimateImageSize(request.src, 'original', 100);
      const optimizedSize = this.estimateImageSize(request.src, format, quality);

      const result: OptimizedImageResult = {
        src: optimizedSrc,
        format,
        originalSize,
        optimizedSize,
        compressionRatio: originalSize > 0 ? optimizedSize / originalSize : 1,
        loadTime: performance.now() - startTime,
      };

      // Generate responsive srcSet if requested
      if (request.responsive && request.width) {
        result.srcSet = this.generateResponsiveSrcSet(request.src, format, quality, request.width);
        result.sizes = this.generateSizesAttribute(request.width);
      }

      return result;
    } catch (error) {
      throw new Error(`Failed to process image optimization: ${error.message}`);
    }
  }

  /**
   * Estimate image size based on format and quality
   */
  private estimateImageSize(src: string, format: string, quality: number): number {
    // Base size estimation (would be more accurate with actual image analysis)
    let baseSize = 100000; // 100KB base estimate

    // Adjust for format
    const formatMultipliers = {
      avif: 0.5, // 50% smaller than JPEG
      webp: 0.75, // 25% smaller than JPEG
      jpeg: 1.0, // Baseline
      png: 1.5, // 50% larger than JPEG
      original: 1.0,
    };

    baseSize *= formatMultipliers[format] || 1.0;

    // Adjust for quality
    baseSize *= quality / 100;

    return Math.round(baseSize);
  }

  /**
   * Generate responsive srcSet
   */
  private generateResponsiveSrcSet(
    src: string,
    format: string,
    quality: number,
    baseWidth: number
  ): string {
    const breakpoints = [0.5, 1, 1.5, 2]; // Device pixel ratios

    return breakpoints
      .map(ratio => {
        const width = Math.round(baseWidth * ratio);
        const url = this.generateOptimizedUrl(src, format, quality, width);
        return `${url} ${ratio}x`;
      })
      .join(', ');
  }

  /**
   * Generate sizes attribute for responsive images
   */
  private generateSizesAttribute(baseWidth: number): string {
    return `(max-width: 768px) ${Math.round(baseWidth * 0.9)}px, ${baseWidth}px`;
  }

  /**
   * Load image with optimization
   */
  private async loadImage(img: HTMLImageElement): Promise<void> {
    const src = img.dataset.src || img.src;
    if (!src || this.loadingInProgress.has(src)) return;

    this.loadingInProgress.add(src);

    try {
      const request: ImageLoadRequest = {
        src,
        alt: img.alt,
        width: img.width || undefined,
        height: img.height || undefined,
        priority: (img.dataset.priority as any) || 'medium',
        responsive: img.dataset.responsive === 'true',
        quality: (img.dataset.quality as any) || 'auto',
      };

      const optimized = await this.optimizeImage(request);

      // Update image attributes
      img.src = optimized.src;
      if (optimized.srcSet) img.srcset = optimized.srcSet;
      if (optimized.sizes) img.sizes = optimized.sizes;

      // Remove loading indicator
      img.classList.remove('loading');
      img.classList.add('loaded');
    } catch (error) {
      console.error('Failed to load optimized image:', error);
      // Fallback to original source
      img.src = src;
    } finally {
      this.loadingInProgress.delete(src);
    }
  }

  /**
   * Preload critical images
   */
  async preloadCriticalImages(images: ImageLoadRequest[]): Promise<void> {
    if (!this.config.preloadCritical) return;

    const criticalImages = images.filter(img => img.priority === 'critical');

    for (const image of criticalImages) {
      try {
        const optimized = await this.optimizeImage(image);

        // Create preload link
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'image';
        link.href = optimized.src;
        if (optimized.srcSet) {
          link.setAttribute('imagesrcset', optimized.srcSet);
          link.setAttribute('imagesizes', optimized.sizes || '100vw');
        }

        document.head.appendChild(link);
      } catch (error) {
        console.error('Failed to preload critical image:', error);
      }
    }
  }

  /**
   * Enable lazy loading for images
   */
  enableLazyLoading(container: HTMLElement = document.body): void {
    if (!this.intersectionObserver) return;

    const images = container.querySelectorAll('img[data-src]');
    images.forEach(img => {
      this.intersectionObserver!.observe(img);
    });
  }

  /**
   * Update optimization configuration
   */
  updateConfig(newConfig: Partial<ImageOptimizationConfig>): void {
    this.config = { ...this.config, ...newConfig };

    // Update intersection observer threshold if changed
    if (newConfig.lazyLoadThreshold && this.intersectionObserver) {
      this.intersectionObserver.disconnect();
      this.initializeLazyLoading();
    }
  }

  /**
   * Get current metrics
   */
  getMetrics(): ImageMetrics {
    return { ...this.metrics };
  }

  /**
   * Generate optimization report
   */
  generateOptimizationReport(): any {
    const totalSavings = this.metrics.bandwidthSaved;
    const averageCompressionRatio = this.calculateAverageCompressionRatio();

    return {
      timestamp: new Date().toISOString(),
      metrics: this.metrics,
      configuration: this.config,
      formatSupport: this.formatSupport,
      networkQuality: this.networkQuality,
      performance: {
        totalBandwidthSaved: totalSavings,
        averageLoadTime: this.metrics.averageLoadTime,
        averageCompressionRatio,
        loadSuccessRate: this.calculateLoadSuccessRate(),
      },
      cacheStats: {
        entriesCount: this.imageCache.size,
        hitRate: this.calculateCacheHitRate(),
      },
    };
  }

  /**
   * Calculate average compression ratio
   */
  private calculateAverageCompressionRatio(): number {
    if (this.imageCache.size === 0) return 1;

    const ratios = Array.from(this.imageCache.values()).map(result => result.compressionRatio);
    return ratios.reduce((sum, ratio) => sum + ratio, 0) / ratios.length;
  }

  /**
   * Calculate load success rate
   */
  private calculateLoadSuccessRate(): number {
    if (this.metrics.totalImages === 0) return 100;
    return (this.metrics.loadedImages / this.metrics.totalImages) * 100;
  }

  /**
   * Calculate cache hit rate
   */
  private calculateCacheHitRate(): number {
    // This would require more sophisticated tracking in a real implementation
    return 85; // Mock value
  }

  /**
   * Clear optimization cache
   */
  clearCache(): void {
    this.imageCache.clear();
    console.log('🧹 Image optimization cache cleared');
  }

  /**
   * Get optimization statistics
   */
  getOptimizationStats(): any {
    return {
      totalOptimizedImages: this.imageCache.size,
      bandwidthSaved: this.metrics.bandwidthSaved,
      averageLoadTime: this.metrics.averageLoadTime,
      formatSupport: this.formatSupport,
      networkQuality: this.networkQuality,
      cacheSize: this.imageCache.size,
    };
  }
}

// Create singleton instance
export const advancedImageOptimizationService = new AdvancedImageOptimizationService();
export default advancedImageOptimizationService;
