# Automatic Resubscribe, Referral Program, and Subscription Analytics

This document outlines the implementation of three new features in the AI Sports Edge app:

1. Automatic Resubscribe
2. Referral Program
3. Subscription Analytics

## Automatic Resubscribe

The automatic resubscribe feature allows users to opt-in to automatically renew their subscription when it expires. This helps reduce churn and maintain a consistent user base.

### Implementation Details

- **Firebase Function**: `handleAutoResubscribe` - Triggered when a subscription is canceled with `cancelAtPeriodEnd` set to true.
- **Client-Side Toggle**: Users can enable/disable auto-resubscribe in the Subscription Management screen.
- **Notifications**: Users receive notifications when their subscription is automatically renewed.

### User Flow

1. User enables auto-resubscribe in the Subscription Management screen.
2. When their subscription is about to expire, the system automatically creates a new subscription using the same payment method and plan.
3. User receives a notification confirming the renewal.

## Referral Program

The referral program incentivizes users to invite friends to the platform, rewarding both the referrer and the referred user when a subscription is purchased.

### Implementation Details

- **Referral Codes**: Each subscribed user can generate a unique referral code.
- **Rewards**:
  - Referrer: 1-month subscription extension + 200 loyalty points
  - Referred User: 100 loyalty points upon subscription

### User Flow

1. Existing user generates and shares their referral code.
2. New user enters the referral code during signup or before subscribing.
3. When the new user subscribes, both users receive their rewards.
4. The referrer receives a notification about the successful referral.

## Subscription Analytics

Comprehensive analytics for tracking subscription metrics, user behavior, and revenue.

### Implementation Details

- **Event Tracking**: Detailed tracking of subscription-related events:
  - Subscription created/canceled/renewed
  - Plan upgrades/downgrades
  - Payment failures
  - Referral conversions
  - Auto-resubscribe events

- **Analytics Dashboard**: Admin-only dashboard for viewing subscription metrics:
  - Churn rate
  - Retention rate
  - Conversion rate
  - Average subscription length
  - Revenue by plan
  - Referral conversion rate

### Reports

Administrators can generate reports for specific date ranges, providing insights into:

- New subscriptions
- Canceled subscriptions
- Renewed subscriptions
- Failed payments
- Plan upgrades/downgrades
- Auto-resubscribes
- Revenue metrics
- Referral conversions

## Technical Implementation

### Firebase Functions

1. **autoResubscribe.js**
   - `handleAutoResubscribe`: Firestore trigger for subscription updates
   - `toggleAutoResubscribe`: HTTP callable function for toggling the setting

2. **referralProgram.js**
   - `generateReferralCode`: HTTP callable function for creating referral codes
   - `applyReferralCode`: HTTP callable function for applying referral codes
   - `processReferralReward`: Firestore trigger for new subscriptions

3. **subscriptionAnalytics.js**
   - `trackSubscriptionEvent`: HTTP callable function for tracking events
   - `generateSubscriptionReport`: HTTP callable function for creating reports

### Client Components

1. **AutoResubscribeToggle.tsx**
   - Toggle component for enabling/disabling auto-resubscribe

2. **ReferralProgramCard.tsx**
   - UI for generating, sharing, and applying referral codes

### Database Structure

```
/users/{userId}/
  - subscriptionId: string
  - subscriptionStatus: string
  - autoResubscribe: boolean
  - referralCode: string
  - referredBy: string
  - referralCount: number

/users/{userId}/subscriptions/{subscriptionId}/
  - status: string
  - priceId: string
  - currentPeriodStart: timestamp
  - currentPeriodEnd: timestamp
  - cancelAtPeriodEnd: boolean
  - autoResubscribe: boolean

/referralCodes/{code}/
  - userId: string
  - createdAt: timestamp
  - usageCount: number

/referrals/
  - referrerId: string
  - referredUserId: string
  - referralCode: string
  - status: string
  - completedAt: timestamp
  - subscriptionId: string

/analytics/subscriptions/
  - new_subscriptions: number
  - cancelled_subscriptions: number
  - renewed_subscriptions: number
  - failed_payments: number
  - plan_upgrades: number
  - plan_downgrades: number
  - auto_resubscribes: number

/analytics/subscriptions/events/
  - eventType: string
  - userId: string
  - timestamp: timestamp
  - properties: object

/analytics/subscriptions/daily/{date}/
  - metrics...

/analytics/subscriptions/monthly/{month}/
  - metrics...

/analytics/subscriptions/reports/{reportId}/
  - period: object
  - metrics: object
  - revenue: object
  - generatedAt: timestamp
  - generatedBy: string
```

## Integration with Existing Systems

- **Stripe Integration**: Auto-resubscribe uses Stripe's subscription API to create new subscriptions.
- **Firebase Authentication**: User identification for referrals and analytics.
- **Firestore**: Storage of subscription data, referral codes, and analytics events.
- **Cloud Functions**: Backend processing for all features.

## Future Enhancements

1. **Tiered Referral Program**: Additional rewards for users who refer multiple friends.
2. **A/B Testing**: Test different referral rewards to optimize conversion.
3. **Predictive Analytics**: Use subscription data to predict churn and target at-risk users.
4. **Customizable Auto-Resubscribe**: Allow users to switch plans when auto-resubscribing.
5. **Referral Leaderboard**: Gamify the referral process with a public leaderboard.