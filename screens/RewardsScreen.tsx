import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';

import { Header } from '../atomic/organisms';
import AchievementBadge from '../components/AchievementBadge';
import LoyaltyBadge from '../components/LoyaltyBadge';
import ReferralLeaderboard from '../components/ReferralLeaderboard';
import { auth } from '../config/firebase';
import { useTheme } from '../contexts/ThemeContext';
import { trackScreenView } from '../services/analyticsService';
import { rewardsService } from '../services/rewardsService';
import { UserRewards, Achievement, RewardTier, LoyaltyLevel } from '../types/rewards';

const LOYALTY_TIERS: RewardTier[] = [
  {
    level: 'Free',
    requiredBets: 0,
    benefits: {
      aiPickDiscount: 0,
      exclusiveContent: false,
      prioritySupport: false,
      freeAIPredictions: 0,
    },
  },
  {
    level: 'Silver',
    requiredBets: 10,
    benefits: {
      aiPickDiscount: 5, // 5% off
      exclusiveContent: false,
      prioritySupport: false,
      freeAIPredictions: 1,
    },
  },
  {
    level: 'Gold',
    requiredBets: 50,
    benefits: {
      aiPickDiscount: 10, // 10% off
      exclusiveContent: true,
      prioritySupport: false,
      freeAIPredictions: 2,
    },
  },
  {
    level: 'Platinum',
    requiredBets: 75,
    benefits: {
      aiPickDiscount: 15, // 15% off
      exclusiveContent: true,
      prioritySupport: true,
      freeAIPredictions: 3,
    },
  },
];

type RootStackParamList = {
  ReferralLeaderboard: undefined;
  // Other screens...
};

type RewardsScreenNavigationProp = StackNavigationProp<RootStackParamList, 'ReferralLeaderboard'>;

