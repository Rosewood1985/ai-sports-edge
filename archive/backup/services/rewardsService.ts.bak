import { firebaseService } from '../src/atomic/organisms/firebaseService';
import '@react-native-async-storage/async-storage';
import { auth } from '../config/firebase';
import {
  UserRewards,
  LoyaltyLevel,
  Achievement,
  RewardTier,
  DailyStreakReward,
  BadgeType,
  LeaderboardPrivacy,
  ReferralMilestone,
  LeaderboardEntry,
  LeaderboardData
} from '../types/rewards';
import { trackEvent } from './analyticsService';

// Define loyalty tiers
const LOYALTY_TIERS: RewardTier[] = [
  {
    level: 'Free',
    requiredBets: 0,
    benefits: {
      aiPickDiscount: 0,
      exclusiveContent: false,
      prioritySupport: false,
      freeAIPredictions: 0
    }
  },
  {
    level: 'Silver',
    requiredBets: 10,
    benefits: {
      aiPickDiscount: 5, // 5% off
      exclusiveContent: false,
      prioritySupport: false,
      freeAIPredictions: 1
    }
  },
  {
    level: 'Gold',
    requiredBets: 50,
    benefits: {
      aiPickDiscount: 10, // 10% off
      exclusiveContent: true,
      prioritySupport: false,
      freeAIPredictions: 2
    }
  },
  {
    level: 'Platinum',
    requiredBets: 75,
    benefits: {
      aiPickDiscount: 15, // 15% off
      exclusiveContent: true,
      prioritySupport: true,
      freeAIPredictions: 3
    }
  }
];

// Define streak rewards
const STREAK_REWARDS: DailyStreakReward[] = [
  {
    daysRequired: 7,
    reward: {
      freeAIPredictions: 1,
      loyaltyPoints: 50
    }
  },
  {
    daysRequired: 20,
    reward: {
      freeAIPredictions: 2,
      loyaltyPoints: 150
    }
  },
  {
    daysRequired: 30,
    reward: {
      freeAIPredictions: 3,
      loyaltyPoints: 300
    }
  }
];

// Define achievements
const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_bet',
    name: 'First Bet',
    description: 'Place your first bet',
    iconUrl: 'first_bet_icon.png',
    isUnlocked: false
  },
  {
    id: 'perfect_parlay',
    name: 'Perfect 5-Pick Streak',
    description: 'Win a 5-pick parlay',
    iconUrl: 'perfect_parlay_icon.png',
    isUnlocked: false
  },
  {
    id: 'ufc_expert',
    name: 'UFC Expert',
    description: 'Place 10 UFC bets',
    iconUrl: 'ufc_expert_icon.png',
    isUnlocked: false
  },
  {
    id: 'social_butterfly',
    name: 'Social Butterfly',
    description: 'Refer 5 friends who sign up',
    iconUrl: 'social_butterfly_icon.png',
    isUnlocked: false
  },
  {
    id: 'loyalty_master',
    name: 'Loyalty Master',
    description: 'Reach Platinum tier',
    iconUrl: 'loyalty_master_icon.png',
    isUnlocked: false
  }
];

class RewardsService {
  private USER_REWARDS_KEY = 'user_rewards';
  
  /**
   * Initialize user rewards if they don't exist
   */
  async initializeUserRewards(userId: string): Promise<UserRewards> {
    try {
      const existingRewards = await this.getUserRewards(userId);
      if (existingRewards) {
        return existingRewards;
      }
      
      const initialRewards: UserRewards = {
        userId,
        loyaltyLevel: 'Free',
        loyaltyPoints: 0,
        betCount: 0,
        currentStreak: 0,
        longestStreak: 0,
        lastLoginDate: new Date().toISOString().split('T')[0], // Today's date in YYYY-MM-DD
        achievements: ACHIEVEMENTS,
        referralCount: 0,
        freeAIPredictions: 0,
        badgeType: 'rookie',
        leaderboardPrivacy: 'public',
        eliteStatus: false
      };
      
      await this.saveUserRewards(initialRewards);
      return initialRewards;
    } catch (error) {
      console.error('Error initializing user rewards:', error);
      throw error;
    }
  }
  
  /**
   * Get user rewards
   */
  async getUserRewards(userId: string): Promise<UserRewards | null> {
    try {
      const key = `${this.USER_REWARDS_KEY}_${userId}`;
      const rewardsData = await AsyncStorage.getItem(key);
      
      if (!rewardsData) {
        return null;
      }
      
      return JSON.parse(rewardsData) as UserRewards;
    } catch (error) {
      console.error('Error getting user rewards:', error);
      return null;
    }
  }
  
