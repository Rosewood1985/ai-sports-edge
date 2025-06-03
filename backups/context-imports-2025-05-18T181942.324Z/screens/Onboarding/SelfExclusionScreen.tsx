import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useTheme } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';

import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../hooks/useAuth';
import { OnboardingStackParamList } from '../../navigation/OnboardingNavigator';
import { saveVerificationData } from '../../services/userService';
import { ThemedText } from '../atomic/atoms/ThemedText';
import { ThemedView } from '../atomic/atoms/ThemedView';

type SelfExclusionScreenNavigationProp = StackNavigationProp<
  OnboardingStackParamList,
  'SelfExclusion'
>;

const SelfExclusionScreen = () => {
  const navigation = useNavigation<SelfExclusionScreenNavigationProp>();
  const { colors } = useTheme();
  const { t } = useLanguage();
  const { user } = useAuth();

  const handleResponse = async (isOnSelfExclusionList: boolean) => {
    if (!user) {
      Alert.alert(t('common.error'), t('common.not_authenticated'), [{ text: t('common.ok') }]);
      return;
    }

    if (isOnSelfExclusionList) {
      // User is on a self-exclusion list
      Alert.alert(t('self_exclusion.alert_title'), t('self_exclusion.alert_message'), [
        { text: t('common.ok'), onPress: () => navigation.navigate('Welcome') },
      ]);
    } else {
      // User is not on a self-exclusion list
      try {
        // Save response to user profile
        await saveVerificationData(user.uid, 'selfExclusionCheck', {
          response: false, // false = not on self-exclusion list
        });

        // Navigate to next screen
        navigation.navigate('ResponsibleGambling');
      } catch (error) {
        console.error('Error saving self-exclusion response:', error);
        Alert.alert(t('common.error'), t('self_exclusion.save_error'), [{ text: t('common.ok') }]);
      }
    }
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.content}>
        <ThemedText style={styles.title}>{t('self_exclusion.title')}</ThemedText>

        <ThemedText style={styles.description}>{t('self_exclusion.description')}</ThemedText>

        <View style={styles.questionContainer}>
          <ThemedText style={styles.question}>{t('self_exclusion.question')}</ThemedText>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, { borderColor: colors.border }]}
            onPress={() => handleResponse(true)}
            accessible
            accessibilityLabel={t('common.yes')}
            accessibilityRole="button"
          >
            <ThemedText style={styles.buttonText}>{t('common.yes')}</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.primary }]}
            onPress={() => handleResponse(false)}
            accessible
            accessibilityLabel={t('common.no')}
            accessibilityRole="button"
          >
            <Text style={[styles.buttonText, { color: 'white' }]}>{t('common.no')}</Text>
          </TouchableOpacity>
        </View>

        <ThemedText style={styles.disclaimer}>{t('self_exclusion.disclaimer')}</ThemedText>
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
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  questionContainer: {
    padding: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    marginBottom: 24,
  },
  question: {
    fontSize: 18,
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  button: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    marginHorizontal: 8,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  disclaimer: {
    fontSize: 14,
    textAlign: 'center',
    opacity: 0.7,
  },
});

export default SelfExclusionScreen;
