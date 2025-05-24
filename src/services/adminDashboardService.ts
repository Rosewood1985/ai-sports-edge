import { TrendDirection } from '../components/dashboard/metrics/MetricCard';
import { useEffect, useState } from 'react';
import useSWR from 'swr';

// API response interfaces
export interface ApiResponse<T> {
  data: T;
  status: number;
  message: string;
}

// BetSlip Performance Data
export interface BetSlipPerformanceData {
  ocrSuccessRate: number;
  ocrSuccessRateTrend: { direction: TrendDirection; value: string };
  averageProcessingTime: number;
  averageProcessingTimeTrend: { direction: TrendDirection; value: string };
  errorRate: number;
  errorRateTrend: { direction: TrendDirection; value: string };
  betTypeDistribution: { name: string; value: number }[];
  errorTypeDistribution: { name: string; value: number }[];
  dailyVolume: { date: string; count: number }[];
}

// Subscription Analytics Data
export interface SubscriptionAnalyticsData {
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

// System Health Data
export interface SystemHealthData {
  apiPerformance: {
    responseTime: number;
    responseTimeTrend: { direction: TrendDirection; value: string };
    errorRate: number;
    errorRateTrend: { direction: TrendDirection; value: string };
    requestsPerMinute: number;
    requestsPerMinuteTrend: { direction: TrendDirection; value: string };
    endpointPerformance: { name: string; value: number }[];
  };
  databasePerformance: {
    queryTime: number;
    queryTimeTrend: { direction: TrendDirection; value: string };
    readOperations: number;
    readOperationsTrend: { direction: TrendDirection; value: string };
    writeOperations: number;
    writeOperationsTrend: { direction: TrendDirection; value: string };
    collectionPerformance: { name: string; value: number }[];
  };
  infrastructureCosts: {
    totalCost: number;
    totalCostTrend: { direction: TrendDirection; value: string };
    costByService: { name: string; value: number }[];
    costHistory: { date: string; count: number }[];
  };
  backgroundProcesses: {
    activeProcesses: number;
    activeProcessesTrend: { direction: TrendDirection; value: string };
    failedProcesses: number;
    failedProcessesTrend: { direction: TrendDirection; value: string };
    processStatus: {
      id: string;
      name: string;
      status: 'running' | 'completed' | 'failed' | 'pending';
      lastRun: string;
      duration: number;
    }[];
  };
  systemActions: {
    id: string;
    timestamp: string;
    action: string;
    status: 'success' | 'warning' | 'error';
    details: string;
  }[];
}

// Mock data for development
const mockBetSlipPerformanceData: BetSlipPerformanceData = {
  ocrSuccessRate: 94.5,
  ocrSuccessRateTrend: { direction: 'up', value: '+2.3%' },
  averageProcessingTime: 1.2,
  averageProcessingTimeTrend: { direction: 'down', value: '-0.3s' },
  errorRate: 5.5,
  errorRateTrend: { direction: 'down', value: '-2.3%' },
  betTypeDistribution: [
    { name: 'Moneyline', value: 45 },
    { name: 'Spread', value: 30 },
    { name: 'Over/Under', value: 15 },
    { name: 'Parlay', value: 10 },
  ],
  errorTypeDistribution: [
    { name: 'Image Quality', value: 40 },
    { name: 'Text Recognition', value: 30 },
    { name: 'Odds Format', value: 20 },
    { name: 'Other', value: 10 },
  ],
  dailyVolume: [
    { date: '2025-05-17', count: 1250 },
    { date: '2025-05-18', count: 1300 },
    { date: '2025-05-19', count: 1275 },
    { date: '2025-05-20', count: 1350 },
    { date: '2025-05-21', count: 1400 },
    { date: '2025-05-22', count: 1450 },
    { date: '2025-05-23', count: 1500 },
  ],
};

const mockSubscriptionAnalyticsData: SubscriptionAnalyticsData = {
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

const mockSystemHealthData: SystemHealthData = {
  apiPerformance: {
    responseTime: 156,
    responseTimeTrend: { direction: 'down', value: '-12ms' },
    errorRate: 0.8,
    errorRateTrend: { direction: 'down', value: '-0.3%' },
    requestsPerMinute: 342,
    requestsPerMinuteTrend: { direction: 'up', value: '+28' },
    endpointPerformance: [
      { name: '/api/users', value: 210 },
      { name: '/api/predictions', value: 185 },
      { name: '/api/games', value: 145 },
      { name: '/api/subscriptions', value: 120 },
      { name: '/api/analytics', value: 95 },
    ],
  },
  databasePerformance: {
    queryTime: 68,
    queryTimeTrend: { direction: 'down', value: '-5ms' },
    readOperations: 1250,
    readOperationsTrend: { direction: 'up', value: '+120' },
    writeOperations: 380,
    writeOperationsTrend: { direction: 'up', value: '+45' },
    collectionPerformance: [
      { name: 'users', value: 45 },
      { name: 'predictions', value: 72 },
      { name: 'games', value: 58 },
      { name: 'subscriptions', value: 65 },
      { name: 'analytics', value: 85 },
    ],
  },
  infrastructureCosts: {
    totalCost: 1250.75,
    totalCostTrend: { direction: 'up', value: '+$125.50' },
    costByService: [
      { name: 'Firebase', value: 450.25 },
      { name: 'GCP Compute', value: 325.5 },
      { name: 'Storage', value: 175.0 },
      { name: 'CDN', value: 150.0 },
      { name: 'Other', value: 150.0 },
    ],
    costHistory: [
      { date: '2025-04-23', count: 1050 },
      { date: '2025-04-24', count: 1075 },
      { date: '2025-04-25', count: 1060 },
      { date: '2025-04-26', count: 1080 },
      { date: '2025-04-27', count: 1100 },
      { date: '2025-04-28', count: 1125 },
      { date: '2025-04-29', count: 1150 },
      { date: '2025-04-30', count: 1175 },
      { date: '2025-05-01', count: 1200 },
      { date: '2025-05-02', count: 1225 },
      { date: '2025-05-03', count: 1210 },
      { date: '2025-05-04', count: 1190 },
      { date: '2025-05-05', count: 1180 },
      { date: '2025-05-06', count: 1195 },
      { date: '2025-05-07', count: 1205 },
      { date: '2025-05-08', count: 1220 },
      { date: '2025-05-09', count: 1235 },
      { date: '2025-05-10', count: 1250 },
      { date: '2025-05-11', count: 1240 },
      { date: '2025-05-12', count: 1230 },
      { date: '2025-05-13', count: 1245 },
      { date: '2025-05-14', count: 1260 },
      { date: '2025-05-15', count: 1275 },
      { date: '2025-05-16', count: 1290 },
      { date: '2025-05-17', count: 1280 },
      { date: '2025-05-18', count: 1270 },
      { date: '2025-05-19', count: 1285 },
      { date: '2025-05-20', count: 1300 },
      { date: '2025-05-21', count: 1315 },
      { date: '2025-05-22', count: 1330 },
      { date: '2025-05-23', count: 1250 },
    ],
  },
  backgroundProcesses: {
    activeProcesses: 8,
    activeProcessesTrend: { direction: 'up', value: '+2' },
    failedProcesses: 1,
    failedProcessesTrend: { direction: 'down', value: '-3' },
    processStatus: [
      {
        id: 'proc-001',
        name: 'Data Sync',
        status: 'running',
        lastRun: '2025-05-23T10:15:00Z',
        duration: 120,
      },
      {
        id: 'proc-002',
        name: 'Analytics Aggregation',
        status: 'completed',
        lastRun: '2025-05-23T09:30:00Z',
        duration: 450,
      },
      {
        id: 'proc-003',
        name: 'Fraud Detection',
        status: 'running',
        lastRun: '2025-05-23T10:00:00Z',
        duration: 300,
      },
      {
        id: 'proc-004',
        name: 'Subscription Renewal',
        status: 'completed',
        lastRun: '2025-05-23T08:45:00Z',
        duration: 180,
      },
      {
        id: 'proc-005',
        name: 'Database Backup',
        status: 'completed',
        lastRun: '2025-05-23T07:00:00Z',
        duration: 600,
      },
      {
        id: 'proc-006',
        name: 'Email Notifications',
        status: 'running',
        lastRun: '2025-05-23T10:30:00Z',
        duration: 90,
      },
      {
        id: 'proc-007',
        name: 'Cache Refresh',
        status: 'failed',
        lastRun: '2025-05-23T09:15:00Z',
        duration: 60,
      },
      {
        id: 'proc-008',
        name: 'Log Rotation',
        status: 'completed',
        lastRun: '2025-05-23T06:00:00Z',
        duration: 120,
      },
      {
        id: 'proc-009',
        name: 'ML Model Training',
        status: 'running',
        lastRun: '2025-05-23T08:00:00Z',
        duration: 1800,
      },
    ],
  },
  systemActions: [
    {
      id: 'action-001',
      timestamp: '2025-05-23T10:45:00Z',
      action: 'Cache refresh triggered manually',
      status: 'success',
      details: 'Cache refreshed successfully in 45 seconds',
    },
    {
      id: 'action-002',
      timestamp: '2025-05-23T10:30:00Z',
      action: 'Failed process restarted: Cache Refresh',
      status: 'warning',
      details: 'Process restarted after initial failure',
    },
    {
      id: 'action-003',
      timestamp: '2025-05-23T10:15:00Z',
      action: 'Database connection pool increased',
      status: 'success',
      details: 'Connection pool increased from 10 to 15',
    },
    {
      id: 'action-004',
      timestamp: '2025-05-23T10:00:00Z',
      action: 'API rate limiting adjusted',
      status: 'success',
      details: 'Rate limit increased from 100 to 150 requests per minute',
    },
    {
      id: 'action-005',
      timestamp: '2025-05-23T09:45:00Z',
      action: 'Error alert: High database query time',
      status: 'error',
      details: 'Query time exceeded threshold of 100ms for users collection',
    },
  ],
};

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

// Custom hooks for data fetching
export const useBetSlipPerformanceData = (shouldFetch = true) => {
  const { data, error, mutate } = useSWR<ApiResponse<BetSlipPerformanceData>>(
    shouldFetch ? '/api/admin/bet-slip-performance' : null,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 30000, // 30 seconds
    }
  );

  // Use mock data for development or when API fails
  const [mockData, setMockData] = useState<BetSlipPerformanceData>(mockBetSlipPerformanceData);

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
};

export const useSubscriptionAnalyticsData = (shouldFetch = true) => {
  const { data, error, mutate } = useSWR<ApiResponse<SubscriptionAnalyticsData>>(
    shouldFetch ? '/api/admin/subscription-analytics' : null,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 30000, // 30 seconds
    }
  );

