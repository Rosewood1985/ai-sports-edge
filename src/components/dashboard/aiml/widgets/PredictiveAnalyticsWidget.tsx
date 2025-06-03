/**
 * Predictive Analytics Widget
 * Phase 4.1: Foundation Widget
 * Displays predictive analytics and forecasting insights
 */

import React, { useState } from 'react';

import { useForecasting } from '../../../../hooks/useAIML';
import { LineChart } from '../../charts/LineChart';

interface PredictiveAnalyticsWidgetProps {
  className?: string;
}

export function PredictiveAnalyticsWidget({ className = '' }: PredictiveAnalyticsWidgetProps) {
  const { forecasts, generateForecast, loading } = useForecasting();
  const [selectedMetric, setSelectedMetric] = useState('revenue');

  const metrics = [
    { value: 'revenue', label: 'Revenue', icon: '💰' },
    { value: 'users', label: 'User Growth', icon: '👥' },
    { value: 'engagement', label: 'Engagement', icon: '📱' },
    { value: 'churn', label: 'Churn Rate', icon: '🚪' },
  ];

  const selectedForecast = forecasts.find(f => f.metric === selectedMetric);

  const handleGenerateForecast = async () => {
    await generateForecast(selectedMetric, 30); // 30-day forecast
  };

  const getChartData = () => {
    if (!selectedForecast) return null;

    return {
      labels: selectedForecast.forecastData.map(d => {
        const date = new Date(d.date);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      }),
      datasets: [
        {
          label: 'Predicted',
          data: selectedForecast.forecastData.map(d => d.predicted),
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.4,
        },
        {
          label: 'Upper Bound',
          data: selectedForecast.forecastData.map(d => d.confidenceInterval.upper),
          borderColor: 'rgba(59, 130, 246, 0.3)',
          backgroundColor: 'transparent',
          borderDash: [5, 5],
          tension: 0.4,
        },
        {
          label: 'Lower Bound',
          data: selectedForecast.forecastData.map(d => d.confidenceInterval.lower),
          borderColor: 'rgba(59, 130, 246, 0.3)',
          backgroundColor: 'transparent',
          borderDash: [5, 5],
          tension: 0.4,
        },
      ],
    };
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow ${className}`}>
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Predictive Analytics
            </h3>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              AI-powered forecasting and trend analysis
            </p>
          </div>
          <div className="text-2xl">🔮</div>
        </div>
      </div>

      <div className="p-6">
        {/* Metric Selector */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <label className="text-sm font-medium text-gray-900 dark:text-white">
              Select Metric
            </label>
            <button
              onClick={handleGenerateForecast}
              disabled={loading}
              className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Generating...' : 'Generate Forecast'}
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {metrics.map(metric => (
              <button
                key={metric.value}
                onClick={() => setSelectedMetric(metric.value)}
                className={`p-3 rounded-lg border text-left transition-colors ${
                  selectedMetric === metric.value
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                    : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <span className="text-lg">{metric.icon}</span>
                  <span className="text-sm font-medium">{metric.label}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Forecast Display */}
        {selectedForecast ? (
          <div>
            <div className="mb-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                  {metrics.find(m => m.value === selectedMetric)?.label} Forecast
                </h4>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Accuracy: {(selectedForecast.accuracy * 100).toFixed(1)}%
                </div>
              </div>
            </div>

            {/* Chart */}
            <div className="h-64 mb-4">
              {getChartData() && (
                <LineChart
                  data={getChartData()!}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                      y: {
                        beginAtZero: false,
                        grid: {
                          color: 'rgba(156, 163, 175, 0.2)',
                        },
                        ticks: {
                          color: 'rgba(156, 163, 175, 0.8)',
                        },
                      },
                      x: {
                        grid: {
                          color: 'rgba(156, 163, 175, 0.2)',
                        },
                        ticks: {
                          color: 'rgba(156, 163, 175, 0.8)',
                        },
                      },
                    },
                    plugins: {
                      legend: {
                        position: 'top' as const,
                        labels: {
                          color: 'rgba(156, 163, 175, 0.8)',
                          usePointStyle: true,
                        },
                      },
                    },
                  }}
                />
              )}
            </div>

            {/* Key Insights */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <div className="text-sm text-gray-600 dark:text-gray-400">Next 7 Days</div>
                <div className="text-lg font-semibold text-gray-900 dark:text-white">
                  {selectedForecast.forecastData
                    .slice(0, 7)
                    .reduce((sum, d) => sum + d.predicted, 0)
                    .toLocaleString()}
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <div className="text-sm text-gray-600 dark:text-gray-400">Next 30 Days</div>
                <div className="text-lg font-semibold text-gray-900 dark:text-white">
                  {selectedForecast.forecastData
                    .reduce((sum, d) => sum + d.predicted, 0)
                    .toLocaleString()}
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <div className="text-sm text-gray-600 dark:text-gray-400">Trend</div>
                <div className="flex items-center">
                  <span className="text-lg font-semibold text-gray-900 dark:text-white">
                    {selectedForecast.forecastData[29]?.predicted >
                    selectedForecast.forecastData[0]?.predicted
                      ? '📈 Increasing'
                      : '📉 Decreasing'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="text-6xl mb-4">🔮</div>
            <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No Forecast Available
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Generate a forecast for {metrics.find(m => m.value === selectedMetric)?.label}
            </p>
            <button
              onClick={handleGenerateForecast}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Generating...' : 'Generate Forecast'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default PredictiveAnalyticsWidget;
