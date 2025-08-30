import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute = ({ children, redirectTo = "/login" }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="spinner-fullscreen">
        <div className="spinner-icon" aria-hidden="true">✴</div>
      </div>
    );
  }

  // If not authenticated, redirect to login with return URL
  if (!isAuthenticated) {
    return (
      <Navigate 
        to={redirectTo} 
        state={{ from: location }} 
        replace 
      />
    );
  }

  // If authenticated, render the protected component
  return children;
};

// Higher-order component version
export const withProtectedRoute = (Component, redirectTo = "/login") => {
  return function ProtectedComponent(props) {
    return (
      <ProtectedRoute redirectTo={redirectTo}>
        <Component {...props} />
      </ProtectedRoute>
    );
  };
};

// Public route component (redirects authenticated users)
export const PublicRoute = ({ children, redirectTo = "/home" }) => {
  const { isAuthenticated, isLoading } = useAuth();

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="spinner-fullscreen">
        <div className="spinner-icon" aria-hidden="true">✴</div>
      </div>
    );
  }

  // If authenticated, redirect to home or specified route
  if (isAuthenticated) {
    return <Navigate to={redirectTo} replace />;
  }

  // If not authenticated, render the public component
  return children;
};

export default ProtectedRoute;