import React, { useState, useEffect } from 'react';
import { View, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Modal, Alert } from 'react-native';
import { ThemedText } from '../components/ThemedText';
import PlayerPlusMinusList from '../components/PlayerPlusMinusList';
import { PlayerPlusMinus } from '../services/playerStatsService';
import { useThemeColor } from '../hooks/useThemeColor';
import { useColorScheme } from '../hooks/useColorScheme';
import { StackScreenProps } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { auth } from '../config/firebase';
import subscriptionService from '../services/subscriptionService';

// Import the RootStackParamList from the navigator file
type RootStackParamList = {
  PlayerStats: { gameId: string; gameTitle?: string };
  Subscription: undefined;
  Payment: { planId: string; updatePaymentMethod?: boolean };
  // Add other routes as needed
  [key: string]: object | undefined;
};

type PlayerStatsScreenProps = StackScreenProps<RootStackParamList, 'PlayerStats'>;

/**
 * Screen to display player plus-minus statistics for a game
 */
const PlayerStatsScreen: React.FC<PlayerStatsScreenProps> = ({
  route,
  navigation
}) => {
  const { gameId, gameTitle = 'Game Stats' } = route.params;
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerPlusMinus | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [upgradeModalVisible, setUpgradeModalVisible] = useState(false);
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const colorScheme = useColorScheme() ?? 'light';
  const primaryColor = '#0a7ea4';
  
  // Modal background and card colors
  const modalBackgroundColor = colorScheme === 'light' ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.7)';
  const cardBackgroundColor = colorScheme === 'light' ? '#fff' : '#1c1c1e';
  const cardBorderColor = colorScheme === 'light' ? '#e1e1e1' : '#38383A';
  
  // Check if user has access to player plus-minus data
  useEffect(() => {
    const checkAccess = async () => {
      setLoading(true);
      const user = auth.currentUser;
      
      if (!user) {
        setHasAccess(false);
        setLoading(false);
        return;
      }
      
      const access = await subscriptionService.hasPlayerPlusMinusAccess(user.uid, gameId);
      setHasAccess(access);
      setLoading(false);
    };
    
    checkAccess();
  }, [gameId]);
  
  // Handle player selection
  const handlePlayerPress = (player: PlayerPlusMinus) => {
    setSelectedPlayer(player);
    setModalVisible(true);
  };

  // Close the modal
  const closeModal = () => {
    setModalVisible(false);
  };
  
  // Show upgrade modal
  const showUpgradeModal = () => {
    setUpgradeModalVisible(true);
  };
  
  // Close upgrade modal
  const closeUpgradeModal = () => {
    setUpgradeModalVisible(false);
  };
  
  // Navigate to subscription screen
  const navigateToSubscription = () => {
    closeUpgradeModal();
    navigation.navigate('Subscription');
  };
  
  // Purchase one-time access
  const purchaseOneTimeAccess = async () => {
    const user = auth.currentUser;
    
    if (!user) {
      Alert.alert('Error', 'You must be logged in to make a purchase.');
      return;
    }
    
    try {
      const success = await subscriptionService.purchasePlayerPlusMinusAccess(user.uid, gameId);
      
      if (success) {
        Alert.alert(
          'Purchase Successful',
          'You now have access to player plus-minus data for this game.',
          [{ text: 'OK', onPress: () => {
            setHasAccess(true);
            closeUpgradeModal();
          }}]
        );
      } else {
        Alert.alert('Error', 'Failed to process your purchase. Please try again.');
      }
    } catch (error) {
      console.error('Error purchasing access:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again later.');
    }
  };

  // Render loading state
  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor }]}>
        <View style={styles.header}>
          <ThemedText style={styles.title}>{gameTitle}</ThemedText>
          <ThemedText style={styles.subtitle}>Player Plus/Minus</ThemedText>
        </View>
        <View style={styles.loadingContainer}>
          <ThemedText>Loading player statistics...</ThemedText>
        </View>
      </SafeAreaView>
    );
  }
  
  // Render locked state for users without access
  if (!hasAccess) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor }]}>
        <View style={styles.header}>
          <ThemedText style={styles.title}>{gameTitle}</ThemedText>
          <ThemedText style={styles.subtitle}>Player Plus/Minus</ThemedText>
        </View>
        
        <View style={styles.lockedContainer}>
          <Ionicons 
            name="lock-closed" 
            size={64} 
            color={colorScheme === 'light' ? '#999' : '#666'} 
            style={styles.lockIcon}
          />
          <ThemedText style={styles.lockedTitle}>Premium Feature</ThemedText>
          <ThemedText style={styles.lockedDescription}>
            Player plus-minus tracking is available to Premium subscribers or as a one-time purchase.
          </ThemedText>
          
          <TouchableOpacity 
            style={[styles.upgradeButton, { backgroundColor: primaryColor }]}
            onPress={showUpgradeModal}
          >
            <ThemedText style={styles.upgradeButtonText}>Unlock Player Stats</ThemedText>
          </TouchableOpacity>
        </View>
        
        {/* Upgrade Modal */}
        <Modal
          animationType="fade"
          transparent={true}
          visible={upgradeModalVisible}
          onRequestClose={closeUpgradeModal}
        >
          <TouchableOpacity 
            style={[styles.modalOverlay, { backgroundColor: modalBackgroundColor }]}
            activeOpacity={1}
            onPress={closeUpgradeModal}
          >
            <View 
              style={[
                styles.modalContent, 
                { 
                  backgroundColor: cardBackgroundColor,
                  borderColor: cardBorderColor
                }
              ]}
            >
              <ThemedText style={styles.modalTitle}>
                Unlock Player Plus/Minus
              </ThemedText>
              
              <ThemedText style={styles.modalDescription}>
                Track the real-time impact of players with plus-minus statistics.
              </ThemedText>
              
              <View style={styles.optionContainer}>
                <ThemedText style={styles.optionTitle}>Option 1: Subscribe</ThemedText>
                <ThemedText style={styles.optionDescription}>
                  Get full access to all premium features including player plus-minus tracking for all games.
                </ThemedText>
                <View style={styles.planRow}>
                  <ThemedText style={styles.planName}>Premium Monthly</ThemedText>
                  <ThemedText style={styles.planPrice}>$9.99/month</ThemedText>
                </View>
                <View style={styles.planRow}>
                  <ThemedText style={styles.planName}>Premium Annual</ThemedText>
                  <ThemedText style={styles.planPrice}>$99.99/year</ThemedText>
                </View>
                <TouchableOpacity 
                  style={[styles.optionButton, { backgroundColor: primaryColor }]}
                  onPress={navigateToSubscription}
                >
                  <ThemedText style={styles.optionButtonText}>View Plans</ThemedText>
                </TouchableOpacity>
              </View>
              
              <View style={[styles.optionContainer, styles.optionContainerAlt]}>
                <ThemedText style={styles.optionTitle}>Option 2: One-Time Purchase</ThemedText>
                <ThemedText style={styles.optionDescription}>
                  Get access to player plus-minus tracking for this game only.
                </ThemedText>
                <View style={styles.planRow}>
                  <ThemedText style={styles.planName}>Single Game Access</ThemedText>
                  <ThemedText style={styles.planPrice}>$1.99</ThemedText>
                </View>
                <TouchableOpacity 
                  style={[styles.optionButton, { backgroundColor: '#34C759' }]}
                  onPress={purchaseOneTimeAccess}
                >
                  <ThemedText style={styles.optionButtonText}>Purchase</ThemedText>
                </TouchableOpacity>
              </View>
              
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={closeUpgradeModal}
              >
                <ThemedText style={styles.closeButtonText}>Close</ThemedText>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>
      </SafeAreaView>
    );
  }
  
  // Render player stats for users with access
  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]}>
      <View style={styles.header}>
        <ThemedText style={styles.title}>{gameTitle}</ThemedText>
        <ThemedText style={styles.subtitle}>Player Plus/Minus</ThemedText>
      </View>
      
      <ScrollView style={styles.scrollView}>
        <PlayerPlusMinusList 
          gameId={gameId}
          title="Player Impact"
          onPlayerPress={handlePlayerPress}
        />
      </ScrollView>
      
      {/* Player Detail Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={closeModal}
      >
        <TouchableOpacity 
          style={[styles.modalOverlay, { backgroundColor: modalBackgroundColor }]}
          activeOpacity={1}
          onPress={closeModal}
        >
          <View 
            style={[
              styles.modalContent, 
              { 
                backgroundColor: cardBackgroundColor,
                borderColor: cardBorderColor
              }
            ]}
          >
            {selectedPlayer && (
              <>
                <ThemedText style={styles.modalTitle}>
                  {selectedPlayer.playerName}
                </ThemedText>
                
                <View style={styles.statRow}>
                  <ThemedText style={styles.statLabel}>Team:</ThemedText>
                  <ThemedText style={styles.statValue}>{selectedPlayer.team}</ThemedText>
                </View>
                
                <View style={styles.statRow}>
                  <ThemedText style={styles.statLabel}>Plus/Minus:</ThemedText>
                  <ThemedText 
                    style={[
                      styles.statValue, 
                      { 
                        color: selectedPlayer.plusMinus > 0 
                          ? (colorScheme === 'light' ? '#34C759' : '#30D158') 
                          : selectedPlayer.plusMinus < 0 
                            ? (colorScheme === 'light' ? '#FF3B30' : '#FF453A')
                            : textColor
                      }
                    ]}
                  >
                    {selectedPlayer.plusMinus > 0 ? `+${selectedPlayer.plusMinus}` : selectedPlayer.plusMinus}
                  </ThemedText>
                </View>
                
                <View style={styles.statRow}>
                  <ThemedText style={styles.statLabel}>Last Updated:</ThemedText>
                  <ThemedText style={styles.statValue}>
                    {selectedPlayer.timestamp ? new Date(selectedPlayer.timestamp).toLocaleTimeString() : 'N/A'}
                  </ThemedText>
                </View>
                
                <TouchableOpacity 
                  style={styles.closeButton}
                  onPress={closeModal}
                >
                  <ThemedText style={styles.closeButtonText}>Close</ThemedText>
                </TouchableOpacity>
              </>
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e1e1',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.7,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  lockedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  lockIcon: {
    marginBottom: 16,
  },
  lockedTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  lockedDescription: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  upgradeButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 8,
  },
  upgradeButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalDescription: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    opacity: 0.8,
  },
  optionContainer: {
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  optionContainerAlt: {
    backgroundColor: 'rgba(52, 199, 89, 0.1)',
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  optionDescription: {
    fontSize: 14,
    marginBottom: 12,
    opacity: 0.8,
  },
  planRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  planName: {
    fontSize: 15,
  },
  planPrice: {
    fontSize: 15,
    fontWeight: '600',
  },
  optionButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 8,
  },
  optionButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  statValue: {
    fontSize: 16,
  },
  closeButton: {
    marginTop: 20,
    padding: 12,
    backgroundColor: '#0a7ea4',
    borderRadius: 8,
    alignItems: 'center',
  },
  closeButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default PlayerStatsScreen;