import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Switch, Alert } from 'react-native';

import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';
import { auth } from '../config/firebase';
import { useThemeColor } from '../hooks/useThemeColor';
import { trackEvent } from '../services/analyticsService';
import {
  toggleAutoResubscribe,
  getUserSubscription,
} from '../services/firebaseSubscriptionService';

interface AutoResubscribeToggleProps {
  subscriptionId?: string;
}

export const AutoResubscribeToggle: React.FC<AutoResubscribeToggleProps> = ({ subscriptionId }) => {
  const [isEnabled, setIsEnabled] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const tintColor = useThemeColor({}, 'tint');

  useEffect(() => {
    loadAutoResubscribeStatus();
  }, [subscriptionId]);

  const loadAutoResubscribeStatus = async () => {
    try {
      setIsLoading(true);
      const userId = auth.currentUser?.uid;
      if (!userId || !subscriptionId) {
        setIsLoading(false);
        return;
      }

      // Get the subscription details
      const subscription = await getUserSubscription(userId);
      if (subscription) {
        setIsEnabled(subscription.autoResubscribe || false);
      }
    } catch (error) {
      console.error('Error loading auto-resubscribe status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle = async (value: boolean) => {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId || !subscriptionId) return;

      // Update the auto-resubscribe setting
      const result = await toggleAutoResubscribe(userId, subscriptionId, value);

      if (result && result.updated) {
        setIsEnabled(value);

        // Track the event
        trackEvent(
          value ? ('auto_resubscribe_enabled' as any) : ('auto_resubscribe_disabled' as any),
          { subscriptionId }
        );

        // Show confirmation
        Alert.alert(
          value ? 'Auto-Resubscribe Enabled' : 'Auto-Resubscribe Disabled',
          value
            ? 'Your subscription will automatically renew when it expires.'
            : 'Your subscription will not automatically renew when it expires.'
        );
      }
    } catch (error) {
      console.error('Error toggling auto-resubscribe:', error);
      Alert.alert('Error', 'Failed to update auto-resubscribe setting. Please try again.');
      // Revert the toggle
      setIsEnabled(!value);
    }
  };

  if (!subscriptionId) {
    return null;
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedText style={styles.title}>Auto-Resubscribe</ThemedText>

      <View style={styles.row}>
        <ThemedText style={styles.description}>
          Automatically renew your subscription when it expires
        </ThemedText>

        <Switch
          trackColor={{ false: '#767577', true: tintColor }}
          thumbColor="#f4f3f4"
          ios_backgroundColor="#3e3e3e"
          onValueChange={handleToggle}
          value={isEnabled}
          disabled={isLoading}
        />
      </View>

      <ThemedText style={styles.note}>
        {isEnabled
          ? 'Your subscription will automatically renew when it expires.'
          : 'Your subscription will not automatically renew when it expires.'}
      </ThemedText>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 8,
    marginVertical: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    flex: 1,
    marginRight: 16,
  },
  note: {
    fontSize: 14,
    fontStyle: 'italic',
    marginTop: 8,
  },
});
