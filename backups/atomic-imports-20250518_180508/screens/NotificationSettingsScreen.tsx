import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Switch, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '../atomic/atoms/ThemedText';
import { ThemedView } from '../atomic/atoms/ThemedView';
import Header from '../components/Header';
import { analyticsService } from '../services/analyticsService';
import pushNotificationService, {
  NotificationPreferences,
} from '../services/pushNotificationService';

/**
 * Notification Settings Screen
 *
 * This screen allows users to configure their notification preferences.
 */
const NotificationSettingsScreen: React.FC = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    enabled: true,
    gameAlerts: true,
    betReminders: true,
    specialOffers: true,
    newsUpdates: true,
    scoreUpdates: true,
    playerAlerts: true,
  });

  // Load notification preferences
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        setLoading(true);

        // Check notification permission
        const permission = await pushNotificationService.requestPermission();
        setHasPermission(permission);

        // Get notification preferences
        const prefs = await pushNotificationService.getNotificationPreferences();
        setPreferences(prefs);

        // Track screen view
        analyticsService.trackScreenView('notification_settings');
      } catch (error) {
        console.error('Error loading notification preferences:', error);
        Alert.alert('Error', 'Failed to load notification preferences. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadPreferences();
  }, []);

  // Save notification preferences
  const savePreferences = async () => {
    try {
      setSaving(true);

      await pushNotificationService.saveNotificationPreferences(preferences);

      // Track event
      analyticsService.trackEvent('notification_settings_updated', {
        enabled: preferences.enabled,
        gameAlerts: preferences.gameAlerts,
        betReminders: preferences.betReminders,
        specialOffers: preferences.specialOffers,
        newsUpdates: preferences.newsUpdates,
        scoreUpdates: preferences.scoreUpdates,
        playerAlerts: preferences.playerAlerts,
      });

      Alert.alert('Success', 'Notification preferences saved successfully.');
    } catch (error) {
      console.error('Error saving notification preferences:', error);
      Alert.alert('Error', 'Failed to save notification preferences. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Toggle a preference
  const togglePreference = (key: keyof NotificationPreferences) => {
    setPreferences(prev => {
      // If toggling the main enabled switch, update all preferences
      if (key === 'enabled') {
        const newEnabled = !prev.enabled;
        return {
          ...prev,
          enabled: newEnabled,
          // If enabling, keep current preferences, if disabling, disable all
          gameAlerts: newEnabled ? prev.gameAlerts : false,
          betReminders: newEnabled ? prev.betReminders : false,
          specialOffers: newEnabled ? prev.specialOffers : false,
          newsUpdates: newEnabled ? prev.newsUpdates : false,
          scoreUpdates: newEnabled ? prev.scoreUpdates : false,
          playerAlerts: newEnabled ? prev.playerAlerts : false,
        };
      }

      // Otherwise, just toggle the specific preference
      return {
        ...prev,
        [key]: !prev[key],
      };
    });
  };

  // Request notification permission
  const requestPermission = async () => {
    try {
      const permission = await pushNotificationService.requestPermission();
      setHasPermission(permission);

      if (permission) {
        Alert.alert('Success', 'Notification permission granted.');
      } else {
        Alert.alert(
          'Permission Denied',
          'Please enable notifications in your device settings to receive updates.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      Alert.alert('Error', 'Failed to request notification permission. Please try again.');
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0a7ea4" />
        <ThemedText style={styles.loadingText}>Loading notification settings...</ThemedText>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Notification Settings" onRefresh={() => {}} isLoading={loading} />

      <ScrollView style={styles.scrollView}>
        <ThemedView style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Notification Status</ThemedText>

          <View style={styles.permissionContainer}>
            <ThemedText style={styles.permissionText}>
              {hasPermission
                ? 'Notifications are enabled for this app'
                : 'Notifications are disabled for this app'}
            </ThemedText>

            {!hasPermission && (
              <ThemedText style={styles.permissionButton} onPress={requestPermission}>
                Enable Notifications
              </ThemedText>
            )}
          </View>
        </ThemedView>

        <ThemedView style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Notification Preferences</ThemedText>

          <View style={styles.preferenceItem}>
            <ThemedText style={styles.preferenceLabel}>Enable All Notifications</ThemedText>
            <Switch
              value={preferences.enabled}
              onValueChange={() => togglePreference('enabled')}
              disabled={!hasPermission || saving}
            />
          </View>

          <View style={[styles.divider, !preferences.enabled && styles.disabled]} />

          <View style={styles.preferenceItem}>
            <ThemedText
              style={[styles.preferenceLabel, !preferences.enabled && styles.disabledText]}
            >
              Game Alerts
            </ThemedText>
            <Switch
              value={preferences.enabled && preferences.gameAlerts}
              onValueChange={() => togglePreference('gameAlerts')}
              disabled={!preferences.enabled || !hasPermission || saving}
            />
          </View>

          <View style={styles.preferenceDescription}>
            <ThemedText
              style={[styles.descriptionText, !preferences.enabled && styles.disabledText]}
            >
              Receive alerts for game starts, scores, and results
            </ThemedText>
          </View>

          <View style={[styles.divider, !preferences.enabled && styles.disabled]} />

          <View style={styles.preferenceItem}>
            <ThemedText
              style={[styles.preferenceLabel, !preferences.enabled && styles.disabledText]}
            >
              Betting Reminders
            </ThemedText>
            <Switch
              value={preferences.enabled && preferences.betReminders}
              onValueChange={() => togglePreference('betReminders')}
              disabled={!preferences.enabled || !hasPermission || saving}
            />
          </View>

          <View style={styles.preferenceDescription}>
            <ThemedText
              style={[styles.descriptionText, !preferences.enabled && styles.disabledText]}
            >
              Receive reminders about upcoming bets and opportunities
            </ThemedText>
          </View>

          <View style={[styles.divider, !preferences.enabled && styles.disabled]} />

          <View style={styles.preferenceItem}>
            <ThemedText
              style={[styles.preferenceLabel, !preferences.enabled && styles.disabledText]}
            >
              Special Offers
            </ThemedText>
            <Switch
              value={preferences.enabled && preferences.specialOffers}
              onValueChange={() => togglePreference('specialOffers')}
              disabled={!preferences.enabled || !hasPermission || saving}
            />
          </View>

          <View style={styles.preferenceDescription}>
            <ThemedText
              style={[styles.descriptionText, !preferences.enabled && styles.disabledText]}
            >
              Receive notifications about promotions and special offers
            </ThemedText>
          </View>

          <View style={[styles.divider, !preferences.enabled && styles.disabled]} />

          <View style={styles.preferenceItem}>
            <ThemedText
              style={[styles.preferenceLabel, !preferences.enabled && styles.disabledText]}
            >
              News Updates
            </ThemedText>
            <Switch
              value={preferences.enabled && preferences.newsUpdates}
              onValueChange={() => togglePreference('newsUpdates')}
              disabled={!preferences.enabled || !hasPermission || saving}
            />
          </View>

          <View style={styles.preferenceDescription}>
            <ThemedText
              style={[styles.descriptionText, !preferences.enabled && styles.disabledText]}
            >
              Receive notifications about sports news and updates
            </ThemedText>
          </View>

          <View style={[styles.divider, !preferences.enabled && styles.disabled]} />

          <View style={styles.preferenceItem}>
            <ThemedText
              style={[styles.preferenceLabel, !preferences.enabled && styles.disabledText]}
            >
              Score Updates
            </ThemedText>
            <Switch
              value={preferences.enabled && preferences.scoreUpdates}
              onValueChange={() => togglePreference('scoreUpdates')}
              disabled={!preferences.enabled || !hasPermission || saving}
            />
          </View>

          <View style={styles.preferenceDescription}>
            <ThemedText
              style={[styles.descriptionText, !preferences.enabled && styles.disabledText]}
            >
              Receive real-time score updates for your favorite teams
            </ThemedText>
          </View>

          <View style={[styles.divider, !preferences.enabled && styles.disabled]} />

          <View style={styles.preferenceItem}>
            <ThemedText
              style={[styles.preferenceLabel, !preferences.enabled && styles.disabledText]}
            >
              Player Alerts
            </ThemedText>
            <Switch
              value={preferences.enabled && preferences.playerAlerts}
              onValueChange={() => togglePreference('playerAlerts')}
              disabled={!preferences.enabled || !hasPermission || saving}
            />
          </View>

          <View style={styles.preferenceDescription}>
            <ThemedText
              style={[styles.descriptionText, !preferences.enabled && styles.disabledText]}
            >
              Receive alerts about player injuries, trades, and performance
            </ThemedText>
          </View>
        </ThemedView>

        <ThemedView style={styles.section}>
          <ThemedText style={styles.sectionTitle}>About Notifications</ThemedText>

          <ThemedText style={styles.aboutText}>
            AI Sports Edge sends notifications to keep you updated on games, betting opportunities,
            and important news. You can customize which notifications you receive using the
            preferences above.
          </ThemedText>

          <ThemedText style={styles.aboutText}>
            You can change your notification settings at any time from this screen.
          </ThemedText>
        </ThemedView>

        <ThemedView style={styles.saveButtonContainer}>
          <ThemedText
            style={[styles.saveButton, (saving || !hasPermission) && styles.disabledButton]}
            onPress={savePreferences}
            disabled={saving || !hasPermission}
          >
            {saving ? 'Saving...' : 'Save Preferences'}
          </ThemedText>
        </ThemedView>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
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
  permissionContainer: {
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  permissionText: {
    fontSize: 16,
    marginBottom: 8,
  },
  permissionButton: {
    fontSize: 16,
    color: '#0a7ea4',
    fontWeight: 'bold',
    padding: 8,
  },
  preferenceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  preferenceLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  preferenceDescription: {
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 14,
    color: '#666',
  },
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 8,
  },
  disabled: {
    opacity: 0.5,
  },
  disabledText: {
    opacity: 0.5,
  },
  aboutText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  saveButtonContainer: {
    marginHorizontal: 16,
    marginVertical: 24,
    alignItems: 'center',
  },
  saveButton: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    backgroundColor: '#0a7ea4',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    overflow: 'hidden',
    textAlign: 'center',
    width: '100%',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
});

export default NotificationSettingsScreen;
