import { Router } from "express";
import { supabase } from "../lib/supabase";
import { authenticateToken, AuthRequest } from "../middleware/auth";

const router = Router();

// POST /api/push-tokens
router.post("/", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { token, platform } = req.body as { token?: string; platform?: string };

    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    if (!token) {
      return res.status(400).json({ error: "token is required" });
    }

    const { error } = await supabase
      .from("push_tokens")
      .upsert(
        {
          token,
          platform: platform ?? null,
          auth_user_id: req.user.authId,
          is_active: true,
          last_seen: new Date().toISOString(),
        },
        { onConflict: "token" }
      );

    if (error) throw error;

    res.status(204).send();
  } catch (err) {
    console.error("POST /api/push-tokens error:", err);
    res.status(500).json({ error: "Failed to register push token" });
  }
});

export default router;
