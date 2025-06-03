import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

/**
 * RefundPolicyScreen component displays the cancellation and refund policy
 * @returns {JSX.Element} - Rendered component
 */
const RefundPolicyScreen = (): JSX.Element => {
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Cancellation & Refund Policy</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Subscription Cancellation</Text>
        <Text style={styles.paragraph}>
          You may cancel your subscription at any time through the Subscription Management screen in
          the app. Upon cancellation, your subscription will remain active until the end of your
          current billing period.
        </Text>
        <Text style={styles.paragraph}>
          No partial refunds will be issued for unused portions of your subscription period.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Refund Policy</Text>
        <Text style={styles.paragraph}>
          <Text style={styles.bold}>Monthly Subscriptions:</Text> We do not provide refunds for
          monthly subscriptions. If you cancel, you will have access to premium features until the
          end of your current billing period.
        </Text>
        <Text style={styles.paragraph}>
          <Text style={styles.bold}>Weekend Pass:</Text> Due to the short-term nature of this
          purchase, Weekend Passes are non-refundable once activated.
        </Text>
        <Text style={styles.paragraph}>
          <Text style={styles.bold}>Pay-Per-Prediction:</Text> Individual prediction purchases are
          non-refundable once the prediction has been delivered.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Exceptional Circumstances</Text>
        <Text style={styles.paragraph}>
          In exceptional circumstances, such as technical issues preventing access to our services,
          we may consider refund requests on a case-by-case basis.
        </Text>
        <Text style={styles.paragraph}>
          To request a refund in such cases, please contact our support team at
          support@aisportsedge.com with your account details and a description of the issue.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Changes to This Policy</Text>
        <Text style={styles.paragraph}>
          We reserve the right to modify this policy at any time. Changes will be effective
          immediately upon posting to the app. Your continued use of our services after any changes
          indicates your acceptance of the new terms.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Contact Us</Text>
        <Text style={styles.paragraph}>
          If you have any questions about our Cancellation & Refund Policy, please contact us at:
        </Text>
        <Text style={styles.contactInfo}>Email: support@aisportsedge.com</Text>
        <Text style={styles.contactInfo}>Phone: (555) 123-4567</Text>
      </View>

      <Text style={styles.lastUpdated}>Last Updated: March 15, 2025</Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f8f9fa',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  paragraph: {
    fontSize: 14,
    lineHeight: 22,
    color: '#555',
    marginBottom: 12,
  },
  bold: {
    fontWeight: 'bold',
  },
  contactInfo: {
    fontSize: 14,
    lineHeight: 22,
    color: '#3498db',
    marginBottom: 4,
  },
  lastUpdated: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
});

export default RefundPolicyScreen;
