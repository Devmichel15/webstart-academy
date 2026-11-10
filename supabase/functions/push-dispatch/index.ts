// -----------------------------------------------------------------------------
// push-dispatch — dispara notificações push por ação (outbox)
// -----------------------------------------------------------------------------

import {
  CATEGORY_PREFERENCE,
  buildPushPayload,
  isSafeEndpoint,
  json,
  options,
  readJson,
  serviceClient,
  vapidConfig,
} from "../_shared/push.ts";
import { getSender } from "../_shared/sender.ts";
import { selectNotificationMessage } from "../_shared/notificationMessages.ts";

const TTL_SECONDS = 82_800;
const THROTTLE_LESSON_COMPLETED_MINUTES = 120; // 2 horas
const THROTTLE_NEW_POST_MINUTES = 30; // 30 minutos
const PROFILE_LOOKUP_BATCH_SIZE = 100;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return options();
  if (req.method !== "POST") {
    return json({ error: "method_not_allowed" }, 405);
  }

  try {
    const secret = req.headers.get("x-push-dispatch-secret") || "";
    if (!secret) {
      return json({ error: "unauthorized" }, 401);
    }

    const expectedSecret = Deno.env.get("PUSH_DISPATCH_SECRET") || "";
    if (!expectedSecret || secret !== expectedSecret) {
      return json({ error: "unauthorized" }, 401);
    }

    const body = await readJson(req);
    const eventId = typeof body.event_id === "string" ? body.event_id : "";

    if (!eventId) {
      return json({ error: "invalid_request" }, 400);
    }

    const client = serviceClient();

    const { data: event, error: eventError } = await client
      .from("push_events")
      .select("*")
      .eq("id", eventId)
      .is("processed_at", null)
      .maybeSingle();

    if (eventError) {
      console.error(JSON.stringify({ level: "error", msg: "event_fetch_failed", eventId }));
      return json({ error: "server_error" }, 500);
    }

    if (!event) {
      return json({ ok: true, message: "event_not_found_or_processed" });
    }

    let actorName = "Alguém";
    if (event.actor_profile_id) {
      const { data: actor } = await client
        .from("profiles")
        .select("name, username")
        .eq("id", event.actor_profile_id)
        .maybeSingle();

      if (actor?.name && actor.name.trim() && actor.name.trim().toLowerCase() !== "aluno webstart") {
        const first = actor.name.trim().split(/\s+/)[0];
        if (first) actorName = first;
      } else if (actor?.username && actor.username.trim()) {
        actorName = actor.username.trim();
      }
    }

    let category = "study_activity";
    let throttleMinutes = THROTTLE_LESSON_COMPLETED_MINUTES;
    let messageCategory = "motivation";
    let messageContext: string | undefined;
    let notificationUrl = "/";
    let notificationTag = `webstart-${category}`;
    const messageVariables: Record<string, unknown> = {};

    if (event.type === "new_post") {
      category = "community";
      messageCategory = "community";
      messageContext = "new_post";
      messageVariables.actorName = actorName;
      notificationTag = "webstart-community";
      throttleMinutes = THROTTLE_NEW_POST_MINUTES;
    } else if (event.type === "project_liked") {
      category = "community";
      messageCategory = "community";
      messageContext = "project_liked";
      messageVariables.actorName = actorName;
      notificationTag = `webstart-like-${event.id}`;
      throttleMinutes = 0;
    } else if (event.type === "project_commented") {
      category = "comments";
      messageCategory = "comments";
      messageContext = "project_commented";
      messageVariables.actorName = actorName;
      notificationTag = `webstart-comment-${event.id}`;
      throttleMinutes = 0;
    } else if (event.type === "lesson_completed") {
      category = "study_activity";
      messageCategory = "motivation";
      messageContext = "lesson_completed";
      messageVariables.actorName = actorName;
      notificationUrl = "/dashboard";
      notificationTag = "webstart-study";
      throttleMinutes = THROTTLE_LESSON_COMPLETED_MINUTES;
    } else {
      await client.from("push_events").update({ processed_at: new Date().toISOString() }).eq("id", eventId);
      return json({ ok: true, message: "unknown_event_type" });
    }

    const { data: candidates, error: candError } = await client
      .from("push_preferences")
      .select("user_id, push_enabled, learning_enabled, streak_enabled, community_enabled, comments_enabled, reminders_enabled, study_activity_enabled")
      .eq("push_enabled", true);

    if (candError) {
      console.error(JSON.stringify({ level: "error", msg: "candidates_fetch_failed", eventId }));
      return json({ error: "server_error" }, 500);
    }

    const preferenceColumn = CATEGORY_PREFERENCE[category as keyof typeof CATEGORY_PREFERENCE];
    const eligible = (candidates || []).filter((p: any) => {
      if (!preferenceColumn) return false;
      if (p[preferenceColumn] === false) return false;
      if (event.actor_profile_id && p.user_id === event.actor_profile_id) return false;
      return true;
    });

    const recipientNames = new Map<string, string>();
    for (let offset = 0; offset < eligible.length; offset += PROFILE_LOOKUP_BATCH_SIZE) {
      const batch = eligible.slice(offset, offset + PROFILE_LOOKUP_BATCH_SIZE);
      const { data: profiles, error: profilesError } = await client
        .from("profiles")
        .select("id, name")
        .in("id", batch.map((pref: any) => pref.user_id));

      if (profilesError) {
        console.error(JSON.stringify({
          level: "error",
          msg: "recipient_profiles_fetch_failed",
          eventId,
        }));
        return json({ error: "server_error" }, 500);
      }

      for (const profile of profiles || []) {
        const name = typeof profile.name === "string" ? profile.name.trim() : "";
        if (name && name.toLowerCase() !== "aluno webstart") {
          recipientNames.set(profile.id, name.split(/\s+/)[0]);
        }
      }
    }

    console.log(JSON.stringify({
      level: "info",
      msg: "dispatch_start",
      eventId,
      type: event.type,
      eligibleCount: eligible.length,
      actorExcluded: true
    }));

    const vapid = vapidConfig();
    const sender = await getSender();
    let totalSent = 0;
    let totalFailed = 0;

    for (const pref of eligible as any[]) {
      if (throttleMinutes > 0) {
        const { data: throttle } = await client
          .from("push_throttle")
          .select("last_sent_at")
          .eq("user_id", pref.user_id)
          .eq("category", category)
          .maybeSingle();

        if (throttle?.last_sent_at) {
          const elapsedMinutes = (Date.now() - new Date(throttle.last_sent_at).getTime()) / 60000;
          if (elapsedMinutes < throttleMinutes) {
            continue;
          }
        }
      }

      const { data: previousNotification, error: previousNotificationError } =
        await client
          .from("in_app_notifications")
          .select("title, body")
          .eq("user_id", pref.user_id)
          .neq("source_event_id", eventId)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

      if (previousNotificationError) {
        console.error(JSON.stringify({
          level: "error",
          msg: "previous_notification_fetch_failed",
          eventId,
          userId: pref.user_id,
        }));
        return json({ error: "server_error" }, 500);
      }

      const message = selectNotificationMessage(messageCategory, {
        context: messageContext,
        previousMessage: previousNotification,
        variables: {
          ...messageVariables,
          name: recipientNames.get(pref.user_id),
        },
      });
      const notificationPayload = buildPushPayload({
        title: message.title,
        body: message.body,
        url: notificationUrl,
        category,
        tag: notificationTag,
      });

      const { error: inboxError } = await client
        .from("in_app_notifications")
        .upsert(
          {
            user_id: pref.user_id,
            source_event_id: eventId,
            title: notificationPayload.title,
            body: notificationPayload.body,
            url: notificationPayload.url,
            category,
          },
          {
            onConflict: "user_id,source_event_id",
            ignoreDuplicates: true,
          },
        );

      if (inboxError) {
        console.error(JSON.stringify({
          level: "error",
          msg: "inbox_notification_save_failed",
          eventId,
          userId: pref.user_id,
        }));
        return json({ error: "server_error" }, 500);
      }

      const { data: subscriptions } = await client
        .from("push_subscriptions")
        .select("id, endpoint, p256dh, auth, platform")
        .eq("user_id", pref.user_id);

      if (!subscriptions || subscriptions.length === 0) {
        continue;
      }

      let userSent = 0;

      for (const subscription of subscriptions as any[]) {
        if (!isSafeEndpoint(subscription.endpoint)) {
          continue;
        }

        const outcome = await sender.send(
          {
            endpoint: subscription.endpoint,
            keys: { p256dh: subscription.p256dh, auth: subscription.auth },
          },
          notificationPayload,
          vapid,
          TTL_SECONDS,
        );

        if (outcome.gone) {
          await client
            .from("push_subscriptions")
            .delete()
            .eq("id", subscription.id)
            .eq("user_id", pref.user_id);
        } else if (outcome.error) {
          await client
            .from("push_subscriptions")
            .update({
              failure_count: 1,
              last_error: outcome.error.slice(0, 500),
              last_failure_at: new Date().toISOString(),
            })
            .eq("id", subscription.id);
          totalFailed++;
        } else {
          await client
            .from("push_subscriptions")
            .update({
              failure_count: 0,
              last_error: null,
              last_success_at: new Date().toISOString(),
            })
            .eq("id", subscription.id);
          userSent++;
          totalSent++;
        }
      }

      if (userSent === 0) {
        const { count } = await client
          .from("push_subscriptions")
          .select("id", { count: "exact", head: true })
          .eq("user_id", pref.user_id);

        if ((count || 0) === 0) {
          await client
            .from("push_preferences")
            .update({ push_enabled: false })
            .eq("user_id", pref.user_id);
          console.log(JSON.stringify({ level: "warn", msg: "user_disabled_all_failed", userId: pref.user_id }));
        }
      }

      if (userSent > 0 && throttleMinutes > 0) {
        await client
          .from("push_throttle")
          .upsert(
            { user_id: pref.user_id, category, last_sent_at: new Date().toISOString() },
            { onConflict: "user_id,category" }
          );
      }
    }

    await client.from("push_events").update({ processed_at: new Date().toISOString() }).eq("id", eventId);

    console.log(JSON.stringify({
      level: "info",
      msg: "dispatch_complete",
      eventId,
      type: event.type,
      sent: totalSent,
      failed: totalFailed
    }));

    return json({ ok: true, sent: totalSent, failed: totalFailed });
  } catch (error) {
    if (error instanceof Response) return error;
    console.error(JSON.stringify({ level: "error", msg: "dispatch_error", error: String(error) }));
    return json({ error: "server_error" }, 500);
  }
});
