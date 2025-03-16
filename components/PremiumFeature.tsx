import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { auth } from '../config/firebase';
import { hasPremiumAccess } from '../services/subscriptionService';
import { useTheme } from '../contexts/ThemeContext';

interface PremiumFeatureProps {
  children: React.ReactNode;
  teaser?: boolean;
  message?: string;
}

/**
 * PremiumFeature component wraps content that is only available to premium subscribers
 * If the user doesn't have premium access, it shows a teaser or a locked message
 * @param {PremiumFeatureProps} props - Component props
 * @returns {JSX.Element} - Rendered component
 */
const PremiumFeature: React.FC<PremiumFeatureProps> = ({
  children,
  teaser = false,
  message = 'This feature requires a premium subscription'
}) => {
  const [hasPremium, setHasPremium] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const navigation = useNavigation();
  const { colors, isDark } = useTheme();

  // Check if user has premium access
  useEffect(() => {
    let isMounted = true; // Flag to prevent state updates after unmount
    
    const checkPremiumAccess = async () => {
      if (!isMounted) return;
      
      try {
        setLoading(true);
        const userId = auth.currentUser?.uid;
        
        if (!userId) {
          if (isMounted) setHasPremium(false);
          return;
        }
        
        const premium = await hasPremiumAccess(userId);
        if (isMounted) setHasPremium(premium);
      } catch (error) {
        console.error('Error checking premium access:', error);
        if (isMounted) setHasPremium(false);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    
    checkPremiumAccess();
    
    // Listen for auth state changes - but don't create nested calls
    const unsubscribe = auth.onAuthStateChanged((user) => {
      // Only check premium if auth state actually changed to a logged in user
      if (user && isMounted) {
        checkPremiumAccess();
      }
    });
    
    return () => {
      isMounted = false; // Prevent state updates after unmount
      unsubscribe();
    };
  }, []); // Empty dependency array is correct here
  
  // Navigate to subscription screen
  const handleUpgrade = () => {
    // @ts-ignore - Navigation typing issue
    navigation.navigate('Subscription');
  };
  
  // If loading, show loading indicator
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  }
  
  // If user has premium access, show the children
  if (hasPremium) {
    return <>{children}</>;
  }
  
  // If teaser is true, show a preview of the content with an upgrade button
  if (teaser) {
    return (
      <View style={[styles.container, { backgroundColor: isDark ? '#1e1e1e' : '#f9f9f9' }]}>
        <View style={styles.teaserContent}>
          {children}
          <View style={[styles.teaserOverlay, { backgroundColor: isDark ? 'rgba(30, 30, 30, 0.85)' : 'rgba(255, 255, 255, 0.85)' }]}>
            <Ionicons name="lock-closed" size={32} color={colors.primary} />
            <Text style={[styles.teaserText, { color: colors.text }]}>
              {message}
            </Text>
            <TouchableOpacity
              style={[styles.upgradeButton, { backgroundColor: colors.primary }]}
              onPress={handleUpgrade}
            >
              <Text style={styles.upgradeButtonText}>Upgrade Now</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }
  
  // Otherwise, show a locked message with an upgrade button
  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#1e1e1e' : '#f9f9f9' }]}>
      <Ionicons name="lock-closed" size={32} color={colors.primary} />
      <Text style={[styles.lockedText, { color: colors.text }]}>
        {message}
      </Text>
      <TouchableOpacity
        style={[styles.upgradeButton, { backgroundColor: colors.primary }]}
        onPress={handleUpgrade}
      >
        <Text style={styles.upgradeButtonText}>Upgrade Now</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  loadingContainer: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockedText: {
    fontSize: 16,
    textAlign: 'center',
    marginVertical: 12,
  },
  upgradeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
    marginTop: 8,
  },
  upgradeButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  teaserContent: {
    width: '100%',
    position: 'relative',
  },
  teaserOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
  },
  teaserText: {
    fontSize: 16,
    textAlign: 'center',
    marginVertical: 12,
    fontWeight: '600',
  },
});

export default PremiumFeature;