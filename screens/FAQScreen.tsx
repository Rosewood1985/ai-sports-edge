import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, ParamListBase, NavigationProp } from '@react-navigation/native';
import QuestionSubmissionForm from '../components/QuestionSubmissionForm';
import { getApprovedQuestions, FAQQuestion } from '../services/faqService';
import { Timestamp } from 'firebase/firestore';
import { useLanguage } from '../contexts/LanguageContext';
import { AccessibleThemedText } from '../atomic/atoms/AccessibleThemedText';
import { AccessibleThemedView } from '../atomic/atoms/AccessibleThemedView';
import { AccessibleTouchableOpacity } from '../atomic/atoms/AccessibleTouchableOpacity';

// Define navigation params for type safety
type RootStackParamList = ParamListBase & {
  LegalScreen: { type: 'privacy-policy' | 'terms-of-service' };
};

interface FAQItem {
  question: string;
  answer: string;
}

/**
 * FAQ Screen component that displays frequently asked questions about AI sports betting
 * @returns {JSX.Element} - Rendered component
 */
const FAQScreen = (): JSX.Element => {
  const { t, language } = useLanguage();
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [approvedQuestions, setApprovedQuestions] = useState<FAQQuestion[]>([]);

  // Static FAQ items that are always displayed
  const staticFaqItems: FAQItem[] = [
    {
      question: t('faq.items.general.confidenceIntervals.question'),
      answer: t('faq.items.general.confidenceIntervals.answer'),
    },
    {
      question: t('faq.items.general.oddsCalculation.question'),
      answer: t('faq.items.general.oddsCalculation.answer'),
    },
    {
      question: t('faq.items.general.aiData.question'),
      answer: t('faq.items.general.aiData.answer'),
    },
    {
      question: t('faq.items.general.aiAccuracy.question'),
      answer: t('faq.items.general.aiAccuracy.answer'),
    },
    {
      question: t('faq.items.general.bettingStrategy.question'),
      answer: t('faq.items.general.bettingStrategy.answer'),
    },
  ];

  // Parlay-specific FAQ items
  const parlayFaqItems: FAQItem[] = [
    {
      question: t('faq.items.parlays.whatIs.question'),
      answer: t('faq.items.parlays.whatIs.answer'),
    },
    {
      question: t('faq.items.parlays.oddsCalculation.question'),
      answer: t('faq.items.parlays.oddsCalculation.answer'),
    },
    {
      question: t('faq.items.parlays.teaserDifference.question'),
      answer: t('faq.items.parlays.teaserDifference.answer'),
    },
    {
      question: t('faq.items.parlays.aiGeneration.question'),
      answer: t('faq.items.parlays.aiGeneration.answer'),
    },
    {
      question: t('faq.items.parlays.strategies.question'),
      answer: t('faq.items.parlays.strategies.answer'),
    },
  ];

  // UFC-specific FAQ items
  const ufcFaqItems: FAQItem[] = [
    {
      question: t('faq.items.ufc.rankings.question'),
      answer: t('faq.items.ufc.rankings.answer'),
    },
    {
      question: t('faq.items.ufc.scoring.question'),
      answer: t('faq.items.ufc.scoring.answer'),
    },
    {
      question: t('faq.items.ufc.weightClasses.question'),
      answer: t('faq.items.ufc.weightClasses.answer'),
    },
    {
      question: t('faq.items.ufc.betting.question'),
      answer: t('faq.items.ufc.betting.answer'),
    },
    {
      question: t('faq.items.ufc.aiStrategies.question'),
      answer: t('faq.items.ufc.aiStrategies.answer'),
    },
  ];

  // Legal & Compliance FAQ items
  const legalFaqItems: FAQItem[] = [
    {
      question: 'How is my personal data used?',
      answer:
        'AI Sports Edge collects and processes personal data in accordance with our Privacy Policy. We collect information such as your account details, device information, and usage patterns to provide and improve our services. We never sell your personal data to third parties. For complete details on data collection, usage, and your rights, please review our ' +
        'Privacy Policy.',
    },
    {
      question: 'Can I request deletion of my data?',
      answer:
        'Yes, you have the right to request deletion of your personal data. You can initiate this process through your account settings or by contacting our support team. Please note that some information may be retained for legal or operational purposes. For more information about your data rights, please refer to our Privacy Policy.',
    },
    {
      question: 'What are the terms for using AI Sports Edge?',
      answer:
        'When using AI Sports Edge, you agree to our Terms of Service which outline your rights and responsibilities as a user. This includes eligibility requirements, account responsibilities, subscription terms, content restrictions, and intellectual property rights. For the complete terms governing your use of our app, please review our Terms of Service.',
    },
    {
      question: 'How do I report terms violations?',
      answer:
        'If you believe someone is violating our Terms of Service, you can report it by contacting our support team at support@aisportsedge.app. Please provide specific details about the violation to help us investigate properly. We take all reports seriously and will address them according to our Terms of Service guidelines.',
    },
    {
      question: 'What is your refund policy?',
      answer:
        'Our refund policy is outlined in our Terms of Service. Generally, subscription payments are non-refundable, but we may provide refunds in certain circumstances at our discretion. For specific questions about refunds, please contact our support team with your account details and the reason for your refund request.',
    },
  ];

  // Player Prop Bet FAQ items
  const propBetFaqItems: FAQItem[] = [
    {
      question: t('faq.items.propBets.whatAre.question'),
      answer: t('faq.items.propBets.whatAre.answer'),
    },
    {
      question: t('faq.items.propBets.aiHelp.question'),
      answer: t('faq.items.propBets.aiHelp.answer'),
    },
    {
      question: t('faq.items.propBets.types.question'),
      answer: t('faq.items.propBets.types.answer'),
    },
    {
      question: t('faq.items.propBets.accuracy.question'),
      answer: t('faq.items.propBets.accuracy.answer'),
    },
    {
      question: t('faq.items.propBets.strategies.question'),
      answer: t('faq.items.propBets.strategies.answer'),
    },
  ];

  // Combine static and dynamic FAQ items
  const allFaqItems = [
    ...staticFaqItems,
    ...parlayFaqItems,
    ...ufcFaqItems,
    ...propBetFaqItems,
    ...legalFaqItems,
    ...approvedQuestions.map(q => ({
      question: q.question,
      answer: q.answer || '',
    })),
  ];

  const toggleExpand = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  // Function to render answer text with clickable links
  const renderAnswerWithLinks = (text: string) => {
    const privacyPolicyRegex = /Privacy Policy/g;
    const termsOfServiceRegex = /Terms of Service/g;

    // Replace Privacy Policy with clickable link
    let parts = text.split(privacyPolicyRegex);
    let result: (string | JSX.Element)[] = [];

    for (let i = 0; i < parts.length; i++) {
      result.push(parts[i]);
      if (i < parts.length - 1) {
        result.push(
          <AccessibleThemedText
            key={`privacy-${i}`}
            style={styles.link}
            type="bodyStd"
            onPress={() => navigation.navigate('LegalScreen', { type: 'privacy-policy' })}
            accessible={true}
            accessibilityRole="link"
            accessibilityLabel={t('legal.privacy_policy')}
            accessibilityHint={t('faq.accessibility.linkHint')}
          >
            Privacy Policy
          </AccessibleThemedText>
        );
      }
    }

    // Convert result to string for Terms of Service replacement
    let combinedText = '';
    result.forEach(item => {
      if (typeof item === 'string') {
        combinedText += item;
      } else {
        combinedText += 'Privacy Policy';
      }
    });

    // Replace Terms of Service with clickable link
    parts = combinedText.split(termsOfServiceRegex);
    let finalResult: (string | JSX.Element)[] = [];

    for (let i = 0; i < parts.length; i++) {
      if (typeof parts[i] === 'string') {
        // Process each part to replace Privacy Policy placeholders with the actual components
        let subParts = parts[i].split('Privacy Policy');
        for (let j = 0; j < subParts.length; j++) {
          finalResult.push(subParts[j]);
          if (j < subParts.length - 1) {
            // Find the corresponding Privacy Policy component
            let privacyIndex = result.findIndex(
              (item, idx) => typeof item !== 'string' && idx > finalResult.length - 1
            );
            if (privacyIndex !== -1) {
              finalResult.push(result[privacyIndex]);
            }
          }
        }
      }

      if (i < parts.length - 1) {
        finalResult.push(
          <AccessibleThemedText
            key={`terms-${i}`}
            style={styles.link}
            type="bodyStd"
            onPress={() => navigation.navigate('LegalScreen', { type: 'terms-of-service' })}
            accessible={true}
            accessibilityRole="link"
            accessibilityLabel={t('legal.terms_of_service')}
            accessibilityHint={t('faq.accessibility.linkHint')}
          >
            Terms of Service
          </AccessibleThemedText>
        );
      }
    }

    return <>{finalResult}</>;
  };

  const loadApprovedQuestions = async () => {
    try {
      const questions = await getApprovedQuestions();
      setApprovedQuestions(questions);
    } catch (error) {
      console.error('Error loading approved questions:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadApprovedQuestions();
  };

  const handleQuestionSubmitted = () => {
    // Refresh the list of approved questions after submission
    loadApprovedQuestions();
  };

  useEffect(() => {
    loadApprovedQuestions();
  }, []);

  return (
    <AccessibleThemedView style={styles.container} accessibilityLabel={t('faq.screen_title')}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={['#3498db']} />
        }
        accessibilityLabel={t('faq.scroll_container')}
      >
        <AccessibleThemedText style={styles.title} type="h1" accessibilityLabel={t('faq.title')}>
          {t('faq.title')}
        </AccessibleThemedText>
        <AccessibleThemedText
          style={styles.subtitle}
          type="bodyStd"
          accessibilityLabel={t('faq.subtitle')}
        >
          {t('faq.subtitle')}
        </AccessibleThemedText>

        {loading ? (
          <AccessibleThemedView
            style={styles.loadingContainer}
            accessibilityLabel={t('faq.loading_container')}
          >
            <ActivityIndicator size="large" color="#3498db" />
            <AccessibleThemedText
              style={styles.loadingText}
              type="bodyStd"
              accessibilityLabel={t('faq.loading')}
            >
              {t('faq.loading')}
            </AccessibleThemedText>
          </AccessibleThemedView>
        ) : (
          <>
            {allFaqItems.map((item, index) => (
              <AccessibleThemedView
                key={index}
                style={styles.faqItem}
                accessibilityLabel={`${t('faq.accessibility.faq_item')}: ${item.question}`}
              >
                <AccessibleTouchableOpacity
                  style={styles.questionContainer}
                  onPress={() => toggleExpand(index)}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel={item.question}
                  accessibilityHint={t('faq.accessibility.questionHint')}
                  accessibilityState={{ expanded: expandedIndex === index }}
                >
                  <AccessibleThemedText
                    style={styles.question}
                    type="h2"
                    accessibilityLabel={item.question}
                  >
                    {item.question}
                  </AccessibleThemedText>
                  <AccessibleThemedText
                    style={styles.expandIcon}
                    type="bodyStd"
                    accessibilityLabel={
                      expandedIndex === index
                        ? t('faq.accessibility.collapse')
                        : t('faq.accessibility.expand')
                    }
                  >
                    {expandedIndex === index ? '−' : '+'}
                  </AccessibleThemedText>
                </AccessibleTouchableOpacity>

                {expandedIndex === index && (
                  <AccessibleThemedView
                    style={styles.answerContainer}
                    accessibilityRole="text"
                    accessibilityLabel={`${t('faq.accessibility.answer')}: ${item.answer}`}
                  >
                    <AccessibleThemedText
                      style={styles.answer}
                      type="bodyStd"
                      accessibilityLabel={item.answer}
                    >
                      {item.answer.includes('Privacy Policy') ||
                      item.answer.includes('Terms of Service')
                        ? renderAnswerWithLinks(item.answer)
                        : item.answer}
                    </AccessibleThemedText>
                  </AccessibleThemedView>
                )}
              </AccessibleThemedView>
            ))}
          </>
        )}

        {/* Question submission form */}
        <QuestionSubmissionForm onQuestionSubmitted={handleQuestionSubmitted} />
      </ScrollView>
    </AccessibleThemedView>
  );
};

const styles = StyleSheet.create({
  link: {
    color: '#3498db',
    textDecorationLine: 'underline',
    fontWeight: '500',
  },
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollView: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  faqItem: {
    marginBottom: 16,
    borderRadius: 8,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    overflow: 'hidden',
  },
  questionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  question: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    color: '#2c3e50',
  },
  expandIcon: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3498db',
    marginLeft: 8,
  },
  answerContainer: {
    padding: 16,
    paddingTop: 0,
    backgroundColor: '#f8f9fa',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  answer: {
    fontSize: 15,
    lineHeight: 22,
    color: '#555',
  },
});

export default FAQScreen;
