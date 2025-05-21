import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useTheme } from '@react-navigation/native';
import { getAuth, User, onAuthStateChanged, signOut } from 'firebase/auth'; // Import getAuth and necessary functions
import { getUserSubscription, SubscriptionPlan } from '../services/firebaseSubscriptionService';

import { AccessibleThemedView } from '../atomic/atoms/AccessibleThemedView';
import { AccessibleThemedText } from '../atomic/atoms/AccessibleThemedText';
import { Colors } from '../constants/Colors'; // Import base Colors
import AccessibleTouchableOpacity from '../atomic/atoms/AccessibleTouchableOpacity';

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
    const unsubscribe = onAuthStateChanged(auth, user => {
      // Use imported onAuthStateChanged
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
      if (user.displayName && user.displayName.length > 0)
        return user.displayName.charAt(0).toUpperCase();
      if (user.email && user.email.length > 0) return user.email.charAt(0).toUpperCase();
      return '?';
    };
    const displayName = user.displayName || user.email || 'User';

    return (
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        accessibilityLabel="Profile information"
      >
        {/* Profile Header */}
        <View
          style={[styles.profileHeader, { borderBottomColor: colors.border }]}
          accessibilityLabel="Profile header"
        >
          <View
            style={[styles.avatarContainer, { backgroundColor: colors.primary + '33' }]}
            accessibilityLabel={`User avatar with initial ${getInitial()}`}
          >
            <AccessibleThemedText style={[styles.avatarText, { color: colors.primary }]}>
              {getInitial()}
            </AccessibleThemedText>
          </View>
          <AccessibleThemedText style={styles.userName} accessibilityRole="header">
            {displayName}
          </AccessibleThemedText>
          <AccessibleThemedText
            style={styles.userEmail}
            accessibilityLabel={`Email: ${user.email || 'No email provided'}`}
          >
            {user.email || 'No email provided'}
          </AccessibleThemedText>
        </View>

        {/* Subscription Section */}
        <View
          style={[styles.sectionContainer, { borderBottomColor: colors.border }]}
          accessibilityLabel="Subscription information"
        >
          <AccessibleThemedText style={styles.sectionTitle} accessibilityRole="header">
            Subscription
          </AccessibleThemedText>
          {loading ? (
            <ActivityIndicator
              size="small"
              color={colors.primary}
              style={styles.loadingIndicator}
              accessibilityLabel="Loading subscription information"
            />
          ) : subscription ? (
            <View style={styles.subscriptionInfo} accessibilityLabel="Active subscription details">
              <AccessibleThemedText style={styles.planName}>
                {subscription.plan?.name || 'Unknown Plan'}
              </AccessibleThemedText>
              <AccessibleThemedText style={styles.planStatus}>
                Status: {subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1)}
              </AccessibleThemedText>
              <AccessibleTouchableOpacity
                style={[styles.button, { backgroundColor: colors.primary }]}
                onPress={() => navigation.navigate('Subscription' as never)}
                accessibilityLabel="Manage Subscription"
                accessibilityRole="button"
                accessibilityHint="Navigate to subscription management screen"
              >
                <AccessibleThemedText style={styles.buttonText}>
                  Manage Subscription
                </AccessibleThemedText>
              </AccessibleTouchableOpacity>
            </View>
          ) : (
            <View style={styles.subscriptionInfo} accessibilityLabel="No active subscription">
              <AccessibleThemedText style={styles.noSubscription}>
                You don't have an active subscription
              </AccessibleThemedText>
              <AccessibleTouchableOpacity
                style={[styles.button, { backgroundColor: colors.primary }]}
                onPress={() => navigation.navigate('Subscription' as never)}
                accessibilityLabel="View Plans"
                accessibilityRole="button"
                accessibilityHint="Navigate to subscription plans screen"
              >
                <AccessibleThemedText style={styles.buttonText}>View Plans</AccessibleThemedText>
              </AccessibleTouchableOpacity>
            </View>
          )}
        </View>

        {/* Menu Section */}
        <View style={styles.sectionContainer} accessibilityLabel="Account menu">
          <AccessibleThemedText style={styles.sectionTitle} accessibilityRole="header">
            Account
          </AccessibleThemedText>
          <AccessibleTouchableOpacity
            style={[styles.menuItem, { borderBottomColor: colors.border }]}
            onPress={() => navigation.navigate('PurchaseHistory' as never)}
            accessibilityLabel="Purchase History"
            accessibilityRole="button"
            accessibilityHint="View your purchase history"
          >
            <Ionicons name="cart-outline" size={22} color={colors.text} style={styles.menuIcon} />
            <AccessibleThemedText style={styles.menuItemText}>
              Purchase History
            </AccessibleThemedText>
            <Ionicons name="chevron-forward" size={22} color={colors.text} />
          </AccessibleTouchableOpacity>

          <AccessibleTouchableOpacity
            style={[styles.menuItem, { borderBottomColor: colors.border }]}
            onPress={() => navigation.navigate('Settings' as never)}
            accessibilityLabel="Settings"
            accessibilityRole="button"
            accessibilityHint="Navigate to app settings"
          >
            <Ionicons
              name="settings-outline"
              size={22}
              color={colors.text}
              style={styles.menuIcon}
            />
            <AccessibleThemedText style={styles.menuItemText}>Settings</AccessibleThemedText>
            <Ionicons name="chevron-forward" size={22} color={colors.text} />
          </AccessibleTouchableOpacity>

          <AccessibleTouchableOpacity
            style={[styles.menuItem, { borderBottomWidth: 0 }]} // No border on last item
            onPress={handleSignOut}
            accessibilityLabel="Sign Out"
            accessibilityRole="button"
            accessibilityHint="Sign out of your account"
          >
            <Ionicons
              name="log-out-outline"
              size={22}
              color={colors.notification}
              style={styles.menuIcon}
            />
            <AccessibleThemedText style={[styles.menuItemText, { color: colors.notification }]}>
              Sign Out
            </AccessibleThemedText>
            <Ionicons name="chevron-forward" size={22} color={colors.text} />
          </AccessibleTouchableOpacity>
        </View>
      </ScrollView>
    );
  };

  // --- Render Unauthenticated Content ---
  const renderUnauthenticatedContent = () => {
    return (
      <View style={styles.unauthenticatedContainer} accessibilityLabel="Sign in prompt">
        <Ionicons name="person-circle-outline" size={80} color={colors.text} />
        <AccessibleThemedText style={styles.unauthenticatedTitle} accessibilityRole="header">
          Sign in to access your profile
        </AccessibleThemedText>
        <AccessibleThemedText style={styles.unauthenticatedSubtitle}>
          Create an account to track your predictions, access premium features, and more.
        </AccessibleThemedText>
        <AccessibleTouchableOpacity
          style={[styles.button, styles.signInButton, { backgroundColor: colors.primary }]}
          onPress={() => navigation.navigate('Auth' as never)}
          accessibilityLabel="Sign In or Sign Up"
          accessibilityRole="button"
          accessibilityHint="Navigate to authentication screen"
        >
          <AccessibleThemedText style={styles.buttonText}>Sign In / Sign Up</AccessibleThemedText>
        </AccessibleTouchableOpacity>
      </View>
    );
  };

  return (
    <AccessibleThemedView style={styles.container} accessibilityLabel="Profile Screen">
      {user ? renderAuthenticatedContent() : renderUnauthenticatedContent()}
    </AccessibleThemedView>
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
