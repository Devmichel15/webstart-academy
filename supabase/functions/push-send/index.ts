// ---------------------------------------------------------------
// push-send — envia uma notificação push aos dispositivos do utilizador.
// ---------------------------------------------------------------

import {
  CATEGORY_PREFERENCE,
  PUSH_CATEGORIES,
  TEST_COOLDOWN_SECONDS,
  buildPushPayload,
  isSafeEndpoint,
  json,
  options,
  readJson,
  requireUser,
  resolveProfileId,
  serviceClient,
  vapidConfig,
} from "../_shared/push.ts";
import { getSender } from "../_shared/sender.ts";

const TTL_SECONDS = 82_800;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return options();
  if (req.method !== "POST") {
    return json({ error: "method_not_allowed" }, 405);
  }

  try {
    const { user } = await requireUser(req);
    const body = await readJson(req);
    const client = serviceClient();

    const profileId = await resolveProfileId(client, user.id);
    if (!profileId) {
      return json(
        { error: "profile_not_found", message: "Ainda não tens um perfil configurado." },
        404,
      );
    }

    const targetUserId = typeof body.targetUserId === "string" ? body.targetUserId.trim() : "";
    if (targetUserId && targetUserId !== profileId) {
      return json(
        {
          error: "target_not_allowed",
          message: "Só podes enviar notificações para ti próprio.",
        },
        403,
      );
    }

    const { data: prefs, error: prefsError } = await client
      .from("push_preferences")
      .select("push_enabled, learning_enabled, streak_enabled, community_enabled, comments_enabled, reminders_enabled, study_activity_enabled, last_test_sent_at")
      .eq("user_id", profileId)
      .maybeSingle();

    if (prefsError) return json({ error: "preferences_failed" }, 500);

    if (!prefs?.push_enabled) {
      return json(
        {
          error: "push_disabled",
          message: "As notificações push estão desligadas nas tuas preferências.",
        },
        403,
      );
    }

    const payload = buildPushPayload(body);
    const category = payload.category;

    if (!PUSH_CATEGORIES.includes(category)) {
      return json({ error: "invalid_category" }, 400);
    }

    const preferenceColumn = CATEGORY_PREFERENCE[category];
    if (prefs[preferenceColumn] === false) {
      return json(
        {
          error: "category_disabled",
          message: `As notificações de "${category}" estão desligadas nas tuas preferências.`,
        },
        403,
      );
    }

    if (prefs.last_test_sent_at) {
      const elapsed = (Date.now() - new Date(prefs.last_test_sent_at).getTime()) / 1000;
      if (elapsed < TEST_COOLDOWN_SECONDS) {
        const wait = Math.ceil(TEST_COOLDOWN_SECONDS - elapsed);
        return json(
          {
            error: "rate_limited",
            message: `Espera ${wait} segundo(s) para enviar outra notificação de teste.`,
            retryAfterSeconds: wait,
          },
          429,
        );
      }
    }

    const { data: subscriptions, error: subsError } = await client
      .from("push_subscriptions")
      .select("id, endpoint, p256dh, auth, platform")
      .eq("user_id", profileId);

    if (subsError) return json({ error: "subscriptions_failed" }, 500);

    if (!subscriptions || subscriptions.length === 0) {
      return json(
        {
          error: "no_subscription",
          message: "Não tens nenhum dispositivo registado para notificações.",
        },
        400,
      );
    }

    const vapid = vapidConfig();
    const sender = await getSender();
    const results: Array<{
      id: string;
      platform: string;
      statusCode: number | null;
      delivered: boolean;
      error: string | null;
    }> = [];

    for (const subscription of subscriptions) {
      if (!isSafeEndpoint(subscription.endpoint)) {
        console.warn(
          `[push-send] endpoint recusado (host não permitido): ${new URL(subscription.endpoint).host}`,
        );
        results.push({
          id: subscription.id,
          platform: subscription.platform,
          statusCode: null,
          delivered: false,
          error: "Endpoint recusado.",
        });
        continue;
      }

      const outcome = await sender.send(
        {
          endpoint: subscription.endpoint,
          keys: { p256dh: subscription.p256dh, auth: subscription.auth },
        },
        payload,
        vapid,
        TTL_SECONDS,
      );

      if (outcome.gone) {
        await client
          .from("push_subscriptions")
          .delete()
          .eq("id", subscription.id)
          .eq("user_id", profileId);
      } else if (outcome.error) {
        await client
          .from("push_subscriptions")
          .update({
            failure_count: 1,
            last_error: outcome.error.slice(0, 500),
            last_failure_at: new Date().toISOString(),
          })
          .eq("id", subscription.id);
      } else {
        await client
          .from("push_subscriptions")
          .update({
            failure_count: 0,
            last_error: null,
            last_success_at: new Date().toISOString(),
          })
          .eq("id", subscription.id);
      }

      results.push({
        id: subscription.id,
        platform: subscription.platform,
        statusCode: outcome.statusCode,
        delivered: !outcome.error,
        error: outcome.error,
      });
    }

    await client
      .from("push_preferences")
      .update({ last_test_sent_at: new Date().toISOString() })
      .eq("user_id", profileId);

    const delivered = results.filter((r) => r.delivered).length;

    return json({
      ok: delivered > 0,
      delivered,
      total: results.length,
      results,
      payload,
      library: sender.name,
    });
  } catch (error) {
    if (error instanceof Response) return error;
    console.error("[push-send]", error);
    return json(
      {
        error: "server_error",
        message: "Não foi possível enviar a notificação de teste.",
      },
      500,
    );
  }
});
