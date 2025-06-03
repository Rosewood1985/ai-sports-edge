/**
 * Performance Monitoring Service
 * Phase 4.3: Performance Optimization
 * Real-time performance metrics collection and analysis
 */

export interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  tags: Record<string, string>;
  unit: string;
}

export interface PerformanceAlert {
  id: string;
  level: 'warning' | 'error' | 'critical';
  metric: string;
  threshold: number;
  currentValue: number;
  message: string;
  timestamp: number;
  resolved: boolean;
}

export interface SystemHealth {
  overall: 'healthy' | 'degraded' | 'critical';
  components: {
    inference: ComponentHealth;
    cache: ComponentHealth;
    api: ComponentHealth;
    database: ComponentHealth;
  };
  alerts: PerformanceAlert[];
  lastUpdated: number;
}

export interface ComponentHealth {
  status: 'healthy' | 'degraded' | 'critical';
  responseTime: number;
  errorRate: number;
  throughput: number;
  lastCheck: number;
}

export interface PerformanceThresholds {
  inferenceLatency: { warning: number; error: number; critical: number };
  cacheHitRate: { warning: number; error: number; critical: number };
  apiResponseTime: { warning: number; error: number; critical: number };
  errorRate: { warning: number; error: number; critical: number };
  memoryUsage: { warning: number; error: number; critical: number };
  cpuUsage: { warning: number; error: number; critical: number };
}

export class PerformanceMonitoringService {
  private static instance: PerformanceMonitoringService;
  private metrics = new Map<string, PerformanceMetric[]>();
  private alerts = new Map<string, PerformanceAlert>();
  private healthChecks = new Map<string, () => Promise<ComponentHealth>>();
  private isMonitoring = false;
  private monitoringInterval?: NodeJS.Timeout;

  private readonly thresholds: PerformanceThresholds = {
    inferenceLatency: { warning: 200, error: 500, critical: 1000 },
    cacheHitRate: { warning: 0.7, error: 0.5, critical: 0.3 },
    apiResponseTime: { warning: 300, error: 1000, critical: 3000 },
    errorRate: { warning: 0.01, error: 0.05, critical: 0.1 },
    memoryUsage: { warning: 0.7, error: 0.85, critical: 0.95 },
    cpuUsage: { warning: 0.7, error: 0.85, critical: 0.95 },
  };

  private readonly MAX_METRICS_PER_TYPE = 1000;
  private readonly MONITORING_INTERVAL = 5000; // 5 seconds
  private readonly ALERT_COOLDOWN = 60000; // 1 minute

  private constructor() {
    this.setupHealthChecks();
  }

  public static getInstance(): PerformanceMonitoringService {
    if (!PerformanceMonitoringService.instance) {
      PerformanceMonitoringService.instance = new PerformanceMonitoringService();
    }
    return PerformanceMonitoringService.instance;
  }

  /**
   * Record a performance metric
   */
  recordMetric(metric: PerformanceMetric): void {
    const key = `${metric.name}_${JSON.stringify(metric.tags)}`;

    if (!this.metrics.has(key)) {
      this.metrics.set(key, []);
    }

    const metricArray = this.metrics.get(key)!;
    metricArray.push(metric);

    // Keep only recent metrics
    if (metricArray.length > this.MAX_METRICS_PER_TYPE) {
      metricArray.splice(0, metricArray.length - this.MAX_METRICS_PER_TYPE);
    }

    // Check for threshold violations
    this.checkThresholds(metric);
  }

  /**
   * Record timing for a named operation
   */
  recordTiming(name: string, startTime: number, tags: Record<string, string> = {}): void {
    const duration = performance.now() - startTime;
    this.recordMetric({
      name: `${name}_duration`,
      value: duration,
      timestamp: Date.now(),
      tags,
      unit: 'ms',
    });
  }

  /**
   * Record counter increment
   */
  recordCounter(name: string, value: number = 1, tags: Record<string, string> = {}): void {
    this.recordMetric({
      name,
      value,
      timestamp: Date.now(),
      tags,
      unit: 'count',
    });
  }

