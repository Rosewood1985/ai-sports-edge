import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@react-navigation/native';
import { useLanguage } from '../contexts/LanguageContext';

import { AccessibleThemedView } from '../atomic/atoms/AccessibleThemedView';
import { AccessibleThemedText } from '../atomic/atoms/AccessibleThemedText';
import AccessibleTouchableOpacity from '../atomic/atoms/AccessibleTouchableOpacity';

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
# Privacy Policy

**Last Updated: May 18, 2025**

## 1. Introduction

At AI Sports Edge ("we," "us," or "our"), we respect your privacy and are committed to protecting your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile application and website (collectively, the "App").

**PLEASE READ THIS PRIVACY POLICY CAREFULLY.** By accessing or using the App, you acknowledge that you have read, understood, and agree to be bound by this Privacy Policy.

## 2. Information We Collect

### 2.1 Personal Information

We may collect personal information that you voluntarily provide to us when you:
- Create an account
- Subscribe to our services
- Complete forms within the App
- Contact our customer support

This information may include:
- Name
- Email address
- Phone number
- Billing information
- User preferences (favorite teams, players, sports)
- Location data (if permitted)

### 2.2 Automatically Collected Information

When you use our App, we may automatically collect certain information about your device and usage patterns, including:
- Device type, operating system, and browser type
- Mobile device identifiers
- IP address
- App usage data
- Time and date of your visits
- Pages or features you view
- Country and language setting

### 2.3 Analytics and Cookies

We use analytics tools and cookies to understand how users interact with our App, improve user experience, and optimize our services. You can control cookie settings through your browser preferences.

## 3. How We Use Your Information

We use the information we collect for the following purposes:

### 3.1 Provide and Maintain the App
- Deliver the features and functionality of the App
- Process subscriptions and payments
- Authenticate users and secure accounts
- Provide customer support

### 3.2 Personalize User Experience
- Customize content based on your preferences
- Deliver relevant sports information about teams and players you follow
- Adjust notification frequency and content
- Improve recommendations and predictions

### 3.3 Improve Our Services
- Analyze usage patterns to enhance functionality
- Identify and fix technical issues
- Develop new features based on user behavior
- Test and optimize app performance

### 3.4 Communications
- Send administrative notifications about your account
- Provide updates about features or service changes
- Deliver subscription-related information
- Respond to your inquiries

## 4. Our Data Commitment

### 4.1 We Do Not Sell Your Data

**WE WILL NEVER SELL YOUR PERSONAL INFORMATION TO THIRD PARTIES.** Your privacy is paramount to us, and this commitment is a fundamental principle of our business.

### 4.2 Data Sharing

We may share your information only in the following limited circumstances:

- **Service Providers**: We may share information with trusted third-party service providers who assist us in operating, maintaining, and improving our App (such as hosting providers, payment processors, and analytics services). These providers are contractually bound to use the information only for the purposes of providing services to us.

- **Legal Requirements**: We may disclose information if required to do so by law or in the good-faith belief that such action is necessary to comply with legal obligations, protect our rights or safety, investigate fraud, or respond to government requests.

- **Business Transfers**: If we are involved in a merger, acquisition, or sale of all or a portion of our assets, your information may be transferred as part of that transaction. We will notify you via email and/or a prominent notice on our App of any change in ownership or uses of your personal information.

- **With Your Consent**: We may share your information with third parties when you have given us your explicit consent to do so.

## 5. Data Security

We implement appropriate technical and organizational security measures to protect your personal information from unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the Internet or electronic storage is 100% secure, and we cannot guarantee absolute security.

## 6. Data Retention

We will retain your personal information only for as long as necessary to fulfill the purposes outlined in this Privacy Policy, comply with legal obligations, resolve disputes, and enforce our agreements.

## 7. Your Privacy Rights

Depending on your location, you may have certain rights regarding your personal information:

### 7.1 Access and Update
You can access and update your personal information through your account settings in the App.

### 7.2 Data Portability
You may request a copy of your personal information in a structured, commonly used, and machine-readable format.

### 7.3 Deletion
You may request the deletion of your personal information, subject to certain exceptions provided by law.

