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
  StatusBar
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import OnboardingSlide from '../components/OnboardingSlide';
import { 
  isOnboardingCompleted, 
  markOnboardingCompleted,
  initOnboardingAnalytics,
  updateOnboardingProgress
} from '../services/onboardingService';

const { width, height } = Dimensions.get('window');

// Define the onboarding slides
const slides = [
  {
    id: '1',
    title: 'Welcome to AI Sports Edge',
    description: 'Your ultimate companion for AI-powered sports betting insights and predictions.',
    image: require('../assets/images/icon.png'),
    backgroundColor: '#3498db',
    titleColor: '#ffffff',
    descriptionColor: '#f0f0f0'
  },
  {
    id: '2',
    title: 'AI-Powered Predictions',
    description: 'Get access to cutting-edge AI predictions with confidence scores to make informed betting decisions.',
    image: require('../assets/images/icon.png'),
    backgroundColor: '#2ecc71',
    titleColor: '#ffffff',
    descriptionColor: '#f0f0f0'
  },
  {
    id: '3',
    title: 'Live Betting Odds',
    description: 'Stay updated with real-time odds from multiple bookmakers, all in one place.',
    image: require('../assets/images/icon.png'),
    backgroundColor: '#9b59b6',
    titleColor: '#ffffff',
    descriptionColor: '#f0f0f0'
  },
  {
    id: '4',
    title: 'Track Your Performance',
    description: 'Compare AI predictions with actual results to see how well our system performs.',
    image: require('../assets/images/icon.png'),
    backgroundColor: '#e74c3c',
    titleColor: '#ffffff',
    descriptionColor: '#f0f0f0'
  },
  {
    id: '5',
    title: 'Ready to Start?',
    description: 'Get started now and elevate your betting strategy with AI-powered insights!',
    image: require('../assets/images/icon.png'),
    backgroundColor: '#f39c12',
    titleColor: '#ffffff',
    descriptionColor: '#f0f0f0'
  }
];

/**
 * Onboarding screen component
 * @returns {JSX.Element} - Rendered component
 */
const OnboardingScreen = (): JSX.Element => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  const navigation = useNavigation();

  // Initialize analytics when component mounts
  useEffect(() => {
    const initAnalytics = async () => {
      await initOnboardingAnalytics(slides.length);
      await updateOnboardingProgress(1, slides.length);
    };
    
    initAnalytics();
  }, []);

  // Update analytics when slide changes
  useEffect(() => {
    const updateAnalytics = async () => {
      await updateOnboardingProgress(currentIndex + 1, slides.length);
    };
    
    updateAnalytics();
  }, [currentIndex]);

  const handleSkip = () => {
    flatListRef.current?.scrollToIndex({ index: slides.length - 1 });
  };

  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
    }
  };

  const handleComplete = async () => {
    await markOnboardingCompleted();
    navigation.navigate('Main' as never);
  };

  const renderItem = ({ item }: { item: typeof slides[0] }) => (
    <OnboardingSlide
      title={item.title}
      description={item.description}
      image={item.image}
      backgroundColor={item.backgroundColor}
      titleColor={item.titleColor}
      descriptionColor={item.descriptionColor}
    />
  );

  const renderDots = () => {
    const dotPosition = Animated.divide(scrollX, width);
    
    return (
      <View style={styles.dotsContainer}>
        {slides.map((_, index) => {
          const opacity = dotPosition.interpolate({
            inputRange: [index - 1, index, index + 1],
            outputRange: [0.3, 1, 0.3],
            extrapolate: 'clamp'
          });
          
          const scale = dotPosition.interpolate({
            inputRange: [index - 1, index, index + 1],
            outputRange: [0.8, 1.2, 0.8],
            extrapolate: 'clamp'
          });
          
          return (
            <Animated.View
              key={`dot-${index}`}
              style={[
                styles.dot,
                { opacity, transform: [{ scale }] }
              ]}
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
        data={slides}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
        onMomentumScrollEnd={(event) => {
          const index = Math.round(
            event.nativeEvent.contentOffset.x / width
          );
          setCurrentIndex(index);
        }}
      />
      
      {renderDots()}
      
      <View style={styles.buttonsContainer}>
        {currentIndex < slides.length - 1 ? (
          <>
            <TouchableOpacity
              style={styles.button}
              onPress={handleSkip}
            >
              <Text style={styles.buttonText}>Skip</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.button, styles.nextButton]}
              onPress={handleNext}
            >
              <Text style={[styles.buttonText, styles.nextButtonText]}>
                Next
              </Text>
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity
            style={[styles.button, styles.getStartedButton]}
            onPress={handleComplete}
          >
            <Text style={[styles.buttonText, styles.getStartedButtonText]}>
              Get Started
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