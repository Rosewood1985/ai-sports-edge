import React, { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, View, ActivityIndicator, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import AccessibleThemedView from '../atomic/atoms/AccessibleThemedView';
import AccessibleThemedText from '../atomic/atoms/AccessibleThemedText';
import AccessibleTouchableOpacity from '../atomic/atoms/AccessibleTouchableOpacity';
import { DataAccessManager } from '../atomic/molecules/privacy/DataAccessManager';
import { DataDeletionManager } from '../atomic/molecules/privacy/DataDeletionManager';
import { ConsentManager } from '../atomic/molecules/privacy/ConsentManager';
import { PrivacyRequestStatus, PrivacyRequestType, ConsentType } from '../atomic/atoms/privacy/gdprConfig';
import { DataFormat } from '../atomic/atoms/privacy/privacyTypes';
import { Ionicons } from '@expo/vector-icons';

type PrivacyDashboardScreenNavigationProp = StackNavigationProp<any, 'PrivacyDashboard'>;

const PrivacyDashboardScreen: React.FC = () => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const { t } = useTranslation();
  const navigation = useNavigation<PrivacyDashboardScreenNavigationProp>();

  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'requests' | 'consent' | 'settings'>('requests');
  const [accessRequests, setAccessRequests] = useState<any[]>([]);
  const [deletionRequests, setDeletionRequests] = useState<any[]>([]);
  const [privacyPreferences, setPrivacyPreferences] = useState<any>({
    marketingCommunications: false,
    dataAnalytics: false,
    thirdPartySharing: false,
    profiling: false,
  });

  const dataAccessManager = new DataAccessManager();
  const dataDeletionManager = new DataDeletionManager();
  const consentManager = new ConsentManager();

  useEffect(() => {
    if (user) {
      loadUserData();
    } else {
      setLoading(false);
    }
  }, [user]);

  const loadUserData = async () => {
    try {
      setLoading(true);
      
      // Load access requests
      const accessReqs = await dataAccessManager.getUserDataAccessRequests(user.uid);
      setAccessRequests(accessReqs);
      
      // Load deletion requests
      const deletionReqs = await dataDeletionManager.getUserDataDeletionRequests(user.uid);
      setDeletionRequests(deletionReqs);
      
      // Load privacy preferences
      const preferences = await consentManager.getPrivacyPreferences(user.uid);
      setPrivacyPreferences(preferences);
      
      setLoading(false);
    } catch (error) {
      console.error('Error loading user data:', error);
      Alert.alert(
        t('privacy.error.title'),
const createDataAccessRequest = async () => {
    try {
      setLoading(true);
      
      // Show format selection dialog
      Alert.alert(
        t('privacy.dataAccess.selectFormat'),
        t('privacy.dataAccess.formatDescription'),
        [
          {
            text: 'JSON',
            onPress: async () => {
              await createRequest('json');
            },
          },
          {
            text: 'CSV',
            onPress: async () => {
              await createRequest('csv');
            },
          },
          {
            text: 'XML',
            onPress: async () => {
              await createRequest('xml');
            },
          },
          {
            text: t('common.cancel'),
            style: 'cancel',
          },
        ]
      );
    } catch (error) {
      console.error('Error creating data access request:', error);
      Alert.alert(
        t('privacy.error.title'),
        t('privacy.error.createAccessRequest'),
        [{ text: t('common.ok') }]
      );
      setLoading(false);
    }
  };

  const createRequest = async (format: DataFormat) => {
    try {
      // Create data access request
      const requestId = await dataAccessManager.createDataAccessRequest(
        user.uid,
        ['accountData', 'profileData', 'usageData', 'analyticsData', 'marketingData', 'paymentData', 'communicationData'],
        format
      );
      
      // Reload user data
      await loadUserData();
      
      Alert.alert(
        t('privacy.dataAccess.requestCreated'),
        t('privacy.dataAccess.requestCreatedDescription'),
        [{ text: t('common.ok') }]
      );
    } catch (error) {
      console.error('Error creating data access request:', error);
      Alert.alert(
        t('privacy.error.title'),
        t('privacy.error.createAccessRequest'),
        [{ text: t('common.ok') }]
      );
    } finally {
      setLoading(false);
    }
  };

  const createDataDeletionRequest = async () => {
    try {
      setLoading(true);
      
      // Show confirmation dialog
      Alert.alert(
        t('privacy.dataDeletion.confirmTitle'),
        t('privacy.dataDeletion.confirmDescription'),
        [
          {
            text: t('privacy.dataDeletion.fullDeletion'),
            onPress: async () => {
              await createDeletionRequest(true);
            },
            style: 'destructive',
          },
          {
            text: t('privacy.dataDeletion.partialDeletion'),
            onPress: () => {
              showCategorySelection();
            },
          },
          {
            text: t('common.cancel'),
            style: 'cancel',
            onPress: () => setLoading(false),
          },
        ]
      );
    } catch (error) {
      console.error('Error creating data deletion request:', error);
      Alert.alert(
        t('privacy.error.title'),
        t('privacy.error.createDeletionRequest'),
        [{ text: t('common.ok') }]
      );
      setLoading(false);
    }
  };
        t('privacy.error.loadData'),
        [{ text: t('common.ok') }]
      );
      setLoading(false);
    }
const showCategorySelection = () => {
    // Show category selection dialog
    Alert.alert(
      t('privacy.dataDeletion.selectCategories'),
      t('privacy.dataDeletion.selectCategoriesDescription'),
      [
        {
          text: t('privacy.dataDeletion.usageData'),
          onPress: async () => {
            await createDeletionRequest(false, ['usageData']);
          },
        },
        {
          text: t('privacy.dataDeletion.analyticsData'),
          onPress: async () => {
            await createDeletionRequest(false, ['analyticsData']);
          },
        },
        {
          text: t('privacy.dataDeletion.marketingData'),
          onPress: async () => {
            await createDeletionRequest(false, ['marketingData']);
          },
        },
        {
          text: t('common.cancel'),
          style: 'cancel',
          onPress: () => setLoading(false),
        },
      ]
    );
  };

  const createDeletionRequest = async (fullDeletion: boolean, dataCategories?: string[]) => {
    try {
      // Create data deletion request
      const requestId = await dataDeletionManager.createDataDeletionRequest(
        user.uid,
        fullDeletion,
        dataCategories
      );
      
      // Reload user data
      await loadUserData();
      
      Alert.alert(
        t('privacy.dataDeletion.requestCreated'),
        t('privacy.dataDeletion.requestCreatedDescription'),
        [{ text: t('common.ok') }]
      );
    } catch (error) {
      console.error('Error creating data deletion request:', error);
      Alert.alert(
        t('privacy.error.title'),
        t('privacy.error.createDeletionRequest'),
        [{ text: t('common.ok') }]
      );
    } finally {
      setLoading(false);
    }
  };

  const cancelDeletionRequest = async (requestId: string) => {
    try {
      setLoading(true);
      
      // Cancel data deletion request
      const success = await dataDeletionManager.cancelDataDeletionRequest(requestId);
      
      if (success) {
        // Reload user data
        await loadUserData();
        
        Alert.alert(
          t('privacy.dataDeletion.requestCancelled'),
          t('privacy.dataDeletion.requestCancelledDescription'),
          [{ text: t('common.ok') }]
        );
      } else {
        Alert.alert(
          t('privacy.error.title'),
          t('privacy.dataDeletion.cannotCancel'),
          [{ text: t('common.ok') }]
        );
      }
    } catch (error) {
      console.error('Error cancelling data deletion request:', error);
      Alert.alert(
        t('privacy.error.title'),
        t('privacy.error.cancelDeletionRequest'),
        [{ text: t('common.ok') }]
      );
    } finally {
      setLoading(false);
    }
  };
  };