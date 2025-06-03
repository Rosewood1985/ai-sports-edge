/**
 * Anomaly Detection Service
 * AI-powered service for detecting unusual patterns in system metrics and user behavior
 */

import { sentryService } from '../../services/sentryService';
import { Anomaly } from '../components/dashboard/advanced/AnomalyDetectionEngine';

export interface MetricData {
  timestamp: string;
  value: number;
  metric: string;
}

export interface AnomalyDetectionConfig {
  sensitivity: 'low' | 'medium' | 'high';
  lookbackWindow: number; // hours
  minimumConfidence: number; // 0-1
  enabledMetrics: string[];
}

export interface AnomalyPattern {
  type: 'spike' | 'drop' | 'outlier' | 'pattern_break';
  threshold: number;
  windowSize: number;
  description: string;
}

class AnomalyDetectionService {
  private static instance: AnomalyDetectionService;
  private config: AnomalyDetectionConfig;
  private patterns: AnomalyPattern[];

  constructor() {
    this.config = {
      sensitivity: 'medium',
      lookbackWindow: 24,
      minimumConfidence: 0.7,
      enabledMetrics: [
        'user_signups',
        'payment_success_rate',
        'api_response_time',
        'user_engagement',
        'bet_volume',
        'active_users',
        'revenue_per_hour',
      ],
    };

    this.patterns = [
      {
        type: 'spike',
        threshold: 2.5, // Standard deviations
        windowSize: 60, // minutes
        description: 'Sudden increase beyond normal range',
      },
      {
        type: 'drop',
        threshold: -2.0,
        windowSize: 30,
        description: 'Sudden decrease below normal range',
      },
      {
        type: 'outlier',
        threshold: 3.0,
        windowSize: 15,
        description: 'Individual data point significantly outside normal range',
      },
      {
        type: 'pattern_break',
        threshold: 1.5,
        windowSize: 120,
        description: 'Break in expected pattern or trend',
      },
    ];
  }

  static getInstance(): AnomalyDetectionService {
    if (!AnomalyDetectionService.instance) {
      AnomalyDetectionService.instance = new AnomalyDetectionService();
    }
    return AnomalyDetectionService.instance;
  }

  /**
   * Detect anomalies in real-time metric data
   */
  async detectAnomalies(timeRange?: { start: string; end: string }): Promise<Anomaly[]> {
    try {
      // In a real implementation, this would:
      // 1. Fetch recent metric data from monitoring systems
      // 2. Apply ML models for anomaly detection
      // 3. Calculate statistical deviations
      // 4. Generate contextual insights

      const mockAnomalies = await this.generateMockAnomalies();
      return mockAnomalies.filter(anomaly => anomaly.confidence >= this.config.minimumConfidence);
    } catch (error) {
      console.error('Error detecting anomalies:', error);
      sentryService.captureException(error, {
        context: 'anomaly-detection',
        extra: { timeRange, config: this.config },
      });
      throw new Error('Failed to detect anomalies');
    }
  }

