import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService, LoginData, RegisterData } from '../services/auth';

interface User {
  id: number;
  name: string;
  email: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;
  login: (data: LoginData) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load authentication state on app startup
  useEffect(() => {
    loadAuthState();
  }, []);

  const loadAuthState = async () => {
    try {
      console.log('[Auth] Loading authentication state...');
      const token = await AsyncStorage.getItem('auth_token');
      const userData = await AsyncStorage.getItem('user');

      if (token && userData) {
        console.log('[Auth] Token found in AsyncStorage');
        setIsAuthenticated(true);
        setUser(JSON.parse(userData));
      } else {
        console.log('[Auth] No token found in AsyncStorage');
        setIsAuthenticated(false);
        setUser(null);
      }
    } catch (error) {
      console.error('[Auth] Error loading authentication state:', error);
      setIsAuthenticated(false);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (data: LoginData) => {
    try {
      console.log('[Auth] Starting login...');
      setIsLoading(true);
      const response = await authService.login(data);

      // Token is saved in authService.login, now update local state
      if (response.token && response.user) {
        console.log('[Auth] Login successful, updating auth state');
        setIsAuthenticated(true);
        setUser(response.user);

        // Trigger WebSocket reconnection now that we have a token
        console.log('[Auth] Triggering WebSocket reconnection after login');
        const { useWebSocket } = await import('./WebSocketContext');
        // This will be called inside the component that uses the hook
      }
    } catch (error) {
      console.error('[Auth] Login failed:', error);
      setIsAuthenticated(false);
      setUser(null);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: RegisterData) => {
    try {
      console.log('[Auth] Starting registration...');
      setIsLoading(true);
      const response = await authService.register(data);

      // Token is saved in authService.register, now update local state
      if (response.token && response.user) {
        console.log('[Auth] Registration successful, updating auth state');
        setIsAuthenticated(true);
        setUser(response.user);
      }
    } catch (error) {
      console.error('[Auth] Registration failed:', error);
      setIsAuthenticated(false);
      setUser(null);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      console.log('[Auth] Starting logout...');
      setIsLoading(true);
      await authService.logout();

      console.log('[Auth] Logout complete, clearing auth state');
      setIsAuthenticated(false);
      setUser(null);
    } catch (error) {
      console.error('[Auth] Logout error:', error);
      // Still clear local state even if logout fails
      setIsAuthenticated(false);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        user,
        isLoading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
