import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
  useColorScheme,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { auditApi } from "@/lib/api";
import type { AuditLog } from "@/lib/types";
import Colors from "@/constants/Colors";
import { useUser } from "@/lib/UserContext";

const formatDateTime = (value: string) => {
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? value : d.toLocaleString();
};

const displayValue = (v: string | null) => (v ? v : "—");

export default function AuditLogListScreen() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? "light"];
  const styles = getStyles(theme);
  const { canEdit, loading: userLoading } = useUser();
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAuditLogs = useCallback(async () => {
    setLoading(true);
    try {
      const data = await auditApi.list();
      setAuditLogs(data);
    } catch (e) {
      console.error("Failed to load audit logs:", e);
      setAuditLogs([]);
    } finally {
      setLoading(false);
    }
  }, []);


  useFocusEffect(
    useCallback(() => {
      if (userLoading || !canEdit) {
        return;
      }
      loadAuditLogs();
    }, [loadAuditLogs, canEdit, userLoading])
  );

  // Redirect if user doesn't have permission
  if (!userLoading && !canEdit) {
    return (
      <View style={styles.center}>
        <Text style={{ fontSize: 16, color: theme.text, textAlign: "center" }}>
          You don't have permission to view audit logs. Only editors and administrators can access audit logs.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Audit Logs</Text>
        <Pressable style={styles.refreshBtn} onPress={loadAuditLogs}>
          <Text style={styles.refreshText}>Refresh</Text>
        </Pressable>
      </View>

      <View style={styles.tableHeader}>
        <Text style={[styles.th, styles.thDate]}>Date/Time</Text>
        <Text style={[styles.th, styles.thUser]}>User ID</Text>
        <Text style={[styles.th, styles.thTable]}>Table</Text>
        <Text style={[styles.th, styles.thField]}>Field</Text>
        <Text style={[styles.th, styles.thChange]}>Change</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={theme.tint} style={styles.loader} />
      ) : auditLogs.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No audit logs found.</Text>
        </View>
      ) : (
        <FlatList
          data={auditLogs}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.row}>
              <Text style={[styles.td, styles.tdDate]}>
                {formatDateTime(item.event_time)}
              </Text>

              <Text style={[styles.td, styles.tdUser]} numberOfLines={1}>
                {item.user_id}
              </Text>

              <Text style={[styles.td, styles.tdTable]} numberOfLines={1}>
                {item.table_name}
              </Text>

              <Text style={[styles.td, styles.tdField]} numberOfLines={1}>
                {item.field_name}
              </Text>

              <View style={styles.changeCell}>
                <Text style={styles.beforeAfterLabel}>Before</Text>
                <Text style={styles.beforeAfterValue} numberOfLines={2}>
                  {displayValue(item.before_value)}
                </Text>

                <Text
                  style={[styles.beforeAfterLabel, { marginTop: 6 }]}
                >
                  After
                </Text>
                <Text style={styles.beforeAfterValue} numberOfLines={2}>
                  {displayValue(item.after_value)}
                </Text>
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
}

const getStyles = (theme: typeof Colors.light) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background },

    headerRow: {
      paddingHorizontal: 12,
      paddingTop: 14,
      paddingBottom: 8,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    title: { fontSize: 18, fontWeight: "700", color: theme.text },
    refreshBtn: {
      backgroundColor: theme.tint,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 8,
    },
    refreshText: { color: theme.onTint, fontWeight: "700", fontSize: 12 },

    tableHeader: {
      flexDirection: "row",
      paddingHorizontal: 12,
      paddingVertical: 10,
      backgroundColor: theme.card,
      borderTopWidth: 1,
      borderBottomWidth: 1,
      borderColor: theme.border,
    },
    th: { fontSize: 12, fontWeight: "700", color: theme.mutedText },
    thDate: { flex: 2.1 },
    thUser: { flex: 1.1 },
    thTable: { flex: 1.3 },
    thField: { flex: 1.3 },
    thChange: { flex: 2.6 },

    loader: { marginTop: 40 },

    empty: { flex: 1, justifyContent: "center", alignItems: "center", padding: 40 },
    emptyText: { fontSize: 16, color: theme.subtleText, textAlign: "center" },

    list: { paddingVertical: 8 },

    row: {
      flexDirection: "row",
      gap: 8,
      paddingHorizontal: 12,
      paddingVertical: 12,
      backgroundColor: theme.card,
      borderBottomWidth: 1,
      borderColor: theme.border,
    },

  td: { fontSize: 12, color: theme.text },
  tdDate: { flex: 2.1 },
  tdUser: { flex: 1.1 },
  tdTable: { flex: 1.3 },
  tdField: { flex: 1.3 },

  changeCell: { flex: 2.6 },
  beforeAfterLabel: { fontSize: 10, color: theme.subtleText, fontWeight: "700" },
  beforeAfterValue: { fontSize: 12, color: theme.text },
});
