/**
 * Enhanced Insights Dashboard
 * Phase 4.2: Advanced AI/ML Features
 * NLP-powered insights with advanced pattern detection and analytics
 */

import React, { useState } from 'react';
import { useEnhancedInsightsDashboard } from '../../../hooks/useEnhancedInsights';
import { InsightFilters } from '../../../types/enhancedInsights';
import { EnhancedInsightCard } from './components/EnhancedInsightCard';
import { InsightAnalyticsWidget } from './components/InsightAnalyticsWidget';
import { PatternDetectionWidget } from './components/PatternDetectionWidget';
import { CorrelationAnalysisWidget } from './components/CorrelationAnalysisWidget';
import { NLPInsightsWidget } from './components/NLPInsightsWidget';
import { RealTimeInsightsWidget } from './components/RealTimeInsightsWidget';
import { InsightFiltersPanel } from './components/InsightFiltersPanel';
import { Tabs } from '../../ui/Tabs';

interface EnhancedInsightsDashboardProps {
  className?: string;
}

/**
 * Advanced insights dashboard with NLP and pattern detection
 */
export function EnhancedInsightsDashboard({ className = '' }: EnhancedInsightsDashboardProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [filters, setFilters] = useState<InsightFilters>({});
  const [showFilters, setShowFilters] = useState(false);

  const {
    insights,
    analytics,
    patterns,
    correlations,
    quickStats,
    loading,
    error,
  } = useEnhancedInsightsDashboard(filters);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '🎯' },
    { id: 'insights', label: 'Insights', icon: '💡' },
    { id: 'patterns', label: 'Patterns', icon: '📈' },
    { id: 'correlations', label: 'Correlations', icon: '🔗' },
    { id: 'nlp', label: 'NLP Analysis', icon: '🧠' },
    { id: 'realtime', label: 'Live Feed', icon: '🔴' },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverview();
      case 'insights':
        return renderInsights();
      case 'patterns':
        return renderPatterns();
      case 'correlations':
        return renderCorrelations();
      case 'nlp':
        return renderNLPAnalysis();
      case 'realtime':
        return renderRealTime();
      default:
        return renderOverview();
    }
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <span className="text-2xl">💡</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total Insights
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {quickStats.totalInsights}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
              <span className="text-2xl">🆕</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                New Insights
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {quickStats.newInsights}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
              <span className="text-2xl">🚨</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Critical
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {quickStats.criticalInsights}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <span className="text-2xl">🎯</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Avg Confidence
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {(quickStats.averageConfidence * 100).toFixed(0)}%
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
              <span className="text-2xl">📊</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Top Category
              </p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                {quickStats.topCategory}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Widgets Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <InsightAnalyticsWidget analytics={analytics.analytics} />
        <PatternDetectionWidget patterns={patterns.patterns} />
        <CorrelationAnalysisWidget correlations={correlations.correlations} />
        <NLPInsightsWidget insights={insights.insights} />
      </div>
    </div>
  );

  const renderInsights = () => (
    <div className="space-y-6">
      {/* Insights List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Enhanced Insights
            </h3>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Filters
              </button>
              <button
                onClick={() => insights.generateInsights('all_sources', {
                  includeNLP: true,
                  includePatterns: true,
                  includeCorrelations: true,
                  includePredictions: true,
                })}
                className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
              >
                Generate New
              </button>
            </div>
          </div>
        </div>

        {showFilters && (
          <div className="border-b border-gray-200 dark:border-gray-700">
            <InsightFiltersPanel
              filters={filters}
              onFiltersChange={setFilters}
              onApply={() => insights.updateFilters(filters)}
            />
          </div>
        )}

        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600 dark:text-gray-400">Loading insights...</span>
            </div>
          ) : error ? (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <div className="text-red-600 dark:text-red-400">{error}</div>
            </div>
          ) : insights.insights.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-6xl mb-4">🔍</div>
              <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No Insights Found
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Try adjusting your filters or generate new insights
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {insights.insights.map((insight) => (
                <EnhancedInsightCard
                  key={insight.id}
                  insight={insight}
                  onStatusUpdate={insights.updateInsightStatus}
                />
              ))}

              {/* Pagination */}
              {insights.total > 20 && (
                <div className="flex items-center justify-between pt-4">
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Showing {((insights.page - 1) * 20) + 1} to {Math.min(insights.page * 20, insights.total)} of {insights.total} insights
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={insights.previousPage}
                      disabled={insights.page === 1}
                      className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Page {insights.page}
                    </span>
                    <button
                      onClick={insights.nextPage}
                      disabled={insights.page * 20 >= insights.total}
                      className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderPatterns = () => (
    <div className="space-y-6">
      <PatternDetectionWidget patterns={patterns.patterns} expanded />
    </div>
  );

  const renderCorrelations = () => (
    <div className="space-y-6">
      <CorrelationAnalysisWidget correlations={correlations.correlations} expanded />
    </div>
  );

  const renderNLPAnalysis = () => (
    <div className="space-y-6">
      <NLPInsightsWidget insights={insights.insights} expanded />
    </div>
  );

  const renderRealTime = () => (
    <div className="space-y-6">
      <RealTimeInsightsWidget filters={filters} />
    </div>
  );

  return (
    <div className={`enhanced-insights-dashboard ${className}`}>
      {/* Header */}
      <div className="mb-6">
        <div className="sm:flex sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Enhanced Insights Dashboard
            </h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              AI-powered insights with NLP analysis and advanced pattern detection
            </p>
          </div>
          <div className="mt-4 sm:mt-0">
            <div className="flex items-center space-x-2">
              {quickStats.newInsights > 0 && (
                <div className="flex items-center text-sm text-blue-600 dark:text-blue-400">
                  <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse mr-2"></div>
                  {quickStats.newInsights} new insight{quickStats.newInsights !== 1 ? 's' : ''}
                </div>
              )}
              {quickStats.criticalInsights > 0 && (
                <div className="flex items-center text-sm text-red-600 dark:text-red-400">
                  <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse mr-2"></div>
                  {quickStats.criticalInsights} critical
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="mb-6">
        <Tabs
          tabs={tabs}
          activeTab={activeTab}
          onChange={setActiveTab}
          className="border-b border-gray-200 dark:border-gray-700"
        />
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {renderTabContent()}
      </div>
    </div>
  );
}

export default EnhancedInsightsDashboard;