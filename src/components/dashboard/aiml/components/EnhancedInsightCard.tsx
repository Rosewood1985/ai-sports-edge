/**
 * Enhanced Insight Card Component
 * Phase 4.2: Advanced AI/ML Features
 * Display individual insights with NLP analysis and smart recommendations
 */

import React, { useState } from 'react';

import { EnhancedInsight } from '../../../../types/enhancedInsights';

interface EnhancedInsightCardProps {
  insight: EnhancedInsight;
  onStatusUpdate: (
    insightId: string,
    status: EnhancedInsight['status'],
    assignedTo?: string,
    notes?: string
  ) => Promise<boolean>;
  expanded?: boolean;
}

export function EnhancedInsightCard({
  insight,
  onStatusUpdate,
  expanded = false,
}: EnhancedInsightCardProps) {
  const [isExpanded, setIsExpanded] = useState(expanded);
  const [showActions, setShowActions] = useState(false);

  const getTypeIcon = (type: EnhancedInsight['type']) => {
    switch (type) {
      case 'opportunity':
        return '🎯';
      case 'risk':
        return '⚠️';
      case 'trend':
        return '📈';
      case 'anomaly':
        return '🚨';
      case 'correlation':
        return '🔗';
      case 'prediction':
        return '🔮';
      default:
        return '💡';
    }
  };

  const getCategoryIcon = (category: EnhancedInsight['category']) => {
    switch (category) {
      case 'user_behavior':
        return '👥';
      case 'financial':
        return '💰';
      case 'operational':
        return '⚙️';
      case 'marketing':
        return '📢';
      case 'product':
        return '📱';
      case 'security':
        return '🔒';
      default:
        return '📊';
    }
  };

  const getSeverityColor = (severity: EnhancedInsight['severity']) => {
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

  const getStatusColor = (status: EnhancedInsight['status']) => {
    switch (status) {
      case 'new':
        return 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900';
      case 'acknowledged':
        return 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900';
      case 'investigating':
        return 'text-purple-600 bg-purple-100 dark:text-purple-400 dark:bg-purple-900';
      case 'resolved':
        return 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900';
      case 'dismissed':
        return 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-900';
      default:
        return 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-900';
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return 'text-green-600';
      case 'negative':
        return 'text-red-600';
      case 'neutral':
        return 'text-gray-600';
      default:
        return 'text-gray-600';
    }
  };

  const handleStatusChange = async (newStatus: EnhancedInsight['status']) => {
    await onStatusUpdate(insight.id, newStatus);
    setShowActions(false);
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return (
      date.toLocaleDateString() +
      ' ' +
      date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    );
  };

  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-lg shadow border-l-4 ${
        insight.severity === 'critical'
          ? 'border-red-500'
          : insight.severity === 'high'
            ? 'border-orange-500'
            : insight.severity === 'medium'
              ? 'border-yellow-500'
              : 'border-blue-500'
      }`}
    >
      {/* Header */}
      <div className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            <div className="text-2xl">{getTypeIcon(insight.type)}</div>
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  {insight.title}
                </h3>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSeverityColor(insight.severity)}`}
                >
                  {insight.severity}
                </span>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(insight.status)}`}
                >
                  {insight.status}
                </span>
              </div>

              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{insight.description}</p>

              {/* Key Metrics */}
              <div className="flex items-center space-x-6 text-sm">
                <div className="flex items-center space-x-1">
                  <span className="text-gray-500 dark:text-gray-400">Confidence:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {(insight.confidence * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="flex items-center space-x-1">
                  <span className="text-gray-500 dark:text-gray-400">Impact:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {insight.impact.businessValue}
                  </span>
                </div>
                <div className="flex items-center space-x-1">
                  <span className="text-gray-500 dark:text-gray-400">Category:</span>
                  <span className="flex items-center font-medium text-gray-900 dark:text-white">
                    {getCategoryIcon(insight.category)}
                    <span className="ml-1">{insight.category.replace('_', ' ')}</span>
                  </span>
                </div>
                <div className="flex items-center space-x-1">
                  <span className="text-gray-500 dark:text-gray-400">Created:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {formatTimestamp(insight.createdAt)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              <span className={`transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                ▼
              </span>
            </button>
            <button
              onClick={() => setShowActions(!showActions)}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              ⋮
            </button>
          </div>
        </div>

        {/* Actions Menu */}
        {showActions && (
          <div className="absolute right-6 mt-2 w-48 bg-white dark:bg-gray-700 rounded-md shadow-lg border dark:border-gray-600 z-10">
            <div className="py-1">
              <button
                onClick={() => handleStatusChange('acknowledged')}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600"
              >
                Mark as Acknowledged
              </button>
              <button
                onClick={() => handleStatusChange('investigating')}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600"
              >
                Start Investigation
              </button>
              <button
                onClick={() => handleStatusChange('resolved')}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600"
              >
                Mark as Resolved
              </button>
              <button
                onClick={() => handleStatusChange('dismissed')}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* NLP Summary */}
        {insight.nlpSummary && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Sentiment</div>
                <div
                  className={`text-sm font-medium ${getSentimentColor(insight.nlpSummary.sentiment)}`}
                >
                  {insight.nlpSummary.sentiment} ({insight.nlpSummary.readabilityScore}/100)
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Key Phrases</div>
                <div className="flex flex-wrap gap-1">
                  {insight.nlpSummary.keyPhrases.slice(0, 3).map((phrase, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300"
                    >
                      {phrase}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Topics</div>
                <div className="flex flex-wrap gap-1">
                  {insight.nlpSummary.topics.slice(0, 2).map((topic, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300"
                    >
                      {topic.name}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t border-gray-200 dark:border-gray-700">
          {/* Impact Analysis */}
          <div className="p-6">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-4">
              Impact Analysis
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <div className="text-xs text-gray-500 dark:text-gray-400">Scope</div>
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  {insight.impact.scope}
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <div className="text-xs text-gray-500 dark:text-gray-400">Timeframe</div>
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  {insight.impact.timeframe.replace('_', ' ')}
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <div className="text-xs text-gray-500 dark:text-gray-400">Affected Users</div>
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  {typeof insight.impact.affectedUsers === 'number'
                    ? insight.impact.affectedUsers.toLocaleString()
                    : 'Unknown'}
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <div className="text-xs text-gray-500 dark:text-gray-400">Revenue Impact</div>
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  ${insight.impact.estimatedRevenue.impact.toLocaleString()}
                </div>
              </div>
            </div>
          </div>

          {/* Recommendations */}
          {insight.recommendations && insight.recommendations.length > 0 && (
            <div className="px-6 pb-6">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-4">
                Smart Recommendations
              </h4>
              <div className="space-y-3">
                {insight.recommendations.map((rec, index) => (
                  <div key={rec.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h5 className="text-sm font-medium text-gray-900 dark:text-white">
                            {rec.title}
                          </h5>
                          <span
                            className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                              rec.priority === 'urgent'
                                ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                : rec.priority === 'high'
                                  ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
                                  : rec.priority === 'medium'
                                    ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                                    : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                            }`}
                          >
                            {rec.priority}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                          {rec.description}
                        </p>
                        <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                          <span>Effort: {rec.effort}</span>
                          <span>Timeline: {rec.timeline}</span>
                          <span>Expected: {rec.expectedOutcome.description}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Evidence */}
          {insight.evidence && insight.evidence.length > 0 && (
            <div className="px-6 pb-6">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-4">
                Supporting Evidence
              </h4>
              <div className="space-y-2">
                {insight.evidence.map((evidence, index) => (
                  <div
                    key={evidence.id}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded"
                  >
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {evidence.type} - {evidence.source}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        Weight: {(evidence.weight * 100).toFixed(0)}%
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {formatTimestamp(evidence.timestamp)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tags */}
          {insight.tags && insight.tags.length > 0 && (
            <div className="px-6 pb-6">
              <div className="flex flex-wrap gap-2">
                {insight.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default EnhancedInsightCard;
