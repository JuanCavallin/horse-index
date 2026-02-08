export enum HealthStatus {
  healthy = "healthy",
  needs_attention = "needs_attention",
  critical = "critical",
  palliative = "palliative",
}

export enum RecordType {
  checkup = "checkup",
  vaccination = "vaccination",
  treatment = "treatment",
  surgery = "surgery",
  other = "other",
}

export interface Horse {
  id: number;
  name: string;
  breed: string;
  age: number;
  sex: string; //TODO: rename to gender in all files
  color: string;
  photo_url: string | null;
  health_status: HealthStatus;
  arrival_date: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface HorseWithRecords extends Horse {
  medical_records: MedicalRecord[];
}

export interface HorseCreate {
  name: string;
  breed: string;
  age: number;
  sex: string;
  color: string;
  photo_url?: string | null;
  health_status?: HealthStatus;
  arrival_date: string;
  notes?: string | null;
}

export interface HorseUpdate extends Partial<HorseCreate> {}

export interface MedicalRecord {
  id: number;
  horse_id: number;
  record_type: RecordType;
  description: string;
  vet_name: string;
  date: string;
  next_followup: string | null;
  notes: string | null;
  created_at: string;
}

export interface MedicalRecordCreate {
  horse_id: number;
  record_type: RecordType;
  description: string;
  vet_name: string;
  date: string;
  next_followup?: string | null;
  notes?: string | null;
}

export interface MedicalRecordUpdate
  extends Partial<Omit<MedicalRecordCreate, "horse_id">> {}

export type NewMedicalRecord = Omit<MedicalRecordCreate, "horse_id">;

export interface HorseFormData extends HorseCreate {
  new_medical_records?: NewMedicalRecord[];
}
