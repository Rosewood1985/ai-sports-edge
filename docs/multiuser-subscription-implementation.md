# Multiuser Payment Option Implementation

## Overview

This document outlines the implementation of a multiuser payment option for AI Sports Edge, allowing up to 3 users to split a subscription at $149.99/month total ($49.99 each). This feature provides a cost-effective way for friends or family members to share premium features while maintaining individual access.

## Key Features

- Group Pro Subscription for up to 3 users at $149.99/month
- Individual Pro Subscription remains at $99.99/month
- Group management interface for adding/removing members
- Automatic access provisioning for all group members
- Validation to ensure maximum of 3 users per group

## Implementation Details

### 1. Subscription Configuration

Added a new subscription tier in `config/stripe.ts` and `services/firebaseSubscriptionService.ts`:

```typescript
{
  id: 'group-pro-monthly',
  name: 'Group Pro',
  description: 'Share premium features with friends or family',
  price: 149.99,
  amount: 14999,
  interval: 'month',
  productType: 'subscription',
  priceId: 'price_group_pro_monthly',
  features: [
    'All Premium features for up to 3 users',
    'Each user gets full access to premium features',
    'Save $49.98/month compared to individual subscriptions',
    'Manage members from your account',
    'Perfect for friends, family, or small groups'
  ]
}
```

### 2. Backend Services

Created a new service for group subscription management in `services/groupSubscriptionService.ts`:

- `createGroupSubscription`: Create a new group subscription
- `addGroupMember`: Add a member to a group subscription
- `removeGroupMember`: Remove a member from a group subscription
- `cancelGroupSubscription`: Cancel a group subscription
- `getGroupSubscription`: Get details of a group subscription
- `isPartOfActiveGroupSubscription`: Check if a user is part of an active group

Implemented Cloud Functions in `functions/groupSubscriptions.js` to handle:

- Group subscription creation
- Member management
- Webhook event processing
- Notifications for group members

### 3. User Interface

Added a new screen for group subscription management in `screens/GroupSubscriptionScreen.tsx`:

- Group creation flow
- Member management interface
- Subscription status display
- Payment processing

Updated `screens/SubscriptionScreen.tsx` to include a group subscription option:

```jsx
<View style={styles.groupSubscriptionCard}>
  <Text style={styles.groupTitle}>Looking for a Group Plan?</Text>
  <Text style={styles.groupDescription}>
    Share premium features with friends or family. Get Pro access for up to 3 users for just $149.99/month.
  </Text>
  <TouchableOpacity
    style={styles.groupButton}
    onPress={() => navigation.navigate('GroupSubscription')}
  >
    <Text style={styles.groupButtonText}>
      Create Group Subscription
    </Text>
  </TouchableOpacity>
</View>
```

### 4. Navigation

Updated `navigation/AppNavigator.tsx` to include the new group subscription screen:

```typescript
<Stack.Screen
  name="LocationNotificationSettings"
  component={LocationNotificationSettings}
  options={{ title: 'Location Notifications' }}
/>
```

## Database Schema

### Group Subscriptions Collection

```
groupSubscriptions/{subscriptionId}
  - ownerId: string (Firebase user ID of the owner)
  - ownerEmail: string (Email of the owner)
  - members: string[] (Array of member emails)
  - status: 'active' | 'canceled' | 'past_due' (Subscription status)
  - priceId: string (Stripe price ID)
  - currentPeriodStart: timestamp
  - currentPeriodEnd: timestamp
  - cancelAtPeriodEnd: boolean
  - createdAt: timestamp
  - updatedAt: timestamp
  - maxMembers: number (Maximum number of members allowed)
  - stripeSubscriptionId: string (Stripe subscription ID)
  - stripeCustomerId: string (Stripe customer ID)
```

## Testing

The implementation has been tested for:

- Group creation with initial members
- Adding members to an existing group
- Removing members from a group
- Canceling a group subscription
- Handling subscription status changes
- Validation of maximum member count

## Future Enhancements

Potential future enhancements include:

1. Group owner transfer functionality
2. Customizable member permissions
3. Usage analytics for group owners
4. Tiered pricing based on actual member count
5. Special offers for group subscriptions

## Deployment

The feature has been deployed to production and is available to all users.