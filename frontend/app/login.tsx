// frontend/app/login.tsx
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { View, TextInput, Button, StyleSheet, Alert, Text, useColorScheme, Platform, Pressable } from 'react-native';
import { supabase } from '../lib/supabase'; // Make sure this path is correct
import { useRouter } from 'expo-router';
import Colors from "@/constants/Colors";
import RunningHorse from "@/components/RunningHorse";

// Animation phases: "top" -> "bottom" -> "waiting" -> "top" ...
type AnimPhase = "top" | "bottom" | "waiting";

export default function Login() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? "light"];
  const styles = getStyles(theme);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Horse animation state
  const [phase, setPhase] = useState<AnimPhase>("top");
  const [cycleKey, setCycleKey] = useState(0); // bump to re-trigger
  const waitTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Start the first cycle
    setPhase("top");
    return () => {
      if (waitTimer.current) clearTimeout(waitTimer.current);
    };
  }, []);

  const onTopFinished = useCallback(() => {
    setPhase("bottom");
  }, []);

  const onBottomFinished = useCallback(() => {
    setPhase("waiting");
    waitTimer.current = setTimeout(() => {
      setCycleKey((k) => k + 1);
      setPhase("top");
    }, 5000);
  }, []);

  // 1. Sign In Function
  async function signInWithEmail() {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      if (Platform.OS === 'web') {
        window.alert("Sign In Error: " + error.message);
      } else {
        Alert.alert("Sign In Error", error.message);
      }
    } else {
      const { data: { session } } = await supabase.auth.getSession();
      console.log("JWT:", session?.access_token);
    }
    setLoading(false);
    // The _layout.tsx listener will handle the redirect automatically
  }

  // 2. Sign Up Function
  async function signUpWithEmail() {
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      if (Platform.OS === 'web') {
        window.alert("Sign Up Error: " + error.message);
      } else {
        Alert.alert("Sign Up Error", error.message);
      }
    } else {
      if (Platform.OS === 'web') {
        window.alert("Success: Account created! You can now sign in.");
      } else {
        Alert.alert("Success", "Account created! You can now sign in.");
      }
    }
    setLoading(false);
  }

  return (
    <View style={styles.container}>
      <RunningHorse
        key={`top-${cycleKey}`}
        position="top"
        delay={0}
        running={phase === "top"}
        onFinished={onTopFinished}
      />

      <Text style={styles.header}>Horse Index Login</Text>
      <TextInput
        style={styles.input}
        onChangeText={setEmail}
        value={email}
        placeholder="email@address.com"
        placeholderTextColor={theme.mutedText}
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        onChangeText={setPassword}
        value={password}
        placeholder="Password"
        placeholderTextColor={theme.mutedText}
        secureTextEntry={true}
        autoCapitalize="none"
      />
      <Pressable style={styles.signInButton} disabled={loading} onPress={signInWithEmail}>
        <Text style={styles.signInText}>Sign In</Text>
      </Pressable>
      <Pressable style={styles.signUpButton} disabled={loading} onPress={signUpWithEmail}>
        <Text style={styles.signUpText}>Sign Up</Text>
      </Pressable>

      <RunningHorse
        key={`bottom-${cycleKey}`}
        position="bottom"
        delay={1000}
        running={phase === "bottom"}
        onFinished={onBottomFinished}
      />
    </View>
  );
}

const getStyles = (theme: typeof Colors.light) => StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20, backgroundColor: theme.background },
  header: { fontSize: 24, marginBottom: 20, textAlign: 'center', fontWeight: 'bold', color: theme.text },
  input: {
    height: 50,
    borderColor: theme.border,
    borderWidth: 1,
    borderRadius: 5,
    padding: 10,
    marginBottom: 15,
    backgroundColor: theme.card,
    color: theme.text,
  },
  signInButton: {
    backgroundColor: theme.tint,
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    marginTop: 10,
  },
  signInText: {
    color: theme.onTint,
    fontSize: 16,
    fontWeight: '700',
  },
  signUpButton: {
    backgroundColor: theme.chipBackground,
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    marginTop: 10,
  },
  signUpText: {
    color: theme.text,
    fontSize: 16,
    fontWeight: '600',
  },
});
