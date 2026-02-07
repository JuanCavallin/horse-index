import { StyleSheet, Text, View } from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { MedicalRecord, RecordType } from "@/lib/types";

const TYPE_ICONS: Record<RecordType, React.ComponentProps<typeof FontAwesome>["name"]> = {
  [RecordType.checkup]: "stethoscope",
  [RecordType.vaccination]: "medkit",
  [RecordType.treatment]: "heartbeat",
  [RecordType.surgery]: "scissors",
  [RecordType.other]: "file-text-o",
};

export default function MedicalRecordCard({ record }: { record: MedicalRecord }) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <FontAwesome
          name={TYPE_ICONS[record.record_type]}
          size={18}
          color="#8B4513"
          style={styles.icon}
        />
        <Text style={styles.type}>
          {record.record_type.replace("_", " ").toUpperCase()}
        </Text>
        <Text style={styles.date}>{record.date}</Text>
      </View>
      <Text style={styles.description}>{record.description}</Text>
      <Text style={styles.vet}>Vet: {record.vet_name}</Text>
      {record.next_followup && (
        <Text style={styles.followup}>
          Next follow-up: {record.next_followup}
        </Text>
      )}
      {record.notes && <Text style={styles.notes}>{record.notes}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#f9f6f2",
    borderRadius: 10,
    padding: 14,
    marginVertical: 6,
    borderLeftWidth: 4,
    borderLeftColor: "#8B4513",
  },
  header: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  icon: { marginRight: 8 },
  type: { fontSize: 13, fontWeight: "700", color: "#8B4513", flex: 1 },
  date: { fontSize: 13, color: "#888" },
  description: { fontSize: 15, color: "#333", marginBottom: 4 },
  vet: { fontSize: 13, color: "#666" },
  followup: { fontSize: 13, color: "#FF9800", marginTop: 4 },
  notes: { fontSize: 13, color: "#888", fontStyle: "italic", marginTop: 4 },
});
