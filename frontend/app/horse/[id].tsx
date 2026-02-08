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
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import { horsesApi, medicalApi, treatmentsApi } from "@/lib/api";
import { HorseWithRecords, MedicalRecordCreate, TreatmentRecord, TreatmentType } from "@/lib/types";
import MedicalRecordCard from "@/components/MedicalRecordCard";
import Colors from "@/constants/Colors";
import { useUser } from "@/lib/UserContext";
import { Picker } from "@react-native-picker/picker";
const TREATMENT_TYPES = Object.values(TreatmentType);

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
  const [recPhotoUri, setRecPhotoUri] = useState<string | null>(null);
  const [recPhotoFileName, setRecPhotoFileName] = useState<string | null>(null);
  const [recSubmitting, setRecSubmitting] = useState(false);

  // Inline treatment form state
  const [showTreatmentForm, setShowTreatmentForm] = useState(false);
  const [treatType, setTreatType] = useState<string>(TreatmentType.VetExam);
  const [treatCustomType, setTreatCustomType] = useState("");
  const [treatFrequency, setTreatFrequency] = useState("");
  const [treatNotes, setTreatNotes] = useState("");
  const [treatSubmitting, setTreatSubmitting] = useState(false);

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
    setRecPhotoUri(null);
    setRecPhotoFileName(null);
  };

  const pickRecordPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      showAlert("Permission", "Photo library permission is required to select an image.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
    });

    if (result.canceled || !result.assets?.[0]) return;

    const asset = result.assets[0];
    setRecPhotoUri(asset.uri);
    setRecPhotoFileName(asset.fileName ?? `doc-${Date.now()}.jpg`);
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
      let photoBase64: string | undefined;
      let photoFileName: string | undefined;

      if (recPhotoUri && !recPhotoUri.startsWith("http")) {
        try {
          if (Platform.OS === "web") {
            const response = await fetch(recPhotoUri);
            const blob = await response.blob();
            const reader = new FileReader();
            await new Promise<void>((resolve, reject) => {
              reader.onload = () => {
                const result = reader.result as string;
                photoBase64 = result.split(",")[1];
                photoFileName = recPhotoFileName || "doc-photo.jpg";
                resolve();
              };
              reader.onerror = () => reject(new Error("Failed to read image"));
              reader.readAsDataURL(blob);
            });
          } else {
            photoBase64 = await FileSystem.readAsStringAsync(recPhotoUri, {
              encoding: FileSystem.EncodingType.Base64,
            });
            photoFileName = recPhotoFileName || "doc-photo.jpg";
          }
        } catch (err) {
          console.error("Failed to read record image:", err);
        }
      }

      await medicalApi.create({
        horse_id: id,
        description: recDescription.trim(),
        ...(photoBase64 && { photoBase64 }),
        ...(photoFileName && { photoFileName }),
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

  const resetTreatmentForm = () => {
    setTreatType(TreatmentType.VetExam);
    setTreatCustomType("");
    setTreatFrequency("");
    setTreatNotes("");
  };

  const handleAddTreatment = async () => {
    const finalType = treatType === TreatmentType.Other ? treatCustomType.trim() : treatType;
    if (!finalType) {
      showAlert("Validation", "Please select or enter a treatment type.");
      return;
    }
    setTreatSubmitting(true);
    try {
      await treatmentsApi.create({
        horse_id: id,
        type: finalType,
        frequency: treatFrequency.trim() || null,
        notes: treatNotes.trim() || null,
      });
      resetTreatmentForm();
      setShowTreatmentForm(false);
      loadHorse();
    } catch (e: any) {
      showAlert("Error", e.message);
    } finally {
      setTreatSubmitting(false);
    }
  };

  const confirmDeleteTreatment = (treatmentId: string) => {
    const doDelete = async () => {
      await treatmentsApi.delete(treatmentId);
      loadHorse();
    };
    if (Platform.OS === "web") {
      if (window.confirm("Delete this treatment?")) {
        doDelete();
      }
    } else {
      Alert.alert("Delete Treatment", "Delete this treatment?", [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: doDelete },
      ]);
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
        <DetailRow label="Pasture" value={horse.pasture || "Not set"} styles={styles} />
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

            <Text style={styles.formLabel}>Photo</Text>
            {recPhotoUri ? (
              <View style={styles.recPhotoPreviewRow}>
                <Image source={{ uri: recPhotoUri }} style={styles.recPhotoPreview} />
                <View style={styles.recPhotoActions}>
                  <Pressable style={styles.recPhotoButton} onPress={pickRecordPhoto}>
                    <Text style={styles.recPhotoButtonText}>Change</Text>
                  </Pressable>
                  <Pressable style={styles.recPhotoButtonSecondary} onPress={() => { setRecPhotoUri(null); setRecPhotoFileName(null); }}>
                    <Text style={styles.recPhotoButtonSecondaryText}>Remove</Text>
                  </Pressable>
                </View>
              </View>
            ) : (
              <Pressable style={styles.recPhotoButton} onPress={pickRecordPhoto}>
                <Text style={styles.recPhotoButtonText}>Upload Photo</Text>
              </Pressable>
            )}

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

      {/* === Treatments === */}
      <View style={styles.treatmentSection}>
        <View style={styles.medicalHeader}>
          <Text style={styles.sectionTitle}>Treatments</Text>
          {!showTreatmentForm && canEdit && (
            <Pressable
              style={styles.addRecordButton}
              onPress={() => setShowTreatmentForm(true)}
            >
              <Text style={styles.addRecordText}>+ Add Treatment</Text>
            </Pressable>
          )}
        </View>

        {showTreatmentForm && (
          <View style={styles.recordFormContainer}>
            <Text style={styles.recordFormTitle}>New Treatment</Text>

          <Text style={styles.formLabel}>Treatment Type *</Text>

          <View style={styles.pickerWrapper}>
            <Picker
              selectedValue={treatType}
              onValueChange={(value) => setTreatType(value)}
              style={styles.picker}
              dropdownIconColor={theme.text}
            >
              {TREATMENT_TYPES.map((t) => (
                <Picker.Item key={t} label={t.replace(/_/g, " ")} value={t} />
              ))}
            </Picker>
          </View>


            {treatType === TreatmentType.Other && (
              <>
                <Text style={styles.formLabel}>Custom Type *</Text>
                <TextInput
                  style={styles.formInput}
                  value={treatCustomType}
                  onChangeText={setTreatCustomType}
                  placeholder="Enter treatment type..."
                />
              </>
            )}

            <Text style={styles.formLabel}>Frequency</Text>
            <TextInput
              style={styles.formInput}
              value={treatFrequency}
              onChangeText={setTreatFrequency}
              placeholder="e.g. Once daily, Twice weekly"
            />

            <Text style={styles.formLabel}>Notes</Text>
            <TextInput
              style={[styles.formInput, styles.textArea]}
              value={treatNotes}
              onChangeText={setTreatNotes}
              placeholder="Additional notes..."
              multiline
            />

            <View style={styles.recordFormActions}>
              <Pressable
                style={styles.cancelRecordButton}
                onPress={() => {
                  resetTreatmentForm();
                  setShowTreatmentForm(false);
                }}
              >
                <Text style={styles.cancelRecordText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.saveRecordButton, treatSubmitting && styles.buttonDisabled]}
                onPress={handleAddTreatment}
                disabled={treatSubmitting}
              >
                <Text style={styles.saveRecordText}>
                  {treatSubmitting ? "Saving..." : "Add Treatment"}
                </Text>
              </Pressable>
            </View>
          </View>
        )}

        {horse.treatments.length === 0 && !showTreatmentForm ? (
          <Text style={styles.emptyText}>No treatments yet.</Text>
        ) : (
          horse.treatments.map((t) => (
            <View key={t.id} style={styles.treatmentCard}>
              <View style={styles.treatmentCardHeader}>
                <FontAwesome name="medkit" size={16} color={theme.tint} style={{ marginRight: 8 }} />
                <Text style={styles.treatmentType}>
                  {t.type.replace(/_/g, " ")}
                </Text>
                <Text style={styles.treatmentDate}>
                  {new Date(t.updated_at).toLocaleDateString()}
                </Text>
              </View>
              {t.frequency && (
                <Text style={styles.treatmentFrequency}>Frequency: {t.frequency}</Text>
              )}
              {t.notes && (
                <Text style={styles.treatmentNotes}>{t.notes}</Text>
              )}
              <Text style={styles.treatmentUpdatedBy}>Updated by: {t.updated_by}</Text>
              {canEdit && (
                <Pressable
                  style={styles.deleteRecordButton}
                  onPress={() => confirmDeleteTreatment(t.id)}
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

  // Record photo picker
  recPhotoPreviewRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 6,
  },
  recPhotoPreview: {
    width: 96,
    height: 96,
    borderRadius: 10,
    backgroundColor: theme.card,
  },
  recPhotoActions: {
    flex: 1,
    gap: 8,
  },
  recPhotoButton: {
    backgroundColor: theme.tint,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  recPhotoButtonText: { color: theme.onTint, fontSize: 14, fontWeight: "700" },
  recPhotoButtonSecondary: {
    backgroundColor: theme.chipBackground,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  recPhotoButtonSecondaryText: { color: theme.text, fontSize: 14, fontWeight: "600" },

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

  // Treatment section
  treatmentSection: { marginTop: 24 },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 4 },
  treatChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: theme.chipBackground,
  },
  treatChipSelected: { backgroundColor: theme.tint },
  treatChipText: { fontSize: 12, color: theme.text },
  treatChipTextSelected: { color: theme.onTint },
pickerWrapper: {
  borderWidth: 1,
  borderColor: theme.border,
  borderRadius: 8,
  backgroundColor: theme.card,
  overflow: "hidden",
  marginTop: 4,
},
picker: {
  color: theme.text,
  // iOS ignores height sometimes; wrapper handles the look
},
  // Treatment cards
  treatmentCard: {
    backgroundColor: theme.card,
    borderRadius: 10,
    padding: 14,
    marginVertical: 6,
    borderLeftWidth: 4,
    borderLeftColor: theme.tint,
  },
  treatmentCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  treatmentType: {
    fontSize: 15,
    fontWeight: "700",
    color: theme.tint,
    flex: 1,
  },
  treatmentDate: { fontSize: 13, color: theme.subtleText },
  treatmentFrequency: {
    fontSize: 14,
    color: theme.text,
    marginBottom: 4,
    fontStyle: "italic",
  },
  treatmentNotes: { fontSize: 14, color: theme.text, marginBottom: 4 },
  treatmentUpdatedBy: { fontSize: 13, color: theme.mutedText },
});