  /**
   * Save user rewards
   */
  async saveUserRewards(rewards: UserRewards): Promise<void> {
    try {
      const key = `${this.USER_REWARDS_KEY}_${rewards.userId}`;
      await AsyncStorage.setItem(key, JSON.stringify(rewards));
    } catch (error) {
      console.error('Error saving user rewards:', error);
      throw error;
    }
  }
  
  /**
   * Record a login for streak tracking
   */
  async recordLogin(userId: string): Promise<{
    updatedStreak: number;
    rewardEarned: boolean;
    reward?: {
      freeAIPredictions: number;
      loyaltyPoints: number;
    }
  }> {
    try {
      let rewards = await this.getUserRewards(userId);
      if (!rewards) {
        rewards = await this.initializeUserRewards(userId);
      }
      
      const today = new Date().toISOString().split('T')[0];
      const lastLogin = rewards.lastLoginDate;
      
      // If last login was yesterday, increment streak
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      
      let rewardEarned = false;
      let earnedReward;
      
      if (lastLogin === yesterdayStr) {
        // Increment streak
        rewards.currentStreak += 1;
        
        // Update longest streak if current is longer
        if (rewards.currentStreak > rewards.longestStreak) {
          rewards.longestStreak = rewards.currentStreak;
        }
        
        // Check if a streak reward is earned
        const earnedStreakReward = STREAK_REWARDS.find(
          sr => sr.daysRequired === rewards.currentStreak
        );
        
        if (earnedStreakReward) {
          rewardEarned = true;
          earnedReward = earnedStreakReward.reward;
          
          // Add free predictions
          rewards.freeAIPredictions += earnedStreakReward.reward.freeAIPredictions;
          
          // Add loyalty points
          rewards.loyaltyPoints += earnedStreakReward.reward.loyaltyPoints;
          
          // Track event
          trackEvent('streak_reward_earned' as any, {
            streak_days: rewards.currentStreak,
            reward_predictions: earnedStreakReward.reward.freeAIPredictions,
            reward_points: earnedStreakReward.reward.loyaltyPoints
          });
        }
      } else if (lastLogin !== today) {
        // Reset streak if not consecutive day (and not already logged in today)
        rewards.currentStreak = 1;
      }
      
      // Update last login date
      rewards.lastLoginDate = today;
      
      // Save updated rewards
      await this.saveUserRewards(rewards);
      
      return {
        updatedStreak: rewards.currentStreak,
        rewardEarned,
        reward: earnedReward
      };
    } catch (error) {
      console.error('Error recording login:', error);
      throw error;
    }
  }
  
  /**
   * Record a placed bet
   */
  async recordBetPlaced(userId: string): Promise<{
    updatedBetCount: number;
    newLoyaltyLevel?: LoyaltyLevel;
    unlockedAchievements: Achievement[];
  }> {
    try {
      let rewards = await this.getUserRewards(userId);
      if (!rewards) {
        rewards = await this.initializeUserRewards(userId);
      }
      
      // Increment bet count
      rewards.betCount += 1;
      
      // Check for loyalty tier upgrade
      const currentTierIndex = LOYALTY_TIERS.findIndex(
        tier => tier.level === rewards.loyaltyLevel
      );
      
      let newLoyaltyLevel: LoyaltyLevel | undefined;
      
      // Check if eligible for next tier
      if (currentTierIndex < LOYALTY_TIERS.length - 1) {
        const nextTier = LOYALTY_TIERS[currentTierIndex + 1];
        if (rewards.betCount >= nextTier.requiredBets) {
          rewards.loyaltyLevel = nextTier.level;
          newLoyaltyLevel = nextTier.level;
          
          // Track loyalty level up event
          trackEvent('loyalty_level_up' as any, {
            new_level: nextTier.level,
            bet_count: rewards.betCount
          });
        }
      }
      
      // Check for unlocked achievements
      const unlockedAchievements: Achievement[] = [];
      
      // First bet achievement
      const firstBetAchievement = rewards.achievements.find(a => a.id === 'first_bet');
      if (firstBetAchievement && !firstBetAchievement.isUnlocked && rewards.betCount >= 1) {
        firstBetAchievement.isUnlocked = true;
        firstBetAchievement.unlockedAt = new Date().toISOString();
        unlockedAchievements.push(firstBetAchievement);
        
        // Add loyalty points for achievement
        rewards.loyaltyPoints += 100;
        
        // Track achievement unlocked
        trackEvent('achievement_unlocked' as any, {
          achievement_id: 'first_bet',
          bet_count: rewards.betCount
        });
      }
      
      // Loyalty master achievement
      const loyaltyMasterAchievement = rewards.achievements.find(a => a.id === 'loyalty_master');
      if (loyaltyMasterAchievement && !loyaltyMasterAchievement.isUnlocked && rewards.loyaltyLevel === 'Platinum') {
        loyaltyMasterAchievement.isUnlocked = true;
        loyaltyMasterAchievement.unlockedAt = new Date().toISOString();
        unlockedAchievements.push(loyaltyMasterAchievement);
        
        // Add loyalty points for achievement
        rewards.loyaltyPoints += 500;
        
        // Track achievement unlocked
        trackEvent('achievement_unlocked' as any, {
          achievement_id: 'loyalty_master',
          loyalty_level: 'Platinum'
        });
      }
      
      // Save updated rewards
      await this.saveUserRewards(rewards);
      
      return {
        updatedBetCount: rewards.betCount,
        newLoyaltyLevel,
        unlockedAchievements
      };
    } catch (error) {
      console.error('Error recording bet placed:', error);
      throw error;
    }
  }
  
