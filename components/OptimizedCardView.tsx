import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Platform,
} from 'react-native';
import ResponsiveImage from './ResponsiveImage';
import {
  useOptimizedFade,
  useOptimizedScale,
  useOptimizedSlide,
  useOptimizedStagger,
} from '../hooks/useOptimizedAnimation';
import { shouldEnableComplexAnimations } from '../utils/animationOptimizer';

interface OptimizedCardViewProps {
  title: string;
  description: string;
  imagePath: string;
  onPress?: () => void;
}

/**
 * OptimizedCardView component that demonstrates responsive image loading
 * and optimized animations based on device capabilities
 */
const OptimizedCardView: React.FC<OptimizedCardViewProps> = ({
  title,
  description,
  imagePath,
  onPress,
}) => {
  // Set up optimized animations
  const { fadeAnim, startFade } = useOptimizedFade();
  const { scaleAnim, startScale } = useOptimizedScale({ initialValue: 0.95 });
  const { slideAnim, startSlide } = useOptimizedSlide({ initialValue: 20 });
  
  // Staggered animations for text elements
  const { animatedValues, startStagger } = useOptimizedStagger(
    2, // Number of text elements
    () => new Animated.Value(0),
    300, // Duration
    100 // Stagger delay
  );
  
  // Start animations when component mounts
  useEffect(() => {
    startFade();
    startScale();
    startSlide();
    startStagger();
  }, []);
  
  // Determine if we should use complex animations
  const useComplexAnimations = shouldEnableComplexAnimations();
  
  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [
            { scale: scaleAnim },
            { translateY: slideAnim },
          ],
        },
      ]}
    >
      <TouchableOpacity
        style={styles.touchable}
        onPress={onPress}
        activeOpacity={0.9}
      >
        <View style={styles.imageContainer}>
          <ResponsiveImage
            basePath={imagePath}
            width={300}
            height={180}
            style={styles.image}
            resizeMode="cover"
          />
        </View>
        
        <View style={styles.contentContainer}>
          <Animated.Text
            style={[
              styles.title,
              {
                opacity: animatedValues[0],
                transform: useComplexAnimations
                  ? [{ translateX: animatedValues[0].interpolate({
                      inputRange: [0, 1],
                      outputRange: [20, 0],
                    })}]
                  : [],
              },
            ]}
          >
            {title}
          </Animated.Text>
          
          <Animated.Text
            style={[
              styles.description,
              {
                opacity: animatedValues[1],
                transform: useComplexAnimations
                  ? [{ translateX: animatedValues[1].interpolate({
                      inputRange: [0, 1],
                      outputRange: [20, 0],
                    })}]
                  : [],
              },
            ]}
          >
            {description}
          </Animated.Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    marginVertical: 10,
    overflow: 'hidden',
  },
  touchable: {
    width: '100%',
  },
  imageContainer: {
    width: '100%',
    height: 180,
    backgroundColor: '#f0f0f0',
  },
  image: {
    width: '100%',
    height: '100%',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  contentContainer: {
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});

export default OptimizedCardView;