# Referral Program & Leaderboard Analytics Plan

## Overview

This document outlines the analytics strategy for the referral program and leaderboard system in AI Sports Edge. The analytics plan is designed to measure the effectiveness of the referral program, track user engagement with the leaderboard, and provide insights for optimization.

## Key Performance Indicators (KPIs)

### 1. Referral Program Performance

| Metric | Description | Target | Measurement Frequency |
|--------|-------------|--------|----------------------|
| Referral Code Generation Rate | % of eligible users who generate a referral code | >50% | Weekly |
| Referral Link Click-Through Rate | % of shared links that are clicked | >30% | Daily |
| Referral Conversion Rate | % of referral link clicks that result in sign-ups | >20% | Daily |
| Subscription Conversion Rate | % of referred sign-ups that convert to paid subscriptions | >15% | Weekly |
| Average Referrals Per User | Average number of successful referrals per referring user | >2 | Monthly |
| Referral Program ROI | Revenue from referred users vs. cost of referral rewards | >3:1 | Monthly |

### 2. Leaderboard Engagement

| Metric | Description | Target | Measurement Frequency |
|--------|-------------|--------|----------------------|
| Leaderboard View Rate | % of users who view the leaderboard | >40% | Weekly |
| Leaderboard Return Rate | % of users who return to the leaderboard multiple times | >25% | Weekly |
| Average Leaderboard Session Time | Average time spent on leaderboard screens | >45 sec | Weekly |
| Competitive User Percentage | % of users actively trying to climb the leaderboard | >15% | Monthly |
| Privacy Settings Usage | % of users who customize their leaderboard privacy settings | >10% | Monthly |

### 3. Milestone Achievement

| Metric | Description | Target | Measurement Frequency |
|--------|-------------|--------|----------------------|
| Milestone Reach Rate | % of referring users who reach at least one milestone | >30% | Monthly |
| Milestone Distribution | Distribution of users across different milestone levels | - | Monthly |
| Time to First Milestone | Average time for users to reach their first milestone | <30 days | Monthly |
| Milestone Reward Claim Rate | % of earned milestone rewards that are claimed | >90% | Weekly |
| Post-Milestone Engagement | User activity in the 7 days following a milestone achievement | Increase | Monthly |

### 4. Business Impact

| Metric | Description | Target | Measurement Frequency |
|--------|-------------|--------|----------------------|
| Customer Acquisition Cost (CAC) | Cost to acquire a new customer through referrals vs. other channels | 50% lower | Quarterly |
| Lifetime Value (LTV) of Referred Users | Average LTV of users acquired through referrals vs. other channels | 20% higher | Quarterly |
| Referral Revenue Contribution | % of total revenue attributed to referred users | >15% | Monthly |
| Retention Rate of Referred Users | Retention rate of referred users vs. non-referred users | 15% higher | Quarterly |
| Referral Program Participation Growth | Month-over-month growth in referral program participation | >5% | Monthly |

## Data Collection Strategy

### 1. Event Tracking

Track the following events in Firebase Analytics:

#### Referral Program Events

| Event Name | Parameters | Description |
|------------|------------|-------------|
| `referral_code_generated` | `user_id`, `referral_code`, `user_subscription_tier` | User generates a referral code |
| `referral_link_shared` | `user_id`, `referral_code`, `share_method` (e.g., SMS, email, social) | User shares their referral link |
| `referral_link_clicked` | `referral_code`, `source`, `utm_parameters` | Someone clicks a referral link |
| `referral_signup_completed` | `referrer_id`, `referred_id`, `referral_code` | New user signs up using a referral code |
| `referral_subscription_purchased` | `referrer_id`, `referred_id`, `subscription_plan`, `subscription_value` | Referred user purchases a subscription |
| `referral_reward_earned` | `user_id`, `reward_type`, `reward_value` | User earns a referral reward |
| `referral_reward_claimed` | `user_id`, `reward_type`, `reward_value` | User claims a referral reward |

#### Milestone Events

