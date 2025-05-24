import React, { ReactNode } from 'react';

export type BadgeColor =
  | 'default'
  | 'primary'
  | 'secondary'
  | 'success'
  | 'warning'
  | 'error'
  | 'danger'
  | 'info';
export type BadgeSize = 'sm' | 'md' | 'lg';

export type BadgeVariant = 'filled' | 'outlined' | 'light';

export interface BadgeProps {
  children: ReactNode;
  color?: BadgeColor;
  size?: BadgeSize;
  variant?: BadgeVariant;
  className?: string;
}

/**
 * Badge component for displaying status indicators
 */
export function Badge({
  children,
  color = 'default',
  size = 'md',
  variant = 'filled',
  className = '',
}: BadgeProps) {
  const getColorClasses = () => {
    if (variant === 'outlined') {
      switch (color) {
        case 'primary':
          return 'border border-blue-500 text-blue-600 dark:border-blue-400 dark:text-blue-400';
        case 'secondary':
          return 'border border-purple-500 text-purple-600 dark:border-purple-400 dark:text-purple-400';
        case 'success':
          return 'border border-green-500 text-green-600 dark:border-green-400 dark:text-green-400';
        case 'warning':
          return 'border border-yellow-500 text-yellow-600 dark:border-yellow-400 dark:text-yellow-400';
        case 'error':
        case 'danger':
          return 'border border-red-500 text-red-600 dark:border-red-400 dark:text-red-400';
        case 'info':
          return 'border border-sky-500 text-sky-600 dark:border-sky-400 dark:text-sky-400';
        default:
          return 'border border-gray-300 text-gray-600 dark:border-gray-600 dark:text-gray-400';
      }
    } else if (variant === 'light') {
      switch (color) {
        case 'primary':
          return 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
        case 'secondary':
          return 'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300';
        case 'success':
          return 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300';
        case 'warning':
          return 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300';
        case 'error':
        case 'danger':
          return 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300';
        case 'info':
          return 'bg-sky-50 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300';
        default:
          return 'bg-gray-50 text-gray-700 dark:bg-gray-800/50 dark:text-gray-300';
      }
    } else {
      // Default filled variant
      switch (color) {
        case 'primary':
          return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
        case 'secondary':
          return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
        case 'success':
          return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
        case 'warning':
          return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
        case 'error':
        case 'danger':
          return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
        case 'info':
          return 'bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-300';
        default:
          return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
      }
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'text-xs px-2 py-0.5';
      case 'lg':
        return 'text-sm px-3 py-1';
      default:
        return 'text-xs px-2.5 py-0.5';
    }
  };

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium ${getColorClasses()} ${getSizeClasses()} ${className}`}
    >
      {children}
    </span>
  );
}
