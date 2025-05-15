import React, { lazy, Suspense } from 'react';

/**
 * Lazy Load Utility
 * 
 * This utility provides a wrapper for React.lazy and Suspense to implement code splitting.
 * It allows components to be loaded only when they are needed, reducing the initial bundle size.
 */

/**
 * Create a lazy-loaded component with a fallback
 * @param {Function} importFunc - Dynamic import function (e.g., () => import('./MyComponent'))
 * @param {React.ReactNode} fallback - Fallback component to show while loading
 * @returns {React.ComponentType} Lazy-loaded component wrapped in Suspense
 */
export const lazyLoad = (importFunc, fallback = null) => {
  const LazyComponent = lazy(importFunc);
  
  return props => (
    <Suspense fallback={fallback || <DefaultLoadingFallback />}>
      <LazyComponent {...props} />
    </Suspense>
  );
};

/**
 * Default loading fallback component
 * @returns {React.ReactNode} Loading indicator
 */
const DefaultLoadingFallback = () => (
  <div style={styles.loadingContainer}>
    <div style={styles.loadingSpinner}></div>
  </div>
);

// Styles for the default loading fallback
const styles = {
  loadingContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
    minHeight: 200,
  },
  loadingSpinner: {
    width: 40,
    height: 40,
    border: '4px solid rgba(0, 0, 0, 0.1)',
    borderRadius: '50%',
    borderTopColor: '#0066FF',
    animation: 'spin 1s ease-in-out infinite',
  },
};

// Add the spin animation to the document
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.type = 'text/css';
  styleSheet.innerText = `
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(styleSheet);
}

/**
 * Create a lazy-loaded route component
 * @param {Function} importFunc - Dynamic import function for the route component
 * @returns {Object} Route object with lazy-loaded component
 */
export const lazyLoadRoute = (importFunc) => ({
  component: lazyLoad(importFunc),
});

/**
 * Create multiple lazy-loaded routes
 * @param {Object} routes - Object with route paths as keys and import functions as values
 * @returns {Object} Object with route paths as keys and lazy-loaded route objects as values
 */
export const lazyLoadRoutes = (routes) => {
  const lazyRoutes = {};
  
  Object.keys(routes).forEach(path => {
    lazyRoutes[path] = lazyLoadRoute(routes[path]);
  });
  
  return lazyRoutes;
};