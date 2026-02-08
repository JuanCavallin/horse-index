import { Router } from "express";
import { authenticateToken, requireAdmin, AuthRequest } from "../middleware/auth";
import { sendHorseNotification } from "../lib/notifications";
import { supabase } from "../lib/supabase";

const router = Router();

// POST /api/test/send-notification - Test push notification (bypasses cooldown)
router.post("/send-notification", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { eventKey, horseName } = req.body as { eventKey?: string; horseName?: string };

    const validEventKeys = ["horses.created", "horses.updated", "horses.deleted"];
    const key = (eventKey || "horses.updated") as "horses.created" | "horses.updated" | "horses.deleted";
    
    if (!validEventKeys.includes(key)) {
      return res.status(400).json({ error: "Invalid eventKey" });
    }

    const name = horseName || "Test Horse";

    // Get active tokens
    const { data: tokens } = await supabase
      .from("push_tokens")
      .select("token")
      .eq("is_active", true);

    if (!tokens || tokens.length === 0) {
      return res.status(200).json({ 
        message: "No active tokens registered", 
        tokenCount: 0 
      });
    }

    // Send notification WITHOUT checking cooldown
    const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";
    const eventMessages = {
      "horses.created": { title: "Horse added", body: `New horse added: ${name}` },
      "horses.updated": { title: "Horse updated", body: `Horse updated: ${name}` },
      "horses.deleted": { title: "Horse deleted", body: `Horse removed: ${name}` },
    };

    const message = eventMessages[key];
    const payloads = tokens.map((t) => ({
      to: t.token,
      title: message.title,
      body: message.body,
      sound: "default",
      data: { eventKey: key, horseName: name, isTest: true },
    }));

    const response = await fetch(EXPO_PUSH_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payloads),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("Expo push send failed:", text);
      return res.status(500).json({ error: "Push send failed", details: text });
    }

    const result = await response.json();
    
    res.json({ 
      message: "Test notification sent", 
      tokenCount: tokens.length,
      eventKey: key,
      horseName: name,
      result 
    });
  } catch (err) {
    console.error("POST /api/test/send-notification error:", err);
    res.status(500).json({ error: "Failed to send test notification" });
  }
});

export default router;
