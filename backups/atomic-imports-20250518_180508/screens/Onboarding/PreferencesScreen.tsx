import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useTheme } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, Switch } from 'react-native';

import { ThemedView, ThemedText } from '../../components/ThemedComponents';
import { useLanguage } from '../../contexts/LanguageContext';
import { OnboardingStackParamList } from '../../navigation/OnboardingNavigator';

type PreferencesScreenNavigationProp = StackNavigationProp<OnboardingStackParamList, 'Preferences'>;

interface SportPreference {
  id: string;
  name: string;
  selected: boolean;
}

interface NotificationPreference {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
}

const PreferencesScreen = () => {
  const navigation = useNavigation<PreferencesScreenNavigationProp>();
  const { colors } = useTheme();
  const { t } = useLanguage();

  const [sportPreferences, setSportPreferences] = useState<SportPreference[]>([
    { id: 'basketball', name: t('sports.basketball'), selected: false },
    { id: 'football', name: t('sports.football'), selected: false },
    { id: 'baseball', name: t('sports.baseball'), selected: false },
    { id: 'hockey', name: t('sports.hockey'), selected: false },
    { id: 'soccer', name: t('sports.soccer'), selected: false },
    { id: 'tennis', name: t('sports.tennis'), selected: false },
    { id: 'golf', name: t('sports.golf'), selected: false },
    { id: 'mma', name: t('sports.mma'), selected: false },
  ]);

  const [notificationPreferences, setNotificationPreferences] = useState<NotificationPreference[]>([
    {
      id: 'game_start',
      name: t('notifications.game_start.title'),
      description: t('notifications.game_start.description'),
      enabled: true,
    },
    {
      id: 'score_updates',
      name: t('notifications.score_updates.title'),
      description: t('notifications.score_updates.description'),
      enabled: true,
    },
    {
      id: 'betting_odds',
      name: t('notifications.betting_odds.title'),
      description: t('notifications.betting_odds.description'),
      enabled: false,
    },
    {
      id: 'injury_updates',
      name: t('notifications.injury_updates.title'),
      description: t('notifications.injury_updates.description'),
      enabled: true,
    },
    {
      id: 'breaking_news',
      name: t('notifications.breaking_news.title'),
      description: t('notifications.breaking_news.description'),
      enabled: true,
    },
  ]);

  const toggleSportPreference = (id: string) => {
    setSportPreferences(
      sportPreferences.map(sport =>
        sport.id === id ? { ...sport, selected: !sport.selected } : sport
      )
    );
  };

  const toggleNotificationPreference = (id: string) => {
    setNotificationPreferences(
      notificationPreferences.map(notification =>
        notification.id === id ? { ...notification, enabled: !notification.enabled } : notification
      )
    );
  };

  const handleContinue = () => {
    // Save preferences to context or API
    // Then navigate to the next screen
    navigation.navigate('AgeVerification');
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            accessible
            accessibilityLabel={t('navigation.back')}
            accessibilityRole="button"
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <ThemedText style={styles.title}>{t('onboarding.preferences_title')}</ThemedText>
        </View>

        <ThemedText style={styles.description}>
          {t('onboarding.preferences_description')}
        </ThemedText>

        <ThemedText style={styles.sectionTitle}>{t('preferences.favorite_sports')}</ThemedText>

        <View style={styles.sportsGrid}>
          {sportPreferences.map(sport => (
            <TouchableOpacity
              key={sport.id}
              style={[
                styles.sportItem,
                sport.selected && { backgroundColor: colors.primary + '20' },
                { borderColor: sport.selected ? colors.primary : colors.border },
              ]}
              onPress={() => toggleSportPreference(sport.id)}
              accessible
              accessibilityLabel={sport.name}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: sport.selected }}
            >
              <Ionicons
                name={sport.selected ? 'checkmark-circle' : 'ellipse-outline'}
                size={24}
                color={sport.selected ? colors.primary : colors.text}
                style={styles.sportIcon}
              />
              <ThemedText style={styles.sportName}>{sport.name}</ThemedText>
            </TouchableOpacity>
          ))}
        </View>

        <ThemedText style={styles.sectionTitle}>{t('preferences.notifications')}</ThemedText>

        <View style={styles.notificationsList}>
          {notificationPreferences.map(notification => (
            <View key={notification.id} style={styles.notificationItem}>
              <View style={styles.notificationInfo}>
                <ThemedText style={styles.notificationName}>{notification.name}</ThemedText>
                <ThemedText style={styles.notificationDescription}>
                  {notification.description}
                </ThemedText>
              </View>
              <Switch
                value={notification.enabled}
                onValueChange={() => toggleNotificationPreference(notification.id)}
                trackColor={{ false: colors.border, true: colors.primary + '80' }}
                thumbColor={notification.enabled ? colors.primary : colors.card}
                accessible
                accessibilityLabel={notification.name}
                accessibilityRole="switch"
                accessibilityState={{ checked: notification.enabled }}
              />
            </View>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.continueButton, { backgroundColor: colors.primary }]}
          onPress={handleContinue}
          accessible
          accessibilityLabel={t('navigation.continue')}
          accessibilityRole="button"
        >
          <ThemedText style={styles.continueButtonText}>{t('navigation.continue')}</ThemedText>
        </TouchableOpacity>

        <ThemedText style={styles.skipText}>{t('onboarding.preferences_skip')}</ThemedText>
      </ScrollView>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  backButton: {
    marginRight: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  description: {
    fontSize: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  sportsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 24,
  },
  sportItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '48%',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    marginRight: '4%',
  },
  sportIcon: {
    marginRight: 8,
  },
  sportName: {
    fontSize: 14,
  },
  notificationsList: {
    marginBottom: 24,
  },
  notificationItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  notificationInfo: {
    flex: 1,
    marginRight: 16,
  },
  notificationName: {
    fontSize: 16,
    marginBottom: 4,
  },
  notificationDescription: {
    fontSize: 14,
    opacity: 0.7,
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
  skipText: {
    fontSize: 14,
    textAlign: 'center',
    textDecorationLine: 'underline',
    marginBottom: 24,
  },
});

export default PreferencesScreen;