| Event Name | Parameters | Description |
|------------|------------|-------------|
| `milestone_reached` | `user_id`, `milestone_level`, `referral_count` | User reaches a referral milestone |
| `milestone_reward_earned` | `user_id`, `milestone_level`, `reward_type`, `reward_value` | User earns a milestone reward |
| `milestone_reward_claimed` | `user_id`, `milestone_level`, `reward_type`, `reward_value` | User claims a milestone reward |
| `badge_earned` | `user_id`, `badge_type` | User earns a new referral badge |

#### Leaderboard Events

| Event Name | Parameters | Description |
|------------|------------|-------------|
| `leaderboard_viewed` | `user_id`, `leaderboard_type` (weekly, monthly, all-time) | User views the leaderboard |
| `leaderboard_tab_changed` | `user_id`, `from_tab`, `to_tab` | User switches between leaderboard tabs |
| `leaderboard_privacy_changed` | `user_id`, `old_setting`, `new_setting` | User changes their leaderboard privacy settings |
| `leaderboard_rank_improved` | `user_id`, `old_rank`, `new_rank`, `leaderboard_type` | User's rank improves on the leaderboard |

### 2. User Properties

Track the following user properties in Firebase Analytics:

| Property Name | Description | Example Values |
|---------------|-------------|---------------|
| `referral_code` | User's referral code | "SPORT-ABCD-1234" |
| `referred_by` | ID of user who referred this user | "user_123" |
| `referral_count` | Number of successful referrals | 5 |
| `highest_milestone_reached` | Highest referral milestone reached | "elite" |
| `current_badge_type` | Current referral badge type | "hall-of-fame" |
| `leaderboard_privacy_setting` | User's leaderboard privacy preference | "public", "anonymous", "private" |
| `best_leaderboard_rank` | User's best rank achieved on any leaderboard | 3 |

### 3. Custom Dimensions

Create the following custom dimensions in Firebase Analytics:

| Dimension Name | Description | Scope |
|----------------|-------------|-------|
| `referral_status` | Whether user was referred or is a referrer | User |
| `referral_tier` | User's referral tier based on count | User |
| `milestone_status` | User's progress through milestones | User |
| `leaderboard_participation` | User's level of engagement with leaderboards | User |

## Analytics Implementation

### 1. Firebase Analytics Integration

```typescript
// Example implementation of analytics tracking

import analytics from '@react-native-firebase/analytics';

// Track referral code generation
export const trackReferralCodeGeneration = async (userId: string, referralCode: string, subscriptionTier: string) => {
  await analytics().logEvent('referral_code_generated', {
    user_id: userId,
    referral_code: referralCode,
    user_subscription_tier: subscriptionTier
  });
};

// Track referral link sharing
export const trackReferralLinkShared = async (userId: string, referralCode: string, shareMethod: string) => {
  await analytics().logEvent('referral_link_shared', {
    user_id: userId,
    referral_code: referralCode,
    share_method: shareMethod
  });
};

// Track milestone achievement
export const trackMilestoneReached = async (userId: string, milestoneLevel: number, referralCount: number) => {
  await analytics().logEvent('milestone_reached', {
    user_id: userId,
    milestone_level: milestoneLevel,
    referral_count: referralCount
  });
  
  // Update user properties
  await analytics().setUserProperty('highest_milestone_reached', milestoneLevel.toString());
};
```

### 2. Firestore Analytics Collection

```typescript
// Example implementation of Firestore analytics collection

import firestore from '@react-native-firebase/firestore';

// Record analytics event in Firestore
export const recordAnalyticsEvent = async (eventType: string, eventData: any) => {
  await firestore()
    .collection('analytics')
    .doc('referrals')
    .collection('events')
    .add({
      type: eventType,
      ...eventData,
      timestamp: firestore.FieldValue.serverTimestamp()
    });
};

// Update aggregated analytics
export const updateAggregatedAnalytics = async (metricName: string, value: number) => {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  
  await firestore()
    .collection('analytics')
    .doc('referrals')
    .collection('daily')
    .doc(today)
    .set({
      [metricName]: firestore.FieldValue.increment(value),
      updatedAt: firestore.FieldValue.serverTimestamp()
    }, { merge: true });
};
```

