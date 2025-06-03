import { useNavigation } from '@react-navigation/native';
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Animated,
  Alert,
  Platform,
} from 'react-native';

import { useI18n } from '../../atomic/organisms/i18n/I18nContext';
import { ThemedText } from '../atomic/atoms/ThemedText';
import { ThemedView } from '../atomic/atoms/ThemedView';
import Header from '../components/Header';
import { analyticsService, AnalyticsEventType } from '../services/analyticsService';
import featureTourService, { FeatureTourStep } from '../services/featureTourService';

const { width, height } = Dimensions.get('window');

/**
 * FeatureTourScreen component
 * Provides an interactive tour of the app's key features
 */
const FeatureTourScreen: React.FC = () => {
  const navigation = useNavigation();
  const { t, language } = useI18n();
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [steps, setSteps] = useState<FeatureTourStep[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(width)).current;

  // Load feature tour steps
  useEffect(() => {
    const loadSteps = async () => {
      try {
        setLoading(true);
        const tourSteps = await featureTourService.getFeatureTourSteps();
        setSteps(tourSteps);

        // Track screen view
        analyticsService.trackScreenView('feature_tour');
      } catch (error) {
        console.error('Error loading feature tour steps:', error);
        Alert.alert(t('common.error'), t('featureTour.loading'));
      } finally {
        setLoading(false);
      }
    };

    loadSteps();
  }, []);

  // Animate step transition
  useEffect(() => {
    if (steps.length > 0) {
      // Fade out
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: width,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => {
        // Fade in
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(slideAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start();
      });
    }
  }, [currentStepIndex, steps]);

  // Handle completing the current step
  const handleCompleteStep = async () => {
    if (steps.length === 0) return;

    const currentStep = steps[currentStepIndex];

    try {
      // Mark step as completed
      await featureTourService.markFeatureTourStepCompleted(currentStep.id);

      // Update local state
      const updatedSteps = [...steps];
      updatedSteps[currentStepIndex] = {
        ...currentStep,
        completed: true,
      };
      setSteps(updatedSteps);

      // Move to next step or complete tour
      if (currentStepIndex < steps.length - 1) {
        setCurrentStepIndex(currentStepIndex + 1);
      } else {
        handleCompleteTour();
      }
    } catch (error) {
      console.error('Error completing feature tour step:', error);
      Alert.alert(t('common.error'), t('featureTour.steps.error'));
    }
  };

  // Handle completing the entire tour
  const handleCompleteTour = async () => {
    try {
      await featureTourService.markFeatureTourCompleted();

      // Show completion message
      Alert.alert(t('featureTour.completion.title'), t('featureTour.completion.message'), [
        {
          text: t('featureTour.completion.gotIt'),
          onPress: () => navigation.navigate('Main' as never),
        },
      ]);
    } catch (error) {
      console.error('Error completing feature tour:', error);
      Alert.alert('Error', 'Failed to complete tour. Please try again.');
    }
  };

  // Handle skipping the tour
  const handleSkipTour = () => {
    Alert.alert(t('featureTour.skip.title'), t('featureTour.skip.message'), [
      {
        text: t('featureTour.skip.cancel'),
        style: 'cancel',
      },
      {
        text: t('featureTour.skipTour'),
        onPress: () => {
          analyticsService.trackEvent(AnalyticsEventType.FEATURE_USED, {
            feature_name: 'feature_tour_skipped',
            step_index: currentStepIndex,
            step_id: steps[currentStepIndex]?.id,
          });
          navigation.navigate('Main' as never);
        },
      },
    ]);
  };

  // Render current step content
  const renderStepContent = () => {
    if (steps.length === 0 || loading) {
      return (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>{t('featureTour.loading')}</Text>
        </View>
      );
    }

    const currentStep = steps[currentStepIndex];

    return (
      <Animated.View
        style={[
          styles.stepContent,
          {
            opacity: fadeAnim,
            transform: [{ translateX: slideAnim }],
          },
        ]}
      >
        <ThemedText style={styles.stepTitle}>{currentStep.title}</ThemedText>
        <ThemedText style={styles.stepDescription}>{currentStep.description}</ThemedText>

        {/* Interactive demo area - would be customized for each feature */}
        <View style={styles.demoContainer}>
          <ThemedText style={styles.demoText}>
            [Interactive Demo: Tap to explore {currentStep.title}]
          </ThemedText>

          {/* This would be replaced with actual interactive components */}
          <TouchableOpacity style={styles.demoButton}>
            <ThemedText style={styles.demoButtonText}>{t('featureTour.tryIt')}</ThemedText>
          </TouchableOpacity>
        </View>

        <ThemedText style={styles.stepHint}>
          Users who use this feature report better betting results!
        </ThemedText>
      </Animated.View>
    );
  };

  // Render progress indicators
  const renderProgressIndicators = () => {
    return (
      <View style={styles.progressContainer}>
        {steps.map((step, index) => (
          <View
            key={step.id}
            style={[
              styles.progressDot,
              index === currentStepIndex && styles.activeDot,
              step.completed && styles.completedDot,
            ]}
          />
        ))}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header title={t('featureTour.title')} onRefresh={() => {}} isLoading={loading} />

      <View style={styles.content}>
        {renderStepContent()}

        {renderProgressIndicators()}

        <View style={styles.buttonsContainer}>
          {currentStepIndex < steps.length - 1 ? (
            <>
              <TouchableOpacity style={styles.skipButton} onPress={handleSkipTour}>
                <ThemedText style={styles.skipButtonText}>{t('featureTour.skipTour')}</ThemedText>
              </TouchableOpacity>

              <TouchableOpacity style={styles.nextButton} onPress={handleCompleteStep}>
                <ThemedText style={styles.nextButtonText}>{t('featureTour.next')}</ThemedText>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity style={styles.finishButton} onPress={handleCompleteStep}>
              <ThemedText style={styles.finishButtonText}>{t('featureTour.finishTour')}</ThemedText>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  stepContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  stepDescription: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  demoContainer: {
    width: '100%',
    height: 200,
    backgroundColor: '#e8f4fd',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    padding: 16,
  },
  demoText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
  demoButton: {
    backgroundColor: '#3498db',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  demoButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  stepHint: {
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
    color: '#666',
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 20,
  },
  progressDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#ccc',
    marginHorizontal: 5,
  },
  activeDot: {
    backgroundColor: '#3498db',
    transform: [{ scale: 1.2 }],
  },
  completedDot: {
    backgroundColor: '#2ecc71',
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 20 : 10,
  },
  skipButton: {
    padding: 15,
  },
  skipButtonText: {
    fontSize: 16,
    color: '#666',
  },
  nextButton: {
    backgroundColor: '#3498db',
    borderRadius: 25,
    paddingHorizontal: 30,
    paddingVertical: 15,
  },
  nextButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  finishButton: {
    backgroundColor: '#2ecc71',
    borderRadius: 25,
    paddingHorizontal: 30,
    paddingVertical: 15,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  finishButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default FeatureTourScreen;
