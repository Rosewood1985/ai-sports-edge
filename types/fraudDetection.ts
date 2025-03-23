/**
 * Types for the Fraud Detection system
 */

/**
 * Severity levels for fraud alerts
 */
export enum AlertSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

/**
 * Status of a fraud alert
 */
export enum AlertStatus {
  NEW = 'new',
  INVESTIGATING = 'investigating',
  RESOLVED = 'resolved',
  FALSE_POSITIVE = 'false_positive',
  CONFIRMED = 'confirmed'
}

/**
 * Types of fraud patterns that can be detected
 */
export enum FraudPatternType {
  UNUSUAL_BETTING_PATTERN = 'unusual_betting_pattern',
  MULTIPLE_ACCOUNTS = 'multiple_accounts',
  RAPID_ACCOUNT_SWITCHING = 'rapid_account_switching',
  SUSPICIOUS_LOCATION = 'suspicious_location',
  ODDS_MANIPULATION_ATTEMPT = 'odds_manipulation_attempt',
  AUTOMATED_BETTING = 'automated_betting',
  PAYMENT_ANOMALY = 'payment_anomaly',
  ACCOUNT_TAKEOVER = 'account_takeover'
}

/**
 * Actions that can be taken on a user account
 */
export enum AccountAction {
  MONITOR = 'monitor',
  RESTRICT = 'restrict',
  SUSPEND = 'suspend',
  BAN = 'ban',
  CLEAR = 'clear'
}

/**
 * Interface for a fraud alert
 */
export interface FraudAlert {
  id: string;
  userId: string;
  username?: string;
  timestamp: number;
  patternType: FraudPatternType;
  severity: AlertSeverity;
  status: AlertStatus;
  description: string;
  evidence: AlertEvidence[];
  assignedTo?: string;
  actions: AlertAction[];
  resolution?: AlertResolution;
}

/**
 * Evidence supporting a fraud alert
 */
export interface AlertEvidence {
  id: string;
  type: 'activity_log' | 'betting_pattern' | 'location_data' | 'account_data' | 'payment_data';
  timestamp: number;
  description: string;
  data: any;
}

/**
 * Action taken on an alert
 */
export interface AlertAction {
  id: string;
  timestamp: number;
  adminId: string;
  adminName: string;
  action: AccountAction;
  notes?: string;
}

/**
 * Resolution of an alert
 */
export interface AlertResolution {
  timestamp: number;
  adminId: string;
  adminName: string;
  status: AlertStatus;
  notes: string;
  actionTaken?: AccountAction;
}

/**
 * User activity event for fraud detection
 */
export interface UserActivityEvent {
  userId: string;
  eventType: string;
  timestamp: number;
  data: any;
  deviceInfo?: DeviceInfo;
  locationInfo?: LocationInfo;
}

/**
 * Device information
 */
export interface DeviceInfo {
  deviceId?: string;
  deviceType?: string;
  browser?: string;
  os?: string;
  ipAddress?: string;
}

/**
 * Location information
 */
export interface LocationInfo {
  latitude?: number;
  longitude?: number;
  country?: string;
  region?: string;
  city?: string;
  isTrusted?: boolean;
}

/**
 * Fraud detection rule
 */
export interface FraudDetectionRule {
  id: string;
  name: string;
  description: string;
  patternType: FraudPatternType;
  severity: AlertSeverity;
  isActive: boolean;
  conditions: RuleCondition[];
  createdAt: number;
  updatedAt: number;
  createdBy: string;
}

/**
 * Condition for a fraud detection rule
 */
export interface RuleCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'not_contains' | 'in_range';
  value: any;
  threshold?: number;
  timeWindow?: number;
}

/**
 * User risk score
 */
export interface UserRiskScore {
  userId: string;
  overallScore: number;
  categoryScores: {
    [key: string]: number;
  };
  lastUpdated: number;
}

/**
 * Fraud detection statistics
 */
export interface FraudDetectionStats {
  totalAlerts: number;
  alertsBySeverity: {
    [key in AlertSeverity]: number;
  };
  alertsByStatus: {
    [key in AlertStatus]: number;
  };
  alertsByType: {
    [key in FraudPatternType]: number;
  };
  alertsOverTime: {
    timestamp: number;
    count: number;
  }[];
  falsePositiveRate: number;
  averageResolutionTime: number;
}