## Reporting and Dashboards

### 1. Executive Dashboard

**Audience**: Leadership team
**Frequency**: Weekly
**Key Metrics**:
- Referral program conversion funnel
- Revenue attribution to referrals
- CAC comparison (referral vs. other channels)
- Month-over-month growth trends

**Sample Visualization**:
```
[Referral Program Performance Dashboard]
┌────────────────────────┐ ┌────────────────────────┐
│                        │ │                        │
│  Referral Funnel       │ │  Revenue Attribution   │
│  ---------------       │ │  ------------------    │
│                        │ │                        │
│  Links Shared: 1,245   │ │  Referral: 22%         │
│  Clicks: 423 (34%)     │ │  Organic: 35%          │
│  Sign-ups: 98 (23%)    │ │  Paid Ads: 28%         │
│  Subscriptions: 21     │ │  Other: 15%            │
│                        │ │                        │
└────────────────────────┘ └────────────────────────┘
┌────────────────────────┐ ┌────────────────────────┐
│                        │ │                        │
│  CAC Comparison        │ │  Growth Trends         │
│  --------------        │ │  ------------          │
│                        │ │                        │
│  Referral: $12.50      │ │  Referrals: +8.3%      │
│  Organic: $22.75       │ │  Revenue: +12.1%       │
│  Paid: $35.20          │ │  Retention: +5.2%      │
│                        │ │                        │
└────────────────────────┘ └────────────────────────┘
```

### 2. Marketing Dashboard

**Audience**: Marketing team
**Frequency**: Daily
**Key Metrics**:
- Referral link sharing by channel
- Conversion rates by channel
- Referral code generation rate
- User acquisition source comparison

**Sample Visualization**:
```
[Referral Marketing Dashboard]
┌────────────────────────────────────────────────────┐
│                                                    │
│  Referral Link Sharing by Channel                  │
│  -------------------------------                   │
│                                                    │
│  ███████████ SMS (45%)                             │
│  ████████ Email (32%)                              │
│  ████ WhatsApp (15%)                               │
│  ██ Twitter (8%)                                   │
│                                                    │
└────────────────────────────────────────────────────┘
┌────────────────────────┐ ┌────────────────────────┐
│                        │ │                        │
│  Conversion by Channel │ │  Acquisition Sources   │
│  ---------------------  │ │  ------------------   │
│                        │ │                        │
│  SMS: 24.5%            │ │  Referral: 28%         │
│  Email: 18.2%          │ │  Organic Search: 32%   │
│  WhatsApp: 27.8%       │ │  Social Media: 22%     │
│  Twitter: 12.3%        │ │  Direct: 18%           │
│                        │ │                        │
└────────────────────────┘ └────────────────────────┘
```

### 3. Product Dashboard

**Audience**: Product team
**Frequency**: Weekly
**Key Metrics**:
- Leaderboard engagement metrics
- Milestone achievement distribution
- Feature usage heatmap
- User feedback analysis

**Sample Visualization**:
```
[Referral Product Dashboard]
┌────────────────────────────────────────────────────┐
│                                                    │
│  Leaderboard Engagement                            │
│  ---------------------                             │
│                                                    │
│  Views: 3,245 (+12% WoW)                           │
│  Avg. Session Time: 52s (+5s WoW)                  │
│  Return Rate: 28% (+2% WoW)                        │
│  Privacy Settings Changed: 8% (-1% WoW)            │
│                                                    │
└────────────────────────────────────────────────────┘
┌────────────────────────────────────────────────────┐
│                                                    │
│  Milestone Achievement Distribution                │
│  ---------------------------------                 │
│                                                    │
│  ██████████████████████ 0 Milestones (65%)         │
│  ██████ 1 Milestone (18%)                          │
│  ███ 2 Milestones (9%)                             │
│  ██ 3 Milestones (5%)                              │
│  █ 4 Milestones (3%)                               │
│                                                    │
└────────────────────────────────────────────────────┘
```

