import { firebaseService } from '../src/atomic/organisms/firebaseService';
import 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ImageBackground
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { auth } from '../config/firebase';
import { hasPremiumAccess, hasViewedAdToday, markAdAsViewed } from '../services/subscriptionService';
import { useTheme } from '../contexts/ThemeContext';

interface FreemiumFeatureProps {
  children: React.ReactNode;
  type: 'free' | 'blurred' | 'teaser' | 'locked';
  freeContent?: React.ReactNode;
  message?: string;
  adRequired?: boolean;
  timeBasedUnlock?: boolean;
  unlockTime?: number;
  onAdRequested?: () => Promise<boolean>;
}

/**
 * FreemiumFeature component wraps content with different access levels for free and premium users
 * @param {FreemiumFeatureProps} props - Component props
 * @returns {JSX.Element} - Rendered component
 */
const FreemiumFeature: React.FC<FreemiumFeatureProps> = ({
  children,
  type = 'locked',
  freeContent,
  message = 'Upgrade to unlock more features',
  adRequired = false,
  timeBasedUnlock = false,
  unlockTime = 24 * 60 * 60 * 1000, // 24 hours in milliseconds
  onAdRequested
}) => {
  const [hasPremium, setHasPremium] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [hasViewedAd, setHasViewedAd] = useState<boolean>(false);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [showAdButton, setShowAdButton] = useState<boolean>(false);
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
          if (isMounted) {
            setHasPremium(false);
            setShowAdButton(adRequired);
          }
          return;
        }
        
        const premium = await hasPremiumAccess(userId);
        if (isMounted) setHasPremium(premium);
        
        // Check if user has viewed an ad today (for free features)
        if (adRequired && !premium) {
          const viewedAd = await hasViewedAdToday(userId);
          if (isMounted) {
            setHasViewedAd(viewedAd);
            setShowAdButton(!viewedAd);
          }
        }
        
        // Check time-based unlock if applicable
        if (timeBasedUnlock && !premium) {
          // In a real app, this would check when the feature was last used
          // For now, we'll just use a random time remaining
          const remaining = Math.floor(Math.random() * unlockTime);
          if (isMounted) setTimeRemaining(remaining);
        }
      } catch (error) {
        console.error('Error checking premium access:', error);
        if (isMounted) {
          setHasPremium(false);
          setShowAdButton(adRequired);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    
    checkPremiumAccess();
    
    // Listen for auth state changes
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
  }, [adRequired, timeBasedUnlock, unlockTime]);
  
  // Format time remaining
  const formatTimeRemaining = () => {
    const hours = Math.floor(timeRemaining / (60 * 60 * 1000));
    const minutes = Math.floor((timeRemaining % (60 * 60 * 1000)) / (60 * 1000));
    return `${hours}h ${minutes}m`;
  };
  
  // Navigate to subscription screen
  const handleUpgrade = () => {
    // @ts-ignore - Navigation typing issue
    navigation.navigate('Subscription');
  };
  
  // Handle ad viewing
  const handleViewAd = async () => {
    if (!onAdRequested) return;
    
    try {
      const adViewed = await onAdRequested();
      
      if (adViewed) {
        const userId = auth.currentUser?.uid;
        if (userId) {
          await markAdAsViewed(userId);
          setHasViewedAd(true);
          setShowAdButton(false);
        }
      }
    } catch (error) {
      console.error('Error viewing ad:', error);
    }
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
  
  // Handle different types of freemium content
  switch (type) {
    case 'free':
      // Free content that may require ad viewing
      if (adRequired && !hasViewedAd) {
        return (
          <View style={[styles.container, { backgroundColor: isDark ? '#1e1e1e' : '#f9f9f9' }]}>
            <Ionicons name="play-circle-outline" size={32} color={colors.primary} />
            <Text style={[styles.message, { color: colors.text }]}>
              Watch a short ad to unlock this free feature
            </Text>
            {showAdButton && (
              <TouchableOpacity
                style={[styles.button, { backgroundColor: colors.primary }]}
                onPress={handleViewAd}
              >
                <Text style={styles.buttonText}>Watch Ad</Text>
              </TouchableOpacity>
            )}
          </View>
        );
      }
      
      // Time-based unlock
      if (timeBasedUnlock && timeRemaining > 0) {
        return (
          <View style={[styles.container, { backgroundColor: isDark ? '#1e1e1e' : '#f9f9f9' }]}>
            <Ionicons name="time-outline" size={32} color={colors.primary} />
            <Text style={[styles.message, { color: colors.text }]}>
              This feature will unlock in {formatTimeRemaining()}
            </Text>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: colors.primary }]}
              onPress={handleUpgrade}
            >
              <Text style={styles.buttonText}>Upgrade to Unlock Now</Text>
            </TouchableOpacity>
          </View>
        );
      }
      
      // Free content available
      return <>{children}</>;
      
    case 'blurred':
      // Blurred content with upgrade prompt
      return (
        <View style={styles.blurContainer}>
          <View style={styles.contentContainer}>
            {children}
          </View>
          <View style={[
            styles.blurOverlay,
            { backgroundColor: isDark ? 'rgba(30, 30, 30, 0.85)' : 'rgba(255, 255, 255, 0.85)' }
          ]}>
            {freeContent && (
              <View style={styles.freeContentContainer}>
                {freeContent}
              </View>
            )}
            <Ionicons name="lock-closed" size={32} color={colors.primary} />
            <Text style={[styles.message, { color: colors.text }]}>
              {message}
            </Text>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: colors.primary }]}
              onPress={handleUpgrade}
            >
              <Text style={styles.buttonText}>Upgrade Now</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
      
    case 'teaser':
      // Teaser content with partial visibility
      return (
        <View style={styles.teaserContainer}>
          <View style={styles.teaserContent}>
            {children}
            <View style={[
              styles.teaserOverlay,
              { backgroundColor: isDark ? 'rgba(30, 30, 30, 0.7)' : 'rgba(255, 255, 255, 0.7)' }
            ]}>
              <Ionicons name="lock-closed" size={32} color={colors.primary} />
              <Text style={[styles.message, { color: colors.text }]}>
                {message}
              </Text>
              <TouchableOpacity
                style={[styles.button, { backgroundColor: colors.primary }]}
                onPress={handleUpgrade}
              >
                <Text style={styles.buttonText}>Upgrade Now</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      );
      
    case 'locked':
    default:
      // Fully locked content
      return (
        <View style={[styles.container, { backgroundColor: isDark ? '#1e1e1e' : '#f9f9f9' }]}>
          <Ionicons name="lock-closed" size={32} color={colors.primary} />
          <Text style={[styles.message, { color: colors.text }]}>
            {message}
          </Text>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.primary }]}
            onPress={handleUpgrade}
          >
            <Text style={styles.buttonText}>Upgrade Now</Text>
          </TouchableOpacity>
        </View>
      );
  }
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
  message: {
    fontSize: 16,
    textAlign: 'center',
    marginVertical: 12,
    fontWeight: '500',
  },
  button: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
    marginTop: 8,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  blurContainer: {
    position: 'relative',
    borderRadius: 8,
    overflow: 'hidden',
    marginVertical: 8,
  },
  contentContainer: {
    opacity: 0.3, // Make the content partially visible
  },
  blurOverlay: {
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
  freeContentContainer: {
    marginBottom: 16,
    width: '100%',
  },
  teaserContainer: {
    borderRadius: 8,
    overflow: 'hidden',
    marginVertical: 8,
  },
  teaserContent: {
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
});

export default FreemiumFeature;