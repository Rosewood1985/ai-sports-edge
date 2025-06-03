import React from 'react';
import { Navigate } from 'react-router-dom';

/**
 * ProtectedRoute component that checks if the user is authenticated
 * If authenticated, renders the children components
 * If not authenticated, redirects to the login page
 *
 * In development mode, authentication is bypassed for easier testing
 *
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components to render if authenticated
 * @returns {JSX.Element} The protected route component
 */
const ProtectedRoute = ({ children }) => {
  // For development purposes, always allow access
  // This makes it easier to test the app without authentication
  const isDevelopment =
    window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

  if (isDevelopment) {
    console.log('Development mode: Authentication bypassed');
    return children;
  }

  // Check if user is authenticated
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';

  // If not authenticated, redirect to login page
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // If authenticated, render the children components
  return children;
};

export default ProtectedRoute;