### 4. Real-time Monitoring Dashboard

**Audience**: Engineering team
**Frequency**: Real-time
**Key Metrics**:
- Referral system errors
- API performance
- Database query times
- User-reported issues

**Sample Visualization**:
```
[Referral System Monitoring]
┌────────────────────────────────────────────────────┐
│                                                    │
│  System Health                                     │
│  -------------                                     │
│                                                    │
│  Referral Code Generation: 125ms avg (Good)        │
│  Leaderboard Queries: 210ms avg (Good)             │
│  Reward Distribution: 350ms avg (Warning)          │
│  Error Rate: 0.2% (Good)                           │
│                                                    │
└────────────────────────────────────────────────────┘
┌────────────────────────────────────────────────────┐
│                                                    │
│  Recent Errors                                     │
│  -------------                                     │
│                                                    │
│  12:05:23 - Reward distribution timeout (user_456) │
│  11:32:15 - Leaderboard update conflict            │
│  10:15:02 - Referral code validation error         │
│                                                    │
└────────────────────────────────────────────────────┘
```

## A/B Testing Plan

### Test 1: Referral Reward Optimization

**Hypothesis**: Offering subscription extensions will drive more referrals than cash rewards
**Variants**:
- A: One month free subscription extension per referral
- B: $5 cash reward per referral
**Metrics**:
- Referral conversion rate
- Cost per acquisition
- Referrer satisfaction
- Long-term retention

### Test 2: Milestone Visibility

**Hypothesis**: Showing progress to the next milestone will increase referral activity
**Variants**:
- A: Basic referral UI without milestone progress
- B: Referral UI with visual milestone progress indicator
**Metrics**:
- Referral link sharing rate
- Time to first referral
- Referral frequency
- Milestone achievement rate

### Test 3: Leaderboard Design

**Hypothesis**: Gamified leaderboard design will increase engagement compared to simple list
**Variants**:
- A: Simple ranked list design
- B: Fully gamified design with badges, animations, and rewards
**Metrics**:
- Leaderboard view rate
- Time spent on leaderboard
- Return frequency
- Referral activity post-leaderboard view

## Data Privacy and Compliance

### 1. User Privacy Considerations

- All analytics data should be anonymized where possible
- Personally identifiable information (PII) should be handled according to the privacy policy
- Users should have the option to opt out of analytics tracking
- Leaderboard privacy settings should be respected in analytics reporting

### 2. Regulatory Compliance

- Ensure compliance with GDPR, CCPA, and other relevant regulations
- Implement data retention policies in line with regulatory requirements
- Provide mechanisms for users to request their data or deletion
- Document all data collection and processing activities

### 3. Data Security

- Encrypt all analytics data in transit and at rest
- Implement access controls for analytics dashboards
- Regularly audit access to analytics data
- Follow the principle of least privilege for analytics access

## Analytics Implementation Timeline

### Phase 1: Core Analytics Setup (Week 1)
- Implement basic event tracking
- Set up Firebase Analytics integration
- Create initial dashboards

### Phase 2: Enhanced Tracking (Week 2)
- Implement user properties and custom dimensions
- Set up Firestore analytics collection
- Create detailed reporting dashboards

### Phase 3: A/B Testing (Week 3)
- Implement A/B testing framework
- Launch initial tests
- Set up test results monitoring

### Phase 4: Optimization (Week 4)
- Analyze initial data
- Refine tracking and reporting
- Implement automated alerts

## Conclusion

This analytics plan provides a comprehensive framework for measuring the performance and impact of the referral program and leaderboard system. By implementing this plan, we can gain valuable insights into user behavior, optimize the referral program for maximum effectiveness, and demonstrate the business value of the system.

The plan should be reviewed and updated regularly based on new insights and changing business priorities. As the referral program matures, additional metrics and analyses may be added to provide deeper insights into user behavior and program performance.