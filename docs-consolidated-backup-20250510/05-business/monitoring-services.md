# AI Sports Edge: Monitoring Services

This document provides an overview of the monitoring services implemented in the AI Sports Edge app to ensure reliability, performance, and security in production.

## Table of Contents

1. [Error Tracking](#error-tracking)
2. [Performance Monitoring](#performance-monitoring)
3. [Usage Analytics](#usage-analytics)
4. [Alerting System](#alerting-system)
5. [Logging Infrastructure](#logging-infrastructure)
6. [Integration](#integration)
7. [Best Practices](#best-practices)

## Error Tracking

The error tracking service uses Sentry to capture and report errors and exceptions in the app.

### Features

- **Automatic Error Capturing**: Automatically captures unhandled exceptions
- **Manual Error Reporting**: API for manually reporting errors
- **Breadcrumbs**: Tracks user actions leading up to an error
- **Context**: Adds additional context to errors
- **User Information**: Associates errors with specific users
- **Release Tracking**: Tracks errors by app version
- **Environment Separation**: Separates errors by environment (development, staging, production)

### Usage

```typescript
import { 
  captureException, 
  captureMessage, 
  addBreadcrumb 
} from './services/errorTrackingService';

// Capture an exception
try {
  // Some code that might throw
} catch (error) {
  captureException(error);
}

// Capture a message
captureMessage('Something happened', 'info');

// Add a breadcrumb
addBreadcrumb({
  category: 'auth',
  message: 'User logged in',
  level: 'info'
});
```

### Configuration

The error tracking service is configured in `services/errorTrackingService.ts`. Key configuration options include:

- **DSN**: Sentry project identifier
- **Environment**: Current environment (development, staging, production)
- **Release**: App version
- **Trace Sample Rate**: Percentage of transactions to sample
- **Before Send**: Function to filter sensitive information

## Performance Monitoring

The performance monitoring service tracks app performance metrics, including navigation, API requests, and UI rendering.

### Features

- **Transaction Tracking**: Tracks performance of key operations
- **Navigation Monitoring**: Measures screen transition times
- **API Request Monitoring**: Tracks API request performance
- **UI Render Monitoring**: Measures component render times
- **Custom Transactions**: API for tracking custom operations
- **Performance Metrics**: Collects device and app metrics

### Usage

```typescript
import { 
  trackNavigation,
  trackApiRequest,
  trackUiRender,
  trackDataOperation,
  trackUserInteraction
} from './services/performanceMonitoringService';

// Track navigation
trackNavigation('HomeScreen', 'LoginScreen');

// Track API request
trackApiRequest('https://api.example.com/data', 'GET', 200, 150);

// Track UI render
trackUiRender('HomeScreen', 50);

// Track data operation
trackDataOperation('fetchUserData', 200, { userId: '123' });

// Track user interaction
trackUserInteraction('buttonPress', 100, { buttonId: 'login' });
```

### Transaction Types

The performance monitoring service defines several transaction types:

- **Navigation**: Screen transitions
- **API Request**: Network requests
- **UI Render**: Component rendering
- **Data Operation**: Data processing
- **Background Task**: Background operations
- **User Interaction**: User actions

## Usage Analytics

The usage analytics service uses Firebase Analytics to track user behavior and app usage.

### Features

- **Event Tracking**: Tracks user actions and app events
- **Screen Tracking**: Tracks screen views
- **User Properties**: Tracks user attributes
- **Conversion Tracking**: Tracks key conversion events
- **Custom Events**: API for tracking custom events
- **Automatic Collection**: Automatically collects basic usage data

### Usage

```typescript
import { 
  logEvent, 
  logScreenView, 
  setUserProperty,
  AnalyticsEvent,
  UserProperty
} from './services/analyticsService';

// Log an event
logEvent(AnalyticsEvent.VIEW_GAME, { gameId: '123' });

// Log a screen view
logScreenView('HomeScreen');

// Set a user property
setUserProperty(UserProperty.FAVORITE_SPORT, 'basketball');
```

### Event Types

The analytics service defines several event types:

- **Screen Views**: Track screen navigation
- **Authentication Events**: Track login, signup, etc.
- **Subscription Events**: Track subscription actions
- **Content Events**: Track content viewing
- **Betting Events**: Track betting actions
- **Feature Usage Events**: Track feature usage
- **User Preference Events**: Track preference changes
- **Error Events**: Track errors

## Alerting System

The alerting system provides real-time notifications for critical issues in the app.

### Features

- **Multiple Severity Levels**: Info, warning, error, critical
- **Multiple Categories**: System, security, performance, user experience, business
- **Multiple Channels**: Sentry, email, Slack, PagerDuty
- **Throttling**: Prevents alert storms
- **Configurable Thresholds**: Different thresholds for different categories
- **Context**: Adds additional context to alerts

### Usage

```typescript
import { 
  sendSystemAlert,
  sendSecurityAlert,
  sendPerformanceAlert,
  sendUserExperienceAlert,
  sendBusinessAlert,
  AlertSeverity
} from './services/alertingService';

// Send a system alert
sendSystemAlert(
  'Database Connection Failed',
  'Unable to connect to the database',
  AlertSeverity.ERROR,
  { attempts: 3, lastError: 'Connection timeout' }
);

// Send a performance alert
sendPerformanceAlert(
  'Slow API Response',
  'API response time exceeded threshold',
  AlertSeverity.WARNING,
  { endpoint: '/api/data', responseTime: 5000 }
);
```

### Alert Categories

The alerting system defines several alert categories:

- **System**: System-level issues
- **Security**: Security-related issues
- **Performance**: Performance-related issues
- **User Experience**: Issues affecting user experience
- **Business**: Business-related issues

## Logging Infrastructure

The logging infrastructure provides structured logging for the app.

### Features

- **Multiple Log Levels**: Trace, debug, info, warn, error, fatal
- **Multiple Categories**: App, API, auth, navigation, performance, storage, UI, business
- **Structured Logging**: JSON-formatted logs
- **Console Logging**: Logs to console in development
- **Remote Logging**: Sends logs to a remote logging service in production
- **Sentry Integration**: Sends logs to Sentry
- **Context**: Adds additional context to logs

### Usage

```typescript
import { 
  trace,
  debug,
  info,
  warn,
  error,
  fatal,
  LogCategory
} from './services/loggingService';

// Log an info message
info(LogCategory.APP, 'Application started');

// Log an error
try {
  // Some code that might throw
} catch (err) {
  error(LogCategory.API, 'API request failed', err, { endpoint: '/api/data' });
}
```

### Log Categories

The logging infrastructure defines several log categories:

- **App**: Application-level logs
- **API**: API-related logs
- **Auth**: Authentication-related logs
- **Navigation**: Navigation-related logs
- **Performance**: Performance-related logs
- **Storage**: Storage-related logs
- **UI**: UI-related logs
- **Business**: Business-related logs

## Integration

All monitoring services are integrated in the `App.tsx` file:

```typescript
// Initialize monitoring services
useEffect(() => {
  // Initialize services
  initErrorTracking();
  initPerformanceMonitoring();
  initAnalytics();
  initAlerting();
  initLogging();
  
  // Log app start
  info(LogCategory.APP, 'Application started');
}, []);
```

The services are also integrated with each other:

- **Error Tracking → Alerting**: Errors trigger alerts
- **Error Tracking → Logging**: Errors are logged
- **Performance Monitoring → Alerting**: Performance issues trigger alerts
- **Performance Monitoring → Logging**: Performance metrics are logged
- **Analytics → Logging**: Key events are logged

## Best Practices

### Error Tracking

1. **Capture All Errors**: Wrap all error-prone code in try/catch blocks
2. **Add Context**: Include relevant context with errors
3. **Use Breadcrumbs**: Add breadcrumbs for user actions
4. **Filter Sensitive Data**: Don't send sensitive data to Sentry
5. **Set User Information**: Associate errors with users

### Performance Monitoring

1. **Track Key Transactions**: Focus on critical user journeys
2. **Set Baselines**: Establish performance baselines
3. **Monitor Trends**: Watch for performance degradation
4. **Optimize Hot Spots**: Focus on the slowest operations
5. **Test on Real Devices**: Don't rely solely on emulators

### Usage Analytics

1. **Define Key Events**: Focus on important user actions
2. **Use Consistent Names**: Use consistent naming conventions
3. **Limit Event Count**: Don't track too many events
4. **Respect Privacy**: Don't track sensitive information
5. **Test Tracking**: Verify events are being tracked correctly

### Alerting

1. **Set Appropriate Thresholds**: Avoid alert fatigue
2. **Define Severity Levels**: Use consistent severity levels
3. **Include Context**: Provide enough information to diagnose issues
4. **Define Ownership**: Assign alerts to specific teams
5. **Document Response Procedures**: Document how to respond to alerts

### Logging

1. **Use Appropriate Levels**: Use the right log level for each message
2. **Be Concise**: Keep log messages short and to the point
3. **Include Context**: Add relevant context to logs
4. **Structure Logs**: Use structured logging
5. **Rotate Logs**: Implement log rotation to manage size

## Conclusion

The monitoring services implemented in AI Sports Edge provide comprehensive visibility into the app's behavior, performance, and usage. By leveraging these services, the team can quickly identify and resolve issues, optimize performance, and improve the user experience.

For more information on each service, refer to the individual service files:

- `services/errorTrackingService.ts`
- `services/performanceMonitoringService.ts`
- `services/analyticsService.ts`
- `services/alertingService.ts`
- `services/loggingService.ts`