const RewardsScreen: React.FC = () => {
  const [rewards, setRewards] = useState<UserRewards | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'loyalty' | 'achievements' | 'streaks' | 'referrals'>(
    'loyalty'
  );
  const { colors, isDark } = useTheme();
  const navigation = useNavigation<RewardsScreenNavigationProp>();

  // Track screen view
  useEffect(() => {
    trackScreenView('RewardsScreen');
  }, []);

  // Load user rewards
  useEffect(() => {
    const loadRewards = async () => {
      try {
        setLoading(true);
        const userId = auth.currentUser?.uid;

        if (!userId) {
          Alert.alert('Error', 'You must be logged in to view rewards');
          setLoading(false);
          return;
        }

        const userRewards = await rewardsService.getUserRewards(userId);

        if (!userRewards) {
          // Initialize rewards if they don't exist
          const initializedRewards = await rewardsService.initializeUserRewards(userId);
          setRewards(initializedRewards);
        } else {
          setRewards(userRewards);
        }
      } catch (error) {
        console.error('Error loading rewards:', error);
        Alert.alert('Error', 'Failed to load rewards. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadRewards();
  }, []);

  // Get current tier
  const getCurrentTier = (): RewardTier | undefined => {
    if (!rewards) return undefined;
    return LOYALTY_TIERS.find(tier => tier.level === rewards.loyaltyLevel);
  };

  // Get next tier
  const getNextTier = (): RewardTier | undefined => {
    if (!rewards) return undefined;

    const currentTierIndex = LOYALTY_TIERS.findIndex(tier => tier.level === rewards.loyaltyLevel);

    if (currentTierIndex < LOYALTY_TIERS.length - 1) {
      return LOYALTY_TIERS[currentTierIndex + 1];
    }

    return undefined;
  };

  // Calculate progress to next tier
  const getProgressToNextTier = (): number => {
    if (!rewards) return 0;

    const nextTier = getNextTier();
    if (!nextTier) return 100; // Already at max tier

    const currentTier = getCurrentTier();
    if (!currentTier) return 0;

    const totalBetsNeeded = nextTier.requiredBets - currentTier.requiredBets;
    const betsCompleted = rewards.betCount - currentTier.requiredBets;

    return Math.min(100, Math.max(0, (betsCompleted / totalBetsNeeded) * 100));
  };

  // Render loading state
  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Header title="Rewards & Achievements" onRefresh={() => {}} isLoading={loading} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text }]}>Loading your rewards...</Text>
        </View>
      </View>
    );
  }

  // Render tabs
  const renderTabs = () => (
    <View style={styles.tabContainer}>
      <TouchableOpacity
        style={[
          styles.tab,
          activeTab === 'loyalty' && [styles.activeTab, { borderBottomColor: colors.primary }],
        ]}
        onPress={() => setActiveTab('loyalty')}
      >
        <Ionicons
          name="trophy"
          size={20}
          color={activeTab === 'loyalty' ? colors.primary : colors.text}
        />
        <Text
          style={[
            styles.tabText,
            { color: activeTab === 'loyalty' ? colors.primary : colors.text },
          ]}
        >
          Loyalty
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.tab,
          activeTab === 'achievements' && [styles.activeTab, { borderBottomColor: colors.primary }],
        ]}
        onPress={() => setActiveTab('achievements')}
      >
        <Ionicons
          name="ribbon"
          size={20}
          color={activeTab === 'achievements' ? colors.primary : colors.text}
        />
        <Text
          style={[
            styles.tabText,
            { color: activeTab === 'achievements' ? colors.primary : colors.text },
          ]}
        >
          Achievements
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.tab,
          activeTab === 'streaks' && [styles.activeTab, { borderBottomColor: colors.primary }],
        ]}
        onPress={() => setActiveTab('streaks')}
      >
        <Ionicons
          name="flame"
          size={20}
          color={activeTab === 'streaks' ? colors.primary : colors.text}
        />
        <Text
          style={[
            styles.tabText,
            { color: activeTab === 'streaks' ? colors.primary : colors.text },
          ]}
        >
          Streaks
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.tab,
          activeTab === 'referrals' && [styles.activeTab, { borderBottomColor: colors.primary }],
        ]}
        onPress={() => setActiveTab('referrals')}
      >
        <Ionicons
          name="people"
          size={20}
          color={activeTab === 'referrals' ? colors.primary : colors.text}
        />
        <Text
          style={[
            styles.tabText,
            { color: activeTab === 'referrals' ? colors.primary : colors.text },
          ]}
        >
          Referrals
        </Text>
      </TouchableOpacity>
    </View>
  );

  // Render loyalty tab content
  const renderLoyaltyContent = () => {
    if (!rewards) return null;

    const currentTier = getCurrentTier();
    const nextTier = getNextTier();
    const progress = getProgressToNextTier();

    return (
      <View style={styles.tabContent}>
        <View style={styles.loyaltyHeader}>
          <LoyaltyBadge level={rewards.loyaltyLevel} size="large" />
          <View style={styles.pointsContainer}>
            <Text style={[styles.pointsLabel, { color: colors.text }]}>Loyalty Points</Text>
            <Text style={[styles.pointsValue, { color: colors.primary }]}>
              {rewards.loyaltyPoints}
            </Text>
          </View>
        </View>

        <View
          style={[styles.tierInfoContainer, { backgroundColor: isDark ? '#2A2A2A' : '#F5F5F5' }]}
        >
          <Text style={[styles.tierTitle, { color: colors.text }]}>Current Tier Benefits</Text>

          {currentTier && (
            <View style={styles.benefitsList}>
              <View style={styles.benefitItem}>
                <Ionicons name="pricetag" size={18} color={colors.primary} />
                <Text style={[styles.benefitText, { color: colors.text }]}>
                  {currentTier.benefits.aiPickDiscount}% off AI picks
                </Text>
              </View>

              {currentTier.benefits.exclusiveContent && (
                <View style={styles.benefitItem}>
                  <Ionicons name="lock-open" size={18} color={colors.primary} />
                  <Text style={[styles.benefitText, { color: colors.text }]}>
                    Exclusive content access
                  </Text>
                </View>
              )}

              {currentTier.benefits.prioritySupport && (
                <View style={styles.benefitItem}>
                  <Ionicons name="headset" size={18} color={colors.primary} />
                  <Text style={[styles.benefitText, { color: colors.text }]}>
                    Priority customer support
                  </Text>
                </View>
              )}

              <View style={styles.benefitItem}>
                <Ionicons name="analytics" size={18} color={colors.primary} />
                <Text style={[styles.benefitText, { color: colors.text }]}>
                  {currentTier.benefits.freeAIPredictions} free AI predictions per month
                </Text>
              </View>
            </View>
          )}
        </View>

        {nextTier && (
          <>
            <View style={styles.progressContainer}>
              <View style={styles.progressLabelContainer}>
                <Text style={[styles.progressLabel, { color: colors.text }]}>
                  Progress to {nextTier.level}
                </Text>
                <Text style={[styles.progressValue, { color: colors.text }]}>
                  {rewards.betCount}/{nextTier.requiredBets} bets
                </Text>
              </View>

              <View
                style={[styles.progressBar, { backgroundColor: isDark ? '#444444' : '#E0E0E0' }]}
              >
                <View
                  style={[
                    styles.progressFill,
                    {
                      backgroundColor: colors.primary,
                      width: `${progress}%`,
                    },
                  ]}
                />
              </View>
            </View>

            <View
              style={[
                styles.nextTierContainer,
                { backgroundColor: isDark ? '#2A2A2A' : '#F5F5F5' },
              ]}
            >
              <View style={styles.nextTierHeader}>
                <LoyaltyBadge level={nextTier.level} size="medium" />
                <Text style={[styles.nextTierTitle, { color: colors.text }]}>
                  Next Tier Benefits
                </Text>
              </View>

              <View style={styles.benefitsList}>
                <View style={styles.benefitItem}>
                  <Ionicons name="pricetag" size={18} color={colors.primary} />
                  <Text style={[styles.benefitText, { color: colors.text }]}>
                    {nextTier.benefits.aiPickDiscount}% off AI picks
                  </Text>
                </View>

                {nextTier.benefits.exclusiveContent && (
                  <View style={styles.benefitItem}>
                    <Ionicons name="lock-open" size={18} color={colors.primary} />
                    <Text style={[styles.benefitText, { color: colors.text }]}>
                      Exclusive content access
                    </Text>
                  </View>
                )}

                {nextTier.benefits.prioritySupport && (
                  <View style={styles.benefitItem}>
                    <Ionicons name="headset" size={18} color={colors.primary} />
                    <Text style={[styles.benefitText, { color: colors.text }]}>
                      Priority customer support
                    </Text>
                  </View>
                )}

                <View style={styles.benefitItem}>
                  <Ionicons name="analytics" size={18} color={colors.primary} />
                  <Text style={[styles.benefitText, { color: colors.text }]}>
                    {nextTier.benefits.freeAIPredictions} free AI predictions per month
                  </Text>
                </View>
              </View>
            </View>
          </>
        )}

        <View style={styles.tierLevelsContainer}>
          <Text style={[styles.tierLevelsTitle, { color: colors.text }]}>All Loyalty Tiers</Text>

          {LOYALTY_TIERS.map((tier, index) => (
            <View
              key={tier.level}
              style={[
                styles.tierLevelItem,
                {
                  backgroundColor: isDark ? '#2A2A2A' : '#F5F5F5',
                  borderLeftColor:
                    rewards.loyaltyLevel === tier.level ? colors.primary : 'transparent',
                  borderLeftWidth: rewards.loyaltyLevel === tier.level ? 4 : 0,
                },
              ]}
            >
              <LoyaltyBadge level={tier.level} size="small" />
              <Text style={[styles.tierRequirement, { color: colors.text }]}>
                {tier.requiredBets} bets required
              </Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  // Render achievements tab content
  const renderAchievementsContent = () => {
    if (!rewards) return null;

    const unlockedAchievements = rewards.achievements.filter(a => a.isUnlocked);
    const lockedAchievements = rewards.achievements.filter(a => !a.isUnlocked);

    return (
      <View style={styles.tabContent}>
        <View style={styles.achievementsSummary}>
          <View style={styles.achievementsSummaryItem}>
            <Text style={[styles.achievementsSummaryValue, { color: colors.primary }]}>
              {unlockedAchievements.length}
            </Text>
            <Text style={[styles.achievementsSummaryLabel, { color: colors.text }]}>Unlocked</Text>
          </View>

          <View style={styles.achievementsSummaryItem}>
            <Text style={[styles.achievementsSummaryValue, { color: colors.text }]}>
              {lockedAchievements.length}
            </Text>
            <Text style={[styles.achievementsSummaryLabel, { color: colors.text }]}>Locked</Text>
          </View>

          <View style={styles.achievementsSummaryItem}>
            <Text style={[styles.achievementsSummaryValue, { color: colors.primary }]}>
              {Math.round((unlockedAchievements.length / rewards.achievements.length) * 100)}%
            </Text>
            <Text style={[styles.achievementsSummaryLabel, { color: colors.text }]}>Complete</Text>
          </View>
        </View>

        {unlockedAchievements.length > 0 && (
          <>
            <Text style={[styles.achievementsTitle, { color: colors.text }]}>
              Unlocked Achievements
            </Text>

            {unlockedAchievements.map(achievement => (
              <AchievementBadge key={achievement.id} achievement={achievement} />
            ))}
          </>
        )}

        {lockedAchievements.length > 0 && (
          <>
            <Text style={[styles.achievementsTitle, { color: colors.text }]}>
              Locked Achievements
            </Text>

            {lockedAchievements.map(achievement => (
              <AchievementBadge key={achievement.id} achievement={achievement} />
            ))}
          </>
        )}
      </View>
    );
  };

  // Render referrals tab content
  const renderReferralsContent = () => {
    if (!rewards) return null;

    return (
      <View style={styles.tabContent}>
        <View style={styles.referralInfoContainer}>
          <Text style={[styles.referralTitle, { color: colors.text }]}>Your Referrals</Text>

          <View style={styles.referralStatsContainer}>
            <View style={styles.referralStatItem}>
              <Text style={[styles.referralStatValue, { color: colors.primary }]}>
                {rewards.referralCount || 0}
              </Text>
              <Text style={[styles.referralStatLabel, { color: colors.text }]}>
                Total Referrals
              </Text>
            </View>

            {rewards.subscriptionExtensions && (
              <View style={styles.referralStatItem}>
                <Text style={[styles.referralStatValue, { color: colors.primary }]}>
                  {rewards.subscriptionExtensions}
                </Text>
                <Text style={[styles.referralStatLabel, { color: colors.text }]}>
                  Months Extended
                </Text>
              </View>
            )}
          </View>
        </View>

        <ReferralLeaderboard
          limit={10}
          showViewAll
          onViewAllPress={() => navigation.navigate('ReferralLeaderboard')}
        />
      </View>
    );
  };

  // Render streaks tab content
  const renderStreaksContent = () => {
    if (!rewards) return null;

    return (
      <View style={styles.tabContent}>
        <View style={[styles.streakCard, { backgroundColor: isDark ? '#2A2A2A' : '#F5F5F5' }]}>
          <View style={styles.streakHeader}>
            <Ionicons name="flame" size={24} color="#FF9800" />
            <Text style={[styles.streakTitle, { color: colors.text }]}>Current Streak</Text>
          </View>

          <Text style={[styles.streakValue, { color: colors.primary }]}>
            {rewards.currentStreak} days
          </Text>

          <Text style={[styles.streakDescription, { color: colors.text }]}>
            Keep logging in daily to maintain your streak!
          </Text>
        </View>

        <View style={[styles.streakCard, { backgroundColor: isDark ? '#2A2A2A' : '#F5F5F5' }]}>
          <View style={styles.streakHeader}>
            <Ionicons name="trophy" size={24} color="#FFC107" />
            <Text style={[styles.streakTitle, { color: colors.text }]}>Longest Streak</Text>
          </View>

          <Text style={[styles.streakValue, { color: colors.primary }]}>
            {rewards.longestStreak} days
          </Text>
        </View>

        <Text style={[styles.streakRewardsTitle, { color: colors.text }]}>Streak Rewards</Text>

        <View
          style={[
            styles.streakRewardCard,
            {
              backgroundColor: isDark ? '#2A2A2A' : '#F5F5F5',
              borderLeftColor: rewards.currentStreak >= 7 ? '#4CAF50' : colors.border,
              opacity: rewards.currentStreak >= 7 ? 1 : 0.7,
            },
          ]}
        >
          <View style={styles.streakRewardHeader}>
            <Text style={[styles.streakRewardDays, { color: colors.text }]}>7 Days</Text>
            {rewards.currentStreak >= 7 && (
              <View style={styles.streakRewardUnlocked}>
                <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                <Text style={styles.streakRewardUnlockedText}>Unlocked</Text>
              </View>
            )}
          </View>

          <View style={styles.streakRewardContent}>
            <View style={styles.streakRewardItem}>
              <Ionicons name="analytics" size={16} color={colors.primary} />
              <Text style={[styles.streakRewardText, { color: colors.text }]}>
                1 Free AI Prediction
              </Text>
            </View>

            <View style={styles.streakRewardItem}>
              <Ionicons name="star" size={16} color={colors.primary} />
              <Text style={[styles.streakRewardText, { color: colors.text }]}>
                50 Loyalty Points
              </Text>
            </View>
          </View>
        </View>

        <View
          style={[
            styles.streakRewardCard,
            {
              backgroundColor: isDark ? '#2A2A2A' : '#F5F5F5',
              borderLeftColor: rewards.currentStreak >= 20 ? '#4CAF50' : colors.border,
              opacity: rewards.currentStreak >= 20 ? 1 : 0.7,
            },
          ]}
        >
          <View style={styles.streakRewardHeader}>
            <Text style={[styles.streakRewardDays, { color: colors.text }]}>20 Days</Text>
            {rewards.currentStreak >= 20 && (
              <View style={styles.streakRewardUnlocked}>
                <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                <Text style={styles.streakRewardUnlockedText}>Unlocked</Text>
              </View>
            )}
          </View>

          <View style={styles.streakRewardContent}>
            <View style={styles.streakRewardItem}>
              <Ionicons name="analytics" size={16} color={colors.primary} />
              <Text style={[styles.streakRewardText, { color: colors.text }]}>
                2 Free AI Predictions
              </Text>
            </View>

            <View style={styles.streakRewardItem}>
              <Ionicons name="star" size={16} color={colors.primary} />
              <Text style={[styles.streakRewardText, { color: colors.text }]}>
                150 Loyalty Points
              </Text>
            </View>
          </View>
        </View>

        <View
          style={[
            styles.streakRewardCard,
            {
              backgroundColor: isDark ? '#2A2A2A' : '#F5F5F5',
              borderLeftColor: rewards.currentStreak >= 30 ? '#4CAF50' : colors.border,
              opacity: rewards.currentStreak >= 30 ? 1 : 0.7,
            },
          ]}
        >
          <View style={styles.streakRewardHeader}>
            <Text style={[styles.streakRewardDays, { color: colors.text }]}>30 Days</Text>
            {rewards.currentStreak >= 30 && (
              <View style={styles.streakRewardUnlocked}>
                <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                <Text style={styles.streakRewardUnlockedText}>Unlocked</Text>
              </View>
            )}
          </View>

          <View style={styles.streakRewardContent}>
            <View style={styles.streakRewardItem}>
              <Ionicons name="analytics" size={16} color={colors.primary} />
              <Text style={[styles.streakRewardText, { color: colors.text }]}>
                3 Free AI Predictions
              </Text>
            </View>

            <View style={styles.streakRewardItem}>
              <Ionicons name="star" size={16} color={colors.primary} />
              <Text style={[styles.streakRewardText, { color: colors.text }]}>
                300 Loyalty Points
              </Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header title="Rewards & Achievements" onRefresh={() => {}} isLoading={loading} />

      {renderTabs()}

      <ScrollView style={styles.scrollView}>
        {activeTab === 'loyalty' && renderLoyaltyContent()}
        {activeTab === 'achievements' && renderAchievementsContent()}
        {activeTab === 'streaks' && renderStreaksContent()}
        {activeTab === 'referrals' && renderReferralsContent()}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  activeTab: {
    borderBottomWidth: 2,
  },
  tabText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  tabContent: {
    padding: 16,
  },
  // Loyalty tab styles
  loyaltyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  pointsContainer: {
    alignItems: 'flex-end',
  },
  pointsLabel: {
    fontSize: 14,
  },
  pointsValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  tierInfoContainer: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  tierTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  benefitsList: {
    marginTop: 8,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  benefitText: {
    marginLeft: 8,
    fontSize: 14,
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressLabelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  progressValue: {
    fontSize: 14,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
  },
  nextTierContainer: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  nextTierHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  nextTierTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  tierLevelsContainer: {
    marginTop: 16,
  },
  tierLevelsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  tierLevelItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  tierRequirement: {
    fontSize: 14,
  },
  // Achievements tab styles
  achievementsSummary: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 24,
  },
  achievementsSummaryItem: {
    alignItems: 'center',
  },
  achievementsSummaryValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  achievementsSummaryLabel: {
    fontSize: 14,
  },
  achievementsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    marginTop: 8,
  },
  // Streaks tab styles
  streakCard: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  streakHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  streakTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  streakValue: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  streakDescription: {
    fontSize: 14,
  },
  streakRewardsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  streakRewardCard: {
    borderRadius: 8,
    marginBottom: 12,
    borderLeftWidth: 4,
    overflow: 'hidden',
  },
  streakRewardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  streakRewardDays: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  streakRewardUnlocked: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  streakRewardUnlockedText: {
    fontSize: 12,
    color: '#4CAF50',
    marginLeft: 4,
  },
  streakRewardContent: {
    padding: 12,
  },
  streakRewardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  streakRewardText: {
    marginLeft: 8,
    fontSize: 14,
  },
  // Referrals tab styles
  referralInfoContainer: {
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#2A2A2A',
    marginBottom: 16,
  },
  referralTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  referralStatsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 8,
  },
  referralStatItem: {
    alignItems: 'center',
    padding: 8,
  },
  referralStatValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  referralStatLabel: {
    fontSize: 14,
    marginTop: 4,
  },
});

export default RewardsScreen;
