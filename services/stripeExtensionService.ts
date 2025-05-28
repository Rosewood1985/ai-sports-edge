/**
 * Stripe Extension Service
 * Integration with Firebase Stripe Extension for subscription management
 */

import { 
  doc, 
  collection, 
  addDoc, 
  onSnapshot, 
  updateDoc, 
  query, 
  where, 
  getDocs,
  Timestamp 
} from 'firebase/firestore';
import { db, auth } from '../config/firebase';
import { User } from 'firebase/auth';

export interface StripeCustomer {
  email: string;
  stripeId: string;
  metadata?: Record<string, string>;
}

export interface StripeSubscription {
  id: string;
  status: 'active' | 'canceled' | 'past_due' | 'incomplete' | 'incomplete_expired' | 'trialing' | 'unpaid';
  current_period_start: Timestamp;
  current_period_end: Timestamp;
  cancel_at_period_end: boolean;
  canceled_at?: Timestamp;
  price: {
    id: string;
    product: string;
    unit_amount: number;
    currency: string;
    recurring: {
      interval: 'month' | 'year';
      interval_count: number;
    };
  };
  metadata?: Record<string, string>;
}

export interface StripePayment {
  id: string;
  amount: number;
  currency: string;
  status: 'succeeded' | 'failed' | 'processing' | 'requires_action' | 'canceled';
  created: Timestamp;
  subscription?: string;
  metadata?: Record<string, string>;
}

export interface CheckoutSessionData {
  price?: string;
  prices?: string[];
  success_url: string;
  cancel_url: string;
  automatic_tax?: boolean;
  tax_id_collection?: boolean;
  allow_promotion_codes?: boolean;
  trial_period_days?: number;
  metadata?: Record<string, string>;
}

export class StripeExtensionService {
  private currentUser: User | null = null;

  constructor() {
    // Listen for auth state changes
    auth.onAuthStateChanged((user) => {
      this.currentUser = user;
    });
  }

  /**
   * Verify user is authenticated
   */
  private requireAuth(): string {
    if (!this.currentUser) {
      throw new Error('User must be authenticated to use Stripe services');
    }
    return this.currentUser.uid;
  }

  /**
   * Create a checkout session for subscription or one-time payment
   */
  async createCheckoutSession(sessionData: CheckoutSessionData): Promise<string> {
    const userId = this.requireAuth();
    
    try {
      const checkoutSessionRef = collection(db, 'customers', userId, 'checkout_sessions');
      
      const docRef = await addDoc(checkoutSessionRef, {
        ...sessionData,
        created: Timestamp.now()
      });

      // Listen for the checkout session URL
      return new Promise((resolve, reject) => {
        const unsubscribe = onSnapshot(docRef, (snap) => {
          const data = snap.data();
          
          if (data?.url) {
            unsubscribe();
            resolve(data.url);
          }
          
          if (data?.error) {
            unsubscribe();
            reject(new Error(data.error.message));
          }
        });

        // Timeout after 30 seconds
        setTimeout(() => {
          unsubscribe();
          reject(new Error('Checkout session creation timed out'));
        }, 30000);
      });
    } catch (error) {
      console.error('Error creating checkout session:', error);
      throw error;
    }
  }

