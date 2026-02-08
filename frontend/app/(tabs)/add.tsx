import { useRouter } from "expo-router";
import { horsesApi, medicalApi } from "@/lib/api";
import { HorseFormData } from "@/lib/types";
import HorseForm from "@/components/HorseForm";
import { useUser } from "@/lib/UserContext";
import { View, Text, useColorScheme } from "react-native";
import Colors from "@/constants/Colors";

export default function AddHorseScreen() {
  const router = useRouter();
  const { canEdit, loading } = useUser();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? "light"];

  // Redirect if user doesn't have permission
  if (!loading && !canEdit) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 20 }}>
        <Text style={{ fontSize: 16, color: theme.text, textAlign: "center" }}>
          You don't have permission to add horses. Only editors and administrators can add horses.
        </Text>
      </View>
    );
  }

  const handleSubmit = async (data: HorseFormData) => {
    const { new_medical_records, ...horseData } = data;
    const horse = await horsesApi.create(horseData);
    if (new_medical_records) {
      for (const record of new_medical_records) {
        await medicalApi.create({ ...record, horse_id: horse.id });
      }
    }
    router.replace("/");
  };

  return <HorseForm onSubmit={handleSubmit} submitLabel="Add Horse" />;
}
