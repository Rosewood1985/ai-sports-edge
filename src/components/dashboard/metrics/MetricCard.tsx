import React from 'react';
import { Card } from '../../../components/ui/Card';

export type MetricStatus = 'success' | 'warning' | 'error' | 'neutral';
export type TrendDirection = 'up' | 'down' | 'flat';

export interface MetricCardProps {
  title: string;
  value: string | number;
  target?: string;
  trend?: {
    direction: TrendDirection;
    value: string | number;
  };
  status?: MetricStatus;
  icon?: React.ReactNode;
  className?: string;
}

export function MetricCard({
  title,
  value,
  target,
  trend,
  status = 'neutral',
  icon,
  className = '',
}: MetricCardProps) {
  // Status classes
  const statusClasses = {
    success: 'border-green-500 bg-green-50 dark:bg-green-900/20',
    warning: 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20',
    error: 'border-red-500 bg-red-50 dark:bg-red-900/20',
    neutral: 'border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800',
  }[status];

  // Trend classes
  const getTrendClasses = (direction: TrendDirection) => {
    return {
      up: 'text-green-500',
      down: 'text-red-500',
      flat: 'text-gray-500',
    }[direction];
  };

  // Trend icon
  const getTrendIcon = (direction: TrendDirection) => {
    switch (direction) {
      case 'up':
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z"
              clipRule="evenodd"
            />
          </svg>
        );
      case 'down':
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M12 13a1 1 0 100 2h5a1 1 0 001-1v-5a1 1 0 10-2 0v2.586l-4.293-4.293a1 1 0 00-1.414 0L8 9.586l-4.293-4.293a1 1 0 00-1.414 1.414l5 5a1 1 0 001.414 0L11 9.414 14.586 13H12z"
              clipRule="evenodd"
            />
          </svg>
        );
      case 'flat':
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M18 10a1 1 0 01-1 1H3a1 1 0 110-2h14a1 1 0 011 1z"
              clipRule="evenodd"
            />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <Card className={`metric-card border-l-4 ${statusClasses} ${className}`}>
      <div className="p-4">
        <div className="flex justify-between items-start">
          <div className="metric-title text-sm font-medium text-gray-500 dark:text-gray-400">
            {title}
          </div>
          {icon && <div className="metric-icon">{icon}</div>}
        </div>

        <div className="mt-2 flex items-baseline">
          <div className="metric-value text-2xl font-semibold text-gray-900 dark:text-white">
            {value}
          </div>
          {target && (
            <div className="ml-2 text-sm text-gray-500 dark:text-gray-400">Target: {target}</div>
          )}
        </div>

        {trend && (
          <div className={`mt-2 flex items-center ${getTrendClasses(trend.direction)}`}>
            {getTrendIcon(trend.direction)}
            <span className="ml-1 text-sm">{trend.value}</span>
          </div>
        )}
      </div>
    </Card>
  );
}
