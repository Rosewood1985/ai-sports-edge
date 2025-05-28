/**
 * Atomic Organism: Enhanced Subscription Analytics Widget
 * Complex analytics widget with comprehensive null safety
 * Location: /atomic/organisms/widgets/EnhancedSubscriptionAnalyticsWidget.tsx
 */
import React, { memo, useMemo } from 'react';
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

export const EnhancedSubscriptionAnalyticsWidget = memo<EnhancedSubscriptionAnalyticsWidgetProps>(
  ({ data, className = '', isLoading = false }: EnhancedSubscriptionAnalyticsWidgetProps) => {
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

    // Memoize calculations for performance
    const { revenueData, healthData, trendsData, recommendations } = useMemo(() => {
      const revenueData = data?.revenueForecasting;
      const healthData = data?.subscriptionHealth;
      const trendsData = data?.trends || [];

      // Pre-calculate recommendations
      const recommendations = [];
      if ((revenueData?.churnRate ?? 0) > 5) {
        recommendations.push({
          type: 'warning',
          message: 'Churn rate is above 5%. Consider implementing retention campaigns.',
        });
      }
      if ((healthData?.healthScore ?? 0) < 70) {
        recommendations.push({
          type: 'error',
          message: 'Health score is below 70. Review customer satisfaction metrics.',
        });
      }
      if ((healthData?.retentionRate ?? 0) > 90) {
        recommendations.push({
          type: 'success',
          message: 'Excellent retention rate! Consider upselling opportunities.',
        });
      }

      return { revenueData, healthData, trendsData, recommendations };
    }, [data]);

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
          {recommendations.length > 0 && (
            <div className="recommendations mt-6">
              <h4 className="text-md font-semibold mb-4">Recommendations</h4>
              <div className="space-y-2">
                {recommendations.map((rec, index) => (
                  <div
                    key={index}
                    className={`recommendation-item p-3 border-l-4 ${
                      rec.type === 'warning'
                        ? 'bg-yellow-50 border-yellow-400'
                        : rec.type === 'error'
                          ? 'bg-red-50 border-red-400'
                          : 'bg-green-50 border-green-400'
                    }`}
                  >
                    <p
                      className={`text-sm ${
                        rec.type === 'warning'
                          ? 'text-yellow-800'
                          : rec.type === 'error'
                            ? 'text-red-800'
                            : 'text-green-800'
                      }`}
                    >
                      {rec.message}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  },
  (prevProps, nextProps) => {
    // Custom comparison for performance optimization
    return (
      JSON.stringify(prevProps.data) === JSON.stringify(nextProps.data) &&
      prevProps.isLoading === nextProps.isLoading &&
      prevProps.className === nextProps.className
    );
  }
);
