/**
 * Anomaly Detection Widget
 * Phase 4.1: Foundation Widget
 * Displays detected anomalies and system health monitoring
 */

import React from 'react';
import { Anomaly } from '../../../../types/aiml';
import { useAnomalies } from '../../../../hooks/useAIML';

interface AnomalyDetectionWidgetProps {
  anomalies: Anomaly[];
  className?: string;
}

export function AnomalyDetectionWidget({ anomalies, className = '' }: AnomalyDetectionWidgetProps) {
  const { resolveAnomaly } = useAnomalies();

  const getSeverityColor = (severity: Anomaly['severity']) => {
    switch (severity) {
      case 'critical':
        return 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900';
      case 'high':
        return 'text-orange-600 bg-orange-100 dark:text-orange-400 dark:bg-orange-900';
      case 'medium':
        return 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900';
      case 'low':
        return 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900';
      default:
        return 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-900';
    }
  };

  const getSeverityIcon = (severity: Anomaly['severity']) => {
    switch (severity) {
      case 'critical':
        return '🚨';
      case 'high':
        return '⚠️';
      case 'medium':
        return '🟡';
      case 'low':
        return '🔵';
      default:
        return '⚪';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)}h ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const handleResolveAnomaly = async (anomalyId: string) => {
    const rootCause = prompt('Enter root cause (optional):');
    await resolveAnomaly(anomalyId, rootCause || undefined);
  };

  const activeAnomalies = anomalies.filter(a => !a.resolved);
  const criticalAnomalies = activeAnomalies.filter(a => a.severity === 'critical');

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow ${className}`}>
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Anomaly Detection
            </h3>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Real-time system anomaly monitoring
            </p>
          </div>
          <div className="flex items-center space-x-2">
            {criticalAnomalies.length > 0 && (
              <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></div>
            )}
            <div className="text-2xl">🚨</div>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
              {activeAnomalies.filter(a => a.severity === 'critical').length}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Critical</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
              {activeAnomalies.filter(a => a.severity === 'high').length}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">High</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
              {activeAnomalies.filter(a => a.severity === 'medium').length}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Medium</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {activeAnomalies.filter(a => a.severity === 'low').length}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Low</div>
          </div>
        </div>

        {/* Recent Anomalies */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-4">
            Recent Anomalies
          </h4>

          {activeAnomalies.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-6xl mb-4">✅</div>
              <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                All Clear
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                No active anomalies detected
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {activeAnomalies.slice(0, 5).map((anomaly) => (
                <div
                  key={anomaly.id}
                  className={`p-4 border rounded-lg ${
                    anomaly.severity === 'critical'
                      ? 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20'
                      : anomaly.severity === 'high'
                      ? 'border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/20'
                      : 'border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <div className="text-xl">{getSeverityIcon(anomaly.severity)}</div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h5 className="text-sm font-medium text-gray-900 dark:text-white">
                            {anomaly.metric.replace('_', ' ').toUpperCase()}
                          </h5>
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSeverityColor(
                              anomaly.severity
                            )}`}
                          >
                            {anomaly.severity}
                          </span>
                        </div>
                        <div className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                          Value: {anomaly.value.toFixed(2)} (Expected: {anomaly.expectedValue.toFixed(2)})
                        </div>
                        <div className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                          Deviation: {anomaly.deviation.toFixed(2)}x above normal
                        </div>
                        <div className="mt-1 text-xs text-gray-500 dark:text-gray-500">
                          {formatTimestamp(anomaly.timestamp)}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleResolveAnomaly(anomaly.id)}
                      className="px-3 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700"
                    >
                      Resolve
                    </button>
                  </div>

                  {/* Context Information */}
                  {Object.keys(anomaly.context).length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        Context:
                      </div>
                      <div className="mt-1 flex flex-wrap gap-2">
                        {Object.entries(anomaly.context).map(([key, value]) => (
                          <span
                            key={key}
                            className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                          >
                            {key}: {String(value)}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {activeAnomalies.length > 5 && (
                <div className="mt-4 text-center">
                  <button className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300">
                    View all {activeAnomalies.length} anomalies
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AnomalyDetectionWidget;