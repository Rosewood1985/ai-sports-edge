import React from 'react';
import { Card, CardHeader, CardContent, CardFooter } from '../../../components/ui/Card';
import { IconButton } from '../../../components/ui/IconButton';
import { Tooltip } from '../../../components/ui/Tooltip';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';
import { ErrorIcon } from '../../../components/ui/icons/ErrorIcon';

export type WidgetSize = 'small' | 'medium' | 'large' | 'extra-large';

export interface EnhancedWidgetProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  size?: WidgetSize;
  actions?: React.ReactNode[];
  footer?: React.ReactNode;
  isLoading?: boolean;
  error?: Error | null;
  onRefresh?: () => void;
  children: React.ReactNode;
  className?: string;
}

export function EnhancedWidget({
  title,
  subtitle,
  icon,
  size = 'medium',
  actions = [],
  footer,
  isLoading = false,
  error = null,
  onRefresh,
  children,
  className = '',
}: EnhancedWidgetProps) {
  // Size-based classes
  const sizeClasses = {
    small: 'col-span-1',
    medium: 'col-span-2',
    large: 'col-span-3',
    'extra-large': 'col-span-4',
  }[size];

  return (
    <Card className={`dashboard-widget ${sizeClasses} ${className}`}>
      <CardHeader className="widget-header">
        <div className="widget-title-container">
          {icon && <div className="widget-icon">{icon}</div>}
          <div className="widget-title-content">
            <h3 className="widget-title">{title}</h3>
            {subtitle && <p className="widget-subtitle">{subtitle}</p>}
          </div>
        </div>
        <div className="widget-actions">
          {onRefresh && (
            <Tooltip content="Refresh">
              <IconButton
                icon="refresh"
                onClick={onRefresh}
                disabled={isLoading}
                aria-label="Refresh widget"
              />
            </Tooltip>
          )}
          {actions.map((action, index) => (
            <div key={`action-${index}`} className="widget-action">
              {action}
            </div>
          ))}
        </div>
      </CardHeader>
      <CardContent className="widget-content">
        {isLoading ? (
          <div className="widget-loading">
            <LoadingSpinner size="medium" />
            <p>Loading data...</p>
          </div>
        ) : error ? (
          <div className="widget-error">
            <ErrorIcon />
            <p>Error: {error.message}</p>
            {onRefresh && (
              <button onClick={onRefresh} className="retry-button">
                Retry
              </button>
            )}
          </div>
        ) : (
          children
        )}
      </CardContent>
      {footer && <CardFooter className="widget-footer">{footer}</CardFooter>}
    </Card>
  );
}
