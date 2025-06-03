import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useTheme } from '@react-navigation/native';
import React from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, Switch, Alert } from 'react-native';

import { ThemedText } from '../atomic/atoms/ThemedText';
import { ThemedView } from '../atomic/atoms/ThemedView';
import LanguageSelector from '../components/LanguageSelector';
import ThemeToggle from '../components/ThemeToggle';
import { useLanguage } from '../contexts/LanguageContext';

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
    <ThemedView style={styles.container}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <ThemedText style={styles.headerTitle}>{t('settings.app_settings')}</ThemedText>
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Appearance Section */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>{t('settings.theme_settings')}</ThemedText>

          <View style={[styles.settingItem, { borderBottomColor: colors.border }]}>
            <View style={styles.settingInfo}>
              <Ionicons name="moon-outline" size={24} color={colors.text} />
              <ThemedText style={styles.settingLabel}>{t('settings.dark_mode')}</ThemedText>
            </View>
            <ThemeToggle />
          </View>
        </View>

        {/* Language Section */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>{t('settings.language_settings')}</ThemedText>

          <TouchableOpacity
            style={[styles.settingItem, { borderBottomColor: colors.border }]}
            onPress={() => navigation.navigate('LanguageSettings' as never)}
          >
            <View style={styles.settingInfo}>
              <Ionicons name="language" size={24} color={colors.text} />
              <ThemedText style={styles.settingLabel}>{t('settings.language')}</ThemedText>
            </View>
            <View style={styles.settingAction}>
              <LanguageSelector showLabel={false} />
              <Ionicons name="chevron-forward" size={24} color={colors.text} />
            </View>
          </TouchableOpacity>
        </View>

        {/* Notifications Section */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>{t('settings.notification_settings')}</ThemedText>

          <View style={[styles.settingItem, { borderBottomColor: colors.border }]}>
            <View style={styles.settingInfo}>
              <Ionicons name="notifications-outline" size={24} color={colors.text} />
              <ThemedText style={styles.settingLabel}>
                {t('settings.push_notifications')}
              </ThemedText>
            </View>
            <Switch
              value={pushNotifications}
              onValueChange={setPushNotifications}
              trackColor={{ false: '#767577', true: colors.primary }}
              thumbColor="#f4f3f4"
            />
          </View>

          <View style={[styles.settingItem, { borderBottomColor: colors.border }]}>
            <View style={styles.settingInfo}>
              <Ionicons name="mail-outline" size={24} color={colors.text} />
              <ThemedText style={styles.settingLabel}>
                {t('settings.email_notifications')}
              </ThemedText>
            </View>
            <Switch
              value={emailNotifications}
              onValueChange={setEmailNotifications}
              trackColor={{ false: '#767577', true: colors.primary }}
              thumbColor="#f4f3f4"
            />
          </View>
        </View>

        {/* Data Usage Section */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>{t('settings.data_settings')}</ThemedText>

          <View style={[styles.settingItem, { borderBottomColor: colors.border }]}>
            <View style={styles.settingInfo}>
              <Ionicons name="wifi-outline" size={24} color={colors.text} />
              <ThemedText style={styles.settingLabel}>
                {t('settings.download_over_wifi')}
              </ThemedText>
            </View>
            <Switch
              value={downloadOverWifi}
              onValueChange={setDownloadOverWifi}
              trackColor={{ false: '#767577', true: colors.primary }}
              thumbColor="#f4f3f4"
            />
          </View>

          <View style={[styles.settingItem, { borderBottomColor: colors.border }]}>
            <View style={styles.settingInfo}>
              <Ionicons name="play-outline" size={24} color={colors.text} />
              <ThemedText style={styles.settingLabel}>{t('settings.auto_play_videos')}</ThemedText>
            </View>
            <Switch
              value={autoPlayVideos}
              onValueChange={setAutoPlayVideos}
              trackColor={{ false: '#767577', true: colors.primary }}
              thumbColor="#f4f3f4"
            />
          </View>

          <TouchableOpacity
            style={[styles.settingItem, { borderBottomColor: colors.border }]}
            onPress={handleClearCache}
          >
            <View style={styles.settingInfo}>
              <Ionicons name="trash-outline" size={24} color={colors.text} />
              <ThemedText style={styles.settingLabel}>{t('settings.clear_cache')}</ThemedText>
            </View>
            <Ionicons name="chevron-forward" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* About Section */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>{t('settings.about')}</ThemedText>

          <TouchableOpacity style={[styles.settingItem, { borderBottomColor: colors.border }]}>
            <View style={styles.settingInfo}>
              <Ionicons name="information-circle-outline" size={24} color={colors.text} />
              <ThemedText style={styles.settingLabel}>
                {t('settings.version', { version: '1.0.0' })}
              </ThemedText>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.settingItem, { borderBottomColor: colors.border }]}>
            <View style={styles.settingInfo}>
              <Ionicons name="document-text-outline" size={24} color={colors.text} />
              <ThemedText style={styles.settingLabel}>{t('settings.terms')}</ThemedText>
            </View>
            <Ionicons name="chevron-forward" size={24} color={colors.text} />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.settingItem, { borderBottomColor: colors.border }]}>
            <View style={styles.settingInfo}>
              <Ionicons name="shield-outline" size={24} color={colors.text} />
              <ThemedText style={styles.settingLabel}>{t('settings.privacy')}</ThemedText>
            </View>
            <Ionicons name="chevron-forward" size={24} color={colors.text} />
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
