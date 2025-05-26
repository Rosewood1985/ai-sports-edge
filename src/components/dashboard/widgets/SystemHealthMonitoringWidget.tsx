import React from 'react';
import { EnhancedWidget } from './EnhancedWidget';
import { MetricCard } from '../metrics/MetricCard';
import { HorizontalBarChart } from '../charts/HorizontalBarChart';
import { LineChart } from '../charts/LineChart';
import { Tooltip } from '../../../components/ui/Tooltip';
// TrendDirection type is now handled by the systemHealthService interface

// SystemHealthData interface and real data is imported from systemHealthService

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
        <div className="flex justify-between items-center">
          <a href="/admin/system-health" className="text-blue-500 hover:underline text-sm">
            View detailed system health metrics
          </a>
          <span className="text-xs text-gray-500">
            Last updated: {data?.lastUpdated ? new Date(data.lastUpdated).toLocaleTimeString() : 'Never'}
          </span>
        </div>
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
                  {data?.backgroundProcesses.processStatus.map((process: any) => (
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
            {data?.systemActions.map((action: any) => (
              <ActionLogItem key={action.id} action={action} />
            ))}
          </div>
        </div>
      </div>
    </EnhancedWidget>
  );
}
