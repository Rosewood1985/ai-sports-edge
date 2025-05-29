/**
 * Privacy Settings Screen
 *
 * This component provides a user interface for managing privacy settings,
 * including consent preferences, data access, and data deletion requests.
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Switch, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';

import { privacyService } from './index';
import {
  PrivacyPreferences,
  PrivacyRequestUnion,
} from '../../../atomic/atoms/privacy/privacyTypes';
import { PrivacyRequestType, PrivacyRequestStatus } from '../../../atomic/atoms/privacy/gdprConfig';
import { useAuth } from '../../../hooks/useAuth';
import { useThemeColor } from '../../../hooks/useThemeColor';
import { useI18n } from '../i18n/I18nContext';

const PrivacySettingsScreen: React.FC = () => {
  const { user } = useAuth();
  const navigation = useNavigation();
  const { t } = useI18n();

  // Define theme colors
  const textColor = useThemeColor({}, 'primaryText');
  const primaryAction = useThemeColor({}, 'primaryAction');

  // Define status colors
  const statusColors = {
    warning: '#FFD700', // Yellow
    info: '#00BFFF', // Blue
    success: '#39FF14', // Green
    text: textColor,
  };

  const [preferences, setPreferences] = useState<PrivacyPreferences>({
    marketingCommunications: false,
    dataAnalytics: false,
    thirdPartySharing: false,
    profiling: false,
  });

  const [requests, setRequests] = useState<PrivacyRequestUnion[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);

  // Load user's privacy preferences and requests
  useEffect(() => {
    const loadPrivacyData = async () => {
      if (!user) return;

      try {
        setLoading(true);

        // In a real implementation, we would load the user's privacy preferences from Firestore
        // For now, we'll just use the default values
        // const userDoc = await getDoc(doc(db, 'users', user.uid));
        // if (userDoc.exists()) {
        //   const userData = userDoc.data();
        //   setPreferences(userData.privacyPreferences || defaultPreferences);
        // }

        // Load the user's privacy requests
        const userRequests = await privacyService.getUserDataAccessRequests(user.uid);
        const deletionRequests = await privacyService.getUserDataDeletionRequests(user.uid);
        setRequests([...userRequests, ...deletionRequests]);
      } catch (error) {
        console.error('Error loading privacy data:', error);
        Alert.alert(t('privacy.error.loading'), t('privacy.error.tryAgain'));
      } finally {
        setLoading(false);
      }
    };

    loadPrivacyData();
  }, [user]);

  // Handle preference toggle
  const handleTogglePreference = (key: keyof PrivacyPreferences) => {
    setPreferences(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Save privacy preferences
  const handleSavePreferences = async () => {
    if (!user) return;

    try {
      setSaving(true);
      await privacyService.updatePrivacyPreferences(user.uid, preferences);
      Alert.alert(t('privacy.success'), t('privacy.preferencesUpdated'));
    } catch (error) {
      console.error('Error saving privacy preferences:', error);
      Alert.alert(t('privacy.error.saving'), t('privacy.error.tryAgain'));
    } finally {
      setSaving(false);
    }
  };

  // Create a data access request
  const handleDataAccessRequest = async () => {
    if (!user) return;

    try {
      await privacyService.requestDataAccess(user.uid, ['personalInfo', 'activityData'], 'json');

      // Refresh the requests list after creating a new request
      const accessRequests = await privacyService.getUserDataAccessRequests(user.uid);
      const deletionRequests = await privacyService.getUserDataDeletionRequests(user.uid);
      setRequests([...accessRequests, ...deletionRequests]);
      Alert.alert(t('privacy.requestSubmitted'), t('privacy.accessRequestDetails'));
    } catch (error) {
      console.error('Error creating data access request:', error);
      Alert.alert(t('privacy.error.request'), t('privacy.error.tryAgain'));
    }
  };

  // Create a data deletion request
  const handleDataDeletionRequest = async () => {
    if (!user) return;

    // Show confirmation dialog
    Alert.alert(t('privacy.confirmDeletion'), t('privacy.deletionWarning'), [
      {
        text: t('common.cancel'),
        style: 'cancel',
      },
      {
        text: t('privacy.deleteSelected'),
        onPress: async () => {
          try {
            await privacyService.requestDataDeletion(user.uid, ['analyticsData', 'marketingData']);

            // Refresh the requests list after creating a new request
            const accessRequests = await privacyService.getUserDataAccessRequests(user.uid);
            const deletionRequests = await privacyService.getUserDataDeletionRequests(user.uid);
            setRequests([...accessRequests, ...deletionRequests]);
            Alert.alert(t('privacy.requestSubmitted'), t('privacy.deletionRequestDetails'));
          } catch (error) {
            console.error('Error creating data deletion request:', error);
            Alert.alert(t('privacy.error.request'), t('privacy.error.tryAgain'));
          }
        },
      },
      {
        text: t('privacy.deleteAccount'),
        style: 'destructive',
        onPress: async () => {
          try {
            await privacyService.requestAccountDeletion(user.uid);

            // Refresh the requests list after creating a new request
            const accessRequests = await privacyService.getUserDataAccessRequests(user.uid);
            const deletionRequests = await privacyService.getUserDataDeletionRequests(user.uid);
            setRequests([...accessRequests, ...deletionRequests]);
            Alert.alert(t('privacy.requestSubmitted'), t('privacy.accountDeletionDetails'));
          } catch (error) {
            console.error('Error creating account deletion request:', error);
            Alert.alert(t('privacy.error.request'), t('privacy.error.tryAgain'));
          }
        },
      },
    ]);
  };

  // Render a privacy request
  const renderRequest = (request: PrivacyRequestUnion) => {
    const getStatusColor = () => {
      switch (request.status) {
        case PrivacyRequestStatus.PENDING:
          return statusColors.warning;
        case PrivacyRequestStatus.PROCESSING:
          return statusColors.info;
        case PrivacyRequestStatus.COMPLETED:
          return statusColors.success;
        default:
          return statusColors.text;
      }
    };

    const getRequestTypeLabel = () => {
      switch (request.type) {
        case PrivacyRequestType.ACCESS:
          return t('privacy.dataAccess');
        case PrivacyRequestType.DELETION:
          return t('privacy.dataDeletion');
        default:
          return request.type;
      }
    };

    const getStatusLabel = () => {
      switch (request.status) {
        case PrivacyRequestStatus.PENDING:
          return t('privacy.pending');
        case PrivacyRequestStatus.PROCESSING:
          return t('privacy.processing');
        case PrivacyRequestStatus.COMPLETED:
          return t('privacy.completed');
        default:
          return request.status;
      }
    };

    return (
      <View key={request.id} style={styles.requestItem}>
        <View style={styles.requestHeader}>
          <Text style={styles.requestType}>{getRequestTypeLabel()}</Text>
          <Text style={[styles.requestStatus, { color: getStatusColor() }]}>
            {getStatusLabel()}
          </Text>
        </View>
        <Text style={styles.requestDate}>
          {t('privacy.requested')}: {request.createdAt.toLocaleDateString()}
        </Text>
        {request.completedAt && (
          <Text style={styles.requestDate}>
            {t('privacy.completed')}: {request.completedAt.toLocaleDateString()}
          </Text>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text>{t('common.loading')}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('privacy.consentPreferences')}</Text>
        <Text style={styles.sectionDescription}>{t('privacy.consentDescription')}</Text>

        <View style={styles.preferenceItem}>
          <View style={styles.preferenceTextContainer}>
            <Text style={styles.preferenceTitle}>{t('privacy.marketingCommunications')}</Text>
            <Text style={styles.preferenceDescription}>{t('privacy.marketingDescription')}</Text>
          </View>
          <Switch
            value={preferences.marketingCommunications}
            onValueChange={() => handleTogglePreference('marketingCommunications')}
          />
        </View>

        <View style={styles.preferenceItem}>
          <View style={styles.preferenceTextContainer}>
            <Text style={styles.preferenceTitle}>{t('privacy.dataAnalytics')}</Text>
            <Text style={styles.preferenceDescription}>{t('privacy.analyticsDescription')}</Text>
          </View>
          <Switch
            value={preferences.dataAnalytics}
            onValueChange={() => handleTogglePreference('dataAnalytics')}
          />
        </View>

        <View style={styles.preferenceItem}>
          <View style={styles.preferenceTextContainer}>
            <Text style={styles.preferenceTitle}>{t('privacy.thirdPartySharing')}</Text>
            <Text style={styles.preferenceDescription}>{t('privacy.thirdPartyDescription')}</Text>
          </View>
          <Switch
            value={preferences.thirdPartySharing}
            onValueChange={() => handleTogglePreference('thirdPartySharing')}
          />
        </View>

        <View style={styles.preferenceItem}>
          <View style={styles.preferenceTextContainer}>
            <Text style={styles.preferenceTitle}>{t('privacy.profiling')}</Text>
            <Text style={styles.preferenceDescription}>{t('privacy.profilingDescription')}</Text>
          </View>
          <Switch
            value={preferences.profiling}
            onValueChange={() => handleTogglePreference('profiling')}
          />
        </View>

        <TouchableOpacity
          style={[styles.button, styles.saveButton]}
          onPress={handleSavePreferences}
          disabled={saving}
        >
          <Text style={styles.buttonText}>{saving ? t('common.saving') : t('common.save')}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('privacy.dataRequests')}</Text>
        <Text style={styles.sectionDescription}>{t('privacy.dataRequestsDescription')}</Text>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.accessButton]}
            onPress={handleDataAccessRequest}
          >
            <Text style={styles.buttonText}>{t('privacy.requestAccess')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.deleteButton]}
            onPress={handleDataDeletionRequest}
          >
            <Text style={styles.buttonText}>{t('privacy.requestDeletion')}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.requestsContainer}>
          <Text style={styles.requestsTitle}>{t('privacy.yourRequests')}</Text>
          {requests.length === 0 ? (
            <Text style={styles.noRequests}>{t('privacy.noRequests')}</Text>
          ) : (
            requests.map(renderRequest)
          )}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('privacy.learnMore')}</Text>
        <Text style={styles.sectionDescription}>{t('privacy.learnMoreDescription')}</Text>

        <TouchableOpacity
          style={styles.linkButton}
          onPress={() => {
            navigation.navigate('PrivacyPolicy');
          }}
        >
          <Text style={styles.linkText}>{t('privacy.viewPrivacyPolicy')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.linkButton}
          onPress={() => {
            navigation.navigate('TermsOfService');
          }}
        >
          <Text style={styles.linkText}>{t('privacy.viewTerms')}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    marginBottom: 24,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  preferenceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  preferenceTextContainer: {
    flex: 1,
    marginRight: 16,
  },
  preferenceTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  preferenceDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    marginTop: 16,
  },
  accessButton: {
    backgroundColor: '#2196F3',
    flex: 1,
    marginRight: 8,
  },
  deleteButton: {
    backgroundColor: '#F44336',
    flex: 1,
    marginLeft: 8,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '500',
    fontSize: 16,
  },
  requestsContainer: {
    marginTop: 24,
  },
  requestsTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  noRequests: {
    color: '#666',
    fontStyle: 'italic',
  },
  requestItem: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  requestType: {
    fontWeight: '500',
  },
  requestStatus: {
    fontWeight: '500',
  },
  requestDate: {
    fontSize: 14,
    color: '#666',
  },
  linkButton: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  linkText: {
    color: '#2196F3',
    fontSize: 16,
  },
});

export default PrivacySettingsScreen;
