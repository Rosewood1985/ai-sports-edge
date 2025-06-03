import React, { useState } from 'react';

import { EnhancedWidget } from './EnhancedWidget';
import { Tooltip } from '../../../components/ui/Tooltip';
import { useConversionFunnelData } from '../../../hooks/useConversionFunnelData';
import {
  FunnelStage,
  Cohort,
  ConversionTrigger,
  EngagementMetric,
} from '../../../types/conversionFunnel';
import { DataStatusIndicator } from '../atoms/DataStatusIndicator';
import { LineChart } from '../charts/LineChart';
import { MetricCard } from '../metrics/MetricCard';

// Advanced funnel comparison component
const FunnelComparison: React.FC<{ stages: FunnelStage[] }> = ({ stages }) => {
  const [timeRange, setTimeRange] = useState('30d');

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h5 className="text-md font-medium">Funnel Performance</h5>
        <select
          value={timeRange}
          onChange={e => setTimeRange(e.target.value)}
          className="text-xs border rounded px-2 py-1"
        >
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="90d">Last 90 days</option>
        </select>
      </div>
      <div className="relative">
        {stages.map((stage, index) => (
          <div key={stage.name} className="mb-4">
            <div className="flex justify-between text-sm mb-1">
              <span className="font-medium">{stage.name}</span>
              <span className="text-gray-600">{stage.count.toLocaleString()} users</span>
            </div>
            <div className="relative h-12 bg-gray-100 rounded-lg overflow-hidden">
              <div
                className={`absolute top-0 left-0 h-full transition-all duration-500 ${
                  index === 0
                    ? 'bg-blue-500'
                    : index === 1
                      ? 'bg-green-500'
                      : index === 2
                        ? 'bg-yellow-500'
                        : 'bg-purple-500'
                }`}
                style={{ width: `${(stage.count / stages[0].count) * 100}%` }}
              />
              <div className="absolute inset-0 flex items-center justify-center text-white font-semibold">
                {stage.conversionRate}%
              </div>
              {index < stages.length - 1 && (
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-red-600 text-xs font-bold">
                  -{stage.dropOffRate}%
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export function ConversionFunnelWidget() {
  const { data, isLoading, error, refetch, isRealTime } = useConversionFunnelData(true);
  const [selectedCohort, setSelectedCohort] = useState<string | null>(null);

  return (
    <EnhancedWidget
      title="🔄 Conversion Funnel"
      subtitle="Trial to Paid Conversion Analytics"
      size="large"
      isLoading={isLoading}
      error={error}
      onRefresh={refetch}
      footer={
        <div className="flex justify-between items-center">
          <a href="/admin/conversion-analytics" className="text-blue-500 hover:underline text-sm">
            View detailed conversion analytics
          </a>
          <DataStatusIndicator
            isRealTime={isRealTime || false}
            lastUpdated={new Date().toISOString()}
            connectionStatus={!error}
          />
        </div>
      }
    >
      <div className="space-y-6">
        {/* Enhanced Funnel Visualization */}
        <div className="funnel-visualization-section">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <FunnelComparison stages={data?.funnelStages || []} />
            </div>
            <div>
              <h5 className="text-md font-medium mb-3">Key Metrics</h5>
              <div className="grid grid-cols-2 gap-3">
                <Tooltip content="Overall conversion from trial view to purchase">
                  <MetricCard
                    title="Total Conversion"
                    value={`${
                      data?.funnelStages
                        ? (
                            (data.funnelStages[data.funnelStages.length - 1].count /
                              data.funnelStages[0].count) *
                            100
                          ).toFixed(1)
                        : 0
                    }%`}
                    status="neutral"
                  />
                </Tooltip>
                <Tooltip content="Average time from trial to conversion">
                  <MetricCard
                    title="Avg Time to Convert"
                    value="14.2 days"
                    trend={{ direction: 'down', value: '-2.3d' }}
                    status="success"
                  />
                </Tooltip>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Cohort Analysis */}
        <div className="cohort-analysis-section">
          <div className="flex justify-between items-center mb-3">
            <h4 className="text-lg font-medium">Cohort Analysis</h4>
            <div className="flex gap-2">
              <select
                value={selectedCohort || ''}
                onChange={e => setSelectedCohort(e.target.value || null)}
                className="text-xs border rounded px-2 py-1"
              >
                <option value="">All Cohorts</option>
                {data?.cohorts.map(cohort => (
                  <option key={cohort.startDate} value={cohort.startDate}>
                    {new Date(cohort.startDate).toLocaleDateString()}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Cohort
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Size
                    </th>
                    {data?.cohorts[0]?.retentionRates.map((r: { day: number; rate: number }) => (
                      <th
                        key={r.day}
                        className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                      >
                        Day {r.day}
                      </th>
                    ))}
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Conversion
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {data?.cohorts
                    .filter(cohort => !selectedCohort || cohort.startDate === selectedCohort)
                    .map((cohort: Cohort) => (
                      <tr
                        key={cohort.startDate}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                          {new Date(cohort.startDate).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                          {cohort.size.toLocaleString()}
                        </td>
                        {cohort.retentionRates.map((retention: { day: number; rate: number }) => (
                          <td
                            key={retention.day}
                            className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300"
                          >
                            <div
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                retention.rate >= 70
                                  ? 'bg-green-100 text-green-800'
                                  : retention.rate >= 50
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {retention.rate}%
                            </div>
                          </td>
                        ))}
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                          <div
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              cohort.conversionRate >= 25
                                ? 'bg-green-100 text-green-800'
                                : cohort.conversionRate >= 20
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {cohort.conversionRate}%
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            <div>
              <h5 className="text-md font-medium mb-3">Retention Insights</h5>
              <div className="space-y-3">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                  <h6 className="text-sm font-semibold text-blue-800 dark:text-blue-200">
                    Best Performing Cohort
                  </h6>
                  <p className="text-sm text-blue-600 dark:text-blue-300">
                    {data?.cohorts.reduce(
                      (best, current) =>
                        current.conversionRate > best.conversionRate ? current : best,
                      data.cohorts[0]
                    )?.startDate
                      ? new Date(
                          data.cohorts.reduce(
                            (best, current) =>
                              current.conversionRate > best.conversionRate ? current : best,
                            data.cohorts[0]
                          ).startDate
                        ).toLocaleDateString()
                      : 'N/A'}{' '}
                    -{' '}
                    {
                      data?.cohorts.reduce(
                        (best, current) =>
                          current.conversionRate > best.conversionRate ? current : best,
                        data.cohorts[0]
                      ).conversionRate
                    }
                    % conversion
                  </p>
                </div>
                <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg">
                  <h6 className="text-sm font-semibold text-yellow-800 dark:text-yellow-200">
                    Day 7 Drop-off
                  </h6>
                  <p className="text-sm text-yellow-600 dark:text-yellow-300">
                    Average:{' '}
                    {data?.cohorts
                      ? (
                          data.cohorts.reduce((sum, cohort) => {
                            const day7 = cohort.retentionRates.find(r => r.day === 7);
                            return sum + (day7?.rate || 0);
                          }, 0) / data.cohorts.length
                        ).toFixed(1)
                      : 0}
                    % retention at day 7
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Conversion Triggers */}
        <div className="conversion-triggers-section">
          <h4 className="text-lg font-medium mb-3">Conversion Triggers</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-64">
              <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg h-full">
                <div className="space-y-4">
                  {data?.conversionTriggers.map((trigger: ConversionTrigger) => (
                    <div key={trigger.name} className="relative pt-1">
                      <div className="flex mb-2 items-center justify-between">
                        <div>
                          <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-blue-600 bg-blue-200">
                            {trigger.name}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-semibold inline-block text-blue-600">
                            {trigger.conversionImpact.toFixed(2)}
                          </span>
                        </div>
                      </div>
                      <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-blue-200">
                        <div
                          style={{ width: `${trigger.conversionImpact * 100}%` }}
                          className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="h-64 overflow-y-auto">
              <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg h-full">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Trigger
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Converted
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Non-Converted
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {data?.conversionTriggers.map((trigger: ConversionTrigger) => (
                      <tr key={trigger.name}>
                        <td className="px-3 py-2 whitespace-nowrap text-xs font-medium text-gray-900 dark:text-white">
                          {trigger.name}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500 dark:text-gray-300">
                          {trigger.convertedPercentage}%
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500 dark:text-gray-300">
                          {trigger.nonConvertedPercentage}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Engagement Score */}
        <div className="engagement-score-section">
          <h4 className="text-lg font-medium mb-3">Engagement Score</h4>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-1">
              <MetricCard
                title="Overall Engagement"
                value={data?.engagementScore.overallScore || 0}
                trend={data?.engagementScore.scoreTrend}
                status={
                  data?.engagementScore.overallScore >= data?.engagementScore.thresholds.high
                    ? 'success'
                    : data?.engagementScore.overallScore >= data?.engagementScore.thresholds.medium
                      ? 'warning'
                      : 'error'
                }
              />
            </div>
            <div className="md:col-span-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                {data?.engagementScore.metrics.map((metric: EngagementMetric) => (
                  <div
                    key={metric.name}
                    className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h6 className="text-xs font-medium text-gray-500 dark:text-gray-400">
                          {metric.name}
                        </h6>
                        <p className="text-lg font-semibold">{metric.value}</p>
                      </div>
                      <div className="flex items-center">
                        <span
                          className={`text-xs ${
                            metric.trend.direction === 'up'
                              ? 'text-green-500'
                              : metric.trend.direction === 'down'
                                ? 'text-red-500'
                                : 'text-gray-500'
                          }`}
                        >
                          {metric.trend.value}
                        </span>
                        <span className="text-xs text-gray-400 ml-2">({metric.weight}x)</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </EnhancedWidget>
  );
}
