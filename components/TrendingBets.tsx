import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../contexts/ThemeContext';

interface TrendingBet {
  game_id: string;
  description: string;
  percentage: number;
}

interface TrendingBetsProps {
  trendingBets: TrendingBet[];
  showUpgradePrompt?: boolean;
}

/**
 * TrendingBets component shows public betting percentages for free users
 * @param {TrendingBetsProps} props - Component props
 * @returns {JSX.Element} - Rendered component
 */
const TrendingBets: React.FC<TrendingBetsProps> = ({ 
  trendingBets,
  showUpgradePrompt = true
}) => {
  const navigation = useNavigation();
  const { colors, isDark } = useTheme();

  // Navigate to subscription screen
  const handleUpgrade = () => {
    // @ts-ignore - Navigation typing issue
    navigation.navigate('Subscription');
  };

  // Render trending bet item
  const renderTrendingBet = ({ item }: { item: TrendingBet }) => {
    // Determine color based on percentage
    const getPercentageColor = (percentage: number): string => {
      if (percentage >= 70) return '#4CAF50'; // Green
      if (percentage >= 55) return '#FFC107'; // Yellow
      return '#F44336'; // Red
    };

    return (
      <View style={styles.betItem}>
        <View style={styles.betInfo}>
          <Ionicons 
            name="trending-up" 
            size={16} 
            color={getPercentageColor(item.percentage)} 
            style={styles.trendIcon}
          />
          <Text style={[styles.betDescription, { color: colors.text }]}>
            {item.description}
          </Text>
        </View>
        <View style={[
          styles.percentageContainer,
          { backgroundColor: getPercentageColor(item.percentage) + '20' } // Add transparency
        ]}>
          <Text style={[
            styles.percentageText,
            { color: getPercentageColor(item.percentage) }
          ]}>
            {item.percentage}%
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={[
      styles.container,
      { backgroundColor: isDark ? '#1e1e1e' : '#f9f9f9' }
    ]}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Ionicons name="stats-chart" size={20} color={colors.primary} />
          <Text style={[styles.title, { color: colors.text }]}>
            Trending Bets
          </Text>
        </View>
        <Text style={[styles.subtitle, { color: colors.text }]}>
          What the public is betting on
        </Text>
      </View>

      <FlatList
        data={trendingBets}
        renderItem={renderTrendingBet}
        keyExtractor={(item) => item.game_id}
        scrollEnabled={false}
        ItemSeparatorComponent={() => (
          <View style={[styles.separator, { backgroundColor: isDark ? '#333' : '#e0e0e0' }]} />
        )}
      />

      {showUpgradePrompt && (
        <View style={[
          styles.upgradeContainer,
          { backgroundColor: isDark ? 'rgba(0, 0, 0, 0.2)' : 'rgba(0, 0, 0, 0.05)' }
        ]}>
          <Text style={[styles.upgradeText, { color: colors.text }]}>
            Premium users see AI Edge % and recommended bets
          </Text>
          <TouchableOpacity
            style={[styles.upgradeButton, { backgroundColor: colors.primary }]}
            onPress={handleUpgrade}
          >
            <Text style={styles.upgradeButtonText}>Upgrade Now</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 8,
    marginVertical: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  header: {
    marginBottom: 16,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  subtitle: {
    fontSize: 14,
    opacity: 0.7,
  },
  betItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  betInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  trendIcon: {
    marginRight: 8,
  },
  betDescription: {
    fontSize: 14,
    flex: 1,
  },
  percentageContainer: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    minWidth: 50,
    alignItems: 'center',
  },
  percentageText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  separator: {
    height: 1,
    width: '100%',
  },
  upgradeContainer: {
    marginTop: 16,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  upgradeText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 8,
  },
  upgradeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
  },
  upgradeButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
});

export default TrendingBets;