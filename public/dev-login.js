// Development script to bypass authentication and onboarding
(function() {
  // Set localStorage items for authentication and onboarding
  localStorage.setItem('isAuthenticated', 'true');
  localStorage.setItem('ai_sports_edge_onboarding_completed', 'true');
  
  // Mock Firebase auth state
  // Create a mock user object in localStorage that the app can use
  const mockUser = {
    uid: 'dev-user-123',
    email: 'dev@example.com',
    displayName: 'Development User',
    emailVerified: true,
    isAnonymous: false,
    metadata: {
      creationTime: new Date().toISOString(),
      lastSignInTime: new Date().toISOString()
    }
  };
  
  // Store the mock user in localStorage
  localStorage.setItem('firebase:authUser:AIzaSyDummyKeyForDevelopment:[DEFAULT]', JSON.stringify(mockUser));
  
  console.log('Authentication and onboarding bypassed for development');
  console.log('Mock user created:', mockUser);
  
  // Redirect to homepage
  window.location.href = '/';
})();