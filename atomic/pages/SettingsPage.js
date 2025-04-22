/**
 * Settings Page
 * 
 * A page component for the settings screen using the atomic architecture.
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Switch, Alert, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as Linking from 'expo-linking';
import Constants from 'expo-constants';

// Import atomic components
import { MainLayout } from '../templates';
import { useTheme } from '../molecules/themeContext';
import { firebaseService } from '../organisms';
import { monitoringService } from '../organisms';
import { useI18n } from '../molecules/i18nContext';

/**
 * Settings Page component
 * @returns {React.ReactNode} Rendered component
 */
const SettingsPage = () => {
  // Get theme from context
  const { colors, theme, setTheme } = useTheme();
  
  // Navigation
  const navigation = useNavigation();
  
  // Get translations
  const { t, locale, setLocale } = useI18n();
  
  // State
  const [loading, setLoading] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [locationEnabled, setLocationEnabled] = useState(false);
  const [analyticsEnabled, setAnalyticsEnabled] = useState(true);
  const [appVersion, setAppVersion] = useState('');
  
  // Fetch settings on mount
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        
        // Get user data
        const user = firebaseService.auth.getCurrentUser();
        if (!user) {
          navigation.navigate('Login');
          return;
        }
        
        // Get user settings
        const userSettings = await firebaseService.firestore.getUserSettings(user.uid);
        if (userSettings) {
          setNotificationsEnabled(userSettings.notifications || false);
          setLocationEnabled(userSettings.location || false);
          setAnalyticsEnabled(userSettings.analytics !== false); // Default to true
        }
        
        // Get app version
        setAppVersion(Constants.manifest.version || '1.0.0');
      } catch (error) {
        monitoringService.error.captureException(error);
        Alert.alert(t('common.error'), t('settings.errors.loadFailed'));
      } finally {
        setLoading(false);
      }
    };
    
    fetchSettings();
  }, [navigation, t]);
  
  /**
   * Save settings
   */
  const saveSettings = useCallback(async () => {
    try {
      setLoading(true);
      
      const user = firebaseService.auth.getCurrentUser();
      if (!user) {
        navigation.navigate('Login');
        return;
      }
      
      // Save user settings
      await firebaseService.firestore.updateUserSettings(user.uid, {
        notifications: notificationsEnabled,
        location: locationEnabled,
        analytics: analyticsEnabled,
      });
      
      Alert.alert(t('common.success'), t('settings.alerts.saved'));
    } catch (error) {
      monitoringService.error.captureException(error);
      Alert.alert(t('common.error'), t('settings.errors.saveFailed'));
    } finally {
      setLoading(false);
    }
  }, [notificationsEnabled, locationEnabled, analyticsEnabled, navigation, t]);
  
  /**
   * Toggle theme
   */
  const toggleTheme = useCallback(() => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  }, [theme, setTheme]);
  
  /**
   * Toggle language
   */
  const toggleLanguage = useCallback(() => {
    setLocale(locale === 'en' ? 'es' : 'en');
  }, [locale, setLocale]);
  
  /**
   * Open privacy policy
   */
  const openPrivacyPolicy = useCallback(() => {
    Linking.openURL('https://aisportsedge.app/privacy');
  }, []);
  
  /**
   * Open terms of service
   */
  const openTermsOfService = useCallback(() => {
    Linking.openURL('https://aisportsedge.app/terms');
  }, []);
  
  /**
   * Open help center
   */
  const openHelpCenter = useCallback(() => {
    Linking.openURL('https://aisportsedge.app/help');
  }, []);
  
  /**
   * Delete account
   */
  const deleteAccount = useCallback(() => {
    Alert.alert(
      t('settings.deleteAccount'),
      t('settings.deleteAccountConfirm'),
      [
        {
          text: t('common.cancel'),
          style: 'cancel',
        },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              
              const user = firebaseService.auth.getCurrentUser();
              if (!user) {
                navigation.navigate('Login');
                return;
              }
              
              // Delete user data
              await firebaseService.firestore.deleteUserData(user.uid);
              
              // Delete user account
              await firebaseService.auth.deleteUser();
              
              // Navigate to login
              navigation.navigate('Login');
            } catch (error) {
              monitoringService.error.captureException(error);
              Alert.alert(t('common.error'), t('settings.errors.deleteFailed'));
              setLoading(false);
            }
          },
        },
      ],
      { cancelable: true }
    );
  }, [navigation, t]);
  
  // Content component
  const Content = useMemo(() => () => (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.contentContainer}
    >
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            {t('common.loading')}
          </Text>
        </View>
      ) : (
        <>
          {/* Appearance Section */}
          <View style={[styles.section, { backgroundColor: colors.surface }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              {t('settings.appearance')}
            </Text>
            
            <View style={[styles.settingItem, { borderBottomColor: colors.border }]}>
              <Text style={[styles.settingLabel, { color: colors.text }]}>
                {t('settings.darkMode')}
              </Text>
              <Switch
                value={theme === 'dark'}
                onValueChange={toggleTheme}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={colors.background}
              />
            </View>
            
            <View style={styles.settingItem}>
              <Text style={[styles.settingLabel, { color: colors.text }]}>
                {t('settings.language')}
              </Text>
              <TouchableOpacity
                style={[styles.languageButton, { backgroundColor: colors.primary }]}
                onPress={toggleLanguage}
              >
                <Text style={[styles.languageButtonText, { color: colors.onPrimary }]}>
                  {locale === 'en' ? 'English' : 'Español'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          
          {/* Preferences Section */}
          <View style={[styles.section, { backgroundColor: colors.surface }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              {t('settings.preferences')}
            </Text>
            
            <View style={[styles.settingItem, { borderBottomColor: colors.border }]}>
              <Text style={[styles.settingLabel, { color: colors.text }]}>
                {t('settings.notifications')}
              </Text>
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={colors.background}
              />
            </View>
            
            <View style={[styles.settingItem, { borderBottomColor: colors.border }]}>
              <Text style={[styles.settingLabel, { color: colors.text }]}>
                {t('settings.location')}
              </Text>
              <Switch
                value={locationEnabled}
                onValueChange={setLocationEnabled}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={colors.background}
              />
            </View>
            
            <View style={styles.settingItem}>
              <Text style={[styles.settingLabel, { color: colors.text }]}>
                {t('settings.analytics')}
              </Text>
              <Switch
                value={analyticsEnabled}
                onValueChange={setAnalyticsEnabled}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={colors.background}
              />
            </View>
          </View>
          
          {/* Support Section */}
          <View style={[styles.section, { backgroundColor: colors.surface }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              {t('settings.support')}
            </Text>
            
            <TouchableOpacity
              style={[styles.settingItem, { borderBottomColor: colors.border }]}
              onPress={openHelpCenter}
            >
              <Text style={[styles.settingLabel, { color: colors.text }]}>
                {t('settings.helpCenter')}
              </Text>
              <Text style={[styles.settingArrow, { color: colors.textSecondary }]}>
                ›
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.settingItem, { borderBottomColor: colors.border }]}
              onPress={openPrivacyPolicy}
            >
              <Text style={[styles.settingLabel, { color: colors.text }]}>
                {t('settings.privacyPolicy')}
              </Text>
              <Text style={[styles.settingArrow, { color: colors.textSecondary }]}>
                ›
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.settingItem}
              onPress={openTermsOfService}
            >
              <Text style={[styles.settingLabel, { color: colors.text }]}>
                {t('settings.termsOfService')}
              </Text>
              <Text style={[styles.settingArrow, { color: colors.textSecondary }]}>
                ›
              </Text>
            </TouchableOpacity>
          </View>
          
          {/* Account Section */}
          <View style={[styles.section, { backgroundColor: colors.surface }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              {t('settings.account')}
            </Text>
            
            <TouchableOpacity
              style={styles.settingItem}
              onPress={deleteAccount}
            >
              <Text style={[styles.deleteAccountText, { color: colors.error }]}>
                {t('settings.deleteAccount')}
              </Text>
            </TouchableOpacity>
          </View>
          
          {/* Save Button */}
          <TouchableOpacity
            style={[styles.saveButton, { backgroundColor: colors.primary }]}
            onPress={saveSettings}
            disabled={loading}
          >
            <Text style={[styles.saveButtonText, { color: colors.onPrimary }]}>
              {loading ? t('common.loading') : t('settings.saveSettings')}
            </Text>
          </TouchableOpacity>
          
          {/* App Version */}
          <Text style={[styles.versionText, { color: colors.textSecondary }]}>
            {t('settings.version')}: {appVersion}
          </Text>
        </>
      )}
    </ScrollView>
  ), [
    colors, loading, theme, locale, notificationsEnabled, locationEnabled, analyticsEnabled, 
    appVersion, toggleTheme, toggleLanguage, openPrivacyPolicy, openTermsOfService, 
    openHelpCenter, deleteAccount, saveSettings, t
  ]);
  
  // Render page using MainLayout template
  return (
    <MainLayout
      scrollable={false}
      safeArea={true}
    >
      <Content />
    </MainLayout>
  );
};

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
    marginTop: 12,
  },
  section: {
    borderRadius: 10,
    marginBottom: 16,
    overflow: 'hidden',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    padding: 16,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  settingLabel: {
    fontSize: 16,
  },
  settingArrow: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  languageButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  languageButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  deleteAccountText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  saveButton: {
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  versionText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
});

export default SettingsPage;
