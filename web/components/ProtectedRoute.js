import React from 'react';
import { Navigate } from 'react-router-dom';

/**
 * ProtectedRoute component that checks if the user is authenticated
 * If authenticated, renders the children components
 * If not authenticated, redirects to the login page
 * 
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components to render if authenticated
 * @returns {JSX.Element} The protected route component
 */
const ProtectedRoute = ({ children }) => {
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