  /**
   * Record a successful parlay
   */
  async recordSuccessfulParlay(userId: string, pickCount: number): Promise<{
    unlockedAchievements: Achievement[];
  }> {
    try {
      let rewards = await this.getUserRewards(userId);
      if (!rewards) {
        rewards = await this.initializeUserRewards(userId);
      }
      
      const unlockedAchievements: Achievement[] = [];
      
      // Perfect 5-pick parlay achievement
      if (pickCount >= 5) {
        const perfectParlayAchievement = rewards.achievements.find(a => a.id === 'perfect_parlay');
        if (perfectParlayAchievement && !perfectParlayAchievement.isUnlocked) {
          perfectParlayAchievement.isUnlocked = true;
          perfectParlayAchievement.unlockedAt = new Date().toISOString();
          unlockedAchievements.push(perfectParlayAchievement);
          
          // Add loyalty points for achievement
          rewards.loyaltyPoints += 300;
          
          // Track achievement unlocked
          trackEvent('achievement_unlocked' as any, {
            achievement_id: 'perfect_parlay',
            pick_count: pickCount
          });
        }
      }
      
      // Save updated rewards
      await this.saveUserRewards(rewards);
      
      return {
        unlockedAchievements
      };
    } catch (error) {
      console.error('Error recording successful parlay:', error);
      throw error;
    }
  }
  
  /**
   * Record a UFC bet
   */
  async recordUFCBet(userId: string): Promise<{
    unlockedAchievements: Achievement[];
  }> {
    try {
      let rewards = await this.getUserRewards(userId);
      if (!rewards) {
        rewards = await this.initializeUserRewards(userId);
      }
      
      // Increment bet count (already done in recordBetPlaced)
      // This method is specifically for tracking UFC bets
      
      // We'd need to add a ufcBetCount field to UserRewards
      // For now, we'll simulate this with a counter in AsyncStorage
      const ufcBetCountKey = `ufc_bet_count_${userId}`;
      const ufcBetCountStr = await AsyncStorage.getItem(ufcBetCountKey);
      let ufcBetCount = ufcBetCountStr ? parseInt(ufcBetCountStr, 10) : 0;
      ufcBetCount += 1;
      await AsyncStorage.setItem(ufcBetCountKey, ufcBetCount.toString());
      
      const unlockedAchievements: Achievement[] = [];
      
      // UFC expert achievement
      if (ufcBetCount >= 10) {
        const ufcExpertAchievement = rewards.achievements.find(a => a.id === 'ufc_expert');
        if (ufcExpertAchievement && !ufcExpertAchievement.isUnlocked) {
          ufcExpertAchievement.isUnlocked = true;
          ufcExpertAchievement.unlockedAt = new Date().toISOString();
          unlockedAchievements.push(ufcExpertAchievement);
          
          // Add loyalty points for achievement
          rewards.loyaltyPoints += 200;
          
          // Track achievement unlocked
          trackEvent('achievement_unlocked' as any, {
            achievement_id: 'ufc_expert',
            ufc_bet_count: ufcBetCount
          });
        }
      }
      
      // Save updated rewards
      await this.saveUserRewards(rewards);
      
      return {
        unlockedAchievements
      };
    } catch (error) {
      console.error('Error recording UFC bet:', error);
      throw error;
    }
  }
  
