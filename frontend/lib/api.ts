import {
  Horse,
  HorseWithRecords,
  HorseCreate,
  HorseUpdate,
  MedicalRecord,
  MedicalRecordCreate,
  MedicalRecordUpdate,
  TreatmentRecord,
  TreatmentRecordCreate,
  TreatmentRecordUpdate,
  AuditLog,
  User,
  UserUpdate,
} from "./types";
import { supabase } from "./supabase";

const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:8000";
const BASE = API_URL.endsWith("/api") ? API_URL : `${API_URL}/api`;

async function getAuthToken(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token ?? null;
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = await getAuthToken();
  const headers = { 
    "Content-Type": "application/json", 
    ...options?.headers 
  } as Record<string, string>;
  
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE}${path}`, {
    headers,
    ...options,
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`API error ${res.status}: ${body}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export const horsesApi = {
  list: (healthStatus?: string) =>
    request<Horse[]>(
      `/horses/${healthStatus ? `?health_status=${healthStatus}` : ""}`
    ),
  get: (id: string) => request<HorseWithRecords>(`/horses/${id}`),
  create: (data: HorseCreate) =>
    request<Horse>("/horses/", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: HorseUpdate) =>
    request<Horse>(`/horses/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  delete: (id: string) =>
    request<void>(`/horses/${id}`, { method: "DELETE" }),
};

export const medicalApi = {
  listForHorse: (horseId: string) =>
    request<MedicalRecord[]>(`/medical-records/horse/${horseId}`),
  get: (id: string) => request<MedicalRecord>(`/medical-records/${id}`),
  create: (data: MedicalRecordCreate & { photoBase64?: string; photoFileName?: string }) =>
    request<MedicalRecord>("/medical-records/", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  update: (id: string, data: MedicalRecordUpdate) =>
    request<MedicalRecord>(`/medical-records/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  delete: (id: string) =>
    request<void>(`/medical-records/${id}`, { method: "DELETE" }),
};

export const treatmentsApi = {
  listForHorse: (horseId: string) =>
    request<TreatmentRecord[]>(`/treatments/horse/${horseId}`),
  get: (id: string) => request<TreatmentRecord>(`/treatments/${id}`),
  create: (data: TreatmentRecordCreate) =>
    request<TreatmentRecord>("/treatments/", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  update: (id: string, data: TreatmentRecordUpdate) =>
    request<TreatmentRecord>(`/treatments/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  delete: (id: string) =>
    request<void>(`/treatments/${id}`, { method: "DELETE" }),
};

//TODO: api for tasks, users

//TODO: unlikely but may want to add update and delete for logs
export const auditApi = {
  list: () => request<AuditLog[]>(`/audit_logs`),
  get: (id: string) => request<AuditLog>(`/audit_logs/${id}`),
  create: (data: Omit<AuditLog, "id" | "event_time">) =>
    request<AuditLog>("/audit_logs/", {
      method: "POST",
      body: JSON.stringify(data),
    })
}
export const usersApi = {
  me: () => request<User>("/users/me"),
  list: () => request<User[]>("/users/"),
  update: (id: number, data: UserUpdate) =>
    request<User>(`/users/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
}
