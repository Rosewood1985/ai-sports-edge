/**
 * Enhanced System Health Monitoring Widget with Real-time WebSocket Updates
 * AI Sports Edge - Real-time system performance monitoring
 */

import React, { useEffect, useState, useCallback } from 'react';
import { useWebSocket } from '../api/swrApiService';
import { EnhancedWidget } from '../../../src/components/dashboard/widgets/EnhancedWidget';
import { MetricCard } from '../../../src/components/dashboard/metrics/MetricCard';
import { HorizontalBarChart } from '../../../src/components/dashboard/charts/HorizontalBarChart';
import { LineChart } from '../../../atomic/molecules/charts/LineChart';
import { LoadingIndicator } from '../../atoms/LoadingIndicator';
import { Toast } from '../../atoms/Toast';

// Types
interface SystemHealthData {
  timestamp: string;
  apiPerformance: {
    responseTime: number;
    errorRate: number;
    requestsPerMinute: number;
    endpointPerformance: Array<{ endpoint: string; responseTime: number }>;
    healthScore: number;
  };
  databasePerformance: {
    queryTime: number;
    readOperations: number;
    writeOperations: number;
    connectionPool: number;
    healthScore: number;
  };
  infrastructureCosts: {
    totalCost: number;
    costByService: Array<{ service: string; cost: number }>;
    costTrend: 'up' | 'down' | 'stable';
  };
  backgroundProcesses: {
    activeProcesses: number;
    failedProcesses: number;
    processStatus: Array<{
      id: string;
      name: string;
      status: 'running' | 'completed' | 'failed' | 'pending';
      lastRun: string;
      duration: number;
      nextRun?: string;
    }>;
  };
  systemActions: Array<{
    id: string;
    timestamp: string;
    action: string;
    status: 'success' | 'warning' | 'error';
    details: string;
    automated: boolean;
  }>;
  alerts: Array<{
    id: string;
    severity: 'critical' | 'warning' | 'info';
    message: string;
    timestamp: string;
    resolved: boolean;
  }>;
}

interface ConnectionState {
  status: 'connecting' | 'connected' | 'disconnected' | 'error';
  lastConnected?: Date;
  reconnectAttempts: number;
}

// Process status badge component
const ProcessStatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const statusConfig = {
    running: { 
      className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300',
      icon: '🔄'
    },
    completed: { 
      className: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300',
      icon: '✅'
    },
    failed: { 
      className: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300',
      icon: '❌'
    },
    pending: { 
      className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300',
      icon: '⏳'
    },
  }[status] || { className: 'bg-gray-100 text-gray-800', icon: '❓' };

  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusConfig.className}`}>
      <span className="mr-1">{statusConfig.icon}</span>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};

// Alert component
const AlertItem: React.FC<{ alert: SystemHealthData['alerts'][0] }> = ({ alert }) => {
  const severityConfig = {
    critical: { className: 'border-red-500 bg-red-50 dark:bg-red-900/20', icon: '🚨' },
    warning: { className: 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20', icon: '⚠️' },
    info: { className: 'border-blue-500 bg-blue-50 dark:bg-blue-900/20', icon: 'ℹ️' },
  }[alert.severity];

  return (
    <div className={`p-3 mb-2 rounded-lg border-l-4 ${severityConfig.className}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-2">
          <span className="text-lg">{severityConfig.icon}</span>
          <div>
            <p className="font-medium text-sm">{alert.message}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {new Date(alert.timestamp).toLocaleTimeString()}
            </p>
          </div>
        </div>
        {alert.resolved && (
          <span className="text-green-500 text-sm">✓ Resolved</span>
        )}
      </div>
    </div>
  );
};

// Connection status indicator
const ConnectionStatusIndicator: React.FC<{ connectionState: ConnectionState }> = ({ connectionState }) => {
  const statusConfig = {
    connected: { color: 'green', icon: '🟢', text: 'Connected' },
    connecting: { color: 'yellow', icon: '🟡', text: 'Connecting...' },
    disconnected: { color: 'gray', icon: '⚫', text: 'Disconnected' },
    error: { color: 'red', icon: '🔴', text: 'Connection Error' },
  }[connectionState.status];

  return (
    <div className="flex items-center space-x-2 text-sm">
      <span>{statusConfig.icon}</span>
      <span className={`text-${statusConfig.color}-600 dark:text-${statusConfig.color}-400`}>
        {statusConfig.text}
      </span>
      {connectionState.status === 'connected' && connectionState.lastConnected && (
        <span className="text-gray-500 text-xs">
          (Connected {connectionState.lastConnected.toLocaleTimeString()})
        </span>
      )}
    </div>
  );
};

