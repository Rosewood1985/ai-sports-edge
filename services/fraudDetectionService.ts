/**
 * Fraud Detection Service
 *
 * This service provides fraud detection functionality for the app.
 * It detects suspicious betting patterns and user activities.
 */

import {
  collection,
  doc,
  addDoc,
  updateDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  serverTimestamp,
  onSnapshot,
} from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';

import { analyticsService, AnalyticsEventType } from './analyticsService';
import { notificationService } from './notificationService';
import { firestore } from '../config/firebase';
import {
  FraudAlert,
  AlertSeverity,
  AlertStatus,
  FraudPatternType,
  UserActivityEvent,
  FraudDetectionRule,
  UserRiskScore,
  FraudDetectionStats,
  AccountAction,
  AlertAction,
  AlertResolution,
} from '../types/fraudDetection';

// Type for admin notification
interface AdminNotification {
  userId: string;
  title: string;
  body: string;
  data?: any;
}

/**
 * Service for detecting and managing fraudulent activities
 */
class FraudDetectionService {
  private readonly ALERT_COLLECTION = 'fraudAlerts';
  private readonly RULE_COLLECTION = 'fraudRules';
  private readonly USER_RISK_COLLECTION = 'userRiskScores';
  private readonly ACTIVITY_COLLECTION = 'userActivities';

  private activeRules: FraudDetectionRule[] = [];
  private alertListeners: Map<string, () => void> = new Map();

  constructor() {
    this.loadActiveRules();
  }

  /**
   * Load active fraud detection rules from Firestore
   */
  private async loadActiveRules(): Promise<void> {
    try {
      const rulesQuery = query(
        collection(firestore, this.RULE_COLLECTION),
        where('isActive', '==', true)
      );

      const rulesSnapshot = await getDocs(rulesQuery);
      this.activeRules = rulesSnapshot.docs.map(
        doc =>
          ({
            id: doc.id,
            ...doc.data(),
          }) as FraudDetectionRule
      );

      console.log(`Loaded ${this.activeRules.length} active fraud detection rules`);
    } catch (error) {
      console.error('Error loading fraud detection rules:', error);
    }
  }

  /**
   * Track user activity for fraud detection
   * @param event User activity event
   */
  public async trackActivity(event: UserActivityEvent): Promise<void> {
    try {
      // Store the activity in Firestore
      await addDoc(collection(firestore, this.ACTIVITY_COLLECTION), {
        ...event,
        timestamp: serverTimestamp(),
      });

      // Process the activity through fraud detection rules
      await this.processActivity(event);
    } catch (error) {
      console.error('Error tracking user activity:', error);
    }
  }

  /**
   * Process user activity through fraud detection rules
   * @param event User activity event
   */
  private async processActivity(event: UserActivityEvent): Promise<void> {
    try {
      // Apply each active rule to the event
      for (const rule of this.activeRules) {
        const matchesRule = await this.evaluateRule(rule, event);

        if (matchesRule) {
          await this.createAlert(event.userId, rule.patternType, rule.severity, rule);
        }
      }

      // Update user risk score
      await this.updateUserRiskScore(event.userId);
    } catch (error) {
      console.error('Error processing activity for fraud detection:', error);
    }
  }

  /**
   * Evaluate if an event matches a fraud detection rule
   * @param rule Fraud detection rule
   * @param event User activity event
   * @returns True if the event matches the rule
   */
  private async evaluateRule(rule: FraudDetectionRule, event: UserActivityEvent): Promise<boolean> {
    try {
      // For each condition in the rule, check if the event matches
      for (const condition of rule.conditions) {
        const { field, operator, value, threshold, timeWindow } = condition;

        // Extract the field value from the event using a type-safe approach
        const fieldPath = field.split('.');
        let fieldValue: any = event;
        for (const path of fieldPath) {
          if (fieldValue && typeof fieldValue === 'object' && path in fieldValue) {
            fieldValue = fieldValue[path];
          } else {
            fieldValue = undefined;
            break;
          }
        }

        if (fieldValue === undefined) {
          return false;
        }

        // Check if the condition is met based on the operator
        switch (operator) {
          case 'equals':
            if (fieldValue !== value) return false;
            break;
          case 'not_equals':
            if (fieldValue === value) return false;
            break;
          case 'greater_than':
            if (typeof fieldValue === 'number' && fieldValue <= value) return false;
            break;
          case 'less_than':
            if (typeof fieldValue === 'number' && fieldValue >= value) return false;
            break;
          case 'contains':
            if (typeof fieldValue === 'string' && !fieldValue.includes(String(value))) return false;
            break;
          case 'not_contains':
            if (typeof fieldValue === 'string' && fieldValue.includes(String(value))) return false;
            break;
          case 'in_range':
            // For in_range, we need to check if the count of events in the time window exceeds the threshold
            if (timeWindow && threshold !== undefined) {
              const count = await this.countEventsInTimeWindow(
                event.userId,
                field,
                value,
                timeWindow
              );
              if (count < threshold) return false;
            }
            break;
          default:
            return false;
        }
      }

      // If all conditions are met, the rule matches
      return true;
    } catch (error) {
      console.error('Error evaluating fraud detection rule:', error);
      return false;
    }
  }

