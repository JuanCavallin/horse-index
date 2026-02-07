import { useRouter } from "expo-router";
import { horsesApi } from "@/lib/api";
import { HorseCreate } from "@/lib/types";
import HorseForm from "@/components/HorseForm";

export default function AddHorseScreen() {
  const router = useRouter();

  const handleSubmit = async (data: HorseCreate) => {
    await horsesApi.create(data);
    router.replace("/");
  };

  return <HorseForm onSubmit={handleSubmit} submitLabel="Add Horse" />;
}
