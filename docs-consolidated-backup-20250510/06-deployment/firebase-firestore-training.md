# Firebase Firestore Training

## Slide 1: Introduction to Firestore

- Firestore is a NoSQL document database
- Organized into collections and documents
- Supports real-time updates
- Integrated with the consolidated Firebase service

## Slide 2: Using Firestore

```typescript
// Get a document
const user = await firebaseService.firestore.getDocument('users', userId);

// Set a document
await firebaseService.firestore.setDocument('users', userId, userData);

// Update a document
await firebaseService.firestore.updateDocument('users', userId, { name: 'New Name' });

// Delete a document
await firebaseService.firestore.deleteDocument('users', userId);

// Query documents
const users = await firebaseService.firestore.query(
  'users',
  where('active', '==', true),
  orderBy('name', 'asc'),
  limit(10)
);

// Listen for real-time updates
const unsubscribe = firebaseService.firestore.onSnapshot(
  'users',
  userId,
  (user) => {
    // Handle updated user data
  }
);
```

## Slide 3: Firestore Best Practices

- Design your data structure carefully
- Use batch operations for multiple writes
- Use transactions for atomic operations
- Limit query results
- Use compound queries
- Denormalize data when necessary
- Use security rules

## Slide 4: Firestore Data Modeling

1. One-to-One Relationships
   - Embed data in the same document
   - Use separate documents with references

2. One-to-Many Relationships
   - Use subcollections
   - Use arrays of references
   - Use separate collections with queries

3. Many-to-Many Relationships
   - Use a junction collection
   - Use arrays of references (with limits)

## Slide 5: Testing Firestore

```typescript
// Mock the Firebase service
jest.mock('../services/firebaseService', () => ({
  firestore: {
    getDocument: jest.fn(),
    setDocument: jest.fn(),
    updateDocument: jest.fn(),
    deleteDocument: jest.fn(),
    query: jest.fn()
  }
}));

// Test getting a document
test('getDocument works correctly', async () => {
  firebaseService.firestore.getDocument.mockResolvedValue({ id: '123', name: 'Test User' });
  const user = await getUser('123');
  expect(firebaseService.firestore.getDocument).toHaveBeenCalledWith('users', '123');
  expect(user.name).toBe('Test User');
});
```
