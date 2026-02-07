import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { medicalApi } from "@/lib/api";
import { MedicalRecord, MedicalRecordCreate } from "@/lib/types";
import MedicalRecordCard from "@/components/MedicalRecordCard";
import MedicalRecordForm from "@/components/MedicalRecordForm";

export default function MedicalRecordsScreen() {
  const { horseId } = useLocalSearchParams<{ horseId: string }>();
  const numericId = Number(horseId);
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const loadRecords = useCallback(async () => {
    if (!horseId) return;
    setLoading(true);
    try {
      const data = await medicalApi.listForHorse(numericId);
      setRecords(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [horseId, numericId]);

  useFocusEffect(
    useCallback(() => {
      loadRecords();
    }, [loadRecords])
  );

  const handleAdd = async (data: MedicalRecordCreate) => {
    await medicalApi.create(data);
    setShowForm(false);
    loadRecords();
  };

  if (showForm) {
    return (
      <MedicalRecordForm
        horseId={numericId}
        onSubmit={handleAdd}
        onCancel={() => setShowForm(false)}
      />
    );
  }

  return (
    <View style={styles.container}>
      <Pressable style={styles.addButton} onPress={() => setShowForm(true)}>
        <Text style={styles.addButtonText}>+ Add Medical Record</Text>
      </Pressable>

      {loading ? (
        <ActivityIndicator size="large" color="#8B4513" style={styles.loader} />
      ) : records.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No medical records yet.</Text>
        </View>
      ) : (
        <FlatList
          data={records}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => <MedicalRecordCard record={item} />}
          contentContainerStyle={styles.list}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  addButton: {
    backgroundColor: "#8B4513",
    margin: 16,
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  addButtonText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  loader: { marginTop: 40 },
  empty: { flex: 1, justifyContent: "center", alignItems: "center", padding: 40 },
  emptyText: { fontSize: 16, color: "#999" },
  list: { padding: 16, paddingTop: 0 },
});
