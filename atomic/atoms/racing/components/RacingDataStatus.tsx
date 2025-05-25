/**
 * Racing Data Status Component
 * Displays the status of racing data sources
 * Part of Phase 1: Racing Data Integration Plan
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ThemedText } from '../../../../components/ThemedText';
import { ThemedView } from '../../../../components/ThemedView';

export interface RacingDataStatusProps {
  sport: 'nascar' | 'horse_racing';
  status: 'connected' | 'disconnected' | 'error' | 'loading';
  lastUpdate?: string;
  source?: string;
  recordCount?: number;
}

export const RacingDataStatus: React.FC<RacingDataStatusProps> = ({
  sport,
  status,
  lastUpdate,
  source,
  recordCount
}) => {
  const getStatusColor = () => {
    switch (status) {
      case 'connected': return '#4CAF50';
      case 'disconnected': return '#FF9800';
      case 'error': return '#F44336';
      case 'loading': return '#2196F3';
      default: return '#757575';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'connected': return 'Connected';
      case 'disconnected': return 'Disconnected';
      case 'error': return 'Error';
      case 'loading': return 'Loading...';
      default: return 'Unknown';
    }
  };

  const formatSportName = (sport: string) => {
    return sport === 'nascar' ? 'NASCAR' : 'Horse Racing';
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText style={styles.sportName}>
          {formatSportName(sport)}
        </ThemedText>
        <View style={[styles.statusIndicator, { backgroundColor: getStatusColor() }]} />
        <ThemedText style={[styles.statusText, { color: getStatusColor() }]}>
          {getStatusText()}
        </ThemedText>
      </View>
      
      <View style={styles.details}>
        {source && (
          <ThemedText style={styles.detailText}>
            Source: {source}
          </ThemedText>
        )}
        
        {recordCount !== undefined && (
          <ThemedText style={styles.detailText}>
            Records: {recordCount.toLocaleString()}
          </ThemedText>
        )}
        
        {lastUpdate && (
          <ThemedText style={styles.detailText}>
            Last Updated: {new Date(lastUpdate).toLocaleString()}
          </ThemedText>
        )}
      </View>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginVertical: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  sportName: {
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  details: {
    gap: 2,
  },
  detailText: {
    fontSize: 12,
    opacity: 0.7,
  },
});

export default RacingDataStatus;