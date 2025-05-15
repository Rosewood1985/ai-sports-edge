import { firebaseService } from '../src/atomic/organisms/firebaseService';
import 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  ActivityIndicator, 
  RefreshControl,
  Alert
} from 'react-native';
import { getPendingQuestions, FAQQuestion } from '../services/faqService';
import PendingQuestionItem from '../components/PendingQuestionItem';
import EmptyState from '../components/EmptyState';
import { auth } from '../config/firebase';
import { useNavigation } from '@react-navigation/native';

/**
 * Admin screen for moderating FAQ questions
 * @returns {JSX.Element} - Rendered component
 */
const FAQModerationScreen = (): JSX.Element => {
  const [pendingQuestions, setPendingQuestions] = useState<FAQQuestion[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const navigation = useNavigation();

  // Check if user is admin (in a real app, this would be a more robust check)
  const checkAdminAccess = () => {
    const user = auth.currentUser;
    if (!user) {
      Alert.alert(
        'Access Denied',
        'You must be logged in to access the moderation dashboard.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
      return false;
    }
    
    // In a real app, you would check admin status in Firestore or Firebase Auth claims
    // For this example, we'll just check if the email contains "admin"
    const isAdmin = user.email?.includes('admin') || false;
    
    if (!isAdmin) {
      Alert.alert(
        'Access Denied',
        'You do not have permission to access the moderation dashboard.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
      return false;
    }
    
    return true;
  };

  const loadPendingQuestions = async () => {
    if (!checkAdminAccess()) return;
    
    try {
      const questions = await getPendingQuestions();
      setPendingQuestions(questions);
    } catch (error) {
      console.error('Error loading pending questions:', error);
      Alert.alert('Error', 'Failed to load pending questions');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadPendingQuestions();
  };

  const handleQuestionUpdated = () => {
    // Refresh the list of pending questions after an update
    loadPendingQuestions();
  };

  useEffect(() => {
    loadPendingQuestions();
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3498db" />
        <Text style={styles.loadingText}>Loading pending questions...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>FAQ Moderation Dashboard</Text>
      <Text style={styles.subtitle}>
        Review and manage submitted questions
      </Text>
      
      <FlatList
        data={pendingQuestions}
        keyExtractor={(item) => item.id || Math.random().toString()}
        renderItem={({ item }) => (
          <PendingQuestionItem 
            question={item} 
            onQuestionUpdated={handleQuestionUpdated} 
          />
        )}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#3498db']}
          />
        }
        ListEmptyComponent={
          <EmptyState 
            message="No pending questions to review" 
            style={styles.emptyState}
          />
        }
        contentContainerStyle={
          pendingQuestions.length === 0 ? { flex: 1 } : { paddingBottom: 20 }
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
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
  emptyState: {
    flex: 1,
    justifyContent: 'center',
  }
});

export default FAQModerationScreen;