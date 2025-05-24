# Admin Dashboard Patterns (May 22, 2025)

## Pattern: Cross-Platform Component Adaptation

**Description:**
A pattern for adapting React Native components to web equivalents while maintaining consistent styling and behavior. This pattern ensures that the UI remains consistent across platforms while leveraging platform-specific optimizations.

**Components:**

1. **Component Mapping**: A system for mapping React Native components to web equivalents
2. **Shared Styling**: A system for sharing styles between platforms
3. **Platform-Specific Optimizations**: Logic for optimizing components for specific platforms

**Implementation:**

```typescript
// Example implementation pattern for cross-platform component adaptation
// src/components/ui/adapters/ThemedText.tsx

import React from 'react';
import { Text as RNText, TextProps as RNTextProps } from 'react-native';
import { useTheme } from '@/hooks/useTheme';

// Shared props interface
export interface ThemedTextProps {
  variant?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'body' | 'caption' | 'button';
  color?: string;
  align?: 'left' | 'center' | 'right';
  weight?: 'normal' | 'bold' | 'semibold' | 'light';
  italic?: boolean;
  underline?: boolean;
  children: React.ReactNode;
  className?: string;
  style?: any;
}

// Web implementation
export function ThemedText({
  variant = 'body',
  color,
  align = 'left',
  weight = 'normal',
  italic = false,
  underline = false,
  children,
  className = '',
  style = {},
}: ThemedTextProps) {
  const { theme } = useTheme();

  // Map variant to HTML element
  const Component = variant.startsWith('h') ? variant : 'p';

  // Map weight to font-weight
  const fontWeight = {
    normal: 400,
    light: 300,
    semibold: 600,
    bold: 700,
  }[weight];

  // Build style object
  const styles = {
    color: color || theme.colors.text,
    textAlign: align,
    fontWeight,
    fontStyle: italic ? 'italic' : 'normal',
    textDecoration: underline ? 'underline' : 'none',
    ...style,
  };

  // Map variant to Tailwind classes
  const variantClasses = {
    h1: 'text-4xl font-bold',
    h2: 'text-3xl font-bold',
    h3: 'text-2xl font-bold',
    h4: 'text-xl font-semibold',
    h5: 'text-lg font-semibold',
    h6: 'text-base font-semibold',
    body: 'text-base',
    caption: 'text-sm',
    button: 'text-base font-medium',
  }[variant];

  return (
    <Component className={`${variantClasses} ${className}`} style={styles}>
      {children}
    </Component>
  );
}

// React Native implementation (for reference)
export function ThemedTextNative({
  variant = 'body',
  color,
  align = 'left',
  weight = 'normal',
  italic = false,
  underline = false,
  children,
  style = {},
  ...props
}: ThemedTextProps & Omit<RNTextProps, 'style'>) {
  const { theme } = useTheme();

  // Map variant to font size and weight
  const variantStyles = {
    h1: { fontSize: 32, fontWeight: 'bold' },
    h2: { fontSize: 28, fontWeight: 'bold' },
    h3: { fontSize: 24, fontWeight: 'bold' },
    h4: { fontSize: 20, fontWeight: '600' },
    h5: { fontSize: 18, fontWeight: '600' },
    h6: { fontSize: 16, fontWeight: '600' },
    body: { fontSize: 16, fontWeight: 'normal' },
    caption: { fontSize: 14, fontWeight: 'normal' },
    button: { fontSize: 16, fontWeight: '500' },
  }[variant];

  // Build style object
  const styles = {
    color: color || theme.colors.text,
    textAlign: align,
    fontWeight: weight,
    fontStyle: italic ? 'italic' : 'normal',
    textDecorationLine: underline ? 'underline' : 'none',
    ...variantStyles,
    ...style,
  };

  return (
    <RNText style={styles} {...props}>
      {children}
    </RNText>
  );
}
```

**Usage:**

```tsx
// Example usage of the cross-platform component adaptation pattern
// Web usage
<ThemedText
  variant="h1"
  color="primary"
  align="center"
  className="my-4"
>
  Dashboard Overview
</ThemedText>

// React Native usage (for reference)
<ThemedTextNative
  variant="h1"
  color="primary"
  align="center"
  style={{ marginVertical: 16 }}
>
  Dashboard Overview
</ThemedTextNative>
```

**Benefits:**

- Ensures consistent UI across platforms
- Leverages platform-specific optimizations
- Simplifies cross-platform development
- Reduces code duplication
- Improves maintainability through shared interfaces

## Pattern: SWR Data Fetching

**Description:**
A pattern for fetching and caching data using the SWR (stale-while-revalidate) library. This pattern ensures that data is always up-to-date while providing a good user experience through caching and revalidation.

