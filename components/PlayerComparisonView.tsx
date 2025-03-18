import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { ThemedText } from './ThemedText';
import { useThemeColor } from '../hooks/useThemeColor';
import { useColorScheme } from '../hooks/useColorScheme';
import { PlayerComparisonData } from '../services/playerStatsService';
import { Ionicons } from '@expo/vector-icons';

interface PlayerComparisonViewProps {
  comparisonData: PlayerComparisonData;
}

/**
 * Component to display side-by-side comparison of two players' advanced metrics
 */
const PlayerComparisonView: React.FC<PlayerComparisonViewProps> = ({ 
  comparisonData
}) => {
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  
  // Get the current color scheme
  const colorScheme = useColorScheme() ?? 'light';
  
  // Define colors based on the color scheme
  const borderColor = colorScheme === 'light' ? '#e1e1e1' : '#38383A';
  const positiveColor = colorScheme === 'light' ? '#34C759' : '#30D158';
  const negativeColor = colorScheme === 'light' ? '#FF3B30' : '#FF453A';
  
  // Format percentage values
  const formatPercentage = (value?: number): string => {
    if (value === undefined) return 'N/A';
    return `${(value * 100).toFixed(1)}%`;
  };
  
  // Format rating values
  const formatRating = (value?: number): string => {
    if (value === undefined) return 'N/A';
    return value.toFixed(1);
  };
  
  // Determine which player has better value for a metric
  const getBetterPlayerIndex = (
    metric: keyof typeof comparisonData.player1,
    higherIsBetter: boolean = true
  ): number | null => {
    const value1 = comparisonData.player1[metric];
    const value2 = comparisonData.player2[metric];
    
    if (value1 === undefined || value2 === undefined) return null;
    
    if (typeof value1 === 'number' && typeof value2 === 'number') {
      if (value1 === value2) return null;
      return higherIsBetter ? (value1 > value2 ? 0 : 1) : (value1 < value2 ? 0 : 1);
    }
    
    return null;
  };
  
  // Get color for metric value based on comparison
  const getMetricColor = (
    metric: keyof typeof comparisonData.player1,
    playerIndex: number,
    higherIsBetter: boolean = true
  ): string => {
    const betterPlayerIndex = getBetterPlayerIndex(metric, higherIsBetter);
    
    if (betterPlayerIndex === null) return textColor;
    return betterPlayerIndex === playerIndex ? positiveColor : negativeColor;
  };
  
  // Render a comparison row for a specific metric
  const renderComparisonRow = (
    label: string,
    metric: keyof typeof comparisonData.player1,
    formatter: (value?: number) => string,
    higherIsBetter: boolean = true
  ) => {
    const value1 = comparisonData.player1[metric] as number | undefined;
    const value2 = comparisonData.player2[metric] as number | undefined;
    
    return (
      <View style={styles.comparisonRow}>
        <ThemedText 
          style={[
            styles.metricValue, 
            { 
              color: getMetricColor(metric, 0, higherIsBetter),
              textAlign: 'right'
            }
          ]}
        >
          {formatter(value1)}
        </ThemedText>
        
        <ThemedText style={styles.metricLabel}>{label}</ThemedText>
        
        <ThemedText 
          style={[
            styles.metricValue, 
            { 
              color: getMetricColor(metric, 1, higherIsBetter)
            }
          ]}
        >
          {formatter(value2)}
        </ThemedText>
      </View>
    );
  };
  
  return (
    <View style={[styles.container, { backgroundColor, borderColor }]}>
      <View style={styles.header}>
        <ThemedText style={[styles.playerName, { textAlign: 'right' }]}>
          {comparisonData.player1.playerName}
        </ThemedText>
        
        <View style={styles.vsContainer}>
          <ThemedText style={styles.vsText}>VS</ThemedText>
        </View>
        
        <ThemedText style={styles.playerName}>
          {comparisonData.player2.playerName}
        </ThemedText>
      </View>
      
      <View style={styles.teamRow}>
        <ThemedText style={[styles.teamName, { textAlign: 'right' }]}>
          {comparisonData.player1.team}
        </ThemedText>
        
        <View style={styles.spacer} />
        
        <ThemedText style={styles.teamName}>
          {comparisonData.player2.team}
        </ThemedText>
      </View>
      
      <ScrollView style={styles.scrollView}>
        {/* Offensive Metrics Section */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Offensive Metrics</ThemedText>
          
          {renderComparisonRow(
            'True Shooting %',
            'trueShootingPercentage',
            formatPercentage
          )}
          
          {renderComparisonRow(
            'Effective FG%',
            'effectiveFieldGoalPercentage',
            formatPercentage
          )}
          
          {renderComparisonRow(
            'Offensive Rating',
            'offensiveRating',
            formatRating
          )}
          
          {renderComparisonRow(
            'Assist %',
            'assistPercentage',
            (value) => formatPercentage(value ? value / 100 : undefined)
          )}
          
          {renderComparisonRow(
            'Usage Rate',
            'usageRate',
            (value) => formatPercentage(value ? value / 100 : undefined)
          )}
        </View>
        
        {/* Defensive Metrics Section */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Defensive Metrics</ThemedText>
          
          {renderComparisonRow(
            'Defensive Rating',
            'defensiveRating',
            formatRating,
            false // Lower is better for defensive rating
          )}
          
          {renderComparisonRow(
            'Steal %',
            'stealPercentage',
            (value) => formatPercentage(value ? value / 100 : undefined)
          )}
          
          {renderComparisonRow(
            'Block %',
            'blockPercentage',
            (value) => formatPercentage(value ? value / 100 : undefined)
          )}
          
          {renderComparisonRow(
            'Defensive Rebound %',
            'defensiveReboundPercentage',
            (value) => formatPercentage(value ? value / 100 : undefined)
          )}
        </View>
        
        {/* Overall Metrics Section */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Overall Impact Metrics</ThemedText>
          
          {renderComparisonRow(
            'Player Efficiency Rating',
            'playerEfficiencyRating',
            formatRating
          )}
          
          {renderComparisonRow(
            'Value Over Replacement',
            'valueOverReplacement',
            formatRating
          )}
          
          {renderComparisonRow(
            'Win Shares',
            'winShares',
            formatRating
          )}
          
          {renderComparisonRow(
            'Box Plus/Minus',
            'boxPlusMinus',
            formatRating
          )}
        </View>
        
        {/* Summary Section */}
        <View style={styles.summarySection}>
          <ThemedText style={styles.summaryTitle}>Comparison Summary</ThemedText>
          
          <View style={styles.summaryContent}>
            {/* Player 1 Strengths */}
            <View style={styles.strengthsContainer}>
              <ThemedText style={[styles.strengthsTitle, { textAlign: 'right' }]}>
                {comparisonData.player1.playerName}'s Strengths
              </ThemedText>
              
              {getBetterPlayerIndex('offensiveRating') === 0 && (
                <View style={[styles.strengthItem, { alignItems: 'flex-end' }]}>
                  <ThemedText style={styles.strengthText}>
                    Better offensive efficiency
                  </ThemedText>
                  <Ionicons name="basketball-outline" size={16} color={positiveColor} />
                </View>
              )}
              
              {getBetterPlayerIndex('defensiveRating', false) === 0 && (
                <View style={[styles.strengthItem, { alignItems: 'flex-end' }]}>
                  <ThemedText style={styles.strengthText}>
                    Superior defensive impact
                  </ThemedText>
                  <Ionicons name="shield-outline" size={16} color={positiveColor} />
                </View>
              )}
              
              {getBetterPlayerIndex('playerEfficiencyRating') === 0 && (
                <View style={[styles.strengthItem, { alignItems: 'flex-end' }]}>
                  <ThemedText style={styles.strengthText}>
                    Higher overall efficiency
                  </ThemedText>
                  <Ionicons name="trending-up-outline" size={16} color={positiveColor} />
                </View>
              )}
            </View>
            
            <View style={styles.summaryDivider} />
            
            {/* Player 2 Strengths */}
            <View style={styles.strengthsContainer}>
              <ThemedText style={styles.strengthsTitle}>
                {comparisonData.player2.playerName}'s Strengths
              </ThemedText>
              
              {getBetterPlayerIndex('offensiveRating') === 1 && (
                <View style={styles.strengthItem}>
                  <Ionicons name="basketball-outline" size={16} color={positiveColor} />
                  <ThemedText style={styles.strengthText}>
                    Better offensive efficiency
                  </ThemedText>
                </View>
              )}
              
              {getBetterPlayerIndex('defensiveRating', false) === 1 && (
                <View style={styles.strengthItem}>
                  <Ionicons name="shield-outline" size={16} color={positiveColor} />
                  <ThemedText style={styles.strengthText}>
                    Superior defensive impact
                  </ThemedText>
                </View>
              )}
              
              {getBetterPlayerIndex('playerEfficiencyRating') === 1 && (
                <View style={styles.strengthItem}>
                  <Ionicons name="trending-up-outline" size={16} color={positiveColor} />
                  <ThemedText style={styles.strengthText}>
                    Higher overall efficiency
                  </ThemedText>
                </View>
              )}
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    marginVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
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
    marginBottom: 8,
  },
  playerName: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
  },
  vsContainer: {
    width: 40,
    alignItems: 'center',
  },
  vsText: {
    fontSize: 14,
    fontWeight: 'bold',
    opacity: 0.6,
  },
  teamRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  teamName: {
    fontSize: 14,
    opacity: 0.7,
    flex: 1,
  },
  spacer: {
    width: 40,
  },
  scrollView: {
    maxHeight: 500,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#444',
    paddingBottom: 8,
    textAlign: 'center',
  },
  comparisonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  metricLabel: {
    fontSize: 14,
    textAlign: 'center',
    width: '40%',
  },
  metricValue: {
    fontSize: 15,
    fontWeight: '600',
    width: '30%',
  },
  summarySection: {
    marginBottom: 24,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  summaryContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  strengthsContainer: {
    flex: 1,
  },
  summaryDivider: {
    width: 1,
    backgroundColor: '#444',
    marginHorizontal: 8,
  },
  strengthsTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 12,
  },
  strengthItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  strengthText: {
    fontSize: 14,
    marginHorizontal: 6,
  },
});

export default PlayerComparisonView;