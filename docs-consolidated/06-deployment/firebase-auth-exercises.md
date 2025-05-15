# Firebase Authentication Exercises

## Exercise 1: Implement Sign Up

Create a function that signs up a new user with email and password, and creates a user profile in Firestore.

```typescript
// TODO: Implement signUp function
const signUp = async (email: string, password: string, displayName: string) => {
  // 1. Sign up user with email and password
  // 2. Create user profile in Firestore
  // 3. Return user object
};
```

## Exercise 2: Implement Sign In

Create a function that signs in a user with email and password, and updates the last login timestamp in Firestore.

```typescript
// TODO: Implement signIn function
const signIn = async (email: string, password: string) => {
  // 1. Sign in user with email and password
  // 2. Update last login timestamp in Firestore
  // 3. Return user object
};
```

## Exercise 3: Implement Auth State Management

Create a React hook that manages the authentication state and provides the current user.

```typescript
// TODO: Implement useAuth hook
const useAuth = () => {
  // 1. Create state for current user
  // 2. Set up auth state change listener
  // 3. Return current user and auth methods
};
```

## Exercise 4: Implement Protected Route

Create a React component that protects routes from unauthenticated users.

```typescript
// TODO: Implement ProtectedRoute component
const ProtectedRoute = ({ children }) => {
  // 1. Get current user from auth hook
  // 2. Redirect to login if user is not authenticated
  // 3. Render children if user is authenticated
};
```

## Exercise 5: Implement Password Reset

Create a function that sends a password reset email to a user.

```typescript
// TODO: Implement resetPassword function
const resetPassword = async (email: string) => {
  // 1. Send password reset email
  // 2. Return success message
};
```
