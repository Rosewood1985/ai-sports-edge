import React, { useState } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { submitQuestion } from '../../../services/faqService';
import { auth } from '../../../config/firebase';
import { useI18n } from '../../organisms/i18n/I18nContext';
import { useUITheme } from '../../providers/UIThemeProvider';
import { ThemedText } from '../../atoms/ThemedText';
import { ThemedButton } from '../../atoms/ThemedButton';

interface QuestionSubmissionFormProps {
  onQuestionSubmitted?: () => void;
}

/**
 * Component for submitting new FAQ questions
 * Enhanced with atomic design principles and theme integration
 */
const QuestionSubmissionForm: React.FC<QuestionSubmissionFormProps> = ({
  onQuestionSubmitted
}) => {
  const { t } = useI18n();
  const { theme } = useUITheme();
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
      Alert.alert(
        t('faq.form.successTitle'),
        t('faq.form.successMessage'),
        [{ text: t('personalization.alerts.ok') }]
      );
      
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

  const dynamicStyles = StyleSheet.create({
    container: {
      backgroundColor: theme.colors.surfaceBackground,
      padding: theme.spacing.md,
      borderRadius: theme.borderRadius.md,
      marginVertical: theme.spacing.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    input: {
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: theme.borderRadius.sm,
      padding: theme.spacing.sm,
      fontSize: theme.typography.fontSize.body,
      minHeight: 100,
      textAlignVertical: 'top',
      color: theme.colors.text,
      fontFamily: theme.typography.fontFamily.body,
    },
  });

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={dynamicStyles.container}
    >
      <ThemedText 
        variant="h3" 
        style={{ marginBottom: theme.spacing.xs }}
      >
        {t('faq.form.title')}
      </ThemedText>
      
      <ThemedText 
        variant="body" 
        style={{ 
          opacity: 0.7,
          marginBottom: theme.spacing.md 
        }}
      >
        {t('faq.form.subtitle')}
      </ThemedText>
      
      <TextInput
        style={dynamicStyles.input}
        placeholder={t('faq.form.placeholder')}
        placeholderTextColor={theme.colors.textSecondary}
        value={question}
        onChangeText={setQuestion}
        multiline
        numberOfLines={3}
        maxLength={300}
        accessible={true}
        accessibilityLabel={t('faq.accessibility.questionInput')}
        accessibilityHint={t('faq.accessibility.questionInputHint')}
      />
      
      <ThemedText 
        variant="caption" 
        style={{
          textAlign: 'right',
          marginTop: theme.spacing.xs,
          opacity: 0.6
        }}
      >
        {question.length}/300 {t('faq.form.charCount')}
      </ThemedText>
      
      <ThemedButton
        variant="primary"
        size="medium"
        title={t('faq.form.submit')}
        onPress={handleSubmit}
        disabled={!question.trim() || isSubmitting}
        loading={isSubmitting}
        style={{ marginTop: theme.spacing.md }}
        accessibilityLabel={t('faq.accessibility.submitButton')}
        accessibilityHint={t('faq.accessibility.submitButtonHint')}
      />
      
      <ThemedText 
        variant="caption" 
        style={{
          textAlign: 'center',
          marginTop: theme.spacing.md,
          opacity: 0.6
        }}
      >
        {t('faq.form.disclaimer')}
      </ThemedText>
    </KeyboardAvoidingView>
  );
};

export default QuestionSubmissionForm;