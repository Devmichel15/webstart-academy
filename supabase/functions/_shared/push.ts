// ---------------------------------------------------------------
// _shared/push — utilitários partilhados pelas Edge Functions de push.
// ---------------------------------------------------------------

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-push-dispatch-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

export const PUSH_CATEGORIES = [
  "learning",
  "streak",
  "community",
  "comments",
  "reminders",
  "study_activity",
] as const;

export type PushCategory = (typeof PUSH_CATEGORIES)[number];

export const CATEGORY_PREFERENCE: Record<PushCategory, string> = {
  learning: "learning_enabled",
  streak: "streak_enabled",
  community: "community_enabled",
  comments: "comments_enabled",
  reminders: "reminders_enabled",
  study_activity: "study_activity_enabled",
};

export const TEST_COOLDOWN_SECONDS = 60;

export function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS },
  });
}

export function options() {
  return new Response("ok", { headers: CORS_HEADERS });
}

export function isInternalPath(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const path = value.trim();
  if (!path.startsWith("/")) return false;
  if (path.startsWith("//")) return false;
  if (path.startsWith("/\\")) return false;
  if (path.includes("\\")) return false;
  if (/[\u0000-\u001f]/.test(path)) return false;
  return true;
}

export function normalizeInternalPath(value: unknown, fallback = "/"): string {
  return isInternalPath(value) ? value.trim() : fallback;
}

export function buildPushPayload(input: {
  title?: unknown;
  body?: unknown;
  url?: unknown;
  category?: unknown;
  tag?: unknown;
}) {
  const title = typeof input.title === "string" && input.title.trim()
    ? input.title.trim().slice(0, 120)
    : "WebStart Academy";
  const body = typeof input.body === "string" && input.body.trim()
    ? input.body.trim().slice(0, 240)
    : "Tens uma nova notificação.";
  const category = PUSH_CATEGORIES.includes(input.category as PushCategory)
    ? (input.category as PushCategory)
    : "learning";
  const tag = typeof input.tag === "string" && input.tag.trim()
    ? input.tag.trim().slice(0, 60)
    : `webstart-${category}`;

  return {
    title,
    body,
    url: normalizeInternalPath(input.url, "/"),
    category,
    tag,
  };
}

export function normalizePlatform(value: unknown): "android" | "ios" | "desktop" | "unknown" {
  const raw = typeof value === "string" ? value.trim().toLowerCase() : "";
  if (raw === "android" || raw === "ios" || raw === "desktop") return raw;
  if (raw === "windows" || raw === "mac" || raw === "macos" || raw === "linux") return "desktop";
  return "unknown";
}

export function validateSubscription(input: unknown): {
  ok: true;
  subscription: { endpoint: string; keys: { p256dh: string; auth: string } };
} | {
  ok: false;
  error: string;
} {
  if (!input || typeof input !== "object") {
    return { ok: false, error: " subscrição inválida." };
  }
  const raw = input as Record<string, unknown>;
  const endpoint = typeof raw.endpoint === "string" ? raw.endpoint.trim() : "";
  const keys = (raw.keys || {}) as Record<string, unknown>;
  const p256dh = typeof keys.p256dh === "string" ? keys.p256dh.trim() : "";
  const auth = typeof keys.auth === "string" ? keys.auth.trim() : "";

  if (!endpoint.startsWith("https://")) {
    return { ok: false, error: "endpoint inválido." };
  }
  if (endpoint.length > 2048) {
    return { ok: false, error: "endpoint demasiado longo." };
  }
  if (!p256dh || p256dh.length > 256) {
    return { ok: false, error: "chave p256dh inválida." };
  }
  if (!auth || auth.length > 256) {
    return { ok: false, error: "chave auth inválida." };
  }
  if (!/^[A-Za-z0-9_-]+={0,2}$/.test(p256dh) || !/^[A-Za-z0-9_-]+={0,2}$/.test(auth)) {
    return { ok: false, error: "chaves de subscrição inválidas." };
  }

  return {
    ok: true,
    subscription: { endpoint, keys: { p256dh, auth } },
  };
}

export async function requireUser(req: Request) {
  const authHeader = req.headers.get("Authorization") || "";
  const token = authHeader.replace(/^Bearer\s+/i, "");
  if (!token) throw json({ error: "unauthorized" }, 401);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseAnon = Deno.env.get("SUPABASE_ANON_KEY");
  if (!supabaseUrl || !supabaseAnon) {
    throw json({ error: "server_not_configured" }, 500);
  }

  const anon = createClient(supabaseUrl, supabaseAnon, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data, error } = await anon.auth.getUser(token);
  if (error || !data?.user) throw json({ error: "unauthorized" }, 401);

  return { user: data.user, token };
}

export function serviceClient() {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRole) {
    throw json({ error: "server_not_configured" }, 500);
  }
  return createClient(supabaseUrl, serviceRole, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function resolveProfileId(
  client: ReturnType<typeof serviceClient>,
  authUid: string,
): Promise<string | null> {
  const { data, error } = await client
    .from("profiles")
    .select("id")
    .or(`id.eq.${authUid},auth_user_id.eq.${authUid}`)
    .limit(1);

  if (error) throw json({ error: "profile_lookup_failed" }, 500);
  const row = Array.isArray(data) ? data[0] : data;
  return row?.id ?? null;
}

export function vapidConfig() {
  const subject = Deno.env.get("VAPID_SUBJECT") || "";
  const publicKey = Deno.env.get("VAPID_PUBLIC_KEY") || "";
  const privateKey = Deno.env.get("VAPID_PRIVATE_KEY") || "";

  if (!publicKey || !privateKey) {
    throw json(
      {
        error: "vapid_not_configured",
        message:
          "Faltam os secrets VAPID_PUBLIC_KEY e VAPID_PRIVATE_KEY no projecto Supabase.",
      },
      500,
    );
  }
  if (subject && !/^(mailto:|https:)/i.test(subject)) {
    throw json({ error: "vapid_subject_invalid" }, 500);
  }

  return { subject: subject || "mailto:admin@webstart.academy", publicKey, privateKey };
}

export async function readJson(req: Request): Promise<Record<string, unknown>> {
  try {
    const text = await req.text();
    if (!text) return {};
    const parsed = JSON.parse(text);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

const PRIVATE_HOST_PATTERNS = [
  /^localhost$/i,
  /\.local$/i,
  /\.internal$/i,
  /\.lan$/i,
  /^127\./,
  /^10\./,
  /^192\.168\./,
  /^169\.254\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^\[?::1\]?$/,
  /^\[?f[cd][0-9a-f]{2}:/i,
  /^\[?fe80:/i,
];

export function isSafeEndpoint(endpoint: unknown): endpoint is string {
  if (typeof endpoint !== "string" || !endpoint) return false;

  let url: URL;
  try {
    url = new URL(endpoint);
  } catch {
    return false;
  }

  if (url.protocol !== "https:") return false;

  const host = url.hostname.toLowerCase();
  if (!host) return false;
  if (PRIVATE_HOST_PATTERNS.some((pattern) => pattern.test(host))) return false;

  const allowlist = (Deno.env.get("PUSH_ENDPOINT_ALLOWLIST") || "")
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);

  if (allowlist.length > 0) {
    const allowed = allowlist.some((entry) => {
      const bare = entry.startsWith("*.") ? entry.slice(2) : entry;
      return host === bare || host.endsWith(`.${bare}`);
    });
    if (!allowed) return false;
  }

  return true;
}
