// External imports
import React, { lazy, Suspense } from 'react';




// Internal imports



      <index {...props} />
    </Suspense>
    <Suspense fallback={<div>Loading...</div>}>
  );
  return (
// Export a wrapped version with Suspense
// Lazy load the component
const index = lazy(() => import('./index'));
export default function Lazyindex(props) {
}

