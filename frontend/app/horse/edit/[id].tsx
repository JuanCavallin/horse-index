import { useCallback, useState } from "react";
import { ActivityIndicator, View, StyleSheet } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { horsesApi, medicalApi } from "@/lib/api";
import { HorseWithRecords, HorseFormData } from "@/lib/types";
import HorseForm from "@/components/HorseForm";

export default function EditHorseScreen() {
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

  const handleSubmit = async (data: HorseFormData) => {
    const { new_medical_records, ...horseData } = data;
    await horsesApi.update(Number(id), horseData);
    if (new_medical_records) {
      for (const record of new_medical_records) {
        await medicalApi.create({ ...record, horse_id: Number(id) });
      }
    }
    router.back();
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#8B4513" />
      </View>
    );
  }

  if (!horse) {
    return null;
  }

  return (
    <HorseForm
      initialValues={{
        name: horse.name,
        breed: horse.breed,
        age: horse.age,
        gender: horse.gender,
        color: horse.color,
        photo_url: horse.photo_url,
        health_status: horse.health_status,
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
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
});
