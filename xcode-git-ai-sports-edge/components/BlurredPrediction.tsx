import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ImageBackground
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { AIPrediction, ConfidenceLevel } from '../types/odds';
import { useTheme } from '../contexts/ThemeContext';

interface BlurredPredictionProps {
  prediction: AIPrediction;
  isBlurred: boolean;
  teamName: string;
}

/**
 * BlurredPrediction component shows AI predictions with confidence scores hidden for free users
 * @param {BlurredPredictionProps} props - Component props
 * @returns {JSX.Element} - Rendered component
 */
const BlurredPrediction: React.FC<BlurredPredictionProps> = ({ 
  prediction, 
  isBlurred,
  teamName
}) => {
  const navigation = useNavigation();
  const { colors, isDark } = useTheme();

  // Get confidence color based on level
  const getConfidenceColor = (level: ConfidenceLevel): string => {
    switch (level) {
      case 'high':
        return '#4CAF50'; // Green
      case 'medium':
        return '#FFC107'; // Yellow
      case 'low':
        return '#F44336'; // Red
      default:
        return '#757575'; // Gray
    }
  };

  // Navigate to subscription screen
  const handleUpgrade = () => {
    // @ts-ignore - Navigation typing issue
    navigation.navigate('Subscription');
  };

  // If not blurred, show full prediction
  if (!isBlurred) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={[styles.teamName, { color: colors.text }]}>
            {teamName}
          </Text>
          <View style={[
            styles.confidenceTag,
            { backgroundColor: getConfidenceColor(prediction.confidence) }
          ]}>
            <Text style={styles.confidenceText}>
              {prediction.confidence.toUpperCase()}
            </Text>
          </View>
        </View>
        
        <View style={styles.scoreContainer}>
          <Text style={[styles.scoreLabel, { color: colors.text }]}>
            Confidence Score:
          </Text>
          <Text style={[styles.scoreValue, { color: colors.primary }]}>
            {prediction.confidence_score}%
          </Text>
        </View>
        
        <View style={styles.reasoningContainer}>
          <Text style={[styles.reasoningLabel, { color: colors.text }]}>
            AI Reasoning:
          </Text>
          <Text style={[styles.reasoningText, { color: colors.text }]}>
            {prediction.reasoning}
          </Text>
        </View>
        
        <View style={styles.accuracyContainer}>
          <Text style={[styles.accuracyText, { color: colors.text }]}>
            Historical Accuracy: {prediction.historical_accuracy}%
          </Text>
        </View>
      </View>
    );
  }

  // Show blurred prediction
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.teamName, { color: colors.text }]}>
          {teamName}
        </Text>
        <View style={[
          styles.confidenceTag,
          { backgroundColor: getConfidenceColor(prediction.confidence) }
        ]}>
          <Text style={styles.confidenceText}>
            {prediction.confidence.toUpperCase()}
          </Text>
        </View>
      </View>
      
      <View style={styles.blurredContent}>
        <View style={[
          styles.blurredOverlay,
          { backgroundColor: isDark ? 'rgba(30, 30, 30, 0.9)' : 'rgba(255, 255, 255, 0.9)' }
        ]}>
          <Ionicons name="lock-closed" size={24} color={colors.primary} />
          <Text style={[styles.blurredText, { color: colors.text }]}>
            Upgrade to see confidence score and detailed reasoning
          </Text>
          <TouchableOpacity
            style={[styles.upgradeButton, { backgroundColor: colors.primary }]}
            onPress={handleUpgrade}
          >
            <Text style={styles.upgradeButtonText}>Upgrade Now</Text>
          </TouchableOpacity>
        </View>
        
        {/* Fake blurred content */}
        <View style={styles.fakeContent}>
          <View style={styles.scoreContainer}>
            <Text style={[styles.scoreLabel, { color: colors.text, opacity: 0.3 }]}>
              Confidence Score:
            </Text>
            <View style={[styles.blurredScore, { backgroundColor: isDark ? '#333' : '#ddd' }]} />
          </View>
          
          <View style={styles.reasoningContainer}>
            <Text style={[styles.reasoningLabel, { color: colors.text, opacity: 0.3 }]}>
              AI Reasoning:
            </Text>
            <View style={[styles.blurredReasoning, { backgroundColor: isDark ? '#333' : '#ddd' }]} />
            <View style={[styles.blurredReasoning, { backgroundColor: isDark ? '#333' : '#ddd', width: '80%' }]} />
            <View style={[styles.blurredReasoning, { backgroundColor: isDark ? '#333' : '#ddd', width: '60%' }]} />
          </View>
          
          <View style={styles.accuracyContainer}>
            <View style={[styles.blurredAccuracy, { backgroundColor: isDark ? '#333' : '#ddd' }]} />
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 12,
    borderRadius: 8,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  teamName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  confidenceTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  confidenceText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  scoreContainer: {
    marginBottom: 12,
  },
  scoreLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  scoreValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  reasoningContainer: {
    marginBottom: 12,
  },
  reasoningLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  reasoningText: {
    fontSize: 14,
    lineHeight: 20,
  },
  accuracyContainer: {
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingTop: 8,
  },
  accuracyText: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  blurredContent: {
    position: 'relative',
    minHeight: 150,
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
    borderRadius: 4,
  },
  blurredText: {
    fontSize: 14,
    textAlign: 'center',
    marginVertical: 12,
    fontWeight: '500',
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
  fakeContent: {
    opacity: 0.3,
  },
  blurredScore: {
    height: 20,
    width: 60,
    borderRadius: 4,
    marginTop: 4,
  },
  blurredReasoning: {
    height: 12,
    width: '100%',
    borderRadius: 4,
    marginTop: 8,
  },
  blurredAccuracy: {
    height: 12,
    width: 120,
    borderRadius: 4,
  },
});

export default BlurredPrediction;