  // Use mock data for development or when API fails
  const [mockData, setMockData] = useState<SubscriptionAnalyticsData>(
    mockSubscriptionAnalyticsData
  );

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
};

export const useSystemHealthData = (shouldFetch = true) => {
  const { data, error, mutate } = useSWR<ApiResponse<SystemHealthData>>(
    shouldFetch ? '/api/admin/system-health' : null,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 30000, // 30 seconds
    }
  );

  // Use mock data for development or when API fails
  const [mockData, setMockData] = useState<SystemHealthData>(mockSystemHealthData);

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
};

// WebSocket connection for real-time updates
export const useWebSocketConnection = (url: string, onMessage: (data: any) => void) => {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let ws: WebSocket | null = null;
    let reconnectTimer: NodeJS.Timeout | null = null;

    const connect = () => {
      try {
        ws = new WebSocket(url);

        ws.onopen = () => {
          setIsConnected(true);
          setError(null);
          console.log('WebSocket connected');
        };

        ws.onmessage = event => {
          try {
            const data = JSON.parse(event.data);
            onMessage(data);
          } catch (err) {
            console.error('Error parsing WebSocket message:', err);
          }
        };

        ws.onerror = event => {
          console.error('WebSocket error:', event);
          setError(new Error('WebSocket connection error'));
        };

        ws.onclose = () => {
          setIsConnected(false);
          console.log('WebSocket disconnected, reconnecting...');
          // Reconnect after 5 seconds
          reconnectTimer = setTimeout(connect, 5000);
        };
      } catch (err) {
        setError(err as Error);
        // Reconnect after 5 seconds
        reconnectTimer = setTimeout(connect, 5000);
      }
    };

    connect();

    return () => {
      if (ws) {
        ws.close();
      }
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
      }
    };
  }, [url, onMessage]);

  return { isConnected, error };
};

