/**
 * Recommendations Widget
 * Phase 4.1: Foundation Widget
 * Displays AI-generated recommendations and actions
 */

import React from 'react';

import { useRecommendations } from '../../../../hooks/useAIML';
import { AIRecommendation } from '../../../../types/aiml';

interface RecommendationsWidgetProps {
  recommendations: AIRecommendation[];
  className?: string;
}

export function RecommendationsWidget({
  recommendations,
  className = '',
}: RecommendationsWidgetProps) {
  const { provideFeedback } = useRecommendations();

  const getPriorityColor = (priority: AIRecommendation['priority']) => {
    switch (priority) {
      case 'urgent':
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

  const getTypeIcon = (type: AIRecommendation['type']) => {
    switch (type) {
      case 'optimization':
        return '⚡';
      case 'alert':
        return '🚨';
      case 'action':
        return '🎯';
      case 'insight':
        return '💡';
      default:
        return '📋';
    }
  };

  const handleFeedback = async (
    recommendationId: string,
    feedback: 'helpful' | 'notHelpful' | 'irrelevant'
  ) => {
    await provideFeedback(recommendationId, feedback);
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow ${className}`}>
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              AI Recommendations
            </h3>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Intelligent recommendations for optimization
            </p>
          </div>
          <div className="text-2xl">🎯</div>
        </div>
      </div>

      <div className="p-6">
        {/* Priority Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
              {recommendations.filter(r => r.priority === 'urgent').length}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Urgent</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
              {recommendations.filter(r => r.priority === 'high').length}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">High</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
              {recommendations.filter(r => r.priority === 'medium').length}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Medium</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {recommendations.filter(r => r.priority === 'low').length}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Low</div>
          </div>
        </div>

        {/* Recommendations List */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-4">
            Top Recommendations
          </h4>

          {recommendations.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-6xl mb-4">🎯</div>
              <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No Recommendations
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                AI recommendations will appear here based on system analysis
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {recommendations.slice(0, 3).map(recommendation => (
                <div
                  key={recommendation.id}
                  className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <div className="text-xl">{getTypeIcon(recommendation.type)}</div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h5 className="text-sm font-medium text-gray-900 dark:text-white">
                            {recommendation.title}
                          </h5>
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(
                              recommendation.priority
                            )}`}
                          >
                            {recommendation.priority}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                          {recommendation.description}
                        </p>

                        {/* Impact and Confidence */}
                        <div className="flex items-center space-x-4 mb-3">
                          <div className="text-xs text-gray-500 dark:text-gray-500">
                            <span className="font-medium">Impact:</span>{' '}
                            {recommendation.estimatedImpact}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-500">
                            <span className="font-medium">Confidence:</span>{' '}
                            {(recommendation.confidence * 100).toFixed(0)}%
                          </div>
                        </div>

                        {/* Actions */}
                        {recommendation.actions && recommendation.actions.length > 0 && (
                          <div className="mb-3">
                            <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                              Recommended Actions:
                            </div>
                            <div className="space-y-2">
                              {recommendation.actions.slice(0, 2).map(action => (
                                <div
                                  key={action.id}
                                  className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded"
                                >
                                  <div>
                                    <div className="text-xs font-medium text-gray-900 dark:text-white">
                                      {action.title}
                                    </div>
                                    <div className="text-xs text-gray-600 dark:text-gray-400">
                                      {action.description}
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <div className="text-xs text-gray-500 dark:text-gray-500">
                                      {action.estimated_time}
                                    </div>
                                    <div
                                      className={`text-xs font-medium ${
                                        action.impact === 'high'
                                          ? 'text-green-600 dark:text-green-400'
                                          : action.impact === 'medium'
                                            ? 'text-yellow-600 dark:text-yellow-400'
                                            : 'text-gray-600 dark:text-gray-400'
                                      }`}
                                    >
                                      {action.impact} impact
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Feedback */}
                        {!recommendation.feedback && (
                          <div className="flex items-center space-x-2">
                            <span className="text-xs text-gray-600 dark:text-gray-400">
                              Was this helpful?
                            </span>
                            <button
                              onClick={() => handleFeedback(recommendation.id, 'helpful')}
                              className="text-xs text-green-600 dark:text-green-400 hover:text-green-500 dark:hover:text-green-300"
                            >
                              👍 Yes
                            </button>
                            <button
                              onClick={() => handleFeedback(recommendation.id, 'notHelpful')}
                              className="text-xs text-red-600 dark:text-red-400 hover:text-red-500 dark:hover:text-red-300"
                            >
                              👎 No
                            </button>
                            <button
                              onClick={() => handleFeedback(recommendation.id, 'irrelevant')}
                              className="text-xs text-gray-600 dark:text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                            >
                              ❌ Irrelevant
                            </button>
                          </div>
                        )}

                        {recommendation.feedback && (
                          <div className="text-xs text-gray-600 dark:text-gray-400">
                            Feedback:{' '}
                            {recommendation.feedback === 'helpful'
                              ? '👍 Helpful'
                              : recommendation.feedback === 'notHelpful'
                                ? '👎 Not helpful'
                                : '❌ Irrelevant'}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {recommendations.length > 3 && (
                <div className="mt-4 text-center">
                  <button className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300">
                    View all {recommendations.length} recommendations
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

export default RecommendationsWidget;
