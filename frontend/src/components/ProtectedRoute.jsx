import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from './LoadingSpinner';

const ProtectedRoute = ({ children }) => {
  const { isLoggedIn, isFirebaseActive, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Only redirect if Firebase is active and user is not logged in
    if (isFirebaseActive && !isLoggedIn && !isLoading) {
      console.log('Redirecting to login - user not authenticated');
      navigate('/login');
    }
  }, [isLoggedIn, isFirebaseActive, isLoading, navigate]);

  // Show loading while Firebase is initializing
  if (!isFirebaseActive || isLoading) {
    return <LoadingSpinner />;
  }

  // If user is not logged in, return null (redirect will happen in useEffect)
  if (!isLoggedIn) {
    return null;
  }

  // User is authenticated, render the protected content
  return <>{children}</>;
};

export default ProtectedRoute; 