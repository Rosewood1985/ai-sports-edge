import { TrendDirection } from '../components/dashboard/metrics/MetricCard';
import { useEffect, useState } from 'react';
import useSWR from 'swr';
import { ConversionFunnelData } from '../types/conversionFunnel';
import { ReportTemplate, ScheduledReport, ReportType } from '../types/reporting';
import { ExportConfig, ExportFormat, ExportHistory } from '../types/export';
import {
  User,
  UserListResponse,
  UserCreateRequest,
  UserUpdateRequest,
  Permission,
  PermissionGroup,
  UserFilter,
} from '../types/userManagement';

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
        trend: { direction: 'flat', value: '0%' },
      },
    ],
    thresholds: {
      low: 40,
      medium: 60,
      high: 80,
    },
  },
};

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

// Mock data for user management
const mockPermissions: Permission[] = [
  { id: 'perm_1', name: 'users.view', description: 'View users', category: 'users' },
  { id: 'perm_2', name: 'users.edit', description: 'Edit users', category: 'users' },
  { id: 'perm_3', name: 'users.create', description: 'Create users', category: 'users' },
  { id: 'perm_4', name: 'users.delete', description: 'Delete users', category: 'users' },
  { id: 'perm_5', name: 'analytics.view', description: 'View analytics', category: 'analytics' },
  {
    id: 'perm_6',
    name: 'analytics.export',
    description: 'Export analytics',
    category: 'analytics',
  },
  { id: 'perm_7', name: 'content.view', description: 'View content', category: 'content' },
  { id: 'perm_8', name: 'content.edit', description: 'Edit content', category: 'content' },
  { id: 'perm_9', name: 'content.create', description: 'Create content', category: 'content' },
  { id: 'perm_10', name: 'content.delete', description: 'Delete content', category: 'content' },
  { id: 'perm_11', name: 'settings.view', description: 'View settings', category: 'settings' },
  { id: 'perm_12', name: 'settings.edit', description: 'Edit settings', category: 'settings' },
  { id: 'perm_13', name: 'system.view', description: 'View system', category: 'system' },
  { id: 'perm_14', name: 'system.manage', description: 'Manage system', category: 'system' },
];

const mockPermissionGroups: PermissionGroup[] = [
  {
    category: 'users',
    permissions: mockPermissions.filter(p => p.category === 'users'),
  },
  {
    category: 'analytics',
    permissions: mockPermissions.filter(p => p.category === 'analytics'),
  },
  {
    category: 'content',
    permissions: mockPermissions.filter(p => p.category === 'content'),
  },
  {
    category: 'settings',
    permissions: mockPermissions.filter(p => p.category === 'settings'),
  },
  {
    category: 'system',
    permissions: mockPermissions.filter(p => p.category === 'system'),
  },
];

const mockUsers: User[] = [
  {
    id: '1',
    email: 'admin@aisportsedge.app',
    displayName: 'Admin User',
    role: 'admin',
    status: 'active',
    createdAt: '2025-01-15T08:30:00Z',
    lastLogin: '2025-05-23T14:25:00Z',
    permissions: mockPermissions,
  },
  {
    id: '2',
    email: 'editor@aisportsedge.app',
    displayName: 'Editor User',
    role: 'editor',
    status: 'active',
    createdAt: '2025-02-10T10:15:00Z',
    lastLogin: '2025-05-22T09:45:00Z',
    permissions: mockPermissions.filter(
      p =>
        (p.category === 'users' && p.name !== 'users.delete') ||
        p.category === 'analytics' ||
        p.category === 'content'
    ),
  },
  {
    id: '3',
    email: 'viewer@aisportsedge.app',
    displayName: 'Viewer User',
    role: 'viewer',
    status: 'active',
    createdAt: '2025-03-05T14:20:00Z',
    lastLogin: '2025-05-21T16:30:00Z',
    permissions: mockPermissions.filter(p => p.name.endsWith('.view')),
  },
  {
    id: '4',
    email: 'suspended@aisportsedge.app',
    displayName: 'Suspended User',
    role: 'user',
    status: 'suspended',
    createdAt: '2025-01-20T11:45:00Z',
    lastLogin: '2025-04-15T08:20:00Z',
    permissions: [],
  },
  {
    id: '5',
    email: 'pending@aisportsedge.app',
    displayName: 'Pending User',
    role: 'user',
    status: 'pending',
    createdAt: '2025-05-18T09:30:00Z',
    lastLogin: '',
    permissions: [],
  },
];