### 7.4 Opt-Out
You can opt out of marketing communications by following the unsubscribe instructions included in each email or by adjusting your notification preferences in the App.

### 7.5 Additional Rights
Residents of certain jurisdictions (such as the European Economic Area, California, etc.) may have additional rights under applicable data protection laws.

To exercise any of these rights, please contact us using the information provided in Section 10.

## 8. Children's Privacy

Our App is not intended for children under the age of 18. We do not knowingly collect personal information from children under 18. If you become aware that a child has provided us with personal information without parental consent, please contact us, and we will take steps to remove such information and terminate the child's account.

## 9. Changes to This Privacy Policy

We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last Updated" date. You are advised to review this Privacy Policy periodically for any changes. Changes to this Privacy Policy are effective when they are posted on this page.

## 10. Contact Us

If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us at privacy@aisportsedge.app.

---

By using AI Sports Edge, you acknowledge that you have read and understood this Privacy Policy and agree to its terms.
            `);
          } else {
            setContent(`
# Terms of Service

**Last Updated: May 18, 2025**

## 1. Introduction

Welcome to AI Sports Edge. These Terms of Service ("Terms") govern your use of the AI Sports Edge mobile application and website (collectively, the "App") operated by AI Sports Edge, Inc. ("we," "us," or "our").

**PLEASE READ THESE TERMS CAREFULLY.** By downloading, accessing, or using our App, you agree to be bound by these Terms. If you disagree with any part of the Terms, you do not have permission to access the App.

## 2. Eligibility

You must be at least 18 years old to use the App. By using the App, you represent and warrant that you are at least 18 years old and that your use of the App does not violate any applicable laws or regulations.

## 3. Your Account

### 3.1 Account Creation
When you create an account with us, you must provide accurate, complete, and current information. Failure to do so constitutes a breach of the Terms, which may result in immediate termination of your account.

### 3.2 Account Responsibilities
You are responsible for:
- Maintaining the confidentiality of your account credentials
- All activities that occur under your account
- Notifying us immediately of any unauthorized use of your account

We recommend using a strong password and logging out of your account at the end of each session.

## 4. Subscription and Payments

### 4.1 Subscription Options
We offer various subscription plans with different features and pricing. Details of current subscription options are available in the App.

### 4.2 Payment Terms
- All payments are processed through secure third-party payment processors
- Subscription fees are billed in advance on a recurring basis
- Prices are subject to change with notice
- You are responsible for all applicable taxes

### 4.3 Cancellation and Refunds
- You may cancel your subscription at any time through your account settings
- Refunds are provided in accordance with our Refund Policy
- No refunds are provided for partial subscription periods

## 5. User Content

### 5.1 Content Ownership
You retain ownership of any content you submit to the App ("User Content"). By submitting User Content, you grant us a worldwide, non-exclusive, royalty-free license to use, reproduce, modify, adapt, publish, and display such content for the purpose of providing and promoting our services.

### 5.2 Content Restrictions
You agree not to post content that:
- Is illegal, harmful, threatening, abusive, or discriminatory
- Infringes on intellectual property rights
- Contains malware or viruses
- Impersonates another person
- Constitutes unauthorized advertising or spam

## 6. Intellectual Property

### 6.1 Our Intellectual Property
The App, including its content, features, and functionality, is owned by AI Sports Edge and is protected by copyright, trademark, and other intellectual property laws.

### 6.2 Limited License
We grant you a limited, non-exclusive, non-transferable, revocable license to use the App for your personal, non-commercial use.

### 6.3 Restrictions
You may not:
- Modify, adapt, or hack the App
- Use the App for any illegal purpose
- Attempt to gain unauthorized access to any part of the App
- Use the App to build a competitive product
- Copy, distribute, or reproduce any part of the App without permission

## 7. Disclaimers

### 7.1 Sports Information and Predictions
- All sports information, odds, and predictions are provided for entertainment purposes only
- We do not guarantee the accuracy of any information or predictions
- The App is not intended to encourage or facilitate gambling

### 7.2 General Disclaimer
THE APP IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED. WE DISCLAIM ALL WARRANTIES, INCLUDING IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.

## 8. Limitation of Liability

