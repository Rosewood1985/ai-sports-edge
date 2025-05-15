// External imports
import React, { memo, useCallback, useMemo, useState } from 'react';
import { useNavigation } from '@react-navigation/native';

import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image } from 'react-native';



// Internal imports
import { MainLayout } from '../templates';
import { firebaseService } from '../organisms';
import { monitoringService } from '../organisms';
import { useTheme } from '../molecules/themeContext';




























              backgroundColor: colors.surface,
              backgroundColor: colors.surface,
              backgroundColor: colors.surface,
              borderColor: colors.border,
              borderColor: colors.border,
              borderColor: colors.border,
              color: colors.text,
              color: colors.text,
              color: colors.text,
            Already have an account? Sign in
            styles.input,
            styles.input,
            styles.input,
            {
            {
            {
            },
            },
            },
          </Text>
          <Text style={[styles.errorText, { color: colors.onError }]}>{error}</Text>
          <Text style={[styles.link, { color: colors.primary }]}>
          ]}
          ]}
          ]}
          autoCapitalize="none"
          autoComplete="email"
          autoComplete="new-password"
          autoComplete="new-password"
          keyboardType="email-address"
          onChangeText={setConfirmPassword}
          onChangeText={setEmail}
          onChangeText={setPassword}
          placeholder="Confirm your password"
          placeholder="Enter your email"
          placeholder="Enter your password"
          placeholderTextColor={colors.textSecondary}
          placeholderTextColor={colors.textSecondary}
          placeholderTextColor={colors.textSecondary}
          secureTextEntry
          secureTextEntry
          style={[
          style={[
          style={[
          value={confirmPassword}
          value={email}
          value={password}
          {loading ? 'Creating Account...' : 'Sign Up'}
        />
        />
        />
        </Text>
        </TouchableOpacity>
        </View>
        <Text style={[styles.buttonText, { color: colors.onPrimary }]}>
        <Text style={[styles.label, { color: colors.text }]}>Confirm Password</Text>
        <Text style={[styles.label, { color: colors.text }]}>Email</Text>
        <Text style={[styles.label, { color: colors.text }]}>Password</Text>
        <TextInput
        <TextInput
        <TextInput
        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
        <View style={[styles.errorContainer, { backgroundColor: colors.error }]}>
        disabled={loading}
        monitoringService.error.getUserFriendlyMessage(err) || 'Signup failed. Please try again.'
        onPress={handleSignup}
        style={[styles.button, { backgroundColor: colors.primary }]}
      ) : null}
      );
      // Create user with email and password
      // Log error
      // Navigate to dashboard on success
      // Reset loading state
      // Set loading state
      // Set user-friendly error message
      </TouchableOpacity>
      </View>
      </View>
      </View>
      </View>
      <Content />
      <Image source={require('../../assets/logo.png')} style={styles.logo} />
      <Text style={[styles.title, { color: colors.text }]}>Create Account</Text>
      <TouchableOpacity
      <View style={styles.formGroup}>
      <View style={styles.formGroup}>
      <View style={styles.formGroup}>
      <View style={styles.linksContainer}>
      >
      await firebaseService.auth.createUserWithEmailAndPassword(email, password);
      monitoringService.error.captureException(err);
      navigation.navigate('Dashboard');
      return;
      setError(
      setError("Passwords don't match.");
      setLoading(false);
      setLoading(true);
      {/* Confirm password input */}
      {/* Email input */}
      {/* Error message */}
      {/* Login link */}
      {/* Password input */}
      {/* Signup button */}
      {error ? (
    // Reset error
    // Validate passwords match
    </MainLayout>
    </View>
    </View>
    <MainLayout header={<Header />} scrollable={true} safeArea={true}>
    <View style={styles.formContainer}>
    <View style={styles.logoContainer}>
    alignItems: 'center',
    alignItems: 'center',
    alignItems: 'center',
    borderRadius: 4,
    borderRadius: 4,
    borderRadius: 4,
    borderWidth: 1,
    fontSize: 14,
    fontSize: 14,
    fontSize: 16,
    fontSize: 16,
    fontSize: 16,
    fontSize: 24,
    fontWeight: '500',
    fontWeight: '500',
    fontWeight: '500',
    fontWeight: 'bold',
    fontWeight: 'bold',
    height: 48,
    height: 48,
    height: 80,
    if (password !== confirmPassword) {
    justifyContent: 'center',
    marginBottom: 16,
    marginBottom: 16,
    marginBottom: 24,
    marginBottom: 8,
    marginTop: 16,
    marginTop: 24,
    marginTop: 8,
    padding: 12,
    padding: 24,
    paddingHorizontal: 12,
    resizeMode: 'contain',
    setError('');
    try {
    width: 80,
    }
    }
    } catch (err) {
    } finally {
   * Handle signup form submission
   */
  );
  );
  );
  /**
  // Content component
  // Get theme from context
  // Header component
  // Navigation
  // Render page using MainLayout template
  // State
  button: {
  buttonText: {
  const Content = () => (
  const Header = () => (
  const [confirmPassword, setConfirmPassword] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState('');
  const handleSignup = async () => {
  const navigation = useNavigation();
  const { colors } = useTheme();
  errorContainer: {
  errorText: {
  formContainer: {
  formGroup: {
  input: {
  label: {
  link: {
  linksContainer: {
  logo: {
  logoContainer: {
  return (
  title: {
  },
  },
  },
  },
  },
  },
  },
  },
  },
  },
  },
  },
  },
  };
 *
 * @returns {React.ReactNode} Rendered component
 * A page component for user registration using the atomic architecture.
 * Signup Page
 * Signup Page component
 */
 */
/**
/**
// External imports
// Import atomic components
// Internal imports
// Styles
const SignupPage = () => {
const styles = StyleSheet.create({
export default memo(SignupPage);
});
};

