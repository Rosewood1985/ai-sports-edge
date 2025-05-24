import React from 'react';
import { EnhancedWidget } from './EnhancedWidget';
import { MetricCard } from '../metrics/MetricCard';
import { HorizontalBarChart } from '../charts/HorizontalBarChart';
import { LineChart } from '../charts/LineChart';
import { Tooltip } from '../../../components/ui/Tooltip';
import { TrendDirection } from '../metrics/MetricCard';

// Data interfaces
interface SystemHealthData {
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
const mockData: SystemHealthData = {
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

// Custom hook for data fetching
const useSystemHealthData = () => {
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

// Process status badge component
interface ProcessStatusBadgeProps {
  status: 'running' | 'completed' | 'failed' | 'pending';
}

const ProcessStatusBadge: React.FC<ProcessStatusBadgeProps> = ({ status }) => {
  const statusClasses = {
    running: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300',
    completed: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300',
    failed: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300',
    pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300',
  }[status];

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusClasses}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};

// Action log item component
interface ActionLogItemProps {
  action: {
    id: string;
    timestamp: string;
    action: string;
    status: 'success' | 'warning' | 'error';
    details: string;
  };
}

const ActionLogItem: React.FC<ActionLogItemProps> = ({ action }) => {
  const statusClasses = {
    success: 'border-green-500 bg-green-50 dark:bg-green-900/20',
    warning: 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20',
    error: 'border-red-500 bg-red-50 dark:bg-red-900/20',
  }[action.status];

  // Format timestamp
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className={`action-log-item p-3 mb-2 rounded-lg border-l-4 ${statusClasses}`}>
      <div className="flex justify-between items-start">
        <div className="action-details">
          <p className="action-message font-medium">{action.action}</p>
          <p className="action-details text-sm text-gray-500 dark:text-gray-400">
            {action.details}
          </p>
        </div>
        <div className="action-timestamp text-sm text-gray-500 dark:text-gray-400">
          {formatTimestamp(action.timestamp)}
        </div>
      </div>
    </div>
  );
};

export function SystemHealthMonitoringWidget() {
  const { data, isLoading, error, refetch } = useSystemHealthData();

  // Format duration in seconds to a readable format
  const formatDuration = (seconds: number) => {
    if (seconds < 60) {
      return `${seconds}s`;
    } else if (seconds < 3600) {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      return `${minutes}m ${remainingSeconds}s`;
    } else {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      return `${hours}h ${minutes}m`;
    }
  };

  // Format timestamp
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <EnhancedWidget
      title="🔧 System Health Monitoring"
      subtitle="Real-time system performance"
      size="large"
      isLoading={isLoading}
      error={error}
      onRefresh={refetch}
      footer={
        <a href="/admin/system-health" className="text-blue-500 hover:underline text-sm">
          View detailed system health metrics
        </a>
      }
    >
      <div className="space-y-6">
        {/* API Performance Section */}
        <div className="api-performance-section">
          <h4 className="text-lg font-medium mb-3">API Performance</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Tooltip content="Average API response time across all endpoints">
              <MetricCard
                title="Avg Response Time"
                value={`${data?.apiPerformance.responseTime}ms`}
                trend={data?.apiPerformance.responseTimeTrend}
                status={
                  data?.apiPerformance.responseTimeTrend.direction === 'down'
                    ? 'success'
                    : 'warning'
                }
              />
            </Tooltip>
            <Tooltip content="Percentage of API requests that result in an error">
              <MetricCard
                title="Error Rate"
                value={`${data?.apiPerformance.errorRate}%`}
                trend={data?.apiPerformance.errorRateTrend}
                status={
                  data?.apiPerformance.errorRateTrend.direction === 'down' ? 'success' : 'error'
                }
              />
            </Tooltip>
            <Tooltip content="Number of API requests per minute">
              <MetricCard
                title="Requests/Min"
                value={data?.apiPerformance.requestsPerMinute}
                trend={data?.apiPerformance.requestsPerMinuteTrend}
                status="neutral"
              />
            </Tooltip>
          </div>
          <div className="mt-4">
            <h5 className="text-md font-medium mb-2">Endpoint Response Times (ms)</h5>
            <HorizontalBarChart data={data?.apiPerformance.endpointPerformance} />
          </div>
        </div>

        {/* Database Performance Section */}
        <div className="database-performance-section mt-6">
          <h4 className="text-lg font-medium mb-3">Database Performance</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Tooltip content="Average database query execution time">
              <MetricCard
                title="Avg Query Time"
                value={`${data?.databasePerformance.queryTime}ms`}
                trend={data?.databasePerformance.queryTimeTrend}
                status={
                  data?.databasePerformance.queryTimeTrend.direction === 'down'
                    ? 'success'
                    : 'warning'
                }
              />
            </Tooltip>
            <Tooltip content="Number of read operations per minute">
              <MetricCard
                title="Read Ops/Min"
                value={data?.databasePerformance.readOperations}
                trend={data?.databasePerformance.readOperationsTrend}
                status="neutral"
              />
            </Tooltip>
            <Tooltip content="Number of write operations per minute">
              <MetricCard
                title="Write Ops/Min"
                value={data?.databasePerformance.writeOperations}
                trend={data?.databasePerformance.writeOperationsTrend}
                status="neutral"
              />
            </Tooltip>
          </div>
          <div className="mt-4">
            <h5 className="text-md font-medium mb-2">Collection Query Times (ms)</h5>
            <HorizontalBarChart data={data?.databasePerformance.collectionPerformance} />
          </div>
        </div>

        {/* Infrastructure Costs Section */}
        <div className="infrastructure-costs-section mt-6">
          <h4 className="text-lg font-medium mb-3">Infrastructure Costs</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <Tooltip content="Total infrastructure cost for the current month">
              <MetricCard
                title="Monthly Cost"
                value={`$${data?.infrastructureCosts.totalCost.toLocaleString()}`}
                trend={data?.infrastructureCosts.totalCostTrend}
                status={
                  data?.infrastructureCosts.totalCostTrend.direction === 'down'
                    ? 'success'
                    : 'warning'
                }
              />
            </Tooltip>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h5 className="text-md font-medium mb-2">Cost by Service</h5>
              <HorizontalBarChart data={data?.infrastructureCosts.costByService} />
            </div>
            <div>
              <h5 className="text-md font-medium mb-2">Cost Trend</h5>
              <div className="h-48">
                <LineChart data={data?.infrastructureCosts.costHistory} height={180} />
              </div>
            </div>
          </div>
        </div>

        {/* Background Processes Section */}
        <div className="background-processes-section mt-6">
          <h4 className="text-lg font-medium mb-3">Background Processes</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <Tooltip content="Number of currently active background processes">
              <MetricCard
                title="Active Processes"
                value={data?.backgroundProcesses.activeProcesses}
                trend={data?.backgroundProcesses.activeProcessesTrend}
                status="neutral"
              />
            </Tooltip>
            <Tooltip content="Number of failed background processes in the last 24 hours">
              <MetricCard
                title="Failed Processes"
                value={data?.backgroundProcesses.failedProcesses}
                trend={data?.backgroundProcesses.failedProcessesTrend}
                status={
                  data?.backgroundProcesses.failedProcessesTrend.direction === 'down'
                    ? 'success'
                    : 'error'
                }
              />
            </Tooltip>
          </div>
          <div className="mt-4">
            <h5 className="text-md font-medium mb-2">Process Status</h5>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Process
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Last Run
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Duration
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {data?.backgroundProcesses.processStatus.map(process => (
                    <tr key={process.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {process.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                        <ProcessStatusBadge status={process.status} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                        {formatTimestamp(process.lastRun)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                        {formatDuration(process.duration)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* System Actions Section */}
        <div className="system-actions-section mt-6">
          <h4 className="text-lg font-medium mb-3">Recent System Actions</h4>
          <div className="action-log">
            {data?.systemActions.map(action => (
              <ActionLogItem key={action.id} action={action} />
            ))}
          </div>
        </div>
      </div>
    </EnhancedWidget>
  );
}
