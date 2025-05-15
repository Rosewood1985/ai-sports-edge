# Referral Program & Leaderboard Database Schema

## Overview

This document outlines the Firebase Firestore database schema for the referral program and leaderboard system. The schema is designed to efficiently store and retrieve data related to referrals, rewards, and leaderboard rankings.

## Collections Structure

### 1. Users Collection

The `users` collection stores user information, including referral-related data.

```
users/
  {userId}/
    email: string
    displayName: string
    stripeCustomerId: string
    referralCode: string
    referredBy: string (userId of referrer)
    referralCount: number
    loyaltyPoints: number
    eliteStatus: boolean
    eliteStatusGrantedAt: timestamp
    leaderboardPrivacy: 'public' | 'private' | 'anonymous'
    badgeType: 'rookie' | 'elite' | 'hall-of-fame'
    createdAt: timestamp
    updatedAt: timestamp
    
    subscriptions/ (subcollection)
      {subscriptionId}/
        status: 'active' | 'canceled' | 'paused'
        planId: string
        currentPeriodStart: timestamp
        currentPeriodEnd: timestamp
        cancelAtPeriodEnd: boolean
        milestoneRewardApplied: boolean
        createdAt: timestamp
        updatedAt: timestamp
    
    rewards/ (subcollection)
      {rewardId}/
        type: 'milestone_reward' | 'referral_reward'
        milestone: number (for milestone rewards)
        reward: {
          type: string ('subscription_extension' | 'premium_trial' | 'cash_or_upgrade' | 'elite_status')
          duration: number (days, for subscription extensions)
          amount: number (for cash rewards)
          description: string
        }
        status: 'pending' | 'processed' | 'claimed'
        createdAt: timestamp
        processedAt: timestamp
    
    notifications/ (subcollection)
      {notificationId}/
        type: 'milestone_reward' | 'referral_reward' | 'new_referral'
        title: string
        message: string
        read: boolean
        createdAt: timestamp
        readAt: timestamp
```

### 2. Referral Codes Collection

The `referralCodes` collection provides a quick lookup for referral codes.

```
referralCodes/
  {code}/
    userId: string
    usageCount: number
    createdAt: timestamp
    updatedAt: timestamp
```

### 3. Referrals Collection

The `referrals` collection tracks individual referrals.

```
referrals/
  {referralId}/
    referrerId: string (userId of referrer)
    referredUserId: string (userId of referred user)
    referralCode: string
    status: 'pending' | 'completed'
    subscriptionId: string (if completed)
    rewardProcessed: boolean
    createdAt: timestamp
    completedAt: timestamp
```

### 4. Leaderboards Collection

The `leaderboards` collection stores leaderboard data for different time periods.

```
leaderboards/
  weekly/
    startDate: timestamp
    endDate: timestamp
    updatedAt: timestamp
    
    entries/ (subcollection)
      {userId}/
        userId: string
        displayName: string
        referralCount: number
        rank: number
        badgeType: 'rookie' | 'elite' | 'hall-of-fame'
        updatedAt: timestamp
  
  monthly/
    startDate: timestamp
    endDate: timestamp
    updatedAt: timestamp
    
    entries/ (subcollection)
      {userId}/
        userId: string
        displayName: string
        referralCount: number
        rank: number
        badgeType: 'rookie' | 'elite' | 'hall-of-fame'
        updatedAt: timestamp
  
  allTime/
    updatedAt: timestamp
    
    entries/ (subcollection)
      {userId}/
        userId: string
        displayName: string
        referralCount: number
        rank: number
        badgeType: 'rookie' | 'elite' | 'hall-of-fame'
        updatedAt: timestamp
```

### 5. Analytics Collection

The `analytics` collection tracks events related to the referral program.

```
analytics/
  referrals/
    events/ (subcollection)
      {eventId}/
        type: 'referral_applied' | 'referral_reward_processed' | 'milestone_reached'
        userId: string
        referrerId: string (for referral events)
        referredUserId: string (for referral events)
        referralCode: string (for referral events)
        milestone: number (for milestone events)
        reward: object (for reward events)
        timestamp: timestamp
```

