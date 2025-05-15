#!/bin/bash
# firebase-knowledge-sharing.sh - Tools for sharing Firebase knowledge

set -e

MEMORY_BANK=".roocode/memory_bank.md"
DOCS_DIR="docs/firebase"
SLIDES_DIR="docs/presentations"
TIPS_FILE="$DOCS_DIR/firebase-tips.md"
TRAINING_DIR="docs/training"

# Ensure directories exist
mkdir -p "$DOCS_DIR"
mkdir -p "$SLIDES_DIR"
mkdir -p "$TRAINING_DIR"

# Create Firebase tips document
create_tips_doc() {
  cat > "$TIPS_FILE" << END
# Firebase Tips and Tricks

This document contains tips, tricks, and best practices for using the Firebase service in AI Sports Edge.

## Performance Tips

1. **Use Lazy Loading**: The Firebase service uses lazy initialization to only load services when needed
   \`\`\`typescript
   // Only initializes auth when used, not on import
   const user = await firebaseService.auth.currentUser;
   \`\`\`

2. **Batch Firestore Operations**: Use batch operations for multiple writes
   \`\`\`typescript
   // Instead of multiple individual writes
   const batch = firebaseService.firestore.batch();
   batch.set(doc1Ref, data1);
   batch.set(doc2Ref, data2);
   await batch.commit();
   \`\`\`

3. **Use Firestore Queries Efficiently**: Limit results and use compound queries
   \`\`\`typescript
   // Efficient query with limit
   const results = await firebaseService.firestore.query(
     'users',
     where('active', '==', true),
     orderBy('lastLogin', 'desc'),
     limit(20)
   );
   \`\`\`

4. **Cache Auth State**: Cache the auth state to avoid unnecessary reloads
   \`\`\`typescript
   // In a context provider
   const [currentUser, setCurrentUser] = useState(null);
   useEffect(() => {
     return firebaseService.auth.onAuthStateChanged(setCurrentUser);
   }, []);
   \`\`\`

## Security Tips

1. **Validate Data**: Always validate data before writing to Firestore
   \`\`\`typescript
   // Validate data before writing
   if (!isValidUserData(userData)) {
     throw new Error('Invalid user data');
   }
   await firebaseService.firestore.setDocument('users', userId, userData);
   \`\`\`

2. **Use Security Rules**: Implement proper Firestore security rules
   \`\`\`
   // Example security rule
   service cloud.firestore {
     match /databases/{database}/documents {
       match /users/{userId} {
         allow read: if request.auth != null && request.auth.uid == userId;
         allow write: if request.auth != null && request.auth.uid == userId;
       }
     }
   }
   \`\`\`

3. **Sanitize User Input**: Always sanitize user input before using it in queries
   \`\`\`typescript
   // Sanitize user input
   const sanitizedQuery = sanitizeInput(userQuery);
   const results = await firebaseService.firestore.query(
     'posts',
     where('title', '>=', sanitizedQuery),
     where('title', '<=', sanitizedQuery + '\uf8ff')
   );
   \`\`\`

## Testing Tips

1. **Mock Firebase Service**: Use Jest to mock the Firebase service
   \`\`\`typescript
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
   \`\`\`

2. **Test Auth Flows**: Test authentication flows with mocked responses
   \`\`\`typescript
   // Test sign in
   test('sign in works correctly', async () => {
     firebaseService.auth.signIn.mockResolvedValue({ user: { uid: '123' } });
     const result = await signIn('test@example.com', 'password');
     expect(firebaseService.auth.signIn).toHaveBeenCalledWith('test@example.com', 'password');
     expect(result.user.uid).toBe('123');
   });
   \`\`\`

## Debugging Tips

1. **Enable Firebase Debug Mode**: Enable debug mode for more detailed logs
   \`\`\`typescript
   // Enable debug mode
   firebaseService.enableDebugMode();
   \`\`\`

2. **Use Firebase Console**: Use the Firebase console to inspect data and logs
   \`\`\`
   https://console.firebase.google.com/project/ai-sports-edge/overview
   \`\`\`

3. **Check Network Requests**: Use browser dev tools to check Firebase network requests
   \`\`\`
   // Look for requests to:
   // - firestore.googleapis.com
   // - identitytoolkit.googleapis.com
   // - storage.googleapis.com
   \`\`\`
END

  echo "Firebase tips document created at $TIPS_FILE"
}

# Create Firebase training slides
create_training_slides() {
  local topic="$1"
  local output_file="$SLIDES_DIR/firebase-${topic}-training.md"
  
  case "$topic" in
    auth)
      cat > "$output_file" << END
# Firebase Authentication Training

## Slide 1: Introduction to Firebase Auth

- Firebase Auth provides authentication services
- Supports email/password, social logins, and more
- Integrated with the consolidated Firebase service

## Slide 2: Using Firebase Auth

\`\`\`typescript
// Sign in with email and password
const user = await firebaseService.auth.signIn(email, password);

// Sign up with email and password
const newUser = await firebaseService.auth.signUp(email, password);

// Sign out
await firebaseService.auth.signOut();

// Get current user
const currentUser = firebaseService.auth.currentUser;

// Listen for auth state changes
const unsubscribe = firebaseService.auth.onAuthStateChanged((user) => {
  if (user) {
    // User is signed in
  } else {
    // User is signed out
  }
});
\`\`\`

## Slide 3: Auth Best Practices

- Use onAuthStateChanged for auth state management
- Implement proper error handling
- Use Firebase security rules
- Protect sensitive routes
- Implement proper user session management

## Slide 4: Auth Workflows

1. Sign Up
   - Collect user information
   - Create user account
   - Send verification email
   - Create user profile

2. Sign In
   - Authenticate user
   - Load user profile
   - Set up user session
   - Redirect to appropriate page

3. Sign Out
   - Clear user session
   - Redirect to login page

## Slide 5: Testing Auth

\`\`\`typescript
// Mock the Firebase service
jest.mock('../services/firebaseService', () => ({
  auth: {
    signIn: jest.fn(),
    signUp: jest.fn(),
    signOut: jest.fn(),
    onAuthStateChanged: jest.fn()
  }
}));

// Test sign in
test('sign in works correctly', async () => {
  firebaseService.auth.signIn.mockResolvedValue({ user: { uid: '123' } });
  const result = await signIn('test@example.com', 'password');
  expect(firebaseService.auth.signIn).toHaveBeenCalledWith('test@example.com', 'password');
  expect(result.user.uid).toBe('123');
});
\`\`\`
END
      ;;
    firestore)
      cat > "$output_file" << END
# Firebase Firestore Training

## Slide 1: Introduction to Firestore

- Firestore is a NoSQL document database
- Organized into collections and documents
- Supports real-time updates
- Integrated with the consolidated Firebase service

## Slide 2: Using Firestore

\`\`\`typescript
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
\`\`\`

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

\`\`\`typescript
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
\`\`\`
END
      ;;
    storage)
      cat > "$output_file" << END
# Firebase Storage Training

## Slide 1: Introduction to Firebase Storage

- Firebase Storage is for storing user-generated content
- Supports images, videos, and other files
- Integrated with the consolidated Firebase service

## Slide 2: Using Firebase Storage

\`\`\`typescript
// Upload a file
const downloadURL = await firebaseService.storage.uploadFile(
  'users/123/profile.jpg',
  file
);

// Get a download URL
const url = await firebaseService.storage.getDownloadURL(
  'users/123/profile.jpg'
);

// Delete a file
await firebaseService.storage.deleteFile(
  'users/123/profile.jpg'
);

// List files in a directory
const files = await firebaseService.storage.listFiles(
  'users/123'
);
\`\`\`

## Slide 3: Storage Best Practices

- Use a consistent naming convention
- Implement proper security rules
- Validate file types and sizes
- Use metadata for additional information
- Optimize images before uploading
- Use resumable uploads for large files
- Clean up unused files

## Slide 4: Storage Workflows

1. User Profile Images
   - Upload profile image
   - Resize and optimize
   - Store in users/{userId}/profile.jpg
   - Update user profile with download URL

2. Post Attachments
   - Upload attachment
   - Validate file type and size
   - Store in posts/{postId}/attachments/{fileName}
   - Add attachment reference to post

## Slide 5: Testing Storage

\`\`\`typescript
// Mock the Firebase service
jest.mock('../services/firebaseService', () => ({
  storage: {
    uploadFile: jest.fn(),
    getDownloadURL: jest.fn(),
    deleteFile: jest.fn(),
    listFiles: jest.fn()
  }
}));

// Test uploading a file
test('uploadFile works correctly', async () => {
  firebaseService.storage.uploadFile.mockResolvedValue('https://example.com/image.jpg');
  const url = await uploadProfilePicture('123', file);
  expect(firebaseService.storage.uploadFile).toHaveBeenCalledWith('users/123/profile.jpg', file);
  expect(url).toBe('https://example.com/image.jpg');
});
\`\`\`
END
      ;;
    functions)
      cat > "$output_file" << END
# Firebase Functions Training

## Slide 1: Introduction to Firebase Functions

- Firebase Functions are serverless functions
- Run in response to events or HTTP requests
- Integrated with the consolidated Firebase service

## Slide 2: Using Firebase Functions

\`\`\`typescript
// Call a function
const result = await firebaseService.functions.callFunction(
  'generateAIPick',
  { gameId: '123', userId: '456' }
);

// Call a function with HTTP trigger
const response = await firebaseService.functions.callHttpFunction(
  'api/generatePick',
  { gameId: '123', userId: '456' }
);
\`\`\`

## Slide 3: Functions Best Practices

- Keep functions small and focused
- Use proper error handling
- Implement proper authentication
- Use environment variables for configuration
- Optimize cold start times
- Use proper logging
- Implement proper testing

## Slide 4: Common Function Types

1. Firestore Triggers
   - onCreate: When a document is created
   - onUpdate: When a document is updated
   - onDelete: When a document is deleted
   - onWrite: When a document is created, updated, or deleted

2. Authentication Triggers
   - onCreate: When a user is created
   - onDelete: When a user is deleted

3. HTTP Triggers
   - Express-like API
   - Authentication middleware
   - CORS handling

## Slide 5: Testing Functions

\`\`\`typescript
// Mock the Firebase service
jest.mock('../services/firebaseService', () => ({
  functions: {
    callFunction: jest.fn(),
    callHttpFunction: jest.fn()
  }
}));

// Test calling a function
test('callFunction works correctly', async () => {
  firebaseService.functions.callFunction.mockResolvedValue({ success: true, data: { pick: 'Team A' } });
  const result = await generateAIPick('123', '456');
  expect(firebaseService.functions.callFunction).toHaveBeenCalledWith('generateAIPick', { gameId: '123', userId: '456' });
  expect(result.success).toBe(true);
  expect(result.data.pick).toBe('Team A');
});
\`\`\`
END
      ;;
    analytics)
      cat > "$output_file" << END
# Firebase Analytics Training

## Slide 1: Introduction to Firebase Analytics

- Firebase Analytics provides app usage insights
- Tracks user behavior and demographics
- Integrated with the consolidated Firebase service

## Slide 2: Using Firebase Analytics

\`\`\`typescript
// Log an event
firebaseService.analytics.logEvent(
  'purchase',
  {
    currency: 'USD',
    value: 29.99,
    items: [{ id: 'subscription_premium' }]
  }
);

// Set user properties
firebaseService.analytics.setUserProperties({
  subscription_level: 'premium',
  user_type: 'returning'
});

// Set current screen
firebaseService.analytics.setCurrentScreen(
  'HomeScreen',
  'home_screen'
);
\`\`\`

## Slide 3: Analytics Best Practices

- Use consistent event names
- Include relevant parameters
- Set user properties for segmentation
- Track conversion events
- Track screen views
- Use debug mode during development
- Respect user privacy

## Slide 4: Key Analytics Events

1. User Lifecycle Events
   - sign_up
   - login
   - tutorial_complete
   - subscription_start
   - subscription_cancel

2. Engagement Events
   - screen_view
   - search
   - view_item
   - add_to_favorites
   - share

3. Conversion Events
   - add_to_cart
   - begin_checkout
   - purchase
   - subscription_purchase

## Slide 5: Testing Analytics

\`\`\`typescript
// Mock the Firebase service
jest.mock('../services/firebaseService', () => ({
  analytics: {
    logEvent: jest.fn(),
    setUserProperties: jest.fn(),
    setCurrentScreen: jest.fn()
  }
}));

// Test logging an event
test('logEvent works correctly', () => {
  logPurchase({ currency: 'USD', value: 29.99 });
  expect(firebaseService.analytics.logEvent).toHaveBeenCalledWith('purchase', {
    currency: 'USD',
    value: 29.99
  });
});
\`\`\`
END
      ;;
    *)
      echo "Invalid topic: $topic"
      echo "Available topics: auth, firestore, storage, functions, analytics"
      return 1
      ;;
  esac
  
  echo "Training slides created at $output_file"
}

# Create Firebase training exercises
create_training_exercises() {
  local topic="$1"
  local output_file="$TRAINING_DIR/firebase-${topic}-exercises.md"
  
  case "$topic" in
    auth)
      cat > "$output_file" << END
# Firebase Authentication Exercises

## Exercise 1: Implement Sign Up

Create a function that signs up a new user with email and password, and creates a user profile in Firestore.

\`\`\`typescript
// TODO: Implement signUp function
const signUp = async (email: string, password: string, displayName: string) => {
  // 1. Sign up user with email and password
  // 2. Create user profile in Firestore
  // 3. Return user object
};
\`\`\`

## Exercise 2: Implement Sign In

Create a function that signs in a user with email and password, and updates the last login timestamp in Firestore.

\`\`\`typescript
// TODO: Implement signIn function
const signIn = async (email: string, password: string) => {
  // 1. Sign in user with email and password
  // 2. Update last login timestamp in Firestore
  // 3. Return user object
};
\`\`\`

## Exercise 3: Implement Auth State Management

Create a React hook that manages the authentication state and provides the current user.

\`\`\`typescript
// TODO: Implement useAuth hook
const useAuth = () => {
  // 1. Create state for current user
  // 2. Set up auth state change listener
  // 3. Return current user and auth methods
};
\`\`\`

## Exercise 4: Implement Protected Route

Create a React component that protects routes from unauthenticated users.

\`\`\`typescript
// TODO: Implement ProtectedRoute component
const ProtectedRoute = ({ children }) => {
  // 1. Get current user from auth hook
  // 2. Redirect to login if user is not authenticated
  // 3. Render children if user is authenticated
};
\`\`\`

## Exercise 5: Implement Password Reset

Create a function that sends a password reset email to a user.

\`\`\`typescript
// TODO: Implement resetPassword function
const resetPassword = async (email: string) => {
  // 1. Send password reset email
  // 2. Return success message
};
\`\`\`
END
      ;;
    firestore)
      cat > "$output_file" << END
# Firebase Firestore Exercises

## Exercise 1: Implement CRUD Operations

Create functions for basic CRUD operations on a collection.

\`\`\`typescript
// TODO: Implement createDocument function
const createDocument = async (collection: string, data: any) => {
  // 1. Create document with auto-generated ID
  // 2. Return document ID
};

// TODO: Implement readDocument function
const readDocument = async (collection: string, id: string) => {
  // 1. Get document by ID
  // 2. Return document data
};

// TODO: Implement updateDocument function
const updateDocument = async (collection: string, id: string, data: any) => {
  // 1. Update document by ID
  // 2. Return success status
};

// TODO: Implement deleteDocument function
const deleteDocument = async (collection: string, id: string) => {
  // 1. Delete document by ID
  // 2. Return success status
};
\`\`\`

## Exercise 2: Implement Querying

Create a function that queries documents based on multiple conditions.

\`\`\`typescript
// TODO: Implement queryDocuments function
const queryDocuments = async (
  collection: string,
  filters: Array<{ field: string, operator: string, value: any }>,
  orderByField?: string,
  orderDirection?: 'asc' | 'desc',
  limit?: number
) => {
  // 1. Build query with filters
  // 2. Add ordering if specified
  // 3. Add limit if specified
  // 4. Execute query and return results
};
\`\`\`

## Exercise 3: Implement Batch Operations

Create a function that performs multiple write operations in a batch.

\`\`\`typescript
// TODO: Implement batchWrite function
const batchWrite = async (operations: Array<{
  type: 'set' | 'update' | 'delete',
  collection: string,
  id: string,
  data?: any
}>) => {
  // 1. Create batch
  // 2. Add operations to batch
  // 3. Commit batch and return success status
};
\`\`\`

## Exercise 4: Implement Real-time Updates

Create a React hook that listens for real-time updates to a document.

\`\`\`typescript
// TODO: Implement useDocument hook
const useDocument = (collection: string, id: string) => {
  // 1. Create state for document data
  // 2. Set up real-time listener
  // 3. Return document data and loading state
};
\`\`\`

## Exercise 5: Implement Pagination

Create a function that implements pagination for a collection.

\`\`\`typescript
// TODO: Implement paginateCollection function
const paginateCollection = async (
  collection: string,
  pageSize: number,
  startAfterDoc?: any
) => {
  // 1. Create query with limit
  // 2. Add startAfter if specified
  // 3. Execute query and return results and last document
};
\`\`\`
END
      ;;
    storage)
      cat > "$output_file" << END
# Firebase Storage Exercises

## Exercise 1: Implement File Upload

Create a function that uploads a file to Firebase Storage.

\`\`\`typescript
// TODO: Implement uploadFile function
const uploadFile = async (
  path: string,
  file: File,
  onProgress?: (progress: number) => void
) => {
  // 1. Create storage reference
  // 2. Upload file with progress tracking
  // 3. Return download URL
};
\`\`\`

## Exercise 2: Implement File Download

Create a function that gets a download URL for a file in Firebase Storage.

\`\`\`typescript
// TODO: Implement getDownloadURL function
const getDownloadURL = async (path: string) => {
  // 1. Create storage reference
  // 2. Get download URL
  // 3. Return download URL
};
\`\`\`

## Exercise 3: Implement File Deletion

Create a function that deletes a file from Firebase Storage.

\`\`\`typescript
// TODO: Implement deleteFile function
const deleteFile = async (path: string) => {
  // 1. Create storage reference
  // 2. Delete file
  // 3. Return success status
};
\`\`\`

## Exercise 4: Implement File Listing

Create a function that lists files in a directory in Firebase Storage.

\`\`\`typescript
// TODO: Implement listFiles function
const listFiles = async (path: string) => {
  // 1. Create storage reference
  // 2. List files
  // 3. Return file list
};
\`\`\`

## Exercise 5: Implement Image Upload with Resizing

Create a function that uploads an image to Firebase Storage and creates multiple resized versions.

\`\`\`typescript
// TODO: Implement uploadImage function
const uploadImage = async (
  path: string,
  file: File,
  sizes: Array<{ width: number, height: number, suffix: string }>
) => {
  // 1. Resize image to multiple sizes
  // 2. Upload each size to Firebase Storage
  // 3. Return download URLs for each size
};
\`\`\`
END
      ;;
    functions)
      cat > "$output_file" << END
# Firebase Functions Exercises

## Exercise 1: Call a Firebase Function

Create a function that calls a Firebase Function.

\`\`\`typescript
// TODO: Implement callFunction function
const callFunction = async (
  name: string,
  data: any
) => {
  // 1. Call Firebase Function
  // 2. Handle errors
  // 3. Return result
};
\`\`\`

## Exercise 2: Implement Error Handling

Create a function that calls a Firebase Function with proper error handling.

\`\`\`typescript
// TODO: Implement callFunctionWithErrorHandling function
const callFunctionWithErrorHandling = async (
  name: string,
  data: any
) => {
  // 1. Call Firebase Function
  // 2. Handle specific error types
  // 3. Return result or error message
};
\`\`\`

## Exercise 3: Implement Retry Logic

Create a function that calls a Firebase Function with retry logic.

\`\`\`typescript
// TODO: Implement callFunctionWithRetry function
const callFunctionWithRetry = async (
  name: string,
  data: any,
  maxRetries: number = 3,
  retryDelay: number = 1000
) => {
  // 1. Call Firebase Function
  // 2. Retry on failure with exponential backoff
  // 3. Return result or error message
};
\`\`\`

## Exercise 4: Implement Function Caching

Create a function that calls a Firebase Function with result caching.

\`\`\`typescript
// TODO: Implement callFunctionWithCache function
const callFunctionWithCache = async (
  name: string,
  data: any,
  cacheDuration: number = 60000
) => {
  // 1. Check cache for result
  // 2. Call Firebase Function if not in cache
  // 3. Cache result
  // 4. Return result
};
\`\`\`

## Exercise 5: Implement Function Batching

Create a function that batches multiple Firebase Function calls.

\`\`\`typescript
// TODO: Implement batchFunctionCalls function
const batchFunctionCalls = async (
  calls: Array<{ name: string, data: any }>
) => {
  // 1. Batch multiple function calls
  // 2. Handle errors for individual calls
  // 3. Return results
};
\`\`\`
END
      ;;
    analytics)
      cat > "$output_file" << END
# Firebase Analytics Exercises

## Exercise 1: Log an Event

Create a function that logs an event to Firebase Analytics.

\`\`\`typescript
// TODO: Implement logEvent function
const logEvent = (
  eventName: string,
  eventParams?: Record<string, any>
) => {
  // 1. Log event to Firebase Analytics
  // 2. Validate event name and parameters
};
\`\`\`

## Exercise 2: Set User Properties

Create a function that sets user properties in Firebase Analytics.

\`\`\`typescript
// TODO: Implement setUserProperties function
const setUserProperties = (
  properties: Record<string, any>
) => {
  // 1. Set user properties in Firebase Analytics
  // 2. Validate property names and values
};
\`\`\`

## Exercise 3: Track Screen View

Create a function that tracks a screen view in Firebase Analytics.

\`\`\`typescript
// TODO: Implement trackScreenView function
const trackScreenView = (
  screenName: string,
  screenClass?: string
) => {
  // 1. Track screen view in Firebase Analytics
  // 2. Validate screen name
};
\`\`\`

## Exercise 4: Track User Journey

Create a function that tracks a user journey through multiple screens.

\`\`\`typescript
// TODO: Implement trackUserJourney function
const trackUserJourney = (
  journeyName: string,
  steps: Array<{ name: string, params?: Record<string, any> }>
) => {
  // 1. Track each step in the journey
  // 2. Include journey name in each event
};
\`\`\`

## Exercise 5: Implement Analytics Wrapper

Create a wrapper for Firebase Analytics that adds additional functionality.

\`\`\`typescript
// TODO: Implement AnalyticsWrapper class
class AnalyticsWrapper {
  // 1. Implement methods for logging events
  // 2. Implement methods for setting user properties
  // 3. Implement methods for tracking screen views
  // 4. Add additional functionality like event batching
}
\`\`\`
END
      ;;
    *)
      echo "Invalid topic: $topic"
      echo "Available topics: auth, firestore, storage, functions, analytics"
      return 1
      ;;
  esac
  
  echo "Training exercises created at $output_file"
}

# Create code review checklist
create_code_review_checklist() {
  local checklist_file="$DOCS_DIR/firebase-code-review-checklist.md"
  
  cat > "$checklist_file" << END
# Firebase Code Review Checklist

Use this checklist when reviewing code that uses the Firebase service.

## Import Checking

- [ ] Uses \`import { firebaseService } from '../../services/firebaseService'\` instead of direct Firebase imports
- [ ] No imports from \`firebase/app\`, \`firebase/auth\`, etc.
- [ ] No duplicate imports of firebaseService

## Authentication Usage

- [ ] Uses \`firebaseService.auth\` for all authentication operations
- [ ] Properly handles authentication state with \`onAuthStateChanged\`
- [ ] Cleans up auth listeners in useEffect return functions
- [ ] Handles authentication errors appropriately
- [ ] Uses correct authentication methods (email/password, Google, etc.)

## Firestore Usage

- [ ] Uses \`firebaseService.firestore\` for all Firestore operations
- [ ] Uses appropriate methods for reading/writing data
- [ ] Uses server timestamps for date fields
- [ ] Handles errors in async Firestore operations
- [ ] Uses batch operations for multiple writes where appropriate
- [ ] Cleans up Firestore listeners in useEffect return functions

## Storage Usage

- [ ] Uses \`firebaseService.storage\` for all Storage operations
- [ ] Handles file uploads with appropriate error handling
- [ ] Uses progress callbacks for uploads where appropriate
- [ ] Properly cleans up resources

## Security Considerations

- [ ] No sensitive data exposed in client-side code
- [ ] Authentication state checked before accessing protected data
- [ ] User permissions verified when necessary
- [ ] No circumvention of security rules

## Performance Considerations

- [ ] Uses query constraints to limit data transfer
- [ ] Avoids unnecessary real-time listeners
- [ ] Uses appropriate caching strategies
- [ ] Handles offline operations where needed

## Testing

- [ ] Tests mock firebaseService appropriately
- [ ] Authentication flows are properly tested
- [ ] Data operations are verified in tests
- [ ] Error cases are handled and tested

## Accessibility and User Experience

- [ ] Authentication state changes handled gracefully in UI
- [ ] Loading states shown during Firebase operations
- [ ] Error messages are clear and actionable
- [ ] Success states are properly communicated
END

  echo "Code review checklist created at $checklist_file"
  
  # Update memory bank
  if [ -f "$MEMORY_BANK" ]; then
    ./scripts/memory_bank.sh add "Firebase" "Code Review" "Use the [Firebase Code Review Checklist]($checklist_file) when reviewing code that uses the Firebase service."
  fi
  
  return 0
}

# Create firebase faq document
create_firebase_faq() {
  local faq_file="$DOCS_DIR/firebase-faq.md"
  
  cat > "$faq_file" << END
# Firebase Service FAQ

## General Questions

### Why did we consolidate Firebase usage?

We consolidated Firebase usage to improve:
- **Type safety**: Better TypeScript support
- **Performance**: Lazy loading of Firebase services
- **Testability**: Easier to mock in tests
- **Maintainability**: Single source of truth for Firebase configuration
- **Consistency**: Standardized API for Firebase interactions

### How many files are being migrated?

227 files that use Firebase directly are being migrated to use the consolidated service.

### Can I still use Firebase directly?

No, direct Firebase usage should be avoided. Always use the \`firebaseService\` instead.

## Migration Questions

### How do I migrate my component to use the new Firebase service?

1. Replace Firebase imports with \`import { firebaseService } from '../../services/firebaseService'\`
2. Replace direct Firebase calls with equivalent firebaseService methods
3. Test your component to ensure it works as expected
4. Mark your file as migrated using \`./scripts/firebase-migration-tracker.sh mark-migrated <file-path>\`

### What if I need Firebase functionality that's not in the service?

If you need functionality that's not currently in the firebaseService:
1. First, check the [Firebase Service Documentation](../docs/firebase-service.md) to make sure it's not already there
2. Add the functionality to firebaseService.ts
3. Create a PR with your changes
4. Update the documentation

### How do I test components that use the Firebase service?

Mock the firebaseService in your tests:

\`\`\`typescript
jest.mock('../../services/firebaseService', () => ({
  firebaseService: {
    auth: {
      signIn: jest.fn(),
      currentUser: { uid: 'test123' }
    },
    firestore: {
      getDoc: jest.fn().mockResolvedValue({
        exists: true,
        data: () => ({ name: 'Test' })
      })
    }
  }
}));
\`\`\`

## Technical Questions

### How does lazy initialization work?

The Firebase service uses getter properties and initialization checks to only initialize Firebase services when they're first used:

\`\`\`typescript
get auth() {
  if (!this._auth) {
    // Initialize auth only when first accessed
    this._auth = new AuthService(this.app);
  }
  return this._auth;
}
\`\`\`

### How are Firebase configuration values handled?

Firebase configuration is stored in environment variables and loaded by the firebaseService. This keeps sensitive configuration out of the codebase.

### Can I use firebaseService with React Native?

Yes, the firebaseService is designed to work with both web and React Native. Import it the same way in both environments.

### Does firebaseService support offline capabilities?

Yes, it inherits all offline capabilities from Firebase. Firestore operations will work offline and sync when connectivity is restored.

## Process Questions

### How do I report issues with the Firebase service?

1. Check the [Firebase Service Documentation](../docs/firebase-service.md) first
2. Look for existing issues in GitHub
3. Create a new issue if necessary, with "Firebase Service" in the title
4. Provide a clear description of the issue and steps to reproduce

### How do I check migration progress?

Run \`./scripts/firebase-migration-tracker.sh status\` to see the current migration status.

### When will the migration be complete?

We're targeting [TARGET_DATE] for completion of the migration.

### How can I help with the migration?

1. Migrate your own components to use the firebaseService
2. Review PRs for Firebase migrations
3. Help with testing migrated components
4. Report any issues you find
END

  echo "Firebase FAQ created at $faq_file"
  
  # Update memory bank
  if [ -f "$MEMORY_BANK" ]; then
    ./scripts/memory_bank.sh add "Firebase" "FAQ" "See the [Firebase Service FAQ]($faq_file) for answers to common questions about the Firebase service."
  fi
  
  return 0
}

# Create a Slack message for knowledge sharing
create_slack_announcement() {
  local message_file="$DOCS_DIR/firebase-slack-announcement.md"
  
  cat > "$message_file" << END
# Firebase Service Announcement

:fire: **Firebase Service Migration** :fire:

We've consolidated our Firebase usage into a single, type-safe service!

**What's Changed:**
- Created a unified \`firebaseService\` with lazy initialization
- Migrating 227 files to use the new service
- Improved type safety, performance, and testability

**How to Use:**
\`\`\`typescript
import { firebaseService } from '../../services/firebaseService';

// Authentication
const user = await firebaseService.auth.signInWithEmailAndPassword(email, password);

// Firestore
const doc = await firebaseService.firestore.getDoc('collection', 'docId');

// Storage
await firebaseService.storage.uploadFile(firebaseService.storage.ref('path'), file);
\`\`\`

**Resources:**
- [Firebase Service Documentation](link-to-docs)
- [Migration Tracker](link-to-tracker)
- [Firebase Tips and Tricks](link-to-tips)

**Need Help?**
- Check the documentation first
- Ask in this channel
- Join our Firebase migration training session on [DATE]

:rocket: Let's make our Firebase usage better together!
END

  echo "Slack announcement created at $message_file"
  
  # Update memory bank
  if [ -f "$MEMORY_BANK" ]; then
    ./scripts/memory_bank.sh add "Firebase" "Communication" "Use the [Firebase Slack Announcement]($message_file) to share information about the Firebase service migration."
  fi
  
  return 0
}

# Set up all knowledge sharing materials
setup_all() {
  create_tips_doc
  create_training_slides "auth"
  create_training_slides "firestore"
  create_training_slides "storage"
  create_training_slides "functions"
  create_training_slides "analytics"
  create_training_exercises "auth"
  create_training_exercises "firestore"
  create_training_exercises "storage"
  create_training_exercises "functions"
  create_training_exercises "analytics"
  create_code_review_checklist
  create_firebase_faq
  create_slack_announcement
  
  echo "All knowledge sharing materials created"
  
  # Add summary to memory bank
  if [ -f "$MEMORY_BANK" ]; then
    ./scripts/memory_bank.sh add "Firebase" "Knowledge Sharing" "# Firebase Knowledge Sharing Materials\n\n1. [Firebase Tips and Tricks]($TIPS_FILE)\n2. [Training Presentations]($SLIDES_DIR)\n3. [Code Review Checklist]($DOCS_DIR/firebase-code-review-checklist.md)\n4. [FAQ]($DOCS_DIR/firebase-faq.md)\n5. [Training Exercises]($TRAINING_DIR)\n6. [Slack Announcement]($DOCS_DIR/firebase-slack-announcement.md)\n\nThese materials are designed to help the team understand and use the consolidated Firebase service."
  fi
  
  return 0
}

# Show help message
show_help() {
  echo "Firebase Knowledge Sharing"
  echo "Usage: $0 [command]"
  echo ""
  echo "Commands:"
  echo "  tips               Create Firebase tips document"
  echo "  training <topic>   Create training presentation (auth, firestore, storage, functions, analytics)"
  echo "  exercises <topic>  Create training exercises (auth, firestore, storage, functions, analytics)"
  echo "  checklist          Create code review checklist"
  echo "  faq                Create Firebase FAQ"
  echo "  announcement       Create Slack announcement"
  echo "  setup              Set up all knowledge sharing materials"
  echo "  help               Show this help message"
}

# Main command handler
case "${1:-setup}" in
  tips)
    create_tips_doc
    ;;
  training)
    create_training_slides "${2:-auth}"
    ;;
  exercises)
    create_training_exercises "${2:-auth}"
    ;;
  checklist)
    create_code_review_checklist
    ;;
  faq)
    create_firebase_faq
    ;;
  announcement)
    create_slack_announcement
    ;;
  setup)
    setup_all
    ;;
  help|*)
    show_help
    ;;
esac