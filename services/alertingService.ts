import { Platform } from 'react-native';

import { captureMessage } from './errorTrackingService';
import { safeErrorCapture } from './errorUtils';
import { info, error as logError, LogCategory } from './loggingService';

/**
 * Alerting Service
 *
 * This service provides alerting functionality for critical issues.
 * It integrates with various alerting channels to notify developers and operations teams.
 */

// Alert severity levels
export enum AlertSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical',
}

// Alert categories
export enum AlertCategory {
  SYSTEM = 'system',
  SECURITY = 'security',
  PERFORMANCE = 'performance',
  USER_EXPERIENCE = 'user_experience',
  BUSINESS = 'business',
}

// Alert channels
export enum AlertChannel {
  SENTRY = 'sentry',
  EMAIL = 'email',
  SLACK = 'slack',
  PAGERDUTY = 'pagerduty',
}

// Alert configuration
interface AlertConfig {
  enabled: boolean;
  minSeverity: AlertSeverity;
  channels: AlertChannel[];
  throttleMs: number;
}

// Default alert configuration
const defaultAlertConfig: AlertConfig = {
  enabled: true,
  minSeverity: AlertSeverity.WARNING,
  channels: [AlertChannel.SENTRY],
  throttleMs: 60000, // 1 minute
};

// Alert configuration by category
const alertConfigs: Record<AlertCategory, AlertConfig> = {
  [AlertCategory.SYSTEM]: {
    ...defaultAlertConfig,
    minSeverity: AlertSeverity.ERROR,
  },
  [AlertCategory.SECURITY]: {
    ...defaultAlertConfig,
    minSeverity: AlertSeverity.WARNING,
    channels: [AlertChannel.SENTRY, AlertChannel.EMAIL],
  },
  [AlertCategory.PERFORMANCE]: {
    ...defaultAlertConfig,
    minSeverity: AlertSeverity.WARNING,
  },
  [AlertCategory.USER_EXPERIENCE]: {
    ...defaultAlertConfig,
    minSeverity: AlertSeverity.ERROR,
  },
  [AlertCategory.BUSINESS]: {
    ...defaultAlertConfig,
    minSeverity: AlertSeverity.WARNING,
  },
};

// Alert throttling
const alertThrottles: Record<string, number> = {};

/**
 * Initialize alerting
 */
export const initAlerting = () => {
  console.log('initAlerting: Starting initialization');
  try {
    // Set up alerting integrations
    // Note: Sentry is already set up in errorTrackingService.ts
    console.log('initAlerting: Setting up integrations');

    console.log('initAlerting: Initialization completed successfully');
    info(LogCategory.APP, 'Alerting service initialized successfully');
    return true;
  } catch (error) {
    console.error('initAlerting: Failed to initialize alerting:', error);
    logError(LogCategory.APP, 'Failed to initialize alerting service', error as Error);
    safeErrorCapture(error as Error);
    return false;
  }
};

/**
 * Send an alert
 * @param title Alert title
 * @param message Alert message
 * @param severity Alert severity
 * @param category Alert category
 * @param data Additional data
 * @returns Whether the alert was sent
 */
export const sendAlert = (
  title: string,
  message: string,
  severity: AlertSeverity,
  category: AlertCategory,
  data?: Record<string, any>
): boolean => {
  try {
    // Get alert configuration
    const config = alertConfigs[category];

    // Check if alerting is enabled
    if (!config.enabled) {
      if (__DEV__) {
        console.log(`Alert not sent (disabled): ${title}`);
      }
      return false;
    }

    // Check if severity meets minimum threshold
    if (!isSeverityAtLeast(severity, config.minSeverity)) {
      if (__DEV__) {
        console.log(`Alert not sent (severity too low): ${title}`);
      }
      return false;
    }

    // Check if alert is throttled
    const alertKey = `${category}:${title}`;
    if (isAlertThrottled(alertKey, config.throttleMs)) {
      if (__DEV__) {
        console.log(`Alert not sent (throttled): ${title}`);
      }
      return false;
    }

    // Send alert to each channel
    const results = config.channels.map(channel =>
      sendAlertToChannel(channel, title, message, severity, category, data)
    );

    // Update throttle timestamp
    alertThrottles[alertKey] = Date.now();

    // Return true if at least one channel succeeded
    return results.some(result => result);
  } catch (error) {
    console.error('Failed to send alert:', error);
    logError(LogCategory.APP, 'Failed to send alert', error as Error);
    safeErrorCapture(error as Error);
    return false;
  }
};

