import {
  Horse,
  HorseWithRecords,
  HorseCreate,
  HorseUpdate,
  MedicalRecord,
  MedicalRecordCreate,
  MedicalRecordUpdate,
  AuditLog
} from "./types";

const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:8000";
const BASE = `${API_URL}/api`;

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...options?.headers },
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
  create: (data: MedicalRecordCreate) =>
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