## Indexes

To optimize query performance, the following indexes should be created:

### Single-Field Indexes

1. `users.referralCount` (descending) - For sorting users by referral count
2. `referrals.referrerId` - For finding referrals by referrer
3. `referrals.referredUserId` - For finding referrals by referred user
4. `referrals.status` - For filtering referrals by status
5. `leaderboards.*.entries.rank` (ascending) - For sorting leaderboard entries by rank

### Composite Indexes

1. `referrals.referrerId, referrals.status` - For finding pending referrals by referrer
2. `referrals.referredUserId, referrals.status` - For finding pending referrals by referred user
3. `users.referralCount, users.leaderboardPrivacy` - For filtering leaderboard entries by privacy setting

## Security Rules

The following security rules should be implemented to protect the data:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read and update their own data
    match /users/{userId} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow update: if request.auth != null && request.auth.uid == userId;
      
      // Subcollections
      match /subscriptions/{subscriptionId} {
        allow read: if request.auth != null && request.auth.uid == userId;
      }
      
      match /rewards/{rewardId} {
        allow read: if request.auth != null && request.auth.uid == userId;
      }
      
      match /notifications/{notificationId} {
        allow read: if request.auth != null && request.auth.uid == userId;
        allow update: if request.auth != null && request.auth.uid == userId;
      }
    }
    
    // Referral codes can be read by anyone, but only created by the system
    match /referralCodes/{code} {
      allow read: if request.auth != null;
    }
    
    // Referrals can be read by the referrer or referred user
    match /referrals/{referralId} {
      allow read: if request.auth != null && (
        request.auth.uid == resource.data.referrerId || 
        request.auth.uid == resource.data.referredUserId
      );
    }
    
    // Leaderboards can be read by anyone
    match /leaderboards/{period} {
      allow read: if request.auth != null;
      
      match /entries/{userId} {
        allow read: if request.auth != null;
      }
    }
    
    // Analytics are admin-only
    match /analytics/{document=**} {
      allow read, write: if false;
    }
  }
}
```

## Data Migration

To implement this schema, the following data migration steps are required:

1. **Add referral fields to existing users**:
   - Add `referralCode`, `referredBy`, `referralCount`, `leaderboardPrivacy`, and `badgeType` fields to existing user documents.

2. **Create referral codes for existing subscribers**:
   - Generate unique referral codes for all users with active subscriptions.
   - Create corresponding documents in the `referralCodes` collection.

3. **Initialize leaderboards**:
   - Create initial leaderboard documents for weekly, monthly, and all-time periods.
   - Populate with any existing referral data.

## Scaling Considerations

As the referral program grows, consider the following scaling strategies:

1. **Sharding leaderboards**:
   - For very large user bases, consider sharding leaderboards by region or other criteria.

2. **Caching frequently accessed data**:
   - Use Firebase caching or a separate caching layer for frequently accessed leaderboard data.

3. **Batch updates**:
   - Use batch operations for leaderboard updates to minimize database operations.

4. **Scheduled aggregations**:
   - Run leaderboard updates on a schedule rather than in real-time to reduce database load.

## Data Retention

Consider the following data retention policies:

1. **Referral history**: Keep indefinitely for user history and analytics.
2. **Weekly leaderboards**: Retain for 3 months.
3. **Monthly leaderboards**: Retain for 1 year.
4. **All-time leaderboards**: Retain indefinitely.
5. **Analytics events**: Aggregate after 6 months, retain raw data for 2 years.

## Backup Strategy

Implement the following backup strategy:

1. **Daily backups**: Configure daily Firestore backups.
2. **Export critical collections**: Regularly export users, referrals, and leaderboards collections.
3. **Backup before migrations**: Create full backups before any schema migrations.

## Monitoring

Set up monitoring for:

1. **Query performance**: Monitor query times for leaderboard and referral lookups.
2. **Write operations**: Track write operations during leaderboard updates.
3. **Storage usage**: Monitor growth of collections, especially analytics and referrals.
4. **Error rates**: Track errors in referral processing and reward distribution.