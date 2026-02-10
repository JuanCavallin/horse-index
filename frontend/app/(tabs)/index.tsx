import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useColorScheme,
  StatusBar,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useRouter } from "expo-router";
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

// Keyword to field mappings for treatment/care filters
const KEYWORD_FIELD_MAP: Record<string, (horse: Horse) => boolean> = {
  "banamine": (h) => h.regular_treatment,
  "mash": (h) => h.requires_extra_mash,
  "feed": (h) => h.requires_extra_feed,
  "farrier": (h) => h.problem_with_farrier || h.seen_by_farrier || h.sedation_for_farrier,
  "sedation": (h) => h.sedation_for_farrier,
  "needles": (h) => h.problem_with_needles,
  "vet": (h) => h.seen_by_vet,
  "heart": (h) => h.heart_murmur,
  "murmur": (h) => h.heart_murmur,
  "cushings": (h) => h.cushings_positive,
  "heaves": (h) => h.heaves,
  "anhidrosis": (h) => h.anhidrosis,
  "shivers": (h) => h.shivers,
  "bites": (h) => h.bites,
  "kicks": (h) => h.kicks,
  "catch": (h) => h.difficult_to_catch,
  "racehorse": (h) => h.ex_racehorse,
  "military": (h) => h.military_police_horse,
  "police": (h) => h.military_police_horse,
};

const FILTER_CATEGORIES = {
  "Treatments": ["banamine"],
  "Feed": ["mash", "feed"],
  "Farrier": ["farrier", "sedation"],
  "Medical": ["heart", "murmur", "cushings", "heaves", "anhidrosis", "shivers", "vet", "needles"],
  "Behavior": ["bites", "kicks", "catch"],
  "Status": ["racehorse", "military", "police"],
};

function matchesQuery(horse: Horse, query: string): boolean {
  const lowerQuery = query.toLowerCase();
  
  // Check name, breed, color
  if (
    horse.name.toLowerCase().includes(lowerQuery) ||
    (horse.breed && horse.breed.toLowerCase().includes(lowerQuery)) ||
    (horse.color && horse.color.toLowerCase().includes(lowerQuery))
  ) {
    return true;
  }

  // Check keyword mappings for treatments/care
  if (KEYWORD_FIELD_MAP[lowerQuery]) {
    return KEYWORD_FIELD_MAP[lowerQuery](horse);
  }

  return false;
}

