import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, StatusBar, TouchableOpacity } from 'react-native';

import ReferralNotificationModal from '../components/ReferralNotification';
import ReferralRewards from '../components/ReferralRewards';
import { useThemeColor } from '../hooks/useThemeColor';
import { referralNotificationService } from '../services/referralNotificationService';
import { rewardsService } from '../services/rewardsService';
import { ReferralMilestone, BadgeType } from '../types/rewards';

type RootStackParamList = {
  RewardsScreen: undefined;
  ReferralLeaderboard: undefined;
};

type NavigationProp = StackNavigationProp<RootStackParamList>;

/**
 * ReferralRewardsScreen displays the rewards that users can earn through referrals
 * @returns {JSX.Element} - Rendered component
 */
const ReferralRewardsScreen: React.FC = () => {
  const [milestones, setMilestones] = useState<ReferralMilestone[]>([]);
  const [currentReferrals, setCurrentReferrals] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [notificationVisible, setNotificationVisible] = useState<boolean>(false);
  const [notificationData, setNotificationData] = useState<{
    type: 'milestone' | 'referral' | 'subscription_extension' | 'badge';
    title: string;
    message: string;
    badgeType?: BadgeType;
    rewardAmount?: number;
    rewardType?: string;
  } | null>(null);

  const navigation = useNavigation<NavigationProp>();
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');

  useEffect(() => {
    loadReferralData();
  }, []);

  const loadReferralData = async () => {
    try {
      setLoading(true);

      // Get current user's referral data
      const userId = 'current-user-id'; // In a real app, get from auth
      const milestoneData = await rewardsService.getReferralMilestoneProgress(userId);

      setMilestones(milestoneData.milestones);
      setCurrentReferrals(milestoneData.currentReferrals);
    } catch (error) {
      console.error('Error loading referral data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClaimReward = (milestone: ReferralMilestone) => {
    // In a real app, this would call a function to claim the reward
    console.log('Claiming reward for milestone:', milestone.count);

    // Show notification
    setNotificationData({
      type: 'milestone',
      title: 'Reward Claimed!',
      message: `You've claimed your reward for reaching ${milestone.count} referrals.`,
      rewardAmount:
        milestone.reward.type === 'cash_or_upgrade' ? milestone.reward.amount : undefined,
      rewardType: milestone.reward.type === 'cash_or_upgrade' ? 'cash' : undefined,
      badgeType: milestone.reward.type === 'elite_status' ? 'hall-of-fame' : undefined,
    });

    setNotificationVisible(true);

    // Add notification to the user's notifications
    referralNotificationService.addNotification({
      type: 'milestone',
      title: 'Reward Claimed!',
      message: `You've claimed your reward for reaching ${milestone.count} referrals.`,
      read: false,
    });
  };

  const handleCloseNotification = () => {
    setNotificationVisible(false);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]}>
      <StatusBar barStyle="light-content" />

      {/* Custom Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={textColor} />
        </TouchableOpacity>

        <Text style={[styles.headerTitle, { color: textColor }]}>Referral Rewards</Text>

        <TouchableOpacity
          style={styles.leaderboardButton}
          onPress={() => navigation.navigate('ReferralLeaderboard')}
        >
          <Ionicons name="trophy" size={24} color={textColor} />
        </TouchableOpacity>
      </View>

      <ReferralRewards
        milestones={milestones}
        currentReferrals={currentReferrals}
        onClaimReward={handleClaimReward}
      />

      {notificationData && (
        <ReferralNotificationModal
          visible={notificationVisible}
          onClose={handleCloseNotification}
          type={notificationData.type}
          title={notificationData.title}
          message={notificationData.message}
          badgeType={notificationData.badgeType}
          rewardAmount={notificationData.rewardAmount}
          rewardType={notificationData.rewardType}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#444',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  leaderboardButton: {
    padding: 8,
  },
});

export default ReferralRewardsScreen;
