import { useMemo, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  Pressable,
  Switch,
  View,
  Alert,
  Platform,
  Image,
  useColorScheme,
} from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system/legacy";
import {
  Eye,
  HealthStatus,
  HorseFormData,
  NewMedicalRecord,
  RecordType,
} from "@/lib/types";
import Colors from "@/constants/Colors";
import { supabase } from "@/lib/supabase";

//const HEALTH_OPTIONS = Object.values(HealthStatus);
const GENDER_OPTIONS = ["Mare", "Gelding"];
const RECORD_TYPES = Object.values(RecordType);
const EYE_OPTIONS = Object.values(Eye);

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

function ToggleRow({
  label,
  value,
  onValueChange,
  styles,
  theme,
}: {
  label: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
  styles: ReturnType<typeof getStyles>;
  theme: typeof Colors.light;
}) {
  return (
    <View style={styles.toggleRow}>
      <Text style={styles.toggleLabel}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: theme.border, true: theme.tint }}
        thumbColor={value ? theme.onTint : theme.surface}
      />
    </View>
  );
}

export default function HorseForm({
  initialValues,
  onSubmit,
  submitLabel = "Save",
}: HorseFormProps) {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? "light"];
  const styles = useMemo(() => getStyles(theme), [theme]);

  // Basic info
  const [name, setName] = useState(initialValues?.name ?? "");
  const [breed, setBreed] = useState(initialValues?.breed ?? ""); //TODO: turn breed into dropdown with huge list of breeds and option for admin to add breeds to list in backend
  const [birthYear, setBirthYear] = useState(initialValues?.birth_year?.toString() ?? "");
  const [gender, setGender] = useState(initialValues?.gender ?? GENDER_OPTIONS[0]);
  const [color, setColor] = useState(initialValues?.color ?? "");
  const [photoUri, setPhotoUri] = useState<string | null>(initialValues?.photo_url ?? null);
  const [photoFileName, setPhotoFileName] = useState<string | null>(null);
  const [photoMimeType, setPhotoMimeType] = useState<string | null>(null);
  //const [healthStatus, setHealthStatus] = useState<HealthStatus>(
  //  initialValues?.health_status ?? HealthStatus.healthy
  //);
  const [arrivalDate, setArrivalDate] = useState(
    initialValues?.arrival_date ?? new Date().toISOString().split("T")[0]
  );
  const [pasture, setPasture] = useState(initialValues?.pasture ?? "");
  const [groomingDay, setGroomingDay] = useState(initialValues?.grooming_day ?? "");

  // Eye conditions
  const [leftEye, setLeftEye] = useState<Eye | null>(initialValues?.left_eye ?? null);
  const [rightEye, setRightEye] = useState<Eye | null>(initialValues?.right_eye ?? null);

  // Medical conditions
  const [heartMurmur, setHeartMurmur] = useState(initialValues?.heart_murmur ?? false);
  const [cushingsPositive, setCushingsPositive] = useState(initialValues?.cushings_positive ?? false);
  const [heaves, setHeaves] = useState(initialValues?.heaves ?? false);
  const [anhidrosis, setAnhidrosis] = useState(initialValues?.anhidrosis ?? false);
  const [shivers, setShivers] = useState(initialValues?.shivers ?? false);
  const [regularTreatment, setRegularTreatment] = useState(initialValues?.regular_treatment ?? false);

  // Behavioral
  const [bites, setBites] = useState(initialValues?.bites ?? false);
  const [kicks, setKicks] = useState(initialValues?.kicks ?? false);
  const [difficultToCatch, setDifficultToCatch] = useState(initialValues?.difficult_to_catch ?? false);

  // Care needs
  const [problemWithNeedles, setProblemWithNeedles] = useState(initialValues?.problem_with_needles ?? false);
  const [problemWithFarrier, setProblemWithFarrier] = useState(initialValues?.problem_with_farrier ?? false);
  const [sedationForFarrier, setSedationForFarrier] = useState(initialValues?.sedation_for_farrier ?? false);
  const [requiresExtraFeed, setRequiresExtraFeed] = useState(initialValues?.requires_extra_feed ?? false);
  const [requiresExtraMash, setRequiresExtraMash] = useState(initialValues?.requires_extra_mash ?? false);

  // Status flags
  const [seenByVet, setSeenByVet] = useState(initialValues?.seen_by_vet ?? false);
  const [seenByFarrier, setSeenByFarrier] = useState(initialValues?.seen_by_farrier ?? false);
  const [militaryPoliceHorse, setMilitaryPoliceHorse] = useState(initialValues?.military_police_horse ?? false);
  const [exRacehorse, setExRacehorse] = useState(initialValues?.ex_racehorse ?? false);
  const [deceased, setDeceased] = useState(initialValues?.deceased ?? false);
  const [dateOfDeath, setDateOfDeath] = useState(initialValues?.date_of_death ?? "");

  // Notes
  const [behaviorNotes, setBehaviorNotes] = useState(initialValues?.behavior_notes ?? "");
  const [medicalNotes, setMedicalNotes] = useState(initialValues?.medical_notes ?? "");

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

  const pickPhoto = async () => {
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
    setPhotoUri(asset.uri);
    setPhotoFileName(asset.fileName ?? `horse-${Date.now()}.jpg`);
    setPhotoMimeType(asset.mimeType ?? "image/jpeg");
  };

  const clearPhoto = () => {
    setPhotoUri(null);
    setPhotoFileName(null);
    setPhotoMimeType(null);
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
    if (!name.trim() || !breed.trim() || !birthYear.trim() || !color.trim()) {
      showAlert("Validation", "Please fill in all required fields.");
      return;
    }
    setSubmitting(true);
    try {
      let photoBase64: string | null = null;
      let photoName: string | null = null;

      // Convert image to base64 if present
      if (photoUri && !photoUri.startsWith("http")) {
        try {
          if (Platform.OS === "web") {
            // On web, fetch the image and convert to base64
            const response = await fetch(photoUri);
            const blob = await response.blob();
            const reader = new FileReader();
            
            await new Promise<void>((resolve, reject) => {
              reader.onload = () => {
                const result = reader.result as string;
                photoBase64 = result.split(",")[1]; // Get base64 without data: prefix
                photoName = photoFileName || "photo.jpg";
                resolve();
              };
              reader.onerror = () => reject(new Error("Failed to read image"));
              reader.readAsDataURL(blob);
            });
          } else {
            // On native, use FileSystem to read as base64
            photoBase64 = await FileSystem.readAsStringAsync(photoUri, {
              encoding: FileSystem.EncodingType.Base64,
            });
            photoName = photoFileName || "photo.jpg";
          }
        } catch (err) {
          console.error("Failed to read image:", err);
          showAlert("Error", `Failed to process image: ${err instanceof Error ? err.message : "Unknown error"}`);
          setSubmitting(false);
          return;
        }
      }

      await onSubmit({
        name: name.trim(),
        breed: breed.trim(),
        birth_year: parseInt(birthYear, 10),
        gender,
        color: color.trim(),
        //health_status: healthStatus,
        arrival_date: arrivalDate,
        left_eye: leftEye,
        right_eye: rightEye,
        heart_murmur: heartMurmur,
        cushings_positive: cushingsPositive,
        heaves,
        anhidrosis,
        shivers,
        bites,
        kicks,
        difficult_to_catch: difficultToCatch,
        problem_with_needles: problemWithNeedles,
        problem_with_farrier: problemWithFarrier,
        sedation_for_farrier: sedationForFarrier,
        requires_extra_feed: requiresExtraFeed,
        requires_extra_mash: requiresExtraMash,
        seen_by_vet: seenByVet,
        seen_by_farrier: seenByFarrier,
        military_police_horse: militaryPoliceHorse,
        ex_racehorse: exRacehorse,
        deceased,
        date_of_death: dateOfDeath.trim() || null,
        grooming_day: groomingDay.trim(),
        pasture: pasture.trim() || null,
        behavior_notes: behaviorNotes.trim() || null,
        regular_treatment: regularTreatment,
        medical_notes: medicalNotes.trim() || null,
        new_medical_records: medicalRecords.length > 0 ? medicalRecords : undefined,
        // Send image as base64 to backend for upload
        ...(photoBase64 && { photoBase64 }),
        ...(photoName && { photoFileName: photoName }),
      });
    } catch (e: any) {
      showAlert("Error", e.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* === Basic Info === */}
      <Text style={styles.sectionTitle}>Basic Info</Text>

      <Text style={styles.label}>Name *</Text>
      <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="e.g. Thunderbolt" />

      <Text style={styles.label}>Breed *</Text>
      <TextInput style={styles.input} value={breed} onChangeText={setBreed} placeholder="e.g. Quarter Horse" />

      <Text style={styles.label}>Birth Year *</Text>
      <TextInput style={styles.input} value={birthYear} onChangeText={setBirthYear} placeholder="e.g. 2003" keyboardType="numeric" />

      <Text style={styles.label}>Gender</Text>
      <View style={styles.chipRow}>
        {GENDER_OPTIONS.map((opt) => (
          <Pressable
            key={opt}
            style={[styles.chip, gender === opt && styles.chipSelected]}
            onPress={() => setGender(opt)}
          >
            <Text style={[styles.chipText, gender === opt && styles.chipTextSelected]}>
              {opt}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.label}>Color *</Text>
      <TextInput style={styles.input} value={color} onChangeText={setColor} placeholder="e.g. Bay" />
      {/*}  
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
        */}
      <Text style={styles.label}>Arrival Date (YYYY-MM-DD)</Text>
      <TextInput style={styles.input} value={arrivalDate} onChangeText={setArrivalDate} placeholder="2025-01-15" />

      <Text style={styles.label}>Photo</Text>
      {photoUri ? (
        <View style={styles.photoPreviewRow}>
          <Image source={{ uri: photoUri }} style={styles.photoPreview} />
          <View style={styles.photoActions}>
            <Pressable style={styles.photoButton} onPress={pickPhoto}>
              <Text style={styles.photoButtonText}>Change Photo</Text>
            </Pressable>
            <Pressable style={styles.photoButtonSecondary} onPress={clearPhoto}>
              <Text style={styles.photoButtonSecondaryText}>Remove</Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <Pressable style={styles.photoButton} onPress={pickPhoto}>
          <Text style={styles.photoButtonText}>Upload Photo</Text>
        </Pressable>
      )}

      <Text style={styles.label}>Pasture</Text>
      <TextInput style={styles.input} value={pasture} onChangeText={setPasture} placeholder="e.g. North Field" />

      <Text style={styles.label}>Grooming Day</Text>
      <TextInput style={styles.input} value={groomingDay} onChangeText={setGroomingDay} placeholder="e.g. Monday" />

      {/* === Eye Conditions === */}
      <View style={styles.sectionDivider} />
      <Text style={styles.sectionTitle}>Eye Conditions</Text>

      <Text style={styles.label}>Left Eye</Text>
      <View style={styles.chipRow}>
        <Pressable
          style={[styles.chip, leftEye === null && styles.chipSelected]}
          onPress={() => setLeftEye(null)}
        >
          <Text style={[styles.chipText, leftEye === null && styles.chipTextSelected]}>Normal</Text>
        </Pressable>
        {EYE_OPTIONS.map((opt) => (
          <Pressable
            key={opt}
            style={[styles.chip, leftEye === opt && styles.chipSelected]}
            onPress={() => setLeftEye(opt)}
          >
            <Text style={[styles.chipText, leftEye === opt && styles.chipTextSelected]}>{opt}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.label}>Right Eye</Text>
      <View style={styles.chipRow}>
        <Pressable
          style={[styles.chip, rightEye === null && styles.chipSelected]}
          onPress={() => setRightEye(null)}
        >
          <Text style={[styles.chipText, rightEye === null && styles.chipTextSelected]}>Normal</Text>
        </Pressable>
        {EYE_OPTIONS.map((opt) => (
          <Pressable
            key={opt}
            style={[styles.chip, rightEye === opt && styles.chipSelected]}
            onPress={() => setRightEye(opt)}
          >
            <Text style={[styles.chipText, rightEye === opt && styles.chipTextSelected]}>{opt}</Text>
          </Pressable>
        ))}
      </View>

      {/* === Medical Conditions === */}
      <View style={styles.sectionDivider} />
      <Text style={styles.sectionTitle}>Medical Conditions</Text>

      <ToggleRow label="Heart Murmur" value={heartMurmur} onValueChange={setHeartMurmur} styles={styles} theme={theme} />
      <ToggleRow label="Cushings" value={cushingsPositive} onValueChange={setCushingsPositive} styles={styles} theme={theme} />
      <ToggleRow label="Heaves" value={heaves} onValueChange={setHeaves} styles={styles} theme={theme} />
      <ToggleRow label="Anhidrosis" value={anhidrosis} onValueChange={setAnhidrosis} styles={styles} theme={theme} />
      <ToggleRow label="Shivers" value={shivers} onValueChange={setShivers} styles={styles} theme={theme} />
      <ToggleRow label="Regular Treatment" value={regularTreatment} onValueChange={setRegularTreatment} styles={styles} theme={theme} />

      {/* === Behavioral === */}
      <View style={styles.sectionDivider} />
      <Text style={styles.sectionTitle}>Behavioral</Text>

      <ToggleRow label="Bites" value={bites} onValueChange={setBites} styles={styles} theme={theme} />
      <ToggleRow label="Kicks" value={kicks} onValueChange={setKicks} styles={styles} theme={theme} />
      <ToggleRow label="Difficult to Catch" value={difficultToCatch} onValueChange={setDifficultToCatch} styles={styles} theme={theme} />

      <Text style={styles.label}>Behavior Notes</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        value={behaviorNotes}
        onChangeText={setBehaviorNotes}
        placeholder="Any behavioral notes..."
        multiline
        numberOfLines={3}
      />

      {/* === Care Needs === */}
      <View style={styles.sectionDivider} />
      <Text style={styles.sectionTitle}>Care Needs</Text>

      <ToggleRow label="Problem with Needles" value={problemWithNeedles} onValueChange={setProblemWithNeedles} styles={styles} theme={theme} />
      <ToggleRow label="Problem with Farrier" value={problemWithFarrier} onValueChange={setProblemWithFarrier} styles={styles} theme={theme} />
      <ToggleRow label="Sedation for Farrier" value={sedationForFarrier} onValueChange={setSedationForFarrier} styles={styles} theme={theme} />
      <ToggleRow label="Requires Extra Feed" value={requiresExtraFeed} onValueChange={setRequiresExtraFeed} styles={styles} theme={theme} />
      <ToggleRow label="Requires Extra Mash" value={requiresExtraMash} onValueChange={setRequiresExtraMash} styles={styles} theme={theme} />

      {/* === Status === */}
      <View style={styles.sectionDivider} />
      <Text style={styles.sectionTitle}>Status</Text>

      <ToggleRow label="Seen by Vet" value={seenByVet} onValueChange={setSeenByVet} styles={styles} theme={theme} />
      <ToggleRow label="Seen by Farrier" value={seenByFarrier} onValueChange={setSeenByFarrier} styles={styles} theme={theme} />
      <ToggleRow label="Military/Police Horse" value={militaryPoliceHorse} onValueChange={setMilitaryPoliceHorse} styles={styles} theme={theme} />
      <ToggleRow label="Ex-Racehorse" value={exRacehorse} onValueChange={setExRacehorse} styles={styles} theme={theme} />
      <ToggleRow label="Deceased" value={deceased} onValueChange={setDeceased} styles={styles} theme={theme} />

      {deceased && (
        <>
          <Text style={styles.label}>Date of Death (YYYY-MM-DD)</Text>
          <TextInput style={styles.input} value={dateOfDeath} onChangeText={setDateOfDeath} placeholder="2025-01-15" />
        </>
      )}

      {/* === Medical Notes === */}
      <View style={styles.sectionDivider} />
      <Text style={styles.sectionTitle}>Notes</Text>

      <Text style={styles.label}>Medical Notes</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        value={medicalNotes}
        onChangeText={setMedicalNotes}
        placeholder="Any medical notes..."
        multiline
        numberOfLines={4}
      />

      {/* === Medical Records === */}
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
                color={theme.tint}
                style={styles.recordIcon}
              />
              <Text style={styles.recordType}>
                {rec.record_type.replace("_", " ").toUpperCase()}
              </Text>
              <Text style={styles.recordDate}>{rec.date}</Text>
              <Pressable onPress={() => removeRecord(index)} style={styles.removeButton}>
                <FontAwesome name="times-circle" size={20} color={theme.danger} />
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

const getStyles = (theme: typeof Colors.light) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background },
    content: { padding: 16, paddingBottom: 40 },
    label: { fontSize: 14, fontWeight: "600", color: theme.text, marginTop: 12, marginBottom: 4 },
    input: {
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 8,
      padding: 12,
      fontSize: 16,
      backgroundColor: theme.surface,
      color: theme.text,
    },
    textArea: { minHeight: 80, textAlignVertical: "top" },
    chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 4 },
    chip: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: theme.chipBackground,
    },
    chipSelected: { backgroundColor: theme.tint },
    chipText: { fontSize: 13, color: theme.text },
    chipTextSelected: { color: theme.onTint },
    button: {
      backgroundColor: theme.tint,
      borderRadius: 10,
      padding: 16,
      alignItems: "center",
      marginTop: 24,
    },
    buttonDisabled: { opacity: 0.6 },
    buttonText: { color: theme.onTint, fontSize: 16, fontWeight: "700" },

    photoPreviewRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      marginTop: 6,
    },
    photoPreview: {
      width: 96,
      height: 96,
      borderRadius: 10,
      backgroundColor: theme.card,
    },
    photoActions: {
      flex: 1,
      gap: 8,
    },
    photoButton: {
      backgroundColor: theme.tint,
      paddingVertical: 10,
      paddingHorizontal: 14,
      borderRadius: 8,
      alignItems: "center",
    },
    photoButtonText: { color: theme.onTint, fontSize: 14, fontWeight: "700" },
    photoButtonSecondary: {
      backgroundColor: theme.chipBackground,
      paddingVertical: 10,
      paddingHorizontal: 14,
      borderRadius: 8,
      alignItems: "center",
    },
    photoButtonSecondaryText: { color: theme.text, fontSize: 14, fontWeight: "600" },

    // Sections
    sectionTitle: { fontSize: 18, fontWeight: "700", color: theme.text, marginBottom: 4 },
    sectionDivider: { borderTopWidth: 1, borderTopColor: theme.border, marginTop: 24, paddingTop: 16 },

    // Toggle rows
    toggleRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    toggleLabel: { fontSize: 15, color: theme.text },

    // Medical records section
    medicalSection: { marginTop: 24, borderTopWidth: 1, borderTopColor: theme.border, paddingTop: 16 },
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

    // Record cards
    recordCard: {
      backgroundColor: theme.card,
      borderRadius: 10,
      padding: 14,
      marginVertical: 6,
      borderLeftWidth: 4,
      borderLeftColor: theme.tint,
    },
    recordHeader: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
    recordIcon: { marginRight: 8 },
    recordType: { fontSize: 13, fontWeight: "700", color: theme.tint, flex: 1 },
    recordDate: { fontSize: 13, color: theme.subtleText, marginRight: 8 },
    removeButton: { padding: 4 },
    recordDescription: { fontSize: 15, color: theme.text, marginBottom: 4 },
    recordVet: { fontSize: 13, color: theme.mutedText },
    recordFollowup: { fontSize: 13, color: theme.warning, marginTop: 4 },
    recordNotes: { fontSize: 13, color: theme.subtleText, fontStyle: "italic", marginTop: 4 },

    // Record form
    recordFormContainer: {
      backgroundColor: theme.card,
      borderRadius: 10,
      padding: 14,
      marginTop: 8,
      borderLeftWidth: 4,
      borderLeftColor: theme.tint,
    },
    recordFormTitle: { fontSize: 16, fontWeight: "700", color: theme.text, marginBottom: 4 },
    recordFormActions: { flexDirection: "row", justifyContent: "flex-end", gap: 12, marginTop: 16 },
    cancelRecordButton: { padding: 12, borderRadius: 8, backgroundColor: theme.chipBackground },
    cancelRecordText: { fontSize: 14, color: theme.mutedText },
    saveRecordButton: { padding: 12, borderRadius: 8, backgroundColor: theme.tint },
    saveRecordText: { color: theme.onTint, fontSize: 14, fontWeight: "700" },
  });
