import React, { useState } from 'react';
import { 
  View, 
  TextInput, 
  StyleSheet, 
  TouchableOpacity, 
  Text, 
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { submitQuestion } from '../services/faqService';
import { auth } from '../config/firebase';

interface QuestionSubmissionFormProps {
  onQuestionSubmitted?: () => void;
}

/**
 * Component for submitting new FAQ questions
 * @param {QuestionSubmissionFormProps} props - Component props
 * @returns {JSX.Element} - Rendered component
 */
const QuestionSubmissionForm = ({ 
  onQuestionSubmitted 
}: QuestionSubmissionFormProps): JSX.Element => {
  const [question, setQuestion] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!question.trim()) {
      Alert.alert('Error', 'Please enter a question');
      return;
    }

    setIsSubmitting(true);
    try {
      // Get current user email if logged in
      const userEmail = auth.currentUser?.email || undefined;
      
      await submitQuestion(question, userEmail);
      
      // Show success alert
      Alert.alert(
        'Question Submitted',
        'Your question has been submitted for review. Once approved, it will appear in the FAQ.',
        [{ text: 'OK' }]
      );
      
      // Clear form
      setQuestion('');
      
      // Notify parent component
      if (onQuestionSubmitted) {
        onQuestionSubmitted();
      }
    } catch (error) {
      console.error('Error submitting question:', error);
      Alert.alert('Error', 'Failed to submit your question. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <Text style={styles.title}>Ask a Question</Text>
      <Text style={styles.subtitle}>
        Have a question about sports betting or our AI predictions? Submit it here and our team will answer it.
      </Text>
      
      <TextInput
        style={styles.input}
        placeholder="Type your question here..."
        value={question}
        onChangeText={setQuestion}
        multiline
        numberOfLines={3}
        maxLength={300}
      />
      
      <Text style={styles.charCount}>
        {question.length}/300 characters
      </Text>
      
      <TouchableOpacity 
        style={[
          styles.submitButton, 
          (!question.trim() || isSubmitting) && styles.disabledButton
        ]}
        onPress={handleSubmit}
        disabled={!question.trim() || isSubmitting}
      >
        {isSubmitting ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text style={styles.submitButtonText}>Submit Question</Text>
        )}
      </TouchableOpacity>
      
      <Text style={styles.disclaimer}>
        Questions are reviewed by our team before being added to the FAQ.
      </Text>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
    marginVertical: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ced4da',
    borderRadius: 4,
    padding: 12,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 12,
    color: '#6c757d',
    textAlign: 'right',
    marginTop: 4,
  },
  submitButton: {
    backgroundColor: '#3498db',
    borderRadius: 4,
    padding: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  disabledButton: {
    backgroundColor: '#a0c4de',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  disclaimer: {
    fontSize: 12,
    color: '#6c757d',
    textAlign: 'center',
    marginTop: 16,
  },
});

export default QuestionSubmissionForm;