  /**
   * Analyze specific metric for anomalies
   */
  async analyzeMetric(metric: string, data: MetricData[]): Promise<Anomaly[]> {
    const anomalies: Anomaly[] = [];

    for (const pattern of this.patterns) {
      const detected = await this.applyPattern(pattern, metric, data);
      anomalies.push(...detected);
    }

    return anomalies.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  /**
   * Apply anomaly detection pattern to metric data
   */
  private async applyPattern(
    pattern: AnomalyPattern,
    metric: string,
    data: MetricData[]
  ): Promise<Anomaly[]> {
    // Simplified pattern detection logic
    // In production, this would use advanced ML algorithms

    const anomalies: Anomaly[] = [];
    const values = data.map(d => d.value);
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const stdDev = Math.sqrt(values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length);

    for (let i = pattern.windowSize; i < data.length; i++) {
      const current = data[i];
      const windowData = data.slice(i - pattern.windowSize, i);
      const windowMean = windowData.reduce((a, b) => a + b.value, 0) / windowData.length;

      const deviation = (current.value - windowMean) / stdDev;

      if (Math.abs(deviation) >= Math.abs(pattern.threshold)) {
        const severity = this.calculateSeverity(deviation, pattern.threshold);
        const confidence = this.calculateConfidence(deviation, pattern.threshold);

        if (confidence >= this.config.minimumConfidence) {
          anomalies.push({
            id: `anom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            timestamp: current.timestamp,
            type: pattern.type,
            severity,
            metric,
            description: this.generateDescription(pattern.type, metric, deviation),
            confidence,
            suggestedActions: this.generateSuggestedActions(pattern.type, metric),
            rootCause: this.analyzeRootCause(pattern.type, metric, deviation),
            affectedUsers: this.estimateAffectedUsers(metric, deviation),
            impactScore: this.calculateImpactScore(severity, confidence, metric),
          });
        }
      }
    }

    return anomalies;
  }

  /**
   * Generate mock anomalies for demonstration
   */
  private async generateMockAnomalies(): Promise<Anomaly[]> {
    // This simulates real anomaly detection results
    const now = new Date();
    const anomalies: Anomaly[] = [];

    // Simulate recent anomalies with varying characteristics
    const mockData = [
      {
        metric: 'User Signup Rate',
        type: 'spike' as const,
        severity: 'high' as const,
        minutesAgo: 15,
        deviation: 3.2,
      },
      {
        metric: 'Payment Success Rate',
        type: 'drop' as const,
        severity: 'critical' as const,
        minutesAgo: 30,
        deviation: -2.8,
      },
      {
        metric: 'API Response Time',
        type: 'outlier' as const,
        severity: 'medium' as const,
        minutesAgo: 45,
        deviation: 2.1,
      },
    ];

    for (const mock of mockData) {
      const timestamp = new Date(now.getTime() - mock.minutesAgo * 60 * 1000).toISOString();
      const confidence = Math.max(0.6, Math.min(0.98, 0.7 + (Math.abs(mock.deviation) - 2) * 0.1));

      anomalies.push({
        id: `anom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp,
        type: mock.type,
        severity: mock.severity,
        metric: mock.metric,
        description: this.generateDescription(mock.type, mock.metric, mock.deviation),
        confidence,
        suggestedActions: this.generateSuggestedActions(mock.type, mock.metric),
        rootCause: this.analyzeRootCause(mock.type, mock.metric, mock.deviation),
        affectedUsers: this.estimateAffectedUsers(mock.metric, mock.deviation),
        impactScore: this.calculateImpactScore(mock.severity, confidence, mock.metric),
      });
    }

    return anomalies;
  }

  /**
   * Calculate anomaly severity based on deviation
   */
  private calculateSeverity(
    deviation: number,
    threshold: number
  ): 'low' | 'medium' | 'high' | 'critical' {
    const ratio = Math.abs(deviation) / Math.abs(threshold);

    if (ratio >= 3.0) return 'critical';
    if (ratio >= 2.0) return 'high';
    if (ratio >= 1.5) return 'medium';
    return 'low';
  }

  /**
   * Calculate confidence score for anomaly detection
   */
  private calculateConfidence(deviation: number, threshold: number): number {
    const ratio = Math.abs(deviation) / Math.abs(threshold);
    return Math.min(0.98, Math.max(0.5, 0.7 + (ratio - 1) * 0.15));
  }

  /**
   * Generate human-readable description for anomaly
   */
  private generateDescription(type: string, metric: string, deviation: number): string {
    const absDeviation = Math.abs(deviation);
    const percentage = Math.round((absDeviation - 1) * 100);

    switch (type) {
      case 'spike':
        return `Unusual ${percentage}% increase in ${metric.toLowerCase()} detected`;
      case 'drop':
        return `Significant ${percentage}% decrease in ${metric.toLowerCase()} observed`;
      case 'outlier':
        return `Sporadic anomalous values in ${metric.toLowerCase()}`;
      case 'pattern_break':
        return `Unexpected change in ${metric.toLowerCase()} pattern`;
      default:
        return `Anomaly detected in ${metric.toLowerCase()}`;
    }
  }

  /**
   * Generate context-aware suggested actions
   */
  private generateSuggestedActions(type: string, metric: string): string[] {
    const metricActions: Record<string, string[]> = {
      'User Signup Rate': [
        'Investigate referral traffic sources',
        'Check for viral social media mentions',
        'Monitor server capacity',
        'Review marketing campaign performance',
      ],
      'Payment Success Rate': [
        'Check payment processor status',
        'Review API error logs',
        'Contact payment provider support',
        'Monitor fraud detection systems',
      ],
      'API Response Time': [
        'Check database query performance',
        'Review caching efficiency',
        'Monitor third-party API status',
        'Analyze server resource usage',
      ],
      'User Engagement': [
        'Review content quality and relevance',
        'Check for technical issues',
        'Analyze competitor activity',
        'Review promotional campaigns',
      ],
    };

    return (
      metricActions[metric] || [
        'Monitor the situation closely',
        'Review related system metrics',
        'Check for external factors',
        'Consider escalating to relevant team',
      ]
    );
  }

  /**
   * Analyze potential root cause
   */
  private analyzeRootCause(type: string, metric: string, deviation: number): string {
    if (metric.includes('Payment') && type === 'drop') {
      return 'Potential payment gateway issues or fraud detection sensitivity changes';
    }
    if (metric.includes('Signup') && type === 'spike') {
      return 'Possible viral marketing campaign, influencer mention, or news coverage';
    }
    if (metric.includes('API') && type === 'outlier') {
      return 'Database performance issues or third-party service instability';
    }
    if (metric.includes('Engagement') && type === 'pattern_break') {
      return 'Changes in user behavior, content quality, or competitive landscape';
    }

    return 'Multiple factors may be contributing to this anomaly';
  }

  /**
   * Estimate number of affected users
   */
  private estimateAffectedUsers(metric: string, deviation: number): number {
    const baseUsers = 1000;
    const multiplier = Math.abs(deviation) * 0.3;

    if (metric.includes('Payment')) return Math.round(baseUsers * 0.1 * multiplier);
    if (metric.includes('Signup')) return Math.round(baseUsers * 1.5 * multiplier);
    if (metric.includes('API')) return Math.round(baseUsers * 0.4 * multiplier);
    if (metric.includes('Engagement')) return Math.round(baseUsers * 2.0 * multiplier);

    return Math.round(baseUsers * multiplier);
  }

  /**
   * Calculate overall impact score (1-10)
   */
  private calculateImpactScore(severity: string, confidence: number, metric: string): number {
    const baseScore = 5;

    // Severity multiplier
    const severityMultiplier =
      {
        low: 0.6,
        medium: 1.0,
        high: 1.4,
        critical: 1.8,
      }[severity] || 1.0;

    // Metric importance multiplier
    const metricMultiplier = metric.includes('Payment')
      ? 1.5
      : metric.includes('Signup')
        ? 1.2
        : metric.includes('API')
          ? 1.1
          : 1.0;

    const score = baseScore * severityMultiplier * metricMultiplier * confidence;
    return Math.min(10, Math.max(1, Math.round(score * 10) / 10));
  }

  /**
   * Update detection configuration
   */
  updateConfig(newConfig: Partial<AnomalyDetectionConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get current configuration
   */
  getConfig(): AnomalyDetectionConfig {
    return { ...this.config };
  }
}

export const anomalyDetectionService = AnomalyDetectionService.getInstance();
export default anomalyDetectionService;
