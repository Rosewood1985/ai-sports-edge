import React, { useState, useEffect } from 'react';
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

interface FAQItem {
  question: string;
  answer: string;
}

/**
 * FAQ Screen component that displays frequently asked questions about AI sports betting
 * @returns {JSX.Element} - Rendered component
 */
const FAQScreen = (): JSX.Element => {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [approvedQuestions, setApprovedQuestions] = useState<FAQQuestion[]>([]);

  // Static FAQ items that are always displayed
  const staticFaqItems: FAQItem[] = [
    {
      question: "How are confidence intervals calculated in AI predictions?",
      answer: "Confidence intervals in our AI predictions are calculated using statistical methods that quantify the uncertainty in our models. We use a combination of historical accuracy, model variance, and Bayesian inference to generate a range within which the true outcome is likely to fall. The narrower the confidence interval, the more certain the AI is about its prediction. These intervals are continuously refined as our models learn from new data and outcomes."
    },
    {
      question: "How are betting odds calculated?",
      answer: "Betting odds are calculated through a complex process that combines bookmakers' statistical models, market forces, and profit margins. Initially, bookmakers assess the true probability of outcomes based on statistical analysis. They then apply a margin (also called 'vig' or 'juice') to ensure profit regardless of the outcome. Market forces like betting volume and public sentiment can further adjust these odds. Our AI system analyzes these odds across multiple bookmakers to identify potential value opportunities where the implied probability differs from our calculated probability."
    },
    {
      question: "What data powers the AI predictions?",
      answer: "Our AI is powered by a comprehensive dataset that includes: historical game results, team and player statistics, injury reports, weather conditions, venue information, coaching changes, travel schedules, rest days between games, head-to-head matchups, and recent form. We also incorporate advanced metrics like expected goals (xG) in soccer or player efficiency ratings in basketball. This data is continuously updated and processed through our machine learning pipeline to generate predictions. The AI also learns from its own prediction history to improve accuracy over time."
    },
    {
      question: "How accurate are AI betting predictions?",
      answer: "The accuracy of our AI betting predictions varies by sport and market type, but we typically achieve 53-58% accuracy on straight bets against the spread, which exceeds the 52.4% breakeven threshold needed for profitability. For moneyline bets, our accuracy ranges from 60-70% depending on the sport, though this includes many favorites with shorter odds. The most important metric isn't raw accuracy but Return on Investment (ROI), where our AI-recommended bets have historically generated 3-7% ROI over large sample sizes. We provide transparent historical performance metrics for all prediction types."
    },
    {
      question: "How should I use AI predictions for my betting strategy?",
      answer: "To effectively use AI predictions in your betting strategy: 1) Focus on value bets where our AI gives a significantly different probability than implied by the odds. 2) Practice proper bankroll management by betting consistent units (typically 1-3% of your bankroll per wager). 3) Track your results to identify which sports or bet types work best for you. 4) Consider the confidence level provided with each prediction—higher confidence predictions warrant larger bets. 5) Shop for the best odds across different sportsbooks to maximize potential returns. 6) Remember that AI predictions are tools to inform your decisions, not guaranteed winners."
    }
  ];

  // Combine static and dynamic FAQ items
  const allFaqItems = [
    ...staticFaqItems,
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
      <Text style={styles.title}>Frequently Asked Questions</Text>
      <Text style={styles.subtitle}>
        Learn more about our AI sports betting predictions
      </Text>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3498db" />
          <Text style={styles.loadingText}>Loading questions...</Text>
        </View>
      ) : (
        <>
          {allFaqItems.map((item, index) => (
            <View key={index} style={styles.faqItem}>
              <TouchableOpacity 
                style={styles.questionContainer} 
                onPress={() => toggleExpand(index)}
                activeOpacity={0.7}
              >
                <Text style={styles.question}>{item.question}</Text>
                <Text style={styles.expandIcon}>
                  {expandedIndex === index ? '−' : '+'}
                </Text>
              </TouchableOpacity>
              
              {expandedIndex === index && (
                <View style={styles.answerContainer}>
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