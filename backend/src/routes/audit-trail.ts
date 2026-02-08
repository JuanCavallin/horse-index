import { Router } from "express";
import { supabase } from "../lib/supabase";

const router = Router();

// GET /api/audit_logs  — list all audit logs
router.get("/", async (_req, res) => {
  try {
    const { data, error } = await supabase
      .from("audit_logs")
      .select("*")
      .order("event_time", { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error("GET /api/audit_logs error:", err);
    res.status(500).json({ error: "Failed to fetch audit logs" });
  }
});

// GET /api/audit_logs/:id  — single audit log
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from("audit_logs")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return res.status(404).json({ error: "Audit log not found" });
      }
      throw error;
    }

    res.json(data);
  } catch (err) {
    console.error("GET /api/audit_logs/:id error:", err);
    res.status(500).json({ error: "Failed to fetch audit log" });
  }
});

// POST /api/audit_logs  — create an audit log entry
router.post("/", async (req, res) => {
  try {
    const { user_id, table_name, field_name, before_value, after_value } = req.body;

    if (!table_name) {
      return res.status(400).json({ error: "table_name is required" });
    }

    const { data, error } = await supabase
      .from("audit_logs")
      .insert({ user_id, table_name, field_name, before_value, after_value })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    console.error("POST /api/audit_logs error:", err);
    res.status(500).json({ error: "Failed to create audit log" });
  }
});

export default router;
