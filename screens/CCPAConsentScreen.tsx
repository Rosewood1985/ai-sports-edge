/**
 * CCPA Consent Screen
 *
 * This screen provides CCPA-compliant privacy options for California residents,
 * including opt-out rights and data sale disclosure.
 */

import { useNavigation } from '@react-navigation/native';
import React, { useState, useEffect } from 'react';
import {
  ScrollView,
  Text,
  View,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';

import { privacyService } from '../atomic/organisms/privacy';
import { useAuth } from '../hooks/useAuth';
import { useThemeColor } from '../hooks/useThemeColor';
import { useTranslation } from '../hooks/useTranslation';

interface CCPAPreferences {
  doNotSell: boolean;
  doNotTrack: boolean;
  limitUse: boolean;
  deleteData: boolean;
}

const CCPAConsentScreen: React.FC = () => {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const { user } = useAuth();
  const textColor = useThemeColor({}, 'text');
  const backgroundColor = useThemeColor({}, 'background');
  const primaryColor = useThemeColor({}, 'primary');

  const [preferences, setPreferences] = useState<CCPAPreferences>({
    doNotSell: false,
    doNotTrack: false,
    limitUse: false,
    deleteData: false,
  });

  const [loading, setLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Load existing preferences on mount
  useEffect(() => {
    const loadPreferences = async () => {
      if (!user) return;

      try {
        const existingPreferences = await privacyService.getPrivacyPreferences(user.uid);
        if (existingPreferences && existingPreferences.ccpaPreferences) {
          setPreferences(existingPreferences.ccpaPreferences);
        }
      } catch (error) {
        console.error('Error loading CCPA preferences:', error);
      }
    };

    loadPreferences();
  }, [user]);

  const handlePreferenceChange = (key: keyof CCPAPreferences, value: boolean) => {
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

      // Get existing preferences and merge with CCPA preferences
      const existingPreferences = (await privacyService.getPrivacyPreferences(user.uid)) || {};
      const updatedPreferences = {
        ...existingPreferences,
        ccpaPreferences: preferences,
      };

      await privacyService.updatePrivacyPreferences(user.uid, updatedPreferences);
      setHasChanges(false);

      Alert.alert(t('common.success'), t('ccpa.preferences_saved'), [
        { text: t('common.ok'), onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      console.error('Error saving CCPA preferences:', error);
      Alert.alert(t('common.error'), t('ccpa.save_error'));
    } finally {
      setLoading(false);
    }
  };

  const handleOptOutAll = () => {
    setPreferences({
      doNotSell: true,
      doNotTrack: true,
      limitUse: true,
      deleteData: false, // This requires separate action
    });
    setHasChanges(true);
  };

  const handleRequestDataDeletion = async () => {
    if (!user) return;

    Alert.alert(t('ccpa.confirm_deletion_title'), t('ccpa.confirm_deletion_message'), [
      {
        text: t('common.cancel'),
        style: 'cancel',
      },
      {
        text: t('ccpa.request_deletion'),
        style: 'destructive',
        onPress: async () => {
          try {
            await privacyService.requestDataDeletion(user.uid, ['all']);
            Alert.alert(t('common.success'), t('ccpa.deletion_request_submitted'));
          } catch (error) {
            console.error('Error requesting data deletion:', error);
            Alert.alert(t('common.error'), t('ccpa.deletion_request_error'));
          }
        },
      },
    ]);
  };

  const handleDataSubjectRights = () => {
    navigation.navigate('PrivacySettings');
  };

  const renderCCPAOption = (
    key: keyof CCPAPreferences,
    titleKey: string,
    descriptionKey: string,
    isSpecialAction: boolean = false
  ) => (
    <View key={key} style={styles.optionContainer}>
      <View style={styles.optionHeader}>
        <View style={styles.optionTextContainer}>
          <Text style={[styles.optionTitle, { color: textColor }]}>{t(titleKey)}</Text>
          <Text style={[styles.optionDescription, { color: textColor }]}>{t(descriptionKey)}</Text>
        </View>

        {!isSpecialAction ? (
          <Switch
            value={preferences[key]}
            onValueChange={value => handlePreferenceChange(key, value)}
            trackColor={{ false: '#767577', true: primaryColor }}
            thumbColor={preferences[key] ? '#ffffff' : '#f4f3f4'}
          />
        ) : (
          <TouchableOpacity
            style={[styles.actionButton, { borderColor: primaryColor }]}
            onPress={handleRequestDataDeletion}
          >
            <Text style={[styles.actionButtonText, { color: primaryColor }]}>
              {t('ccpa.request_deletion')}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={[styles.backButtonText, { color: textColor }]}>{t('common.back')}</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: textColor }]}>{t('ccpa.title')}</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator>
        <Text style={[styles.title, { color: textColor }]}>{t('ccpa.title')}</Text>

        <Text style={[styles.description, { color: textColor }]}>{t('ccpa.description')}</Text>

        <View style={styles.noticeSection}>
          <Text style={[styles.noticeTitle, { color: textColor }]}>
            {t('ccpa.data_sale_notice_title')}
          </Text>
          <Text style={[styles.noticeText, { color: textColor }]}>
            {t('ccpa.data_sale_notice')}
          </Text>
        </View>

        <View style={styles.optionsSection}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>{t('ccpa.your_rights')}</Text>

          {renderCCPAOption('doNotSell', 'ccpa.do_not_sell_title', 'ccpa.do_not_sell_description')}

          {renderCCPAOption(
            'doNotTrack',
            'ccpa.do_not_track_title',
            'ccpa.do_not_track_description'
          )}

          {renderCCPAOption('limitUse', 'ccpa.limit_use_title', 'ccpa.limit_use_description')}

          {renderCCPAOption(
            'deleteData',
            'ccpa.delete_data_title',
            'ccpa.delete_data_description',
            true
          )}
        </View>

        <View style={styles.categoriesSection}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>
            {t('ccpa.categories_collected')}
          </Text>

          <Text style={[styles.categoryText, { color: textColor }]}>
            {t('ccpa.categories_list')}
          </Text>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.optOutButton]}
            onPress={handleOptOutAll}
            disabled={loading}
          >
            <Text style={styles.optOutButtonText}>{t('ccpa.opt_out_all')}</Text>
          </TouchableOpacity>

          {hasChanges && (
            <TouchableOpacity
              style={[styles.button, styles.saveButton, { backgroundColor: primaryColor }]}
              onPress={handleSavePreferences}
              disabled={loading}
            >
              <Text style={styles.saveButtonText}>
                {loading ? t('common.saving') : t('common.save')}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.rightsSection}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>
            {t('ccpa.additional_rights')}
          </Text>

          <TouchableOpacity style={styles.rightsButton} onPress={handleDataSubjectRights}>
            <Text style={[styles.rightsButtonText, { color: primaryColor }]}>
              {t('ccpa.manage_data_rights')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkButton}
            onPress={() => navigation.navigate('PrivacyPolicy')}
          >
            <Text style={[styles.linkText, { color: primaryColor }]}>
              {t('ccpa.view_privacy_policy')}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.legalNotice}>
          <Text style={[styles.legalNoticeText, { color: textColor }]}>
            {t('ccpa.legal_notice')}
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
  noticeSection: {
    marginBottom: 24,
    padding: 16,
    backgroundColor: '#fff3cd',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#ffc107',
  },
  noticeTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  noticeText: {
    fontSize: 14,
    lineHeight: 20,
  },
  optionsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  optionContainer: {
    marginBottom: 16,
    padding: 16,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
  },
  optionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  optionTextContainer: {
    flex: 1,
    marginRight: 16,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 14,
    lineHeight: 20,
    color: '#666',
  },
  actionButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderRadius: 6,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  categoriesSection: {
    marginBottom: 24,
    padding: 16,
    backgroundColor: '#f0f8ff',
    borderRadius: 8,
  },
  categoryText: {
    fontSize: 14,
    lineHeight: 20,
  },
  buttonContainer: {
    marginBottom: 24,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  optOutButton: {
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#ccc',
  },
  saveButton: {
    // backgroundColor set dynamically
  },
  optOutButtonText: {
    color: '#333',
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
    backgroundColor: '#e8f4fd',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#007bff',
  },
  legalNoticeText: {
    fontSize: 12,
    lineHeight: 18,
    fontStyle: 'italic',
  },
});

export default CCPAConsentScreen;
