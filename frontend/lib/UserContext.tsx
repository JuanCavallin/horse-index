import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserRole } from './types';
import { usersApi } from './api';
import { supabase } from './supabase';

interface UserContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  isViewer: boolean;
  isEditor: boolean;
  isAdmin: boolean;
  canEdit: boolean; // editor or admin
  canDelete: boolean; // admin only
  refreshUser: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUser = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Check if user is authenticated
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setUser(null);
        return;
      }

      // Fetch user profile with role
      const userData = await usersApi.me();
      setUser(userData);
    } catch (err) {
      console.error('Error fetching user:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch user');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        fetchUser();
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const value: UserContextType = {
    user,
    loading,
    error,
    isViewer: user?.role === UserRole.viewer,
    isEditor: user?.role === UserRole.editor,
    isAdmin: user?.role === UserRole.administrator,
    canEdit: user?.role === UserRole.editor || user?.role === UserRole.administrator,
    canDelete: user?.role === UserRole.administrator,
    refreshUser: fetchUser,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
