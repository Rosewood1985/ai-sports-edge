import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useTheme } from '@react-navigation/native';
import { ThemeToggle } from 'atomic/molecules/theme';
import React from 'react';
import { View, StyleSheet, ScrollView, Switch, Alert } from 'react-native';

import { AccessibleThemedText } from '../atomic/atoms/AccessibleThemedText';
import { AccessibleThemedView } from '../atomic/atoms/AccessibleThemedView';
import AccessibleTouchableOpacity from '../atomic/atoms/AccessibleTouchableOpacity';
import { LanguageSelector } from '../atomic/molecules';
import { useLanguage } from '../atomic/organisms/i18n/LanguageContext';

const SettingsScreen = () => {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const { t } = useLanguage();

  // Mock settings state
  const [darkMode, setDarkMode] = React.useState(false);
  const [pushNotifications, setPushNotifications] = React.useState(true);
  const [emailNotifications, setEmailNotifications] = React.useState(false);
  const [autoPlayVideos, setAutoPlayVideos] = React.useState(true);
  const [downloadOverWifi, setDownloadOverWifi] = React.useState(true);

  // Handle clear cache
  const handleClearCache = () => {
    Alert.alert(t('common.confirm'), t('settings.clear_cache'), [
      {
        text: t('common.cancel'),
        style: 'cancel',
      },
      {
        text: t('common.ok'),
        onPress: () => {
          // Mock cache clearing
          Alert.alert(t('common.success'), 'Cache cleared successfully', [
            { text: t('common.ok') },
          ]);
        },
      },
    ]);
  };

  return (
    <AccessibleThemedView style={styles.container} accessibilityLabel={t('settings.app_settings')}>
      <AccessibleThemedView
        style={[styles.header, { borderBottomColor: colors.border }]}
        accessibilityLabel={t('settings.app_settings_header')}
      >
        <AccessibleThemedText style={styles.headerTitle} accessibilityRole="header">
          {t('settings.app_settings')}
        </AccessibleThemedText>
      </AccessibleThemedView>

      <ScrollView style={styles.scrollView} accessibilityLabel={t('settings.settings_list')}>
        {/* Appearance Section */}
        <AccessibleThemedView
          style={styles.section}
          accessibilityLabel={t('settings.theme_settings')}
        >
          <AccessibleThemedText style={styles.sectionTitle} accessibilityRole="header">
            {t('settings.theme_settings')}
          </AccessibleThemedText>

          <AccessibleThemedView
            style={[styles.settingItem, { borderBottomColor: colors.border }]}
            accessibilityLabel={t('settings.dark_mode_setting')}
          >
            <AccessibleThemedView style={styles.settingInfo}>
              <Ionicons
                name="moon-outline"
                size={24}
                color={colors.text}
                accessibilityLabel={t('settings.dark_mode_icon')}
              />
              <AccessibleThemedText style={styles.settingLabel}>
                {t('settings.dark_mode')}
              </AccessibleThemedText>
            </AccessibleThemedView>
            <ThemeToggle variant="switch" />
          </AccessibleThemedView>
        </AccessibleThemedView>

        {/* Language Section */}
        <AccessibleThemedView
          style={styles.section}
          accessibilityLabel={t('settings.language_settings')}
        >
          <AccessibleThemedText style={styles.sectionTitle} accessibilityRole="header">
            {t('settings.language_settings')}
          </AccessibleThemedText>

          <AccessibleTouchableOpacity
            style={[styles.settingItem, { borderBottomColor: colors.border }]}
            onPress={() => navigation.navigate('LanguageSettings' as never)}
            accessibilityLabel={t('settings.language')}
            accessibilityRole="button"
            accessibilityHint={t('settings.language_settings_hint')}
          >
            <AccessibleThemedView style={styles.settingInfo}>
              <Ionicons
                name="language"
                size={24}
                color={colors.text}
                accessibilityLabel={t('settings.language_icon')}
              />
              <AccessibleThemedText style={styles.settingLabel}>
                {t('settings.language')}
              </AccessibleThemedText>
            </AccessibleThemedView>
            <AccessibleThemedView style={styles.settingAction}>
              <LanguageSelector showLabel={false} />
              <Ionicons
                name="chevron-forward"
                size={24}
                color={colors.text}
                accessibilityLabel={t('settings.navigate_forward')}
              />
            </AccessibleThemedView>
          </AccessibleTouchableOpacity>
        </AccessibleThemedView>

        {/* Notifications Section */}
        <AccessibleThemedView
          style={styles.section}
          accessibilityLabel={t('settings.notification_settings')}
        >
          <AccessibleThemedText style={styles.sectionTitle} accessibilityRole="header">
            {t('settings.notification_settings')}
          </AccessibleThemedText>

          <AccessibleThemedView
            style={[styles.settingItem, { borderBottomColor: colors.border }]}
            accessibilityLabel={t('settings.push_notifications')}
          >
            <AccessibleThemedView style={styles.settingInfo}>
              <Ionicons
                name="notifications-outline"
                size={24}
                color={colors.text}
                accessibilityLabel={t('settings.notifications_icon')}
              />
              <AccessibleThemedText style={styles.settingLabel}>
                {t('settings.push_notifications')}
              </AccessibleThemedText>
            </AccessibleThemedView>
            <Switch
              value={pushNotifications}
              onValueChange={setPushNotifications}
              trackColor={{ false: '#767577', true: colors.primary }}
              thumbColor="#f4f3f4"
              accessible
              accessibilityLabel={t('settings.push_notifications')}
              accessibilityRole="switch"
              accessibilityState={{ checked: pushNotifications }}
              accessibilityHint={t('settings.toggle_push_notifications')}
            />
          </AccessibleThemedView>

          <AccessibleThemedView
            style={[styles.settingItem, { borderBottomColor: colors.border }]}
            accessibilityLabel={t('settings.email_notifications')}
          >
            <AccessibleThemedView style={styles.settingInfo}>
              <Ionicons
                name="mail-outline"
                size={24}
                color={colors.text}
                accessibilityLabel={t('settings.email_icon')}
              />
              <AccessibleThemedText style={styles.settingLabel}>
                {t('settings.email_notifications')}
              </AccessibleThemedText>
            </AccessibleThemedView>
            <Switch
              value={emailNotifications}
              onValueChange={setEmailNotifications}
              trackColor={{ false: '#767577', true: colors.primary }}
              thumbColor="#f4f3f4"
              accessible
              accessibilityLabel={t('settings.email_notifications')}
              accessibilityRole="switch"
              accessibilityState={{ checked: emailNotifications }}
              accessibilityHint={t('settings.toggle_email_notifications')}
            />
          </AccessibleThemedView>
        </AccessibleThemedView>

        {/* Data Usage Section */}
        <AccessibleThemedView
          style={styles.section}
          accessibilityLabel={t('settings.data_settings')}
        >
          <AccessibleThemedText style={styles.sectionTitle} accessibilityRole="header">
            {t('settings.data_settings')}
          </AccessibleThemedText>

          <AccessibleThemedView
            style={[styles.settingItem, { borderBottomColor: colors.border }]}
            accessibilityLabel={t('settings.download_over_wifi')}
          >
            <AccessibleThemedView style={styles.settingInfo}>
              <Ionicons
                name="wifi-outline"
                size={24}
                color={colors.text}
                accessibilityLabel={t('settings.wifi_icon')}
              />
              <AccessibleThemedText style={styles.settingLabel}>
                {t('settings.download_over_wifi')}
              </AccessibleThemedText>
            </AccessibleThemedView>
            <Switch
              value={downloadOverWifi}
              onValueChange={setDownloadOverWifi}
              trackColor={{ false: '#767577', true: colors.primary }}
              thumbColor="#f4f3f4"
              accessible
              accessibilityLabel={t('settings.download_over_wifi')}
              accessibilityRole="switch"
              accessibilityState={{ checked: downloadOverWifi }}
              accessibilityHint={t('settings.toggle_download_over_wifi')}
            />
          </AccessibleThemedView>

          <AccessibleThemedView
            style={[styles.settingItem, { borderBottomColor: colors.border }]}
            accessibilityLabel={t('settings.auto_play_videos')}
          >
            <AccessibleThemedView style={styles.settingInfo}>
              <Ionicons
                name="play-outline"
                size={24}
                color={colors.text}
                accessibilityLabel={t('settings.play_icon')}
              />
              <AccessibleThemedText style={styles.settingLabel}>
                {t('settings.auto_play_videos')}
              </AccessibleThemedText>
            </AccessibleThemedView>
            <Switch
              value={autoPlayVideos}
              onValueChange={setAutoPlayVideos}
              trackColor={{ false: '#767577', true: colors.primary }}
              thumbColor="#f4f3f4"
              accessible
              accessibilityLabel={t('settings.auto_play_videos')}
              accessibilityRole="switch"
              accessibilityState={{ checked: autoPlayVideos }}
              accessibilityHint={t('settings.toggle_auto_play_videos')}
            />
          </AccessibleThemedView>

          <AccessibleTouchableOpacity
            style={[styles.settingItem, { borderBottomColor: colors.border }]}
            onPress={handleClearCache}
            accessibilityLabel={t('settings.clear_cache')}
            accessibilityRole="button"
            accessibilityHint={t('settings.clear_cache_hint')}
          >
            <AccessibleThemedView style={styles.settingInfo}>
              <Ionicons
                name="trash-outline"
                size={24}
                color={colors.text}
                accessibilityLabel={t('settings.trash_icon')}
              />
              <AccessibleThemedText style={styles.settingLabel}>
                {t('settings.clear_cache')}
              </AccessibleThemedText>
            </AccessibleThemedView>
            <Ionicons
              name="chevron-forward"
              size={24}
              color={colors.text}
              accessibilityLabel={t('settings.navigate_forward')}
            />
          </AccessibleTouchableOpacity>
        </AccessibleThemedView>

        {/* About Section */}
        <AccessibleThemedView style={styles.section} accessibilityLabel={t('settings.about')}>
          <AccessibleThemedText style={styles.sectionTitle} accessibilityRole="header">
            {t('settings.about')}
          </AccessibleThemedText>

          <AccessibleTouchableOpacity
            style={[styles.settingItem, { borderBottomColor: colors.border }]}
            accessibilityLabel={t('settings.version', { version: '1.0.0' })}
            accessibilityRole="button"
          >
            <AccessibleThemedView style={styles.settingInfo}>
              <Ionicons
                name="information-circle-outline"
                size={24}
                color={colors.text}
                accessibilityLabel={t('settings.info_icon')}
              />
              <AccessibleThemedText style={styles.settingLabel}>
                {t('settings.version', { version: '1.0.0' })}
              </AccessibleThemedText>
            </AccessibleThemedView>
          </AccessibleTouchableOpacity>

          <AccessibleTouchableOpacity
            style={[styles.settingItem, { borderBottomColor: colors.border }]}
            accessibilityLabel={t('settings.terms')}
            accessibilityRole="button"
            accessibilityHint={t('settings.view_terms_hint')}
          >
            <AccessibleThemedView style={styles.settingInfo}>
              <Ionicons
                name="document-text-outline"
                size={24}
                color={colors.text}
                accessibilityLabel={t('settings.document_icon')}
              />
              <AccessibleThemedText style={styles.settingLabel}>
                {t('settings.terms')}
              </AccessibleThemedText>
            </AccessibleThemedView>
            <Ionicons
              name="chevron-forward"
              size={24}
              color={colors.text}
              accessibilityLabel={t('settings.navigate_forward')}
            />
          </AccessibleTouchableOpacity>

          <AccessibleTouchableOpacity
            style={[styles.settingItem, { borderBottomColor: colors.border }]}
            accessibilityLabel={t('settings.privacy')}
            accessibilityRole="button"
            accessibilityHint={t('settings.view_privacy_hint')}
          >
            <AccessibleThemedView style={styles.settingInfo}>
              <Ionicons
                name="shield-outline"
                size={24}
                color={colors.text}
                accessibilityLabel={t('settings.shield_icon')}
              />
              <AccessibleThemedText style={styles.settingLabel}>
                {t('settings.privacy')}
              </AccessibleThemedText>
            </AccessibleThemedView>
            <Ionicons
              name="chevron-forward"
              size={24}
              color={colors.text}
              accessibilityLabel={t('settings.navigate_forward')}
            />
          </AccessibleTouchableOpacity>
        </AccessibleThemedView>
      </ScrollView>
    </AccessibleThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginHorizontal: 16,
    marginBottom: 8,
    marginTop: 16,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingLabel: {
    fontSize: 16,
    marginLeft: 12,
  },
  settingAction: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});

export default SettingsScreen;
