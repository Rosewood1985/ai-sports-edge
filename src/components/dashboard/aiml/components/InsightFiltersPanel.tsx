/**
 * Insight Filters Panel Component
 * Phase 4.2: Advanced AI/ML Features
 * Advanced filtering interface for enhanced insights
 */

import React from 'react';
import { InsightFilters, EnhancedInsight } from '../../../../types/enhancedInsights';

interface InsightFiltersPanelProps {
  filters: InsightFilters;
  onFiltersChange: (filters: InsightFilters) => void;
  onApply: () => void;
  onClear?: () => void;
}

export function InsightFiltersPanel({
  filters,
  onFiltersChange,
  onApply,
  onClear
}: InsightFiltersPanelProps) {
  const updateFilter = (key: keyof InsightFilters, value: any) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const handleClear = () => {
    onFiltersChange({});
    if (onClear) onClear();
  };

  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-700">
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {/* Type Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Type
          </label>
          <select
            multiple
            value={filters.types || []}
            onChange={(e) => updateFilter('types', Array.from(e.target.selectedOptions, option => option.value) as EnhancedInsight['type'][])}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
          >
            <option value="opportunity">Opportunity</option>
            <option value="risk">Risk</option>
            <option value="trend">Trend</option>
            <option value="anomaly">Anomaly</option>
            <option value="correlation">Correlation</option>
            <option value="prediction">Prediction</option>
          </select>
        </div>

        {/* Category Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Category
          </label>
          <select
            multiple
            value={filters.categories || []}
            onChange={(e) => updateFilter('categories', Array.from(e.target.selectedOptions, option => option.value) as EnhancedInsight['category'][])}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
          >
            <option value="user_behavior">User Behavior</option>
            <option value="financial">Financial</option>
            <option value="operational">Operational</option>
            <option value="marketing">Marketing</option>
            <option value="product">Product</option>
            <option value="security">Security</option>
          </select>
        </div>

        {/* Severity Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Severity
          </label>
          <select
            multiple
            value={filters.severities || []}
            onChange={(e) => updateFilter('severities', Array.from(e.target.selectedOptions, option => option.value) as EnhancedInsight['severity'][])}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
          >
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>

        {/* Status Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Status
          </label>
          <select
            multiple
            value={filters.statuses || []}
            onChange={(e) => updateFilter('statuses', Array.from(e.target.selectedOptions, option => option.value) as EnhancedInsight['status'][])}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
          >
            <option value="new">New</option>
            <option value="acknowledged">Acknowledged</option>
            <option value="investigating">Investigating</option>
            <option value="resolved">Resolved</option>
            <option value="dismissed">Dismissed</option>
          </select>
        </div>

        {/* Confidence Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Min Confidence
          </label>
          <input
            type="number"
            min="0"
            max="100"
            value={filters.minConfidence ? filters.minConfidence * 100 : ''}
            onChange={(e) => updateFilter('minConfidence', e.target.value ? parseInt(e.target.value) / 100 : undefined)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
            placeholder="0-100"
          />
        </div>
      </div>

      {/* Advanced Filters */}
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Keywords */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Keywords
            </label>
            <input
              type="text"
              value={filters.keywords?.join(', ') || ''}
              onChange={(e) => updateFilter('keywords', e.target.value.split(',').map(k => k.trim()).filter(k => k))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
              placeholder="Enter keywords separated by commas"
            />
          </div>

          {/* Date Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Date Range
            </label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="date"
                value={filters.dateRange?.start || ''}
                onChange={(e) => updateFilter('dateRange', { ...filters.dateRange, start: e.target.value })}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
              />
              <input
                type="date"
                value={filters.dateRange?.end || ''}
                onChange={(e) => updateFilter('dateRange', { ...filters.dateRange, end: e.target.value })}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
              />
            </div>
          </div>

          {/* Recommendations */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Options
            </label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.hasRecommendations || false}
                  onChange={(e) => updateFilter('hasRecommendations', e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Has Recommendations
                </span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-6 flex items-center justify-between">
        <button
          onClick={handleClear}
          className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
        >
          Clear All
        </button>
        <div className="flex items-center space-x-3">
          <button
            onClick={onApply}
            className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  );
}

export default InsightFiltersPanel;