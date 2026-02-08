import { StyleSheet, Text, View, useColorScheme } from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { MedicalRecord, RecordType } from "@/lib/types";
import Colors from "@/constants/Colors";

const TYPE_ICONS: Record<RecordType, React.ComponentProps<typeof FontAwesome>["name"]> = {
  [RecordType.checkup]: "stethoscope",
  [RecordType.vaccination]: "medkit",
  [RecordType.treatment]: "heartbeat",
  [RecordType.surgery]: "scissors",
  [RecordType.other]: "file-text-o",
};

export default function MedicalRecordCard({ record }: { record: MedicalRecord }) {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? "light"];
  const styles = getStyles(theme);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <FontAwesome
          name={TYPE_ICONS[record.record_type]}
          size={18}
          color={theme.tint}
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

const getStyles = (theme: typeof Colors.light) =>
  StyleSheet.create({
    card: {
      backgroundColor: theme.card,
      borderRadius: 10,
      padding: 14,
      marginVertical: 6,
      borderLeftWidth: 4,
      borderLeftColor: theme.tint,
    },
    header: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
    icon: { marginRight: 8 },
    type: { fontSize: 13, fontWeight: "700", color: theme.tint, flex: 1 },
    date: { fontSize: 13, color: theme.subtleText },
    description: { fontSize: 15, color: theme.text, marginBottom: 4 },
    vet: { fontSize: 13, color: theme.mutedText },
    followup: { fontSize: 13, color: theme.warning, marginTop: 4 },
    notes: { fontSize: 13, color: theme.subtleText, fontStyle: "italic", marginTop: 4 },
  });
