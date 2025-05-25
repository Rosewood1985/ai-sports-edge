/**
 * Atomic Organism: Enhanced Subscription Analytics Widget
 * Complex analytics widget with comprehensive null safety
 * Location: /atomic/organisms/widgets/EnhancedSubscriptionAnalyticsWidget.tsx
 */
import React from 'react';
import { LineChart } from '../../molecules/charts';

interface AnalyticsData {
  revenueForecasting?: {
    currentMonthRevenue?: number;
    churnRate?: number;
    projectedRevenue?: number;
  };
  subscriptionHealth?: {
    healthScore?: number;
    retentionRate?: number;
    activeSubscriptions?: number;
  };
  trends?: Array<{
    date: string;
    count: number;
  }>;
}

interface EnhancedSubscriptionAnalyticsWidgetProps {
  data?: AnalyticsData;
  className?: string;
  isLoading?: boolean;
}

export function EnhancedSubscriptionAnalyticsWidget({
  data,
  className = '',
  isLoading = false
}: EnhancedSubscriptionAnalyticsWidgetProps) {
  
  if (isLoading) {
    return (
      <div className={`enhanced-subscription-analytics-widget ${className}`}>
        <div className="animate-pulse p-6">
          <div className="h-4 bg-gray-300 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-300 rounded"></div>
            ))}
          </div>
          <div className="h-48 bg-gray-300 rounded"></div>
        </div>
      </div>
    );
  }

  // Safe access with null coalescing
  const revenueData = data?.revenueForecasting;
  const healthData = data?.subscriptionHealth;
  const trendsData = data?.trends || [];

  return (
    <div className={`enhanced-subscription-analytics-widget ${className}`}>
      <div className="p-6">
        <h3 className="text-lg font-semibold mb-6">Subscription Analytics</h3>
        
        {/* Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {/* Current Month Revenue */}
          <div className="metric-card p-4 bg-white rounded-lg shadow">
            <div className="text-sm text-gray-600">Current Month Revenue</div>
            <div className="text-2xl font-bold text-green-600">
              {`$${(revenueData?.currentMonthRevenue ?? 0).toLocaleString()}`}
            </div>
          </div>

          {/* Churn Rate */}
          <div className="metric-card p-4 bg-white rounded-lg shadow">
            <div className="text-sm text-gray-600">Churn Rate</div>
            <div className="text-2xl font-bold text-red-600">
              {`${(revenueData?.churnRate ?? 0).toFixed(1)}%`}
            </div>
          </div>

          {/* Health Score */}
          <div className="metric-card p-4 bg-white rounded-lg shadow">
            <div className="text-sm text-gray-600">Health Score</div>
            <div className="text-2xl font-bold text-blue-600">
              {(healthData?.healthScore ?? 0).toFixed(1)}
            </div>
          </div>

          {/* Retention Rate */}
          <div className="metric-card p-4 bg-white rounded-lg shadow">
            <div className="text-sm text-gray-600">Retention Rate</div>
            <div className="text-2xl font-bold text-green-600">
              {`${(healthData?.retentionRate ?? 0).toFixed(1)}%`}
            </div>
          </div>
        </div>

        {/* Trends Chart */}
        <div className="chart-container bg-white rounded-lg shadow p-6">
          <h4 className="text-md font-semibold mb-4">Subscription Trends</h4>
          <LineChart
            data={trendsData}
            height={200}
            lineColor="#3B82F6"
            areaColor="rgba(59, 130, 246, 0.1)"
            showPoints={true}
            showLabels={true}
          />
        </div>

        {/* Recommendations */}
        <div className="recommendations mt-6">
          <h4 className="text-md font-semibold mb-4">Recommendations</h4>
          <div className="space-y-2">
            {(revenueData?.churnRate ?? 0) > 5 && (
              <div className="recommendation-item p-3 bg-yellow-50 border-l-4 border-yellow-400">
                <p className="text-sm text-yellow-800">
                  Churn rate is above 5%. Consider implementing retention campaigns.
                </p>
              </div>
            )}
            {(healthData?.healthScore ?? 0) < 70 && (
              <div className="recommendation-item p-3 bg-red-50 border-l-4 border-red-400">
                <p className="text-sm text-red-800">
                  Health score is below 70. Review customer satisfaction metrics.
                </p>
              </div>
            )}
            {(healthData?.retentionRate ?? 0) > 90 && (
              <div className="recommendation-item p-3 bg-green-50 border-l-4 border-green-400">
                <p className="text-sm text-green-800">
                  Excellent retention rate! Consider upselling opportunities.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}