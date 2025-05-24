import React from 'react';

export interface ErrorIconProps {
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

export function ErrorIcon({ size = 'medium', className = '' }: ErrorIconProps) {
  // Size classes
  const sizeClasses = {
    small: 'w-4 h-4',
    medium: 'w-6 h-6',
    large: 'w-8 h-8',
  }[size];

  return (
    <svg
      className={`text-red-500 ${sizeClasses} ${className}`}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="12" y1="8" x2="12" y2="12"></line>
      <line x1="12" y1="16" x2="12.01" y2="16"></line>
    </svg>
  );
}
