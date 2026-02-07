import { useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  Pressable,
  View,
  Alert,
  Platform,
  ScrollView,
} from "react-native";
import { RecordType, MedicalRecordCreate } from "@/lib/types";

const RECORD_TYPES = Object.values(RecordType);

interface MedicalRecordFormProps {
  horseId: number;
  onSubmit: (data: MedicalRecordCreate) => Promise<void>;
  onCancel?: () => void;
}

export default function MedicalRecordForm({
  horseId,
  onSubmit,
  onCancel,
}: MedicalRecordFormProps) {
  const [recordType, setRecordType] = useState<RecordType>(RecordType.checkup);
  const [description, setDescription] = useState("");
  const [vetName, setVetName] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [nextFollowup, setNextFollowup] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const showAlert = (title: string, msg: string) => {
    if (Platform.OS === "web") {
      window.alert(`${title}: ${msg}`);
    } else {
      Alert.alert(title, msg);
    }
  };

  const handleSubmit = async () => {
    if (!description.trim() || !vetName.trim() || !date.trim()) {
      showAlert("Validation", "Please fill in description, vet name, and date.");
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit({
        horse_id: horseId,
        record_type: recordType,
        description: description.trim(),
        vet_name: vetName.trim(),
        date,
        next_followup: nextFollowup.trim() || null,
        notes: notes.trim() || null,
      });
    } catch (e: any) {
      showAlert("Error", e.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>New Medical Record</Text>

      <Text style={styles.label}>Record Type</Text>
      <View style={styles.chipRow}>
        {RECORD_TYPES.map((t) => (
          <Pressable
            key={t}
            style={[styles.chip, recordType === t && styles.chipSelected]}
            onPress={() => setRecordType(t)}
          >
            <Text style={[styles.chipText, recordType === t && styles.chipTextSelected]}>
              {t}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.label}>Description *</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        value={description}
        onChangeText={setDescription}
        placeholder="What was done..."
        multiline
      />

      <Text style={styles.label}>Vet Name *</Text>
      <TextInput style={styles.input} value={vetName} onChangeText={setVetName} placeholder="Dr. Smith" />

      <Text style={styles.label}>Date (YYYY-MM-DD) *</Text>
      <TextInput style={styles.input} value={date} onChangeText={setDate} placeholder="2025-06-15" />

      <Text style={styles.label}>Next Follow-up (YYYY-MM-DD)</Text>
      <TextInput style={styles.input} value={nextFollowup} onChangeText={setNextFollowup} placeholder="Optional" />

      <Text style={styles.label}>Notes</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        value={notes}
        onChangeText={setNotes}
        placeholder="Additional notes..."
        multiline
      />

      <View style={styles.actions}>
        {onCancel && (
          <Pressable style={styles.cancelButton} onPress={onCancel}>
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
        )}
        <Pressable
          style={[styles.submitButton, submitting && styles.disabled]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          <Text style={styles.submitText}>
            {submitting ? "Saving..." : "Add Record"}
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  title: { fontSize: 20, fontWeight: "700", color: "#333", marginBottom: 12 },
  label: { fontSize: 14, fontWeight: "600", color: "#333", marginTop: 12, marginBottom: 4 },
  input: {
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
  actions: { flexDirection: "row", justifyContent: "flex-end", gap: 12, marginTop: 20 },
  cancelButton: { padding: 14, borderRadius: 10, backgroundColor: "#eee" },
  cancelText: { fontSize: 15, color: "#666" },
  submitButton: { padding: 14, borderRadius: 10, backgroundColor: "#8B4513" },
  submitText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  disabled: { opacity: 0.6 },
});
