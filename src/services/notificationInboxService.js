import { supabase } from "../lib/supabase.js";

const RECENT_NOTIFICATION_LIMIT = 30;

export async function getNotificationInbox() {
  const [notificationsResult, unreadResult] = await Promise.all([
    supabase
      .from("in_app_notifications")
      .select("id, title, body, url, category, is_read, created_at")
      .order("created_at", { ascending: false })
      .limit(RECENT_NOTIFICATION_LIMIT),
    supabase
      .from("in_app_notifications")
      .select("id", { count: "exact", head: true })
      .eq("is_read", false),
  ]);

  if (notificationsResult.error) throw notificationsResult.error;
  if (unreadResult.error) throw unreadResult.error;

  return {
    notifications: notificationsResult.data || [],
    unreadCount: unreadResult.count || 0,
  };
}

export async function markInboxNotificationRead(notificationId) {
  const { error } = await supabase
    .from("in_app_notifications")
    .update({ is_read: true })
    .eq("id", notificationId)
    .eq("is_read", false);

  if (error) throw error;
}

export async function markAllInboxNotificationsRead() {
  const { error } = await supabase
    .from("in_app_notifications")
    .update({ is_read: true })
    .eq("is_read", false);

  if (error) throw error;
}
