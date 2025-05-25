import React from 'react';
import { EnhancedWidget } from './EnhancedWidget';
import { MetricCard } from '../metrics/MetricCard';
import { HorizontalBarChart } from '../charts/HorizontalBarChart';
import { PieChart } from '../charts/PieChart';
import { LineChart } from '../charts/LineChart';
import { RiskMatrix } from './RiskMatrix';
import { RecommendationsList } from './RecommendationsList';
import { TrendDirection } from '../metrics/MetricCard';
import { Tooltip } from '../../../components/ui/Tooltip';

// Data interfaces
interface SubscriptionAnalyticsData {
  revenueForecasting: {
    currentMonthRevenue: number;
    revenueTrend: { direction: TrendDirection; value: string };
    churnRate: number;
    churnRateTrend: { direction: TrendDirection; value: string };
    revenueByPlan: { name: string; value: number }[];
  };
  subscriptionHealth: {
    healthScore: number;
    healthScoreTrend: { direction: TrendDirection; value: string };
    retentionRate: number;
    retentionRateTrend: { direction: TrendDirection; value: string };
    subscriptionDistribution: { name: string; value: number }[];
  };
  riskAnalysis: {
    highRiskCount: number;
    highRiskCountTrend: { direction: TrendDirection; value: string };
    riskMatrix: {
      churnLikelihood: 'low' | 'medium' | 'high';
      impact: 'low' | 'medium' | 'high';
      count: number;
    }[];
  };
  subscriptionGrowth: {
    newSubscriptions: { date: string; count: number }[];
    totalGrowthRate: number;
    growthRateTrend: { direction: TrendDirection; value: string };
  };
  recommendations: {
    id: string;
    priority: 'low' | 'medium' | 'high';
    message: string;
    action: string;
  }[];
}

// Mock data for development
const mockData: SubscriptionAnalyticsData = {
  revenueForecasting: {
    currentMonthRevenue: 125750,
    revenueTrend: { direction: 'up', value: '+5.3%' },
    churnRate: 3.2,
    churnRateTrend: { direction: 'down', value: '-0.5%' },
    revenueByPlan: [
      { name: 'Premium Annual', value: 68250 },
      { name: 'Premium Monthly', value: 42500 },
      { name: 'Basic Annual', value: 9500 },
      { name: 'Basic Monthly', value: 5500 },
    ],
  },
  subscriptionHealth: {
    healthScore: 87,
    healthScoreTrend: { direction: 'up', value: '+2.1' },
    retentionRate: 92.5,
    retentionRateTrend: { direction: 'up', value: '+1.2%' },
    subscriptionDistribution: [
      { name: 'Premium Annual', value: 450 },
      { name: 'Premium Monthly', value: 850 },
      { name: 'Basic Annual', value: 190 },
      { name: 'Basic Monthly', value: 275 },
    ],
  },
  riskAnalysis: {
    highRiskCount: 87,
    highRiskCountTrend: { direction: 'down', value: '-12' },
    riskMatrix: [
      { churnLikelihood: 'high', impact: 'high', count: 32 },
      { churnLikelihood: 'high', impact: 'medium', count: 45 },
      { churnLikelihood: 'high', impact: 'low', count: 10 },
      { churnLikelihood: 'medium', impact: 'high', count: 28 },
      { churnLikelihood: 'medium', impact: 'medium', count: 120 },
      { churnLikelihood: 'medium', impact: 'low', count: 95 },
      { churnLikelihood: 'low', impact: 'high', count: 15 },
      { churnLikelihood: 'low', impact: 'medium', count: 210 },
      { churnLikelihood: 'low', impact: 'low', count: 1210 },
    ],
  },
  subscriptionGrowth: {
    newSubscriptions: [
      { date: '2025-04-23', count: 42 },
      { date: '2025-04-24', count: 38 },
      { date: '2025-04-25', count: 45 },
      { date: '2025-04-26', count: 39 },
      { date: '2025-04-27', count: 35 },
      { date: '2025-04-28', count: 52 },
      { date: '2025-04-29', count: 48 },
      { date: '2025-04-30', count: 51 },
      { date: '2025-05-01', count: 55 },
      { date: '2025-05-02', count: 49 },
      { date: '2025-05-03', count: 42 },
      { date: '2025-05-04', count: 40 },
      { date: '2025-05-05', count: 45 },
      { date: '2025-05-06', count: 53 },
      { date: '2025-05-07', count: 58 },
      { date: '2025-05-08', count: 62 },
      { date: '2025-05-09', count: 65 },
      { date: '2025-05-10', count: 59 },
      { date: '2025-05-11', count: 54 },
      { date: '2025-05-12', count: 57 },
      { date: '2025-05-13', count: 63 },
      { date: '2025-05-14', count: 68 },
      { date: '2025-05-15', count: 72 },
      { date: '2025-05-16', count: 75 },
      { date: '2025-05-17', count: 70 },
      { date: '2025-05-18', count: 65 },
      { date: '2025-05-19', count: 68 },
      { date: '2025-05-20', count: 74 },
      { date: '2025-05-21', count: 79 },
      { date: '2025-05-22', count: 82 },
      { date: '2025-05-23', count: 85 },
    ],
    totalGrowthRate: 8.5,
    growthRateTrend: { direction: 'up', value: '+2.3%' },
  },
  recommendations: [
    {
      id: 'rec-001',
      priority: 'high',
      message: 'Contact 32 high-risk premium subscribers at risk of churning',
      action: 'Generate contact list',
    },
    {
      id: 'rec-002',
      priority: 'medium',
      message: 'Offer discounted annual plan to 45 monthly subscribers with high churn risk',
      action: 'Create campaign',
    },
    {
      id: 'rec-003',
      priority: 'medium',
      message: 'Review pricing strategy for Basic Monthly plan with declining conversion',
      action: 'View analysis',
    },
    {
      id: 'rec-004',
      priority: 'low',
      message: 'Consider loyalty rewards for 210 medium-risk subscribers',
      action: 'Plan rewards',
    },
  ],
};

// Custom hook for data fetching
const useSubscriptionAnalyticsData = () => {
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

export function EnhancedSubscriptionAnalyticsWidget() {
  const { data, isLoading, error, refetch } = useSubscriptionAnalyticsData();

  const handleRecommendationAction = (id: string, action: string) => {
    console.log(`Action ${action} clicked for recommendation ${id}`);
    // This would be replaced with actual action handling
  };

  return (
    <EnhancedWidget
      title="💰 Subscription Analytics"
      subtitle="Last 30 days"
      size="large"
      isLoading={isLoading}
      error={error}
      onRefresh={refetch}
      footer={
        <a href="/analytics/subscriptions" className="text-blue-500 hover:underline text-sm">
          View detailed subscription analytics
        </a>
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
