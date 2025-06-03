import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';

import PropBetCard from './PropBetCard';
import { auth } from '../config/firebase';
import { useTheme } from '../contexts/ThemeContext';
import { getSamplePropBets, getPropBetPredictions } from '../services/aiPredictionService';
import { hasPremiumAccess } from '../services/subscriptionService';
import { Game } from '../types/odds';
import { PropBetLine, PropBetPrediction } from '../types/playerProps';

interface PropBetListProps {
  game: Game;
}

const PropBetList: React.FC<PropBetListProps> = ({ game }) => {
  const [propBets, setPropBets] = useState<PropBetLine[]>([]);
  const [predictions, setPredictions] = useState<PropBetPrediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasPremium, setHasPremium] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const { colors, isDark } = useTheme();
  const navigation = useNavigation();

  // Check if user has premium access
  useEffect(() => {
    let isMounted = true; // Flag to prevent state updates after unmount

    const checkPremiumAccess = async () => {
      if (!isMounted) return;

      try {
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
      }
    };

    checkPremiumAccess();

    return () => {
      isMounted = false; // Prevent state updates after unmount
    };
  }, []);

  // Load prop bets and predictions
  useEffect(() => {
    let isMounted = true; // Flag to prevent state updates after unmount

    const loadPropBets = async () => {
      if (!isMounted) return;

      try {
        if (isMounted) setLoading(true);

        // Get sample prop bets for the game
        const samplePropBets = getSamplePropBets(game);
        if (isMounted) setPropBets(samplePropBets);

        // Get predictions for the prop bets
        const propPredictions = await getPropBetPredictions(samplePropBets);
        if (isMounted) setPredictions(propPredictions);
      } catch (error) {
        console.error('Error loading prop bets:', error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadPropBets();

    return () => {
      isMounted = false; // Prevent state updates after unmount
    };
  }, [game]);

  // Navigate to subscription screen
  const handleSubscribe = () => {
    // @ts-ignore - Navigation typing issue
    navigation.navigate('Subscription');
  };

  // Toggle expanded state
  const toggleExpanded = () => {
    setExpanded(!expanded);
  };

  // If loading, show loading indicator
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.text }]}>
          Loading player prop predictions...
        </Text>
      </View>
    );
  }

  // If no predictions, don't show anything
  if (predictions.length === 0 && !hasPremium) {
    return null;
  }

  // If no predictions but user has premium, show message
  if (predictions.length === 0 && hasPremium) {
    return (
      <View style={[styles.container, { backgroundColor: isDark ? '#1e1e1e' : '#f9f9f9' }]}>
        <Text style={[styles.title, { color: colors.text }]}>Player Prop Predictions</Text>
        <Text style={[styles.emptyText, { color: isDark ? '#BBBBBB' : '#666666' }]}>
          No player prop predictions available for this game.
        </Text>
      </View>
    );
  }

  // Determine how many predictions to show
  const displayPredictions = expanded ? predictions : predictions.slice(0, 2);

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#1e1e1e' : '#f9f9f9' }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Player Prop Predictions</Text>
        {!hasPremium && (
          <View style={[styles.premiumBadge, { backgroundColor: colors.primary }]}>
            <Text style={styles.premiumText}>PREMIUM</Text>
          </View>
        )}
      </View>

      <FlatList
        data={displayPredictions}
        renderItem={({ item }) => (
          <PropBetCard prediction={item} isPremium={hasPremium} onSubscribe={handleSubscribe} />
        )}
        keyExtractor={(item, index) => `${item.propBet.player}-${item.propBet.type}-${index}`}
        scrollEnabled={false}
        ListEmptyComponent={
          <Text style={[styles.emptyText, { color: isDark ? '#BBBBBB' : '#666666' }]}>
            No player prop predictions available.
          </Text>
        }
      />

      {predictions.length > 2 && (
        <TouchableOpacity
          style={[styles.expandButton, { borderColor: colors.primary }]}
          onPress={toggleExpanded}
        >
          <Text style={[styles.expandButtonText, { color: colors.primary }]}>
            {expanded ? 'Show Less' : `Show ${predictions.length - 2} More`}
          </Text>
          <Ionicons
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={16}
            color={colors.primary}
          />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 8,
    padding: 16,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  premiumBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  premiumText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  loadingContainer: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 14,
    marginTop: 8,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    marginVertical: 16,
  },
  expandButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    marginTop: 8,
    borderWidth: 1,
    borderRadius: 4,
  },
  expandButtonText: {
    fontSize: 14,
    fontWeight: '500',
    marginRight: 4,
  },
});

export default PropBetList;
