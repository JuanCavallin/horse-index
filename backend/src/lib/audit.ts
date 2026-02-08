import { supabase } from "./supabase";

export interface AuditLogEntry {
  user_id: number;
  table_name: string;
  field_name: string | null;
  before_value: string | null;
  after_value: string | null;
}

/**
 * Log an audit entry for a change
 */
export async function logAudit(entry: AuditLogEntry): Promise<void> {
  try {
    const { error } = await supabase
      .from("audit_trail")
      .insert([entry]);

    if (error) {
      console.error("Audit log error:", error);
    }
  } catch (err) {
    console.error("Failed to log audit entry:", err);
  }
}

/**
 * Log field-level changes between before and after objects
 */
export async function logChanges(
  userId: number,
  tableName: string,
  before: Record<string, any>,
  after: Record<string, any>,
  primaryKeyField: string = "id"
): Promise<void> {
  // Get all keys from both objects
  const allKeys = new Set([...Object.keys(before), ...Object.keys(after)]);

  // Skip logging timestamp fields and primary keys
  const skipFields = new Set([
    primaryKeyField,
    "created_at",
    "updated_at",
    "last_updated",
  ]);

  for (const field of allKeys) {
    if (skipFields.has(field)) continue;

    const beforeVal = before[field];
    const afterVal = after[field];

    // Only log if the value actually changed
    if (beforeVal !== afterVal) {
      await logAudit({
        user_id: userId,
        table_name: tableName,
        field_name: field,
        before_value: beforeVal === null || beforeVal === undefined ? null : String(beforeVal),
        after_value: afterVal === null || afterVal === undefined ? null : String(afterVal),
      });
    }
  }
}

/**
 * Log a new record creation
 */
export async function logCreation(
  userId: number,
  tableName: string,
  data: Record<string, any>
): Promise<void> {
  // Skip logging timestamp fields
  const skipFields = new Set(["id", "created_at", "updated_at", "last_updated"]);

  for (const [field, value] of Object.entries(data)) {
    if (skipFields.has(field) || value === null || value === undefined) continue;

    await logAudit({
      user_id: userId,
      table_name: tableName,
      field_name: field,
      before_value: null,
      after_value: String(value),
    });
  }
}

/**
 * Log a record deletion
 */
export async function logDeletion(
  userId: number,
  tableName: string,
  data: Record<string, any>
): Promise<void> {
  // Skip logging timestamp fields
  const skipFields = new Set(["id", "created_at", "updated_at", "last_updated"]);

  for (const [field, value] of Object.entries(data)) {
    if (skipFields.has(field) || value === null || value === undefined) continue;

    await logAudit({
      user_id: userId,
      table_name: tableName,
      field_name: field,
      before_value: String(value),
      after_value: null,
    });
  }
}
