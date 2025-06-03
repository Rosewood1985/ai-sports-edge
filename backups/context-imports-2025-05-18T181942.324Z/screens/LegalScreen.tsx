import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation, RouteProp, useTheme } from '@react-navigation/native';
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';

import { ThemedText } from '../atomic/atoms/ThemedText';
import { ThemedView } from '../atomic/atoms/ThemedView';
import { useLanguage } from '../contexts/LanguageContext';

// Define route params type
type LegalScreenParams = {
  type: 'privacy-policy' | 'terms-of-service';
};

/**
 * A screen that displays legal content such as Privacy Policy or Terms of Service.
 * The content is loaded from markdown files in the docs directory.
 */
const LegalScreen = () => {
  const route = useRoute<RouteProp<Record<string, LegalScreenParams>, string>>();
  const navigation = useNavigation();
  const { colors } = useTheme();
  const { t } = useLanguage();
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(true);

  // Get the type of legal document to display from route params
  const { type = 'privacy-policy' } = route.params || {};

  // Set the title based on the type
  const title = type === 'privacy-policy' ? t('legal.privacy_policy') : t('legal.terms_of_service');

  // Load the content
  useEffect(() => {
    const loadContent = async () => {
      try {
        setLoading(true);

        // In a real app, this would load the content from a markdown file or API
        // For now, we'll just simulate loading with a timeout
        setTimeout(() => {
          // Set the content based on the type
          if (type === 'privacy-policy') {
            setContent(`
# AI Sports Edge Privacy Policy

**Effective Date: March 23, 2025**

## Introduction

AI Sports Edge ("we," "our," or "us") respects your privacy and is committed to protecting your personal data. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile application (the "App").

Please read this Privacy Policy carefully. If you do not agree with the terms of this Privacy Policy, please do not access the App.

## Data We Collect

### Information You Provide to Us

- **Account Information**: When you create an account, we collect your email address, username, and password.
- **Profile Information**: You may choose to provide additional information such as your name, profile picture, favorite teams, and sports preferences.
- **Transaction Information**: If you make purchases through the App, we collect payment information, transaction history, and billing details.
- **User Content**: Information you provide when using the App, such as comments, messages, and interactions with other users.
- **Communications**: If you contact our support team, we collect the communications and information provided in those interactions.

### Information Automatically Collected

- **Device Information**: We collect information about your mobile device, including device model, operating system, unique device identifiers, IP address, mobile network information, and mobile operating system.
- **Usage Data**: We collect information about how you use the App, including the features you use, time spent on the App, pages viewed, and interactions with content.
- **Location Information**: With your permission, we may collect precise or approximate location information from your device.

[Full Privacy Policy available at https://aisportsedge.com/privacy-policy]
            `);
          } else {
            setContent(`
# AI Sports Edge Terms of Service

**Effective Date: March 23, 2025**

## Introduction

Welcome to AI Sports Edge. These Terms of Service ("Terms") govern your use of the AI Sports Edge mobile application (the "App") operated by AI Sports Edge, Inc. ("we," "us," or "our").

By downloading, accessing, or using our App, you agree to be bound by these Terms. If you disagree with any part of the Terms, you do not have permission to access the App.

## Eligibility

You must be at least 13 years old to use the App. By using the App, you represent and warrant that you are at least 13 years old and that your use of the App does not violate any applicable laws or regulations.

## Your Account

### Account Creation

When you create an account with us, you must provide accurate, complete, and current information. Failure to do so constitutes a breach of the Terms, which may result in immediate termination of your account.

### Account Responsibilities

You are responsible for safeguarding the password that you use to access the App and for any activities or actions under your password. We encourage you to use a strong password and to log out of your account at the end of each session.

[Full Terms of Service available at https://aisportsedge.com/terms-of-service]
            `);
          }

          setLoading(false);
        }, 500);
      } catch (error) {
        console.error('Error loading legal content:', error);
        setLoading(false);
      }
    };

    loadContent();
  }, [type]);

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle}>{title}</ThemedText>
        <View style={styles.headerRight} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <ThemedText style={styles.loadingText}>{t('common.loading')}</ThemedText>
        </View>
      ) : (
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
          <ThemedText style={styles.markdownContent}>{content}</ThemedText>
        </ScrollView>
      )}
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerRight: {
    width: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  markdownContent: {
    fontSize: 16,
    lineHeight: 24,
  },
});

export default LegalScreen;
