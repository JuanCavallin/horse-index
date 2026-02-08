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
import { useRouter } from "expo-router";
import { horsesApi } from "@/lib/api";
import { Horse } from "@/lib/types";
import HorseCard from "@/components/HorseCard";
import Colors from "@/constants/Colors";

export default function ArchiveScreen() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? "light"];
  const styles = getStyles(theme);
  const router = useRouter();
  const [horses, setHorses] = useState<Horse[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const loadHorses = useCallback(async () => {
    setLoading(true);
    try {
      const data = await horsesApi.list();
      setHorses(data);
    } catch (e) {
      console.error("Failed to load archived horses:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  const filteredHorses = horses.filter((horse) => {
    const query = searchQuery.toLowerCase();
    return (
      horse.deceased &&
      (
        horse.name.toLowerCase().includes(query) ||
        (horse.breed && horse.breed.toLowerCase().includes(query)) ||
        (horse.color && horse.color.toLowerCase().includes(query))
      )
    );
  });

  useFocusEffect(
    useCallback(() => {
      loadHorses();
    }, [loadHorses])
  );

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <FontAwesome name="chevron-left" size={14} color={theme.text} />
          <Text style={styles.backText}>Back</Text>
        </Pressable>
        <Text style={styles.title}>Archive</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.searchContainer}>
        <FontAwesome name="search" size={18} color={theme.mutedText} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search archived horses..."
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

      {loading ? (
        <ActivityIndicator size="large" color={theme.tint} style={styles.loader} />
      ) : filteredHorses.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>
            {searchQuery
              ? "No archived horses found."
              : "No horses in the archive yet."}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredHorses}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => <HorseCard horse={item} showArchiveStatus={true} />}
          contentContainerStyle={styles.list}
        />
      )}
    </View>
  );
}

const getStyles = (theme: typeof Colors.light) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background },
    headerRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingTop: 12,
      paddingBottom: 4,
    },
    title: { fontSize: 20, fontWeight: "700", color: theme.text },
    headerSpacer: { width: 54 },
    backButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingVertical: 6,
      paddingHorizontal: 8,
      borderRadius: 999,
      backgroundColor: theme.card,
      borderWidth: 1,
      borderColor: theme.border,
    },
    backText: { fontSize: 12, fontWeight: "600", color: theme.text },
    searchContainer: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.card,
      borderRadius: 12,
      marginHorizontal: 16,
      marginTop: 8,
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
    loader: { marginTop: 40 },
    empty: { flex: 1, justifyContent: "center", alignItems: "center", padding: 40 },
    emptyText: { fontSize: 16, color: theme.subtleText, textAlign: "center" },
    list: { paddingVertical: 8 },
  });
