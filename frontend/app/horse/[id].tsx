import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { horsesApi } from "@/lib/api";
import { HorseWithRecords, HealthStatus } from "@/lib/types";
import MedicalRecordCard from "@/components/MedicalRecordCard";

const STATUS_COLORS: Record<HealthStatus, string> = {
  [HealthStatus.healthy]: "#4CAF50",
  [HealthStatus.needs_attention]: "#FF9800",
  [HealthStatus.critical]: "#F44336",
  [HealthStatus.palliative]: "#9C27B0",
};

export default function HorseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [horse, setHorse] = useState<HorseWithRecords | null>(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      if (!id) return;
      setLoading(true);
      horsesApi
        .get(Number(id))
        .then(setHorse)
        .catch((e) => console.error(e))
        .finally(() => setLoading(false));
    }, [id])
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
        <DetailRow label="Sex" value={horse.sex} />
        <DetailRow label="Color" value={horse.color} />
        <DetailRow label="Arrived" value={horse.arrival_date} />
      </View>

      {horse.notes && (
        <View style={styles.notesSection}>
          <Text style={styles.sectionTitle}>Notes</Text>
          <Text style={styles.notes}>{horse.notes}</Text>
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
          <Pressable
            style={styles.addRecordButton}
            onPress={() => router.push(`/medical/${horse.id}`)}
          >
            <Text style={styles.addRecordText}>+ Add Record</Text>
          </Pressable>
        </View>
        {horse.medical_records.length === 0 ? (
          <Text style={styles.emptyText}>No medical records yet.</Text>
        ) : (
          horse.medical_records.map((r) => (
            <MedicalRecordCard key={r.id} record={r} />
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
});
