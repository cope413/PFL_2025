'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiService } from '@/lib/api';

interface User {
  id: string;
  username: string;
  team: string;
  team_name?: string;
  email?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string, teamId: string) => Promise<void>;
  logout: () => void;
  updateProfile: (updates: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Check if user is authenticated on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await apiService.getCurrentUser();
        setUser(currentUser as User);
      } catch (error) {
        // User is not authenticated
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (username: string, password: string) => {
    try {
      const result = await apiService.login({ username, password });
      setUser(result.user as User);
    } catch (error) {
      throw error;
    }
  };

  const register = async (username: string, password: string, teamId: string) => {
    try {
      const result = await apiService.register({ username, password, teamId });
      setUser(result.user as User);
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    apiService.logout();
    setUser(null);
  };

  const updateProfile = async (updates: Partial<User>) => {
    try {
      const updatedUser = await apiService.updateProfile(updates);
      setUser(updatedUser as User);
    } catch (error) {
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    login,
    register,
    logout,
    updateProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 