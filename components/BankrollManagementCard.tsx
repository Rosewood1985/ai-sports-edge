import { firebaseService } from '../src/atomic/organisms/firebaseService';
import 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { ThemedText } from './ThemedText';
import { BankrollRecommendation } from '../types/horseRacing';
import { bankrollManagementService } from '../services/bankrollManagementService';
import { auth } from '../config/firebase';

interface BankrollManagementCardProps {
  recommendation: BankrollRecommendation;
  onImplemented: () => void;
}

/**
 * Component to display a bankroll management recommendation
 */
const BankrollManagementCard: React.FC<BankrollManagementCardProps> = ({
  recommendation,
  onImplemented
}) => {
  const { colors, isDark } = useTheme();
  const [implementing, setImplementing] = React.useState(false);
  
  // Get icon based on recommendation type
  const getTypeIcon = () => {
    switch (recommendation.type) {
      case 'bet_sizing':
        return 'cash-outline';
      case 'bet_type':
        return 'options-outline';
      case 'track_selection':
        return 'map-outline';
      case 'timing':
        return 'time-outline';
      case 'risk_management':
        return 'shield-outline';
      case 'tracking':
        return 'analytics-outline';
      case 'discipline':
        return 'fitness-outline';
      default:
        return 'bulb-outline';
    }
  };
  
  // Get color based on priority
  const getPriorityColor = () => {
    switch (recommendation.priority) {
      case 'high':
        return isDark ? '#e74c3c' : '#e74c3c';
      case 'medium':
        return isDark ? '#f39c12' : '#f39c12';
      case 'low':
        return isDark ? '#2ecc71' : '#2ecc71';
      default:
        return colors.primary;
    }
  };
  
  // Handle implement button press
  const handleImplement = async () => {
    if (implementing) return;
    
    setImplementing(true);
    
    try {
      const user = auth.currentUser;
      if (!user) {
        return;
      }
      
      const success = await bankrollManagementService.implementRecommendation(
        user.uid,
        recommendation.id
      );
      
      if (success) {
        onImplemented();
      }
    } catch (error) {
      console.error('Error implementing recommendation:', error);
    } finally {
      setImplementing(false);
    }
  };
  
  return (
    <View style={[
      styles.container,
      {
        backgroundColor: isDark ? '#222222' : '#FFFFFF',
        borderLeftColor: getPriorityColor(),
      }
    ]}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Ionicons
            name={getTypeIcon()}
            size={20}
            color={getPriorityColor()}
            style={styles.icon}
          />
          <ThemedText style={styles.title}>{recommendation.title}</ThemedText>
        </View>
        
        <View style={[
          styles.priorityBadge,
          { backgroundColor: getPriorityColor() + '20' }
        ]}>
          <ThemedText style={[styles.priorityText, { color: getPriorityColor() }]}>
            {recommendation.priority.toUpperCase()} PRIORITY
          </ThemedText>
        </View>
      </View>
      
      <ThemedText style={styles.description}>{recommendation.description}</ThemedText>
      
      <View style={styles.footer}>
        <View style={styles.impactContainer}>
          <ThemedText style={styles.impactLabel}>Potential Impact:</ThemedText>
          <ThemedText style={styles.impactValue}>{recommendation.potentialImpact}</ThemedText>
        </View>
        
        <TouchableOpacity
          style={[
            styles.implementButton,
            { backgroundColor: colors.primary }
          ]}
          onPress={handleImplement}
          disabled={implementing}
        >
          <ThemedText style={styles.implementButtonText}>
            {implementing ? 'Implementing...' : 'Implement'}
          </ThemedText>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  icon: {
    marginRight: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  description: {
    fontSize: 14,
    marginBottom: 16,
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  impactContainer: {
    flex: 1,
  },
  impactLabel: {
    fontSize: 12,
    opacity: 0.7,
    marginBottom: 2,
  },
  impactValue: {
    fontSize: 13,
    fontWeight: '500',
  },
  implementButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
  },
  implementButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default BankrollManagementCard;