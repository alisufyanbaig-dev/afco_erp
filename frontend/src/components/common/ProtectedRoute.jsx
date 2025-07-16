import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import LoginPage from '../../pages/auth/login';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  // Temporarily bypass authentication for UI testing
  return children;

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return children;
};

export default ProtectedRoute;