import { Router } from "express";
import { supabase } from "../lib/supabase";
import { authenticateToken, requireEditor, requireAdmin, AuthRequest } from "../middleware/auth";
import { logChanges, logCreation, logDeletion } from "../lib/audit";

const router = Router();

// Helper: fetch a flattened treatment record by action_taken id
async function getFlattenedRecord(actionTakenId: string | number) {
  const { data, error } = await supabase
    .from("action_taken")
    .select("id, horse_id, treatment_id, action_taken_notes, last_updated, updated_by, treatments(type, frequency)")
    .eq("id", actionTakenId)
    .single();

  if (error || !data) return null;

  const t = data.treatments as any;
  return {
    id: data.id,
    horse_id: data.horse_id,
    type: t?.type ?? "",
    frequency: t?.frequency ?? null,
    notes: data.action_taken_notes,
    updated_at: data.last_updated,
    updated_by: data.updated_by,
  };
}

// GET /api/treatments/horse/:id — all treatments for a horse
router.get("/horse/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from("action_taken")
      .select("id, horse_id, treatment_id, action_taken_notes, last_updated, updated_by, treatments(type, frequency)")
      .eq("horse_id", id)
      .order("last_updated", { ascending: false });

    if (error) throw error;

    const flattened = (data || []).map((row: any) => {
      const t = row.treatments as any;
      return {
        id: row.id,
        horse_id: row.horse_id,
        type: t?.type ?? "",
        frequency: t?.frequency ?? null,
        notes: row.action_taken_notes,
        updated_at: row.last_updated,
        updated_by: row.updated_by,
      };
    });

    res.json(flattened);
  } catch (err) {
    console.error("GET /api/treatments/horse/:id error:", err);
    res.status(500).json({ error: "Failed to fetch treatments" });
  }
});

// GET /api/treatments/:id — single treatment
router.get("/:id", authenticateToken, async (req, res) => {
  try {
    const record = await getFlattenedRecord(String(req.params.id));
    if (!record) {
      return res.status(404).json({ error: "Treatment not found" });
    }
    res.json(record);
  } catch (err) {
    console.error("GET /api/treatments/:id error:", err);
    res.status(500).json({ error: "Failed to fetch treatment" });
  }
});

// POST /api/treatments — create a treatment for a horse
router.post("/", authenticateToken, requireEditor, async (req: AuthRequest, res) => {
  try {
    const { horse_id, type, frequency, notes } = req.body;

    if (!horse_id || !type) {
      return res.status(400).json({ error: "horse_id and type are required" });
    }

    // 1. Insert into treatments table
    const { data: treatment, error: treatmentError } = await supabase
      .from("treatments")
      .insert({
        type,
        frequency: frequency ?? null,
        last_updated: new Date().toISOString(),
        updated_by: req.user!.id,
      })
      .select()
      .single();

    if (treatmentError) throw treatmentError;

    // 2. Insert into action_taken to link horse <-> treatment
    const { data: actionTaken, error: actionError } = await supabase
      .from("action_taken")
      .insert({
        horse_id,
        treatment_id: treatment.id,
        action_taken_notes: notes ?? null,
        last_updated: new Date().toISOString(),
        updated_by: req.user!.id,
      })
      .select()
      .single();

    if (actionError) throw actionError;

    if (req.user) {
      await logCreation(req.user.id, "action_taken", actionTaken);
    }

    const record = await getFlattenedRecord(actionTaken.id);
    res.status(201).json(record);
  } catch (err) {
    console.error("POST /api/treatments error:", err);
    res.status(500).json({ error: "Failed to create treatment" });
  }
});

// PUT /api/treatments/:id — update a treatment (by action_taken id)
router.put("/:id", authenticateToken, requireEditor, async (req: AuthRequest, res) => {
  try {
    const id = String(req.params.id);
    const { type, frequency, notes } = req.body;

    // Fetch original action_taken + treatment_id
    const { data: original, error: fetchError } = await supabase
      .from("action_taken")
      .select("*, treatments(type, frequency)")
      .eq("id", id)
      .single();

    if (fetchError || !original) {
      return res.status(404).json({ error: "Treatment not found" });
    }

    // Update treatment row if type or frequency changed
    if (type !== undefined || frequency !== undefined) {
      const { error: treatmentUpdateError } = await supabase
        .from("treatments")
        .update({
          ...(type !== undefined && { type }),
          ...(frequency !== undefined && { frequency }),
          last_updated: new Date().toISOString(),
          updated_by: req.user!.id,
        })
        .eq("id", original.treatment_id);

      if (treatmentUpdateError) throw treatmentUpdateError;
    }

    // Update action_taken row if notes changed
    const { error: actionUpdateError } = await supabase
      .from("action_taken")
      .update({
        ...(notes !== undefined && { action_taken_notes: notes }),
        last_updated: new Date().toISOString(),
        updated_by: req.user!.id,
      })
      .eq("id", id);

    if (actionUpdateError) throw actionUpdateError;

    const record = await getFlattenedRecord(id);

    if (req.user && record) {
      await logChanges(req.user.id, "action_taken", original, record);
    }

    res.json(record);
  } catch (err) {
    console.error("PUT /api/treatments/:id error:", err);
    res.status(500).json({ error: "Failed to update treatment" });
  }
});

// DELETE /api/treatments/:id — delete a treatment (by action_taken id)
router.delete("/:id", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const id = String(req.params.id);

    const { data: actionTaken, error: fetchError } = await supabase
      .from("action_taken")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !actionTaken) {
      return res.status(404).json({ error: "Treatment not found" });
    }

    const treatmentId = actionTaken.treatment_id;

    // Delete action_taken first (FK constraint)
    const { error: deleteActionError } = await supabase
      .from("action_taken")
      .delete()
      .eq("id", id);

    if (deleteActionError) throw deleteActionError;

    // Delete the treatment row (only if no other action_taken references it)
    const { data: otherRefs } = await supabase
      .from("action_taken")
      .select("id")
      .eq("treatment_id", treatmentId)
      .limit(1);

    if (!otherRefs || otherRefs.length === 0) {
      await supabase.from("treatments").delete().eq("id", treatmentId);
    }

    if (req.user) {
      await logDeletion(req.user.id, "action_taken", actionTaken);
    }

    res.status(204).send();
  } catch (err) {
    console.error("DELETE /api/treatments/:id error:", err);
    res.status(500).json({ error: "Failed to delete treatment" });
  }
});

export default router;
