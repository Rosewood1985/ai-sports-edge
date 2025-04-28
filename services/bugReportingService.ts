import { Platform } from 'react-native';
import { captureException, captureMessage } from './errorTrackingService';
import { info, LogCategory } from './loggingService';
import { error as logError } from './loggingService';
import { logEvent, AnalyticsEvent } from './analyticsService';
import { BugReport, FeedbackType, FeedbackPriority, submitBugReport } from './feedbackService';

/**
 * Bug Reporting Service
 * 
 * This service provides functionality for reporting and tracking bugs in the app.
 */

// Bug severity levels
export enum BugSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

// Bug categories
export enum BugCategory {
  UI = 'ui',
  FUNCTIONALITY = 'functionality',
  PERFORMANCE = 'performance',
  CRASH = 'crash',
  DATA = 'data',
  NETWORK = 'network',
  SECURITY = 'security',
  OTHER = 'other',
}

// Bug report interface (extends the BugReport from feedbackService)
export interface DetailedBugReport extends BugReport {
  severity: BugSeverity;
  category: BugCategory;
  appVersion: string;
  osVersion: string;
  deviceModel: string;
  networkType?: string;
  memoryUsage?: number;
  batteryLevel?: number;
  screenResolution?: string;
  locale?: string;
  timezone?: string;
  userAgent?: string;
  stackTrace?: string;
  consoleLog?: string[];
  networkLog?: string[];
  attachments?: string[];
}

// Bug report options
export interface BugReportOptions {
  includeScreenshot?: boolean;
  includeDeviceInfo?: boolean;
  includeNetworkLogs?: boolean;
  includeConsoleLogs?: boolean;
  includeUserInfo?: boolean;
  includeCrashReport?: boolean;
}

// Default bug report options
const defaultBugReportOptions: BugReportOptions = {
  includeScreenshot: true,
  includeDeviceInfo: true,
  includeNetworkLogs: true,
  includeConsoleLogs: true,
  includeUserInfo: true,
  includeCrashReport: true,
};

/**
 * Report a bug
 * @param userId User ID
 * @param title Bug title
 * @param description Bug description
 * @param severity Bug severity
 * @param category Bug category
 * @param options Bug report options
 * @returns Promise that resolves to the submitted bug report
 */
export const reportBug = async (
  userId: string,
  title: string,
  description: string,
  severity: BugSeverity,
  category: BugCategory,
  options: BugReportOptions = defaultBugReportOptions
): Promise<DetailedBugReport> => {
  try {
    info(LogCategory.APP, 'Reporting bug', { title, severity, category });
    
    // Map severity to priority
    const priorityMap: Record<BugSeverity, FeedbackPriority> = {
      [BugSeverity.LOW]: FeedbackPriority.LOW,
      [BugSeverity.MEDIUM]: FeedbackPriority.MEDIUM,
      [BugSeverity.HIGH]: FeedbackPriority.HIGH,
      [BugSeverity.CRITICAL]: FeedbackPriority.CRITICAL,
    };
    
    // Collect device information
    const deviceInfo = await collectDeviceInfo(options);
    
    // Collect logs
    const logs = await collectLogs(options);
    
    // Collect screenshots
    const screenshots = options.includeScreenshot ? await captureScreenshot() : [];
    
    // Prepare bug report
    const bugReport: DetailedBugReport = {
      userId,
      type: FeedbackType.BUG_REPORT,
      title,
      description,
      priority: priorityMap[severity],
      severity,
      category,
      appVersion: deviceInfo.appVersion,
      osVersion: deviceInfo.osVersion,
      deviceModel: deviceInfo.deviceModel,
      networkType: deviceInfo.networkType,
      memoryUsage: deviceInfo.memoryUsage,
      batteryLevel: deviceInfo.batteryLevel,
      screenResolution: deviceInfo.screenResolution,
      locale: deviceInfo.locale,
      timezone: deviceInfo.timezone,
      userAgent: deviceInfo.userAgent,
      stackTrace: logs.stackTrace,
      consoleLog: logs.consoleLog,
      networkLog: logs.networkLog,
      screenshots,
    };
    
    // Submit bug report
    const submittedBugReport = await submitBugReport(bugReport);
    
    // Log bug report event
    logEvent(AnalyticsEvent.CUSTOM, {
      event_name: 'bug_reported',
      bug_severity: severity,
      bug_category: category,
    });
    
    // Capture bug in Sentry for critical and high severity bugs
    if (severity === BugSeverity.CRITICAL || severity === BugSeverity.HIGH) {
      captureMessage(`Bug Report: ${title}`, 'error');
    }
    
    return submittedBugReport as DetailedBugReport;
  } catch (err) {
    logError(LogCategory.APP, 'Failed to report bug', err as Error);
    captureException(err as Error);
    throw err;
  }
};

