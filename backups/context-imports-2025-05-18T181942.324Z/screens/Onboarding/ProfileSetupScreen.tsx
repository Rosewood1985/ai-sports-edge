import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useTheme } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';

import { useLanguage } from '../../contexts/LanguageContext';
import { OnboardingStackParamList } from '../../navigation/OnboardingNavigator';
import { ThemedText } from '../atomic/atoms/ThemedText';
import { ThemedView } from '../atomic/atoms/ThemedView';

type ProfileSetupScreenNavigationProp = StackNavigationProp<
  OnboardingStackParamList,
  'ProfileSetup'
>;

const ProfileSetupScreen = () => {
  const navigation = useNavigation<ProfileSetupScreenNavigationProp>();
  const { colors } = useTheme();
  const { t } = useLanguage();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [errors, setErrors] = useState<{
    firstName?: string;
    lastName?: string;
    email?: string;
    username?: string;
    password?: string;
    confirmPassword?: string;
  }>({});

  const validateForm = () => {
    const newErrors: {
      firstName?: string;
      lastName?: string;
      email?: string;
      username?: string;
      password?: string;
      confirmPassword?: string;
    } = {};

    if (!firstName.trim()) {
      newErrors.firstName = t('validation.required');
    }

    if (!lastName.trim()) {
      newErrors.lastName = t('validation.required');
    }

    if (!email.trim()) {
      newErrors.email = t('validation.required');
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = t('validation.invalid_email');
    }

    if (!username.trim()) {
      newErrors.username = t('validation.required');
    } else if (username.length < 3) {
      newErrors.username = t('validation.username_too_short');
    }

    if (!password) {
      newErrors.password = t('validation.required');
    } else if (password.length < 8) {
      newErrors.password = t('validation.password_too_short');
    }

    if (password !== confirmPassword) {
      newErrors.confirmPassword = t('validation.passwords_dont_match');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleContinue = () => {
    if (validateForm()) {
      // Save profile data to context or API
      // Then navigate to the next screen
      navigation.navigate('Preferences');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <ThemedView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backButton}
              accessible
              accessibilityLabel={t('navigation.back')}
              accessibilityRole="button"
            >
              <Ionicons name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>
            <ThemedText style={styles.title}>{t('onboarding.profile_setup_title')}</ThemedText>
          </View>

          <ThemedText style={styles.description}>
            {t('onboarding.profile_setup_description')}
          </ThemedText>

          <View style={styles.form}>
            <View style={styles.inputRow}>
              <View style={styles.inputContainer}>
                <ThemedText style={styles.label}>{t('profile.first_name')}</ThemedText>
                <TextInput
                  style={[styles.input, { borderColor: colors.border, color: colors.text }]}
                  value={firstName}
                  onChangeText={setFirstName}
                  placeholder={t('profile.first_name_placeholder')}
                  placeholderTextColor={colors.text + '80'}
                  accessible
                  accessibilityLabel={t('profile.first_name')}
                />
                {errors.firstName && (
                  <ThemedText style={styles.errorText}>{errors.firstName}</ThemedText>
                )}
              </View>

              <View style={styles.inputContainer}>
                <ThemedText style={styles.label}>{t('profile.last_name')}</ThemedText>
                <TextInput
                  style={[styles.input, { borderColor: colors.border, color: colors.text }]}
                  value={lastName}
                  onChangeText={setLastName}
                  placeholder={t('profile.last_name_placeholder')}
                  placeholderTextColor={colors.text + '80'}
                  accessible
                  accessibilityLabel={t('profile.last_name')}
                />
                {errors.lastName && (
                  <ThemedText style={styles.errorText}>{errors.lastName}</ThemedText>
                )}
              </View>
            </View>

            <View style={styles.inputContainer}>
              <ThemedText style={styles.label}>{t('profile.email')}</ThemedText>
              <TextInput
                style={[styles.input, { borderColor: colors.border, color: colors.text }]}
                value={email}
                onChangeText={setEmail}
                placeholder={t('profile.email_placeholder')}
                placeholderTextColor={colors.text + '80'}
                keyboardType="email-address"
                autoCapitalize="none"
                accessible
                accessibilityLabel={t('profile.email')}
              />
              {errors.email && <ThemedText style={styles.errorText}>{errors.email}</ThemedText>}
            </View>

            <View style={styles.inputContainer}>
              <ThemedText style={styles.label}>{t('profile.username')}</ThemedText>
              <TextInput
                style={[styles.input, { borderColor: colors.border, color: colors.text }]}
                value={username}
                onChangeText={setUsername}
                placeholder={t('profile.username_placeholder')}
                placeholderTextColor={colors.text + '80'}
                autoCapitalize="none"
                accessible
                accessibilityLabel={t('profile.username')}
              />
              {errors.username && (
                <ThemedText style={styles.errorText}>{errors.username}</ThemedText>
              )}
            </View>

            <View style={styles.inputContainer}>
              <ThemedText style={styles.label}>{t('profile.password')}</ThemedText>
              <TextInput
                style={[styles.input, { borderColor: colors.border, color: colors.text }]}
                value={password}
                onChangeText={setPassword}
                placeholder={t('profile.password_placeholder')}
                placeholderTextColor={colors.text + '80'}
                secureTextEntry
                accessible
                accessibilityLabel={t('profile.password')}
              />
              {errors.password && (
                <ThemedText style={styles.errorText}>{errors.password}</ThemedText>
              )}
            </View>

            <View style={styles.inputContainer}>
              <ThemedText style={styles.label}>{t('profile.confirm_password')}</ThemedText>
              <TextInput
                style={[styles.input, { borderColor: colors.border, color: colors.text }]}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder={t('profile.confirm_password_placeholder')}
                placeholderTextColor={colors.text + '80'}
                secureTextEntry
                accessible
                accessibilityLabel={t('profile.confirm_password')}
              />
              {errors.confirmPassword && (
                <ThemedText style={styles.errorText}>{errors.confirmPassword}</ThemedText>
              )}
            </View>
          </View>

          <TouchableOpacity
            style={[styles.continueButton, { backgroundColor: colors.primary }]}
            onPress={handleContinue}
            accessible
            accessibilityLabel={t('navigation.continue')}
            accessibilityRole="button"
          >
            <ThemedText style={styles.continueButtonText}>{t('navigation.continue')}</ThemedText>
          </TouchableOpacity>

          <ThemedText style={styles.privacyText}>{t('onboarding.privacy_notice')}</ThemedText>
        </ScrollView>
      </ThemedView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  backButton: {
    marginRight: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  description: {
    fontSize: 16,
    marginBottom: 24,
  },
  form: {
    marginBottom: 24,
  },
  inputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  inputContainer: {
    marginBottom: 16,
    flex: 1,
  },
  label: {
    fontSize: 14,
    marginBottom: 8,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  errorText: {
    color: 'red',
    fontSize: 12,
    marginTop: 4,
  },
  continueButton: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  continueButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  privacyText: {
    fontSize: 12,
    textAlign: 'center',
    opacity: 0.7,
    marginBottom: 24,
  },
});

export default ProfileSetupScreen;
