// ═══════════════════════════════════════════════════════════════
// push-subscribe — regista (e remove) subscrições Web Push do dispositivo.
//
// Só o próprio utilizador autenticado pode mexer nas suas subscrições.
// A subscrição é guardada com service role (o cliente não tem acesso à
// tabela) depois de validar o JWT.
//
// POST /functions/v1/push-subscribe
//   { action: "subscribe",   subscription: { endpoint, keys: { p256dh, auth } },
//     platform?: "android" | "ios" | "desktop", userAgent?: string }
//   { action: "unsubscribe", endpoint: string }
//   { action: "list" }
//
// Deploy:
//   supabase functions deploy push-subscribe
// (verificação de JWT do lado da plataforma ligada; a função volta a validar
//  o token com getUser() — não confia em nobody.)
// ═══════════════════════════════════════════════════════════════

import {
  isSafeEndpoint,
  json,
  normalizePlatform,
  options,
  readJson,
  requireUser,
  resolveProfileId,
  serviceClient,
  validateSubscription,
} from "../_shared/push.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return options();
  if (req.method !== "POST") {
    return json({ error: "method_not_allowed" }, 405);
  }

  try {
    const { user } = await requireUser(req);
    const body = await readJson(req);
    const action = typeof body.action === "string" ? body.action : "list";

    const client = serviceClient();
    const profileId = await resolveProfileId(client, user.id);
    if (!profileId) {
      return json(
        {
          error: "profile_not_found",
          message: "Ainda não tens um perfil configurado.",
        },
        404,
      );
    }

    if (action === "list") {
      const { data, error } = await client
        .from("push_subscriptions")
        .select("id, platform, user_agent, created_at, last_success_at, last_failure_at, failure_count")
        .eq("user_id", profileId)
        .order("created_at", { ascending: false });

      if (error) return json({ error: "list_failed" }, 500);
      return json({ ok: true, devices: data || [] });
    }

    if (action === "subscribe") {
      const parsed = validateSubscription(body.subscription);
      if (!parsed.ok) {
        return json({ error: "invalid_subscription", message: parsed.error }, 400);
      }

      const { subscription } = parsed;

      // O endpoint vem do cliente: o servidor vai fazer POST para lá, por isso
      // recusa endereços internos ou não-https (SSRF).
      if (!isSafeEndpoint(subscription.endpoint)) {
        return json(
          {
            error: "invalid_endpoint",
            message: "O serviço de notificações não é válido.",
          },
          400,
        );
      }

      const platform = normalizePlatform(body.platform);
      const userAgent = typeof body.userAgent === "string"
        ? body.userAgent.slice(0, 400)
        : null;

      const { data, error } = await client
        .from("push_subscriptions")
        .upsert(
          {
            user_id: profileId,
            endpoint: subscription.endpoint,
            p256dh: subscription.keys.p256dh,
            auth: subscription.keys.auth,
            platform,
            user_agent: userAgent,
            failure_count: 0,
            last_error: null,
          },
          { onConflict: "endpoint" },
        )
        .select("id, platform, created_at")
        .single();

      if (error) return json({ error: "subscribe_failed" }, 500);

      // Consentimento ao nível da conta: subscrever um dispositivo é a
      // materialização do "Ativar notificações" que o utilizador premiu.
      const { error: prefError } = await client
        .from("push_preferences")
        .upsert({ user_id: profileId, push_enabled: true }, { onConflict: "user_id" });

      if (prefError) return json({ error: "preferences_failed" }, 500);

      return json({ ok: true, device: data, enabled: true });
    }

    if (action === "unsubscribe") {
      const endpoint = typeof body.endpoint === "string" ? body.endpoint.trim() : "";
      if (!endpoint) {
        return json({ error: "invalid_request" }, 400);
      }

      // Só se apaga a subscrição que pertence a este utilizador.
      const { error } = await client
        .from("push_subscriptions")
        .delete()
        .eq("user_id", profileId)
        .eq("endpoint", endpoint);

      if (error) return json({ error: "unsubscribe_failed" }, 500);

      // Sem mais nenhum dispositivo, o consentimento da conta cai.
      const { count } = await client
        .from("push_subscriptions")
        .select("id", { count: "exact", head: true })
        .eq("user_id", profileId);

      if ((count || 0) === 0) {
        await client
          .from("push_preferences")
          .update({ push_enabled: false })
          .eq("user_id", profileId);
      }

      return json({ ok: true, enabled: (count || 0) > 0 });
    }

    return json({ error: "unknown_action" }, 400);
  } catch (error) {
    if (error instanceof Response) return error;
    console.error("[push-subscribe]", error);
    return json({ error: "server_error" }, 500);
  }
});
