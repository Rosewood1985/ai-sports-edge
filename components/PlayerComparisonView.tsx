import { Ionicons } from '@expo/vector-icons';
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';

import { ThemedText } from './ThemedText';
import UpgradePrompt from './UpgradePrompt';
import { hasPlayerComparisonAccess } from '../services/subscriptionService';
import { incrementViewCounter, shouldShowUpgradePrompt } from '../services/viewCounterService';

interface PlayerStats {
  points: number;
  rebounds: number;
  assists: number;
  steals: number;
  blocks: number;
  turnovers: number;
  fieldGoalPercentage: number;
  threePointPercentage: number;
  freeThrowPercentage: number;
  plusMinus: number;
  // Advanced metrics
  trueShootingPercentage?: number;
  effectiveFieldGoalPercentage?: number;
  usageRate?: number;
  playerEfficiencyRating?: number;
  offensiveRating?: number;
  defensiveRating?: number;
}

interface Player {
  id: string;
  name: string;
  team: string;
  position: string;
  jerseyNumber: string;
  stats: PlayerStats;
}

interface PlayerComparisonViewProps {
  player1: Player;
  player2: Player;
  gameId: string;
  userId: string;
}

const PlayerComparisonView: React.FC<PlayerComparisonViewProps> = ({
  player1,
  player2,
  gameId,
  userId,
}) => {
  const [activeCategory, setActiveCategory] = useState<'offensive' | 'defensive' | 'overall'>(
    'overall'
  );
  const [hasAccess, setHasAccess] = useState(false);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);

  useEffect(() => {
    const checkAccess = async () => {
      // Check if user has access to player comparison
      const hasComparisonAccess = await hasPlayerComparisonAccess(userId, gameId);
      setHasAccess(hasComparisonAccess);

      // Increment view counter
      await incrementViewCounter();

      // Check if we should show upgrade prompt
      const shouldShowPrompt = await shouldShowUpgradePrompt();
      if (shouldShowPrompt && !hasComparisonAccess) {
        setShowUpgradePrompt(true);
      }
    };

    checkAccess();
  }, [userId, gameId]);

  const handleCategoryPress = (category: 'offensive' | 'defensive' | 'overall') => {
    if (!hasAccess) {
      setShowUpgradePrompt(true);
      return;
    }

    setActiveCategory(category);
  };

  const renderComparisonHeader = () => (
    <View style={styles.comparisonHeader}>
      <View style={styles.playerColumn}>
        <ThemedText style={styles.playerName}>{player1.name}</ThemedText>
        <ThemedText style={styles.playerInfo}>
          {player1.team} | {player1.position}
        </ThemedText>
      </View>

      <View style={styles.vsColumn}>
        <ThemedText style={styles.vsText}>VS</ThemedText>
      </View>

      <View style={styles.playerColumn}>
        <ThemedText style={styles.playerName}>{player2.name}</ThemedText>
        <ThemedText style={styles.playerInfo}>
          {player2.team} | {player2.position}
        </ThemedText>
      </View>
    </View>
  );

  const renderCategoryTabs = () => (
    <View style={styles.categoryTabs}>
      <TouchableOpacity
        style={[styles.categoryTab, activeCategory === 'overall' && styles.activeCategoryTab]}
        onPress={() => handleCategoryPress('overall')}
      >
        <ThemedText
          style={[
            styles.categoryTabText,
            activeCategory === 'overall' && styles.activeCategoryTabText,
          ]}
        >
          Overall
        </ThemedText>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.categoryTab, activeCategory === 'offensive' && styles.activeCategoryTab]}
        onPress={() => handleCategoryPress('offensive')}
      >
        <ThemedText
          style={[
            styles.categoryTabText,
            activeCategory === 'offensive' && styles.activeCategoryTabText,
          ]}
        >
          Offensive
        </ThemedText>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.categoryTab, activeCategory === 'defensive' && styles.activeCategoryTab]}
        onPress={() => handleCategoryPress('defensive')}
      >
        <ThemedText
          style={[
            styles.categoryTabText,
            activeCategory === 'defensive' && styles.activeCategoryTabText,
          ]}
        >
          Defensive
        </ThemedText>
      </TouchableOpacity>
    </View>
  );

  const renderLockedContent = () => (
    <View style={styles.lockedContainer}>
      <Ionicons name="lock-closed" size={48} color="#0a7ea4" />
      <ThemedText style={styles.lockedText}>
        Player comparison is available with Premium subscription
      </ThemedText>
      <TouchableOpacity style={styles.unlockButton} onPress={() => setShowUpgradePrompt(true)}>
        <ThemedText style={styles.unlockButtonText}>Unlock Player Comparison</ThemedText>
      </TouchableOpacity>
    </View>
  );

  const renderStatComparison = (
    label: string,
    value1: number | string,
    value2: number | string,
    higherIsBetter: boolean = true
  ) => {
    // Determine which value is better
    let player1Better = false;
    let player2Better = false;

    if (typeof value1 === 'number' && typeof value2 === 'number') {
      if (higherIsBetter) {
        player1Better = value1 > value2;
        player2Better = value2 > value1;
      } else {
        player1Better = value1 < value2;
        player2Better = value2 < value1;
      }
    }

    return (
      <View style={styles.statComparisonRow}>
        <View style={styles.statComparisonCell}>
          <ThemedText style={[styles.statComparisonValue, player1Better && styles.betterValue]}>
            {typeof value1 === 'number' ? value1.toFixed(1) : value1}
            {player1Better && <Ionicons name="caret-up" size={12} color="#34C759" />}
          </ThemedText>
        </View>

        <View style={styles.statComparisonLabelCell}>
          <ThemedText style={styles.statComparisonLabel}>{label}</ThemedText>
        </View>

        <View style={styles.statComparisonCell}>
          <ThemedText style={[styles.statComparisonValue, player2Better && styles.betterValue]}>
            {typeof value2 === 'number' ? value2.toFixed(1) : value2}
            {player2Better && <Ionicons name="caret-up" size={12} color="#34C759" />}
          </ThemedText>
        </View>
      </View>
    );
  };

  const renderOverallComparison = () => (
    <View style={styles.comparisonContent}>
      <View style={styles.advantageContainer}>
        <ThemedText style={styles.advantageTitle}>Overall Advantage</ThemedText>
        <ThemedText style={styles.advantageText}>
          {player1.stats.playerEfficiencyRating! > player2.stats.playerEfficiencyRating!
            ? `${player1.name} has a slight edge in overall performance metrics.`
            : `${player2.name} has a slight edge in overall performance metrics.`}
        </ThemedText>
      </View>

      {renderStatComparison('PTS', player1.stats.points, player2.stats.points)}
      {renderStatComparison('REB', player1.stats.rebounds, player2.stats.rebounds)}
      {renderStatComparison('AST', player1.stats.assists, player2.stats.assists)}
      {renderStatComparison('STL', player1.stats.steals, player2.stats.steals)}
      {renderStatComparison('BLK', player1.stats.blocks, player2.stats.blocks)}
      {renderStatComparison('TO', player1.stats.turnovers, player2.stats.turnovers, false)}
      {renderStatComparison(
        'FG%',
        player1.stats.fieldGoalPercentage,
        player2.stats.fieldGoalPercentage
      )}
      {renderStatComparison(
        '3P%',
        player1.stats.threePointPercentage,
        player2.stats.threePointPercentage
      )}
      {renderStatComparison(
        'FT%',
        player1.stats.freeThrowPercentage,
        player2.stats.freeThrowPercentage
      )}
      {renderStatComparison('+/-', player1.stats.plusMinus, player2.stats.plusMinus)}
    </View>
  );

  const renderOffensiveComparison = () => (
    <View style={styles.comparisonContent}>
      <View style={styles.advantageContainer}>
        <ThemedText style={styles.advantageTitle}>Offensive Advantage</ThemedText>
        <ThemedText style={styles.advantageText}>
          {player1.stats.offensiveRating! > player2.stats.offensiveRating!
            ? `${player1.name} has a higher offensive rating and is more efficient.`
            : `${player2.name} has a higher offensive rating and is more efficient.`}
        </ThemedText>
      </View>

      {renderStatComparison('PTS', player1.stats.points, player2.stats.points)}
      {renderStatComparison('AST', player1.stats.assists, player2.stats.assists)}
      {renderStatComparison(
        'FG%',
        player1.stats.fieldGoalPercentage,
        player2.stats.fieldGoalPercentage
      )}
      {renderStatComparison(
        '3P%',
        player1.stats.threePointPercentage,
        player2.stats.threePointPercentage
      )}
      {renderStatComparison(
        'FT%',
        player1.stats.freeThrowPercentage,
        player2.stats.freeThrowPercentage
      )}
      {renderStatComparison(
        'TS%',
        player1.stats.trueShootingPercentage || 58.5,
        player2.stats.trueShootingPercentage || 52.3
      )}
      {renderStatComparison(
        'eFG%',
        player1.stats.effectiveFieldGoalPercentage || 52.3,
        player2.stats.effectiveFieldGoalPercentage || 48.7
      )}
      {renderStatComparison(
        'USG%',
        player1.stats.usageRate || 25.3,
        player2.stats.usageRate || 28.7
      )}
      {renderStatComparison(
        'Off Rtg',
        player1.stats.offensiveRating || 112.4,
        player2.stats.offensiveRating || 108.3
      )}
    </View>
  );

  const renderDefensiveComparison = () => (
    <View style={styles.comparisonContent}>
      <View style={styles.advantageContainer}>
        <ThemedText style={styles.advantageTitle}>Defensive Advantage</ThemedText>
        <ThemedText style={styles.advantageText}>
          {player1.stats.defensiveRating! < player2.stats.defensiveRating!
            ? `${player1.name} has a better defensive rating and creates more stops.`
            : `${player2.name} has a better defensive rating and creates more stops.`}
        </ThemedText>
      </View>

      {renderStatComparison('STL', player1.stats.steals, player2.stats.steals)}
      {renderStatComparison('BLK', player1.stats.blocks, player2.stats.blocks)}
      {renderStatComparison('REB', player1.stats.rebounds, player2.stats.rebounds)}
      {renderStatComparison('TO', player1.stats.turnovers, player2.stats.turnovers, false)}
      {renderStatComparison(
        'Def Rtg',
        player1.stats.defensiveRating || 108.3,
        player2.stats.defensiveRating || 112.4,
        false
      )}
      {renderStatComparison('+/-', player1.stats.plusMinus, player2.stats.plusMinus)}
    </View>
  );

  const renderComparisonContent = () => {
    if (!hasAccess) {
      return renderLockedContent();
    }

    switch (activeCategory) {
      case 'offensive':
        return renderOffensiveComparison();
      case 'defensive':
        return renderDefensiveComparison();
      case 'overall':
      default:
        return renderOverallComparison();
    }
  };

  return (
    <View style={styles.container}>
      {renderComparisonHeader()}
      {renderCategoryTabs()}

      <ScrollView style={styles.scrollContainer}>{renderComparisonContent()}</ScrollView>

      {showUpgradePrompt && (
        <UpgradePrompt
          onClose={() => setShowUpgradePrompt(false)}
          gameId={gameId}
          featureType="player-comparison"
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1c1c1e',
  },
  comparisonHeader: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  playerColumn: {
    flex: 2,
    alignItems: 'center',
  },
  vsColumn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 4,
  },
  playerInfo: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
  },
  vsText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0a7ea4',
    textShadowColor: '#0a7ea4',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  categoryTabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  categoryTab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeCategoryTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#0a7ea4',
  },
  categoryTabText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  activeCategoryTabText: {
    color: '#0a7ea4',
    fontWeight: 'bold',
  },
  scrollContainer: {
    flex: 1,
  },
  comparisonContent: {
    padding: 16,
  },
  advantageContainer: {
    padding: 16,
    backgroundColor: 'rgba(10, 126, 164, 0.1)',
    borderRadius: 8,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: '#0a7ea4',
  },
  advantageTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  advantageText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 20,
  },
  statComparisonRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  statComparisonCell: {
    flex: 2,
    alignItems: 'center',
  },
  statComparisonLabelCell: {
    flex: 1,
    alignItems: 'center',
  },
  statComparisonLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  statComparisonValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  betterValue: {
    color: '#34C759',
    textShadowColor: 'rgba(52, 199, 89, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 4,
  },
  lockedContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  lockedText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  unlockButton: {
    backgroundColor: '#0a7ea4',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 24,
    shadowColor: '#0a7ea4',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 5,
  },
  unlockButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default PlayerComparisonView;
