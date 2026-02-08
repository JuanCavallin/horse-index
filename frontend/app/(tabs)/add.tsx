import { useRouter } from "expo-router";
import { horsesApi, medicalApi } from "@/lib/api";
import { HorseFormData } from "@/lib/types";
import HorseForm from "@/components/HorseForm";

export default function AddHorseScreen() {
  const router = useRouter();

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
