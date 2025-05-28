/**
 * Atomic Organism: Premium Feature
 * Complex component that wraps premium content with subscription state management
 * Location: /atomic/organisms/subscription/PremiumFeature.tsx
 */
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
import { auth } from '../../../config/firebase';
import { hasActiveSubscription } from '../../../services/subscriptionService';
import { useUITheme } from '../../../components/UIThemeProvider';
import { useI18n } from '../i18n/I18nContext';

interface PremiumFeatureProps {
  children: React.ReactNode;
  teaser?: boolean;
  message?: string;
  onUpgrade?: () => void;
}

/**
 * PremiumFeature component wraps content that is only available to premium subscribers
 * If the user doesn't have premium access, it shows a teaser or a locked message
 * @param {PremiumFeatureProps} props - Component props
 * @returns {JSX.Element} - Rendered component
 */
export const PremiumFeature: React.FC<PremiumFeatureProps> = ({
  children,
  teaser = false,
  message = 'This feature requires a premium subscription',
  onUpgrade
}) => {
  const [hasPremium, setHasPremium] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const navigation = useNavigation();
  const { theme } = useUITheme();
  const { t } = useI18n();

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
        
        const premium = await hasActiveSubscription(userId);
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
    if (onUpgrade) {
      // Use the provided onUpgrade function
      onUpgrade();
    } else {
      // @ts-ignore - Navigation typing issue
      navigation.navigate('Subscription');
    }
  };

  const styles = StyleSheet.create({
    container: {
      backgroundColor: theme.colors.surfaceBackground,
      padding: theme.spacing.sm,
      borderRadius: theme.borderRadius.md,
      alignItems: 'center',
      justifyContent: 'center',
      marginVertical: theme.spacing.xs,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    loadingContainer: {
      padding: theme.spacing.sm,
      alignItems: 'center',
      justifyContent: 'center',
    },
    lockedText: {
      fontSize: theme.typography.fontSize.bodyStd,
      fontFamily: theme.typography.fontFamily.body,
      color: theme.colors.text,
      textAlign: 'center',
      marginVertical: theme.spacing.sm,
    },
    upgradeButton: {
      backgroundColor: theme.colors.primary,
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: theme.spacing.xs,
      borderRadius: theme.borderRadius.sm,
      marginTop: theme.spacing.xs,
    },
    upgradeButtonText: {
      color: theme.colors.onPrimary,
      fontWeight: theme.typography.fontWeight.semiBold as '600',
      fontSize: theme.typography.fontSize.label,
      fontFamily: theme.typography.fontFamily.body,
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
      padding: theme.spacing.sm,
      borderRadius: theme.borderRadius.md,
      backgroundColor: theme.colors.surfaceBackground + 'D9', // 85% opacity
    },
    teaserText: {
      fontSize: theme.typography.fontSize.bodyStd,
      fontFamily: theme.typography.fontFamily.body,
      color: theme.colors.text,
      textAlign: 'center',
      marginVertical: theme.spacing.sm,
      fontWeight: theme.typography.fontWeight.semiBold as '600',
    },
  });
  
  // If loading, show loading indicator
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={theme.colors.primary} />
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
      <View
        style={styles.container}
        accessible={true}
        accessibilityRole="alert"
        accessibilityLabel={message}
      >
        <View style={styles.teaserContent}>
          {children}
          <View
            style={styles.teaserOverlay}
            importantForAccessibility="yes"
          >
            <Ionicons name="lock-closed" size={32} color={theme.colors.primary} />
            <Text
              style={styles.teaserText}
              accessibilityRole="text"
            >
              {message}
            </Text>
            <TouchableOpacity
              style={styles.upgradeButton}
              onPress={handleUpgrade}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={t('premium.upgradeNow')}
              accessibilityHint={t('premium.upgradeHint')}
            >
              <Text style={styles.upgradeButtonText}>{t('premium.upgradeNow')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }
  
  // Otherwise, show a locked message with an upgrade button
  return (
    <View
      style={styles.container}
      accessible={true}
      accessibilityRole="alert"
      accessibilityLabel={message}
    >
      <Ionicons name="lock-closed" size={32} color={theme.colors.primary} />
      <Text
        style={styles.lockedText}
        accessibilityRole="text"
      >
        {message}
      </Text>
      <TouchableOpacity
        style={styles.upgradeButton}
        onPress={handleUpgrade}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel={t('premium.upgradeNow')}
        accessibilityHint={t('premium.upgradeHint')}
      >
        <Text style={styles.upgradeButtonText}>{t('premium.upgradeNow')}</Text>
      </TouchableOpacity>
    </View>
  );
};

export default PremiumFeature;