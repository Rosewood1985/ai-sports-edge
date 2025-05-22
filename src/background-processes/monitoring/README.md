# Background Process Monitoring System

This directory contains a comprehensive monitoring system for background processes in the AI Sports Edge application. The system tracks execution times, success rates, error patterns, and resource usage to help identify optimization opportunities.

## Directory Structure

```
monitoring/
├── process-monitor.js       # Core monitoring functionality
├── process-wrappers.js      # Wrapper functions for different process types
├── dashboard/               # Dashboard components for visualization
│   └── ProcessMonitoringDashboard.jsx  # Main dashboard component
└── README.md                # This file
```

## Features

- **Process Execution Tracking**: Logs the start and completion of each process execution
- **Performance Metrics**: Tracks execution times, success rates, and error patterns
- **Real-time Alerts**: Generates alerts for slow executions and errors
- **Dashboard Visualization**: Provides a visual interface for monitoring process performance
- **Historical Data**: Maintains historical data for trend analysis

## How to Use

### 1. Wrap Background Processes

To monitor a background process, wrap it using the appropriate wrapper function from `process-wrappers.js`:

```javascript
// For Firebase Cloud Functions
const { wrapCloudFunction } = require('./monitoring/process-wrappers');

// Original function
exports.myFunction = functions.https.onCall((data, context) => {
  // Function implementation
});

// Wrapped function with monitoring
exports.myFunction = functions.https.onCall(
  wrapCloudFunction((data, context) => {
    // Function implementation
  }, 'myFunction')
);
```

### 2. Wrap Different Process Types

Different wrapper functions are available for different types of processes:

```javascript
// For scheduled functions
exports.scheduledFunction = functions.pubsub.schedule('every 5 minutes').onRun(
  wrapScheduledFunction(context => {
    // Function implementation
  }, 'scheduledFunction')
);

// For Firestore trigger functions
exports.firestoreFunction = functions.firestore.document('collection/{docId}').onWrite(
  wrapFirestoreFunction((snapshot, context) => {
    // Function implementation
  }, 'firestoreFunction')
);

// For Auth trigger functions
exports.authFunction = functions.auth.user().onCreate(
  wrapAuthFunction((user, context) => {
    // Function implementation
  }, 'authFunction')
);
```

### 3. View Monitoring Data

The monitoring data is stored in Firestore with the following structure:

```
processMonitoring/
├── executions/
│   ├── processName1/
│   │   ├── executionId1: { execution data }
│   │   └── executionId2: { execution data }
│   └── processName2/
│       └── ...
├── metrics/
│   ├── processName1/
│   │   └── current: { aggregated metrics }
│   └── processName2/
│       └── ...
└── alerts/
    ├── processName1/
    │   ├── alertId1: { alert data }
    │   └── alertId2: { alert data }
    └── processName2/
        └── ...
```

### 4. Use the Dashboard

The `ProcessMonitoringDashboard` component provides a visual interface for monitoring process performance. To use it:

```jsx
import ProcessMonitoringDashboard from './monitoring/dashboard/ProcessMonitoringDashboard';

// In your React component
return (
  <div>
    <ProcessMonitoringDashboard />
  </div>
);
```

## API Reference

### process-monitor.js

#### `logProcessStart(processName, metadata)`

Logs the start of a process execution.

- **Parameters**:
  - `processName` (string): Name of the process
  - `metadata` (object, optional): Additional metadata about the execution
- **Returns**: Promise resolving to an execution ID (string)

#### `logProcessCompletion(executionId, processName, status, result, error)`

Logs the completion of a process execution.

- **Parameters**:
  - `executionId` (string): Execution ID from logProcessStart
  - `processName` (string): Name of the process
  - `status` (string): Status of the execution ('success', 'error')
  - `result` (object, optional): Result of the execution
  - `error` (Error, optional): Error object if execution failed
- **Returns**: Promise resolving to void