/**
 * Report a crash
 * @param userId User ID
 * @param error Error object
 * @param context Additional context
 * @returns Promise that resolves to the submitted bug report
 */
export const reportCrash = async (
  userId: string,
  error: Error,
  context?: Record<string, any>
): Promise<DetailedBugReport> => {
  try {
    info(LogCategory.APP, 'Reporting crash', { error: error.message });
    
    // Capture exception in Sentry
    captureException(error, { extra: context });
    
    // Prepare bug report
    const bugReport: DetailedBugReport = {
      userId,
      type: FeedbackType.BUG_REPORT,
      title: `Crash: ${error.name}`,
      description: error.message,
      priority: FeedbackPriority.CRITICAL,
      severity: BugSeverity.CRITICAL,
      category: BugCategory.CRASH,
      appVersion: '1.0.0', // Replace with actual app version
      osVersion: Platform.Version.toString(),
      deviceModel: Platform.OS === 'ios' ? 'iOS Device' : 'Android Device',
      stackTrace: error.stack,
      steps: ['App crashed unexpectedly'],
      expectedBehavior: 'App should not crash',
      actualBehavior: 'App crashed',
      reproducibility: 'once',
    };
    
    // Submit bug report
    const submittedBugReport = await submitBugReport(bugReport);
    
    // Log crash event
    logEvent(AnalyticsEvent.CUSTOM, {
      event_name: 'crash_reported',
      error_name: error.name,
      error_message: error.message,
    });
    
    return submittedBugReport as DetailedBugReport;
  } catch (err) {
    const errorObj = err as Error;
    logError(LogCategory.APP, 'Failed to report crash', errorObj);
    captureException(errorObj);
    throw err;
  }
};

/**
 * Collect device information
 * @param options Bug report options
 * @returns Device information
 */
const collectDeviceInfo = async (
  options: BugReportOptions
): Promise<{
  appVersion: string;
  osVersion: string;
  deviceModel: string;
  networkType?: string;
  memoryUsage?: number;
  batteryLevel?: number;
  screenResolution?: string;
  locale?: string;
  timezone?: string;
  userAgent?: string;
}> => {
  try {
    if (!options.includeDeviceInfo) {
      return {
        appVersion: '1.0.0', // Replace with actual app version
        osVersion: Platform.Version.toString(),
        deviceModel: Platform.OS === 'ios' ? 'iOS Device' : 'Android Device',
      };
    }
    
    // In a real implementation, this would collect actual device information
    // For now, we'll just return mock data
    
    return {
      appVersion: '1.0.0', // Replace with actual app version
      osVersion: Platform.Version.toString(),
      deviceModel: Platform.OS === 'ios' ? 'iPhone 13 Pro' : 'Google Pixel 6',
      networkType: 'wifi',
      memoryUsage: 256, // MB
      batteryLevel: 0.75, // 75%
      screenResolution: '1170x2532',
      locale: 'en_US',
      timezone: 'America/New_York',
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1',
    };
  } catch (err) {
    logError(LogCategory.APP, 'Failed to collect device information', err as Error);
    captureException(err as Error);
    
    // Return basic device information
    return {
      appVersion: '1.0.0', // Replace with actual app version
      osVersion: Platform.Version.toString(),
      deviceModel: Platform.OS === 'ios' ? 'iOS Device' : 'Android Device',
    };
  }
};

/**
 * Collect logs
 * @param options Bug report options
 * @returns Logs
 */
const collectLogs = async (
  options: BugReportOptions
): Promise<{
  stackTrace?: string;
  consoleLog?: string[];
  networkLog?: string[];
}> => {
  try {
    const logs: {
      stackTrace?: string;
      consoleLog?: string[];
      networkLog?: string[];
    } = {};
    
    // Collect console logs
    if (options.includeConsoleLogs) {
      // In a real implementation, this would collect actual console logs
      // For now, we'll just return mock data
      logs.consoleLog = [
        '2025-03-23T12:00:00.000Z [INFO] App started',
        '2025-03-23T12:00:01.000Z [INFO] User logged in',
        '2025-03-23T12:00:02.000Z [ERROR] Failed to load data',
      ];
    }
    
    // Collect network logs
    if (options.includeNetworkLogs) {
      // In a real implementation, this would collect actual network logs
      // For now, we'll just return mock data
      logs.networkLog = [
        '2025-03-23T12:00:01.500Z [GET] https://api.example.com/data (200)',
        '2025-03-23T12:00:02.000Z [POST] https://api.example.com/auth (401)',
      ];
    }
    
    return logs;
  } catch (err) {
    logError(LogCategory.APP, 'Failed to collect logs', err as Error);
    captureException(err as Error);
    
    // Return empty logs
    return {};
  }
};

