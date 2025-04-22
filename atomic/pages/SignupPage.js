/**
 * Signup Page
 * 
 * A page component for user registration using the atomic architecture.
 */

import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image } from "react-native";
import { useNavigation } from "@react-navigation/native";

// Import atomic components
import { MainLayout } from "../templates";
import { useTheme } from "../molecules/themeContext";
import { firebaseService } from "../organisms";
import { monitoringService } from "../organisms";

/**
 * Signup Page component
 * @returns {React.ReactNode} Rendered component
 */
const SignupPage = () => {
  // Get theme from context
  const { colors } = useTheme();
  
  // Navigation
  const navigation = useNavigation();
  
  // State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  
  /**
   * Handle signup form submission
   */
  const handleSignup = async () => {
    // Reset error
    setError("");
    
    // Validate passwords match
    if (password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }
    
    try {
      // Set loading state
      setLoading(true);
      
      // Create user with email and password
      await firebaseService.auth.createUserWithEmailAndPassword(email, password);
      
      // Navigate to dashboard on success
      navigation.navigate("Dashboard");
    } catch (err) {
      // Log error
      monitoringService.error.captureException(err);
      
      // Set user-friendly error message
      setError(monitoringService.error.getUserFriendlyMessage(err) || "Signup failed. Please try again.");
    } finally {
      // Reset loading state
      setLoading(false);
    }
  };
  
  // Header component
  const Header = () => (
    <View style={styles.logoContainer}>
      <Image source={require("../../assets/logo.png")} style={styles.logo} />
      <Text style={[styles.title, { color: colors.text }]}>Create Account</Text>
    </View>
  );
  
  // Content component
  const Content = () => (
    <View style={styles.formContainer}>
      {/* Error message */}
      {error ? (
        <View style={[styles.errorContainer, { backgroundColor: colors.error }]}>
          <Text style={[styles.errorText, { color: colors.onError }]}>{error}</Text>
        </View>
      ) : null}
      
      {/* Email input */}
      <View style={styles.formGroup}>
        <Text style={[styles.label, { color: colors.text }]}>Email</Text>
        <TextInput
          style={[styles.input, { 
            backgroundColor: colors.surface,
            color: colors.text,
            borderColor: colors.border
          }]}
          value={email}
          onChangeText={setEmail}
          placeholder="Enter your email"
          placeholderTextColor={colors.textSecondary}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
        />
      </View>
      
      {/* Password input */}
      <View style={styles.formGroup}>
        <Text style={[styles.label, { color: colors.text }]}>Password</Text>
        <TextInput
          style={[styles.input, { 
            backgroundColor: colors.surface,
            color: colors.text,
            borderColor: colors.border
          }]}
          value={password}
          onChangeText={setPassword}
          placeholder="Enter your password"
          placeholderTextColor={colors.textSecondary}
          secureTextEntry
          autoComplete="new-password"
        />
      </View>
      
      {/* Confirm password input */}
      <View style={styles.formGroup}>
        <Text style={[styles.label, { color: colors.text }]}>Confirm Password</Text>
        <TextInput
          style={[styles.input, { 
            backgroundColor: colors.surface,
            color: colors.text,
            borderColor: colors.border
          }]}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          placeholder="Confirm your password"
          placeholderTextColor={colors.textSecondary}
          secureTextEntry
          autoComplete="new-password"
        />
      </View>
      
      {/* Signup button */}
      <TouchableOpacity
        style={[styles.button, { backgroundColor: colors.primary }]}
        onPress={handleSignup}
        disabled={loading}
      >
        <Text style={[styles.buttonText, { color: colors.onPrimary }]}>
          {loading ? "Creating Account..." : "Sign Up"}
        </Text>
      </TouchableOpacity>
      
      {/* Login link */}
      <View style={styles.linksContainer}>
        <TouchableOpacity onPress={() => navigation.navigate("Login")}>
          <Text style={[styles.link, { color: colors.primary }]}>
            Already have an account? Sign in
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
  
  // Render page using MainLayout template
  return (
    <MainLayout
      header={<Header />}
      scrollable={true}
      safeArea={true}
    >
      <Content />
    </MainLayout>
  );
};

// Styles
const styles = StyleSheet.create({
  logoContainer: {
    alignItems: "center",
    marginBottom: 24,
  },
  logo: {
    width: 80,
    height: 80,
    resizeMode: "contain",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 16,
  },
  formContainer: {
    padding: 24,
  },
  errorContainer: {
    padding: 12,
    borderRadius: 4,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 14,
    fontWeight: "500",
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 8,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  button: {
    height: 48,
    borderRadius: 4,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "bold",
  },
  linksContainer: {
    marginTop: 24,
    alignItems: "center",
  },
  link: {
    fontSize: 14,
    fontWeight: "500",
  },
});

export default SignupPage;