// Admin Dashboard Service
export class AdminDashboardService {
  // Bet Slip Performance
  static async getBetSlipPerformanceData(): Promise<BetSlipPerformanceData> {
    try {
      const response = await fetch('/api/admin/bet-slip-performance', {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('adminToken')}`,
        },
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error fetching bet slip performance data:', error);
      return mockBetSlipPerformanceData;
    }
  }

  // Subscription Analytics
  static async getSubscriptionAnalyticsData(): Promise<SubscriptionAnalyticsData> {
    try {
      const response = await fetch('/api/admin/subscription-analytics', {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('adminToken')}`,
        },
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error fetching subscription analytics data:', error);
      return mockSubscriptionAnalyticsData;
    }
  }

  // System Health
  static async getSystemHealthData(): Promise<SystemHealthData> {
    try {
      const response = await fetch('/api/admin/system-health', {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('adminToken')}`,
        },
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error fetching system health data:', error);
      return mockSystemHealthData;
    }
  }

  // Recommendation Actions
  static async executeRecommendationAction(id: string, action: string): Promise<boolean> {
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
        throw new Error(`API error: ${response.status}`);
      }

      return true;
    } catch (error) {
      console.error('Error executing recommendation action:', error);
      return false;
    }
  }

  // System Actions
  static async executeSystemAction(
    action: string,
    params: Record<string, any> = {}
  ): Promise<boolean> {
    try {
      const response = await fetch('/api/admin/execute-system-action', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('adminToken')}`,
        },
        body: JSON.stringify({ action, params }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      return true;
    } catch (error) {
      console.error('Error executing system action:', error);
      return false;
    }
  }
}

export default AdminDashboardService;
