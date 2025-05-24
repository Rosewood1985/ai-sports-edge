import React from 'react';

export interface TabItem {
  id: string;
  label: string;
  icon?: string;
  disabled?: boolean;
}

export interface TabProps {
  tabs: TabItem[];
  activeTab: string;
  onTabChange: (id: string) => void;
  className?: string;
}

/**
 * Tab component for switching between different views
 */
export function Tab({ tabs, activeTab, onTabChange, className = '' }: TabProps) {
  return (
    <div className={`tab-container ${className}`}>
      <div className="tab-list flex border-b border-gray-200 dark:border-gray-700">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`tab-item px-4 py-2 text-sm font-medium ${
              activeTab === tab.id
                ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-400 dark:border-blue-400'
                : 'text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            } ${tab.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            onClick={() => {
              if (!tab.disabled) {
                onTabChange(tab.id);
              }
            }}
            disabled={tab.disabled}
            aria-selected={activeTab === tab.id}
            role="tab"
            aria-controls={`tabpanel-${tab.id}`}
          >
            {tab.icon && <span className="tab-icon mr-2">{tab.icon}</span>}
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}