#### `getProcessMetrics(processName)`

Gets metrics for a specific process.

- **Parameters**:
  - `processName` (string): Name of the process
- **Returns**: Promise resolving to process metrics object

#### `getRecentExecutions(processName, limit)`

Gets recent executions for a specific process.

- **Parameters**:
  - `processName` (string): Name of the process
  - `limit` (number, optional): Maximum number of executions to return (default: 10)
- **Returns**: Promise resolving to an array of execution objects

#### `getActiveAlerts()`

Gets active alerts for all processes.

- **Returns**: Promise resolving to an array of alert objects

#### `acknowledgeAlert(processName, alertId)`

Acknowledges an alert.

- **Parameters**:
  - `processName` (string): Name of the process
  - `alertId` (string): ID of the alert
- **Returns**: Promise resolving to void

#### `cleanupMonitoringData()`

Cleans up old monitoring data.

- **Returns**: Promise resolving to void

### process-wrappers.js

#### `wrapCloudFunction(originalFunction, processName)`

Wraps a Firebase Cloud Function to add monitoring.

- **Parameters**:
  - `originalFunction` (function): The original function to wrap
  - `processName` (string): Name of the process for monitoring
- **Returns**: Wrapped function with monitoring

#### `wrapScheduledFunction(originalFunction, processName)`

Wraps a scheduled Cloud Function to add monitoring.

- **Parameters**:
  - `originalFunction` (function): The original function to wrap
  - `processName` (string): Name of the process for monitoring
- **Returns**: Wrapped function with monitoring

#### `wrapFirestoreFunction(originalFunction, processName)`

Wraps a Firestore trigger function to add monitoring.

- **Parameters**:
  - `originalFunction` (function): The original function to wrap
  - `processName` (string): Name of the process for monitoring
- **Returns**: Wrapped function with monitoring

#### `wrapAuthFunction(originalFunction, processName)`

Wraps an Auth trigger function to add monitoring.

- **Parameters**:
  - `originalFunction` (function): The original function to wrap
  - `processName` (string): Name of the process for monitoring
- **Returns**: Wrapped function with monitoring

## Configuration

The monitoring system can be configured by modifying the `monitoringConfig` object in `process-monitor.js`:

```javascript
const monitoringConfig = {
  // How often to aggregate metrics (in milliseconds)
  aggregationInterval: 3600000, // 1 hour

  // How long to retain detailed logs (in milliseconds)
  detailedLogRetention: 7 * 24 * 60 * 60 * 1000, // 7 days

  // How long to retain aggregated metrics (in milliseconds)
  aggregatedMetricsRetention: 90 * 24 * 60 * 60 * 1000, // 90 days

  // Threshold for slow execution alerts (in milliseconds)
  slowExecutionThreshold: 5000, // 5 seconds

  // Error rate threshold for alerts
  errorRateThreshold: 0.05, // 5%
};
```

## Best Practices

1. **Monitor Critical Processes**: Prioritize monitoring for critical processes that impact user experience or system stability.
2. **Set Appropriate Thresholds**: Adjust alert thresholds based on the expected performance of each process.
3. **Clean Up Old Data**: Schedule regular cleanup of old monitoring data to prevent database bloat.
4. **Review Alerts Regularly**: Set up a process to review and address alerts regularly.
5. **Optimize Based on Metrics**: Use the monitoring data to identify optimization opportunities.

## Extending the System

The monitoring system can be extended in several ways:

1. **Add New Wrapper Types**: Create new wrapper functions for different types of processes.
2. **Enhance Metrics Collection**: Add additional metrics such as memory usage or CPU utilization.
3. **Implement Notifications**: Add notification capabilities for alerts (email, Slack, etc.).
4. **Create Custom Dashboards**: Develop specialized dashboards for specific process types.
5. **Add Predictive Analytics**: Implement machine learning to predict process failures or performance degradation.