**Components:**

1. **SWR Configuration**: Configuration for the SWR library
2. **API Service Integration**: Integration with the API service layer
3. **Error Handling**: Logic for handling errors during data fetching
4. **Revalidation Strategy**: Strategy for revalidating data

**Implementation:**

```typescript
// Example implementation pattern for SWR data fetching
// src/lib/api/swr.ts
import { SWRConfig, SWRConfiguration } from 'swr';
import { ApiError } from '@/types/api';
import { handleApiError } from './errorHandler';

export const swrDefaultConfig: SWRConfiguration = {
  errorRetryCount: 3,
  errorRetryInterval: 5000,
  focusThrottleInterval: 5000,
  dedupingInterval: 2000,
  loadingTimeout: 3000,
  onError: (error: ApiError) => {
    handleApiError(error);
  },
  revalidateOnFocus: true,
  revalidateOnReconnect: true,
  revalidateIfStale: true,
  shouldRetryOnError: (error: ApiError) => {
    // Don't retry on client errors (4xx)
    return !(error.status >= 400 && error.status < 500);
  },
};

export function SWRProvider({ children }: { children: React.ReactNode }) {
  return <SWRConfig value={swrDefaultConfig}>{children}</SWRConfig>;
}

// Custom hook for API data fetching with SWR
import useSWR, { SWRResponse, SWRConfiguration } from 'swr';
import { ApiResponse } from '@/types/api';
import { apiService } from '@/services/api';

export function useApiSWR<T>(
  url: string | null,
  options?: SWRConfiguration
): SWRResponse<T, ApiError> {
  const fetcher = async (url: string) => {
    const response = await apiService.get<ApiResponse<T>>(url);
    return response.data;
  };

  return useSWR<T, ApiError>(url, fetcher, options);
}
```

**Usage:**

```tsx
// Example usage of the SWR data fetching pattern
import { useApiSWR } from '@/lib/api/swr';
import { User } from '@/types/admin';

function UserList() {
  const { data, error, isLoading, mutate } = useApiSWR<User[]>('/api/admin/users');

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  return (
    <div>
      <h1>Users</h1>
      <button onClick={() => mutate()}>Refresh</button>
      <ul>
        {data?.map(user => (
          <li key={user.id}>{user.displayName}</li>
        ))}
      </ul>
    </div>
  );
}
```

**Benefits:**

- Provides automatic revalidation and refetching
- Implements caching for better performance
- Handles loading and error states
- Supports optimistic updates
- Reduces network requests through deduplication

## Pattern: API Gateway

**Description:**
A pattern for routing API requests through a central gateway. This pattern ensures that all API requests are properly authenticated, logged, and routed to the appropriate service.

**Components:**

1. **Request Router**: Logic for routing requests to the appropriate service
2. **Authentication Middleware**: Middleware for authenticating requests
3. **Response Formatter**: Logic for formatting responses consistently
4. **Error Handler**: Logic for handling errors consistently

**Implementation:**

```typescript
// Example implementation pattern for API gateway
// src/pages/api/[[...path]].ts
import { NextApiRequest, NextApiResponse } from 'next';
import httpProxy from 'http-proxy';
import { adminAuthMiddleware } from '@/middleware/adminAuth';

// Create a proxy server instance
const proxy = httpProxy.createProxyServer({
  target: process.env.INTERNAL_API_URL,
  changeOrigin: true,
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Apply admin auth middleware
  await adminAuthMiddleware(req, res, async () => {
    // Add client platform to headers
    req.headers['x-client-platform'] = req.headers['user-agent']?.includes('Mobile')
      ? 'mobile'
      : 'web';

    // Add API version
    req.headers['x-api-version'] = '1.0';

    // Handle the proxy request
    await new Promise<void>((resolve, reject) => {
      proxy.web(req, res, { target: process.env.INTERNAL_API_URL }, err => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  });
}
```

**Usage:**

```typescript
// Example usage of the API gateway pattern
// Client-side API call
import { apiService } from '@/services/api';

// The request will be routed through the API gateway
const response = await apiService.get('/api/admin/users');
```

**Benefits:**

- Centralizes request handling
- Ensures consistent authentication
- Simplifies cross-platform compatibility
- Provides a single point for logging and monitoring
- Enables versioning and content negotiation

## Pattern: Enhanced Widget Components (May 23, 2025)

**Description:**
A pattern for creating advanced monitoring widgets with consistent styling, behavior, and data integration. This pattern ensures that all dashboard widgets follow the same design principles while providing specialized functionality.

**Components:**

