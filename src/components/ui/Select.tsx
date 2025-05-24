import React, { forwardRef } from 'react';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  helperText?: string;
  error?: string;
  fullWidth?: boolean;
  children: React.ReactNode;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    { label, helperText, error, fullWidth = false, className = '', disabled, children, ...props },
    ref
  ) => {
    const widthClass = fullWidth ? 'w-full' : '';
    const errorClass = error
      ? 'border-error focus:ring-error'
      : 'border-gray-300 focus:ring-primary';
    const disabledClass = disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white';

    return (
      <div className={`${widthClass}`}>
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor={props.id}>
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            className={`block appearance-none rounded-md shadow-sm border ${errorClass} ${disabledClass} focus:outline-none focus:ring-2 focus:ring-opacity-50 pl-3 pr-10 py-2 ${widthClass} ${className}`}
            disabled={disabled}
            {...props}
          >
            {children}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
            <svg
              className="h-5 w-5"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        </div>
        {(helperText || error) && (
          <p className={`mt-1 text-sm ${error ? 'text-error' : 'text-gray-500'}`}>
            {error || helperText}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';
