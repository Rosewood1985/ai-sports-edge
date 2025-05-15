import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  Alert,
  ActivityIndicator
} from 'react-native';
import { FAQQuestion, approveQuestion, rejectQuestion, editQuestion } from '../services/faqService';

interface PendingQuestionItemProps {
  question: FAQQuestion;
  onQuestionUpdated: () => void;
}

/**
 * Component for displaying and managing a pending question
 * @param {PendingQuestionItemProps} props - Component props
 * @returns {JSX.Element} - Rendered component
 */
const PendingQuestionItem = ({ 
  question, 
  onQuestionUpdated 
}: PendingQuestionItemProps): JSX.Element => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedQuestion, setEditedQuestion] = useState(question.question);
  const [answer, setAnswer] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSaveEdit = async () => {
    if (!editedQuestion.trim()) {
      Alert.alert('Error', 'Question cannot be empty');
      return;
    }

    setIsLoading(true);
    try {
      await editQuestion(question.id!, editedQuestion);
      setIsEditing(false);
      onQuestionUpdated();
    } catch (error) {
      console.error('Error editing question:', error);
      Alert.alert('Error', 'Failed to edit question');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setEditedQuestion(question.question);
    setIsEditing(false);
  };

  const handleApprove = async () => {
    if (!answer.trim()) {
      Alert.alert('Error', 'Please provide an answer before approving');
      return;
    }

    setIsLoading(true);
    try {
      await approveQuestion(question.id!, answer);
      Alert.alert('Success', 'Question approved and added to FAQ');
      onQuestionUpdated();
    } catch (error) {
      console.error('Error approving question:', error);
      Alert.alert('Error', 'Failed to approve question');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReject = async () => {
    Alert.alert(
      'Confirm Rejection',
      'Are you sure you want to reject this question?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Reject', 
          style: 'destructive',
          onPress: async () => {
            setIsLoading(true);
            try {
              await rejectQuestion(question.id!);
              Alert.alert('Success', 'Question rejected');
              onQuestionUpdated();
            } catch (error) {
              console.error('Error rejecting question:', error);
              Alert.alert('Error', 'Failed to reject question');
            } finally {
              setIsLoading(false);
            }
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#3498db" />
        </View>
      )}
      
      <View style={styles.header}>
        <Text style={styles.submittedBy}>
          Submitted by: {question.userEmail || 'Anonymous'}
        </Text>
        <Text style={styles.date}>
          {question.createdAt?.toDate().toLocaleDateString()}
        </Text>
      </View>
      
      {isEditing ? (
        <View style={styles.editContainer}>
          <TextInput
            style={styles.editInput}
            value={editedQuestion}
            onChangeText={setEditedQuestion}
            multiline
            numberOfLines={3}
          />
          <View style={styles.editButtonsRow}>
            <TouchableOpacity 
              style={[styles.editButton, styles.cancelButton]} 
              onPress={handleCancelEdit}
            >
              <Text style={styles.editButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.editButton} 
              onPress={handleSaveEdit}
            >
              <Text style={styles.editButtonText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.questionContainer}>
          <Text style={styles.questionText}>{question.question}</Text>
          <TouchableOpacity 
            style={styles.editIconButton} 
            onPress={handleEdit}
          >
            <Text style={styles.editIcon}>✏️</Text>
          </TouchableOpacity>
        </View>
      )}
      
      <TextInput
        style={styles.answerInput}
        placeholder="Write an answer..."
        value={answer}
        onChangeText={setAnswer}
        multiline
        numberOfLines={4}
      />
      
      <View style={styles.buttonsContainer}>
        <TouchableOpacity 
          style={[styles.button, styles.rejectButton]} 
          onPress={handleReject}
        >
          <Text style={styles.buttonText}>Reject</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[
            styles.button, 
            styles.approveButton,
            !answer.trim() && styles.disabledButton
          ]} 
          onPress={handleApprove}
          disabled={!answer.trim()}
        >
          <Text style={styles.buttonText}>Approve</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    position: 'relative',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    borderRadius: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  submittedBy: {
    fontSize: 12,
    color: '#666',
  },
  date: {
    fontSize: 12,
    color: '#666',
  },
  questionContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  questionText: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
    color: '#333',
  },
  editIconButton: {
    padding: 4,
  },
  editIcon: {
    fontSize: 16,
  },
  editContainer: {
    marginBottom: 16,
  },
  editInput: {
    borderWidth: 1,
    borderColor: '#3498db',
    borderRadius: 4,
    padding: 8,
    fontSize: 16,
    backgroundColor: '#f8f9fa',
  },
  editButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  editButton: {
    backgroundColor: '#3498db',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
    marginLeft: 8,
  },
  cancelButton: {
    backgroundColor: '#6c757d',
  },
  editButtonText: {
    color: '#fff',
    fontSize: 14,
  },
  answerInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 4,
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  rejectButton: {
    backgroundColor: '#e74c3c',
  },
  approveButton: {
    backgroundColor: '#2ecc71',
  },
  disabledButton: {
    backgroundColor: '#95a5a6',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});

export default PendingQuestionItem;