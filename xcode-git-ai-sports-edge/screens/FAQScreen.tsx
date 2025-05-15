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

  // Parlay-specific FAQ items
  const parlayFaqItems: FAQItem[] = [
    {
      question: "What is a parlay bet?",
      answer: "A parlay bet is a single wager that combines multiple individual bets (called 'legs') into one bet slip. For a parlay to win, all individual selections within it must win. The main appeal of parlays is the potential for much higher payouts compared to placing each bet separately, as the odds for each selection are multiplied together. However, this increased reward comes with significantly higher risk, as just one incorrect selection causes the entire parlay to lose."
    },
    {
      question: "How are parlay odds calculated?",
      answer: "Parlay odds are calculated by multiplying the decimal odds of each individual selection. For example, if you place a 3-leg parlay with odds of 1.91, 2.10, and 1.75, the total parlay odds would be 1.91 × 2.10 × 1.75 = 7.02. This means a $10 stake would return $70.20 (including your stake) if all selections win. For American odds, each selection is first converted to decimal format, multiplied together, and then converted back to American odds. Our app automatically calculates these odds and shows your potential return."
    },
    {
      question: "What is the difference between a parlay and a teaser?",
      answer: "While both parlays and teasers involve multiple selections, a teaser allows you to adjust the point spread or total in your favor in exchange for lower odds. For example, in a 6-point NFL teaser, you might move a -7.5 favorite to -1.5, making it easier for that team to cover the spread. Teasers typically require all selections to be from the same sport and bet type (point spreads or totals). Parlays, on the other hand, maintain the original odds for each selection and can combine different sports and bet types, offering higher potential payouts but with greater risk."
    },
    {
      question: "How does the AI generate parlay suggestions?",
      answer: "Our AI parlay suggestions are generated using a sophisticated machine learning model that analyzes multiple factors: historical team performance, player statistics, recent form, head-to-head matchups, weather conditions, injury reports, and betting market movements. The AI identifies correlations and patterns that human bettors might miss, then combines selections that have a statistical edge and positive expected value. Each suggested parlay is assigned a confidence rating (low, medium, or high) based on the model's certainty level. The system continuously learns from outcomes to improve future suggestions."
    },
    {
      question: "What strategies should I use when betting parlays?",
      answer: "When betting parlays, consider these strategies: 1) Limit the number of legs (2-4 is often optimal) as each additional selection significantly decreases your chances of winning. 2) Avoid including heavy favorites with low odds, as they add substantial risk without much reward. 3) Look for correlated outcomes where one result might positively influence another. 4) Consider using 'round robins' to create multiple smaller parlays from your selections, providing partial wins even if not all picks succeed. 5) Allocate only a small portion of your bankroll (1-3%) to parlay bets, as they should supplement a core strategy of straight bets. 6) Use our AI suggestions as a starting point, but apply your own research and knowledge."
    }
  ];

  // UFC-specific FAQ items
  const ufcFaqItems: FAQItem[] = [
    {
      question: "How are UFC fighter rankings determined?",
      answer: "UFC fighter rankings are determined by a voting panel composed of media members. After each UFC event, the panel submits their rankings for each weight division and pound-for-pound lists. These individual rankings are then averaged to create the official UFC rankings. The rankings take into account factors such as recent performance, quality of opposition, and activity level. Rankings are updated following each UFC event and can significantly impact a fighter's future matchups and title opportunities."
    },
    {
      question: "How does the UFC scoring system work?",
      answer: "The UFC uses the 10-Point Must System adopted from boxing. Under this system, judges score each round with the winner receiving 10 points and the loser typically receiving 9 points or fewer. Points can be deducted for fouls at the referee's discretion. Judges evaluate effective striking/grappling, effective aggression, and octagon control (in that order of importance). Fights are typically three rounds (five minutes each) for regular bouts and five rounds for main events and championship fights. The fighter who wins the majority of rounds on the majority of judges' scorecards wins the fight."
    },
    {
      question: "What are the different UFC weight classes?",
      answer: "The UFC currently has 12 weight classes: Flyweight (125 lbs), Bantamweight (135 lbs), Featherweight (145 lbs), Lightweight (155 lbs), Welterweight (170 lbs), Middleweight (185 lbs), Light Heavyweight (205 lbs), Heavyweight (265 lbs), Women's Strawweight (115 lbs), Women's Flyweight (125 lbs), Women's Bantamweight (135 lbs), and Women's Featherweight (145 lbs). Each weight class has its own champion, and fighters must weigh in at or below the weight limit to compete in a particular division."
    },
    {
      question: "How can I bet on UFC fights?",
      answer: "Betting on UFC fights offers various options: 1) Moneyline bets on which fighter will win, 2) Method of Victory bets on how the fight will end (KO/TKO, submission, or decision), 3) Round bets on which round the fight will end, 4) Over/Under bets on how long the fight will last, and 5) Prop bets on specific outcomes like whether the fight will go the distance. Our app provides AI-powered predictions for UFC fights based on fighter statistics, historical performance, stylistic matchups, and recent form. You can use these insights to place more informed bets through your preferred sportsbook."
    },
    {
      question: "What UFC betting strategies does your AI recommend?",
      answer: "Our AI recommends several UFC betting strategies: 1) Style analysis - identify fighters whose styles create advantages against specific opponents, 2) Line movement tracking - monitor how odds change as fight night approaches to identify value, 3) Underdog hunting - look for experienced underdogs with paths to victory, 4) Prop bet focus - target specific outcomes based on fighter tendencies rather than just picking winners, 5) Parlay construction - combine correlated outcomes like a dominant champion winning by KO with the fight ending under the round total. The AI continuously analyzes fighter data, historical results, and betting patterns to identify profitable opportunities."
    }
  ];

  // Player Prop Bet FAQ items
  const propBetFaqItems: FAQItem[] = [
    {
      question: "What are player prop bets?",
      answer: "Player prop bets (or proposition bets) are wagers on the performance of individual players rather than the overall game outcome. These bets focus on whether a player will achieve specific statistical milestones in a game, such as a basketball player scoring over/under a certain number of points, a quarterback throwing for more/less than a specified yardage total, or a baseball player hitting a home run. Prop bets offer a way to bet on player performance independent of which team wins or loses the game."
    },
    {
      question: "How does AI help with player prop betting?",
      answer: "Our AI analyzes player prop bets by processing vast amounts of data including: historical player performance, recent form, matchup statistics, coaching strategies, playing time trends, injury impacts, and venue effects. The AI identifies patterns and correlations that might be missed by human analysis, then generates predictions with confidence levels for each prop bet. Premium subscribers receive detailed reasoning behind each prediction, including key statistical insights and historical accuracy rates for similar prop bets."
    },
    {
      question: "What types of player props does your app cover?",
      answer: "Our app covers a wide range of player prop bets across multiple sports: In basketball, we analyze points, rebounds, assists, three-pointers, steals, and blocks. For football, we cover passing yards, rushing yards, receiving yards, touchdowns, completions, and receptions. In baseball, we analyze hits, home runs, strikeouts, total bases, and RBIs. For hockey, we cover goals, assists, shots on goal, and saves. Our premium service continuously expands to include additional prop types and sports based on user demand and data availability."
    },
    {
      question: "How accurate are your player prop predictions?",
      answer: "Our player prop predictions typically achieve 54-60% accuracy against the betting line, with variation by sport and prop type. Certain prop categories like NBA points and NFL passing yards have shown higher accuracy (57-62%) due to larger data samples and more consistent player usage patterns. We provide transparency by showing historical accuracy for each prop type, and our premium service includes confidence ratings (low, medium, high) based on the AI's certainty level. The most profitable approach is focusing on props where our AI shows the highest confidence and largest disagreement with the betting line."
    },
    {
      question: "What strategies work best for player prop betting?",
      answer: "For successful player prop betting, we recommend: 1) Focus on player consistency and role - players with stable minutes and defined roles tend to have more predictable outcomes. 2) Research recent defensive matchups - how teams defend specific positions can greatly impact player performance. 3) Monitor news closely - late lineup changes, injury updates, and coaching decisions can dramatically affect prop values. 4) Look for correlation opportunities - certain props may be related (e.g., a quarterback's passing yards and his receiver's receiving yards). 5) Use our AI confidence ratings to prioritize bets, placing larger wagers on high-confidence predictions. 6) Track your results by prop type to identify your strongest categories."
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