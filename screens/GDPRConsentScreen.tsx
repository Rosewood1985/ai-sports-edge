/**
 * GDPR Consent Screen
 *
 * This screen provides GDPR-compliant consent management for EU users,
 * including granular consent options and data subject rights information.
 */

import React, { useState, useEffect } from 'react';
import { 
  ScrollView, 
  Text, 
  View, 
  StyleSheet, 
  SafeAreaView,
  TouchableOpacity,
  Switch,
  Alert
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useThemeColor } from '../hooks/useThemeColor';
import { useTranslation } from '../hooks/useTranslation';
import { useAuth } from '../hooks/useAuth';
import { privacyService } from '../atomic/organisms/privacy';

interface ConsentPreferences {
  essential: boolean;
  analytics: boolean;
  marketing: boolean;
  thirdParty: boolean;
  profiling: boolean;
}

const GDPRConsentScreen: React.FC = () => {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const { user } = useAuth();
  const textColor = useThemeColor({}, 'text');
  const backgroundColor = useThemeColor({}, 'background');
  const primaryColor = useThemeColor({}, 'primary');

  const [preferences, setPreferences] = useState<ConsentPreferences>({
    essential: true, // Always required
    analytics: false,
    marketing: false,
    thirdParty: false,
    profiling: false,
  });

  const [loading, setLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Load existing preferences on mount
  useEffect(() => {
    const loadPreferences = async () => {
      if (!user) return;

      try {
        const existingPreferences = await privacyService.getPrivacyPreferences(user.uid);
        if (existingPreferences) {
          setPreferences({
            essential: true, // Always required
            analytics: existingPreferences.dataAnalytics || false,
            marketing: existingPreferences.marketingCommunications || false,
            thirdParty: existingPreferences.thirdPartySharing || false,
            profiling: existingPreferences.profiling || false,
          });
        }
      } catch (error) {
        console.error('Error loading privacy preferences:', error);
      }
    };

    loadPreferences();
  }, [user]);

  const handlePreferenceChange = (key: keyof ConsentPreferences, value: boolean) => {
    if (key === 'essential') {
      // Essential cookies cannot be disabled
      Alert.alert(
        t('gdpr.essential_required_title'),
        t('gdpr.essential_required_message')
      );
      return;
    }

    setPreferences(prev => ({
      ...prev,
      [key]: value,
    }));
    setHasChanges(true);
  };

  const handleSavePreferences = async () => {
    if (!user) return;

    try {
      setLoading(true);

      const privacyPreferences = {
        marketingCommunications: preferences.marketing,
        dataAnalytics: preferences.analytics,
        thirdPartySharing: preferences.thirdParty,
        profiling: preferences.profiling,
      };

      await privacyService.updatePrivacyPreferences(user.uid, privacyPreferences);
      setHasChanges(false);

      Alert.alert(
        t('common.success'),
        t('gdpr.preferences_saved'),
        [{ text: t('common.ok'), onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      console.error('Error saving privacy preferences:', error);
      Alert.alert(t('common.error'), t('gdpr.save_error'));
    } finally {
      setLoading(false);
    }
  };

  const handleRejectAll = () => {
    setPreferences({
      essential: true,
      analytics: false,
      marketing: false,
      thirdParty: false,
      profiling: false,
    });
    setHasChanges(true);
  };

  const handleAcceptAll = () => {
    setPreferences({
      essential: true,
      analytics: true,
      marketing: true,
      thirdParty: true,
      profiling: true,
    });
    setHasChanges(true);
  };

  const handleDataSubjectRights = () => {
    navigation.navigate('PrivacySettings');
  };

  const renderConsentOption = (
    key: keyof ConsentPreferences,
    titleKey: string,
    descriptionKey: string,
    isRequired: boolean = false
  ) => (
    <View key={key} style={styles.consentOption}>
      <View style={styles.consentHeader}>
        <View style={styles.consentTextContainer}>
          <Text style={[styles.consentTitle, { color: textColor }]}>
            {t(titleKey)}
            {isRequired && <Text style={styles.requiredIndicator}> *</Text>}
          </Text>
          <Text style={[styles.consentDescription, { color: textColor }]}>
            {t(descriptionKey)}
          </Text>
        </View>
        
        <Switch
          value={preferences[key]}
          onValueChange={(value) => handlePreferenceChange(key, value)}
          disabled={isRequired}
          trackColor={{ false: '#767577', true: primaryColor }}
          thumbColor={preferences[key] ? '#ffffff' : '#f4f3f4'}
        />
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={[styles.backButtonText, { color: textColor }]}>
            {t('common.back')}
          </Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: textColor }]}>
          {t('gdpr.title')}
        </Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={true}>
        <Text style={[styles.title, { color: textColor }]}>
          {t('gdpr.title')}
        </Text>
        
        <Text style={[styles.description, { color: textColor }]}>
          {t('gdpr.description')}
        </Text>

        <View style={styles.consentSection}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>
            {t('gdpr.consent_preferences')}
          </Text>

          {renderConsentOption(
            'essential',
            'gdpr.essential_title',
            'gdpr.essential_description',
            true
          )}

          {renderConsentOption(
            'analytics',
            'gdpr.analytics_title',
            'gdpr.analytics_description'
          )}

          {renderConsentOption(
            'marketing',
            'gdpr.marketing_title',
            'gdpr.marketing_description'
          )}

          {renderConsentOption(
            'thirdParty',
            'gdpr.third_party_title',
            'gdpr.third_party_description'
          )}

          {renderConsentOption(
            'profiling',
            'gdpr.profiling_title',
            'gdpr.profiling_description'
          )}
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.rejectButton]}
            onPress={handleRejectAll}
            disabled={loading}
          >
            <Text style={styles.rejectButtonText}>
              {t('gdpr.reject_all')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.acceptButton, { backgroundColor: primaryColor }]}
            onPress={handleAcceptAll}
            disabled={loading}
          >
            <Text style={styles.acceptButtonText}>
              {t('gdpr.accept_all')}
            </Text>
          </TouchableOpacity>
        </View>

        {hasChanges && (
          <TouchableOpacity
            style={[styles.button, styles.saveButton, { backgroundColor: primaryColor }]}
            onPress={handleSavePreferences}
            disabled={loading}
          >
            <Text style={styles.saveButtonText}>
              {loading ? t('common.saving') : t('gdpr.save_preferences')}
            </Text>
          </TouchableOpacity>
        )}

        <View style={styles.rightsSection}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>
            {t('gdpr.your_rights')}
          </Text>
          
          <Text style={[styles.rightsDescription, { color: textColor }]}>
            {t('gdpr.rights_description')}
          </Text>

          <TouchableOpacity
            style={styles.rightsButton}
            onPress={handleDataSubjectRights}
          >
            <Text style={[styles.rightsButtonText, { color: primaryColor }]}>
              {t('gdpr.manage_data_rights')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkButton}
            onPress={() => navigation.navigate('PrivacyPolicy')}
          >
            <Text style={[styles.linkText, { color: primaryColor }]}>
              {t('gdpr.view_privacy_policy')}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.legalNotice}>
          <Text style={[styles.legalNoticeText, { color: textColor }]}>
            {t('gdpr.legal_notice')}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    paddingRight: 16,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 24,
    textAlign: 'center',
  },
  consentSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  consentOption: {
    marginBottom: 20,
    padding: 16,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
  },
  consentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  consentTextContainer: {
    flex: 1,
    marginRight: 16,
  },
  consentTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  requiredIndicator: {
    color: '#ff4444',
    fontWeight: 'bold',
  },
  consentDescription: {
    fontSize: 14,
    lineHeight: 20,
    color: '#666',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rejectButton: {
    backgroundColor: '#f5f5f5',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  acceptButton: {
    marginLeft: 8,
  },
  saveButton: {
    marginBottom: 24,
  },
  rejectButtonText: {
    color: '#333',
    fontWeight: '600',
    fontSize: 16,
  },
  acceptButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 16,
  },
  saveButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 16,
  },
  rightsSection: {
    marginBottom: 24,
    padding: 16,
    backgroundColor: '#f0f8ff',
    borderRadius: 8,
  },
  rightsDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  rightsButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#007bff',
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  rightsButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  linkButton: {
    paddingVertical: 8,
    alignItems: 'center',
  },
  linkText: {
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  legalNotice: {
    marginBottom: 32,
    padding: 16,
    backgroundColor: '#fff3cd',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#ffc107',
  },
  legalNoticeText: {
    fontSize: 12,
    lineHeight: 18,
    fontStyle: 'italic',
  },
});

export default GDPRConsentScreen;