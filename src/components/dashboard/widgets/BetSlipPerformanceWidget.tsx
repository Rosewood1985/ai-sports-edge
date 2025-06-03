import React from 'react';

import { EnhancedWidget } from './EnhancedWidget';
import { HorizontalBarChart } from '../charts/HorizontalBarChart';
import { MetricCard } from '../metrics/MetricCard';

// Import the TrendDirection type
import { TrendDirection } from '../metrics/MetricCard';

// Mock data for development
const mockData = {
  ocrSuccessRate: 94.5,
  ocrSuccessRateTrend: { direction: 'up' as TrendDirection, value: '+2.3%' },
  avgProcessingTime: 2.7,
  avgProcessingTimeTrend: { direction: 'down' as TrendDirection, value: '-0.5s' },
  queueLength: 12,
  queueLengthTrend: { direction: 'down' as TrendDirection, value: '-8' },
  modelAccuracy: 96.2,
  avgConfidence: 89.5,
  lowConfidenceBets: 23,
  popularBetTypes: [
    { name: 'Moneyline', value: 42 },
    { name: 'Spread', value: 35 },
    { name: 'Over/Under', value: 28 },
    { name: 'Parlay', value: 15 },
    { name: 'Prop', value: 10 },
  ],
  errorCategories: [
    { name: 'OCR Failures', value: 45 },
    { name: 'Invalid Format', value: 30 },
    { name: 'Network Errors', value: 15 },
    { name: 'Unknown', value: 10 },
  ],
  recentErrors: [
    {
      id: 'err-001',
      severity: 'high',
      message: 'OCR failed to recognize text in image',
      betSlipId: 'bs-12345',
      timestamp: '2025-05-23T15:30:45Z',
      userId: 'user-789',
    },
    {
      id: 'err-002',
      severity: 'medium',
      message: 'Invalid bet slip format detected',
      betSlipId: 'bs-12346',
      timestamp: '2025-05-23T14:22:18Z',
      userId: 'user-456',
    },
    {
      id: 'err-003',
      severity: 'low',
      message: 'Network timeout during processing',
      betSlipId: 'bs-12347',
      timestamp: '2025-05-23T13:15:32Z',
      userId: 'user-123',
    },
  ],
};

// This would be replaced with a real API call in production
const useBetSlipPerformanceData = () => {
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);
  const [data, setData] = React.useState(mockData);

  const refetch = () => {
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setData(mockData);
      setIsLoading(false);
    }, 1000);
  };

  return { data, isLoading, error, refetch };
};

// Helper functions
const reprocessBetSlip = (betSlipId: string) => {
  console.log(`Reprocessing bet slip: ${betSlipId}`);
  // This would call the API to reprocess the bet slip
};

const viewBetSlipDetails = (betSlipId: string) => {
  console.log(`Viewing bet slip details: ${betSlipId}`);
  // This would navigate to the bet slip details page
};

export function BetSlipPerformanceWidget() {
  const { data, isLoading, error, refetch } = useBetSlipPerformanceData();

  return (
    <EnhancedWidget
      title="🎯 Bet Slip Intelligence"
      subtitle="Last 24 hours"
      size="large"
      isLoading={isLoading}
      error={error}
      onRefresh={refetch}
      footer={
        <a href="/analytics/bet-slips" className="text-blue-500 hover:underline text-sm">
          View detailed analytics
        </a>
      }
    >
      <div className="space-y-6">
        {/* OCR Performance Section */}
        <div className="ocr-performance-section">
          <h4 className="text-lg font-medium mb-3">Real-time OCR Performance</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <MetricCard
              title="OCR Success Rate"
              value={`${data?.ocrSuccessRate}%`}
              target="95%"
              trend={data?.ocrSuccessRateTrend}
              status={data?.ocrSuccessRate >= 95 ? 'success' : 'warning'}
            />
            <MetricCard
              title="Avg Processing Time"
              value={`${data?.avgProcessingTime}s`}
              target="<3s"
              trend={data?.avgProcessingTimeTrend}
              status={data?.avgProcessingTime <= 3 ? 'success' : 'warning'}
            />
            <MetricCard
              title="Queue Length"
              value={data?.queueLength}
              target="<50"
              trend={data?.queueLengthTrend}
              status={data?.queueLength <= 50 ? 'success' : 'neutral'}
            />
          </div>
        </div>

        {/* Bet Type Analytics */}
        <div className="bet-type-analytics">
          <h4 className="text-lg font-medium mb-3">Most Popular Bet Types</h4>
          <div className="h-64">
            {/* This would be replaced with the actual HorizontalBarChart component */}
            <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg h-full flex items-center justify-center">
              <p className="text-gray-500 dark:text-gray-400">Horizontal Bar Chart Placeholder</p>
            </div>
          </div>
        </div>

        {/* Processing Error Analysis */}
        <div className="error-analysis-section">
          <h4 className="text-lg font-medium mb-3">Processing Failures by Category</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-48">
              {/* This would be replaced with the actual PieChart component */}
              <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg h-full flex items-center justify-center">
                <p className="text-gray-500 dark:text-gray-400">Pie Chart Placeholder</p>
              </div>
            </div>
            <div className="error-list max-h-48 overflow-y-auto">
              {data?.recentErrors?.map(error => (
                <div
                  key={error.id}
                  className={`error-item p-3 mb-2 rounded-lg border-l-4 ${
                    error.severity === 'high'
                      ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                      : error.severity === 'medium'
                        ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20'
                        : 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  }`}
                >
                  <div className="flex justify-between">
                    <div className="error-details">
                      <p className="error-message font-medium">{error.message}</p>
                      <p className="error-meta text-sm text-gray-500 dark:text-gray-400">
                        {error.betSlipId} • {new Date(error.timestamp).toLocaleString()} •{' '}
                        {error.userId}
                      </p>
                    </div>
                    <div className="error-actions flex space-x-2">
                      <button
                        onClick={() => reprocessBetSlip(error.betSlipId)}
                        className="text-sm px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                      >
                        Retry
                      </button>
                      <button
                        onClick={() => viewBetSlipDetails(error.betSlipId)}
                        className="text-sm px-2 py-1 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                      >
                        Details
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ML Model Performance */}
        <div className="ml-model-section">
          <h4 className="text-lg font-medium mb-3">OCR Model Performance</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <MetricCard
              title="Model Accuracy"
              value={`${data?.modelAccuracy}%`}
              status={data?.modelAccuracy >= 95 ? 'success' : 'warning'}
            />
            <MetricCard
              title="Confidence Score"
              value={`${data?.avgConfidence}%`}
              status={data?.avgConfidence >= 85 ? 'success' : 'warning'}
            />
            <MetricCard
              title="Low Confidence Bets"
              value={data?.lowConfidenceBets}
              status={data?.lowConfidenceBets <= 30 ? 'success' : 'warning'}
            />
          </div>
        </div>
      </div>
    </EnhancedWidget>
  );
}
