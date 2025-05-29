/**
 * Terms of Service Screen
 *
 * This screen displays the full Terms of Service document for AI Sports Edge
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

const TermsOfServiceScreen: React.FC = () => {
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
          {t('auth.terms_and_conditions')}
        </Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={true}>
        <Text style={[styles.title, { color: textColor }]}>
          AI Sports Edge Terms of Service
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
            Welcome to AI Sports Edge. These Terms of Service ("Terms") govern your use of the AI Sports Edge mobile application (the "App") operated by AI Sports Edge, Inc. ("we," "us," or "our").
          </Text>
          <Text style={[styles.sectionContent, { color: textColor }]}>
            By downloading, accessing, or using our App, you agree to be bound by these Terms. If you disagree with any part of the Terms, you do not have permission to access the App.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>
            Sports Predictions Disclaimer
          </Text>
          <Text style={[styles.disclaimerContent, { color: textColor }]}>
            AI Sports Edge provides sports-related statistical predictions and analytics for informational purposes only. Our predictions and analytics:
          </Text>
          <Text style={[styles.sectionContent, { color: textColor }]}>
            • Are NOT intended for gambling purposes{'\n'}
            • Are NOT guarantees of any outcome{'\n'}
            • Are based on statistical models with inherent limitations{'\n'}
            • Should NOT be the sole basis for any financial decisions{'\n'}
            • May not account for all variables that can affect sporting events
          </Text>
          <Text style={[styles.sectionContent, { color: textColor }]}>
            We make no representations or warranties about the accuracy, completeness, or reliability of any predictions or analytics provided through the App. Users should exercise their own judgment when interpreting and using our predictions and analytics.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>
            Eligibility
          </Text>
          <Text style={[styles.sectionContent, { color: textColor }]}>
            You must be at least 18 years old to use the App. By using the App, you represent and warrant that you are at least 18 years old and that your use of the App does not violate any applicable laws or regulations. The age restriction is in place due to the nature of sports odds content provided in the App.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>
            Your Account
          </Text>
          
          <Text style={[styles.subsectionTitle, { color: textColor }]}>
            Account Creation
          </Text>
          <Text style={[styles.sectionContent, { color: textColor }]}>
            When you create an account with us, you must provide accurate, complete, and current information. Failure to do so constitutes a breach of the Terms, which may result in immediate termination of your account.
          </Text>

          <Text style={[styles.subsectionTitle, { color: textColor }]}>
            Account Responsibilities
          </Text>
          <Text style={[styles.sectionContent, { color: textColor }]}>
            You are responsible for safeguarding the password that you use to access the App and for any activities or actions under your password. We encourage you to use a strong password and to log out of your account at the end of each session.
          </Text>

          <Text style={[styles.subsectionTitle, { color: textColor }]}>
            Account Termination
          </Text>
          <Text style={[styles.sectionContent, { color: textColor }]}>
            We reserve the right to suspend or terminate your account and refuse any and all current or future use of the App for any reason at any time.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>
            User Content
          </Text>
          
          <Text style={[styles.subsectionTitle, { color: textColor }]}>
            Content Ownership
          </Text>
          <Text style={[styles.sectionContent, { color: textColor }]}>
            You retain all rights to any content you submit, post, or display on or through the App ("User Content"). By submitting User Content, you grant us a worldwide, non-exclusive, royalty-free license to use, copy, modify, create derivative works based on, distribute, publicly display, publicly perform, and otherwise use the User Content in connection with operating and providing the App.
          </Text>

          <Text style={[styles.subsectionTitle, { color: textColor }]}>
            Content Restrictions
          </Text>
          <Text style={[styles.sectionContent, { color: textColor }]}>
            You agree not to post User Content that is unlawful, harmful, threatening, abusive, harassing, defamatory, vulgar, obscene, or invasive of another's privacy.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>
            Subscription and Payments
          </Text>
          
          <Text style={[styles.subsectionTitle, { color: textColor }]}>
            Subscription Terms
          </Text>
          <Text style={[styles.sectionContent, { color: textColor }]}>
            Some features of the App may require a subscription. By subscribing to these features, you agree to pay the applicable fees as they become due. Subscriptions automatically renew unless auto-renew is turned off at least 24 hours before the end of the current period.
          </Text>

          <Text style={[styles.subsectionTitle, { color: textColor }]}>
            Free Trials
          </Text>
          <Text style={[styles.sectionContent, { color: textColor }]}>
            We may offer free trials of our subscription services. When we do, we will inform you of the length of the trial period and the date when payment will be charged if you do not cancel.
          </Text>

          <Text style={[styles.subsectionTitle, { color: textColor }]}>
            Refunds
          </Text>
          <Text style={[styles.sectionContent, { color: textColor }]}>
            All purchases are final and non-refundable, except as required by applicable law.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>
            Microtransactions
          </Text>
          
          <Text style={[styles.subsectionTitle, { color: textColor }]}>
            Virtual Items
          </Text>
          <Text style={[styles.sectionContent, { color: textColor }]}>
            The App may include virtual items or features that can be purchased with real money. These virtual items are not redeemable for cash or other consideration from us.
          </Text>

          <Text style={[styles.subsectionTitle, { color: textColor }]}>
            Purchase Authorization
          </Text>
          <Text style={[styles.sectionContent, { color: textColor }]}>
            You authorize us to charge the payment method you provide for all purchases you make. You represent and warrant that you have the legal right to use any payment method you provide.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>
            Intellectual Property
          </Text>
          <Text style={[styles.sectionContent, { color: textColor }]}>
            The App and its original content, features, and functionality are and will remain the exclusive property of AI Sports Edge and its licensors. The App is protected by copyright, trademark, and other laws.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>
            Disclaimer of Warranties
          </Text>
          <Text style={[styles.disclaimerContent, { color: textColor }]}>
            THE APP IS PROVIDED ON AN "AS IS" AND "AS AVAILABLE" BASIS. WE DISCLAIM ALL WARRANTIES OF ANY KIND, WHETHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>
            Limitation of Liability
          </Text>
          <Text style={[styles.disclaimerContent, { color: textColor }]}>
            IN NO EVENT SHALL WE BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING WITHOUT LIMITATION, LOSS OF PROFITS, DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>
            Governing Law
          </Text>
          <Text style={[styles.sectionContent, { color: textColor }]}>
            These Terms shall be governed by and construed in accordance with the laws of the State of Maryland, USA, without regard to its conflict of law provisions.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>
            Changes to Terms
          </Text>
          <Text style={[styles.sectionContent, { color: textColor }]}>
            We reserve the right to modify or replace these Terms at any time. If a revision is material, we will provide at least 30 days' notice prior to any new terms taking effect.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>
            Contact Us
          </Text>
          <Text style={[styles.sectionContent, { color: textColor }]}>
            If you have any questions about these Terms, please contact us at:{'\n\n'}
            Email: legal@aisportsedge.com{'\n'}
            Address: AI Sports Edge, 123 Tech Lane, San Francisco, CA 94107
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
  disclaimerContent: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
    fontWeight: '500',
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

export default TermsOfServiceScreen;