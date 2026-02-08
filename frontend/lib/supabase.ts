import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || "";

// --- 1. Create a Helper to check environment ---
const isServer = Platform.OS === 'web' && typeof window === 'undefined';

// --- 2. Create a "Safe" Storage Adapter ---
const SupabaseStorage = {
  getItem: (key: string) => {
    if (isServer) return Promise.resolve(null); // Don't crash on server
    return AsyncStorage.getItem(key);
  },
  setItem: (key: string, value: string) => {
    if (isServer) return Promise.resolve(); // Don't crash on server
    return AsyncStorage.setItem(key, value);
  },
  removeItem: (key: string) => {
    if (isServer) return Promise.resolve(); // Don't crash on server
    return AsyncStorage.removeItem(key);
  },
};

// --- 3. Use the Adapter in the Client ---
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: SupabaseStorage, // <--- Use our custom wrapper
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});