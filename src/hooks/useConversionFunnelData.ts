import { useState, useEffect } from 'react';
import { ConversionFunnelData } from '../types/conversionFunnel';
import { TrendDirection } from '../components/dashboard/metrics/MetricCard';
import useSWR from 'swr';

// Mock data for development
const mockConversionFunnelData: ConversionFunnelData = {
  funnelStages: [
    { name: 'Trial View', count: 10000, conversionRate: 100, dropOffRate: 30 },
    { name: 'Trial Signup', count: 7000, conversionRate: 70, dropOffRate: 40 },
    { name: 'Feature Usage', count: 4200, conversionRate: 60, dropOffRate: 50 },
    { name: 'Subscription Purchase', count: 2100, conversionRate: 50, dropOffRate: 0 },
  ],
  cohorts: [
    {
      startDate: '2025-05-01',
      size: 2500,
      conversionRate: 22,
      retentionRates: [
        { day: 1, rate: 80 },
        { day: 3, rate: 65 },
        { day: 7, rate: 45 },
        { day: 14, rate: 30 },
        { day: 30, rate: 25 },
      ],
    },
    {
      startDate: '2025-05-08',
      size: 2800,
      conversionRate: 24,
      retentionRates: [
        { day: 1, rate: 82 },
        { day: 3, rate: 68 },
        { day: 7, rate: 48 },
        { day: 14, rate: 32 },
        { day: 30, rate: 26 },
      ],
    },
    {
      startDate: '2025-05-15',
      size: 3200,
      conversionRate: 26,
      retentionRates: [
        { day: 1, rate: 85 },
        { day: 3, rate: 70 },
        { day: 7, rate: 50 },
        { day: 14, rate: 35 },
        { day: 30, rate: 28 },
      ],
    },
  ],
  conversionTriggers: [
    {
      name: 'Used AI Predictions',
      conversionImpact: 0.85,
      convertedPercentage: 78,
      nonConvertedPercentage: 35,
    },
    {
      name: 'Viewed Betting History',
      conversionImpact: 0.72,
      convertedPercentage: 65,
      nonConvertedPercentage: 30,
    },
    {
      name: 'Set Favorite Teams',
      conversionImpact: 0.68,
      convertedPercentage: 62,
      nonConvertedPercentage: 28,
    },
    {
      name: 'Enabled Notifications',
      conversionImpact: 0.55,
      convertedPercentage: 58,
      nonConvertedPercentage: 32,
    },
    {
      name: 'Completed Profile',
      conversionImpact: 0.48,
      convertedPercentage: 52,
      nonConvertedPercentage: 25,
    },
  ],
  engagementScore: {
    overallScore: 72,
    scoreTrend: { direction: 'up', value: '+5' },
    metrics: [
      {
        name: 'Session Duration',
        value: 8.5,
        weight: 2.0,
        trend: { direction: 'up', value: '+1.2' },
      },
      {
        name: 'Sessions per Week',
        value: 4.2,
        weight: 1.5,
        trend: { direction: 'up', value: '+0.8' },
      },
      { name: 'Feature Usage', value: 65, weight: 1.8, trend: { direction: 'up', value: '+12%' } },
      { name: 'Retention Rate', value: 78, weight: 2.5, trend: { direction: 'up', value: '+5%' } },
      {
        name: 'Notification Open Rate',
        value: 42,
        weight: 1.0,
        trend: { direction: 'down', value: '-3%' },
      },
      {
        name: 'Social Shares',
        value: 1.2,
        weight: 0.8,
        trend: { direction: 'stable' as TrendDirection, value: '0%' },
      },
    ],
    thresholds: {
      low: 40,
      medium: 60,
      high: 80,
    },
  },
};

// API response interface
interface ApiResponse<T> {
  data: T;
  status: number;
  message: string;
}

// API fetcher function
const fetcher = async <T>(url: string): Promise<T> => {
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('adminToken')}`,
      },
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('API fetch error:', error);
    throw error;
  }
};

export function useConversionFunnelData(shouldFetch = true) {
  const { data, error, mutate } = useSWR<ApiResponse<ConversionFunnelData>>(
    shouldFetch ? '/api/admin/conversion-funnel' : null,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 30000, // 30 seconds
    }
  );

  // Use mock data for development or when API fails
  const [mockData, setMockData] = useState<ConversionFunnelData>(mockConversionFunnelData);

  // For development, simulate API call with mock data
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && !data && !error) {
      const timer = setTimeout(() => {
        mutate({ data: mockData, status: 200, message: 'Success' } as any, false);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [data, error, mockData, mutate]);

  return {
    data: data?.data || mockData,
    isLoading: !error && !data,
    error,
    refetch: () => mutate(),
  };
}