  /**
   * Count events matching a field and value within a time window
   * @param userId User ID
   * @param field Field to match
   * @param value Value to match
   * @param timeWindow Time window in milliseconds
   * @returns Count of matching events
   */
  private async countEventsInTimeWindow(
    userId: string,
    field: string,
    value: any,
    timeWindow: number
  ): Promise<number> {
    try {
      const startTime = Date.now() - timeWindow;

      const eventsQuery = query(
        collection(firestore, this.ACTIVITY_COLLECTION),
        where('userId', '==', userId),
        where('timestamp', '>=', new Date(startTime)),
        where(field, '==', value)
      );

      const eventsSnapshot = await getDocs(eventsQuery);
      return eventsSnapshot.size;
    } catch (error) {
      console.error('Error counting events in time window:', error);
      return 0;
    }
  }

  /**
   * Create a fraud alert
   * @param userId User ID
   * @param patternType Type of fraud pattern
   * @param severity Severity of the alert
   * @param rule Rule that triggered the alert
   * @returns The created alert
   */
  private async createAlert(
    userId: string,
    patternType: FraudPatternType,
    severity: AlertSeverity,
    rule: FraudDetectionRule
  ): Promise<FraudAlert> {
    try {
      // Get user information
      const userDoc = await getDoc(doc(firestore, 'users', userId));
      const username = userDoc.exists()
        ? userDoc.data().username || 'Unknown User'
        : 'Unknown User';

      // Create the alert
      const alertData: Omit<FraudAlert, 'id'> = {
        userId,
        username,
        timestamp: Date.now(),
        patternType,
        severity,
        status: AlertStatus.NEW,
        description: `Potential ${patternType} detected for user ${username}`,
        evidence: [],
        actions: [],
      };

      // Add the alert to Firestore
      const alertRef = await addDoc(collection(firestore, this.ALERT_COLLECTION), alertData);

      // Get the created alert
      const alert: FraudAlert = {
        id: alertRef.id,
        ...alertData,
      };

      // Notify admins based on severity
      if (severity === AlertSeverity.HIGH || severity === AlertSeverity.CRITICAL) {
        await this.notifyAdmins(alert);
      }

      // Track the alert creation in analytics
      analyticsService.trackEvent(AnalyticsEventType.CUSTOM, {
        event_name: 'fraud_alert_created',
        alertId: alert.id,
        userId: alert.userId,
        patternType: alert.patternType,
        severity: alert.severity,
      } as any);

      return alert;
    } catch (error) {
      console.error('Error creating fraud alert:', error);
      throw error;
    }
  }

  /**
   * Notify admins about a high-severity fraud alert
   * @param alert Fraud alert
   */
  private async notifyAdmins(alert: FraudAlert): Promise<void> {
    try {
      // Get admin users
      const adminsQuery = query(collection(firestore, 'users'), where('role', '==', 'admin'));

      const adminsSnapshot = await getDocs(adminsQuery);

      // Send notification to each admin
      adminsSnapshot.forEach(adminDoc => {
        const adminId = adminDoc.id;

        // Use any type assertion to bypass TypeScript error
        (notificationService as any).sendNotification({
          userId: adminId,
          title: `${alert.severity.toUpperCase()} Fraud Alert`,
          body: alert.description,
          data: {
            type: 'fraud_alert',
            alertId: alert.id,
          },
        });
      });
    } catch (error) {
      console.error('Error notifying admins about fraud alert:', error);
    }
  }

