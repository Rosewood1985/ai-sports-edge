import { Ionicons } from '@expo/vector-icons';
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';

import { auth } from '../config/firebase';
import Colors from '../constants/Colors';
import { useTheme } from '../contexts/ThemeContext';
import { hasPremiumAccess } from '../services/firebaseSubscriptionService';
import { Game } from '../types/odds';
// Import the necessary modules

// Helper functions
const americanToDecimal = (americanOdds: number): number => {
  if (americanOdds > 0) {
    return americanOdds / 100 + 1;
  } else {
    return 100 / Math.abs(americanOdds) + 1;
  }
};

const calculatePotentialPayout = (odds: number, betAmount: number): number => {
  const decimalOdds = americanToDecimal(odds);
  return decimalOdds * betAmount;
};

interface ParlayOddsCardProps {
  games: Game[];
  selections: string[];
  betType: 'h2h' | 'spreads' | 'totals';
  odds: number;
  onPurchase: () => void;
  onBetNow: () => void;
}

/**
 * ParlayOddsCard component displays parlay odds with a blurred preview for non-premium users
 * @param props Component props
 * @returns Rendered component
 */
const ParlayOddsCard: React.FC<ParlayOddsCardProps> = ({
  games,
  selections,
  betType,
  odds,
  onPurchase,
  onBetNow,
}) => {
  const { colors, isDark } = useTheme();
  const [hasPremium, setHasPremium] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [isHovered, setIsHovered] = useState<boolean>(false);

  // Standard bet amounts for potential payout calculation
  const betAmounts = [10, 50, 100];

  useEffect(() => {
    let isMounted = true;

    const checkParlayAccess = async () => {
      if (!isMounted) return;

      const userId = auth.currentUser?.uid;
      if (!userId) {
        if (isMounted) setHasPremium(false);
        return;
      }

      try {
        // Check if user has premium access
        const hasAccess = await hasPremiumAccess(userId);
        if (isMounted) setHasPremium(hasAccess);
      } catch (error) {
        console.error('Error checking parlay access:', error);
        if (isMounted) setHasPremium(false);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    checkParlayAccess();

    return () => {
      isMounted = false;
    };
  }, []);

  // Render loading state
  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.card }]}>
        <ActivityIndicator size="large" color={Colors.neon.blue} />
      </View>
    );
  }

  // Render blurred preview for non-premium users
  const renderBlurredPreview = () => {
    return (
      <View style={[styles.container, { backgroundColor: colors.card }]}>
        <View style={styles.blurredContent}>
          <Text style={[styles.title, { color: colors.text }]}>Live Parlay Odds</Text>

          <View style={styles.teamsContainer}>
            {games.map((game, index) => (
              <View key={index} style={styles.teamRow}>
                <Text style={[styles.teamText, { color: colors.text }]} numberOfLines={1}>
                  {game.home_team} vs {game.away_team}
                </Text>
                <View style={styles.blurredOdds}>
                  <Text style={[styles.blurredText, { color: colors.text }]}>+XXX</Text>
                </View>
              </View>
            ))}
          </View>

          <View style={styles.payoutContainer}>
            <Text style={[styles.payoutLabel, { color: colors.text }]}>
              Potential Payouts (Blurred)
            </Text>
            <View style={styles.payoutRow}>
              {betAmounts.map((amount, index) => (
                <View key={index} style={styles.payoutItem}>
                  <Text style={[styles.betAmount, { color: colors.text }]}>${amount}</Text>
                  <View style={styles.blurredPayout}>
                    <Text style={[styles.blurredText, { color: colors.text }]}>$XXX.XX</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          <TouchableOpacity
            style={[styles.purchaseButton, { backgroundColor: Colors.neon.blue }]}
            onPress={onPurchase}
            activeOpacity={0.8}
          >
            <Text style={styles.purchaseButtonText}>Unlock Live Parlay Odds</Text>
            <Ionicons name="lock-open" size={18} color="#FFFFFF" />
          </TouchableOpacity>

          <Text style={styles.pricingText}>Starting at $2.99 for 24-hour access</Text>
        </View>
      </View>
    );
  };

  // Render full content for premium users
  const renderFullContent = () => {
    return (
      <View style={[styles.container, { backgroundColor: colors.card }]}>
        <Text style={[styles.title, { color: colors.text }]}>Live Parlay Odds</Text>

        <View style={styles.teamsContainer}>
          {games.map((game, index) => (
            <View key={index} style={styles.teamRow}>
              <Text style={[styles.teamText, { color: colors.text }]} numberOfLines={1}>
                {selections[index] === game.home_team ? (
                  <Text style={{ fontWeight: 'bold' }}>{game.home_team}</Text>
                ) : (
                  game.home_team
                )}{' '}
                vs{' '}
                {selections[index] === game.away_team ? (
                  <Text style={{ fontWeight: 'bold' }}>{game.away_team}</Text>
                ) : (
                  game.away_team
                )}
              </Text>
              <Text style={[styles.oddsText, { color: Colors.neon.blue }]}>
                {odds > 0 ? `+${odds}` : `${odds}`}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.combinedOddsContainer}>
          <Text style={[styles.combinedOddsLabel, { color: colors.text }]}>
            Combined Parlay Odds:
          </Text>
          <Text style={[styles.combinedOddsValue, { color: Colors.neon.blue }]}>
            {odds > 0 ? `+${odds}` : `${odds}`}
          </Text>
        </View>

        <View style={styles.payoutContainer}>
          <Text style={[styles.payoutLabel, { color: colors.text }]}>Potential Payouts</Text>
          <View style={styles.payoutRow}>
            {betAmounts.map((amount, index) => (
              <View key={index} style={styles.payoutItem}>
                <Text style={[styles.betAmount, { color: colors.text }]}>${amount}</Text>
                <Text style={[styles.payoutAmount, { color: Colors.neon.green }]}>
                  ${calculatePotentialPayout(odds, amount).toFixed(2)}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <TouchableOpacity
          style={[
            styles.betNowButton,
            { backgroundColor: Colors.neon.green },
            isHovered && styles.betNowButtonHovered,
          ]}
          onPress={onBetNow}
          activeOpacity={0.8}
          onPressIn={() => setIsHovered(true)}
          onPressOut={() => setIsHovered(false)}
        >
          <Text style={styles.betNowButtonText}>Bet Now on FanDuel</Text>
          <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
        </TouchableOpacity>

        <Text style={styles.disclaimerText}>Odds update in real-time. Bet responsibly.</Text>
      </View>
    );
  };

  return hasPremium ? renderFullContent() : renderBlurredPreview();
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  teamsContainer: {
    marginBottom: 16,
  },
  teamRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  teamText: {
    flex: 1,
    fontSize: 14,
    marginRight: 8,
  },
  oddsText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  combinedOddsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  combinedOddsLabel: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  combinedOddsValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  payoutContainer: {
    marginBottom: 16,
  },
  payoutLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  payoutRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  payoutItem: {
    alignItems: 'center',
    flex: 1,
  },
  betAmount: {
    fontSize: 14,
    marginBottom: 4,
  },
  payoutAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  betNowButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  betNowButtonHovered: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  betNowButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginRight: 8,
  },
  disclaimerText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
  },
  blurredContent: {
    opacity: 0.9,
  },
  blurredOdds: {
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  blurredText: {
    opacity: 0.5,
  },
  blurredPayout: {
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  purchaseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  purchaseButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginRight: 8,
  },
  pricingText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
  },
});

export default ParlayOddsCard;
