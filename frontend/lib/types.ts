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

export enum Eye {
  missing = "Missing",
  blind = "Blind",
  glaucoma = "Glaucoma",
  injured = "Injured"

}

export interface Horse {
  id: number;
  name: string;
  breed: string;
  age: number;
  gender: string; //TODO: rename to gender in all files
  color: string;
  photo_url: string | null;
  health_status: HealthStatus;
  arrival_date: string;
  created_at: string;
  updated_at: string;
  left_eye: Eye | null;
  right_eye: Eye | null;
  heart_murmul: boolean;
  cushings: boolean;
  heaves: boolean;
  anhidrosis: boolean;
  shivers: boolean;
  bites: boolean;
  kicks: boolean;
  hard_to_catch: boolean;
  problem_needles: boolean;
  problem_farrier: boolean;
  sedation_farrier: boolean;
  extra_feed: boolean;
  extra_mash: boolean;
  seen_by_vet: boolean;
  seen_by_farrier: boolean;
  military: boolean;
  race: boolean;
  deceased: boolean;
  date_of_death: string | null;
  grooming_day: string;
  pasture: string | null;
  behavior_notes: string | null;
  regular_treatment: boolean;
  medical_notes: string | null;
  last_updated: string;
  last_user_update_id: number; //TODO: should this be a number??

}

export interface HorseWithRecords extends Horse {
  medical_records: MedicalRecord[];
}

export interface HorseCreate {
  name: string;
  breed: string;
  age: number;
  gender: string;
  color: string;
  photo_url?: string | null;
  health_status?: HealthStatus;
  arrival_date: string;
  left_eye?: Eye | null;
  right_eye?: Eye | null;
  heart_murmul?: boolean;
  cushings?: boolean;
  heaves?: boolean;
  anhidrosis?: boolean;
  shivers?: boolean;
  bites?: boolean;
  kicks?: boolean;
  hard_to_catch?: boolean;
  problem_needles?: boolean;
  problem_farrier?: boolean;
  sedation_farrier?: boolean;
  extra_feed?: boolean;
  extra_mash?: boolean;
  seen_by_vet?: boolean;
  seen_by_farrier?: boolean;
  military?: boolean;
  race?: boolean;
  deceased?: boolean;
  date_of_death?: string | null;
  grooming_day?: string;
  pasture?: string | null;
  behavior_notes?: string | null;
  regular_treatment?: boolean;
  medical_notes?: string | null;
}

export interface HorseUpdate extends Partial<HorseCreate> {}

//Horse Documents
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

//Horse treatments
export enum TreatmentType {
  Antibiotics = "ANTIBIOTICS",
  Banamine = "BANAMINE",
  Bandaging = "BANDAGING",
  Bute = "BUTE",
  CushingsExam = "CUSHINGS_EXAM",
  Dental = "DENTAL",
  Dex = "DEX",
  Drainage = "DRAINAGE",
  EquiSpot = "EQUI_SPOT",
  EyeExam = "EYE_EXAM",
  Farrier = "FARRIER",
  GelDeWormer = "GEL_DEWORMER",
  MedicatedBath = "MEDICATED_BATH",
  PasteDeWormer = "PASTE_DEWORMER",
  PelletsDeWormer = "PELLETS_DEWORMER",
  Prascend = "PRASCEND",
  Previcox = "PREVICOX",
  TubedForChoke = "TUBED_FOR_CHOKE",
  TubedForColic = "TUBED_FOR_COLIC",
  VetExam = "VET_EXAM",
  Other = "OTHER"
}

//TODO: how to handle "other option"
export interface TreatmentRecord {
  id: number;
  //If treatment type equals other, set type to string
  type: TreatmentType | string;
  frequency?: string | null; // times per day, week, month, etc
  last_updated: string;
  last_user_update_id: number; //TODO: should this be a number??
}

//TODO: may not be necessary since this will be a niche feature for admin to add and will be complicated to set up. Can just preconfigure with some from the database rn
export interface TreatmentRecordCreate { 
  type: TreatmentType | string;
  frequency?: string | null; // times per day, week, month, etc
}

export interface MedicalRecordUpdate
  extends Partial<Omit<MedicalRecordCreate, "horse_id">> {}

export type NewMedicalRecord = Omit<MedicalRecordCreate, "horse_id">;

export interface HorseFormData extends HorseCreate {
  new_medical_records?: NewMedicalRecord[];
}

export interface AuditLog {
  id: number;
  user_id: number;
  table_name: string;
  field_name: string;
  before_value: string | null;
  after_value: string | null;
  datetime: string;
}
