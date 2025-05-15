import { firebaseService } from '../src/atomic/organisms/firebaseService';
import '../config/firebase';
import { trackEvent } from './analyticsService';
import {
  collection,
  doc,
  getDocs,
  query,
  where,
  Timestamp,
  DocumentData,
  QueryDocumentSnapshot
} from 'firebase/firestore';
import { httpsCallable, HttpsCallableResult } from 'firebase/functions';

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
    // Call the Firebase function to generate the report
    const generateReportFunc = httpsCallable(functions, 'generateSubscriptionReport');
    const result = await generateReportFunc({
      timeRange
    });
    
    // Track the event
    await trackEvent('subscription_report_generated', {
      time_range: timeRange
    });
    
    // Format the data if needed
    const reportData = result.data as SubscriptionAnalyticsReport;
    
    // Ensure all required fields are present
    const formattedReport: SubscriptionAnalyticsReport = {
      activeSubscriptions: reportData.activeSubscriptions || 0,
      totalRevenue: reportData.totalRevenue || 0,
      averageRevenue: reportData.averageRevenue || 0,
      churnRate: reportData.churnRate || 0,
      conversionRate: reportData.conversionRate || 0,
      subscriptionsByPlan: reportData.subscriptionsByPlan || [],
      revenueByMonth: reportData.revenueByMonth || [],
      subscriptionsByStatus: reportData.subscriptionsByStatus || []
    };
    
    return formattedReport;
  } catch (error) {
    console.error('Error generating subscription report:', error);
    
    // For development or when errors occur, return mock data
    // In production, you might want to show an error message instead
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
 * Interface for user subscription metrics
 */
export interface UserSubscriptionMetrics {
  hasActiveSubscription: boolean;
  subscriptionPlan: string | null;
  subscriptionStatus: string | null;
  currentPeriodEnd: Timestamp | null;
  totalSpent: number;
}

/**
 * Interface for subscription data
 */
interface SubscriptionData {
  status: string;
  planName: string;
  currentPeriodEnd: Timestamp;
}

/**
 * Interface for purchase data
 */
interface PurchaseData {
  amount?: number;
}

/**
 * Get subscription metrics for a specific user
 * @param userId User ID
 * @returns User subscription metrics
 */
export const getUserSubscriptionMetrics = async (userId: string): Promise<UserSubscriptionMetrics> => {
  try {
    // Get user's subscriptions
    const userDocRef = firebaseService.firestore.firebaseService.firestore.doc(firestore, 'users', userId);
    const subscriptionsCollectionRef = firebaseService.firestore.firebaseService.firestore.collection(userDocRef, 'subscriptions');
    const subscriptionsSnapshot = await getDocs(subscriptionsCollectionRef);
    
    const subscriptions: SubscriptionData[] = [];
    subscriptionsSnapshot.forEach((doc: QueryDocumentSnapshot<DocumentData>) => {
      const data = doc.data() as SubscriptionData;
      subscriptions.push(data);
    });
    
    // Get user's purchases
    const purchasesCollectionRef = firebaseService.firestore.firebaseService.firestore.collection(userDocRef, 'purchases');
    const purchasesSnapshot = await getDocs(purchasesCollectionRef);
    
    const purchases: PurchaseData[] = [];
    purchasesSnapshot.forEach((doc: QueryDocumentSnapshot<DocumentData>) => {
      const data = doc.data() as PurchaseData;
      purchases.push(data);
    });
    
    // Calculate metrics
    const activeSubscription = subscriptions.find(sub => sub.status === 'active');
    const totalSpent = purchases.reduce((total: number, purchase: PurchaseData) =>
      total + (purchase.amount || 0) / 100, 0);
    
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