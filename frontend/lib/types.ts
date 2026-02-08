export enum HealthStatus {
  healthy = "healthy",
  needs_attention = "needs_attention",
  critical = "critical",
  palliative = "palliative",
}


export enum Eye {
  missing = "Missing",
  blind = "Blind",
  glaucoma = "Glaucoma",
  injured = "Injured"

}

export enum UserRole {
  viewer = "viewer",
  editor = "editor",
  administrator = "administrator",
}

export interface User {
  id: number;
  auth_user_id: string;
  email: string;
  name: string;
  role: UserRole;
  active_user: boolean;
  phone: string | null;
  created_at: string;
  last_updated: string;
}

export interface UserUpdate {
  name?: string;
  role?: UserRole;
  active_user?: boolean;
  phone?: string | null;
}

export interface Horse {
  id: string;
  name: string;
  breed: string;
  birth_year: number;
  gender: string; //TODO: rename to gender in all files
  color: string;
  photo_url: string | null;
  //health_status: HealthStatus;
  arrival_date: string;
  created_at: string;
  updated_at: string;
  left_eye: Eye | null;
  right_eye: Eye | null;
  heart_murmur: boolean;
  cushings_positive: boolean;
  heaves: boolean;
  anhidrosis: boolean;
  shivers: boolean;
  bites: boolean;
  kicks: boolean;
  difficult_to_catch: boolean;
  problem_with_needles: boolean;
  problem_with_farrier: boolean;
  sedation_for_farrier: boolean;
  requires_extra_feed: boolean;
  requires_extra_mash: boolean;
  seen_by_vet: boolean;
  seen_by_farrier: boolean;
  military_police_horse: boolean;
  ex_racehorse: boolean;
  deceased: boolean;
  date_of_death: string | null;
  grooming_day: string;
  pasture: string | null;
  behavior_notes: string | null;
  regular_treatment: boolean;
  medical_notes: string | null;
  last_updated: string;
  updated_by: string;

}

export interface HorseWithRecords extends Horse {
  medical_records: MedicalRecord[];
  treatments: TreatmentRecord[];
}

export interface HorseCreate {
  name: string;
  breed: string;
  birth_year: number;
  gender: string;
  color: string;
  photo_url?: string | null;
  health_status?: HealthStatus;
  arrival_date: string;
  left_eye?: Eye | null;
  right_eye?: Eye | null;
  heart_murmur?: boolean;
  cushings_positive?: boolean;
  heaves?: boolean;
  anhidrosis?: boolean;
  shivers?: boolean;
  bites?: boolean;
  kicks?: boolean;
  difficult_to_catch?: boolean;
  problem_with_needles?: boolean;
  problem_with_farrier?: boolean;
  sedation_for_farrier?: boolean;
  requires_extra_feed?: boolean;
  requires_extra_mash?: boolean;
  seen_by_vet?: boolean;
  seen_by_farrier?: boolean;
  military_police_horse?: boolean;
  ex_racehorse?: boolean;
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
  id: string;
  horse_id: string;
  photo_url: string | null;
  description: string;
  updated_at: string;
  updated_by: string;
}

export interface MedicalRecordCreate {
  horse_id: string;
  photo_url?: string | null;
  description: string;
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

export interface TreatmentRecord {
  id: string;
  horse_id: string;
  type: TreatmentType | string;
  frequency: string | null;
  notes: string | null;
  updated_at: string;
  updated_by: string;
}

export interface TreatmentRecordCreate {
  horse_id: string;
  type: TreatmentType | string;
  frequency?: string | null;
  notes?: string | null;
}

export interface TreatmentRecordUpdate
  extends Partial<Omit<TreatmentRecordCreate, "horse_id">> {}

export type NewTreatment = {
  type: TreatmentType | string;
  frequency?: string | null;
  notes?: string | null;
};

export interface MedicalRecordUpdate
  extends Partial<Omit<MedicalRecordCreate, "horse_id">> {}

export type NewMedicalRecord = {
  description: string;
  photo_url?: string | null;
  photoBase64?: string | null;
  photoFileName?: string | null;
};

export interface HorseFormData extends HorseCreate {
  new_medical_records?: NewMedicalRecord[];
  new_treatments?: NewTreatment[];
  photoBase64?: string | null;
  photoFileName?: string | null;
}

//Audit log
export interface AuditLog {
  id: string;
  user_id: string;
  table_name: string;
  field_name: string;
  before_value: string | null;
  after_value: string | null;
  event_time: string;
}

//To-do list interface
export interface Tasks {
  id: string;
  horse_id: string;
  notes?: string | null;
  todo_status: boolean;
  done_status: boolean;
  notify_staff: boolean;
  last_updated: string;
  updated_by: string;
}

export interface TaskCreate {
  horse_id: string;
  notes?: string | null;
  todo_status: boolean;
  done_status: boolean;
  notify_staff: boolean;
}

export interface TaskUpdate extends Partial<TaskCreate> {}
