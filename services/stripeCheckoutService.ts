import { httpsCallable } from 'firebase/functions';

import { analyticsService, AnalyticsEventType } from './analyticsService';
import { functions } from '../config/firebase';

// Stripe price mappings - CONSOLIDATED SYSTEM #1 (Sportsbook Config)
const STRIPE_PRICES = {
  // Main subscription tiers - UPDATED PRICING
  insight_monthly: 'price_insight_monthly_1999',
  insight_annual: 'price_insight_annual_16792',
  analyst_monthly: 'price_analyst_monthly_7499',
  analyst_annual: 'price_analyst_annual_62992',
  edge_collective_monthly_solo: 'price_edge_solo_monthly_18999',
  edge_collective_annual_solo: 'price_edge_solo_annual_159592',

  // Edge Collective split payment options - UPDATED PRICING
  edge_collective_monthly_duo: 'price_edge_duo_monthly_9500',
  edge_collective_annual_duo: 'price_edge_duo_annual_79796',
  edge_collective_monthly_trio: 'price_edge_trio_monthly_6333',
  edge_collective_annual_trio: 'price_edge_trio_annual_53197',

  // One-time purchases
  weekend_pass: 'price_weekend_pass_499',
  game_day_pass: 'price_game_day_pass_299',
};

// Educational discount promo code
const EDU_PROMO_CODE_ID = 'promo_15EDU';

export interface StartCheckoutParams {
  userId: string;
  planKey: keyof typeof STRIPE_PRICES;
  email: string;
  metadata?: Record<string, string>;
}

export interface CheckoutResponse {
  url: string;
  sessionId: string;
  isEdu: boolean;
}

/**
 * Triggers Stripe checkout session with optional .edu promo
 * @param params - Checkout parameters including userId, planKey, and email
 * @returns Promise<string> - Stripe checkout session URL
 */
export async function startStripeCheckoutSession({
  userId,
  planKey,
  email,
  metadata = {},
}: StartCheckoutParams): Promise<string> {
  try {
    // Validate inputs
    if (!userId || !planKey || !email) {
      throw new Error('Missing required parameters: userId, planKey, and email are required');
    }

    if (!STRIPE_PRICES[planKey]) {
      throw new Error(`Invalid plan key: ${planKey}`);
    }

    // Check for educational discount eligibility
    const isEdu = email.endsWith('.edu');

    console.log(`Starting checkout for ${email} (edu: ${isEdu}) with plan: ${planKey}`);

    // Track checkout initiation
    await analyticsService.trackEvent(AnalyticsEventType.CHECKOUT_STARTED, {
      plan_key: planKey,
      price_id: STRIPE_PRICES[planKey],
      is_edu: isEdu,
      email,
      user_id: userId,
    });

    // Get Firebase callable function
    const checkoutSession = httpsCallable<
      {
        userId: string;
        priceId: string;
        promoCodeId?: string;
        metadata?: Record<string, string>;
      },
      CheckoutResponse
    >(functions, 'createCheckoutSession');

    // Call the Firebase function
    const { data } = await checkoutSession({
      userId,
      priceId: STRIPE_PRICES[planKey],
      promoCodeId: isEdu ? EDU_PROMO_CODE_ID : undefined,
      metadata: {
        planKey,
        source: 'web_app',
        ...metadata,
      },
    });

    // Track successful session creation
    await analyticsService.trackEvent(AnalyticsEventType.CHECKOUT_SESSION_CREATED, {
      session_id: data.sessionId,
      plan_key: planKey,
      price_id: STRIPE_PRICES[planKey],
      is_edu: data.isEdu,
      checkout_url: data.url,
      user_id: userId,
    });

    console.log(`Checkout session created: ${data.sessionId}`);

    // Return the checkout URL for redirect
    return data.url;
  } catch (error) {
    console.error('Error starting Stripe checkout session:', error);

    // Track checkout error
    await analyticsService.trackEvent(AnalyticsEventType.CHECKOUT_ERROR, {
      error_message: error instanceof Error ? error.message : 'Unknown error',
      plan_key: planKey,
      email,
      user_id: userId,
    });

    throw error;
  }
}

