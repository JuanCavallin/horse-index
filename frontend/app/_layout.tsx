import FontAwesome from "@expo/vector-icons/FontAwesome";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack, Slot, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";
import { useColorScheme, View, ActivityIndicator } from "react-native";
import "react-native-reanimated";
import { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase'; // <--- Check this path!
import Colors from "@/constants/Colors";
import { UserProvider } from '../lib/UserContext';

export { ErrorBoundary } from "expo-router";

export const unstable_settings = {
  initialRouteName: "(tabs)",
};

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? "light"];
  const [loaded, error] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
    ...FontAwesome.font,
  });

  // --- AUTH STATE ---
  const [session, setSession] = useState<Session | null>(null);
  const [isAuthInitialized, setIsAuthInitialized] = useState(false);
  
  const router = useRouter();
  const segments = useSegments();

  // 1. Handle Fonts & Errors
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  // 2. Handle Auth Session
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setIsAuthInitialized(true);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // 3. Protect the Routes
  useEffect(() => {
    if (!isAuthInitialized || !loaded) return;
    const firstSegment = segments[0] as string;

    const inAuthGroup = firstSegment === '(auth)'; // or however you group auth screens
    const isLoginPage = firstSegment === 'login'; // Check if on login page

    if (!session && !isLoginPage) {
      // Not logged in? Go to login
      router.replace('/login');
    } else if (session && isLoginPage) {
      // Logged in but on login page? Go to tabs
      router.replace('/(tabs)');
    }
  }, [session, segments, isAuthInitialized, loaded]);

  // 4. Loading Screen (Wait for fonts AND auth check)
  if (!loaded || !isAuthInitialized) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.background }}>
        <ActivityIndicator size="large" color={theme.tint} />
      </View>
    );
  }

  // 5. The App
  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <UserProvider>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="login" options={{ headerShown: false }} /> 
           <Stack.Screen name="archive" options={{ headerShown: false }} />
           <Stack.Screen name="horse/[id]" options={{ headerShown: false }} />
           <Stack.Screen name="horse/edit/[id]" options={{ headerShown: false }} />
        </Stack>
      </UserProvider>
    </ThemeProvider>
  );
}