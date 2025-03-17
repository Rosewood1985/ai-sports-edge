import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Share, TextInput, Alert } from 'react-native';
import { auth } from '../config/firebase';
import { rewardsService } from '../services/rewardsService';
import { generateReferralCode, applyReferralCode } from '../services/firebaseSubscriptionService';
import { trackEvent } from '../services/analyticsService';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';
import NeonButton from './ui/NeonButton';
import NeonCard from './ui/NeonCard';
import NeonText from './ui/NeonText';
import { useThemeColor } from '../hooks/useThemeColor';

interface ReferralProgramCardProps {
  isSubscribed?: boolean;
}

export const ReferralProgramCard: React.FC<ReferralProgramCardProps> = ({ isSubscribed = false }) => {
  const [referralCode, setReferralCode] = useState<string>('');
  const [referralCount, setReferralCount] = useState<number>(0);
  const [inputCode, setInputCode] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isApplying, setIsApplying] = useState<boolean>(false);
  const [hasAppliedCode, setHasAppliedCode] = useState<boolean>(false);
  
  const primaryColor = useThemeColor({}, 'tint');
  const textColor = useThemeColor({}, 'text');
  const backgroundColor = useThemeColor({}, 'background');
  const cardColor = useThemeColor({}, 'background');
  
  useEffect(() => {
    loadReferralData();
  }, []);
  
  const loadReferralData = async () => {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) return;
      
      // Get user rewards to check if they already have a referral code
      const userRewards = await rewardsService.getUserRewards(userId);
      if (userRewards) {
        setReferralCount(userRewards.referralCount || 0);
        
        // Check if user has already applied a referral code
        if (userRewards.referredBy) {
          setHasAppliedCode(true);
        }
        
        // If user already has a referral code, use it
        if (userRewards.referralCode) {
          setReferralCode(userRewards.referralCode);
          return;
        }
      }
      
      // If user doesn't have a referral code yet and is subscribed, generate one
      if (isSubscribed && !userRewards?.referralCode) {
        await generateUserReferralCode();
      }
    } catch (error) {
      console.error('Error loading referral data:', error);
    }
  };
  
  const generateUserReferralCode = async () => {
    try {
      setIsLoading(true);
      const userId = auth.currentUser?.uid;
      if (!userId) return;
      
      // Generate a referral code
      const result = await generateReferralCode(userId);
      if (result && result.referralCode) {
        setReferralCode(result.referralCode);
        
        // Track event
        trackEvent('subscription_completed' as any, {
          isNew: result.isNew,
          event_subtype: 'referral_code_generated'
        });
      }
    } catch (error) {
      console.error('Error generating referral code:', error);
      Alert.alert('Error', 'Failed to generate referral code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleShareReferral = async () => {
    if (!referralCode) return;
    
    try {
      const result = await Share.share({
        message: `Join me on AI Sports Edge and get exclusive rewards! Use my referral code: ${referralCode}\n\nDownload the app: https://aisportsedge.com/download`
      });
      
      if (result.action === Share.sharedAction) {
        // Track sharing event
        trackEvent('subscription_completed' as any, {
          event_subtype: 'referral_code_shared',
          method: result.activityType || 'unknown'
        });
      }
    } catch (error) {
      console.error('Error sharing referral code:', error);
      Alert.alert('Error', 'Failed to share referral code. Please try again.');
    }
  };
  
  const handleApplyReferralCode = async () => {
    if (!inputCode || hasAppliedCode) return;
    
    try {
      setIsApplying(true);
      const userId = auth.currentUser?.uid;
      if (!userId) return;
      
      // Apply the referral code
      const result = await applyReferralCode(userId, inputCode);
      
      if (result && result.success) {
        setHasAppliedCode(true);
        setInputCode('');
        
        // Track event
        trackEvent('subscription_completed' as any, {
          event_subtype: 'referral_code_applied',
          referralCode: inputCode
        });
        
        Alert.alert('Success', 'Referral code applied successfully! You\'ll receive your rewards when you subscribe.');
      }
    } catch (error) {
      console.error('Error applying referral code:', error);
      Alert.alert('Error', 'Failed to apply referral code. Please check the code and try again.');
    } finally {
      setIsApplying(false);
    }
  };
  
  return (
    <NeonCard style={styles.container}>
      <NeonText style={styles.title}>Referral Program</NeonText>
      
      <ThemedView style={styles.section}>
        <ThemedText style={styles.sectionTitle}>How It Works</ThemedText>
        <ThemedText style={styles.description}>
          Invite friends to join AI Sports Edge. When they subscribe using your referral code, you'll both receive rewards:
        </ThemedText>
        
        <View style={styles.benefitsList}>
          <ThemedText style={styles.benefitItem}>• You get a 1-month subscription extension</ThemedText>
          <ThemedText style={styles.benefitItem}>• You earn 200 loyalty points</ThemedText>
          <ThemedText style={styles.benefitItem}>• Your friend gets 100 loyalty points</ThemedText>
        </View>
      </ThemedView>
      
      {isSubscribed ? (
        <ThemedView style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Your Referral Code</ThemedText>
          
          {referralCode ? (
            <>
              <View style={styles.codeContainer}>
                <ThemedText style={styles.code}>{referralCode}</ThemedText>
              </View>
              
              <NeonButton 
                onPress={handleShareReferral}
                title="Share Your Code"
                style={styles.shareButton}
              />
              
              <ThemedText style={styles.statsText}>
                You've referred {referralCount} {referralCount === 1 ? 'person' : 'people'} so far
              </ThemedText>
            </>
          ) : (
            <NeonButton
              onPress={generateUserReferralCode}
              title={isLoading ? "Generating..." : "Generate Referral Code"}
              disabled={isLoading}
              style={styles.generateButton}
            />
          )}
        </ThemedView>
      ) : (
        <ThemedView style={styles.section}>
          <ThemedText style={styles.subscribePrompt}>
            Subscribe to generate your own referral code and start earning rewards!
          </ThemedText>
        </ThemedView>
      )}
      
      {!hasAppliedCode && (
        <ThemedView style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Have a Referral Code?</ThemedText>
          
          <TextInput
            style={[styles.input, { color: textColor, borderColor: primaryColor }]}
            placeholder="Enter referral code"
            placeholderTextColor="#888"
            value={inputCode}
            onChangeText={setInputCode}
            autoCapitalize="characters"
          />
          
          <NeonButton
            onPress={handleApplyReferralCode}
            title={isApplying ? "Applying..." : "Apply Code"}
            disabled={isApplying || !inputCode}
            style={styles.applyButton}
          />
        </ThemedView>
      )}
    </NeonCard>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 12,
    padding: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    marginBottom: 12,
    lineHeight: 20,
  },
  benefitsList: {
    marginTop: 8,
    marginBottom: 16,
  },
  benefitItem: {
    fontSize: 14,
    marginBottom: 4,
    lineHeight: 20,
  },
  codeContainer: {
    borderWidth: 1,
    borderColor: '#444',
    borderRadius: 8,
    padding: 12,
    marginVertical: 12,
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  code: {
    fontSize: 20,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  shareButton: {
    marginVertical: 12,
  },
  generateButton: {
    marginVertical: 12,
  },
  statsText: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
  },
  subscribePrompt: {
    fontSize: 16,
    textAlign: 'center',
    fontStyle: 'italic',
    marginVertical: 12,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    marginVertical: 12,
  },
  applyButton: {
    marginVertical: 8,
  },
});