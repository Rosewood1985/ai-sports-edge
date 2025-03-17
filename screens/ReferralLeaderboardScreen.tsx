import React, { useState, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  ScrollView, 
  ActivityIndicator, 
  Text,
  TouchableOpacity,
  Share
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { auth } from '../config/firebase';
import { rewardsService } from '../services/rewardsService';
import ReferralLeaderboard from '../components/ReferralLeaderboard';
import { useThemeColor } from '../hooks/useThemeColor';
import { NeonText, NeonContainer, NeonButton } from '../components/ui';

type RootStackParamList = {
  SubscriptionScreen: undefined;
  // Other screens...
};

type ReferralLeaderboardScreenNavigationProp = StackNavigationProp<RootStackParamList, 'SubscriptionScreen'>;

/**
 * ReferralLeaderboardScreen component displays the referral leaderboard and referral program details
 * @returns {JSX.Element} - Rendered component
 */
const ReferralLeaderboardScreen = (): JSX.Element => {
  const [referralCode, setReferralCode] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isSubscribed, setIsSubscribed] = useState<boolean>(false);
  
  const navigation = useNavigation<ReferralLeaderboardScreenNavigationProp>();
  const primaryColor = useThemeColor({}, 'tint');
  const textColor = useThemeColor({}, 'text');
  
  useEffect(() => {
    checkSubscriptionStatus();
    loadReferralCode();
  }, []);
  
  const checkSubscriptionStatus = async () => {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) return;
      
      // In a real app, this would check the user's subscription status
      // For now, we'll simulate this
      const userRewards = await rewardsService.getUserRewards(userId);
      setIsSubscribed(!!userRewards?.subscriptionExtensions || Math.random() > 0.5);
    } catch (error) {
      console.error('Error checking subscription status:', error);
    }
  };
  
  const loadReferralCode = async () => {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) return;
      
      const userRewards = await rewardsService.getUserRewards(userId);
      if (userRewards?.referralCode) {
        setReferralCode(userRewards.referralCode);
      }
    } catch (error) {
      console.error('Error loading referral code:', error);
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
    } finally {
      setIsGenerating(false);
    }
  };
  
  const handleShareReferralCode = async () => {
    if (!referralCode) return;
    
    try {
      await Share.share({
        message: `Join me on AI Sports Edge and get exclusive rewards! Use my referral code: ${referralCode}\n\nDownload the app: https://aisportsedge.com/download`
      });
    } catch (error) {
      console.error('Error sharing referral code:', error);
    }
  };
  
  const handleSubscribe = () => {
    navigation.navigate('SubscriptionScreen');
  };
  
  return (
    <NeonContainer>
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        <View style={styles.header}>
          <NeonText type="heading" glow={true}>Referral Leaderboard</NeonText>
          <Text style={[styles.subtitle, { color: textColor }]}>
            Refer friends and climb the ranks!
          </Text>
        </View>
        
        {/* Referral Program Info */}
        <View style={styles.infoSection}>
          <NeonText type="subheading" glow={true} style={styles.sectionTitle}>
            How It Works
          </NeonText>
          
          <Text style={[styles.infoText, { color: textColor }]}>
            Invite friends to join AI Sports Edge. When they subscribe using your referral code, you'll both receive rewards:
          </Text>
          
          <View style={styles.benefitsList}>
            <View style={styles.benefitItem}>
              <Ionicons name="calendar" size={20} color={primaryColor} style={styles.benefitIcon} />
              <Text style={[styles.benefitText, { color: textColor }]}>
                You get a 1-month subscription extension
              </Text>
            </View>
            
            <View style={styles.benefitItem}>
              <Ionicons name="star" size={20} color={primaryColor} style={styles.benefitIcon} />
              <Text style={[styles.benefitText, { color: textColor }]}>
                You earn 200 loyalty points
              </Text>
            </View>
            
            <View style={styles.benefitItem}>
              <Ionicons name="gift" size={20} color={primaryColor} style={styles.benefitIcon} />
              <Text style={[styles.benefitText, { color: textColor }]}>
                Your friend gets 100 loyalty points
              </Text>
            </View>
          </View>
        </View>
        
        {/* Referral Code Section */}
        <View style={styles.codeSection}>
          <NeonText type="subheading" glow={true} style={styles.sectionTitle}>
            Your Referral Code
          </NeonText>
          
          {isSubscribed ? (
            <>
              {referralCode ? (
                <>
                  <View style={styles.codeContainer}>
                    <Text style={[styles.code, { color: primaryColor }]}>{referralCode}</Text>
                  </View>
                  
                  <NeonButton
                    title="Share Your Code"
                    onPress={handleShareReferralCode}
                    style={styles.shareButton}
                    icon={<Ionicons name="share-social" size={18} color="#fff" />}
                    iconPosition="left"
                  />
                </>
              ) : (
                <NeonButton
                  title={isGenerating ? "Generating..." : "Generate Referral Code"}
                  onPress={handleGenerateReferralCode}
                  disabled={isGenerating}
                  style={styles.generateButton}
                />
              )}
            </>
          ) : (
            <View style={styles.subscribePromptContainer}>
              <Text style={[styles.subscribePrompt, { color: textColor }]}>
                Subscribe to generate your own referral code and start earning rewards!
              </Text>
              
              <NeonButton
                title="Subscribe Now"
                onPress={handleSubscribe}
                style={styles.subscribeButton}
              />
            </View>
          )}
        </View>
        
        {/* Leaderboard */}
        <ReferralLeaderboard limit={20} />
      </ScrollView>
    </NeonContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  subtitle: {
    fontSize: 16,
    marginTop: 8,
    opacity: 0.8,
  },
  infoSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  benefitsList: {
    marginTop: 8,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  benefitIcon: {
    marginRight: 12,
  },
  benefitText: {
    fontSize: 14,
    flex: 1,
  },
  codeSection: {
    marginBottom: 24,
  },
  codeContainer: {
    borderWidth: 1,
    borderColor: '#444',
    borderRadius: 8,
    padding: 16,
    marginVertical: 12,
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  code: {
    fontSize: 24,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  shareButton: {
    marginVertical: 12,
  },
  generateButton: {
    marginVertical: 12,
  },
  subscribePromptContainer: {
    padding: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(52, 152, 219, 0.1)',
    marginVertical: 12,
  },
  subscribePrompt: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
  subscribeButton: {
    marginTop: 8,
  },
});

export default ReferralLeaderboardScreen;