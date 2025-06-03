import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

import { useTheme } from '../contexts/ThemeContext';

interface Formula1BlurredPredictionProps {
  /**
   * Title of the prediction
   */
  title: string;

  /**
   * Description of the prediction
   */
  description: string;

  /**
   * Function to call when the user wants to unlock the prediction
   */
  onUnlock: () => void;

  /**
   * Price of the prediction
   */
  price: string;
}

/**
 * Formula1BlurredPrediction component shows a blurred prediction that can be unlocked
 * @param {Formula1BlurredPredictionProps} props - Component props
 * @returns {JSX.Element} - Rendered component
 */
const Formula1BlurredPrediction = ({
  title,
  description,
  onUnlock,
  price,
}: Formula1BlurredPredictionProps): JSX.Element => {
  const { colors, isDark } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.card }]}>
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>

      <View style={styles.blurredContent}>
        <View
          style={[
            styles.blurredOverlay,
            { backgroundColor: isDark ? 'rgba(30, 30, 30, 0.9)' : 'rgba(255, 255, 255, 0.9)' },
          ]}
        >
          <Ionicons name="lock-closed" size={24} color={colors.primary} />
          <Text style={[styles.blurredText, { color: colors.text }]}>{description}</Text>
          <TouchableOpacity
            style={[styles.unlockButton, { backgroundColor: colors.primary }]}
            onPress={onUnlock}
          >
            <Text style={styles.unlockButtonText}>Unlock for {price}</Text>
          </TouchableOpacity>
        </View>

        {/* Fake blurred content */}
        <View style={styles.fakeContent}>
          <View style={styles.podiumContainer}>
            <Text style={[styles.sectionTitle, { color: colors.primary, opacity: 0.3 }]}>
              Predicted Podium
            </Text>
            <View style={styles.positions}>
              <View style={[styles.position, { backgroundColor: isDark ? '#333' : '#eee' }]} />
              <View style={[styles.position, { backgroundColor: isDark ? '#333' : '#eee' }]} />
              <View style={[styles.position, { backgroundColor: isDark ? '#333' : '#eee' }]} />
            </View>
          </View>

          <View style={styles.fastestLapContainer}>
            <Text style={[styles.sectionTitle, { color: colors.primary, opacity: 0.3 }]}>
              Fastest Lap Prediction
            </Text>
            <View style={[styles.blurredLine, { backgroundColor: isDark ? '#333' : '#eee' }]} />
          </View>

          <View
            style={[
              styles.blurredLine,
              { backgroundColor: isDark ? '#333' : '#eee', width: '60%', alignSelf: 'flex-end' },
            ]}
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  blurredContent: {
    position: 'relative',
    minHeight: 200,
  },
  blurredOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
  },
  blurredText: {
    fontSize: 16,
    textAlign: 'center',
    marginVertical: 16,
    fontWeight: '500',
    lineHeight: 22,
  },
  unlockButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  unlockButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  fakeContent: {
    opacity: 0.3,
  },
  podiumContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  positions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  position: {
    height: 60,
    flex: 1,
    marginHorizontal: 4,
    borderRadius: 8,
  },
  fastestLapContainer: {
    marginBottom: 16,
  },
  blurredLine: {
    height: 16,
    width: '100%',
    borderRadius: 4,
    marginTop: 8,
    marginBottom: 8,
  },
});

export default Formula1BlurredPrediction;
