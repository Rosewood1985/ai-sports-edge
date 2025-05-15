# Referral Program & Leaderboard Implementation Details

## Component Structure

### 1. ReferralMilestoneProgress Component

This component will display the user's progress toward referral milestones and the rewards they'll earn.

```typescript
// components/ReferralMilestoneProgress.tsx
import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import NeonText from './ui/NeonText';
import { useThemeColor } from '../hooks/useThemeColor';

interface ReferralMilestone {
  count: number;
  reward: string;
  description: string;
  icon: string;
  isUnlocked: boolean;
}

interface ReferralMilestoneProgressProps {
  currentReferrals: number;
  onInfoPress?: () => void;
}

const ReferralMilestoneProgress: React.FC<ReferralMilestoneProgressProps> = ({
  currentReferrals,
  onInfoPress
}) => {
  const primaryColor = useThemeColor({}, 'tint');
  const textColor = useThemeColor({}, 'text');
  
  // Define milestones
  const milestones: ReferralMilestone[] = [
    {
      count: 3,
      reward: '1 Month Free',
      description: 'Get 1 month free subscription',
      icon: 'calendar',
      isUnlocked: currentReferrals >= 3
    },
    {
      count: 5,
      reward: 'Premium Trial',
      description: 'Premium upgrade for 2 months',
      icon: 'star',
      isUnlocked: currentReferrals >= 5
    },
    {
      count: 10,
      reward: 'Cash Reward',
      description: '$25 or free Pro subscription',
      icon: 'cash',
      isUnlocked: currentReferrals >= 10
    },
    {
      count: 20,
      reward: 'Elite Status',
      description: 'Elite status + special badge',
      icon: 'trophy',
      isUnlocked: currentReferrals >= 20
    }
  ];
  
  // Find next milestone
  const nextMilestone = milestones.find(m => !m.isUnlocked);
  
  // Calculate progress to next milestone
  const calculateProgress = () => {
    if (!nextMilestone) return 100;
    
    const prevMilestoneCount = milestones[milestones.findIndex(m => m === nextMilestone) - 1]?.count || 0;
    const progress = ((currentReferrals - prevMilestoneCount) / (nextMilestone.count - prevMilestoneCount)) * 100;
    return Math.min(Math.max(progress, 0), 100);
  };
  
  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <NeonText type="subheading" glow={true} style={styles.title}>
          Referral Milestones
        </NeonText>
        
        {onInfoPress && (
          <TouchableOpacity onPress={onInfoPress}>
            <Ionicons name="information-circle-outline" size={20} color={primaryColor} />
          </TouchableOpacity>
        )}
      </View>
      
      {/* Progress to next milestone */}
      {nextMilestone && (
        <View style={styles.nextMilestoneContainer}>
          <Text style={[styles.nextMilestoneText, { color: textColor }]}>
            {currentReferrals}/{nextMilestone.count} referrals to unlock {nextMilestone.reward}
          </Text>
          
          <View style={styles.progressBarContainer}>
            <View 
              style={[
                styles.progressBar, 
                { width: `${calculateProgress()}%`, backgroundColor: primaryColor }
              ]} 
            />
          </View>
        </View>
      )}
      
      {/* Milestone list */}
      <View style={styles.milestonesList}>
        {milestones.map((milestone, index) => (
          <View key={index} style={styles.milestoneItem}>
            <View style={[
              styles.milestoneIconContainer,
              milestone.isUnlocked ? { backgroundColor: primaryColor } : { backgroundColor: '#444' }
            ]}>
              <Ionicons 
                name={milestone.icon as any} 
                size={16} 
                color={milestone.isUnlocked ? '#fff' : '#888'} 
              />
            </View>
            
            <View style={styles.milestoneContent}>
              <Text style={[
                styles.milestoneCount, 
                { color: milestone.isUnlocked ? primaryColor : textColor }
              ]}>
                {milestone.count} Referrals
              </Text>
              
              <Text style={[
                styles.milestoneReward, 
                { color: textColor, opacity: milestone.isUnlocked ? 1 : 0.6 }
              ]}>
                {milestone.description}
              </Text>
            </View>
            
            {milestone.isUnlocked && (
              <Ionicons name="checkmark-circle" size={20} color={primaryColor} />
            )}
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 12,
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderWidth: 1,
    borderColor: '#444',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
  },
  nextMilestoneContainer: {
    marginBottom: 20,
  },
  nextMilestoneText: {
    fontSize: 14,
    marginBottom: 8,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#444',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  milestonesList: {
    marginTop: 8,
  },
  milestoneItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  milestoneIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  milestoneContent: {
    flex: 1,
  },
  milestoneCount: {
    fontSize: 14,
    fontWeight: '600',
  },
  milestoneReward: {
    fontSize: 12,
  },
});

export default ReferralMilestoneProgress;
```

