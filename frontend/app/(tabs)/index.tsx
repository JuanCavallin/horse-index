import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  useColorScheme,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import FontAwesome from "@expo/vector-icons/FontAwesome";
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
  const [searchQuery, setSearchQuery] = useState("");
  //const [filter, setFilter] = useState<HealthStatus | null>(null);

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

  // Filter horses based on search query
  const filteredHorses = horses.filter((horse) => {
    const query = searchQuery.toLowerCase();
    return (
      horse.name.toLowerCase().includes(query) ||
      (horse.breed && horse.breed.toLowerCase().includes(query)) ||
      (horse.color && horse.color.toLowerCase().includes(query))
    );
  });


  useFocusEffect(
    useCallback(() => {
      loadHorses();
    }, [loadHorses])
  );

  return (
    
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <FontAwesome name="search" size={18} color={theme.mutedText} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name, breed, or color..."
          placeholderTextColor={theme.mutedText}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery ? (
          <Pressable onPress={() => setSearchQuery("")}>
            <FontAwesome name="times-circle" size={18} color={theme.mutedText} />
          </Pressable>
        ) : null}
      </View>
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
      {loading ? (
        <ActivityIndicator size="large" color={theme.tint} style={styles.loader} />
      ) : filteredHorses.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>
            {searchQuery
              ? "No horses found matching your search."
              : "No horses found. Tap \"Add Horse\" to get started."}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredHorses}
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
    searchContainer: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.card,
      borderRadius: 12,
      marginHorizontal: 16,
      marginTop: 12,
      marginBottom: 12,
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderWidth: 1,
      borderColor: theme.border,
    },
    searchInput: {
      flex: 1,
      marginHorizontal: 8,
      fontSize: 16,
      color: theme.text,
    },
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
    loader: { marginTop: 40 },
    empty: { flex: 1, justifyContent: "center", alignItems: "center", padding: 40 },
    emptyText: { fontSize: 16, color: theme.subtleText, textAlign: "center" },
    list: { paddingVertical: 8 },
  });
