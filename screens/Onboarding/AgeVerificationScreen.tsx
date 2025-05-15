import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useTheme } from '@react-navigation/native';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../hooks/useAuth';
import { ThemedView, ThemedText } from '../../components/ThemedComponents';
import { Ionicons } from '@expo/vector-icons';
import { OnboardingStackParamList } from '../../navigation/OnboardingNavigator';
import { saveVerificationData } from '../../services/userService';

type AgeVerificationScreenNavigationProp = StackNavigationProp<
  OnboardingStackParamList,
  'AgeVerification'
>;

const AgeVerificationScreen = () => {
  const navigation = useNavigation<AgeVerificationScreenNavigationProp>();
  const { colors } = useTheme();
  const { t } = useLanguage();
  const { user, updateUserProfile } = useAuth();
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  
  const handleContinue = async () => {
    if (!user) {
      Alert.alert(
        t('common.error'),
        t('common.not_authenticated'),
        [{ text: t('common.ok') }]
      );
      return;
    }
    
    if (!ageConfirmed) {
      Alert.alert(
        t('age_verification.alert_title'),
        t('age_verification.alert_message'),
        [{ text: t('common.ok') }]
      );
      return;
    }
    
    try {
      // Save age confirmation to user profile
      await saveVerificationData(user.uid, 'ageVerification', {
        confirmed: true
      });
      
      // Navigate to next screen (Self-Exclusion)
      navigation.navigate('SelfExclusion');
    } catch (error) {
      console.error('Error saving age verification:', error);
      Alert.alert(
        t('common.error'),
        t('age_verification.save_error'),
        [{ text: t('common.ok') }]
      );
    }
  };
  
  return (
    <ThemedView style={styles.container}>
      <View style={styles.content}>
        <ThemedText style={styles.title}>
          {t('age_verification.title')}
        </ThemedText>
        
        <ThemedText style={styles.description}>
          {t('age_verification.description')}
        </ThemedText>
        
        <TouchableOpacity
          style={styles.checkboxContainer}
          onPress={() => setAgeConfirmed(!ageConfirmed)}
          accessible={true}
          accessibilityLabel={t('age_verification.confirmation')}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: ageConfirmed }}
        >
          <View style={[
            styles.checkbox,
            { borderColor: colors.text }
          ]}>
            {ageConfirmed && (
              <Ionicons
                name="checkmark"
                size={18}
                color={colors.primary}
              />
            )}
          </View>
          <ThemedText style={styles.checkboxLabel}>
            {t('age_verification.confirmation')}
          </ThemedText>
        </TouchableOpacity>
        
        <ThemedText style={styles.legalText}>
          {t('age_verification.legal_text')}
        </ThemedText>
        
        <TouchableOpacity
          style={[
            styles.continueButton,
            {
              backgroundColor: colors.primary,
              opacity: ageConfirmed ? 1 : 0.5
            }
          ]}
          onPress={handleContinue}
          disabled={!ageConfirmed}
          accessible={true}
          accessibilityLabel={t('common.continue')}
          accessibilityRole="button"
          accessibilityState={{ disabled: !ageConfirmed }}
        >
          <Text style={styles.continueButtonText}>
            {t('common.continue')}
          </Text>
        </TouchableOpacity>
        
        <ThemedText style={styles.disclaimer}>
          {t('age_verification.disclaimer')}
        </ThemedText>
      </View>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
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
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 24,
    padding: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 8,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderRadius: 4,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxLabel: {
    flex: 1,
    fontSize: 16,
  },
  legalText: {
    fontSize: 14,
    marginBottom: 24,
    textAlign: 'center',
  },
  continueButton: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  continueButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  disclaimer: {
    fontSize: 14,
    textAlign: 'center',
    opacity: 0.7,
  },
});

export default AgeVerificationScreen;