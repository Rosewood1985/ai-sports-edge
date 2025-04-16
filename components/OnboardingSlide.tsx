import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Dimensions,
  ImageSourcePropType,
  TouchableOpacity
} from 'react-native';

const { width, height } = Dimensions.get('window');

interface ActionButtonProps {
  text: string;
  onPress: () => void;
}

interface OnboardingSlideProps {
  title: string;
  description: string;
  image: ImageSourcePropType;
  backgroundColor?: string;
  titleColor?: string;
  descriptionColor?: string;
  actionButton?: ActionButtonProps;
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
  descriptionColor = '#666666',
  actionButton
}: OnboardingSlideProps): JSX.Element => {
  return (
    <View
      style={[styles.slide, { backgroundColor }]}
      accessibilityRole="none"
      accessible={true}
      accessibilityLabel={`${title}. ${description}`}
    >
      <View style={styles.imageContainer}>
        <Image
          source={image}
          style={styles.image}
          resizeMode="contain"
          accessible={true}
          accessibilityLabel={`Illustration for ${title}`}
          accessibilityRole="image"
        />
      </View>
      
      <View style={styles.textContainer}>
        <Text
          style={[styles.title, { color: titleColor }]}
          accessibilityRole="header"
          accessible={true}
        >
          {title}
        </Text>
        <Text
          style={[styles.description, { color: descriptionColor }]}
          accessibilityRole="text"
          accessible={true}
        >
          {description}
        </Text>
        
        {actionButton && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={actionButton.onPress}
            accessibilityLabel={actionButton.text}
            accessibilityRole="button"
            accessibilityHint={`Navigates to ${actionButton.text} screen`}
            accessible={true}
          >
            <Text style={styles.actionButtonText}>{actionButton.text}</Text>
          </TouchableOpacity>
        )}
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
    marginBottom: 20,
  },
  actionButton: {
    backgroundColor: '#ffffff',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
    marginTop: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  actionButtonText: {
    color: '#16a085',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default OnboardingSlide;