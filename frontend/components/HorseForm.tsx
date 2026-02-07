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
import { HealthStatus, HorseCreate } from "@/lib/types";

const HEALTH_OPTIONS = Object.values(HealthStatus);
const SEX_OPTIONS = ["Stallion", "Mare", "Gelding"];

interface HorseFormProps {
  initialValues?: Partial<HorseCreate>;
  onSubmit: (data: HorseCreate) => Promise<void>;
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

  const showAlert = (title: string, msg: string) => {
    if (Platform.OS === "web") {
      window.alert(`${title}: ${msg}`);
    } else {
      Alert.alert(title, msg);
    }
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
});