const mockUserListResponse: UserListResponse = {
  users: mockUsers,
  total: mockUsers.length,
  page: 1,
  pageSize: 10,
  totalPages: 1,
};

// Enhanced API fetcher with retry logic and authentication
const fetcher = async <T>(url: string): Promise<T> => {
  const maxRetries = 3;
  let lastError: Error;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const token = localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken');
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'X-Request-ID': `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        },
      });

      if (response.status === 401) {
        // Clear invalid token and redirect to login
        localStorage.removeItem('adminToken');
        sessionStorage.removeItem('adminToken');
        window.location.href = '/admin/login';
        throw new Error('Unauthorized - redirecting to login');
      }

      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`API fetch attempt ${attempt} failed:`, error);
      lastError = error as Error;
      
      if (attempt < maxRetries) {
        // Exponential backoff: 1s, 2s, 4s
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt - 1) * 1000));
      }
    }
  }

  throw lastError!;
};

// WebSocket service for real-time updates
class WebSocketService {
  private static instance: WebSocketService;
  private ws: WebSocket | null = null;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private subscribers: Map<string, Set<(data: any) => void>> = new Map();
  private isConnected = false;

  static getInstance(): WebSocketService {
    if (!WebSocketService.instance) {
      WebSocketService.instance = new WebSocketService();
    }
    return WebSocketService.instance;
  }

  connect(): void {
    const wsUrl = process.env.NODE_ENV === 'production' 
      ? 'wss://api.aisportsedge.app/ws/admin'
      : 'ws://localhost:8080/ws/admin';

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.isConnected = true;
        console.log('Admin WebSocket connected');
        if (this.reconnectTimer) {
          clearTimeout(this.reconnectTimer);
          this.reconnectTimer = null;
        }
      };

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          this.notifySubscribers(message.type, message.data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      this.ws.onclose = () => {
        this.isConnected = false;
        console.log('Admin WebSocket disconnected, reconnecting...');
        this.scheduleReconnect();
      };

      this.ws.onerror = (error) => {
        console.error('Admin WebSocket error:', error);
      };
    } catch (error) {
      console.error('Error connecting to WebSocket:', error);
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) return;
    
    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, 5000);
  }

  subscribe(channel: string, callback: (data: any) => void): () => void {
    if (!this.subscribers.has(channel)) {
      this.subscribers.set(channel, new Set());
    }
    this.subscribers.get(channel)!.add(callback);

    // Return unsubscribe function
    return () => {
      const channelSubscribers = this.subscribers.get(channel);
      if (channelSubscribers) {
        channelSubscribers.delete(callback);
        if (channelSubscribers.size === 0) {
          this.subscribers.delete(channel);
        }
      }
    };
  }

  private notifySubscribers(channel: string, data: any): void {
    const channelSubscribers = this.subscribers.get(channel);
    if (channelSubscribers) {
      channelSubscribers.forEach(callback => callback(data));
    }
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.isConnected = false;
  }

  getConnectionStatus(): boolean {
    return this.isConnected;
  }
}

// Enhanced SWR hooks with real-time updates and caching
export const useBetSlipPerformanceData = (shouldFetch = true) => {
  const { data, error, mutate } = useSWR<ApiResponse<BetSlipPerformanceData>>(
    shouldFetch ? '/api/admin/bet-slip-performance' : null,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 30000,
      errorRetryCount: 3,
      errorRetryInterval: 5000,
      refreshInterval: 60000, // Refresh every minute
    }
  );

  // Real-time updates via WebSocket
  useEffect(() => {
    if (!shouldFetch) return;

    const wsService = WebSocketService.getInstance();
    wsService.connect();

    const unsubscribe = wsService.subscribe('bet-slip-performance', (newData) => {
      mutate({ data: newData, status: 200, message: 'Real-time update' } as any, false);
    });

    return () => {
      unsubscribe();
    };
  }, [shouldFetch, mutate]);

  // Fallback to mock data only in development when API is unavailable
  const [fallbackData, setFallbackData] = useState<BetSlipPerformanceData | null>(null);

  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && error && !data) {
      console.warn('API unavailable, using fallback data for bet slip performance');
      setFallbackData(mockBetSlipPerformanceData);
    }
  }, [data, error]);

  return {
    data: data?.data || fallbackData,
    isLoading: !error && !data && !fallbackData,
    error: error && !fallbackData ? error : null,
    refetch: () => mutate(),
    isRealTime: !!data?.data,
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

// User Management Hook
export const useUserManagement = (
  shouldFetch = true,
  filter: UserFilter = {},
  page = 1,
  pageSize = 10
) => {
  const { data, error, mutate } = useSWR<ApiResponse<UserListResponse>>(
    shouldFetch
      ? `/api/admin/users?page=${page}&pageSize=${pageSize}${
          filter.role ? `&role=${filter.role}` : ''
        }${filter.status ? `&status=${filter.status}` : ''}${
          filter.search ? `&search=${encodeURIComponent(filter.search)}` : ''
        }${
          filter.permissions && filter.permissions.length > 0
            ? `&permissions=${filter.permissions.join(',')}`
            : ''
        }`
      : null,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 30000, // 30 seconds
    }
  );

  // Use mock data for development or when API fails
  const [mockData, setMockData] = useState<UserListResponse>(mockUserListResponse);

  // For development, simulate API call with mock data
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && !data && !error) {
      const timer = setTimeout(() => {
        // Apply filters to mock data
        let filteredUsers = [...mockUsers];

        if (filter.role) {
          filteredUsers = filteredUsers.filter(user => user.role === filter.role);
        }

        if (filter.status) {
          filteredUsers = filteredUsers.filter(user => user.status === filter.status);
        }

        if (filter.search) {
          const searchLower = filter.search.toLowerCase();
          filteredUsers = filteredUsers.filter(
            user =>
              user.displayName.toLowerCase().includes(searchLower) ||
              user.email.toLowerCase().includes(searchLower)
          );
        }

        if (filter.permissions && filter.permissions.length > 0) {
          filteredUsers = filteredUsers.filter(user =>
            filter.permissions!.every(permId => user.permissions.some(p => p.id === permId))
          );
        }

        // Apply pagination
        const startIndex = (page - 1) * pageSize;
        const paginatedUsers = filteredUsers.slice(startIndex, startIndex + pageSize);

        const filteredResponse: UserListResponse = {
          users: paginatedUsers,
          total: filteredUsers.length,
          page,
          pageSize,
          totalPages: Math.ceil(filteredUsers.length / pageSize),
        };

        mutate({ data: filteredResponse, status: 200, message: 'Success' } as any, false);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [data, error, filter, mockData, mutate, page, pageSize]);

  return {
    data: data?.data || mockData,
    isLoading: !error && !data,
    error,
    refetch: () => mutate(),
  };
};

// Permission Groups Hook
export const usePermissionGroups = (shouldFetch = true) => {
  const { data, error, mutate } = useSWR<ApiResponse<PermissionGroup[]>>(
    shouldFetch ? '/api/admin/permissions' : null,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 60000, // 60 seconds
    }
  );

  // Use mock data for development or when API fails
  const [mockData, setMockData] = useState<PermissionGroup[]>(mockPermissionGroups);

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
  // Reporting API methods
  static async getReportTemplates(): Promise<ReportTemplate[]> {
    // Mock data for development
    return [
      {
        id: 'template-001',
        name: 'Monthly Performance Report',
        description: 'Comprehensive monthly performance analysis',
        type: ReportType.ANALYTICS,
        createdAt: '2025-05-01T10:00:00Z',
        updatedAt: '2025-05-15T14:30:00Z',
        widgets: ['bet-slip-performance', 'subscription-analytics', 'system-health'],
        filters: [
          { field: 'date', operator: 'greater_than', value: '2025-04-01' },
          { field: 'date', operator: 'less_than', value: '2025-05-01' },
        ],
      },
      {
        id: 'template-002',
        name: 'Weekly Subscription Summary',
        description: 'Weekly summary of subscription metrics',
        type: ReportType.STANDARD,
        createdAt: '2025-05-05T09:15:00Z',
        updatedAt: '2025-05-20T11:45:00Z',
        widgets: ['subscription-analytics'],
        filters: [
          { field: 'date', operator: 'greater_than', value: '2025-05-13' },
          { field: 'date', operator: 'less_than', value: '2025-05-20' },
        ],
      },
      {
        id: 'template-003',
        name: 'System Health Check',
        description: 'Daily system health monitoring report',
        type: ReportType.PERFORMANCE,
        createdAt: '2025-05-10T08:30:00Z',
        updatedAt: '2025-05-22T16:20:00Z',
        widgets: ['system-health'],
        filters: [{ field: 'date', operator: 'equals', value: '2025-05-22' }],
      },
    ];
  }

  static async createReportTemplate(template: Omit<ReportTemplate, 'id'>): Promise<ReportTemplate> {
    // Mock implementation
    return {
      ...template,
      id: `template-${Math.floor(Math.random() * 1000)}`,
    };
  }

  static async updateReportTemplate(template: ReportTemplate): Promise<ReportTemplate> {
    // Mock implementation
    return {
      ...template,
      updatedAt: new Date().toISOString(),
    };
  }

  static async deleteReportTemplate(id: string): Promise<boolean> {
    // Mock implementation
    return true;
  }

  static async getScheduledReports(): Promise<ScheduledReport[]> {
    // Mock data for development
    return [
      {
        id: 'report-001',
        name: 'Monthly Performance Report',
        description: 'Automatically generated monthly performance report',
        templateId: 'template-001',
        schedule: {
          frequency: 'monthly',
          hour: 9,
          minute: 0,
          dayOfMonth: 1,
        },
        status: 'active',
        lastRun: '2025-05-01T09:00:00Z',
        nextRun: '2025-06-01T09:00:00Z',
        recipients: ['admin@example.com', 'manager@example.com'],
        format: 'pdf',
        createdAt: '2025-04-15T14:30:00Z',
        updatedAt: '2025-05-02T10:15:00Z',
      },
      {
        id: 'report-002',
        name: 'Weekly Subscription Summary',
        description: 'Weekly summary of subscription metrics',
        templateId: 'template-002',
        schedule: {
          frequency: 'weekly',
          hour: 8,
          minute: 30,
          dayOfWeek: 1,
        },
        status: 'active',
        lastRun: '2025-05-20T08:30:00Z',
        nextRun: '2025-05-27T08:30:00Z',
        recipients: ['admin@example.com', 'sales@example.com'],
        format: 'excel',
        createdAt: '2025-05-01T11:45:00Z',
        updatedAt: '2025-05-20T09:00:00Z',
      },
      {
        id: 'report-003',
        name: 'Daily System Health Check',
        description: 'Daily system health monitoring report',
        templateId: 'template-003',
        schedule: {
          frequency: 'daily',
          hour: 7,
          minute: 0,
        },
        status: 'paused',
        lastRun: '2025-05-22T07:00:00Z',
        nextRun: '2025-05-23T07:00:00Z',
        recipients: ['admin@example.com', 'tech@example.com'],
        format: 'pdf',
        createdAt: '2025-05-10T16:20:00Z',
        updatedAt: '2025-05-22T08:15:00Z',
      },
    ];
  }

  static async createScheduledReport(
    report: Omit<ScheduledReport, 'id'>
  ): Promise<ScheduledReport> {
    // Mock implementation
    return {
      ...report,
      id: `report-${Math.floor(Math.random() * 1000)}`,
    };
  }

  static async updateScheduledReport(report: ScheduledReport): Promise<ScheduledReport> {
    // Mock implementation
    return {
      ...report,
      updatedAt: new Date().toISOString(),
    };
  }

  static async deleteScheduledReport(id: string): Promise<boolean> {
    // Mock implementation
    return true;
  }

  static async getExportFormats(): Promise<ExportFormat[]> {
    // Mock data for development
    return [
      { id: 'pdf', name: 'PDF Document', extension: '.pdf', mimeType: 'application/pdf' },
      {
        id: 'excel',
        name: 'Excel Spreadsheet',
        extension: '.xlsx',
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      },
      { id: 'csv', name: 'CSV File', extension: '.csv', mimeType: 'text/csv' },
      { id: 'json', name: 'JSON Data', extension: '.json', mimeType: 'application/json' },
    ];
  }

  static async getExportHistory(): Promise<ExportHistory[]> {
    // Mock data for development
    return [
      {
        id: 'export-001',
        format: 'pdf',
        fileSize: 1250000,
        downloadUrl: '#',
        timestamp: '2025-05-22T14:30:00Z',
        expiresAt: '2025-06-22T14:30:00Z',
        status: 'success',
      },
      {
        id: 'export-002',
        format: 'excel',
        fileSize: 850000,
        downloadUrl: '#',
        timestamp: '2025-05-21T10:15:00Z',
        expiresAt: '2025-06-21T10:15:00Z',
        status: 'success',
      },
      {
        id: 'export-003',
        format: 'csv',
        fileSize: 450000,
        downloadUrl: '#',
        timestamp: '2025-05-20T16:45:00Z',
        expiresAt: '2025-06-20T16:45:00Z',
        status: 'success',
      },
    ];
  }

  static async deleteExport(id: string): Promise<boolean> {
    // Mock implementation
    return true;
  }

  static async exportData(config: ExportConfig): Promise<{ url: string; format: string }> {
    // Mock implementation
    return {
      url: '#',
      format: config.format,
    };
  }
  // Conversion Funnel
  static async getConversionFunnelData(): Promise<ConversionFunnelData> {
    try {
      const response = await fetch('/api/admin/conversion-funnel', {
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
      console.error('Error fetching conversion funnel data:', error);
      if (process.env.NODE_ENV === 'development') {
        return mockConversionFunnelData;
      } else {
        throw new Error('Failed to fetch conversion funnel data. Please try again later.');
      }
    }
  }
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

  // User Management
  static async getUserList(
    page = 1,
    pageSize = 10,
    filter: UserFilter = {}
  ): Promise<UserListResponse> {
    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
      });

      if (filter.role) {
        queryParams.append('role', filter.role);
      }

      if (filter.status) {
        queryParams.append('status', filter.status);
      }

      if (filter.search) {
        queryParams.append('search', filter.search);
      }

      if (filter.permissions && filter.permissions.length > 0) {
        queryParams.append('permissions', filter.permissions.join(','));
      }

      const response = await fetch(`/api/admin/users?${queryParams.toString()}`, {
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
      console.error('Error fetching user list:', error);
      return mockUserListResponse;
    }
  }

  static async getUserById(id: string): Promise<User | null> {
    try {
      const response = await fetch(`/api/admin/users/${id}`, {
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
      console.error(`Error fetching user with ID ${id}:`, error);
      return mockUsers.find(user => user.id === id) || null;
    }
  }

  static async createUser(userData: UserCreateRequest): Promise<User | null> {
    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('adminToken')}`,
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error creating user:', error);
      // Return mock data for development
      if (process.env.NODE_ENV === 'development') {
        const newUser: User = {
          id: `new-${Date.now()}`,
          email: userData.email,
          displayName: userData.displayName,
          role: userData.role,
          status: 'active',
          createdAt: new Date().toISOString(),
          lastLogin: '',
          permissions: mockPermissions.filter(p => userData.permissions.includes(p.id)),
        };
        return newUser;
      }
      return null;
    }
  }

  static async updateUser(userData: UserUpdateRequest): Promise<User | null> {
    try {
      const response = await fetch(`/api/admin/users/${userData.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('adminToken')}`,
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error(`Error updating user with ID ${userData.id}:`, error);
      // Return mock data for development
      if (process.env.NODE_ENV === 'development') {
        const userIndex = mockUsers.findIndex(user => user.id === userData.id);
        if (userIndex !== -1) {
          const updatedUser = {
            ...mockUsers[userIndex],
            ...userData,
            permissions: userData.permissions
              ? mockPermissions.filter(p => userData.permissions!.includes(p.id))
              : mockUsers[userIndex].permissions,
          };
          return updatedUser;
        }
      }
      return null;
    }
  }

  static async deleteUser(id: string): Promise<boolean> {
    try {
      const response = await fetch(`/api/admin/users/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('adminToken')}`,
        },
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      return true;
    } catch (error) {
      console.error(`Error deleting user with ID ${id}:`, error);
      return false;
    }
  }

  static async getPermissions(): Promise<PermissionGroup[]> {
    try {
      const response = await fetch('/api/admin/permissions', {
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
      console.error('Error fetching permissions:', error);
      return mockPermissionGroups;
    }
  }
}

export default AdminDashboardService;
