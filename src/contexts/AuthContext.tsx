import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AuthContextType {
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in (simple session check)
    const adminSession = localStorage.getItem('admin_session');
    if (adminSession) {
      setIsAuthenticated(true);
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      // For demo purposes, we'll use a simple hardcoded admin login
      // In production, you'd implement proper password hashing and verification
      if (email === 'admin@nuhali.xyz' && password === 'admin123') {
        localStorage.setItem('admin_session', 'true');
        setIsAuthenticated(true);
        toast.success('Logged in successfully');
        return true;
      } else {
        toast.error('Invalid credentials');
        return false;
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Login failed');
      return false;
    }
  };

  const logout = async (): Promise<void> => {
    localStorage.removeItem('admin_session');
    setIsAuthenticated(false);
    toast.success('Logged out successfully');
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};