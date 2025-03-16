export type LoyaltyLevel = 'Free' | 'Silver' | 'Gold' | 'Platinum';

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