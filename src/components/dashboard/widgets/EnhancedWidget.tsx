import React, { ReactNode } from 'react';

import { Button } from '../../ui/Button';
import { LoadingSpinner } from '../../ui/LoadingSpinner';

export type WidgetSize = 'small' | 'medium' | 'large' | 'extra-large';

export interface EnhancedWidgetProps {
  title: string;
  subtitle?: string;
  size?: WidgetSize;
  isLoading?: boolean;
  error?: Error | null;
  onRefresh?: () => void;
  actions?: ReactNode[];
  footer?: ReactNode;
  className?: string;
  children: ReactNode;
}

/**
 * Enhanced widget component with loading, error handling, and refresh functionality
 */
export function EnhancedWidget({
  title,
  subtitle,
  size = 'medium',
  isLoading = false,
  error = null,
  onRefresh,
  actions = [],
  footer,
  className = '',
  children,
}: EnhancedWidgetProps) {
  const sizeClasses = {
    small: 'max-w-sm',
    medium: 'max-w-2xl',
    large: 'max-w-4xl',
    'extra-large': 'max-w-full',
  };

  const handleRefresh = () => {
    if (onRefresh) {
      onRefresh();
    }
  };

  return (
    <div
      className={`bg-white dark:bg-gray-800 shadow-sm rounded-lg overflow-hidden ${sizeClasses[size]} ${className}`}
    >
      <div className="px-4 py-5 sm:px-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">{title}</h3>
          {subtitle && (
            <p className="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>
          )}
        </div>
        <div className="flex space-x-2">
          {actions.map((action, index) => (
            <React.Fragment key={index}>{action}</React.Fragment>
          ))}
          {onRefresh && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              aria-label="Refresh"
              className="p-1"
              disabled={isLoading}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            </Button>
          )}
        </div>
      </div>
      <div className="px-4 py-5 sm:p-6">
        {isLoading && (
          <div className="absolute inset-0 bg-white/50 dark:bg-gray-900/50 flex items-center justify-center z-10">
            <LoadingSpinner size="large" />
          </div>
        )}
        {error ? (
          <div className="text-center text-red-500 p-4">
            <p>Error: {error.message}</p>
            {onRefresh && (
              <Button onClick={handleRefresh} variant="secondary" className="mt-2">
                Retry
              </Button>
            )}
          </div>
        ) : (
          children
        )}
      </div>

      {footer && (
        <div className="px-4 py-4 sm:px-6 border-t border-gray-200 dark:border-gray-700">
          {footer}
        </div>
      )}
    </div>
  );
}
