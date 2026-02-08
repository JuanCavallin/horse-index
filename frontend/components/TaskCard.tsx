import { Pressable, StyleSheet, Text, View, useColorScheme } from "react-native";
import { Tasks } from "@/lib/types";
import Colors from "@/constants/Colors";

interface TaskCardProps {
  task: Tasks & { horse_name?: string };
  onPress: () => void;
}

export default function TaskCard({ task, onPress }: TaskCardProps) {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? "light"];
  const styles = getStyles(theme);

  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.header}>
        <Text style={styles.horseName}>{task.horse_name ?? `Horse #${task.horse_id}`}</Text>
        <View style={styles.badges}>
          {task.todo_status && !task.done_status && (
            <View style={[styles.badge, { backgroundColor: theme.warning }]}>
              <Text style={styles.badgeText}>To-Do</Text>
            </View>
          )}
          {task.done_status && (
            <View style={[styles.badge, { backgroundColor: theme.healthy }]}>
              <Text style={styles.badgeText}>Done</Text>
            </View>
          )}
          {task.notify_staff && (
            <View style={[styles.badge, { backgroundColor: theme.info }]}>
              <Text style={styles.badgeText}>Notify</Text>
            </View>
          )}
        </View>
      </View>
      {task.notes ? (
        <Text style={styles.notes} numberOfLines={2}>{task.notes}</Text>
      ) : (
        <Text style={styles.noNotes}>No notes</Text>
      )}
      <Text style={styles.timestamp}>
        Updated: {new Date(task.last_updated).toLocaleDateString()}
      </Text>
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
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: 8,
    },
    horseName: {
      fontSize: 18,
      fontWeight: "700",
      color: theme.text,
      flex: 1,
    },
    badges: {
      flexDirection: "row",
      gap: 6,
      marginLeft: 8,
    },
    badge: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
    },
    badgeText: {
      color: theme.onTint,
      fontSize: 12,
      fontWeight: "600",
    },
    notes: {
      fontSize: 14,
      color: theme.mutedText,
      marginBottom: 6,
    },
    noNotes: {
      fontSize: 14,
      color: theme.subtleText,
      fontStyle: "italic",
      marginBottom: 6,
    },
    timestamp: {
      fontSize: 12,
      color: theme.subtleText,
    },
  });
