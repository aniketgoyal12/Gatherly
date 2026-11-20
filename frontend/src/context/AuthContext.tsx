import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { User, UserRole, ApiResponse } from '@/types';
import { apiClient } from '@/api/client';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password?: string) => Promise<User>;
  register: (name: string, email: string, password: string, role?: UserRole) => Promise<User>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<User | null>;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const savedUser = localStorage.getItem('gatherly_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('gatherly_token');
  });

  const [loading, setLoading] = useState<boolean>(true);

  // Sync / refresh user profile from backend
  const refreshUser = useCallback(async (): Promise<User | null> => {
    try {
      const res = await apiClient.get<ApiResponse<{ user: User }>>('/auth/me');
      const currentUser = res.data?.data?.user;
      if (currentUser) {
        setUser(currentUser);
        localStorage.setItem('gatherly_user', JSON.stringify(currentUser));
        return currentUser;
      }
      return null;
    } catch {
      // If token is invalid or endpoint fails, keep local cache or clear if unauthorized
      return null;
    }
  }, []);

  // Initial session verification
  useEffect(() => {
    const initAuth = async () => {
      const existingToken = localStorage.getItem('gatherly_token');
      if (existingToken) {
        try {
          await refreshUser();
        } catch {
          // Handled inside refreshUser
        }
      }
      setLoading(false);
    };

    initAuth();
  }, [refreshUser]);

  const login = async (email: string, password = 'Password@123'): Promise<User> => {
    setLoading(true);
    try {
      const res = await apiClient.post<ApiResponse<{ user: User; token: string; accessToken?: string }>>(
        '/auth/login',
        { email, password }
      );

      const responseData = res.data?.data;
      const loggedUser = responseData?.user;
      const authToken = responseData?.token || responseData?.accessToken;

      if (!loggedUser || !authToken) {
        throw new Error(res.data?.message || 'Login failed to return credentials');
      }

      setUser(loggedUser);
      setToken(authToken);
      localStorage.setItem('gatherly_user', JSON.stringify(loggedUser));
      localStorage.setItem('gatherly_token', authToken);

      return loggedUser;
    } finally {
      setLoading(false);
    }
  };

  const register = async (
    name: string,
    email: string,
    password = 'password123',
    role: UserRole = 'attendee'
  ): Promise<User> => {
    setLoading(true);
    try {
      const res = await apiClient.post<ApiResponse<{ user: User; token: string; accessToken?: string }>>(
        '/auth/register',
        { name, email, password, role }
      );

      const responseData = res.data?.data;
      const registeredUser = responseData?.user;
      const authToken = responseData?.token || responseData?.accessToken;

      if (!registeredUser || !authToken) {
        throw new Error(res.data?.message || 'Registration failed to return user data');
      }

      setUser(registeredUser);
      setToken(authToken);
      localStorage.setItem('gatherly_user', JSON.stringify(registeredUser));
      localStorage.setItem('gatherly_token', authToken);

      return registeredUser;
    } finally {
      setLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await apiClient.post('/auth/logout', {});
    } catch {
      // Silently proceed with local cleanup
    } finally {
      setUser(null);
      setToken(null);
      localStorage.removeItem('gatherly_user');
      localStorage.removeItem('gatherly_token');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        loading,
        login,
        register,
        logout,
        refreshUser,
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
