import React from 'react';

import { EnhancedWidget } from './EnhancedWidget';
import { RecommendationsList } from './RecommendationsList';
import { RiskMatrix } from './RiskMatrix';
import { Tooltip } from '../../../components/ui/Tooltip';
import {
  useSubscriptionAnalyticsData,
  SubscriptionAnalyticsData,
} from '../../../services/adminDashboardService';
import { DataStatusIndicator } from '../atoms/DataStatusIndicator';
import { HorizontalBarChart } from '../charts/HorizontalBarChart';
import { LineChart } from '../charts/LineChart';
import { PieChart } from '../charts/PieChart';
import { TrendDirection, MetricCard } from '../metrics/MetricCard';

// Real-time recommendation action handler
const useRecommendationActions = () => {
  const handleRecommendationAction = async (id: string, action: string) => {
    try {
      const response = await fetch('/api/admin/execute-recommendation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('adminToken')}`,
        },
        body: JSON.stringify({ id, action }),
      });

      if (!response.ok) {
        throw new Error(`Failed to execute action: ${response.statusText}`);
      }

      return true;
    } catch (error) {
      console.error('Error executing recommendation action:', error);
      return false;
    }
  };

  return { handleRecommendationAction };
};

export function EnhancedSubscriptionAnalyticsWidget() {
  const { data, isLoading, error, refetch, isRealTime } = useSubscriptionAnalyticsData(true);
  const { handleRecommendationAction } = useRecommendationActions();

  return (
    <EnhancedWidget
      title="💰 Subscription Analytics"
      subtitle="Last 30 days"
      size="large"
      isLoading={isLoading}
      error={error}
      onRefresh={refetch}
      footer={
        <div className="flex justify-between items-center">
          <a href="/analytics/subscriptions" className="text-blue-500 hover:underline text-sm">
            View detailed subscription analytics
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
        {/* Revenue Forecasting Section */}
        <div className="revenue-forecasting-section">
          <h4 className="text-lg font-medium mb-3">Revenue Forecasting</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Tooltip content="Projected revenue for the current month">
              <MetricCard
                title="Projected Revenue"
                value={`$${(data?.revenueForecasting?.currentMonthRevenue ?? 0).toLocaleString()}`}
                trend={data?.revenueForecasting.revenueTrend}
                status={
                  data?.revenueForecasting.revenueTrend.direction === 'up' ? 'success' : 'warning'
                }
              />
            </Tooltip>
            <Tooltip content="Percentage of subscribers expected to cancel this month">
              <MetricCard
                title="Churn Rate"
                value={`${(data?.revenueForecasting?.churnRate ?? 0).toFixed(1)}%`}
                trend={data?.revenueForecasting.churnRateTrend}
                status={
                  data?.revenueForecasting.churnRateTrend.direction === 'down' ? 'success' : 'error'
                }
              />
            </Tooltip>
          </div>
          <div className="mt-4">
            <h5 className="text-md font-medium mb-2">Revenue by Plan</h5>
            <HorizontalBarChart data={data?.revenueForecasting.revenueByPlan} />
          </div>
        </div>

        {/* Subscription Health Section */}
        <div className="subscription-health-section mt-6">
          <h4 className="text-lg font-medium mb-3">Subscription Health</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Tooltip content="Overall health score based on retention, growth, and engagement">
              <MetricCard
                title="Health Score"
                value={(data?.subscriptionHealth?.healthScore ?? 0).toFixed(1)}
                target="85+"
                trend={data?.subscriptionHealth.healthScoreTrend}
                status={data?.subscriptionHealth.healthScore >= 85 ? 'success' : 'warning'}
              />
            </Tooltip>
            <Tooltip content="Percentage of subscribers who renew their subscription">
              <MetricCard
                title="Retention Rate"
                value={`${(data?.subscriptionHealth?.retentionRate ?? 0).toFixed(1)}%`}
                target="90%+"
                trend={data?.subscriptionHealth.retentionRateTrend}
                status={data?.subscriptionHealth.retentionRate >= 90 ? 'success' : 'warning'}
              />
            </Tooltip>
          </div>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h5 className="text-md font-medium mb-2">Subscription Distribution</h5>
              <PieChart data={data?.subscriptionHealth.subscriptionDistribution} />
            </div>
          </div>
        </div>

        {/* Subscription Growth Section */}
        <div className="subscription-growth-section mt-6">
          <h4 className="text-lg font-medium mb-3">Subscription Growth</h4>
          <div className="grid grid-cols-1 md:grid-cols-1 gap-4 mb-4">
            <Tooltip content="Monthly growth rate of new subscriptions">
              <MetricCard
                title="Growth Rate"
                value={`${data?.subscriptionGrowth.totalGrowthRate}%`}
                trend={data?.subscriptionGrowth.growthRateTrend}
                status={
                  data?.subscriptionGrowth.growthRateTrend.direction === 'up'
                    ? 'success'
                    : 'warning'
                }
              />
            </Tooltip>
          </div>
          <div>
            <h5 className="text-md font-medium mb-2">New Subscriptions Trend</h5>
            <div className="h-64">
              <LineChart data={data?.subscriptionGrowth.newSubscriptions} height={250} />
            </div>
          </div>
        </div>

        {/* Risk Analysis Section */}
        <div className="risk-analysis-section mt-6">
          <h4 className="text-lg font-medium mb-3">Risk Analysis</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Tooltip content="Number of subscribers at high risk of churning">
              <MetricCard
                title="High Risk Subscribers"
                value={data?.riskAnalysis.highRiskCount}
                trend={data?.riskAnalysis.highRiskCountTrend}
                status={
                  data?.riskAnalysis.highRiskCountTrend.direction === 'down' ? 'success' : 'error'
                }
              />
            </Tooltip>
          </div>
          <div className="mt-4">
            <h5 className="text-md font-medium mb-2">Subscriber Risk Matrix</h5>
            <RiskMatrix data={data?.riskAnalysis.riskMatrix} />
          </div>
        </div>

        {/* Recommendations Section */}
        <div className="recommendations-section mt-6">
          <h4 className="text-lg font-medium mb-3">Recommended Actions</h4>
          <RecommendationsList
            recommendations={data?.recommendations}
            onActionClick={handleRecommendationAction}
          />
        </div>
      </div>
    </EnhancedWidget>
  );
}
