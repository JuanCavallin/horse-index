import { useCallback, useState } from "react";
import { ActivityIndicator, View, StyleSheet } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { horsesApi } from "@/lib/api";
import { HorseWithRecords, HorseCreate } from "@/lib/types";
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

  const handleSubmit = async (data: HorseCreate) => {
    await horsesApi.update(Number(id), data);
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
        sex: horse.sex,
        color: horse.color,
        photo_url: horse.photo_url,
        health_status: horse.health_status,
        arrival_date: horse.arrival_date,
        notes: horse.notes,
      }}
      onSubmit={handleSubmit}
      submitLabel="Update Horse"
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
});
