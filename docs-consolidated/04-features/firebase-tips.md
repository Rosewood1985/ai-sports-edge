# Firebase Tips and Tricks

This document contains tips, tricks, and best practices for using the Firebase service in AI Sports Edge.

## Performance Tips

1. **Use Lazy Loading**: The Firebase service uses lazy initialization to only load services when needed
   ```typescript
   // Only initializes auth when used, not on import
   const user = await firebaseService.auth.currentUser;
   ```

2. **Batch Firestore Operations**: Use batch operations for multiple writes
   ```typescript
   // Instead of multiple individual writes
   const batch = firebaseService.firestore.batch();
   batch.set(doc1Ref, data1);
   batch.set(doc2Ref, data2);
   await batch.commit();
   ```

3. **Use Firestore Queries Efficiently**: Limit results and use compound queries
   ```typescript
   // Efficient query with limit
   const results = await firebaseService.firestore.query(
     'users',
     where('active', '==', true),
     orderBy('lastLogin', 'desc'),
     limit(20)
   );
   ```

4. **Cache Auth State**: Cache the auth state to avoid unnecessary reloads
   ```typescript
   // In a context provider
   const [currentUser, setCurrentUser] = useState(null);
   useEffect(() => {
     return firebaseService.auth.onAuthStateChanged(setCurrentUser);
   }, []);
   ```

## Security Tips

1. **Validate Data**: Always validate data before writing to Firestore
   ```typescript
   // Validate data before writing
   if (!isValidUserData(userData)) {
     throw new Error('Invalid user data');
   }
   await firebaseService.firestore.setDocument('users', userId, userData);
   ```

2. **Use Security Rules**: Implement proper Firestore security rules
   ```
   // Example security rule
   service cloud.firestore {
     match /databases/{database}/documents {
       match /users/{userId} {
         allow read: if request.auth != null && request.auth.uid == userId;
         allow write: if request.auth != null && request.auth.uid == userId;
       }
     }
   }
   ```

3. **Sanitize User Input**: Always sanitize user input before using it in queries
   ```typescript
   // Sanitize user input
   const sanitizedQuery = sanitizeInput(userQuery);
   const results = await firebaseService.firestore.query(
     'posts',
     where('title', '>=', sanitizedQuery),
     where('title', '<=', sanitizedQuery + '\uf8ff')
   );
   ```

## Testing Tips

1. **Mock Firebase Service**: Use Jest to mock the Firebase service
   ```typescript
   // Mock the Firebase service
   jest.mock('../services/firebaseService', () => ({
     auth: {
       signIn: jest.fn(),
       signOut: jest.fn(),
       onAuthStateChanged: jest.fn()
     },
     firestore: {
       getDocument: jest.fn(),
       setDocument: jest.fn(),
       updateDocument: jest.fn(),
       deleteDocument: jest.fn()
     }
   }));
   ```

2. **Test Auth Flows**: Test authentication flows with mocked responses
   ```typescript
   // Test sign in
   test('sign in works correctly', async () => {
     firebaseService.auth.signIn.mockResolvedValue({ user: { uid: '123' } });
     const result = await signIn('test@example.com', 'password');
     expect(firebaseService.auth.signIn).toHaveBeenCalledWith('test@example.com', 'password');
     expect(result.user.uid).toBe('123');
   });
   ```

## Debugging Tips

1. **Enable Firebase Debug Mode**: Enable debug mode for more detailed logs
   ```typescript
   // Enable debug mode
   firebaseService.enableDebugMode();
   ```

2. **Use Firebase Console**: Use the Firebase console to inspect data and logs
   ```
   https://console.firebase.google.com/project/ai-sports-edge/overview
   ```

3. **Check Network Requests**: Use browser dev tools to check Firebase network requests
   ```
   // Look for requests to:
   // - firestore.googleapis.com
   // - identitytoolkit.googleapis.com
   // - storage.googleapis.com
   ```
