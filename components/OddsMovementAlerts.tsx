import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { oddsHistoryService, OddsMovementAlert } from '../services/oddsHistoryService';

interface OddsMovementAlertsProps {
  onClose: () => void;
}

/**
 * OddsMovementAlerts component displays alerts for significant odds movements
 */
const OddsMovementAlerts: React.FC<OddsMovementAlertsProps> = ({ onClose }) => {
  const [alerts, setAlerts] = useState<OddsMovementAlert[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const { colors, isDark } = useTheme();

  useEffect(() => {
    const loadAlerts = async () => {
      try {
        setLoading(true);
        const movementAlerts = await oddsHistoryService.getMovementAlerts();
        
        // Sort alerts by timestamp (newest first)
        movementAlerts.sort((a, b) => b.timestamp - a.timestamp);
        
        setAlerts(movementAlerts);
      } catch (error) {
        console.error('Error loading movement alerts:', error);
      } finally {
        setLoading(false);
      }
    };

    loadAlerts();
  }, []);

  const handleMarkAsRead = async (alertId: string) => {
    await oddsHistoryService.markAlertAsRead(alertId);
    
    // Update local state
    setAlerts(prevAlerts => 
      prevAlerts.map(alert => 
        alert.id === alertId ? { ...alert, read: true } : alert
      )
    );
  };

  const formatOdds = (odds: number): string => {
    return odds > 0 ? `+${odds}` : `${odds}`;
  };

  const formatTimestamp = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const renderAlertItem = ({ item }: { item: OddsMovementAlert }) => {
    const isPositiveChange = item.currentOdds > item.previousOdds;
    const changeColor = isPositiveChange ? '#4CAF50' : '#F44336';
    
    return (
      <TouchableOpacity
        style={[
          styles.alertItem,
          { backgroundColor: isDark ? '#2a2a2a' : '#f5f5f5' },
          !item.read && styles.unreadAlert
        ]}
        onPress={() => handleMarkAsRead(item.id)}
      >
        <View style={styles.alertHeader}>
          <Text style={[styles.bookmakerName, { color: colors.text }]}>
            {item.bookmaker}
          </Text>
          <Text style={[styles.timestamp, { color: colors.text }]}>
            {formatTimestamp(item.timestamp)}
          </Text>
        </View>
        
        <Text style={[styles.gameTitle, { color: colors.text }]}>
          {item.homeTeam} vs {item.awayTeam}
        </Text>
        
        <View style={styles.oddsChangeContainer}>
          <Text style={[styles.previousOdds, { color: colors.text }]}>
            {formatOdds(item.previousOdds)}
          </Text>
          <Ionicons
            name={isPositiveChange ? 'arrow-up' : 'arrow-down'}
            size={16}
            color={changeColor}
            style={styles.arrow}
          />
          <Text style={[styles.currentOdds, { color: colors.text }]}>
            {formatOdds(item.currentOdds)}
          </Text>
          <Text style={[styles.percentageChange, { color: changeColor }]}>
            ({isPositiveChange ? '+' : ''}{item.percentageChange.toFixed(1)}%)
          </Text>
        </View>
        
        {!item.read && (
          <View style={styles.unreadIndicator} />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#1a1a1a' : '#ffffff' }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Odds Movement Alerts</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Ionicons name="close" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: colors.text }]}>Loading alerts...</Text>
        </View>
      ) : alerts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="notifications-outline" size={48} color={colors.text} />
          <Text style={[styles.emptyText, { color: colors.text }]}>
            No odds movement alerts yet
          </Text>
          <Text style={[styles.emptySubtext, { color: colors.text }]}>
            You'll be notified when odds change significantly
          </Text>
        </View>
      ) : (
        <FlatList
          data={alerts}
          renderItem={renderAlertItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
  },
  listContent: {
    padding: 12,
  },
  alertItem: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#007BFF',
  },
  unreadAlert: {
    borderLeftColor: '#FF6347',
  },
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  bookmakerName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  timestamp: {
    fontSize: 12,
  },
  gameTitle: {
    fontSize: 14,
    marginBottom: 8,
  },
  oddsChangeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  previousOdds: {
    fontSize: 16,
    textDecorationLine: 'line-through',
    opacity: 0.7,
  },
  arrow: {
    marginHorizontal: 8,
  },
  currentOdds: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  percentageChange: {
    fontSize: 14,
    marginLeft: 8,
    fontWeight: 'bold',
  },
  unreadIndicator: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF6347',
  },
});

export default OddsMovementAlerts;