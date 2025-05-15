// ✅ MIGRATED: Firebase Atomic Architecture
import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { redeemGiftSubscription, getGiftSubscriptionByCode } from '../services/subscriptionService';
import { auth } from '../config/firebase';
import { ThemedText } from '../components/ThemedText';
import { ThemedView } from '../components/ThemedView';

const RedeemGiftScreen: React.FC = () => {
  const navigation = useNavigation<StackNavigationProp<any>>();
  const [giftCode, setGiftCode] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [success, setSuccess] = useState<boolean>(false);
  const [subscriptionDetails, setSubscriptionDetails] = useState<any>(null);
  
  // Handle gift code redemption
  const handleRedeemGift = async () => {
    if (!giftCode.trim()) {
      Alert.alert('Error', 'Please enter a gift code.');
      return;
    }
    
    try {
      setLoading(true);
      
      // Check if the user is logged in
      const userId = auth.currentUser?.uid;
      if (!userId) {
        Alert.alert('Error', 'You must be logged in to redeem a gift subscription.');
        setLoading(false);
        return;
      }
      
      // First, check if the gift code is valid
      const giftSubscription = await getGiftSubscriptionByCode(giftCode);
      
      if (!giftSubscription) {
        Alert.alert('Error', 'Invalid gift code. Please check and try again.');
        setLoading(false);
        return;
      }
      
      if (giftSubscription.status === 'redeemed') {
        Alert.alert('Error', 'This gift code has already been redeemed.');
        setLoading(false);
        return;
      }
      
      if (giftSubscription.status === 'expired') {
        Alert.alert('Error', 'This gift code has expired.');
        setLoading(false);
        return;
      }
      
      // Redeem the gift subscription
      const subscription = await redeemGiftSubscription(userId, giftCode);
      
      // Show success message
      setSuccess(true);
      setSubscriptionDetails(subscription);
      
    } catch (error: any) {
      console.error('Error redeeming gift subscription:', error);
      Alert.alert('Error', error.message || 'Failed to redeem gift subscription. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Format date for display
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  
  // Render success screen
  if (success && subscriptionDetails) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.successContainer}>
          <Text style={styles.successTitle}>Gift Redeemed Successfully!</Text>
          
          <View style={styles.successIconContainer}>
            <Text style={styles.successIcon}>🎁</Text>
          </View>
          
          <Text style={styles.successMessage}>
            Your gift subscription has been activated successfully. You now have access to all premium features.
          </Text>
          
          <View style={styles.detailsContainer}>
            <Text style={styles.detailsTitle}>Subscription Details</Text>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Status:</Text>
              <Text style={styles.detailValue}>Active</Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Expires:</Text>
              <Text style={styles.detailValue}>
                {formatDate(subscriptionDetails.currentPeriodEnd)}
              </Text>
            </View>
          </View>
          
          <TouchableOpacity 
            style={styles.doneButton}
            onPress={() => navigation.navigate('Dashboard')}
          >
            <Text style={styles.doneButtonText}>Start Exploring</Text>
          </TouchableOpacity>
        </View>
      </ThemedView>
    );
  }
  
  return (
    <ThemedView style={styles.container}>
      <ThemedText style={styles.title}>Redeem Gift Subscription</ThemedText>
      
      <ThemedText style={styles.description}>
        Enter your gift code below to activate your premium subscription.
      </ThemedText>
      
      <View style={styles.codeInputContainer}>
        <TextInput
          style={styles.codeInput}
          value={giftCode}
          onChangeText={setGiftCode}
          placeholder="Enter gift code"
          autoCapitalize="characters"
          autoCorrect={false}
          maxLength={20}
        />
      </View>
      
      <TouchableOpacity
        style={styles.redeemButton}
        onPress={handleRedeemGift}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator size="small" color="#ffffff" />
        ) : (
          <Text style={styles.redeemButtonText}>Redeem Gift</Text>
        )}
      </TouchableOpacity>
      
      <ThemedText style={styles.helpText}>
        If you received a gift subscription from a friend, they should have provided you with a gift code.
        Enter it above to activate your premium access.
      </ThemedText>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 22,
  },
  codeInputContainer: {
    marginBottom: 24,
  },
  codeInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 16,
    fontSize: 18,
    textAlign: 'center',
    letterSpacing: 2,
    backgroundColor: '#fff',
  },
  redeemButton: {
    backgroundColor: '#4080ff',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  redeemButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  helpText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  successContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
    color: '#4080ff',
    textAlign: 'center',
  },
  successIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f0f7ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  successIcon: {
    fontSize: 40,
  },
  successMessage: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  detailsContainer: {
    width: '100%',
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 16,
    marginBottom: 32,
  },
  detailsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 16,
    color: '#666',
  },
  detailValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  doneButton: {
    backgroundColor: '#4080ff',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    width: '100%',
  },
  doneButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default RedeemGiftScreen;