import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Platform } from "react-native";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { User, UserRole } from './types';
import { usersApi, pushTokensApi } from './api';
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

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

async function registerForPushNotificationsAsync(): Promise<string | null> {
  if (Constants.appOwnership === "expo") {
    console.warn("Push notifications are disabled in Expo Go.");
    return null;
  }

  if (!Device.isDevice) {
    console.warn("Push notifications require a physical device.");
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    console.warn("Push notification permissions not granted.");
    return null;
  }

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
    });
  }

  try {
    const tokenResponse = await Notifications.getExpoPushTokenAsync();
    return tokenResponse.data;
  } catch (err) {
    console.warn("Push token registration skipped:", err);
    return null;
  }
}

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewerMode, setViewerMode] = useState(false);
  const [pushRegistered, setPushRegistered] = useState(false);

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

  useEffect(() => {
    if (!user) {
      setPushRegistered(false);
    }
  }, [user]);

  useEffect(() => {
    if (!user || pushRegistered) return;

    let cancelled = false;

    (async () => {
      try {
        console.log("🔔 Starting push token registration...");
        const token = await registerForPushNotificationsAsync();
        console.log("🔔 Got token:", token);
        
        if (!token || cancelled) {
          console.log("🔔 No token or cancelled, skipping registration");
          return;
        }

        console.log("🔔 Registering token with backend...");
        await pushTokensApi.register({ token, platform: Platform.OS });
        console.log("🔔 ✅ Push token registered successfully!");
        
        if (!cancelled) {
          setPushRegistered(true);
        }
      } catch (err) {
        console.error("🔔 ❌ Failed to register push token:", err);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user, pushRegistered]);

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
