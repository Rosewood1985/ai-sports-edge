import { useState, useEffect, useCallback } from 'react';
import type { User } from 'firebase/auth';
import { FirebaseError } from 'firebase/app';
import { updateUserProfile as updateUserProfileService } from '../services/userService';
import { info, error as logError, LogCategory } from '../services/loggingService';
import { safeErrorCapture } from '../services/errorUtils';
import { firebaseService } from '../src/atomic/organisms/firebaseService';

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
    console.log('useAuth: Initializing authentication state listener');
    
    try {
      // Log authentication initialization
      info(LogCategory.AUTH, 'Setting up authentication state listener');
      
      // Subscribe to auth state changes with enhanced error handling
      const unsubscribe = firebaseService.auth.onAuthStateChange(
        (user) => {
          console.log(`useAuth: Auth state changed, user ${user ? 'logged in' : 'logged out'}`);
          
          if (user) {
            info(LogCategory.AUTH, 'User authenticated', {
              userId: user.uid,
              email: user.email || 'no email',
              emailVerified: user.emailVerified,
              isAnonymous: user.isAnonymous,
              providerIds: user.providerData.map(p => p.providerId)
            });
          } else {
            info(LogCategory.AUTH, 'User signed out or no user authenticated');
          }
          
          setAuthState({
            user,
            loading: false,
            error: null,
          });
        },
        (error) => {
          console.error('useAuth: Error in auth state change listener:', error);
          
          // Log the error with our logging service
          logError(LogCategory.AUTH, 'Authentication state listener error', error as Error);
          
          // Track the error with our error tracking service
          safeErrorCapture(error as Error);
          
          // Provide more detailed error information based on the error type
          let errorMessage = 'Unknown authentication error';
          
          if (error instanceof FirebaseError) {
            errorMessage = `Firebase Auth Error (${error.code}): ${error.message}`;
            
            // Log specific Firebase error codes for better debugging
            console.error(`useAuth: Firebase error code: ${error.code}`);
          } else if (error instanceof Error) {
            errorMessage = error.message;
          }
          
          console.error(`useAuth: ${errorMessage}`);
          
          setAuthState({
            user: null,
            loading: false,
            error,
          });
        }
      );
      
      // Cleanup subscription
      return () => {
        console.log('useAuth: Cleaning up authentication state listener');
        unsubscribe();
      };
    } catch (setupError) {
      console.error('useAuth: Error setting up auth state listener:', setupError);
      
      // Log the error with our logging service
      logError(LogCategory.AUTH, 'Error setting up authentication state listener', setupError as Error);
      
      // Track the error with our error tracking service
      safeErrorCapture(setupError as Error);
      
      // Update auth state with the error
      setAuthState({
        user: null,
        loading: false,
        error: setupError as Error,
      });
      
      // Return empty cleanup function
      return () => {};
    }
  }, []);

  /**
   * Update the user's profile with enhanced error handling
   * @param data Data to update
   */
  const updateUserProfile = useCallback(async (data: any) => {
    console.log('useAuth: Updating user profile');
    
    try {
      if (!authState.user) {
        console.error('useAuth: Cannot update profile, user not authenticated');
        const error = new Error('User not authenticated');
        logError(LogCategory.AUTH, 'Profile update failed - user not authenticated', error);
        safeErrorCapture(error);
        throw error;
      }
      
      const userId = authState.user.uid;
      console.log(`useAuth: Updating profile for user ${userId}`);
      info(LogCategory.AUTH, 'Updating user profile', { userId });
      
      // Use the atomic architecture's updateProfile method if updating auth profile
      // or continue using the service for database profile updates
      const result = await updateUserProfileService(userId, data);
      
      console.log('useAuth: Profile updated successfully');
      info(LogCategory.AUTH, 'User profile updated successfully', { userId });
      
      return result;
    } catch (error) {
      console.error('useAuth: Error updating user profile:', error);
      
      // Log the error with our logging service
      logError(LogCategory.AUTH, 'Error updating user profile', error as Error);
      
      // Track the error with our error tracking service
      safeErrorCapture(error as Error);
      
      // Provide more detailed error information based on the error type
      if (error instanceof FirebaseError) {
        console.error(`useAuth: Firebase error code: ${error.code}`);
      }
      
      // Re-throw the error for the caller to handle
      throw error;
    }
  }, [authState.user]);

  return {
    ...authState,
    updateUserProfile
  };
};