/**
 * ProtectedRoute Component
 * Guards routes that require authentication and specific roles
 */

import { ReactNode } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useLocation } from 'wouter';
import { Spinner } from './ui/spinner';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: 'user' | 'admin';
}

export const ProtectedRoute = ({ children, requiredRole }: ProtectedRouteProps) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const [, setLocation] = useLocation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner />
      </div>
    );
  }

  if (!isAuthenticated) {
    setLocation('/login');
    return null;
  }

  if (requiredRole && user?.role !== requiredRole) {
    // If user is not an admin and tries to access admin route, redirect to dashboard
    if (requiredRole === 'admin') {
      setLocation('/dashboard');
    } else {
      setLocation('/');
    }
    return null;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
