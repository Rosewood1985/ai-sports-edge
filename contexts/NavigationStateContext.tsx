import React, { createContext, useState, useEffect, useContext } from 'react';
import { isOnboardingCompleted } from '../services/onboardingService';
import { info, error as logError, LogCategory } from '../services/loggingService';
import { safeErrorCapture } from '../services/errorUtils';

// Define the initial route types
export type InitialRoute = 'Main' | 'Auth' | 'Onboarding';

// Define the context type
interface NavigationStateContextType {
  initialRoute: InitialRoute;
  isLoading: boolean;
  error: Error | null;
  resetNavigation: () => Promise<void>;
}

// Create the context with default values
const NavigationStateContext = createContext<NavigationStateContextType>({
  initialRoute: 'Onboarding',
  isLoading: true,
  error: null,
  resetNavigation: async () => {},
});

// Custom hook to use the navigation state context
export const useNavigationState = () => useContext(NavigationStateContext);

// Provider component
export const NavigationStateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [initialRoute, setInitialRoute] = useState<InitialRoute>('Onboarding');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Determine the initial route on mount
  useEffect(() => {
    const determineInitialRoute = async () => {
      console.log('NavigationStateContext: Determining initial route');
      setIsLoading(true);
      
      try {
        // Check if onboarding has been completed
        console.log('NavigationStateContext: Checking onboarding status');
        const onboardingCompleted = await isOnboardingCompleted();
        
        // Determine the initial route based on onboarding status
        // In a real app, you would also check authentication status here
        let route: InitialRoute;
        if (onboardingCompleted) {
          // If onboarding is completed, go to Main or Auth based on auth status
          // For now, we'll just go to Main
          route = 'Main';
          console.log('NavigationStateContext: Onboarding completed, setting initial route to Main');
        } else {
          // If onboarding is not completed, go to Onboarding
          route = 'Onboarding';
          console.log('NavigationStateContext: Onboarding not completed, setting initial route to Onboarding');
        }
        
        // Update the state
        setInitialRoute(route);
        info(LogCategory.NAVIGATION, `Initial route set to ${route}`);
      } catch (err) {
        // Handle errors
        console.error('NavigationStateContext: Error determining initial route:', err);
        logError(LogCategory.NAVIGATION, 'Error determining initial route', err as Error);
        safeErrorCapture(err as Error);
        
        // Set error state
        setError(err as Error);
        
        // Default to Onboarding on error
        setInitialRoute('Onboarding');
        info(LogCategory.NAVIGATION, 'Defaulting to Onboarding route due to error');
      } finally {
        // Set loading to false
        setIsLoading(false);
      }
    };

    determineInitialRoute();
  }, []);

  // Function to reset navigation state (for testing or user logout)
  const resetNavigation = async () => {
    console.log('NavigationStateContext: Resetting navigation state');
    setIsLoading(true);
    
    try {
      // Reset to onboarding
      setInitialRoute('Onboarding');
      info(LogCategory.NAVIGATION, 'Navigation state reset to Onboarding');
    } catch (err) {
      console.error('NavigationStateContext: Error resetting navigation state:', err);
      logError(LogCategory.NAVIGATION, 'Error resetting navigation state', err as Error);
      safeErrorCapture(err as Error);
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  };

  // Context value
  const contextValue: NavigationStateContextType = {
    initialRoute,
    isLoading,
    error,
    resetNavigation,
  };

  return (
    <NavigationStateContext.Provider value={contextValue}>
      {children}
    </NavigationStateContext.Provider>
  );
};

export default NavigationStateContext;