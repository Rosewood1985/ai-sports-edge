import React, { ReactNode } from 'react';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  children: ReactNode;
  className?: string;
  error?: string;
  label?: string;
  helpText?: string;
  helperText?: string; // Alias for helpText for backward compatibility
  fullWidth?: boolean;
}

/**
 * Select component with customizable styling
 */
export function Select({
  children,
  className = '',
  error,
  label,
  helpText,
  helperText,
  fullWidth = false,
  ...props
}: SelectProps) {
  // Use helpText or helperText, preferring helpText if both are provided
  const finalHelpText = helpText || helperText;
  return (
    <div className={fullWidth ? 'w-full' : ''}>
      {label && (
        <label
          htmlFor={props.id}
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          {label}
        </label>
      )}
      <select
        className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:text-sm ${
          error ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''
        } ${className}`}
        {...props}
      >
        {children}
      </select>
      {finalHelpText && !error && (
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{finalHelpText}</p>
      )}
      {error && <p className="mt-1 text-sm text-red-600 dark:text-red-500">{error}</p>}
    </div>
  );
}