export const SystemHealthMonitoringWidget: React.FC = () => {
  const [healthData, setHealthData] = useState<SystemHealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connectionState, setConnectionState] = useState<ConnectionState>({
    status: 'disconnected',
    reconnectAttempts: 0,
  });
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // WebSocket configuration
  const wsConfig = {
    url: process.env.NEXT_PUBLIC_WS_HEALTH_URL || 'wss://us-central1-ai-sports-edge.cloudfunctions.net/systemHealth',
    reconnectInterval: 5000,
    maxReconnectAttempts: 10,
  };

  // WebSocket connection
  const webSocket = useWebSocket(wsConfig);

  // Handle WebSocket messages
  useEffect(() => {
    if (webSocket.lastMessage) {
      try {
        const message = webSocket.lastMessage;
        
        switch (message.type) {
          case 'HEALTH_UPDATE':
            setHealthData(message.payload);
            setLoading(false);
            setError(null);
            break;
            
          case 'ALERT':
            setToastMessage(`System Alert: ${message.payload.message}`);
            // Update alerts in health data
            setHealthData(prev => prev ? {
              ...prev,
              alerts: [message.payload, ...prev.alerts.slice(0, 9)] // Keep last 10 alerts
            } : null);
            break;
            
          case 'PROCESS_STATUS':
            setHealthData(prev => prev ? {
              ...prev,
              backgroundProcesses: {
                ...prev.backgroundProcesses,
                processStatus: message.payload.processes
              }
            } : null);
            break;
            
          case 'COST_UPDATE':
            setHealthData(prev => prev ? {
              ...prev,
              infrastructureCosts: message.payload
            } : null);
            break;
            
          default:
            console.log('Unknown message type:', message.type);
        }
      } catch (err) {
        console.error('Error processing WebSocket message:', err);
      }
    }
  }, [webSocket.lastMessage]);

  // Update connection state
  useEffect(() => {
    setConnectionState(prev => ({
      status: webSocket.connectionState,
      lastConnected: webSocket.connectionState === 'connected' ? new Date() : prev.lastConnected,
      reconnectAttempts: webSocket.connectionState === 'connected' ? 0 : prev.reconnectAttempts + 1,
    }));
  }, [webSocket.connectionState]);

  // Handle WebSocket errors
  useEffect(() => {
    if (webSocket.error) {
      setError(`Connection error: ${webSocket.error.message}`);
      setLoading(false);
    }
  }, [webSocket.error]);

  // Fallback data fetching if WebSocket fails
  const fetchHealthData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/system-health');
      const data = await response.json();
      setHealthData(data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch system health data');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial data fetch or fallback
  useEffect(() => {
    if (connectionState.status === 'error' || connectionState.reconnectAttempts > 3) {
      fetchHealthData();
    }
  }, [connectionState, fetchHealthData]);

  // Format utilities
  const formatDuration = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const formatTimestamp = (timestamp: string): string => {
    return new Date(timestamp).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getHealthScoreColor = (score: number): string => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  // Manual refresh
  const handleRefresh = useCallback(() => {
    if (connectionState.status === 'connected') {
      webSocket.sendMessage({ type: 'REQUEST_UPDATE' });
    } else {
      fetchHealthData();
    }
  }, [connectionState.status, webSocket, fetchHealthData]);

  if (loading && !healthData) {
    return (
      <EnhancedWidget title="🔧 System Health Monitoring" size="large">
        <div className="flex items-center justify-center h-64">
          <LoadingIndicator />
          <span className="ml-2">Connecting to system health monitoring...</span>
        </div>
      </EnhancedWidget>
    );
  }

  if (error && !healthData) {
    return (
      <EnhancedWidget 
        title="🔧 System Health Monitoring" 
        size="large"
        error={error}
        onRefresh={handleRefresh}
      >
        <div className="text-center py-8">
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={handleRefresh}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Retry Connection
          </button>
        </div>
      </EnhancedWidget>
    );
  }

  return (
    <>
      <EnhancedWidget
        title="🔧 System Health Monitoring"
        subtitle="Real-time system performance"
        size="large"
        isLoading={loading}
        error={error}
        onRefresh={handleRefresh}
        footer={
          <div className="flex justify-between items-center">
            <ConnectionStatusIndicator connectionState={connectionState} />
            <span className="text-xs text-gray-500">
              Last updated: {healthData?.timestamp ? formatTimestamp(healthData.timestamp) : 'Never'}
            </span>
          </div>
        }
      >
        <div className="space-y-6">
          {/* Critical Alerts */}
          {healthData?.alerts && healthData.alerts.filter(a => !a.resolved).length > 0 && (
            <div className="alerts-section">
              <h4 className="text-lg font-medium mb-3 text-red-600">🚨 Active Alerts</h4>
              <div className="space-y-2">
                {healthData.alerts
                  .filter(alert => !alert.resolved)
                  .slice(0, 3)
                  .map(alert => <AlertItem key={alert.id} alert={alert} />)}
              </div>
            </div>
          )}

          {/* System Health Overview */}
          <div className="health-overview-section">
            <h4 className="text-lg font-medium mb-3">System Health Overview</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <MetricCard
                title="API Health Score"
                value={`${healthData?.apiPerformance.healthScore || 0}%`}
                status={healthData?.apiPerformance.healthScore >= 90 ? 'success' : 'warning'}
                className={getHealthScoreColor(healthData?.apiPerformance.healthScore || 0)}
              />
              <MetricCard
                title="Database Health Score"
                value={`${healthData?.databasePerformance.healthScore || 0}%`}
                status={healthData?.databasePerformance.healthScore >= 90 ? 'success' : 'warning'}
                className={getHealthScoreColor(healthData?.databasePerformance.healthScore || 0)}
              />
              <MetricCard
                title="Active Processes"
                value={healthData?.backgroundProcesses.activeProcesses || 0}
                status="neutral"
              />
            </div>
          </div>

          {/* API Performance Section */}
          <div className="api-performance-section">
            <h4 className="text-lg font-medium mb-3">API Performance</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <MetricCard
                title="Avg Response Time"
                value={`${healthData?.apiPerformance.responseTime || 0}ms`}
                status={healthData?.apiPerformance.responseTime <= 200 ? 'success' : 'warning'}
              />
              <MetricCard
                title="Error Rate"
                value={`${healthData?.apiPerformance.errorRate || 0}%`}
                status={healthData?.apiPerformance.errorRate <= 1 ? 'success' : 'error'}
              />
              <MetricCard
                title="Requests/Min"
                value={healthData?.apiPerformance.requestsPerMinute || 0}
                status="neutral"
              />
            </div>
            {healthData?.apiPerformance.endpointPerformance && (
              <div className="mt-4">
                <h5 className="text-md font-medium mb-2">Endpoint Response Times (ms)</h5>
                <HorizontalBarChart data={healthData.apiPerformance.endpointPerformance} />
              </div>
            )}
          </div>

          {/* Database Performance Section */}
          <div className="database-performance-section">
            <h4 className="text-lg font-medium mb-3">Database Performance</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <MetricCard
                title="Avg Query Time"
                value={`${healthData?.databasePerformance.queryTime || 0}ms`}
                status={healthData?.databasePerformance.queryTime <= 100 ? 'success' : 'warning'}
              />
              <MetricCard
                title="Read Ops/Min"
                value={healthData?.databasePerformance.readOperations || 0}
                status="neutral"
              />
              <MetricCard
                title="Write Ops/Min"
                value={healthData?.databasePerformance.writeOperations || 0}
                status="neutral"
              />
            </div>
          </div>

          {/* Background Processes Section */}
          <div className="background-processes-section">
            <h4 className="text-lg font-medium mb-3">Background Processes</h4>
            <div className="overflow-x-auto">
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Next Run
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {healthData?.backgroundProcesses.processStatus.map((process) => (
                    <tr key={process.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {process.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <ProcessStatusBadge status={process.status} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                        {formatTimestamp(process.lastRun)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                        {formatDuration(process.duration)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                        {process.nextRun ? formatTimestamp(process.nextRun) : 'Not scheduled'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Infrastructure Costs Section */}
          {healthData?.infrastructureCosts && (
            <div className="infrastructure-costs-section">
              <h4 className="text-lg font-medium mb-3">Infrastructure Costs</h4>
              <MetricCard
                title="Monthly Cost"
                value={`$${healthData.infrastructureCosts.totalCost.toLocaleString()}`}
                status={healthData.infrastructureCosts.costTrend === 'down' ? 'success' : 'warning'}
              />
              {healthData.infrastructureCosts.costByService && (
                <div className="mt-4">
                  <h5 className="text-md font-medium mb-2">Cost by Service</h5>
                  <HorizontalBarChart data={healthData.infrastructureCosts.costByService} />
                </div>
              )}
            </div>
          )}
        </div>
      </EnhancedWidget>

      {/* Toast notifications */}
      {toastMessage && (
        <Toast
          message={toastMessage}
          type="warning"
          onClose={() => setToastMessage(null)}
          duration={5000}
        />
      )}
    </>
  );
};