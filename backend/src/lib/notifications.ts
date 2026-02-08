import { supabase } from "./supabase";

type PushTokenRow = {
  token: string;
};

export type NotificationEventKey = "horses.created" | "horses.updated" | "horses.deleted";

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";
const COOLDOWN_MS = 60 * 1000;

const eventMessages: Record<NotificationEventKey, { title: string; body: (horseName: string) => string }> = {
  "horses.created": {
    title: "Horse added",
    body: (horseName: string) => `New horse added: ${horseName}`,
  },
  "horses.updated": {
    title: "Horse updated",
    body: (horseName: string) => `Horse updated: ${horseName}`,
  },
  "horses.deleted": {
    title: "Horse deleted",
    body: (horseName: string) => `Horse removed: ${horseName}`,
  },
};

function chunkArray<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

async function shouldSendForEvent(eventKey: NotificationEventKey): Promise<boolean> {
  const { data, error } = await supabase
    .from("notification_cooldowns")
    .select("last_sent_at")
    .eq("event_key", eventKey)
    .single();

  if (error && error.code !== "PGRST116") {
    console.error("Cooldown lookup error:", error);
    return false;
  }

  if (!data?.last_sent_at) {
    return true;
  }

  const lastSent = new Date(data.last_sent_at).getTime();
  return Date.now() - lastSent >= COOLDOWN_MS;
}

async function markSent(eventKey: NotificationEventKey): Promise<void> {
  const { error } = await supabase
    .from("notification_cooldowns")
    .upsert({ event_key: eventKey, last_sent_at: new Date().toISOString() }, { onConflict: "event_key" });

  if (error) {
    console.error("Failed to update cooldown:", error);
  }
}

async function getActiveTokens(): Promise<string[]> {
  console.log(`📢 Fetching active tokens from database...`);
  const { data, error } = await supabase
    .from("push_tokens")
    .select("token")
    .eq("is_active", true);

  if (error) {
    console.error("📢 Failed to fetch push tokens:", error);
    return [];
  }

  console.log(`📢 Raw data from DB:`, JSON.stringify(data));
  const tokens = (data as PushTokenRow[]).map((row) => row.token).filter(Boolean);
  console.log(`📢 Filtered tokens:`, tokens);
  return tokens;
}

export async function sendHorseNotification(eventKey: NotificationEventKey, horseName: string): Promise<void> {
  // TODO(task): refine major-update triggers and payloads (e.g., medical/treatment changes) before expanding events.
  console.log(`📢 sendHorseNotification called for event: ${eventKey}, horse: ${horseName}`);
  
  const canSend = await shouldSendForEvent(eventKey);
  console.log(`📢 Can send (cooldown check): ${canSend}`);
  if (!canSend) {
    console.log(`📢 Skipping due to cooldown`);
    return;
  }

  const tokens = await getActiveTokens();
  console.log(`📢 Found ${tokens.length} active tokens:`, tokens);
  if (tokens.length === 0) {
    console.log(`📢 No active tokens, skipping notification`);
    return;
  }

  const message = eventMessages[eventKey];
  const payloads = tokens.map((token) => ({
    to: token,
    title: message.title,
    body: message.body(horseName),
    sound: "default",
    data: { eventKey, horseName },
  }));

  console.log(`📢 Sending ${payloads.length} notifications to Expo...`);
  const batches = chunkArray(payloads, 100);
  for (const batch of batches) {
    try {
      const response = await fetch(EXPO_PUSH_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(batch),
      });

      if (!response.ok) {
        console.error("📢 Expo push send failed");
      } else {
        console.log(`📢 ✅ Sent ${batch.length} notifications`);
      }
    } catch (error) {
      console.error("📢 Expo push request error:", error);
    }
  }

  await markSent(eventKey);
  console.log(`📢 Marked event as sent`);
}