### 2. ReferralBadge Component

This component will display badges earned through the referral program.

```typescript
// components/ReferralBadge.tsx
import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemeColor } from '../hooks/useThemeColor';

export type BadgeType = 'rookie' | 'elite' | 'hall-of-fame';

interface ReferralBadgeProps {
  type: BadgeType;
  size?: 'small' | 'medium' | 'large';
  onPress?: () => void;
  showLabel?: boolean;
}

const ReferralBadge: React.FC<ReferralBadgeProps> = ({
  type,
  size = 'medium',
  onPress,
  showLabel = false
}) => {
  const primaryColor = useThemeColor({}, 'tint');
  const textColor = useThemeColor({}, 'text');
  
  const getBadgeConfig = () => {
    switch (type) {
      case 'rookie':
        return {
          icon: 'star-outline',
          colors: ['#3498db', '#2980b9'],
          label: 'Rookie Referrer'
        };
      case 'elite':
        return {
          icon: 'star-half',
          colors: ['#f39c12', '#d35400'],
          label: 'Elite Referrer'
        };
      case 'hall-of-fame':
        return {
          icon: 'star',
          colors: ['#f1c40f', '#e67e22'],
          label: 'Hall of Fame'
        };
      default:
        return {
          icon: 'star-outline',
          colors: ['#3498db', '#2980b9'],
          label: 'Rookie Referrer'
        };
    }
  };
  
  const getSizeConfig = () => {
    switch (size) {
      case 'small':
        return {
          containerSize: 40,
          iconSize: 20,
          fontSize: 10
        };
      case 'large':
        return {
          containerSize: 80,
          iconSize: 40,
          fontSize: 14
        };
      default:
        return {
          containerSize: 60,
          iconSize: 30,
          fontSize: 12
        };
    }
  };
  
  const badgeConfig = getBadgeConfig();
  const sizeConfig = getSizeConfig();
  
  const BadgeContent = () => (
    <LinearGradient
      colors={badgeConfig.colors}
      style={[
        styles.badgeContainer,
        { width: sizeConfig.containerSize, height: sizeConfig.containerSize }
      ]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <Ionicons name={badgeConfig.icon as any} size={sizeConfig.iconSize} color="#fff" />
    </LinearGradient>
  );
  
  return (
    <View style={styles.container}>
      {onPress ? (
        <TouchableOpacity onPress={onPress}>
          <BadgeContent />
        </TouchableOpacity>
      ) : (
        <BadgeContent />
      )}
      
      {showLabel && (
        <Text style={[
          styles.label, 
          { color: textColor, fontSize: sizeConfig.fontSize }
        ]}>
          {badgeConfig.label}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  badgeContainer: {
    borderRadius: 100,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  label: {
    marginTop: 8,
    textAlign: 'center',
  },
});

export default ReferralBadge;
```

### 3. Update ReferralLeaderboardScreen

Update the existing ReferralLeaderboardScreen to include the new milestone progress and badges.