/**
 * Send a system alert
 * @param title Alert title
 * @param message Alert message
 * @param severity Alert severity
 * @param data Additional data
 * @returns Whether the alert was sent
 */
export const sendSystemAlert = (
  title: string,
  message: string,
  severity: AlertSeverity,
  data?: Record<string, any>
): boolean => {
  return sendAlert(title, message, severity, AlertCategory.SYSTEM, data);
};

/**
 * Send a security alert
 * @param title Alert title
 * @param message Alert message
 * @param severity Alert severity
 * @param data Additional data
 * @returns Whether the alert was sent
 */
export const sendSecurityAlert = (
  title: string,
  message: string,
  severity: AlertSeverity,
  data?: Record<string, any>
): boolean => {
  return sendAlert(title, message, severity, AlertCategory.SECURITY, data);
};

/**
 * Send a performance alert
 * @param title Alert title
 * @param message Alert message
 * @param severity Alert severity
 * @param data Additional data
 * @returns Whether the alert was sent
 */
export const sendPerformanceAlert = (
  title: string,
  message: string,
  severity: AlertSeverity,
  data?: Record<string, any>
): boolean => {
  return sendAlert(title, message, severity, AlertCategory.PERFORMANCE, data);
};

/**
 * Send a user experience alert
 * @param title Alert title
 * @param message Alert message
 * @param severity Alert severity
 * @param data Additional data
 * @returns Whether the alert was sent
 */
export const sendUserExperienceAlert = (
  title: string,
  message: string,
  severity: AlertSeverity,
  data?: Record<string, any>
): boolean => {
  return sendAlert(title, message, severity, AlertCategory.USER_EXPERIENCE, data);
};

/**
 * Send a business alert
 * @param title Alert title
 * @param message Alert message
 * @param severity Alert severity
 * @param data Additional data
 * @returns Whether the alert was sent
 */
export const sendBusinessAlert = (
  title: string,
  message: string,
  severity: AlertSeverity,
  data?: Record<string, any>
): boolean => {
  return sendAlert(title, message, severity, AlertCategory.BUSINESS, data);
};

/**
 * Send an alert to a specific channel
 * @param channel Alert channel
 * @param title Alert title
 * @param message Alert message
 * @param severity Alert severity
 * @param category Alert category
 * @param data Additional data
 * @returns Whether the alert was sent
 */
const sendAlertToChannel = (
  channel: AlertChannel,
  title: string,
  message: string,
  severity: AlertSeverity,
  category: AlertCategory,
  data?: Record<string, any>
): boolean => {
  try {
    // Prepare alert data
    const alertData = {
      title,
      message,
      severity,
      category,
      timestamp: new Date().toISOString(),
      platform: Platform.OS,
      ...data,
    };

    // Send alert to the appropriate channel
    switch (channel) {
      case AlertChannel.SENTRY:
        return sendAlertToSentry(title, message, severity, alertData);
      case AlertChannel.EMAIL:
        return sendAlertToEmail(title, message, severity, category, alertData);
      case AlertChannel.SLACK:
        return sendAlertToSlack(title, message, severity, category, alertData);
      case AlertChannel.PAGERDUTY:
        return sendAlertToPagerDuty(title, message, severity, category, alertData);
      default:
        console.warn(`Unknown alert channel: ${channel}`);
        return false;
    }
  } catch (error) {
    console.error(`Failed to send alert to ${channel}:`, error);
    logError(LogCategory.APP, `Failed to send alert to ${channel}`, error as Error);
    safeErrorCapture(error as Error);
    return false;
  }
};

/**
 * Send an alert to Sentry
 * @param title Alert title
 * @param message Alert message
 * @param severity Alert severity
 * @param data Additional data
 * @returns Whether the alert was sent
 */
