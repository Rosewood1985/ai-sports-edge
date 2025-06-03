/**
 * Insights Center Component
 * Phase 4.1: Foundation Component
 * Interface for viewing and managing AI insights and recommendations
 */

import React from 'react';

export function InsightsCenter() {
  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Insights Center</h3>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            AI-generated insights and recommendations
          </p>
        </div>
        <div className="p-6">
          <div className="text-center py-8">
            <div className="text-6xl mb-4">💡</div>
            <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Insights Interface
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Advanced insights and recommendations coming soon...
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default InsightsCenter;
