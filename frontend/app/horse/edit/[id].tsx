import { useCallback, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, useColorScheme, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { horsesApi, medicalApi } from "@/lib/api";
import { HorseWithRecords, HorseFormData } from "@/lib/types";
import HorseForm from "@/components/HorseForm";
import Colors from "@/constants/Colors";
import { useUser } from "@/lib/UserContext";

export default function EditHorseScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? "light"];
  const styles = getStyles(theme);
  const { canEdit, loading: userLoading } = useUser();
  const [horse, setHorse] = useState<HorseWithRecords | null>(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      if (!id || userLoading || !canEdit) return;
      setLoading(true);
      horsesApi
        .get(id)
        .then(setHorse)
        .catch((e) => console.error(e))
        .finally(() => setLoading(false));
    }, [id, userLoading, canEdit])
  );

  // Redirect if user doesn't have permission
  if (!userLoading && !canEdit) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <FontAwesome
              name="chevron-left"
              size={18}
              color={colorScheme === "dark" ? "#fff" : "#000"}
            />
            <Text
              style={[
                styles.backText,
                { color: colorScheme === "dark" ? "#fff" : "#000" },
              ]}
            >
              Back
            </Text>
          </Pressable>
        </View>
        <View style={styles.centerContent}>
          <Text style={{ fontSize: 16, color: theme.text, textAlign: "center" }}>
            You don't have permission to edit horses. Only editors and administrators can edit horses.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const handleSubmit = async (data: HorseFormData) => {
    const { new_medical_records, ...horseData } = data;
    await horsesApi.update(id, horseData);
    if (new_medical_records) {
      for (const record of new_medical_records) {
        await medicalApi.create({ ...record, horse_id: id });
      }
    }
    router.back();
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <FontAwesome
              name="chevron-left"
              size={18}
              color={colorScheme === "dark" ? "#fff" : "#000"}
            />
            <Text
              style={[
                styles.backText,
                { color: colorScheme === "dark" ? "#fff" : "#000" },
              ]}
            >
              Back
            </Text>
          </Pressable>
        </View>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={theme.tint} />
        </View>
      </SafeAreaView>
    );
  }

  if (!horse) {
    return null;
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <FontAwesome
            name="chevron-left"
            size={18}
            color={colorScheme === "dark" ? "#fff" : "#000"}
          />
          <Text
            style={[
              styles.backText,
              { color: colorScheme === "dark" ? "#fff" : "#000" },
            ]}
          >
            Back
          </Text>
        </Pressable>
      </View>
      <HorseForm
        initialValues={{
          name: horse.name,
          breed: horse.breed,
          birth_year: horse.birth_year,
          gender: horse.gender,
          color: horse.color,
          photo_url: horse.photo_url,
          //health_status: horse.health_status,
          arrival_date: horse.arrival_date,
          left_eye: horse.left_eye,
          right_eye: horse.right_eye,
          heart_murmur: horse.heart_murmur,
          cushings_positive: horse.cushings_positive,
          heaves: horse.heaves,
          anhidrosis: horse.anhidrosis,
          shivers: horse.shivers,
          bites: horse.bites,
          kicks: horse.kicks,
          difficult_to_catch: horse.difficult_to_catch,
          problem_with_needles: horse.problem_with_needles,
          problem_with_farrier: horse.problem_with_farrier,
          sedation_for_farrier: horse.sedation_for_farrier,
          requires_extra_feed: horse.requires_extra_feed,
          requires_extra_mash: horse.requires_extra_mash,
          seen_by_vet: horse.seen_by_vet,
          seen_by_farrier: horse.seen_by_farrier,
          military_police_horse: horse.military_police_horse,
          ex_racehorse: horse.ex_racehorse,
          deceased: horse.deceased,
          date_of_death: horse.date_of_death,
          grooming_day: horse.grooming_day,
          pasture: horse.pasture,
          behavior_notes: horse.behavior_notes,
          regular_treatment: horse.regular_treatment,
          medical_notes: horse.medical_notes,
        }}
        onSubmit={handleSubmit}
        submitLabel="Update Horse"
        title="Edit Horse"
      />
    </SafeAreaView>
  );
}

const getStyles = (theme: typeof Colors.light) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background },
    header: {
      paddingHorizontal: 16,
      paddingTop: 8,
      paddingBottom: 4,
    },
    backButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      alignSelf: "flex-start",
      paddingVertical: 6,
      paddingHorizontal: 2,
    },
    backText: { fontSize: 14, fontWeight: "600" },
    centerContent: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: 20,
      backgroundColor: theme.background,
    },
  });
