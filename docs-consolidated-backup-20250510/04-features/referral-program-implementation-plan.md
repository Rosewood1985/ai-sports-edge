# Referral Program & Leaderboard Implementation Plan

## Overview

This document outlines the implementation plan for the revised referral program and gamified leaderboard system for AI Sports Edge. The referral program will incentivize users to invite friends while the leaderboard will add gamification elements to drive engagement.

## 1. Core Referral Program Features

### Referral Mechanics
- **Unique Referral Codes**: Each subscribed user receives a unique, shareable referral code
- **Reward Structure**:
  - **Referrer**: Earns one month of free subscription for each successful referral
  - **Referred User**: Receives a 10% discount on their first subscription
- **Power Referrer Bonuses**:
  - 5+ new subscribers: Premium Trial for 3 months (lower-tier plan) or cash bonus ($25)/Pro-tier upgrade for 1 month (higher-tier plan)
  - 10+ subscribers: Cash bonus ($25) or free Pro-tier upgrade for 1 month

### Tracking & Transparency
- User dashboard to track referrals and rewards
- Analytics dashboard for monitoring program effectiveness

## 2. Leaderboard System

### Features
- **Real-Time Tracking**: Display top referrers based on successful referrals
- **Tiers & Milestones**: Create ranking levels (e.g., "Rookie Referrer," "Elite Referrer," "Hall of Fame")
- **Exclusive Rewards**: Special perks for top referrers (cash bonuses, premium subscriptions, exclusive features)
- **Dynamic UI Elements**: Progress bars, animated badges, and celebratory pop-ups

### Gamification Mechanics
- **Milestone Rewards**:
  - 3 Referrals → 1 Month Free Subscription
  - 5 Referrals → Premium Upgrade for 2 Months
  - 10 Referrals → Cash Reward ($25) or Free Pro Subscription
  - 20+ Referrals → Elite Status + Special Badge
- **Leaderboard Visibility Options**:
  - Public vs. Private leaderboard (users can opt in/out)
  - Anonymous ranking option (e.g., "User123" instead of full names)
- **UI Enhancements**:
  - Top 3 users get gold, silver, bronze highlight

## 3. Technical Implementation

### Data Structure

**Firebase Collections**:
```
- users
  - userId
    - referralCode: string
    - referredBy: string (userId of referrer)
    - referralCount: number
    - referralRewards: array of rewards earned
    - referralHistory: array of successful referrals
    - leaderboardPrivacy: "public" | "private" | "anonymous"
    
- referrals
  - referralId
    - referrerId: string (userId)
    - referredId: string (userId)
    - status: "pending" | "completed"
    - dateCreated: timestamp
    - dateCompleted: timestamp
    - subscriptionPurchased: string (plan type)
    
- leaderboard
  - weekly
    - userId
    - displayName
    - referralCount
    - rank
    - badge
  - monthly
    - [same structure]
  - allTime
    - [same structure]
```

### Component Structure
- **Referral Page**: User's stats, referral code, rewards progress
- **Leaderboard Page**: Top referrers, rank progress, recent activity
- **Gamification Elements**: Progress bars, badges, confetti animations

### Backend Implementation
- Store referral data using Firestore
- Track referral conversions via webhook integration (e.g., Stripe for subscription tracking)
- Implement cron jobs for leaderboard updates (e.g., updating rankings every 24 hours)

## 4. Implementation Timeline

### Phase 1: Core Referral System (1 week)
- Set up Firebase data structure for referrals
- Implement referral code generation and validation
- Create basic referral tracking mechanism
- Develop user referral history view

### Phase 2: Reward Distribution (1 week)
- Implement reward calculation logic
- Create subscription extension mechanism
- Develop discount application for referred users
- Build notification system for earned rewards

### Phase 3: Leaderboard & Gamification (2 weeks)
- Implement leaderboard data structure
- Create leaderboard UI components
- Add tier system and badges
- Implement privacy controls
- Develop animations and celebratory elements

### Phase 4: Testing & Optimization (1 week)
- Conduct thorough testing of referral tracking
- Test reward distribution
- Optimize database queries for leaderboard
- Implement anti-abuse measures

## 5. Anti-Abuse Measures

- **Abuse Prevention**: Prevent self-referrals using device/IP tracking
- **Performance Optimization**: Optimize queries for ranking updates
- **Scalability**: Ensure Firebase can handle datasets smoothly

## 6. Success Metrics

- Number of referral links generated
- Referral link click-through rate
- Conversion rate (referred users who subscribe)
- Average number of referrals per user
- Leaderboard engagement (views, time spent)
- Revenue generated from referred users

## 7. Implementation Files

### Frontend Components
- `components/ReferralProgramCard.tsx` - Display user's referral code and stats
- `components/ReferralLeaderboard.tsx` - Display leaderboard with rankings
- `screens/ReferralLeaderboardScreen.tsx` - Full screen for leaderboard
- `components/ReferralMilestoneProgress.tsx` - Show progress to next milestone
- `components/ReferralBadge.tsx` - Display earned badges

### Backend Functions
- `functions/referralProgram.js` - Core referral tracking logic
- `functions/referralRewards.js` - Reward distribution logic
- `functions/leaderboardUpdates.js` - Leaderboard calculation and updates

### Services
- `services/referralService.ts` - Frontend service for referral functionality
- `services/leaderboardService.ts` - Frontend service for leaderboard data

### Types
- `types/referrals.ts` - TypeScript interfaces for referral data

## 8. Next Steps

1. Begin implementation of Phase 1 (Core Referral System)
2. Set up Firebase collections and security rules
3. Create initial UI components for referral code display
4. Implement referral tracking logic