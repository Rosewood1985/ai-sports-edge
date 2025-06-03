import React, { useState, useEffect, useCallback } from 'react';

import { Badge } from '../../ui/Badge';
import { Button } from '../../ui/Button';
import { Card } from '../../ui/Card';

export interface Anomaly {
  id: string;
  timestamp: string;
  type: 'spike' | 'drop' | 'outlier' | 'pattern_break';
  severity: 'low' | 'medium' | 'high' | 'critical';
  metric: string;
  description: string;
  confidence: number;
  suggestedActions: string[];
  rootCause?: string;
  affectedUsers?: number;
  impactScore: number;
}

export interface AnomalyDetectionEngineProps {
  className?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

/**
 * Advanced Anomaly Detection Engine
 * Monitors system metrics and user behavior for unusual patterns
 */
export function AnomalyDetectionEngine({
  className = '',
  autoRefresh = true,
  refreshInterval = 30000,
}: AnomalyDetectionEngineProps) {
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');

  // Mock anomaly data for demonstration
  const mockAnomalies: Anomaly[] = [
    {
      id: 'anom-001',
      timestamp: '2025-05-27T19:45:00Z',
      type: 'spike',
      severity: 'high',
      metric: 'User Signup Rate',
      description: 'Unusual 300% increase in user signups detected',
      confidence: 0.92,
      suggestedActions: [
        'Investigate referral traffic sources',
        'Check for viral social media mentions',
        'Monitor server capacity',
      ],
      rootCause: 'Possible viral marketing campaign or influencer mention',
      affectedUsers: 1250,
      impactScore: 8.5,
    },
    {
      id: 'anom-002',
      timestamp: '2025-05-27T19:30:00Z',
      type: 'drop',
      severity: 'critical',
      metric: 'Payment Success Rate',
      description: 'Payment failures increased by 45% in last hour',
      confidence: 0.96,
      suggestedActions: [
        'Check payment processor status',
        'Review API error logs',
        'Contact payment provider support',
      ],
      rootCause: 'Potential payment gateway issues',
      affectedUsers: 89,
      impactScore: 9.2,
    },
    {
      id: 'anom-003',
      timestamp: '2025-05-27T19:15:00Z',
      type: 'outlier',
      severity: 'medium',
      metric: 'API Response Time',
      description: 'Sporadic response time spikes in betting odds API',
      confidence: 0.78,
      suggestedActions: [
        'Check database query performance',
        'Review caching efficiency',
        'Monitor third-party API status',
      ],
      affectedUsers: 340,
      impactScore: 6.1,
    },
    {
      id: 'anom-004',
      timestamp: '2025-05-27T18:45:00Z',
      type: 'pattern_break',
      severity: 'low',
      metric: 'User Engagement',
      description: 'Unusual decrease in weekend betting activity',
      confidence: 0.65,
      suggestedActions: [
        'Review weekend game schedule',
        'Check promotional campaigns',
        'Analyze competitor activity',
      ],
      affectedUsers: 2100,
      impactScore: 4.3,
    },
  ];

  const detectAnomalies = useCallback(async () => {
    setIsLoading(true);
    try {
      // Simulate API call for anomaly detection
      await new Promise(resolve => setTimeout(resolve, 1500));

      // In real implementation, this would call the ML-based anomaly detection service
      setAnomalies(mockAnomalies);
    } catch (error) {
      console.error('Error detecting anomalies:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    detectAnomalies();

    if (autoRefresh) {
      const interval = setInterval(detectAnomalies, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [detectAnomalies, autoRefresh, refreshInterval]);

  const filteredAnomalies = anomalies.filter(anomaly => {
    const severityMatch = selectedSeverity === 'all' || anomaly.severity === selectedSeverity;
    const typeMatch = selectedType === 'all' || anomaly.type === selectedType;
    return severityMatch && typeMatch;
  });

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'low':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'spike':
        return '📈';
      case 'drop':
        return '📉';
      case 'outlier':
        return '🎯';
      case 'pattern_break':
        return '🔀';
      default:
        return '⚠️';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            Anomaly Detection Engine
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            AI-powered monitoring for unusual patterns and behaviors
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" size="sm" onClick={detectAnomalies} isLoading={isLoading}>
            Refresh Scan
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-wrap gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Severity
            </label>
            <select
              value={selectedSeverity}
              onChange={e => setSelectedSeverity(e.target.value)}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-md bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-white"
            >
              <option value="all">All Severities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Type
            </label>
            <select
              value={selectedType}
              onChange={e => setSelectedType(e.target.value)}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-md bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-white"
            >
              <option value="all">All Types</option>
              <option value="spike">Spikes</option>
              <option value="drop">Drops</option>
              <option value="outlier">Outliers</option>
              <option value="pattern_break">Pattern Breaks</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Anomaly List */}
      {isLoading ? (
        <Card className="p-8 text-center">
          <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">Scanning for anomalies...</p>
        </Card>
      ) : filteredAnomalies.length === 0 ? (
        <Card className="p-8 text-center">
          <div className="text-4xl mb-2">🎉</div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No Anomalies Detected
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            All systems are operating within normal parameters
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredAnomalies.map(anomaly => (
            <Card key={anomaly.id} className="p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{getTypeIcon(anomaly.type)}</span>
                  <div>
                    <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                      {anomaly.metric}
                    </h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {formatTimestamp(anomaly.timestamp)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge className={getSeverityColor(anomaly.severity)}>
                    {anomaly.severity.toUpperCase()}
                  </Badge>
                  <Badge className="bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                    {Math.round(anomaly.confidence * 100)}% confidence
                  </Badge>
                </div>
              </div>

              <p className="text-gray-900 dark:text-white mb-4">{anomaly.description}</p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    Impact Score
                  </p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {anomaly.impactScore}/10
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    Affected Users
                  </p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {anomaly.affectedUsers?.toLocaleString() || 'Unknown'}
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    Type
                  </p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white capitalize">
                    {anomaly.type.replace('_', ' ')}
                  </p>
                </div>
              </div>

              {anomaly.rootCause && (
                <div className="mb-4">
                  <h5 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                    Possible Root Cause
                  </h5>
                  <p className="text-sm text-gray-700 dark:text-gray-300 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                    {anomaly.rootCause}
                  </p>
                </div>
              )}

              <div>
                <h5 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                  Suggested Actions
                </h5>
                <ul className="space-y-1">
                  {anomaly.suggestedActions.map((action, index) => (
                    <li
                      key={index}
                      className="flex items-start space-x-2 text-sm text-gray-700 dark:text-gray-300"
                    >
                      <span className="text-blue-500 mt-1">•</span>
                      <span>{action}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex justify-end space-x-2 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <Button variant="outline" size="sm">
                  View Details
                </Button>
                <Button variant="secondary" size="sm">
                  Create Alert
                </Button>
                <Button variant="primary" size="sm">
                  Investigate
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Summary Stats */}
      <Card className="p-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">
              {anomalies.filter(a => a.severity === 'critical').length}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Critical</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
              {anomalies.filter(a => a.severity === 'high').length}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">High</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
              {anomalies.filter(a => a.severity === 'medium').length}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Medium</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {anomalies.filter(a => a.severity === 'low').length}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Low</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
