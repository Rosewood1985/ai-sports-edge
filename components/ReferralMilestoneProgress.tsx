import { Ionicons } from '@expo/vector-icons';
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

import NeonText from './ui/NeonText';
import { useThemeColor } from '../hooks/useThemeColor';
import { ReferralMilestone } from '../types/rewards';
import { getUserRewardStructure } from '../utils/referralABTesting';

interface ReferralMilestoneProgressProps {
  currentReferrals: number;
  onInfoPress?: () => void;
}

/**
 * ReferralMilestoneProgress component displays the user's progress toward referral milestones
 * @param {ReferralMilestoneProgressProps} props - Component props
 * @returns {JSX.Element} - Rendered component
 */
const ReferralMilestoneProgress: React.FC<ReferralMilestoneProgressProps> = ({
  currentReferrals,
  onInfoPress,
}) => {
  const primaryColor = useThemeColor({}, 'tint');
  const textColor = useThemeColor({}, 'text');

  // State for milestones
  const [milestones, setMilestones] = useState<ReferralMilestone[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Load milestones based on A/B test variant
  useEffect(() => {
    const loadMilestones = async () => {
      try {
        setLoading(true);

        // Get reward structure from A/B testing utility
        const rewardStructure = await getUserRewardStructure();

        // Convert reward structure to milestones
        const newMilestones: ReferralMilestone[] = rewardStructure.map(reward => {
          const rewardDetails: any = {
            type: reward.type,
            description: getRewardDescription(reward.type, reward.value),
          };

          // Add specific properties based on reward type
          if (reward.type === 'subscription_extension' || reward.type === 'premium_trial') {
            rewardDetails.duration = reward.value;
          } else if (reward.type === 'cash_or_upgrade' || reward.type === 'cash_reward') {
            rewardDetails.amount = reward.value;
            rewardDetails.upgradeDuration = Math.floor(reward.value / 0.83); // Approximate days based on value
          }

          return {
            count: reward.count,
            reward: rewardDetails,
            isUnlocked: currentReferrals >= reward.count,
          };
        });

        setMilestones(newMilestones);
      } catch (error) {
        console.error('Error loading milestones:', error);

        // Fallback to default milestones
        setMilestones([
          {
            count: 3,
            reward: {
              type: 'subscription_extension',
              description: 'Get 1 month free subscription',
              duration: 30,
            },
            isUnlocked: currentReferrals >= 3,
          },
          {
            count: 5,
            reward: {
              type: 'premium_trial',
              description: 'Premium upgrade for 2 months',
              duration: 60,
            },
            isUnlocked: currentReferrals >= 5,
          },
          {
            count: 10,
            reward: {
              type: 'cash_or_upgrade',
              description: '$25 or free Pro subscription',
              amount: 25,
              upgradeDuration: 30,
            },
            isUnlocked: currentReferrals >= 10,
          },
          {
            count: 20,
            reward: {
              type: 'elite_status',
              description: 'Elite status + special badge',
            },
            isUnlocked: currentReferrals >= 20,
          },
        ]);
      } finally {
        setLoading(false);
      }
    };

    loadMilestones();
  }, [currentReferrals]);

  // Get reward description based on type and value
  const getRewardDescription = (type: string, value: number): string => {
    switch (type) {
      case 'subscription_extension':
        return `Get ${Math.floor(value / 30)} month${value > 30 ? 's' : ''} free subscription`;
      case 'premium_trial':
        return `Premium upgrade for ${Math.floor(value / 30)} month${value > 30 ? 's' : ''}`;
      case 'cash_or_upgrade':
        return `$${value} or free Pro subscription`;
      case 'cash_reward':
        return `$${value} cash reward`;
      case 'elite_status':
        return 'Elite status + special badge';
      default:
        return 'Special reward';
    }
  };

  // Find next milestone
  const nextMilestone = milestones.find(m => !m.isUnlocked);

  // Calculate progress to next milestone
  const calculateProgress = () => {
    if (!nextMilestone) return 100;

    const prevMilestoneCount =
      milestones[milestones.findIndex(m => m === nextMilestone) - 1]?.count || 0;
    const progress =
      ((currentReferrals - prevMilestoneCount) / (nextMilestone.count - prevMilestoneCount)) * 100;
    return Math.min(Math.max(progress, 0), 100);
  };

  // Get icon for milestone
  const getMilestoneIcon = (milestone: ReferralMilestone): string => {
    switch (milestone.reward.type) {
      case 'subscription_extension':
        return 'calendar';
      case 'premium_trial':
        return 'star';
      case 'cash_or_upgrade':
        return 'cash';
      case 'elite_status':
        return 'trophy';
      default:
        return 'gift';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <NeonText type="subheading" glow style={styles.title}>
          Referral Milestones
        </NeonText>

        {onInfoPress && (
          <TouchableOpacity onPress={onInfoPress}>
            <Ionicons name="information-circle-outline" size={20} color={primaryColor} />
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <Ionicons name="hourglass-outline" size={32} color={primaryColor} />
          <Text style={[styles.loadingText, { color: textColor }]}>Loading milestones...</Text>
        </View>
      ) : (
        <>
          {/* Progress to next milestone */}
          {nextMilestone && (
            <View style={styles.nextMilestoneContainer}>
              <Text style={[styles.nextMilestoneText, { color: textColor }]}>
                {currentReferrals}/{nextMilestone.count} referrals to unlock{' '}
                {nextMilestone.reward.description}
              </Text>

              <View style={styles.progressBarContainer}>
                <View
                  style={[
                    styles.progressBar,
                    { width: `${calculateProgress()}%`, backgroundColor: primaryColor },
                  ]}
                />
              </View>
            </View>
          )}

          {/* Milestone list */}
          <View style={styles.milestonesList}>
            {milestones.map((milestone, index) => (
              <View key={index} style={styles.milestoneItem}>
                <View
                  style={[
                    styles.milestoneIconContainer,
                    milestone.isUnlocked
                      ? { backgroundColor: primaryColor }
                      : { backgroundColor: '#444' },
                  ]}
                >
                  <Ionicons
                    name={getMilestoneIcon(milestone) as any}
                    size={16}
                    color={milestone.isUnlocked ? '#fff' : '#888'}
                  />
                </View>

                <View style={styles.milestoneContent}>
                  <Text
                    style={[
                      styles.milestoneCount,
                      { color: milestone.isUnlocked ? primaryColor : textColor },
                    ]}
                  >
                    {milestone.count} Referrals
                  </Text>

                  <Text
                    style={[
                      styles.milestoneReward,
                      { color: textColor, opacity: milestone.isUnlocked ? 1 : 0.6 },
                    ]}
                  >
                    {milestone.reward.description}
                  </Text>
                </View>

                {milestone.isUnlocked && (
                  <Ionicons name="checkmark-circle" size={20} color={primaryColor} />
                )}
              </View>
            ))}
          </View>
        </>
      )}
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
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    textAlign: 'center',
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
