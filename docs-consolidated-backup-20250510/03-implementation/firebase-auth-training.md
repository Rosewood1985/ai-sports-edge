# Firebase Authentication Training

## Slide 1: Introduction to Firebase Auth

- Firebase Auth provides authentication services
- Supports email/password, social logins, and more
- Integrated with the consolidated Firebase service

## Slide 2: Using Firebase Auth

```typescript
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
```

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

```typescript
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
```
