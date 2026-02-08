import { useState, useEffect } from "react";
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
  useColorScheme,
} from "react-native";
import { router } from "expo-router";
import { supabase } from "@/lib/supabase";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import Colors from "@/constants/Colors";

export default function ProfileScreen() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? "light"];
  const styles = getStyles(theme);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    loadUser();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadUser = async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) throw error;
      setUser(user);
    } catch (error) {
      console.error("Error loading user:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Logout",
          style: "destructive",
          onPress: async () => {
            setLoggingOut(true);
            try {
              const { error } = await supabase.auth.signOut();
              if (error) throw error;
              
              // Clear local user state
              setUser(null);
              
              // The auth state listener in _layout.tsx will automatically redirect to login
              console.log("User logged out successfully");
            } catch (error) {
              console.error("Error logging out:", error);
              Alert.alert("Error", "Failed to logout. Please try again.");
              setLoggingOut(false);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={theme.tint} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <FontAwesome name="user-circle" size={80} color={theme.tint} />
        <Text style={styles.headerText}>Profile</Text>
      </View>

      <View style={styles.infoSection}>
        {user ? (
          <>
            <View style={styles.infoRow}>
              <FontAwesome name="envelope" size={20} color={theme.mutedText} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Email</Text>
                <Text style={styles.infoValue}>{user.email || "Not available"}</Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <FontAwesome name="id-card" size={20} color={theme.mutedText} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>User ID</Text>
                <Text style={styles.infoValue} numberOfLines={1}>
                  {user.id || "Not available"}
                </Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <FontAwesome name="calendar" size={20} color={theme.mutedText} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Member Since</Text>
                <Text style={styles.infoValue}>
                  {user.created_at
                    ? new Date(user.created_at).toLocaleDateString()
                    : "Not available"}
                </Text>
              </View>
            </View>
          </>
        ) : (
          <View style={styles.notLoggedIn}>
            <FontAwesome name="user-times" size={40} color={theme.subtleText} />
            <Text style={styles.notLoggedInText}>Not logged in</Text>
          </View>
        )}
      </View>

      <View style={styles.actionsSection}>
        {user && (
          <Pressable
            style={({ pressed }) => [
              styles.logoutButton,
              pressed && styles.buttonPressed,
            ]}
            onPress={handleLogout}
            disabled={loggingOut}
          >
            {loggingOut ? (
              <ActivityIndicator color={theme.onTint} />
            ) : (
              <>
                <FontAwesome name="sign-out" size={20} color={theme.onTint} />
                <Text style={styles.logoutButtonText}>Logout</Text>
              </>
            )}
          </Pressable>
        )}
      </View>
    </View>
  );
}

const getStyles = (theme: typeof Colors.light) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    centerContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: theme.background,
    },
    header: {
      backgroundColor: theme.card,
      alignItems: "center",
      paddingVertical: 40,
      paddingHorizontal: 20,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    headerText: {
      fontSize: 24,
      fontWeight: "bold",
      color: theme.text,
      marginTop: 16,
    },
    infoSection: {
      backgroundColor: theme.card,
      marginTop: 20,
      padding: 20,
      borderTopWidth: 1,
      borderBottomWidth: 1,
      borderColor: theme.border,
    },
    infoRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    infoContent: {
      flex: 1,
      marginLeft: 16,
    },
    infoLabel: {
      fontSize: 12,
      color: theme.subtleText,
      marginBottom: 4,
    },
    infoValue: {
      fontSize: 16,
      color: theme.text,
      fontWeight: "500",
    },
    notLoggedIn: {
      alignItems: "center",
      paddingVertical: 40,
    },
    notLoggedInText: {
      fontSize: 16,
      color: theme.subtleText,
      marginTop: 12,
    },
    actionsSection: {
      padding: 20,
      marginTop: 20,
    },
    logoutButton: {
      backgroundColor: theme.danger,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 16,
      paddingHorizontal: 24,
      borderRadius: 8,
      gap: 12,
    },
    buttonPressed: {
      opacity: 0.7,
    },
    logoutButtonText: {
      color: theme.onTint,
      fontSize: 16,
      fontWeight: "600",
    },
  });
