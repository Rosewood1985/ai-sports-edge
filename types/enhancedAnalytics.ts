/**
 * Types for the Enhanced Analytics Dashboard
 */

/**
 * Time periods for analytics data
 */
export enum AnalyticsTimePeriod {
  TODAY = 'today',
  YESTERDAY = 'yesterday',
  LAST_7_DAYS = 'last_7_days',
  LAST_30_DAYS = 'last_30_days',
  LAST_90_DAYS = 'last_90_days',
  THIS_MONTH = 'this_month',
  LAST_MONTH = 'last_month',
  LAST_3_MONTHS = 'last_3_months',
  LAST_6_MONTHS = 'last_6_months',
  YEAR_TO_DATE = 'year_to_date',
  LAST_YEAR = 'last_year',
  CUSTOM = 'custom',
}

/**
 * User activity types
 */
export enum UserActivityType {
  APP_OPEN = 'app_open',
  SCREEN_VIEW = 'screen_view',
  FEATURE_USED = 'feature_used',
  BET_VIEWED = 'bet_viewed',
  BET_PLACED = 'bet_placed',
  ODDS_COMPARED = 'odds_compared',
  SUBSCRIPTION_VIEWED = 'subscription_viewed',
  SUBSCRIPTION_PURCHASED = 'subscription_purchased',
  SEARCH_PERFORMED = 'search_performed',
  NOTIFICATION_RECEIVED = 'notification_received',
  NOTIFICATION_OPENED = 'notification_opened',
  REFERRAL_SENT = 'referral_sent',
  REFERRAL_ACCEPTED = 'referral_accepted',
}

/**
 * User segments
 */
export enum UserSegment {
  ALL = 'all',
  FREE = 'free',
  PREMIUM = 'premium',
  TRIAL = 'trial',
  LAPSED = 'lapsed',
  NEW = 'new',
  RETURNING = 'returning',
  HIGH_VALUE = 'high_value',
}

/**
 * Bet types
 */
export enum BetType {
  MONEYLINE = 'moneyline',
  SPREAD = 'spread',
  OVER_UNDER = 'over_under',
  PROP = 'prop',
  PARLAY = 'parlay',
  FUTURES = 'futures',
  LIVE = 'live',
}

/**
 * Sports types
 */
export enum SportType {
  ALL = 'all',
  FOOTBALL = 'football',
  BASKETBALL = 'basketball',
  BASEBALL = 'baseball',
  HOCKEY = 'hockey',
  SOCCER = 'soccer',
  MMA = 'mma',
  GOLF = 'golf',
  TENNIS = 'tennis',
  MOTORSPORTS = 'motorsports',
}

/**
 * Platform types
 */
export enum PlatformType {
  ALL = 'all',
  IOS = 'ios',
  ANDROID = 'android',
  WEB = 'web',
}

/**
 * User activity data
 */
export interface UserActivity {
  id: string;
  userId: string;
  timestamp: number;
  activityType: UserActivityType;
  data: any;
  platform: PlatformType;
  sessionId: string;
}

/**
 * User session data
 */
export interface UserSession {
  id: string;
  userId: string;
  startTime: number;
  endTime: number;
  duration: number;
  platform: PlatformType;
  deviceInfo: {
    deviceId: string;
    deviceModel?: string;
    osVersion?: string;
    appVersion?: string;
  };
  activities: UserActivity[];
  screens: string[];
  features: string[];
}

/**
 * User profile data
 */
export interface UserProfile {
  id: string;
  email: string;
  createdAt: number;
  lastActive: number;
  subscriptionStatus: 'free' | 'premium' | 'trial';
  subscriptionTier?: string;
  subscriptionStartDate?: number;
  subscriptionEndDate?: number;
  totalSessions: number;
  totalBets: number;
  totalSpent: number;
  preferredSports: SportType[];
  preferredBetTypes: BetType[];
  referralCount: number;
  platform: PlatformType;
  userSegment: UserSegment;
  ltv: number; // Lifetime value
}

/**
 * Bet data
 */
export interface BetData {
  id: string;
  userId: string;
  timestamp: number;
  sport: SportType;
  betType: BetType;
  amount: number;
  odds: number;
  potentialWinnings: number;
  status: 'pending' | 'won' | 'lost' | 'pushed' | 'cancelled';
  teams?: string[];
  game?: string;
  sportsbook?: string;
  isAIPrediction: boolean;
}

/**
 * Feature usage data
 */
export interface FeatureUsage {
  featureId: string;
  featureName: string;
  usageCount: number;
  uniqueUsers: number;
  conversionRate?: number;
  averageTimeSpent?: number;
}

/**
 * Screen view data
 */
export interface ScreenView {
  screenName: string;
  viewCount: number;
  uniqueUsers: number;
  averageTimeSpent: number;
  bounceRate: number;
}

/**
 * User engagement metrics
 */
export interface UserEngagementMetrics {
  totalUsers: number;
  activeUsers: {
    daily: number;
    weekly: number;
    monthly: number;
  };
  newUsers: number;
  returningUsers: number;
  churnRate: number;
  retentionRate: {
    day1: number;
    day7: number;
    day30: number;
  };
  averageSessionDuration: number;
  sessionsPerUser: number;
  screenViewsPerSession: number;
  usersByPlatform: {
    [key in PlatformType]: number;
  };
  usersBySegment: {
    [key in UserSegment]: number;
  };
}

/**
 * Betting metrics
 */
export interface BettingMetrics {
  totalBets: number;
  totalBetAmount: number;
  averageBetAmount: number;
  uniqueBettors: number;
  betsPerUser: number;
  betsByType: {
    [key in BetType]: number;
  };
  betsBySport: {
    [key in SportType]: number;
  };
  betsByStatus: {
    pending: number;
    won: number;
    lost: number;
    pushed: number;
    cancelled: number;
  };
  popularBets: {
    id: string;
    game: string;
    betType: BetType;
    count: number;
  }[];
  aiPredictionUsage: {
    total: number;
    followed: number;
    ignored: number;
    accuracy: number;
  };
}

/**
 * Revenue metrics
 */
export interface RevenueMetrics {
  totalRevenue: number;
  subscriptionRevenue: number;
  microtransactionRevenue: number;
  revenueByPlatform: {
    [key in PlatformType]: number;
  };
  revenueByUserSegment: {
    [key in UserSegment]: number;
  };
  arpu: number; // Average revenue per user
  arppu: number; // Average revenue per paying user
  conversionRate: number;
  ltv: number; // Lifetime value
  cac: number; // Customer acquisition cost
  roi: number; // Return on investment
}

/**
 * Analytics dashboard data
 */
export interface AnalyticsDashboardData {
  timePeriod: AnalyticsTimePeriod;
  customDateRange?: {
    startDate: number;
    endDate: number;
  };
  userEngagement: UserEngagementMetrics;
  betting: BettingMetrics;
  revenue: RevenueMetrics;
  topFeatures: FeatureUsage[];
  topScreens: ScreenView[];
  recentActivities: UserActivity[];
  userGrowth: {
    date: number;
    newUsers: number;
    activeUsers: number;
    churnedUsers: number;
  }[];
  revenueGrowth: {
    date: number;
    subscriptionRevenue: number;
    microtransactionRevenue: number;
    totalRevenue: number;
  }[];
  bettingGrowth: {
    date: number;
    betCount: number;
    betAmount: number;
    uniqueBettors: number;
  }[];
}
