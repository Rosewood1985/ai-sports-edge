/**
 * Profile Screen Example
 *
 * This example demonstrates how to create a screen using the atomic architecture.
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';

// Import atomic components
import { useTheme } from '../atomic/molecules/themeContext';
import { firebaseService, monitoringService } from '../atomic/organisms';
import { MainLayout } from '../atomic/templates';

const ProfileScreen = ({ navigation }) => {
  // Get theme from context
  const { colors } = useTheme();

  // State
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load user data on mount
  useEffect(() => {
    const loadUserData = async () => {
      try {
        // Get current user
        const currentUser = firebaseService.auth.getCurrentUser();

        if (!currentUser) {
          navigation.replace('Login');
          return;
        }

        // Get user data from Firestore
        const userData = await firebaseService.firestore.getDocument('users', currentUser.uid);
        setUser(userData || currentUser);
      } catch (err) {
        // Handle error
        monitoringService.error.captureException(err);
        setError(monitoringService.error.getUserFriendlyMessage(err));
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, [navigation]);

  // Header component
  const Header = () => (
    <View style={[styles.header, { backgroundColor: colors.surface }]}>
      <Text style={[styles.headerTitle, { color: colors.text }]}>Profile</Text>
      <TouchableOpacity
        style={[styles.headerButton, { backgroundColor: colors.primary }]}
        onPress={() => navigation.goBack()}
      >
        <Text style={[styles.headerButtonText, { color: colors.onPrimary }]}>Back</Text>
      </TouchableOpacity>
    </View>
  );

  // Content component
  const Content = () => {
    if (loading) {
      return (
        <View style={styles.centerContent}>
          <Text style={{ color: colors.text }}>Loading...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.centerContent}>
          <Text style={{ color: colors.error }}>{error}</Text>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.primary }]}
            onPress={() => setError(null)}
          >
            <Text style={{ color: colors.onPrimary }}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (!user) {
      return (
        <View style={styles.centerContent}>
          <Text style={{ color: colors.text }}>No user found</Text>
        </View>
      );
    }

    return (
      <View style={styles.content}>
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <Image
            source={{ uri: user.photoURL || 'https://via.placeholder.com/150' }}
            style={styles.profileImage}
          />
          <Text style={[styles.name, { color: colors.text }]}>{user.displayName || 'User'}</Text>
          <Text style={[styles.email, { color: colors.textSecondary }]}>{user.email}</Text>
        </View>

        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Account Information</Text>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>User ID:</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>{user.uid}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Created:</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>
              {user.metadata?.creationTime
                ? new Date(user.metadata.creationTime).toLocaleDateString()
                : 'Unknown'}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Last Login:</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>
              {user.metadata?.lastSignInTime
                ? new Date(user.metadata.lastSignInTime).toLocaleDateString()
                : 'Unknown'}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.primary }]}
          onPress={() => firebaseService.auth.signOut()}
        >
          <Text style={{ color: colors.onPrimary }}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    );
  };

  // Render screen using MainLayout template
  return (
    <MainLayout header={<Header />} scrollable>
      <Content />
    </MainLayout>
  );
};

// Styles
const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  headerButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  content: {
    padding: 16,
  },
  card: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    alignItems: 'center',
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 16,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  email: {
    fontSize: 16,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    alignSelf: 'flex-start',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  infoValue: {
    fontSize: 16,
  },
  button: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 4,
    alignItems: 'center',
    marginTop: 16,
  },
});

export default ProfileScreen;
