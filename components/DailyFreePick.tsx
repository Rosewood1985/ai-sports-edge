import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { auth } from '../config/firebase';
import { hasUsedFreeDailyPick, getNextUnlockTime } from '../services/subscriptionService';
import { getFreeDailyPick } from '../services/aiPredictionService';
import { Game, AIPrediction } from '../types/odds';
import { useTheme } from '../contexts/ThemeContext';

interface DailyFreePickProps {
  games: Game[];
  onAdRequested: () => Promise<boolean>;
}

/**
 * DailyFreePick component shows one free AI pick per day
 * @param {DailyFreePickProps} props - Component props
 * @returns {JSX.Element} - Rendered component
 */
const DailyFreePick: React.FC<DailyFreePickProps> = ({ games, onAdRequested }) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [freePick, setFreePick] = useState<Game | null>(null);
  const [hasUsedPick, setHasUsedPick] = useState<boolean>(false);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [adViewed, setAdViewed] = useState<boolean>(false);
  const navigation = useNavigation();
  const { colors, isDark } = useTheme();

  // Check if user has used their free daily pick
  useEffect(() => {
    let isMounted = true;
    
    const checkFreePick = async () => {
      if (!isMounted) return;
      
      try {
        setLoading(true);
        const userId = auth.currentUser?.uid;
        
        if (!userId) {
          if (isMounted) {
            setHasUsedPick(false);
            setTimeRemaining(0);
          }
          return;
        }
        
        // Check if user has used their free daily pick
        const usedPick = await hasUsedFreeDailyPick(userId);
        if (isMounted) setHasUsedPick(usedPick);
        
        // If user has used their pick, get time until next unlock
        if (usedPick) {
          const nextUnlockTime = await getNextUnlockTime(userId, 'free_daily_pick');
          if (isMounted) setTimeRemaining(nextUnlockTime);
        } else {
          // If user hasn't used their pick, get a free pick
          const pick = await getFreeDailyPick(games);
          if (isMounted) setFreePick(pick);
        }
      } catch (error) {
        console.error('Error checking free daily pick:', error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    
    checkFreePick();
    
    return () => {
      isMounted = false;
    };
  }, [games, adViewed]);
  
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
    try {
      const adViewed = await onAdRequested();
      if (adViewed) {
        setAdViewed(true);
      }
    } catch (error) {
      console.error('Error viewing ad:', error);
    }
  };
  
  // Get confidence color based on level
  const getConfidenceColor = (level: string): string => {
    switch (level) {
      case 'high':
        return '#4CAF50'; // Green
      case 'medium':
        return '#FFC107'; // Yellow
      case 'low':
        return '#F44336'; // Red
      default:
        return '#757575'; // Gray
    }
  };
  
  // If loading, show loading indicator
  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: isDark ? '#1e1e1e' : '#f9f9f9' }]}>
        <ActivityIndicator size="small" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.text }]}>
          Loading your free daily pick...
        </Text>
      </View>
    );
  }
  
  // If user has used their pick, show time until next unlock
  if (hasUsedPick) {
    return (
      <View style={[styles.container, { backgroundColor: isDark ? '#1e1e1e' : '#f9f9f9' }]}>
        <Ionicons name="time-outline" size={32} color={colors.primary} />
        <Text style={[styles.title, { color: colors.text }]}>
          You've used your free daily pick
        </Text>
        <Text style={[styles.subtitle, { color: colors.text }]}>
          Next pick available in {formatTimeRemaining()}
        </Text>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.primary }]}
          onPress={handleUpgrade}
        >
          <Text style={styles.buttonText}>Upgrade for Unlimited Picks</Text>
        </TouchableOpacity>
      </View>
    );
  }
  
  // If ad is required but not viewed, show ad button
  if (!adViewed && !freePick) {
    return (
      <View style={[styles.container, { backgroundColor: isDark ? '#1e1e1e' : '#f9f9f9' }]}>
        <Ionicons name="gift-outline" size={32} color={colors.primary} />
        <Text style={[styles.title, { color: colors.text }]}>
          Your Free Daily AI Pick
        </Text>
        <Text style={[styles.subtitle, { color: colors.text }]}>
          Watch a short ad to unlock your free AI prediction
        </Text>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.primary }]}
          onPress={handleViewAd}
        >
          <Text style={styles.buttonText}>Watch Ad to Unlock</Text>
        </TouchableOpacity>
      </View>
    );
  }
  
  // If no free pick is available, show message
  if (!freePick) {
    return (
      <View style={[styles.container, { backgroundColor: isDark ? '#1e1e1e' : '#f9f9f9' }]}>
        <Ionicons name="alert-circle-outline" size={32} color={colors.primary} />
        <Text style={[styles.title, { color: colors.text }]}>
          No Free Pick Available
        </Text>
        <Text style={[styles.subtitle, { color: colors.text }]}>
          There are no games available for a free pick right now
        </Text>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.primary }]}
          onPress={handleUpgrade}
        >
          <Text style={styles.buttonText}>Upgrade for Premium Picks</Text>
        </TouchableOpacity>
      </View>
    );
  }
  
  // Show free pick
  const prediction = freePick.ai_prediction as AIPrediction;
  
  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#1e1e1e' : '#f9f9f9' }]}>
      <View style={styles.header}>
        <Ionicons name="gift-outline" size={24} color={colors.primary} />
        <Text style={[styles.headerText, { color: colors.text }]}>
          Your Free Daily AI Pick
        </Text>
      </View>
      
      <View style={styles.matchupContainer}>
        <Text style={[styles.matchupText, { color: colors.text }]}>
          {freePick.home_team} vs {freePick.away_team}
        </Text>
        <Text style={[styles.timeText, { color: colors.text }]}>
          {new Date(freePick.commence_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
      
      <View style={styles.predictionContainer}>
        <Text style={[styles.predictionLabel, { color: colors.text }]}>
          AI Prediction:
        </Text>
        <Text style={[styles.predictionText, { color: colors.primary }]}>
          {prediction.predicted_winner}
        </Text>
        <View style={[
          styles.confidenceTag,
          { backgroundColor: getConfidenceColor(prediction.confidence) }
        ]}>
          <Text style={styles.confidenceText}>
            {prediction.confidence.toUpperCase()} CONFIDENCE
          </Text>
        </View>
      </View>
      
      <View style={styles.reasoningContainer}>
        <Text style={[styles.reasoningText, { color: colors.text }]}>
          {prediction.reasoning}
        </Text>
      </View>
      
      <TouchableOpacity
        style={[styles.button, { backgroundColor: colors.primary }]}
        onPress={handleUpgrade}
      >
        <Text style={styles.buttonText}>Upgrade for Unlimited Picks</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 8,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  loadingText: {
    fontSize: 16,
    marginTop: 8,
    textAlign: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 8,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
    opacity: 0.8,
  },
  matchupContainer: {
    marginBottom: 12,
  },
  matchupText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  timeText: {
    fontSize: 14,
    textAlign: 'center',
    opacity: 0.7,
  },
  predictionContainer: {
    alignItems: 'center',
    marginBottom: 12,
  },
  predictionLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  predictionText: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  confidenceTag: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 4,
  },
  confidenceText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  reasoningContainer: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 4,
  },
  reasoningText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  button: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 4,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
});

export default DailyFreePick;