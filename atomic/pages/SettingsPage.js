// External imports
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigation } from '@react-navigation/native';


import * as Linking from 'expo-linking';
import Constants from 'expo-constants';
import {


// Internal imports
import { MainLayout } from '../templates';
import { firebaseService } from '../organisms';
import { monitoringService } from '../organisms';
import { useI18n } from '../molecules/i18nContext';
import { useTheme } from '../molecules/themeContext';












































                    {locale === 'en' ? 'English' : 'Español'}
                  </Text>
                  <Text style={[styles.languageButtonText, { color: colors.onPrimary }]}>
                  onPress={toggleLanguage}
                  onValueChange={setAnalyticsEnabled}
                  onValueChange={setLocationEnabled}
                  onValueChange={setNotificationsEnabled}
                  onValueChange={toggleTheme}
                  style={[styles.languageButton, { backgroundColor: colors.primary }]}
                  thumbColor={colors.background}
                  thumbColor={colors.background}
                  thumbColor={colors.background}
                  thumbColor={colors.background}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  value={analyticsEnabled}
                  value={locationEnabled}
                  value={notificationsEnabled}
                  value={theme === 'dark'}
                  {t('settings.analytics')}
                  {t('settings.darkMode')}
                  {t('settings.deleteAccount')}
                  {t('settings.helpCenter')}
                  {t('settings.language')}
                  {t('settings.location')}
                  {t('settings.notifications')}
                  {t('settings.privacyPolicy')}
                  {t('settings.termsOfService')}
                />
                />
                />
                />
                </Text>
                </Text>
                </Text>
                </Text>
                </Text>
                </Text>
                </Text>
                </Text>
                </Text>
                </TouchableOpacity>
                <Switch
                <Switch
                <Switch
                <Switch
                <Text style={[styles.deleteAccountText, { color: colors.error }]}>
                <Text style={[styles.settingArrow, { color: colors.textSecondary }]}>›</Text>
                <Text style={[styles.settingArrow, { color: colors.textSecondary }]}>›</Text>
                <Text style={[styles.settingArrow, { color: colors.textSecondary }]}>›</Text>
                <Text style={[styles.settingLabel, { color: colors.text }]}>
                <Text style={[styles.settingLabel, { color: colors.text }]}>
                <Text style={[styles.settingLabel, { color: colors.text }]}>
                <Text style={[styles.settingLabel, { color: colors.text }]}>
                <Text style={[styles.settingLabel, { color: colors.text }]}>
                <Text style={[styles.settingLabel, { color: colors.text }]}>
                <Text style={[styles.settingLabel, { color: colors.text }]}>
                <Text style={[styles.settingLabel, { color: colors.text }]}>
                <TouchableOpacity
                >
                navigation.navigate('Login');
                onPress={openHelpCenter}
                onPress={openPrivacyPolicy}
                return;
                style={[styles.settingItem, { borderBottomColor: colors.border }]}
                style={[styles.settingItem, { borderBottomColor: colors.border }]}
                {loading ? t('common.loading') : t('settings.saveSettings')}
                {t('settings.account')}
                {t('settings.appearance')}
                {t('settings.preferences')}
                {t('settings.support')}
              // Delete user account
              // Delete user data
              // Navigate to login
              </Text>
              </Text>
              </Text>
              </Text>
              </Text>
              </TouchableOpacity>
              </TouchableOpacity>
              </TouchableOpacity>
              </TouchableOpacity>
              </View>
              </View>
              </View>
              </View>
              </View>
              <Text style={[styles.saveButtonText, { color: colors.onPrimary }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
              <TouchableOpacity
              <TouchableOpacity
              <TouchableOpacity style={styles.settingItem} onPress={deleteAccount}>
              <TouchableOpacity style={styles.settingItem} onPress={openTermsOfService}>
              <View style={[styles.settingItem, { borderBottomColor: colors.border }]}>
              <View style={[styles.settingItem, { borderBottomColor: colors.border }]}>
              <View style={[styles.settingItem, { borderBottomColor: colors.border }]}>
              <View style={styles.settingItem}>
              <View style={styles.settingItem}>
              >
              >
              Alert.alert(t('common.error'), t('settings.errors.deleteFailed'));
              await firebaseService.auth.deleteUser();
              await firebaseService.firestore.deleteUserData(user.uid);
              const user = firebaseService.auth.getCurrentUser();
              disabled={loading}
              if (!user) {
              monitoringService.error.captureException(error);
              navigation.navigate('Login');
              onPress={saveSettings}
              setLoading(false);
              setLoading(true);
              style={[styles.saveButton, { backgroundColor: colors.primary }]}
              {t('common.loading')}
              {t('settings.version')}: {appVersion}
              }
            </Text>
            </Text>
            </TouchableOpacity>
            </View>
            </View>
            </View>
            </View>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            <Text style={[styles.versionText, { color: colors.textSecondary }]}>
            <TouchableOpacity
            <View style={[styles.section, { backgroundColor: colors.surface }]}>
            <View style={[styles.section, { backgroundColor: colors.surface }]}>
            <View style={[styles.section, { backgroundColor: colors.surface }]}>
            <View style={[styles.section, { backgroundColor: colors.surface }]}>
            >
            try {
            {/* Account Section */}
            {/* App Version */}
            {/* Appearance Section */}
            {/* Preferences Section */}
            {/* Save Button */}
            {/* Support Section */}
            }
            } catch (error) {
          </>
          </View>
          <>
          <View style={styles.loadingContainer}>
          navigation.navigate('Login');
          onPress: async () => {
          return;
          setAnalyticsEnabled(userSettings.analytics !== false); // Default to true
          setLocationEnabled(userSettings.location || false);
          setNotificationsEnabled(userSettings.notifications || false);
          style: 'cancel',
          style: 'destructive',
          text: t('common.cancel'),
          text: t('common.delete'),
          },
        ) : (
        )}
        // Get app version
        // Get user data
        // Get user settings
        Alert.alert(t('common.error'), t('settings.errors.loadFailed'));
        analytics: analyticsEnabled,
        const user = firebaseService.auth.getCurrentUser();
        const userSettings = await firebaseService.firestore.getUserSettings(user.uid);
        contentContainerStyle={styles.contentContainer}
        if (!user) {
        if (userSettings) {
        location: locationEnabled,
        monitoringService.error.captureException(error);
        navigation.navigate('Login');
        notifications: notificationsEnabled,
        return;
        setAppVersion(Constants.manifest.version || '1.0.0');
        setLoading(false);
        setLoading(true);
        style={[styles.container, { backgroundColor: colors.background }]}
        {
        {
        {loading ? (
        }
        }
        },
        },
      // Save user settings
      </ScrollView>
      <Content />
      <ScrollView
      >
      Alert.alert(t('common.error'), t('settings.errors.saveFailed'));
      Alert.alert(t('common.success'), t('settings.alerts.saved'));
      [
      ],
      analyticsEnabled,
      appVersion,
      await firebaseService.firestore.updateUserSettings(user.uid, {
      colors,
      const user = firebaseService.auth.getCurrentUser();
      deleteAccount,
      if (!user) {
      loading,
      locale,
      locationEnabled,
      monitoringService.error.captureException(error);
      notificationsEnabled,
      openHelpCenter,
      openPrivacyPolicy,
      openTermsOfService,
      saveSettings,
      setLoading(false);
      setLoading(true);
      t('settings.deleteAccount'),
      t('settings.deleteAccountConfirm'),
      t,
      theme,
      toggleLanguage,
      toggleTheme,
      try {
      { cancelable: true }
      }
      }
      } catch (error) {
      } finally {
      });
    () => () => (
    ),
    );
    </MainLayout>
    <MainLayout scrollable={false} safeArea={true}>
    Alert.alert(
    Linking.openURL('https://aisportsedge.app/help');
    Linking.openURL('https://aisportsedge.app/privacy');
    Linking.openURL('https://aisportsedge.app/terms');
    [
    ]
    alignItems: 'center',
    alignItems: 'center',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderRadius: 10,
    borderRadius: 4,
    borderRadius: 8,
    const fetchSettings = async () => {
    fetchSettings();
    flex: 1,
    flex: 1,
    flexDirection: 'row',
    fontSize: 14,
    fontSize: 14,
    fontSize: 16,
    fontSize: 16,
    fontSize: 16,
    fontSize: 16,
    fontSize: 16,
    fontSize: 20,
    fontWeight: 'bold',
    fontWeight: 'bold',
    fontWeight: 'bold',
    fontWeight: 'bold',
    fontWeight: 'bold',
    height: 48,
    justifyContent: 'center',
    justifyContent: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    marginBottom: 16,
    marginBottom: 16,
    marginTop: 12,
    overflow: 'hidden',
    padding: 16,
    padding: 16,
    padding: 20,
    paddingBottom: 32,
    paddingHorizontal: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingVertical: 6,
    setLocale(locale === 'en' ? 'es' : 'en');
    setTheme(theme === 'dark' ? 'light' : 'dark');
    textAlign: 'center',
    try {
    }
    } catch (error) {
    } finally {
    };
   * Delete account
   * Open help center
   * Open privacy policy
   * Open terms of service
   * Save settings
   * Toggle language
   * Toggle theme
   */
   */
   */
   */
   */
   */
   */
  );
  );
  /**
  /**
  /**
  /**
  /**
  /**
  /**
  // Content component
  // Fetch settings on mount
  // Get theme from context
  // Get translations
  // Navigation
  // Render page using MainLayout template
  // State
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
  const Content = useMemo(
  const [analyticsEnabled, setAnalyticsEnabled] = useState(true);
  const [appVersion, setAppVersion] = useState('');
  const [loading, setLoading] = useState(false);
  const [locationEnabled, setLocationEnabled] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const deleteAccount = useCallback(() => {
  const navigation = useNavigation();
  const openHelpCenter = useCallback(() => {
  const openPrivacyPolicy = useCallback(() => {
  const openTermsOfService = useCallback(() => {
  const saveSettings = useCallback(async () => {
  const toggleLanguage = useCallback(() => {
  const toggleTheme = useCallback(() => {
  const { colors, theme, setTheme } = useTheme();
  const { t, locale, setLocale } = useI18n();
  container: {
  contentContainer: {
  deleteAccountText: {
  languageButton: {
  languageButtonText: {
  loadingContainer: {
  loadingText: {
  return (
  saveButton: {
  saveButtonText: {
  section: {
  sectionTitle: {
  settingArrow: {
  settingItem: {
  settingLabel: {
  useEffect(() => {
  versionText: {
  },
  },
  },
  },
  },
  },
  },
  },
  },
  },
  },
  },
  },
  },
  },
  }, []);
  }, []);
  }, []);
  }, [locale, setLocale]);
  }, [navigation, t]);
  }, [navigation, t]);
  }, [notificationsEnabled, locationEnabled, analyticsEnabled, navigation, t]);
  }, [theme, setTheme]);
 *
 * @returns {React.ReactNode} Rendered component
 * A page component for the settings screen using the atomic architecture.
 * Settings Page
 * Settings Page component
 */
 */
/**
/**
// Import atomic components
// Styles
const SettingsPage = () => {
const styles = StyleSheet.create({
export default SettingsPage;
} from 'react-native';
});
};

