import { StyleSheet, Text, View, useColorScheme } from "react-native";
import Colors from "@/constants/Colors";

export default function TasksScreen() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? "light"];
  const styles = getStyles(theme);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tasks</Text>
      <Text style={styles.subtitle}>Coming soon.</Text>
    </View>
  );
}

const getStyles = (theme: typeof Colors.light) =>
  StyleSheet.create({
    container: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.background,
      padding: 24,
    },
    title: { fontSize: 22, fontWeight: "700", color: theme.text },
    subtitle: { fontSize: 14, color: theme.mutedText, marginTop: 8 },
  });