import { Router } from "express";
import { supabase } from "../lib/supabase";
import { authenticateToken, requireEditor, AuthRequest } from "../middleware/auth";
import { logChanges, logCreation, logDeletion } from "../lib/audit";

const router = Router();

// GET /api/daily-observations — list all tasks, joined with horse name
router.get("/", authenticateToken, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("daily_observations")
      .select("*, horses(name)")
      .order("last_updated", { ascending: false });

    if (error) throw error;

    const tasks = (data || []).map((row: any) => ({
      ...row,
      horse_name: row.horses?.name ?? null,
      horses: undefined,
    }));

    res.json(tasks);
  } catch (err) {
    console.error("GET /api/daily-observations error:", err);
    res.status(500).json({ error: "Failed to fetch tasks" });
  }
});

// GET /api/daily-observations/horse/:id — tasks for a specific horse
router.get("/horse/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from("daily_observations")
      .select("*")
      .eq("horse_id", id)
      .order("last_updated", { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error("GET /api/daily-observations/horse/:id error:", err);
    res.status(500).json({ error: "Failed to fetch tasks for horse" });
  }
});

// GET /api/daily-observations/:id — single task
router.get("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from("daily_observations")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return res.status(404).json({ error: "Task not found" });
      }
      throw error;
    }

    res.json(data);
  } catch (err) {
    console.error("GET /api/daily-observations/:id error:", err);
    res.status(500).json({ error: "Failed to fetch task" });
  }
});

// POST /api/daily-observations — create a task
router.post("/", authenticateToken, requireEditor, async (req: AuthRequest, res) => {
  try {
    const { horse_id, notes, todo_status, done_status, notify_staff } = req.body;

    if (!horse_id) {
      return res.status(400).json({ error: "horse_id is required" });
    }

    const insertData = {
      horse_id,
      notes: notes ?? null,
      todo_status: todo_status ?? false,
      done_status: done_status ?? false,
      notify_staff: notify_staff ?? false,
      last_updated: new Date().toISOString(),
      updated_by: req.user!.id,
    };

    const { data, error } = await supabase
      .from("daily_observations")
      .insert(insertData)
      .select()
      .single();

    if (error) throw error;

    // Log the creation
    if (req.user) {
      await logCreation(req.user.id, "daily_observations", data);
    }

    res.status(201).json(data);
  } catch (err) {
    console.error("POST /api/daily-observations error:", err);
    res.status(500).json({ error: "Failed to create task" });
  }
});

// PUT /api/daily-observations/:id — update a task
router.put("/:id", authenticateToken, requireEditor, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    // Fetch original for audit logging
    const { data: original, error: fetchError } = await supabase
      .from("daily_observations")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !original) {
      return res.status(404).json({ error: "Task not found" });
    }

    const updateData = {
      ...req.body,
      last_updated: new Date().toISOString(),
      updated_by: req.user!.id,
    };

    const { data, error } = await supabase
      .from("daily_observations")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return res.status(404).json({ error: "Task not found" });
      }
      throw error;
    }

    // Log the changes
    if (req.user) {
      await logChanges(req.user.id, "daily_observations", original, data);
    }

    res.json(data);
  } catch (err) {
    console.error("PUT /api/daily-observations/:id error:", err);
    res.status(500).json({ error: "Failed to update task" });
  }
});

// DELETE /api/daily-observations/:id — delete a task
router.delete("/:id", authenticateToken, requireEditor, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    // Fetch the task before deleting for audit logging
    const { data: task, error: fetchError } = await supabase
      .from("daily_observations")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !task) {
      return res.status(404).json({ error: "Task not found" });
    }

    const { error } = await supabase
      .from("daily_observations")
      .delete()
      .eq("id", id);

    if (error) throw error;

    // Log the deletion
    if (req.user) {
      await logDeletion(req.user.id, "daily_observations", task);
    }

    res.status(204).send();
  } catch (err) {
    console.error("DELETE /api/daily-observations/:id error:", err);
    res.status(500).json({ error: "Failed to delete task" });
  }
});

export default router;
