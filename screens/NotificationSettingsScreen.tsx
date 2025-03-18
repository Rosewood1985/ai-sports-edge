import React, { useState, useEffect } from 'react';
import { View, Text, Switch, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { colors } from '../styles/theme';
import { auth, firestore } from '../config/firebase';
import { getDoc, doc, setDoc, updateDoc } from 'firebase/firestore';
import { OneSignal } from 'react-native-onesignal';

/**
 * NotificationSettingsScreen component
 * Allows users to manage their notification preferences
 */
const NotificationSettingsScreen: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState({
    predictions: true,
    valueBets: true,
    gameReminders: true,
    scoreUpdates: false,
    modelPerformance: true
  });
  
  useEffect(() => {
    // Load user preferences from Firestore
    const loadPreferences = async () => {
      try {
        const user = auth?.currentUser;
        if (!user || !firestore) {
          setLoading(false);
          return;
        }
        
        const userDocRef = doc(firestore, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          if (userData.preferences && userData.preferences.notifications) {
            setSettings(userData.preferences.notifications);
          }
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error loading notification preferences:', error);
        setLoading(false);
      }
    };
    
    loadPreferences();
  }, []);
  
  const updateSetting = async (key: string, value: boolean) => {
    try {
      // Update local state
      setSettings(prev => ({
        ...prev,
        [key]: value
      }));
      
      // Update OneSignal tags
      OneSignal.User.addTag(key, value ? 'true' : 'false');
      
      // Update Firestore
      const user = auth?.currentUser;
      if (!user || !firestore) return;
      
      const userDocRef = doc(firestore, 'users', user.uid);
      
      // Check if the document exists
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        // Update existing document
        await updateDoc(userDocRef, {
          [`preferences.notifications.${key}`]: value
        });
      } else {
        // Create new document
        await setDoc(userDocRef, {
          preferences: {
            notifications: {
              [key]: value
            }
          }
        }, { merge: true });
      }
    } catch (error) {
      console.error('Error updating notification setting:', error);
    }
  };
  
  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
        <ActivityIndicator size="large" color={colors.neon.blue} />
      </View>
    );
  }
  
  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background.primary }]}>
      <Text style={[styles.title, { color: colors.text.primary }]}>Notification Settings</Text>
      
      <View style={styles.settingItem}>
        <View style={styles.settingTextContainer}>
          <Text style={[styles.settingTitle, { color: colors.text.primary }]}>Predictions</Text>
          <Text style={[styles.settingDescription, { color: colors.text.secondary }]}>
            Receive notifications when new predictions are available
          </Text>
        </View>
        <Switch
          value={settings.predictions}
          onValueChange={(value) => updateSetting('predictions', value)}
          trackColor={{ false: colors.background.secondary, true: colors.neon.blue }}
          thumbColor={colors.background.primary}
        />
      </View>
      
      <View style={styles.settingItem}>
        <View style={styles.settingTextContainer}>
          <Text style={[styles.settingTitle, { color: colors.text.primary }]}>Value Bets</Text>
          <Text style={[styles.settingDescription, { color: colors.text.secondary }]}>
            Get notified about high-value betting opportunities
          </Text>
        </View>
        <Switch
          value={settings.valueBets}
          onValueChange={(value) => updateSetting('valueBets', value)}
          trackColor={{ false: colors.background.secondary, true: colors.neon.blue }}
          thumbColor={colors.background.primary}
        />
      </View>
      
      <View style={styles.settingItem}>
        <View style={styles.settingTextContainer}>
          <Text style={[styles.settingTitle, { color: colors.text.primary }]}>Game Reminders</Text>
          <Text style={[styles.settingDescription, { color: colors.text.secondary }]}>
            Receive reminders 30 minutes before game start
          </Text>
        </View>
        <Switch
          value={settings.gameReminders}
          onValueChange={(value) => updateSetting('gameReminders', value)}
          trackColor={{ false: colors.background.secondary, true: colors.neon.blue }}
          thumbColor={colors.background.primary}
        />
      </View>
      
      <View style={styles.settingItem}>
        <View style={styles.settingTextContainer}>
          <Text style={[styles.settingTitle, { color: colors.text.primary }]}>Score Updates</Text>
          <Text style={[styles.settingDescription, { color: colors.text.secondary }]}>
            Get real-time score updates for games you're following
          </Text>
        </View>
        <Switch
          value={settings.scoreUpdates}
          onValueChange={(value) => updateSetting('scoreUpdates', value)}
          trackColor={{ false: colors.background.secondary, true: colors.neon.blue }}
          thumbColor={colors.background.primary}
        />
      </View>
      
      <View style={styles.settingItem}>
        <View style={styles.settingTextContainer}>
          <Text style={[styles.settingTitle, { color: colors.text.primary }]}>Model Performance</Text>
          <Text style={[styles.settingDescription, { color: colors.text.secondary }]}>
            Receive weekly updates on prediction model performance
          </Text>
        </View>
        <Switch
          value={settings.modelPerformance}
          onValueChange={(value) => updateSetting('modelPerformance', value)}
          trackColor={{ false: colors.background.secondary, true: colors.neon.blue }}
          thumbColor={colors.background.primary}
        />
      </View>
      
      <View style={styles.infoContainer}>
        <Text style={[styles.infoText, { color: colors.text.secondary }]}>
          You can change these settings at any time. Notifications help you stay updated on the latest predictions and betting opportunities.
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  settingTextContainer: {
    flex: 1,
    marginRight: 16,
  },
  settingTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
  },
  infoContainer: {
    marginTop: 24,
    padding: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
  }
});

export default NotificationSettingsScreen;