```typescript
// screens/ReferralLeaderboardScreen.tsx
// Add the following imports
import ReferralMilestoneProgress from '../components/ReferralMilestoneProgress';
import ReferralBadge, { BadgeType } from '../components/ReferralBadge';

// Add to the component state
const [userBadge, setUserBadge] = useState<BadgeType>('rookie');

// Add to the useEffect that loads user data
useEffect(() => {
  // ... existing code
  
  // Determine user badge based on referral count
  if (userRewards?.referralCount >= 20) {
    setUserBadge('hall-of-fame');
  } else if (userRewards?.referralCount >= 10) {
    setUserBadge('elite');
  } else {
    setUserBadge('rookie');
  }
}, []);

// Add this component to the render function, after the referral code section
{isSubscribed && (
  <>
    <ReferralMilestoneProgress
      currentReferrals={userRewards?.referralCount || 0}
      onInfoPress={() => {
        // Show info modal about milestones
      }}
    />
    
    <View style={styles.badgeSection}>
      <NeonText type="subheading" glow={true} style={styles.sectionTitle}>
        Your Referral Badge
      </NeonText>
      
      <View style={styles.badgeContainer}>
        <ReferralBadge
          type={userBadge}
          size="large"
          showLabel={true}
        />
      </View>
    </View>
  </>
)}

// Add these styles
badgeSection: {
  marginBottom: 24,
},
badgeContainer: {
  alignItems: 'center',
  marginTop: 16,
},
```

## Firebase Functions Updates

### 1. Update referralProgram.js

Update the existing referralProgram.js file to implement the new milestone rewards.

```javascript
// functions/referralProgram.js

// Add this function to process milestone rewards
exports.processMilestoneReward = functions.firestore
  .document('users/{userId}')
  .onUpdate(async (change, context) => {
    const { userId } = context.params;
    const newData = change.after.data();
    const previousData = change.before.data();
    
    // Check if referral count has changed
    if (newData.referralCount === previousData.referralCount) {
      return null; // No change in referral count
    }
    
    try {
      const db = admin.firestore();
      
      // Define milestones and rewards
      const milestones = [
        {
          count: 3,
          reward: {
            type: 'subscription_extension',
            duration: 30, // 1 month in days
            description: '1 Month Free Subscription'
          }
        },
        {
          count: 5,
          reward: {
            type: 'premium_trial',
            duration: 60, // 2 months in days
            description: 'Premium Trial for 2 Months'
          }
        },
        {
          count: 10,
          reward: {
            type: 'cash_or_upgrade',
            amount: 25, // $25
            upgradeDuration: 30, // 1 month in days
            description: 'Cash Reward ($25) or Free Pro Subscription'
          }
        },
        {
          count: 20,
          reward: {
            type: 'elite_status',
            description: 'Elite Status + Special Badge'
          }
        }
      ];
      
      // Check if any milestone has been reached
      for (const milestone of milestones) {
        if (
          newData.referralCount >= milestone.count && 
          previousData.referralCount < milestone.count
        ) {
          // Milestone reached
          console.log(`User ${userId} reached milestone: ${milestone.count} referrals`);
          
          // Add milestone reward to user's rewards collection
          await db.collection('users').doc(userId).collection('rewards').add({
            type: 'milestone_reward',
            milestone: milestone.count,
            reward: milestone.reward,
            status: 'pending',
            createdAt: admin.firestore.FieldValue.serverTimestamp()
          });
          
          // Create a notification for the user
          await db.collection('users').doc(userId).collection('notifications').add({
            type: 'milestone_reward',
            title: 'Referral Milestone Reached!',
            message: `Congratulations! You've reached ${milestone.count} referrals and earned: ${milestone.reward.description}`,
            read: false,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
          });
          
          // Track the milestone in analytics
          await db.collection('analytics').doc('referrals').collection('events').add({
            type: 'milestone_reached',
            userId,
            milestone: milestone.count,
            reward: milestone.reward,
            timestamp: admin.firestore.FieldValue.serverTimestamp()
          });
          
          // Process the reward based on type
          switch (milestone.reward.type) {
            case 'subscription_extension':
              // Extend subscription by specified duration
              await processSubscriptionExtension(userId, milestone.reward.duration);
              break;
              
            case 'premium_trial':
              // Grant premium trial
              await processPremiumTrial(userId, milestone.reward.duration);
              break;
              
            case 'cash_or_upgrade':
              // This will be handled manually or through a user choice
              // Mark as pending for now
              break;
              
            case 'elite_status':
              // Update user's status to elite
              await db.collection('users').doc(userId).update({
                eliteStatus: true,
                eliteStatusGrantedAt: admin.firestore.FieldValue.serverTimestamp()
              });
              break;
          }
        }
      }
      
      return { success: true };
    } catch (error) {
      console.error('Error processing milestone reward:', error);
      return null;
    }
  });

