import { Ionicons } from '@expo/vector-icons';
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Image, TouchableOpacity, Animated, Dimensions } from 'react-native';

import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';
import { useThemeColor } from '../hooks/useThemeColor';
import deepLinkingService from '../services/deepLinkingService';

/**
 * Rich notification props
 */
interface RichNotificationProps {
  /**
   * Notification ID
   */
  id: string;

  /**
   * Notification title
   */
  title: string;

  /**
   * Notification body
   */
  body: string;

  /**
   * Notification category
   */
  category: string;

  /**
   * Notification image URL
   */
  imageUrl?: string;

  /**
   * Deep link URL
   */
  deepLink?: string;

  /**
   * Additional data
   */
  data?: Record<string, any>;

  /**
   * Auto hide duration in milliseconds
   * @default 5000
   */
  autoHideDuration?: number;

  /**
   * Whether to show close button
   * @default true
   */
  showCloseButton?: boolean;

  /**
   * Callback when notification is closed
   */
  onClose?: (id: string) => void;

  /**
   * Callback when notification is pressed
   */
  onPress?: (id: string, deepLink?: string, data?: Record<string, any>) => void;
}

/**
 * Rich notification component
 */
const RichNotification: React.FC<RichNotificationProps> = ({
  id,
  title,
  body,
  category,
  imageUrl,
  deepLink,
  data,
  autoHideDuration = 5000,
  showCloseButton = true,
  onClose,
  onPress,
}) => {
  const [slideAnim] = useState(new Animated.Value(-200));
  const [fadeAnim] = useState(new Animated.Value(0));
  const [imageLoaded, setImageLoaded] = useState<boolean>(false);
  const [imageError, setImageError] = useState<boolean>(false);

  // Theme colors
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');

  // Get screen width
  const screenWidth = Dimensions.get('window').width;

  // Show notification on mount
  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto hide after duration
    if (autoHideDuration > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, autoHideDuration);

      return () => clearTimeout(timer);
    }
  }, []);

  /**
   * Handle notification press
   */
  const handlePress = () => {
    if (onPress) {
      onPress(id, deepLink, data);
    } else if (deepLink) {
      deepLinkingService.openDeepLink(deepLink);
    }

    handleClose();
  };

  /**
   * Handle notification close
   */
  const handleClose = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -200,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      if (onClose) {
        onClose(id);
      }
    });
  };

  /**
   * Get category icon
   */
  const getCategoryIcon = (): string => {
    switch (category) {
      case 'game_start':
        return 'basketball';
      case 'game_end':
        return 'trophy';
      case 'bet_opportunity':
        return 'flash';
      case 'bet_result':
        return 'stats-chart';
      case 'player_update':
        return 'person';
      case 'team_update':
        return 'people';
      case 'subscription':
        return 'card';
      case 'referral':
        return 'share';
      case 'system':
        return 'information-circle';
      default:
        return 'notifications';
    }
  };

  /**
   * Get category color
   */
  const getCategoryColor = (): string => {
    switch (category) {
      case 'game_start':
        return '#4CAF50';
      case 'game_end':
        return '#2196F3';
      case 'bet_opportunity':
        return '#FF9800';
      case 'bet_result':
        return '#9C27B0';
      case 'player_update':
        return '#00BCD4';
      case 'team_update':
        return '#3F51B5';
      case 'subscription':
        return '#F44336';
      case 'referral':
        return '#8BC34A';
      case 'system':
        return '#607D8B';
      default:
        return '#0a7ea4';
    }
  };

  /**
   * Handle image load
   */
  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  /**
   * Handle image error
   */
  const handleImageError = () => {
    setImageError(true);
  };

  /**
   * Render notification content
   */
  const renderContent = () => {
    return (
      <View style={styles.contentContainer}>
        <View style={styles.iconContainer}>
          <View style={[styles.iconBackground, { backgroundColor: getCategoryColor() }]}>
            <Ionicons name={getCategoryIcon() as any} size={24} color="#fff" />
          </View>
        </View>

        <View style={styles.textContainer}>
          <ThemedText style={styles.title} numberOfLines={1}>
            {title}
          </ThemedText>
          <ThemedText style={styles.body} numberOfLines={2}>
            {body}
          </ThemedText>
        </View>

        {showCloseButton && (
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <Ionicons name="close" size={20} color="#999" />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  /**
   * Render notification with image
   */
  const renderWithImage = () => {
    return (
      <View style={styles.container}>
        {renderContent()}

        {imageUrl && !imageError && (
          <Image
            source={{ uri: imageUrl }}
            style={[styles.image, { opacity: imageLoaded ? 1 : 0 }]}
            onLoad={handleImageLoad}
            onError={handleImageError}
            resizeMode="cover"
          />
        )}
      </View>
    );
  };

  return (
    <Animated.View
      style={[
        styles.animatedContainer,
        {
          transform: [{ translateY: slideAnim }],
          opacity: fadeAnim,
          width: screenWidth - 32,
        },
      ]}
    >
      <TouchableOpacity activeOpacity={0.9} onPress={handlePress} style={styles.touchable}>
        <ThemedView style={styles.notificationContainer}>{renderWithImage()}</ThemedView>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  animatedContainer: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  touchable: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  notificationContainer: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  container: {
    width: '100%',
  },
  contentContainer: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
  },
  iconContainer: {
    marginRight: 12,
  },
  iconBackground: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
    marginRight: 8,
  },
  title: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 4,
  },
  body: {
    fontSize: 14,
    opacity: 0.8,
  },
  closeButton: {
    padding: 4,
  },
  image: {
    width: '100%',
    height: 150,
    backgroundColor: '#f5f5f5',
  },
});

export default RichNotification;