/**
 * Helper function to get plan display name
 */
export function getPlanDisplayName(planKey: keyof typeof STRIPE_PRICES): string {
  const displayNames: Record<keyof typeof STRIPE_PRICES, string> = {
    insight_monthly: 'Insight Monthly',
    insight_annual: 'Insight Annual',
    analyst_monthly: 'Analyst Monthly',
    analyst_annual: 'Analyst Annual',
    edge_collective_monthly_solo: 'Edge Collective Monthly (Solo)',
    edge_collective_annual_solo: 'Edge Collective Annual (Solo)',
    edge_collective_monthly_duo: 'Edge Collective Monthly (2 Users)',
    edge_collective_annual_duo: 'Edge Collective Annual (2 Users)',
    edge_collective_monthly_trio: 'Edge Collective Monthly (3 Users)',
    edge_collective_annual_trio: 'Edge Collective Annual (3 Users)',
    weekend_pass: 'Weekend Pass',
    game_day_pass: 'Game Day Pass',
  };

  return displayNames[planKey] || planKey;
}

/**
 * Helper function to check if a plan is eligible for educational discount
 */
export function isPlanEduEligible(planKey: keyof typeof STRIPE_PRICES): boolean {
  // Define which plans are eligible for educational discounts (all main tiers)
  const eduEligiblePlans: (keyof typeof STRIPE_PRICES)[] = [
    'insight_monthly',
    'insight_annual',
    'analyst_monthly',
    'analyst_annual',
    'edge_collective_monthly_solo',
    'edge_collective_annual_solo',
    'edge_collective_monthly_duo',
    'edge_collective_annual_duo',
    'edge_collective_monthly_trio',
    'edge_collective_annual_trio',
  ];

  return eduEligiblePlans.includes(planKey);
}

/**
 * Helper function to get estimated discount amount for .edu users
 */
export function getEduDiscountInfo(planKey: keyof typeof STRIPE_PRICES): {
  isEligible: boolean;
  discountPercentage: number;
  promoCode: string | null;
} {
  const isEligible = isPlanEduEligible(planKey);

  return {
    isEligible,
    discountPercentage: isEligible ? 15 : 0, // 15% educational discount
    promoCode: isEligible ? EDU_PROMO_CODE_ID : null,
  };
}

/**
 * Enhanced checkout function with educational discount validation
 */
export async function startStripeCheckoutWithEduValidation({
  userId,
  planKey,
  email,
  metadata = {},
}: StartCheckoutParams): Promise<{
  url: string;
  hasEduDiscount: boolean;
  discountPercentage: number;
}> {
  try {
    const isEdu = email.endsWith('.edu');
    const eduInfo = getEduDiscountInfo(planKey);
    const hasEduDiscount = isEdu && eduInfo.isEligible;

    // Track educational discount eligibility
    if (isEdu) {
      await analyticsService.trackEvent(AnalyticsEventType.EDU_DISCOUNT_ELIGIBLE, {
        plan_key: planKey,
        email,
        discount_applicable: hasEduDiscount,
        discount_percentage: eduInfo.discountPercentage,
        user_id: userId,
      });
    }

    const checkoutUrl = await startStripeCheckoutSession({
      userId,
      planKey,
      email,
      metadata: {
        ...metadata,
        edu_discount_applied: hasEduDiscount.toString(),
        discount_percentage: eduInfo.discountPercentage.toString(),
      },
    });

    return {
      url: checkoutUrl,
      hasEduDiscount,
      discountPercentage: eduInfo.discountPercentage,
    };
  } catch (error) {
    console.error('Error in edu validation checkout:', error);
    throw error;
  }
}

// Export constants for external use
export { STRIPE_PRICES, EDU_PROMO_CODE_ID };
