import React from 'react';

export interface Recommendation {
  id: string;
  priority: 'low' | 'medium' | 'high';
  message: string;
  action: string;
}

export interface RecommendationsListProps {
  recommendations: Recommendation[];
  onActionClick: (id: string, action: string) => void;
  className?: string;
}

export function RecommendationsList({
  recommendations,
  onActionClick,
  className = '',
}: RecommendationsListProps) {
  // Get priority color class
  const getPriorityColorClass = (priority: string): string => {
    switch (priority) {
      case 'high':
        return 'border-red-500 bg-red-50 dark:bg-red-900/20';
      case 'medium':
        return 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20';
      case 'low':
        return 'border-blue-500 bg-blue-50 dark:bg-blue-900/20';
      default:
        return 'border-gray-500 bg-gray-50 dark:bg-gray-900/20';
    }
  };

  return (
    <div className={`recommendations-list ${className}`}>
      {recommendations.map(recommendation => (
        <div
          key={recommendation.id}
          className={`recommendation-item p-3 mb-2 rounded-lg border-l-4 ${getPriorityColorClass(
            recommendation.priority
          )}`}
        >
          <div className="flex justify-between items-center">
            <div className="recommendation-details">
              <p className="recommendation-message font-medium">{recommendation.message}</p>
            </div>
            <div className="recommendation-actions">
              <button
                onClick={() => onActionClick(recommendation.id, recommendation.action)}
                className="text-sm px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                {recommendation.action}
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
