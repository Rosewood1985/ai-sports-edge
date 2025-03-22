import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../contexts/ThemeContext';

// Parlay selection interface
export interface ParlaySelection {
  id: string;
  sportKey: string;
  gameId: string;
  homeTeam: string;
  awayTeam: string;
  bookmaker: string;
  odds: number;
  selection: string;
  timestamp: number;
}

interface ParlayIntegrationProps {
  sportKey: string;
  gameId: string;
  homeTeam: string;
  awayTeam: string;
  bookmaker: string;
  odds: number;
  selection: string;
  onAddToParlay?: () => void;
}

/**
 * ParlayIntegration component allows users to add selections to their parlay
 */
const ParlayIntegration: React.FC<ParlayIntegrationProps> = ({
  sportKey,
  gameId,
  homeTeam,
  awayTeam,
  bookmaker,
  odds,
  selection,
  onAddToParlay
}) => {
  const [isInParlay, setIsInParlay] = useState<boolean>(false);
  const [parlayCount, setParlayCount] = useState<number>(0);
  const { colors, isDark } = useTheme();

  // Check if selection is already in parlay
  useEffect(() => {
    const checkParlay = async () => {
      try {
        const parlayString = await AsyncStorage.getItem('parlay_selections');
        if (parlayString) {
          const parlaySelections: ParlaySelection[] = JSON.parse(parlayString);
          
          // Check if this selection is already in the parlay
          const selectionExists = parlaySelections.some(
            item => item.gameId === gameId && item.bookmaker === bookmaker && item.selection === selection
          );
          
          setIsInParlay(selectionExists);
          setParlayCount(parlaySelections.length);
        } else {
          setIsInParlay(false);
          setParlayCount(0);
        }
      } catch (error) {
        console.error('Error checking parlay:', error);
      }
    };
    
    checkParlay();
  }, [gameId, bookmaker, selection]);

  // Add selection to parlay
  const addToParlay = async () => {
    try {
      // Create parlay selection
      const parlaySelection: ParlaySelection = {
        id: `${gameId}_${bookmaker}_${selection}_${Date.now()}`,
        sportKey,
        gameId,
        homeTeam,
        awayTeam,
        bookmaker,
        odds,
        selection,
        timestamp: Date.now()
      };
      
      // Get existing parlay selections
      const parlayString = await AsyncStorage.getItem('parlay_selections');
      let parlaySelections: ParlaySelection[] = [];
      
      if (parlayString) {
        parlaySelections = JSON.parse(parlayString);
        
        // Check if this selection is already in the parlay
        const selectionExists = parlaySelections.some(
          item => item.gameId === gameId && item.bookmaker === bookmaker && item.selection === selection
        );
        
        if (selectionExists) {
          Alert.alert('Already in Parlay', 'This selection is already in your parlay.');
          return;
        }
      }
      
      // Add new selection to parlay
      parlaySelections.push(parlaySelection);
      
      // Save updated parlay
      await AsyncStorage.setItem('parlay_selections', JSON.stringify(parlaySelections));
      
      // Update state
      setIsInParlay(true);
      setParlayCount(parlaySelections.length);
      
      // Call onAddToParlay callback if provided
      if (onAddToParlay) {
        onAddToParlay();
      }
      
      // Show success message
      Alert.alert('Added to Parlay', 'This selection has been added to your parlay.');
    } catch (error) {
      console.error('Error adding to parlay:', error);
      Alert.alert('Error', 'Could not add selection to parlay. Please try again.');
    }
  };

  // Remove selection from parlay
  const removeFromParlay = async () => {
    try {
      // Get existing parlay selections
      const parlayString = await AsyncStorage.getItem('parlay_selections');
      
      if (parlayString) {
        let parlaySelections: ParlaySelection[] = JSON.parse(parlayString);
        
        // Remove this selection from the parlay
        parlaySelections = parlaySelections.filter(
          item => !(item.gameId === gameId && item.bookmaker === bookmaker && item.selection === selection)
        );
        
        // Save updated parlay
        await AsyncStorage.setItem('parlay_selections', JSON.stringify(parlaySelections));
        
        // Update state
        setIsInParlay(false);
        setParlayCount(parlaySelections.length);
        
        // Show success message
        Alert.alert('Removed from Parlay', 'This selection has been removed from your parlay.');
      }
    } catch (error) {
      console.error('Error removing from parlay:', error);
      Alert.alert('Error', 'Could not remove selection from parlay. Please try again.');
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.container,
        isInParlay ? styles.inParlayContainer : styles.notInParlayContainer,
        { borderColor: colors.primary }
      ]}
      onPress={isInParlay ? removeFromParlay : addToParlay}
    >
      <Ionicons
        name={isInParlay ? 'remove-circle' : 'add-circle'}
        size={20}
        color={isInParlay ? '#FF6347' : colors.primary}
      />
      <Text style={[styles.text, { color: colors.text }]}>
        {isInParlay ? 'Remove from Parlay' : 'Add to Parlay'}
      </Text>
      {parlayCount > 0 && (
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{parlayCount}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginTop: 8,
  },
  inParlayContainer: {
    backgroundColor: 'rgba(255, 99, 71, 0.1)',
    borderColor: '#FF6347',
  },
  notInParlayContainer: {
    backgroundColor: 'transparent',
  },
  text: {
    fontSize: 14,
    marginLeft: 6,
  },
  countBadge: {
    backgroundColor: '#007BFF',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  countText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
});

export default ParlayIntegration;