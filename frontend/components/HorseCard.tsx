import { Pressable, StyleSheet, Text, View, useColorScheme } from "react-native";
import { useRouter } from "expo-router";
import { Horse, HealthStatus } from "@/lib/types";
import Colors from "@/constants/Colors";

const STATUS_LABELS: Record<HealthStatus, string> = {
  [HealthStatus.healthy]: "Healthy",
  [HealthStatus.needs_attention]: "Needs Attention",
  [HealthStatus.critical]: "Critical",
  [HealthStatus.palliative]: "Palliative",
};

export default function HorseCard({ horse }: { horse: Horse }) {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? "light"];

  const statusColors: Record<HealthStatus, string> = {
    [HealthStatus.healthy]: theme.healthy,
    [HealthStatus.needs_attention]: theme.needs_attention,
    [HealthStatus.critical]: theme.critical,
    [HealthStatus.palliative]: theme.palliative,
  };

  const styles = getStyles(theme);

  return (
    <Pressable
      style={styles.card}
      onPress={() => router.push(`/horse/${horse.id}`)}
    >
      <View style={styles.row}>
        <View style={styles.info}>
          <Text style={styles.name}>{horse.name}</Text>
          <Text style={styles.detail}>
            {horse.breed} &middot; {horse.age} yrs &middot; {horse.color}
          </Text>
          <Text style={styles.detail}>Gender: {horse.gender}</Text>
        </View>
        <View
          style={[
            styles.badge,
            { backgroundColor: statusColors[horse.health_status] },
          ]}
        >
          <Text style={styles.badgeText}>
            {STATUS_LABELS[horse.health_status]}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

const getStyles = (theme: typeof Colors.light) =>
  StyleSheet.create({
    card: {
      backgroundColor: theme.card,
      borderRadius: 12,
      padding: 16,
      marginHorizontal: 16,
      marginVertical: 6,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    row: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
    },
    info: { flex: 1 },
    name: { fontSize: 18, fontWeight: "700", color: theme.text, marginBottom: 4 },
    detail: { fontSize: 14, color: theme.mutedText, marginBottom: 2 },
    badge: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
      marginLeft: 8,
    },
    badgeText: { color: theme.onTint, fontSize: 12, fontWeight: "600" },
  });
