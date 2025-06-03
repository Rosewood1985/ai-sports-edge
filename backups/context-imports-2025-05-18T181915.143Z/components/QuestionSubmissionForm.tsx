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
  Platform,
} from 'react-native';

import { auth } from '../config/firebase';
import { useI18n } from '../contexts/I18nContext';
import { submitQuestion } from '../services/faqService';

interface QuestionSubmissionFormProps {
  onQuestionSubmitted?: () => void;
}

/**
 * Component for submitting new FAQ questions
 * @param {QuestionSubmissionFormProps} props - Component props
 * @returns {JSX.Element} - Rendered component
 */
const QuestionSubmissionForm = ({
  onQuestionSubmitted,
}: QuestionSubmissionFormProps): JSX.Element => {
  const { t } = useI18n();
  const [question, setQuestion] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!question.trim()) {
      Alert.alert(t('faq.form.errorTitle'), t('faq.form.errorEmpty'));
      return;
    }

    setIsSubmitting(true);
    try {
      // Get current user email if logged in
      const userEmail = auth.currentUser?.email || undefined;

      await submitQuestion(question, userEmail);

      // Show success alert
      Alert.alert(t('faq.form.successTitle'), t('faq.form.successMessage'), [
        { text: t('personalization.alerts.ok') },
      ]);

      // Clear form
      setQuestion('');

      // Notify parent component
      if (onQuestionSubmitted) {
        onQuestionSubmitted();
      }
    } catch (error) {
      console.error('Error submitting question:', error);
      Alert.alert(t('faq.form.errorTitle'), t('faq.form.errorSubmit'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <Text style={styles.title}>{t('faq.form.title')}</Text>
      <Text style={styles.subtitle}>{t('faq.form.subtitle')}</Text>

      <TextInput
        style={styles.input}
        placeholder={t('faq.form.placeholder')}
        value={question}
        onChangeText={setQuestion}
        multiline
        numberOfLines={3}
        maxLength={300}
        accessible
        accessibilityLabel={t('faq.accessibility.questionInput')}
        accessibilityHint={t('faq.accessibility.questionInputHint')}
      />

      <Text style={styles.charCount}>
        {question.length}/300 {t('faq.form.charCount')}
      </Text>

      <TouchableOpacity
        style={[styles.submitButton, (!question.trim() || isSubmitting) && styles.disabledButton]}
        onPress={handleSubmit}
        disabled={!question.trim() || isSubmitting}
        accessible
        accessibilityRole="button"
        accessibilityLabel={t('faq.accessibility.submitButton')}
        accessibilityHint={t('faq.accessibility.submitButtonHint')}
        accessibilityState={{ disabled: !question.trim() || isSubmitting }}
      >
        {isSubmitting ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text style={styles.submitButtonText}>{t('faq.form.submit')}</Text>
        )}
      </TouchableOpacity>

      <Text style={styles.disclaimer}>{t('faq.form.disclaimer')}</Text>
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
