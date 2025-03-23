/**
 * Enhanced Analytics Service
 * 
 * This service provides enhanced analytics data for the admin dashboard.
 */

import { firestore } from '../config/firebase';
import { 
  collection, 
  doc, 
  query, 
  where, 
  orderBy, 
  limit, 
  getDocs, 
  getDoc,
  Timestamp
} from 'firebase/firestore';
import { 
  AnalyticsTimePeriod,
  UserActivityType,
  UserSegment,
  BetType,
  SportType,
  PlatformType,
  UserActivity,
  UserSession,
  UserProfile,
  BetData,
  FeatureUsage,
  ScreenView,
  UserEngagementMetrics,
  BettingMetrics,
  RevenueMetrics,
  AnalyticsDashboardData
} from '../types/enhancedAnalytics';

/**
 * Enhanced Analytics Service
 */
class EnhancedAnalyticsService {
  private readonly ACTIVITY_COLLECTION = 'userActivities';
  private readonly SESSION_COLLECTION = 'userSessions';
  private readonly USER_COLLECTION = 'users';
  private readonly BET_COLLECTION = 'bets';
  private readonly SUBSCRIPTION_COLLECTION = 'subscriptions';
  private readonly TRANSACTION_COLLECTION = 'transactions';
  
  /**
   * Get analytics dashboard data
   * @param timePeriod Time period
   * @param customDateRange Custom date range (if timePeriod is CUSTOM)
   * @returns Analytics dashboard data
   */
  public async getDashboardData(
    timePeriod: AnalyticsTimePeriod = AnalyticsTimePeriod.LAST_30_DAYS,
    customDateRange?: { startDate: number; endDate: number }
  ): Promise<AnalyticsDashboardData> {
    try {
      // Get date range
      const { startDate, endDate } = this.getDateRangeForTimePeriod(timePeriod, customDateRange);
      
      // Get metrics in parallel
      const [
        userEngagement,
        betting,
        revenue,
        topFeatures,
        topScreens,
        recentActivities,
        userGrowth,
        revenueGrowth,
        bettingGrowth
      ] = await Promise.all([
        this.getUserEngagementMetrics(startDate, endDate),
        this.getBettingMetrics(startDate, endDate),
        this.getRevenueMetrics(startDate, endDate),
        this.getTopFeatures(startDate, endDate),
        this.getTopScreens(startDate, endDate),
        this.getRecentActivities(startDate, endDate),
        this.getUserGrowthData(startDate, endDate),
        this.getRevenueGrowthData(startDate, endDate),
        this.getBettingGrowthData(startDate, endDate)
      ]);
      
      return {
        timePeriod,
        customDateRange: timePeriod === AnalyticsTimePeriod.CUSTOM ? customDateRange : undefined,
        userEngagement,
        betting,
        revenue,
        topFeatures,
        topScreens,
        recentActivities,
        userGrowth,
        revenueGrowth,
        bettingGrowth
      };
    } catch (error) {
      console.error('Error getting analytics dashboard data:', error);
      throw error;
    }
  }
  
