// External imports
import React, { lazy, Suspense } from 'react';




// Internal imports



      <HomePage {...props} />
    </Suspense>
    <Suspense fallback={<div>Loading...</div>}>
  );
  return (
// Export a wrapped version with Suspense
// Lazy load the component
const HomePage = lazy(() => import('./HomePage'));
export default function LazyHomePage(props) {
}

