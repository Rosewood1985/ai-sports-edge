import React from 'react';
import { EnhancedWidget } from './EnhancedWidget';
import { MetricCard } from '../metrics/MetricCard';
import { LineChart } from '../charts/LineChart';
import { useConversionFunnelData } from '../../../hooks/useConversionFunnelData';
import {
  FunnelStage,
  Cohort,
  ConversionTrigger,
  EngagementMetric,
} from '../../../types/conversionFunnel';

export function ConversionFunnelWidget() {
  const { data, isLoading, error, refetch } = useConversionFunnelData();

  return (
    <EnhancedWidget
      title="🔄 Conversion Funnel"
      subtitle="Trial to Paid Conversion Analytics"
      size="large"
      isLoading={isLoading}
      error={error}
      onRefresh={refetch}
      footer={
        <a href="/admin/conversion-analytics" className="text-blue-500 hover:underline text-sm">
          View detailed conversion analytics
        </a>
      }
    >
      <div className="space-y-6">
        {/* Funnel Visualization */}
        <div className="funnel-visualization-section">
          <h4 className="text-lg font-medium mb-3">Conversion Path</h4>
          <div className="space-y-2">
            {data?.funnelStages.map((stage: FunnelStage, index: number) => {
              const width = `${(stage.count / data.funnelStages[0].count) * 100}%`;
              const isLast = index === data.funnelStages.length - 1;

              return (
                <div key={stage.name} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>{stage.name}</span>
                    <span>{stage.count.toLocaleString()} users</span>
                  </div>
                  <div className="relative h-10">
                    <div
                      className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-md"
                      style={{ width }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center text-white text-sm font-medium">
                      {stage.conversionRate}%
                    </div>
                  </div>
                  {!isLast && (
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>↓ {stage.dropOffRate}% drop off</span>
                      <span>{data.funnelStages[index + 1].conversionRate}% continue</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Cohort Analysis */}
        <div className="cohort-analysis-section">
          <h4 className="text-lg font-medium mb-3">Cohort Analysis</h4>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Cohort
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Size
                  </th>
                  {data?.cohorts[0]?.retentionRates.map((r: { day: number; rate: number }) => (
                    <th
                      key={r.day}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                    >
                      Day {r.day}
                    </th>
                  ))}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Conversion
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {data?.cohorts.map((cohort: Cohort) => (
                  <tr key={cohort.startDate}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {new Date(cohort.startDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                      {cohort.size.toLocaleString()}
                    </td>
                    {cohort.retentionRates.map((retention: { day: number; rate: number }) => (
                      <td
                        key={retention.day}
                        className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300"
                      >
                        {retention.rate}%
                      </td>
                    ))}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                      {cohort.conversionRate}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
                        ></div>
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
