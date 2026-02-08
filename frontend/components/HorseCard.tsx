import { Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Horse, HealthStatus } from "@/lib/types";

const STATUS_COLORS: Record<HealthStatus, string> = {
  [HealthStatus.healthy]: "#4CAF50",
  [HealthStatus.needs_attention]: "#FF9800",
  [HealthStatus.critical]: "#F44336",
  [HealthStatus.palliative]: "#9C27B0",
};

const STATUS_LABELS: Record<HealthStatus, string> = {
  [HealthStatus.healthy]: "Healthy",
  [HealthStatus.needs_attention]: "Needs Attention",
  [HealthStatus.critical]: "Critical",
  [HealthStatus.palliative]: "Palliative",
};

export default function HorseCard({ horse }: { horse: Horse }) {
  const router = useRouter();

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
            { backgroundColor: STATUS_COLORS[horse.health_status] },
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

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
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
  name: { fontSize: 18, fontWeight: "700", color: "#333", marginBottom: 4 },
  detail: { fontSize: 14, color: "#666", marginBottom: 2 },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  badgeText: { color: "#fff", fontSize: 12, fontWeight: "600" },
});