// Helper function to process subscription extension
async function processSubscriptionExtension(userId, durationDays) {
  try {
    const db = admin.firestore();
    
    // Get user's active subscription
    const subscriptionsQuery = await db.collection('users').doc(userId)
      .collection('subscriptions')
      .where('status', '==', 'active')
      .limit(1)
      .get();
    
    if (subscriptionsQuery.empty) {
      console.log(`No active subscription found for user ${userId}`);
      return false;
    }
    
    const subscriptionDoc = subscriptionsQuery.docs[0];
    const subscriptionId = subscriptionDoc.id;
    const subscriptionData = subscriptionDoc.data();
    
    // Calculate new end date
    const currentPeriodEnd = subscriptionData.currentPeriodEnd.toDate();
    const newPeriodEnd = new Date(currentPeriodEnd);
    newPeriodEnd.setDate(newPeriodEnd.getDate() + durationDays);
    
    // Update subscription in Stripe
    await stripe.subscriptions.update(subscriptionId, {
      proration_behavior: 'none',
      trial_end: Math.floor(newPeriodEnd.getTime() / 1000)
    });
    
    // Update subscription in Firestore
    await subscriptionDoc.ref.update({
      currentPeriodEnd: admin.firestore.Timestamp.fromDate(newPeriodEnd),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      milestoneRewardApplied: true
    });
    
    console.log(`Extended subscription ${subscriptionId} for user ${userId} by ${durationDays} days`);
    return true;
  } catch (error) {
    console.error('Error processing subscription extension:', error);
    return false;
  }
}

// Helper function to process premium trial
async function processPremiumTrial(userId, durationDays) {
  try {
    const db = admin.firestore();
    
    // Check if user already has premium
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();
    
    if (userData.premiumTier) {
      // User already has premium, extend their subscription instead
      return processSubscriptionExtension(userId, durationDays);
    }
    
    // Grant premium trial
    await db.collection('users').doc(userId).update({
      premiumTrial: true,
      premiumTrialStartedAt: admin.firestore.FieldValue.serverTimestamp(),
      premiumTrialEndsAt: admin.firestore.Timestamp.fromDate(
        new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000)
      )
    });
    
    console.log(`Granted premium trial to user ${userId} for ${durationDays} days`);
    return true;
  } catch (error) {
    console.error('Error processing premium trial:', error);
    return false;
  }
}
```

### 2. Create leaderboardUpdates.js

Create a new Firebase function to update the leaderboard periodically.

```javascript
// functions/leaderboardUpdates.js
const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

/**
 * Update the referral leaderboard
 * This function runs on a schedule (daily at midnight)
 */
