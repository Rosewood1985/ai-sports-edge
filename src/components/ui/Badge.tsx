import React from 'react';

export type BadgeColor =
  | 'primary'
  | 'secondary'
  | 'success'
  | 'warning'
  | 'error'
  | 'info'
  | 'default';
export type BadgeSize = 'small' | 'medium' | 'large';
export type BadgeVariant = 'filled' | 'outlined' | 'light';

export interface BadgeProps {
  children: React.ReactNode;
  color?: BadgeColor;
  size?: BadgeSize;
  variant?: BadgeVariant;
  className?: string;
  icon?: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  color = 'default',
  size = 'medium',
  variant = 'filled',
  className = '',
  icon,
}) => {
  // Color styles
  const colorClasses = {
    filled: {
      primary: 'bg-primary text-white',
      secondary: 'bg-secondary text-white',
      success: 'bg-success text-white',
      warning: 'bg-warning text-white',
      error: 'bg-error text-white',
      info: 'bg-info text-white',
      default: 'bg-gray-200 text-gray-800',
    },
    outlined: {
      primary: 'border border-primary text-primary',
      secondary: 'border border-secondary text-secondary',
      success: 'border border-success text-success',
      warning: 'border border-warning text-warning',
      error: 'border border-error text-error',
      info: 'border border-info text-info',
      default: 'border border-gray-300 text-gray-800',
    },
    light: {
      primary: 'bg-primary-light text-primary',
      secondary: 'bg-secondary-light text-secondary',
      success: 'bg-success-light text-success',
      warning: 'bg-warning-light text-warning',
      error: 'bg-error-light text-error',
      info: 'bg-info-light text-info',
      default: 'bg-gray-100 text-gray-800',
    },
  };

  // Size styles
  const sizeClasses = {
    small: 'text-xs px-2 py-0.5',
    medium: 'text-sm px-2.5 py-0.5',
    large: 'text-base px-3 py-1',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium ${colorClasses[variant][color]} ${sizeClasses[size]} ${className}`}
    >
      {icon && <span className="mr-1">{icon}</span>}
      {children}
    </span>
  );
};
