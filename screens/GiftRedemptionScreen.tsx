import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';

import { NeonContainer, NeonText, NeonButton } from '../atomic/atoms';
import { Header } from '../atomic/organisms';
import { auth } from '../config/firebase';
import { useTheme } from '../contexts/ThemeContext';
import { redeemGiftSubscription } from '../services/firebaseSubscriptionService';

/**
 * Screen for redeeming gift subscription codes
 */
const GiftRedemptionScreen: React.FC = () => {
  const [giftCode, setGiftCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expirationDate, setExpirationDate] = useState<Date | null>(null);

  const navigation = useNavigation();
  const { colors, isDark } = useTheme();

  const handleRedeemGift = async () => {
    if (!giftCode.trim()) {
      setError('Please enter a gift code');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const userId = auth.currentUser?.uid;
      if (!userId) {
        Alert.alert('Error', 'You must be logged in to redeem a gift subscription');
        setLoading(false);
        return;
      }

      const result = await redeemGiftSubscription(userId, giftCode.trim());

      if (result.success) {
        setSuccess(true);
        if (result.expiresAt) {
          setExpirationDate(new Date(result.expiresAt));
        }
      } else {
        setError('Failed to redeem gift code. Please try again.');
      }
    } catch (err: any) {
      console.error('Error redeeming gift code:', err);
      setError(err.message || 'An error occurred while redeeming the gift code');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const renderSuccessContent = () => (
    <View style={styles.successContainer}>
      <View style={[styles.iconContainer, { backgroundColor: colors.primary }]}>
        <Ionicons name="checkmark" size={48} color="#FFFFFF" />
      </View>

      <NeonText type="heading" glow style={styles.successTitle}>
        Gift Redeemed!
      </NeonText>

      <Text style={[styles.successMessage, { color: colors.text }]}>
        Your gift subscription has been successfully activated.
        {expirationDate && ` It will expire on ${formatDate(expirationDate)}.`}
      </Text>

      <NeonButton
        title="GO TO SUBSCRIPTION"
        onPress={() => navigation.navigate('SubscriptionManagementScreen' as never)}
        type="primary"
        style={styles.subscriptionButton}
      />

      <TouchableOpacity
        style={styles.homeButton}
        onPress={() => navigation.navigate('Odds' as never)}
      >
        <Text style={[styles.homeButtonText, { color: colors.primary }]}>Return to Home</Text>
      </TouchableOpacity>
    </View>
  );

  const renderRedemptionForm = () => (
    <View style={styles.formContainer}>
      <NeonText type="heading" glow style={styles.title}>
        Redeem Gift
      </NeonText>

      <Text style={[styles.description, { color: colors.text }]}>
        Enter your gift code below to activate your subscription.
      </Text>

      <View
        style={[
          styles.inputContainer,
          {
            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
            borderColor: error ? colors.error : colors.border,
          },
        ]}
      >
        <TextInput
          style={[styles.input, { color: colors.text }]}
          placeholder="Enter gift code"
          placeholderTextColor={isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)'}
          value={giftCode}
          onChangeText={setGiftCode}
          autoCapitalize="characters"
          autoCorrect={false}
          editable={!loading}
        />
      </View>

      {error && <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>}

      <NeonButton
        title="REDEEM"
        onPress={handleRedeemGift}
        type="primary"
        style={styles.redeemButton}
        loading={loading}
        disabled={loading || !giftCode.trim()}
      />

      <View style={styles.infoContainer}>
        <Ionicons name="information-circle-outline" size={20} color={colors.text} />
        <Text style={[styles.infoText, { color: colors.text }]}>
          Gift codes are case-sensitive and must be entered exactly as received.
        </Text>
      </View>
    </View>
  );

  return (
    <NeonContainer>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <Header title="Gift Redemption" onRefresh={() => {}} isLoading={loading} />

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {success ? renderSuccessContent() : renderRedemptionForm()}
        </ScrollView>
      </KeyboardAvoidingView>
    </NeonContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  formContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  title: {
    fontSize: 28,
    marginBottom: 16,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
    opacity: 0.8,
  },
  inputContainer: {
    width: '100%',
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
  },
  input: {
    fontSize: 18,
    textAlign: 'center',
    letterSpacing: 2,
  },
  errorText: {
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
  },
  redeemButton: {
    width: '100%',
    marginTop: 8,
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 24,
    paddingHorizontal: 16,
  },
  infoText: {
    fontSize: 14,
    marginLeft: 8,
    opacity: 0.7,
    flex: 1,
  },
  successContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 28,
    marginBottom: 16,
    textAlign: 'center',
  },
  successMessage: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
    paddingHorizontal: 20,
    lineHeight: 24,
  },
  subscriptionButton: {
    width: '100%',
    marginBottom: 16,
  },
  homeButton: {
    paddingVertical: 12,
  },
  homeButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default GiftRedemptionScreen;