1. **Base Widget Container**: A reusable container component for all widgets
2. **Widget Header**: A standardized header component with title and actions
3. **Widget Content**: Content area with specialized visualization
4. **Widget Footer**: Optional footer with additional actions or information
5. **Widget Controls**: Interactive controls for filtering and configuration

**Implementation:**

```typescript
// Example implementation pattern for enhanced widget components
// src/components/dashboard/widgets/EnhancedWidget.tsx

import React from 'react';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/Card';
import { IconButton } from '@/components/ui/IconButton';
import { Tooltip } from '@/components/ui/Tooltip';

export type WidgetSize = 'small' | 'medium' | 'large' | 'extra-large';

export interface EnhancedWidgetProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  size?: WidgetSize;
  actions?: React.ReactNode[];
  footer?: React.ReactNode;
  isLoading?: boolean;
  error?: Error | null;
  onRefresh?: () => void;
  children: React.ReactNode;
  className?: string;
}

export function EnhancedWidget({
  title,
  subtitle,
  icon,
  size = 'medium',
  actions = [],
  footer,
  isLoading = false,
  error = null,
  onRefresh,
  children,
  className = '',
}: EnhancedWidgetProps) {
  // Size-based classes
  const sizeClasses = {
    small: 'col-span-1',
    medium: 'col-span-2',
    large: 'col-span-3',
    'extra-large': 'col-span-4',
  }[size];

  return (
    <Card className={`dashboard-widget ${sizeClasses} ${className}`}>
      <CardHeader className="widget-header">
        <div className="widget-title-container">
          {icon && <div className="widget-icon">{icon}</div>}
          <div className="widget-title-content">
            <h3 className="widget-title">{title}</h3>
            {subtitle && <p className="widget-subtitle">{subtitle}</p>}
          </div>
        </div>
        <div className="widget-actions">
          {onRefresh && (
            <Tooltip content="Refresh">
              <IconButton
                icon="refresh"
                onClick={onRefresh}
                disabled={isLoading}
                aria-label="Refresh widget"
              />
            </Tooltip>
          )}
          {actions.map((action, index) => (
            <div key={`action-${index}`} className="widget-action">
              {action}
            </div>
          ))}
        </div>
      </CardHeader>
      <CardContent className="widget-content">
        {isLoading ? (
          <div className="widget-loading">
            <LoadingSpinner size="medium" />
            <p>Loading data...</p>
          </div>
        ) : error ? (
          <div className="widget-error">
            <ErrorIcon />
            <p>Error: {error.message}</p>
            {onRefresh && (
              <button onClick={onRefresh} className="retry-button">
                Retry
              </button>
            )}
          </div>
        ) : (
          children
        )}
      </CardContent>
      {footer && <CardFooter className="widget-footer">{footer}</CardFooter>}
    </Card>
  );
}
```

**Usage:**

```tsx
// Example usage of the enhanced widget pattern
import { EnhancedWidget } from '@/components/dashboard/widgets/EnhancedWidget';
import { MetricCard } from '@/components/dashboard/metrics/MetricCard';
import { useApiSWR } from '@/lib/api/swr';
import { BetSlipMetrics } from '@/types/analytics';

function BetSlipPerformanceWidget() {
  const { data, error, isLoading, mutate } = useApiSWR<BetSlipMetrics>(
    '/api/analytics/bet-slip-performance'
  );

  return (
    <EnhancedWidget
      title="Bet Slip Performance"
      subtitle="Last 24 hours"
      size="large"
      isLoading={isLoading}
      error={error}
      onRefresh={() => mutate()}
      footer={
        <a href="/analytics/bet-slips" className="view-details-link">
          View detailed analytics
        </a>
      }
    >
      <div className="metrics-grid">
        <MetricCard
          title="OCR Success Rate"
          value={`${data?.ocrSuccessRate || 0}%`}
          target="95%"
          trend={data?.ocrSuccessRateTrend}
          status={data?.ocrSuccessRate >= 95 ? 'success' : 'warning'}
        />
        <MetricCard
          title="Avg Processing Time"
          value={`${data?.avgProcessingTime || 0}s`}
          target="<3s"
          trend={data?.avgProcessingTimeTrend}
          status={data?.avgProcessingTime <= 3 ? 'success' : 'warning'}
        />
        <MetricCard
          title="Queue Length"
          value={data?.queueLength || 0}
          target="<50"
          trend={data?.queueLengthTrend}
          status={data?.queueLength <= 50 ? 'success' : 'warning'}
        />
      </div>
    </EnhancedWidget>
  );
}
```

**Benefits:**

