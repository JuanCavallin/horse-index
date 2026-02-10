import { Router, Response, Request } from "express";
import { supabase } from "../lib/supabase";
import { authenticateToken, requireAdmin, AuthRequest } from "../middleware/auth";

const router = Router();

// GET /api/users/me - Get current user's profile and role
router.get("/me", authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("auth_user_id", req.user.authId)
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error("GET /api/users/me error:", err);
    res.status(500).json({ error: "Failed to fetch user profile" });
  }
});

// GET /api/users - List all users (admin only)
router.get("/", authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .order("name");

    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error("GET /api/users error:", err);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

// PUT /api/users/:id - Update user role (admin only)
router.put("/:id", authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { role, name, phone, active_user } = req.body;

    const updateData: any = { last_updated: new Date().toISOString() };
    if (role !== undefined) updateData.role = role;
    if (name !== undefined) updateData.name = name;
    if (phone !== undefined) updateData.phone = phone;
    if (active_user !== undefined) updateData.active_user = active_user;

    const { data, error } = await supabase
      .from("users")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return res.status(404).json({ error: "User not found" });
      }
      throw error;
    }

    res.json(data);
  } catch (err) {
    console.error("PUT /api/users/:id error:", err);
    res.status(500).json({ error: "Failed to update user" });
  }
});

export default router;