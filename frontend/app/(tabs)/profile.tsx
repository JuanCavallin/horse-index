import { useState, useEffect } from "react";
import {
  Alert,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
  ScrollView,
  ActivityIndicator,
  useColorScheme,
} from "react-native";
import { supabase } from "@/lib/supabase";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import Colors from "@/constants/Colors";
import { useUser } from "@/lib/UserContext";
import { UserRole } from "@/lib/types";
import { horsesApi } from "@/lib/api";

export default function ProfileScreen() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? "light"];
  const styles = getStyles(theme);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const { role, viewerMode, enableViewerMode, disableViewerMode } = useUser();
  const isElevated = role === UserRole.editor || role === UserRole.administrator;
  const roleLabel = role === UserRole.administrator ? "ADMIN" : "EDITOR";

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

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = async () => {
    setLoggingOut(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      // Clear local user state
      setUser(null);
      setShowLogoutModal(false);
      
      // The auth state listener in _layout.tsx will automatically redirect to login
      console.log("User logged out successfully");
    } catch (error) {
      console.error("Error logging out:", error);
      Alert.alert("Error", "Failed to logout. Please try again.");
      setLoggingOut(false);
      setShowLogoutModal(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={theme.tint} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <FontAwesome name="user-circle" size={80} color={theme.tint} />
        <Text style={styles.headerText}>Profile</Text>
        {isElevated && (
          <View style={styles.roleBadge}>
            <Text style={styles.roleBadgeText}>{roleLabel}</Text>
          </View>
        )}
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
        {user && isElevated && !viewerMode && (
          <Pressable
            style={({ pressed }) => [
              styles.viewerModeButton,
              pressed && styles.buttonPressed,
            ]}
            onPress={enableViewerMode}
          >
            <FontAwesome name="eye" size={18} color={theme.text} />
            <Text style={styles.viewerModeText}>View as Viewer</Text>
          </Pressable>
        )}
        {user && isElevated && viewerMode && (
          <Pressable
            style={({ pressed }) => [
              styles.viewerModeExitButton,
              pressed && styles.buttonPressed,
            ]}
            onPress={disableViewerMode}
          >
            <FontAwesome name="eye-slash" size={18} color={theme.onTint} />
            <Text style={styles.viewerModeExitText}>Exit Viewer View</Text>
          </Pressable>
        )}
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

      <Modal
        visible={showLogoutModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowLogoutModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Logout</Text>
            <Text style={[styles.modalMessage, { color: theme.subtleText }]}>
              Are you sure you want to logout?
            </Text>

            <View style={styles.modalButtons}>
              <Pressable
                style={({ pressed }) => [
                  styles.modalButtonCancel,
                  { borderColor: theme.border },
                  pressed && styles.buttonPressed,
                ]}
                onPress={() => setShowLogoutModal(false)}
                disabled={loggingOut}
              >
                <Text style={[styles.modalButtonText, { color: theme.text }]}>
                  Cancel
                </Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  styles.modalButtonLogout,
                  pressed && styles.buttonPressed,
                ]}
                onPress={confirmLogout}
                disabled={loggingOut}
              >
                {loggingOut ? (
                  <ActivityIndicator color={theme.onTint} />
                ) : (
                  <Text style={styles.modalButtonLogoutText}>Logout</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
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
    roleBadge: {
      marginTop: 10,
      backgroundColor: theme.tint,
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 999,
    },
    roleBadgeText: {
      color: theme.onTint,
      fontSize: 12,
      fontWeight: "700",
      letterSpacing: 0.6,
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
      paddingBottom: 60,
      marginTop: 20,
      gap: 12,
    },
    viewerModeButton: {
      backgroundColor: theme.chipBackground,
      borderColor: theme.border,
      borderWidth: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 14,
      paddingHorizontal: 24,
      borderRadius: 8,
      gap: 10,
    },
    viewerModeText: {
      color: theme.text,
      fontSize: 15,
      fontWeight: "600",
    },
    viewerModeExitButton: {
      backgroundColor: theme.tint,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 14,
      paddingHorizontal: 24,
      borderRadius: 8,
      gap: 10,
    },
    viewerModeExitText: {
      color: theme.onTint,
      fontSize: 15,
      fontWeight: "700",
    },
    testButton: {
      backgroundColor: theme.card,
      borderColor: theme.border,
      borderWidth: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 14,
      paddingHorizontal: 24,
      borderRadius: 8,
      gap: 10,
    },
    testButtonText: {
      color: theme.text,
      fontSize: 15,
      fontWeight: "600",
    },
    testResultBox: {
      borderWidth: 1,
      borderRadius: 8,
      padding: 12,
      marginTop: 8,
      backgroundColor: theme.background,
    },
    testResultText: {
      fontSize: 13,
      fontWeight: "500",
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
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      justifyContent: "center",
      alignItems: "center",
      padding: 20,
    },
    modalContent: {
      borderRadius: 12,
      padding: 24,
      width: "100%",
      maxWidth: 400,
      gap: 16,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: "bold",
      textAlign: "center",
    },
    modalMessage: {
      fontSize: 16,
      textAlign: "center",
    },
    modalButtons: {
      flexDirection: "row",
      gap: 12,
      marginTop: 8,
    },
    modalButtonCancel: {
      flex: 1,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 8,
      borderWidth: 1,
      alignItems: "center",
      justifyContent: "center",
    },
    modalButtonLogout: {
      flex: 1,
      backgroundColor: theme.danger,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 8,
      alignItems: "center",
      justifyContent: "center",
    },
    modalButtonText: {
      fontSize: 15,
      fontWeight: "600",
    },
    modalButtonLogoutText: {
      fontSize: 15,
      fontWeight: "600",
      color: theme.onTint,
    },
  });