- Ensures consistent styling and behavior across all widgets
- Handles loading and error states automatically
- Provides standardized layout and structure
- Simplifies widget implementation
- Improves maintainability through shared components

## Pattern: Real-time Data Visualization

**Description:**
A pattern for creating real-time data visualizations with WebSocket integration. This pattern ensures that data visualizations are updated in real-time without requiring manual refreshes.

**Components:**

1. **WebSocket Connection**: Logic for establishing and maintaining WebSocket connections
2. **Data Transformation**: Logic for transforming raw data into visualization-ready format
3. **Visualization Components**: Reusable visualization components (charts, graphs, etc.)
4. **Update Mechanism**: Logic for updating visualizations when new data arrives

**Implementation:**

```typescript
// Example implementation pattern for real-time data visualization
// src/hooks/useRealtimeData.ts

import { useState, useEffect } from 'react';
import { useWebSocket } from '@/hooks/useWebSocket';

export interface RealtimeDataOptions<T> {
  endpoint: string;
  initialData?: T;
  transformData?: (data: any) => T;
  onError?: (error: Error) => void;
}

export function useRealtimeData<T>({
  endpoint,
  initialData,
  transformData = data => data as T,
  onError,
}: RealtimeDataOptions<T>) {
  const [data, setData] = useState<T | undefined>(initialData);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const { socket, status } = useWebSocket({
    url: `${process.env.NEXT_PUBLIC_WS_URL}${endpoint}`,
    onOpen: () => {
      setIsConnected(true);
      setError(null);
    },
    onClose: () => {
      setIsConnected(false);
    },
    onError: err => {
      setError(err);
      if (onError) onError(err);
    },
    onMessage: message => {
      try {
        const parsedData = JSON.parse(message.data);
        const transformedData = transformData(parsedData);
        setData(transformedData);
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        if (onError) onError(error);
      }
    },
  });

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.close();
      }
    };
  }, [socket]);

  return {
    data,
    isConnected,
    error,
    status,
  };
}
```

**Usage:**

```tsx
// Example usage of the real-time data visualization pattern
import { useRealtimeData } from '@/hooks/useRealtimeData';
import { LineChart } from '@/components/charts/LineChart';
import { SystemMetrics } from '@/types/monitoring';

function SystemHealthChart() {
  const { data, isConnected, error } = useRealtimeData<SystemMetrics>({
    endpoint: '/monitoring/system-health',
    initialData: {
      timestamps: [],
      apiResponseTimes: [],
      dbQueryTimes: [],
      functionsHealth: [],
    },
    transformData: rawData => ({
      timestamps: [...(data?.timestamps || []), rawData.timestamp],
      apiResponseTimes: [...(data?.apiResponseTimes || []), rawData.apiResponseTime],
      dbQueryTimes: [...(data?.dbQueryTimes || []), rawData.dbQueryTime],
      functionsHealth: [...(data?.functionsHealth || []), rawData.functionsHealth],
    }),
  });

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  return (
    <div className="chart-container">
      <div className="connection-status">Status: {isConnected ? 'Connected' : 'Disconnected'}</div>
      <LineChart
        data={data}
        series={[
          { name: 'API Response Time', dataKey: 'apiResponseTimes' },
          { name: 'DB Query Time', dataKey: 'dbQueryTimes' },
          { name: 'Functions Health', dataKey: 'functionsHealth' },
        ]}
        xAxis={{ dataKey: 'timestamps', type: 'time' }}
        yAxis={{ name: 'Time (ms)' }}
      />
    </div>
  );
}
```

**Benefits:**

- Provides real-time updates without manual refreshes
- Handles WebSocket connection management automatically
- Transforms raw data into visualization-ready format
- Manages error and connection states
- Improves user experience with live data

## Pattern: Process Monitoring Integration

**Description:**
A pattern for integrating background process monitoring with the admin dashboard. This pattern ensures that background processes are properly monitored and visualized in the dashboard.

**Components:**

1. **Process Status Indicator**: Visual indicator of process status
2. **Process Performance Metrics**: Visualization of process performance metrics
3. **Process Control Panel**: Interface for controlling processes
4. **Process History Viewer**: Interface for viewing process execution history

**Implementation:**

