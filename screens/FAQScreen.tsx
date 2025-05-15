import { firebaseService } from '../src/atomic/organisms/firebaseService';
import 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator
} from 'react-native';
import QuestionSubmissionForm from '../components/QuestionSubmissionForm';
import { getApprovedQuestions, FAQQuestion } from '../services/faqService';
import { Timestamp } from 'firebase/firestore';
import { useI18n } from '../contexts/I18nContext';

interface FAQItem {
  question: string;
  answer: string;
}

/**
 * FAQ Screen component that displays frequently asked questions about AI sports betting
 * @returns {JSX.Element} - Rendered component
 */
const FAQScreen = (): JSX.Element => {
  const { t, language } = useI18n();
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [approvedQuestions, setApprovedQuestions] = useState<FAQQuestion[]>([]);

  // Static FAQ items that are always displayed
  const staticFaqItems: FAQItem[] = [
    {
      question: t('faq.items.general.confidenceIntervals.question'),
      answer: t('faq.items.general.confidenceIntervals.answer')
    },
    {
      question: t('faq.items.general.oddsCalculation.question'),
      answer: t('faq.items.general.oddsCalculation.answer')
    },
    {
      question: t('faq.items.general.aiData.question'),
      answer: t('faq.items.general.aiData.answer')
    },
    {
      question: t('faq.items.general.aiAccuracy.question'),
      answer: t('faq.items.general.aiAccuracy.answer')
    },
    {
      question: t('faq.items.general.bettingStrategy.question'),
      answer: t('faq.items.general.bettingStrategy.answer')
    }
  ];

  // Parlay-specific FAQ items
  const parlayFaqItems: FAQItem[] = [
    {
      question: t('faq.items.parlays.whatIs.question'),
      answer: t('faq.items.parlays.whatIs.answer')
    },
    {
      question: t('faq.items.parlays.oddsCalculation.question'),
      answer: t('faq.items.parlays.oddsCalculation.answer')
    },
    {
      question: t('faq.items.parlays.teaserDifference.question'),
      answer: t('faq.items.parlays.teaserDifference.answer')
    },
    {
      question: t('faq.items.parlays.aiGeneration.question'),
      answer: t('faq.items.parlays.aiGeneration.answer')
    },
    {
      question: t('faq.items.parlays.strategies.question'),
      answer: t('faq.items.parlays.strategies.answer')
    }
  ];

  // UFC-specific FAQ items
  const ufcFaqItems: FAQItem[] = [
    {
      question: t('faq.items.ufc.rankings.question'),
      answer: t('faq.items.ufc.rankings.answer')
    },
    {
      question: t('faq.items.ufc.scoring.question'),
      answer: t('faq.items.ufc.scoring.answer')
    },
    {
      question: t('faq.items.ufc.weightClasses.question'),
      answer: t('faq.items.ufc.weightClasses.answer')
    },
    {
      question: t('faq.items.ufc.betting.question'),
      answer: t('faq.items.ufc.betting.answer')
    },
    {
      question: t('faq.items.ufc.aiStrategies.question'),
      answer: t('faq.items.ufc.aiStrategies.answer')
    }
  ];

  // Player Prop Bet FAQ items
  const propBetFaqItems: FAQItem[] = [
    {
      question: t('faq.items.propBets.whatAre.question'),
      answer: t('faq.items.propBets.whatAre.answer')
    },
    {
      question: t('faq.items.propBets.aiHelp.question'),
      answer: t('faq.items.propBets.aiHelp.answer')
    },
    {
      question: t('faq.items.propBets.types.question'),
      answer: t('faq.items.propBets.types.answer')
    },
    {
      question: t('faq.items.propBets.accuracy.question'),
      answer: t('faq.items.propBets.accuracy.answer')
    },
    {
      question: t('faq.items.propBets.strategies.question'),
      answer: t('faq.items.propBets.strategies.answer')
    }
  ];

  // Combine static and dynamic FAQ items
  const allFaqItems = [
    ...staticFaqItems,
    ...parlayFaqItems,
    ...ufcFaqItems,
    ...propBetFaqItems,
    ...approvedQuestions.map(q => ({
      question: q.question,
      answer: q.answer || ''
    }))
  ];

  const toggleExpand = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index);
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
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          colors={['#3498db']}
        />
      }
    >
      <Text style={styles.title}>{t('faq.title')}</Text>
      <Text style={styles.subtitle}>
        {t('faq.subtitle')}
      </Text>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3498db" />
          <Text style={styles.loadingText}>{t('faq.loading')}</Text>
        </View>
      ) : (
        <>
          {allFaqItems.map((item, index) => (
            <View key={index} style={styles.faqItem}>
              <TouchableOpacity
                style={styles.questionContainer}
                onPress={() => toggleExpand(index)}
                activeOpacity={0.7}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel={item.question}
                accessibilityHint={t('faq.accessibility.questionHint')}
                accessibilityState={{ expanded: expandedIndex === index }}
              >
                <Text style={styles.question}>{item.question}</Text>
                <Text style={styles.expandIcon}>
                  {expandedIndex === index ? '−' : '+'}
                </Text>
              </TouchableOpacity>
              
              {expandedIndex === index && (
                <View
                  style={styles.answerContainer}
                  accessible={true}
                  accessibilityRole="text"
                  accessibilityLabel={`${t('faq.accessibility.answer')}: ${item.answer}`}
                >
                  <Text style={styles.answer}>{item.answer}</Text>
                </View>
              )}
            </View>
          ))}
        </>
      )}

      {/* Question submission form */}
      <QuestionSubmissionForm onQuestionSubmitted={handleQuestionSubmitted} />
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