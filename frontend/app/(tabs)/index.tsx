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
import { horsesApi } from "@/lib/api";
import { Horse, HealthStatus } from "@/lib/types";
import HorseCard from "@/components/HorseCard";
import Colors from "@/constants/Colors";

//TODO: recreate filters with different types of treatments currently being used
/**
 * const FILTERS: (HealthStatus | null)[] = [
  null,
  HealthStatus.healthy,
  HealthStatus.needs_attention,
  HealthStatus.critical,
  HealthStatus.palliative,
];
 * 
 */


export default function HorseListScreen() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? "light"];
  const styles = getStyles(theme);
  const [horses, setHorses] = useState<Horse[]>([]);
  const [loading, setLoading] = useState(true);
  //const [filter, setFilter] = useState<HealthStatus | null>(null);
  const [pingResult, setPingResult] = useState<string>("");

  const loadHorses = useCallback(async () => {
    setLoading(true);
    try {
      const data = await horsesApi.list(/*filter ?? undefined*/);
      setHorses(data);
    } catch (e) {
      console.error("Failed to load horses:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  const testPing = async () => {
    try {
      const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:8000";
      const response = await fetch(`${API_URL}/ping`);
      const data = await response.json();
      setPingResult(data.message || JSON.stringify(data));
    } catch (e) {
      setPingResult(`Error: ${e}`);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadHorses();
    }, [loadHorses])
  );

  return (
    
    <View style={styles.container}>
      {/*
      <View style={styles.filterRow}>
        {FILTERS.map((f) => (
          <Pressable
            key={f ?? "all"}
            style={[styles.filterChip, filter === f && styles.filterChipActive]}
            onPress={() => setFilter(f)}
          >
            <Text
              style={[
                styles.filterText,
                filter === f && styles.filterTextActive,
              ]}
            >
              {f ? f.replace("_", " ") : "All"}
            </Text>
          </Pressable>
        ))}
      </View>
      */}
      <View style={styles.pingSection}>
        <Pressable style={styles.pingButton} onPress={testPing}>
          <Text style={styles.pingButtonText}>Test: Ping backend</Text>
        </Pressable>
        {pingResult ? (
          <Text style={styles.pingResult}>{pingResult}</Text>
        ) : null}
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={theme.tint} style={styles.loader} />
      ) : horses.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>
            No horses found. Tap "Add Horse" to get started.
          </Text>
        </View>
      ) : (
        <FlatList
          data={horses}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => <HorseCard horse={item} />}
          contentContainerStyle={styles.list}
        />
      )}
    </View>
  );
}

const getStyles = (theme: typeof Colors.light) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background },
    filterRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 6,
      padding: 12,
      paddingBottom: 4,
    },
    filterChip: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      backgroundColor: theme.chipBackground,
    },
    filterChipActive: { backgroundColor: theme.tint },
    filterText: { fontSize: 12, color: theme.mutedText, textTransform: "capitalize" },
    filterTextActive: { color: theme.onTint },
    pingSection: {
      padding: 12,
      alignItems: "center",
      gap: 8,
    },
    pingButton: {
      backgroundColor: theme.info,
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 8,
    },
    pingButtonText: {
      color: theme.onTint,
      fontSize: 14,
      fontWeight: "600",
    },
    pingResult: {
      fontSize: 12,
      color: theme.mutedText,
      fontStyle: "italic",
    },
    loader: { marginTop: 40 },
    empty: { flex: 1, justifyContent: "center", alignItems: "center", padding: 40 },
    emptyText: { fontSize: 16, color: theme.subtleText, textAlign: "center" },
    list: { paddingVertical: 8 },
  });
