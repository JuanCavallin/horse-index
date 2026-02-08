import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { auditApi } from "@/lib/api";
import type { AuditLog } from "@/lib/types";

const formatDateTime = (value: string) => {
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? value : d.toLocaleString();
};

const displayValue = (v: string | null) => (v ? v : "—");

export default function AuditLogListScreen() {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [pingResult, setPingResult] = useState<string>("");

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

  const testPing = async () => {
    try {
      const API_URL =
        process.env.EXPO_PUBLIC_API_URL || "http://localhost:8000";
      const response = await fetch(`${API_URL}/ping`);
      const data = await response.json();
      setPingResult(data.message || JSON.stringify(data));
    } catch (e) {
      setPingResult(`Error: ${e}`);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadAuditLogs();
    }, [loadAuditLogs])
  );

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Audit Logs</Text>
        <Pressable style={styles.refreshBtn} onPress={loadAuditLogs}>
          <Text style={styles.refreshText}>Refresh</Text>
        </Pressable>
      </View>

      <View style={styles.pingSection}>
        <Pressable style={styles.pingButton} onPress={testPing}>
          <Text style={styles.pingButtonText}>Test: Ping backend</Text>
        </Pressable>
        {pingResult ? <Text style={styles.pingResult}>{pingResult}</Text> : null}
      </View>

      <View style={styles.tableHeader}>
        <Text style={[styles.th, styles.thDate]}>Date/Time</Text>
        <Text style={[styles.th, styles.thUser]}>User ID</Text>
        <Text style={[styles.th, styles.thTable]}>Table</Text>
        <Text style={[styles.th, styles.thField]}>Field</Text>
        <Text style={[styles.th, styles.thChange]}>Change</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#8B4513" style={styles.loader} />
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },

  headerRow: {
    paddingHorizontal: 12,
    paddingTop: 14,
    paddingBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: { fontSize: 18, fontWeight: "700", color: "#222" },
  refreshBtn: {
    backgroundColor: "#8B4513",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  refreshText: { color: "#fff", fontWeight: "700", fontSize: 12 },

  pingSection: {
    paddingHorizontal: 12,
    paddingBottom: 10,
    alignItems: "center",
    gap: 8,
  },
  pingButton: {
    backgroundColor: "#2196F3",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  pingButtonText: { color: "#fff", fontSize: 14, fontWeight: "600" },
  pingResult: { fontSize: 12, color: "#555", fontStyle: "italic" },

  tableHeader: {
    flexDirection: "row",
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#e6e6e6",
  },
  th: { fontSize: 12, fontWeight: "700", color: "#444" },
  thDate: { flex: 2.1 },
  thUser: { flex: 1.1 },
  thTable: { flex: 1.3 },
  thField: { flex: 1.3 },
  thChange: { flex: 2.6 },

  loader: { marginTop: 40 },

  empty: { flex: 1, justifyContent: "center", alignItems: "center", padding: 40 },
  emptyText: { fontSize: 16, color: "#999", textAlign: "center" },

  list: { paddingVertical: 8 },

  row: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderColor: "#efefef",
  },

  td: { fontSize: 12, color: "#333" },
  tdDate: { flex: 2.1 },
  tdUser: { flex: 1.1 },
  tdTable: { flex: 1.3 },
  tdField: { flex: 1.3 },

  changeCell: { flex: 2.6 },
  beforeAfterLabel: { fontSize: 10, color: "#777", fontWeight: "700" },
  beforeAfterValue: { fontSize: 12, color: "#222" },
});