  /**
   * Update a user's risk score based on recent activity
   * @param userId User ID
   */
  private async updateUserRiskScore(userId: string): Promise<void> {
    try {
      // Get recent alerts for the user
      const alertsQuery = query(
        collection(firestore, this.ALERT_COLLECTION),
        where('userId', '==', userId),
        where('timestamp', '>=', Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
      );

      const alertsSnapshot = await getDocs(alertsQuery);
      const alerts = alertsSnapshot.docs.map(
        doc =>
          ({
            id: doc.id,
            ...doc.data(),
          }) as FraudAlert
      );

      // Calculate category scores
      const categoryScores = {
        betting: 0,
        account: 0,
        payment: 0,
        location: 0,
      };

      // Calculate scores based on alerts
      alerts.forEach(alert => {
        const severityScore = this.getSeverityScore(alert.severity);

        switch (alert.patternType) {
          case FraudPatternType.UNUSUAL_BETTING_PATTERN:
          case FraudPatternType.ODDS_MANIPULATION_ATTEMPT:
          case FraudPatternType.AUTOMATED_BETTING:
            categoryScores.betting += severityScore;
            break;
          case FraudPatternType.MULTIPLE_ACCOUNTS:
          case FraudPatternType.RAPID_ACCOUNT_SWITCHING:
          case FraudPatternType.ACCOUNT_TAKEOVER:
            categoryScores.account += severityScore;
            break;
          case FraudPatternType.PAYMENT_ANOMALY:
            categoryScores.payment += severityScore;
            break;
          case FraudPatternType.SUSPICIOUS_LOCATION:
            categoryScores.location += severityScore;
            break;
        }
      });

      // Calculate overall score (weighted average)
      const overallScore =
        categoryScores.betting * 0.4 +
        categoryScores.account * 0.3 +
        categoryScores.payment * 0.2 +
        categoryScores.location * 0.1;

      // Update or create the user risk score
      const riskScoreRef = doc(firestore, this.USER_RISK_COLLECTION, userId);
      const riskScoreDoc = await getDoc(riskScoreRef);

      if (riskScoreDoc.exists()) {
        await updateDoc(riskScoreRef, {
          overallScore,
          categoryScores,
          lastUpdated: Date.now(),
        });
      } else {
        await addDoc(collection(firestore, this.USER_RISK_COLLECTION), {
          userId,
          overallScore,
          categoryScores,
          lastUpdated: Date.now(),
        });
      }
    } catch (error) {
      console.error('Error updating user risk score:', error);
    }
  }

  /**
   * Get a numeric score for a severity level
   * @param severity Severity level
   * @returns Numeric score
   */
  private getSeverityScore(severity: AlertSeverity): number {
    switch (severity) {
      case AlertSeverity.LOW:
        return 1;
      case AlertSeverity.MEDIUM:
        return 3;
      case AlertSeverity.HIGH:
        return 7;
      case AlertSeverity.CRITICAL:
        return 10;
      default:
        return 0;
    }
  }

  /**
   * Get all fraud alerts with optional filtering
   * @param filters Optional filters
   * @param sortBy Field to sort by
   * @param sortOrder Sort order
   * @param limitCount Maximum number of alerts to return
   * @returns List of fraud alerts
   */
  public async getAlerts(
    filters: Partial<{
      userId: string;
      severity: AlertSeverity;
      status: AlertStatus;
      patternType: FraudPatternType;
      fromDate: number;
      toDate: number;
    }> = {},
    sortBy: keyof FraudAlert = 'timestamp',
    sortOrder: 'asc' | 'desc' = 'desc',
    limitCount: number = 100
  ): Promise<FraudAlert[]> {
    try {
      let alertsQuery = query(collection(firestore, this.ALERT_COLLECTION));

      // Apply filters
      if (filters.userId) {
        alertsQuery = query(alertsQuery, where('userId', '==', filters.userId));
      }

      if (filters.severity) {
        alertsQuery = query(alertsQuery, where('severity', '==', filters.severity));
      }

      if (filters.status) {
        alertsQuery = query(alertsQuery, where('status', '==', filters.status));
      }

      if (filters.patternType) {
        alertsQuery = query(alertsQuery, where('patternType', '==', filters.patternType));
      }

      if (filters.fromDate) {
        alertsQuery = query(alertsQuery, where('timestamp', '>=', filters.fromDate));
      }

      if (filters.toDate) {
        alertsQuery = query(alertsQuery, where('timestamp', '<=', filters.toDate));
      }

      // Apply sorting
      alertsQuery = query(alertsQuery, orderBy(sortBy, sortOrder));

      // Apply limit
      alertsQuery = query(alertsQuery, limit(limitCount));

      // Execute query
      const alertsSnapshot = await getDocs(alertsQuery);

      // Map results to FraudAlert objects
      return alertsSnapshot.docs.map(
        doc =>
          ({
            id: doc.id,
            ...doc.data(),
          }) as FraudAlert
      );
    } catch (error) {
      console.error('Error getting fraud alerts:', error);
      throw error;
    }
  }

  /**
   * Get a specific fraud alert by ID
   * @param alertId Alert ID
   * @returns Fraud alert or null if not found
   */
  public async getAlertById(alertId: string): Promise<FraudAlert | null> {
    try {
      const alertDoc = await getDoc(doc(firestore, this.ALERT_COLLECTION, alertId));

      if (!alertDoc.exists()) {
        return null;
      }

      return {
        id: alertDoc.id,
        ...alertDoc.data(),
      } as FraudAlert;
    } catch (error) {
      console.error('Error getting fraud alert by ID:', error);
      throw error;
    }
  }

  /**
   * Update the status of a fraud alert
   * @param alertId Alert ID
   * @param status New status
   * @param adminId ID of the admin making the change
   * @param adminName Name of the admin making the change
   * @param notes Optional notes about the status change
   * @returns Updated alert
   */
  public async updateAlertStatus(
    alertId: string,
    status: AlertStatus,
    adminId: string,
    adminName: string,
    notes: string = ''
  ): Promise<FraudAlert> {
    try {
      const alertRef = doc(firestore, this.ALERT_COLLECTION, alertId);
      const alertDoc = await getDoc(alertRef);

      if (!alertDoc.exists()) {
        throw new Error(`Alert with ID ${alertId} not found`);
      }

      const alert = {
        id: alertDoc.id,
        ...alertDoc.data(),
      } as FraudAlert;

      // Create resolution if the status is terminal
      let resolution: AlertResolution | undefined;
      if (
        status === AlertStatus.RESOLVED ||
        status === AlertStatus.FALSE_POSITIVE ||
        status === AlertStatus.CONFIRMED
      ) {
        resolution = {
          timestamp: Date.now(),
          adminId,
          adminName,
          status,
          notes,
        };
      }

      // Update the alert
      await updateDoc(alertRef, {
        status,
        resolution,
        ...(status === AlertStatus.INVESTIGATING ? { assignedTo: adminId } : {}),
      });

      // Track the status update in analytics
      analyticsService.trackEvent(AnalyticsEventType.CUSTOM, {
        event_name: 'fraud_alert_status_updated',
        alertId,
        oldStatus: alert.status,
        newStatus: status,
        adminId,
      } as any);

      // Get the updated alert
      const updatedAlert = await this.getAlertById(alertId);
      if (!updatedAlert) {
        throw new Error(`Failed to retrieve updated alert with ID ${alertId}`);
      }
      return updatedAlert;
    } catch (error) {
      console.error('Error updating fraud alert status:', error);
      throw error;
    }
  }

  /**
   * Take action on a user account based on a fraud alert
   * @param alertId Alert ID
   * @param action Action to take
   * @param adminId ID of the admin taking the action
   * @param adminName Name of the admin taking the action
   * @param notes Optional notes about the action
   * @returns Updated alert
   */
  public async takeAction(
    alertId: string,
    action: AccountAction,
    adminId: string,
    adminName: string,
    notes: string = ''
  ): Promise<FraudAlert> {
    try {
      const alertRef = doc(firestore, this.ALERT_COLLECTION, alertId);
      const alertDoc = await getDoc(alertRef);

      if (!alertDoc.exists()) {
        throw new Error(`Alert with ID ${alertId} not found`);
      }

      const alert = {
        id: alertDoc.id,
        ...alertDoc.data(),
      } as FraudAlert;

      // Create the action
      const alertAction: AlertAction = {
        id: uuidv4(),
        timestamp: Date.now(),
        adminId,
        adminName,
        action,
        notes,
      };

      // Update the user account based on the action
      await this.applyAccountAction(alert.userId, action);

      // Update the alert with the new action
      await updateDoc(alertRef, {
        actions: [...alert.actions, alertAction],
        ...(alert.resolution ? { 'resolution.actionTaken': action } : {}),
      });

      // Track the action in analytics
      analyticsService.trackEvent(AnalyticsEventType.CUSTOM, {
        event_name: 'fraud_alert_action_taken',
        alertId,
        userId: alert.userId,
        action,
        adminId,
      } as any);

      // Get the updated alert
      const updatedAlert = await this.getAlertById(alertId);
      if (!updatedAlert) {
        throw new Error(`Failed to retrieve updated alert with ID ${alertId}`);
      }
      return updatedAlert;
    } catch (error) {
      console.error('Error taking action on fraud alert:', error);
      throw error;
    }
  }

  /**
   * Apply an action to a user account
   * @param userId User ID
   * @param action Action to apply
   */
  private async applyAccountAction(userId: string, action: AccountAction): Promise<void> {
    try {
      const userRef = doc(firestore, 'users', userId);

      switch (action) {
        case AccountAction.MONITOR:
          // Add user to monitoring list
          await updateDoc(userRef, {
            isMonitored: true,
            monitoringSince: Date.now(),
          });
          break;
        case AccountAction.RESTRICT:
          // Restrict user account
          await updateDoc(userRef, {
            isRestricted: true,
            restrictedSince: Date.now(),
            restrictedFeatures: ['betting', 'withdrawal'],
          });
          break;
        case AccountAction.SUSPEND:
          // Suspend user account
          await updateDoc(userRef, {
            isSuspended: true,
            suspendedSince: Date.now(),
            suspensionReason: 'Suspicious activity detected',
          });
          break;
        case AccountAction.BAN:
          // Ban user account
          await updateDoc(userRef, {
            isBanned: true,
            bannedSince: Date.now(),
            banReason: 'Fraudulent activity',
          });
          break;
        case AccountAction.CLEAR:
          // Clear all restrictions
          await updateDoc(userRef, {
            isMonitored: false,
            isRestricted: false,
            isSuspended: false,
            isBanned: false,
            restrictedFeatures: [],
          });
          break;
      }
    } catch (error) {
      console.error('Error applying account action:', error);
      throw error;
    }
  }

  /**
   * Get fraud detection statistics
   * @param fromDate Optional start date for statistics
   * @param toDate Optional end date for statistics
   * @returns Fraud detection statistics
   */
  public async getStatistics(fromDate?: number, toDate?: number): Promise<FraudDetectionStats> {
    try {
      // Set default date range to last 30 days if not provided
      const startDate = fromDate || Date.now() - 30 * 24 * 60 * 60 * 1000;
      const endDate = toDate || Date.now();

      // Query alerts within the date range
      const alertsQuery = query(
        collection(firestore, this.ALERT_COLLECTION),
        where('timestamp', '>=', startDate),
        where('timestamp', '<=', endDate)
      );

      const alertsSnapshot = await getDocs(alertsQuery);
      const alerts = alertsSnapshot.docs.map(
        doc =>
          ({
            id: doc.id,
            ...doc.data(),
          }) as FraudAlert
      );

      // Calculate statistics
      const totalAlerts = alerts.length;

      // Count alerts by severity
      const alertsBySeverity = {
        [AlertSeverity.LOW]: 0,
        [AlertSeverity.MEDIUM]: 0,
        [AlertSeverity.HIGH]: 0,
        [AlertSeverity.CRITICAL]: 0,
      };

      // Count alerts by status
      const alertsByStatus = {
        [AlertStatus.NEW]: 0,
        [AlertStatus.INVESTIGATING]: 0,
        [AlertStatus.RESOLVED]: 0,
        [AlertStatus.FALSE_POSITIVE]: 0,
        [AlertStatus.CONFIRMED]: 0,
      };

      // Count alerts by type
      const alertsByType = {
        [FraudPatternType.UNUSUAL_BETTING_PATTERN]: 0,
        [FraudPatternType.MULTIPLE_ACCOUNTS]: 0,
        [FraudPatternType.RAPID_ACCOUNT_SWITCHING]: 0,
        [FraudPatternType.SUSPICIOUS_LOCATION]: 0,
        [FraudPatternType.ODDS_MANIPULATION_ATTEMPT]: 0,
        [FraudPatternType.AUTOMATED_BETTING]: 0,
        [FraudPatternType.PAYMENT_ANOMALY]: 0,
        [FraudPatternType.ACCOUNT_TAKEOVER]: 0,
      };

      // Count alerts over time (daily)
      const alertsOverTime: { timestamp: number; count: number }[] = [];
      const dailyCounts = new Map<number, number>();

      // Calculate false positive rate
      let falsePositiveCount = 0;
      let resolvedCount = 0;

      // Calculate average resolution time
      let totalResolutionTime = 0;
      let resolutionTimeCount = 0;

      // Process each alert
      alerts.forEach(alert => {
        // Count by severity
        alertsBySeverity[alert.severity]++;

        // Count by status
        alertsByStatus[alert.status]++;

        // Count by type
        alertsByType[alert.patternType]++;

        // Count by day
        const day = Math.floor(alert.timestamp / (24 * 60 * 60 * 1000)) * (24 * 60 * 60 * 1000);
        dailyCounts.set(day, (dailyCounts.get(day) || 0) + 1);

        // Count false positives and resolved alerts
        if (alert.status === AlertStatus.FALSE_POSITIVE) {
          falsePositiveCount++;
          resolvedCount++;
        } else if (
          alert.status === AlertStatus.RESOLVED ||
          alert.status === AlertStatus.CONFIRMED
        ) {
          resolvedCount++;
        }

        // Calculate resolution time
        if (alert.resolution) {
          const resolutionTime = alert.resolution.timestamp - alert.timestamp;
          totalResolutionTime += resolutionTime;
          resolutionTimeCount++;
        }
      });

      // Convert daily counts to array
      for (const [day, count] of dailyCounts.entries()) {
        alertsOverTime.push({
          timestamp: day,
          count,
        });
      }

      // Sort alerts over time by timestamp
      alertsOverTime.sort((a, b) => a.timestamp - b.timestamp);

      // Calculate false positive rate
      const falsePositiveRate = resolvedCount > 0 ? (falsePositiveCount / resolvedCount) * 100 : 0;

      // Calculate average resolution time (in hours)
      const averageResolutionTime =
        resolutionTimeCount > 0 ? totalResolutionTime / resolutionTimeCount / (60 * 60 * 1000) : 0;

      // Return statistics
      return {
        totalAlerts,
        alertsBySeverity,
        alertsByStatus,
        alertsByType,
        alertsOverTime,
        falsePositiveRate,
        averageResolutionTime,
      };
    } catch (error) {
      console.error('Error getting fraud detection statistics:', error);
      throw error;
    }
  }

  /**
   * Set up a real-time listener for new fraud alerts
   * @param callback Function to call when new alerts are received
   * @param filters Optional filters for alerts
   * @returns Function to unsubscribe from the listener
   */
  public listenForAlerts(
    callback: (alerts: FraudAlert[]) => void,
    filters: Partial<{
      severity: AlertSeverity;
      status: AlertStatus;
      patternType: FraudPatternType;
    }> = {}
  ): () => void {
    try {
      let alertsQuery = query(
        collection(firestore, this.ALERT_COLLECTION),
        orderBy('timestamp', 'desc'),
        limit(100)
      );

      // Apply filters
      if (filters.severity) {
        alertsQuery = query(alertsQuery, where('severity', '==', filters.severity));
      }

      if (filters.status) {
        alertsQuery = query(alertsQuery, where('status', '==', filters.status));
      }

      if (filters.patternType) {
        alertsQuery = query(alertsQuery, where('patternType', '==', filters.patternType));
      }

      // Set up the listener
      const unsubscribe = onSnapshot(alertsQuery, snapshot => {
        const alerts = snapshot.docs.map(
          doc =>
            ({
              id: doc.id,
              ...doc.data(),
            }) as FraudAlert
        );

        callback(alerts);
      });

      // Store the unsubscribe function
      const listenerId = uuidv4();
      this.alertListeners.set(listenerId, unsubscribe);

      // Return a function to unsubscribe
      return () => {
        unsubscribe();
        this.alertListeners.delete(listenerId);
      };
    } catch (error) {
      console.error('Error setting up fraud alert listener:', error);
      return () => {};
    }
  }

  /**
   * Clean up all listeners
   */
  public cleanupListeners(): void {
    for (const unsubscribe of this.alertListeners.values()) {
      unsubscribe();
    }

    this.alertListeners.clear();
  }
}

export const fraudDetectionService = new FraudDetectionService();
