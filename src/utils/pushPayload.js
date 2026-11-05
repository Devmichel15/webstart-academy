/**
 * Payload e validação de destinos das notificações push.
 */

export const PUSH_CATEGORIES = [
  "learning",
  "streak",
  "community",
  "comments",
  "reminders",
  "study_activity",
];

export const CATEGORY_LABELS = {
  learning: "Aprendizagem",
  streak: "Sequência de dias",
  community: "Comunidade",
  comments: "Comentários",
  reminders: "Lembretes",
  study_activity: "Atividade de estudo",
};

/** Defaults espelham os defaults do Postgres (migration 022/024). */
export const DEFAULT_PUSH_PREFERENCES = {
  push_enabled: false,
  learning_enabled: true,
  streak_enabled: true,
  community_enabled: true,
  comments_enabled: true,
  reminders_enabled: false,
  study_activity_enabled: true,
  reminder_hour: 19,
  reminder_days: [1, 2, 3, 4, 5],
};

export function isInternalPath(value) {
  if (typeof value !== "string") return false;
  const path = value.trim();
  if (!path.startsWith("/")) return false;
  if (path.startsWith("//")) return false;
  if (path.startsWith("/\\")) return false;
  if (path.includes("\\")) return false;
  for (const char of path) {
    if (char.charCodeAt(0) < 32 || char.charCodeAt(0) === 127) return false;
  }
  return true;
}

export function normalizeInternalPath(value, fallback = "/") {
  return isInternalPath(value) ? value.trim() : fallback;
}

export function buildPushPayload({
  title,
  body,
  url,
  category,
  tag,
} = {}) {
  const cleanTitle =
    typeof title === "string" && title.trim()
      ? title.trim().slice(0, 120)
      : "WebStart Academy";
  const cleanBody =
    typeof body === "string" && body.trim()
      ? body.trim().slice(0, 240)
      : "Tens uma nova notificação.";
  const cleanCategory = PUSH_CATEGORIES.includes(category)
    ? category
    : "learning";
  const cleanTag =
    typeof tag === "string" && tag.trim()
      ? tag.trim().slice(0, 60)
      : `webstart-${cleanCategory}`;

  return {
    title: cleanTitle,
    body: cleanBody,
    url: normalizeInternalPath(url, "/"),
    category: cleanCategory,
    tag: cleanTag,
  };
}

export function resolveNotificationTarget(url, origin) {
  const path = normalizeInternalPath(url, "/");
  const base = typeof origin === "string" && origin ? origin : "https://localhost";
  try {
    return new URL(path, base).toString();
  } catch {
    return new URL("/", base).toString();
  }
}
