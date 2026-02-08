import { StyleSheet, Text, View, Image, useColorScheme } from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { MedicalRecord } from "@/lib/types";
import Colors from "@/constants/Colors";

export default function MedicalRecordCard({ record }: { record: MedicalRecord }) {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? "light"];
  const styles = getStyles(theme);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <FontAwesome
          name="file-text-o"
          size={18}
          color={theme.tint}
          style={styles.icon}
        />
        <Text style={styles.date}>
          {new Date(record.updated_at).toLocaleDateString()}
        </Text>
      </View>
      {record.photo_url && (
        <Image source={{ uri: record.photo_url }} style={styles.photo} resizeMode="cover" />
      )}
      <Text style={styles.description}>{record.description}</Text>
      <Text style={styles.updatedBy}>Updated by: {record.updated_by}</Text>
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
    date: { fontSize: 13, color: theme.subtleText },
    photo: {
      width: "100%",
      height: 200,
      borderRadius: 8,
      marginBottom: 8,
    },
    description: { fontSize: 15, color: theme.text, marginBottom: 4 },
    updatedBy: { fontSize: 13, color: theme.mutedText },
  });