  /**
   * Record gauge value
   */
  recordGauge(name: string, value: number, tags: Record<string, string> = {}): void {
    this.recordMetric({
      name,
      value,
      timestamp: Date.now(),
      tags,
      unit: 'value',
    });
  }

  /**
   * Start performance monitoring
   */
  startMonitoring(): void {
    if (this.isMonitoring) return;

    this.isMonitoring = true;
    this.monitoringInterval = setInterval(() => {
      this.collectSystemMetrics();
      this.runHealthChecks();
    }, this.MONITORING_INTERVAL);

    console.log('Performance monitoring started');
  }

  /**
   * Stop performance monitoring
   */
  stopMonitoring(): void {
    if (!this.isMonitoring) return;

    this.isMonitoring = false;
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
    }

    console.log('Performance monitoring stopped');
  }

  /**
   * Get metrics for a specific name and time range
   */
  getMetrics(
    name: string,
    startTime?: number,
    endTime?: number,
    tags?: Record<string, string>
  ): PerformanceMetric[] {
    const allMetrics: PerformanceMetric[] = [];

    for (const [key, metrics] of this.metrics.entries()) {
      if (key.startsWith(name)) {
        // Apply time filter
        let filteredMetrics = metrics;
        if (startTime || endTime) {
          filteredMetrics = metrics.filter(m => {
            if (startTime && m.timestamp < startTime) return false;
            if (endTime && m.timestamp > endTime) return false;
            return true;
          });
        }

        // Apply tag filter
        if (tags) {
          filteredMetrics = filteredMetrics.filter(m => {
            return Object.entries(tags).every(([key, value]) => m.tags[key] === value);
          });
        }

        allMetrics.push(...filteredMetrics);
      }
    }

    return allMetrics.sort((a, b) => a.timestamp - b.timestamp);
  }

  /**
   * Get aggregated statistics for a metric
   */
  getMetricStats(
    name: string,
    timeWindow: number = 300000
  ): {
    count: number;
    min: number;
    max: number;
    avg: number;
    p50: number;
    p95: number;
    p99: number;
  } {
    const cutoff = Date.now() - timeWindow;
    const metrics = this.getMetrics(name, cutoff);

    if (metrics.length === 0) {
      return { count: 0, min: 0, max: 0, avg: 0, p50: 0, p95: 0, p99: 0 };
    }

    const values = metrics.map(m => m.value).sort((a, b) => a - b);
    const count = values.length;
    const min = values[0];
    const max = values[count - 1];
    const avg = values.reduce((sum, val) => sum + val, 0) / count;

    const p50 = values[Math.floor(count * 0.5)];
    const p95 = values[Math.floor(count * 0.95)];
    const p99 = values[Math.floor(count * 0.99)];

    return { count, min, max, avg, p50, p95, p99 };
  }

  /**
   * Get current system health
   */
  async getSystemHealth(): Promise<SystemHealth> {
    const components = {
      inference: await this.checkInferenceHealth(),
      cache: await this.checkCacheHealth(),
      api: await this.checkApiHealth(),
      database: await this.checkDatabaseHealth(),
    };

    // Determine overall health
    const componentStatuses = Object.values(components).map(c => c.status);
    let overall: SystemHealth['overall'] = 'healthy';

    if (componentStatuses.includes('critical')) {
      overall = 'critical';
    } else if (componentStatuses.includes('degraded')) {
      overall = 'degraded';
    }

    return {
      overall,
      components,
      alerts: Array.from(this.alerts.values()).filter(a => !a.resolved),
      lastUpdated: Date.now(),
    };
  }

  /**
   * Get performance dashboard data
   */
  getDashboardData(timeWindow: number = 3600000): {
    metrics: Record<string, any>;
    alerts: PerformanceAlert[];
    health: SystemHealth;
  } {
    const cutoff = Date.now() - timeWindow;

    return {
      metrics: {
        inference: this.getMetricStats('inference_duration', timeWindow),
        cache: this.getMetricStats('cache_hit_rate', timeWindow),
        api: this.getMetricStats('api_response_time', timeWindow),
        errors: this.getMetricStats('error_count', timeWindow),
        memory: this.getMetricStats('memory_usage', timeWindow),
      },
      alerts: Array.from(this.alerts.values())
        .filter(a => a.timestamp > cutoff)
        .sort((a, b) => b.timestamp - a.timestamp),
      health: {} as SystemHealth, // Will be populated by async call
    };
  }

  /**
   * Create custom alert
   */
  createAlert(
    metric: string,
    level: PerformanceAlert['level'],
    threshold: number,
    currentValue: number,
    message: string
  ): void {
    const alertId = `${metric}_${level}_${Date.now()}`;

    // Check cooldown
    const existingAlert = Array.from(this.alerts.values()).find(
      a => a.metric === metric && a.level === level && !a.resolved
    );

    if (existingAlert && Date.now() - existingAlert.timestamp < this.ALERT_COOLDOWN) {
      return;
    }

    const alert: PerformanceAlert = {
      id: alertId,
      level,
      metric,
      threshold,
      currentValue,
      message,
      timestamp: Date.now(),
      resolved: false,
    };

    this.alerts.set(alertId, alert);

    // Log alert
    console.warn(`Performance Alert [${level.toUpperCase()}]: ${message}`, {
      metric,
      threshold,
      currentValue,
    });

    // In a real implementation, this would trigger external alerting
    this.sendAlert(alert);
  }

  /**
   * Resolve an alert
   */
  resolveAlert(alertId: string): void {
    const alert = this.alerts.get(alertId);
    if (alert) {
      alert.resolved = true;
      console.log(`Performance Alert resolved: ${alert.message}`);
    }
  }

  // Private methods

  private setupHealthChecks(): void {
    this.healthChecks.set('inference', this.checkInferenceHealth.bind(this));
    this.healthChecks.set('cache', this.checkCacheHealth.bind(this));
    this.healthChecks.set('api', this.checkApiHealth.bind(this));
    this.healthChecks.set('database', this.checkDatabaseHealth.bind(this));
  }

  private async checkInferenceHealth(): Promise<ComponentHealth> {
    const stats = this.getMetricStats('inference_duration');
    const errorStats = this.getMetricStats('inference_errors');

    let status: ComponentHealth['status'] = 'healthy';
    if (stats.avg > this.thresholds.inferenceLatency.critical) {
      status = 'critical';
    } else if (stats.avg > this.thresholds.inferenceLatency.warning) {
      status = 'degraded';
    }

    return {
      status,
      responseTime: stats.avg,
      errorRate: errorStats.count / Math.max(stats.count, 1),
      throughput: stats.count / 300, // per second over 5 min window
      lastCheck: Date.now(),
    };
  }

  private async checkCacheHealth(): Promise<ComponentHealth> {
    const hitRateStats = this.getMetricStats('cache_hit_rate');

    let status: ComponentHealth['status'] = 'healthy';
    if (hitRateStats.avg < this.thresholds.cacheHitRate.critical) {
      status = 'critical';
    } else if (hitRateStats.avg < this.thresholds.cacheHitRate.warning) {
      status = 'degraded';
    }

    return {
      status,
      responseTime: 0, // Cache access is instant
      errorRate: 0,
      throughput: hitRateStats.count / 300,
      lastCheck: Date.now(),
    };
  }

  private async checkApiHealth(): Promise<ComponentHealth> {
    const responseStats = this.getMetricStats('api_response_time');
    const errorStats = this.getMetricStats('api_errors');

    let status: ComponentHealth['status'] = 'healthy';
    if (responseStats.avg > this.thresholds.apiResponseTime.critical) {
      status = 'critical';
    } else if (responseStats.avg > this.thresholds.apiResponseTime.warning) {
      status = 'degraded';
    }

    return {
      status,
      responseTime: responseStats.avg,
      errorRate: errorStats.count / Math.max(responseStats.count, 1),
      throughput: responseStats.count / 300,
      lastCheck: Date.now(),
    };
  }

  private async checkDatabaseHealth(): Promise<ComponentHealth> {
    const queryStats = this.getMetricStats('database_query_time');
    const errorStats = this.getMetricStats('database_errors');

    let status: ComponentHealth['status'] = 'healthy';
    if (queryStats.avg > 1000) {
      // 1 second threshold
      status = 'critical';
    } else if (queryStats.avg > 500) {
      status = 'degraded';
    }

    return {
      status,
      responseTime: queryStats.avg,
      errorRate: errorStats.count / Math.max(queryStats.count, 1),
      throughput: queryStats.count / 300,
      lastCheck: Date.now(),
    };
  }

  private checkThresholds(metric: PerformanceMetric): void {
    const thresholdConfig = this.getThresholdConfig(metric.name);
    if (!thresholdConfig) return;

    for (const [level, threshold] of Object.entries(thresholdConfig)) {
      if (this.violatesThreshold(metric.value, threshold, metric.name)) {
        this.createAlert(
          metric.name,
          level as PerformanceAlert['level'],
          threshold,
          metric.value,
          `${metric.name} ${level} threshold exceeded: ${metric.value}${metric.unit} > ${threshold}`
        );
        break; // Only create one alert per metric
      }
    }
  }

  private getThresholdConfig(metricName: string): Record<string, number> | null {
    if (metricName.includes('latency') || metricName.includes('duration')) {
      return this.thresholds.inferenceLatency;
    }
    if (metricName.includes('hit_rate')) {
      return this.thresholds.cacheHitRate;
    }
    if (metricName.includes('response_time')) {
      return this.thresholds.apiResponseTime;
    }
    if (metricName.includes('error')) {
      return this.thresholds.errorRate;
    }
    if (metricName.includes('memory')) {
      return this.thresholds.memoryUsage;
    }
    if (metricName.includes('cpu')) {
      return this.thresholds.cpuUsage;
    }
    return null;
  }

  private violatesThreshold(value: number, threshold: number, metricName: string): boolean {
    // For hit rates, lower is worse
    if (metricName.includes('hit_rate')) {
      return value < threshold;
    }
    // For everything else, higher is worse
    return value > threshold;
  }

  private collectSystemMetrics(): void {
    // Collect memory usage
    if (typeof performance.memory !== 'undefined') {
      this.recordGauge(
        'memory_usage',
        performance.memory.usedJSHeapSize / performance.memory.totalJSHeapSize
      );
      this.recordGauge('memory_total', performance.memory.totalJSHeapSize);
    }

    // Collect timing information
    if (typeof performance.now === 'function') {
      this.recordGauge('system_uptime', performance.now());
    }
  }

  private async runHealthChecks(): Promise<void> {
    for (const [name, healthCheck] of this.healthChecks) {
      try {
        const health = await healthCheck();
        this.recordGauge(`${name}_health_score`, this.healthToScore(health.status));
        this.recordGauge(`${name}_response_time`, health.responseTime);
        this.recordGauge(`${name}_error_rate`, health.errorRate);
      } catch (error) {
        console.error(`Health check failed for ${name}:`, error);
        this.recordGauge(`${name}_health_score`, 0);
      }
    }
  }

  private healthToScore(status: ComponentHealth['status']): number {
    switch (status) {
      case 'healthy':
        return 1;
      case 'degraded':
        return 0.5;
      case 'critical':
        return 0;
    }
  }

  private sendAlert(alert: PerformanceAlert): void {
    // In a real implementation, this would send to external systems
    // For now, just console.warn was called in createAlert

    // Could integrate with:
    // - PagerDuty
    // - Slack webhooks
    // - Email notifications
    // - Push notifications

    if (alert.level === 'critical') {
      // Simulate urgent notification
      console.error('CRITICAL ALERT:', alert.message);
    }
  }
}

export default PerformanceMonitoringService;
