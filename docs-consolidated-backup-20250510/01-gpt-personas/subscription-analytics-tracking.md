# Subscription Analytics and Tracking – AI Sports Edge

## Overview
The AI Sports Edge backend tracks subscription events and user behavior to enable business insight, monetization refinement, and user engagement optimization. This system provides a comprehensive view of subscription performance metrics and user engagement patterns to inform business decisions.

## Tracked Events
- **Subscription Created**: When a user initiates a new subscription
- **Subscription Canceled**: When a user cancels their subscription
- **Subscription Renewed**: Automatic or manual renewal of an existing subscription
- **Plan Upgraded/Downgraded**: When a user changes their subscription tier
- **Payment Success**: Successful payment processing
- **Payment Failure**: Failed payment attempts
- **Referral Conversions**: When a referred user converts to a paid subscription
- **Auto-Resubscribe Actions**: When a user opts to resubscribe after cancellation

## Key Metrics
- **Churn Rate (monthly)**: Percentage of subscribers who cancel within a month
- **Retention Rate (rolling 30/60/90 days)**: Percentage of subscribers who remain active over time
- **Conversion Rate (from free to paid tiers)**: Percentage of free users who upgrade to paid plans
- **Average Subscription Length**: How long users typically maintain their subscriptions
- **Revenue by Plan Tier**: Revenue breakdown by subscription level
- **Revenue by Month**: Monthly revenue tracking
- **Total Revenue**: Cumulative revenue from all subscriptions
- **Average Revenue Per User (ARPU)**: Average revenue generated per user

## Data Sources
- **Stripe Webhooks**: Real-time subscription and payment events from Stripe
- **Firestore User Subscription Docs**: Subscription data stored in Firestore
- **Referral Metadata**: Information about referral sources and conversions
- **Frontend Events (via Firebase Analytics)**: User interaction data from the app

## Implementation Details

### Firestore Schema
Subscription data is stored in the following collections:
```
users/{userId}/subscriptions/{subscriptionId}
```

Each subscription document contains:
- `status`: Current subscription status (active, canceled, past_due)
- `priceId`: Reference to the Stripe price/plan
- `currentPeriodStart`: Timestamp when the current billing period started
- `currentPeriodEnd`: Timestamp when the current billing period ends
- `cancelAtPeriodEnd`: Boolean indicating if subscription will cancel at period end
- `createdAt`: Timestamp when subscription was created
- `updatedAt`: Timestamp when subscription was last updated

### Analytics Events
Key events are tracked in the analytics collection:
```
analytics/subscriptions/events/{eventId}
```

Each event document contains:
- `type`: Event type (subscription_created, subscription_canceled, etc.)
- `userId`: User who performed the action
- `subscriptionId`: Related subscription ID
- `timestamp`: When the event occurred
- `metadata`: Additional event-specific data

### Stripe Integration
Stripe webhooks are configured to trigger Firebase functions that:
1. Update subscription status in Firestore
2. Record analytics events
3. Update user subscription metadata
4. Trigger appropriate notifications

## Usage
These metrics power:
- Internal dashboards for business performance monitoring
- Marketing campaign performance reviews
- A/B test evaluations for subscription features
- Product strategy refinement
- User engagement optimization

## Accessing Analytics Data
Analytics data can be accessed through:
1. The admin dashboard at `/admin/analytics/subscriptions`
2. Firebase Analytics console
3. Exported reports (CSV/JSON) via the admin interface
4. Direct Firestore queries (admin only)

## Future Enhancements
- Predictive churn modeling
- Personalized retention campaigns
- Subscription health scoring
- Cohort analysis tools
- Revenue forecasting

---

*Version: v1.0*  
*Last Updated: 2025-05-03*