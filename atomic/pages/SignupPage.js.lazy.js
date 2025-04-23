// External imports
import React, { lazy, Suspense } from 'react';




// Internal imports



      <SignupPage {...props} />
    </Suspense>
    <Suspense fallback={<div>Loading...</div>}>
  );
  return (
// Export a wrapped version with Suspense
// Lazy load the component
const SignupPage = lazy(() => import('./SignupPage'));
export default function LazySignupPage(props) {
}

