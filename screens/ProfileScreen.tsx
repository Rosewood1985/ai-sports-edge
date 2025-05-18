import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useTheme } from '@react-navigation/native';
import { getAuth, User, onAuthStateChanged, signOut } from 'firebase/auth'; // Import getAuth and necessary functions
import { getUserSubscription, SubscriptionPlan } from '../services/firebaseSubscriptionService';





import { ThemedView } from '../atomic/atoms/ThemedView'
import { ThemedText } from '../atomic/atoms/ThemedText';
import { Colors } from '../constants/Colors'; // Import base Colors

// Define subscription type (remains the same)
interface Subscription {
  id: string;
  status: 'active' | 'canceled' | 'past_due' | 'trialing';
  currentPeriodEnd: number;
  cancelAtPeriodEnd: boolean;
  trialEnd: number | null;
  defaultPaymentMethod: string;
  plan?: SubscriptionPlan;
}

const ProfileScreen = () => {
  const navigation = useNavigation();
  const { colors } = useTheme(); // Use theme colors provided by NavigationContainer
  const auth = getAuth(); // Get auth instance
  const [user, setUser] = useState<User | null>(auth.currentUser);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  // Auth listener and subscription loading
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => { // Use imported onAuthStateChanged
      setUser(user);
      if (user) {
        loadSubscription(user.uid);
      } else {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const loadSubscription = async (userId: string) => {
    try {
      setLoading(true);
      const subscriptionData = await getUserSubscription(userId);
      setSubscription(subscriptionData as unknown as Subscription | null);
    } catch (error) {
      console.error('Error loading subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  // Sign out handler
  const handleSignOut = async () => {
    try {
      const auth = getAuth(); // Get auth instance
      await signOut(auth); // Use imported signOut
    } catch (error) {
      console.error('Error signing out:', error);
      Alert.alert('Error', 'Failed to sign out. Please try again.');
    }
  };

  // --- Render Authenticated Content ---
  const renderAuthenticatedContent = () => {
    if (!user) return null;

    const getInitial = () => {
      if (user.displayName && user.displayName.length > 0) return user.displayName.charAt(0).toUpperCase();
      if (user.email && user.email.length > 0) return user.email.charAt(0).toUpperCase();
      return '?';
    };
    const displayName = user.displayName || user.email || 'User';

    return (
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Profile Header */}
        <View style={[styles.profileHeader, { borderBottomColor: colors.border }]}>
          <View style={[styles.avatarContainer, { backgroundColor: colors.primary + '33' }]}> {/* Use primary accent with opacity */}
            <ThemedText style={[styles.avatarText, { color: colors.primary }]}>
              {getInitial()}
            </ThemedText>
          </View>
          <ThemedText style={styles.userName}>
            {displayName}
          </ThemedText>
          <ThemedText style={styles.userEmail}>
            {user.email || 'No email provided'}
          </ThemedText>
        </View>

        {/* Subscription Section */}
        <View style={[styles.sectionContainer, { borderBottomColor: colors.border }]}>
          <ThemedText style={styles.sectionTitle}>Subscription</ThemedText>
          {loading ? (
            <ActivityIndicator size="small" color={colors.primary} style={styles.loadingIndicator} />
          ) : subscription ? (
            <View style={styles.subscriptionInfo}>
              <ThemedText style={styles.planName}>
                {subscription.plan?.name || 'Unknown Plan'}
              </ThemedText>
              <ThemedText style={styles.planStatus}>
                Status: {subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1)}
              </ThemedText>
              <TouchableOpacity
                style={[styles.button, { backgroundColor: colors.primary }]}
                onPress={() => navigation.navigate('Subscription' as never)}
              >
                <ThemedText style={styles.buttonText}>Manage Subscription</ThemedText>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.subscriptionInfo}>
              <ThemedText style={styles.noSubscription}>
                You don't have an active subscription
              </ThemedText>
              <TouchableOpacity
                style={[styles.button, { backgroundColor: colors.primary }]}
                onPress={() => navigation.navigate('Subscription' as never)}
              >
                <ThemedText style={styles.buttonText}>View Plans</ThemedText>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Menu Section */}
        <View style={styles.sectionContainer}>
          <ThemedText style={styles.sectionTitle}>Account</ThemedText>
          <TouchableOpacity
            style={[styles.menuItem, { borderBottomColor: colors.border }]}
            onPress={() => navigation.navigate('PurchaseHistory' as never)}
          >
            <Ionicons name="cart-outline" size={22} color={colors.text} style={styles.menuIcon} />
            <ThemedText style={styles.menuItemText}>Purchase History</ThemedText>
            <Ionicons name="chevron-forward" size={22} color={colors.icon} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuItem, { borderBottomColor: colors.border }]}
            onPress={() => navigation.navigate('Settings' as never)}
          >
            <Ionicons name="settings-outline" size={22} color={colors.text} style={styles.menuIcon} />
            <ThemedText style={styles.menuItemText}>Settings</ThemedText>
            <Ionicons name="chevron-forward" size={22} color={colors.icon} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuItem, { borderBottomWidth: 0 }]} // No border on last item
            onPress={handleSignOut}
          >
            <Ionicons name="log-out-outline" size={22} color={colors.notification} style={styles.menuIcon} /> {/* Use notification color for sign out */}
            <ThemedText style={[styles.menuItemText, { color: colors.notification }]}>Sign Out</ThemedText>
            <Ionicons name="chevron-forward" size={22} color={colors.icon} />
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  };

  // --- Render Unauthenticated Content ---
  const renderUnauthenticatedContent = () => {
    return (
      <View style={styles.unauthenticatedContainer}>
        <Ionicons name="person-circle-outline" size={80} color={colors.icon} /> {/* Use icon color */}
        <ThemedText style={styles.unauthenticatedTitle}>
          Sign in to access your profile
        </ThemedText>
        <ThemedText style={styles.unauthenticatedSubtitle}>
          Create an account to track your predictions, access premium features, and more.
        </ThemedText>
        <TouchableOpacity
          style={[styles.button, styles.signInButton, { backgroundColor: colors.primary }]}
          onPress={() => navigation.navigate('Auth' as never)}
        >
          <ThemedText style={styles.buttonText}>Sign In / Sign Up</ThemedText>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <ThemedView style={styles.container}>
      {user ? renderAuthenticatedContent() : renderUnauthenticatedContent()}
    </ThemedView>
  );
};

// --- Styles ---
const SPACING_UNIT = 8;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: SPACING_UNIT * 4, // 32
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: SPACING_UNIT * 4, // 32
    borderBottomWidth: 1,
    // borderBottomColor set dynamically
    marginBottom: SPACING_UNIT * 2, // 16 - Add space below header
  },
  avatarContainer: {
    width: 88, // Slightly larger
    height: 88,
    borderRadius: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING_UNIT * 2, // 16
    // backgroundColor set dynamically
  },
  avatarText: {
    fontSize: 36, // Slightly larger
    fontWeight: '600', // Semi-bold
    // color set dynamically
  },
  userName: {
    fontSize: 22, // Slightly smaller
    fontWeight: 'bold',
    marginBottom: SPACING_UNIT * 0.5, // 4
    textAlign: 'center', // Center align
  },
  userEmail: {
    fontSize: 16,
    opacity: 0.7, // Use opacity for secondary text
    textAlign: 'center', // Center align
  },
  sectionContainer: {
    paddingHorizontal: SPACING_UNIT * 2, // 16
    paddingVertical: SPACING_UNIT * 2.5, // 20
    borderBottomWidth: 1,
    // borderBottomColor set dynamically
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: SPACING_UNIT * 2, // 16
    textAlign: 'left', // Left align section titles
  },
  subscriptionInfo: {
    // Removed marginBottom, spacing handled by sectionContainer padding
  },
  loadingIndicator: {
    marginTop: SPACING_UNIT * 2, // 16
    alignSelf: 'center', // Center loader
  },
  planName: {
    fontSize: 16, // Consistent text size
    fontWeight: '600', // Semi-bold
    marginBottom: SPACING_UNIT * 0.5, // 4
    textAlign: 'left',
  },
  planStatus: {
    fontSize: 14, // Smaller status text
    marginBottom: SPACING_UNIT * 2, // 16
    opacity: 0.7,
    textAlign: 'left',
  },
  noSubscription: {
    fontSize: 16,
    marginBottom: SPACING_UNIT * 2, // 16
    fontStyle: 'italic',
    opacity: 0.7,
    textAlign: 'left',
  },
  button: {
    paddingVertical: SPACING_UNIT * 1.5, // 12
    paddingHorizontal: SPACING_UNIT * 3, // 24
    borderRadius: 12, // More rounded buttons
    alignItems: 'center',
    justifyContent: 'center', // Ensure text is centered vertically
    minHeight: 48, // Ensure minimum touch target size
    // Shadow for buttons
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonText: {
    color: '#ffffff', // Ensure high contrast on primary background
    fontWeight: 'bold',
    fontSize: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING_UNIT * 2, // 16
    borderBottomWidth: 1,
    // borderBottomColor set dynamically
  },
  menuIcon: {
    marginRight: SPACING_UNIT * 2, // 16
  },
  menuItemText: {
    flex: 1,
    fontSize: 16,
    textAlign: 'left', // Ensure text is left-aligned
  },
  // Unauthenticated state styles
  unauthenticatedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING_UNIT * 4, // 32
  },
  unauthenticatedTitle: {
    fontSize: 22, // Adjusted size
    fontWeight: 'bold',
    marginTop: SPACING_UNIT * 3, // 24
    marginBottom: SPACING_UNIT * 2, // 16
    textAlign: 'center',
  },
  unauthenticatedSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: SPACING_UNIT * 4, // 32
    opacity: 0.7,
    lineHeight: 24, // Improve readability
  },
  signInButton: {
    alignSelf: 'stretch', // Make button full width
  },
});

export default ProfileScreen;