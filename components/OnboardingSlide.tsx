import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  Dimensions, 
  ImageSourcePropType 
} from 'react-native';

const { width, height } = Dimensions.get('window');

interface OnboardingSlideProps {
  title: string;
  description: string;
  image: ImageSourcePropType;
  backgroundColor?: string;
  titleColor?: string;
  descriptionColor?: string;
}

/**
 * Component for displaying an individual onboarding slide
 * @param {OnboardingSlideProps} props - Component props
 * @returns {JSX.Element} - Rendered component
 */
const OnboardingSlide = ({
  title,
  description,
  image,
  backgroundColor = '#ffffff',
  titleColor = '#333333',
  descriptionColor = '#666666'
}: OnboardingSlideProps): JSX.Element => {
  return (
    <View style={[styles.slide, { backgroundColor }]}>
      <View style={styles.imageContainer}>
        <Image source={image} style={styles.image} resizeMode="contain" />
      </View>
      
      <View style={styles.textContainer}>
        <Text style={[styles.title, { color: titleColor }]}>{title}</Text>
        <Text style={[styles.description, { color: descriptionColor }]}>
          {description}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  slide: {
    width,
    height: height * 0.8,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  imageContainer: {
    flex: 0.6,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  image: {
    width: width * 0.8,
    height: width * 0.8,
  },
  textContainer: {
    flex: 0.4,
    alignItems: 'center',
    width: '100%',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 24,
  },
});

export default OnboardingSlide;