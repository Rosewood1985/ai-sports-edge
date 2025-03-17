import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Clipboard,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { auth } from '../config/firebase';
import { rewardsService } from '../services/rewardsService';
import { useThemeColor } from '../hooks/useThemeColor';
import NeonCard from './ui/NeonCard';
import NeonText from './ui/NeonText';
import NeonButton from './ui/NeonButton';
import ReferralShareOptions from './ReferralShareOptions';

interface ReferralProgramCardProps {
  onViewLeaderboard?: () => void;
  onViewMilestones?: () => void;
}

/**
 * ReferralProgramCard component displays the user's referral code and basic stats
 * @param {ReferralProgramCardProps} props - Component props
 * @returns {JSX.Element} - Rendered component
 */
const ReferralProgramCard: React.FC<ReferralProgramCardProps> = ({
  onViewLeaderboard,
  onViewMilestones
}) => {
  const [referralCode, setReferralCode] = useState<string>('');
  const [referralCount, setReferralCount] = useState<number>(0);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isSubscribed, setIsSubscribed] = useState<boolean>(false);
  const [shareModalVisible, setShareModalVisible] = useState<boolean>(false);
  
  const primaryColor = useThemeColor({}, 'tint');
  const textColor = useThemeColor({}, 'text');
  
  useEffect(() => {
    loadReferralData();
  }, []);
  
  const loadReferralData = async () => {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) return;
      
      // Get user rewards data
      const rewards = await rewardsService.getUserRewards(userId);
      
      // Set referral code if it exists
      if (rewards?.referralCode) {
        setReferralCode(rewards.referralCode);
      }
      
      // Set referral count
      setReferralCount(rewards?.referralCount || 0);
      
      // Check if user is subscribed (simplified for now)
      setIsSubscribed(true); // In a real app, check subscription status
    } catch (error) {
      console.error('Error loading referral data:', error);
    }
  };
  
  const handleGenerateReferralCode = async () => {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) return;
      
      setIsGenerating(true);
      const code = await rewardsService.generateReferralCode(userId);
      setReferralCode(code);
    } catch (error) {
      console.error('Error generating referral code:', error);
      Alert.alert('Error', 'Failed to generate referral code. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };
  
  const handleCopyReferralCode = () => {
    Clipboard.setString(referralCode);
    Alert.alert('Copied!', 'Referral code copied to clipboard');
  };
  
  const handleShareReferralCode = () => {
    setShareModalVisible(true);
  };
  
  const handleCloseShareModal = () => {
    setShareModalVisible(false);
  };
  
  return (
    <NeonCard style={styles.container}>
      <View style={styles.header}>
        <NeonText type="subheading" glow={true}>
          Refer Friends & Earn Rewards
        </NeonText>
        
        {onViewLeaderboard && (
          <TouchableOpacity onPress={onViewLeaderboard} style={styles.leaderboardButton}>
            <Ionicons name="trophy" size={20} color={primaryColor} />
          </TouchableOpacity>
        )}
      </View>
      
      <Text style={[styles.description, { color: textColor }]}>
        Invite friends to join AI Sports Edge. You'll both receive rewards when they subscribe!
      </Text>
      
      {isSubscribed ? (
        <>
          {referralCode ? (
            <View style={styles.codeSection}>
              <Text style={[styles.codeLabel, { color: textColor }]}>
                Your Referral Code:
              </Text>
              
              <View style={styles.codeContainer}>
                <Text style={[styles.code, { color: primaryColor }]}>
                  {referralCode}
                </Text>
                
                <View style={styles.codeActions}>
                  <TouchableOpacity 
                    onPress={handleCopyReferralCode}
                    style={styles.iconButton}
                  >
                    <Ionicons name="copy-outline" size={20} color={primaryColor} />
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    onPress={handleShareReferralCode}
                    style={styles.iconButton}
                  >
                    <Ionicons name="share-social-outline" size={20} color={primaryColor} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ) : (
            <NeonButton
              title={isGenerating ? "Generating..." : "Generate Referral Code"}
              onPress={handleGenerateReferralCode}
              disabled={isGenerating}
              style={styles.generateButton}
            />
          )}
          
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: primaryColor }]}>
                {referralCount}
              </Text>
              <Text style={[styles.statLabel, { color: textColor }]}>
                Friends Referred
              </Text>
            </View>
            
            {onViewMilestones && (
              <TouchableOpacity 
                style={styles.viewMilestonesButton}
                onPress={onViewMilestones}
              >
                <Text style={[styles.viewMilestonesText, { color: primaryColor }]}>
                  View Milestones
                </Text>
                <Ionicons name="chevron-forward" size={16} color={primaryColor} />
              </TouchableOpacity>
            )}
          </View>
        </>
      ) : (
        <View style={styles.subscribePrompt}>
          <Text style={[styles.subscribeText, { color: textColor }]}>
            Subscribe to generate your own referral code and start earning rewards!
          </Text>
          
          <NeonButton
            title="Subscribe Now"
            onPress={() => {}} // Navigate to subscription screen
            style={styles.subscribeButton}
          />
        </View>
      )}
      
      {/* Share Options Modal */}
      <ReferralShareOptions
        visible={shareModalVisible}
        onClose={handleCloseShareModal}
        referralCode={referralCode}
        appLink="https://aisportsedge.com/download"
      />
    </NeonCard>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 12,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  leaderboardButton: {
    padding: 8,
  },
  description: {
    fontSize: 14,
    marginBottom: 16,
    opacity: 0.8,
  },
  codeSection: {
    marginBottom: 16,
  },
  codeLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  codeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#444',
    borderRadius: 8,
    padding: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  code: {
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  codeActions: {
    flexDirection: 'row',
  },
  iconButton: {
    padding: 8,
    marginLeft: 8,
  },
  generateButton: {
    marginBottom: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
    opacity: 0.8,
  },
  viewMilestonesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  viewMilestonesText: {
    fontSize: 14,
    marginRight: 4,
  },
  subscribePrompt: {
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'rgba(52, 152, 219, 0.1)',
    borderRadius: 8,
  },
  subscribeText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
  subscribeButton: {
    minWidth: 150,
  },
});

export default ReferralProgramCard;