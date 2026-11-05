// ═══════════════════════════════════════════════════════════════
// _shared/sender — envio de notificações Web Push (RFC 8291 + RFC 8292).
//
// Duas bibliotecas, uma só Preferida:
//
//   1) @mmmike/web-push (primária) — zero dependências, só `fetch` +
//      `crypto.subtle`. Corre natively no Deno/Edge Runtime, sem camada de
//      compatibilidade Node, e a cifra está fixada byte a byte ao vector de
//      teste da RFC 8291.
//
//   2) web-push (fallback) — a biblioteca de referência do ecossistema
//      (~5M downloads/semana), madura e a usada pela documentação do MDN. Depende
//      de `node:crypto`/`node:https`, que o Deno 2.5+ do Edge Runtime
//      fornece. Entra se a primária não carregar.
//
// A escolha é feita em runtime, uma vez, e fica registada no log: se o
// Edge Runtime mudar de runtime, vê-se logo qual biblioteca está activa.
// ═══════════════════════════════════════════════════════════════

export type PushSubscription = {
  endpoint: string;
  keys: { p256dh: string; auth: string };
};

export type VapidConfig = {
  subject: string;
  publicKey: string;
  privateKey: string;
};

export type SendOutcome = {
  statusCode: number | null;
  gone: boolean;
  error: string | null;
};

type Sender = {
  name: string;
  send(
    subscription: PushSubscription,
    payload: unknown,
    vapid: VapidConfig,
    ttlSeconds: number,
  ): Promise<SendOutcome>;
};

let senderPromise: Promise<Sender> | null = null;

function errorMessage(error: unknown): string {
  if (!error) return "erro desconhecido";
  if (typeof error === "string") return error;
  const anyError = error as { message?: unknown; statusCode?: unknown };
  const message = typeof anyError.message === "string" ? anyError.message : "";
  const status = typeof anyError.statusCode === "number" ? ` (HTTP ${anyError.statusCode})` : "";
  return `${message || "erro desconhecido"}${status}`;
}

function statusOf(error: unknown): number | null {
  const anyError = error as { statusCode?: unknown; status?: unknown };
  if (typeof anyError?.statusCode === "number") return anyError.statusCode;
  if (typeof anyError?.status === "number") return anyError.status;
  return null;
}

async function createSender(): Promise<Sender> {
  const problems: string[] = [];

  // 1) @mmmike/web-push — caminho nativo.
  try {
    const mod = await import("npm:@mmmike/web-push@1.3.0/send");
    const sendPushNotification = (mod as { sendPushNotification?: unknown }).sendPushNotification;
    if (typeof sendPushNotification !== "function") {
      throw new Error("sendPushNotification indisponível");
    }

    return {
      name: "@mmmike/web-push",
      async send(subscription, payload, vapid, ttlSeconds) {
        try {
          const result = await (
            sendPushNotification as (
              sub: PushSubscription,
              body: unknown,
              vapid: VapidConfig,
              options: Record<string, unknown>,
            ) => Promise<unknown>
          )(
            subscription,
            payload,
            {
              subject: vapid.subject,
              publicKey: vapid.publicKey,
              privateKey: vapid.privateKey,
            },
            { ttl: ttlSeconds, vapidExpiration: ttlSeconds, urgency: "normal" },
          );

          // 404/410 resolvem para false (a subscrição já não existe).
          if (result === false) {
            return { statusCode: 410, gone: true, error: "Subscrição expirada." };
          }
          const statusCode =
            (result as { statusCode?: unknown } | null)?.statusCode;
          return {
            statusCode: typeof statusCode === "number" ? statusCode : 201,
            gone: false,
            error: null,
          };
        } catch (error) {
          const statusCode = statusOf(error);
          return {
            statusCode,
            gone: statusCode === 404 || statusCode === 410,
            error: errorMessage(error),
          };
        }
      },
    };
  } catch (error) {
    problems.push(`@mmmike/web-push: ${errorMessage(error)}`);
  }

  // 2) web-push — fallback (compatibilidade Node do Deno).
  try {
    const mod = await import("npm:web-push@3.6.7");
    const webpush = ((mod as { default?: unknown }).default ?? mod) as {
      setVapidDetails: (subject: string, publicKey: string, privateKey: string) => void;
      sendNotification: (
        subscription: PushSubscription,
        payload: string,
        options: Record<string, unknown>,
      ) => Promise<{ statusCode?: number }>;
    };

    return {
      name: "web-push",
      async send(subscription, payload, vapid, ttlSeconds) {
        try {
          webpush.setVapidDetails(vapid.subject, vapid.publicKey, vapid.privateKey);
          const result = await webpush.sendNotification(
            subscription,
            JSON.stringify(payload),
            { TTL: ttlSeconds, vapidExpiration: ttlSeconds, urgency: "normal" },
          );
          return {
            statusCode:
              typeof result?.statusCode === "number" ? result.statusCode : 201,
            gone: false,
            error: null,
          };
        } catch (error) {
          const statusCode = statusOf(error);
          return {
            statusCode,
            gone: statusCode === 404 || statusCode === 410,
            error: errorMessage(error),
          };
        }
      },
    };
  } catch (error) {
    problems.push(`web-push: ${errorMessage(error)}`);
  }

  throw new Error(
    `Nenhuma biblioteca de Web Push carregou no runtime. ${problems.join(" | ")}`,
  );
}

export function getSender(): Promise<Sender> {
  if (!senderPromise) {
    senderPromise = createSender().catch((error) => {
      // Deixa a próxima chamada tentar de novo (pode ser um arranque a frio).
      senderPromise = null;
      throw error;
    });
  }
  return senderPromise;
}
