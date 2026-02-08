import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Image,
  useColorScheme,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { horsesApi, medicalApi } from "@/lib/api";
import { HorseWithRecords, MedicalRecordCreate } from "@/lib/types";
import MedicalRecordCard from "@/components/MedicalRecordCard";
import Colors from "@/constants/Colors";
import { useUser } from "@/lib/UserContext";

export default function HorseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? "light"];
  const styles = getStyles(theme);
  const { canEdit, canDelete } = useUser();
  const [horse, setHorse] = useState<HorseWithRecords | null>(null);
  const [loading, setLoading] = useState(true);

  // Inline medical record form state
  const [showRecordForm, setShowRecordForm] = useState(false);
  const [recDescription, setRecDescription] = useState("");
  const [recSubmitting, setRecSubmitting] = useState(false);

  const loadHorse = useCallback(() => {
    if (!id) return;
    setLoading(true);
    horsesApi
      .get(id)
      .then(setHorse)
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      loadHorse();
    }, [loadHorse])
  );

  const confirmDelete = () => {
    const doDelete = async () => {
      await horsesApi.delete(id);
      router.replace("/");
    };
    if (Platform.OS === "web") {
      if (window.confirm("Delete this horse? This cannot be undone.")) {
        doDelete();
      }
    } else {
      Alert.alert("Delete Horse", "This cannot be undone.", [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: doDelete },
      ]);
    }
  };

  const confirmDeleteRecord = (recordId: string) => {
    const doDelete = async () => {
      await medicalApi.delete(recordId);
      loadHorse();
    };
    if (Platform.OS === "web") {
      if (window.confirm("Delete this medical record?")) {
        doDelete();
      }
    } else {
      Alert.alert("Delete Record", "Delete this medical record?", [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: doDelete },
      ]);
    }
  };

  const resetRecordForm = () => {
    setRecDescription("");
  };

  const showAlert = (title: string, msg: string) => {
    if (Platform.OS === "web") {
      window.alert(`${title}: ${msg}`);
    } else {
      Alert.alert(title, msg);
    }
  };

  const handleAddRecord = async () => {
    if (!recDescription.trim()) {
      showAlert("Validation", "Please fill in a description.");
      return;
    }
    setRecSubmitting(true);
    try {
      await medicalApi.create({
        horse_id: id,
        description: recDescription.trim(),
      });
      resetRecordForm();
      setShowRecordForm(false);
      loadHorse();
    } catch (e: any) {
      showAlert("Error", e.message);
    } finally {
      setRecSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={theme.tint} />
      </View>
    );
  }

  if (!horse) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyText}>Horse not found.</Text>
      </View>
    );
  }

  const calculateAge = (birthYear: number) => {
    const currentYear = new Date().getFullYear();
    return currentYear - birthYear;
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.name}>{horse.name}</Text>
      </View>

      {horse.photo_url && (
        <View style={styles.photoContainer}>
          <Image 
            source={{ uri: horse.photo_url }} 
            style={styles.photo}
            resizeMode="cover"
          />
        </View>
      )}

      <View style={styles.detailGrid}>
        <DetailRow label="Breed" value={horse.breed} styles={styles} />
        <DetailRow label="Age" value={`${calculateAge(horse.birth_year)} years`} styles={styles} />
        <DetailRow label="Gender" value={horse.gender} styles={styles} />
        <DetailRow label="Color" value={horse.color} styles={styles} />
        <DetailRow label="Arrived" value={horse.arrival_date} styles={styles} />
      </View>

      {horse.behavior_notes && (
        <View style={styles.notesSection}>
          <Text style={styles.sectionTitle}>Behavior Notes</Text>
          <Text style={styles.notes}>{horse.behavior_notes}</Text>
        </View>
      )}

      {horse.medical_notes && (
        <View style={styles.notesSection}>
          <Text style={styles.sectionTitle}>Medical Notes</Text>
          <Text style={styles.notes}>{horse.medical_notes}</Text>
        </View>
      )}

      <View style={styles.actions}>
        {canEdit && (
          <Pressable
            style={styles.editButton}
            onPress={() => router.push(`/horse/edit/${horse.id}`)}
          >
            <Text style={styles.editButtonText}>Edit Horse</Text>
          </Pressable>
        )}
        {canDelete && (
          <Pressable style={styles.deleteButton} onPress={confirmDelete}>
            <Text style={styles.deleteButtonText}>Delete</Text>
          </Pressable>
        )}
      </View>

      <View style={styles.medicalSection}>
        <View style={styles.medicalHeader}>
          <Text style={styles.sectionTitle}>Medical Records</Text>
          {!showRecordForm && canEdit && (
            <Pressable
              style={styles.addRecordButton}
              onPress={() => setShowRecordForm(true)}
            >
              <Text style={styles.addRecordText}>+ Add Record</Text>
            </Pressable>
          )}
        </View>

        {showRecordForm && (
          <View style={styles.recordFormContainer}>
            <Text style={styles.recordFormTitle}>New Medical Record</Text>

            <Text style={styles.formLabel}>Description *</Text>
            <TextInput
              style={[styles.formInput, styles.textArea]}
              value={recDescription}
              onChangeText={setRecDescription}
              placeholder="Describe the record..."
              multiline
            />

            <View style={styles.recordFormActions}>
              <Pressable
                style={styles.cancelRecordButton}
                onPress={() => {
                  resetRecordForm();
                  setShowRecordForm(false);
                }}
              >
                <Text style={styles.cancelRecordText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.saveRecordButton, recSubmitting && styles.buttonDisabled]}
                onPress={handleAddRecord}
                disabled={recSubmitting}
              >
                <Text style={styles.saveRecordText}>
                  {recSubmitting ? "Saving..." : "Add Record"}
                </Text>
              </Pressable>
            </View>
          </View>
        )}

        {horse.medical_records.length === 0 && !showRecordForm ? (
          <Text style={styles.emptyText}>No medical records yet.</Text>
        ) : (
          horse.medical_records.map((r) => (
            <View key={r.id}>
              <MedicalRecordCard record={r} />
              {canEdit && (
                <Pressable
                  style={styles.deleteRecordButton}
                  onPress={() => confirmDeleteRecord(r.id)}
                >
                  <FontAwesome name="trash-o" size={14} color={theme.danger} />
                  <Text style={styles.deleteRecordText}>Delete</Text>
                </Pressable>
              )}
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

function DetailRow({ label, value, styles }: { label: string; value: string; styles: any }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

const getStyles = (theme: typeof Colors.light) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  content: { padding: 16, paddingBottom: 40 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  name: { fontSize: 28, fontWeight: "800", color: theme.text },
  badge: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 14 },
  badgeText: { color: theme.onTint, fontSize: 13, fontWeight: "600", textTransform: "capitalize" },
  photoContainer: {
    marginBottom: 16,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: theme.card,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  photo: {
    width: "100%",
    height: 400,
  },
  detailGrid: {
    backgroundColor: theme.card,
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  detailLabel: { fontSize: 14, color: theme.mutedText },
  detailValue: { fontSize: 14, fontWeight: "600", color: theme.text },
  notesSection: { marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: "700", color: theme.text, marginBottom: 8 },
  notes: { fontSize: 15, color: theme.subtleText, lineHeight: 22 },
  actions: { flexDirection: "row", gap: 12, marginBottom: 24 },
  editButton: {
    flex: 1,
    backgroundColor: theme.tint,
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  editButtonText: { color: theme.onTint, fontWeight: "700", fontSize: 15 },
  deleteButton: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: theme.danger,
    alignItems: "center",
  },
  deleteButtonText: { color: theme.onTint, fontWeight: "700", fontSize: 15 },
  medicalSection: { marginTop: 8 },
  medicalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  addRecordButton: {
    backgroundColor: theme.tint,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addRecordText: { color: theme.onTint, fontWeight: "600", fontSize: 13 },
  emptyText: { fontSize: 14, color: theme.subtleText, fontStyle: "italic" },

  // Delete record button
  deleteRecordButton: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-end",
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    marginBottom: 4,
  },
  deleteRecordText: { fontSize: 12, color: theme.danger },

  // Inline record form
  recordFormContainer: {
    backgroundColor: theme.surface,
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: theme.tint,
  },
  recordFormTitle: { fontSize: 16, fontWeight: "700", color: theme.text, marginBottom: 4 },
  formLabel: { fontSize: 14, fontWeight: "600", color: theme.text, marginTop: 12, marginBottom: 4 },
  formInput: {
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: theme.card,
    color: theme.text,
  },
  textArea: { minHeight: 70, textAlignVertical: "top" },
  recordFormActions: { flexDirection: "row", justifyContent: "flex-end", gap: 12, marginTop: 16 },
  cancelRecordButton: { padding: 12, borderRadius: 8, backgroundColor: theme.chipBackground },
  cancelRecordText: { fontSize: 14, color: theme.mutedText },
  saveRecordButton: { padding: 12, borderRadius: 8, backgroundColor: theme.tint },
  saveRecordText: { color: theme.onTint, fontSize: 14, fontWeight: "700" },
  buttonDisabled: { opacity: 0.6 },
});
