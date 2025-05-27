/**
 * AI/ML Dashboard Component
 * Phase 4.1: Foundation Dashboard
 * Main AI/ML integration component for the admin dashboard
 */

import React, { useState } from 'react';
import { useAIMLDashboard } from '../../../hooks/useAIML';
import { MLModelOverviewWidget } from './widgets/MLModelOverviewWidget';
import { PredictiveAnalyticsWidget } from './widgets/PredictiveAnalyticsWidget';
import { AnomalyDetectionWidget } from './widgets/AnomalyDetectionWidget';
import { AIInsightsWidget } from './widgets/AIInsightsWidget';
import { RecommendationsWidget } from './widgets/RecommendationsWidget';
import { TrainingJobsWidget } from './widgets/TrainingJobsWidget';
import { Tabs } from '../../ui/Tabs';
import { ModelManagement } from './ModelManagement';
import { PredictionCenter } from './PredictionCenter';
import { InsightsCenter } from './InsightsCenter';

interface AIMLDashboardProps {
  className?: string;
}

/**
 * Main AI/ML Dashboard component with comprehensive AI/ML management
 */
export function AIMLDashboard({ className = '' }: AIMLDashboardProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const { stats, models, insights, recommendations, anomalies, runningJobs } = useAIMLDashboard();

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '🤖' },
    { id: 'models', label: 'Models', icon: '🧠' },
    { id: 'predictions', label: 'Predictions', icon: '🔮' },
    { id: 'insights', label: 'Insights', icon: '💡' },
    { id: 'monitoring', label: 'Monitoring', icon: '📊' },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverview();
      case 'models':
        return <ModelManagement />;
      case 'predictions':
        return <PredictionCenter />;
      case 'insights':
        return <InsightsCenter />;
      case 'monitoring':
        return renderMonitoring();
      default:
        return renderOverview();
    }
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* AI/ML Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <span className="text-2xl">🧠</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Deployed Models
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.deployedModels}/{stats.totalModels}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
              <span className="text-2xl">📈</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Avg Accuracy
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {(stats.avgModelAccuracy * 100).toFixed(1)}%
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
              <span className="text-2xl">💡</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Active Insights
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.activeInsights}
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
                Critical Anomalies
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.criticalAnomalies}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Widgets Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MLModelOverviewWidget models={models} />
        <PredictiveAnalyticsWidget />
        <AnomalyDetectionWidget anomalies={anomalies} />
        <AIInsightsWidget insights={insights} />
        <RecommendationsWidget recommendations={recommendations} />
        <TrainingJobsWidget jobs={runningJobs} />
      </div>
    </div>
  );

  const renderMonitoring = () => (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            AI/ML System Monitoring
          </h3>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Real-time monitoring of AI/ML system performance and health
          </p>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <AnomalyDetectionWidget anomalies={anomalies} />
            <TrainingJobsWidget jobs={runningJobs} />
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className={`ai-ml-dashboard ${className}`}>
      {/* Header */}
      <div className="mb-6">
        <div className="sm:flex sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              AI/ML Dashboard
            </h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Comprehensive AI/ML management and monitoring
            </p>
          </div>
          <div className="mt-4 sm:mt-0">
            <div className="flex items-center space-x-2">
              {stats.runningJobs > 0 && (
                <div className="flex items-center text-sm text-blue-600 dark:text-blue-400">
                  <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse mr-2"></div>
                  {stats.runningJobs} training job{stats.runningJobs !== 1 ? 's' : ''} running
                </div>
              )}
              {stats.criticalAnomalies > 0 && (
                <div className="flex items-center text-sm text-red-600 dark:text-red-400">
                  <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse mr-2"></div>
                  {stats.criticalAnomalies} critical anomal{stats.criticalAnomalies !== 1 ? 'ies' : 'y'}
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

export default AIMLDashboard;