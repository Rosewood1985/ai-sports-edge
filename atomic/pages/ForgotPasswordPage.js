/**
 * Forgot Password Page
 * 
 * A page component for password reset using the atomic architecture.
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
 * Forgot Password Page component
 * @returns {React.ReactNode} Rendered component
 */
const ForgotPasswordPage = () => {
  // Get theme from context
  const { colors } = useTheme();
  
  // Navigation
  const navigation = useNavigation();
  
  // State
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  
  /**
   * Handle password reset form submission
   */
  const handleReset = async () => {
    // Reset messages
    setMessage("");
    setError("");
    
    try {
      // Set loading state
      setLoading(true);
      
      // Send password reset email
      await firebaseService.auth.sendPasswordResetEmail(email);
      
      // Set success message
      setMessage("Check your inbox for the reset link.");
    } catch (err) {
      // Log error
      monitoringService.error.captureException(err);
      
      // Set user-friendly error message
      setError(monitoringService.error.getUserFriendlyMessage(err) || "Failed to send reset email. Please try again.");
    } finally {
      // Reset loading state
      setLoading(false);
    }
  };
  
  // Header component
  const Header = () => (
    <View style={styles.logoContainer}>
      <Image source={require("../../assets/logo.png")} style={styles.logo} />
      <Text style={[styles.title, { color: colors.text }]}>Reset Password</Text>
    </View>
  );
  
  // Content component
  const Content = () => (
    <View style={styles.formContainer}>
      {/* Success message */}
      {message ? (
        <View style={[styles.messageContainer, { backgroundColor: colors.success }]}>
          <Text style={[styles.messageText, { color: colors.onSuccess }]}>{message}</Text>
        </View>
      ) : null}
      
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
      
      {/* Reset button */}
      <TouchableOpacity
        style={[styles.button, { backgroundColor: colors.primary }]}
        onPress={handleReset}
        disabled={loading}
      >
        <Text style={[styles.buttonText, { color: colors.onPrimary }]}>
          {loading ? "Sending..." : "Send Reset Email"}
        </Text>
      </TouchableOpacity>
      
      {/* Login link */}
      <View style={styles.linksContainer}>
        <TouchableOpacity onPress={() => navigation.navigate("Login")}>
          <Text style={[styles.link, { color: colors.primary }]}>
            Back to login
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
  messageContainer: {
    padding: 12,
    borderRadius: 4,
    marginBottom: 16,
  },
  messageText: {
    fontSize: 14,
    fontWeight: "500",
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

export default ForgotPasswordPage;