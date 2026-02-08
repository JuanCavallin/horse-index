import { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  Pressable,
  View,
  Alert,
  Platform,
} from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import {
  HealthStatus,
  HorseFormData,
  NewMedicalRecord,
  RecordType,
} from "@/lib/types";

const HEALTH_OPTIONS = Object.values(HealthStatus);
const SEX_OPTIONS = ["Mare", "Gelding"];
const RECORD_TYPES = Object.values(RecordType);

const TYPE_ICONS: Record<RecordType, React.ComponentProps<typeof FontAwesome>["name"]> = {
  [RecordType.checkup]: "stethoscope",
  [RecordType.vaccination]: "medkit",
  [RecordType.treatment]: "heartbeat",
  [RecordType.surgery]: "scissors",
  [RecordType.other]: "file-text-o",
};

interface HorseFormProps {
  initialValues?: Partial<HorseFormData>;
  onSubmit: (data: HorseFormData) => Promise<void>;
  submitLabel?: string;
}

export default function HorseForm({
  initialValues,
  onSubmit,
  submitLabel = "Save",
}: HorseFormProps) {
  const [name, setName] = useState(initialValues?.name ?? "");
  const [breed, setBreed] = useState(initialValues?.breed ?? "");
  const [age, setAge] = useState(initialValues?.age?.toString() ?? "");
  const [sex, setSex] = useState(initialValues?.sex ?? SEX_OPTIONS[0]);
  const [color, setColor] = useState(initialValues?.color ?? "");
  const [photoUrl, setPhotoUrl] = useState(initialValues?.photo_url ?? "");
  const [healthStatus, setHealthStatus] = useState<HealthStatus>(
    initialValues?.health_status ?? HealthStatus.healthy
  );
  const [arrivalDate, setArrivalDate] = useState(
    initialValues?.arrival_date ?? new Date().toISOString().split("T")[0]
  );
  const [notes, setNotes] = useState(initialValues?.notes ?? "");
  const [submitting, setSubmitting] = useState(false);

  // Medical records state
  const [medicalRecords, setMedicalRecords] = useState<NewMedicalRecord[]>([]);
  const [showRecordForm, setShowRecordForm] = useState(false);
  const [recType, setRecType] = useState<RecordType>(RecordType.checkup);
  const [recDescription, setRecDescription] = useState("");
  const [recVetName, setRecVetName] = useState("");
  const [recDate, setRecDate] = useState(new Date().toISOString().split("T")[0]);
  const [recFollowup, setRecFollowup] = useState("");
  const [recNotes, setRecNotes] = useState("");

  const showAlert = (title: string, msg: string) => {
    if (Platform.OS === "web") {
      window.alert(`${title}: ${msg}`);
    } else {
      Alert.alert(title, msg);
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

  const addMedicalRecord = () => {
    if (!recDescription.trim() || !recVetName.trim() || !recDate.trim()) {
      showAlert("Validation", "Please fill in description, vet name, and date for the medical record.");
      return;
    }
    setMedicalRecords((prev) => [
      ...prev,
      {
        record_type: recType,
        description: recDescription.trim(),
        vet_name: recVetName.trim(),
        date: recDate,
        next_followup: recFollowup.trim() || null,
        notes: recNotes.trim() || null,
      },
    ]);
    resetRecordForm();
    setShowRecordForm(false);
  };

  const removeRecord = (index: number) => {
    setMedicalRecords((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!name.trim() || !breed.trim() || !age.trim() || !color.trim()) {
      showAlert("Validation", "Please fill in all required fields.");
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit({
        name: name.trim(),
        breed: breed.trim(),
        age: parseInt(age, 10),
        sex,
        color: color.trim(),
        photo_url: photoUrl.trim() || null,
        health_status: healthStatus,
        arrival_date: arrivalDate,
        notes: notes.trim() || null,
        new_medical_records: medicalRecords.length > 0 ? medicalRecords : undefined,
      });
    } catch (e: any) {
      showAlert("Error", e.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.label}>Name *</Text>
      <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="e.g. Thunderbolt" />

      <Text style={styles.label}>Breed *</Text>
      <TextInput style={styles.input} value={breed} onChangeText={setBreed} placeholder="e.g. Quarter Horse" />

      <Text style={styles.label}>Age *</Text>
      <TextInput style={styles.input} value={age} onChangeText={setAge} placeholder="e.g. 22" keyboardType="numeric" />

      <Text style={styles.label}>Sex</Text>
      <View style={styles.chipRow}>
        {SEX_OPTIONS.map((opt) => (
          <Pressable
            key={opt}
            style={[styles.chip, sex === opt && styles.chipSelected]}
            onPress={() => setSex(opt)}
          >
            <Text style={[styles.chipText, sex === opt && styles.chipTextSelected]}>
              {opt}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.label}>Color *</Text>
      <TextInput style={styles.input} value={color} onChangeText={setColor} placeholder="e.g. Bay" />

      <Text style={styles.label}>Health Status</Text>
      <View style={styles.chipRow}>
        {HEALTH_OPTIONS.map((opt) => (
          <Pressable
            key={opt}
            style={[styles.chip, healthStatus === opt && styles.chipSelected]}
            onPress={() => setHealthStatus(opt)}
          >
            <Text style={[styles.chipText, healthStatus === opt && styles.chipTextSelected]}>
              {opt.replace("_", " ")}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.label}>Arrival Date (YYYY-MM-DD)</Text>
      <TextInput style={styles.input} value={arrivalDate} onChangeText={setArrivalDate} placeholder="2025-01-15" />

      <Text style={styles.label}>Photo URL</Text>
      <TextInput style={styles.input} value={photoUrl} onChangeText={setPhotoUrl} placeholder="https://..." />

      <Text style={styles.label}>Notes</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        value={notes}
        onChangeText={setNotes}
        placeholder="Any additional notes..."
        multiline
        numberOfLines={4}
      />

      {/* Medical Records Section */}
      <View style={styles.medicalSection}>
        <View style={styles.medicalHeader}>
          <Text style={styles.sectionTitle}>Medical Records</Text>
          {!showRecordForm && (
            <Pressable style={styles.addRecordButton} onPress={() => setShowRecordForm(true)}>
              <Text style={styles.addRecordText}>+ Add Record</Text>
            </Pressable>
          )}
        </View>

        {medicalRecords.map((rec, index) => (
          <View key={index} style={styles.recordCard}>
            <View style={styles.recordHeader}>
              <FontAwesome
                name={TYPE_ICONS[rec.record_type]}
                size={16}
                color="#8B4513"
                style={styles.recordIcon}
              />
              <Text style={styles.recordType}>
                {rec.record_type.replace("_", " ").toUpperCase()}
              </Text>
              <Text style={styles.recordDate}>{rec.date}</Text>
              <Pressable onPress={() => removeRecord(index)} style={styles.removeButton}>
                <FontAwesome name="times-circle" size={20} color="#F44336" />
              </Pressable>
            </View>
            <Text style={styles.recordDescription}>{rec.description}</Text>
            <Text style={styles.recordVet}>Vet: {rec.vet_name}</Text>
            {rec.next_followup && (
              <Text style={styles.recordFollowup}>Follow-up: {rec.next_followup}</Text>
            )}
            {rec.notes && <Text style={styles.recordNotes}>{rec.notes}</Text>}
          </View>
        ))}

        {showRecordForm && (
          <View style={styles.recordFormContainer}>
            <Text style={styles.recordFormTitle}>New Medical Record</Text>

            <Text style={styles.label}>Record Type</Text>
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

            <Text style={styles.label}>Description *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={recDescription}
              onChangeText={setRecDescription}
              placeholder="What was done..."
              multiline
            />

            <Text style={styles.label}>Vet Name *</Text>
            <TextInput style={styles.input} value={recVetName} onChangeText={setRecVetName} placeholder="Dr. Smith" />

            <Text style={styles.label}>Date (YYYY-MM-DD) *</Text>
            <TextInput style={styles.input} value={recDate} onChangeText={setRecDate} placeholder="2025-06-15" />

            <Text style={styles.label}>Next Follow-up (YYYY-MM-DD)</Text>
            <TextInput style={styles.input} value={recFollowup} onChangeText={setRecFollowup} placeholder="Optional" />

            <Text style={styles.label}>Notes</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
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
              <Pressable style={styles.saveRecordButton} onPress={addMedicalRecord}>
                <Text style={styles.saveRecordText}>Add Record</Text>
              </Pressable>
            </View>
          </View>
        )}
      </View>

      <Pressable
        style={[styles.button, submitting && styles.buttonDisabled]}
        onPress={handleSubmit}
        disabled={submitting}
      >
        <Text style={styles.buttonText}>
          {submitting ? "Saving..." : submitLabel}
        </Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  label: { fontSize: 14, fontWeight: "600", color: "#333", marginTop: 12, marginBottom: 4 },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#fff",
  },
  textArea: { minHeight: 80, textAlignVertical: "top" },
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
  button: {
    backgroundColor: "#8B4513",
    borderRadius: 10,
    padding: 16,
    alignItems: "center",
    marginTop: 24,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "700" },

  // Medical records section
  medicalSection: { marginTop: 24, borderTopWidth: 1, borderTopColor: "#ddd", paddingTop: 16 },
  medicalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  sectionTitle: { fontSize: 18, fontWeight: "700", color: "#333" },
  addRecordButton: {
    backgroundColor: "#8B4513",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addRecordText: { color: "#fff", fontWeight: "600", fontSize: 13 },

  // Record cards
  recordCard: {
    backgroundColor: "#f9f6f2",
    borderRadius: 10,
    padding: 14,
    marginVertical: 6,
    borderLeftWidth: 4,
    borderLeftColor: "#8B4513",
  },
  recordHeader: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  recordIcon: { marginRight: 8 },
  recordType: { fontSize: 13, fontWeight: "700", color: "#8B4513", flex: 1 },
  recordDate: { fontSize: 13, color: "#888", marginRight: 8 },
  removeButton: { padding: 4 },
  recordDescription: { fontSize: 15, color: "#333", marginBottom: 4 },
  recordVet: { fontSize: 13, color: "#666" },
  recordFollowup: { fontSize: 13, color: "#FF9800", marginTop: 4 },
  recordNotes: { fontSize: 13, color: "#888", fontStyle: "italic", marginTop: 4 },

  // Record form
  recordFormContainer: {
    backgroundColor: "#f9f6f2",
    borderRadius: 10,
    padding: 14,
    marginTop: 8,
    borderLeftWidth: 4,
    borderLeftColor: "#8B4513",
  },
  recordFormTitle: { fontSize: 16, fontWeight: "700", color: "#333", marginBottom: 4 },
  recordFormActions: { flexDirection: "row", justifyContent: "flex-end", gap: 12, marginTop: 16 },
  cancelRecordButton: { padding: 12, borderRadius: 8, backgroundColor: "#eee" },
  cancelRecordText: { fontSize: 14, color: "#666" },
  saveRecordButton: { padding: 12, borderRadius: 8, backgroundColor: "#8B4513" },
  saveRecordText: { color: "#fff", fontSize: 14, fontWeight: "700" },
});
