import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { auth, functions } from '../config/firebase';
import { httpsCallable } from 'firebase/functions';
import { createGroupSubscription, addGroupMember, removeGroupMember, getGroupSubscription, transferGroupOwnership, MAX_GROUP_MEMBERS } from '../services/groupSubscriptionService';
import { useStripe } from '@stripe/stripe-react-native';
import { ThemedView } from '../components/ThemedView';
import { ThemedText } from '../components/ThemedText';
import { useTheme } from '../contexts/ThemeContext';
// Import analytics service
import { analyticsService } from '../services/analyticsService';

/**
 * GroupSubscriptionScreen component
 * Allows users to create and manage group subscriptions
 */
const GroupSubscriptionScreen: React.FC = () => {
  const navigation = useNavigation<StackNavigationProp<any>>();
  const { colors } = useTheme();
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  
  const [loading, setLoading] = useState<boolean>(false);
  const [groupId, setGroupId] = useState<string | null>(null);
  const [groupData, setGroupData] = useState<any>(null);
  const [memberEmails, setMemberEmails] = useState<string[]>(['', '']);
  const [newMemberEmail, setNewMemberEmail] = useState<string>('');
  const [transferringOwnership, setTransferringOwnership] = useState<boolean>(false);
  const [step, setStep] = useState<'info' | 'payment' | 'manage'>('info');
  
  // Load existing group subscription if any
  useEffect(() => {
    const loadGroupSubscription = async () => {
      try {
        setLoading(true);
        const userId = auth.currentUser?.uid;
        
        if (!userId) {
          navigation.navigate('Login');
          return;
        }
        
        // Check if user already has a group subscription
        const userDoc = await getGroupSubscription(userId);
        
        if (userDoc) {
          setGroupId(userDoc.id);
          setGroupData(userDoc);
          setStep('manage');
        }
      } catch (error) {
        console.error('Error loading group subscription:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadGroupSubscription();
  }, [navigation]);
  
  // Handle member email input change
  const handleMemberEmailChange = (text: string, index: number) => {
    const newEmails = [...memberEmails];
    newEmails[index] = text;
    setMemberEmails(newEmails);
  };
  
  // Handle continue to payment
  const handleContinueToPayment = () => {
    // Filter out empty emails
    const validEmails = memberEmails.filter(email => email.trim() !== '');
    
    // Validate emails
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const invalidEmails = validEmails.filter(email => !emailRegex.test(email));
    
    if (invalidEmails.length > 0) {
      Alert.alert('Invalid Email', 'Please enter valid email addresses for all members.');
      return;
    }
    
    // Set valid emails and continue to payment
    setMemberEmails(validEmails);
    setStep('payment');
  };
  
  // Handle create group subscription
  const handleCreateGroupSubscription = async () => {
    try {
      setLoading(true);
      
      const userId = auth.currentUser?.uid;
      
      if (!userId) {
        navigation.navigate('Login');
        return;
      }
      
      // Call backend to prepare payment
      try {
        // Call the Firebase function to prepare the payment
        const preparePaymentFn = httpsCallable<
          { userId: string; memberEmails: string[] },
          {
            customerId: string;
            ephemeralKey: string;
            clientSecret: string;
          }
        >(functions, 'prepareGroupSubscriptionPayment');
        
        const paymentData = await preparePaymentFn({
          userId,
          memberEmails: memberEmails
        });
        
        if (!paymentData.data || !paymentData.data.clientSecret || !paymentData.data.ephemeralKey) {
          throw new Error('Invalid payment data received from server');
        }
        
        // Initialize payment sheet with dynamic values from backend
        const { error: initError, paymentOption } = await initPaymentSheet({
          merchantDisplayName: 'AI Sports Edge',
          customerId: paymentData.data.customerId,
          customerEphemeralKeySecret: paymentData.data.ephemeralKey,
          paymentIntentClientSecret: paymentData.data.clientSecret,
          defaultBillingDetails: {
            name: auth.currentUser?.displayName || '',
          },
          allowsDelayedPaymentMethods: false,
          style: 'automatic'
        });
        
        if (initError) {
          console.error('Error initializing payment sheet:', initError);
          Alert.alert('Payment Error', `Failed to initialize payment: ${initError.message}. Please try again.`);
          setLoading(false);
          return;
        }
      } catch (error: any) {
        console.error('Error preparing payment:', error);
        Alert.alert('Payment Setup Error', `Failed to prepare payment: ${error.message}. Please try again.`);
        setLoading(false);
        return;
      }
      
      // Present payment sheet
      const { error: presentError } = await presentPaymentSheet();
      
      if (presentError) {
        console.error('Error presenting payment sheet:', presentError);
        Alert.alert('Error', presentError.message || 'Payment failed. Please try again.');
        setLoading(false);
        return;
      }
      
      // For production, we would get the payment method ID from the Stripe API
      // Since we're using a test environment, we'll use a test payment method ID
      const paymentMethodId = 'pm_' + Date.now().toString(); // Generate a unique ID for testing
      
      // Create group subscription
      const result = await createGroupSubscription(
        userId,
        paymentMethodId,
        memberEmails
      );
      
      // Track event
      analyticsService.trackEvent('group_subscription_created', {
        member_count: memberEmails.length + 1, // +1 for the owner
        subscription_type: 'group_pro'
      });
      
      // Set group ID and data
      setGroupId(result.subscriptionId);
      setGroupData(result);
      
      // Show success message
      Alert.alert(
        'Group Subscription Created',
        'Your group subscription has been created successfully!',
        [
          {
            text: 'OK',
            onPress: () => setStep('manage'),
          },
        ]
      );
    } catch (error: any) {
      console.error('Error creating group subscription:', error);
      Alert.alert('Error', error.message || 'Failed to create group subscription. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle add member
  const handleAddMember = async () => {
    try {
      if (!groupId) return;
      
      // Validate email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(newMemberEmail)) {
        Alert.alert('Invalid Email', 'Please enter a valid email address.');
        return;
      }
      
      setLoading(true);
      
      const userId = auth.currentUser?.uid;
      
      if (!userId) {
        navigation.navigate('Login');
        return;
      }
      
      // Check if group is at max capacity
      if (groupData.members.length >= MAX_GROUP_MEMBERS) {
        Alert.alert('Group Full', `Your group subscription is limited to ${MAX_GROUP_MEMBERS} members.`);
        setLoading(false);
        return;
      }
      
      // Add member to group
      const result = await addGroupMember(groupId, newMemberEmail, userId);
      
      // Update group data
      setGroupData(result);
      
      // Clear input
      setNewMemberEmail('');
      
      // Show success message
      Alert.alert('Member Added', 'The member has been added to your group subscription.');
    } catch (error: any) {
      console.error('Error adding member:', error);
      Alert.alert('Error', error.message || 'Failed to add member. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle transfer ownership
  const handleTransferOwnership = async (email: string) => {
    try {
      if (!groupId) return;
      
      setLoading(true);
      
      const userId = auth.currentUser?.uid;
      
      if (!userId) {
        navigation.navigate('Login');
        return;
      }
      
      // Confirm transfer
      Alert.alert(
        'Transfer Ownership',
        `Are you sure you want to transfer ownership to ${email}? You will no longer be the owner of this group subscription.`,
        [
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => setLoading(false),
          },
          {
            text: 'Transfer',
            style: 'default',
            onPress: async () => {
              try {
                setTransferringOwnership(true);
                
                // Transfer ownership
                const result = await transferGroupOwnership(groupId, email, userId);
                
                // Update group data
                setGroupData(result);
                
                // Show success message
                Alert.alert(
                  'Ownership Transferred',
                  `You have successfully transferred ownership to ${email}.`,
                  [
                    {
                      text: 'OK',
                      onPress: () => navigation.goBack(),
                    },
                  ]
                );
              } catch (error: any) {
                console.error('Error transferring ownership:', error);
                Alert.alert('Error', error.message || 'Failed to transfer ownership. Please try again.');
              } finally {
                setTransferringOwnership(false);
                setLoading(false);
              }
            },
          },
        ]
      );
    } catch (error: any) {
      console.error('Error transferring ownership:', error);
      Alert.alert('Error', error.message || 'Failed to transfer ownership. Please try again.');
      setLoading(false);
    }
  };

  // Handle remove member
  const handleRemoveMember = async (email: string) => {
    try {
      if (!groupId) return;
      
      setLoading(true);
      
      const userId = auth.currentUser?.uid;
      
      if (!userId) {
        navigation.navigate('Login');
        return;
      }
      
      // Confirm removal
      Alert.alert(
        'Remove Member',
        `Are you sure you want to remove ${email} from your group subscription?`,
        [
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => setLoading(false),
          },
          {
            text: 'Remove',
            style: 'destructive',
            onPress: async () => {
              try {
                // Remove member from group
                const result = await removeGroupMember(groupId, email, userId);
                
                // Update group data
                setGroupData(result);
                
                // Show success message
                Alert.alert('Member Removed', 'The member has been removed from your group subscription.');
              } catch (error: any) {
                console.error('Error removing member:', error);
                Alert.alert('Error', error.message || 'Failed to remove member. Please try again.');
              } finally {
                setLoading(false);
              }
            },
          },
        ]
      );
    } catch (error: any) {
      console.error('Error removing member:', error);
      Alert.alert('Error', error.message || 'Failed to remove member. Please try again.');
      setLoading(false);
    }
  };
  
  // Render info step
  const renderInfoStep = () => (
    <ScrollView style={styles.scrollContent}>
      <View style={styles.section}>
        <ThemedText style={styles.title}>Group Pro Subscription</ThemedText>
        <ThemedText style={styles.subtitle}>$149.99/month for up to 3 users</ThemedText>
        
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Ionicons name="people" size={24} color={colors.primary} />
            <ThemedText style={styles.infoText}>
              Share premium features with up to 2 friends or family members
            </ThemedText>
          </View>
          
          <View style={styles.infoRow}>
            <Ionicons name="cash" size={24} color={colors.primary} />
            <ThemedText style={styles.infoText}>
              Save $49.98/month compared to individual subscriptions
            </ThemedText>
          </View>
          
          <View style={styles.infoRow}>
            <Ionicons name="shield-checkmark" size={24} color={colors.primary} />
            <ThemedText style={styles.infoText}>
              Each member gets full Pro access to all premium features
            </ThemedText>
          </View>
        </View>
        
        <ThemedText style={styles.sectionTitle}>Add Group Members</ThemedText>
        <ThemedText style={styles.description}>
          Enter the email addresses of up to 2 people you want to invite to your group subscription.
          They will receive an invitation and get immediate access once you complete payment.
        </ThemedText>
        
        {memberEmails.map((email, index) => (
          <View key={index} style={styles.inputContainer}>
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder={`Member ${index + 1} email`}
              placeholderTextColor={colors.secondary}
              value={email}
              onChangeText={(text) => handleMemberEmailChange(text, index)}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
        ))}
        
        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.primary }]}
          onPress={handleContinueToPayment}
          disabled={loading}
        >
          <ThemedText style={styles.buttonText}>Continue to Payment</ThemedText>
        </TouchableOpacity>
        
        <ThemedText style={styles.disclaimer}>
          By continuing, you agree to be charged $149.99/month for your group subscription.
          You can cancel anytime from the subscription management screen.
        </ThemedText>
      </View>
    </ScrollView>
  );
  
  // Render payment step
  const renderPaymentStep = () => (
    <ScrollView style={styles.scrollContent}>
      <View style={styles.section}>
        <ThemedText style={styles.title}>Complete Your Purchase</ThemedText>
        
        <View style={styles.summaryCard}>
          <ThemedText style={styles.summaryTitle}>Order Summary</ThemedText>
          
          <View style={styles.summaryRow}>
            <ThemedText>Group Pro Subscription</ThemedText>
            <ThemedText>$149.99/month</ThemedText>
          </View>
          
          <View style={styles.summaryRow}>
            <ThemedText>Members</ThemedText>
            <ThemedText>{memberEmails.length + 1} users</ThemedText>
          </View>
          
          <View style={styles.divider} />
          
          <View style={styles.summaryRow}>
            <ThemedText style={styles.totalLabel}>Total</ThemedText>
            <ThemedText style={styles.totalAmount}>$149.99/month</ThemedText>
          </View>
        </View>
        
        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.primary }]}
          onPress={handleCreateGroupSubscription}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <ThemedText style={styles.buttonText}>Complete Purchase</ThemedText>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => setStep('info')}
          disabled={loading}
        >
          <ThemedText style={[styles.backButtonText, { color: colors.primary }]}>
            Back to Group Details
          </ThemedText>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
  
  // Render manage step
  const renderManageStep = () => {
    if (!groupData) return null;
    
    return (
      <ScrollView style={styles.scrollContent}>
        <View style={styles.section}>
          <ThemedText style={styles.title}>Manage Group Subscription</ThemedText>
          
          <View style={styles.statusCard}>
            <View style={styles.statusRow}>
              <ThemedText style={styles.statusLabel}>Status:</ThemedText>
              <View style={styles.statusBadge}>
                <ThemedText style={styles.statusText}>
                  {groupData.status === 'active' ? 'Active' : 'Inactive'}
                </ThemedText>
              </View>
            </View>
            
            <View style={styles.statusRow}>
              <ThemedText style={styles.statusLabel}>Next Billing:</ThemedText>
              <ThemedText>
                {groupData.currentPeriodEnd ? new Date(groupData.currentPeriodEnd.seconds * 1000).toLocaleDateString() : 'N/A'}
              </ThemedText>
            </View>
            
            <View style={styles.statusRow}>
              <ThemedText style={styles.statusLabel}>Price:</ThemedText>
              <ThemedText>$149.99/month</ThemedText>
            </View>
          </View>
          
          <ThemedText style={styles.sectionTitle}>Group Members</ThemedText>
          <ThemedText style={styles.description}>
            Your group can have up to {MAX_GROUP_MEMBERS} members (including you).
          </ThemedText>
          
          <View style={styles.membersCard}>
            {/* Owner (current user) */}
            <View style={styles.memberRow}>
              <View style={styles.memberInfo}>
                <Ionicons name="person" size={24} color={colors.primary} />
                <ThemedText style={styles.memberEmail}>
                  {auth.currentUser?.email} (You)
                </ThemedText>
              </View>
              <View style={styles.ownerBadge}>
                <ThemedText style={styles.ownerText}>Owner</ThemedText>
              </View>
            </View>
            
            {/* Other members */}
            {groupData.members.filter((email: string) => email !== auth.currentUser?.email).map((email: string, index: number) => (
              <View key={index} style={styles.memberRow}>
                <View style={styles.memberInfo}>
                  <Ionicons name="person" size={24} color={colors.primary} />
                  <ThemedText style={styles.memberEmail}>{email}</ThemedText>
                </View>
                <View style={styles.memberActions}>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleTransferOwnership(email)}
                    disabled={loading || transferringOwnership}
                  >
                    <Ionicons name="swap-horizontal" size={24} color={colors.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleRemoveMember(email)}
                    disabled={loading}
                  >
                    <Ionicons name="close-circle" size={24} color={colors.error} />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
            
            {/* Add new member if not at max capacity */}
            {groupData.members.length < MAX_GROUP_MEMBERS && (
              <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.addMemberContainer}
              >
                <TextInput
                  style={[styles.input, { color: colors.text, flex: 1 }]}
                  placeholder="Add member email"
                  placeholderTextColor={colors.secondary}
                  value={newMemberEmail}
                  onChangeText={setNewMemberEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  style={[styles.addButton, { backgroundColor: colors.primary }]}
                  onPress={handleAddMember}
                  disabled={loading || !newMemberEmail}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Ionicons name="add" size={24} color="#fff" />
                  )}
                </TouchableOpacity>
              </KeyboardAvoidingView>
            )}
          </View>
          
          <TouchableOpacity
            style={[styles.cancelButton, { borderColor: colors.error }]}
            onPress={() => {
              Alert.alert(
                'Cancel Subscription',
                'Are you sure you want to cancel your group subscription? All members will lose access at the end of the current billing period.',
                [
                  {
                    text: 'No, Keep It',
                    style: 'cancel',
                  },
                  {
                    text: 'Yes, Cancel',
                    style: 'destructive',
                    onPress: async () => {
                      try {
                        setLoading(true);
                        
                        const userId = auth.currentUser?.uid;
                        
                        if (!userId || !groupId) {
                          setLoading(false);
                          return;
                        }
                        
                        // Cancel subscription
                        await removeGroupMember(groupId, userId, userId);
                        
                        // Show success message
                        Alert.alert(
                          'Subscription Canceled',
                          'Your group subscription will be canceled at the end of the current billing period.',
                          [
                            {
                              text: 'OK',
                              onPress: () => navigation.goBack(),
                            },
                          ]
                        );
                      } catch (error: any) {
                        console.error('Error canceling subscription:', error);
                        Alert.alert('Error', error.message || 'Failed to cancel subscription. Please try again.');
                      } finally {
                        setLoading(false);
                      }
                    },
                  },
                ]
              );
            }}
            disabled={loading}
          >
            <ThemedText style={[styles.cancelButtonText, { color: colors.error }]}>
              Cancel Subscription
            </ThemedText>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  };
  
  return (
    <ThemedView style={styles.container}>
      {loading && !groupData && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <ThemedText style={styles.loadingText}>Loading...</ThemedText>
        </View>
      )}
      
      {!loading && step === 'info' && renderInfoStep()}
      {!loading && step === 'payment' && renderPaymentStep()}
      {step === 'manage' && renderManageStep()}
    </ThemedView>
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
    marginTop: 16,
    fontSize: 16,
  },
  scrollContent: {
    flex: 1,
  },
  section: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 24,
    marginBottom: 8,
  },
  description: {
    marginBottom: 16,
    lineHeight: 20,
  },
  infoCard: {
    borderRadius: 8,
    padding: 16,
    marginTop: 16,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  infoText: {
    marginLeft: 12,
    flex: 1,
  },
  inputContainer: {
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  button: {
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  backButton: {
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  backButtonText: {
    fontSize: 16,
  },
  disclaimer: {
    marginTop: 16,
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
  summaryCard: {
    borderRadius: 8,
    padding: 16,
    marginTop: 16,
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  divider: {
    height: 1,
    marginVertical: 12,
  },
  totalLabel: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  totalAmount: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  statusCard: {
    borderRadius: 8,
    padding: 16,
    marginTop: 16,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusLabel: {
    fontWeight: 'bold',
    marginRight: 8,
    width: 100,
  },
  statusBadge: {
    backgroundColor: '#4CAF50',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  membersCard: {
    borderRadius: 8,
    padding: 16,
    marginTop: 16,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  memberEmail: {
    marginLeft: 12,
    flex: 1,
  },
  ownerBadge: {
    backgroundColor: '#2196F3',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  ownerText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  memberActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: 4,
    marginLeft: 8,
  },
  removeButton: {
    padding: 4,
  },
  addMemberContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addButton: {
    borderRadius: 8,
    padding: 12,
    marginLeft: 8,
  },
  cancelButton: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default GroupSubscriptionScreen;