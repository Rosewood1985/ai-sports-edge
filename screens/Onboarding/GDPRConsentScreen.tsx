import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useTheme } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';

import { AccessibleThemedText } from '../../atomic/atoms/AccessibleThemedText';
import { AccessibleThemedView } from '../../atomic/atoms/AccessibleThemedView';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../hooks/useAuth';
import { OnboardingStackParamList } from '../../navigation/OnboardingNavigator';
import { saveVerificationData } from '../../services/userService';

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
  const [termsAccepted, setTermsAccepted] = useState(false); // Terms of Service acceptance

  const handleContinue = async () => {
    if (!user) {
      Alert.alert(t('common.error'), t('common.not_authenticated'), [{ text: t('common.ok') }]);
      return;
    }

    // Validate Terms of Service acceptance
    if (!termsAccepted) {
      Alert.alert(t('common.error'), t('gdpr.terms_required'), [{ text: t('common.ok') }]);
      return;
    }

    try {
      // Save GDPR consent to user profile
      await saveVerificationData(user.uid, 'gdprConsent', {
        essentialConsent,
        analyticsConsent,
        marketingConsent,
        thirdPartyConsent,
        termsAccepted,
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
    <AccessibleThemedView style={styles.container} accessibilityLabel={t('gdpr.screen_title')}>
      <ScrollView style={styles.scrollView} accessibilityLabel={t('gdpr.consent_options')}>
        <View style={styles.content}>
          <AccessibleThemedText style={styles.title} type="h1" accessibilityLabel={t('gdpr.title')}>
            {t('gdpr.title')}
          </AccessibleThemedText>

          <AccessibleThemedText
            style={styles.description}
            type="bodyStd"
            accessibilityLabel={t('gdpr.description')}
          >
            {t('gdpr.description')}
          </AccessibleThemedText>

          {/* Essential Data - Always required */}
          <View style={styles.consentSection} accessibilityLabel={t('gdpr.essential_section')}>
            <View style={styles.consentHeader}>
              <AccessibleThemedText
                style={styles.consentTitle}
                type="h2"
                accessibilityLabel={t('gdpr.essential_title')}
              >
                {t('gdpr.essential_title')}
              </AccessibleThemedText>
              <View
                style={[
                  styles.checkbox,
                  {
                    backgroundColor: colors.primary,
                    borderColor: colors.primary,
                  },
                ]}
                accessibilityLabel={t('gdpr.required')}
              >
                <Ionicons name="checkmark" size={18} color="white" />
              </View>
            </View>

            <AccessibleThemedText
              style={styles.consentDescription}
              type="bodyStd"
              accessibilityLabel={t('gdpr.essential_description')}
            >
              {t('gdpr.essential_description')}
            </AccessibleThemedText>
          </View>

          {/* Analytics Data */}
          <TouchableOpacity
            style={styles.consentSection}
            onPress={() => setAnalyticsConsent(!analyticsConsent)}
            accessible
            accessibilityLabel={t('gdpr.analytics_title')}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: analyticsConsent }}
            accessibilityHint={t('gdpr.toggle_consent')}
          >
            <View style={styles.consentHeader}>
              <AccessibleThemedText
                style={styles.consentTitle}
                type="h2"
                accessibilityLabel={t('gdpr.analytics_title')}
              >
                {t('gdpr.analytics_title')}
              </AccessibleThemedText>
              <View
                style={[
                  styles.checkbox,
                  {
                    backgroundColor: analyticsConsent ? colors.primary : 'transparent',
                    borderColor: colors.primary,
                  },
                ]}
                accessibilityLabel={analyticsConsent ? t('gdpr.checked') : t('gdpr.unchecked')}
              >
                {analyticsConsent && <Ionicons name="checkmark" size={18} color="white" />}
              </View>
            </View>

            <AccessibleThemedText
              style={styles.consentDescription}
              type="bodyStd"
              accessibilityLabel={t('gdpr.analytics_description')}
            >
              {t('gdpr.analytics_description')}
            </AccessibleThemedText>
          </TouchableOpacity>

          {/* Marketing Data */}
          <TouchableOpacity
            style={styles.consentSection}
            onPress={() => setMarketingConsent(!marketingConsent)}
            accessible
            accessibilityLabel={t('gdpr.marketing_title')}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: marketingConsent }}
            accessibilityHint={t('gdpr.toggle_consent')}
          >
            <View style={styles.consentHeader}>
              <AccessibleThemedText
                style={styles.consentTitle}
                type="h2"
                accessibilityLabel={t('gdpr.marketing_title')}
              >
                {t('gdpr.marketing_title')}
              </AccessibleThemedText>
              <View
                style={[
                  styles.checkbox,
                  {
                    backgroundColor: marketingConsent ? colors.primary : 'transparent',
                    borderColor: colors.primary,
                  },
                ]}
                accessibilityLabel={marketingConsent ? t('gdpr.checked') : t('gdpr.unchecked')}
              >
                {marketingConsent && <Ionicons name="checkmark" size={18} color="white" />}
              </View>
            </View>

            <AccessibleThemedText
              style={styles.consentDescription}
              type="bodyStd"
              accessibilityLabel={t('gdpr.marketing_description')}
            >
              {t('gdpr.marketing_description')}
            </AccessibleThemedText>
          </TouchableOpacity>

          {/* Third-Party Data */}
          <TouchableOpacity
            style={styles.consentSection}
            onPress={() => setThirdPartyConsent(!thirdPartyConsent)}
            accessible
            accessibilityLabel={t('gdpr.third_party_title')}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: thirdPartyConsent }}
            accessibilityHint={t('gdpr.toggle_consent')}
          >
            <View style={styles.consentHeader}>
              <AccessibleThemedText
                style={styles.consentTitle}
                type="h2"
                accessibilityLabel={t('gdpr.third_party_title')}
              >
                {t('gdpr.third_party_title')}
              </AccessibleThemedText>
              <View
                style={[
                  styles.checkbox,
                  {
                    backgroundColor: thirdPartyConsent ? colors.primary : 'transparent',
                    borderColor: colors.primary,
                  },
                ]}
                accessibilityLabel={thirdPartyConsent ? t('gdpr.checked') : t('gdpr.unchecked')}
              >
                {thirdPartyConsent && <Ionicons name="checkmark" size={18} color="white" />}
              </View>
            </View>

            <AccessibleThemedText
              style={styles.consentDescription}
              type="bodyStd"
              accessibilityLabel={t('gdpr.third_party_description')}
            >
              {t('gdpr.third_party_description')}
            </AccessibleThemedText>
          </TouchableOpacity>

          <AccessibleThemedText
            style={styles.privacyNote}
            type="bodyStd"
            accessibilityLabel={t('gdpr.privacy_note')}
          >
            {t('gdpr.privacy_note')}
          </AccessibleThemedText>

          {/* Terms of Service Checkbox */}
          <TouchableOpacity
            style={styles.termsCheckboxContainer}
            onPress={() => setTermsAccepted(!termsAccepted)}
            accessible
            accessibilityLabel={t('gdpr.terms_checkbox_label')}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: termsAccepted }}
          >
            <View
              style={[
                styles.checkbox,
                {
                  backgroundColor: termsAccepted ? colors.primary : 'transparent',
                  borderColor: colors.primary,
                },
              ]}
            >
              {termsAccepted && <Ionicons name="checkmark" size={18} color="white" />}
            </View>
            <AccessibleThemedText
              style={styles.termsCheckboxText}
              type="bodyStd"
              accessibilityLabel={t('gdpr.terms_checkbox_label')}
            >
              {t('gdpr.terms_checkbox_label')}
            </AccessibleThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.continueButton, { backgroundColor: colors.primary }]}
            onPress={handleContinue}
            accessible
            accessibilityLabel={t('gdpr.continue')}
            accessibilityRole="button"
          >
            <Text style={styles.continueButtonText}>{t('gdpr.continue')}</Text>
          </TouchableOpacity>

          <View style={styles.legalLinksContainer}>
            <TouchableOpacity
              style={styles.legalLink}
              onPress={() => {
                // Navigate to privacy policy
                navigation.navigate('Legal', { type: 'privacy-policy' });
              }}
              accessible
              accessibilityLabel={t('gdpr.view_privacy_policy')}
              accessibilityRole="link"
            >
              <AccessibleThemedText
                style={[styles.legalLinkText, { color: colors.primary }]}
                type="bodyStd"
                accessibilityLabel={t('gdpr.view_privacy_policy')}
                accessibilityRole="link"
              >
                {t('gdpr.view_privacy_policy')}
              </AccessibleThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.legalLink}
              onPress={() => {
                // Navigate to terms of service
                navigation.navigate('Legal', { type: 'terms-of-service' });
              }}
              accessible
              accessibilityLabel={t('gdpr.view_terms')}
              accessibilityRole="link"
            >
              <AccessibleThemedText
                style={[styles.legalLinkText, { color: colors.primary }]}
                type="bodyStd"
                accessibilityLabel={t('gdpr.view_terms')}
                accessibilityRole="link"
              >
                {t('gdpr.view_terms')}
              </AccessibleThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </AccessibleThemedView>
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
  termsCheckboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  termsCheckboxText: {
    fontSize: 14,
    marginLeft: 12,
    flex: 1,
  },
  legalLinksContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 24,
  },
  legalLink: {
    marginHorizontal: 10,
  },
  legalLinkText: {
    fontSize: 14,
    textDecorationLine: 'underline',
  },
});

export default GDPRConsentScreen;