/**
 * Capture screenshot
 * @returns Array of screenshot URLs
 */
const captureScreenshot = async (): Promise<string[]> => {
  try {
    // In a real implementation, this would capture an actual screenshot
    // For now, we'll just return a mock URL
    
    return ['https://example.com/screenshot.png'];
  } catch (err) {
    logError(LogCategory.APP, 'Failed to capture screenshot', err as Error);
    captureException(err as Error);
    
    // Return empty array
    return [];
  }
};

/**
 * Get bug report by ID
 * @param bugReportId Bug report ID
 * @returns Promise that resolves to the bug report
 */
export const getBugReportById = async (bugReportId: string): Promise<DetailedBugReport | null> => {
  try {
    info(LogCategory.APP, 'Getting bug report by ID', { bugReportId });
    
    // In a real implementation, this would fetch the bug report from a server
    // For now, we'll just return a mock response
    
    // Mock bug report
    const mockBugReport: DetailedBugReport = {
      id: bugReportId,
      userId: 'user-123',
      type: FeedbackType.BUG_REPORT,
      title: 'App crashes when loading predictions',
      description: 'The app crashes when I try to load predictions for NFL games.',
      priority: FeedbackPriority.HIGH,
      severity: BugSeverity.HIGH,
      category: BugCategory.CRASH,
      appVersion: '1.0.0',
      osVersion: '15.0',
      deviceModel: 'iPhone 13 Pro',
      steps: [
        'Open the app',
        'Go to the Games tab',
        'Select NFL',
        'App crashes',
      ],
      expectedBehavior: 'App should show NFL predictions',
      actualBehavior: 'App crashes',
      reproducibility: 'always',
      createdAt: '2025-03-01T12:00:00Z',
      updatedAt: '2025-03-02T14:30:00Z',
    };
    
    return mockBugReport;
  } catch (err) {
    logError(LogCategory.APP, 'Failed to get bug report by ID', err as Error);
    captureException(err as Error);
    return null;
  }
};

/**
 * Get user bug reports
 * @param userId User ID
 * @returns Promise that resolves to an array of bug reports
 */
export const getUserBugReports = async (userId: string): Promise<DetailedBugReport[]> => {
  try {
    info(LogCategory.APP, 'Getting user bug reports', { userId });
    
    // In a real implementation, this would fetch the user's bug reports from a server
    // For now, we'll just return a mock response
    
    // Mock bug reports
    const mockBugReports: DetailedBugReport[] = [
      {
        id: 'bug-1',
        userId,
        type: FeedbackType.BUG_REPORT,
        title: 'App crashes when loading predictions',
        description: 'The app crashes when I try to load predictions for NFL games.',
        priority: FeedbackPriority.HIGH,
        severity: BugSeverity.HIGH,
        category: BugCategory.CRASH,
        appVersion: '1.0.0',
        osVersion: '15.0',
        deviceModel: 'iPhone 13 Pro',
        steps: [
          'Open the app',
          'Go to the Games tab',
          'Select NFL',
          'App crashes',
        ],
        expectedBehavior: 'App should show NFL predictions',
        actualBehavior: 'App crashes',
        reproducibility: 'always',
        createdAt: '2025-03-01T12:00:00Z',
        updatedAt: '2025-03-02T14:30:00Z',
      },
      {
        id: 'bug-2',
        userId,
        type: FeedbackType.BUG_REPORT,
        title: 'Cannot update profile picture',
        description: 'When I try to update my profile picture, nothing happens.',
        priority: FeedbackPriority.MEDIUM,
        severity: BugSeverity.MEDIUM,
        category: BugCategory.FUNCTIONALITY,
        appVersion: '1.0.0',
        osVersion: '15.0',
        deviceModel: 'iPhone 13 Pro',
        steps: [
          'Go to Profile',
          'Tap on profile picture',
          'Select a new picture',
          'Nothing happens',
        ],
        expectedBehavior: 'Profile picture should update',
        actualBehavior: 'Nothing happens',
        reproducibility: 'always',
        createdAt: '2025-03-05T09:15:00Z',
        updatedAt: '2025-03-05T09:15:00Z',
      },
    ];
    
    return mockBugReports;
  } catch (err) {
    logError(LogCategory.APP, 'Failed to get user bug reports', err as Error);
    captureException(err as Error);
    return [];
  }
};