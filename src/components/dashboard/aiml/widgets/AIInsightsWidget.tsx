/**
 * AI Insights Widget
 * Phase 4.1: Foundation Widget
 * Displays AI-generated insights and automated recommendations
 */

import React from 'react';
import { AIInsight } from '../../../../types/aiml';
import { useInsights } from '../../../../hooks/useAIML';

interface AIInsightsWidgetProps {
  insights: AIInsight[];
  className?: string;
}

export function AIInsightsWidget({ insights, className = '' }: AIInsightsWidgetProps) {
  const { markAsRead } = useInsights();

  const getInsightIcon = (type: AIInsight['type']) => {
    switch (type) {
      case 'trend':
        return '📈';
      case 'anomaly':
        return '🚨';
      case 'correlation':
        return '🔗';
      case 'recommendation':
        return '💡';
      default:
        return '🔍';
    }
  };

  const getSeverityColor = (severity: AIInsight['severity']) => {
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

  const handleMarkAsRead = async (insightId: string) => {
    // In a real app, you'd get the current user ID from context/auth
    const userId = 'current-user-id';
    await markAsRead(insightId, userId);
  };

  const unreadInsights = insights.filter(insight => !(insight.readBy?.length));
  const actionableInsights = insights.filter(insight => insight.actionable);

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow ${className}`}>
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              AI Insights
            </h3>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              AI-generated insights and pattern analysis
            </p>
          </div>
          <div className="flex items-center space-x-2">
            {unreadInsights.length > 0 && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                {unreadInsights.length} new
              </span>
            )}
            <div className="text-2xl">💡</div>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {insights.length}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Total</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {unreadInsights.length}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">New</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {actionableInsights.length}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Actionable</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
              {insights.filter(i => i.severity === 'high' || i.severity === 'critical').length}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Priority</div>
          </div>
        </div>

        {/* Recent Insights */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-4">
            Recent Insights
          </h4>

          {insights.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-6xl mb-4">🔍</div>
              <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No Insights Yet
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                AI insights will appear here as patterns are detected
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {insights.slice(0, 5).map((insight) => {
                const isUnread = !(insight.readBy?.length);
                return (
                  <div
                    key={insight.id}
                    className={`p-4 border rounded-lg transition-colors ${
                      isUnread
                        ? 'border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        <div className="text-xl">{getInsightIcon(insight.type)}</div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <h5 className="text-sm font-medium text-gray-900 dark:text-white">
                              {insight.title}
                            </h5>
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSeverityColor(
                                insight.severity
                              )}`}
                            >
                              {insight.severity}
                            </span>
                            {insight.actionable && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                actionable
                              </span>
                            )}
                          </div>
                          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                            {insight.description}
                          </p>
                          <div className="mt-2 flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <div className="text-xs text-gray-500 dark:text-gray-500">
                                Confidence: {(insight.confidence * 100).toFixed(0)}%
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-500">
                                {formatTimestamp(insight.createdAt)}
                              </div>
                            </div>
                            {isUnread && (
                              <button
                                onClick={() => handleMarkAsRead(insight.id)}
                                className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300"
                              >
                                Mark as read
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Suggested Actions */}
                    {insight.suggestedActions && insight.suggestedActions.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                        <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                          Suggested Actions:
                        </div>
                        <div className="space-y-1">
                          {insight.suggestedActions.slice(0, 3).map((action, index) => (
                            <div
                              key={index}
                              className="flex items-center text-xs text-gray-700 dark:text-gray-300"
                            >
                              <span className="w-1 h-1 bg-gray-400 rounded-full mr-2"></span>
                              {action}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {insights.length > 5 && (
                <div className="mt-4 text-center">
                  <button className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300">
                    View all {insights.length} insights
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

export default AIInsightsWidget;