const sendAlertToSentry = (
  title: string,
  message: string,
  severity: AlertSeverity,
  data: Record<string, any>
): boolean => {
  try {
    // Map severity to Sentry level
    const level = mapSeverityToSentryLevel(severity);

    // Log the alert
    console.log(`sendAlertToSentry: Sending alert "${title}: ${message}" with level ${level}`);

    // Capture message in Sentry - note that we can't pass the level directly
    // since captureMessage only takes a message parameter
    captureMessage(`${title}: ${message}`);

    // Log the alert in our logging system
    switch (severity) {
      case AlertSeverity.INFO:
        info(LogCategory.APP, `Alert: ${title}`, data);
        break;
      case AlertSeverity.WARNING:
        logError(LogCategory.APP, `Alert: ${title}`, undefined, data);
        break;
      case AlertSeverity.ERROR:
      case AlertSeverity.CRITICAL:
        logError(LogCategory.APP, `Alert: ${title}`, new Error(message), data);
        break;
    }

    if (__DEV__) {
      console.log(`Alert sent to Sentry: ${title}`);
    }

    return true;
  } catch (error) {
    console.error('Failed to send alert to Sentry:', error);
    logError(LogCategory.APP, 'Failed to send alert to Sentry', error as Error);
    safeErrorCapture(error as Error);
    return false;
  }
};

/**
 * Send an alert to email
 * @param title Alert title
 * @param message Alert message
 * @param severity Alert severity
 * @param category Alert category
 * @param data Additional data
 * @returns Whether the alert was sent
 */
const sendAlertToEmail = (
  title: string,
  message: string,
  severity: AlertSeverity,
  category: AlertCategory,
  data: Record<string, any>
): boolean => {
  // In a real implementation, this would send an email
  // For now, just log it
  if (__DEV__) {
    console.log(`Alert would be sent to email: ${title}`);
  }

  return true;
};

/**
 * Send an alert to Slack
 * @param title Alert title
 * @param message Alert message
 * @param severity Alert severity
 * @param category Alert category
 * @param data Additional data
 * @returns Whether the alert was sent
 */
const sendAlertToSlack = (
  title: string,
  message: string,
  severity: AlertSeverity,
  category: AlertCategory,
  data: Record<string, any>
): boolean => {
  // In a real implementation, this would send a Slack message
  // For now, just log it
  if (__DEV__) {
    console.log(`Alert would be sent to Slack: ${title}`);
  }

  return true;
};

/**
 * Send an alert to PagerDuty
 * @param title Alert title
 * @param message Alert message
 * @param severity Alert severity
 * @param category Alert category
 * @param data Additional data
 * @returns Whether the alert was sent
 */
const sendAlertToPagerDuty = (
  title: string,
  message: string,
  severity: AlertSeverity,
  category: AlertCategory,
  data: Record<string, any>
): boolean => {
  // In a real implementation, this would send a PagerDuty alert
  // For now, just log it
  if (__DEV__) {
    console.log(`Alert would be sent to PagerDuty: ${title}`);
  }

  return true;
};

/**
 * Check if a severity level is at least a minimum level
 * @param severity Severity to check
 * @param minSeverity Minimum severity
 * @returns Whether the severity is at least the minimum
 */
const isSeverityAtLeast = (severity: AlertSeverity, minSeverity: AlertSeverity): boolean => {
  const severityOrder = [
    AlertSeverity.INFO,
    AlertSeverity.WARNING,
    AlertSeverity.ERROR,
    AlertSeverity.CRITICAL,
  ];

  const severityIndex = severityOrder.indexOf(severity);
  const minSeverityIndex = severityOrder.indexOf(minSeverity);

  return severityIndex >= minSeverityIndex;
};

/**
 * Check if an alert is throttled
 * @param alertKey Alert key
 * @param throttleMs Throttle duration in ms
 * @returns Whether the alert is throttled
 */
const isAlertThrottled = (alertKey: string, throttleMs: number): boolean => {
  const lastAlertTime = alertThrottles[alertKey] || 0;
  const now = Date.now();

  return now - lastAlertTime < throttleMs;
};

/**
 * Map severity to Sentry level
 * @param severity Alert severity
 * @returns Sentry level
 */
const mapSeverityToSentryLevel = (severity: AlertSeverity): any => {
  switch (severity) {
    case AlertSeverity.INFO:
      return 'info';
    case AlertSeverity.WARNING:
      return 'warning';
    case AlertSeverity.ERROR:
      return 'error';
    case AlertSeverity.CRITICAL:
      return 'fatal';
    default:
      return 'info';
  }
};
