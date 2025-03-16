import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from '../config/firebase';
import { 
  UserRewards, 
  LoyaltyLevel, 
  Achievement, 
  RewardTier,
  DailyStreakReward
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
        freeAIPredictions: 0
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
    }
  }> {
    try {
      let rewards = await this.getUserRewards(userId);
      if (!rewards) {
        rewards = await this.initializeUserRewards(userId);
      }
      
      // Increment referral count
      rewards.referralCount += 1;
      
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
        trackEvent('achievement_unlocked' as any, {
          achievement_id: 'social_butterfly',
          referral_count: rewards.referralCount
        });
      }
      
      // Save updated rewards
      await this.saveUserRewards(rewards);
      
      // Return $5 discount reward for each referral
      return {
        updatedReferralCount: rewards.referralCount,
        unlockedAchievements,
        reward: {
          discountAmount: 5 // $5 off next AI bet
        }
      };
    } catch (error) {
      console.error('Error recording referral:', error);
      throw error;
    }
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
}

export const rewardsService = new RewardsService();