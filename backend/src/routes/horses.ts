import { Router } from "express";
import { supabase } from "../lib/supabase";
import { authenticateToken, requireEditor, requireAdmin, AuthRequest } from "../middleware/auth";
import { logChanges, logCreation, logDeletion } from "../lib/audit";

const router = Router();

// GET /api/horses  — list all horses, optional ?health_status= filter
router.get("/", authenticateToken, async (req, res) => {
  try {
    let query = supabase.from("horses").select("*").order("name");

    const healthStatus = req.query.health_status as string | undefined;
    if (healthStatus) {
      query = query.eq("health_status", healthStatus);
    }

    const { data, error } = await query;
    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error("GET /api/horses error:", err);
    res.status(500).json({ error: "Failed to fetch horses" });
  }
});

// GET /api/horses/:id  — single horse with medical_records
router.get("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const { data: horse, error: horseError } = await supabase
      .from("horses")
      .select("*")
      .eq("id", id)
      .single();

    if (horseError) {
      if (horseError.code === "PGRST116") {
        return res.status(404).json({ error: "Horse not found" });
      }
      throw horseError;
    }

    const { data: records, error: recError } = await supabase
      .from("documents")
      .select("*")
      .eq("horse_id", id)
      .order("last_updated", { ascending: false });

    // Don't fail the whole request if documents table doesn't exist yet
    if (recError) {
      console.error("documents query error (non-fatal):", recError.message);
    }

    res.json({ ...horse, medical_records: records ?? [] });
  } catch (err) {
    console.error("GET /api/horses/:id error:", err);
    res.status(500).json({ error: "Failed to fetch horse" });
  }
});

// POST /api/horses  — create a horse (optionally with inline medical records)
router.post("/", authenticateToken, requireEditor, async (req: AuthRequest, res) => {
  try {
    const { new_medical_records, ...horseData } = req.body;

    if (!horseData.name) {
      return res.status(400).json({ error: "name is required" });
    }

    const { data: horse, error } = await supabase
      .from("horses")
      .insert(horseData)
      .select()
      .single();

    if (error) throw error;

    // Log the creation
    if (req.user) {
      await logCreation(req.user.id, "horses", horse);
    }

    // Insert inline medical records if provided
    if (new_medical_records && new_medical_records.length > 0) {
      const records = new_medical_records.map((r: any) => ({
        ...r,
        horse_id: horse.id,
      }));
      const { error: recError } = await supabase
        .from("documents")
        .insert(records);
      if (recError) console.error("Failed to insert documents:", recError);
    }

    res.status(201).json(horse);
  } catch (err) {
    console.error("POST /api/horses error:", err);
    res.status(500).json({ error: "Failed to create horse" });
  }
});

// PUT /api/horses/:id  — update a horse
router.put("/:id", authenticateToken, requireEditor, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    // Fetch the original horse data for audit logging
    const { data: originalHorse, error: fetchError } = await supabase
      .from("horses")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !originalHorse) {
      return res.status(404).json({ error: "Horse not found" });
    }

    const updateData = { ...req.body, updated_at: new Date().toISOString(), last_updated: new Date().toISOString() };

    const { data, error } = await supabase
      .from("horses")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return res.status(404).json({ error: "Horse not found" });
      }
      throw error;
    }

    // Log the changes
    if (req.user) {
      await logChanges(req.user.id, "horses", originalHorse, data);
    }

    res.json(data);
  } catch (err) {
    console.error("PUT /api/horses/:id error:", err);
    res.status(500).json({ error: "Failed to update horse" });
  }
});

// DELETE /api/horses/:id  — delete a horse (editor or admin only)
router.delete("/:id", authenticateToken, requireEditor, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    // Fetch the horse data before deleting for audit logging
    const { data: horse, error: fetchError } = await supabase
      .from("horses")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !horse) {
      return res.status(404).json({ error: "Horse not found" });
    }

    const { error } = await supabase
      .from("horses")
      .delete()
      .eq("id", id);

    if (error) throw error;

    // Log the deletion
    if (req.user) {
      await logDeletion(req.user.id, "horses", horse);
    }

    res.status(204).send();
  } catch (err) {
    console.error("DELETE /api/horses/:id error:", err);
    res.status(500).json({ error: "Failed to delete horse" });
  }
});

export default router;
