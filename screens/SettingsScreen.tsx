import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useI18n } from '../contexts/I18nContext';
import featureTourService from '../services/featureTourService';
import { analyticsService, AnalyticsEventType } from '../services/analyticsService';
import Header from '../components/Header';
import { ThemedText } from '../components/ThemedText';
import { ThemedView } from '../components/ThemedView';

/**
 * SettingsScreen component
 * Displays various app settings and preferences
 */
const SettingsScreen: React.FC = () => {
  const navigation = useNavigation();
  const [isResetting, setIsResetting] = useState<boolean>(false);
  const { t, language } = useI18n();

  /**
   * Handle resetting the onboarding/feature tour
   * Resets the onboarding status and navigates to the onboarding screen
   */
  const handleResetTour = async () => {
    try {
      setIsResetting(true);
      
      // Confirm with the user
      Alert.alert(
        t('featureTour.title'),
        t('featureTour.skip.message'),
        [
          {
            text: t('featureTour.skip.cancel'),
            style: "cancel",
            onPress: () => setIsResetting(false)
          },
          {
            text: t('settings.items.replayFeatureTour'),
            onPress: async () => {
              // Reset feature tour and onboarding status
              await featureTourService.resetFeatureTour('settings_screen');
              
              // Navigate to onboarding
              navigation.navigate('Onboarding' as never);
              
              setIsResetting(false);
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error resetting feature tour:', error);
      Alert.alert('Error', 'Failed to reset feature tour. Please try again.');
      setIsResetting(false);
    }
  };

  /**
   * Navigate to notification settings
   */
  const goToNotificationSettings = () => {
    navigation.navigate('NotificationSettings' as never);
  };

  /**
   * Navigate to accessibility settings
   */
  const goToAccessibilitySettings = () => {
    navigation.navigate('AccessibilitySettings' as never);
  };

  /**
   * Navigate to personalization settings
   */
  const goToPersonalizationSettings = () => {
    navigation.navigate('Personalization' as never);
  };

  /**
   * Navigate to offline settings
   */
  const goToOfflineSettings = () => {
    navigation.navigate('OfflineSettings' as never);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title={t('settings.title')}
        onRefresh={() => {}}
        isLoading={false}
      />
      
      <ScrollView style={styles.scrollView}>
        <ThemedView style={styles.section}>
          <ThemedText style={styles.sectionTitle}>{t('settings.sections.account')}</ThemedText>
          
          <TouchableOpacity style={styles.settingItem}>
            <ThemedText style={styles.settingLabel}>{t('settings.items.profile')}</ThemedText>
            <ThemedText style={styles.settingArrow}>›</ThemedText>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.settingItem}>
            <ThemedText style={styles.settingLabel}>{t('settings.items.subscription')}</ThemedText>
            <ThemedText style={styles.settingArrow}>›</ThemedText>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.settingItem}>
            <ThemedText style={styles.settingLabel}>{t('settings.items.paymentMethods')}</ThemedText>
            <ThemedText style={styles.settingArrow}>›</ThemedText>
          </TouchableOpacity>
        </ThemedView>
        
        <ThemedView style={styles.section}>
          <ThemedText style={styles.sectionTitle}>{t('settings.sections.preferences')}</ThemedText>
          
          <TouchableOpacity
            style={styles.settingItem}
            onPress={goToNotificationSettings}
          >
            <ThemedText style={styles.settingLabel}>{t('settings.items.notifications')}</ThemedText>
            <ThemedText style={styles.settingArrow}>›</ThemedText>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.settingItem}
            onPress={goToPersonalizationSettings}
          >
            <ThemedText style={styles.settingLabel}>{t('settings.items.personalization')}</ThemedText>
            <ThemedText style={styles.settingArrow}>›</ThemedText>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.settingItem}
            onPress={goToAccessibilitySettings}
          >
            <ThemedText style={styles.settingLabel}>{t('settings.items.accessibility')}</ThemedText>
            <ThemedText style={styles.settingArrow}>›</ThemedText>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.settingItem}
            onPress={goToOfflineSettings}
          >
            <ThemedText style={styles.settingLabel}>{t('settings.items.offlineMode')}</ThemedText>
            <ThemedText style={styles.settingArrow}>›</ThemedText>
          </TouchableOpacity>
        </ThemedView>
        
        <ThemedView style={styles.section}>
          <ThemedText style={styles.sectionTitle}>{t('settings.sections.appTourHelp')}</ThemedText>
          
          <TouchableOpacity
            style={styles.settingItem}
            onPress={handleResetTour}
            disabled={isResetting}
          >
            <View style={styles.settingContent}>
              <ThemedText style={styles.settingLabel}>{t('settings.items.replayFeatureTour')}</ThemedText>
              <ThemedText style={styles.settingDescription}>
                {t('settings.items.replayFeatureTourDesc')}
              </ThemedText>
            </View>
            <ThemedText style={styles.settingArrow}>›</ThemedText>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingContent}>
              <ThemedText style={styles.settingLabel}>{t('settings.items.helpCenter')}</ThemedText>
              <ThemedText style={styles.settingDescription}>
                {t('settings.items.helpCenterDesc')}
              </ThemedText>
            </View>
            <ThemedText style={styles.settingArrow}>›</ThemedText>
          </TouchableOpacity>
        </ThemedView>
        
        <ThemedView style={styles.section}>
          <ThemedText style={styles.sectionTitle}>{t('settings.sections.about')}</ThemedText>
          
          <TouchableOpacity style={styles.settingItem}>
            <ThemedText style={styles.settingLabel}>{t('settings.items.version')}</ThemedText>
            <ThemedText style={styles.settingValue}>1.0.0</ThemedText>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.settingItem}>
            <ThemedText style={styles.settingLabel}>{t('settings.items.termsOfService')}</ThemedText>
            <ThemedText style={styles.settingArrow}>›</ThemedText>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.settingItem}>
            <ThemedText style={styles.settingLabel}>{t('settings.items.privacyPolicy')}</ThemedText>
            <ThemedText style={styles.settingArrow}>›</ThemedText>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.settingItem}>
            <ThemedText style={styles.settingLabel}>{t('settings.items.licenses')}</ThemedText>
            <ThemedText style={styles.settingArrow}>›</ThemedText>
          </TouchableOpacity>
        </ThemedView>
        
        <TouchableOpacity style={styles.logoutButton}>
          <ThemedText style={styles.logoutButtonText}>{t('settings.items.logOut')}</ThemedText>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
    borderRadius: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  settingContent: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
  },
  settingDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  settingValue: {
    fontSize: 16,
    color: '#666',
  },
  settingArrow: {
    fontSize: 20,
    color: '#666',
    marginLeft: 8,
  },
  logoutButton: {
    marginHorizontal: 16,
    marginVertical: 24,
    padding: 16,
    backgroundColor: '#f44336',
    borderRadius: 8,
    alignItems: 'center',
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
});

export default SettingsScreen;