  /**
   * Record a referral
   */
  async recordReferral(userId: string, referredUserId: string): Promise<{
    updatedReferralCount: number;
    unlockedAchievements: Achievement[];
    reward?: {
      discountAmount: number;
      loyaltyPoints: number;
      subscriptionExtension: boolean;
    }
  }> {
    try {
      let rewards = await this.getUserRewards(userId);
      if (!rewards) {
        rewards = await this.initializeUserRewards(userId);
      }
      
      // Increment referral count
      rewards.referralCount += 1;
      
      // Add loyalty points for the referral
      const REFERRAL_LOYALTY_POINTS = 200;
      rewards.loyaltyPoints += REFERRAL_LOYALTY_POINTS;
      
      // Track if user gets a subscription extension
      let subscriptionExtension = false;
      
      // If user has subscriptionExtensions field, increment it
      if (rewards.subscriptionExtensions !== undefined) {
        rewards.subscriptionExtensions += 1;
        subscriptionExtension = true;
      } else {
        rewards.subscriptionExtensions = 1;
        subscriptionExtension = true;
      }
      
      const unlockedAchievements: Achievement[] = [];
      
      // Social butterfly achievement
      const socialButterflyAchievement = rewards.achievements.find(a => a.id === 'social_butterfly');
      if (socialButterflyAchievement && !socialButterflyAchievement.isUnlocked && rewards.referralCount >= 5) {
        socialButterflyAchievement.isUnlocked = true;
        socialButterflyAchievement.unlockedAt = new Date().toISOString();
        unlockedAchievements.push(socialButterflyAchievement);
        
        // Add loyalty points for achievement
        rewards.loyaltyPoints += 250;
        
        // Track achievement unlocked
        trackEvent('achievement_unlocked', {
          achievement_id: 'social_butterfly',
          referral_count: rewards.referralCount
        });
      }
      
      // Track referral reward earned
      trackEvent('referral_reward_earned', {
        referral_count: rewards.referralCount,
        loyalty_points: REFERRAL_LOYALTY_POINTS,
        subscription_extension: subscriptionExtension
      });
      
      // Save updated rewards
      await this.saveUserRewards(rewards);
      
      return {
        updatedReferralCount: rewards.referralCount,
        unlockedAchievements,
        reward: {
          discountAmount: 5, // $5 off next AI bet
          loyaltyPoints: REFERRAL_LOYALTY_POINTS,
          subscriptionExtension
        }
      };
    } catch (error) {
      console.error('Error recording referral:', error);
      throw error;
    }
  }
  
  /**
   * Generate a referral code for a user
   */
  async generateReferralCode(userId: string): Promise<string> {
    try {
      let rewards = await this.getUserRewards(userId);
      if (!rewards) {
        rewards = await this.initializeUserRewards(userId);
      }
      
      // If user already has a referral code, return it
      if (rewards.referralCode) {
        return rewards.referralCode;
      }
      
      // Generate a new referral code
      const referralCode = await this.createReferralCode(userId);
      
      // Save the referral code to the user's rewards
      rewards.referralCode = referralCode;
      await this.saveUserRewards(rewards);
      
      // Track event
      trackEvent('referral_code_generated', {
        referral_code: referralCode
      });
      
      return referralCode;
    } catch (error) {
      console.error('Error generating referral code:', error);
      throw error;
    }
  }
  
  /**
   * Create a unique referral code
   */
  private async createReferralCode(userId: string): Promise<string> {
    // This would typically call the Firebase function, but for now we'll generate it locally
    const prefix = 'SPORT';
    const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
    const userPart = userId.substring(0, 4);
    
    return `${prefix}-${randomPart}-${userPart}`;
  }
  
  /**
   * Get user's current loyalty tier benefits
   */
  async getLoyaltyBenefits(userId: string): Promise<RewardTier['benefits'] | null> {
    try {
      const rewards = await this.getUserRewards(userId);
      if (!rewards) {
        return null;
      }
      
      const currentTier = LOYALTY_TIERS.find(tier => tier.level === rewards.loyaltyLevel);
      return currentTier ? currentTier.benefits : null;
    } catch (error) {
      console.error('Error getting loyalty benefits:', error);
      return null;
    }
  }
  
  /**
   * Use free AI predictions
   */
  async useFreeAIPrediction(userId: string): Promise<boolean> {
    try {
      const rewards = await this.getUserRewards(userId);
      if (!rewards || rewards.freeAIPredictions <= 0) {
        return false;
      }
      
      rewards.freeAIPredictions -= 1;
      await this.saveUserRewards(rewards);
      
      // Track event
      trackEvent('free_prediction_used' as any, {
        remaining_predictions: rewards.freeAIPredictions
      });
      
      return true;
    } catch (error) {
      console.error('Error using free AI prediction:', error);
      return false;
    }
  }

