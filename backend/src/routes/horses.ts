console.log("HORSES ROUTE DB VERSION RUNNING");
import { Router } from "express";
import { supabase } from "../lib/supabase";

const router = Router();

// GET /api/horses  -> list all horses from DB
router.get("/", async (_req, res) => {
  try {
    const { data, error } = await supabase
      .from("horses")
      .select("*")
      .order("name", { ascending: true });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error("GET /api/horses error:", err);
    res.status(500).json({ error: "Failed to fetch horses" });
  }
});

// POST /api/horses -> create horse
router.post("/", async (req, res) => {
  try {
    const { name, breed, gender, birth_year, arrival_date, picture, biography } = req.body;

    if (!name) return res.status(400).json({ error: "name is required" });

    const { data, error } = await supabase
      .from("horses")
      .insert({
        name,
        breed: breed ?? null,
        gender: gender ?? null,
        birth_year: birth_year ?? null,
        arrival_date: arrival_date ?? null,
        picture: picture ?? null,
        biography: biography ?? null,
      })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    console.error("POST /api/horses error:", err);
    res.status(500).json({ error: "Failed to create horse" });
  }
});

export default router;