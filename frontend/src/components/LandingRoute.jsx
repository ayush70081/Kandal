import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import LandingPage from "./LandingPage";

const LandingRoute = () => {
  const { isAuthenticated, isLoading } = useAuth();

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="spinner-fullscreen">
        <div className="spinner-icon" aria-hidden="true">
          ✴
        </div>
      </div>
    );
  }

  // If authenticated, redirect to reports page
  if (isAuthenticated) {
    return <Navigate to="/reports" replace />;
  }

  // If not authenticated, show landing page
  return <LandingPage />;
};

export default LandingRoute;
