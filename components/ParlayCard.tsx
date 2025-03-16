import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ParlayPackage, ParlayPick, purchaseParlay } from '../services/parlayService';
import { auth } from '../config/firebase';
import { hasPremiumAccess } from '../services/subscriptionService';
import { useTheme } from '../contexts/ThemeContext';
import { trackEvent } from '../services/analyticsService';

interface ParlayCardProps {
  parlay: ParlayPackage;
  onPurchaseComplete?: () => void;
}

/**
 * ParlayCard component displays a parlay suggestion with options to purchase
 * @param {ParlayCardProps} props - Component props
 * @returns {JSX.Element} - Rendered component
 */
const ParlayCard: React.FC<ParlayCardProps> = ({ parlay, onPurchaseComplete }) => {
  const [expanded, setExpanded] = useState(false);
  const [purchasing, setPurchasing] = useState(false);
  const [hasPremium, setHasPremium] = useState(false);
  const { colors, isDark } = useTheme();

  // Check if user has premium access
  React.useEffect(() => {
    const checkPremiumAccess = async () => {
      const userId = auth.currentUser?.uid;
      if (userId) {
        const premium = await hasPremiumAccess(userId);
        setHasPremium(premium);
      }
    };
    
    checkPremiumAccess();
  }, []);

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

  // Handle purchase button press
  const handlePurchase = async () => {
    const userId = auth.currentUser?.uid;
    
    if (!userId) {
      Alert.alert('Sign In Required', 'Please sign in to purchase this parlay suggestion.');
      return;
    }
    
    setPurchasing(true);
    
    try {
      const success = await purchaseParlay(userId, parlay.id, parlay);
      
      if (success) {
        // Track purchase event
        trackEvent('parlay_purchased' as any, {
          parlay_id: parlay.id,
          picks_count: parlay.picks.length,
          confidence: parlay.confidence
        });
        
        Alert.alert(
          'Purchase Successful',
          'You now have access to this parlay suggestion. Good luck!'
        );
        
        // Notify parent component
        if (onPurchaseComplete) {
          onPurchaseComplete();
        }
      } else {
        Alert.alert('Purchase Failed', 'There was an error processing your purchase. Please try again.');
      }
    } catch (error) {
      console.error('Error purchasing parlay:', error);
      Alert.alert('Purchase Error', 'An unexpected error occurred. Please try again later.');
    } finally {
      setPurchasing(false);
    }
  };

  // Render a single pick
  const renderPick = (pick: ParlayPick, index: number) => {
    // If not purchased and not expanded, only show the first pick
    if (!parlay.purchased && !expanded && index > 0) {
      return null;
    }
    
    return (
      <View key={index} style={styles.pickContainer}>
        <View style={styles.pickHeader}>
          <Text style={styles.matchup}>
            {pick.homeTeam} vs {pick.awayTeam}
          </Text>
          <View
            style={[
              styles.confidenceTag,
              { backgroundColor: getConfidenceColor(pick.confidence) }
            ]}
          >
            <Text style={styles.confidenceTagText}>
              {pick.confidence.toUpperCase()}
            </Text>
          </View>
        </View>
        
        <View style={styles.pickDetails}>
          <Text style={styles.pickText}>
            <Text style={styles.bold}>Pick: </Text>{pick.pick}
          </Text>
          <Text style={styles.oddsText}>
            <Text style={styles.bold}>Odds: </Text>{pick.odds}
          </Text>
        </View>
        
        {(parlay.purchased || expanded) && (
          <Text style={styles.reasoning}>
            {pick.reasoning}
          </Text>
        )}
      </View>
    );
  };

  // Calculate price with discount for premium users
  const getPrice = () => {
    // 30% discount for premium users
    const price = hasPremium ? 4.99 * 0.7 : 4.99;
    return price.toFixed(2);
  };

  return (
    <View style={[
      styles.card,
      { backgroundColor: isDark ? '#1e1e1e' : '#f9f9f9' }
    ]}>
      {/* Parlay Header */}
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={[styles.title, { color: colors.text }]}>
            {parlay.title}
          </Text>
          <View style={[
            styles.trendBadge,
            { backgroundColor: colors.primary }
          ]}>
            <Ionicons name="trending-up" size={12} color="#fff" />
            <Text style={styles.trendText}>
              TRENDING
            </Text>
          </View>
        </View>
        
        <View style={[
          styles.confidenceIndicator,
          { backgroundColor: getConfidenceColor(parlay.confidence) }
        ]}>
          <Text style={styles.confidenceText}>
            {parlay.confidence.toUpperCase()} CONFIDENCE
          </Text>
        </View>
      </View>
      
      {/* Parlay Details */}
      <View style={styles.detailsContainer}>
        <View style={styles.detailRow}>
          <View style={styles.detailItem}>
            <Text style={[styles.detailLabel, { color: isDark ? '#aaa' : '#666' }]}>
              Total Odds
            </Text>
            <Text style={[styles.detailValue, { color: colors.text }]}>
              {parlay.totalOdds}
            </Text>
          </View>
          
          <View style={styles.detailItem}>
            <Text style={[styles.detailLabel, { color: isDark ? '#aaa' : '#666' }]}>
              Stake
            </Text>
            <Text style={[styles.detailValue, { color: colors.text }]}>
              ${parlay.stakeAmount.toFixed(2)}
            </Text>
          </View>
          
          <View style={styles.detailItem}>
            <Text style={[styles.detailLabel, { color: isDark ? '#aaa' : '#666' }]}>
              Potential Return
            </Text>
            <Text style={[styles.detailValue, { color: colors.primary }]}>
              ${parlay.potentialReturn.toFixed(2)}
            </Text>
          </View>
        </View>
      </View>
      
      {/* Picks */}
      <View style={styles.picksContainer}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          {parlay.picks.length}-Pick Parlay
        </Text>
        
        {parlay.picks.map((pick, index) => renderPick(pick, index))}
        
        {/* Show More/Less Button */}
        {!parlay.purchased && parlay.picks.length > 1 && (
          <TouchableOpacity
            style={styles.expandButton}
            onPress={() => setExpanded(!expanded)}
          >
            <Text style={[styles.expandButtonText, { color: colors.primary }]}>
              {expanded ? 'Show Less' : `Show All ${parlay.picks.length} Picks`}
            </Text>
            <Ionicons
              name={expanded ? 'chevron-up' : 'chevron-down'}
              size={16}
              color={colors.primary}
            />
          </TouchableOpacity>
        )}
      </View>
      
      {/* Purchase Button or Purchased Indicator */}
      {!parlay.purchased ? (
        <TouchableOpacity
          style={[
            styles.purchaseButton,
            { backgroundColor: colors.primary }
          ]}
          onPress={handlePurchase}
          disabled={purchasing}
        >
          {purchasing ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Text style={styles.purchaseButtonText}>
                Purchase for ${getPrice()}
              </Text>
              {hasPremium && (
                <View style={styles.discountBadge}>
                  <Text style={styles.discountText}>30% OFF</Text>
                </View>
              )}
            </>
          )}
        </TouchableOpacity>
      ) : (
        <View style={styles.purchasedContainer}>
          <Ionicons name="checkmark-circle" size={18} color="#4CAF50" />
          <Text style={styles.purchasedText}>Purchased</Text>
        </View>
      )}
      
      {/* Expiration Notice */}
      <Text style={[styles.expirationText, { color: isDark ? '#aaa' : '#666' }]}>
        Expires in {Math.ceil((parlay.expiresAt - Date.now()) / (1000 * 60 * 60))} hours
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    marginHorizontal: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
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
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 8,
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  trendText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
    marginLeft: 2,
  },
  confidenceIndicator: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  confidenceText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  detailsContainer: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailItem: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  picksContainer: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  pickContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.03)',
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
  },
  pickHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  matchup: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  confidenceTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  confidenceTagText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  pickDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  pickText: {
    fontSize: 13,
    flex: 1,
  },
  oddsText: {
    fontSize: 13,
    fontWeight: '500',
  },
  reasoning: {
    fontSize: 12,
    fontStyle: 'italic',
    color: '#666',
    marginTop: 4,
  },
  expandButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  expandButtonText: {
    fontSize: 12,
    fontWeight: '500',
    marginRight: 4,
  },
  purchaseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  purchaseButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  discountBadge: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  discountText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  purchasedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginBottom: 8,
  },
  purchasedText: {
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  expirationText: {
    fontSize: 12,
    textAlign: 'center',
  },
  bold: {
    fontWeight: 'bold',
  },
});

export default ParlayCard;