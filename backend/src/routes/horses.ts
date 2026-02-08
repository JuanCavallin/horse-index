console.log("HORSES ROUTE DB VERSION RUNNING");
import { Router } from "express";
import pool from "../db";

const router = Router();

// GET /api/horses  -> list all horses from DB
router.get("/", async (_req, res) => {
  try {
    const result = await pool.query("SELECT * FROM horses ORDER BY name ASC;");
    res.json(result.rows);
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

    const result = await pool.query(
      `
      INSERT INTO horses (name, breed, gender, birth_year, arrival_date, picture, biography)
      VALUES ($1,$2,$3,$4,$5,$6,$7)
      RETURNING *;
      `,
      [
        name,
        breed ?? null,
        gender ?? null,
        birth_year ?? null,
        arrival_date ?? null,
        picture ?? null,
        biography ?? null,
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("POST /api/horses error:", err);
    res.status(500).json({ error: "Failed to create horse" });
  }
});

export default router;