  /**
   * Get referral leaderboard
   * @param period Leaderboard time period
   * @param limit Maximum number of entries to return
   * @returns Array of leaderboard entries
   */
  async getReferralLeaderboard(
    period: 'weekly' | 'monthly' | 'allTime' = 'allTime',
    limit: number = 10
  ): Promise<LeaderboardEntry[]> {
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
        { userId: 'user1', displayName: 'BettingPro', referralCount: 24, badgeType: 'hall-of-fame' as BadgeType },
        { userId: 'user2', displayName: 'SportsFan99', referralCount: 18, badgeType: 'elite' as BadgeType },
        { userId: 'user3', displayName: 'PredictionKing', referralCount: 15, badgeType: 'elite' as BadgeType },
        { userId: 'user4', displayName: 'BetMaster', referralCount: 12, badgeType: 'elite' as BadgeType },
        { userId: 'user5', displayName: 'OddsWizard', referralCount: 10, badgeType: 'elite' as BadgeType },
        { userId: 'user6', displayName: 'StatsGuru', referralCount: 8, badgeType: 'rookie' as BadgeType },
        { userId: 'user7', displayName: 'PicksExpert', referralCount: 7, badgeType: 'rookie' as BadgeType },
        { userId: 'user8', displayName: 'BetInsider', referralCount: 6, badgeType: 'rookie' as BadgeType },
        { userId: 'user9', displayName: 'LineBreaker', referralCount: 5, badgeType: 'rookie' as BadgeType },
        { userId: 'user10', displayName: 'ParlaySage', referralCount: 4, badgeType: 'rookie' as BadgeType }
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
        
        // Determine badge type based on referral count
        let badgeType: BadgeType = 'rookie';
        if (userRewards.referralCount >= 20) {
          badgeType = 'hall-of-fame';
        } else if (userRewards.referralCount >= 10) {
          badgeType = 'elite';
        }
        
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
      console.error('Error getting referral leaderboard:', error);
      return [];
    }
  }
  /**
   * Get user's referral milestone progress
   */
  async getReferralMilestoneProgress(userId: string): Promise<{
    currentReferrals: number;
    milestones: ReferralMilestone[];
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
      const milestones: ReferralMilestone[] = [
        {
          count: 3,
          reward: {
            type: 'subscription_extension',
            description: 'Get 1 month free subscription',
            duration: 30
          },
          isUnlocked: referralCount >= 3
        },
        {
          count: 5,
          reward: {
            type: 'premium_trial',
            description: 'Premium upgrade for 2 months',
            duration: 60
          },
          isUnlocked: referralCount >= 5
        },
        {
          count: 10,
          reward: {
            type: 'cash_or_upgrade',
            description: '$25 or free Pro subscription',
            amount: 25,
            upgradeDuration: 30
          },
          isUnlocked: referralCount >= 10
        },
        {
          count: 20,
          reward: {
            type: 'elite_status',
            description: 'Elite status + special badge'
          },
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
    privacy: LeaderboardPrivacy
  ): Promise<boolean> {
    try {
      let rewards = await this.getUserRewards(userId);
      if (!rewards) {
        rewards = await this.initializeUserRewards(userId);
      }
      
      rewards.leaderboardPrivacy = privacy;
      await this.saveUserRewards(rewards);
      
      // Track event
      trackEvent('leaderboard_privacy_updated' as any, {
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
  async getUserBadgeType(userId: string): Promise<BadgeType> {
    try {
      const rewards = await this.getUserRewards(userId);
      if (!rewards) {
        return 'rookie';
      }
      
      // If user already has a badge type set, return it
      if (rewards.badgeType) {
        return rewards.badgeType;
      }
      
      // Otherwise, determine badge type based on referral count
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
   * Get leaderboard data for all time periods
   */
  async getLeaderboardData(limit: number = 10): Promise<LeaderboardData> {
    try {
      // In a real app, this would fetch from Firestore for each time period
      // For now, we'll use the same data for all periods
      const allTimeEntries = await this.getReferralLeaderboard('allTime', limit);
      
      return {
        weekly: allTimeEntries,
        monthly: allTimeEntries,
        allTime: allTimeEntries
      };
    } catch (error) {
      console.error('Error getting leaderboard data:', error);
      return {
        weekly: [],
        monthly: [],
        allTime: []
      };
    }
  }
}

export const rewardsService = new RewardsService();