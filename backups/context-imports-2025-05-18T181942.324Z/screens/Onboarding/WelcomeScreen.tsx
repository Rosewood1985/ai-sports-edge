import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useTheme } from '@react-navigation/native';
import { useLanguage } from '../../contexts/LanguageContext';



import { ThemedView } from '../atomic/atoms/ThemedView'
import { ThemedText } from '../atomic/atoms/ThemedText';
import { Ionicons } from '@expo/vector-icons';
import { OnboardingStackParamList } from '../../navigation/OnboardingNavigator';

type WelcomeScreenNavigationProp = StackNavigationProp<
  OnboardingStackParamList,
  'Welcome'
>;

const WelcomeScreen = () => {
  const navigation = useNavigation<WelcomeScreenNavigationProp>();
  const { colors } = useTheme();
  const { t } = useLanguage();
  
  const handleGetStarted = () => {
    // Navigate to the GDPR consent screen, which is the first step in the verification flow
    navigation.navigate('GDPRConsent');
  };
  
  return (
    <ThemedView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <Ionicons name="basketball" size={80} color={colors.primary} />
          <ThemedText style={styles.appName}>AI Sports Edge</ThemedText>
        </View>
        
        <ThemedText style={styles.title}>
          {t('onboarding.welcome_title')}
        </ThemedText>
        
        <ThemedText style={styles.description}>
          {t('onboarding.welcome_description')}
        </ThemedText>
        
        <View style={styles.featuresContainer}>
          <View style={styles.featureItem}>
            <Ionicons name="analytics-outline" size={24} color={colors.primary} />
            <ThemedText style={styles.featureText}>
              {t('onboarding.feature_analytics')}
            </ThemedText>
          </View>
          
          <View style={styles.featureItem}>
            <Ionicons name="trending-up-outline" size={24} color={colors.primary} />
            <ThemedText style={styles.featureText}>
              {t('onboarding.feature_predictions')}
            </ThemedText>
          </View>
          
          <View style={styles.featureItem}>
            <Ionicons name="notifications-outline" size={24} color={colors.primary} />
            <ThemedText style={styles.featureText}>
              {t('onboarding.feature_alerts')}
            </ThemedText>
          </View>
        </View>
        
        <TouchableOpacity
          style={[styles.getStartedButton, { backgroundColor: colors.primary }]}
          onPress={handleGetStarted}
          accessible={true}
          accessibilityLabel={t('onboarding.get_started')}
          accessibilityRole="button"
        >
          <Text style={styles.getStartedButtonText}>
            {t('onboarding.get_started')}
          </Text>
        </TouchableOpacity>
        
        <ThemedText style={styles.disclaimer}>
          {t('onboarding.disclaimer')}
        </ThemedText>
      </View>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 48,
  },
  appName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    marginBottom: 32,
    textAlign: 'center',
  },
  featuresContainer: {
    width: '100%',
    marginBottom: 32,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  featureText: {
    fontSize: 16,
    marginLeft: 12,
  },
  getStartedButton: {
    width: '100%',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  getStartedButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  disclaimer: {
    fontSize: 12,
    textAlign: 'center',
    opacity: 0.7,
  },
});

export default WelcomeScreen;