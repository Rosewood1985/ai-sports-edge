import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Animated,
  TouchableOpacity,
  Text,
  SafeAreaView,
  Dimensions,
  StatusBar,
  Alert,
} from 'react-native';

import { useI18n } from '../../atomic/organisms/i18n/I18nContext';
import OnboardingSlide from '../components/OnboardingSlide';
import {
  isOnboardingCompleted,
  markOnboardingCompleted,
  initOnboardingAnalytics,
  updateOnboardingProgress,
} from '../services/onboardingService';

// Define the navigation types
type RootStackParamList = {
  Main: undefined;
  GroupSubscription: undefined;
  // Add other screens as needed
};

type NavigationProp = StackNavigationProp<RootStackParamList>;

const { width, height } = Dimensions.get('window');

/**
 * Onboarding screen component
 * @returns {JSX.Element} - Rendered component
 */
const OnboardingScreen = (): JSX.Element => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  const navigation = useNavigation<NavigationProp>();
  const { t, language } = useI18n();

  // Define the onboarding slides with translations
  const translatedSlides = [
    {
      id: '1',
      title: t('welcome.title'),
      description: t('welcome.description'),
      image: require('../assets/images/onboarding/welcome.png'),
      backgroundColor: '#3498db',
      titleColor: '#ffffff',
      descriptionColor: '#f0f0f0',
    },
    {
      id: '2',
      title: t('aiPredictions.title'),
      description: t('aiPredictions.description'),
      image: require('../assets/images/onboarding/ai-predictions.png'),
      backgroundColor: '#2ecc71',
      titleColor: '#ffffff',
      descriptionColor: '#f0f0f0',
    },
    {
      id: '3',
      title: t('liveOdds.title'),
      description: t('liveOdds.description'),
      image: require('../assets/images/onboarding/live-odds.png'),
      backgroundColor: '#9b59b6',
      titleColor: '#ffffff',
      descriptionColor: '#f0f0f0',
    },
    {
      id: '4',
      title: t('performance.title'),
      description: t('performance.description'),
      image: require('../assets/images/onboarding/performance.png'),
      backgroundColor: '#e74c3c',
      titleColor: '#ffffff',
      descriptionColor: '#f0f0f0',
    },
    {
      id: '5',
      title: t('groupSubscription.title'),
      description: t('groupSubscription.description'),
      image: require('../assets/images/onboarding/group-subscription.png'),
      backgroundColor: '#16a085',
      titleColor: '#ffffff',
      descriptionColor: '#f0f0f0',
      actionButton: {
        text: t('groupSubscription.actionButton'),
        onPress: () => {
          // Show 24-hour registration requirement alert before navigating
          Alert.alert(t('groupSubscription.title'), t('groupSubscription.timeRequirement'), [
            {
              text: t('common.cancel'),
              style: 'cancel',
            },
            {
              text: t('common.confirm'),
              onPress: () => navigation.navigate('GroupSubscription'),
            },
          ]);
        },
      },
    },
    {
      id: '6',
      title: t('getStarted.title'),
      description: t('getStarted.description'),
      image: require('../assets/images/onboarding/get-started.png'),
      backgroundColor: '#f39c12',
      titleColor: '#ffffff',
      descriptionColor: '#f0f0f0',
    },
  ];

  // Initialize analytics when component mounts
  useEffect(() => {
    const initAnalytics = async () => {
      try {
        await initOnboardingAnalytics(translatedSlides.length);
        await updateOnboardingProgress(1, translatedSlides.length);
      } catch (error) {
        console.error('Failed to initialize onboarding analytics:', error);
        // Continue with onboarding even if analytics fails
      }
    };

    initAnalytics();
  }, []);

  // Update analytics when slide changes
  useEffect(() => {
    const updateAnalytics = async () => {
      try {
        await updateOnboardingProgress(currentIndex + 1, translatedSlides.length);
      } catch (error) {
        console.error('Failed to update onboarding progress:', error);
        // Continue with onboarding even if analytics update fails
      }
    };

    updateAnalytics();
  }, [currentIndex]);

  const handleSkip = () => {
    try {
      flatListRef.current?.scrollToIndex({
        index: translatedSlides.length - 1,
        animated: true,
        viewOffset: 0,
        viewPosition: 0,
      });
    } catch (error) {
      console.error('Error skipping to last slide:', error);
      // Fallback to manually setting the current index
      setCurrentIndex(translatedSlides.length - 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < translatedSlides.length - 1) {
      try {
        flatListRef.current?.scrollToIndex({
          index: currentIndex + 1,
          animated: true,
          viewOffset: 0,
          viewPosition: 0,
        });
      } catch (error) {
        console.error('Error navigating to next slide:', error);
        // Fallback to manually setting the current index
        setCurrentIndex(currentIndex + 1);
      }
    }
  };

  const handleComplete = async () => {
    try {
      const success = await markOnboardingCompleted();
      if (!success) {
        // Show error alert but still allow navigation
        Alert.alert(
          t('common.error'),
          t('errors.saveFailed', {
            defaultValue:
              "We couldn't save your onboarding progress. Some features may ask you to complete onboarding again.",
          }),
          [
            {
              text: t('common.ok'),
              onPress: () => navigation.navigate('Main'),
            },
          ]
        );
        return;
      }

      // Success case
      Alert.alert(t('completion.title'), t('completion.message'), [
        {
          text: t('completion.gotIt'),
          onPress: () => navigation.navigate('Main'),
        },
      ]);
    } catch (error) {
      // Handle unexpected errors
      console.error('Error completing onboarding:', error);
      Alert.alert(
        t('common.error'),
        t('errors.generalError', {
          defaultValue:
            'There was a problem completing the onboarding process. You can try again later.',
        }),
        [
          {
            text: t('common.ok'),
            onPress: () => navigation.navigate('Main'),
          },
        ]
      );
    }
  };

  const renderItem = ({ item }: { item: (typeof translatedSlides)[0] }) => (
    <OnboardingSlide
      title={item.title}
      description={item.description}
      image={item.image}
      backgroundColor={item.backgroundColor}
      titleColor={item.titleColor}
      descriptionColor={item.descriptionColor}
      actionButton={item.actionButton}
    />
  );

  const renderDots = () => {
    const dotPosition = Animated.divide(scrollX, width);

    return (
      <View
        style={styles.dotsContainer}
        accessibilityLabel={`${t('step', { defaultValue: 'Step' })} ${currentIndex + 1} ${t('of', { defaultValue: 'of' })} ${translatedSlides.length}`}
        accessibilityRole="tablist"
      >
        {translatedSlides.map((_, index) => {
          const opacity = dotPosition.interpolate({
            inputRange: [index - 1, index, index + 1],
            outputRange: [0.3, 1, 0.3],
            extrapolate: 'clamp',
          });

          const scale = dotPosition.interpolate({
            inputRange: [index - 1, index, index + 1],
            outputRange: [0.8, 1.2, 0.8],
            extrapolate: 'clamp',
          });

          return (
            <Animated.View
              key={`dot-${index}`}
              style={[styles.dot, { opacity, transform: [{ scale }] }]}
              accessibilityLabel={
                index === currentIndex
                  ? t('currentStep', { defaultValue: 'Current step', number: index + 1 })
                  : t('step', { defaultValue: 'Step', number: index + 1 })
              }
              accessibilityRole="button"
              accessible
            />
          );
        })}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" />

      <FlatList
        ref={flatListRef}
        data={translatedSlides}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
          useNativeDriver: false,
        })}
        onMomentumScrollEnd={event => {
          const index = Math.round(event.nativeEvent.contentOffset.x / width);
          setCurrentIndex(index);
        }}
        accessible
        accessibilityLabel={t('progressNav', { defaultValue: 'Onboarding progress' })}
        accessibilityHint={t('swipeHint', {
          defaultValue: 'Swipe left or right to navigate between slides',
        })}
      />

      {renderDots()}

      <View style={styles.buttonsContainer}>
        {currentIndex < translatedSlides.length - 1 ? (
          <>
            <TouchableOpacity
              style={styles.button}
              onPress={handleSkip}
              accessibilityLabel={t('common.skip')}
              accessibilityRole="button"
              accessibilityHint={t('skipHint', { defaultValue: 'Skip to the last slide' })}
            >
              <Text style={styles.buttonText}>{t('common.skip')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.nextButton]}
              onPress={handleNext}
              accessibilityLabel={t('common.next')}
              accessibilityRole="button"
              accessibilityHint={t('nextHint', { defaultValue: 'Go to the next slide' })}
            >
              <Text style={[styles.buttonText, styles.nextButtonText]}>{t('common.next')}</Text>
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity
            style={[styles.button, styles.getStartedButton]}
            onPress={handleComplete}
            accessibilityLabel={t('common.getStarted')}
            accessibilityRole="button"
            accessibilityHint={t('getStartedHint', {
              defaultValue: 'Complete onboarding and go to the main app',
            })}
          >
            <Text style={[styles.buttonText, styles.getStartedButtonText]}>
              {t('common.getStarted')}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#3498db',
    marginHorizontal: 5,
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  button: {
    padding: 15,
  },
  buttonText: {
    fontSize: 16,
    color: '#333',
  },
  nextButton: {
    backgroundColor: '#3498db',
    borderRadius: 25,
    paddingHorizontal: 30,
  },
  nextButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  getStartedButton: {
    backgroundColor: '#3498db',
    borderRadius: 25,
    paddingHorizontal: 30,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  getStartedButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default OnboardingScreen;
