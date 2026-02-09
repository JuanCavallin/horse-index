import { Router } from "express";
import { supabase, supabaseAdmin } from "../lib/supabase";
import { authenticateToken, requireEditor, requireAdmin, AuthRequest } from "../middleware/auth";
import { logChanges, logCreation, logDeletion } from "../lib/audit";

const router = Router();

// GET /api/medical-records/horse/:id  — all records for a horse
router.get("/horse/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from("medical_records")
      .select("*")
      .eq("horse_id", id)
      .order("updated_at", { ascending: false });

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
router.post("/", authenticateToken, requireEditor, async (req: AuthRequest, res) => {
  try {
    const { horse_id, description, photoBase64, photoFileName } = req.body;

    if (!horse_id || !description) {
      return res.status(400).json({ error: "horse_id and description are required" });
    }

    // Handle image upload if provided
    let photoUrl: string | null = null;
    if (photoBase64 && photoFileName) {
      try {
        const imageBuffer = Buffer.from(photoBase64, "base64");
        const fileName = `doc-${Date.now()}-${photoFileName}`;

        const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
          .from("horse-photos")
          .upload(fileName, imageBuffer, {
            contentType: "image/jpeg",
            upsert: true,
          });

        if (uploadError) {
          console.error("Document image upload error:", uploadError);
        } else if (uploadData) {
          photoUrl = supabaseAdmin.storage
            .from("horse-photos")
            .getPublicUrl(uploadData.path).data.publicUrl;
        }
      } catch (imgErr) {
        console.error("Failed to upload document image:", imgErr);
      }
    }

    const { data, error } = await supabase
      .from("medical_records")
      .insert({
        horse_id,
        description,
        photo_url: photoUrl,
        updated_at: new Date().toISOString(),
        updated_by: req.user!.id,
      })
      .select()
      .single();

    if (error) throw error;

    // Log the creation
    if (req.user) {
      await logCreation(req.user.id, "medical_records", data);
    }

    res.status(201).json(data);
  } catch (err) {
    console.error("POST /api/medical-records error:", err);
    res.status(500).json({ error: "Failed to create medical record" });
  }
});

// PUT /api/medical-records/:id  — update a record
router.put("/:id", authenticateToken, requireEditor, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    // Fetch the original record for audit logging
    const { data: originalRecord, error: fetchError } = await supabase
      .from("medical_records")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !originalRecord) {
      return res.status(404).json({ error: "Medical record not found" });
    }

    const { description, photo_url } = req.body;

    const { data, error } = await supabase
      .from("medical_records")
      .update({
        ...(description !== undefined && { description }),
        ...(photo_url !== undefined && { photo_url }),
        updated_at: new Date().toISOString(),
        updated_by: req.user!.id,
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return res.status(404).json({ error: "Medical record not found" });
      }
      throw error;
    }

    // Log the changes
    if (req.user) {
      await logChanges(req.user.id, "medical_records", originalRecord, data);
    }

    res.json(data);
  } catch (err) {
    console.error("PUT /api/medical-records/:id error:", err);
    res.status(500).json({ error: "Failed to update medical record" });
  }
});

// DELETE /api/medical-records/:id  — delete a record (editor or admin only)
router.delete("/:id", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    // Fetch the record data before deleting for audit logging
    const { data: record, error: fetchError } = await supabase
      .from("medical_records")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !record) {
      return res.status(404).json({ error: "Medical record not found" });
    }

    const { error } = await supabase
      .from("medical_records")
      .delete()
      .eq("id", id);

    if (error) throw error;

    // Log the deletion
    if (req.user) {
      await logDeletion(req.user.id, "medical_records", record);
    }

    res.status(204).send();
  } catch (err) {
    console.error("DELETE /api/medical-records/:id error:", err);
    res.status(500).json({ error: "Failed to delete medical record" });
  }
});

export default router;
