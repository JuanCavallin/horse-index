import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserRole } from './types';
import { usersApi } from './api';
import { supabase } from './supabase';

interface UserContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  role: UserRole | null;
  effectiveRole: UserRole | null;
  isViewer: boolean;
  isEditor: boolean;
  isAdmin: boolean;
  canEdit: boolean; // editor or admin
  canDelete: boolean; // admin only
  viewerMode: boolean;
  enableViewerMode: () => void;
  disableViewerMode: () => void;
  refreshUser: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewerMode, setViewerMode] = useState(false);

  const fetchUser = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Check if user is authenticated
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setUser(null);
        setViewerMode(false);
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
        setViewerMode(false);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const effectiveRole = viewerMode ? UserRole.viewer : user?.role ?? null;

  const value: UserContextType = {
    user,
    loading,
    error,
    role: user?.role ?? null,
    effectiveRole,
    isViewer: effectiveRole === UserRole.viewer,
    isEditor: effectiveRole === UserRole.editor,
    isAdmin: effectiveRole === UserRole.administrator,
    canEdit: effectiveRole === UserRole.editor || effectiveRole === UserRole.administrator,
    canDelete: effectiveRole === UserRole.editor || effectiveRole === UserRole.administrator,
    viewerMode,
    enableViewerMode: () => setViewerMode(true),
    disableViewerMode: () => setViewerMode(false),
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
