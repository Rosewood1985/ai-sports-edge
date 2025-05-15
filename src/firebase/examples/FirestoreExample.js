import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, FlatList, StyleSheet, Alert } from 'react-native';
import { 
  createDocument, 
  getDocument, 
  updateDocument, 
  deleteDocument, 
  queryDocuments,
  subscribeToQuery,
  getServerTimestamp
} from '../firestore';

/**
 * Example component demonstrating Firebase Firestore
 * This is for reference only and not intended for production use
 */
const FirestoreExample = () => {
  const [notes, setNotes] = useState([]);
  const [noteText, setNoteText] = useState('');
  const [selectedNote, setSelectedNote] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // Collection name for this example
  const COLLECTION_NAME = 'notes';

  // Load notes on component mount and set up real-time listener
  useEffect(() => {
    loadNotes();
    
    // Set up real-time subscription
    const unsubscribe = subscribeToQuery(
      COLLECTION_NAME,
      [{ field: 'archived', operator: '==', value: false }],
      [{ field: 'createdAt', direction: 'desc' }],
      50,
      (result) => {
        if (result.error) {
          console.error('Error in subscription:', result.error);
        } else {
          setNotes(result.documents);
        }
      }
    );
    
    // Clean up subscription on unmount
    return () => unsubscribe();
  }, []);

  // Load notes from Firestore
  const loadNotes = async () => {
    setLoading(true);
    
    const result = await queryDocuments(
      COLLECTION_NAME,
      [{ field: 'archived', operator: '==', value: false }],
      [{ field: 'createdAt', direction: 'desc' }]
    );
    
    setLoading(false);
    
    if (result.error) {
      Alert.alert('Error', `Failed to load notes: ${result.error}`);
    } else {
      setNotes(result.documents);
    }
  };

  // Add a new note
  const addNote = async () => {
    if (!noteText.trim()) {
      Alert.alert('Error', 'Please enter note text');
      return;
    }
    
    setLoading(true);
    
    const noteData = {
      text: noteText.trim(),
      archived: false,
      createdAt: getServerTimestamp(),
    };
    
    const result = await createDocument(COLLECTION_NAME, noteData);
    
    setLoading(false);
    
    if (result.error) {
      Alert.alert('Error', `Failed to add note: ${result.error}`);
    } else {
      setNoteText('');
      // No need to manually update notes array since we have a real-time listener
    }
  };

  // Update a note
  const updateNote = async () => {
    if (!selectedNote || !noteText.trim()) {
      Alert.alert('Error', 'Please select a note and enter text');
      return;
    }
    
    setLoading(true);
    
    const result = await updateDocument(COLLECTION_NAME, selectedNote.id, {
      text: noteText.trim(),
      updatedAt: getServerTimestamp(),
    });
    
    setLoading(false);
    
    if (result.error) {
      Alert.alert('Error', `Failed to update note: ${result.error}`);
    } else {
      setNoteText('');
      setSelectedNote(null);
      // No need to manually update notes array since we have a real-time listener
    }
  };

  // Delete a note (soft delete by archiving)
  const archiveNote = async (noteId) => {
    setLoading(true);
    
    const result = await updateDocument(COLLECTION_NAME, noteId, {
      archived: true,
      updatedAt: getServerTimestamp(),
    });
    
    setLoading(false);
    
    if (result.error) {
      Alert.alert('Error', `Failed to archive note: ${result.error}`);
    } else {
      // No need to manually update notes array since we have a real-time listener
      if (selectedNote && selectedNote.id === noteId) {
        setSelectedNote(null);
        setNoteText('');
      }
    }
  };

  // Hard delete a note (permanent)
  const deleteNotePermantly = async (noteId) => {
    setLoading(true);
    
    const result = await deleteDocument(COLLECTION_NAME, noteId);
    
    setLoading(false);
    
    if (result.error) {
      Alert.alert('Error', `Failed to delete note: ${result.error}`);
    } else {
      // No need to manually update notes array since we have a real-time listener
      if (selectedNote && selectedNote.id === noteId) {
        setSelectedNote(null);
        setNoteText('');
      }
    }
  };

  // Select a note for editing
  const selectNote = (note) => {
    setSelectedNote(note);
    setNoteText(note.text);
  };

  // Cancel editing
  const cancelEdit = () => {
    setSelectedNote(null);
    setNoteText('');
  };

  // Render a note item
  const renderNoteItem = ({ item }) => (
    <View style={styles.noteItem}>
      <Text style={styles.noteText}>{item.text}</Text>
      
      <View style={styles.noteActions}>
        <Button 
          title="Edit" 
          onPress={() => selectNote(item)} 
        />
        <Button 
          title="Archive" 
          onPress={() => archiveNote(item.id)} 
          color="#ff9800"
        />
        <Button 
          title="Delete" 
          onPress={() => deleteNotePermantly(item.id)} 
          color="#f44336"
        />
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Firebase Firestore Example</Text>
      
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Enter note text"
          value={noteText}
          onChangeText={setNoteText}
          multiline
        />
        
        <View style={styles.buttonContainer}>
          {selectedNote ? (
            <>
              <Button 
                title="Update" 
                onPress={updateNote} 
                disabled={loading} 
              />
              <Button 
                title="Cancel" 
                onPress={cancelEdit} 
                disabled={loading} 
                color="#999"
              />
            </>
          ) : (
            <Button 
              title="Add Note" 
              onPress={addNote} 
              disabled={loading} 
            />
          )}
        </View>
      </View>
      
      <Text style={styles.subtitle}>
        Notes ({notes.length})
        {loading && ' - Loading...'}
      </Text>
      
      <FlatList
        data={notes}
        renderItem={renderNoteItem}
        keyExtractor={(item) => item.id}
        style={styles.notesList}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            No notes found. Add your first note!
          </Text>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
  },
  inputContainer: {
    width: '100%',
  },
  input: {
    height: 100,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    marginBottom: 15,
    paddingHorizontal: 10,
    paddingVertical: 8,
    textAlignVertical: 'top',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  notesList: {
    flex: 1,
    marginTop: 10,
  },
  noteItem: {
    backgroundColor: '#f9f9f9',
    padding: 15,
    borderRadius: 5,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#2196f3',
  },
  noteText: {
    fontSize: 16,
    marginBottom: 10,
  },
  noteActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    marginTop: 30,
    fontStyle: 'italic',
  },
});

export default FirestoreExample;