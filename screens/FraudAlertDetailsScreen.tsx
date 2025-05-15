import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '../components/ThemedText';
import { ThemedView } from '../components/ThemedView';
import { fraudDetectionService } from '../services/fraudDetectionService';
import {
  FraudAlert,
  AlertSeverity,
  AlertStatus,
  FraudPatternType,
  AccountAction
} from '../types/fraudDetection';
import { useTheme } from '../contexts/ThemeContext';

// Define the navigation param list
type RootStackParamList = {
  FraudDetectionDashboard: undefined;
  FraudAlertDetails: { alertId: string };
};

// Define the navigation and route prop types
type FraudAlertDetailsScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'FraudAlertDetails'
>;
type FraudAlertDetailsScreenRouteProp = RouteProp<
  RootStackParamList,
  'FraudAlertDetails'
>;

/**
 * FraudAlertDetailsScreen component
 * 
 * This screen displays detailed information about a fraud alert and allows admins to take actions.
 */
const FraudAlertDetailsScreen: React.FC = () => {
  const navigation = useNavigation<FraudAlertDetailsScreenNavigationProp>();
  const route = useRoute<FraudAlertDetailsScreenRouteProp>();
  const { isDark, colors } = useTheme();
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState<FraudAlert | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [notesText, setNotesText] = useState('');

  // Colors for the screen
  const backgroundColor = colors.background;
  const cardBackgroundColor = isDark ? '#1E1E1E' : '#FFFFFF';
  const cardBorderColor = isDark ? '#333333' : '#E0E0E0';
  const textColor = colors.text;
  const primaryColor = colors.primary;
  
  // Severity colors
  const severityColors = {
    [AlertSeverity.LOW]: '#4CAF50',
    [AlertSeverity.MEDIUM]: '#FFC107',
    [AlertSeverity.HIGH]: '#FF9800',
    [AlertSeverity.CRITICAL]: '#F44336'
  };

  // Load alert data
  useEffect(() => {
    const loadAlertData = async () => {
      try {
        setLoading(true);
        const alertData = await fraudDetectionService.getAlertById(route.params.alertId);
        
        if (!alertData) {
          Alert.alert('Error', 'Alert not found');
          navigation.goBack();
          return;
        }
        
        setAlert(alertData);
      } catch (error) {
        console.error('Error loading alert data:', error);
        Alert.alert('Error', 'Failed to load alert data. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    loadAlertData();
  }, [route.params.alertId]);

  // Format timestamp
  const formatTimestamp = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  // Update alert status
  const updateAlertStatus = async (status: AlertStatus) => {
    if (!alert) return;
    
    try {
      setActionLoading(true);
      
      await fraudDetectionService.updateAlertStatus(
        alert.id,
        status,
        'admin123', // TODO: Replace with actual admin ID
        'Admin User', // TODO: Replace with actual admin name
        notesText
      );
      
      // Reload alert data
      const updatedAlert = await fraudDetectionService.getAlertById(alert.id);
      if (updatedAlert) {
        setAlert(updatedAlert);
      }
      
      Alert.alert('Success', `Alert status updated to ${status.replace(/_/g, ' ')}`);
    } catch (error) {
      console.error('Error updating alert status:', error);
      Alert.alert('Error', 'Failed to update alert status. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  // Take action on user account
  const takeAction = async (action: AccountAction) => {
    if (!alert) return;
    
    try {
      setActionLoading(true);
      
      await fraudDetectionService.takeAction(
        alert.id,
        action,
        'admin123', // TODO: Replace with actual admin ID
        'Admin User', // TODO: Replace with actual admin name
        notesText
      );
      
      // Reload alert data
      const updatedAlert = await fraudDetectionService.getAlertById(alert.id);
      if (updatedAlert) {
        setAlert(updatedAlert);
      }
      
      Alert.alert('Success', `Action ${action.replace(/_/g, ' ')} taken on user account`);
    } catch (error) {
      console.error('Error taking action:', error);
      Alert.alert('Error', 'Failed to take action on user account. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  // Render loading state
  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={primaryColor} />
          <ThemedText style={styles.loadingText}>Loading alert details...</ThemedText>
        </View>
      </SafeAreaView>
    );
  }

  // Render alert not found
  if (!alert) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor }]}>
        <View style={styles.loadingContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={textColor} />
          <ThemedText style={styles.loadingText}>Alert not found</ThemedText>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: primaryColor }]}
            onPress={() => navigation.goBack()}
          >
            <ThemedText style={styles.buttonText}>Go Back</ThemedText>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Alert header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View
              style={[
                styles.severityBadge,
                { backgroundColor: severityColors[alert.severity] }
              ]}
            >
              <ThemedText style={styles.severityText}>
                {alert.severity.toUpperCase()}
              </ThemedText>
            </View>
            <ThemedText style={styles.title}>
              {alert.patternType.replace(/_/g, ' ')}
            </ThemedText>
          </View>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={textColor} />
          </TouchableOpacity>
        </View>

        {/* Alert details */}
        <ThemedView
          style={[
            styles.card,
            {
              backgroundColor: cardBackgroundColor,
              borderColor: cardBorderColor
            }
          ]}
        >
          <View style={styles.detailRow}>
            <ThemedText style={styles.detailLabel}>Status:</ThemedText>
            <View style={styles.statusContainer}>
              <View
                style={[
                  styles.statusDot,
                  {
                    backgroundColor:
                      alert.status === AlertStatus.NEW
                        ? '#2196F3'
                        : alert.status === AlertStatus.INVESTIGATING
                        ? '#FFC107'
                        : alert.status === AlertStatus.RESOLVED
                        ? '#4CAF50'
                        : alert.status === AlertStatus.CONFIRMED
                        ? '#9C27B0'
                        : '#757575'
                  }
                ]}
              />
              <ThemedText style={styles.statusText}>
                {alert.status.replace(/_/g, ' ')}
              </ThemedText>
            </View>
          </View>

          <View style={styles.detailRow}>
            <ThemedText style={styles.detailLabel}>User:</ThemedText>
            <ThemedText style={styles.detailValue}>
              {alert.username || alert.userId}
            </ThemedText>
          </View>

          <View style={styles.detailRow}>
            <ThemedText style={styles.detailLabel}>Detected:</ThemedText>
            <ThemedText style={styles.detailValue}>
              {formatTimestamp(alert.timestamp)}
            </ThemedText>
          </View>

          <View style={styles.detailRow}>
            <ThemedText style={styles.detailLabel}>Description:</ThemedText>
            <ThemedText style={styles.detailValue}>{alert.description}</ThemedText>
          </View>

          {alert.resolution && (
            <>
              <View style={styles.divider} />
              <ThemedText style={styles.sectionTitle}>Resolution</ThemedText>

              <View style={styles.detailRow}>
                <ThemedText style={styles.detailLabel}>Resolved By:</ThemedText>
                <ThemedText style={styles.detailValue}>
                  {alert.resolution.adminName}
                </ThemedText>
              </View>

              <View style={styles.detailRow}>
                <ThemedText style={styles.detailLabel}>Resolved On:</ThemedText>
                <ThemedText style={styles.detailValue}>
                  {formatTimestamp(alert.resolution.timestamp)}
                </ThemedText>
              </View>

              <View style={styles.detailRow}>
                <ThemedText style={styles.detailLabel}>Status:</ThemedText>
                <ThemedText style={styles.detailValue}>
                  {alert.resolution.status.replace(/_/g, ' ')}
                </ThemedText>
              </View>

              {alert.resolution.actionTaken && (
                <View style={styles.detailRow}>
                  <ThemedText style={styles.detailLabel}>Action Taken:</ThemedText>
                  <ThemedText style={styles.detailValue}>
                    {alert.resolution.actionTaken.replace(/_/g, ' ')}
                  </ThemedText>
                </View>
              )}

              {alert.resolution.notes && (
                <View style={styles.detailRow}>
                  <ThemedText style={styles.detailLabel}>Notes:</ThemedText>
                  <ThemedText style={styles.detailValue}>
                    {alert.resolution.notes}
                  </ThemedText>
                </View>
              )}
            </>
          )}

          {alert.actions.length > 0 && (
            <>
              <View style={styles.divider} />
              <ThemedText style={styles.sectionTitle}>Actions Taken</ThemedText>

              {alert.actions.map((action, index) => (
                <View key={action.id || index} style={styles.actionItem}>
                  <View style={styles.actionHeader}>
                    <ThemedText style={styles.actionTitle}>
                      {action.action.replace(/_/g, ' ')}
                    </ThemedText>
                    <ThemedText style={styles.actionTimestamp}>
                      {formatTimestamp(action.timestamp)}
                    </ThemedText>
                  </View>
                  <ThemedText style={styles.actionAdmin}>
                    By: {action.adminName}
                  </ThemedText>
                  {action.notes && (
                    <ThemedText style={styles.actionNotes}>{action.notes}</ThemedText>
                  )}
                </View>
              ))}
            </>
          )}
        </ThemedView>

        {/* Action buttons */}
        {!alert.resolution && (
          <ThemedView
            style={[
              styles.card,
              {
                backgroundColor: cardBackgroundColor,
                borderColor: cardBorderColor
              }
            ]}
          >
            <ThemedText style={styles.sectionTitle}>Take Action</ThemedText>

            <View style={styles.actionButtonsContainer}>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: '#2196F3' }]}
                onPress={() => updateAlertStatus(AlertStatus.INVESTIGATING)}
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <ThemedText style={styles.actionButtonText}>Investigate</ThemedText>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: '#4CAF50' }]}
                onPress={() => updateAlertStatus(AlertStatus.RESOLVED)}
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <ThemedText style={styles.actionButtonText}>Resolve</ThemedText>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: '#9C27B0' }]}
                onPress={() => updateAlertStatus(AlertStatus.CONFIRMED)}
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <ThemedText style={styles.actionButtonText}>Confirm Fraud</ThemedText>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: '#757575' }]}
                onPress={() => updateAlertStatus(AlertStatus.FALSE_POSITIVE)}
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <ThemedText style={styles.actionButtonText}>False Positive</ThemedText>
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.divider} />
            <ThemedText style={styles.sectionTitle}>Account Actions</ThemedText>

            <View style={styles.actionButtonsContainer}>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: '#03A9F4' }]}
                onPress={() => takeAction(AccountAction.MONITOR)}
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <ThemedText style={styles.actionButtonText}>Monitor</ThemedText>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: '#FF9800' }]}
                onPress={() => takeAction(AccountAction.RESTRICT)}
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <ThemedText style={styles.actionButtonText}>Restrict</ThemedText>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: '#F44336' }]}
                onPress={() => takeAction(AccountAction.SUSPEND)}
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <ThemedText style={styles.actionButtonText}>Suspend</ThemedText>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: '#D32F2F' }]}
                onPress={() => takeAction(AccountAction.BAN)}
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <ThemedText style={styles.actionButtonText}>Ban</ThemedText>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: '#4CAF50' }]}
                onPress={() => takeAction(AccountAction.CLEAR)}
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <ThemedText style={styles.actionButtonText}>Clear</ThemedText>
                )}
              </TouchableOpacity>
            </View>
          </ThemedView>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
  },
  scrollContent: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginRight: 8,
  },
  severityText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    textTransform: 'capitalize',
  },
  backButton: {
    padding: 8,
  },
  card: {
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  detailRow: {
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  statusText: {
    fontSize: 16,
    textTransform: 'capitalize',
  },
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  actionItem: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 8,
  },
  actionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    textTransform: 'capitalize',
  },
  actionTimestamp: {
    fontSize: 12,
    opacity: 0.7,
  },
  actionAdmin: {
    fontSize: 14,
    marginBottom: 4,
  },
  actionNotes: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  actionButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    marginRight: 8,
    marginBottom: 8,
    minWidth: 100,
    alignItems: 'center',
  },
  actionButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  button: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 16,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default FraudAlertDetailsScreen;