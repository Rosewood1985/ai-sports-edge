/**
 * ML Model Overview Widget
 * Phase 4.1: Foundation Widget
 * Displays overview of ML models with performance metrics
 */

import React from 'react';

import { MLModel } from '../../../../types/aiml';

interface MLModelOverviewWidgetProps {
  models: MLModel[];
  className?: string;
}

export function MLModelOverviewWidget({ models, className = '' }: MLModelOverviewWidgetProps) {
  const modelsByStatus = {
    deployed: models.filter(m => m.status === 'deployed'),
    training: models.filter(m => m.status === 'training'),
    deprecated: models.filter(m => m.status === 'deprecated'),
    failed: models.filter(m => m.status === 'failed'),
  };

  const getStatusColor = (status: MLModel['status']) => {
    switch (status) {
      case 'deployed':
        return 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900';
      case 'training':
        return 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900';
      case 'deprecated':
        return 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-900';
      case 'failed':
        return 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900';
      default:
        return 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-900';
    }
  };

  const getTypeIcon = (type: MLModel['type']) => {
    switch (type) {
      case 'timeSeries':
        return '📈';
      case 'classification':
        return '🏷️';
      case 'regression':
        return '📊';
      case 'anomalyDetection':
        return '🚨';
      default:
        return '🤖';
    }
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow ${className}`}>
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              ML Models Overview
            </h3>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              {models.length} models across different types and stages
            </p>
          </div>
          <div className="text-2xl">🧠</div>
        </div>
      </div>

      <div className="p-6">
        {/* Status Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {modelsByStatus.deployed.length}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Deployed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {modelsByStatus.training.length}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Training</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-600 dark:text-gray-400">
              {modelsByStatus.deprecated.length}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Deprecated</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
              {modelsByStatus.failed.length}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Failed</div>
          </div>
        </div>

        {/* Recent Models */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-4">Recent Models</h4>
          <div className="space-y-3">
            {models.slice(0, 5).map(model => (
              <div
                key={model.id}
                className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className="text-lg">{getTypeIcon(model.type)}</div>
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {model.name}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      v{model.version} • {model.type}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {(model.accuracy * 100).toFixed(1)}%
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">accuracy</div>
                  </div>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                      model.status
                    )}`}
                  >
                    {model.status}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {models.length > 5 && (
            <div className="mt-4 text-center">
              <button className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300">
                View all {models.length} models
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default MLModelOverviewWidget;