TO THE MAXIMUM EXTENT PERMITTED BY LAW, IN NO EVENT SHALL AI SPORTS EDGE BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING LOSS OF PROFITS, DATA, OR USE, ARISING OUT OF OR RELATED TO YOUR USE OF THE APP, WHETHER BASED ON WARRANTY, CONTRACT, TORT, OR ANY OTHER LEGAL THEORY, AND WHETHER OR NOT WE HAVE BEEN INFORMED OF THE POSSIBILITY OF SUCH DAMAGE.

## 9. Indemnification

You agree to indemnify, defend, and hold harmless AI Sports Edge and its officers, directors, employees, agents, and affiliates from and against any claims, disputes, demands, liabilities, damages, losses, and expenses, including reasonable legal and accounting fees, arising out of or in any way connected with your access to or use of the App or your violation of these Terms.

## 10. Termination

### 10.1 Termination by You
You may terminate your account at any time by following the instructions in the App.

### 10.2 Termination by Us
We may terminate or suspend your account and access to the App immediately, without prior notice or liability, for any reason, including if you breach these Terms.

### 10.3 Effect of Termination
Upon termination, your right to use the App will immediately cease. All provisions of these Terms which by their nature should survive termination shall survive, including ownership provisions, warranty disclaimers, indemnity, and limitations of liability.

## 11. Governing Law

These Terms shall be governed by and construed in accordance with the laws of the State of California, without regard to its conflict of law provisions.

## 12. Dispute Resolution

Any dispute arising from or relating to these Terms or your use of the App shall be resolved through binding arbitration in accordance with the American Arbitration Association's rules. The arbitration shall be conducted in San Francisco, California.

## 13. Changes to Terms

We may update these Terms from time to time. We will notify you of any changes by posting the new Terms on this page and updating the "Last Updated" date. Your continued use of the App after such changes constitutes your acceptance of the new Terms.

## 14. Contact Us

If you have any questions about these Terms, please contact us at legal@aisportsedge.app.

---

By using AI Sports Edge, you acknowledge that you have read and understood these Terms of Service and agree to be bound by them.
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
    <AccessibleThemedView
      style={styles.container}
      accessibilityLabel={t('legal.screen_title')}
      accessibilityRole="none"
    >
      <AccessibleThemedView
        style={[styles.header, { borderBottomColor: colors.border }]}
        accessibilityRole="none"
        accessibilityLabel={t('legal.header_section')}
      >
        <AccessibleTouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          accessibilityLabel={t('common.back')}
          accessibilityRole="button"
          accessibilityHint={t('common.back_to_previous_screen')}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </AccessibleTouchableOpacity>
        <AccessibleThemedText
          style={styles.headerTitle}
          type="h1"
          accessibilityLabel={title}
          accessibilityRole="header"
        >
          {title}
        </AccessibleThemedText>
        <AccessibleThemedView style={styles.headerRight} />
      </AccessibleThemedView>

      {loading ? (
        <AccessibleThemedView
          style={styles.loadingContainer}
          accessibilityLabel={t('common.loading_section')}
        >
          <ActivityIndicator
            size="large"
            color={colors.primary}
            accessibilityLabel={t('common.loading')}
          />
          <AccessibleThemedText
            style={styles.loadingText}
            type="bodyStd"
            accessibilityLabel={t('common.loading')}
            accessibilityRole="text"
          >
            {t('common.loading')}
          </AccessibleThemedText>
        </AccessibleThemedView>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.contentContainer}
          accessibilityLabel={
            type === 'privacy-policy'
              ? t('legal.privacy_policy_content')
              : t('legal.terms_of_service_content')
          }
          accessibilityRole="none"
          accessibilityHint={t('legal.scroll_to_read_content')}
        >
          <AccessibleThemedText
            style={styles.markdownContent}
            type="bodyStd"
            accessibilityLabel={
              type === 'privacy-policy'
                ? t('legal.privacy_policy_content')
                : t('legal.terms_of_service_content')
            }
            accessibilityRole="text"
          >
            {content}
          </AccessibleThemedText>
        </ScrollView>
      )}
    </AccessibleThemedView>
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
