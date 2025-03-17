import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColor } from '../hooks/useThemeColor';
import NeonCard from './ui/NeonCard';
import NeonText from './ui/NeonText';
import ReferralBadge from './ReferralBadge';
import { ReferralMilestone } from '../types/rewards';

interface ReferralRewardsProps {
  milestones: ReferralMilestone[];
  currentReferrals: number;
  onClaimReward?: (milestone: ReferralMilestone) => void;
}

/**
 * ReferralRewards component displays the rewards that users can earn through referrals
 * @param {ReferralRewardsProps} props - Component props
 * @returns {JSX.Element} - Rendered component
 */
const ReferralRewards: React.FC<ReferralRewardsProps> = ({
  milestones,
  currentReferrals,
  onClaimReward
}) => {
  const primaryColor = useThemeColor({}, 'tint');
  const textColor = useThemeColor({}, 'text');
  
  // Get icon for reward type
  const getRewardIcon = (milestone: ReferralMilestone): string => {
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
  
  // Get badge type for milestone
  const getBadgeType = (milestone: ReferralMilestone) => {
    if (milestone.count >= 20) {
      return 'hall-of-fame';
    } else if (milestone.count >= 10) {
      return 'elite';
    } else {
      return 'rookie';
    }
  };
  
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <NeonText type="heading" glow={true} style={styles.title}>
        Referral Rewards
      </NeonText>
      
      <Text style={[styles.description, { color: textColor }]}>
        Invite friends to join AI Sports Edge and earn these amazing rewards!
      </Text>
      
      <View style={styles.rewardsContainer}>
        {milestones.map((milestone, index) => (
          <NeonCard key={index} style={styles.rewardCard}>
            <View style={styles.rewardHeader}>
              <View style={[
                styles.countBadge,
                { backgroundColor: milestone.isUnlocked ? primaryColor : '#444' }
              ]}>
                <Text style={styles.countText}>
                  {milestone.count}
                </Text>
              </View>
              
              <Text style={[styles.rewardTitle, { color: textColor }]}>
                {milestone.count} Referrals
              </Text>
              
              {milestone.isUnlocked && (
                <Ionicons name="checkmark-circle" size={20} color={primaryColor} />
              )}
            </View>
            
            <View style={styles.rewardContent}>
              <View style={styles.rewardIconContainer}>
                {milestone.reward.type === 'elite_status' ? (
                  <ReferralBadge type={getBadgeType(milestone)} size="medium" />
                ) : (
                  <View style={[
                    styles.iconCircle,
                    { backgroundColor: milestone.isUnlocked ? primaryColor : '#444' }
                  ]}>
                    <Ionicons
                      name={getRewardIcon(milestone) as any}
                      size={24}
                      color="#fff"
                    />
                  </View>
                )}
              </View>
              
              <View style={styles.rewardDetails}>
                <Text style={[styles.rewardDescription, { color: textColor }]}>
                  {milestone.reward.description}
                </Text>
                
                {milestone.reward.type === 'subscription_extension' && milestone.reward.duration && (
                  <Text style={[styles.rewardSubtext, { color: textColor }]}>
                    {milestone.reward.duration} days free
                  </Text>
                )}
                
                {milestone.reward.type === 'premium_trial' && milestone.reward.duration && (
                  <Text style={[styles.rewardSubtext, { color: textColor }]}>
                    {Math.floor(milestone.reward.duration / 30)} months premium
                  </Text>
                )}
                
                {milestone.reward.type === 'cash_or_upgrade' && (
                  <Text style={[styles.rewardSubtext, { color: textColor }]}>
                    ${milestone.reward.amount || 0} or {milestone.reward.upgradeDuration || 0} days Pro
                  </Text>
                )}
              </View>
            </View>
            
            {milestone.isUnlocked && onClaimReward && (
              <TouchableOpacity 
                style={[styles.claimButton, { backgroundColor: primaryColor }]}
                onPress={() => onClaimReward(milestone)}
              >
                <Text style={styles.claimButtonText}>
                  Claim Reward
                </Text>
              </TouchableOpacity>
            )}
            
            {!milestone.isUnlocked && (
              <View style={styles.progressContainer}>
                <Text style={[styles.progressText, { color: textColor }]}>
                  {currentReferrals}/{milestone.count} referrals
                </Text>
                
                <View style={styles.progressBarContainer}>
                  <View 
                    style={[
                      styles.progressBar, 
                      { 
                        width: `${Math.min((currentReferrals / milestone.count) * 100, 100)}%`,
                        backgroundColor: primaryColor 
                      }
                    ]} 
                  />
                </View>
              </View>
            )}
          </NeonCard>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    marginBottom: 24,
    opacity: 0.8,
  },
  rewardsContainer: {
    marginBottom: 20,
  },
  rewardCard: {
    marginBottom: 16,
    padding: 16,
  },
  rewardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  countBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  countText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  rewardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
  },
  rewardContent: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  rewardIconContainer: {
    marginRight: 16,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rewardDetails: {
    flex: 1,
  },
  rewardDescription: {
    fontSize: 14,
    marginBottom: 4,
  },
  rewardSubtext: {
    fontSize: 12,
    opacity: 0.7,
  },
  claimButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  claimButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  progressContainer: {
    marginTop: 8,
  },
  progressText: {
    fontSize: 12,
    marginBottom: 4,
    textAlign: 'right',
  },
  progressBarContainer: {
    height: 6,
    backgroundColor: '#444',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 3,
  },
});

export default ReferralRewards;