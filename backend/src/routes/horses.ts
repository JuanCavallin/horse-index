import { Router } from "express";
import { supabase, supabaseAdmin } from "../lib/supabase";
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
      .from("medical_records")
      .select("*")
      .eq("horse_id", id)
      .order("updated_at", { ascending: false });

    // Don't fail the whole request if medical_records table doesn't exist yet
    if (recError) {
      console.error("medical_records query error (non-fatal):", recError.message);
    }

    // Fetch treatments for this horse
    const { data: treatmentData, error: treatError } = await supabase
      .from("action_taken")
      .select("id, horse_id, treatment_id, action_taken_notes, last_updated, updated_by, treatments(type, frequency)")
      .eq("horse_id", id)
      .order("last_updated", { ascending: false });

    if (treatError) {
      console.error("treatments query error (non-fatal):", treatError.message);
    }

    const treatments = (treatmentData || []).map((row: any) => {
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

    res.json({ ...horse, medical_records: records ?? [], treatments });
  } catch (err) {
    console.error("GET /api/horses/:id error:", err);
    res.status(500).json({ error: "Failed to fetch horse" });
  }
});

// POST /api/horses  — create a horse (optionally with inline medical records and image)
router.post("/", authenticateToken, requireEditor, async (req: AuthRequest, res) => {
  try {
    const { new_medical_records, new_treatments, photoBase64, photoFileName, ...horseData } = req.body;

    if (!horseData.name) {
      return res.status(400).json({ error: "name is required" });
    }

    // Handle image upload if provided
    let photoUrl: string | null = null;
    if (photoBase64 && photoFileName) {
      try {
        // Convert base64 to buffer
        const imageBuffer = Buffer.from(photoBase64, "base64");
        const fileName = `horse-${Date.now()}-${photoFileName}`;

        const { data, error: uploadError } = await supabaseAdmin.storage
          .from("horse-photos")
          .upload(fileName, imageBuffer, {
            contentType: "image/jpeg",
            upsert: true,
          });

        if (uploadError) {
          console.error("Image upload error:", uploadError);
        } else if (data) {
          photoUrl = supabaseAdmin.storage
            .from("horse-photos")
            .getPublicUrl(data.path).data.publicUrl;
        }
      } catch (imgErr) {
        console.error("Failed to upload image:", imgErr);
        // Continue without image rather than failing the whole request
      }
    }

    // Add photo_url to horse data if available
    const dataToInsert = {
      ...horseData,
      ...(photoUrl && { photo_url: photoUrl }),
    };

    const { data: horse, error } = await supabase
      .from("horses")
      .insert(dataToInsert)
      .select()
      .single();

    if (error) throw error;

    // Log the creation
    if (req.user) {
      await logCreation(req.user.id, "horses", horse);
    }

    // Insert inline medical records if provided
    if (new_medical_records && new_medical_records.length > 0) {
      const records = [];
      for (const r of new_medical_records) {
        let recPhotoUrl: string | null = null;
        if (r.photoBase64 && r.photoFileName) {
          try {
            const imageBuffer = Buffer.from(r.photoBase64, "base64");
            const fileName = `doc-${Date.now()}-${r.photoFileName}`;
            const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
              .from("horse-photos")
              .upload(fileName, imageBuffer, {
                contentType: "image/jpeg",
                upsert: true,
              });
            if (uploadError) {
              console.error("Document image upload error:", uploadError);
            } else if (uploadData) {
              recPhotoUrl = supabaseAdmin.storage
                .from("horse-photos")
                .getPublicUrl(uploadData.path).data.publicUrl;
            }
          } catch (imgErr) {
            console.error("Failed to upload document image:", imgErr);
          }
        }
        records.push({
          horse_id: horse.id,
          description: r.description,
          photo_url: recPhotoUrl,
          updated_at: new Date().toISOString(),
          updated_by: req.user!.id,
        });
      }
      const { error: recError } = await supabase
        .from("medical_records")
        .insert(records);
      if (recError) console.error("Failed to insert medical records:", recError);
      else if (req.user) {
        for (const record of records) {
          await logCreation(req.user.id, "medical_records", record);
        }
      }
    }

    // Insert inline treatments if provided
    if (new_treatments && new_treatments.length > 0) {
      for (const t of new_treatments) {
        try {
          const { data: treatment, error: treatmentError } = await supabase
            .from("treatments")
            .insert({
              type: t.type,
              frequency: t.frequency ?? null,
              last_updated: new Date().toISOString(),
              updated_by: req.user!.id,
            })
            .select()
            .single();

          if (treatmentError) {
            console.error("Failed to insert treatment:", treatmentError);
            continue;
          }

          const { data: actionTaken, error: actionError } = await supabase
            .from("action_taken")
            .insert({
              horse_id: horse.id,
              treatment_id: treatment.id,
              action_taken_notes: t.notes ?? null,
              last_updated: new Date().toISOString(),
              updated_by: req.user!.id,
            })
            .select()
            .single();

          if (actionError) {
            console.error("Failed to insert action_taken:", actionError);
          } else if (req.user) {
            await logCreation(req.user.id, "action_taken", actionTaken);
          }
        } catch (tErr) {
          console.error("Failed to create inline treatment:", tErr);
        }
      }
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
    const { photoBase64, photoFileName, ...updateBody } = req.body;

    // Fetch the original horse data for audit logging
    const { data: originalHorse, error: fetchError } = await supabase
      .from("horses")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !originalHorse) {
      return res.status(404).json({ error: "Horse not found" });
    }

    // Handle image upload if provided
    let photoUrl: string | null = null;
    if (photoBase64 && photoFileName) {
      try {
        // Convert base64 to buffer
        const imageBuffer = Buffer.from(photoBase64, "base64");
        const fileName = `horse-${Date.now()}-${photoFileName}`;

        const { data, error: uploadError } = await supabaseAdmin.storage
          .from("horse-photos")
          .upload(fileName, imageBuffer, {
            contentType: "image/jpeg",
            upsert: true,
          });

        if (uploadError) {
          console.error("Image upload error:", uploadError);
        } else if (data) {
          photoUrl = supabaseAdmin.storage
            .from("horse-photos")
            .getPublicUrl(data.path).data.publicUrl;
        }
      } catch (imgErr) {
        console.error("Failed to upload image:", imgErr);
      }
    }

    const updateData = { 
      ...updateBody,
      ...(photoUrl && { photo_url: photoUrl }),
      updated_at: new Date().toISOString(), 
      last_updated: new Date().toISOString() 
    };

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
router.delete("/:id", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
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
