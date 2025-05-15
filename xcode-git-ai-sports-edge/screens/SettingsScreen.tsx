// ✅ MIGRATED: Firebase Atomic Architecture
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  ScrollView,
  Alert,
  ActivityIndicator,
  useColorScheme
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { resetOnboardingStatus } from '../services/onboardingService';
import { auth } from '../config/firebase';
import { useTheme, ThemeType } from '../contexts/ThemeContext';
import {
  getNotificationPreferences,
  saveNotificationPreferences,
  requestNotificationPermissions,
  NotificationPreferences
} from '../services/notificationService';

/**
 * Settings screen component
 * @returns {JSX.Element} - Rendered component
 */
const SettingsScreen = (): JSX.Element => {
  const [notificationPrefs, setNotificationPrefs] = useState<NotificationPreferences>({
    enabled: true,
    betAlerts: true,
    gameStartAlerts: true,
    promotionalAlerts: false,
    dailyInsights: true,
  });
  const [loading, setLoading] = useState(false);
  const [loadingPrefs, setLoadingPrefs] = useState(true);
  const navigation = useNavigation();
  const deviceTheme = useColorScheme();
  const { theme, isDark, setTheme, colors } = useTheme();
  
  // Load notification preferences
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        setLoadingPrefs(true);
        const prefs = await getNotificationPreferences();
        setNotificationPrefs(prefs);
      } catch (error) {
        console.error('Error loading notification preferences:', error);
      } finally {
        setLoadingPrefs(false);
      }
    };
    
    loadPreferences();
  }, []);
  
  // Create theme-specific styles
  const themedStyles = {
    container: {
      ...styles.container,
      backgroundColor: colors.background,
    },
    title: {
      ...styles.title,
      color: colors.text,
    },
    section: {
      ...styles.section,
      backgroundColor: colors.card,
      shadowColor: isDark ? 'rgba(0, 0, 0, 0.3)' : '#000',
    },
    sectionTitle: {
      ...styles.sectionTitle,
      color: colors.primary,
    },
    settingTitle: {
      ...styles.settingTitle,
      color: colors.text,
    },
    settingDescription: {
      ...styles.settingDescription,
      color: isDark ? '#aaa' : '#666',
    },
    versionText: {
      ...styles.versionText,
      color: isDark ? '#777' : '#999',
    },
  };

  // Handle dark mode toggle
  const handleDarkModeToggle = () => {
    // Toggle between light and dark mode
    setTheme(isDark ? 'light' : 'dark');
  };

  // Handle system theme toggle
  const handleUseSystemTheme = (value: boolean) => {
    if (value) {
      setTheme('system');
    } else {
      setTheme(deviceTheme === 'dark' ? 'dark' : 'light');
    }
  };

  const handlePushNotificationsToggle = async () => {
    try {
      const newValue = !notificationPrefs.enabled;
      
      // If enabling notifications, request permissions
      if (newValue) {
        const permissionGranted = await requestNotificationPermissions();
        if (!permissionGranted) {
          Alert.alert(
            'Permission Required',
            'Please enable notifications in your device settings to receive updates.'
          );
          return;
        }
      }
      
      // Update local state
      setNotificationPrefs(prev => ({
        ...prev,
        enabled: newValue
      }));
      
      // Save to storage
      await saveNotificationPreferences({ enabled: newValue });
    } catch (error) {
      console.error('Error toggling notifications:', error);
      Alert.alert('Error', 'Failed to update notification settings');
    }
  };
  
  // Handle specific notification type toggle
  const handleNotificationTypeToggle = async (type: keyof Omit<NotificationPreferences, 'enabled'>) => {
    try {
      const newPrefs = {
        ...notificationPrefs,
        [type]: !notificationPrefs[type]
      };
      
      // Update local state
      setNotificationPrefs(newPrefs);
      
      // Save to storage
      await saveNotificationPreferences({ [type]: newPrefs[type] });
    } catch (error) {
      console.error(`Error toggling ${type} notifications:`, error);
      Alert.alert('Error', 'Failed to update notification settings');
    }
  };

  const handleViewOnboarding = async () => {
    setLoading(true);
    try {
      await resetOnboardingStatus();
      navigation.navigate('Onboarding' as never);
    } catch (error) {
      console.error('Error resetting onboarding status:', error);
      Alert.alert('Error', 'Failed to reset onboarding status');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
      navigation.navigate('Login' as never);
    } catch (error) {
      console.error('Error signing out:', error);
      Alert.alert('Error', 'Failed to sign out');
    }
  };

  const renderSettingItem = (
    icon: string,
    title: string,
    description: string,
    action: React.ReactNode
  ) => (
    <View style={{
      ...styles.settingItem,
      borderTopColor: isDark ? '#333' : '#f0f0f0',
    }}>
      <View style={styles.settingIconContainer}>
        <Ionicons name={icon as any} size={24} color={colors.primary} />
      </View>
      <View style={styles.settingContent}>
        <Text style={themedStyles.settingTitle}>{title}</Text>
        <Text style={themedStyles.settingDescription}>{description}</Text>
      </View>
      <View style={styles.settingAction}>
        {action}
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={{
        ...styles.loadingContainer,
        backgroundColor: colors.background
      }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // No duplicate declarations needed here

  return (
    <ScrollView style={themedStyles.container}>
      <Text style={themedStyles.title}>Settings</Text>
      
      <View style={themedStyles.section}>
        <Text style={themedStyles.sectionTitle}>Appearance</Text>
        {renderSettingItem(
          'moon',
          'Dark Mode',
          'Switch to dark theme for better viewing at night',
          <Switch
            value={isDark}
            onValueChange={handleDarkModeToggle}
            trackColor={{ false: '#d9d9d9', true: '#3498db' }}
            thumbColor={isDark ? '#fff' : '#f4f3f4'}
          />
        )}
        {renderSettingItem(
          'sync',
          'Use System Theme',
          'Automatically switch theme based on device settings',
          <Switch
            value={theme === 'system'}
            onValueChange={handleUseSystemTheme}
            trackColor={{ false: '#d9d9d9', true: '#3498db' }}
            thumbColor={theme === 'system' ? '#fff' : '#f4f3f4'}
          />
        )}
      </View>
      
      <View style={themedStyles.section}>
        <Text style={themedStyles.sectionTitle}>Notifications</Text>
        {renderSettingItem(
          'notifications',
          'Push Notifications',
          'Enable or disable all notifications',
          <Switch
            value={notificationPrefs.enabled}
            onValueChange={handlePushNotificationsToggle}
            trackColor={{ false: '#d9d9d9', true: '#3498db' }}
            thumbColor={notificationPrefs.enabled ? '#fff' : '#f4f3f4'}
          />
        )}
        
        {notificationPrefs.enabled && (
          <>
            {renderSettingItem(
              'alarm',
              'Game Start Alerts',
              'Get notified when games are about to start',
              <Switch
                value={notificationPrefs.gameStartAlerts}
                onValueChange={() => handleNotificationTypeToggle('gameStartAlerts')}
                trackColor={{ false: '#d9d9d9', true: '#3498db' }}
                thumbColor={notificationPrefs.gameStartAlerts ? '#fff' : '#f4f3f4'}
              />
            )}
            
            {renderSettingItem(
              'analytics',
              'Betting Alerts',
              'Get notified about favorable betting opportunities',
              <Switch
                value={notificationPrefs.betAlerts}
                onValueChange={() => handleNotificationTypeToggle('betAlerts')}
                trackColor={{ false: '#d9d9d9', true: '#3498db' }}
                thumbColor={notificationPrefs.betAlerts ? '#fff' : '#f4f3f4'}
              />
            )}
            
            {renderSettingItem(
              'today',
              'Daily Insights',
              'Receive daily AI betting insights',
              <Switch
                value={notificationPrefs.dailyInsights}
                onValueChange={() => handleNotificationTypeToggle('dailyInsights')}
                trackColor={{ false: '#d9d9d9', true: '#3498db' }}
                thumbColor={notificationPrefs.dailyInsights ? '#fff' : '#f4f3f4'}
              />
            )}
            
            {renderSettingItem(
              'megaphone',
              'Promotional Alerts',
              'Receive updates about new features and offers',
              <Switch
                value={notificationPrefs.promotionalAlerts}
                onValueChange={() => handleNotificationTypeToggle('promotionalAlerts')}
                trackColor={{ false: '#d9d9d9', true: '#3498db' }}
                thumbColor={notificationPrefs.promotionalAlerts ? '#fff' : '#f4f3f4'}
              />
            )}
          </>
        )}
      </View>
      
      <View style={themedStyles.section}>
        <Text style={themedStyles.sectionTitle}>App</Text>
        {renderSettingItem(
          'newspaper-outline',
          'AI Sports News',
          'Get AI-powered insights on sports news',
          <TouchableOpacity onPress={() => {
            // @ts-ignore - Navigation typing issue
            navigation.navigate('SportsNews');
          }}>
            <Ionicons name="chevron-forward" size={24} color="#999" />
          </TouchableOpacity>
        )}
        
        {renderSettingItem(
          'trophy-outline',
          'League Preferences',
          'Select which leagues to follow',
          <TouchableOpacity onPress={() => {
            // @ts-ignore - Navigation typing issue
            navigation.navigate('LeagueSelection');
          }}>
            <Ionicons name="chevron-forward" size={24} color="#999" />
          </TouchableOpacity>
        )}
        
        {renderSettingItem(
          'information-circle',
          'View Onboarding',
          'Take the app tour again to learn about features',
          <TouchableOpacity onPress={handleViewOnboarding}>
            <Ionicons name="chevron-forward" size={24} color="#999" />
          </TouchableOpacity>
        )}
        
        {renderSettingItem(
          'document-text',
          'Terms & Conditions',
          'Read our terms of service',
          <TouchableOpacity>
            <Ionicons name="chevron-forward" size={24} color="#999" />
          </TouchableOpacity>
        )}
        
        {renderSettingItem(
          'shield',
          'Privacy Policy',
          'Learn how we protect your data',
          <TouchableOpacity>
            <Ionicons name="chevron-forward" size={24} color="#999" />
          </TouchableOpacity>
        )}
      </View>
      
      <View style={themedStyles.section}>
        <Text style={themedStyles.sectionTitle}>Account</Text>
        {renderSettingItem(
          'card',
          'Manage Subscription',
          'View and manage your subscription details',
          <TouchableOpacity onPress={() => {
            // @ts-ignore - Navigation typing issue
            navigation.navigate('SubscriptionManagement');
          }}>
            <Ionicons name="chevron-forward" size={24} color="#999" />
          </TouchableOpacity>
        )}
        {renderSettingItem(
          'log-out',
          'Logout',
          'Sign out of your account',
          <TouchableOpacity onPress={handleLogout}>
            <Ionicons name="chevron-forward" size={24} color="#999" />
          </TouchableOpacity>
        )}
      </View>
      
      <Text style={themedStyles.versionText}>Version 1.0.0</Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  section: {
    marginBottom: 24,
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3498db',
    marginVertical: 12,
    paddingHorizontal: 16,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  settingIconContainer: {
    width: 40,
    alignItems: 'center',
  },
  settingContent: {
    flex: 1,
    marginLeft: 12,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: '#666',
  },
  settingAction: {
    marginLeft: 12,
  },
  versionText: {
    textAlign: 'center',
    color: '#999',
    marginVertical: 20,
    fontSize: 14,
  },
});

export default SettingsScreen;