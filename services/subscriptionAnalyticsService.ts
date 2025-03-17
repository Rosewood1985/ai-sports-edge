import { auth, firestore, functions } from '../config/firebase';
import { trackEvent } from './analyticsService';

/**
 * Interface for subscription analytics report
 */
export interface SubscriptionAnalyticsReport {
  activeSubscriptions: number;
  totalRevenue: number;
  averageRevenue: number;
  churnRate: number;
  conversionRate: number;
  subscriptionsByPlan: {
    name: string;
    count: number;
    percentage: number;
  }[];
  revenueByMonth: {
    month: string;
    revenue: number;
  }[];
  subscriptionsByStatus: {
    status: string;
    count: number;
    percentage: number;
  }[];
}

/**
 * Generate a subscription analytics report
 * @param userId User ID
 * @param timeRange Time range for the report
 * @returns Subscription analytics report
 */
export const generateSubscriptionReport = async (
  userId: string,
  timeRange: '7d' | '30d' | '90d' | 'all' = '30d'
): Promise<SubscriptionAnalyticsReport> => {
  try {
    // In a real implementation, we would call a Firebase function
    const generateReportFunc = functions.httpsCallable('generateSubscriptionReport');
    const result = await generateReportFunc({
      timeRange
    });
    
    // Track the event
    await trackEvent('subscription_report_generated', {
      time_range: timeRange
    });
    
    return result.data as SubscriptionAnalyticsReport;
  } catch (error) {
    console.error('Error generating subscription report:', error);
    
    // Return mock data for development
    return getMockAnalyticsData();
  }
};

/**
 * Get mock analytics data for development
 * @returns Mock subscription analytics report
 */
const getMockAnalyticsData = (): SubscriptionAnalyticsReport => {
  return {
    activeSubscriptions: 1,
    totalRevenue: 29.97,
    averageRevenue: 9.99,
    churnRate: 5.2,
    conversionRate: 12.5,
    subscriptionsByPlan: [
      { name: 'Basic Monthly', count: 0, percentage: 0 },
      { name: 'Premium Monthly', count: 1, percentage: 100 },
      { name: 'Premium Annual', count: 0, percentage: 0 }
    ],
    revenueByMonth: [
      { month: 'Jan', revenue: 0 },
      { month: 'Feb', revenue: 0 },
      { month: 'Mar', revenue: 9.99 },
      { month: 'Apr', revenue: 9.99 },
      { month: 'May', revenue: 9.99 },
      { month: 'Jun', revenue: 0 }
    ],
    subscriptionsByStatus: [
      { status: 'Active', count: 1, percentage: 100 },
      { status: 'Canceled', count: 0, percentage: 0 },
      { status: 'Past Due', count: 0, percentage: 0 }
    ]
  };
};

/**
 * Get subscription metrics for a specific user
 * @param userId User ID
 * @returns User subscription metrics
 */
export const getUserSubscriptionMetrics = async (userId: string) => {
  try {
    const db = firestore;
    const userRef = db.collection('users').doc(userId);
    
    // Get user's subscriptions
    const subscriptionsSnapshot = await userRef.collection('subscriptions').get();
    const subscriptions = subscriptionsSnapshot.docs.map(doc => doc.data());
    
    // Get user's purchases
    const purchasesSnapshot = await userRef.collection('purchases').get();
    const purchases = purchasesSnapshot.docs.map(doc => doc.data());
    
    // Calculate metrics
    const activeSubscription = subscriptions.find(sub => sub.status === 'active');
    const totalSpent = purchases.reduce((total, purchase) => total + (purchase.amount || 0) / 100, 0);
    
    return {
      hasActiveSubscription: !!activeSubscription,
      subscriptionPlan: activeSubscription?.planName || null,
      subscriptionStatus: activeSubscription?.status || null,
      currentPeriodEnd: activeSubscription?.currentPeriodEnd || null,
      totalSpent
    };
  } catch (error) {
    console.error('Error getting user subscription metrics:', error);
    return {
      hasActiveSubscription: false,
      subscriptionPlan: null,
      subscriptionStatus: null,
      currentPeriodEnd: null,
      totalSpent: 0
    };
  }
};

export default {
  generateSubscriptionReport,
  getUserSubscriptionMetrics
};