export default function HorseListScreen() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? "light"];
  const styles = getStyles(theme);
  const router = useRouter();
  const [horses, setHorses] = useState<Horse[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilters, setSelectedFilters] = useState<Set<string>>(new Set());
  const [showFiltersModal, setShowFiltersModal] = useState(false);
  const [showPastureModal, setShowPastureModal] = useState(false);
  const [uniquePastures, setUniquePastures] = useState<string[]>([]);
  //const [filter, setFilter] = useState<HealthStatus | null>(null);

  const loadHorses = useCallback(async () => {
    setLoading(true);
    try {
      const data = await horsesApi.list(/*filter ?? undefined*/);
      setHorses(data);
      
      // Extract unique non-empty pastures
      const pastures = Array.from(
        new Set(
          data
            .filter(horse => !horse.deceased && horse.pasture && horse.pasture.trim())
            .map(horse => horse.pasture!)
        )
      ).sort();
      setUniquePastures(pastures);
    } catch (e) {
      console.error("Failed to load horses:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  const toggleFilter = (keyword: string) => {
    const newFilters = new Set(selectedFilters);
    if (newFilters.has(keyword)) {
      newFilters.delete(keyword);
    } else {
      newFilters.add(keyword);
    }
    setSelectedFilters(newFilters);
  };

  const clearAllFilters = () => {
    setSelectedFilters(new Set());
  };

  // Filter horses based on search query and selected filters
  const filteredHorses = horses.filter((horse) => {
    if (horse.deceased) return false;
    
    // Check search query
    if (searchQuery && !matchesQuery(horse, searchQuery)) {
      return false;
    }

    // Check if matches any selected filter
    if (selectedFilters.size > 0) {
      return Array.from(selectedFilters).some((filter) => {
        // Check if it's a keyword filter
        const matchFn = KEYWORD_FIELD_MAP[filter];
        if (matchFn) {
          return matchFn(horse);
        }
        
        // Check if it's a pasture filter
        if (uniquePastures.includes(filter)) {
          return horse.pasture === filter;
        }
        
        return false;
      });
    }

    return true;
  });

  useFocusEffect(
    useCallback(() => {
      loadHorses();
    }, [loadHorses])
  );

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Mill Creek Farm</Text>
        <Pressable style={styles.archiveButton} onPress={() => router.push("/archive")}> 
          <Text style={styles.archiveText}>Archive</Text>
        </Pressable>
      </View>
      <View style={styles.searchRow}>
        <View style={styles.searchContainer}>
          <FontAwesome name="search" size={18} color={theme.mutedText} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name, breed, color..."
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
        <Pressable 
          style={[styles.filterButton, selectedFilters.size > 0 && styles.filterButtonActive]}
          onPress={() => setShowFiltersModal(true)}
        >
          <FontAwesome name="sliders" size={16} color={theme.mutedText} />
          {selectedFilters.size > 0 && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{selectedFilters.size}</Text>
            </View>
          )}
        </Pressable>
      </View>

      {/* Filters Modal */}
      <Modal
        visible={showFiltersModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowFiltersModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Filters</Text>
              <Pressable onPress={() => setShowFiltersModal(false)}>
                <FontAwesome name="times" size={20} color={theme.text} />
              </Pressable>
            </View>

            <ScrollView style={styles.modalBody}>
              {/* Pasture Section at Top */}
              {uniquePastures.length > 0 && (
                <Pressable 
                  style={styles.pastureHeaderButton}
                  onPress={() => setShowPastureModal(true)}
                >
                  <View style={styles.pastureHeaderContent}>
                    <Text style={[styles.categoryTitle, { color: theme.text }]}>Pasture</Text>
                    <Text style={[styles.pastureSubtext, { color: theme.mutedText }]}>
                      {Array.from(selectedFilters).some(f => uniquePastures.includes(f))
                        ? `${Array.from(selectedFilters).filter(f => uniquePastures.includes(f)).length} selected`
                        : 'Select pastures'}
                    </Text>
                  </View>
                  <FontAwesome name="chevron-right" size={16} color={theme.mutedText} />
                </Pressable>
              )}

              {/* Other Filter Categories */}
              {Object.entries(FILTER_CATEGORIES).map(([category, keywords]) => (
                <View key={category}>
                  <Text style={[styles.categoryTitle, { color: theme.text }]}>{category}</Text>
                  {keywords.map((keyword) => (
                    <Pressable
                      key={keyword}
                      style={[
                        styles.filterOption,
                        selectedFilters.has(keyword) && { backgroundColor: theme.chipBackground },
                      ]}
                      onPress={() => toggleFilter(keyword)}
                    >
                      <FontAwesome
                        name={selectedFilters.has(keyword) ? "check-square-o" : "square-o"}
                        size={18}
                        color={theme.tint}
                      />
                      <Text style={[styles.filterOptionText, { color: theme.text }]}>
                        {keyword.charAt(0).toUpperCase() + keyword.slice(1)}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              ))}
            </ScrollView>

            <View style={[styles.modalFooter, { borderTopColor: theme.border }]}>
              <Pressable 
                style={[styles.clearButton, { backgroundColor: theme.chipBackground }]}
                onPress={clearAllFilters}
              >
                <Text style={[styles.clearButtonText, { color: theme.text }]}>Clear All</Text>
              </Pressable>
              <Pressable 
                style={[styles.applyButton, { backgroundColor: theme.tint }]}
                onPress={() => setShowFiltersModal(false)}
              >
                <Text style={[styles.applyButtonText, { color: theme.onTint }]}>Apply</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Pasture Selection Modal */}
      <Modal
        visible={showPastureModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowPastureModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Select Pastures</Text>
              <Pressable onPress={() => setShowPastureModal(false)}>
                <FontAwesome name="times" size={20} color={theme.text} />
              </Pressable>
            </View>

            <ScrollView style={styles.modalBody}>
              {uniquePastures.map((pasture) => (
                <Pressable
                  key={pasture}
                  style={[
                    styles.filterOption,
                    selectedFilters.has(pasture) && { backgroundColor: theme.chipBackground },
                  ]}
                  onPress={() => toggleFilter(pasture)}
                >
                  <FontAwesome
                    name={selectedFilters.has(pasture) ? "check-square-o" : "square-o"}
                    size={18}
                    color={theme.tint}
                  />
                  <Text style={[styles.filterOptionText, { color: theme.text }]}>
                    {pasture}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>

            <View style={[styles.modalFooter, { borderTopColor: theme.border }]}>
              <Pressable 
                style={[styles.applyButton, { backgroundColor: theme.tint, flex: 1 }]}
                onPress={() => setShowPastureModal(false)}
              >
                <Text style={[styles.applyButtonText, { color: theme.onTint }]}>Done</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {loading ? (
        <ActivityIndicator size="large" color={theme.tint} style={styles.loader} />
      ) : filteredHorses.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>
            {searchQuery || selectedFilters.size > 0
              ? "No horses found matching your filters."
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
    container: { flex: 1, backgroundColor: theme.background, paddingTop: StatusBar.currentHeight || 0 },
    headerRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingTop: 12,
    },
    title: { fontSize: 20, fontWeight: "700", color: theme.text },
    archiveButton: {
      backgroundColor: theme.card,
      borderWidth: 1,
      borderColor: theme.border,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 999,
    },
    archiveText: { color: theme.text, fontSize: 12, fontWeight: "600" },
    searchRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingTop: 12,
      paddingBottom: 12,
      gap: 10,
    },
    searchContainer: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.card,
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 2,
      borderWidth: 1,
      borderColor: theme.border,
    },
    searchInput: {
      flex: 1,
      marginHorizontal: 8,
      fontSize: 16,
      color: theme.mutedText,
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
    filterButton: {
      paddingHorizontal: 12,
      paddingVertical: 17,
      borderRadius: 8,
      backgroundColor: theme.card,
      borderWidth: 1,
      borderColor: theme.border,
      justifyContent: "center",
      alignItems: "center",
    },
    filterButtonActive: {
      backgroundColor: theme.tint,
      borderColor: theme.tint,
    },
    filterBadge: {
      position: "absolute",
      top: -4,
      right: -4,
      backgroundColor: theme.warning,
      borderRadius: 10,
      width: 20,
      height: 20,
      justifyContent: "center",
      alignItems: "center",
    },
    filterBadgeText: {
      color: theme.onTint,
      fontSize: 11,
      fontWeight: "700",
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      justifyContent: "flex-end",
    },
    modalContent: {
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      maxHeight: "80%",
      paddingBottom: 20,
    },
    modalHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: "700",
    },
    modalBody: {
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    categoryTitle: {
      fontSize: 14,
      fontWeight: "600",
      marginTop: 12,
      marginBottom: 8,
      textTransform: "capitalize",
    },
    filterOption: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 12,
      paddingVertical: 10,
      marginBottom: 6,
      borderRadius: 8,
    },
    filterOptionText: {
      fontSize: 14,
      marginLeft: 10,
      flex: 1,
    },
    modalFooter: {
      flexDirection: "row",
      gap: 12,
      paddingHorizontal: 16,
      paddingTop: 12,
      borderTopWidth: 1,
    },
    clearButton: {
      flex: 1,
      paddingVertical: 10,
      borderRadius: 8,
      alignItems: "center",
    },
    clearButtonText: {
      fontSize: 14,
      fontWeight: "600",
    },
    applyButton: {
      flex: 1,
      paddingVertical: 10,
      borderRadius: 8,
      alignItems: "center",
    },
    applyButtonText: {
      fontSize: 14,
      fontWeight: "600",
    },
    pastureHeaderButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 12,
      paddingVertical: 12,
      marginHorizontal: 0,
      marginVertical: 8,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.background,
    },
    pastureHeaderContent: {
      flex: 1,
      gap: 4,
    },
    pastureSubtext: {
      fontSize: 12,
      marginTop: 2,
    },
    loader: { marginTop: 40 },
    empty: { flex: 1, justifyContent: "center", alignItems: "center", padding: 40 },
    emptyText: { fontSize: 16, color: theme.subtleText, textAlign: "center" },
    list: { paddingVertical: 8 },
  });
