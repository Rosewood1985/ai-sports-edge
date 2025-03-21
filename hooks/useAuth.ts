import { useState, useEffect } from 'react';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';

interface AuthState {
  user: User | null;
  loading: boolean;
  error: Error | null;
}

/**
 * Hook for handling authentication state
 * @returns Authentication state and methods
 */
export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    const auth = getAuth();
    
    // Subscribe to auth state changes
    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        setAuthState({
          user,
          loading: false,
          error: null,
        });
      },
      (error) => {
        setAuthState({
          user: null,
          loading: false,
          error,
        });
      }
    );
    
    // Cleanup subscription
    return () => unsubscribe();
  }, []);

  return authState;
};