import { Auth } from 'firebase/auth';
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Button, ScrollView } from 'react-native';

import * as firebaseConfig from '../../config/firebase';
import { batchLoadingService } from '../../services/batchLoadingService';
import {
  firebaseMonitoringService,
  FirebaseOperationType,
  FirebaseServiceType,
} from '../../services/firebaseMonitoringService';
import { getUserData, updateUserPreferences } from '../../services/optimizedUserService';

// Get Firebase services with type assertions
const auth = firebaseConfig.auth as Auth;

/**
 * OptimizedUserProfile Component
 *
 * This component demonstrates how to use the optimized Firebase services
 * to display and update user profile data efficiently.
 */
const OptimizedUserProfile: React.FC = () => {
  // State
  const [loading, setLoading] = useState(true);
  const [batchLoading, setBatchLoading] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const [batchData, setBatchData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<any>(null);

  // Get current user ID
  const userId = auth.currentUser?.uid;

  // Load user data on mount
  useEffect(() => {
    if (!userId) {
      setError('User not authenticated');
      setLoading(false);
      return;
    }

    loadUserData();
  }, [userId]);

  // Load user data using optimizedUserService
  const loadUserData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Start timing
      const startTime = Date.now();

      // Get user data
      const data = await getUserData(userId);

      // End timing
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Track operation
      firebaseMonitoringService.trackFirestoreRead(`users/${userId}`, duration, !!data);

      // Update state
      setUserData(data);
      setLoading(false);
    } catch (err) {
      console.error('Error loading user data:', err);
      setError('Failed to load user data');
      setLoading(false);
    }
  };

  // Load batch data using batchLoadingService
  const loadBatchData = async () => {
    try {
      setBatchLoading(true);
      setError(null);

      // Start timing
      const startTime = Date.now();

      // Get batch data
      const data = await batchLoadingService.loadCriticalData(userId, {
        includePicks: true,
        includeGames: true,
        includeNotifications: true,
        includeAppConfig: true,
      });

      // End timing
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Track operation
      firebaseMonitoringService.trackOperation({
        type: FirebaseOperationType.BATCH,
        service: FirebaseServiceType.FIRESTORE,
        path: `batch/${userId}`,
        duration,
        success: true,
      });

      // Update state
      setBatchData(data);
      setBatchLoading(false);
    } catch (err) {
      console.error('Error loading batch data:', err);
      setError('Failed to load batch data');
      setBatchLoading(false);
    }
  };

  // Update user preferences
  const updatePreferences = async () => {
    try {
      setLoading(true);
      setError(null);

      // Start timing
      const startTime = Date.now();

      // Update preferences
      await updateUserPreferences(userId!, {
        favoriteSports: ['basketball', 'football', 'baseball'],
        favoriteLeagues: ['NBA', 'NFL', 'MLB'],
      });

      // End timing
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Track operation
      firebaseMonitoringService.trackFirestoreWrite(`users/${userId}/preferences`, duration, true);

      // Reload user data
      await loadUserData();
    } catch (err) {
      console.error('Error updating preferences:', err);
      setError('Failed to update preferences');
      setLoading(false);
    }
  };

  // Get Firebase usage statistics
  const getUsageStats = async () => {
    try {
      const usageStats = await firebaseMonitoringService.getUsageStats();
      setStats(usageStats);
    } catch (err) {
      console.error('Error getting usage stats:', err);
      setError('Failed to get usage stats');
    }
  };

  // Render loading state
  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text style={styles.text}>Loading user data...</Text>
      </View>
    );
  }

  // Render error state
  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{error}</Text>
        <Button title="Retry" onPress={loadUserData} />
      </View>
    );
  }

  // Render user data
  return (
    <ScrollView style={styles.scrollContainer}>
      <View style={styles.container}>
        <Text style={styles.title}>User Profile (Optimized)</Text>

        {/* User Data */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>User Data</Text>
          {userData ? (
            <>
              <Text style={styles.label}>ID: {userData.id}</Text>
              <Text style={styles.label}>Email: {userData.email || 'N/A'}</Text>
              <Text style={styles.label}>Display Name: {userData.displayName || 'N/A'}</Text>

              {/* Preferences */}
              <Text style={styles.subSectionTitle}>Preferences</Text>
              <Text style={styles.label}>
                Favorite Sports: {userData.preferences?.favoriteSports?.join(', ') || 'None'}
              </Text>
              <Text style={styles.label}>
                Favorite Leagues: {userData.preferences?.favoriteLeagues?.join(', ') || 'None'}
              </Text>
              <Text style={styles.label}>
                Favorite Teams: {userData.preferences?.favoriteTeams?.join(', ') || 'None'}
              </Text>

              <Button title="Update Preferences" onPress={updatePreferences} />
            </>
          ) : (
            <Text style={styles.text}>No user data available</Text>
          )}
        </View>

        {/* Batch Data */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Batch Data</Text>
          {batchLoading ? (
            <ActivityIndicator size="small" color="#0000ff" />
          ) : batchData ? (
            <>
              <Text style={styles.label}>
                Pick of the Day: {batchData.pickOfDay ? 'Available' : 'None'}
              </Text>
              <Text style={styles.label}>Top Picks: {batchData.topPicks.length}</Text>
              <Text style={styles.label}>Recent Games: {batchData.recentGames.length}</Text>
              <Text style={styles.label}>Notifications: {batchData.notifications.length}</Text>
            </>
          ) : (
            <Text style={styles.text}>No batch data loaded</Text>
          )}
          <Button title="Load Batch Data" onPress={loadBatchData} />
        </View>

        {/* Usage Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Firebase Usage Stats</Text>
          {stats ? (
            <>
              <Text style={styles.label}>Total Reads: {stats.reads}</Text>
              <Text style={styles.label}>Total Writes: {stats.writes}</Text>
              <Text style={styles.label}>Total Queries: {stats.queries}</Text>
              <Text style={styles.label}>
                Average Duration: {stats.averageDuration.toFixed(2)}ms
              </Text>
              <Text style={styles.label}>Error Rate: {(stats.errorRate * 100).toFixed(2)}%</Text>
            </>
          ) : (
            <Text style={styles.text}>No stats available</Text>
          )}
          <Button title="Get Usage Stats" onPress={getUsageStats} />
        </View>
      </View>
    </ScrollView>
  );
};

// Styles
const styles = StyleSheet.create({
  scrollContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 8,
    marginBottom: 4,
  },
  label: {
    fontSize: 14,
    marginBottom: 4,
  },
  text: {
    fontSize: 14,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    color: 'red',
    marginBottom: 16,
  },
});

export default OptimizedUserProfile;
