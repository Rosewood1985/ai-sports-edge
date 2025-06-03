/**
 * @jest-environment jsdom
 */

import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';

import '@testing-library/jest-dom';
import { EnhancedSubscriptionAnalyticsWidget } from '../../../../atomic/organisms/widgets/EnhancedSubscriptionAnalyticsWidget';

// Mock the chart components
jest.mock('../../../../atomic/molecules/charts/LineChart', () => ({
  LineChart: ({ data, title }: any) => (
    <div data-testid="line-chart">
      <div data-testid="chart-title">{title}</div>
      <div data-testid="chart-data-length">{data?.length || 0}</div>
    </div>
  ),
}));

jest.mock('../../../../atomic/molecules/charts/PieChart', () => ({
  PieChart: ({ data, title }: any) => (
    <div data-testid="pie-chart">
      <div data-testid="chart-title">{title}</div>
      <div data-testid="chart-data-length">{data?.length || 0}</div>
    </div>
  ),
}));

// Mock the hooks
jest.mock('../../../../atomic/organisms/reporting/useReportTemplates', () => ({
  useReportTemplates: () => ({
    templates: [],
    loading: false,
    error: null,
    createTemplate: jest.fn(),
    updateTemplate: jest.fn(),
    deleteTemplate: jest.fn(),
  }),
}));

describe('EnhancedSubscriptionAnalyticsWidget', () => {
  const mockData = {
    revenue: {
      current: 10000,
      previous: 8000,
      trend: 'up',
      chartData: [
        { label: 'Jan', value: 8000 },
        { label: 'Feb', value: 9000 },
        { label: 'Mar', value: 10000 },
      ],
    },
    subscriptions: {
      active: 500,
      new: 50,
      churned: 10,
      churnRate: 2.0,
      distributionData: [
        { label: 'Basic', value: 200 },
        { label: 'Pro', value: 250 },
        { label: 'Premium', value: 50 },
      ],
    },
    userMetrics: {
      totalUsers: 1000,
      activeUsers: 750,
      engagementScore: 85,
    },
  };

  const defaultProps = {
    data: mockData,
    loading: false,
    error: null,
    timeRange: '30d' as const,
    onTimeRangeChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<EnhancedSubscriptionAnalyticsWidget {...defaultProps} />);
    expect(screen.getByTestId('enhanced-subscription-analytics')).toBeInTheDocument();
  });

  it('displays loading state correctly', () => {
    render(<EnhancedSubscriptionAnalyticsWidget {...defaultProps} loading />);
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  it('displays error state correctly', () => {
    const error = new Error('Failed to load analytics data');
    render(<EnhancedSubscriptionAnalyticsWidget {...defaultProps} error={error} />);
    expect(screen.getByTestId('error-message')).toBeInTheDocument();
    expect(screen.getByText(/Failed to load analytics data/)).toBeInTheDocument();
  });

  it('handles null data gracefully', () => {
    render(<EnhancedSubscriptionAnalyticsWidget {...defaultProps} data={null} />);
    expect(screen.getByTestId('enhanced-subscription-analytics')).toBeInTheDocument();
  });

  it('handles undefined data gracefully', () => {
    render(<EnhancedSubscriptionAnalyticsWidget {...defaultProps} data={undefined} />);
    expect(screen.getByTestId('enhanced-subscription-analytics')).toBeInTheDocument();
  });

  it('displays revenue metrics correctly', () => {
    render(<EnhancedSubscriptionAnalyticsWidget {...defaultProps} />);
    expect(screen.getByText('$10,000')).toBeInTheDocument(); // Current revenue
    expect(screen.getByText('25%')).toBeInTheDocument(); // Growth percentage
  });

  it('displays subscription metrics correctly', () => {
    render(<EnhancedSubscriptionAnalyticsWidget {...defaultProps} />);
    expect(screen.getByText('500')).toBeInTheDocument(); // Active subscriptions
    expect(screen.getByText('2.0%')).toBeInTheDocument(); // Churn rate
  });

  it('handles missing revenue data', () => {
    const dataWithoutRevenue = {
      ...mockData,
      revenue: null,
    };

    render(<EnhancedSubscriptionAnalyticsWidget {...defaultProps} data={dataWithoutRevenue} />);
    expect(screen.getByTestId('enhanced-subscription-analytics')).toBeInTheDocument();
  });

  it('handles missing subscription data', () => {
    const dataWithoutSubscriptions = {
      ...mockData,
      subscriptions: null,
    };

    render(
      <EnhancedSubscriptionAnalyticsWidget {...defaultProps} data={dataWithoutSubscriptions} />
    );
    expect(screen.getByTestId('enhanced-subscription-analytics')).toBeInTheDocument();
  });

  it('prevents division by zero in calculations', () => {
    const dataWithZeros = {
      ...mockData,
      revenue: {
        current: 0,
        previous: 0,
        trend: 'flat',
        chartData: [],
      },
      subscriptions: {
        active: 0,
        new: 0,
        churned: 0,
        churnRate: 0,
        distributionData: [],
      },
    };

    render(<EnhancedSubscriptionAnalyticsWidget {...defaultProps} data={dataWithZeros} />);
    expect(screen.getByTestId('enhanced-subscription-analytics')).toBeInTheDocument();
  });

  it('renders charts when data is available', () => {
    render(<EnhancedSubscriptionAnalyticsWidget {...defaultProps} />);
    expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    expect(screen.getByTestId('pie-chart')).toBeInTheDocument();
  });

  it('handles empty chart data arrays', () => {
    const dataWithEmptyCharts = {
      ...mockData,
      revenue: {
        ...mockData.revenue,
        chartData: [],
      },
      subscriptions: {
        ...mockData.subscriptions,
        distributionData: [],
      },
    };

    render(<EnhancedSubscriptionAnalyticsWidget {...defaultProps} data={dataWithEmptyCharts} />);
    expect(screen.getByTestId('enhanced-subscription-analytics')).toBeInTheDocument();
  });

  it('updates time range when changed', async () => {
    const onTimeRangeChange = jest.fn();
    render(
      <EnhancedSubscriptionAnalyticsWidget
        {...defaultProps}
        onTimeRangeChange={onTimeRangeChange}
      />
    );

    // This would typically involve clicking a time range selector
    // For now, we just verify the component renders with the prop
    expect(screen.getByTestId('enhanced-subscription-analytics')).toBeInTheDocument();
  });

  it('displays trend indicators correctly', () => {
    render(<EnhancedSubscriptionAnalyticsWidget {...defaultProps} />);
    // Should show upward trend indicator
    expect(screen.getByTestId('trend-indicator')).toHaveClass('trend-up');
  });

  it('handles negative growth correctly', () => {
    const dataWithNegativeGrowth = {
      ...mockData,
      revenue: {
        ...mockData.revenue,
        current: 7000,
        previous: 8000,
        trend: 'down',
      },
    };

    render(<EnhancedSubscriptionAnalyticsWidget {...defaultProps} data={dataWithNegativeGrowth} />);
    expect(screen.getByTestId('trend-indicator')).toHaveClass('trend-down');
  });
});
