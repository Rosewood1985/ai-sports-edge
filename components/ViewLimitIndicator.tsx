import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { ThemedText } from './ThemedText';
import { Ionicons } from '@expo/vector-icons';
import { getUserViewCount, ViewCountData } from '../services/viewCounterService';
import { useTheme } from '../contexts/ThemeContext';
import { auth } from '../config/firebase';

interface ViewLimitIndicatorProps {
  onUpgradePress: () => void;
  compact?: boolean;
}

/**
 * Component to display the user's remaining free views
 * and prompt for upgrade when approaching the limit
 */
const ViewLimitIndicator: React.FC<ViewLimitIndicatorProps> = ({
  onUpgradePress,
  compact = false
}) => {
  const [viewData, setViewData] = useState<ViewCountData | null>(null);
  const [expanded, setExpanded] = useState(false);
  const { colors, isDark } = useTheme();
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  
  // Load view count data
  useEffect(() => {
    const loadViewData = async () => {
      try {
        const userId = auth.currentUser?.uid;
        const data = await getUserViewCount(userId);
        setViewData(data);
        
        // Animate in
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }).start();
      } catch (error) {
        console.error('Error loading view data:', error);
      }
    };
    
    loadViewData();
  }, []);
  
  // Don't show anything if we don't have data yet
  if (!viewData) {
    return null;
  }
  
  // Don't show if user has plenty of views remaining (less than 50% used)
  // unless in compact mode which is always shown
  if (!compact && viewData.percentageUsed < 50) {
    return null;
  }
  
  // Determine color based on remaining views
  const getStatusColor = () => {
    if (viewData.remainingViews <= 0) {
      return '#FF3B30'; // Red
    } else if (viewData.percentageUsed >= 75) {
      return '#FF9500'; // Orange
    } else {
      return '#34C759'; // Green
    }
  };
  
  const statusColor = getStatusColor();
  
  // Compact version (just shows the indicator dot)
  if (compact && !expanded) {
    return (
      <Animated.View style={[styles.compactContainer, { opacity: fadeAnim }]}>
        <TouchableOpacity
          style={[styles.compactButton, { borderColor: statusColor }]}
          onPress={() => setExpanded(true)}
          accessibilityLabel="View usage limit indicator"
          accessibilityHint="Shows how many free views you have remaining"
        >
          <View style={[styles.compactDot, { backgroundColor: statusColor }]} />
        </TouchableOpacity>
      </Animated.View>
    );
  }
  
  // Full or expanded version
  return (
    <Animated.View 
      style={[
        styles.container, 
        { 
          backgroundColor: isDark ? 'rgba(0, 0, 0, 0.7)' : 'rgba(255, 255, 255, 0.9)',
          borderColor: statusColor,
          opacity: fadeAnim
        }
      ]}
    >
      {compact && (
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => setExpanded(false)}
          accessibilityLabel="Close view limit indicator"
        >
          <Ionicons name="close" size={16} color={colors.text} />
        </TouchableOpacity>
      )}
      
      <View style={styles.header}>
        <Ionicons 
          name={viewData.remainingViews <= 0 ? "alert-circle" : "eye"} 
          size={18} 
          color={statusColor} 
        />
        <ThemedText style={[styles.title, { color: statusColor }]}>
          {viewData.remainingViews <= 0 
            ? 'Free Views Used' 
            : `${viewData.remainingViews} Free ${viewData.remainingViews === 1 ? 'View' : 'Views'} Left`}
        </ThemedText>
      </View>
      
      <View style={styles.progressContainer}>
        <View 
          style={[
            styles.progressBar, 
            { 
              width: `${viewData.percentageUsed}%`,
              backgroundColor: statusColor
            }
          ]} 
        />
      </View>
      
      <ThemedText style={styles.description}>
        {viewData.remainingViews <= 0 
          ? 'You\'ve used all your free views for this month.' 
          : `You've used ${viewData.count} of your ${viewData.maxViews + viewData.bonusViews} free views${viewData.nextReset ? ' this month' : ''}.`}
      </ThemedText>
      
      {viewData.nextReset && (
        <ThemedText style={styles.resetInfo}>
          Resets on {viewData.nextReset.toLocaleDateString()}
        </ThemedText>
      )}
      
      <TouchableOpacity
        style={[styles.upgradeButton, { backgroundColor: colors.primary }]}
        onPress={onUpgradePress}
        accessibilityLabel="Upgrade to premium"
        accessibilityHint="Opens the subscription options screen"
      >
        <ThemedText style={styles.upgradeButtonText}>
          {viewData.remainingViews <= 0 ? 'Upgrade Now' : 'Get Unlimited Access'}
        </ThemedText>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  compactContainer: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 100,
  },
  compactButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  compactDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  closeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 1,
    padding: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  progressContainer: {
    height: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 3,
    marginBottom: 12,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 3,
  },
  description: {
    fontSize: 14,
    marginBottom: 8,
  },
  resetInfo: {
    fontSize: 12,
    opacity: 0.7,
    marginBottom: 16,
  },
  upgradeButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignItems: 'center',
  },
  upgradeButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
});

export default ViewLimitIndicator;