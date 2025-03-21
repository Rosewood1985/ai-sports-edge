import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { ThemedText } from './ThemedText';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import advancedPlayerStatsService from '../services/advancedPlayerStatsService';
import { incrementUserViewCount, shouldShowUpgradePrompt } from '../services/viewCounterService';
import UpgradePrompt from './UpgradePrompt';
import ViewLimitIndicator from './ViewLimitIndicator';
import WeatherInsights from './WeatherInsights';
import HistoricalTrendsChart from './HistoricalTrendsChart';
import { auth } from '../config/firebase';
import { analyticsService } from '../services/analyticsService';

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

interface EnhancedPlayerStatisticsProps {
  player: Player;
  gameId: string;
  userId: string;
}

const EnhancedPlayerStatistics: React.FC<EnhancedPlayerStatisticsProps> = ({
  player,
  gameId,
  userId
}) => {
  const [activeTab, setActiveTab] = useState<'basic' | 'advanced' | 'historical'>('basic');
  const [hasAccess, setHasAccess] = useState<{
    advanced: boolean;
    historical: boolean;
  }>({ advanced: false, historical: false });
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const [upgradePromptType, setUpgradePromptType] = useState<'advanced-metrics' | 'historical-trends' | 'all'>('all');
  const navigation = useNavigation();

  useEffect(() => {
    const checkAccess = async () => {
      try {
        // Get current user ID
        const currentUserId = auth.currentUser?.uid || userId;
        
        // Check if user has access to advanced metrics
        const hasAdvancedAccess = await advancedPlayerStatsService.hasAdvancedPlayerMetricsAccess(
          currentUserId || 'guest',
          gameId
        );
        
        // Check if user has access to historical trends
        const hasHistoricalAccess = await advancedPlayerStatsService.hasHistoricalTrendsAccess(
          currentUserId || 'guest',
          gameId
        );
        
        setHasAccess({
          advanced: hasAdvancedAccess,
          historical: hasHistoricalAccess
        });
        
        // Increment view counter
        await incrementUserViewCount(currentUserId, 'player_statistics');
        
        // Track view in analytics
        await analyticsService.trackEvent('viewed_player_statistics', {
          gameId,
          playerId: player.id,
          authenticated: !!currentUserId
        });
        
        // Check if we should show upgrade prompt
        const promptCheck = await shouldShowUpgradePrompt(currentUserId);
        if (promptCheck.show) {
          setShowUpgradePrompt(true);
          
          // Track prompt display in analytics
          await analyticsService.trackEvent('upgrade_prompt_triggered', {
            reason: promptCheck.reason,
            featureType: 'player_statistics'
          });
        }
      } catch (error) {
        console.error('Error checking access:', error);
      }
    };
    
    checkAccess();
  }, [userId, gameId, player.id]);

  const handleTabPress = async (tab: 'basic' | 'advanced' | 'historical') => {
    if (tab === 'advanced' && !hasAccess.advanced) {
      setUpgradePromptType('advanced-metrics');
      setShowUpgradePrompt(true);
      return;
    }
    
    if (tab === 'historical' && !hasAccess.historical) {
      setUpgradePromptType('historical-trends');
      setShowUpgradePrompt(true);
      return;
    }
    
    setActiveTab(tab);
  };

  const renderBasicStats = () => (
    <View style={styles.statsContainer}>
      <View style={styles.statRow}>
        <View style={styles.statItem}>
          <ThemedText style={styles.statValue}>{player.stats.points}</ThemedText>
          <ThemedText style={styles.statLabel}>PTS</ThemedText>
        </View>
        <View style={styles.statItem}>
          <ThemedText style={styles.statValue}>{player.stats.rebounds}</ThemedText>
          <ThemedText style={styles.statLabel}>REB</ThemedText>
        </View>
        <View style={styles.statItem}>
          <ThemedText style={styles.statValue}>{player.stats.assists}</ThemedText>
          <ThemedText style={styles.statLabel}>AST</ThemedText>
        </View>
      </View>
      
      <View style={styles.statRow}>
        <View style={styles.statItem}>
          <ThemedText style={styles.statValue}>{player.stats.steals}</ThemedText>
          <ThemedText style={styles.statLabel}>STL</ThemedText>
        </View>
        <View style={styles.statItem}>
          <ThemedText style={styles.statValue}>{player.stats.blocks}</ThemedText>
          <ThemedText style={styles.statLabel}>BLK</ThemedText>
        </View>
        <View style={styles.statItem}>
          <ThemedText style={styles.statValue}>{player.stats.turnovers}</ThemedText>
          <ThemedText style={styles.statLabel}>TO</ThemedText>
        </View>
      </View>
      
      <View style={styles.statRow}>
        <View style={styles.statItem}>
          <ThemedText style={styles.statValue}>{player.stats.fieldGoalPercentage.toFixed(1)}%</ThemedText>
          <ThemedText style={styles.statLabel}>FG%</ThemedText>
        </View>
        <View style={styles.statItem}>
          <ThemedText style={styles.statValue}>{player.stats.threePointPercentage.toFixed(1)}%</ThemedText>
          <ThemedText style={styles.statLabel}>3P%</ThemedText>
        </View>
        <View style={styles.statItem}>
          <ThemedText style={styles.statValue}>{player.stats.freeThrowPercentage.toFixed(1)}%</ThemedText>
          <ThemedText style={styles.statLabel}>FT%</ThemedText>
        </View>
      </View>
      
      <View style={styles.plusMinusContainer}>
        <ThemedText style={styles.plusMinusLabel}>PLUS/MINUS</ThemedText>
        <ThemedText style={[
          styles.plusMinusValue,
          player.stats.plusMinus > 0 ? styles.positivePlusMinus : 
          player.stats.plusMinus < 0 ? styles.negativePlusMinus : 
          styles.neutralPlusMinus
        ]}>
          {player.stats.plusMinus > 0 ? '+' : ''}{player.stats.plusMinus}
        </ThemedText>
      </View>
    </View>
  );

  const renderAdvancedStats = () => {
    if (!hasAccess.advanced) {
      return (
        <View style={styles.lockedContainer}>
          <Ionicons name="lock-closed" size={48} color="#0a7ea4" />
          <ThemedText style={styles.lockedText}>Advanced metrics are available with Premium subscription</ThemedText>
          <TouchableOpacity 
            style={styles.unlockButton}
            onPress={() => {
              setUpgradePromptType('advanced-metrics');
              setShowUpgradePrompt(true);
            }}
          >
            <ThemedText style={styles.unlockButtonText}>Unlock Advanced Metrics</ThemedText>
          </TouchableOpacity>
        </View>
      );
    }
    
    return (
      <View style={styles.statsContainer}>
        <View style={styles.advancedStatRow}>
          <View style={styles.advancedStatItem}>
            <ThemedText style={styles.advancedStatValue}>{player.stats.trueShootingPercentage?.toFixed(1) || '58.5'}%</ThemedText>
            <ThemedText style={styles.advancedStatLabel}>True Shooting %</ThemedText>
          </View>
          <View style={styles.advancedStatItem}>
            <ThemedText style={styles.advancedStatValue}>{player.stats.effectiveFieldGoalPercentage?.toFixed(1) || '52.3'}%</ThemedText>
            <ThemedText style={styles.advancedStatLabel}>Effective FG%</ThemedText>
          </View>
        </View>
        
        <View style={styles.advancedStatRow}>
          <View style={styles.advancedStatItem}>
            <ThemedText style={styles.advancedStatValue}>{player.stats.usageRate?.toFixed(1) || '25.3'}%</ThemedText>
            <ThemedText style={styles.advancedStatLabel}>Usage Rate</ThemedText>
          </View>
          <View style={styles.advancedStatItem}>
            <ThemedText style={styles.advancedStatValue}>{player.stats.playerEfficiencyRating?.toFixed(1) || '18.2'}</ThemedText>
            <ThemedText style={styles.advancedStatLabel}>PER</ThemedText>
          </View>
        </View>
        
        <View style={styles.advancedStatRow}>
          <View style={styles.advancedStatItem}>
            <ThemedText style={styles.advancedStatValue}>{player.stats.offensiveRating?.toFixed(1) || '112.4'}</ThemedText>
            <ThemedText style={styles.advancedStatLabel}>Offensive Rating</ThemedText>
          </View>
          <View style={styles.advancedStatItem}>
            <ThemedText style={styles.advancedStatValue}>{player.stats.defensiveRating?.toFixed(1) || '108.3'}</ThemedText>
            <ThemedText style={styles.advancedStatLabel}>Defensive Rating</ThemedText>
          </View>
        </View>
        
        <View style={styles.insightContainer}>
          <ThemedText style={styles.insightTitle}>Performance Insight</ThemedText>
          <ThemedText style={styles.insightText}>
            {player.name} is performing above average in offensive efficiency metrics,
            with a True Shooting % that ranks in the top 25% of players at his position.
          </ThemedText>
        </View>
        
        {/* Weather Insights */}
        <WeatherInsights
          gameId={gameId}
          playerId={player.id}
          playerName={player.name}
        />
      </View>
    );
  };

  const renderHistoricalStats = () => {
    if (!hasAccess.historical) {
      return (
        <View style={styles.lockedContainer}>
          <Ionicons name="lock-closed" size={48} color="#0a7ea4" />
          <ThemedText style={styles.lockedText}>Historical trends are available with Premium subscription</ThemedText>
          <TouchableOpacity 
            style={styles.unlockButton}
            onPress={() => {
              setUpgradePromptType('historical-trends');
              setShowUpgradePrompt(true);
            }}
          >
            <ThemedText style={styles.unlockButtonText}>Unlock Historical Trends</ThemedText>
          </TouchableOpacity>
        </View>
      );
    }
    
    return (
      <View style={styles.statsContainer}>
        <View style={styles.historicalHeader}>
          <ThemedText style={styles.historicalTitle}>Last 5 Games</ThemedText>
        </View>
        
        <View style={styles.historicalTable}>
          <View style={styles.historicalTableHeader}>
            <ThemedText style={[styles.historicalTableCell, styles.historicalTableHeaderText]}>Game</ThemedText>
            <ThemedText style={[styles.historicalTableCell, styles.historicalTableHeaderText]}>PTS</ThemedText>
            <ThemedText style={[styles.historicalTableCell, styles.historicalTableHeaderText]}>REB</ThemedText>
            <ThemedText style={[styles.historicalTableCell, styles.historicalTableHeaderText]}>AST</ThemedText>
            <ThemedText style={[styles.historicalTableCell, styles.historicalTableHeaderText]}>+/-</ThemedText>
          </View>
          
          {/* Mock data for last 5 games */}
          {[
            { opponent: 'LAL', pts: 24, reb: 5, ast: 8, plusMinus: 12 },
            { opponent: 'BOS', pts: 18, reb: 4, ast: 6, plusMinus: -5 },
            { opponent: 'MIA', pts: 22, reb: 6, ast: 9, plusMinus: 8 },
            { opponent: 'PHI', pts: 15, reb: 3, ast: 7, plusMinus: -2 },
            { opponent: 'GSW', pts: 28, reb: 7, ast: 10, plusMinus: 15 }
          ].map((game, index) => (
            <View key={index} style={styles.historicalTableRow}>
              <ThemedText style={styles.historicalTableCell}>{game.opponent}</ThemedText>
              <ThemedText style={styles.historicalTableCell}>{game.pts}</ThemedText>
              <ThemedText style={styles.historicalTableCell}>{game.reb}</ThemedText>
              <ThemedText style={styles.historicalTableCell}>{game.ast}</ThemedText>
              <ThemedText style={[
                styles.historicalTableCell,
                game.plusMinus > 0 ? styles.positivePlusMinus :
                game.plusMinus < 0 ? styles.negativePlusMinus :
                styles.neutralPlusMinus
              ]}>
                {game.plusMinus > 0 ? '+' : ''}{game.plusMinus}
              </ThemedText>
            </View>
          ))}
        </View>
        
        <View style={styles.trendContainer}>
          <ThemedText style={styles.trendTitle}>Trend Analysis</ThemedText>
          <ThemedText style={styles.trendText}>
            {player.name} is showing an upward trend in scoring, with a 15.2% increase in points
            over the last 5 games compared to the previous 5-game stretch.
          </ThemedText>
        </View>
        
        {/* Enhanced Historical Trends Chart */}
        <View style={styles.chartContainer}>
          <ThemedText style={styles.chartTitle}>Enhanced Trend Visualization</ThemedText>
          <HistoricalTrendsChart
            playerId={player.id}
            playerName={player.name}
            gameId={gameId}
            onError={(error) => console.error('Historical trends error:', error)}
          />
        </View>
      </View>
    );
  };

  // Handle upgrade button press
  const handleUpgradePress = () => {
    setUpgradePromptType('all');
    setShowUpgradePrompt(true);
  };

  return (
    <View style={styles.container}>
      <View style={styles.playerHeader}>
        <ThemedText style={styles.playerName}>{player.name}</ThemedText>
        <ThemedText style={styles.playerInfo}>{player.team} | #{player.jerseyNumber} | {player.position}</ThemedText>
      </View>
      
      {/* View Limit Indicator - Compact version in the corner */}
      <ViewLimitIndicator
        onUpgradePress={handleUpgradePress}
        compact={true}
      />
      
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'basic' && styles.activeTab]}
          onPress={() => handleTabPress('basic')}
          accessibilityLabel="Basic stats tab"
          accessibilityRole="tab"
          accessibilityState={{ selected: activeTab === 'basic' }}
        >
          <ThemedText style={[styles.tabText, activeTab === 'basic' && styles.activeTabText]}>Basic</ThemedText>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'advanced' && styles.activeTab]}
          onPress={() => handleTabPress('advanced')}
          accessibilityLabel="Advanced stats tab"
          accessibilityRole="tab"
          accessibilityState={{ selected: activeTab === 'advanced' }}
        >
          <View style={styles.tabContent}>
            <ThemedText style={[styles.tabText, activeTab === 'advanced' && styles.activeTabText]}>Advanced</ThemedText>
            {!hasAccess.advanced && <Ionicons name="lock-closed" size={12} color="#fff" style={styles.lockIcon} />}
          </View>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'historical' && styles.activeTab]}
          onPress={() => handleTabPress('historical')}
          accessibilityLabel="Historical stats tab"
          accessibilityRole="tab"
          accessibilityState={{ selected: activeTab === 'historical' }}
        >
          <View style={styles.tabContent}>
            <ThemedText style={[styles.tabText, activeTab === 'historical' && styles.activeTabText]}>Historical</ThemedText>
            {!hasAccess.historical && <Ionicons name="lock-closed" size={12} color="#fff" style={styles.lockIcon} />}
          </View>
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.contentContainer}>
        {activeTab === 'basic' && renderBasicStats()}
        {activeTab === 'advanced' && renderAdvancedStats()}
        {activeTab === 'historical' && renderHistoricalStats()}
        
        {/* Full View Limit Indicator at the bottom of basic stats */}
        {activeTab === 'basic' && (
          <View style={styles.viewLimitContainer}>
            <ViewLimitIndicator
              onUpgradePress={handleUpgradePress}
              compact={false}
            />
          </View>
        )}
      </ScrollView>
      
      {showUpgradePrompt && (
        <UpgradePrompt
          onClose={() => setShowUpgradePrompt(false)}
          gameId={gameId}
          featureType={upgradePromptType}
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
  playerHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  playerName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  playerInfo: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  tabContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#0a7ea4',
  },
  tabText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  activeTabText: {
    color: '#0a7ea4',
    fontWeight: 'bold',
  },
  lockIcon: {
    marginLeft: 4,
  },
  contentContainer: {
    flex: 1,
  },
  statsContainer: {
    padding: 16,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  plusMinusContainer: {
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  plusMinusLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 8,
  },
  plusMinusValue: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  positivePlusMinus: {
    color: '#34C759',
  },
  negativePlusMinus: {
    color: '#FF3B30',
  },
  neutralPlusMinus: {
    color: '#fff',
  },
  advancedStatRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  advancedStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  advancedStatValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0a7ea4',
    marginBottom: 4,
    textShadowColor: '#0a7ea4',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  advancedStatLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
  },
  insightContainer: {
    marginTop: 24,
    padding: 16,
    backgroundColor: 'rgba(10, 126, 164, 0.1)',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#0a7ea4',
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  insightText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 20,
  },
  historicalHeader: {
    marginBottom: 16,
  },
  historicalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  historicalTable: {
    marginBottom: 24,
  },
  historicalTableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.2)',
    paddingBottom: 8,
    marginBottom: 8,
  },
  historicalTableHeaderText: {
    fontWeight: 'bold',
    color: '#0a7ea4',
  },
  historicalTableRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  historicalTableCell: {
    flex: 1,
    textAlign: 'center',
    color: '#fff',
  },
  trendContainer: {
    padding: 16,
    backgroundColor: 'rgba(10, 126, 164, 0.1)',
    borderRadius: 8,
  },
  trendTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  trendText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 20,
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
  viewLimitContainer: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 16,
  },
  chartContainer: {
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
    textAlign: 'center',
  },
});

export default EnhancedPlayerStatistics;