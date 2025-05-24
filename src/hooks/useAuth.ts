import { useState, useEffect } from 'react';
import { auth } from '../firebase/config';
import { User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { firestore } from '../firebase/config';

export interface AuthUser extends User {
  roles?: string[];
}

interface AuthState {
  user: AuthUser | null;
  loading: boolean;
  error: Error | null;
}

/**
 * Hook for handling authentication state
 */
export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async user => {
      if (user) {
        try {
          // Get user roles from Firestore
          const userDoc = await getDoc(doc(firestore, 'users', user.uid));
          const userData = userDoc.data();

          // Create extended user with roles
          const authUser: AuthUser = {
            ...user,
            roles: userData?.roles || [],
          };

          setAuthState({
            user: authUser,
            loading: false,
            error: null,
          });
        } catch (error) {
          setAuthState({
            user: null,
            loading: false,
            error: error instanceof Error ? error : new Error('Unknown error'),
          });
        }
      } else {
        setAuthState({
          user: null,
          loading: false,
          error: null,
        });
      }
    });

    // Cleanup subscription
    return () => unsubscribe();
  }, []);

  return authState;
}