  /**
   * Get user's current subscriptions
   */
  async getSubscriptions(): Promise<StripeSubscription[]> {
    const userId = this.requireAuth();
    
    try {
      const subscriptionsRef = collection(db, 'customers', userId, 'subscriptions');
      const querySnapshot = await getDocs(subscriptionsRef);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as StripeSubscription));
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
      throw error;
    }
  }

  /**
   * Get active subscription
   */
  async getActiveSubscription(): Promise<StripeSubscription | null> {
    const subscriptions = await this.getSubscriptions();
    return subscriptions.find(sub => sub.status === 'active') || null;
  }

  /**
   * Cancel subscription at period end
   */
  async cancelSubscription(subscriptionId: string): Promise<void> {
    const userId = this.requireAuth();
    
    try {
      const subscriptionRef = doc(db, 'customers', userId, 'subscriptions', subscriptionId);
      
      await updateDoc(subscriptionRef, {
        cancel_at_period_end: true
      });
    } catch (error) {
      console.error('Error canceling subscription:', error);
      throw error;
    }
  }

  /**
   * Reactivate a canceled subscription
   */
  async reactivateSubscription(subscriptionId: string): Promise<void> {
    const userId = this.requireAuth();
    
    try {
      const subscriptionRef = doc(db, 'customers', userId, 'subscriptions', subscriptionId);
      
      await updateDoc(subscriptionRef, {
        cancel_at_period_end: false
      });
    } catch (error) {
      console.error('Error reactivating subscription:', error);
      throw error;
    }
  }

  /**
   * Get payment history
   */
  async getPaymentHistory(): Promise<StripePayment[]> {
    const userId = this.requireAuth();
    
    try {
      const paymentsRef = collection(db, 'customers', userId, 'payments');
      const querySnapshot = await getDocs(paymentsRef);
      
      return querySnapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        } as StripePayment))
        .sort((a, b) => b.created.seconds - a.created.seconds);
    } catch (error) {
      console.error('Error fetching payment history:', error);
      throw error;
    }
  }

  /**
   * Get successful payments for a specific subscription
   */
  async getSubscriptionPayments(subscriptionId: string): Promise<StripePayment[]> {
    const userId = this.requireAuth();
    
    try {
      const paymentsRef = collection(db, 'customers', userId, 'payments');
      const q = query(
        paymentsRef, 
        where('subscription', '==', subscriptionId),
        where('status', '==', 'succeeded')
      );
      
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        } as StripePayment))
        .sort((a, b) => b.created.seconds - a.created.seconds);
    } catch (error) {
      console.error('Error fetching subscription payments:', error);
      throw error;
    }
  }

  /**
   * Listen to subscription changes in real-time
   */
  subscribeToSubscriptionChanges(callback: (subscriptions: StripeSubscription[]) => void): () => void {
    const userId = this.requireAuth();
    
    const subscriptionsRef = collection(db, 'customers', userId, 'subscriptions');
    
    return onSnapshot(subscriptionsRef, (snapshot) => {
      const subscriptions = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as StripeSubscription));
      
      callback(subscriptions);
    });
  }

  /**
   * Listen to payment updates in real-time
   */
  subscribeToPaymentUpdates(callback: (payments: StripePayment[]) => void): () => void {
    const userId = this.requireAuth();
    
    const paymentsRef = collection(db, 'customers', userId, 'payments');
    
    return onSnapshot(paymentsRef, (snapshot) => {
      const payments = snapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        } as StripePayment))
        .sort((a, b) => b.created.seconds - a.created.seconds);
      
      callback(payments);
    });
  }

  /**
   * Create a customer portal session for managing subscriptions
   */
  async createCustomerPortalSession(returnUrl: string): Promise<string> {
    const userId = this.requireAuth();
    
    try {
      const portalSessionRef = collection(db, 'customers', userId, 'portal_sessions');
      
      const docRef = await addDoc(portalSessionRef, {
        return_url: returnUrl,
        created: Timestamp.now()
      });

      // Listen for the portal session URL
      return new Promise((resolve, reject) => {
        const unsubscribe = onSnapshot(docRef, (snap) => {
          const data = snap.data();
          
          if (data?.url) {
            unsubscribe();
            resolve(data.url);
          }
          
          if (data?.error) {
            unsubscribe();
            reject(new Error(data.error.message));
          }
        });

        // Timeout after 30 seconds
        setTimeout(() => {
          unsubscribe();
          reject(new Error('Portal session creation timed out'));
        }, 30000);
      });
    } catch (error) {
      console.error('Error creating customer portal session:', error);
      throw error;
    }
  }

  /**
   * Get available products and prices
   */
  async getProducts(): Promise<any[]> {
    try {
      const productsRef = collection(db, 'products');
      const querySnapshot = await getDocs(productsRef);
      
      const products = [];
      
      for (const productDoc of querySnapshot.docs) {
        const productData = productDoc.data();
        
        // Get prices for this product
        const pricesRef = collection(db, 'products', productDoc.id, 'prices');
        const pricesSnapshot = await getDocs(pricesRef);
        
        const prices = pricesSnapshot.docs.map(priceDoc => ({
          id: priceDoc.id,
          ...priceDoc.data()
        }));
        
        products.push({
          id: productDoc.id,
          ...productData,
          prices
        });
      }
      
      return products;
    } catch (error) {
      console.error('Error fetching products:', error);
      throw error;
    }
  }

  /**
   * Create subscription checkout for specific price
   */
  async createSubscriptionCheckout(
    priceId: string, 
    options: {
      trialPeriodDays?: number;
      allowPromotionCodes?: boolean;
      automaticTax?: boolean;
      metadata?: Record<string, string>;
    } = {}
  ): Promise<string> {
    const checkoutData: CheckoutSessionData = {
      price: priceId,
      success_url: `${window.location.origin}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${window.location.origin}/subscription/cancel`,
      automatic_tax: options.automaticTax ?? true,
      tax_id_collection: true,
      allow_promotion_codes: options.allowPromotionCodes ?? true,
      metadata: options.metadata
    };

    if (options.trialPeriodDays) {
      checkoutData.trial_period_days = options.trialPeriodDays;
    }

    return this.createCheckoutSession(checkoutData);
  }

  /**
   * Create one-time payment checkout
   */
  async createOneTimeCheckout(
    priceIds: string[],
    options: {
      metadata?: Record<string, string>;
    } = {}
  ): Promise<string> {
    const checkoutData: CheckoutSessionData = {
      prices: priceIds,
      success_url: `${window.location.origin}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${window.location.origin}/payment/cancel`,
      automatic_tax: true,
      metadata: options.metadata
    };

    return this.createCheckoutSession(checkoutData);
  }
}

// Export singleton instance
export const stripeExtensionService = new StripeExtensionService();