import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch, Alert, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { auth } from '../config/firebase';
import { getFirestore, doc, getDoc, updateDoc } from 'firebase/firestore';

// Initialize Firestore
const firestore = getFirestore();
import { hasActiveSubscription } from '../services/subscriptionService';
import { ThemedText } from '../components/ThemedText';
import { ThemedView } from '../components/ThemedView';

const SettingsScreen: React.FC = () => {
  const navigation = useNavigation<StackNavigationProp<any>>();
  const [loading, setLoading] = useState<boolean>(true);
  const [hasSubscription, setHasSubscription] = useState<boolean>(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(true);
  const [darkModeEnabled, setDarkModeEnabled] = useState<boolean>(false);
  
  // Load user settings
  useEffect(() => {
    const loadUserSettings = async () => {
      try {
        setLoading(true);
        
        // Check if user is logged in
        const userId = auth.currentUser?.uid;
        if (!userId) {
          setLoading(false);
          return;
        }
        
        // Check if user has an active subscription
        const activeSubscription = await hasActiveSubscription(userId);
        setHasSubscription(activeSubscription);
        
        // Load user settings from Firestore
        const userDocRef = doc(firestore, 'users', userId);
        const userDocSnap = await getDoc(userDocRef);
        const userData = userDocSnap.data();
        
        if (userData) {
          setNotificationsEnabled(userData.notificationsEnabled !== false);
          setDarkModeEnabled(userData.darkModeEnabled === true);
        }
      } catch (error) {
        console.error('Error loading user settings:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadUserSettings();
  }, []);
  
  // Handle toggle notifications
  const handleToggleNotifications = async (value: boolean) => {
    try {
      setNotificationsEnabled(value);
      
      // Update user settings in Firestore
      const userId = auth.currentUser?.uid;
      if (userId) {
        const userDocRef = doc(firestore, 'users', userId);
        await updateDoc(userDocRef, {
          notificationsEnabled: value
        });
      }
    } catch (error) {
      console.error('Error updating notifications setting:', error);
      Alert.alert('Error', 'Failed to update notifications setting.');
      setNotificationsEnabled(!value); // Revert on error
    }
  };
  
  // Handle toggle dark mode
  const handleToggleDarkMode = async (value: boolean) => {
    try {
      setDarkModeEnabled(value);
      
      // Update user settings in Firestore
      const userId = auth.currentUser?.uid;
      if (userId) {
        const userDocRef = doc(firestore, 'users', userId);
        await updateDoc(userDocRef, {
          darkModeEnabled: value
        });
      }
    } catch (error) {
      console.error('Error updating dark mode setting:', error);
      Alert.alert('Error', 'Failed to update dark mode setting.');
      setDarkModeEnabled(!value); // Revert on error
    }
  };
  
  // Handle logout
  const handleLogout = async () => {
    try {
      await auth.signOut();
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }]
      });
    } catch (error) {
      console.error('Error signing out:', error);
      Alert.alert('Error', 'Failed to sign out. Please try again.');
    }
  };
  
  if (loading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4080ff" />
      </ThemedView>
    );
  }
  
  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Account Section */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Account</ThemedText>
          
          <TouchableOpacity 
            style={styles.settingItem}
            onPress={() => navigation.navigate('Profile')}
          >
            <View style={styles.settingContent}>
              <Ionicons name="person-outline" size={24} color="#4080ff" />
              <ThemedText style={styles.settingText}>Profile</ThemedText>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#999" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.settingItem}
            onPress={() => navigation.navigate(hasSubscription ? 'SubscriptionManagement' : 'Subscription')}
          >
            <View style={styles.settingContent}>
              <Ionicons name="card-outline" size={24} color="#4080ff" />
              <ThemedText style={styles.settingText}>
                {hasSubscription ? 'Manage Subscription' : 'Subscribe'}
              </ThemedText>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#999" />
          </TouchableOpacity>
        </View>
        
        {/* Gift Subscription Section */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Gift Subscriptions</ThemedText>
          
          <TouchableOpacity 
            style={styles.settingItem}
            onPress={() => navigation.navigate('GiftSubscription')}
          >
            <View style={styles.settingContent}>
              <Ionicons name="gift-outline" size={24} color="#4080ff" />
              <ThemedText style={styles.settingText}>Gift a Subscription</ThemedText>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#999" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.settingItem}
            onPress={() => navigation.navigate('RedeemGift')}
          >
            <View style={styles.settingContent}>
              <Ionicons name="ticket-outline" size={24} color="#4080ff" />
              <ThemedText style={styles.settingText}>Redeem Gift Code</ThemedText>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#999" />
          </TouchableOpacity>
        </View>
        
        {/* Preferences Section */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Preferences</ThemedText>
          
          <View style={styles.settingItem}>
            <View style={styles.settingContent}>
              <Ionicons name="notifications-outline" size={24} color="#4080ff" />
              <ThemedText style={styles.settingText}>Notifications</ThemedText>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={handleToggleNotifications}
              trackColor={{ false: '#ccc', true: '#4080ff' }}
              thumbColor="#fff"
            />
          </View>
          
          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => navigation.navigate('LocationNotificationSettings')}
          >
            <View style={styles.settingContent}>
              <Ionicons name="location-outline" size={24} color="#4080ff" />
              <ThemedText style={styles.settingText}>Location Notifications</ThemedText>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#999" />
          </TouchableOpacity>
          
          <View style={styles.settingItem}>
            <View style={styles.settingContent}>
              <Ionicons name="moon-outline" size={24} color="#4080ff" />
              <ThemedText style={styles.settingText}>Dark Mode</ThemedText>
            </View>
            <Switch
              value={darkModeEnabled}
              onValueChange={handleToggleDarkMode}
              trackColor={{ false: '#ccc', true: '#4080ff' }}
              thumbColor="#fff"
            />
          </View>
        </View>
        
        {/* Support Section */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Support</ThemedText>
          
          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingContent}>
              <Ionicons name="help-circle-outline" size={24} color="#4080ff" />
              <ThemedText style={styles.settingText}>Help Center</ThemedText>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#999" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingContent}>
              <Ionicons name="mail-outline" size={24} color="#4080ff" />
              <ThemedText style={styles.settingText}>Contact Support</ThemedText>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#999" />
          </TouchableOpacity>
        </View>
        
        {/* Logout Button */}
        <TouchableOpacity 
          style={styles.logoutButton}
          onPress={handleLogout}
        >
          <ThemedText style={styles.logoutButtonText}>Log Out</ThemedText>
        </TouchableOpacity>
        
        {/* App Version */}
        <ThemedText style={styles.versionText}>Version 1.0.0</ThemedText>
      </ScrollView>
    </ThemedView>
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
  scrollContent: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  settingContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingText: {
    fontSize: 16,
    marginLeft: 12,
  },
  logoutButton: {
    backgroundColor: '#f44336',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginVertical: 24,
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  versionText: {
    textAlign: 'center',
    color: '#999',
    marginBottom: 24,
  },
});

export default SettingsScreen;