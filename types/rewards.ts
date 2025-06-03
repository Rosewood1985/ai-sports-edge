export type LoyaltyLevel = 'Free' | 'Silver' | 'Gold' | 'Platinum';
export type BadgeType = 'rookie' | 'elite' | 'hall-of-fame';
export type LeaderboardPrivacy = 'public' | 'private' | 'anonymous';

export interface UserRewards {
  userId: string;
  loyaltyLevel: LoyaltyLevel;
  loyaltyPoints: number;
  betCount: number;
  currentStreak: number;
  longestStreak: number;
  lastLoginDate: string;
  achievements: Achievement[];
  referralCount: number;
  freeAIPredictions: number;
  referralCode?: string;
  referredBy?: string;
  subscriptionExtensions?: number;
  badgeType?: BadgeType;
  eliteStatus?: boolean;
  eliteStatusGrantedAt?: string;
  leaderboardPrivacy?: LeaderboardPrivacy;
  premiumTrial?: boolean;
  premiumTrialStartedAt?: string;
  premiumTrialEndsAt?: string;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  iconUrl: string;
  unlockedAt?: string;
  isUnlocked: boolean;
}

export interface RewardTier {
  level: LoyaltyLevel;
  requiredBets: number;
  benefits: {
    aiPickDiscount: number;
    exclusiveContent: boolean;
    prioritySupport: boolean;
    freeAIPredictions: number;
  };
}

export interface DailyStreakReward {
  daysRequired: number;
  reward: {
    freeAIPredictions: number;
    loyaltyPoints: number;
  };
}

export interface ReferralMilestone {
  count: number;
  reward: ReferralReward;
  isUnlocked: boolean;
}

export type ReferralRewardType =
  | 'subscription_extension'
  | 'premium_trial'
  | 'cash_or_upgrade'
  | 'elite_status';

export interface ReferralReward {
  type: ReferralRewardType;
  description: string;
  duration?: number;
  amount?: number;
  upgradeDuration?: number;
}

export interface LeaderboardEntry {
  userId: string;
  displayName: string;
  referralCount: number;
  rank: number;
  badgeType: BadgeType;
  isCurrentUser: boolean;
}

export interface LeaderboardData {
  weekly: LeaderboardEntry[];
  monthly: LeaderboardEntry[];
  allTime: LeaderboardEntry[];
}