```typescript
// Example implementation pattern for process monitoring integration
// src/components/dashboard/monitoring/ProcessMonitor.tsx

import React from 'react';
import { useApiSWR } from '@/lib/api/swr';
import { useRealtimeData } from '@/hooks/useRealtimeData';
import { ProcessStatus, ProcessMetrics } from '@/types/monitoring';
import { StatusIndicator } from '@/components/ui/StatusIndicator';
import { Button } from '@/components/ui/Button';
import { apiService } from '@/services/api';

export interface ProcessMonitorProps {
  processId: string;
  processName: string;
  category: 'A' | 'B' | 'C' | 'D' | 'E';
  description?: string;
  canTrigger?: boolean;
}

export function ProcessMonitor({
  processId,
  processName,
  category,
  description,
  canTrigger = false,
}: ProcessMonitorProps) {
  // Get process status and metrics
  const {
    data: processData,
    error,
    isLoading,
    mutate,
  } = useApiSWR<ProcessStatus>(`/api/monitoring/processes/${processId}/status`);

  // Get real-time metrics
  const { data: realtimeMetrics } = useRealtimeData<ProcessMetrics>({
    endpoint: `/monitoring/processes/${processId}/metrics`,
    transformData: rawData => ({
      executionTime: rawData.executionTime,
      successRate: rawData.successRate,
      lastExecuted: new Date(rawData.lastExecuted),
      errorCount: rawData.errorCount,
    }),
  });

  // Trigger process manually
  const triggerProcess = async () => {
    try {
      await apiService.post(`/api/monitoring/processes/${processId}/trigger`);
      mutate(); // Refresh data
    } catch (error) {
      console.error('Failed to trigger process:', error);
    }
  };

  return (
    <div className="process-monitor">
      <div className="process-header">
        <div className="process-info">
          <h4 className="process-name">{processName}</h4>
          <span className="process-category">Category {category}</span>
        </div>
        <StatusIndicator
          status={processData?.status || 'unknown'}
          labels={{
            running: 'Running',
            idle: 'Idle',
            failed: 'Failed',
            disabled: 'Disabled',
            unknown: 'Unknown',
          }}
        />
      </div>

      {description && <p className="process-description">{description}</p>}

      <div className="process-metrics">
        <div className="metric">
          <span className="metric-label">Last Executed</span>
          <span className="metric-value">
            {realtimeMetrics?.lastExecuted
              ? new Date(realtimeMetrics.lastExecuted).toLocaleString()
              : 'Never'}
          </span>
        </div>
        <div className="metric">
          <span className="metric-label">Execution Time</span>
          <span className="metric-value">
            {realtimeMetrics?.executionTime ? `${realtimeMetrics.executionTime}ms` : 'N/A'}
          </span>
        </div>
        <div className="metric">
          <span className="metric-label">Success Rate</span>
          <span className="metric-value">
            {realtimeMetrics?.successRate ? `${realtimeMetrics.successRate}%` : 'N/A'}
          </span>
        </div>
        <div className="metric">
          <span className="metric-label">Error Count</span>
          <span className="metric-value">
            {realtimeMetrics?.errorCount !== undefined ? realtimeMetrics.errorCount : 'N/A'}
          </span>
        </div>
      </div>

      <div className="process-actions">
        <Button onClick={() => mutate()} variant="secondary" size="sm" disabled={isLoading}>
          Refresh
        </Button>
        {canTrigger && (
          <Button
            onClick={triggerProcess}
            variant="primary"
            size="sm"
            disabled={isLoading || processData?.status === 'running'}
          >
            Trigger Now
          </Button>
        )}
      </div>
    </div>
  );
}
```

**Usage:**

```tsx
// Example usage of the process monitoring integration pattern
import { ProcessMonitor } from '@/components/dashboard/monitoring/ProcessMonitor';
import { EnhancedWidget } from '@/components/dashboard/widgets/EnhancedWidget';

function BackgroundProcessesWidget() {
  return (
    <EnhancedWidget title="Background Processes" subtitle="Critical processes status" size="large">
      <div className="processes-grid">
        <ProcessMonitor
          processId="markAIPickOfDay"
          processName="Mark AI Pick of Day"
          category="A"
          description="Marks the top prediction as the AI Pick of the Day"
          canTrigger={true}
        />
        <ProcessMonitor
          processId="predictTodayGames"
          processName="Predict Today's Games"
          category="A"
          description="Predicts game outcomes using ML model"
          canTrigger={true}
        />
        <ProcessMonitor
          processId="scheduledFirestoreBackup"
          processName="Firestore Backup"
          category="A"
          description="Backs up Firestore data"
          canTrigger={true}
        />
        <ProcessMonitor
          processId="processScheduledNotifications"
          processName="Process Notifications"
          category="A"
          description="Processes scheduled notifications"
          canTrigger={true}
        />
      </div>
    </EnhancedWidget>
  );
}
```

**Benefits:**

- Provides real-time monitoring of background processes
- Enables manual triggering of critical processes
- Visualizes process performance metrics
- Integrates with the existing monitoring system
- Improves system reliability through better monitoring