exports.updateReferralLeaderboard = functions.pubsub
  .schedule('0 0 * * *') // Run daily at midnight
  .timeZone('America/New_York')
  .onRun(async (context) => {
    try {
      const db = admin.firestore();
      
      // Get all users with referral counts
      const usersSnapshot = await db.collection('users')
        .where('referralCount', '>', 0)
        .get();
      
      if (usersSnapshot.empty) {
        console.log('No users with referrals found');
        return null;
      }
      
      // Extract user data
      const users = [];
      usersSnapshot.forEach(doc => {
        const userData = doc.data();
        users.push({
          userId: doc.id,
          referralCount: userData.referralCount || 0,
          displayName: userData.displayName || 'Anonymous User',
          leaderboardPrivacy: userData.leaderboardPrivacy || 'public'
        });
      });
      
      // Sort users by referral count (descending)
      users.sort((a, b) => b.referralCount - a.referralCount);
      
      // Assign ranks
      users.forEach((user, index) => {
        user.rank = index + 1;
      });
      
      // Determine time periods
      const now = new Date();
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - now.getDay()); // Start of week (Sunday)
      weekStart.setHours(0, 0, 0, 0);
      
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1); // Start of month
      
      // Create leaderboard entries
      const batch = db.batch();
      
      // Clear existing leaderboards
      const weeklyLeaderboardRef = db.collection('leaderboards').doc('weekly');
      const monthlyLeaderboardRef = db.collection('leaderboards').doc('monthly');
      const allTimeLeaderboardRef = db.collection('leaderboards').doc('allTime');
      
      batch.set(weeklyLeaderboardRef, {
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        startDate: admin.firestore.Timestamp.fromDate(weekStart),
        endDate: admin.firestore.Timestamp.fromDate(now)
      });
      
      batch.set(monthlyLeaderboardRef, {
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        startDate: admin.firestore.Timestamp.fromDate(monthStart),
        endDate: admin.firestore.Timestamp.fromDate(now)
      });
      
      batch.set(allTimeLeaderboardRef, {
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      // Add users to leaderboards
      for (const user of users) {
        // Skip users who have opted out
        if (user.leaderboardPrivacy === 'private') {
          continue;
        }
        
        // Anonymize usernames for those who prefer it
        const displayName = user.leaderboardPrivacy === 'anonymous' 
          ? `User${user.userId.substring(0, 4)}` 
          : user.displayName;
        
        // Add to all-time leaderboard
        const allTimeEntryRef = allTimeLeaderboardRef.collection('entries').doc(user.userId);
        batch.set(allTimeEntryRef, {
          userId: user.userId,
          displayName,
          referralCount: user.referralCount,
          rank: user.rank,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        
        // Add to weekly and monthly leaderboards
        // In a real implementation, you would filter based on referrals within the time period
        // For this example, we'll use the same data for simplicity
        const weeklyEntryRef = weeklyLeaderboardRef.collection('entries').doc(user.userId);
        const monthlyEntryRef = monthlyLeaderboardRef.collection('entries').doc(user.userId);
        
        batch.set(weeklyEntryRef, {
          userId: user.userId,
          displayName,
          referralCount: user.referralCount,
          rank: user.rank,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        
        batch.set(monthlyEntryRef, {
          userId: user.userId,
          displayName,
          referralCount: user.referralCount,
          rank: user.rank,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
      }
      
      // Commit the batch
      await batch.commit();
      
      console.log(`Updated leaderboards with ${users.length} users`);
      return { success: true, usersProcessed: users.length };
    } catch (error) {
      console.error('Error updating referral leaderboard:', error);
      return null;
    }
  });

// Export the functions
module.exports = {
  updateReferralLeaderboard: exports.updateReferralLeaderboard
};
```

## Service Updates

### 1. Update rewardsService.ts

Update the rewardsService.ts file to support the new referral program features.

```typescript
// services/rewardsService.ts

// Add to the UserRewards interface in types/rewards.ts
export interface UserRewards {
  // ... existing fields
  eliteStatus?: boolean;
  eliteStatusGrantedAt?: string;
  leaderboardPrivacy?: 'public' | 'private' | 'anonymous';
  badgeType?: 'rookie' | 'elite' | 'hall-of-fame';
}

// Add to the rewardsService class
/**
 * Get user's referral milestone progress
 */
async getReferralMilestoneProgress(userId: string): Promise<{
  currentReferrals: number;
  milestones: Array<{
    count: number;
    reward: string;
    description: string;
    isUnlocked: boolean;
  }>;
  nextMilestone: number | null;
}> {
  try {
    const rewards = await this.getUserRewards(userId);
    if (!rewards) {
      return {
        currentReferrals: 0,
        milestones: [],
        nextMilestone: null
      };
    }
    
    const referralCount = rewards.referralCount || 0;
    
    // Define milestones
    const milestones = [
      {
        count: 3,
        reward: '1 Month Free',
        description: 'Get 1 month free subscription',
        isUnlocked: referralCount >= 3
      },
      {
        count: 5,
        reward: 'Premium Trial',
        description: 'Premium upgrade for 2 months',
        isUnlocked: referralCount >= 5
      },
      {
        count: 10,
        reward: 'Cash Reward',
        description: '$25 or free Pro subscription',
        isUnlocked: referralCount >= 10
      },
      {
        count: 20,
        reward: 'Elite Status',
        description: 'Elite status + special badge',
        isUnlocked: referralCount >= 20
      }
    ];
    
    // Find next milestone
    const nextMilestone = milestones.find(m => !m.isUnlocked)?.count || null;
    
    return {
      currentReferrals: referralCount,
      milestones,
      nextMilestone
    };
  } catch (error) {
    console.error('Error getting referral milestone progress:', error);
    return {
      currentReferrals: 0,
      milestones: [],
      nextMilestone: null
    };
  }
}

/**
 * Update user's leaderboard privacy setting
 */
async updateLeaderboardPrivacy(
  userId: string, 
  privacy: 'public' | 'private' | 'anonymous'
): Promise<boolean> {
  try {
    let rewards = await this.getUserRewards(userId);
    if (!rewards) {
      rewards = await this.initializeUserRewards(userId);
    }
    
    rewards.leaderboardPrivacy = privacy;
    await this.saveUserRewards(rewards);
    
    // Track event
    trackEvent('leaderboard_privacy_updated', {
      privacy
    });
    
    return true;
  } catch (error) {
    console.error('Error updating leaderboard privacy:', error);
    return false;
  }
}

/**
 * Get user's referral badge type
 */
async getUserBadgeType(userId: string): Promise<'rookie' | 'elite' | 'hall-of-fame'> {
  try {
    const rewards = await this.getUserRewards(userId);
    if (!rewards) {
      return 'rookie';
    }
    
    const referralCount = rewards.referralCount || 0;
    
    if (referralCount >= 20) {
      return 'hall-of-fame';
    } else if (referralCount >= 10) {
      return 'elite';
    } else {
      return 'rookie';
    }
  } catch (error) {
    console.error('Error getting user badge type:', error);
    return 'rookie';
  }
}

/**
 * Get leaderboard with time period filter
 */
async getLeaderboard(
  period: 'weekly' | 'monthly' | 'allTime' = 'allTime',
  limit: number = 10
): Promise<Array<{
  userId: string;
  displayName: string;
  referralCount: number;
  rank: number;
  isCurrentUser: boolean;
  badgeType: 'rookie' | 'elite' | 'hall-of-fame';
}>> {
  try {
    // In a real app, this would fetch from Firestore
    // For now, we'll simulate with mock data and any local user data
    
    const currentUserId = auth.currentUser?.uid;
    let userRewards: UserRewards | null = null;
    
    if (currentUserId) {
      userRewards = await this.getUserRewards(currentUserId);
    }
    
    // Mock leaderboard data
    const mockLeaderboard = [
      { userId: 'user1', displayName: 'BettingPro', referralCount: 24, badgeType: 'hall-of-fame' as const },
      { userId: 'user2', displayName: 'SportsFan99', referralCount: 18, badgeType: 'elite' as const },
      { userId: 'user3', displayName: 'PredictionKing', referralCount: 15, badgeType: 'elite' as const },
      { userId: 'user4', displayName: 'BetMaster', referralCount: 12, badgeType: 'elite' as const },
      { userId: 'user5', displayName: 'OddsWizard', referralCount: 10, badgeType: 'elite' as const },
      { userId: 'user6', displayName: 'StatsGuru', referralCount: 8, badgeType: 'rookie' as const },
      { userId: 'user7', displayName: 'PicksExpert', referralCount: 7, badgeType: 'rookie' as const },
      { userId: 'user8', displayName: 'BetInsider', referralCount: 6, badgeType: 'rookie' as const },
      { userId: 'user9', displayName: 'LineBreaker', referralCount: 5, badgeType: 'rookie' as const },
      { userId: 'user10', displayName: 'ParlaySage', referralCount: 4, badgeType: 'rookie' as const }
    ];
    
    // If we have user data, add it to the leaderboard
    if (currentUserId && userRewards && userRewards.referralCount > 0) {
      // Get user's display name or email
      let displayName = 'You';
      try {
        const userRecord = await auth.currentUser?.getIdTokenResult();
        if (userRecord && auth.currentUser?.displayName) {
          displayName = auth.currentUser.displayName;
        } else if (userRecord && auth.currentUser?.email) {
          displayName = auth.currentUser.email.split('@')[0];
        }
      } catch (error) {
        console.error('Error getting user details:', error);
      }
      
      // Determine badge type
      const badgeType = await this.getUserBadgeType(currentUserId);
      
      // Add current user to mock data if not already in top 10
      const userInMock = mockLeaderboard.some(entry => entry.userId === currentUserId);
      if (!userInMock) {
        mockLeaderboard.push({
          userId: currentUserId,
          displayName,
          referralCount: userRewards.referralCount,
          badgeType
        });
      }
    }
    
    // Sort by referral count (descending)
    const sortedLeaderboard = mockLeaderboard.sort((a, b) => b.referralCount - a.referralCount);
    
    // Add rank and isCurrentUser flag
    const rankedLeaderboard = sortedLeaderboard.map((entry, index) => ({
      ...entry,
      rank: index + 1,
      isCurrentUser: entry.userId === currentUserId
    }));
    
    // Return limited number of entries
    return rankedLeaderboard.slice(0, limit);
  } catch (error) {
    console.error('Error getting leaderboard:', error);
    return [];
  }
}
```

## Implementation Steps

1. First, update the Firebase functions:
   - Update referralProgram.js with the milestone rewards logic
   - Create leaderboardUpdates.js for periodic leaderboard updates

2. Next, update the frontend components:
   - Create ReferralMilestoneProgress.tsx
   - Create ReferralBadge.tsx
   - Update ReferralLeaderboardScreen.tsx

3. Update the services:
   - Update rewardsService.ts with new methods for milestone tracking
   - Update types/rewards.ts with new interfaces

4. Test the implementation:
   - Test referral code generation and application
   - Test milestone rewards
   - Test leaderboard updates
   - Test UI components

## Security Considerations

1. **Prevent Self-Referrals**: Implement device fingerprinting and IP tracking to prevent users from referring themselves.

2. **Rate Limiting**: Add rate limiting for referral code generation and application to prevent abuse.

3. **Verification**: Verify that referred users are legitimate before granting rewards.

4. **Fraud Detection**: Implement fraud detection mechanisms to identify suspicious referral patterns.

## Performance Optimization

1. **Batch Updates**: Use batch operations for leaderboard updates to minimize database operations.

2. **Caching**: Implement caching for leaderboard data to reduce database reads.

3. **Pagination**: Use pagination for leaderboard displays to improve performance.

4. **Scheduled Updates**: Run leaderboard updates on a schedule rather than in real-time to reduce database load.