  /**
   * Get the start and end dates for a time period
   * @param timePeriod Time period
   * @param customDateRange Custom date range (if timePeriod is CUSTOM)
   * @returns Start and end dates in milliseconds
   */
  private getDateRangeForTimePeriod(
    timePeriod: AnalyticsTimePeriod,
    customDateRange?: { startDate: number; endDate: number }
  ): { startDate: number; endDate: number } {
    const now = new Date();
    const endDate = now.getTime();
    let startDate: number;
    
    switch (timePeriod) {
      case AnalyticsTimePeriod.TODAY:
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
        break;
      case AnalyticsTimePeriod.YESTERDAY:
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        startDate = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate()).getTime();
        break;
      case AnalyticsTimePeriod.LAST_7_DAYS:
        const last7Days = new Date(now);
        last7Days.setDate(last7Days.getDate() - 7);
        startDate = last7Days.getTime();
        break;
      case AnalyticsTimePeriod.LAST_30_DAYS:
        const last30Days = new Date(now);
        last30Days.setDate(last30Days.getDate() - 30);
        startDate = last30Days.getTime();
        break;
      case AnalyticsTimePeriod.THIS_MONTH:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
        break;
      case AnalyticsTimePeriod.LAST_MONTH:
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        startDate = lastMonth.getTime();
        break;
      case AnalyticsTimePeriod.CUSTOM:
        if (!customDateRange) {
          throw new Error('Custom date range is required for CUSTOM time period');
        }
        return customDateRange;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30).getTime();
    }
    
    return { startDate, endDate };
  }
  
  /**
   * Get user engagement metrics
   * @param startDate Start date in milliseconds
   * @param endDate End date in milliseconds
   * @returns User engagement metrics
   */
  private async getUserEngagementMetrics(
    startDate: number,
    endDate: number
  ): Promise<UserEngagementMetrics> {
    // Implementation would go here
    // This is a mock implementation for demonstration purposes
    return {
      totalUsers: 5000,
      activeUsers: {
        daily: 1200,
        weekly: 2500,
        monthly: 3800
      },
      newUsers: 450,
      returningUsers: 3350,
      churnRate: 0.12,
      retentionRate: {
        day1: 0.85,
        day7: 0.65,
        day30: 0.45
      },
      averageSessionDuration: 420, // seconds
      sessionsPerUser: 4.2,
      screenViewsPerSession: 8.5,
      usersByPlatform: {
        [PlatformType.ALL]: 3800,
        [PlatformType.IOS]: 1800,
        [PlatformType.ANDROID]: 1500,
        [PlatformType.WEB]: 500
      },
      usersBySegment: {
        [UserSegment.ALL]: 3800,
        [UserSegment.FREE]: 2800,
        [UserSegment.PREMIUM]: 800,
        [UserSegment.TRIAL]: 200,
        [UserSegment.LAPSED]: 1200,
        [UserSegment.NEW]: 450,
        [UserSegment.RETURNING]: 3350,
        [UserSegment.HIGH_VALUE]: 350
      }
    };
  }
  
  /**
   * Get betting metrics
   * @param startDate Start date in milliseconds
   * @param endDate End date in milliseconds
   * @returns Betting metrics
   */
  private async getBettingMetrics(
    startDate: number,
    endDate: number
  ): Promise<BettingMetrics> {
    // Implementation would go here
    // This is a mock implementation for demonstration purposes
    return {
      totalBets: 12500,
      totalBetAmount: 125000,
      averageBetAmount: 10,
      uniqueBettors: 2200,
      betsPerUser: 5.68,
      betsByType: {
        [BetType.MONEYLINE]: 4500,
        [BetType.SPREAD]: 3800,
        [BetType.OVER_UNDER]: 2200,
        [BetType.PROP]: 1200,
        [BetType.PARLAY]: 500,
        [BetType.FUTURES]: 200,
        [BetType.LIVE]: 100
      },
      betsBySport: {
        [SportType.ALL]: 12500,
        [SportType.FOOTBALL]: 4500,
        [SportType.BASKETBALL]: 3800,
        [SportType.BASEBALL]: 1500,
        [SportType.HOCKEY]: 1200,
        [SportType.SOCCER]: 800,
        [SportType.MMA]: 400,
        [SportType.GOLF]: 200,
        [SportType.TENNIS]: 100,
        [SportType.MOTORSPORTS]: 0
      },
      betsByStatus: {
        pending: 2500,
        won: 4500,
        lost: 5000,
        pushed: 300,
        cancelled: 200
      },
      popularBets: [
        { id: '1', game: 'Lakers vs Warriors', betType: BetType.SPREAD, count: 450 },
        { id: '2', game: 'Chiefs vs Bills', betType: BetType.MONEYLINE, count: 420 },
        { id: '3', game: 'Yankees vs Red Sox', betType: BetType.OVER_UNDER, count: 380 },
        { id: '4', game: 'Packers vs Bears', betType: BetType.SPREAD, count: 350 },
        { id: '5', game: 'Celtics vs Bucks', betType: BetType.MONEYLINE, count: 320 }
      ],
      aiPredictionUsage: {
        total: 5000,
        followed: 3500,
        ignored: 1500,
        accuracy: 0.65
      }
    };
  }
  
  /**
   * Get revenue metrics
   * @param startDate Start date in milliseconds
   * @param endDate End date in milliseconds
   * @returns Revenue metrics
   */
  private async getRevenueMetrics(
    startDate: number,
    endDate: number
  ): Promise<RevenueMetrics> {
    // Implementation would go here
    // This is a mock implementation for demonstration purposes
    return {
      totalRevenue: 85000,
      subscriptionRevenue: 65000,
      microtransactionRevenue: 20000,
      revenueByPlatform: {
        [PlatformType.ALL]: 85000,
        [PlatformType.IOS]: 45000,
        [PlatformType.ANDROID]: 30000,
        [PlatformType.WEB]: 10000
      },
      revenueByUserSegment: {
        [UserSegment.ALL]: 85000,
        [UserSegment.FREE]: 15000,
        [UserSegment.PREMIUM]: 60000,
        [UserSegment.TRIAL]: 10000,
        [UserSegment.LAPSED]: 5000,
        [UserSegment.NEW]: 20000,
        [UserSegment.RETURNING]: 65000,
        [UserSegment.HIGH_VALUE]: 40000
      },
      arpu: 17, // Average revenue per user
      arppu: 85, // Average revenue per paying user
      conversionRate: 0.2, // 20% of users are paying
      ltv: 120, // Lifetime value
      cac: 50, // Customer acquisition cost
      roi: 2.4 // Return on investment
    };
  }
  
  /**
   * Get top features
   * @param startDate Start date in milliseconds
   * @param endDate End date in milliseconds
   * @returns Top features
   */
  private async getTopFeatures(
    startDate: number,
    endDate: number
  ): Promise<FeatureUsage[]> {
    // Implementation would go here
    // This is a mock implementation for demonstration purposes
    return [
      { featureId: '1', featureName: 'Odds Comparison', usageCount: 12500, uniqueUsers: 3200, averageTimeSpent: 120 },
      { featureId: '2', featureName: 'Parlay Builder', usageCount: 8500, uniqueUsers: 2800, averageTimeSpent: 180 },
      { featureId: '3', featureName: 'AI Predictions', usageCount: 7500, uniqueUsers: 2500, averageTimeSpent: 90 },
      { featureId: '4', featureName: 'Betting History', usageCount: 6500, uniqueUsers: 2200, averageTimeSpent: 150 },
      { featureId: '5', featureName: 'Live Scores', usageCount: 5500, uniqueUsers: 3000, averageTimeSpent: 60 }
    ];
  }
  
  /**
   * Get top screens
   * @param startDate Start date in milliseconds
   * @param endDate End date in milliseconds
   * @returns Top screens
   */
  private async getTopScreens(
    startDate: number,
    endDate: number
  ): Promise<ScreenView[]> {
    // Implementation would go here
    // This is a mock implementation for demonstration purposes
    return [
      { screenName: 'HomeScreen', viewCount: 25000, uniqueUsers: 3800, averageTimeSpent: 45, bounceRate: 0.1 },
      { screenName: 'OddsComparisonScreen', viewCount: 15000, uniqueUsers: 3200, averageTimeSpent: 120, bounceRate: 0.15 },
      { screenName: 'ParlayScreen', viewCount: 10000, uniqueUsers: 2800, averageTimeSpent: 180, bounceRate: 0.2 },
      { screenName: 'BettingHistoryScreen', viewCount: 8000, uniqueUsers: 2200, averageTimeSpent: 150, bounceRate: 0.12 },
      { screenName: 'ProfileScreen', viewCount: 7000, uniqueUsers: 3500, averageTimeSpent: 60, bounceRate: 0.08 }
    ];
  }
  
  /**
   * Get recent activities
   * @param startDate Start date in milliseconds
   * @param endDate End date in milliseconds
   * @returns Recent activities
   */
  private async getRecentActivities(
    startDate: number,
    endDate: number
  ): Promise<UserActivity[]> {
    // Implementation would go here
    // This is a mock implementation for demonstration purposes
    return [
      { id: '1', userId: 'user1', timestamp: Date.now() - 1000 * 60, activityType: UserActivityType.BET_PLACED, data: { amount: 10 }, platform: PlatformType.IOS, sessionId: 'session1' },
      { id: '2', userId: 'user2', timestamp: Date.now() - 1000 * 120, activityType: UserActivityType.ODDS_COMPARED, data: { game: 'Lakers vs Warriors' }, platform: PlatformType.ANDROID, sessionId: 'session2' },
      { id: '3', userId: 'user3', timestamp: Date.now() - 1000 * 180, activityType: UserActivityType.SUBSCRIPTION_PURCHASED, data: { plan: 'premium' }, platform: PlatformType.WEB, sessionId: 'session3' },
      { id: '4', userId: 'user4', timestamp: Date.now() - 1000 * 240, activityType: UserActivityType.FEATURE_USED, data: { featureId: '1', featureName: 'Odds Comparison' }, platform: PlatformType.IOS, sessionId: 'session4' },
      { id: '5', userId: 'user5', timestamp: Date.now() - 1000 * 300, activityType: UserActivityType.SCREEN_VIEW, data: { screenName: 'HomeScreen' }, platform: PlatformType.ANDROID, sessionId: 'session5' }
    ];
  }
  
  /**
   * Get user growth data
   * @param startDate Start date in milliseconds
   * @param endDate End date in milliseconds
   * @returns User growth data
   */
  private async getUserGrowthData(
    startDate: number,
    endDate: number
  ): Promise<{ date: number; newUsers: number; activeUsers: number; churnedUsers: number }[]> {
    // Implementation would go here
    // This is a mock implementation for demonstration purposes
    const days = Math.ceil((endDate - startDate) / (24 * 60 * 60 * 1000));
    const result = [];
    
    for (let i = 0; i < days; i++) {
      const date = startDate + i * 24 * 60 * 60 * 1000;
      result.push({
        date,
        newUsers: Math.floor(Math.random() * 50) + 10,
        activeUsers: Math.floor(Math.random() * 500) + 1000,
        churnedUsers: Math.floor(Math.random() * 30) + 5
      });
    }
    
    return result;
  }
  
  /**
   * Get revenue growth data
   * @param startDate Start date in milliseconds
   * @param endDate End date in milliseconds
   * @returns Revenue growth data
   */
  private async getRevenueGrowthData(
    startDate: number,
    endDate: number
  ): Promise<{ date: number; subscriptionRevenue: number; microtransactionRevenue: number; totalRevenue: number }[]> {
    // Implementation would go here
    // This is a mock implementation for demonstration purposes
    const days = Math.ceil((endDate - startDate) / (24 * 60 * 60 * 1000));
    const result = [];
    
    for (let i = 0; i < days; i++) {
      const date = startDate + i * 24 * 60 * 60 * 1000;
      const subscriptionRevenue = Math.floor(Math.random() * 1000) + 1000;
      const microtransactionRevenue = Math.floor(Math.random() * 500) + 500;
      result.push({
        date,
        subscriptionRevenue,
        microtransactionRevenue,
        totalRevenue: subscriptionRevenue + microtransactionRevenue
      });
    }
    
    return result;
  }
  
  /**
   * Get betting growth data
   * @param startDate Start date in milliseconds
   * @param endDate End date in milliseconds
   * @returns Betting growth data
   */
  private async getBettingGrowthData(
    startDate: number,
    endDate: number
  ): Promise<{ date: number; betCount: number; betAmount: number; uniqueBettors: number }[]> {
    // Implementation would go here
    // This is a mock implementation for demonstration purposes
    const days = Math.ceil((endDate - startDate) / (24 * 60 * 60 * 1000));
    const result = [];
    
    for (let i = 0; i < days; i++) {
      const date = startDate + i * 24 * 60 * 60 * 1000;
      const betCount = Math.floor(Math.random() * 500) + 300;
      const uniqueBettors = Math.floor(Math.random() * 200) + 100;
      result.push({
        date,
        betCount,
        betAmount: betCount * (Math.random() * 5 + 5),
        uniqueBettors
      });
    }
    
    return result;
  }
}

export const enhancedAnalyticsService = new EnhancedAnalyticsService();
