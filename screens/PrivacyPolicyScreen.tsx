/**
 * Privacy Policy Screen
 *
 * This screen displays the full Privacy Policy document for AI Sports Edge
 */

import React from 'react';
import { 
  ScrollView, 
  Text, 
  View, 
  StyleSheet, 
  SafeAreaView,
  TouchableOpacity 
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useThemeColor } from '../hooks/useThemeColor';
import { useTranslation } from '../hooks/useTranslation';

const PrivacyPolicyScreen: React.FC = () => {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const textColor = useThemeColor({}, 'text');
  const backgroundColor = useThemeColor({}, 'background');

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={[styles.backButtonText, { color: textColor }]}>
            {t('common.back')}
          </Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: textColor }]}>
          {t('auth.privacy_policy')}
        </Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={true}>
        <Text style={[styles.title, { color: textColor }]}>
          AI Sports Edge Privacy Policy
        </Text>
        
        <Text style={[styles.effectiveDate, { color: textColor }]}>
          Effective Date: May 20, 2025
        </Text>

        <Text style={[styles.companyName, { color: textColor }]}>
          AI Sports Edge, Inkwell General Store, LLC
        </Text>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>
            Introduction
          </Text>
          <Text style={[styles.sectionContent, { color: textColor }]}>
            AI Sports Edge ("we," "our," or "us") respects your privacy and is committed to protecting your personal data. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile application (the "App").
          </Text>
          <Text style={[styles.sectionContent, { color: textColor }]}>
            Please read this Privacy Policy carefully. If you do not agree with the terms of this Privacy Policy, please do not access the App.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>
            Data We Collect
          </Text>
          
          <Text style={[styles.subsectionTitle, { color: textColor }]}>
            Information You Provide to Us
          </Text>
          <Text style={[styles.sectionContent, { color: textColor }]}>
            • Account Information: When you create an account, we collect your email address, username, and password.{'\n'}
            • Profile Information: You may choose to provide additional information such as your name, profile picture, favorite teams, and sports preferences.{'\n'}
            • Transaction Information: If you make purchases through the App, we collect payment information, transaction history, and billing details.{'\n'}
            • User Content: Information you provide when using the App, such as comments, messages, and interactions with other users.{'\n'}
            • Communications: If you contact our support team, we collect the communications and information provided in those interactions.
          </Text>

          <Text style={[styles.subsectionTitle, { color: textColor }]}>
            Information Automatically Collected
          </Text>
          <Text style={[styles.sectionContent, { color: textColor }]}>
            • Device Information: We collect information about your mobile device, including device model, operating system, unique device identifiers, IP address, mobile network information, and mobile operating system.{'\n'}
            • Usage Data: We collect information about how you use the App, including the features you use, time spent on the App, pages viewed, and interactions with content.{'\n'}
            • Location Information: With your permission, we may collect precise or approximate location information from your device.
          </Text>

          <Text style={[styles.subsectionTitle, { color: textColor }]}>
            Information from Third Parties
          </Text>
          <Text style={[styles.sectionContent, { color: textColor }]}>
            • Social Media: If you choose to link your social media accounts, we may collect information from those accounts.{'\n'}
            • Sports Data Providers: We collect sports statistics, game information, and other sports-related data from third-party data providers.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>
            How We Use Your Information
          </Text>
          <Text style={[styles.sectionContent, { color: textColor }]}>
            We use the information we collect for the following purposes:{'\n\n'}
            • Provide and Improve the App: To operate, maintain, and enhance the features and functionality of the App.{'\n'}
            • Personalization: To personalize your experience, including tailoring content and recommendations based on your preferences.{'\n'}
            • Analytics: To understand how users interact with our App, improve our services, and develop new features.{'\n'}
            • Communications: To communicate with you about the App, respond to your inquiries, and send you important notices.{'\n'}
            • Marketing: With your consent, to send you promotional materials and information about new features.{'\n'}
            • Security and Fraud Prevention: To detect, prevent, and address technical issues, security breaches, and fraudulent activities.{'\n'}
            • Legal Compliance: To comply with applicable laws, regulations, and legal processes.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>
            Data Sharing and Disclosure
          </Text>
          <Text style={[styles.sectionContent, { color: textColor }]}>
            We may share your information with the following categories of third parties:{'\n\n'}
            • Service Providers: Companies that perform services on our behalf, such as hosting, data analysis, payment processing, customer service, and marketing assistance.{'\n'}
            • Business Partners: Sports data providers, analytics partners, and advertising networks that help us deliver and improve the App.{'\n'}
            • Legal Requirements: When required by law, subpoena, or other legal process, or if we have a good faith belief that disclosure is necessary to protect our rights, your safety, or the safety of others.{'\n'}
            • Business Transfers: If we are involved in a merger, acquisition, or sale of all or a portion of our assets, your information may be transferred as part of that transaction.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>
            Your Privacy Choices
          </Text>
          
          <Text style={[styles.subsectionTitle, { color: textColor }]}>
            App Tracking Transparency
          </Text>
          <Text style={[styles.sectionContent, { color: textColor }]}>
            In accordance with Apple's AppTrackingTransparency framework, we will request your permission before tracking your activity across other companies' apps and websites for the purpose of advertising or sharing your data with data brokers. You can change your tracking preferences at any time in your device's settings.
          </Text>

          <Text style={[styles.subsectionTitle, { color: textColor }]}>
            Access and Control
          </Text>
          <Text style={[styles.sectionContent, { color: textColor }]}>
            You can access and update your personal information through your account settings in the App. You may also:{'\n\n'}
            • Delete Your Account: You can request to delete your account by contacting us at privacy@aisportsedge.com.{'\n'}
            • Opt-Out of Marketing Communications: You can opt out of receiving promotional emails by following the unsubscribe instructions in those emails or by adjusting your notification settings in the App.{'\n'}
            • Location Data: You can control location permissions through your device settings.{'\n'}
            • Push Notifications: You can manage push notification permissions through your device settings.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>
            Data Security
          </Text>
          <Text style={[styles.sectionContent, { color: textColor }]}>
            We implement appropriate technical and organizational measures to protect the security of your personal information. However, please be aware that no method of transmission over the internet or electronic storage is 100% secure, and we cannot guarantee absolute security.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>
            Children's Privacy
          </Text>
          <Text style={[styles.sectionContent, { color: textColor }]}>
            Our App is not directed to children under the age of 18, and we do not knowingly collect personal information from children under 18. If we learn that we have collected personal information from a child under 18, we will promptly delete that information. The age restriction is in place due to the nature of sports odds content provided in the App.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>
            Your California Privacy Rights
          </Text>
          <Text style={[styles.sectionContent, { color: textColor }]}>
            If you are a California resident, you have specific rights regarding your personal information under the California Consumer Privacy Act (CCPA). For more information, please see our California Privacy Notice.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>
            Your European Privacy Rights
          </Text>
          <Text style={[styles.sectionContent, { color: textColor }]}>
            If you are located in the European Economic Area (EEA), United Kingdom, or Switzerland, you have certain rights under applicable data protection laws. For more information, please see our European Privacy Notice.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>
            Contact Us
          </Text>
          <Text style={[styles.sectionContent, { color: textColor }]}>
            If you have questions or concerns about this Privacy Policy, please contact us at:{'\n\n'}
            Email: privacy@aisportsedge.com{'\n'}
            Address: AI Sports Edge, Inkwell General Store, LLC, 456 Innovation Drive, Baltimore, MD 21201
          </Text>
        </View>

        <View style={styles.lastUpdated}>
          <Text style={[styles.lastUpdatedText, { color: textColor }]}>
            Last updated: May 20, 2025
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    paddingRight: 16,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  effectiveDate: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    textAlign: 'center',
  },
  companyName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 24,
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  subsectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  sectionContent: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  lastUpdated: {
    marginTop: 32,
    marginBottom: 32,
    alignItems: 'center',
  },
  lastUpdatedText: {
    fontSize: 12,
    fontStyle: 'italic',
  },
});

export default PrivacyPolicyScreen;