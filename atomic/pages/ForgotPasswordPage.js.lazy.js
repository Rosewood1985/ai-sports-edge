// External imports
import React, { lazy, Suspense } from 'react';




// Internal imports



      <ForgotPasswordPage {...props} />
    </Suspense>
    <Suspense fallback={<div>Loading...</div>}>
  );
  return (
// Export a wrapped version with Suspense
// Lazy load the component
const ForgotPasswordPage = lazy(() => import('./ForgotPasswordPage'));
export default function LazyForgotPasswordPage(props) {
}

