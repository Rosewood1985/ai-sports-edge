import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

import { colors } from '../styles/theme';

/**
 * NotificationPermission component
 * Displays a banner to request notification permission
 */
const NotificationPermission = () => {
  const [showBanner, setShowBanner] = useState(false);
  const [permissionState, setPermissionState] = useState('default');

  useEffect(() => {
    // Check if OneSignal is loaded (web only)
    if (typeof window !== 'undefined' && window.OneSignal) {
      // Wait for OneSignal to initialize
      window.OneSignal.push(() => {
        // Get current permission state
        window.OneSignal.getNotificationPermission(permission => {
          setPermissionState(permission);

          // Show banner if permission is not granted and user hasn't dismissed it
          if (permission !== 'granted' && !localStorage.getItem('notificationBannerDismissed')) {
            setShowBanner(true);
          }
        });
      });
    }
  }, []);

  const requestPermission = () => {
    if (typeof window !== 'undefined' && window.OneSignal) {
      window.OneSignal.push(() => {
        window.OneSignal.registerForPushNotifications();
      });
      setShowBanner(false);
    }
  };

  const dismissBanner = () => {
    setShowBanner(false);
    if (typeof window !== 'undefined') {
      localStorage.setItem('notificationBannerDismissed', 'true');
    }
  };

  // Don't show anything if banner is hidden or on native platforms
  if (!showBanner || typeof window === 'undefined') {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>🔔</Text>
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.title}>Stay Updated!</Text>
          <Text style={styles.description}>
            Get real-time updates on game predictions and betting opportunities.
          </Text>
        </View>
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.enableButton} onPress={requestPermission}>
            <Text style={styles.enableButtonText}>Enable Notifications</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.dismissButton} onPress={dismissBanner}>
            <Text style={styles.dismissButtonText}>Not Now</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    maxWidth: 500,
    alignSelf: 'center',
    backgroundColor: colors.background.secondary,
    borderWidth: 1,
    borderColor: colors.neon.blue,
    borderRadius: 8,
    shadowColor: colors.neon.blue,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
    zIndex: 1000,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  iconContainer: {
    marginRight: 16,
  },
  icon: {
    fontSize: 24,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.neon.blue,
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: colors.text.primary,
  },
  buttonContainer: {
    marginLeft: 16,
  },
  enableButton: {
    backgroundColor: colors.neon.blue,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 4,
    marginBottom: 8,
  },
  enableButtonText: {
    color: colors.background.primary,
    fontWeight: 'bold',
    fontSize: 14,
    textAlign: 'center',
  },
  dismissButton: {
    backgroundColor: 'transparent',
  },
  dismissButtonText: {
    color: colors.text.secondary,
    fontSize: 12,
    textAlign: 'center',
    textDecorationLine: 'underline',
  },
});

export default NotificationPermission;
