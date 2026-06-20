/**
 * useAuth Hook
 * Custom hook for authentication logic
 */

import { useEffect, useCallback } from 'react';
import { useAuthStore } from '../app/stores';
import { authService } from '../firebase/services';

export const useAuth = () => {
  const { user, isLoading, error, setUser, setLoading, setError } = useAuthStore();

  // Helper function to fetch user profile
  const fetchUserProfile = useCallback(
    async (userId: string) => {
      try {
        const userProfile = await authService.getUserProfile(userId);
        if (userProfile) {
          setUser(userProfile);
        }
      } catch (error) {
        console.error('Failed to fetch user profile:', error);
      }
    },
    [setUser]
  );

  // Listen to auth state changes
  useEffect(() => {
    setLoading(true);
    const unsubscribe = authService.onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        await fetchUserProfile(firebaseUser.uid);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [setUser, setLoading, fetchUserProfile]);

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      const user = await authService.login(email, password);
      return user;
      // User data will be fetched by onAuthStateChanged listener
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const register = async (
    email: string,
    password: string,
    displayName: string,
    fatherName: string,
    country: string
  ) => {
    try {
      setLoading(true);
      setError(null);
      const user = await authService.register(email, password, displayName, fatherName, country);
      return user;
      // User data will be fetched by onAuthStateChanged listener
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      setError(null);
      await authService.logout();
      setUser(null);
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const refreshUserProfile = useCallback(async () => {
    if (user) {
      await fetchUserProfile(user.id);
    }
  }, [user, fetchUserProfile]);

  return {
    user,
    isLoading,
    error,
    login,
    register,
    logout,
    refreshUserProfile,
    isAuthenticated: !!user,
  };
};
