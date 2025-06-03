import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useTheme } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';

import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../hooks/useAuth';
import { OnboardingStackParamList } from '../../navigation/OnboardingNavigator';
import { saveVerificationData } from '../../services/userService';
import { ThemedText } from '../atomic/atoms/ThemedText';
import { ThemedView } from '../atomic/atoms/ThemedView';

type GDPRConsentScreenNavigationProp = StackNavigationProp<OnboardingStackParamList, 'GDPRConsent'>;

const GDPRConsentScreen = () => {
  const navigation = useNavigation<GDPRConsentScreenNavigationProp>();
  const { colors } = useTheme();
  const { t } = useLanguage();
  const { user } = useAuth();

  // Consent options
  const [essentialConsent, setEssentialConsent] = useState(true); // Always required
  const [analyticsConsent, setAnalyticsConsent] = useState(false);
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [thirdPartyConsent, setThirdPartyConsent] = useState(false);

  const handleContinue = async () => {
    if (!user) {
      Alert.alert(t('common.error'), t('common.not_authenticated'), [{ text: t('common.ok') }]);
      return;
    }

    try {
      // Save GDPR consent to user profile
      await saveVerificationData(user.uid, 'gdprConsent', {
        essentialConsent,
        analyticsConsent,
        marketingConsent,
        thirdPartyConsent,
        timestamp: new Date().toISOString(),
      });

      // Navigate to next screen (Cookie Consent or Age Verification)
      navigation.navigate('CookieConsent');
    } catch (error) {
      console.error('Error saving GDPR consent:', error);
      Alert.alert(t('common.error'), t('gdpr.save_error'), [{ text: t('common.ok') }]);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          <ThemedText style={styles.title}>{t('gdpr.title')}</ThemedText>

          <ThemedText style={styles.description}>{t('gdpr.description')}</ThemedText>

          {/* Essential Data - Always required */}
          <View style={styles.consentSection}>
            <View style={styles.consentHeader}>
              <ThemedText style={styles.consentTitle}>{t('gdpr.essential_title')}</ThemedText>
              <View
                style={[
                  styles.checkbox,
                  {
                    backgroundColor: colors.primary,
                    borderColor: colors.primary,
                  },
                ]}
              >
                <Ionicons name="checkmark" size={18} color="white" />
              </View>
            </View>

            <ThemedText style={styles.consentDescription}>
              {t('gdpr.essential_description')}
            </ThemedText>
          </View>

          {/* Analytics Data */}
          <TouchableOpacity
            style={styles.consentSection}
            onPress={() => setAnalyticsConsent(!analyticsConsent)}
            accessible
            accessibilityLabel={t('gdpr.analytics_title')}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: analyticsConsent }}
          >
            <View style={styles.consentHeader}>
              <ThemedText style={styles.consentTitle}>{t('gdpr.analytics_title')}</ThemedText>
              <View
                style={[
                  styles.checkbox,
                  {
                    backgroundColor: analyticsConsent ? colors.primary : 'transparent',
                    borderColor: colors.primary,
                  },
                ]}
              >
                {analyticsConsent && <Ionicons name="checkmark" size={18} color="white" />}
              </View>
            </View>

            <ThemedText style={styles.consentDescription}>
              {t('gdpr.analytics_description')}
            </ThemedText>
          </TouchableOpacity>

          {/* Marketing Data */}
          <TouchableOpacity
            style={styles.consentSection}
            onPress={() => setMarketingConsent(!marketingConsent)}
            accessible
            accessibilityLabel={t('gdpr.marketing_title')}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: marketingConsent }}
          >
            <View style={styles.consentHeader}>
              <ThemedText style={styles.consentTitle}>{t('gdpr.marketing_title')}</ThemedText>
              <View
                style={[
                  styles.checkbox,
                  {
                    backgroundColor: marketingConsent ? colors.primary : 'transparent',
                    borderColor: colors.primary,
                  },
                ]}
              >
                {marketingConsent && <Ionicons name="checkmark" size={18} color="white" />}
              </View>
            </View>

            <ThemedText style={styles.consentDescription}>
              {t('gdpr.marketing_description')}
            </ThemedText>
          </TouchableOpacity>

          {/* Third-Party Data */}
          <TouchableOpacity
            style={styles.consentSection}
            onPress={() => setThirdPartyConsent(!thirdPartyConsent)}
            accessible
            accessibilityLabel={t('gdpr.third_party_title')}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: thirdPartyConsent }}
          >
            <View style={styles.consentHeader}>
              <ThemedText style={styles.consentTitle}>{t('gdpr.third_party_title')}</ThemedText>
              <View
                style={[
                  styles.checkbox,
                  {
                    backgroundColor: thirdPartyConsent ? colors.primary : 'transparent',
                    borderColor: colors.primary,
                  },
                ]}
              >
                {thirdPartyConsent && <Ionicons name="checkmark" size={18} color="white" />}
              </View>
            </View>

            <ThemedText style={styles.consentDescription}>
              {t('gdpr.third_party_description')}
            </ThemedText>
          </TouchableOpacity>

          <ThemedText style={styles.privacyNote}>{t('gdpr.privacy_note')}</ThemedText>

          <TouchableOpacity
            style={[styles.continueButton, { backgroundColor: colors.primary }]}
            onPress={handleContinue}
            accessible
            accessibilityLabel={t('gdpr.continue')}
            accessibilityRole="button"
          >
            <Text style={styles.continueButtonText}>{t('gdpr.continue')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.privacyLink}
            onPress={() => {
              // Navigate to privacy policy
              navigation.navigate('Legal', { type: 'privacy-policy' });
            }}
            accessible
            accessibilityLabel={t('gdpr.view_privacy_policy')}
            accessibilityRole="link"
          >
            <ThemedText style={[styles.privacyLinkText, { color: colors.primary }]}>
              {t('gdpr.view_privacy_policy')}
            </ThemedText>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 24,
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
  consentSection: {
    marginBottom: 20,
    padding: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  consentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  consentTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  consentDescription: {
    fontSize: 14,
  },
  privacyNote: {
    fontSize: 14,
    marginBottom: 24,
    fontStyle: 'italic',
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
  privacyLink: {
    alignItems: 'center',
    marginBottom: 24,
  },
  privacyLinkText: {
    fontSize: 14,
    textDecorationLine: 'underline',
  },
});

export default GDPRConsentScreen;
