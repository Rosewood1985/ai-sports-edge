import { getFunctions, httpsCallable } from 'firebase/functions';

import { analyticsService, AnalyticsEventType } from './analyticsService';
import { auth } from '../config/firebase';

// Initialize Firebase Functions
const functions = getFunctions();

export interface CheckoutSessionData {
  userId: string;
  priceId: string;
  promoCodeId?: string;
  metadata?: Record<string, string>;
}

export interface CheckoutSessionResponse {
  url: string;
  sessionId: string;
  isEdu: boolean;
}

export interface EduDiscountResponse {
  isEligible: boolean;
  discountCode: string | null;
  discountPercentage: number;
}

/**
 * Service for handling Stripe checkout sessions via Firebase Functions
 */
export class CheckoutService {
  private createCheckoutSessionCallable = httpsCallable<
    CheckoutSessionData,
    CheckoutSessionResponse
  >(functions, 'createCheckoutSession');

  private handleSuccessfulPaymentCallable = httpsCallable<
    { sessionId: string },
    { success: boolean }
  >(functions, 'handleSuccessfulPayment');

  private checkEduDiscountCallable = httpsCallable<{ email: string }, EduDiscountResponse>(
    functions,
    'checkEduDiscount'
  );

  /**
   * Create a Stripe checkout session
   */
  async createCheckoutSession(
    data: Omit<CheckoutSessionData, 'userId'>
  ): Promise<CheckoutSessionResponse> {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('User must be authenticated');
      }

      // Track checkout initiation
      await analyticsService.trackEvent(AnalyticsEventType.CHECKOUT_STARTED, {
        plan_id: data.priceId,
        has_promo: !!data.promoCodeId,
        user_id: user.uid,
      });

      const result = await this.createCheckoutSessionCallable({
        userId: user.uid,
        ...data,
      });

      console.log('Checkout session created:', result.data.sessionId);

      // Track successful session creation
      await analyticsService.trackEvent(AnalyticsEventType.CHECKOUT_SESSION_CREATED, {
        session_id: result.data.sessionId,
        plan_id: data.priceId,
        is_edu: result.data.isEdu,
        user_id: user.uid,
      });

      return result.data;
    } catch (error) {
      console.error('Error creating checkout session:', error);

      // Track checkout error
      await analyticsService.trackEvent(AnalyticsEventType.CHECKOUT_ERROR, {
        error_message: error instanceof Error ? error.message : 'Unknown error',
        plan_id: data.priceId,
        user_id: auth.currentUser?.uid,
      });

      throw error;
    }
  }

  /**
   * Handle successful payment completion
   */
  async handleSuccessfulPayment(sessionId: string): Promise<boolean> {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('User must be authenticated');
      }

      const result = await this.handleSuccessfulPaymentCallable({ sessionId });

      if (result.data.success) {
        // Track successful payment
        await analyticsService.trackEvent(AnalyticsEventType.PURCHASE_COMPLETED, {
          session_id: sessionId,
          user_id: user.uid,
        });

        console.log('Payment processed successfully');
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error handling successful payment:', error);

      // Track payment processing error
      await analyticsService.trackEvent(AnalyticsEventType.PAYMENT_ERROR, {
        error_message: error instanceof Error ? error.message : 'Unknown error',
        session_id: sessionId,
        user_id: auth.currentUser?.uid,
      });

      throw error;
    }
  }

  /**
   * Check if user is eligible for educational discount
   */
  async checkEducationalDiscount(email?: string): Promise<EduDiscountResponse> {
    try {
      const user = auth.currentUser;
      const userEmail = email || user?.email;

      if (!userEmail) {
        return {
          isEligible: false,
          discountCode: null,
          discountPercentage: 0,
        };
      }

      const result = await this.checkEduDiscountCallable({ email: userEmail });

      // Track edu discount check
      if (result.data.isEligible) {
        await analyticsService.trackEvent(AnalyticsEventType.EDU_DISCOUNT_ELIGIBLE, {
          email: userEmail,
          discount_percentage: result.data.discountPercentage,
          user_id: user?.uid,
        });
      }

      return result.data;
    } catch (error) {
      console.error('Error checking educational discount:', error);

      // Return default response on error
      return {
        isEligible: false,
        discountCode: null,
        discountPercentage: 0,
      };
    }
  }

  /**
   * Create checkout session with automatic educational discount detection
   */
  async createCheckoutSessionWithEduDiscount(
    data: Omit<CheckoutSessionData, 'userId'>
  ): Promise<CheckoutSessionResponse> {
    try {
      const user = auth.currentUser;
      if (!user?.email) {
        throw new Error('User email is required');
      }

      // Check for educational discount
      const eduDiscount = await this.checkEducationalDiscount(user.email);

      // Add educational discount if eligible
      const checkoutData = {
        ...data,
        ...(eduDiscount.isEligible && {
          promoCodeId: eduDiscount.discountCode!,
        }),
      };

      return await this.createCheckoutSession(checkoutData);
    } catch (error) {
      console.error('Error creating checkout session with edu discount:', error);
      throw error;
    }
  }

  /**
   * Redirect to Stripe checkout
   */
  async redirectToCheckout(priceId: string, metadata?: Record<string, string>): Promise<void> {
    try {
      const response = await this.createCheckoutSessionWithEduDiscount({
        priceId,
        metadata,
      });

      if (response.url) {
        // Track checkout redirect
        await analyticsService.trackEvent(AnalyticsEventType.CHECKOUT_REDIRECT, {
          session_id: response.sessionId,
          plan_id: priceId,
          is_edu: response.isEdu,
          user_id: auth.currentUser?.uid,
        });

        // Redirect to Stripe checkout
        window.location.href = response.url;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (error) {
      console.error('Error redirecting to checkout:', error);
      throw error;
    }
  }

  /**
   * Handle checkout success page
   */
  async handleCheckoutSuccess(sessionId: string): Promise<void> {
    try {
      const success = await this.handleSuccessfulPayment(sessionId);

      if (success) {
        console.log('Checkout completed successfully');

        // You can add additional success handling here
        // such as showing a success message, redirecting to dashboard, etc.
      }
    } catch (error) {
      console.error('Error handling checkout success:', error);
      throw error;
    }
  }

  /**
   * Get checkout session details from Stripe (client-side safe method)
   */
  async getCheckoutSessionStatus(sessionId: string): Promise<'open' | 'complete' | 'expired'> {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('User must be authenticated');
      }

      // Call the Firebase function for secure session status retrieval
      const getStatusCallable = httpsCallable<
        { sessionId: string },
        { status: string; payment_status: string }
      >(functions, 'getCheckoutSessionStatus');

      const result = await getStatusCallable({ sessionId });

      // Map Stripe status to our simplified status
      if (result.data.status === 'complete' && result.data.payment_status === 'paid') {
        return 'complete';
      } else if (result.data.status === 'expired') {
        return 'expired';
      } else {
        return 'open';
      }
    } catch (error) {
      console.error('Error getting checkout session status:', error);

      // Track status check error
      await analyticsService.trackEvent(AnalyticsEventType.CHECKOUT_ERROR, {
        error_message: error instanceof Error ? error.message : 'Unknown error',
        session_id: sessionId,
        user_id: auth.currentUser?.uid,
        error_type: 'status_check_failed',
      });

      return 'expired';
    }
  }
}

// Export singleton instance
export const checkoutService = new CheckoutService();
