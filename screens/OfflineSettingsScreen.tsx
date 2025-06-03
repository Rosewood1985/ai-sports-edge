import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  ScrollView,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '../atomic/atoms/ThemedText';
import { ThemedView } from '../atomic/atoms/ThemedView';
import Header from '../components/Header';
import { analyticsService } from '../services/analyticsService';
import offlineService, { OfflineMode } from '../services/offlineService';

/**
 * Offline Settings Screen
 *
 * This screen allows users to configure offline mode settings.
 */
const OfflineSettingsScreen: React.FC = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [cacheSize, setCacheSize] = useState<number>(0);
  const [syncQueueSize, setSyncQueueSize] = useState<number>(0);
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [settings, setSettings] = useState<OfflineMode>({
    enabled: true,
    cacheEnabled: true,
    syncEnabled: true,
    maxCacheSize: 50,
    maxSyncQueueSize: 100,
    cacheTTL: 24 * 60 * 60 * 1000, // 24 hours
  });

  // Load offline settings
  useEffect(() => {
    const loadSettings = async () => {
      try {
        setLoading(true);

        // Get offline mode settings
        const offlineMode = offlineService.getOfflineMode();
        setSettings(offlineMode);

        // Get cache size
        const size = await offlineService.getCacheSize();
        setCacheSize(size);

        // Get network status
        setIsOnline(offlineService.isNetworkAvailable());

        // Add network status listener
        const unsubscribe = offlineService.addListener(online => {
          setIsOnline(online);
        });

        // Track screen view
        analyticsService.trackScreenView('offline_settings');

        return () => {
          unsubscribe();
        };
      } catch (error) {
        console.error('Error loading offline settings:', error);
        Alert.alert('Error', 'Failed to load offline settings. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, []);

  // Save offline settings
  const saveSettings = async () => {
    try {
      setSaving(true);

      await offlineService.saveOfflineMode(settings);

      // Track event
      analyticsService.trackEvent('offline_settings_updated', {
        enabled: settings.enabled,
        cacheEnabled: settings.cacheEnabled,
        syncEnabled: settings.syncEnabled,
        maxCacheSize: settings.maxCacheSize,
        maxSyncQueueSize: settings.maxSyncQueueSize,
        cacheTTL: settings.cacheTTL,
      });

      Alert.alert('Success', 'Offline settings saved successfully.');
    } catch (error) {
      console.error('Error saving offline settings:', error);
      Alert.alert('Error', 'Failed to save offline settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Toggle a setting
  const toggleSetting = (key: keyof OfflineMode, value?: any) => {
    setSettings(prev => {
      // If toggling the main enabled switch, update cache and sync settings
      if (key === 'enabled') {
        const newEnabled = !prev.enabled;
        return {
          ...prev,
          enabled: newEnabled,
          // If disabling, disable cache and sync as well
          cacheEnabled: newEnabled ? prev.cacheEnabled : false,
          syncEnabled: newEnabled ? prev.syncEnabled : false,
        };
      }

      // Otherwise, just toggle the specific setting
      return {
        ...prev,
        [key]: value !== undefined ? value : !prev[key],
      };
    });
  };

  // Clear cache
  const handleClearCache = async () => {
    try {
      setLoading(true);

      await offlineService.clearCache();

      // Update cache size
      const size = await offlineService.getCacheSize();
      setCacheSize(size);

      Alert.alert('Success', 'Cache cleared successfully.');
    } catch (error) {
      console.error('Error clearing cache:', error);
      Alert.alert('Error', 'Failed to clear cache. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Sync pending operations
  const handleSyncNow = async () => {
    try {
      if (!isOnline) {
        Alert.alert(
          'Error',
          'Cannot sync while offline. Please connect to the internet and try again.'
        );
        return;
      }

      setLoading(true);

      await offlineService.syncPendingOperations();

      Alert.alert('Success', 'Sync completed successfully.');
    } catch (error) {
      console.error('Error syncing:', error);
      Alert.alert('Error', 'Failed to sync. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Format bytes to human-readable size
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0a7ea4" />
        <ThemedText style={styles.loadingText}>Loading offline settings...</ThemedText>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Offline Settings" onRefresh={() => {}} isLoading={loading} />

      <ScrollView style={styles.scrollView}>
        <ThemedView style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Network Status</ThemedText>

          <View style={styles.statusContainer}>
            <View style={styles.statusIndicator}>
              <View
                style={[styles.statusDot, { backgroundColor: isOnline ? '#4CAF50' : '#F44336' }]}
              />
              <ThemedText style={styles.statusText}>{isOnline ? 'Online' : 'Offline'}</ThemedText>
            </View>

            {!isOnline && (
              <ThemedText style={styles.offlineMessage}>
                You are currently offline. Some features may be limited.
              </ThemedText>
            )}
          </View>
        </ThemedView>

        <ThemedView style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Offline Mode</ThemedText>

          <View style={styles.settingItem}>
            <ThemedText style={styles.settingLabel}>Enable Offline Mode</ThemedText>
            <Switch
              value={settings.enabled}
              onValueChange={() => toggleSetting('enabled')}
              disabled={saving}
            />
          </View>

          <View style={styles.settingDescription}>
            <ThemedText style={styles.descriptionText}>
              Offline mode allows you to use the app without an internet connection. Data will be
              cached locally and synced when you're back online.
            </ThemedText>
          </View>

          <View style={[styles.divider, !settings.enabled && styles.disabled]} />

          <View style={styles.settingItem}>
            <ThemedText style={[styles.settingLabel, !settings.enabled && styles.disabledText]}>
              Enable Caching
            </ThemedText>
            <Switch
              value={settings.enabled && settings.cacheEnabled}
              onValueChange={() => toggleSetting('cacheEnabled')}
              disabled={!settings.enabled || saving}
            />
          </View>

          <View style={styles.settingDescription}>
            <ThemedText style={[styles.descriptionText, !settings.enabled && styles.disabledText]}>
              Caching stores data locally for offline access. This improves performance and allows
              you to view content when offline.
            </ThemedText>
          </View>

          <View style={[styles.divider, !settings.enabled && styles.disabled]} />

          <View style={styles.settingItem}>
            <ThemedText style={[styles.settingLabel, !settings.enabled && styles.disabledText]}>
              Enable Sync
            </ThemedText>
            <Switch
              value={settings.enabled && settings.syncEnabled}
              onValueChange={() => toggleSetting('syncEnabled')}
              disabled={!settings.enabled || saving}
            />
          </View>

          <View style={styles.settingDescription}>
            <ThemedText style={[styles.descriptionText, !settings.enabled && styles.disabledText]}>
              Sync allows you to make changes while offline and have them automatically synchronized
              when you're back online.
            </ThemedText>
          </View>
        </ThemedView>

        <ThemedView style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Cache Settings</ThemedText>

          <View style={styles.settingItem}>
            <ThemedText style={styles.settingLabel}>Current Cache Size</ThemedText>
            <ThemedText style={styles.settingValue}>{formatBytes(cacheSize)}</ThemedText>
          </View>

          <View style={styles.settingItem}>
            <ThemedText style={styles.settingLabel}>Maximum Cache Size</ThemedText>
            <View style={styles.sliderContainer}>
              <ThemedText style={styles.sliderValue}>{settings.maxCacheSize} MB</ThemedText>
              {/* Slider would go here in a real implementation */}
            </View>
          </View>

          <View style={styles.settingItem}>
            <ThemedText style={styles.settingLabel}>Cache Duration</ThemedText>
            <View style={styles.sliderContainer}>
              <ThemedText style={styles.sliderValue}>
                {settings.cacheTTL / (60 * 60 * 1000)} hours
              </ThemedText>
              {/* Slider would go here in a real implementation */}
            </View>
          </View>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleClearCache}
            disabled={saving || cacheSize === 0}
          >
            <ThemedText style={[styles.actionButtonText, cacheSize === 0 && styles.disabledText]}>
              Clear Cache
            </ThemedText>
          </TouchableOpacity>
        </ThemedView>

        <ThemedView style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Sync Settings</ThemedText>

          <View style={styles.settingItem}>
            <ThemedText style={styles.settingLabel}>Maximum Sync Queue Size</ThemedText>
            <View style={styles.sliderContainer}>
              <ThemedText style={styles.sliderValue}>{settings.maxSyncQueueSize} items</ThemedText>
              {/* Slider would go here in a real implementation */}
            </View>
          </View>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleSyncNow}
            disabled={saving || !isOnline || !settings.syncEnabled}
          >
            <ThemedText
              style={[
                styles.actionButtonText,
                (!isOnline || !settings.syncEnabled) && styles.disabledText,
              ]}
            >
              Sync Now
            </ThemedText>
          </TouchableOpacity>
        </ThemedView>

        <ThemedView style={styles.section}>
          <ThemedText style={styles.sectionTitle}>About Offline Mode</ThemedText>

          <ThemedText style={styles.aboutText}>
            Offline mode allows you to use AI Sports Edge even when you don't have an internet
            connection. Data is cached locally on your device and changes are synchronized when
            you're back online.
          </ThemedText>

          <ThemedText style={styles.aboutText}>
            Enabling caching will store data on your device, which may use storage space. You can
            adjust the maximum cache size and duration to control how much space is used.
          </ThemedText>

          <ThemedText style={styles.aboutText}>
            Enabling sync allows you to make changes while offline, which will be synchronized when
            you're back online. This includes updating preferences, saving favorites, and more.
          </ThemedText>
        </ThemedView>

        <ThemedView style={styles.saveButtonContainer}>
          <TouchableOpacity
            style={[styles.saveButton, saving && styles.disabledButton]}
            onPress={saveSettings}
            disabled={saving}
          >
            <ThemedText style={styles.saveButtonText}>
              {saving ? 'Saving...' : 'Save Settings'}
            </ThemedText>
          </TouchableOpacity>
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
  statusContainer: {
    marginBottom: 8,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '500',
  },
  offlineMessage: {
    fontSize: 14,
    color: '#F44336',
    marginTop: 4,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  settingValue: {
    fontSize: 16,
  },
  settingDescription: {
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
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sliderValue: {
    fontSize: 16,
    marginLeft: 8,
  },
  actionButton: {
    backgroundColor: '#f0f0f0',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#0a7ea4',
  },
  aboutText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  saveButtonContainer: {
    marginHorizontal: 16,
    marginVertical: 24,
  },
  saveButton: {
    backgroundColor: '#0a7ea4',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
});

export default OfflineSettingsScreen;
