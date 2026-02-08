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
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { horsesApi, medicalApi } from "@/lib/api";
import { HorseWithRecords, /*HealthStatus,*/RecordType, MedicalRecordCreate } from "@/lib/types";
import MedicalRecordCard from "@/components/MedicalRecordCard";

/*
const STATUS_COLORS: Record<HealthStatus, string> = {
  [HealthStatus.healthy]: "#4CAF50",
  [HealthStatus.needs_attention]: "#FF9800",
  [HealthStatus.critical]: "#F44336",
  [HealthStatus.palliative]: "#9C27B0",
};
*/
const RECORD_TYPES = Object.values(RecordType);

export default function HorseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [horse, setHorse] = useState<HorseWithRecords | null>(null);
  const [loading, setLoading] = useState(true);

  // Inline medical record form state
  //TODO: refactor medical records to match model for documents
  const [showRecordForm, setShowRecordForm] = useState(false);
  const [recType, setRecType] = useState<RecordType>(RecordType.checkup);
  const [recDescription, setRecDescription] = useState("");
  const [recVetName, setRecVetName] = useState("");
  const [recDate, setRecDate] = useState(new Date().toISOString().split("T")[0]);
  const [recFollowup, setRecFollowup] = useState("");
  const [recNotes, setRecNotes] = useState("");
  const [recSubmitting, setRecSubmitting] = useState(false);

  const loadHorse = useCallback(() => {
    if (!id) return;
    setLoading(true);
    horsesApi
      .get(Number(id))
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
      await horsesApi.delete(Number(id));
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

  const confirmDeleteRecord = (recordId: number) => {
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
    setRecType(RecordType.checkup);
    setRecDescription("");
    setRecVetName("");
    setRecDate(new Date().toISOString().split("T")[0]);
    setRecFollowup("");
    setRecNotes("");
  };

  const showAlert = (title: string, msg: string) => {
    if (Platform.OS === "web") {
      window.alert(`${title}: ${msg}`);
    } else {
      Alert.alert(title, msg);
    }
  };

  const handleAddRecord = async () => {
    if (!recDescription.trim() || !recVetName.trim() || !recDate.trim()) {
      showAlert("Validation", "Please fill in description, vet name, and date.");
      return;
    }
    setRecSubmitting(true);
    try {
      await medicalApi.create({
        horse_id: Number(id),
        record_type: recType,
        description: recDescription.trim(),
        vet_name: recVetName.trim(),
        date: recDate,
        next_followup: recFollowup.trim() || null,
        notes: recNotes.trim() || null,
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
        <ActivityIndicator size="large" color="#8B4513" />
      </View>
    );
  }

  if (!horse) {
    return (
      <View style={styles.center}>
        <Text>Horse not found.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.name}>{horse.name}</Text>
        <View
          style={[
            styles.badge,
            { backgroundColor: STATUS_COLORS[horse.health_status] },
          ]}
        >
          <Text style={styles.badgeText}>
            {horse.health_status.replace("_", " ")}
          </Text>
        </View>
      </View>

      <View style={styles.detailGrid}>
        <DetailRow label="Breed" value={horse.breed} />
        <DetailRow label="Age" value={`${horse.age} years`} />
        <DetailRow label="Gender" value={horse.gender} />
        <DetailRow label="Color" value={horse.color} />
        <DetailRow label="Arrived" value={horse.arrival_date} />
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
        <Pressable
          style={styles.editButton}
          onPress={() => router.push(`/horse/edit/${horse.id}`)}
        >
          <Text style={styles.editButtonText}>Edit Horse</Text>
        </Pressable>
        <Pressable style={styles.deleteButton} onPress={confirmDelete}>
          <Text style={styles.deleteButtonText}>Delete</Text>
        </Pressable>
      </View>

      <View style={styles.medicalSection}>
        <View style={styles.medicalHeader}>
          <Text style={styles.sectionTitle}>Medical Records</Text>
          {!showRecordForm && (
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

            <Text style={styles.formLabel}>Record Type</Text>
            <View style={styles.chipRow}>
              {RECORD_TYPES.map((t) => (
                <Pressable
                  key={t}
                  style={[styles.chip, recType === t && styles.chipSelected]}
                  onPress={() => setRecType(t)}
                >
                  <Text style={[styles.chipText, recType === t && styles.chipTextSelected]}>
                    {t}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.formLabel}>Description *</Text>
            <TextInput
              style={[styles.formInput, styles.textArea]}
              value={recDescription}
              onChangeText={setRecDescription}
              placeholder="What was done..."
              multiline
            />

            <Text style={styles.formLabel}>Vet Name *</Text>
            <TextInput style={styles.formInput} value={recVetName} onChangeText={setRecVetName} placeholder="Dr. Smith" />

            <Text style={styles.formLabel}>Date (YYYY-MM-DD) *</Text>
            <TextInput style={styles.formInput} value={recDate} onChangeText={setRecDate} placeholder="2025-06-15" />

            <Text style={styles.formLabel}>Next Follow-up (YYYY-MM-DD)</Text>
            <TextInput style={styles.formInput} value={recFollowup} onChangeText={setRecFollowup} placeholder="Optional" />

            <Text style={styles.formLabel}>Notes</Text>
            <TextInput
              style={[styles.formInput, styles.textArea]}
              value={recNotes}
              onChangeText={setRecNotes}
              placeholder="Additional notes..."
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
              <Pressable
                style={styles.deleteRecordButton}
                onPress={() => confirmDeleteRecord(r.id)}
              >
                <FontAwesome name="trash-o" size={14} color="#F44336" />
                <Text style={styles.deleteRecordText}>Delete</Text>
              </Pressable>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  name: { fontSize: 28, fontWeight: "800", color: "#333" },
  badge: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 14 },
  badgeText: { color: "#fff", fontSize: 13, fontWeight: "600", textTransform: "capitalize" },
  detailGrid: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  detailLabel: { fontSize: 14, color: "#888" },
  detailValue: { fontSize: 14, fontWeight: "600", color: "#333" },
  notesSection: { marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: "700", color: "#333", marginBottom: 8 },
  notes: { fontSize: 15, color: "#555", lineHeight: 22 },
  actions: { flexDirection: "row", gap: 12, marginBottom: 24 },
  editButton: {
    flex: 1,
    backgroundColor: "#8B4513",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  editButtonText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  deleteButton: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: "#F44336",
    alignItems: "center",
  },
  deleteButtonText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  medicalSection: { marginTop: 8 },
  medicalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  addRecordButton: {
    backgroundColor: "#8B4513",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addRecordText: { color: "#fff", fontWeight: "600", fontSize: 13 },
  emptyText: { fontSize: 14, color: "#999", fontStyle: "italic" },

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
  deleteRecordText: { fontSize: 12, color: "#F44336" },

  // Inline record form
  recordFormContainer: {
    backgroundColor: "#f9f6f2",
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#8B4513",
  },
  recordFormTitle: { fontSize: 16, fontWeight: "700", color: "#333", marginBottom: 4 },
  formLabel: { fontSize: 14, fontWeight: "600", color: "#333", marginTop: 12, marginBottom: 4 },
  formInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#fff",
  },
  textArea: { minHeight: 70, textAlignVertical: "top" },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 4 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#eee",
  },
  chipSelected: { backgroundColor: "#8B4513" },
  chipText: { fontSize: 13, color: "#333" },
  chipTextSelected: { color: "#fff" },
  recordFormActions: { flexDirection: "row", justifyContent: "flex-end", gap: 12, marginTop: 16 },
  cancelRecordButton: { padding: 12, borderRadius: 8, backgroundColor: "#eee" },
  cancelRecordText: { fontSize: 14, color: "#666" },
  saveRecordButton: { padding: 12, borderRadius: 8, backgroundColor: "#8B4513" },
  saveRecordText: { color: "#fff", fontSize: 14, fontWeight: "700" },
  buttonDisabled: { opacity: 0.6 },
});
