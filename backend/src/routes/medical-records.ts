import { Router } from "express";
import { supabase } from "../lib/supabase";
import { authenticateToken, requireEditor, requireAdmin } from "../middleware/auth";

const router = Router();

// GET /api/medical-records/horse/:id  — all records for a horse
router.get("/horse/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from("medical_records")
      .select("*")
      .eq("horse_id", id)
      .order("date", { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error("GET /api/medical-records/horse/:id error:", err);
    res.status(500).json({ error: "Failed to fetch medical records" });
  }
});

// GET /api/medical-records/:id  — single record
router.get("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from("medical_records")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return res.status(404).json({ error: "Medical record not found" });
      }
      throw error;
    }

    res.json(data);
  } catch (err) {
    console.error("GET /api/medical-records/:id error:", err);
    res.status(500).json({ error: "Failed to fetch medical record" });
  }
});

// POST /api/medical-records  — create a record
router.post("/", authenticateToken, requireEditor, async (req, res) => {
  try {
    const { horse_id, record_type, description, vet_name, date, next_followup, notes } = req.body;

    if (!horse_id || !description || !vet_name || !date) {
      return res.status(400).json({ error: "horse_id, description, vet_name, and date are required" });
    }

    const { data, error } = await supabase
      .from("medical_records")
      .insert({ horse_id, record_type, description, vet_name, date, next_followup, notes })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    console.error("POST /api/medical-records error:", err);
    res.status(500).json({ error: "Failed to create medical record" });
  }
});

// PUT /api/medical-records/:id  — update a record
router.put("/:id", authenticateToken, requireEditor, async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from("medical_records")
      .update(req.body)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return res.status(404).json({ error: "Medical record not found" });
      }
      throw error;
    }

    res.json(data);
  } catch (err) {
    console.error("PUT /api/medical-records/:id error:", err);
    res.status(500).json({ error: "Failed to update medical record" });
  }
});

// DELETE /api/medical-records/:id  — delete a record
router.delete("/:id", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from("medical_records")
      .delete()
      .eq("id", id);

    if (error) throw error;
    res.status(204).send();
  } catch (err) {
    console.error("DELETE /api/medical-records/:id error:", err);
    res.status(500).json({ error: "Failed to delete medical record" });
  }
});

export default router;
